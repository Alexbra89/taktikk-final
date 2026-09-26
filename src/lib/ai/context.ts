import type { BoardItem, Drawing, PathDrawing, Position, Tactic, TacticPhase } from '@/types';
import { VW, VH } from '@/data/formations';
import { ROLE_INFO } from '@/data/roleInfo';
import { itemLabel } from '@/data/boardItems';
import { getSlot, SPORT_LABELS } from '@/store/selectors';

// ══════════════════════════════════════════════════════════════
//  AI-KONTEKST – det modellen får se av brettet
//
//  Bygges på klienten, så spillernavn og interne id-er aldri forlater
//  enheten. Bare det en trener ville lest av brettet tas med:
//  roller, posisjoner i prosent av banen, ball, utstyr og korte
//  tegninger. Spillere og utstyr får alias (P7, I1) i stedet for id.
// ══════════════════════════════════════════════════════════════

export interface AiPoint { x: number; y: number }

export interface AiPlayer {
  id: string;        // alias, f.eks. «P7»
  num: number;
  role: string;      // «Spiss»
  label: string;     // «SP»
  x: number;
  y: number;
}

export interface AiItem { id: string; type: string; x: number; y: number; rotation?: number }

export interface AiDrawing {
  type: string;
  from?: AiPoint;
  via?: AiPoint;
  to?: AiPoint;
  text?: string;
}

export interface AiBoardContext {
  format: string;
  ageGroup: string;
  formation: string;
  tactic: string;
  phase: { name: string; number: number; total: number };
  direction: string;
  players: AiPlayer[];
  ball: AiPoint | null;
  items: AiItem[];
  drawings: AiDrawing[];
  note?: string;
  previousPhase?: { name: string; players: { id: string; x: number; y: number }[]; ball: AiPoint | null };
}

export interface AiContextOptions {
  ageGroup?: 'youth' | 'adult';
  /** Ta med fasen før (til «Foreslå neste fase»). */
  includePrevious?: boolean;
}

const MAX_ITEMS = 30;
const MAX_DRAWINGS = 30;
const MAX_NOTE = 500;
const MAX_NAME = 60;
const MAX_LABEL = 40;

const finite = (p: unknown): p is Position =>
  !!p && Number.isFinite((p as Position).x) && Number.isFinite((p as Position).y);

const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** 880×560-brett → 0–100. x langs banen (mot motstanderens mål = 100), y på tvers. */
export function toPct(p: Position): AiPoint {
  return { x: clampPct((p.x / VW) * 100), y: clampPct((p.y / VH) * 100) };
}

const pct = (p: unknown): AiPoint | undefined => (finite(p) ? toPct(p) : undefined);

const cut = (s: unknown, max: number): string =>
  typeof s === 'string' ? s.trim().slice(0, max) : '';

/**
 * Alias per spiller-id: «P» + draktnummer. Har to spillere samme nummer,
 * får den neste «P7-2», slik at aliasene alltid er entydige.
 */
export function playerAliases(players: TacticPhase['players']): Map<string, string> {
  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const p of players) {
    if (!p || typeof p.id !== 'string' || out.has(p.id)) continue;
    const base = `P${Number.isInteger(p.num) ? p.num : '?'}`;
    let alias = base;
    for (let n = 2; used.has(alias); n++) alias = `${base}-${n}`;
    used.add(alias);
    out.set(p.id, alias);
  }
  return out;
}

const DRAWING_NAMES: Record<string, string> = {
  freehand: 'frihånd', arrow: 'pil (løp)', 'curved-arrow': 'buet pil', dashed: 'stiplet linje (pasning)',
  circle: 'sirkel', rectangle: 'rektangel', label: 'tekst',
};

