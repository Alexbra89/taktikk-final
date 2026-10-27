import { VW, VH } from '@/data/formations';
import { ITEM_RADIUS } from '@/data/boardItems';
import type { BoardItem, Player, Position } from '@/types';
import type { DrillAnimation, DrillAnimationPhase } from './types';

// ══════════════════════════════════════════════════════════════
//  VALIDERING AV ANIMASJONENE
//
//  Kjøres på alle animasjoner i testene (validate.test.ts). Reglene:
//  posisjonene er innenfor banen, ingen spillere står oppå hverandre
//  (heller ikke mens de glir fra fase til fase), ballen er alltid hos en spiller (og dermed på vei mellom to i
//  overgangene), 3–8 faser, tekst på hver fase og at øvelsen finnes.
//  Eneste unntak for ballen: i siste fase kan den ligge i mål, eller være
//  bokset ut av keeperen (punch). En pasning, sentring eller et skudd (kick)
//  går fra én spiller til en annen eller i mål. Den som slenger seg (dive),
//  står i rollelista; en fanget ball (held) er hos en spiller. Er flere
//  baller i spill, er de ekstra ballene utstyr: de kan ligge fritt, men
//  spilles de (itemKicks), gjelder samme regel som for hovedballen.
// ══════════════════════════════════════════════════════════════

/** Banens ytre linjer slik FootballPitch tegner dem (32 enheter inn fra kanten). */
export const PITCH_BOUNDS = { left: 32, right: VW - 32, top: 32, bottom: VH - 32 };
/** Kortere avstand enn dette mellom to spillere, og draktene dekker hverandre. */
export const MIN_PLAYER_GAP = 30;
/** Så nær en spiller må ballen ligge for å være «hos» spilleren. */
export const BALL_REACH = 30;
export const MIN_PHASES = 3;
/** 8 faser ved 1× er ca. 10 s, under grensen på 12 s for hele øvelsen. */
export const MAX_PHASES = 8;
/** Fase-tekstene skal være korte. */
export const MAX_TEXT_LENGTH = 110;
export const MAX_HIGHLIGHT_LENGTH = 16;

/** Målboksene bak mållinjene, som FootballPitch tegner dem. */
const GOAL_HALF = 36;
const BIG_GOALS = [
  { left: 10, right: 32 },
  { left: VW - 32, right: VW - 10 },
];

const dist = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Minste avstand mellom to spillere som glir i rett linje fra a0/b0 til a1/b1
 * i samme takt, slik faseklokka flytter dem (interpolatePlayers).
 */
export function closestGap(a0: Position, a1: Position, b0: Position, b1: Position): number {
  const dx = a0.x - b0.x, dy = a0.y - b0.y;
  const vx = a1.x - b1.x - dx, vy = a1.y - b1.y - dy;
  const speed = vx * vx + vy * vy;
  const t = speed === 0 ? 0 : Math.max(0, Math.min(1, -(dx * vx + dy * vy) / speed));
  return Math.hypot(dx + vx * t, dy + vy * t);
}

const insidePitch = (p: Position) =>
  p.x >= PITCH_BOUNDS.left && p.x <= PITCH_BOUNDS.right && p.y >= PITCH_BOUNDS.top && p.y <= PITCH_BOUNDS.bottom;

/** Ballen ligger i et av de store målene, eller i et småmål på banen. */
export function ballInGoal(ball: Position, items: BoardItem[] = []): boolean {
  const inBig = BIG_GOALS.some(g =>
    ball.x >= g.left && ball.x <= g.right && Math.abs(ball.y - VH / 2) <= GOAL_HALF);
  const inSmall = items.some(i => i.type === 'minigoal' && dist(i.position, ball) <= ITEM_RADIUS.minigoal);
  return inBig || inSmall;
}

/** Nærmeste spiller innenfor rekkevidde av ballen, eller ingen. */
function nearest(players: Player[], ball: Position): Player | undefined {
  let best: Player | undefined, bestDistance = BALL_REACH;
  for (const player of players) {
    const d = dist(player.position, ball);
    if (d <= bestDistance) { best = player; bestDistance = d; }
  }
  return best;
}

/** Spilleren ballen er hos i fasen (nærmeste innenfor rekkevidde), eller ingen. */
export function holderOf(phase: DrillAnimationPhase): Player | undefined {
  return nearest(phase.players, phase.ball);
}

/**
 * Feilene i én animasjon, som lesbare setninger. Tom liste = gyldig.
 * `drillIds` er id-ene til øvelsene i biblioteket.
 */
