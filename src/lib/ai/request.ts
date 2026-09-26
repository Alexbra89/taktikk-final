// ══════════════════════════════════════════════════════════════
//  AI-TRENER – forespørselen fra klienten til /api/ai
//  Delt av klient og server. Serveren stoler ikke på klienten:
//  alt valideres her før noe sendes videre til modellen.
// ══════════════════════════════════════════════════════════════

export const AI_MODES = ['ANALYZE_PHASE', 'COACHING', 'DRILL', 'NEXT_PHASE', 'GENERAL'] as const;
export type AiMode = typeof AI_MODES[number];

/** Modusene som trenger brettet. GENERAL svarer uten. */
export const BOARD_MODES: readonly AiMode[] = ['ANALYZE_PHASE', 'COACHING', 'DRILL', 'NEXT_PHASE'];

export const AI_ACCESS_HEADER = 'x-ai-access-code';

export const AI_LIMITS = {
  /** Hele forespørselen, i tegn. Stopper store eller manipulerte kall før de koster noe. */
  bodyChars: 32_000,
  question: 2_000,
  /** Brettet som JSON-tekst. En fase med 11 spillere og litt utstyr er rundt 2–4k. */
  contextChars: 16_000,
  historyMessages: 6,
  historyMessageChars: 4_000,
} as const;

export interface AiHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiRequest {
  mode: AiMode;
  question: string;
  /** Resultatet av buildAiContext – påkrevd for modusene som bruker brettet. */
  context: Record<string, unknown> | null;
  history: AiHistoryMessage[];
}

export type AiRequestResult =
  | { ok: true; value: AiRequest }
  | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

export const isAiMode = (v: unknown): v is AiMode => AI_MODES.includes(v as AiMode);

export function validateAiRequest(body: unknown): AiRequestResult {
  if (!isObj(body)) return { ok: false, error: 'Ugyldig forespørsel.' };
  if (!isAiMode(body.mode)) return { ok: false, error: 'Ukjent modus.' };
  const mode = body.mode;

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (question.length > AI_LIMITS.question) return { ok: false, error: 'Spørsmålet er for langt.' };
  if (mode === 'GENERAL' && !question) return { ok: false, error: 'Skriv et spørsmål.' };

  let context: Record<string, unknown> | null = null;
  if (BOARD_MODES.includes(mode)) {
    if (!isObj(body.context)) return { ok: false, error: 'Brettet mangler i forespørselen.' };
    if (JSON.stringify(body.context).length > AI_LIMITS.contextChars) {
      return { ok: false, error: 'Brettet er for stort til å analyseres.' };
    }
    context = body.context;
  }
  // GENERAL sender aldri brettet videre, selv om klienten skulle sende det med.

  const rawHistory = Array.isArray(body.history) ? body.history : [];
  if (rawHistory.length > AI_LIMITS.historyMessages) return { ok: false, error: 'For lang samtalehistorikk.' };
  const history: AiHistoryMessage[] = [];
  for (const m of rawHistory) {
    if (!isObj(m) || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return { ok: false, error: 'Ugyldig samtalehistorikk.' };
    }
    if (m.content.length > AI_LIMITS.historyMessageChars) return { ok: false, error: 'For lang samtalehistorikk.' };
    history.push({ role: m.role, content: m.content });
  }

  return { ok: true, value: { mode, question, context, history } };
}
