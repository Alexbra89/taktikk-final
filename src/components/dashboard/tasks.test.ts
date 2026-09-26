import { describe, it, expect } from 'vitest';
import type { CalendarEvent } from '@/types';
import { deriveTasks, localIso } from './tasks';

const ev = (p: Partial<CalendarEvent> & Pick<CalendarEvent, 'id' | 'type' | 'date'>): CalendarEvent => ({
  title: p.id, teamNote: '', trainingNotes: [], matchNotes: [], ...p,
});
const note = { id: 'n', createdAt: '', title: 'Rondo', content: '', focus: [] };
const base = { matchReports: [], rosterNames: [], lastExportedAt: new Date().toISOString(), today: '2026-09-26' };

describe('deriveTasks', () => {
  it('ber om innhold i kommende treninger uten punkter', () => {
    const tasks = deriveTasks({ ...base, events: [
      ev({ id: 'tom', type: 'training', date: '2026-09-28' }),
      ev({ id: 'full', type: 'training', date: '2026-09-29', trainingNotes: [note] }),
      ev({ id: 'langt', type: 'training', date: '2026-11-01' }),
    ] });
    expect(tasks.map(t => t.id)).toEqual(['plan-tom']);
  });

  it('ber om kamprapport bare for spilte kamper uten rapport', () => {
    const events = [
      ev({ id: 'spilt', type: 'match', date: '2026-09-20', opponent: 'Ørn' }),
      ev({ id: 'rapportert', type: 'match', date: '2026-09-21' }),
      ev({ id: 'kommende', type: 'match', date: '2026-10-01' }),
    ];
    const matchReports = [{ id: 'r', eventId: 'rapportert', createdAt: '', tags: [], freeText: '', generatedText: '' }];
    const tasks = deriveTasks({ ...base, events, matchReports });
    expect(tasks.map(t => t.id)).toEqual(['rep-spilt']);
    expect(tasks[0].title).toContain('mot Ørn');
  });

  it('ber om fremmøte bare når det finnes en spillerliste', () => {
    const events = [ev({ id: 'forbi', type: 'training', date: '2026-09-22', trainingNotes: [note] })];
    expect(deriveTasks({ ...base, events })).toEqual([]);
    expect(deriveTasks({ ...base, events, rosterNames: ['Ola'] }).map(t => t.id)).toEqual(['att-forbi']);
  });

  it('minner om backup når det finnes data og ingen fersk eksport', () => {
    const events = [ev({ id: 'x', type: 'training', date: '2026-01-01', trainingNotes: [note] })];
    expect(deriveTasks({ ...base, events, lastExportedAt: null }).map(t => t.kind)).toEqual(['backup']);
    expect(deriveTasks({ ...base, events: [], lastExportedAt: null })).toEqual([]);
  });

  it('localIso bruker lokal dato', () => {
    expect(localIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
