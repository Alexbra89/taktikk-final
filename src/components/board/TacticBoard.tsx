'use client';
import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Player, PlayerRole } from '../../types';
import { VW, VH, getFormations, DEFAULT_FORMATION } from '../../data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { HandballPitch } from './pitches/HandballPitch';
import { Ball, DrawingCanvas } from './BoardElements';
import { ROLE_META, ROLE_FAMILY } from '../../data/roleInfo';

// ══════════════════════════════════════════════════════════════
//  FM-STYLE TACTIC BOARD  v6 PRO MAX
//  ─ 60fps RAF pointer drag (mobil + desktop unified)
//  ─ Unified dragOverId state
//  ─ Smart debounced auto-spacing (4 iter, kjøres kun ved fri drag)
//  ─ Snap-to-formation-position
//  ─ Substitutions PRO: bench / reserves / maks bytter
//  ─ DragGhost med navn + rolle-badge + scale-in animasjon
//  ─ Long-press (120ms) før drag på mobil
//  ─ Undo/redo drag-history
//  ─ Out-of-position highlight
//  ─ TypeScript strict – ingen any i kjernekode
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
//  TYPER
// ─────────────────────────────────────────────────────────────
interface TacticBoardProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
  isTrainingMatch?: boolean;
  maxSubstitutions?: number; // standard 5 i kamp
}

interface DragState {
  playerId: string;
  fromSub: boolean;
  startClientX: number;
  startClientY: number;
  isDragging: boolean;
  longPressReady: boolean;
}

interface GhostState {
  svgX: number;
  svgY: number;
  scaleIn: boolean;
}

interface UndoEntry {
  playerId: string;
  prevPosition: { x: number; y: number };
  prevIsStarter: boolean | undefined;
  prevRole: string;
}

interface SvgPos { x: number; y: number }

// ─────────────────────────────────────────────────────────────
//  KONSTANTER
// ─────────────────────────────────────────────────────────────
const ROLE_SHORT: Record<string, string> = {
  keeper: 'KV', defender: 'FS', wingback: 'VB', sweeper: 'SV',
  midfielder: 'MB', box2box: 'BBM', playmaker: 'PM', winger: 'KANT',
  forward: 'ANG', false9: 'F9', trequartista: 'TQ', targetman: 'TM',
  pressforward: 'PF', libero: 'LIB',
  hb_keeper: 'KV', hb_pivot: 'PVT', hb_backcourt: 'BP',
  hb_wing: 'FL', hb_center: 'MB', hb_playmaker: 'PM',
};

const ROLE_PRIORITY: Record<string, number> = {
  keeper: 0, hb_keeper: 0, sweeper: 1, libero: 1, defender: 2,
  wingback: 3, defensive_mid: 4, box2box: 5, midfielder: 6,
  playmaker: 7, hb_center: 7, hb_backcourt: 7, hb_playmaker: 7,
  winger: 8, hb_wing: 8, false9: 9, trequartista: 9,
  targetman: 9, pressforward: 9, forward: 10, hb_pivot: 10,
};

const MIN_DIST_BASE = 48;
const SNAP_RADIUS   = 38;
const LONG_PRESS_MS = 120;
const MAX_UNDO      = 20;

function getDutyColors(role: string): { bg: string; text: string } {
  if (['keeper', 'hb_keeper'].includes(role))                              return { bg: '#1a3a5c', text: '#7dd3fc' };
  if (['defender', 'sweeper', 'libero'].includes(role))                    return { bg: '#1a3a5c', text: '#93c5fd' };
  if (['wingback'].includes(role))                                         return { bg: '#163a2a', text: '#6ee7b7' };
  if (['midfielder','playmaker','box2box','hb_center','hb_playmaker','hb_backcourt'].includes(role)) return { bg: '#1e2a1a', text: '#86efac' };
  if (['forward','targetman','pressforward','false9','trequartista'].includes(role))                 return { bg: '#2a1a1a', text: '#fca5a5' };
  if (['winger','hb_wing'].includes(role))                                 return { bg: '#2a1520', text: '#f9a8d4' };
  if (['hb_pivot'].includes(role))                                         return { bg: '#2a1a3a', text: '#c4b5fd' };
  return { bg: '#1e2a1a', text: '#86efac' };
}

// ─────────────────────────────────────────────────────────────
//  AUTO-SPACING (4 iter, gentle push)
// ─────────────────────────────────────────────────────────────
function separatePlayers(
  players: SvgPos[],
  minDist: number = MIN_DIST_BASE,
): SvgPos[] {
  const r = players.map(p => ({ ...p }));
  for (let it = 0; it < 4; it++) {
    for (let i = 0; i < r.length; i++) {
      for (let j = i + 1; j < r.length; j++) {
        const dx = r[j].x - r[i].x;
        const dy = r[j].y - r[i].y;
        const d  = Math.hypot(dx, dy);
        if (d < minDist && d > 0.01) {
          const push = (minDist - d) * 0.4; // mykere push enn v5
          const nx = dx / d, ny = dy / d;
          r[i].x -= nx * push; r[i].y -= ny * push;
          r[j].x += nx * push; r[j].y += ny * push;
          r[i].x = Math.max(45, Math.min(VW - 45, r[i].x));
          r[i].y = Math.max(45, Math.min(VH - 45, r[i].y));
          r[j].x = Math.max(45, Math.min(VW - 45, r[j].x));
          r[j].y = Math.max(45, Math.min(VH - 45, r[j].y));
        }
      }
    }
  }
  return r;
}

// ─────────────────────────────────────────────────────────────
//  SNAP-TO-FORMATION
// ─────────────────────────────────────────────────────────────
function getNearestFormationPosition(
  pos: SvgPos,
  formationPositions: SvgPos[],
  radius: number = SNAP_RADIUS,
): SvgPos | null {
  let best: SvgPos | null = null;
  let bestDist = radius;
  for (const fp of formationPositions) {
    const d = Math.hypot(fp.x - pos.x, fp.y - pos.y);
    if (d < bestDist) { bestDist = d; best = fp; }
  }
  return best;
}

// ══════════════════════════════════════════════════════════════
//  SVG SUB-KOMPONENTER
// ══════════════════════════════════════════════════════════════

