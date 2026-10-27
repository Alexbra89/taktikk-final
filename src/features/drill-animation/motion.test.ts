import { describe, expect, it } from 'vitest';
import { ALL_DRILLS } from '@/data/drills';
import { ALL_DRILL_ANIMATIONS, getDrillAnimation } from '@/data/drillAnimations';
import type { Position } from '@/types';
import { defineDrillAnimation, type AnimationSpec } from './define';
import { drillMotion, kickInto, kickAt } from './motion';
import { BALL_REACH, ballInGoal, holderOf, validateDrillAnimation } from './validate';

const DRILL_IDS = ALL_DRILLS.map(d => d.id);
const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
const STEPS = Array.from({ length: 41 }, (_, i) => i / 40);

describe('ballen i overgangene', () => {
  for (const animation of ALL_DRILL_ANIMATIONS) {
    animation.phases.slice(0, -1).forEach((phase, from) => {
      const next = animation.phases[from + 1];
      const kick = kickInto(phase, next);
      if (kick) {
        it(`${animation.drillId} fase ${from + 1}–${from + 2}: ${kick} reiser synlig, ikke et hopp`, () => {
          const passer = holderOf(phase)!;
          const frames = STEPS.map(t => drillMotion(animation, from, t, true));
          // Pasningsleggeren har ballen til den spilles.
          frames.filter((_, i) => STEPS[i] <= kickAt(kick)).forEach(f => {
            expect(dist(f.ball, f.players.find(p => p.id === passer.id)!.position)).toBeLessThanOrEqual(BALL_REACH);
          });
          const flying = frames.filter(f => f.flight);
          const { from: launch, to: target } = flying[0].flight!;
          const length = dist(launch, target);
          expect(length).toBeGreaterThan(30);
          // Minst tre mellomposisjoner mellom pasningsleggeren og mottakeren/målet.
          const between = flying.filter(f => dist(f.ball, launch) > 1 && dist(f.ball, target) > 1);
          expect(new Set(between.map(f => `${f.ball.x.toFixed(2)},${f.ball.y.toFixed(2)}`)).size).toBeGreaterThanOrEqual(3);
          // På streken mellom dem (aldri et annet sted), og uten store hopp.
          for (const f of flying) {
            expect(dist(launch, f.ball) + dist(f.ball, target)).toBeCloseTo(length, 5);
          }
          for (let i = 1; i < frames.length; i++) {
            expect(dist(frames[i].ball, frames[i - 1].ball)).toBeLessThan(length * 0.35);
          }
          // Fremme: hos mottakeren (i hendene ved en fanget ball), i mål eller bokset ut.
          const end = frames.at(-1)!, arrived = drillMotion(animation, from + 1, 0, false);
          expect(dist(end.ball, arrived.ball)).toBeLessThan(1e-6);
          expect(ballInGoal(next.ball, next.items) || holderOf(next)?.id !== passer.id).toBe(true);
          // 3D: langs bakken ved pasning, lav bue ved skudd, bue ved sentring, høyt over figurene ved høy ball og boksing.
          const base = Math.max(drillMotion(animation, from, 0, false).ballHeight, arrived.ballHeight);
          const arc = Math.max(...frames.map(f => f.ballHeight)) - base;
          if (kick === 'pass' || kick === 'tackle') expect(arc).toBeLessThanOrEqual(0);
          if (kick === 'cross') { expect(arc).toBeGreaterThan(0.5); expect(arc).toBeLessThanOrEqual(3); }
          if (kick === 'shot' || kick === 'deflect') { expect(arc).toBeGreaterThan(0.1); expect(arc).toBeLessThan(1); }
          if (kick === 'high' || kick === 'punch') expect(arc).toBeGreaterThan(4);
          expect(end.ballHeight).toBeCloseTo(arrived.ballHeight, 6);
        });
      } else if (holderOf(phase) && holderOf(phase)?.id === holderOf(next)?.id) {
        it(`${animation.drillId} fase ${from + 1}–${from + 2}: ballholderen har ballen hele veien`, () => {
          const holder = holderOf(phase)!.id;
          for (const t of STEPS) {
            const f = drillMotion(animation, from, t, true);
            expect(dist(f.ball, f.players.find(p => p.id === holder)!.position)).toBeLessThanOrEqual(BALL_REACH);
            expect(f.flight).toBeNull();
          }
        });
      }
    });
  }

  it('er sammenhengende med fasene, også når draktene tegnes mindre', () => {
    for (const animation of ALL_DRILL_ANIMATIONS) {
      for (const kitScale of [1, 0.4]) {
        for (let from = 0; from < animation.phases.length - 1; from++) {
          const start = drillMotion(animation, from, 0, false, kitScale).ball;
          const end = drillMotion(animation, from + 1, 0, false, kitScale).ball;
          expect(dist(drillMotion(animation, from, 1e-6, true, kitScale).ball, start)).toBeLessThan(0.01);
          expect(dist(drillMotion(animation, from, 1 - 1e-6, true, kitScale).ball, end)).toBeLessThan(0.01);
        }
      }
    }
  });

  it('står stille når avspillingen ikke går', () => {
    const animation = ALL_DRILL_ANIMATIONS[0];
    const still = drillMotion(animation, 1, 0.5, false);
    expect(still.players).toEqual(animation.phases[1].players);
    expect(still.ball).toEqual(animation.phases[1].ball);
    expect(still.flight).toBeNull();
  });
});

