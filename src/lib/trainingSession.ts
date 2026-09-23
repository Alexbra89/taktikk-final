import type { CalendarEvent, TrainingNote } from '@/types';

// ══════════════════════════════════════════════════════════════
//  TRENINGSØKT – tid og delbar tekst for en trenings punkter
//  (øvelser, notater og taktikker i én liste).
// ══════════════════════════════════════════════════════════════

/** Standard varighet for en taktikk som legges til i en trening. */
export const TACTIC_DEFAULT_MIN = 15;

/** Eldre notater har ingen varighet; de har alltid vist 5 min. */
export const noteMinutes = (n: TrainingNote): number => n.duration ?? 5;

export const totalMinutes = (notes: TrainingNote[]): number =>
  notes.reduce((sum, n) => sum + noteMinutes(n), 0);

/**
 * «Treningsøkt 23. sep. – 60 min» og en nummerert liste, klar til å limes
 * inn i en melding. Punkter uten tid står uten minutter.
 */
export function sessionShareText(event: Pick<CalendarEvent, 'date' | 'trainingNotes'>): string {
  const date = new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
  const lines = event.trainingNotes.map((n, i) => {
    const min = noteMinutes(n);
    return `${i + 1}. ${n.title}${min > 0 ? ` (${min} min)` : ''}`;
  });
  return [`Treningsøkt ${date} – ${totalMinutes(event.trainingNotes)} min`, ...lines].join('\n');
}
