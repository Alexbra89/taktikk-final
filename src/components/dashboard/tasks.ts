import type { CalendarEvent, MatchReport } from '@/types';

// ══════════════════════════════════════════════════════════════
//  OPPGAVER PÅ DASHBORDET – utledes fra data som allerede finnes.
//  Ingenting lagres: en oppgave forsvinner når det den peker på er gjort.
// ══════════════════════════════════════════════════════════════

export type TaskKind = 'plan' | 'attendance' | 'report' | 'backup';

export interface CoachTask {
  id: string;
  kind: TaskKind;
  title: string;
  detail: string;
  eventId?: string;
}

const DAY_MS = 86_400_000;

/** YYYY-MM-DD i lokal tid. */
export function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const addDays = (iso: string, days: number) =>
  localIso(new Date(new Date(iso + 'T12:00:00').getTime() + days * DAY_MS));

const shortDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' });

export function deriveTasks(input: {
  events: CalendarEvent[];
  matchReports: MatchReport[];
  rosterNames: string[];
  lastExportedAt: string | null;
  today: string;
  now?: number;
}): CoachTask[] {
  const { events, matchReports, rosterNames, lastExportedAt, today } = input;
  const now = input.now ?? Date.now();
  const tasks: CoachTask[] = [];
  const byDate = [...events].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));

  // Kommende treninger de neste 14 dagene uten innhold.
  byDate
    .filter(e => e.type === 'training' && e.date >= today && e.date <= addDays(today, 14) && e.trainingNotes.length === 0)
    .slice(0, 2)
    .forEach(e => tasks.push({
      id: `plan-${e.id}`, kind: 'plan', eventId: e.id,
      title: `Legg inn innhold i «${e.title}»`,
      detail: `${shortDate(e.date)} · ingen øvelser ennå`,
    }));

  // Treninger siste 14 dager uten registrert fremmøte (bare når det finnes en spillerliste).
  if (rosterNames.length > 0) {
    byDate
      .filter(e => e.type === 'training' && e.date < today && e.date >= addDays(today, -14) && !(e.attendance?.length))
      .slice(-2)
      .forEach(e => tasks.push({
        id: `att-${e.id}`, kind: 'attendance', eventId: e.id,
        title: `Registrer fremmøte – ${e.title}`,
        detail: shortDate(e.date),
      }));
  }

  // Kamper siste 30 dager uten kamprapport.
  const reported = new Set(matchReports.map(r => r.eventId).filter(Boolean));
  byDate
    .filter(e => e.type === 'match' && e.date <= today && e.date >= addDays(today, -30) && !reported.has(e.id))
    .slice(-2)
    .forEach(e => tasks.push({
      id: `rep-${e.id}`, kind: 'report', eventId: e.id,
      title: `Skriv kamprapport – ${e.opponent ? `mot ${e.opponent}` : e.title}`,
      detail: shortDate(e.date),
    }));

  // Backup: aldri tatt, eller eldre enn 14 dager – bare når det finnes noe å miste.
  const hasData = events.length > 0 || matchReports.length > 0;
  const stale = !lastExportedAt || now - new Date(lastExportedAt).getTime() > 14 * DAY_MS;
  if (hasData && stale) {
    tasks.push({
      id: 'backup', kind: 'backup',
      title: 'Ta backup av dataene',
      detail: lastExportedAt ? 'Mer enn 14 dager siden sist' : 'Aldri eksportert',
    });
  }

  return tasks;
}
