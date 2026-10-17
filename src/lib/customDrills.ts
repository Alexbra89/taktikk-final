import type { DrillExercise } from '@/types';

export const AI_DRILL_LABEL = 'AI-forslag – ikke kvalitetssjekket';
export const DRILL_CATEGORIES = ['keeper', 'forsvar', 'midtbane', 'angrep', 'cardio', 'styrke'] as const;
export const DRILL_BANDS = ['6-7', '8-9', '10-12', '13-16', '17+'] as const;

export function emptyDrill(ageGroup: 'youth' | 'adult'): DrillExercise {
  return {
    id: '', name: '', description: '', ageGroup, ageBand: [ageGroup === 'youth' ? '8-9' : '17+'],
    category: 'midtbane', difficulty: 'enkel', duration: 15, players: '', why: '',
    steps: [], coachingPoints: [], commonMistakes: [], variations: [], equipment: [], sketch: '',
  };
}

/** Hvitliste for lagring og AI-svar: kildefelt og ukjente felter følger aldri med. */
export function repairCustomDrill(raw: unknown): DrillExercise | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;
  const text = (v: unknown) => typeof v === 'string' ? v.trim().slice(0, 6000) : '';
  const list = (v: unknown) => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 30).map(text).filter(Boolean) : [];
  if (!text(d.name) || !text(d.description) || !text(d.players) ||
      !Number.isInteger(d.duration) || Number(d.duration) < 1 || Number(d.duration) > 240 ||
      !DRILL_CATEGORIES.includes(d.category as typeof DRILL_CATEGORIES[number]) ||
      (d.ageGroup !== 'youth' && d.ageGroup !== 'adult')) return null;
  const ageBand = list(d.ageBand).filter((b): b is typeof DRILL_BANDS[number] =>
    DRILL_BANDS.includes(b as typeof DRILL_BANDS[number]) && (d.ageGroup === 'adult' ? b === '17+' : b !== '17+'));
  if (!ageBand.length) return null;
  return {
    id: text(d.id), name: text(d.name), description: text(d.description), players: text(d.players),
    duration: Number(d.duration), category: d.category as DrillExercise['category'], ageGroup: d.ageGroup,
    ageBand, difficulty: d.difficulty === 'avansert' || d.difficulty === 'middels' ? d.difficulty : 'enkel',
    why: text(d.why), sketch: text(d.sketch), warning: text(d.warning),
    steps: (Array.isArray(d.steps) ? d.steps : []).slice(0, 30).flatMap((s, i) => {
      if (!s || typeof s !== 'object' || !text(s.description)) return [];
      return [{ id: `step-${i}`, name: text(s.name), description: text(s.description) }];
    }),
    equipment: list(d.equipment), coachingPoints: list(d.coachingPoints),
    commonMistakes: list(d.commonMistakes), variations: list(d.variations),
    isCustom: true, aiGenerated: d.aiGenerated === true,
  };
}

/** Ett steg per linje; «Navn: beskrivelse» deles på første kolon så stegnavnet beholdes. */
export function parseStepLines(text: string): DrillExercise['steps'] {
  return text.split('\n').map(x => x.trim()).filter(Boolean).map((line, i) => {
    const at = line.indexOf(':');
    const name = at > 0 ? line.slice(0, at).trim() : '';
    const description = at > 0 ? line.slice(at + 1).trim() : '';
    return name && description ? { id: `step-${i}`, name, description } : { id: `step-${i}`, name: '', description: line };
  });
}

export function parseAiDrill(answer: string): DrillExercise | null {
  try {
    const raw = JSON.parse(answer.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    const drill = repairCustomDrill({ ...raw, aiGenerated: true });
    if (!drill || !drill.steps.length) return null;
    // Avvis synlige lenker og kildehenvisninger; vis aldri modellens råsvar ved feil.
    if (/https?:|www\.|\b(kilde(?:r)?|sources?|references?|referanser)\s*[:：]|\[\d+\]/i.test(JSON.stringify(drill))) return null;
    return drill;
  } catch { return null; }
}
