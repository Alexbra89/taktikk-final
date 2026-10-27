import { VW, VH, DEFAULT_FORMATION, getFormationSlots } from '@/data/formations';
import { ROLE_INFO } from '@/data/roleInfo';
import { PITCHES } from '@/components/board/three/coordinates';
import { colorFields } from '@/components/board/drawTools';
import type { BoardItem, BoardItemType, DrawColorKey, Drawing, Player, Position, Sport } from '@/types';
import type { CastMember, DrillAnimation, DrillAnimationPhase, Kick } from './types';

// ══════════════════════════════════════════════════════════════
//  BYGGER FOR ANIMASJONENE
//
//  Animasjonene skrives i meter fra banens midtpunkt (x langs banen,
//  y på tvers), slik at avstandene i øvelsesteksten («10 m») kan brukes
//  direkte. Her blir de til en vanlig taktikk i brettets 880 × 560-format,
//  med samme omregning som 3D-visningen (boardToWorld baklengs).
// ══════════════════════════════════════════════════════════════

/** [x, y] i meter fra midtpunktet. x mot høyre mål, y mot nedre sidelinje. */
export type Metres = readonly [number, number];

/**
 * Hvor ballen er: hos en spiller (litt foran i retningen `dir`),
 * i et av de store målene, eller et fritt punkt i meter.
 */
export type BallSpec = Metres | { with: string; dir?: Metres } | { goal: 'left' | 'right' };

/**
 * Ny plass for utstyr: et punkt i meter, eller (for en ekstra ball) hos en
 * spiller, litt foran i retningen `dir`. En ball hos en spiller følger
 * spilleren i de neste fasene, til en senere fase flytter den igjen.
 */
export type ItemMove = Metres | { with: string; dir?: Metres };

export interface PhaseSpec {
  name: string;
  text: string;
  highlight?: string;
  /** Spillere som ikke står her, blir stående der de var i fasen før. */
  players: Record<string, Metres>;
  ball: BallSpec;
  /** Ballen spilles på vei inn i fasen (se DrillAnimationPhase.kick). */
  kick?: Kick;
  /** Ballholderen vender på slutten av bevegelsen. */
  turn?: boolean;
  /** Spillere som slenger seg i fasen (se DrillAnimationPhase.dive). */
  dive?: string[];
  /** Ballholderen har ballen i hendene. */
  held?: boolean;
  /**
   * Utstyr som flytter seg inn i denne fasen (id → ny plass), f.eks. en ekstra
   * ball når to baller er i spill samtidig. Det glir i rett linje, som spillerne,
   * og blir stående der til en senere fase flytter det igjen.
   */
  moveItems?: Record<string, ItemMove>;
  /**
   * Ekstra baller (utstyr) som spilles på vei inn i fasen (id → slag), når
   * flere baller er i spill samtidig. Ballen holdes av spilleren som har den,
   * og reiser så til der moveItems legger den, som hovedballen gjør.
   */
  kickItems?: Record<string, Kick>;
}

export interface AnimationSpec {
  drillId: string;
  name: string;
  sport: Sport;
  /** Rekkefølgen gir draktnumrene 1, 2, 3 … */
  cast: Record<string, CastMember>;
  /** Utstyr i alle faser: kjegler, småmål, dukker. Står fast, om ikke en fase flytter det (moveItems). */
  items?: { id: string; type: BoardItemType; at: Metres; rotation?: number }[];
  /** Faste tekster på banen, f.eks. kjeglefarger. */
  labels?: { id: string; at: Metres; text: string; color: DrawColorKey }[];
  phases: PhaseSpec[];
}

/** Hvor langt foran spilleren ballen ligger, i brettets enheter. Utenfor drakten, så den synes i 2D. */
export const BALL_OFFSET = 18;

/** Midt i målboksene FootballPitch tegner bak mållinjene (x = 10–32 og 848–870). */
export const GOAL_SPOTS: Record<'left' | 'right', Position> = {
  left: { x: 21, y: VH / 2 },
  right: { x: VW - 21, y: VH / 2 },
};

const round = (v: number) => Math.round(v * 10) / 10;

/** Meter fra midtpunktet → brettets koordinater for valgt banestørrelse. */
export function metresToBoard(sport: Sport, [mx, my]: Metres): Position {
  const pitch = PITCHES[sport];
  return {
    x: round(VW / 2 + mx * (VW - 64) / pitch.length),
    y: round(VH / 2 + my * (VH - 64) / pitch.width),
  };
}

