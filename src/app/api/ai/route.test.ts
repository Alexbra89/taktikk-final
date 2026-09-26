import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { AI_ACCESS_HEADER, AI_LIMITS } from '@/lib/ai/request';
import { OPENROUTER_URL } from '@/lib/ai/server/openrouter';

const KEY = 'sk-or-test-HEMMELIG';
const CODE = 'riktig-kode';

function call(body: unknown, code: string | null = CODE) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (code !== null) headers[AI_ACCESS_HEADER] = code;
  return POST(new Request('http://localhost/api/ai', {
    method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body),
  }));
}

const okProvider = () => vi.fn(async () => new Response(JSON.stringify({
  choices: [{ message: { content: 'Jeg ser … Min vurdering er …' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 900, completion_tokens: 300 },
}), { status: 200 }));

const general = { mode: 'GENERAL', question: 'Hvordan trener jeg høyt press med 12 spillere?' };

beforeEach(() => {
  vi.stubEnv('OPENROUTER_API_KEY', KEY);
  vi.stubEnv('AI_MODEL', 'test/model');
  vi.stubEnv('AI_ACCESS_CODE', CODE);
  vi.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('/api/ai – tilgang', () => {
  it('uten eller med feil kode: 401, og ingen kall til OpenRouter', async () => {
    const fetchMock = okProvider();
    vi.stubGlobal('fetch', fetchMock);
    for (const code of [null, '', 'feil']) {
      const res = await call(general, code);
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe('AI-tilgang mangler eller er feil.');
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mangler serveroppsett: 503 – aldri åpent', async () => {
    vi.stubEnv('AI_ACCESS_CODE', '');
    const fetchMock = okProvider();
    vi.stubGlobal('fetch', fetchMock);
    expect((await call(general, '')).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('/api/ai – validering', () => {
  beforeEach(() => vi.stubGlobal('fetch', okProvider()));

  it('ugyldig JSON, ukjent modus og for stor forespørsel avvises', async () => {
    expect((await call('{ikke json')).status).toBe(400);
    expect((await call({ mode: 'MOVE_PLAYER' })).status).toBe(400);
    expect((await call({ mode: 'GENERAL', question: 'x'.repeat(AI_LIMITS.bodyChars) })).status).toBe(413);
  });
});

describe('/api/ai – OpenRouter', () => {
  it('sender nøkkelen bare til OpenRouter og returnerer rent svar', async () => {
    const fetchMock = okProvider();
    vi.stubGlobal('fetch', fetchMock);
    const res = await call({ mode: 'ANALYZE_PHASE', context: { format: '11er', players: [] } });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ answer: 'Jeg ser … Min vurdering er …', truncated: false });
    expect(text).not.toContain(KEY);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(OPENROUTER_URL);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    const sent = JSON.parse(init.body as string);
    expect(sent.model).toBe('test/model');
    expect(sent.messages[0].role).toBe('system');
    expect(sent.messages.at(-1).content).toContain('<board_data>');
    // Tilgangskoden hører ikke hjemme i prompten.
    expect(init.body as string).not.toContain(CODE);
  });

  it('CHAT fra kalenderen sender app-data, ikke brett, og logger området', async () => {
    const fetchMock = okProvider();
    vi.stubGlobal('fetch', fetchMock);
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const res = await call({ mode: 'CHAT', question: 'Hjelp meg planlegge uka', area: 'calendar',
      appContext: { upcoming: [{ type: 'trening', date: '2026-09-28' }] } });
    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const last = JSON.parse(init.body as string).messages.at(-1).content;
    expect(last).toContain('<app_data>');
    expect(last).not.toContain('<board_data>');
    expect(JSON.parse(info.mock.calls.at(-1)![0] as string)).toMatchObject({ mode: 'CHAT', area: 'calendar', ok: true });
  });

  it('GENERAL sender ikke brettet til modellen', async () => {
    const fetchMock = okProvider();
    vi.stubGlobal('fetch', fetchMock);
    await call({ ...general, context: { format: '11er' } });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string).messages.at(-1).content).not.toContain('<board_data>');
  });

  it('leverandørfeil gir forståelig melding uten interne detaljer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ error: { message: `Invalid key ${KEY}`, metadata: { raw: 'intern' } } }), { status: 500 })));
    const res = await call(general);
    expect(res.status).toBe(502);
    const text = await res.text();
    expect(JSON.parse(text).error).toBe('AI-tjenesten er midlertidig utilgjengelig. Prøv igjen.');
    expect(text).not.toContain(KEY);
    expect(text).not.toContain('intern');
  });

  it('429 og timeout gir egne meldinger; tomt svar er en feil', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })));
    expect((await call(general)).status).toBe(429);

    vi.stubGlobal('fetch', vi.fn(async () => { throw Object.assign(new Error('t'), { name: 'TimeoutError' }); }));
    expect((await call(general)).status).toBe(504);

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }))));
    expect((await call(general)).status).toBe(502);
  });

  it('ingen automatisk retry: ett kall per forespørsel', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    await call(general);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loggen har metadata, ikke spørsmål, brett eller nøkkel', async () => {
    vi.stubGlobal('fetch', okProvider());
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    await call({ mode: 'COACHING', question: 'HEMMELIG-SPØRSMÅL', context: { note: 'HEMMELIG-NOTAT' } });
    const line = String(log.mock.calls[0][0]);
    expect(JSON.parse(line)).toMatchObject({ evt: 'ai', mode: 'COACHING', model: 'test/model', ok: true, in: 900, out: 300 });
    expect(line).not.toMatch(/HEMMELIG|sk-or/);
  });
});
