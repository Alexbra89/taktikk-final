'use client';
import { Swords, Activity, type LucideIcon } from 'lucide-react';
import type { CalendarEvent, EventType, DrillCategory } from '@/types';

// Felles for kalenderfilene: oppsett, visuell metadata og skjemaklasser.
// Kalk: kamp er signal (dagens viktigste), trening er blekk. To hendelsestyper
// trenger ikke to farger – formen og etiketten skiller dem.

export const DRILL_CATEGORIES: DrillCategory[] = ['keeper', 'forsvar', 'midtbane', 'angrep', 'cardio', 'styrke'];
// Autogenerert økt er for hele laget, så keeperøvelser tas ikke med i rotasjonen.
export const AUTOGEN_CATEGORIES: DrillCategory[] = ['forsvar', 'midtbane', 'angrep', 'cardio', 'styrke'];

export const MONTHS = ['Januar','Februar','Mars','April','Mai','Juni',
                'Juli','August','September','Oktober','November','Desember'];
export const DAYS   = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

export interface EventMeta {
  Icon:  LucideIcon;
  label: string;
  /** Prikken i rutenettet og stripa på kortet. */
  dot:   string;
  /** Tekst- og flatefarge der typen skal leses. */
  text:  string;
  bg:    string;
}

export const EVENT_META: Record<EventType, EventMeta> = {
  match:    { Icon: Swords,   label: 'Kamp',    dot: 'bg-signal',    text: 'text-signal',    bg: 'bg-signal/10' },
  training: { Icon: Activity, label: 'Trening', dot: 'bg-ink-muted', text: 'text-ink-muted', bg: 'bg-canvas-raised' },
};

export function isEventOnDate(event: CalendarEvent, date: string): boolean {
  return event.date === date;
}

export const FOCUS_OPTIONS = [
  'Pasningsspill','Pressing','Forsvarsstilling','Avslutning','Kontrapress',
  'Innlegg','Dødball','Keepertrening','Kondisjon','Styrke','Taktikk','Individuell teknikk',
];

// ═══ SKJEMAKLASSER ════════════════════════════════════════════
// Erstatter CalStyle (styled-jsx med hardkodede hex-verdier).

export const INPUT_CLASS =
  'w-full mt-1.5 rounded-ctl px-3 min-h-[44px] bg-canvas-raised text-body text-ink ' +
  'placeholder:text-ink-faint shadow-hair focus:outline-none focus:shadow-hair-signal';

export const TEXTAREA_CLASS =
  'w-full mt-1.5 rounded-ctl px-3 py-2.5 bg-canvas-raised text-body text-ink leading-relaxed resize-y ' +
  'placeholder:text-ink-faint shadow-hair focus:outline-none focus:shadow-hair-signal';

export const LABEL_CLASS =
  'block font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle';

/** Valgknapp som ikke er en handling: ukedag, fokusområde, omgang. */
export function toggleClass(active: boolean): string {
  return active
    ? 'bg-signal/10 text-signal shadow-hair-signal'
    : 'bg-canvas-raised text-ink-muted hover:text-ink shadow-hair';
}

// ═══ DATOHJELPERE ═════════════════════════════════════════════
// Datoene lagres som ISO (YYYY-MM-DD); T12:00 unngår tidssonehopp.

export const atNoon = (iso: string) => new Date(iso + 'T12:00:00');

/** «Tirsdag 22.» – brukes som sidetittel i serif. */
export const formatDayTitle = (iso: string) => {
  const d = atNoon(iso);
  const weekday = d.toLocaleDateString('nb-NO', { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${d.getDate()}.`;
};

export const formatDateLong = (iso: string) =>
  atNoon(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDateShort = (iso: string) =>
  atNoon(iso).toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' });