// ── Trøye + spesialroller ─────────────────────────────────
interface JerseyIconProps {
  x: number; y: number; num: number; color: string;
  selected: boolean; injured: boolean; specialRoles: string[];
  isDragging: boolean; isOutOfPosition: boolean;
  dragOverSelf: boolean;
}
const JerseyIcon = React.memo<JerseyIconProps>(({
  x, y, num, color, selected, injured, specialRoles,
  isDragging, isOutOfPosition, dragOverSelf,
}) => {
  const w = 38, h = 34, sh = 9, nw = 10, nh = 5;
  const tx = x - w / 2, ty = y - h / 2;
  return (
    <g opacity={isDragging ? 0.38 : 1} style={{ transition: 'opacity 0.12s ease' }}>
      {/* Out-of-position subtle orange glow */}
      {isOutOfPosition && !selected && (
        <circle cx={x} cy={y} r={30} fill="#f97316" opacity={0.1} />
      )}
      {/* Selection glow */}
      {selected && (
        <>
          <circle cx={x} cy={y} r={35} fill={color} opacity={0.13} />
          <circle cx={x} cy={y} r={28} fill="none"
            stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="5,3" opacity={0.95} />
        </>
      )}
      {/* Hover ring from external drag */}
      {dragOverSelf && !selected && (
        <circle cx={x} cy={y} r={30} fill="none"
          stroke="#fbbf24" strokeWidth={2} opacity={0.7} />
      )}
      {/* Jersey body */}
      <path
        d={`M ${tx+nw},${ty} L ${tx},${ty+sh} L ${tx+6},${ty+sh+4}
            L ${tx+6},${ty+h} L ${tx+w-6},${ty+h}
            L ${tx+w-6},${ty+sh+4} L ${tx+w},${ty+sh}
            L ${tx+w-nw},${ty} Q ${x},${ty-nh} ${tx+nw},${ty} Z`}
        fill={injured ? '#475569' : color}
        stroke={selected ? '#38bdf8' : isOutOfPosition ? '#f97316' : 'rgba(255,255,255,0.2)'}
        strokeWidth={selected ? 1.8 : isOutOfPosition ? 1.2 : 0.8}
        filter="url(#jerseyDrop)"
      />
      {/* Number */}
      <text x={x} y={y + 4} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={13} fontWeight="900"
        fontFamily="system-ui, sans-serif"
        paintOrder="stroke" stroke="rgba(0,0,0,0.55)" strokeWidth={2.5}
        style={{ pointerEvents: 'none' }}>
        {num}
      </text>
      {/* Badge icons */}
      {injured    && <text x={x+15} y={y-13} fontSize={11} style={{ pointerEvents: 'none' }}>🩹</text>}
      {specialRoles.includes('captain')  && <text x={x-19} y={y-13} fontSize={11} style={{ pointerEvents: 'none' }}>🪖</text>}
      {specialRoles.includes('freekick') && !specialRoles.includes('penalty') && <text x={x+15} y={y-13} fontSize={10} style={{ pointerEvents: 'none' }}>⚡</text>}
      {specialRoles.includes('penalty')  && <text x={x+15} y={y-13} fontSize={10} style={{ pointerEvents: 'none' }}>🎯</text>}
      {specialRoles.includes('corner')   && <text x={x+15} y={y-1}  fontSize={9}  style={{ pointerEvents: 'none' }}>📍</text>}
    </g>
  );
});
JerseyIcon.displayName = 'JerseyIcon';

// ── Rolle-badge ────────────────────────────────────────────
const RoleBadge = React.memo<{ x: number; y: number; role: string }>(({ x, y, role }) => {
  const short = ROLE_SHORT[role] ?? role.slice(0, 5).toUpperCase();
  const { bg, text } = getDutyColors(role);
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={x-34} y={y} width={68} height={15} rx={4}
        fill={bg} stroke={text} strokeWidth={0.5} opacity={0.95} />
      <text x={x} y={y+8.5} textAnchor="middle" dominantBaseline="middle"
        fill={text} fontSize={8} fontWeight="700"
        fontFamily="system-ui, sans-serif" letterSpacing="0.06em">
        {short}
      </text>
    </g>
  );
});
RoleBadge.displayName = 'RoleBadge';

// ── Navn-label ────────────────────────────────────────────
const NameLabel = React.memo<{ x: number; y: number; name: string }>(({ x, y, name }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
    fill="white" fontSize={9} fontWeight="600"
    fontFamily="system-ui, sans-serif"
    paintOrder="stroke" stroke="rgba(0,0,0,0.9)" strokeWidth={3}
    style={{ pointerEvents: 'none' }}>
    {name.length > 12 ? name.slice(0, 12) + '…' : name}
  </text>
));
NameLabel.displayName = 'NameLabel';

// ── Kondisjonsprikk ───────────────────────────────────────
const ConditionDot = React.memo<{ x: number; y: number; condition: number }>(({ x, y, condition }) => {
  const color = condition > 80 ? '#22c55e' : condition > 60 ? '#f59e0b' : '#ef4444';
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={x+21} cy={y-17} r={5}   fill="#090e1a" />
      <circle cx={x+21} cy={y-17} r={3.5} fill={color} />
    </g>
  );
});
ConditionDot.displayName = 'ConditionDot';

// ── Lån-badge ─────────────────────────────────────────────
const LoanBadge = React.memo<{ x: number; y: number }>(({ x, y }) => (
  <g style={{ pointerEvents: 'none' }}>
    <rect x={x-15} y={y} width={30} height={11} rx={3}
      fill="#78350f" stroke="#fbbf24" strokeWidth={0.6} opacity={0.92} />
    <text x={x} y={y+6} textAnchor="middle" dominantBaseline="middle"
      fill="#fbbf24" fontSize={7} fontWeight="800"
      fontFamily="system-ui, sans-serif" letterSpacing="0.05em">LÅN</text>
  </g>
));
LoanBadge.displayName = 'LoanBadge';

// ── Swap-overlegg ─────────────────────────────────────────
const SwapOverlay = React.memo<{ x: number; y: number }>(({ x, y }) => (
  <g style={{ pointerEvents: 'none' }}>
    <circle cx={x} cy={y} r={39}
      fill="rgba(251,191,36,0.1)" stroke="#fbbf24"
      strokeWidth={2.5} strokeDasharray="7,4" opacity={0.95} />
    <circle cx={x} cy={y} r={15} fill="rgba(251,191,36,0.22)" />
    <text x={x} y={y+1.5} textAnchor="middle" dominantBaseline="middle"
      fontSize={15} fill="#fbbf24" fontWeight="bold">⇄</text>
    <text x={x} y={y-49} textAnchor="middle"
      fontSize={9} fill="#fbbf24" fontWeight="800"
      paintOrder="stroke" stroke="rgba(0,0,0,0.9)" strokeWidth={2.5}>BYTT</text>
  </g>
));
SwapOverlay.displayName = 'SwapOverlay';

// ── Drag ghost (forbedret: navn + badge + scale-in) ────────
interface DragGhostProps {
  x: number; y: number; color: string;
  num: number; name: string; role: string; scaleIn: boolean;
}
const DragGhost = React.memo<DragGhostProps>(({ x, y, color, num, name, role, scaleIn }) => {
  const { text } = getDutyColors(role);
  const short = ROLE_SHORT[role] ?? role.slice(0, 4).toUpperCase();
  const scale = scaleIn ? 1.05 : 1;
  return (
    <g style={{ pointerEvents: 'none' }} opacity={0.82}
      transform={`translate(${x},${y}) scale(${scale})`}>
      {/* Pulserende ytre ring */}
      <circle r={32} fill="none" stroke="rgba(255,255,255,0.25)"
        strokeWidth={1.5} strokeDasharray="4,3" />
      {/* Trøye-sirkel */}
      <circle r={22} fill={color} stroke="rgba(255,255,255,0.55)"
        strokeWidth={2} filter="url(#jerseyDrop)" />
      {/* Nummer */}
      <text textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={13} fontWeight="900"
        fontFamily="system-ui, sans-serif"
        paintOrder="stroke" stroke="rgba(0,0,0,0.6)" strokeWidth={2.5}>
        {num}
      </text>
      {/* Rolle-badge */}
      <rect x={-22} y={25} width={44} height={13} rx={3}
        fill="rgba(0,0,0,0.7)" stroke={text} strokeWidth={0.5} />
      <text x={0} y={32} textAnchor="middle" dominantBaseline="middle"
        fill={text} fontSize={7.5} fontWeight="700"
        fontFamily="system-ui, sans-serif" letterSpacing="0.04em">
        {short}
      </text>
      {/* Navn */}
      <text x={0} y={46} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={8} fontWeight="600"
        fontFamily="system-ui, sans-serif"
        paintOrder="stroke" stroke="rgba(0,0,0,0.9)" strokeWidth={2.5}>
        {name.length > 10 ? name.slice(0, 10) + '…' : name}
      </text>
    </g>
  );
});
DragGhost.displayName = 'DragGhost';

