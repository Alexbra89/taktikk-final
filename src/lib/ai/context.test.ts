import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { buildAiContext, compactDrawing, playerAliases, toPct } from './context';
import { VW, VH } from '@/data/formations';
import type { Tactic } from '@/types';

const initial = useAppStore.getState();
beforeEach(() => useAppStore.setState(initial, true));
const s = () => useAppStore.getState();
const active = (): Tactic => s().tactics.find(t => t.id === s().activeTacticId)!;

describe('toPct', () => {
  it('gjør 880×560 om til 0–100', () => {
    expect(toPct({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(toPct({ x: VW, y: VH })).toEqual({ x: 100, y: 100 });
    expect(toPct({ x: VW / 2, y: VH / 4 })).toEqual({ x: 50, y: 25 });
  });
  it('klemmer verdier utenfor brettet', () => {
    expect(toPct({ x: -500, y: 1e9 })).toEqual({ x: 0, y: 100 });
  });
});

describe('playerAliases', () => {
  it('P + draktnummer, entydig også ved like numre', () => {
    const a = playerAliases([
      { id: 'a', num: 7 }, { id: 'b', num: 7 }, { id: 'c', num: 10 },
    ] as Tactic['phases'][number]['players']);
    expect([...a.values()]).toEqual(['P7', 'P7-2', 'P10']);
  });
});

describe('buildAiContext', () => {
  it('inneholder format, formasjon, fase, retning, spillere, ball', () => {
    s().setAgeGroup('youth');
    const t = active();
    const ctx = buildAiContext(t, 0, { ageGroup: 'youth' })!;
    expect(ctx.format).toBe('11er');
    expect(ctx.ageGroup).toBe('barn');
    expect(ctx.formation).toBe(t.formation);
    expect(ctx.phase).toEqual({ name: 'Fase 1', number: 1, total: 1 });
    expect(ctx.direction).toMatch(/høyre/);
    expect(ctx.players).toHaveLength(11);
    expect(ctx.players[0]).toMatchObject({ id: 'P1', num: 1, role: 'Keeper', label: 'KV' });
    expect(ctx.ball).toEqual({ x: 50, y: 50 });
    for (const p of ctx.players) {
      expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(100);
    }
  });

  it('sender ikke interne id-er, spillernavn eller spillernotater', () => {
    const t0 = active();
    const pid = t0.phases[0].players[0].id;
    s().setPlayerName(pid, 'Ola Nordmann');
    s().addItem('cone');
    s().addDrawing({ type: 'arrow', pts: [{ x: 100, y: 100 }, { x: 300, y: 200 }], color: '#fff', colorKey: 'white' });
    const t = active();
    const json = JSON.stringify(buildAiContext(t, 0));
    expect(json).not.toContain('Ola');
    expect(json).not.toContain(pid);
    expect(json).not.toContain(t.id);
    expect(json).not.toContain(t.phases[0].id);
    expect(json).not.toContain(t.phases[0].items![0].id);
    expect(json).not.toContain(t.phases[0].drawings[0].id);
    expect(json).not.toMatch(/"(name|notes)":"Ola/);
  });

  it('utstyr får alias, typenavn og rotasjon når den ikke er 0', () => {
    const id = s().addItem('ladder');
    s().rotateItem(id, 90);
    s().addItem('opponent');
    const ctx = buildAiContext(active(), 0)!;
    expect(ctx.items[0]).toMatchObject({ id: 'I1', type: 'stige', rotation: 90 });
    expect(ctx.items[1]).toMatchObject({ id: 'I2', type: 'motstander' });
    expect(ctx.items[1].rotation).toBeUndefined();
  });

  it('frihånd blir bare start og slutt', () => {
    const pts = Array.from({ length: 300 }, (_, i) => ({ x: i, y: 100 }));
    const d = compactDrawing({ id: 'x', color: '#fff', pts });
    expect(d).toEqual({ type: 'frihånd', from: toPct(pts[0]), to: toPct(pts[299]) });
  });

  it('notatet tas med, avkortet', () => {
    s().updateStickyNote('x'.repeat(2000));
    expect(buildAiContext(active(), 0)!.note).toHaveLength(500);
  });

  it('forrige fase bare når det er bedt om, med samme alias', () => {
    s().addPhase();
    const t = active();
    expect(buildAiContext(t, 1)!.previousPhase).toBeUndefined();
    const ctx = buildAiContext(t, 1, { includePrevious: true })!;
    expect(ctx.previousPhase!.players.map(p => p.id)).toEqual(ctx.players.map(p => p.id));
    expect(buildAiContext(t, 0, { includePrevious: true })!.previousPhase).toBeUndefined();
  });

  it('manglende eller ødelagt data gir null eller hoppes over', () => {
    const t = active();
    expect(buildAiContext(t, 5)).toBeNull();
    const broken = { ...t, phases: [{ ...t.phases[0],
      players: [null, { id: 'x', num: 3, slotIdx: 2, position: { x: NaN, y: 1 } }, ...t.phases[0].players.slice(0, 2)],
      ball: null, items: 'tull', drawings: [null, { id: 'd', pts: [{ x: 1, y: 1 }] }, { id: 'l', type: 'label', at: { x: 1, y: 1 }, text: '   ' }],
    }] } as unknown as Tactic;
    const ctx = buildAiContext(broken, 0)!;
    expect(ctx.players).toHaveLength(2);
    expect(ctx.ball).toBeNull();
    expect(ctx.items).toEqual([]);
    expect(ctx.drawings).toEqual([]);
  });
});