describe('innholdet', () => {
  it('Vendingsstafett: blå → rød → blå med vendinger, sentring til makkeren, bakerst i køa', () => {
    const animation = getDrillAnimation('cardio-y-02')!;
    expect(animation.phases.map(p => p.name)).toEqual(['Oppsett', 'Til blå', 'Til rød', 'Tilbake til blå', 'Sentring', 'Bakerst i køa']);
    const [blue, red] = animation.phases[0].items!.map(i => i.position);
    const s1 = (i: number) => animation.phases[i].players.find(p => p.id === 's1')!.position;
    // Ballen er hos første spiller hele veien til sentringen.
    for (let i = 0; i <= 3; i++) expect(holderOf(animation.phases[i])?.id).toBe('s1');
    expect(Math.abs(s1(1).x - blue.x)).toBeLessThan(5);
    expect(Math.abs(s1(2).x - red.x)).toBeLessThan(5);
    expect(Math.abs(s1(3).x - blue.x)).toBeLessThan(5);
    expect(animation.phases.slice(1, 4).every(p => p.turn)).toBe(true);
    expect(animation.phases[4].kick).toBe('cross');
    expect(holderOf(animation.phases[4])?.id).toBe('s2');
    // Bakerst: bak alle i køa.
    const queue = animation.phases[5].players.filter(p => p.id !== 's1').map(p => p.position.x);
    expect(s1(5).x).toBeLessThan(Math.min(...queue));
  });

  it('Murbyggerne: utrykning samtidig med touchen, så et skudd som blokkeres', () => {
    const animation = getDrillAnimation('forsvar-y-05')!;
    expect(animation.phases).toHaveLength(3);
    const at = (i: number, id: string) => animation.phases[i].players.find(p => p.id === id)!.position;
    // Samme fase: angriperen går frem og forsvareren rykker ut.
    expect(dist(at(0, 'a'), at(1, 'a'))).toBeGreaterThan(5);
    expect(dist(at(0, 'f'), at(1, 'f'))).toBeGreaterThan(30);
    const shot = animation.phases[2];
    expect(shot.kick).toBe('shot');
    expect(holderOf(animation.phases[1])?.id).toBe('a');
    expect(holderOf(shot)?.id).toBe('f');
    // Forsvareren står mellom angriperen og småmålet, og skuddet er 8–10 m.
    const goal = shot.items!.find(i => i.type === 'minigoal')!.position;
    expect(at(2, 'f').x).toBeGreaterThan(goal.x);
    expect(at(2, 'f').x).toBeLessThan(at(2, 'a').x);
    const metres = (at(2, 'a').x - goal.x) * 40 / 816;
    expect(metres).toBeGreaterThanOrEqual(8);
    expect(metres).toBeLessThanOrEqual(10);
    expect(shot.highlight).toBe('Blokk!');
  });
});

// En liten, gyldig animasjon med en pasning, som testene ødelegger på én måte.
const spec = (): AnimationSpec => ({
  drillId: 'forsvar-y-09',
  name: 'Test',
  sport: 'football5',
  cast: { a: { label: 'A', family: 'att' }, b: { label: 'B', family: 'def' } },
  phases: [
    { name: 'En', text: 'A har ballen.', players: { a: [-5, 0], b: [5, 0] }, ball: { with: 'a' } },
    { name: 'To', text: 'A sentrer til B.', kick: 'cross', players: {}, ball: { with: 'b', dir: [-1, 0] } },
    { name: 'Tre', text: 'B fører og vender.', turn: true, players: { b: [8, 2] }, ball: { with: 'b', dir: [-1, 0] } },
  ],
});

describe('valideringen av pasninger og vendinger', () => {
  it('godtar en sentring til en annen spiller og en vending med ball', () => {
    expect(validateDrillAnimation(defineDrillAnimation(spec()), DRILL_IDS)).toEqual([]);
  });

  it('melder en pasning som ingen andre tar imot', () => {
    const s = spec();
    s.phases[1].ball = { with: 'a' };
    expect(validateDrillAnimation(defineDrillAnimation(s), DRILL_IDS).join()).toMatch(/Fase 2: ballen spilles, men ingen andre tar imot/);
  });

  it('melder en pasning i første fase og en vending uten ball', () => {
    const s = spec();
    s.phases[0].kick = 'pass';
    s.phases[2].ball = [0, 10];
    const errors = validateDrillAnimation(defineDrillAnimation(s), DRILL_IDS).join();
    expect(errors).toMatch(/Fase 1: ballen spilles, men ingen har den i fasen før/);
    expect(errors).toMatch(/Fase 3: vendingen trenger en spiller med ball/);
  });
});

