import { afterEach, describe, expect, it, vi } from 'vitest';
import { localDate, localDateOffset } from './dates';
import { backupFilename } from './backup';
import { imageFilename } from './exportImage';
import { videoFilename } from './exportVideo';

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('lokale kalenderdatoer', () => {
  it.each([
    ['Europe/Oslo', '2026-10-18T00:30:00+02:00', '2026-10-18'],
    ['America/Los_Angeles', '2026-12-31T23:30:00-08:00', '2026-12-31'],
    ['Pacific/Kiritimati', '2027-01-01T00:30:00+14:00', '2027-01-01'],
  ])('bruker lokal dag i %s, også i eksportfilnavn', (zone, instant, day) => {
    vi.stubEnv('TZ', zone);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(instant));
    expect(localDate()).toBe(day);
    expect(localDate(new Date(instant))).toBe(day);
    expect(backupFilename('Lag')).toBe(`taktikk-lag-${day}.json`);
    expect(imageFilename('Lag', 'Press', 'Fase')).toBe(`lag-press-fase-${day}.png`);
    expect(videoFilename('Lag', 'Press', 'mp4')).toBe(`lag-press-${day}.mp4`);
  });

  it.each([
    ['2026-03-28T23:30:00+01:00', 1, '2026-03-29'],
    ['2026-10-25T00:30:00+02:00', 1, '2026-10-26'],
    ['2026-03-30T00:30:00+02:00', -1, '2026-03-29'],
    ['2026-12-31T23:30:00+01:00', 7, '2027-01-07'],
    ['2026-01-05T00:30:00+01:00', -28, '2025-12-08'],
  ])('flytter kalenderdager over sommertid og årsskifte: %s (%i)', (instant, days, day) => {
    vi.stubEnv('TZ', 'Europe/Oslo');
    const original = new Date(instant);
    expect(localDateOffset(days, original)).toBe(day);
    expect(original.toISOString()).toBe(new Date(instant).toISOString());
  });
});
