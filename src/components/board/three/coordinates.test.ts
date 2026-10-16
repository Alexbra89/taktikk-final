import { describe, expect, it } from 'vitest';
import {
  ballArcHeight, boardRotation, boardToWorld, worldToBoard, PITCHES, playbackBallHeight, playbackDuration, playbackFrame, exportDuration,
  ballToWorld, figureScale, GOAL_DEPTH,
} from './coordinates';
import { frameAt, VIDEO_LEAD_MS, VIDEO_TAIL_MS } from '@/lib/exportVideo';
import type { Sport, TacticPhase } from '@/types';

describe('2D → 3D, without changing the saved coordinate system', () => {
  for (const sport of Object.keys(PITCHES) as Sport[]) {
    it(`${sport}: centre, corners, axes and round trip`, () => {
      const p = PITCHES[sport];
      expect(boardToWorld({ x: 440, y: 280 }, sport)).toEqual({ x: 0, y: 0, z: 0 });
      expect(boardToWorld({ x: 32, y: 32 }, sport, 2)).toEqual({ x: -p.length / 2, y: 2, z: -p.width / 2 });
      expect(boardToWorld({ x: 848, y: 528 }, sport)).toEqual({ x: p.length / 2, y: 0, z: p.width / 2 });
      for (const input of [{ x: 92, y: 280 }, { x: 0, y: 560 }, { x: 621.25, y: 98.2 }]) {
        const actual = worldToBoard(boardToWorld(input, sport), sport);
        expect(actual.x).toBeCloseTo(input.x, 10); expect(actual.y).toBeCloseTo(input.y, 10);
      }
    });
  }
  it('rotates clockwise from above like the SVG', () => {
    expect(boardRotation(90)).toBe(-Math.PI / 2);
    expect(boardRotation()).toBe(-0);
    const angle = boardRotation(90);
    // Three's +X vector rotated about Y points along SVG's +Y (=world +Z).
    expect(-Math.sin(angle)).toBeCloseTo(1);
  });
});

const phases: TacticPhase[] = [0, 1, 2].map(i => ({
  id: String(i), name: `Fase ${i + 1}`,
  players: [{ id: 'keeper', num: 1, name: 'Ola', notes: '', slotIdx: 0, position: { x: 100 + i * 100, y: 200 + i * 50 } }],
  ball: { x: 120 + i * 200, y: 240 - i * 60 },
  items: [{ id: 'goal', type: 'minigoal', position: { x: 500 + i * 60, y: 100 }, rotation: i === 0 ? 350 : 10 }],
  drawings: [{ id: `label-${i}`, type: 'label', at: { x: 200, y: 300 }, text: `Fase ${i}`, color: '#fff' }],
}));

describe('3D playback and fixed-frame export', () => {
  it.each([.5, 1, 1.5, 2, 3])('uses 2D interpolation at speed %s', speed => {
    for (const elapsed of [0, 100, 350, 730]) {
      const result = playbackFrame(phases, elapsed / speed, speed);
      expect(result).toEqual(frameAt(phases, elapsed));
    }
    expect(playbackDuration(phases.length, speed)).toBe(2400 / speed);
    expect(exportDuration(phases.length, speed)).toBe(2400 / speed + VIDEO_LEAD_MS + VIDEO_TAIL_MS);
  });
  it('has identical positions regardless of the time needed to render preceding frames', () => {
    const sequential = Array.from({ length: 60 }, (_, i) => playbackFrame(phases, i * 1000 / 30, 1));
    expect(playbackFrame(phases, 40 * 1000 / 30, 1)).toEqual(sequential[40]);
  });
  it('uses the whole final phase, including new equipment and players', () => {
    const copy = structuredClone(phases);
    copy[2].items!.push({ id: 'new', type: 'cone', position: { x: 500, y: 500 } });
    copy[2].players = [];
    const result = playbackFrame(copy, 5000, 1);
    expect(result.items).toEqual(copy[2].items); expect(result.players).toEqual([]);
    expect(result.fromIdx).toBe(2); expect(result.ball).toEqual(copy[2].ball);
  });
  it('clamps negative time, accepts a single phase, and does not mutate data', () => {
    const before = JSON.stringify(phases);
    expect(playbackFrame(phases, -100, 1)).toEqual(frameAt(phases, 0));
    expect(playbackFrame([phases[0]], 300, 1).players).toEqual(phases[0].players);
    playbackFrame(phases, 600, 1);
    expect(JSON.stringify(phases)).toBe(before);
    expect(() => playbackFrame([], 0, 1)).toThrow();
    expect(() => playbackFrame(phases, 0, 0)).toThrow();
  });
  it('takes the short rotation path for equipment', () => {
    expect(playbackFrame(phases, 600, 1).items[0].rotation).toBe(360);
  });
});