/** Formasjonsplass med samme draktfarge, så også 3D-videoeksporten får riktig farge. */
function slotIndices(sport: Sport, cast: Record<string, CastMember>): Record<string, number> {
  const slots = getFormationSlots(sport, DEFAULT_FORMATION[sport]);
  const used: Record<string, number> = {};
  const result: Record<string, number> = {};
  for (const [id, member] of Object.entries(cast)) {
    const matching = slots.flatMap((slot, i) => ROLE_INFO[slot.role].family === member.family ? [i] : []);
    const n = used[member.family] ?? 0;
    used[member.family] = n + 1;
    result[id] = matching.length ? matching[n % matching.length] : 0;
  }
  return result;
}

const isMetres = (spec: BallSpec): spec is Metres => Array.isArray(spec);

function ballPosition(spec: BallSpec, sport: Sport, players: Player[]): Position {
  if (isMetres(spec)) return metresToBoard(sport, spec);
  if ('goal' in spec) return { ...GOAL_SPOTS[spec.goal] };
  const holder = players.find(p => p.id === spec.with);
  // Ukjent spiller: midtpunktet. Valideringen melder at ballen ikke er hos noen.
  if (!holder) return { x: VW / 2, y: VH / 2 };
  const [dx, dy] = spec.dir ?? [1, 0];
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: round(holder.position.x + dx / len * BALL_OFFSET),
    y: round(holder.position.y + dy / len * BALL_OFFSET),
  };
}

/** Gjør en animasjon skrevet i meter om til en taktikk i brettets format. */
export function defineDrillAnimation(spec: AnimationSpec): DrillAnimation {
  const ids = Object.keys(spec.cast);
  const slots = slotIndices(spec.sport, spec.cast);
  const items = (spec.items ?? []).map((item): BoardItem => ({
    id: item.id, type: item.type, position: metresToBoard(spec.sport, item.at),
    ...(item.rotation !== undefined ? { rotation: item.rotation } : {}),
  }));
  const drawings = (spec.labels ?? []).map((label): Drawing => ({
    id: label.id, type: 'label', at: metresToBoard(spec.sport, label.at), text: label.text, ...colorFields(label.color),
  }));

  const previous = new Map<string, Position>();
  /** Ekstra baller som følger en spiller (id → spilleren og retningen). */
  const attached = new Map<string, { with: string; dir?: Metres }>();
  let phaseItems = items;
  const phases = spec.phases.map((phase, index): DrillAnimationPhase => {
    const players: Player[] = [];
    ids.forEach((id, i) => {
      const at = phase.players[id];
      const position = at ? metresToBoard(spec.sport, at) : previous.get(id);
      // Mangler spilleren helt, utelates den – valideringen melder det.
      if (!position) return;
      previous.set(id, position);
      players.push({ id, num: i + 1, name: '', slotIdx: slots[id], position, notes: '' });
    });

    const moves = phase.moveItems ?? {};
    const moved = new Map<string, Position>();
    for (const [id, move] of Object.entries(moves)) {
      if (!items.some(item => item.id === id)) throw new Error(`${spec.drillId}: «${id}» flyttes, men finnes ikke i utstyret.`);
      if (isMetres(move)) { attached.delete(id); moved.set(id, metresToBoard(spec.sport, move)); }
      else if (!ids.includes(move.with)) throw new Error(`${spec.drillId}: «${id}» skal være hos «${move.with}», som ikke står i rollelista.`);
      else attached.set(id, move);
    }
    const itemsWith: Record<string, string> = {};
    for (const [id, move] of attached) {
      moved.set(id, ballPosition(move, spec.sport, players));
      itemsWith[id] = move.with;
    }
    if (moved.size) {
      phaseItems = phaseItems.map(item => moved.has(item.id) ? { ...item, position: moved.get(item.id)! } : item);
    }
    return {
      id: `${spec.drillId}-fase-${index + 1}`,
      name: phase.name,
      players,
      ball: ballPosition(phase.ball, spec.sport, players),
      drawings,
      items: phaseItems,
      // Teksten er også fasens notat, så 3D-pillen og fullskjerm viser den.
      stickyNote: phase.text,
      text: phase.text,
      ...(phase.highlight ? { highlight: phase.highlight } : {}),
      ...(phase.kick ? { kick: phase.kick } : {}),
      ...(phase.turn ? { turn: true } : {}),
      ...(phase.dive?.length ? { dive: [...phase.dive] } : {}),
      ...(phase.held ? { held: true } : {}),
      ...(phase.kickItems && Object.keys(phase.kickItems).length ? { itemKicks: { ...phase.kickItems } } : {}),
      ...(Object.keys(itemsWith).length ? { itemsWith } : {}),
    };
  });

  return {
    id: `animasjon-${spec.drillId}`,
    name: spec.name,
    sport: spec.sport,
    formation: DEFAULT_FORMATION[spec.sport],
    phases,
    activePhaseIdx: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    drillId: spec.drillId,
    cast: spec.cast,
  };
}
