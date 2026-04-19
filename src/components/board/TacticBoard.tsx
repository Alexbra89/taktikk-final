'use client';
import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Player, PlayerRole } from '../../types';
import {
  VW, VH, getFormations, DEFAULT_FORMATION,
} from '../../data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { HandballPitch } from './pitches/HandballPitch';
import { Ball, DrawingCanvas } from './BoardElements';
import { ROLE_META, ROLE_FAMILY } from '../../data/roleInfo';

// ══════════════════════════════════════════════════════════════
//  TACTIC BOARD v8 – FM LOOK + GLASSMORPHISM (RESPONSIV OPPDATERT)
// ══════════════════════════════════════════════════════════════

interface TacticBoardProps {
  selectedPlayerId: string | null;
  onSelectPlayer:   (id: string | null) => void;
  isTrainingMatch?: boolean;
  maxSubstitutions?: number;
}

interface ActiveDrag {
  playerId:       string;
  fromSub:        boolean;
  pointerId:      number;
  startClientX:   number;
  startClientY:   number;
  started:        boolean;
  longPressReady: boolean;
  isTouch:        boolean;
}

interface GhostPos { x: number; y: number; scaleIn: boolean }

interface UndoEntry {
  playerId:      string;
  prevPos:       { x: number; y: number };
  prevIsStarter: boolean | undefined;
  prevRole:      string;
}

interface TacticMoment { id: string; label: string; snapshot: string; at: string }
interface SvgPos { x: number; y: number }

// ─── KONSTANTER ───────────────────────────────────────────────
const ROLE_SHORT: Record<string, string> = {
  keeper:'KV', defender:'FS', wingback:'VB', sweeper:'SV',
  midfielder:'MB', box2box:'BBM', playmaker:'PM', winger:'KANT',
  forward:'ANG', false9:'F9', trequartista:'TQ', targetman:'TM',
  pressforward:'PF', libero:'LIB',
  hb_keeper:'KV', hb_pivot:'PVT', hb_backcourt:'BP',
  hb_wing:'FL', hb_center:'MB', hb_playmaker:'PM',
};

const MIN_DIST     = 46;
const SNAP_R       = 15;
const LONG_PRESS   = 100;
const DRAG_THRESH  = 6;
const MAX_UNDO     = 25;
const CLAMP_MARGIN = 80;

const GLASS = {
  panel:  'rgba(8, 15, 35, 0.75)',
  border: 'rgba(56, 189, 248, 0.12)',
  hover:  'rgba(56, 189, 248, 0.07)',
  active: 'rgba(56, 189, 248, 0.15)',
};

function getDutyColors(role: string): { bg: string; text: string; glow: string } {
  if (['keeper','hb_keeper'].includes(role))
    return { bg:'rgba(26,58,92,0.85)',  text:'#7dd3fc', glow:'rgba(125,211,252,0.3)' };
  if (['defender','sweeper','libero'].includes(role))
    return { bg:'rgba(26,58,92,0.85)',  text:'#93c5fd', glow:'rgba(147,197,253,0.3)' };
  if (['wingback'].includes(role))
    return { bg:'rgba(22,58,42,0.85)',  text:'#6ee7b7', glow:'rgba(110,231,183,0.3)' };
  if (['midfielder','playmaker','box2box','hb_center','hb_playmaker','hb_backcourt'].includes(role))
    return { bg:'rgba(30,42,26,0.85)',  text:'#86efac', glow:'rgba(134,239,172,0.3)' };
  if (['forward','targetman','pressforward','false9','trequartista'].includes(role))
    return { bg:'rgba(42,26,26,0.85)',  text:'#fca5a5', glow:'rgba(252,165,165,0.3)' };
  if (['winger','hb_wing'].includes(role))
    return { bg:'rgba(42,21,32,0.85)',  text:'#f9a8d4', glow:'rgba(249,168,212,0.3)' };
  if (['hb_pivot'].includes(role))
    return { bg:'rgba(42,26,58,0.85)',  text:'#c4b5fd', glow:'rgba(196,181,253,0.3)' };
  return   { bg:'rgba(30,42,26,0.85)', text:'#86efac', glow:'rgba(134,239,172,0.3)' };
}

function separatePlayers(pts: SvgPos[], minDist = MIN_DIST): SvgPos[] {
  const r = pts.map(p => ({ ...p }));
  for (let it = 0; it < 1; it++) {
    for (let i = 0; i < r.length; i++) {
      for (let j = i + 1; j < r.length; j++) {
        const dx = r[j].x - r[i].x, dy = r[j].y - r[i].y;
        const d  = Math.hypot(dx, dy);
        if (d < minDist && d > 0.01) {
          const push = (minDist - d) * 0.1, nx = dx / d, ny = dy / d;
          r[i].x -= nx * push; r[i].y -= ny * push;
          r[i].x = Math.max(CLAMP_MARGIN, Math.min(VW - CLAMP_MARGIN, r[i].x));
          r[i].y = Math.max(CLAMP_MARGIN, Math.min(VH - CLAMP_MARGIN, r[i].y));
          r[j].x = Math.max(CLAMP_MARGIN, Math.min(VW - CLAMP_MARGIN, r[j].x));
          r[j].y = Math.max(CLAMP_MARGIN, Math.min(VH - CLAMP_MARGIN, r[j].y));
        }
      }
    }
  }
  return r;
}

function nearestSlotPos(
  pos: SvgPos,
  slots: { position: { x: number; y: number } }[],
  r = SNAP_R,
): SvgPos | null {
  let best: SvgPos | null = null, bestD = r;
  for (const s of slots) {
    const d = Math.hypot(s.position.x - pos.x, s.position.y - pos.y);
    if (d < bestD) { bestD = d; best = s.position; }
  }
  return best;
}

// ══════════════════════════════════════════════════════════════
//  SVG-KOMPONENTER
// ══════════════════════════════════════════════════════════════

const JerseyIcon = React.memo<{
  x:number; y:number; num:number; color:string;
  selected:boolean; injured:boolean; specialRoles:string[];
  isDragging:boolean; isTarget:boolean; isOutOfPos:boolean;
}>(({ x,y,num,color,selected,injured,specialRoles,isDragging,isTarget,isOutOfPos }) => {
  const w=38, h=34, sh=9, nw=10, nh=5, tx=x-w/2, ty=y-h/2;
  return (
    <g opacity={isDragging ? 0.32 : 1} style={{ transition:'opacity 0.1s' }}>
      {selected && (
        <>
          <circle cx={x} cy={y} r={38} fill={color} opacity={0.08}/>
          <circle cx={x} cy={y} r={31} fill="none" stroke="#38bdf8"
            strokeWidth={2} strokeDasharray="6,3" opacity={0.9}/>
          <path d={`M ${x-20},${y-26} A 26,26 0 0,1 ${x+20},${y-26}`}
            fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeLinecap="round"/>
        </>
      )}
      {isTarget && !selected && (
        <circle cx={x} cy={y} r={32} fill="rgba(251,191,36,0.08)"
          stroke="#fbbf24" strokeWidth={1.8} opacity={0.85}/>
      )}
      {isOutOfPos && !selected && (
        <circle cx={x} cy={y} r={28} fill="#f97316" opacity={0.08}/>
      )}
      <path d={`M ${tx+nw},${ty} L ${tx},${ty+sh} L ${tx+6},${ty+sh+4}
          L ${tx+6},${ty+h} L ${tx+w-6},${ty+h}
          L ${tx+w-6},${ty+sh+4} L ${tx+w},${ty+sh}
          L ${tx+w-nw},${ty} Q ${x},${ty-nh} ${tx+nw},${ty} Z`}
        fill={injured ? '#334155' : color}
        stroke={selected ? '#38bdf8' : isOutOfPos ? '#f97316' : 'rgba(255,255,255,0.18)'}
        strokeWidth={selected ? 1.6 : 0.7}
        filter="url(#jerseyDrop)"
      />
      <path d={`M ${tx+nw+2},${ty+1} L ${tx+2},${ty+sh-1} L ${tx+7},${ty+sh+3} L ${tx+7},${ty+h*0.45} Q ${x},${ty-nh+4} ${tx+w-nw-2},${ty+1} Z`}
        fill="rgba(255,255,255,0.07)" style={{pointerEvents:'none'}}/>
      <text x={x} y={y+4} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={13} fontWeight="900" fontFamily="system-ui,sans-serif"
        paintOrder="stroke" stroke="rgba(0,0,0,0.6)" strokeWidth={2.5}
        style={{pointerEvents:'none'}}>{num}</text>
      {injured && <text x={x+16} y={y-13} fontSize={11} style={{pointerEvents:'none'}}>🩹</text>}
      {specialRoles.includes('captain') && <text x={x-20} y={y-13} fontSize={11} style={{pointerEvents:'none'}}>🪖</text>}
      {specialRoles.includes('penalty') && <text x={x+16} y={y-13} fontSize={10} style={{pointerEvents:'none'}}>🎯</text>}
      {specialRoles.includes('freekick') && !specialRoles.includes('penalty') &&
        <text x={x+16} y={y-13} fontSize={10} style={{pointerEvents:'none'}}>⚡</text>}
      {specialRoles.includes('corner') && <text x={x+16} y={y-1} fontSize={9} style={{pointerEvents:'none'}}>📍</text>}
    </g>
  );
});
JerseyIcon.displayName = 'JerseyIcon';

