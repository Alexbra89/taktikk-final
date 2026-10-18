import { describe, expect, it } from 'vitest';
import { ALL_DRILLS } from '@/data/drills';

// Tekstfeltene treneren leser i øvelsesbiblioteket, inkludert uverifiserte
// kildehenvisninger. Det eksisterende source-feltet skal stå urørt.
const FORBIDDEN = [/gemini/i, /claude/i, /gpt/i, /codex/i, /\(vurdering/i, /vurdering\s*:/i];

function userVisibleTexts(): { id: string; text: string }[] {
  const rows: { id: string; text: string }[] = [];
  for (const drill of ALL_DRILLS) {
    const texts = [
      drill.name,
      drill.description,
      drill.players,
      drill.why,
      drill.unverifiedSource ?? '',
      drill.background ?? '',
      drill.warning ?? '',
      drill.sketch ?? '',
      ...drill.steps.flatMap((step) => [step.name, step.description]),
      ...drill.coachingPoints,
      ...drill.commonMistakes,
      ...drill.variations,
      ...drill.equipment,
    ];
    for (const text of texts) rows.push({ id: drill.id, text });
  }
  return rows;
}

describe('øvelsestekster uten utviklingshistorikk og AI-spor', () => {
  it('har fortsatt 153 innebygde øvelser', () => {
    expect(ALL_DRILLS).toHaveLength(153);
  });

  it('inneholder ikke Gemini, Claude, GPT, Codex eller «(vurdering»', () => {
    const offenders = userVisibleTexts().filter(({ text }) =>
      FORBIDDEN.some((pattern) => pattern.test(text)),
    );
    expect(offenders).toEqual([]);
  });
});
