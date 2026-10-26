import { describe, expect, it } from 'vitest';
import { ALL_DRILL_ANIMATIONS } from '@/data/drillAnimations';
import { ballToWorld, boardToWorld } from '@/components/board/three/coordinates';
import { createMotionSampler, drillMotion } from './motion';
import { playbackMs, playheadAtInto, type Playhead } from './playback';

describe('compiled live playback', () => {
  it.each(ALL_DRILL_ANIMATIONS)('$drillId: matches the export path without changing the drill', animation => {
    const before = JSON.stringify(animation);
    for (const scale of [1, .37]) {
      const sampler = createMotionSampler(animation, scale);
      for (let from = 0; from < animation.phases.length; from++) {
        const buffer = sampler.sample(from, 0, false);
        const players = buffer.players, items = buffer.items, ball = buffer.ball;
        const positions = players.map(p => p.position);
        const itemPositions = items.map(p => p.position);
        let flightBuffer: typeof buffer.flight = null;
        for (const moving of [true, false]) {
          // Cross kick release, turns, end of flight, pauses and replay in reverse time.
          for (const t of [0, .1, .2, .3, .301, .5, .62, .8, .999, 1, .4, 0]) {
            const actual = sampler.sample(from, t, moving);
            const expected = drillMotion(animation, from, t, moving, scale);
            expect(actual).toBe(buffer);
            expect(actual.players).toBe(players); expect(actual.items).toBe(items); expect(actual.ball).toBe(ball);
            actual.players.forEach((p, i) => {
              expect(p.position).toBe(positions[i]);
              expect(p.position.x).toBeCloseTo(expected.players[i].position.x, 9);
              expect(p.position.y).toBeCloseTo(expected.players[i].position.y, 9);
            });
            actual.items.forEach((item, i) => {
              expect(item.position).toBe(itemPositions[i]);
              expect(item.position.x).toBeCloseTo(expected.items[i].position.x, 9);
              expect(item.position.y).toBeCloseTo(expected.items[i].position.y, 9);
              expect(item.rotation ?? 0).toBeCloseTo(expected.items[i].rotation ?? 0, 9);
            });
            expect(actual.ball.x).toBeCloseTo(expected.ball.x, 9);
            expect(actual.ball.y).toBeCloseTo(expected.ball.y, 9);
            expect(actual.ballHeight).toBeCloseTo(expected.ballHeight, 9);
            if (actual.flight) {
              if (flightBuffer) expect(actual.flight).toBe(flightBuffer);
              flightBuffer = actual.flight;
              expect(actual.flight).toEqual(expected.flight);
            } else expect(expected.flight).toBeNull();
          }
        }
      }
    }
    expect(JSON.stringify(animation)).toBe(before);
  });

  it('reuses and fully resets the clock buffer at boundaries and after a restart', () => {
    const out: Playhead = { from: -1, shown: -1, t: -1, moving: false, done: false };
    expect(playheadAtInto(out, 0, 3, 150 + 650)).toBe(out);
    expect(out).toEqual({ from: 0, shown: 1, t: .5, moving: true, done: false });
    playheadAtInto(out, 0, 3, playbackMs(0, 3));
    expect(out).toEqual({ from: 2, shown: 2, t: 0, moving: false, done: true });
    playheadAtInto(out, 1, 3, 0, 2);
    expect(out).toEqual({ from: 1, shown: 1, t: 0, moving: false, done: false });
  });

  it('reuses 3D coordinate targets, including shots inside both nets', () => {
    const out = { x: 0, y: 0, z: 0 };
    for (const x of [12, 31, 440, 849, 868]) {
      const position = { x, y: 280 };
      const expected = boardToWorld(position, 'football', 2);
      expect(boardToWorld(position, 'football', 2, out)).toBe(out);
      expect(out).toEqual(expected);
      const ball = ballToWorld(position, 'football', .2, .7);
      expect(ballToWorld(position, 'football', .2, .7, out)).toBe(out);
      expect(out).toEqual(ball);
    }
  });
});
