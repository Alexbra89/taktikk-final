import { boardToWorld, figureScale } from '@/components/board/three/coordinates';
import type { FigurePose } from '@/components/board/BoardStage';
import { VW } from '@/data/formations';
import type { BoardItem, Player, Position } from '@/types';
import { ballInGoal, holderOf } from './validate';
import type { DrillAnimation, DrillAnimationPhase, Kick } from './types';

// ══════════════════════════════════════════════════════════════
//  BEVEGELSEN I EN OVERGANG – felles for 2D, 3D og begge videoene
//
//  Spillerne og utstyret glir i rett linje, som på brettet. Ballen følger
//  ballholderen under føring (og går rundt spilleren i en vending). Spilles
//  den, holder pasningsleggeren den litt, så reiser den synlig til mottakeren
//  eller målet: langs bakken ved pasning, i en bue ved sentring, høy ball og
//  boksing, og raskt og lavt ved skudd. En keeper som slenger seg, tippes
//  over på siden sent i bevegelsen (pose); en fanget ball ligger i hendene
//  (brysthøyde i 3D, inntil drakten i 2D).
//
//  Alt regnes ut av createMotionSampler, som skriver i faste buffere (3D og
//  2D-avspillingen leser den i hvert bilde). drillMotion gir en kopi.
//
//  `kitScale` < 1 når 2D tegner draktene mindre enn zoomen (framing.ts):
//  da ligger ballen tilsvarende nærmere drakten, så den ikke svever unna.
// ══════════════════════════════════════════════════════════════

/** Så stor del av overgangen pasningsleggeren har ballen før en pasning eller sentring spilles. */
export const KICK_AT = 0.3;

/** Når ballen forlater spilleren. Et skudd kommer sent og går fort; boksing, avbøyning og takling med en gang. */
export function kickAt(kind: Kick) {
  return kind === 'shot' ? 0.5 : kind === 'punch' || kind === 'tackle' ? 0.15 : kind === 'deflect' ? 0 : KICK_AT;
}

export interface BallFlight {
  kind: Kick;
  /** Hvor ballen ble spilt fra, og hvor den skal. */
  from: Position;
  to: Position;
  /** 0–1 langs streken. */
  progress: number;
}

/** En spiller i et bilde. `pose` finnes bare for spillere som slenger seg en gang i øvelsen. */
export type MotionPlayer = Player & { pose?: FigurePose };

export interface MotionFrame {
  players: MotionPlayer[];
  ball: Position;
  items: BoardItem[];
  /** Meter over gresset (bare 3D; 2D gjør ballen litt større). */
  ballHeight: number;
  /** Mens ballen er på vei etter en pasning, sentring eller et skudd. */
  flight: BallFlight | null;
}

const lerp = (a: Position, b: Position, t: number): Position => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const add = (a: Position, b: Position, scale = 1): Position => ({ x: a.x + b.x * scale, y: a.y + b.y * scale });
const smooth = (t: number) => { const k = Math.min(1, Math.max(0, t)); return k * k * (3 - 2 * k); };
/** Fallet kommer sent i bevegelsen: keeperen bestemmer seg sent. */
const leanAt = (t: number) => smooth((t - 0.35) / 0.65);
/** En fanget ball ligger nærmere drakten enn en ball ved foten. */
const HELD_OFFSET = 0.45;

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
  if (!holder || ballInGoal(phase.ball, phase.items)) return phase.ball;
  const scale = kitScale * (phase.held ? HELD_OFFSET : 1);
  if (scale === 1) return phase.ball;
  return add(holder.position, { x: phase.ball.x - holder.position.x, y: phase.ball.y - holder.position.y }, scale);
}

/** Brysthøyden til en figur i 3D (figurene er forstørret), lavere når den ligger. */
function heldHeight(animation: DrillAnimation, lean: number) {
  return figureScale(animation.sport) * (1.2 - 0.75 * lean);
}

/** Høyden i meter: bakken ved pasning, lav bue ved skudd, bue ved sentring, høyt over figurene ved høy ball og boksing. */
function flightPeak(kind: Kick, from: Position, to: Position, animation: DrillAnimation) {
  if (kind === 'pass' || kind === 'tackle') return 0;
  if (kind === 'high' || kind === 'punch') return 2.6 * figureScale(animation.sport);
  const a = boardToWorld(from, animation.sport), b = boardToWorld(to, animation.sport);
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  return kind === 'cross' ? Math.min(3, Math.max(1.4, length * 0.4)) : Math.min(0.9, Math.max(0.4, length * 0.1));
}

function swingInto(out: Position, ax: number, ay: number, bx: number, by: number, k: number, fullTurn: boolean) {
  const ra = Math.hypot(ax, ay), rb = Math.hypot(bx, by);
  const angleA = Math.atan2(ay, ax), delta = Math.atan2(by, bx) - angleA;
  let turn = Math.atan2(Math.sin(delta), Math.cos(delta));
  if (fullTurn && Math.abs(turn) < Math.PI / 2) turn += turn >= 0 ? 2 * Math.PI : -2 * Math.PI;
  const radius = ra + (rb - ra) * k, angle = angleA + turn * k;
  out.x = Math.cos(angle) * radius; out.y = Math.sin(angle) * radius;
}

