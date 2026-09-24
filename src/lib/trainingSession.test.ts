import { describe, expect, it } from 'vitest';
import { noteMinutes, sessionShareText, totalMinutes } from './trainingSession';
import type { TrainingNote } from '@/types';

const note = (title: string, duration?: number): TrainingNote =>
  ({ id: title, createdAt: '', title, content: '', focus: [], ...(duration !== undefined ? { duration } : {}) });

describe('treningsøkt', () => {
  it('notater uten varighet teller 5 min, 0 betyr uten tid', () => {
    expect(noteMinutes(note('a'))).toBe(5);
    expect(noteMinutes(note('b', 0))).toBe(0);
    expect(noteMinutes(note('c', 20))).toBe(20);
  });

  it('total tid er summen', () => {
    expect(totalMinutes([note('a', 25), note('b'), note('c', 15), note('d', 0)])).toBe(45);
    expect(totalMinutes([])).toBe(0);
  });

  it('delt tekst: overskrift med total tid og nummerert liste', () => {
    const text = sessionShareText({
      date: '2026-09-23',
      trainingNotes: [note('4-3-3 kontring', 25), note('Oppvarming'), note('Samling', 0)],
    });
    const lines = text.split('\n');
    expect(lines[0]).toMatch(/^Treningsøkt 23\. sep\.? – 30 min$/);
    expect(lines.slice(1)).toEqual(['1. 4-3-3 kontring (25 min)', '2. Oppvarming (5 min)', '3. Samling']);
  });
});
