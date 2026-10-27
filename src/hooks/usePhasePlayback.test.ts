import { describe, expect, it } from 'vitest';
import { clockPosition, retimeClock } from './usePhasePlayback';
import { VIDEO_PHASE_MS, frameAt } from '@/lib/exportVideo';
import type { TacticPhase } from '@/types';

describe('faseklokka (tidsbasert)', () => {
  it('en overgang tar 1,2 s ved 1× og halvparten ved 2×, uansett hvor ofte den leses', () => {
    expect(VIDEO_PHASE_MS).toBe(1200);
    const clock = { at: 1000, position: 0, speed: 1 };
    expect(clockPosition(clock, 1000)).toBe(0);
    expect(clockPosition(clock, 1600)).toBeCloseTo(0.5, 10);
    expect(clockPosition(clock, 1000 + 3 * VIDEO_PHASE_MS)).toBeCloseTo(3, 10);
    // En forsinket lesing (travel tråd) gir riktig sted, ikke et etterslep.
    expect(clockPosition({ ...clock, speed: 2 }, 1600)).toBeCloseTo(1, 10);
  });

  it('ny fart midt i avspillingen fortsetter fra samme sted', () => {
    const clock = { at: 0, position: 0, speed: 1 };
    const faster = retimeClock(clock, 600, 2);
    expect(clockPosition(faster, 600)).toBeCloseTo(0.5, 10);
    expect(clockPosition(faster, 900)).toBeCloseTo(1, 10);
    const slower = retimeClock(faster, 900, 0.5);
    expect(clockPosition(slower, 900 + 1200)).toBeCloseTo(1.5, 10);
  });

  it('samme tempo som videoen: samme overgang og samme sted til samme tid', () => {
    const phase = (x: number): TacticPhase => ({ id: `f${x}`, name: '', players: [], ball: { x, y: 0 }, drawings: [] });
    const phases = [phase(0), phase(100), phase(200), phase(300)];
    const clock = { at: 0, position: 0, speed: 1 };
    for (const ms of [0, 300, 1199, 1200, 2500, 3500]) {
      const position = clockPosition(clock, ms), from = Math.floor(position);
      const video = frameAt(phases, ms);
      expect(video.fromIdx).toBe(from);
      expect(video.ball.x).toBeCloseTo(phases[from].ball.x + 100 * (position - from), 6);
    }
  });
});