const RoleBadge = React.memo<{x:number;y:number;role:string}>(({ x,y,role }) => {
  const short = ROLE_SHORT[role] ?? role.slice(0,5).toUpperCase();
  const {bg, text, glow} = getDutyColors(role);
  return (
    <g style={{pointerEvents:'none'}}>
      <rect x={x-34} y={y+1} width={68} height={14} rx={5}
        fill={glow} opacity={0.5} style={{filter:'blur(3px)'}}/>
      <rect x={x-34} y={y} width={68} height={15} rx={4}
        fill={bg} stroke={text} strokeWidth={0.5} opacity={0.92}/>
      <rect x={x-33} y={y+0.5} width={66} height={6} rx={3.5}
        fill="rgba(255,255,255,0.06)" style={{pointerEvents:'none'}}/>
      <text x={x} y={y+8.5} textAnchor="middle" dominantBaseline="middle"
        fill={text} fontSize={8} fontWeight="700"
        fontFamily="system-ui,sans-serif" letterSpacing="0.07em">{short}</text>
    </g>
  );
});
RoleBadge.displayName = 'RoleBadge';

const NameLabel = React.memo<{x:number;y:number;name:string}>(({ x,y,name }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
    fill="rgba(255,255,255,0.92)" fontSize={9} fontWeight="600"
    fontFamily="system-ui,sans-serif"
    paintOrder="stroke" stroke="rgba(0,0,0,0.85)" strokeWidth={3}
    style={{pointerEvents:'none'}}>
    {name.length>12 ? name.slice(0,12)+'…' : name}
  </text>
));
NameLabel.displayName = 'NameLabel';

const ConditionDot = React.memo<{x:number;y:number;condition:number}>(({ x,y,condition }) => {
  const color = condition>80?'#22c55e':condition>60?'#f59e0b':'#ef4444';
  return (
    <g style={{pointerEvents:'none'}}>
      <circle cx={x+22} cy={y-18} r={6} fill={color} opacity={0.25} style={{filter:'blur(2px)'}}/>
      <circle cx={x+22} cy={y-18} r={4.5} fill="#0a0f1e"/>
      <circle cx={x+22} cy={y-18} r={3} fill={color}/>
      <circle cx={x+21} cy={y-19} r={1} fill="rgba(255,255,255,0.5)"/>
    </g>
  );
});
ConditionDot.displayName = 'ConditionDot';

const SwapOverlay = React.memo<{x:number;y:number}>(({ x,y }) => (
  <g style={{pointerEvents:'none'}}>
    <circle cx={x} cy={y} r={40}
      fill="rgba(251,191,36,0.06)" stroke="#fbbf24"
      strokeWidth={2} strokeDasharray="8,4" opacity={0.9}/>
    <circle cx={x} cy={y} r={16} fill="rgba(251,191,36,0.18)"/>
    <circle cx={x} cy={y} r={15} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1}/>
    <text x={x} y={y+1.5} textAnchor="middle" dominantBaseline="middle"
      fontSize={16} fill="#fbbf24" fontWeight="bold">⇄</text>
    <text x={x} y={y-52} textAnchor="middle" fontSize={9} fill="#fbbf24" fontWeight="800"
      paintOrder="stroke" stroke="rgba(0,0,0,0.9)" strokeWidth={2.5}>BYTT</text>
  </g>
));
SwapOverlay.displayName = 'SwapOverlay';

const DragGhost = React.memo<{x:number;y:number;color:string;num:number;name:string;role:string;scaleIn:boolean}>(
({ x,y,color,num,name,role,scaleIn }) => {
  const {text} = getDutyColors(role);
  const short = ROLE_SHORT[role] ?? role.slice(0,4).toUpperCase();
  return (
    <g style={{pointerEvents:'none'}} opacity={0.85}
      transform={`translate(${x},${y}) scale(${scaleIn?1.08:1})`}>
      <circle r={34} fill="none" stroke={color} strokeWidth={1} opacity={0.3} style={{filter:'blur(4px)'}}/>
      <circle r={32} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="5,3"/>
      <circle r={22} fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} filter="url(#jerseyDrop)"/>
      <path d="M -14,-16 A 18,18 0 0,1 14,-16" fill="none"
        stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round"/>
      <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={13} fontWeight="900"
        fontFamily="system-ui,sans-serif" paintOrder="stroke" stroke="rgba(0,0,0,0.6)" strokeWidth={2.5}>{num}</text>
      <rect x={-23} y={25} width={46} height={14} rx={3}
        fill="rgba(0,0,0,0.65)" stroke={text} strokeWidth={0.5}/>
      <rect x={-22} y={25.5} width={44} height={6} rx={2.5} fill="rgba(255,255,255,0.05)"/>
      <text x={0} y={33} textAnchor="middle" dominantBaseline="middle"
        fill={text} fontSize={7.5} fontWeight="700"
        fontFamily="system-ui,sans-serif" letterSpacing="0.05em">{short}</text>
      <text x={0} y={47} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.9)" fontSize={8} fontWeight="600"
        fontFamily="system-ui,sans-serif" paintOrder="stroke"
        stroke="rgba(0,0,0,0.85)" strokeWidth={2.5}>
        {name.length>10?name.slice(0,10)+'…':name}
      </text>
    </g>
  );
});
DragGhost.displayName = 'DragGhost';

const SnapIndicator = React.memo<{x:number;y:number}>(({ x,y }) => (
  <g style={{pointerEvents:'none'}}>
    <circle cx={x} cy={y} r={24} fill="rgba(34,197,94,0.08)"
      stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.9}/>
    <circle cx={x} cy={y} r={5} fill="#22c55e" opacity={0.6}/>
    <circle cx={x} cy={y} r={3} fill="rgba(255,255,255,0.5)"/>
  </g>
));
SnapIndicator.displayName = 'SnapIndicator';

const LoanBadge = React.memo<{x:number;y:number}>(({ x,y }) => (
  <g style={{pointerEvents:'none'}}>
    <rect x={x-16} y={y} width={32} height={12} rx={3}
      fill="rgba(120,53,15,0.9)" stroke="#fbbf24" strokeWidth={0.6}/>
    <text x={x} y={y+6.5} textAnchor="middle" dominantBaseline="middle"
      fill="#fbbf24" fontSize={7} fontWeight="800"
      fontFamily="system-ui,sans-serif" letterSpacing="0.06em">LÅN</text>
  </g>
));
LoanBadge.displayName = 'LoanBadge';

const SvgDefs: React.FC = () => (
  <defs>
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5"/>
    </filter>
    <filter id="jerseyDrop" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.7"/>
    </filter>
    <filter id="glowBlue">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="grass" patternUnits="userSpaceOnUse" width="50" height="50">
      <rect width="50" height="50" fill="#1a5c28"/>
      <rect width="50" height="25" fill="#1c6229"/>
    </pattern>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stopColor="transparent"/>
      <stop offset="100%" stopColor="rgba(0,0,0,0.35)"/>
    </radialGradient>
  </defs>
);