/**
 * Ballens plass i forhold til ballholderen under føring: først i løperetningen,
 * så rundt til siden den skal ligge på i neste fase (vendingen).
 */
function dribbleOffsetInto(out: Position, start: Position, end: Position, from: Position, to: Position, t: number, turn: boolean) {
  const dx = end.x - start.x, dy = end.y - start.y, length = Math.hypot(dx, dy);
  if (length < 2) { swingInto(out, from.x, from.y, to.x, to.y, smooth(t), turn); return; }
  const reach = Math.hypot(from.x, from.y) || Math.hypot(to.x, to.y);
  const ax = dx / length * reach, ay = dy / length * reach, turnAt = turn ? .62 : .8;
  if (t < .2) swingInto(out, from.x, from.y, ax, ay, smooth(t / .2), false);
  else if (t < turnAt) { out.x = ax; out.y = ay; }
  else swingInto(out, ax, ay, to.x, to.y, smooth((t - turnAt) / (1 - turnAt)), turn);
}

const unit = (x: number, y: number, fallback: Position): Position => {
  const length = Math.hypot(x, y);
  return length < 1e-6 ? fallback : { x: x / length, y: y / length };
};

/**
 * Retningen hver spiller slenger seg i, fase for fase: dit spilleren beveger
 * seg inn i fasen, ellers dit ballen ligger, ellers som før. Ansiktet vender
 * mot banens midte, så keeperen ser ut mot spillet.
 */
function diveDirections(animation: DrillAnimation) {
  const divers = new Set(animation.phases.flatMap(p => p.dive ?? []));
  const result = animation.phases.map(() => new Map<string, Position>());
  for (const id of divers) {
    let last: Position = { x: 0, y: 1 };
    animation.phases.forEach((phase, i) => {
      const now = phase.players.find(p => p.id === id)?.position;
      const before = animation.phases[i - 1]?.players.find(p => p.id === id)?.position;
      if (now && before && Math.hypot(now.x - before.x, now.y - before.y) > 4) last = unit(now.x - before.x, now.y - before.y, last);
      else if (now && holderOf(phase)?.id === id) last = unit(phase.ball.x - now.x, phase.ball.y - now.y, last);
      result[i].set(id, last);
    });
  }
  return { divers, result };
}

const facing = (p: Position): Position => ({ x: p.x > VW / 2 ? -1 : 1, y: 0 });

/**
 * Compile the immutable drill once. Each phase owns its player/item/ball buffers;
 * sample() only changes numbers, never allocates arrays, objects or closures.
 * The returned frame is borrowed until the next sample (exports use drillMotion).
 */
