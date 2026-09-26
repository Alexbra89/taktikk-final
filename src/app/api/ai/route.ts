import { createHash, timingSafeEqual } from 'node:crypto';
import { AI_ACCESS_HEADER, AI_LIMITS, validateAiRequest } from '@/lib/ai/request';
import { buildMessages, MODE_MAX_TOKENS } from '@/lib/ai/server/prompt';
import { AiProviderError, callOpenRouter } from '@/lib/ai/server/openrouter';

// ══════════════════════════════════════════════════════════════
//  POST /api/ai – AI-treneren
//  Leser og svarer; endrer aldri noe i appen. Nøkkelen til
//  OpenRouter finnes bare her på serveren.
// ══════════════════════════════════════════════════════════════

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Vercel: gi kallet tid nok. Ignoreres andre steder. */
export const maxDuration = 60;

const PROVIDER_TIMEOUT_MS = 45_000;

const MSG = {
  access: 'AI-tilgang mangler eller er feil.',
  notConfigured: 'AI er ikke konfigurert på serveren.',
  tooLarge: 'Forespørselen er for stor.',
  badJson: 'Ugyldig forespørsel.',
  unavailable: 'AI-tjenesten er midlertidig utilgjengelig. Prøv igjen.',
  timeout: 'AI-tjenesten brukte for lang tid. Prøv igjen.',
  rateLimit: 'AI-tjenesten er opptatt akkurat nå. Vent litt og prøv igjen.',
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/** Sammenligner koder uten å lekke lengde eller innhold gjennom svartiden. */
function sameCode(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Én linje per kall: bare metadata, aldri spørsmål, brett eller nøkkel. */
function logUsage(entry: Record<string, unknown>) {
  console.info(JSON.stringify({ evt: 'ai', ts: new Date().toISOString(), ...entry }));
}

export async function POST(req: Request): Promise<Response> {
  const started = Date.now();
  const expectedCode = process.env.AI_ACCESS_CODE;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.AI_MODEL;

  // Stengt til alt er satt opp – aldri åpent fordi en variabel mangler.
  if (!expectedCode || !apiKey || !model) return json({ error: MSG.notConfigured }, 503);

  const code = req.headers.get(AI_ACCESS_HEADER) ?? '';
  if (!code || !sameCode(code, expectedCode)) return json({ error: MSG.access }, 401);

  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > AI_LIMITS.bodyChars * 4) return json({ error: MSG.tooLarge }, 413);
  const text = await req.text();
  if (text.length > AI_LIMITS.bodyChars) return json({ error: MSG.tooLarge }, 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: MSG.badJson }, 400);
  }
  const parsed = validateAiRequest(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const { mode, area } = parsed.value;

  try {
    const result = await callOpenRouter({
      apiKey, model,
      messages: buildMessages(parsed.value),
      maxTokens: MODE_MAX_TOKENS[mode],
      timeoutMs: PROVIDER_TIMEOUT_MS,
    });
    logUsage({ mode, area, model, ok: true, ms: Date.now() - started, in: result.usage.input, out: result.usage.output, truncated: result.truncated });
    return json({ answer: result.text, truncated: result.truncated });
  } catch (e) {
    const kind = e instanceof AiProviderError ? e.kind : 'unavailable';
    const status = e instanceof AiProviderError ? e.status : undefined;
    logUsage({ mode, area, model, ok: false, ms: Date.now() - started, error: kind, providerStatus: status });
    if (kind === 'timeout') return json({ error: MSG.timeout }, 504);
    if (kind === 'rate_limit') return json({ error: MSG.rateLimit }, 429);
    return json({ error: MSG.unavailable }, 502);
  }
}
