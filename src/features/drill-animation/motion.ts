import { boardToWorld } from '@/components/board/three/coordinates';
import { interpolatePlayers } from '@/hooks/usePhasePlayback';
import { interpolateItems } from '@/lib/exportVideo';
import type { BoardItem, Player, Position } from '@/types';
import { ballInGoal, holderOf } from './validate';
import type { DrillAnimation, DrillAnimationPhase, Kick } from './types';

// ══════════════════════════════════════════════════════════════
//  BEVEGELSEN I EN OVERGANG – felles for 2D, 3D og begge videoene
//
//  Spillerne og utstyret glir i rett linje, som på brettet. Ballen følger
//  ballholderen under føring (og går rundt spilleren i en vending). Spilles
//  den, holder pasningsleggeren den litt, så reiser den synlig til mottakeren
//  eller målet: langs bakken ved pasning, i en lav bue ved sentring og skudd.
//
//  `kitScale` < 1 når 2D tegner draktene mindre enn zoomen (framing.ts):
//  da ligger ballen tilsvarende nærmere drakten, så den ikke svever unna.
// ══════════════════════════════════════════════════════════════

/** Så stor del av overgangen pasningsleggeren har ballen før den spilles. */
export const KICK_AT = 0.3;

export interface BallFlight {
  kind: Kick;
  /** Hvor ballen ble spilt fra, og hvor den skal. */
  from: Position;
  to: Position;
  /** 0–1 langs streken. */
  progress: number;
}

export interface MotionFrame {
  players: Player[];
  ball: Position;
  items: BoardItem[];
  /** Meter over gresset (bare 3D). */
  ballHeight: number;
  /** Mens ballen er på vei etter en pasning, sentring eller et skudd. */
  flight: BallFlight | null;
}

const lerp = (a: Position, b: Position, t: number): Position => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const add = (a: Position, b: Position, scale = 1): Position => ({ x: a.x + b.x * scale, y: a.y + b.y * scale });
const smooth = (t: number) => { const k = Math.min(1, Math.max(0, t)); return k * k * (3 - 2 * k); };

/** Hvordan ballen spilles inn i fasen `to`, eller null når ballholderen beholder den. */
export function kickInto(from: DrillAnimationPhase, to: DrillAnimationPhase): Kick | null {
  if (to.kick) return to.kick;
  const passer = holderOf(from);
  if (!passer) return null;
  if (ballInGoal(to.ball, to.items)) return 'shot';
  const receiver = holderOf(to);
  return receiver && receiver.id !== passer.id ? 'pass' : null;
}

/** Ballen slik den tegnes i en fase: hos ballholderen, med avstanden skalert som drakten. */
function shownBall(phase: DrillAnimationPhase, kitScale: number): Position {
  const holder = holderOf(phase);
  if (!holder || kitScale === 1 || ballInGoal(phase.ball, phase.items)) return phase.ball;
  return add(holder.position, { x: phase.ball.x - holder.position.x, y: phase.ball.y - holder.position.y }, kitScale);
}

/** Fra en side av spilleren til en annen, rundt spilleren. `fullTurn`: en hel runde om sidene er nesten like. */
function swing(a: Position, b: Position, k: number, fullTurn: boolean): Position {
  const ra = Math.hypot(a.x, a.y), rb = Math.hypot(b.x, b.y);
  const angleA = Math.atan2(a.y, a.x), angleB = Math.atan2(b.y, b.x);
  let turn = Math.atan2(Math.sin(angleB - angleA), Math.cos(angleB - angleA));
  if (fullTurn && Math.abs(turn) < Math.PI / 2) turn += turn >= 0 ? 2 * Math.PI : -2 * Math.PI;
  const r = ra + (rb - ra) * k, angle = angleA + turn * k;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
}

/**
 * Ballens plass i forhold til ballholderen under føring: først i løperetningen,
 * så rundt til siden den skal ligge på i neste fase (vendingen).
 */
function dribbleOffset(start: Position, end: Position, from: Position, to: Position, t: number, turn: boolean): Position {
  const run = { x: end.x - start.x, y: end.y - start.y };
  const length = Math.hypot(run.x, run.y);
  if (length < 2) return swing(from, to, smooth(t), turn);
  const reach = Math.hypot(from.x, from.y) || Math.hypot(to.x, to.y);
  const ahead = { x: run.x / length * reach, y: run.y / length * reach };
  const turnAt = turn ? 0.62 : 0.8;
  if (t < 0.2) return swing(from, ahead, smooth(t / 0.2), false);
  if (t < turnAt) return ahead;
  return swing(ahead, to, smooth((t - turnAt) / (1 - turnAt)), turn);
}

