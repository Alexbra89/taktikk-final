// Rene hjelpere for taktikker, faser, spillere og plassering av utstyr.
import type { Sport, Tactic, TacticPhase, Player, Position, BoardItem, BoardItemType } from '../types';
import { VW, VH, DEFAULT_FORMATION, getFormations, getFormationSlots } from '../data/formations';
import { ITEM_RADIUS } from '../data/boardItems';
import type { AppStore } from './types';
import { uid } from './id';

export type Slots = ReturnType<typeof getFormationSlots>;

export const SPORTS: Sport[] = ['football', 'football5', 'football7', 'football9'];
export const isSport = (v: unknown): v is Sport => SPORTS.includes(v as Sport);
export const isPos = (p: unknown): p is Position =>
  !!p && Number.isFinite((p as Position).x) && Number.isFinite((p as Position).y);
export const centerBall = (): Position => ({ x: VW / 2, y: VH / 2 });
/** Innenfor brettet. Brukes ved lasting: en brikke langt utenfor kan ikke dras tilbake. */
export const inBoard = (p: Position): Position =>
  ({ x: Math.min(VW, Math.max(0, p.x)), y: Math.min(VH, Math.max(0, p.y)) });
export const newPlayerId = () => `p-${uid()}`;

export function createPhase(name: string, slots: Slots): TacticPhase {
  return {
    id: `phase-${uid()}`,
    name,
    players: slots.map((slot, i) => ({
      id: newPlayerId(), num: i + 1, name: '', slotIdx: i,
      position: { ...slot.position }, notes: '',
    })),
    ball: centerBall(),
    drawings: [],
    stickyNote: '',
  };
}

export function createTactic(name: string, sport: Sport, empty = false): Tactic {
  const formation = DEFAULT_FORMATION[sport] ?? getFormations(sport)[0].name;
  return {
    id: `tactic-${uid()}`,
    name, sport, formation,
    // Tom bane: bare banen og ballen. Spillerne legges til som utstyr.
    phases: [createPhase('Fase 1', empty ? [] : getFormationSlots(sport, formation))],
    activePhaseIdx: 0,
    createdAt: new Date().toISOString(),
    ...(empty ? { empty: true } : {}),
  };
}

/**
 * Sørger for at hver fase har nøyaktig én spiller per slot (0 ≤ slotIdx < slots.length).
 * Overflødige spillere fjernes. Manglende legges til på slotens posisjon, med samme
 * id og draktnummer i alle faser, slik at en spiller kan følges gjennom fasene.
 */
export function syncPlayers(phases: TacticPhase[], slots: Slots): TacticPhase[] {
  const n = slots.length;
  const shared = new Map<number, { id: string; num: number }>();
  const usedNums = new Set<number>();
  phases.forEach(ph => ph.players.forEach(p => usedNums.add(p.num)));

  const keptPerPhase = phases.map(ph => {
    const seen = new Set<number>();
    return ph.players.filter(p => {
      const ok = Number.isInteger(p.slotIdx) && p.slotIdx >= 0 && p.slotIdx < n && !seen.has(p.slotIdx);
      if (ok) seen.add(p.slotIdx);
      return ok;
    });
  });
  // Spilleren som står på sloten i en annen fase er den samme spilleren:
  // en manglende spiller får hans id og nummer, ikke en ny.
  keptPerPhase.forEach(kept => kept.forEach(p => {
    if (!shared.has(p.slotIdx)) shared.set(p.slotIdx, { id: p.id, num: p.num });
  }));

  return phases.map((ph, phaseIdx) => {
    const kept = keptPerPhase[phaseIdx];
    const seen = new Set(kept.map(p => p.slotIdx));
    const added: Player[] = [];
    for (let i = 0; i < n; i++) {
      if (seen.has(i)) continue;
      let t = shared.get(i);
      // Står id-en allerede på en annen slot i denne fasen (inkonsistent import),
      // får sloten en ny id – to spillere med samme id i én fase er verre.
      if (!t || kept.some(p => p.id === t!.id)) {
        let num = i + 1;
        while (usedNums.has(num)) num++;
        usedNums.add(num);
        t = { id: newPlayerId(), num };
        if (!shared.has(i)) shared.set(i, t);
      }
      added.push({ id: t.id, num: t.num, name: '', slotIdx: i, position: { ...slots[i].position }, notes: '' });
    }
    return { ...ph, players: [...kept, ...added].sort((a, b) => a.slotIdx - b.slotIdx) };
  });
}

/** Alle spillere i fasen går til posisjonen til sin egen slot. */
export const resetToSlots = (ph: TacticPhase, slots: Slots): TacticPhase => ({
  ...ph,
  players: ph.players.map(p => slots[p.slotIdx] ? { ...p, position: { ...slots[p.slotIdx].position } } : p),
});

export const patchActiveTactic = (s: AppStore, fn: (t: Tactic) => Tactic): Pick<AppStore, 'tactics'> => ({
  tactics: s.tactics.map(t => t.id === s.activeTacticId ? fn(t) : t),
});

export const patchPhase = (t: Tactic, idx: number, fn: (ph: TacticPhase) => TacticPhase): Tactic => ({
  ...t, phases: t.phases.map((ph, i) => i === idx ? fn(ph) : ph),
});

/**
 * Første ledige plass for et nytt element: langs toppen av banen, så langs
 * bunnen – der det sjelden står spillere. Bredden teller (en stige er 88
 * bred), så elementene aldri legges oppå hverandre, en spiller eller ballen.
 */
export function freeSpot(type: BoardItemType, ph: TacticPhase): Position {
  const r = ITEM_RADIUS[type];
  const taken = [
    ...(ph.items ?? []).map(it => ({ p: it.position, r: ITEM_RADIUS[it.type] })),
    ...ph.players.map(p => ({ p: p.position, r: 22 })),
    { p: ph.ball, r: 12 },
  ];
  const free = (x: number, y: number) =>
    taken.every(t => Math.abs(t.p.x - x) > t.r + r + 6 || Math.abs(t.p.y - y) > 34);
  for (const y of [70, 490, 130, 430]) {
    for (let x = 60 + r; x <= VW - 60 - r; x += 8) if (free(x, y)) return { x, y };
  }
  return centerBall();
}

/**
 * Endrer et element i aktiv fase og i fasene etter som fortsatt står likt –
 * der det ikke er flyttet (eller rotert) for seg. Den første fasen med egen
 * verdi stopper kopieringen, så en bevegelse lagt inn senere blir stående.
 * Tidligere faser røres ikke.
 */
export function patchItemForward(
  t: Tactic, itemId: string,
  same: (a: BoardItem, b: BoardItem) => boolean,
  apply: (it: BoardItem) => BoardItem,
): Tactic {
  const a = t.activePhaseIdx;
  const cur = t.phases[a]?.items?.find(i => i.id === itemId);
  if (!cur) return t;
  let following = true;
  return {
    ...t, phases: t.phases.map((ph, i) => {
      if (i < a || !following) return ph;
      if (i > a) {
        const it = ph.items?.find(x => x.id === itemId);
        if (!it || !same(it, cur)) { following = false; return ph; }
      }
      return { ...ph, items: (ph.items ?? []).map(x => x.id === itemId ? apply(x) : x) };
    }),
  };
}

export const samePos = (a: BoardItem, b: BoardItem) =>
  Math.abs(a.position.x - b.position.x) < 0.5 && Math.abs(a.position.y - b.position.y) < 0.5;
export const sameRot = (a: BoardItem, b: BoardItem) => (a.rotation ?? 0) === (b.rotation ?? 0);