describe('ball in the goal', () => {
  for (const sport of Object.keys(PITCHES) as Sport[]) {
    it(`${sport}: on or behind the goal line it lies inside the enlarged net`, () => {
      const p = PITCHES[sport], depth = GOAL_DEPTH * figureScale(sport), half = p.goal / 2 * figureScale(sport);
      for (const ball of [{ x: 32, y: 280 }, { x: 24, y: 250 }, { x: 10, y: 316 }, { x: 848, y: 300 }, { x: 856, y: 244 }]) {
        const w = ballToWorld(ball, sport, .26, .26);
        expect(Math.abs(w.x) - p.length / 2).toBeGreaterThanOrEqual(.36 - 1e-9);
        expect(Math.abs(w.x) - p.length / 2).toBeLessThanOrEqual(depth - .36 + 1e-9);
        expect(Math.abs(w.z)).toBeLessThanOrEqual(half - .36 + 1e-9);
        expect(Math.sign(w.x)).toBe(ball.x < 440 ? -1 : 1); expect(w.y).toBe(.26);
      }
      // Deeper in the 2D box is deeper in the net.
      expect(ballToWorld({ x: 20, y: 280 }, sport, .26).x).toBeLessThan(ballToWorld({ x: 30, y: 280 }, sport, .26).x);
    });
    it(`${sport}: elsewhere the ball is exactly where 2D has it`, () => {
      for (const ball of [{ x: 440, y: 280 }, { x: 40, y: 280 }, { x: 24, y: 200 }, { x: 836, y: 400 }]) {
        expect(ballToWorld(ball, sport, .26)).toEqual(boardToWorld(ball, sport));
      }
    });
  }
  it('glides across the goal line without a jump', () => {
    let previous = ballToWorld({ x: 40, y: 280 }, 'football', .26).x;
    for (let x = 39.5; x >= 20; x -= .5) {
      const next = ballToWorld({ x, y: 280 }, 'football', .26).x;
      expect(previous - next).toBeGreaterThan(0); expect(previous - next).toBeLessThan(.3);
      previous = next;
    }
  });
});

describe('ball flight between phases', () => {
  const left = { x: 32, y: 280 }, right = { x: 848, y: 280 };
  it('keeps short passes on the grass', () => {
    for (const t of [0, .25, .5, 1]) expect(ballArcHeight({ x: 440, y: 280 }, { x: 500, y: 280 }, t, 'football')).toBe(0);
  });
  it('lifts long passes in a symmetric arc that lands where 2D does', () => {
    expect(ballArcHeight(left, right, 0, 'football')).toBe(0);
    expect(ballArcHeight(left, right, 1, 'football')).toBe(0);
    expect(ballArcHeight(left, right, .5, 'football')).toBeCloseTo(9);
    expect(ballArcHeight(left, right, .2, 'football')).toBeCloseTo(ballArcHeight(left, right, .8, 'football'));
    expect(ballArcHeight(left, right, .5, 'football5')).toBeLessThan(ballArcHeight(left, right, .5, 'football'));
    expect(ballArcHeight(left, right, -1, 'football')).toBe(0);
  });
  it.each([1, 2, 3])('follows the playback clock at speed %s', speed => {
    expect(playbackBallHeight(phases, 600 / speed, speed, 'football'))
      .toBeCloseTo(ballArcHeight(phases[0].ball, phases[1].ball, .5, 'football'));
    expect(playbackBallHeight(phases, 1800 / speed, speed, 'football'))
      .toBeCloseTo(ballArcHeight(phases[1].ball, phases[2].ball, .5, 'football'));
    expect(playbackBallHeight(phases, 99999, speed, 'football')).toBe(0);
    expect(playbackBallHeight([phases[0]], 300, speed, 'football')).toBe(0);
  });
});