/** Høyden i meter: bakken ved pasning, en lav bue ved sentring og skudd. */
function flightHeight(kind: Kick, from: Position, to: Position, k: number, animation: DrillAnimation) {
  if (kind === 'pass') return 0;
  const a = boardToWorld(from, animation.sport), b = boardToWorld(to, animation.sport);
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  const peak = kind === 'cross' ? Math.min(3, Math.max(1.4, length * 0.4)) : Math.min(0.9, Math.max(0.4, length * 0.1));
  return 4 * peak * k * (1 - k);
}

/**
 * Alt på banen i overgangen fra fasen `from` (t = 0–1). Står avspillingen
 * stille (`moving` usann), vises fasen `from` slik den er.
 */
export function drillMotion(animation: DrillAnimation, from: number, t: number, moving: boolean, kitScale = 1): MotionFrame {
  const phases = animation.phases;
  const a = phases[from], b = phases[from + 1];
  if (!moving || !b || t <= 0) {
    return { players: a.players, ball: shownBall(a, kitScale), items: a.items ?? [], ballHeight: 0, flight: null };
  }
  const players = interpolatePlayers(a, phases, from, t, true);
  const items = interpolateItems(a.items, b.items, t);
  const at = (id: string, phase: DrillAnimationPhase) => phase.players.find(p => p.id === id)?.position;
  const now = (id: string) => players.find(p => p.id === id)?.position;
  const passer = holderOf(a);
  const offsetFrom = passer ? { x: (a.ball.x - passer.position.x) * kitScale, y: (a.ball.y - passer.position.y) * kitScale } : null;
  const kick = kickInto(a, b);

  if (!kick) {
    const keeper = holderOf(b);
    if (passer && keeper && keeper.id === passer.id) {
      const start = at(passer.id, a)!, end = at(passer.id, b)!;
      const offsetTo = { x: (b.ball.x - end.x) * kitScale, y: (b.ball.y - end.y) * kitScale };
      const ball = add(now(passer.id)!, dribbleOffset(start, end, offsetFrom!, offsetTo, t, !!b.turn));
      return { players, ball, items, ballHeight: 0, flight: null };
    }
    return { players, ball: lerp(shownBall(a, kitScale), shownBall(b, kitScale), t), items, ballHeight: 0, flight: null };
  }

  // Pasningsleggeren har ballen til den spilles.
  if (t <= KICK_AT) {
    const ball = passer ? add(now(passer.id)!, offsetFrom!) : a.ball;
    return { players, ball, items, ballHeight: 0, flight: null };
  }
  const launch = passer
    ? add(lerp(at(passer.id, a)!, at(passer.id, b) ?? at(passer.id, a)!, KICK_AT), offsetFrom!)
    : a.ball;
  const target = shownBall(b, kitScale);
  const k = (t - KICK_AT) / (1 - KICK_AT);
  // En pasning ruller ut mot mottakeren; sentring og skudd holder farten.
  const progress = kick === 'pass' ? 1 - (1 - k) * (1 - k) : k;
  return {
    players, items,
    ball: lerp(launch, target, progress),
    ballHeight: flightHeight(kick, launch, target, k, animation),
    flight: { kind: kick, from: launch, to: target, progress },
  };
}

/**
 * Compile the immutable drill once. Each phase owns its player/item/ball buffers;
 * sample() only changes numbers, never allocates arrays, objects or closures.
 * The returned frame is borrowed until the next sample (exports use drillMotion).
 */
