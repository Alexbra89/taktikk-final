import type { ChatMessage } from './prompt';

// ══════════════════════════════════════════════════════════════
//  OPENROUTER – tynn adapter mot OpenAI-kompatibelt chat-API.
//  Bare på serveren. Nøkkelen sendes aldri videre til klienten,
//  og rå feil fra leverandøren slippes ikke ut av denne filen.
//  Ingen automatisk retry: et nytt forsøk er brukerens valg.
// ══════════════════════════════════════════════════════════════

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ProviderResult {
  text: string;
  /** Modellen stoppet på max_tokens. */
  truncated: boolean;
  usage: { input?: number; output?: number };
}

/** Feil med en kategori klienten kan få vite om – aldri leverandørens egen tekst. */
export class AiProviderError extends Error {
  constructor(public kind: 'timeout' | 'rate_limit' | 'unavailable' | 'empty', public status?: number) {
    super(kind);
  }
}

export async function callOpenRouter(args: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  timeoutMs: number;
}): Promise<ProviderResult> {
  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Taktikkboard',
      },
      body: JSON.stringify({
        model: args.model,
        messages: args.messages,
        max_tokens: args.maxTokens,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(args.timeoutMs),
    });
  } catch (e) {
    const name = (e as Error)?.name;
    throw new AiProviderError(name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'unavailable');
  }

  if (!res.ok) {
    throw new AiProviderError(res.status === 429 ? 'rate_limit' : 'unavailable', res.status);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new AiProviderError('unavailable', res.status);
  }

  const d = data as {
    choices?: { message?: { content?: unknown }; finish_reason?: unknown }[];
    usage?: { prompt_tokens?: unknown; completion_tokens?: unknown };
  };
  const choice = Array.isArray(d?.choices) ? d.choices[0] : undefined;
  const text = typeof choice?.message?.content === 'string' ? choice.message.content.trim() : '';
  if (!text) throw new AiProviderError('empty', res.status);

  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  return {
    text,
    truncated: choice?.finish_reason === 'length',
    usage: { input: num(d.usage?.prompt_tokens), output: num(d.usage?.completion_tokens) },
  };
}
