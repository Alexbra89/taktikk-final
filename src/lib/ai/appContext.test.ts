import { describe, expect, it } from 'vitest';
import type { CalendarEvent, Tactic } from '@/types';
import { buildAppContext } from './appContext';

const today = '2026-09-26';
const note = (title: string, duration: number, focus: string[] = []) =>
  ({ id: `n-${title}`, createdAt: '', title, content: 'HEMMELIG-INNHOLD', focus, duration });
const ev = (p: Partial<CalendarEvent> & Pick<CalendarEvent, 'id' | 'type' | 'date'>): CalendarEvent => ({
  title: p.id, teamNote: 'HEMMELIG-NOTAT', trainingNotes: [], matchNotes: [],
  location: 'HEMMELIG-STED', attendance: ['Ola Nordmann'], ...p,
});
const tactic = {
  id: 't', name: 'Høyt press', sport: 'football', formation: '4-3-3', activePhaseIdx: 1, createdAt: '',
  phases: [{ id: 'a', name: 'Oppbygging' }, { id: 'b', name: 'Press' }],
} as unknown as Tactic;

const events = [
  ev({ id: 'neste', type: 'training', date: '2026-09-28', time: '18:00', trainingNotes: [note('Rondo', 15, ['Pasningsspill']), note('Spill', 30)] }),
  ev({ id: 'senere', type: 'training', date: '2026-10-01' }),
  ev({ id: 'kamp', type: 'match', date: '2026-10-03', opponent: 'FK Ørn' }),
  ev({ id: 'forbi', type: 'training', date: '2026-09-20', trainingNotes: [note('Avslutning', 20, ['Avslutning'])] }),
];
const base = { today, ageGroup: 'youth' as const, tactic, events, matchReports: [] };

describe('buildAppContext', () => {
  it('sender aldri navn, fremmøte, sted eller frie notater', () => {
    for (const area of ['dashboard', 'training', 'calendar'] as const) {
      const json = JSON.stringify(buildAppContext({ ...base, area }));
      expect(json).not.toMatch(/HEMMELIG|Ola Nordmann/);
    }
  });

  it('dashbordet får neste trening, neste kamp, taktikk og siste uker', () => {
    const c = buildAppContext({ ...base, area: 'dashboard' });
    expect(c.ageGroup).toBe('barn');
    expect(c.activeTactic).toMatchObject({ formation: '4-3-3', format: '11er', activePhase: 'Press' });
    expect(c.nextTraining).toMatchObject({ title: 'neste', totalMinutes: 45, focus: ['Pasningsspill'] });
    expect(c.nextMatch).toMatchObject({ type: 'kamp', opponent: 'FK Ørn' });
    expect(c.recentTrainings).toMatchObject({ count: 1, minutes: 20, focus: ['Avslutning'] });
  });

  it('trening bruker den åpne treningen, ellers neste', () => {
    expect(buildAppContext({ ...base, area: 'training' }).training?.title).toBe('neste');
    expect(buildAppContext({ ...base, area: 'training', trainingId: 'forbi' }).training).toMatchObject({ title: 'forbi', past: true });
  });

  it('kalenderen får kommende aktiviteter; generelt får ingen appdata', () => {
    expect(buildAppContext({ ...base, area: 'calendar' }).upcoming?.map(e => e.title)).toEqual(['neste', 'senere', 'kamp']);
    const g = buildAppContext({ ...base, area: 'general' });
    expect(Object.keys(g).sort()).toEqual(['ageGroup', 'area', 'today']);
  });
});