export function validateDrillAnimation(animation: DrillAnimation, drillIds: Iterable<string>): string[] {
  const errors: string[] = [];
  const known = new Set(drillIds);
  const cast = Object.keys(animation.cast);
  const phases = animation.phases;

  if (!known.has(animation.drillId)) errors.push(`Øvelsen «${animation.drillId}» finnes ikke.`);
  if (phases.length < MIN_PHASES || phases.length > MAX_PHASES) {
    errors.push(`Har ${phases.length} faser; skal ha ${MIN_PHASES}–${MAX_PHASES}.`);
  }
  if (cast.length === 0) errors.push('Har ingen spillere.');
  if (new Set(phases.map(p => p.id)).size !== phases.length) errors.push('To faser har samme id.');

  const firstItems = (phases[0]?.items ?? []).map(i => i.id).sort().join(',');

  phases.forEach((phase, index) => {
    const at = `Fase ${index + 1}`;
    const last = index === phases.length - 1;

    if (!phase.name.trim()) errors.push(`${at}: mangler navn.`);
    const text = phase.text?.trim() ?? '';
    if (!text) errors.push(`${at}: mangler tekst.`);
    else if (text.length > MAX_TEXT_LENGTH) errors.push(`${at}: teksten er lengre enn ${MAX_TEXT_LENGTH} tegn.`);
    if (phase.highlight !== undefined) {
      const highlight = phase.highlight.trim();
      if (!highlight || highlight.length > MAX_HIGHLIGHT_LENGTH) {
        errors.push(`${at}: markeringen skal ha 1–${MAX_HIGHLIGHT_LENGTH} tegn.`);
      }
    }

    // Samme spillere i hver fase, ellers kan de ikke gli fra fase til fase.
    const ids = phase.players.map(p => p.id);
    for (const id of cast) if (!ids.includes(id)) errors.push(`${at}: spiller «${id}» mangler.`);
    for (const id of ids) if (!cast.includes(id)) errors.push(`${at}: spiller «${id}» står ikke i rollelista.`);
    if (new Set(ids).size !== ids.length) errors.push(`${at}: samme spiller står flere ganger.`);

    const items = phase.items ?? [];
    if (items.map(i => i.id).sort().join(',') !== firstItems) errors.push(`${at}: utstyret er ikke det samme som i fase 1.`);

    for (const p of phase.players) {
      if (!insidePitch(p.position)) errors.push(`${at}: spiller «${p.id}» står utenfor banen.`);
    }
    for (const item of items) {
      if (!insidePitch(item.position)) errors.push(`${at}: utstyret «${item.id}» står utenfor banen.`);
    }

    for (let i = 0; i < phase.players.length; i++) {
      for (let j = i + 1; j < phase.players.length; j++) {
        const a = phase.players[i], b = phase.players[j];
        if (dist(a.position, b.position) < MIN_PLAYER_GAP) {
          errors.push(`${at}: «${a.id}» og «${b.id}» står oppå hverandre.`);
        }
      }
    }

    // Underveis fra forrige fase. Står de for tett i en fase, er det meldt over.
    const before = phases[index - 1]?.players ?? [];
    const from = new Map(before.map(p => [p.id, p.position]));
    for (let i = 0; i < phase.players.length; i++) {
      for (let j = i + 1; j < phase.players.length; j++) {
        const a = phase.players[i], b = phase.players[j];
        const a0 = from.get(a.id), b0 = from.get(b.id);
        if (!a0 || !b0 || dist(a0, b0) < MIN_PLAYER_GAP || dist(a.position, b.position) < MIN_PLAYER_GAP) continue;
        if (closestGap(a0, a.position, b0, b.position) < MIN_PLAYER_GAP) {
          errors.push(`Fase ${index}–${index + 1}: «${a.id}» og «${b.id}» går gjennom hverandre.`);
        }
      }
    }

    const scored = ballInGoal(phase.ball, items);
    const withPlayer = phase.players.some(p => dist(p.position, phase.ball) <= BALL_REACH);
    const punched = phase.kick === 'punch';
    if (scored && !last) errors.push(`${at}: ballen ligger i mål før siste fase.`);
    else if (punched && !last) errors.push(`${at}: en boksing avslutter øvelsen, så den må være i siste fase.`);
    else if (!scored && !withPlayer && !punched) errors.push(`${at}: ballen er ikke hos en spiller.`);
    if (punched && withPlayer) errors.push(`${at}: ballen er bokset, men ligger hos en spiller.`);
    for (const id of phase.dive ?? []) if (!cast.includes(id)) errors.push(`${at}: «${id}» slenger seg, men står ikke i rollelista.`);
    if (phase.held && !holderOf(phase)) errors.push(`${at}: ballen er fanget, men ingen har den.`);
    if (!scored && !insidePitch(phase.ball)) errors.push(`${at}: ballen er utenfor banen.`);

    // En pasning, sentring eller et skudd går fra en spiller til en annen spiller eller i mål.
    if (phase.kick) {
      const passer = index > 0 ? holderOf(phases[index - 1]) : undefined;
      if (!passer) errors.push(`${at}: ballen spilles, men ingen har den i fasen før.`);
      else if (!scored && holderOf(phase)?.id === passer.id) errors.push(`${at}: ballen spilles, men ingen andre tar imot.`);
    }
    if (phase.turn && (index === 0 || !holderOf(phase))) errors.push(`${at}: vendingen trenger en spiller med ball.`);

    // Ekstra baller (utstyr) når flere baller er i spill: samme regel for slaget.
    // Utenom slaget kan en ekstra ball ligge fritt, f.eks. etter en redning.
    for (const [id, with_] of Object.entries(phase.itemsWith ?? {})) {
      const ball = items.find(i => i.id === id), player = phase.players.find(p => p.id === with_);
      if (!ball || !player || dist(ball.position, player.position) > BALL_REACH) errors.push(`${at}: ballen «${id}» skal være hos «${with_}», men er ikke det.`);
    }
    for (const id of Object.keys(phase.itemKicks ?? {})) {
      const ball = items.find(i => i.id === id);
      if (ball?.type !== 'ball') { errors.push(`${at}: «${id}» spilles, men er ikke en ball i utstyret.`); continue; }
      const prev = phases[index - 1];
      const before = prev?.items?.find(i => i.id === id);
      const passer = prev && before ? nearest(prev.players, before.position) : undefined;
      if (!passer) errors.push(`${at}: ballen «${id}» spilles, men ingen har den i fasen før.`);
      else if (nearest(phase.players, ball.position)?.id === passer.id) errors.push(`${at}: ballen «${id}» spilles, men ingen andre tar imot.`);
    }
  });

  return errors;
}