// ── Snap-indicator (liten grønn ring der spilleren vil snappe) ─
const SnapIndicator = React.memo<{ x: number; y: number }>(({ x, y }) => (
  <g style={{ pointerEvents: 'none' }}>
    <circle cx={x} cy={y} r={22} fill="rgba(34,197,94,0.1)"
      stroke="#22c55e" strokeWidth={2} strokeDasharray="5,3" opacity={0.8} />
    <circle cx={x} cy={y} r={4} fill="#22c55e" opacity={0.7} />
  </g>
));
SnapIndicator.displayName = 'SnapIndicator';

// ══════════════════════════════════════════════════════════════
//  HOVED-KOMPONENT
// ══════════════════════════════════════════════════════════════
export const TacticBoard: React.FC<TacticBoardProps> = ({
  selectedPlayerId,
  onSelectPlayer,
  isTrainingMatch = false,
  maxSubstitutions = 5,
}) => {
  const svgRef  = useRef<SVGSVGElement>(null);
  const drawPts = useRef<SvgPos[]>([]);
  const isDrawing = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const playRef   = useRef({ from: 0, t: 0 });
  const stickyDebRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formationDebRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spacingDebRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef           = useRef<number | null>(null);
  const longPressRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Drag state (unified) ───────────────────────────────
  const dragStateRef  = useRef<DragState | null>(null);
  const [dragOverId, setDragOverId]   = useState<string | null>(null);
  const [dragFromSub, setDragFromSub] = useState(false);
  const [ghostState, setGhostState]   = useState<GhostState | null>(null);
  const [snapTarget, setSnapTarget]   = useState<SvgPos | null>(null);
  const [bounceId, setBounceId]       = useState<string | null>(null); // for drop bounce

  // ── Undo/redo ─────────────────────────────────────────
  const undoStack = useRef<UndoEntry[]>([]);
  const redoStack = useRef<UndoEntry[]>([]);

  // ── Substitution tracking ──────────────────────────────
  const [substitutionsMade, setSubstitutionsMade] = useState(0);

  // ── Other state ───────────────────────────────────────
  const [localStickyNote, setLocalStickyNote] = useState('');
  const [drawMode, setDrawMode]     = useState(false);
  const [drawColor, setDrawColor]   = useState('#f87171');
  const [isPlaying, setIsPlaying]   = useState(false);
  const [playSpeed, setPlaySpeed]   = useState(1);
  const [interpFrom, setInterpFrom] = useState(0);
  const [interpT, setInterpT]       = useState(0);
  const [liveDrawPts, setLiveDrawPts] = useState<SvgPos[]>([]);
  const [showSticky, setShowSticky]   = useState(false);
  const [selectedFormation, setSelectedFormation] = useState('');
  // Desktop drag state (separate from touch)
  const [desktopDragId, setDesktopDragId]   = useState<string | null>(null);
  const [desktopFromSub, setDesktopFromSub] = useState(false);

  const {
    sport, phases, activePhaseIdx,
    setActivePhaseIdx, addPhase, removePhase,
    updatePlayerPosition, updateBallPosition,
    addDrawing, clearDrawings, updateStickyNote,
    updatePlayerField, playerAccounts,
  } = useAppStore();

  const phase = phases[activePhaseIdx];

  const availableFormations = useMemo(() =>
    getFormations(sport === 'football7' ? 'football7' : sport === 'football9' ? 'football9' : sport),
    [sport],
  );
  const defaultFormation = DEFAULT_FORMATION[sport === 'football7' ? 'football7' : sport];

  useEffect(() => {
    if (availableFormations.length > 0 && !selectedFormation)
      setSelectedFormation(defaultFormation);
  }, [sport, availableFormations, defaultFormation, selectedFormation]);

  const clamp = useCallback((v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v)), []);

  // ── Formasjonsposisjoner for snap ─────────────────────
  const currentFormationPositions = useMemo((): SvgPos[] => {
    const f = availableFormations.find(f => f.name === selectedFormation);
    return f ? f.homePlayers.map(p => ({ x: p.position.x, y: p.position.y })) : [];
  }, [availableFormations, selectedFormation]);

  // ── Undo/redo helpers ─────────────────────────────────
  const pushUndo = useCallback((entry: UndoEntry) => {
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO + 1), entry];
    redoStack.current = [];
  }, []);

  const handleUndo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry || !phase) return;
    const p = phase.players.find(pl => pl.id === entry.playerId);
    if (!p) return;
    redoStack.current.push({
      playerId: entry.playerId,
      prevPosition: { ...p.position },
      prevIsStarter: p.isStarter,
      prevRole: p.role,
    });
    updatePlayerField(activePhaseIdx, entry.playerId, {
      position: entry.prevPosition,
      isStarter: entry.prevIsStarter,
      isOnField: entry.prevIsStarter,
      role: entry.prevRole as PlayerRole,
    });
  }, [phase, activePhaseIdx, updatePlayerField]);

  const handleRedo = useCallback(() => {
    const entry = redoStack.current.pop();
    if (!entry || !phase) return;
    const p = phase.players.find(pl => pl.id === entry.playerId);
    if (!p) return;
    undoStack.current.push({
      playerId: entry.playerId,
      prevPosition: { ...p.position },
      prevIsStarter: p.isStarter,
      prevRole: p.role,
    });
    updatePlayerField(activePhaseIdx, entry.playerId, {
      position: entry.prevPosition,
      isStarter: entry.prevIsStarter,
      isOnField: entry.prevIsStarter,
      role: entry.prevRole as PlayerRole,
    });
  }, [phase, activePhaseIdx, updatePlayerField]);

  // ── Keyboard shortcuts ────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  // ── Update formation (role-priority matching) ─────────
  const updateFormation = useCallback((name: string) => {
    if (!phase) return;
    if (formationDebRef.current) clearTimeout(formationDebRef.current);
    formationDebRef.current = setTimeout(() => {
      const f = availableFormations.find(f => f.name === name);
      if (!f) return;
      const home = [...phase.players]
        .filter(p => p.team === 'home')
        .sort((a, b) => (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99));
      requestAnimationFrame(() => {
        f.homePlayers.forEach((fp, i) => {
          const p = home[i]; if (!p) return;
          updatePlayerField(activePhaseIdx, p.id, {
            position: { x: clamp(fp.position.x, 45, VW - 45), y: clamp(fp.position.y, 45, VH - 45) },
            role: fp.role as PlayerRole,
          });
        });
      });
      setSelectedFormation(name);
    }, 50);
  }, [phase, activePhaseIdx, availableFormations, updatePlayerField, clamp]);

  useEffect(() => () => {
    if (formationDebRef.current)  clearTimeout(formationDebRef.current);
    if (stickyDebRef.current)     clearTimeout(stickyDebRef.current);
    if (spacingDebRef.current)    clearTimeout(spacingDebRef.current);
    if (rafRef.current)           cancelAnimationFrame(rafRef.current);
    if (longPressRef.current)     clearTimeout(longPressRef.current);
  }, []);

  useEffect(() => { setLocalStickyNote(phase?.stickyNote ?? ''); }, [phase?.stickyNote, activePhaseIdx]);

  const handleStickyChange = useCallback((v: string) => {
    setLocalStickyNote(v);
    if (stickyDebRef.current) clearTimeout(stickyDebRef.current);
    stickyDebRef.current = setTimeout(() => updateStickyNote(activePhaseIdx, v), 500);
  }, [activePhaseIdx, updateStickyNote]);

  // ── Avspilling ────────────────────────────────────────
  function startPlayback() {
    if (phases.length < 2) return;
    stopPlayback();
    playRef.current = { from: 0, t: 0 };
    setInterpFrom(0); setInterpT(0); setActivePhaseIdx(0); setIsPlaying(true);
    timerRef.current = setInterval(() => {
      playRef.current.t += 0.025 * playSpeed;
      if (playRef.current.t >= 1) {
        const next = playRef.current.from + 1;
        if (next >= phases.length - 1) {
          clearInterval(timerRef.current!); timerRef.current = null;
          setIsPlaying(false); setActivePhaseIdx(phases.length - 1); setInterpT(0); return;
        }
        playRef.current.from = next; playRef.current.t = 0;
        setInterpFrom(next); setInterpT(0); setActivePhaseIdx(next);
      } else {
        setInterpT(playRef.current.t); setInterpFrom(playRef.current.from);
      }
    }, 30);
  }

  function stopPlayback() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsPlaying(false); setInterpT(0);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Display players (memoized) ─────────────────────────
  const getDisplayPlayers = useCallback((): Player[] => {
    if (!phase) return [];
    if (!isPlaying || interpT === 0) return phase.players;
    const from = phases[interpFrom];
    const to   = phases[Math.min(interpFrom + 1, phases.length - 1)];
    if (!from || !to) return phase.players;
    return from.players.map(fp => {
      const tp = to.players.find(p => p.id === fp.id);
      if (!tp) return fp;
      return { ...fp, position: {
        x: fp.position.x + (tp.position.x - fp.position.x) * interpT,
        y: fp.position.y + (tp.position.y - fp.position.y) * interpT,
      }};
    });
  }, [phase, phases, interpFrom, interpT, isPlaying]);

  const getDisplayBall = useCallback((): SvgPos => {
    if (!phase) return { x: VW / 2, y: VH / 2 };
    if (!isPlaying || interpT === 0) return phase.ball;
    const from = phases[interpFrom];
    const to   = phases[Math.min(interpFrom + 1, phases.length - 1)];
    if (!from || !to) return phase.ball;
    return {
      x: from.ball.x + (to.ball.x - from.ball.x) * interpT,
      y: from.ball.y + (to.ball.y - from.ball.y) * interpT,
    };
  }, [phase, phases, interpFrom, interpT, isPlaying]);

  // ── SVG-koordinater ───────────────────────────────────
  const toSVGCoords = useCallback((cx: number, cy: number): SvgPos => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return {
      x: clamp(((cx - r.left) / r.width)  * VW, 20, VW - 20),
      y: clamp(((cy - r.top)  / r.height) * VH, 20, VH - 20),
    };
  }, [clamp]);

  // ── Finn nærmeste spiller (hitbox 52px) ────────────────
  const findPlayerAtCoords = useCallback((sx: number, sy: number, excludeId?: string): Player | null => {
    let best: Player | null = null;
    let bestDist = 52;
    for (const p of (phase?.players ?? [])) {
      if (p.id === excludeId || p.team !== 'home') continue;
      const d = Math.hypot(p.position.x - sx, p.position.y - sy);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    return best;
  }, [phase]);

  // ── Debounced auto-spacing (bare etter fri drag) ───────
  const scheduleAutoSpacing = useCallback((movedId: string) => {
    if (spacingDebRef.current) clearTimeout(spacingDebRef.current);
    spacingDebRef.current = setTimeout(() => {
      if (!phase) return;
      const starters = phase.players.filter(p => p.team === 'home' && p.isStarter !== false && p.id !== movedId);
      const moved    = phase.players.find(p => p.id === movedId);
      if (!moved) return;
      const pts = starters.map(p => ({ x: p.position.x, y: p.position.y }));
      const separated = separatePlayers(pts);
      separated.forEach((sp, i) => {
        const orig = starters[i];
        if (!orig) return;
        if (Math.abs(sp.x - orig.position.x) > 1 || Math.abs(sp.y - orig.position.y) > 1) {
          updatePlayerPosition(activePhaseIdx, orig.id, { x: sp.x, y: sp.y });
        }
      });
    }, 80);
  }, [phase, activePhaseIdx, updatePlayerPosition]);

  // ══════════════════════════════════════════════════════
  //  SMART SWAP ENGINE
  // ══════════════════════════════════════════════════════
  const swapPlayers = useCallback((aId: string, bId: string) => {
    if (!phase) return;
    const a = phase.players.find(p => p.id === aId);
    const b = phase.players.find(p => p.id === bId);
    if (!a || !b) return;

    // Push to undo before mutating
    pushUndo({ playerId: aId, prevPosition: { ...a.position }, prevIsStarter: a.isStarter, prevRole: a.role });

    const ap = { ...a.position }, bp = { ...b.position };
    const ar = a.role,  br = b.role;
    const as_ = a.isStarter, bs = b.isStarter;

    updatePlayerField(activePhaseIdx, aId, { position: bp, role: br as PlayerRole, isStarter: bs, isOnField: bs });
    updatePlayerField(activePhaseIdx, bId, { position: ap, role: ar as PlayerRole, isStarter: as_, isOnField: as_ });

    // Track substitution if one was bench
    if ((as_ === false) !== (bs === false)) {
      setSubstitutionsMade(s => s + 1);
    }

    // Drop bounce animation
    setBounceId(bId);
    setTimeout(() => setBounceId(null), 350);
  }, [phase, activePhaseIdx, updatePlayerField, pushUndo]);

  const moveToBench = useCallback((playerId: string) => {
    if (!phase) return;
    const p = phase.players.find(pl => pl.id === playerId);
    if (!p) return;
    pushUndo({ playerId, prevPosition: { ...p.position }, prevIsStarter: p.isStarter, prevRole: p.role });
    updatePlayerField(activePhaseIdx, playerId, { isStarter: false, isOnField: false });
    setSubstitutionsMade(s => s + 1);
  }, [phase, activePhaseIdx, updatePlayerField, pushUndo]);

  const moveToField = useCallback((playerId: string, targetPos: SvgPos) => {
    if (!phase) return;
    const p = phase.players.find(pl => pl.id === playerId);
    if (!p) return;
    pushUndo({ playerId, prevPosition: { ...p.position }, prevIsStarter: p.isStarter, prevRole: p.role });
    updatePlayerField(activePhaseIdx, playerId, { isStarter: true, isOnField: true, position: targetPos });
    setSubstitutionsMade(s => s + 1);
  }, [phase, activePhaseIdx, updatePlayerField, pushUndo]);

  // ── Sjekk om bytte er tillatt i kamp ──────────────────
  const canSubstitute = useCallback((fromBench: boolean): boolean => {
    if (isTrainingMatch) return true;
    if (!fromBench) return true; // starter → benk alltid OK
    return substitutionsMade < maxSubstitutions;
  }, [isTrainingMatch, substitutionsMade, maxSubstitutions]);

  // ══════════════════════════════════════════════════════
  //  TEGNE-HENDELSER
  // ══════════════════════════════════════════════════════
  function onSvgPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (isPlaying || !drawMode) return;
    if ((e.target as SVGElement).closest('[data-player]')) return;
    e.preventDefault();
    isDrawing.current = true;
    const pt = toSVGCoords(e.clientX, e.clientY);
    drawPts.current = [pt]; setLiveDrawPts([pt]);
    svgRef.current?.setPointerCapture(e.pointerId);
  }
  function onSvgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawMode || !isDrawing.current) return;
    e.preventDefault();
    const pt = toSVGCoords(e.clientX, e.clientY);
    drawPts.current.push(pt); setLiveDrawPts([...drawPts.current]);
  }
  function onSvgPointerUp() {
    if (drawMode && isDrawing.current && drawPts.current.length > 2)
      addDrawing(activePhaseIdx, { pts: [...drawPts.current], color: drawColor });
    isDrawing.current = false; drawPts.current = []; setLiveDrawPts([]);
  }

  // ══════════════════════════════════════════════════════
  //  DESKTOP HTML5 DRAG
  // ══════════════════════════════════════════════════════
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const resolveDrop = useCallback((
    draggedId: string,
    isFromSub: boolean,
    targetId: string | undefined,
    dropClientX: number,
    dropClientY: number,
  ) => {
    if (!phase) return;
    const dragged = phase.players.find(p => p.id === draggedId);
    const target  = targetId ? phase.players.find(p => p.id === targetId) : null;
    if (!dragged) return;

    if (target && target.id !== dragged.id) {
      // Bytte (bench↔field or field↔field)
      if (!canSubstitute(dragged.isStarter === false || isFromSub)) return;
      swapPlayers(dragged.id, target.id);
      return;
    }

    // Fritt drag – snap til formasjon?
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    let pos: SvgPos = {
      x: clamp(((dropClientX - rect.left) / rect.width)  * VW, 45, VW - 45),
      y: clamp(((dropClientY - rect.top)  / rect.height) * VH, 45, VH - 45),
    };
    const snap = getNearestFormationPosition(pos, currentFormationPositions);
    if (snap) pos = snap;

    if (dragged.isStarter === false || isFromSub) {
      if (!canSubstitute(true)) return;
      moveToField(dragged.id, pos);
    } else {
      pushUndo({ playerId: dragged.id, prevPosition: { ...dragged.position }, prevIsStarter: dragged.isStarter, prevRole: dragged.role });
      updatePlayerPosition(activePhaseIdx, dragged.id, pos);
      scheduleAutoSpacing(dragged.id);
    }
    setBounceId(dragged.id);
    setTimeout(() => setBounceId(null), 350);
  }, [phase, canSubstitute, swapPlayers, currentFormationPositions, moveToField, pushUndo, updatePlayerPosition, activePhaseIdx, scheduleAutoSpacing, clamp]);

  const handleSvgDrop = useCallback((e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    setDragOverId(null);
    let raw = e.dataTransfer.getData('text/plain');
    let dragId = raw; let isFromSub = false;
    if (raw.startsWith('{')) {
      try { const d = JSON.parse(raw); dragId = d.playerId; isFromSub = d.isSubSlot === true; } catch { /**/ }
    }
    if (!dragId) return;
    resolveDrop(dragId, isFromSub, targetId, e.clientX, e.clientY);
    setDesktopDragId(null); setDesktopFromSub(false);
  }, [resolveDrop]);

  const handleSubPanelDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetSubId?: string) => {
    e.preventDefault();
    setDragOverId(null);
    let raw = e.dataTransfer.getData('text/plain');
    let dragId = raw;
    if (raw.startsWith('{')) {
      try { const d = JSON.parse(raw); dragId = d.playerId; } catch { /**/ }
    }
    if (!dragId || !phase) return;
    const dragged = phase.players.find(p => p.id === dragId);
    if (!dragged) return;
    if (targetSubId && targetSubId !== dragId) {
      swapPlayers(dragId, targetSubId);
    } else if (dragged.isStarter !== false) {
      moveToBench(dragId);
    }
    setDesktopDragId(null); setDesktopFromSub(false);
  }, [phase, swapPlayers, moveToBench]);

  // ══════════════════════════════════════════════════════
  //  MOBIL POINTER DRAG (60fps RAF + long-press)
  // ══════════════════════════════════════════════════════
  const startTouchDrag = useCallback((playerId: string, fromSub: boolean, clientX: number, clientY: number) => {
    const svgPos = toSVGCoords(clientX, clientY);
    dragStateRef.current = {
      playerId, fromSub,
      startClientX: clientX, startClientY: clientY,
      isDragging: true, longPressReady: true,
    };
    setDragFromSub(fromSub);
    setGhostState({ svgX: svgPos.x, svgY: svgPos.y, scaleIn: true });
    setTimeout(() => setGhostState(s => s ? { ...s, scaleIn: false } : null), 150);
  }, [toSVGCoords]);

  const handlePlayerPointerDown = useCallback((
    e: React.PointerEvent<SVGGElement>,
    playerId: string,
    fromSub = false,
  ) => {
    if (isPlaying || drawMode) return;
    if (e.pointerType === 'mouse') return; // desktop uses HTML5 drag

    e.preventDefault(); e.stopPropagation();
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);

    dragStateRef.current = {
      playerId, fromSub,
      startClientX: e.clientX, startClientY: e.clientY,
      isDragging: false, longPressReady: false,
    };

    // Long press timer
    if (longPressRef.current) clearTimeout(longPressRef.current);
    longPressRef.current = setTimeout(() => {
      if (dragStateRef.current?.playerId === playerId) {
        dragStateRef.current.longPressReady = true;
      }
    }, LONG_PRESS_MS);
  }, [isPlaying, drawMode]);

  const handlePlayerPointerMove = useCallback((
    e: React.PointerEvent<SVGGElement | HTMLDivElement>,
    playerId: string,
  ) => {
    const ds = dragStateRef.current;
    if (!ds || ds.playerId !== playerId || e.pointerType === 'mouse') return;
    e.preventDefault();

    const moved = Math.hypot(e.clientX - ds.startClientX, e.clientY - ds.startClientY);

    if (!ds.isDragging) {
      if (moved > 10 && ds.longPressReady) {
        ds.isDragging = true;
        startTouchDrag(playerId, ds.fromSub, e.clientX, e.clientY);
      }
      return;
    }

    // RAF update at 60fps
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const cx = e.clientX, cy = e.clientY;
    rafRef.current = requestAnimationFrame(() => {
      const svgPos = toSVGCoords(cx, cy);

      // Snap preview
      const snap = getNearestFormationPosition(svgPos, currentFormationPositions);
      setSnapTarget(snap);

      // Ghost position
      setGhostState(s => s ? { ...s, svgX: snap ? snap.x : svgPos.x, svgY: snap ? snap.y : svgPos.y } : null);

      // Target detection
      const near = findPlayerAtCoords(svgPos.x, svgPos.y, playerId);
      setDragOverId(near?.id ?? null);
    });
  }, [toSVGCoords, currentFormationPositions, findPlayerAtCoords, startTouchDrag]);

  const handlePlayerPointerUp = useCallback((
    e: React.PointerEvent<SVGGElement | HTMLDivElement>,
    playerId: string,
  ) => {
    const ds = dragStateRef.current;
    if (!ds || ds.playerId !== playerId) return;
    e.preventDefault();

    if (longPressRef.current) clearTimeout(longPressRef.current);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    const wasDragging = ds.isDragging;
    const gs = ghostState;
    const targetId = dragOverId;

    // Rydd state FØR oppdatering
    dragStateRef.current = null;
    setGhostState(null);
    setDragOverId(null);
    setDragFromSub(false);
    setSnapTarget(null);

    if (!wasDragging) {
      // Kort trykk → select
      onSelectPlayer(selectedPlayerId === playerId ? null : playerId);
      return;
    }

    if (!phase || !gs) return;
    resolveDrop(playerId, ds.fromSub, targetId ?? undefined, 0, 0);
    // Override position if we have ghost SVG coords
    if (!targetId) {
      const p = phase.players.find(pl => pl.id === playerId);
      if (p) {
        const snap = getNearestFormationPosition({ x: gs.svgX, y: gs.svgY }, currentFormationPositions);
        const finalPos = snap ?? { x: gs.svgX, y: gs.svgY };
        if (ds.fromSub || p.isStarter === false) {
          if (canSubstitute(true)) {
            pushUndo({ playerId, prevPosition: { ...p.position }, prevIsStarter: p.isStarter, prevRole: p.role });
            updatePlayerField(activePhaseIdx, playerId, { isStarter: true, isOnField: true, position: finalPos });
            setSubstitutionsMade(s => s + 1);
          }
        } else {
          pushUndo({ playerId, prevPosition: { ...p.position }, prevIsStarter: p.isStarter, prevRole: p.role });
          updatePlayerPosition(activePhaseIdx, playerId, finalPos);
          scheduleAutoSpacing(playerId);
        }
      }
    }
    setBounceId(playerId);
    setTimeout(() => setBounceId(null), 350);
  }, [
    ghostState, dragOverId, phase, selectedPlayerId,
    resolveDrop, currentFormationPositions, canSubstitute,
    pushUndo, updatePlayerField, updatePlayerPosition,
    activePhaseIdx, scheduleAutoSpacing, onSelectPlayer,
  ]);

  // ── Display data ──────────────────────────────────────
  const allDisplay   = useMemo(() => getDisplayPlayers(), [getDisplayPlayers]);
  const onField      = useMemo(() => allDisplay.filter(p => p.team === 'home' && p.isStarter !== false), [allDisplay]);
  const benchPlayers = useMemo(() => (phase?.players ?? []).filter(p => p.team === 'home' && p.isStarter === false), [phase]);
  const displayBall  = useMemo(() => getDisplayBall(), [getDisplayBall]);
  const progressFrac = phases.length > 1 ? (interpFrom + interpT) / (phases.length - 1) : 0;

  const maxSubs  = isTrainingMatch ? 30 : (sport === 'football' ? 9 : 7);
  const subSlots = useMemo(() =>
    [...benchPlayers, ...Array(Math.max(0, maxSubs - benchPlayers.length)).fill(null)] as (Player | null)[],
    [benchPlayers, maxSubs],
  );

  const getDisplayName = useCallback((player: Player): string => {
    const acc = (playerAccounts as Array<{ playerId: string; name: string }>)
      .find(a => a.playerId === player.id);
    return acc?.name || player.name || `#${player.num}`;
  }, [playerAccounts]);

  // Out-of-position detection
  const isOutOfPosition = useCallback((player: Player): boolean => {
    const myFamily = ROLE_FAMILY[player.role];
    if (!myFamily) return false;
    const starters = onField.filter(p => p.id !== player.id);
    // Check if the y-position is way off for the role family (simplified heuristic)
    const yFrac = player.position.y / VH;
    if (myFamily === 'gk'  && yFrac < 0.7) return true;
    if (myFamily === 'att' && yFrac > 0.5) return true;
    return false;
  }, [onField]);

  // Ghost player data
  const ghostPlayerId = dragStateRef.current?.playerId ?? null;
  const ghostPlayer   = ghostPlayerId ? phase?.players.find(p => p.id === ghostPlayerId) : null;
  const ghostMeta     = ghostPlayer ? (ROLE_META[ghostPlayer.role as keyof typeof ROLE_META] ?? null) : null;
  const ghostName     = ghostPlayer ? getDisplayName(ghostPlayer) : '';

  const DRAW_COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#ffffff'];
  const speedOptions = [
    { label: '0.5×', value: 0.5 }, { label: '1×', value: 1 },
    { label: '1.5×', value: 1.5 }, { label: '2×', value: 2 },
  ];

  const subLimitReached = !isTrainingMatch && substitutionsMade >= maxSubstitutions;

  return (
    <div className="flex flex-col h-full overflow-hidden select-none"
      onDragOver={handleDragOver}
      onDrop={handleSvgDrop}
    >
      {/* ═══ TOPPTOOLBAR ══════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 bg-[#0d1626] border-b border-[#1e3050] overflow-x-auto overscroll-x-contain">

        {/* Fase-knapper */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {phases.map((ph, idx) => (
            <button key={ph.id}
              onClick={() => !isPlaying && setActivePhaseIdx(idx)}
              className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all min-h-[44px] whitespace-nowrap
                ${activePhaseIdx === idx ? 'bg-sky-500/15 border-sky-500 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}
                ${isPlaying ? 'opacity-50' : ''}`}>
              {ph.name}{ph.stickyNote && <span className="ml-1 text-amber-400">·</span>}
            </button>
          ))}
          <button onClick={() => !isPlaying && addPhase()} disabled={isPlaying}
            className="w-8 h-8 flex items-center justify-center rounded text-emerald-400 border border-[#1e3050] text-base disabled:opacity-40">＋</button>
          {phases.length > 1 && (
            <button onClick={() => !isPlaying && removePhase(activePhaseIdx)} disabled={isPlaying}
              className="w-8 h-8 flex items-center justify-center rounded text-red-400 border border-[#1e3050] text-base disabled:opacity-40">🗑️</button>
          )}
        </div>

        {/* Formasjon */}
        {availableFormations.length > 0 && (
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <select value={selectedFormation}
              onChange={e => updateFormation(e.target.value)}
              disabled={isPlaying}
              className="bg-[#111c30] border border-[#1e3050] rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500 min-h-[40px]">
              {availableFormations.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[8px]" />

        {/* Undo/Redo */}
        <button onClick={handleUndo}
          disabled={undoStack.current.length === 0}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#1e3050]
            text-[#4a6080] text-sm disabled:opacity-30 hover:text-slate-300 flex-shrink-0"
          title="Angre (Ctrl+Z)">↩</button>
        <button onClick={handleRedo}
          disabled={redoStack.current.length === 0}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#1e3050]
            text-[#4a6080] text-sm disabled:opacity-30 hover:text-slate-300 flex-shrink-0"
          title="Gjør om (Ctrl+Y)">↪</button>

        {/* Treningskamp / bytteteller */}
        {isTrainingMatch ? (
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10
            border border-emerald-500/30 px-2 py-0.5 rounded-full flex-shrink-0">🏃 Trening</span>
        ) : (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0
            ${subLimitReached
              ? 'text-red-400 bg-red-500/10 border border-red-500/30'
              : 'text-slate-400 bg-[#111c30] border border-[#1e3050]'}`}>
            🔄 {substitutionsMade}/{maxSubstitutions}
          </span>
        )}

        {/* Sticky */}
        <button onClick={() => setShowSticky(!showSticky)}
          className={`px-2 py-1 rounded text-[13px] border min-h-[40px] transition-all flex-shrink-0
            ${showSticky ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'border-[#1e3050] text-[#4a6080]'}`}>📌</button>

        {/* Tegn */}
        <button onClick={() => setDrawMode(!drawMode)}
          className={`px-2 py-1 rounded text-[11px] font-bold border min-h-[40px] transition-all whitespace-nowrap flex-shrink-0
            ${drawMode ? 'bg-red-500/15 border-red-500 text-red-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
          {drawMode ? '✏️ Stopp' : '✏️ Tegn'}
        </button>
        {drawMode && DRAW_COLORS.map(c => (
          <button key={c} onClick={() => setDrawColor(c)}
            className={`w-7 h-7 rounded-full border-2 flex-shrink-0 transition-all
              ${drawColor === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
            style={{ background: c }} />
        ))}
        {(phase?.drawings?.length ?? 0) > 0 && (
          <button onClick={() => clearDrawings(activePhaseIdx)}
            className="px-2 py-1 rounded text-[13px] border border-[#1e3050] text-red-400/70 min-h-[40px] flex-shrink-0">🗑️</button>
        )}

        {/* Avspilling + hastighet */}
        <div className="flex items-center gap-1 bg-[#111c30] rounded px-1.5 py-1 border border-[#1e3050] flex-shrink-0">
          <button onClick={() => !isPlaying && setActivePhaseIdx(Math.max(0, activePhaseIdx - 1))}
            disabled={isPlaying || activePhaseIdx === 0}
            className="text-slate-400 disabled:opacity-30 text-base px-1 min-w-[32px] min-h-[40px]">⏮</button>
          <button onClick={() => isPlaying ? stopPlayback() : startPlayback()}
            disabled={phases.length < 2}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border transition-all
              ${phases.length < 2 ? 'border-[#1e3050] text-[#334155] cursor-not-allowed'
                : isPlaying ? 'border-red-500 bg-red-500/15 text-red-400'
                : 'border-sky-500 bg-sky-500/15 text-sky-400'}`}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => !isPlaying && setActivePhaseIdx(Math.min(phases.length - 1, activePhaseIdx + 1))}
            disabled={isPlaying || activePhaseIdx === phases.length - 1}
            className="text-slate-400 disabled:opacity-30 text-base px-1 min-w-[32px] min-h-[40px]">⏭</button>
          <div className="ml-1 pl-1 border-l border-[#1e3050]">
            <select value={playSpeed} onChange={e => setPlaySpeed(parseFloat(e.target.value))}
              disabled={isPlaying}
              className="bg-[#0a1420] border border-[#1e3050] rounded px-1 py-1
                text-[10px] text-slate-300 focus:outline-none min-h-[40px] cursor-pointer">
              {speedOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Sticky-notat */}
      {showSticky && phase && (
        <div className="flex-shrink-0 px-3 py-2 bg-amber-500/8 border-b border-amber-500/20 flex items-center gap-2">
          <span className="text-amber-400 text-[13px]">📌</span>
          <input value={localStickyNote}
            onChange={e => handleStickyChange(e.target.value)}
            placeholder={`Notat for ${phase.name}…`}
            className="flex-1 bg-transparent border-none text-amber-100 text-[13px]
              placeholder-amber-500/40 focus:outline-none min-h-[40px]" />
        </div>
      )}

      {/* ═══ HOVED-LAYOUT ════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── SVG-BANE ───────────────────────────────── */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col items-stretch" style={{ padding: '4px' }}>

          {/* Formasjonsnavn */}
          {selectedFormation && (
            <div className="flex-shrink-0 flex items-center justify-center py-1">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0f1a2a]/80 border border-[#1e3050]">
                <span className="text-[8px] font-bold text-[#4a6080] uppercase tracking-widest">Formasjon</span>
                <span className="text-[13px] font-black text-slate-100 tracking-wider uppercase">{selectedFormation}</span>
              </div>
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              flex: 1, width: '100%', height: '100%', display: 'block',
              boxShadow: '0 0 60px rgba(0,0,0,0.9)',
              cursor: drawMode ? 'crosshair' : 'default',
              touchAction: ghostState ? 'none' : 'auto',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={onSvgPointerDown}
            onPointerMove={onSvgPointerMove}
            onPointerUp={onSvgPointerUp}
            onPointerLeave={onSvgPointerUp}
            onDragOver={handleDragOver}
            onDrop={handleSvgDrop}
          >
            <defs>
              <filter id="dropShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.6"/>
              </filter>
              <filter id="jerseyDrop">
                <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.75"/>
              </filter>
              <pattern id="grass" patternUnits="userSpaceOnUse" width="50" height="50">
                <rect width="50" height="50" fill="#1b5e2a"/>
                <rect width="50" height="25" fill="#1d6430"/>
              </pattern>
            </defs>

            <rect width={VW} height={VH} fill="url(#grass)"/>
            {(sport === 'football' || sport === 'football7' || sport === 'football9') && <FootballPitch />}
            {sport === 'handball' && <HandballPitch />}
            {phase?.drawings?.map(d => <DrawingCanvas key={d.id} drawing={d} />)}
            {liveDrawPts.length > 1 && (
              <polyline points={liveDrawPts.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={drawColor} strokeWidth={4} fill="none"
                strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
            )}
            {phase && (
              <Ball position={displayBall} isDraggable={!isPlaying && !drawMode}
                onPositionChange={pos => updateBallPosition(activePhaseIdx, pos)} />
            )}

            {/* Snap-indikator */}
            {snapTarget && ghostState && (
              <SnapIndicator x={snapTarget.x} y={snapTarget.y} />
            )}

            {/* ── SPILLERBRIKKER ──────────────────────── */}
            {onField.map(player => {
              const meta        = ROLE_META[player.role as keyof typeof ROLE_META] ?? { color: '#64748b', label: player.role };
              const displayName = getDisplayName(player);
              // Unified dragOverId – dekker både desktop og touch
              const isTarget    = dragOverId === player.id;
              const isSrcDrag   = desktopDragId === player.id || dragStateRef.current?.playerId === player.id;
              const isOnLoan    = (player as unknown as Record<string, unknown>).onLoan === true;
              const condition   = typeof (player as unknown as Record<string, unknown>).condition === 'number'
                ? (player as unknown as Record<string, number>).condition : 90;
              const isBouncing  = bounceId === player.id;
              const outOfPos    = isOutOfPosition(player);
              const { x, y }    = player.position;
              const showSwap    = isTarget && (dragFromSub || desktopFromSub);
              const showHover   = isTarget && !showSwap;

              return (
                <g
                  key={player.id}
                  data-player="true"
                  {...(!isPlaying && !drawMode ? { draggable: true } : {})}
                  onDragStart={e => {
                    if (!isPlaying && !drawMode) {
                      e.dataTransfer.setData('text/plain', player.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDesktopDragId(player.id);
                      setDesktopFromSub(false);
                      setDragFromSub(false);
                    }
                  }}
                  onDragEnd={() => { setDesktopDragId(null); setDesktopFromSub(false); setDragOverId(null); }}
                  onDragOver={handleDragOver}
                  onDrop={e => handleSvgDrop(e, player.id)}
                  onDragEnter={() => setDragOverId(player.id)}
                  onDragLeave={() => setDragOverId(null)}
                  onPointerDown={e => handlePlayerPointerDown(e, player.id, false)}
                  onPointerMove={e => handlePlayerPointerMove(e as React.PointerEvent<SVGGElement>, player.id)}
                  onPointerUp={e => handlePlayerPointerUp(e as React.PointerEvent<SVGGElement>, player.id)}
                  style={{
                    cursor: !isPlaying && !drawMode ? 'grab' : 'default',
                    touchAction: 'none',
                    transform: isBouncing ? `translate(${x}px,${y}px) scale(1.08)` : `translate(0,0) scale(1)`,
                    transition: isBouncing ? 'transform 0.18s cubic-bezier(.34,1.56,.64,1)' : 'none',
                  }}
                >
                  {showSwap  && <SwapOverlay x={x} y={y} />}
                  {showHover && (
                    <circle cx={x} cy={y} r={32} fill="none"
                      stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="6,4" opacity={0.8} />
                  )}

                  <JerseyIcon
                    x={x} y={y} num={player.num} color={(meta as { color: string }).color}
                    selected={selectedPlayerId === player.id}
                    injured={!!player.injured}
                    specialRoles={player.specialRoles ?? []}
                    isDragging={!!isSrcDrag}
                    isOutOfPosition={outOfPos}
                    dragOverSelf={isTarget}
                  />
                  <RoleBadge x={x} y={y + 22} role={player.role} />
                  <NameLabel x={x} y={y + 46} name={displayName} />
                  {isOnLoan && <LoanBadge x={x} y={y + 57} />}
                  <ConditionDot x={x} y={y} condition={condition} />

                  {(player.minutesPlayed ?? 0) > 0 && (
                    <circle cx={x} cy={y} r={29} fill="none"
                      stroke={(player.minutesPlayed ?? 0) > 60 ? '#ef4444'
                        : (player.minutesPlayed ?? 0) > 30 ? '#f59e0b' : '#22c55e'}
                      strokeWidth={1.5} opacity={0.35} strokeDasharray="3 2" />
                  )}
                </g>
              );
            })}

            {/* Drag ghost (mobil) */}
            {ghostState && ghostPlayer && ghostMeta && (
              <DragGhost
                x={ghostState.svgX} y={ghostState.svgY}
                color={(ghostMeta as { color: string }).color ?? '#555'}
                num={ghostPlayer.num}
                name={ghostName}
                role={ghostPlayer.role}
                scaleIn={ghostState.scaleIn}
              />
            )}

            {/* Fremdriftslinje */}
            {isPlaying && (
              <rect x={32} y={VH - 14} rx={3} height={5}
                width={progressFrac * (VW - 64)} fill="#38bdf8" opacity={0.8} />
            )}
          </svg>
        </div>

        {/* ═══ INNBYTTER-PANEL ══════════════════════════ */}
        <div
          className="flex-shrink-0 flex flex-col bg-[#0c1525] border-l border-[#1e3050] overflow-hidden"
          style={{ width: 172 }}
          onDragOver={handleDragOver}
          onDrop={e => handleSubPanelDrop(e)}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2
            border-b border-[#1e3050] bg-[#0a1420]">
            <div>
              <div className="text-[9px] font-black text-[#4a6080] uppercase tracking-widest">
                {isTrainingMatch ? 'Spillere' : 'Innbyttere'}
              </div>
              <div className="text-[8px] text-[#2a4060] mt-0.5">Dra hit for å bytte ut</div>
            </div>
            <div className="text-right">
              <span className={`text-[12px] font-bold ${subLimitReached ? 'text-red-400' : 'text-amber-400'}`}>
                {benchPlayers.length}
                <span className="text-[#3a5070] font-normal text-[10px]">/{maxSubs}</span>
              </span>
              {subLimitReached && (
                <div className="text-[7px] text-red-400 font-bold">Maks bytter</div>
              )}
            </div>
          </div>

          {/* Rader */}
          <div className="flex-1 overflow-y-auto py-0.5">
            {subSlots.map((player, idx) => {
              if (!player) {
                return (
                  <div key={`empty-${idx}`}
                    className="flex items-center gap-2 px-2.5 py-2 border-b border-[#0d1a2a]
                      min-h-[46px] hover:bg-[#0f1a2a]/40 transition-colors">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center
                      text-[9px] text-[#1e3050] bg-[#0f1a2a] border border-[#1a2d45] flex-shrink-0">–</div>
                    <div className="text-[9.5px] text-[#1e3050] italic">Ledig plass</div>
                  </div>
                );
              }

              const meta       = ROLE_META[player.role as keyof typeof ROLE_META] ?? { color: '#555', label: player.role };
              const roleColors = getDutyColors(player.role);
              const name       = getDisplayName(player);
              const lastName   = name.includes(' ') ? name.split(' ').slice(-1)[0] : name;
              const isOver     = dragOverId === player.id;
              const isOnLoan   = (player as unknown as Record<string, unknown>).onLoan === true;
              const secondary  = (player as unknown as { secondaryRoles?: string[] }).secondaryRoles;

              return (
                <div
                  key={player.id}
                  {...(!isPlaying ? { draggable: true } : {})}
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ playerId: player.id, fromIndex: -1, isSubSlot: true }));
                    e.dataTransfer.effectAllowed = 'move';
                    setDesktopFromSub(true);
                    setDesktopDragId(player.id);
                    setDragFromSub(true);
                  }}
                  onDragEnd={() => { setDesktopDragId(null); setDesktopFromSub(false); setDragOverId(null); }}
                  onDragOver={handleDragOver}
                  onDrop={e => handleSubPanelDrop(e, player.id)}
                  onDragEnter={() => setDragOverId(player.id)}
                  onDragLeave={() => setDragOverId(null)}
                  onPointerDown={e => {
                    if (e.pointerType !== 'mouse') {
                      e.preventDefault();
                      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                      dragStateRef.current = {
                        playerId: player.id, fromSub: true,
                        startClientX: e.clientX, startClientY: e.clientY,
                        isDragging: false, longPressReady: false,
                      };
                      if (longPressRef.current) clearTimeout(longPressRef.current);
                      longPressRef.current = setTimeout(() => {
                        if (dragStateRef.current?.playerId === player.id)
                          dragStateRef.current.longPressReady = true;
                      }, LONG_PRESS_MS);
                      setDragFromSub(true);
                    }
                  }}
                  onPointerMove={e => handlePlayerPointerMove(e as React.PointerEvent<HTMLDivElement>, player.id)}
                  onPointerUp={e => handlePlayerPointerUp(e as React.PointerEvent<HTMLDivElement>, player.id)}
                  onClick={() => onSelectPlayer(selectedPlayerId === player.id ? null : player.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 border-b border-[#0d1a2a]
                    cursor-pointer min-h-[46px] transition-all relative
                    ${selectedPlayerId === player.id ? 'bg-sky-500/10' : 'hover:bg-[#0f1a2a]'}
                    ${isOver ? 'bg-amber-500/15' : ''}`}
                  style={{ touchAction: 'none', userSelect: 'none' }}
                >
                  {selectedPlayerId === player.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sky-400 rounded-r" />
                  )}
                  {isOver && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400 rounded-r" />
                  )}

                  <div className="w-7 h-7 rounded-md flex items-center justify-center
                    text-[11px] font-black text-white flex-shrink-0 relative"
                    style={{ background: (meta as { color: string }).color ?? '#555' }}>
                    {player.num}
                    {(player.specialRoles ?? []).includes('captain') && (
                      <span className="absolute -top-1 -right-1 text-[8px] leading-none">🪖</span>
                    )}
                    {player.injured && (
                      <span className="absolute -top-1 -right-1 text-[8px] leading-none">🩹</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-200 truncate leading-tight">
                        {lastName.length > 10 ? lastName.slice(0, 10) + '…' : lastName}
                      </span>
                      {isOnLoan && (
                        <span className="text-[7px] font-black text-amber-400 bg-amber-900/50
                          border border-amber-700/50 px-1 rounded flex-shrink-0">LÅN</span>
                      )}
                    </div>
                    <div className="text-[9px] font-semibold leading-tight mt-0.5 truncate"
                      style={{ color: roleColors.text }}>
                      {(meta as { label?: string }).label ?? player.role}
                    </div>
                    {secondary && secondary.length > 0 && (
                      <div className="text-[7px] text-[#4a6080] leading-tight mt-0.5 truncate">
                        [{secondary.map(r => ROLE_SHORT[r] ?? r.slice(0, 3).toUpperCase()).join(', ')}]
                      </div>
                    )}
                  </div>

                  {isOver && <span className="text-[15px] text-amber-400 flex-shrink-0">⇄</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};