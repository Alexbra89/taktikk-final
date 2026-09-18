import { PlayerInjury } from '../types';

export const INJURY_TYPES: { value: string; label: string }[] = [
  { value: 'muskel', label: 'Muskel' },
  { value: 'kne',    label: 'Kne' },
  { value: 'ankel',  label: 'Ankel' },
  { value: 'hode',   label: 'Hode' },
  { value: 'annet',  label: 'Annet' },
];

export function injuryTypeLabel(type?: string): string {
  if (!type) return 'Ikke oppgitt';
  return INJURY_TYPES.find(t => t.value === type)?.label ?? type;
}

// CalendarEvent har ingen egne kolonner i Supabase for forventet
// retur/skadetype, så vi koder dem inn i det eksisterende (allerede
// synkroniserte) teamNote-feltet med et fast, gjenkjennelig format og
// leser dem tilbake med samme parser – uten å måtte endre DB-skjemaet.
const RETURN_PREFIX = 'Forventet retur:';
const TYPE_PREFIX    = 'Skadetype:';
const NOTE_PREFIX    = 'Notat:';

export function buildInjuryEventNote(injury: PlayerInjury): string {
  const lines = [
    `${TYPE_PREFIX} ${injuryTypeLabel(injury.type)}`,
    `${RETURN_PREFIX} ${injury.expectedReturn ?? 'Ukjent'}`,
  ];
  if (injury.notes?.trim()) lines.push(`${NOTE_PREFIX} ${injury.notes.trim()}`);
  return lines.join('\n');
}

export function parseInjuryExpectedReturn(teamNote: string | undefined): string | null {
  if (!teamNote) return null;
  const m = teamNote.match(/Forventet retur:\s*(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}