describe('slenging, fanget ball og boksing', () => {
  const keeper = (): AnimationSpec => ({
    drillId: 'keeper-a-10',
    name: 'Test',
    sport: 'football',
    cast: { s: { label: 'S', family: 'att' }, k: { label: 'K', family: 'gk' } },
    phases: [
      { name: 'En', text: 'Skytteren har ballen.', players: { s: [40, 0], k: [52, 0] }, ball: { with: 's' } },
      { name: 'To', text: 'Keeperen slenger seg og fanger.', kick: 'shot', dive: ['k'], held: true,
        players: { k: [52, -2.6] }, ball: { with: 'k', dir: [0, -1] } },
      { name: 'Tre', text: 'Keeperen bokser ballen ut.', kick: 'punch', players: {}, ball: [40, -20] },
    ],
  });

  it('godtar en keeper som slenger seg, fanger og bokser til slutt', () => {
    expect(validateDrillAnimation(defineDrillAnimation(keeper()), DRILL_IDS)).toEqual([]);
  });

  it('keeperen faller sent i bevegelsen, og ballen ender i hendene', () => {
    const animation = defineDrillAnimation(keeper());
    const lean = (t: number) => drillMotion(animation, 0, t, true).players.find(p => p.id === 'k')!.pose!.lean;
    expect(lean(0)).toBe(0);
    expect(lean(0.3)).toBe(0);
    expect(lean(0.7)).toBeGreaterThan(0.2);
    expect(lean(1)).toBeCloseTo(1);
    const caught = drillMotion(animation, 1, 0, false);
    expect(caught.ballHeight).toBeGreaterThan(0.5);
    // Fallet går mot siden keeperen beveger seg (opp på brettet).
    expect(caught.players.find(p => p.id === 'k')!.pose!.dive.y).toBeLessThan(0);
    expect(drillMotion(animation, 0, 0, false).players.find(p => p.id === 's')!.pose).toBeUndefined();
  });

  it('en utespiller i sklitakling legger seg langs glidet med beina først', () => {
    const animation = defineDrillAnimation({
      drillId: 'forsvar-y-06', name: 'Test', sport: 'football7',
      cast: { a: { label: 'A', family: 'att' }, f: { label: 'F', family: 'def' } },
      phases: [
        { name: 'En', text: 'A har ballen.', players: { a: [10, 0], f: [15, 0.6] }, ball: { with: 'a' } },
        { name: 'To', text: 'F sklir inn.', kick: 'tackle', dive: ['f'], players: { f: [13, 0.4] }, ball: { with: 'f', dir: [0.5, 1] } },
        { name: 'Tre', text: 'F ligger.', dive: ['f'], players: {}, ball: { with: 'f', dir: [0.5, 1] } },
      ],
    });
    // Helt ferdig med glidet inn i fase 2.
    const f = drillMotion(animation, 0, 1, true).players.find(p => p.id === 'f')!;
    const slide = { x: animation.phases[1].players[1].position.x - animation.phases[0].players[1].position.x,
      y: animation.phases[1].players[1].position.y - animation.phases[0].players[1].position.y };
    expect(f.pose!.lean).toBe(1);
    // Hodet faller bakover (mot glidet), og figuren vender på tvers av det.
    expect(f.pose!.dive.x * slide.x + f.pose!.dive.y * slide.y).toBeLessThan(0);
    expect(Math.abs(f.pose!.face.x * slide.x + f.pose!.face.y * slide.y)).toBeLessThan(1e-6);
  });

  it('Rask hjemjobb: stående takling – forsvareren vinner ballen uten å gå i bakken', () => {
    const animation = getDrillAnimation('forsvar-y-06')!;
    expect(animation.phases.some(p => p.dive?.length)).toBe(false);
    const tackle = animation.phases.findIndex(p => p.kick === 'tackle');
    expect(holderOf(animation.phases[tackle - 1])?.id).toBe('a');
    expect(holderOf(animation.phases[tackle])?.id).toBe('f');
    expect(holderOf(animation.phases.at(-1)!)?.id).toBe('f');
    expect(drillMotion(animation, tackle, 0, false).players.every(p => !p.pose)).toBe(true);
  });

  it('melder boksing før siste fase, fanget ball uten ballholder og ukjent spiller som slenger seg', () => {
    const s = keeper();
    s.phases[1].kick = 'punch';
    s.phases[1].dive = ['x'];
    s.phases[2].held = true;
    const errors = validateDrillAnimation(defineDrillAnimation(s), DRILL_IDS).join();
    expect(errors).toMatch(/Fase 2: en boksing avslutter øvelsen/);
    expect(errors).toMatch(/Fase 2: «x» slenger seg, men står ikke i rollelista/);
    expect(errors).toMatch(/Fase 3: ballen er fanget, men ingen har den/);
  });
});