export function createMotionSampler(animation: DrillAnimation, kitScale = 1) {
  const phases = animation.phases;
  const compiled = phases.map((a, index) => {
    const b = phases[index + 1] ?? a;
    const players = a.players.map(p => ({ ...p, position: { ...p.position } }));
    const items = (a.items ?? []).map(item => ({ ...item, position: { ...item.position } }));
    const targets = a.players.map(p => b.players.find(next => next.id === p.id) ?? p);
    const itemTargets = (a.items ?? []).map(item => b.items?.find(next => next.id === item.id) ?? item);
    const startBall = shownBall(a, kitScale), targetBall = shownBall(b, kitScale);
    const passer = holderOf(a), receiver = holderOf(b);
    const passerIndex = passer ? a.players.findIndex(p => p.id === passer.id) : -1;
    const start = passer?.position ?? a.ball;
    const end = passerIndex < 0 ? start : targets[passerIndex].position;
    const offset = { x: (a.ball.x - start.x) * kitScale, y: (a.ball.y - start.y) * kitScale };
    const endOffset = { x: (b.ball.x - end.x) * kitScale, y: (b.ball.y - end.y) * kitScale };
    const kick = kickInto(a, b);
    const launch = passer ? add(lerp(start, end, KICK_AT), offset) : a.ball;
    const peak = kick ? flightHeight(kick, launch, targetBall, .5, animation) : 0;
    const flight: BallFlight = { kind: kick ?? 'pass', from: launch, to: targetBall, progress: 0 };
    const frame: MotionFrame = { players, items, ball: { ...startBall }, ballHeight: 0, flight: null };
    return { a, b, frame, targets, itemTargets, startBall, targetBall, passerIndex, start, end,
      offset, endOffset, kick, launch, peak, flight, dribble: !!passer && passer.id === receiver?.id };
  });
  const offsetBuffer = { x: 0, y: 0 };
  return {
    sample(from: number, t: number, moving: boolean): MotionFrame {
      const c = compiled[from], f = c.frame;
      const k = moving && from < phases.length - 1 && t > 0 ? t : 0;
      for (let i = 0; i < f.players.length; i++) {
        const a = c.a.players[i].position, b = c.targets[i].position, out = f.players[i].position;
        out.x = a.x + (b.x - a.x) * k; out.y = a.y + (b.y - a.y) * k;
      }
      for (let i = 0; i < f.items.length; i++) {
        const a = c.a.items![i], b = c.itemTargets[i], out = f.items[i];
        out.position.x = a.position.x + (b.position.x - a.position.x) * k;
        out.position.y = a.position.y + (b.position.y - a.position.y) * k;
        const r = a.rotation ?? 0;
        out.rotation = r + (((b.rotation ?? 0) - r + 540) % 360 - 180) * k;
      }
      f.flight = null; f.ballHeight = 0;
      if (!k) {
        f.ball.x = c.startBall.x; f.ball.y = c.startBall.y;
      } else if (!c.kick) {
        if (c.dribble) {
          dribbleOffsetInto(offsetBuffer, c.start, c.end, c.offset, c.endOffset, k, !!c.b.turn);
          const holder = f.players[c.passerIndex].position;
          f.ball.x = holder.x + offsetBuffer.x; f.ball.y = holder.y + offsetBuffer.y;
        } else {
          f.ball.x = c.startBall.x + (c.targetBall.x - c.startBall.x) * k;
          f.ball.y = c.startBall.y + (c.targetBall.y - c.startBall.y) * k;
        }
      } else if (k <= KICK_AT) {
        const holder = c.passerIndex < 0 ? null : f.players[c.passerIndex].position;
        f.ball.x = holder ? holder.x + c.offset.x : c.a.ball.x;
        f.ball.y = holder ? holder.y + c.offset.y : c.a.ball.y;
      } else {
        const travel = (k - KICK_AT) / (1 - KICK_AT);
        const progress = c.kick === 'pass' ? 1 - (1 - travel) * (1 - travel) : travel;
        f.ball.x = c.launch.x + (c.targetBall.x - c.launch.x) * progress;
        f.ball.y = c.launch.y + (c.targetBall.y - c.launch.y) * progress;
        f.ballHeight = 4 * c.peak * travel * (1 - travel);
        c.flight.progress = progress; f.flight = c.flight;
      }
      return f;
    },
  };
}

function swingInto(out: Position, ax: number, ay: number, bx: number, by: number, k: number, fullTurn: boolean) {
  const ra = Math.hypot(ax, ay), rb = Math.hypot(bx, by);
  const angleA = Math.atan2(ay, ax), delta = Math.atan2(by, bx) - angleA;
  let turn = Math.atan2(Math.sin(delta), Math.cos(delta));
  if (fullTurn && Math.abs(turn) < Math.PI / 2) turn += turn >= 0 ? 2 * Math.PI : -2 * Math.PI;
  const radius = ra + (rb - ra) * k, angle = angleA + turn * k;
  out.x = Math.cos(angle) * radius; out.y = Math.sin(angle) * radius;
}

function dribbleOffsetInto(out: Position, start: Position, end: Position, from: Position, to: Position, t: number, turn: boolean) {
  const dx = end.x - start.x, dy = end.y - start.y, length = Math.hypot(dx, dy);
  if (length < 2) { swingInto(out, from.x, from.y, to.x, to.y, smooth(t), turn); return; }
  const reach = Math.hypot(from.x, from.y) || Math.hypot(to.x, to.y);
  const ax = dx / length * reach, ay = dy / length * reach, turnAt = turn ? .62 : .8;
  if (t < .2) swingInto(out, from.x, from.y, ax, ay, smooth(t / .2), false);
  else if (t < turnAt) { out.x = ax; out.y = ay; }
  else swingInto(out, ax, ay, to.x, to.y, smooth((t - turnAt) / (1 - turnAt)), turn);
}
