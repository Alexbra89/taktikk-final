import { describe, expect, it } from 'vitest';
import { VIDEO_PHASE_MS, frameAt, interpolateItems, videoDurationMs } from './exportVideo';
import type { BoardItem, TacticPhase } from '@/types';

const item = (id: string, x: number, y: number, rotation?: number): BoardItem =>
  ({ id, type: 'cone', position: { x, y }, ...(rotation !== undefined ? { rotation } : {}) });

const phase = (px: number, ball: number, items: BoardItem[] = []): TacticPhase => ({
  id: `ph${px}`, name: '', drawings: [], items,
  players: [{ id: 'p1', num: 1, name: '', slotIdx: 0, notes: '', position: { x: px, y: 100 } }],
  ball: { x: ball, y: 200 },
});

describe('interpolateItems', () => {
  const from = [item('a', 100, 100, 0), item('bare-i-fra', 50, 50)];
  const to = [item('a', 200, 300, 90), item('ny', 400, 400)];

  it.each([[0.25, 125, 150], [0.5, 150, 200], [0.75, 175, 250]])('posisjon ved %s', (t, x, y) => {
    expect(interpolateItems(from, to, t)[0].position).toEqual({ x, y });
  });

  it('rotasjon går gradvis', () => {
    expect(interpolateItems(from, to, 0.5)[0].rotation).toBe(45);
  });

  it('rotasjon går korteste vei (350° → 10° over 0°)', () => {
    const r = interpolateItems([item('a', 0, 0, 350)], [item('a', 0, 0, 10)], 0.5)[0].rotation!;
    expect(((r % 360) + 360) % 360).toBe(0);
  });

  it('element bare i fasen det går fra står stille; nytt element vises ikke ennå', () => {
    const out = interpolateItems(from, to, 0.5);
    expect(out.find(i => i.id === 'bare-i-fra')?.position).toEqual({ x: 50, y: 50 });
    expect(out.some(i => i.id === 'ny')).toBe(false);
  });

  it('t = 0 gir fasen det går fra, uendret', () => {
    expect(interpolateItems(from, to, 0)).toBe(from);
  });
});

describe('frameAt', () => {
  const phases = [phase(100, 0, [item('a', 0, 0)]), phase(300, 400, [item('a', 100, 0)])];

  it.each([[0.25, 150, 100], [0.5, 200, 200], [0.75, 250, 300]])('ved %s av overgangen', (t, px, bx) => {
    const f = frameAt(phases, t * VIDEO_PHASE_MS);
    expect(f.players[0].position.x).toBeCloseTo(px);
    expect(f.ball.x).toBeCloseTo(bx);
    expect(f.items[0].position.x).toBeCloseTo(bx / 4);
  });

  it('holder seg innenfor avspillingen', () => {
    expect(frameAt(phases, -500).players[0].position.x).toBe(100);
    expect(frameAt(phases, 99999).players[0].position.x).toBe(300);
  });

  it('varighet: én overgang per fase etter den første', () => {
    expect(videoDurationMs(1)).toBe(0);
    expect(videoDurationMs(4)).toBe(3 * VIDEO_PHASE_MS);
  });
});
