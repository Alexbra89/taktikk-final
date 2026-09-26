import type { CalendarEvent, MatchReport, Tactic } from '@/types';
import { SPORT_LABELS } from '@/store/selectors';
import { noteMinutes, totalMinutes } from '@/lib/trainingSession';
import type { AiArea } from './request';

// ══════════════════════════════════════════════════════════════
//  AI-KONTEKST UTENFOR BRETTET – treninger, kalender og taktikk-
//  oversikt, tilpasset hvor i appen AI-treneren brukes.
//
//  Bygges på klienten. Bare det en trener trenger for å planlegge:
//  datoer, titler, varighet, fokus og taktikkens formasjon. Aldri
//  spillernavn, fremmøte, sted, frie notater eller interne id-er.
// ══════════════════════════════════════════════════════════════

const DAY_MS = 86_400_000;
const MAX_TITLE = 60;
const MAX_ITEMS = 15;
const MAX_EVENTS = 10;

const cut = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

const addDays = (iso: string, days: number) => {
  const d = new Date(new Date(iso + 'T12:00:00').getTime() + days * DAY_MS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const weekday = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'long' });
const byDate = (a: CalendarEvent, b: CalendarEvent) =>
  a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '');

export interface AiTrainingSummary {
  title: string;
  date: string;
  weekday: string;
  time?: string;
  totalMinutes: number;
  focus: string[];
  items: { title: string; minutes: number; focus?: string[]; done?: boolean; tactic?: boolean }[];
  /** Treningen er allerede gjennomført (dato før i dag). */
  past?: boolean;
}

export interface AiEventSummary {
  type: 'trening' | 'kamp';
  title: string;
  date: string;
  weekday: string;
  time?: string;
  minutes?: number;
  focus?: string[];
  opponent?: string;
}

export interface AiAppContext {
  area: AiArea;
  today: string;
  ageGroup: 'barn' | 'voksne';
  activeTactic?: { name: string; format: string; formation: string; phases: string[]; activePhase: string };
  /** Treningen treneren har åpen, eller neste trening. */
  training?: AiTrainingSummary;
  nextTraining?: AiTrainingSummary;
  nextMatch?: AiEventSummary;
  upcoming?: AiEventSummary[];
  recentTrainings?: { days: number; count: number; minutes: number; focus: string[] };
  recentReports?: { date: string; tags: string[] }[];
}

export interface AppContextInput {
  area: AiArea;
  today: string;
  ageGroup: 'youth' | 'adult';
  tactic?: Tactic;
  events: CalendarEvent[];
  matchReports: MatchReport[];
  /** Treningen som er åpen i Trening-visningen. */
  trainingId?: string | null;
}

const focusOf = (ev: CalendarEvent) => [...new Set(ev.trainingNotes.flatMap(n => n.focus))].slice(0, 6);

export function summarizeTraining(ev: CalendarEvent, today: string): AiTrainingSummary {
  return {
    title: cut(ev.title, MAX_TITLE),
    date: ev.date,
    weekday: weekday(ev.date),
    ...(ev.time ? { time: ev.time } : {}),
    totalMinutes: totalMinutes(ev.trainingNotes),
    focus: focusOf(ev),
    items: ev.trainingNotes.slice(0, MAX_ITEMS).map(n => ({
      title: cut(n.title, MAX_TITLE),
      minutes: noteMinutes(n),
      ...(n.focus.length ? { focus: n.focus.slice(0, 4) } : {}),
      ...(n.completed ? { done: true } : {}),
      ...(n.tacticId ? { tactic: true } : {}),
    })),
    ...(ev.date < today ? { past: true } : {}),
  };
}

function summarizeEvent(ev: CalendarEvent): AiEventSummary {
  const isMatch = ev.type === 'match';
  return {
    type: isMatch ? 'kamp' : 'trening',
    title: cut(ev.title, MAX_TITLE),
    date: ev.date,
    weekday: weekday(ev.date),
    ...(ev.time ? { time: ev.time } : {}),
    ...(isMatch && ev.opponent ? { opponent: cut(ev.opponent, MAX_TITLE) } : {}),
    ...(!isMatch ? { minutes: totalMinutes(ev.trainingNotes) } : {}),
    ...(!isMatch && focusOf(ev).length ? { focus: focusOf(ev) } : {}),
  };
}

export function buildAppContext(input: AppContextInput): AiAppContext {
  const { area, today, tactic } = input;
  const events = [...input.events].sort(byDate);
  const upcoming = events.filter(e => e.date >= today);
  const trainings = events.filter(e => e.type === 'training');
  const nextTraining = upcoming.find(e => e.type === 'training');
  const nextMatch = upcoming.find(e => e.type === 'match');

  const ctx: AiAppContext = {
    area,
    today,
    ageGroup: input.ageGroup === 'youth' ? 'barn' : 'voksne',
  };
  if (area === 'general') return ctx;

  if (tactic) {
    const phases = tactic.phases.map(p => cut(p.name, MAX_TITLE));
    ctx.activeTactic = {
      name: cut(tactic.name, MAX_TITLE),
      format: SPORT_LABELS[tactic.sport] ?? String(tactic.sport),
      formation: tactic.formation,
      phases,
      activePhase: phases[tactic.activePhaseIdx] ?? phases[0] ?? '',
    };
  }

  const recentFrom = addDays(today, -28);
  const recent = trainings.filter(e => e.date < today && e.date >= recentFrom);
  const recentFocus = new Map<string, number>();
  recent.forEach(e => focusOf(e).forEach(f => recentFocus.set(f, (recentFocus.get(f) ?? 0) + 1)));
  const recentTrainings = {
    days: 28,
    count: recent.length,
    minutes: recent.reduce((m, e) => m + totalMinutes(e.trainingNotes), 0),
    focus: [...recentFocus.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f]) => f),
  };

  const recentReports = [...input.matchReports]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map(r => ({ date: r.createdAt.slice(0, 10), tags: r.tags.map(t => t.replace(/_/g, ' ')) }));

  if (nextMatch) ctx.nextMatch = summarizeEvent(nextMatch);

  if (area === 'dashboard') {
    if (nextTraining) ctx.nextTraining = summarizeTraining(nextTraining, today);
    ctx.upcoming = upcoming.filter(e => e.date <= addDays(today, 14)).slice(0, MAX_EVENTS).map(summarizeEvent);
    ctx.recentTrainings = recentTrainings;
    if (recentReports.length) ctx.recentReports = recentReports;
  } else if (area === 'training') {
    const open = input.trainingId ? events.find(e => e.id === input.trainingId && e.type === 'training') : undefined;
    const focus = open ?? nextTraining;
    if (focus) ctx.training = summarizeTraining(focus, today);
    ctx.recentTrainings = recentTrainings;
  } else if (area === 'calendar') {
    ctx.upcoming = upcoming.filter(e => e.date <= addDays(today, 21)).slice(0, MAX_EVENTS).map(summarizeEvent);
    ctx.recentTrainings = recentTrainings;
    if (recentReports.length) ctx.recentReports = recentReports;
  }
  return ctx;
}