/** Tegningen som noen få punkter. Frihånd blir start og slutt, ikke hundrevis av punkter. */
export function compactDrawing(d: Drawing): AiDrawing | null {
  if (!d || typeof d !== 'object') return null;
  const type = DRAWING_NAMES[d.type ?? 'freehand'];
  if (!type) return null;
  if (d.type === 'label') {
    const text = cut(d.text, MAX_LABEL);
    const at = pct(d.at);
    return text && at ? { type, from: at, text } : null;
  }
  if (d.type === 'circle' || d.type === 'rectangle') {
    const from = pct(d.start), to = pct(d.end);
    return from && to ? { type, from, to } : null;
  }
  const raw = (d as PathDrawing).pts;
  const pts = Array.isArray(raw) ? raw.filter(finite) : [];
  if (pts.length < 2) return null;
  const out: AiDrawing = { type, from: toPct(pts[0]), to: toPct(pts[pts.length - 1]) };
  if (d.type === 'curved-arrow' && pts.length >= 3) out.via = toPct(pts[1]);
  return out;
}

function compactItems(items: BoardItem[] | undefined): AiItem[] {
  const out: AiItem[] = [];
  for (const it of Array.isArray(items) ? items : []) {
    if (out.length >= MAX_ITEMS) break;
    if (!it || !finite(it.position)) continue;
    const { x, y } = toPct(it.position);
    const rot = Number.isFinite(it.rotation) ? Math.round(it.rotation as number) % 360 : 0;
    out.push({ id: `I${out.length + 1}`, type: itemLabel(it.type).toLowerCase(), x, y, ...(rot ? { rotation: rot } : {}) });
  }
  return out;
}

/**
 * Kompakt, semantisk utdrag av aktiv fase. Returnerer null hvis fasen ikke finnes.
 * Spillernavn, notater per spiller og interne id-er tas aldri med.
 */
export function buildAiContext(tactic: Tactic, phaseIdx: number, opts: AiContextOptions = {}): AiBoardContext | null {
  const phase = tactic?.phases?.[phaseIdx];
  if (!phase) return null;

  const players = Array.isArray(phase.players) ? phase.players : [];
  const aliases = playerAliases(players);

  const aiPlayers: AiPlayer[] = [];
  for (const p of players) {
    const alias = aliases.get(p?.id);
    if (!alias || !finite(p.position)) continue;
    const slot = getSlot(tactic, p.slotIdx);
    aiPlayers.push({
      id: alias, num: p.num,
      role: ROLE_INFO[slot.role]?.name ?? slot.role,
      label: slot.label,
      ...toPct(p.position),
    });
  }

  const drawings: AiDrawing[] = [];
  for (const d of Array.isArray(phase.drawings) ? phase.drawings : []) {
    if (drawings.length >= MAX_DRAWINGS) break;
    const c = compactDrawing(d);
    if (c) drawings.push(c);
  }

  const note = cut(phase.stickyNote, MAX_NOTE);
  const ctx: AiBoardContext = {
    format: SPORT_LABELS[tactic.sport] ?? String(tactic.sport),
    ageGroup: opts.ageGroup === 'youth' ? 'barn' : opts.ageGroup === 'adult' ? 'voksne' : 'ukjent',
    formation: tactic.formation,
    tactic: cut(tactic.name, MAX_NAME),
    phase: { name: cut(phase.name, MAX_NAME), number: phaseIdx + 1, total: tactic.phases.length },
    direction: 'Hjemmelaget angriper mot høyre (x = 100 er motstanderens mål).',
    players: aiPlayers,
    ball: pct(phase.ball) ?? null,
    items: compactItems(phase.items),
    drawings,
    ...(note ? { note } : {}),
  };

  const prev = opts.includePrevious && phaseIdx > 0 ? tactic.phases[phaseIdx - 1] : undefined;
  if (prev) {
    ctx.previousPhase = {
      name: cut(prev.name, MAX_NAME),
      // Samme alias som i aktiv fase: det er samme spiller.
      players: (Array.isArray(prev.players) ? prev.players : [])
        .filter(p => aliases.has(p?.id) && finite(p.position))
        .map(p => ({ id: aliases.get(p.id)!, ...toPct(p.position) })),
      ball: pct(prev.ball) ?? null,
    };
  }
  return ctx;
}