export function createMotionSampler(animation: DrillAnimation, kitScale = 1) {
  const phases = animation.phases;
  const { divers, result: diveDir } = diveDirections(animation);
  const leanOf = (phase: DrillAnimationPhase, id: string) => phase.dive?.includes(id) ? 1 : 0;
  const compiled = phases.map((a, index) => {
    const b = phases[index + 1] ?? a;
    const players: MotionPlayer[] = a.players.map(p => ({
      ...p, position: { ...p.position },
      ...(divers.has(p.id) ? { pose: { lean: leanOf(a, p.id), face: facing(p.position), dive: { ...diveDir[index].get(p.id)! } } } : {}),
    }));
    const items = (a.items ?? []).map(item => ({ ...item, position: { ...item.position } }));
    const targets = a.players.map(p => b.players.find(next => next.id === p.id) ?? p);
    const leans = a.players.map(p => [leanOf(a, p.id), leanOf(b, p.id)] as const);
    // Mens spilleren reiser seg eller faller, peker fallet dit spilleren ligger.
    const dives = a.players.map(p => divers.has(p.id) ? diveDir[leanOf(b, p.id) ? index + 1 : index]?.get(p.id) ?? diveDir[index].get(p.id)! : null);
    const itemTargets = (a.items ?? []).map(item => b.items?.find(next => next.id === item.id) ?? item);
    const startBall = shownBall(a, kitScale), targetBall = shownBall(b, kitScale);
    const passer = holderOf(a), receiver = holderOf(b);
    const passerIndex = passer ? a.players.findIndex(p => p.id === passer.id) : -1;
    const receiverIndex = receiver ? a.players.findIndex(p => p.id === receiver.id) : -1;
    const start = passer?.position ?? a.ball;
    const end = passerIndex < 0 ? start : targets[passerIndex].position;
    const offset = { x: (startBall.x - start.x), y: (startBall.y - start.y) };
    const endOffset = { x: (targetBall.x - end.x), y: (targetBall.y - end.y) };
    const kick = kickInto(a, b);
    const release = kick ? kickAt(kick) : 0;
    const launch = passer ? add(lerp(start, end, release), offset) : a.ball;
    const height = (phase: DrillAnimationPhase, i: number, lean: number) => phase.held && i >= 0 ? heldHeight(animation, lean) : 0;
    const startHeight = height(a, passerIndex, passerIndex < 0 ? 0 : leans[passerIndex][0]);
    const endHeight = height(b, receiverIndex, receiverIndex < 0 ? 0 : leans[receiverIndex][1]);
    const peak = kick ? flightPeak(kick, launch, targetBall, animation) : 0;
    const flight: BallFlight = { kind: kick ?? 'pass', from: launch, to: targetBall, progress: 0 };
    const frame: MotionFrame = { players, items, ball: { ...startBall }, ballHeight: startHeight, flight: null };
    return { a, b, frame, targets, leans, dives, itemTargets, startBall, targetBall, passerIndex, start, end,
      offset, endOffset, kick, release, launch, peak, startHeight, endHeight, flight,
      dribble: !!passer && passer.id === receiver?.id };
  });
  const offsetBuffer = { x: 0, y: 0 };
  return {
    sample(from: number, t: number, moving: boolean): MotionFrame {
      const c = compiled[from], f = c.frame;
      const k = moving && from < phases.length - 1 && t > 0 ? t : 0;
      for (let i = 0; i < f.players.length; i++) {
        const a = c.a.players[i].position, b = c.targets[i].position, player = f.players[i], out = player.position;
        out.x = a.x + (b.x - a.x) * k; out.y = a.y + (b.y - a.y) * k;
        const pose = player.pose;
        if (pose) {
          const [l0, l1] = c.leans[i], dir = c.dives[i]!;
          pose.lean = l0 + (l1 - l0) * leanAt(k);
          pose.dive.x = dir.x; pose.dive.y = dir.y;
        }
      }
      for (let i = 0; i < f.items.length; i++) {
        const a = c.a.items![i], b = c.itemTargets[i], out = f.items[i];
        out.position.x = a.position.x + (b.position.x - a.position.x) * k;
        out.position.y = a.position.y + (b.position.y - a.position.y) * k;
        const r = a.rotation ?? 0;
        out.rotation = r + (((b.rotation ?? 0) - r + 540) % 360 - 180) * k;
      }
      f.flight = null; f.ballHeight = c.startHeight;
      if (!k) {
        f.ball.x = c.startBall.x; f.ball.y = c.startBall.y;
      } else if (!c.kick) {
        f.ballHeight = c.startHeight + (c.endHeight - c.startHeight) * smooth(k);
        if (c.dribble) {
          dribbleOffsetInto(offsetBuffer, c.start, c.end, c.offset, c.endOffset, k, !!c.b.turn);
          const holder = f.players[c.passerIndex].position;
          f.ball.x = holder.x + offsetBuffer.x; f.ball.y = holder.y + offsetBuffer.y;
        } else {
          f.ball.x = c.startBall.x + (c.targetBall.x - c.startBall.x) * k;
          f.ball.y = c.startBall.y + (c.targetBall.y - c.startBall.y) * k;
        }
      } else if (k <= c.release) {
        const holder = c.passerIndex < 0 ? null : f.players[c.passerIndex].position;
        f.ball.x = holder ? holder.x + c.offset.x : c.a.ball.x;
        f.ball.y = holder ? holder.y + c.offset.y : c.a.ball.y;
      } else {
        const travel = (k - c.release) / (1 - c.release);
        // En pasning ruller ut mot mottakeren; de andre holder farten.
        const progress = c.kick === 'pass' || c.kick === 'tackle' ? 1 - (1 - travel) * (1 - travel) : travel;
        f.ball.x = c.launch.x + (c.targetBall.x - c.launch.x) * progress;
        f.ball.y = c.launch.y + (c.targetBall.y - c.launch.y) * progress;
        f.ballHeight = c.startHeight + (c.endHeight - c.startHeight) * travel + 4 * c.peak * travel * (1 - travel);
        c.flight.progress = progress; f.flight = c.flight;
      }
      return f;
    },
  };
}

const samplers = new WeakMap<DrillAnimation, Map<number, ReturnType<typeof createMotionSampler>>>();

/**
 * Alt på banen i overgangen fra fasen `from` (t = 0–1), som en egen kopi.
 * Står avspillingen stille (`moving` usann), vises fasen `from` slik den er.
 */
export function drillMotion(animation: DrillAnimation, from: number, t: number, moving: boolean, kitScale = 1): MotionFrame {
  let byScale = samplers.get(animation);
  if (!byScale) samplers.set(animation, byScale = new Map());
  let sampler = byScale.get(kitScale);
  if (!sampler) byScale.set(kitScale, sampler = createMotionSampler(animation, kitScale));
  const f = sampler.sample(from, t, moving);
  return {
    players: f.players.map(p => ({ ...p, position: { ...p.position }, ...(p.pose ? { pose: { ...p.pose, face: { ...p.pose.face }, dive: { ...p.pose.dive } } } : {}) })),
    ball: { ...f.ball },
    items: f.items.map(item => ({ ...item, position: { ...item.position } })),
    ballHeight: f.ballHeight,
    flight: f.flight ? { ...f.flight, from: { ...f.flight.from }, to: { ...f.flight.to } } : null,
  };
}