// ══════════════════════════════════════════════════════════════
//  HOVED-KOMPONENT
// ══════════════════════════════════════════════════════════════
export const TacticBoard: React.FC<TacticBoardProps> = ({
  selectedPlayerId,
  onSelectPlayer: onSelectPlayerProp,
  isTrainingMatch = false,
  maxSubstitutions = 5,
}) => {
  const onSelectPlayerRef = useRef(onSelectPlayerProp);
  useEffect(() => { onSelectPlayerRef.current = onSelectPlayerProp; }, [onSelectPlayerProp]);
  const stableOnSelectPlayer = useCallback((id: string | null) => {
    onSelectPlayerRef.current(id);
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const svgRef        = useRef<SVGSVGElement>(null);
  const drawPts       = useRef<SvgPos[]>([]);
  const isDrawingRef  = useRef(false);
  const timerRef      = useRef<ReturnType<typeof setInterval>|null>(null);
  const playRef       = useRef({ from:0, t:0 });
  const spacingDebRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const stickyDebRef  = useRef<ReturnType<typeof setTimeout>|null>(null);
  const longPressRef  = useRef<ReturnType<typeof setTimeout>|null>(null);
  const rafRef        = useRef<number|null>(null);
  const undoStack     = useRef<UndoEntry[]>([]);
  const redoStack     = useRef<UndoEntry[]>([]);

  const lastClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeDragRef = useRef<ActiveDrag|null>(null);

  const [ghostPos,         setGhostPos]         = useState<GhostPos|null>(null);
  const [snapTarget,       setSnapTarget]        = useState<SvgPos|null>(null);
  const [dragOverId,       setDragOverId]        = useState<string|null>(null);
  const [draggingPlayerId, setDraggingPlayerId]  = useState<string|null>(null);
  const [dragFromSub,      setDragFromSub]       = useState(false);
  const [bounceId,         setBounceId]          = useState<string|null>(null);
  const [localStickyNote,  setLocalStickyNote]   = useState('');
  const [drawMode,         setDrawMode]          = useState(false);
  const [drawColor,        setDrawColor]         = useState('#f87171');
  const [isPlaying,        setIsPlaying]         = useState(false);
  const [playSpeed,        setPlaySpeed]         = useState(1);
  const [interpFrom,       setInterpFrom]        = useState(0);
  const [interpT,          setInterpT]           = useState(0);
  const [liveDrawPts,      setLiveDrawPts]       = useState<SvgPos[]>([]);
  const [showSticky,       setShowSticky]        = useState(false);
  const [selectedFormation,setSelectedFormation] = useState('');
  const [subPanelOpen,     setSubPanelOpen]      = useState(true);
  const [showBottomSheet,  setShowBottomSheet]   = useState(false);
  const [isMobile,         setIsMobile]          = useState(false);
  const [substitutions,    setSubstitutions]     = useState(0);
  const [moments,          setMoments]           = useState<TacticMoment[]>([]);
  const [showMoments,      setShowMoments]       = useState(false);
  const [momentLabel,      setMomentLabel]       = useState('');
  const [showMoreMenu,     setShowMoreMenu]      = useState(false);

  const {
    sport, phases, activePhaseIdx,
    setActivePhaseIdx, addPhase, removePhase,
    updatePlayerPosition, updateBallPosition,
    addDrawing, clearDrawings, updateStickyNote,
    updatePlayerField, addPlayer, playerAccounts,
  } = useAppStore();

  const phase = phases[activePhaseIdx] ?? null;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 🆕 Sikrer at body-scroll låses opp hvis komponenten avmonteres midt i drag
  useEffect(() => {
    return () => {
    document.body.style.overflow = '';
    document.documentElement.style.touchAction = '';
  };
}, []);

  const availableFormations = useMemo(() =>
    getFormations(sport==='football7'?'football7':sport==='football9'?'football9':sport), [sport]);
  const defaultFormation = DEFAULT_FORMATION[
    sport==='football7'?'football7':sport==='football9'?'football9':sport
  ];

  useEffect(() => {
    if (availableFormations.length > 0 && !selectedFormation) {
      setSelectedFormation(defaultFormation);
    }
  }, [sport, availableFormations, defaultFormation, selectedFormation]);

  const clamp = useCallback((v:number,lo:number,hi:number) => Math.max(lo,Math.min(hi,v)), []);

  const currentHomePlayers = useMemo(() =>
    availableFormations.find(f=>f.name===selectedFormation)?.homePlayers ?? [],
    [availableFormations, selectedFormation]);

  useEffect(() => () => {
    if (spacingDebRef.current) clearTimeout(spacingDebRef.current);
    if (stickyDebRef.current)  clearTimeout(stickyDebRef.current);
    if (longPressRef.current)  clearTimeout(longPressRef.current);
    if (rafRef.current)        cancelAnimationFrame(rafRef.current);
    if (timerRef.current)      clearInterval(timerRef.current);
  }, []);

  const stickyNote = phase?.stickyNote ?? '';
  useEffect(() => { setLocalStickyNote(stickyNote); }, [stickyNote, activePhaseIdx]);

  const handleStickyChange = useCallback((v:string) => {
    setLocalStickyNote(v);
    if (stickyDebRef.current) clearTimeout(stickyDebRef.current);
    stickyDebRef.current = setTimeout(() => updateStickyNote(activePhaseIdx,v), 500);
  }, [activePhaseIdx, updateStickyNote]);

  const pushUndo = useCallback((e:UndoEntry) => {
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO+1), e];
    redoStack.current = [];
  }, []);

  const doUndo = useCallback(() => {
    const e = undoStack.current.pop(); if (!e||!phase) return;
    const p = phase.players.find(pl=>pl.id===e.playerId); if (!p) return;
    redoStack.current.push({ playerId:e.playerId, prevPos:{...p.position}, prevIsStarter:p.isStarter, prevRole:p.role });
    updatePlayerField(activePhaseIdx, e.playerId, {
      position:e.prevPos, isStarter:e.prevIsStarter,
      isOnField:e.prevIsStarter, role:e.prevRole as PlayerRole,
    });
  }, [phase, activePhaseIdx, updatePlayerField]);

  const doRedo = useCallback(() => {
    const e = redoStack.current.pop(); if (!e||!phase) return;
    const p = phase.players.find(pl=>pl.id===e.playerId); if (!p) return;
    undoStack.current.push({ playerId:e.playerId, prevPos:{...p.position}, prevIsStarter:p.isStarter, prevRole:p.role });
    updatePlayerField(activePhaseIdx, e.playerId, {
      position:e.prevPos, isStarter:e.prevIsStarter,
      isOnField:e.prevIsStarter, role:e.prevRole as PlayerRole,
    });
  }, [phase, activePhaseIdx, updatePlayerField]);

  useEffect(() => {
    const h = (e:KeyboardEvent) => {
      if ((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey) { e.preventDefault(); doUndo(); }
      if ((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); doRedo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [doUndo, doRedo]);

  const updateFormation = useCallback((name: string) => {
    if (!phase) return;
    const formation = availableFormations.find(f => f.name === name);
    if (!formation) return;
    const currentStarters = phase.players
      .filter(p => p.team === 'home' && p.isStarter === true)
      .sort((a, b) => (a.num || 0) - (b.num || 0));
    formation.homePlayers.forEach((slot, index) => {
      const player = currentStarters[index];
      if (!player) return;
      updatePlayerField(activePhaseIdx, player.id, {
        position: {
          x: clamp(slot.position.x, CLAMP_MARGIN, VW - CLAMP_MARGIN),
          y: clamp(slot.position.y, CLAMP_MARGIN, VH - CLAMP_MARGIN),
        },
        role: slot.role as PlayerRole,
      });
    });
    setSelectedFormation(name);
  }, [phase, activePhaseIdx, availableFormations, updatePlayerField, clamp]);

  const startPlayback = useCallback(() => {
    if (phases.length < 2) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    playRef.current = { from:0, t:0 };
    setInterpFrom(0); setInterpT(0); setActivePhaseIdx(0); setIsPlaying(true);
    timerRef.current = setInterval(() => {
      playRef.current.t += 0.025 * playSpeed;
      if (playRef.current.t >= 1) {
        const next = playRef.current.from + 1;
        if (next >= phases.length - 1) {
          clearInterval(timerRef.current!); timerRef.current=null;
          setIsPlaying(false); setActivePhaseIdx(phases.length-1); setInterpT(0); return;
        }
        playRef.current.from=next; playRef.current.t=0;
        setInterpFrom(next); setInterpT(0); setActivePhaseIdx(next);
      } else {
        setInterpT(playRef.current.t); setInterpFrom(playRef.current.from);
      }
    }, 30);
  }, [phases, playSpeed, setActivePhaseIdx]);

  const stopPlayback = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    setIsPlaying(false); setInterpT(0);
  }, []);

  const getDisplayPlayers = useCallback((): Player[] => {
    if (!phase) return [];
    if (!isPlaying || interpT===0) return phase.players;
    const from = phases[interpFrom], to = phases[Math.min(interpFrom+1,phases.length-1)];
    if (!from||!to) return phase.players;
    return from.players.map(fp => {
      const tp = to.players.find(p=>p.id===fp.id); if (!tp) return fp;
      return { ...fp, position:{
        x: fp.position.x + (tp.position.x - fp.position.x) * interpT,
        y: fp.position.y + (tp.position.y - fp.position.y) * interpT,
      }};
    });
  }, [phase, phases, interpFrom, interpT, isPlaying]);

  const getDisplayBall = useCallback((): SvgPos => {
    if (!phase) return { x:VW/2, y:VH/2 };
    if (!isPlaying||interpT===0) return phase.ball;
    const from=phases[interpFrom], to=phases[Math.min(interpFrom+1,phases.length-1)];
    if (!from||!to) return phase.ball;
    return {
      x: from.ball.x + (to.ball.x - from.ball.x) * interpT,
      y: from.ball.y + (to.ball.y - from.ball.y) * interpT,
    };
  }, [phase, phases, interpFrom, interpT, isPlaying]);

  // ─── FIX 1: toSVG med letter-box-korreksjon ───────────────────
  // preserveAspectRatio="xMidYMid meet" betyr at SVG-en kan ha
  // tomme kanter (letter-boxing) hvis aspect ratio ikke stemmer.
  // Vi beregner faktisk rendret størrelse og offset inni bounding rect.
  const toSVG = useCallback((cx: number, cy: number): SvgPos => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const rectW = rect.width;
    const rectH = rect.height;

    // Beregn faktisk rendret størrelse med "meet" (letterbox)
    const scaleX = rectW / VW;
    const scaleY = rectH / VH;
    const scale  = Math.min(scaleX, scaleY); // "meet" bruker minste skala

    const renderedW = VW * scale;
    const renderedH = VH * scale;

    // Sentrert offset (xMidYMid)
    const offsetX = (rectW - renderedW) / 2;
    const offsetY = (rectH - renderedH) / 2;

    // Klientkoordinater relativt til SVG-rektangelet
    const localX = cx - rect.left - offsetX;
    const localY = cy - rect.top  - offsetY;

    return {
      x: clamp((localX / renderedW) * VW, CLAMP_MARGIN, VW - CLAMP_MARGIN),
      y: clamp((localY / renderedH) * VH, CLAMP_MARGIN, VH - CLAMP_MARGIN),
    };
  }, [clamp]);

  const findPlayerAt = useCallback((sx:number, sy:number, excludeId?:string): Player|null => {
    let best:Player|null=null, bestD=54;
    for (const p of (phase?.players??[])) {
      if (p.id===excludeId||p.team!=='home') continue;
      const d = Math.hypot(p.position.x - sx, p.position.y - sy);
      if (d<bestD) { bestD=d; best=p; }
    }
    return best;
  }, [phase]);

  const scheduleSpacing = useCallback((movedId:string) => {
    if (spacingDebRef.current) clearTimeout(spacingDebRef.current);
    spacingDebRef.current = setTimeout(() => {
      if (!phase) return;
      const others = phase.players.filter(p=>p.team==='home'&&p.isStarter!==false&&p.id!==movedId);
      const pts    = others.map(p=>({x:p.position.x,y:p.position.y}));
      const sep    = separatePlayers(pts);
      sep.forEach((sp,i) => {
        const o=others[i]; if (!o) return;
        if (Math.abs(sp.x-o.position.x)>1||Math.abs(sp.y-o.position.y)>1)
          updatePlayerPosition(activePhaseIdx, o.id, {x:sp.x,y:sp.y});
      });
    }, 200);
  }, [phase, activePhaseIdx, updatePlayerPosition]);

  const canSub = useCallback((fromBench:boolean) =>
    isTrainingMatch||!fromBench||substitutions<maxSubstitutions,
    [isTrainingMatch, substitutions, maxSubstitutions]);

  const swapPlayers = useCallback((aId:string, bId:string) => {
    if (!phase) return;
    const a=phase.players.find(p=>p.id===aId), b=phase.players.find(p=>p.id===bId);
    if (!a||!b) return;
    pushUndo({ playerId:aId, prevPos:{...a.position}, prevIsStarter:a.isStarter, prevRole:a.role });
    const [ap,bp,ar,br,as_,bs] = [{...a.position},{...b.position},a.role,b.role,a.isStarter,b.isStarter];
    updatePlayerField(activePhaseIdx, aId, { position:bp, role:br as PlayerRole, isStarter:bs,  isOnField:bs  });
    updatePlayerField(activePhaseIdx, bId, { position:ap, role:ar as PlayerRole, isStarter:as_, isOnField:as_ });
    if ((as_===false)!==(bs===false)) setSubstitutions(s=>s+1);
    setBounceId(bId); setTimeout(()=>setBounceId(null),400);
  }, [phase, activePhaseIdx, updatePlayerField, pushUndo]);

  const moveToBench = useCallback((id:string) => {
    if (!phase) return;
    const p=phase.players.find(pl=>pl.id===id); if (!p) return;
    pushUndo({ playerId:id, prevPos:{...p.position}, prevIsStarter:p.isStarter, prevRole:p.role });
    updatePlayerField(activePhaseIdx, id, { isStarter:false, isOnField:false });
    setSubstitutions(s=>s+1);
  }, [phase, activePhaseIdx, updatePlayerField, pushUndo]);

  const moveToField = useCallback((id:string, pos:SvgPos) => {
    if (!phase) return;
    const p=phase.players.find(pl=>pl.id===id); if (!p) return;
    pushUndo({ playerId:id, prevPos:{...p.position}, prevIsStarter:p.isStarter, prevRole:p.role });
    updatePlayerField(activePhaseIdx, id, { isStarter:true, isOnField:true, position:pos });
    setSubstitutions(s=>s+1);
  }, [phase, activePhaseIdx, updatePlayerField, pushUndo]);

  const resolveDrop = useCallback((
    draggedId:string, fromSub:boolean,
    targetId:string|undefined,
    svgX:number, svgY:number,
  ) => {
    if (!phase) return;
    const dragged = phase.players.find(p=>p.id===draggedId); if (!dragged) return;
    const target  = targetId ? phase.players.find(p=>p.id===targetId) : null;

    if (target && target.id !== dragged.id) {
      if (!canSub(dragged.isStarter===false || target.isStarter===false)) return;
      swapPlayers(dragged.id, target.id);
      return;
    }

    let pos: SvgPos = {
      x: clamp(svgX, CLAMP_MARGIN, VW - CLAMP_MARGIN),
      y: clamp(svgY, CLAMP_MARGIN, VH - CLAMP_MARGIN),
    };
    const snap = nearestSlotPos(pos, currentHomePlayers);
    if (snap) pos = snap;

    if (dragged.isStarter===false||fromSub) {
      if (!canSub(true)) return;
      moveToField(dragged.id, pos);
    } else {
      pushUndo({ playerId:dragged.id, prevPos:{...dragged.position}, prevIsStarter:dragged.isStarter, prevRole:dragged.role });
      updatePlayerPosition(activePhaseIdx, dragged.id, pos);
      scheduleSpacing(dragged.id);
    }
    setBounceId(dragged.id); setTimeout(()=>setBounceId(null),400);
  }, [phase, canSub, swapPlayers, currentHomePlayers, moveToField, pushUndo, updatePlayerPosition, activePhaseIdx, scheduleSpacing, clamp]);

  const startDrag = useCallback((
    e: React.PointerEvent, playerId:string, fromSub:boolean,
  ) => {
    if (isPlaying||drawMode) return;
    e.preventDefault();
    e.stopPropagation();

      // 🆕 LÅS BODY-SCROLL
    document.body.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';

    lastClientRef.current = { x: e.clientX, y: e.clientY };

    const isTouch = e.pointerType !== 'mouse';
    activeDragRef.current = {
      playerId, fromSub, pointerId:e.pointerId,
      startClientX:e.clientX, startClientY:e.clientY,
      started:false, longPressReady:!isTouch,
      isTouch,
    };

    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    if (isTouch) {
      if (longPressRef.current) clearTimeout(longPressRef.current);
      longPressRef.current = setTimeout(() => {
        if (activeDragRef.current?.playerId===playerId)
          activeDragRef.current.longPressReady = true;
      }, LONG_PRESS);
    }
  }, [isPlaying, drawMode]);

  const moveDrag = useCallback((e: React.PointerEvent) => {
    const ad = activeDragRef.current;
    if (!ad) return;
    e.preventDefault();

    lastClientRef.current = { x: e.clientX, y: e.clientY };

    const moved = Math.hypot(e.clientX - ad.startClientX, e.clientY - ad.startClientY);

    if (!ad.started) {
      if (moved > DRAG_THRESH && ad.longPressReady) {
        ad.started = true;
        setDraggingPlayerId(ad.playerId);
        setDragFromSub(ad.fromSub);
        const sp = toSVG(e.clientX, e.clientY);
        setGhostPos({ x:sp.x, y:sp.y, scaleIn:true });
        setTimeout(()=>setGhostPos(s=>s?{...s,scaleIn:false}:null), 160);
      }
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const cx = e.clientX, cy = e.clientY;
    rafRef.current = requestAnimationFrame(() => {
      const sp   = toSVG(cx, cy);
      const snap = nearestSlotPos(sp, currentHomePlayers);
      setSnapTarget(snap);
      setGhostPos(s => s ? { ...s, x: snap ? snap.x : sp.x, y: snap ? snap.y : sp.y } : null);
      const near = findPlayerAt(sp.x, sp.y, ad.playerId);
      setDragOverId(near?.id ?? null);
    });
  }, [toSVG, currentHomePlayers, findPlayerAt]);

  const endDrag = useCallback((e: React.PointerEvent) => {
      // 🆕 LÅS OPP BODY-SCROLL
     document.body.style.overflow = '';
     document.documentElement.style.touchAction = '';

    const ad = activeDragRef.current;
    if (!ad) return;
    e.preventDefault();

    if (longPressRef.current) clearTimeout(longPressRef.current);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current=null; }

    const wasDragging = ad.started;
    const targetId    = dragOverId;

    activeDragRef.current = null;
    setGhostPos(null);
    setDragOverId(null);
    setDraggingPlayerId(null);
    setDragFromSub(false);
    setSnapTarget(null);

    if (!wasDragging) {
      stableOnSelectPlayer(selectedPlayerId === ad.playerId ? null : ad.playerId);
      return;
    }
    if (!phase) return;

    const finalPos = toSVG(lastClientRef.current.x, lastClientRef.current.y);
    resolveDrop(ad.playerId, ad.fromSub, targetId ?? undefined, finalPos.x, finalPos.y);
  }, [dragOverId, phase, selectedPlayerId, resolveDrop, stableOnSelectPlayer, toSVG]);

  const onSvgPtrDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPlaying||!drawMode) return;
    if ((e.target as SVGElement).closest('[data-player]')) return;
    e.preventDefault();
    isDrawingRef.current=true;
    const pt = toSVG(e.clientX, e.clientY);
    drawPts.current=[pt]; setLiveDrawPts([pt]);
    svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onSvgPtrMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawMode||!isDrawingRef.current) return;
    e.preventDefault();
    const pt = toSVG(e.clientX, e.clientY);
    drawPts.current.push(pt); setLiveDrawPts([...drawPts.current]);
  };
  const onSvgPtrUp = () => {
    if (drawMode&&isDrawingRef.current&&drawPts.current.length>2)
      addDrawing(activePhaseIdx, {pts:[...drawPts.current], color:drawColor});
    isDrawingRef.current=false; drawPts.current=[]; setLiveDrawPts([]);
  };

  const allDisplay   = useMemo(()=>getDisplayPlayers(),  [getDisplayPlayers]);

  const onField = useMemo(
    () => allDisplay.filter(p => p.team === 'home' && p.isStarter === true),
    [allDisplay]
  );
  const benchPlayers = useMemo(
    () => allDisplay.filter(p => p.team === 'home' && p.isStarter !== true),
    [allDisplay]
  );

  const displayBall  = useMemo(()=>getDisplayBall(), [getDisplayBall]);
  const progressFrac = phases.length>1?(interpFrom+interpT)/(phases.length-1):0;

  const maxSubs = isTrainingMatch?30:(sport==='football'?9:sport==='football7'?5:sport==='football9'?5:7);
  const subSlots = useMemo(()=>
    [...benchPlayers,...Array(Math.max(0,maxSubs-benchPlayers.length)).fill(null)] as (Player|null)[],
    [benchPlayers, maxSubs]);

  const getDisplayName = useCallback((player: Player): string => {
    const acc = playerAccounts.find(a => a.id === player.playerAccountId);
    return acc?.name || player.name || `#${player.num}`;
  }, [playerAccounts]);

  const isOutOfPos = useCallback((player:Player):boolean => {
    const fam = ROLE_FAMILY[player.role]; if (!fam) return false;
    const yFrac = player.position.y / VH;
    if (fam==='gk'  && yFrac < 0.7) return true;
    if (fam==='att' && yFrac > 0.5) return true;
    return false;
  }, []);

  const ghostPlayer = draggingPlayerId ? phase?.players.find(p=>p.id===draggingPlayerId) : null;
  const ghostMeta   = ghostPlayer ? (ROLE_META[ghostPlayer.role as keyof typeof ROLE_META]??null) : null;

  const subLimitReached = !isTrainingMatch&&substitutions>=maxSubstitutions;
  const DRAW_COLORS     = ['#f87171','#60a5fa','#4ade80','#fbbf24','#ffffff'];
  const glassStyle      = { '--glass-bg': GLASS.panel, '--glass-border': GLASS.border, '--glass-hover': GLASS.hover } as React.CSSProperties;

  const hasEnsuredStarters  = useRef(false);
  const isAddingPlayersRef  = useRef(false);

  useEffect(() => {
    if (!phase) return;
    if (hasEnsuredStarters.current) return;
    if (isAddingPlayersRef.current) return;

    const teamSize = sport === 'football' ? 11 : sport === 'football7' ? 7 : sport === 'football9' ? 9 : 7;
    const homePlayers = phase.players.filter(p => p.team === 'home');

    if (homePlayers.length >= teamSize) {
      const starters = homePlayers.filter(p => p.isStarter === true);
      if (starters.length < teamSize) {
        const candidates = homePlayers
          .filter(p => p.isStarter !== true)
          .sort((a, b) => (a.num || 999) - (b.num || 999));
        const needed = teamSize - starters.length;
        candidates.slice(0, needed).forEach((player, idx) => {
          const formation = availableFormations.find(f => f.name === selectedFormation);
          const slot = formation?.homePlayers[starters.length + idx];
          const pos = slot?.position ?? { x: 200 + player.num * 30, y: 280 };
          updatePlayerField(activePhaseIdx, player.id, {
            isStarter: true,
            isOnField: true,
            position: { x: clamp(pos.x, CLAMP_MARGIN, VW - CLAMP_MARGIN), y: clamp(pos.y, CLAMP_MARGIN, VH - CLAMP_MARGIN) },
          });
        });
      }
      hasEnsuredStarters.current = true;
      return;
    }

    isAddingPlayersRef.current = true;
    const formation = availableFormations.find(f => f.name === selectedFormation);
    const defaultPositions = formation?.homePlayers.map(slot => slot.position) ?? [];
    const existingNums = homePlayers.map(p => p.num);
    const needed = teamSize - homePlayers.length;

    for (let i = 0; i < needed; i++) {
      let newNum = 1;
      while (existingNums.includes(newNum)) newNum++;
      existingNums.push(newNum);
      const pos = defaultPositions[homePlayers.length + i] ?? { x: 200 + (homePlayers.length + i) * 50, y: 280 };
      addPlayer(activePhaseIdx, {
        id: `gen-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        num: newNum, name: `Spiller ${newNum}`, role: 'midfielder',
        position: { x: clamp(pos.x, CLAMP_MARGIN, VW - CLAMP_MARGIN), y: clamp(pos.y, CLAMP_MARGIN, VH - CLAMP_MARGIN) },
        team: 'home', notes: '', isStarter: true, isOnField: true, minutesPlayed: 0, specialRoles: [],
      });
    }
    hasEnsuredStarters.current = true;
    isAddingPlayersRef.current = false;
  }, [phase, sport, availableFormations, selectedFormation, activePhaseIdx, updatePlayerField, addPlayer, clamp]);

  useEffect(() => {
    if (!phase || !isMounted) return;
    if (process.env.NODE_ENV !== 'development') return;
    const currentHomeCount = phase.players.filter(p => p.team === 'home').length;
    if (currentHomeCount >= 20) return;
    const existingNums = phase.players.filter(p => p.team === 'home').map(p => p.num);
    const dummyNames = ['Ola','Kari','Per','Lise','Morten','Ingrid','Anders','Marte','Erik','Silje','Knut','Anne','Jonas','Hedda','Svein','Live','Geir','Tuva','Vidar','Frida'];
    for (let i = 0; i < 20 - currentHomeCount; i++) {
      let newNum = 1;
      while (existingNums.includes(newNum)) newNum++;
      existingNums.push(newNum);
      addPlayer(activePhaseIdx, {
        id: `dummy-player-${Date.now()}-${i}-${Math.random().toString(36).slice(2,6)}`,
        num: newNum, name: dummyNames[i % dummyNames.length] + (newNum > 10 ? ` ${newNum}` : ''),
        role: i % 5 === 0 ? 'keeper' : i % 3 === 0 ? 'defender' : i % 2 === 0 ? 'midfielder' : 'forward',
        position: { x: 100 + (i * 10) % 300, y: 100 + (i * 15) % 400 },
        team: 'home', notes: '', isStarter: false, isOnField: false, minutesPlayed: 0, specialRoles: [],
      });
    }
  }, [phase, isMounted, addPlayer, activePhaseIdx]);

  if (!phase || !isMounted) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"/>
          <span className="text-xs">Laster taktikktavle...</span>
        </div>
      </div>
    );
  }

  return (
    // FIX 4: Rot-div bruker IKKE overflow-hidden, og touch-action tillater pinch-zoom.
    // touch-action: 'pan-x pan-y pinch-zoom' – tillater scroll og zoom, men ikke default click-delay.
    <div
      className="flex flex-col h-full select-none"
      style={{ ...glassStyle, touchAction: 'none', overflow: 'hidden' }}
    >
      <div style={{
        background:'rgba(5,10,25,0.82)',
        backdropFilter:'blur(16px) saturate(1.4)',
        WebkitBackdropFilter:'blur(16px) saturate(1.4)',
        borderBottom:'1px solid rgba(56,189,248,0.1)',
        boxShadow:'0 1px 0 rgba(255,255,255,0.04)',
      }} className="flex-shrink-0 flex flex-wrap items-center gap-1 px-2 py-1.5">

        {isMobile ? (
          <select
            value={activePhaseIdx}
            onChange={(e) => !isPlaying && setActivePhaseIdx(parseInt(e.target.value))}
            disabled={isPlaying}
            style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(8px)'}}
            className="rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none min-h-[40px] flex-shrink-0"
          >
            {phases.map((ph, idx) => (
              <option key={ph.id} value={idx} style={{background:'#0c1525'}}>
                {ph.name || `Fase ${idx + 1}`} {ph.stickyNote ? '📌' : ''}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0">
            {phases.map((ph, idx) => (
              <button key={ph.id} onClick={() => !isPlaying && setActivePhaseIdx(idx)}
                style={{
                  background: activePhaseIdx===idx ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
                  border: activePhaseIdx===idx ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.15s ease',
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold min-h-[40px] whitespace-nowrap
                  ${activePhaseIdx===idx ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}
                  ${isPlaying ? 'opacity-50' : ''}`}>
                {ph.name || `Fase ${idx + 1}`}{ph.stickyNote && <span className="ml-1 text-amber-400">·</span>}
              </button>
            ))}
          </div>
        )}

        <button onClick={() => !isPlaying && addPhase()} disabled={isPlaying}
          style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.2)', backdropFilter:'blur(8px)' }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-400 text-base disabled:opacity-40 flex-shrink-0">＋</button>
        {phases.length > 1 && (
          <button onClick={() => { if (phases.length > 1) removePhase(activePhaseIdx); }} disabled={isPlaying}
            style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.15)', backdropFilter:'blur(8px)' }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 text-base disabled:opacity-40 flex-shrink-0">🗑️</button>
        )}

        {availableFormations.length>0&&(
          <select value={selectedFormation} onChange={e=>updateFormation(e.target.value)} disabled={isPlaying}
            style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(8px)'}}
            className="ml-1 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500/50 min-h-[40px] flex-shrink-0">
            {availableFormations.map(f=><option key={f.name} value={f.name} style={{background:'#0c1525'}}>{f.name}</option>)}
          </select>
        )}

        <div className="flex-1 min-w-[4px]"/>

        {[{fn:doUndo,icon:'↩',title:'Angre (Ctrl+Z)'},{fn:doRedo,icon:'↪',title:'Gjør om (Ctrl+Y)'}].map(({fn,icon,title})=>(
          <button key={icon} onClick={fn} title={title}
            style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(8px)'}}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 text-sm hover:text-slate-300 flex-shrink-0">
            {icon}
          </button>
        ))}

        {!isTrainingMatch&&(
          <span style={{
            background: subLimitReached?'rgba(248,113,113,0.1)':'rgba(255,255,255,0.04)',
            border: subLimitReached?'1px solid rgba(248,113,113,0.3)':'1px solid rgba(255,255,255,0.07)',
            backdropFilter:'blur(8px)',
          }} className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0
            ${subLimitReached?'text-red-400':'text-slate-400'}`}>
            🔄 {substitutions}/{maxSubstitutions}
          </span>
        )}
        {isTrainingMatch&&(
          <span style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',backdropFilter:'blur(8px)'}}
            className="text-[9px] font-bold text-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0">🏃 Trening</span>
        )}

        {isMobile ? (
          <>
            <button onClick={()=>setShowMoreMenu(!showMoreMenu)}
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(8px)'}}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 min-h-[40px] flex-shrink-0">
              ⋮ Mer
            </button>
            {showMoreMenu && (
              <div className="absolute top-12 right-2 z-50 mt-1 p-2 rounded-xl shadow-2xl"
                style={{background:'rgba(5,10,28,0.96)',backdropFilter:'blur(16px)',border:'1px solid rgba(56,189,248,0.15)'}}>
                <div className="flex flex-col gap-1">
                  <button onClick={()=>{setShowMoments(!showMoments);setShowMoreMenu(false);}}
                    className="px-3 py-2 rounded-lg text-[10px] font-bold text-left whitespace-nowrap"
                    style={{background:showMoments?'rgba(167,139,250,0.12)':'rgba(255,255,255,0.04)'}}>
                    📸 Øyeblikk
                  </button>
                  <button onClick={()=>{setShowSticky(!showSticky);setShowMoreMenu(false);}}
                    className="px-3 py-2 rounded-lg text-[10px] font-bold text-left"
                    style={{background:showSticky?'rgba(251,191,36,0.1)':'rgba(255,255,255,0.04)'}}>
                    📌 Notat
                  </button>
                  <button onClick={()=>{setDrawMode(!drawMode);setShowMoreMenu(false);}}
                    className="px-3 py-2 rounded-lg text-[10px] font-bold text-left"
                    style={{background:drawMode?'rgba(248,113,113,0.1)':'rgba(255,255,255,0.04)'}}>
                    ✏️ Tegn
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={()=>setShowMoments(!showMoments)}
              style={{
                background: showMoments?'rgba(167,139,250,0.12)':'rgba(255,255,255,0.04)',
                border: showMoments?'1px solid rgba(167,139,250,0.35)':'1px solid rgba(255,255,255,0.07)',
                backdropFilter:'blur(8px)',
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold min-h-[40px] flex-shrink-0 whitespace-nowrap
                ${showMoments?'text-violet-400':'text-slate-500 hover:text-slate-300'}`}>
              📸 Øyeblikk
            </button>
            <button onClick={()=>setShowSticky(!showSticky)}
              style={{
                background: showSticky?'rgba(251,191,36,0.1)':'rgba(255,255,255,0.04)',
                border: showSticky?'1px solid rgba(251,191,36,0.3)':'1px solid rgba(255,255,255,0.07)',
                backdropFilter:'blur(8px)',
              }}
              className={`px-2 py-1 rounded-lg text-[13px] min-h-[40px] flex-shrink-0
                ${showSticky?'text-amber-400':'text-slate-500 hover:text-slate-300'}`}>📌</button>
            <button onClick={()=>setDrawMode(!drawMode)}
              style={{
                background: drawMode?'rgba(248,113,113,0.1)':'rgba(255,255,255,0.04)',
                border: drawMode?'1px solid rgba(248,113,113,0.3)':'1px solid rgba(255,255,255,0.07)',
                backdropFilter:'blur(8px)',
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold min-h-[40px] whitespace-nowrap flex-shrink-0
                ${drawMode?'text-red-400':'text-slate-500 hover:text-slate-300'}`}>
              {drawMode?'✏️ Stopp':'✏️ Tegn'}
            </button>
          </>
        )}

        {drawMode&&DRAW_COLORS.map(c=>(
          <button key={c} onClick={()=>setDrawColor(c)}
            className={`w-7 h-7 rounded-full border-2 flex-shrink-0 transition-all
              ${drawColor===c?'border-white scale-110':'border-transparent opacity-55'}`}
            style={{background:c}}/>
        ))}

        {(phase?.drawings?.length??0)>0&&(
          <button onClick={()=>clearDrawings(activePhaseIdx)}
            style={{background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.12)'}}
            className="px-2 py-1 rounded-lg text-[13px] text-red-400/70 min-h-[40px] flex-shrink-0">🗑️</button>
        )}

        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(8px)'}}
          className={`flex items-center gap-1 rounded-lg px-1.5 py-1 flex-shrink-0 ${isMobile ? 'ml-auto' : ''}`}>
          <button onClick={()=>!isPlaying&&setActivePhaseIdx(Math.max(0,activePhaseIdx-1))}
            disabled={isPlaying||activePhaseIdx===0}
            className="text-slate-400 disabled:opacity-30 text-base px-1 min-w-[32px] min-h-[40px]">⏮</button>
          <button onClick={()=>isPlaying?stopPlayback():startPlayback()} disabled={phases.length<2}
            style={{
              background: phases.length<2?'transparent':isPlaying?'rgba(248,113,113,0.12)':'rgba(56,189,248,0.12)',
              border: phases.length<2?'1px solid rgba(255,255,255,0.07)':isPlaying?'1px solid rgba(248,113,113,0.4)':'1px solid rgba(56,189,248,0.4)',
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm
              ${phases.length<2?'text-slate-600 cursor-not-allowed':isPlaying?'text-red-400':'text-sky-400'}`}>
            {isPlaying?'⏸':'▶'}
          </button>
          <button onClick={()=>!isPlaying&&setActivePhaseIdx(Math.min(phases.length-1,activePhaseIdx+1))}
            disabled={isPlaying||activePhaseIdx===phases.length-1}
            className="text-slate-400 disabled:opacity-30 text-base px-1 min-w-[32px] min-h-[40px]">⏭</button>
          <div className="ml-1 pl-1" style={{borderLeft:'1px solid rgba(255,255,255,0.07)'}}>
            <select value={playSpeed} onChange={e=>setPlaySpeed(parseFloat(e.target.value))} disabled={isPlaying}
              style={{background:'transparent',border:'none'}}
              className="text-[10px] text-slate-400 focus:outline-none min-h-[40px] cursor-pointer">
              {[0.5,1,1.5,2].map(v=><option key={v} value={v} style={{background:'#0c1525'}}>{v}×</option>)}
            </select>
          </div>
        </div>

        {isMobile&&(
          <button onClick={()=>setShowBottomSheet(true)}
            style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',backdropFilter:'blur(8px)'}}
            className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-400 min-h-[40px] flex-shrink-0 ml-auto">
            🪑 {benchPlayers.length}
          </button>
        )}
      </div>

      {showSticky&&phase&&(
        <div style={{background:'rgba(251,191,36,0.05)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(251,191,36,0.15)'}}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2">
          <span className="text-amber-400 text-[13px]">📌</span>
          <input value={localStickyNote} onChange={e=>handleStickyChange(e.target.value)}
            placeholder={`Notat for ${phase.name}…`}
            className="flex-1 bg-transparent border-none text-amber-100 text-[13px] placeholder-amber-500/35 focus:outline-none min-h-[40px]"/>
        </div>
      )}

      {showMoments&&(
        <div style={{background:'rgba(5,8,22,0.88)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(167,139,250,0.15)'}}
          className="flex-shrink-0 px-3 py-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">📸 Taktiske Øyeblikk</span>
          </div>
          <div className="flex gap-2 mb-2">
            <input value={momentLabel} onChange={e=>setMomentLabel(e.target.value)}
              onKeyDown={e=>{
                if (e.key==='Enter'&&momentLabel.trim()&&phase) {
                  setMoments(m=>[...m,{id:`${Date.now()}`,label:momentLabel.trim(),snapshot:JSON.stringify(phase),at:new Date().toISOString()}]);
                  setMomentLabel('');
                }
              }}
              placeholder="Navn på øyeblikk…"
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(167,139,250,0.2)'}}
              className="flex-1 rounded-lg px-3 py-1.5 text-[11px] text-slate-200 focus:outline-none min-h-[36px]"/>
            <button onClick={()=>{
              if (!momentLabel.trim()||!phase) return;
              setMoments(m=>[...m,{id:`${Date.now()}`,label:momentLabel.trim(),snapshot:JSON.stringify(phase),at:new Date().toISOString()}]);
              setMomentLabel('');
            }} disabled={!momentLabel.trim()}
              style={{background:'rgba(167,139,250,0.12)',border:'1px solid rgba(167,139,250,0.3)'}}
              className="px-3 py-1.5 rounded-lg text-violet-400 text-[11px] font-bold disabled:opacity-40">Lagre</button>
          </div>
          {moments.length>0&&(
            <div className="flex gap-2 overflow-x-auto pb-1">
              {moments.map(m=>(
                <div key={m.id}
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(167,139,250,0.15)',backdropFilter:'blur(8px)'}}
                  className="flex-shrink-0 rounded-xl px-3 py-2 min-w-[120px]">
                  <div className="text-[10px] font-bold text-violet-300">{m.label}</div>
                  <div className="text-[8px] text-slate-500 mt-0.5">
                    {new Date(m.at).toLocaleTimeString('nb-NO',{hour:'2-digit',minute:'2-digit'})}
                  </div>
                  <button onClick={()=>setMoments(ms=>ms.filter(x=>x.id!==m.id))}
                    className="text-[8px] text-red-400 mt-1 hover:text-red-300">Slett</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* FIX 4: SVG-wrapper bruker overflow-hidden kun horisontalt for å unngå
            at pinch-zoom blokkeres. Vertikal overflow tillates ikke (unngår scroll-glitch). */}
        <div
          className="flex-1 min-w-0 min-h-0 flex flex-col items-stretch landscape:min-h-[250px]"
          style={{ padding: '4px', overflowX: 'hidden', overflow: 'hidden' }}
        >
          {selectedFormation&&(
            <div className="flex-shrink-0 flex items-center justify-center py-1">
              <div style={{
                background:'rgba(5,10,28,0.7)',backdropFilter:'blur(12px)',
                border:'1px solid rgba(56,189,248,0.12)',boxShadow:'0 0 20px rgba(56,189,248,0.05)',
              }} className="flex items-center gap-2 px-4 py-1.5 rounded-xl">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Formasjon</span>
                <span className="text-[13px] font-black text-slate-100 tracking-wider uppercase">{selectedFormation}</span>
              </div>
            </div>
          )}

          {/* FIX 4: SVG bruker touch-action pan-x pan-y pinch-zoom –
              dette lar nettleseren håndtere pinch-zoom mens vi
              likevel fanger pointer events for drag av spillere. */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              flex: 1, width: '100%', height: '100%', display: 'block',
              boxShadow: '0 0 80px rgba(0,0,0,0.95)',
              cursor: drawMode ? 'crosshair' : 'default',
              // FIX 4: 'none' blokkerer pinch-zoom. Bruker pan+pinch-zoom i stedet.
              // Drag-logikken håndteres via pointer-events manuelt.
              touchAction: 'pan-x pan-y pinch-zoom',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={onSvgPtrDown}
            onPointerMove={onSvgPtrMove}
            onPointerUp={onSvgPtrUp}
            onPointerLeave={onSvgPtrUp}
          >
            <SvgDefs/>
            <rect width={VW} height={VH} fill="url(#grass)"/>
            <rect width={VW} height={VH} fill="url(#vignette)"/>

            {(sport==='football'||sport==='football7'||sport==='football9')&&<FootballPitch/>}
            {sport==='handball'&&<HandballPitch/>}
            {phase.drawings?.map(d=><DrawingCanvas key={d.id} drawing={d}/>)}
            {liveDrawPts.length>1&&(
              <polyline points={liveDrawPts.map(p=>`${p.x},${p.y}`).join(' ')}
                stroke={drawColor} strokeWidth={4} fill="none"
                strokeLinecap="round" strokeLinejoin="round" opacity={0.85}/>
            )}
            {phase&&(
              <Ball position={displayBall} isDraggable={!isPlaying&&!drawMode}
                onPositionChange={pos=>updateBallPosition(activePhaseIdx,pos)}/>
            )}

            {snapTarget&&ghostPos&&<SnapIndicator x={snapTarget.x} y={snapTarget.y}/>}

            {onField.map(player => {
              const meta       = ROLE_META[player.role as keyof typeof ROLE_META]??{color:'#64748b',label:player.role};
              const name       = getDisplayName(player);
              const isTarget   = dragOverId===player.id;
              const isSrc      = draggingPlayerId===player.id;
              const isOnLoan   = (player as any).onLoan === true;
              const condition  = typeof (player as any).condition === 'number' ? (player as any).condition : 90;
              const isBouncing = bounceId===player.id;
              const outOfPos   = isOutOfPos(player);
              const {x,y}      = player.position;
              const showSwap   = isTarget&&dragFromSub;
              const showHover  = isTarget&&!showSwap;

              return (
                <g key={player.id} data-player="true"
                  onPointerDown={e=>startDrag(e, player.id, false)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  style={{
                    cursor: !isPlaying&&!drawMode ? 'grab' : 'default',
                    // FIX 4: none her er nødvendig kun for selve spillerne
                    // for å forhindre at dragging scrolller siden.
                    touchAction: 'none',
                    transformOrigin: `${x}px ${y}px`,
                    transform: isBouncing?'scale(1.15)':'scale(1)',
                    transition: isBouncing?'transform 0.2s cubic-bezier(.34,1.56,.64,1)':'none',
                  }}
                >
                  {showSwap&&<SwapOverlay x={x} y={y}/>}
                  {showHover&&(
                    <circle cx={x} cy={y} r={32} fill="none"
                      stroke="rgba(56,189,248,0.6)" strokeWidth={2} strokeDasharray="6,4"/>
                  )}
                  <JerseyIcon x={x} y={y} num={player.num} color={(meta as {color:string}).color}
                    selected={selectedPlayerId===player.id} injured={!!player.injured}
                    specialRoles={player.specialRoles??[]} isDragging={!!isSrc}
                    isTarget={isTarget} isOutOfPos={outOfPos}/>
                  <RoleBadge x={x} y={y+23} role={player.role}/>
                  <NameLabel x={x} y={y+47} name={name}/>
                  {isOnLoan&&<LoanBadge x={x} y={y+58}/>}
                  <ConditionDot x={x} y={y} condition={condition}/>
                  {(player.minutesPlayed??0)>0&&(
                    <circle cx={x} cy={y} r={29} fill="none"
                      stroke={(player.minutesPlayed??0)>60?'#ef4444':(player.minutesPlayed??0)>30?'#f59e0b':'#22c55e'}
                      strokeWidth={1.5} opacity={0.3} strokeDasharray="3 2"/>
                  )}
                </g>
              );
            })}

            {ghostPos&&ghostPlayer&&ghostMeta&&(
              <DragGhost x={ghostPos.x} y={ghostPos.y}
                color={(ghostMeta as {color:string}).color??'#555'}
                num={ghostPlayer.num} name={getDisplayName(ghostPlayer)}
                role={ghostPlayer.role} scaleIn={ghostPos.scaleIn}/>
            )}

            {isPlaying&&(
              <rect x={32} y={VH-14} rx={3} height={5}
                width={progressFrac*(VW-64)} fill="#38bdf8" opacity={0.8}/>
            )}
          </svg>
        </div>

        {!isMobile&&(
          <div style={{
            width: subPanelOpen?176:38,
            background:'rgba(5,10,25,0.78)',
            backdropFilter:'blur(20px) saturate(1.3)',
            WebkitBackdropFilter:'blur(20px) saturate(1.3)',
            borderLeft:'1px solid rgba(56,189,248,0.08)',
            transition:'width 0.2s ease',
          }} className="flex-shrink-0 flex flex-col overflow-hidden">
            <div style={{background:'rgba(255,255,255,0.03)',borderBottom:'1px solid rgba(56,189,248,0.08)'}}
              className="flex-shrink-0 flex items-center justify-between px-2 py-2 min-h-[48px]">
              {subPanelOpen&&(
                <div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {isTrainingMatch?'Spillere':'Innbyttere'}
                  </div>
                  <div className={`text-[10px] font-bold ${subLimitReached?'text-red-400':'text-amber-400'}`}>
                    {benchPlayers.length}<span className="text-slate-600 font-normal">/{maxSubs}</span>
                  </div>
                </div>
              )}
              <button onClick={()=>setSubPanelOpen(!subPanelOpen)}
                style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)'}}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 text-sm flex-shrink-0">
                {subPanelOpen?'›':'‹'}
              </button>
            </div>

            {subPanelOpen&&(
              <div className="flex-1 overflow-y-auto py-0.5">
                {subSlots.map((player,idx)=>(
                  <SubRow key={player?.id??`empty-${idx}`}
                    player={player} idx={idx}
                    isSelected={!!player&&selectedPlayerId===player.id}
                    isDragOver={!!player&&dragOverId===player.id}
                    displayName={player?getDisplayName(player):''}
                    isLimited={subLimitReached}
                    onSelect={()=>player&&stableOnSelectPlayer(selectedPlayerId===player.id?null:player.id)}
                    onPointerDown={e=>player&&startDrag(e as React.PointerEvent, player.id, true)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    isDraggable={!!player&&!isPlaying}/>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isMobile&&showBottomSheet&&(
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={()=>setShowBottomSheet(false)}>
          <div className="absolute inset-0" style={{background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}/>
          <div style={{
            background:'rgba(5,10,28,0.92)',backdropFilter:'blur(24px) saturate(1.4)',
            borderTop:'1px solid rgba(56,189,248,0.12)',borderRadius:'20px 20px 0 0',maxHeight:'65vh',
          }} className="relative flex flex-col" onClick={e=>e.stopPropagation()}>
            <div className="flex-shrink-0 flex flex-col items-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full mb-2" style={{background:'rgba(255,255,255,0.15)'}}/>
              <div className="flex items-center justify-between w-full px-4">
                <div>
                  <span className="text-[11px] font-black text-slate-200">{isTrainingMatch?'Spillere':'Innbyttere'}</span>
                  <span className={`ml-2 text-[10px] font-bold ${subLimitReached?'text-red-400':'text-amber-400'}`}>
                    {benchPlayers.length}/{maxSubs}
                  </span>
                </div>
                <button onClick={()=>setShowBottomSheet(false)}
                  style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)'}}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 text-sm">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {subSlots.map((player,idx)=>(
                <SubRow key={player?.id??`empty-${idx}`}
                  player={player} idx={idx}
                  isSelected={!!player&&selectedPlayerId===player.id}
                  isDragOver={!!player&&dragOverId===player.id}
                  displayName={player?getDisplayName(player):''}
                  isLimited={subLimitReached}
                  onSelect={()=>player&&stableOnSelectPlayer(selectedPlayerId===player.id?null:player.id)}
                  onPointerDown={e=>player&&startDrag(e as React.PointerEvent, player.id, true)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  isDraggable={!!player&&!isPlaying}/>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SubRow: React.FC<{
  player:          Player|null;
  idx:             number;
  isSelected:      boolean;
  isDragOver:      boolean;
  displayName:     string;
  isLimited:       boolean;
  onSelect:        () => void;
  onPointerDown:   (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove:   (e: React.PointerEvent) => void;
  onPointerUp:     (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  isDraggable:     boolean;
}> = React.memo(({
  player, idx, isSelected, isDragOver, displayName,
  isLimited, onSelect,
  onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  isDraggable,
}) => {
  if (!player) {
    return (
      <div style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}
        className="flex items-center gap-2 px-2.5 py-2 min-h-[46px] hover:bg-white/[0.02] transition-colors">
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] text-slate-600 flex-shrink-0">–</div>
        <div className="text-[9.5px] text-slate-600 italic">R{idx+1}</div>
      </div>
    );
  }

  const meta     = ROLE_META[player.role as keyof typeof ROLE_META]??{color:'#555',label:player.role};
  const rc       = getDutyColors(player.role);
  const lastName = displayName.includes(' ') ? displayName.split(' ').slice(-1)[0] : displayName;

  return (
    <div
      onPointerDown={isDraggable ? onPointerDown : undefined}
      onPointerMove={isDraggable ? (e => onPointerMove(e as React.PointerEvent)) : undefined}
      onPointerUp={isDraggable   ? (e => onPointerUp(e as React.PointerEvent))   : undefined}
      onPointerCancel={isDraggable ? (e => onPointerCancel(e as React.PointerEvent)) : undefined}
      onClick={onSelect}
      style={{
        background: isDragOver?'rgba(251,191,36,0.08)':isSelected?'rgba(56,189,248,0.06)':'transparent',
        borderBottom:'1px solid rgba(255,255,255,0.04)',
        borderLeft: isDragOver?'2px solid #fbbf24':isSelected?'2px solid #38bdf8':'2px solid transparent',
        touchAction:'none', userSelect:'none',
        transition:'background 0.1s, border-color 0.1s',
      }}
      className="flex items-center gap-2 px-2.5 py-2 cursor-pointer min-h-[46px] relative hover:bg-white/[0.03]"
    >
      <div className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 relative"
        style={{
          background: (meta as {color:string}).color ?? '#555',
          boxShadow: `0 0 8px ${(meta as {color:string}).color}33`,
        }}>
        {player.num}
        {(player.specialRoles??[]).includes('captain')&&<span className="absolute -top-1 -right-1 text-[8px] leading-none">🪖</span>}
        {player.injured&&<span className="absolute -top-1 -right-1 text-[8px] leading-none">🩹</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-slate-200 truncate leading-tight">
          {lastName.length>10?lastName.slice(0,10)+'…':lastName}
        </div>
        <div className="text-[9px] font-semibold leading-tight mt-0.5 truncate" style={{color:rc.text}}>
          {(meta as {label?:string}).label??player.role}
        </div>
      </div>

      {isDragOver&&<span className="text-[14px] text-amber-400 flex-shrink-0">⇄</span>}
    </div>
  );
});
SubRow.displayName = 'SubRow';
