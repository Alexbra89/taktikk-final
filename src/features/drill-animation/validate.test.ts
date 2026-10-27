import { describe, expect, it } from 'vitest';
import { ALL_DRILLS } from '@/data/drills';
import { ALL_DRILL_ANIMATIONS, getDrillAnimation, hasDrillAnimation } from '@/data/drillAnimations';
import { KEEPER_ANIMATIONS } from '@/data/drillAnimations/keeper';
import { FORSVAR_ANIMATIONS } from '@/data/drillAnimations/forsvar';
import { MIDTBANE_ANIMATIONS } from '@/data/drillAnimations/midtbane';
import { ANGREP_ANIMATIONS } from '@/data/drillAnimations/angrep';
import { CARDIO_ANIMATIONS } from '@/data/drillAnimations/cardio';
import { validateDrillAnimation, ballInGoal, closestGap } from './validate';
import { defineDrillAnimation, metresToBoard, type AnimationSpec } from './define';
import { interpolatePlayers, interpolateBall } from '@/hooks/usePhasePlayback';
import { feedbackMailto } from './feedback';
import type { DrillAnimation } from './types';

const DRILL_IDS = ALL_DRILLS.map(d => d.id);

describe('alle animasjonene', () => {
  it('finnes minst fem, med én animasjon per øvelse', () => {
    expect(ALL_DRILL_ANIMATIONS.length).toBeGreaterThanOrEqual(5);
    const ids = ALL_DRILL_ANIMATIONS.map(a => a.drillId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_DRILL_ANIMATIONS.map(a => [a.drillId, a] as const))('%s består valideringen', (_id, animation) => {
    expect(validateDrillAnimation(animation, DRILL_IDS)).toEqual([]);
  });

  it('ligger i filen for øvelsens kategori', () => {
    const files = { keeper: KEEPER_ANIMATIONS, forsvar: FORSVAR_ANIMATIONS, midtbane: MIDTBANE_ANIMATIONS, angrep: ANGREP_ANIMATIONS, cardio: CARDIO_ANIMATIONS };
    for (const [category, animations] of Object.entries(files)) {
      for (const animation of animations) {
        expect(ALL_DRILLS.find(d => d.id === animation.drillId)?.category).toBe(category);
      }
    }
  });

  it('kobles til øvelsen via id', () => {
    for (const animation of ALL_DRILL_ANIMATIONS) {
      expect(hasDrillAnimation(animation.drillId)).toBe(true);
      expect(getDrillAnimation(animation.drillId)).toBe(animation);
    }
    expect(hasDrillAnimation('finnes-ikke')).toBe(false);
  });

  it('har fasetekst også som fasens notat, så 3D viser den', () => {
    for (const animation of ALL_DRILL_ANIMATIONS) {
      for (const phase of animation.phases) expect(phase.stickyNote).toBe(phase.text);
    }
  });
});

// En liten, gyldig animasjon som hver test ødelegger på én måte.
const spec = (): AnimationSpec => ({
  drillId: 'forsvar-y-09',
  name: 'Test',
  sport: 'football5',
  cast: { a: { label: 'A', family: 'att' }, b: { label: 'B', family: 'def' } },
  phases: [
    { name: 'En', text: 'A har ballen.', players: { a: [-5, 0], b: [5, 0] }, ball: { with: 'a' } },
    { name: 'To', text: 'A spiller til B.', players: {}, ball: { with: 'b', dir: [-1, 0] } },
    { name: 'Tre', text: 'B fører.', players: { b: [8, 2] }, ball: { with: 'b' } },
  ],
});
const errorsOf = (animation: DrillAnimation) => validateDrillAnimation(animation, DRILL_IDS);

describe('valideringen', () => {
  it('godtar en riktig animasjon', () => {
    expect(errorsOf(defineDrillAnimation(spec()))).toEqual([]);
  });

  it('krever at øvelses-id-en finnes', () => {
    expect(errorsOf(defineDrillAnimation({ ...spec(), drillId: 'finnes-ikke' })).join()).toMatch(/finnes ikke/);
  });

  it('krever 3–8 faser', () => {
    const s = spec();
    expect(errorsOf(defineDrillAnimation({ ...s, phases: s.phases.slice(0, 2) })).join()).toMatch(/2 faser/);
    const many = [...s.phases, ...s.phases, ...s.phases];
    expect(errorsOf(defineDrillAnimation({ ...s, phases: many })).join()).toMatch(/9 faser/);
  });

  it('krever tekst på hver fase', () => {
    const s = spec();
    s.phases[1].text = '  ';
    expect(errorsOf(defineDrillAnimation(s)).join()).toMatch(/Fase 2: mangler tekst/);
  });

  it('krever korte markeringer', () => {
    const s = spec();
    s.phases[2].highlight = 'Dette er altfor langt for en markering';
    expect(errorsOf(defineDrillAnimation(s)).join()).toMatch(/markeringen/);
  });

  it('krever at alle posisjoner er innenfor banen', () => {
    const s = spec();
    s.phases[2].players.b = [21, 0];
    expect(errorsOf(defineDrillAnimation(s)).join()).toMatch(/«b» står utenfor banen/);
    const t = spec();
    t.items = [{ id: 'kjegle', type: 'cone', at: [0, 16] }];
    expect(errorsOf(defineDrillAnimation(t)).join()).toMatch(/utstyret «kjegle» står utenfor banen/);
  });

  it('melder spillere oppå hverandre', () => {
    const s = spec();
    s.phases[2].players = { a: [0, 0], b: [0.5, 0] };
    expect(errorsOf(defineDrillAnimation(s)).join()).toMatch(/«a» og «b» står oppå hverandre/);
  });

  it('melder spillere som glir gjennom hverandre mellom to faser', () => {
    const s = spec();
    // A og B bytter plass langs samme linje og møtes midt på.
    s.phases[2].players = { a: [5, 0], b: [-5, 0] };
    const errors = errorsOf(defineDrillAnimation(s));
    expect(errors.join()).toMatch(/Fase 2–3: «a» og «b» går gjennom hverandre/);
    expect(errors.join()).not.toMatch(/står oppå hverandre/);
    // Samme bytte med god avstand på tvers er greit.
    const t = spec();
    t.phases[2].players = { a: [5, -3], b: [-5, 3] };
    t.phases[2].ball = { with: 'b' };
    expect(errorsOf(defineDrillAnimation(t))).toEqual([]);
  });

  it('regner ut minste avstand underveis', () => {
    const p = (x: number, y: number) => ({ x, y });
    expect(closestGap(p(0, 0), p(100, 0), p(100, 0), p(0, 0))).toBe(0);
    expect(closestGap(p(0, 0), p(100, 0), p(100, 40), p(0, 40))).toBe(40);
    expect(closestGap(p(0, 0), p(0, 0), p(50, 0), p(80, 0))).toBe(50);
  });

  it('krever at ballen er hos en spiller', () => {
    const s = spec();
    s.phases[1].ball = [0, 0];
    expect(errorsOf(defineDrillAnimation(s)).join()).toMatch(/Fase 2: ballen er ikke hos en spiller/);
    const t = spec();
    t.phases[1].ball = { with: 'ingen' };
    expect(errorsOf(defineDrillAnimation(t)).join()).toMatch(/ballen er ikke hos en spiller/);
  });

  it('godtar ballen i mål bare i siste fase', () => {
    const s = spec();
    s.phases[2].ball = { goal: 'right' };
    expect(errorsOf(defineDrillAnimation(s))).toEqual([]);
    const t = spec();
    t.phases[1].ball = { goal: 'left' };
    expect(errorsOf(defineDrillAnimation(t)).join()).toMatch(/i mål før siste fase/);
  });

  it('krever de samme spillerne i hver fase', () => {
    const animation = defineDrillAnimation(spec());
    animation.phases[1].players = animation.phases[1].players.filter(p => p.id !== 'b');
    expect(errorsOf(animation).join()).toMatch(/Fase 2: spiller «b» mangler/);
  });

  it('kjenner igjen mål på banen og småmål', () => {
    expect(ballInGoal({ x: 859, y: 280 })).toBe(true);
    expect(ballInGoal({ x: 859, y: 200 })).toBe(false);
    const goal = { id: 'm', type: 'minigoal' as const, position: { x: 400, y: 300 } };
    expect(ballInGoal({ x: 405, y: 300 }, [goal])).toBe(true);
    expect(ballInGoal({ x: 405, y: 300 })).toBe(false);
  });
});

describe('byggeren', () => {
  it('regner meter om til brettet som 3D-visningen', () => {
    expect(metresToBoard('football5', [0, 0])).toEqual({ x: 440, y: 280 });
    expect(metresToBoard('football5', [20, 15])).toEqual({ x: 848, y: 528 });
    expect(metresToBoard('football', [-52.5, -34])).toEqual({ x: 32, y: 32 });
  });

  it('lar spillere som ikke er nevnt bli stående, og nummererer i rollelistas rekkefølge', () => {
    const animation = defineDrillAnimation(spec());
    expect(animation.phases[1].players.find(p => p.id === 'a')?.position).toEqual(animation.phases[0].players.find(p => p.id === 'a')?.position);
    expect(animation.phases[0].players.map(p => p.num)).toEqual([1, 2]);
  });
});

describe('avspillingen', () => {
  it.each(ALL_DRILL_ANIMATIONS.map(a => [a.drillId, a] as const))('%s har mellomposisjoner med brettets interpolering', (_id, animation) => {
    const before = JSON.stringify(animation);
    for (let i = 0; i < animation.phases.length - 1; i++) {
      const phase = animation.phases[i], next = animation.phases[i + 1];
      const middle = interpolatePlayers(phase, animation.phases, i, 0.5, true);
      for (const player of middle) {
        const from = phase.players.find(p => p.id === player.id)!.position;
        const to = next.players.find(p => p.id === player.id)!.position;
        expect(player.position.x).toBeCloseTo((from.x + to.x) / 2);
        expect(player.position.y).toBeCloseTo((from.y + to.y) / 2);
      }
      const ball = interpolateBall(phase, animation.phases, i, 0.5, true);
      expect(ball.x).toBeCloseTo((phase.ball.x + next.ball.x) / 2);
      expect(ball.y).toBeCloseTo((phase.ball.y + next.ball.y) / 2);
    }
    expect(JSON.stringify(animation)).toBe(before);
  });
});

describe('«Ser noe feil ut?»', () => {
  it('fyller inn øvelsens navn og fasen', () => {
    const link = feedbackMailto('Bryteren (komme foran)', 2, 4, 'trener@example.com');
    expect(link.startsWith('mailto:trener@example.com?subject=')).toBe(true);
    expect(decodeURIComponent(link)).toContain('Feil i animert øvelse: Bryteren (komme foran)');
    expect(decodeURIComponent(link)).toContain('Fase: 2 av 4');
  });
});

describe('utstyr som flytter seg (moveItems)', () => {
  const twoBalls = (): AnimationSpec => ({
    ...spec(),
    items: [{ id: 'ball-2', type: 'ball', at: [0, 5] }],
    phases: [
      { name: 'En', text: 'A har ballen.', players: { a: [-5, 0], b: [5, 0] }, ball: { with: 'a' } },
      { name: 'To', text: 'A spiller til B; den andre ballen ruller.', players: {}, ball: { with: 'b', dir: [-1, 0] }, moveItems: { 'ball-2': [6, 5] } },
      { name: 'Tre', text: 'B fører.', players: { b: [8, 2] }, ball: { with: 'b' } },
    ],
  });

  it('flytter utstyret i fasen og lar det stå der etterpå', () => {
    const animation = defineDrillAnimation(twoBalls());
    const at = (i: number) => animation.phases[i].items!.find(item => item.id === 'ball-2')!.position;
    expect(at(0)).toEqual(metresToBoard('football5', [0, 5]));
    expect(at(1)).toEqual(metresToBoard('football5', [6, 5]));
    expect(at(2)).toEqual(at(1));
    expect(validateDrillAnimation(animation, DRILL_IDS)).toEqual([]);
  });

  it('stopper en flytting av utstyr som ikke finnes', () => {
    const s = twoBalls();
    s.phases[1].moveItems = { finnes: [1, 1] };
    expect(() => defineDrillAnimation(s)).toThrow(/«finnes» flyttes, men finnes ikke/);
  });
});
