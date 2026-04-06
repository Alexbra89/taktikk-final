'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Player, PlayerRole } from '../../types';
import { VW, VH, getFormations, DEFAULT_FORMATION } from '../../data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { HandballPitch } from './pitches/HandballPitch';
import { Ball, DrawingCanvas } from './BoardElements';
import { ROLE_META } from '../../data/roleInfo';

// ══════════════════════════════════════════════════════════════
//  FM-STYLE TACTIC BOARD  v4
//  Layout  : [Formasjonsnavn + SVG-bane] [Innbytter-panel]
//  Brikker : Trøye-SVG · Rolle-badge · Navn · Kondisjon
//  Nytt v4: playSpeed kontroll i toolbar + secondaryRoles visning
// ══════════════════════════════════════════════════════════════

interface TacticBoardProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

// ── Rollefortkortelser (norske) ────────────────────────────
const ROLE_SHORT: Record<string, string> = {
  keeper:       'KV',
  defender:     'FS',
  wingback:     'VB',
  sweeper:      'SV',
  midfielder:   'MB',
  box2box:      'BBM',
  playmaker:    'PM',
  winger:       'KANT',
  forward:      'ANG',
  false9:       'F9',
  trequartista: 'TQ',
  targetman:    'TM',
  pressforward: 'PF',
  libero:       'LIB',
  hb_keeper:    'KV',
  hb_pivot:     'PVT',
  hb_backcourt: 'BP',
  hb_wing:      'FL',
  hb_center:    'MB',
  hb_playmaker: 'PM',
};

// ── Fargekoding per rolle (FM-inspirert) ──────────────────
const getDutyColors = (role: string): { bg: string; text: string } => {
  if (['keeper', 'hb_keeper'].includes(role))
    return { bg: '#1a3a5c', text: '#7dd3fc' };
  if (['defender', 'sweeper', 'libero'].includes(role))
    return { bg: '#1a3a5c', text: '#93c5fd' };
  if (['wingback'].includes(role))
    return { bg: '#163a2a', text: '#6ee7b7' };
  if (['midfielder', 'playmaker', 'box2box', 'hb_center', 'hb_playmaker', 'hb_backcourt'].includes(role))
    return { bg: '#1e2a1a', text: '#86efac' };
  if (['forward', 'targetman', 'pressforward', 'false9', 'trequartista'].includes(role))
    return { bg: '#2a1a1a', text: '#fca5a5' };
  if (['winger', 'hb_wing'].includes(role))
    return { bg: '#2a1520', text: '#f9a8d4' };
  if (['hb_pivot'].includes(role))
    return { bg: '#2a1a3a', text: '#c4b5fd' };
  return { bg: '#1e2a1a', text: '#86efac' };
};

// ══════════════════════════════════════════════════════════
//  SUB-KOMPONENTER
// ══════════════════════════════════════════════════════════

// ── SVG Trøye-silhuett ────────────────────────────────────
const JerseyIcon: React.FC<{
  x: number; y: number; num: number; color: string;
  selected?: boolean; injured?: boolean; specialRoles?: string[];
}> = ({ x, y, num, color, selected, injured, specialRoles = [] }) => {
  const w = 38, h = 34, sh = 9, nw = 10, nh = 5;
  const tx = x - w / 2, ty = y - h / 2;

  return (
    <g>
      {selected && (
        <circle cx={x} cy={y} r={28} fill="none"
          stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="5,3" opacity={0.95} />
      )}
      <path
        d={`M ${tx+nw},${ty} L ${tx},${ty+sh} L ${tx+6},${ty+sh+4} L ${tx+6},${ty+h}
            L ${tx+w-6},${ty+h} L ${tx+w-6},${ty+sh+4} L ${tx+w},${ty+sh}
            L ${tx+w-nw},${ty} Q ${x},${ty-nh} ${tx+nw},${ty} Z`}
        fill={injured ? '#475569' : color}
        stroke={selected ? '#38bdf8' : 'rgba(255,255,255,0.2)'}
        strokeWidth={selected ? 1.5 : 0.8}
        filter="url(#jerseyDrop)"
      />
      <text x={x} y={y + 4} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={13} fontWeight="900"
        fontFamily="system-ui, sans-serif"
        paintOrder="stroke" stroke="rgba(0,0,0,0.5)" strokeWidth={2.5}
        style={{ pointerEvents: 'none' }}>
        {num}
      </text>
      {/* Spesialroller som ikoner */}
      {injured && (
        <text x={x+15} y={y-13} fontSize={11} style={{ pointerEvents: 'none' }}>🩹</text>
      )}
      {specialRoles.includes('captain') && (
        <text x={x-19} y={y-13} fontSize={11} style={{ pointerEvents: 'none' }}>🪖</text>
      )}
      {specialRoles.includes('freekick') && !specialRoles.includes('penalty') && (
        <text x={x+15} y={y-13} fontSize={10} style={{ pointerEvents: 'none' }}>⚡</text>
      )}
      {specialRoles.includes('penalty') && (
        <text x={x+15} y={y-13} fontSize={10} style={{ pointerEvents: 'none' }}>🎯</text>
      )}
      {specialRoles.includes('corner') && (
        <text x={x+15} y={y-1} fontSize={9} style={{ pointerEvents: 'none' }}>📍</text>
      )}
    </g>
  );
};

// ── Rolle-badge (under trøya) ─────────────────────────────
const RoleBadge: React.FC<{ x: number; y: number; role: string }> = ({ x, y, role }) => {
  const short = ROLE_SHORT[role] ?? role.slice(0, 5).toUpperCase();
  const { bg, text } = getDutyColors(role);
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={x - 34} y={y} width={68} height={15} rx={4}
        fill={bg} stroke={text} strokeWidth={0.5} opacity={0.95} />
      <text x={x} y={y + 8.5} textAnchor="middle" dominantBaseline="middle"
        fill={text} fontSize={8} fontWeight="700"
        fontFamily="system-ui, sans-serif" letterSpacing="0.06em">
        {short}
      </text>
    </g>
  );
};

// ── Navn-label ────────────────────────────────────────────
const NameLabel: React.FC<{ x: number; y: number; name: string }> = ({ x, y, name }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
    fill="white" fontSize={9} fontWeight="600"
    fontFamily="system-ui, sans-serif"
    paintOrder="stroke" stroke="rgba(0,0,0,0.9)" strokeWidth={3}
    style={{ pointerEvents: 'none' }}>
    {name.length > 12 ? name.slice(0, 12) + '…' : name}
  </text>
);

// ── Kondisjonsprikk (liten farget sirkel øverst høyre) ────
const ConditionDot: React.FC<{ x: number; y: number; condition: number }> = ({ x, y, condition }) => {
  const color = condition > 80 ? '#22c55e' : condition > 60 ? '#f59e0b' : '#ef4444';
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={x + 21} cy={y - 17} r={4.5} fill="#0c1525" stroke={color} strokeWidth={1} />
      <circle cx={x + 21} cy={y - 17} r={3} fill={color} />
    </g>
  );
};

// ── Låne-spiller-badge ────────────────────────────────────
const LoanBadge: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g style={{ pointerEvents: 'none' }}>
    <rect x={x - 14} y={y} width={28} height={11} rx={3}
      fill="#78350f" stroke="#fbbf24" strokeWidth={0.6} opacity={0.9} />
    <text x={x} y={y + 6} textAnchor="middle" dominantBaseline="middle"
      fill="#fbbf24" fontSize={7} fontWeight="800"
      fontFamily="system-ui, sans-serif" letterSpacing="0.04em">
      LÅN
    </text>
  </g>
);

// ── Bytte-overlegg (vises når man drar over en spiller) ───
const SwapOverlay: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g style={{ pointerEvents: 'none' }}>
    <circle cx={x} cy={y} r={36}
      fill="rgba(251,191,36,0.08)" stroke="#fbbf24"
      strokeWidth={2.5} strokeDasharray="7,4" opacity={0.95} />
    {/* Bytte-pil-sirkel */}
    <circle cx={x} cy={y} r={14} fill="rgba(251,191,36,0.2)" />
    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
      fontSize={14} fill="#fbbf24" style={{ pointerEvents: 'none' }}>
      ⇄
    </text>
    <text x={x} y={y - 44} textAnchor="middle"
      fontSize={9} fill="#fbbf24" fontWeight="700"
      paintOrder="stroke" stroke="rgba(0,0,0,0.8)" strokeWidth={2}
      style={{ pointerEvents: 'none' }}>
      BYTT
    </text>
  </g>
);

// ══════════════════════════════════════════════════════════
//  HOVED-KOMPONENT
// ══════════════════════════════════════════════════════════
export const TacticBoard: React.FC<TacticBoardProps> = ({ selectedPlayerId, onSelectPlayer }) => {
  const svgRef    = useRef<SVGSVGElement>(null);
  const drawPts   = useRef<{x:number;y:number}[]>([]);
  const isDrawing = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const playRef   = useRef({ from: 0, t: 0 });
  const stickyDebounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localStickyNote, setLocalStickyNote] = useState('');
  const [drawMode, setDrawMode]       = useState(false);
  const [drawColor, setDrawColor]     = useState('#f87171');
  const [isPlaying, setIsPlaying]     = useState(false);
  const [playSpeed, setPlaySpeed]     = useState(1);
  const [interpFrom, setInterpFrom]   = useState(0);
  const [interpT, setInterpT]         = useState(0);
  const [liveDrawPts, setLiveDrawPts] = useState<{x:number;y:number}[]>([]);
  const [showSticky, setShowSticky]   = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<string>('');

  // Drag-tilstand
  const [dragOverPlayerId, setDragOverPlayerId] = useState<string | null>(null);
  const [dragOverSubId, setDragOverSubId]       = useState<string | null>(null);
  // Hvem som for øyeblikket dras (for å vise "bytt"-indikasjon)
  const [draggingFromSub, setDraggingFromSub]   = useState(false);

  const {
    sport, phases, activePhaseIdx,
    setActivePhaseIdx, addPhase, removePhase,
    updatePlayerPosition, updateBallPosition, addDrawing, clearDrawings,
    updateStickyNote, updatePlayerField, playerAccounts,
  } = useAppStore();

  const phase = phases[activePhaseIdx];
  const availableFormations = getFormations(
    sport === 'football7' ? 'football7' : sport === 'football9' ? 'football9' : sport
  );
  const defaultFormation = DEFAULT_FORMATION[sport === 'football7' ? 'football7' : sport];

  useEffect(() => {
    if (availableFormations.length > 0 && !selectedFormation)
      setSelectedFormation(defaultFormation);
  }, [sport, availableFormations, defaultFormation, selectedFormation]);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  // ── Oppdater formasjon ──────────────────────────────────
  const updateFormation = useCallback((name: string) => {
    if (!phase) return;
    if (formationDebounceRef.current) clearTimeout(formationDebounceRef.current);
    formationDebounceRef.current = setTimeout(() => {
      const f = availableFormations.find(f => f.name === name);
      if (!f) return;
      const home = [...phase.players]
        .filter(p => p.team === 'home')
        .sort((a, b) => (a.num || 0) - (b.num || 0));
      requestAnimationFrame(() => {
        f.homePlayers.forEach((fp, i) => {
          const p = home[i]; if (!p) return;
          updatePlayerField(activePhaseIdx, p.id, {
            position: {
              x: clamp(fp.position.x, 40, VW - 40),
              y: clamp(fp.position.y, 40, VH - 40),
            },
            role: fp.role as PlayerRole,
          });
        });
      });
      setSelectedFormation(name);
    }, 50);
  }, [phase, activePhaseIdx, availableFormations, updatePlayerField]);

  useEffect(() => () => {
    if (formationDebounceRef.current) clearTimeout(formationDebounceRef.current);
    if (stickyDebounceRef.current)    clearTimeout(stickyDebounceRef.current);
  }, []);

  useEffect(() => {
    setLocalStickyNote(phase?.stickyNote ?? '');
  }, [phase?.stickyNote, activePhaseIdx]);

  const handleStickyChange = useCallback((v: string) => {
    setLocalStickyNote(v);
    if (stickyDebounceRef.current) clearTimeout(stickyDebounceRef.current);
    stickyDebounceRef.current = setTimeout(() => updateStickyNote(activePhaseIdx, v), 500);
  }, [activePhaseIdx, updateStickyNote]);

  // ── Avspilling ──────────────────────────────────────────
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

  // ── Interpolert posisjon ────────────────────────────────
  function getDisplayPlayers(): Player[] {
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
  }

  function getDisplayBall() {
    if (!phase) return { x: VW/2, y: VH/2 };
    if (!isPlaying || interpT === 0) return phase.ball;
    const from = phases[interpFrom];
    const to   = phases[Math.min(interpFrom + 1, phases.length - 1)];
    if (!from || !to) return phase.ball;
    return {
      x: from.ball.x + (to.ball.x - from.ball.x) * interpT,
      y: from.ball.y + (to.ball.y - from.ball.y) * interpT,
    };
  }

  // ── SVG-koordinater ─────────────────────────────────────
  function toSVGCoords(cx: number, cy: number) {
    const svg = svgRef.current; if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return {
      x: clamp(((cx - r.left) / r.width)  * VW, 20, VW - 20),
      y: clamp(((cy - r.top)  / r.height) * VH, 20, VH - 20),
    };
  }

  // ── Tegne-hendelser ─────────────────────────────────────
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

  // ── Drag-and-drop ──────────────────────────────────────
  const handleDrop = (e: React.DragEvent, targetPlayerId?: string) => {
    e.preventDefault();
    setDragOverPlayerId(null);
    setDragOverSubId(null);
    setDraggingFromSub(false);

    let raw = e.dataTransfer.getData('text/plain');
    let draggedId = raw;
    let isFromSub = false;

    // JSON fra innbytter-panel eller sidebar
    if (raw.startsWith('{')) {
      try {
        const d = JSON.parse(raw);
        draggedId  = d.playerId;
        isFromSub  = d.isSubSlot === true;
      } catch { /* ignorer */ }
    }

    if (!draggedId || !phase) return;

    const dragged = phase.players.find(p => p.id === draggedId);
    const target  = targetPlayerId ? phase.players.find(p => p.id === targetPlayerId) : null;
    if (!dragged) return;

    // ── Innbytter → startspiller: BYTTE ───────────────────
    if ((isFromSub || dragged.isStarter === false) && target && target.isStarter !== false) {
      updatePlayerField(activePhaseIdx, dragged.id, { isStarter: true,  isOnField: true,  position: target.position });
      updatePlayerField(activePhaseIdx, target.id,  { isStarter: false, isOnField: false });
      return;
    }

    // ── Startspiller → innbytter (fra banen til benk-rad): BYTTE ─
    if (target && target.isStarter === false && dragged.isStarter !== false) {
      updatePlayerField(activePhaseIdx, dragged.id, { isStarter: false, isOnField: false });
      updatePlayerField(activePhaseIdx, target.id,  { isStarter: true,  isOnField: true,  position: dragged.position });
      return;
    }

    // ── Bytte mellom to startspillere ─────────────────────
    if (target && dragged.id !== target.id && dragged.isStarter !== false && target.isStarter !== false) {
      updatePlayerField(activePhaseIdx, dragged.id, { position: target.position, role: target.role });
      updatePlayerField(activePhaseIdx, target.id,  { position: dragged.position, role: dragged.role });
      return;
    }

    // ── Fritt drag til ny posisjon på banen ───────────────
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    updatePlayerPosition(activePhaseIdx, dragged.id, {
      x: ((e.clientX - rect.left) / rect.width)  * VW,
      y: ((e.clientY - rect.top)  / rect.height) * VH,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Hjelpefunksjon: visningsnavn
  const getDisplayName = useCallback((player: any) => {
    const acc = (playerAccounts as any[]).find((a: any) => a.playerId === player.id);
    return acc?.name || player.name || `#${player.num}`;
  }, [playerAccounts]);

  // ── Beregn visningsverdier ─────────────────────────────
  const allDisplay    = getDisplayPlayers();
  const onField       = allDisplay.filter(p => p.team === 'home' && p.isStarter !== false);
  const benchPlayers  = (phase?.players ?? []).filter(p => p.team === 'home' && p.isStarter === false);
  const displayBall   = getDisplayBall();
  const progressFrac  = phases.length > 1 ? (interpFrom + interpT) / (phases.length - 1) : 0;

  const maxSubs  = sport === 'football' ? 9 : 7;
  const subSlots = [...benchPlayers, ...Array(Math.max(0, maxSubs - benchPlayers.length)).fill(null)] as (any | null)[];

  const DRAW_COLORS = ['#f87171','#60a5fa','#4ade80','#fbbf24','#ffffff'];

  // Hastighetsvalg for avspilling
  const speedOptions = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" onDragOver={handleDragOver} onDrop={handleDrop}>

      {/* ═══ TOPPTOOLBAR ════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 bg-[#0d1626] border-b border-[#1e3050] overflow-x-auto overscroll-x-contain">

        {/* Fase-knapper */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {phases.map((ph, idx) => (
            <button key={ph.id}
              onClick={() => !isPlaying && setActivePhaseIdx(idx)}
              className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all min-h-[44px] whitespace-nowrap
                ${activePhaseIdx === idx ? 'bg-sky-500/15 border-sky-500 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}
                ${isPlaying ? 'opacity-50' : ''}`}>
              {ph.name}
              {ph.stickyNote && <span className="ml-1 text-amber-400">·</span>}
            </button>
          ))}
          <button onClick={() => !isPlaying && addPhase()} disabled={isPlaying}
            className="w-8 h-8 flex items-center justify-center rounded text-emerald-400 border border-[#1e3050] text-base disabled:opacity-40">＋</button>
          {phases.length > 1 && (
            <button onClick={() => !isPlaying && removePhase(activePhaseIdx)} disabled={isPlaying}
              className="w-8 h-8 flex items-center justify-center rounded text-red-400 border border-[#1e3050] text-base disabled:opacity-40">🗑️</button>
          )}
        </div>

        {/* Formasjonsvelger */}
        {availableFormations.length > 0 && (
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <span className="text-[9px] text-[#4a6080] hidden sm:inline">📐</span>
            <select value={selectedFormation}
              onChange={e => updateFormation(e.target.value)}
              disabled={isPlaying}
              className="bg-[#111c30] border border-[#1e3050] rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500 min-h-[40px]">
              {availableFormations.map(f => (
                <option key={f.name} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[8px]" />

        {/* Sticky-notat */}
        <button onClick={() => setShowSticky(!showSticky)}
          className={`px-2 py-1 rounded text-[13px] border min-h-[40px] transition-all flex-shrink-0
            ${showSticky ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
          📌
        </button>

        {/* Tegnemodus */}
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

        {/* Avspillingskontroller */}
        <div className="flex items-center gap-1 bg-[#111c30] rounded px-1.5 py-1 border border-[#1e3050] flex-shrink-0">
          <button onClick={() => !isPlaying && setActivePhaseIdx(Math.max(0, activePhaseIdx-1))}
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
          <button onClick={() => !isPlaying && setActivePhaseIdx(Math.min(phases.length-1, activePhaseIdx+1))}
            disabled={isPlaying || activePhaseIdx === phases.length-1}
            className="text-slate-400 disabled:opacity-30 text-base px-1 min-w-[32px] min-h-[40px]">⏭</button>

          {/* playSpeed velger - NYTT */}
          <div className="ml-1 pl-1 border-l border-[#1e3050]">
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(parseFloat(e.target.value))}
              disabled={isPlaying}
              className="bg-[#0a1420] border border-[#1e3050] rounded px-1.5 py-1 text-[10px] text-slate-300
                focus:outline-none focus:border-sky-500 min-h-[40px] cursor-pointer"
            >
              {speedOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
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
            className="flex-1 bg-transparent border-none text-amber-100 text-[13px] placeholder-amber-500/40 focus:outline-none min-h-[40px]" />
        </div>
      )}

      {/* ═══ HOVED-LAYOUT ═══════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── SVG-BANE ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col items-stretch" style={{ padding: '4px' }}>

          {/* Formasjonsnavn over banen (FM-stil) */}
          {selectedFormation && (
            <div className="flex-shrink-0 flex items-center justify-center py-1">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0f1a2a]/80 border border-[#1e3050]">
                <span className="text-[8px] font-bold text-[#4a6080] uppercase tracking-widest">Formasjon</span>
                <span className="text-[13px] font-black text-slate-100 tracking-wider uppercase">
                  {selectedFormation}
                </span>
              </div>
            </div>
          )}

          <svg ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              flex: 1, width: '100%', height: '100%', display: 'block',
              boxShadow: '0 0 60px rgba(0,0,0,0.9)',
              cursor: drawMode ? 'crosshair' : 'default',
              touchAction: 'none', userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={onSvgPointerDown}
            onPointerMove={onSvgPointerMove}
            onPointerUp={onSvgPointerUp}
            onPointerLeave={onSvgPointerUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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

            {/* ── FM-STIL SPILLERBRIKKER ─────────────────── */}
            {onField.map(player => {
              const meta        = ROLE_META[player.role as keyof typeof ROLE_META] ?? { color: '#64748b', label: player.role };
              const displayName = getDisplayName(player);
              const isDragOver  = dragOverPlayerId === player.id;
              const isOnLoan    = (player as any).onLoan === true;
              const condition   = (player as any).condition ?? 90;
              const { x, y }    = player.position;

              return (
                <g
                  key={player.id}
                  data-player="true"
                  onDragStart={e => {
                    if (!isPlaying && !drawMode) {
                      e.dataTransfer.setData('text/plain', player.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggingFromSub(false);
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, player.id)}
                  onDragEnter={() => setDragOverPlayerId(player.id)}
                  onDragLeave={() => setDragOverPlayerId(null)}
                  style={{ cursor: !isPlaying && !drawMode ? 'grab' : 'default' }}
                  onClick={() => !drawMode && onSelectPlayer(
                    selectedPlayerId === player.id ? null : player.id
                  )}
                >
                  {/* Bytte-overlegg (kun når man drar en innbytter over) */}
                  {isDragOver && draggingFromSub && (
                    <SwapOverlay x={x} y={y} />
                  )}

                  {/* Vanlig drag-hover ring (starter → starter) */}
                  {isDragOver && !draggingFromSub && (
                    <circle cx={x} cy={y} r={32} fill="none"
                      stroke="#38bdf8" strokeWidth={2.5}
                      strokeDasharray="6,4" opacity={0.8} />
                  )}

                  <JerseyIcon
                    x={x} y={y}
                    num={player.num}
                    color={meta.color}
                    selected={selectedPlayerId === player.id}
                    injured={player.injured}
                    specialRoles={player.specialRoles ?? []}
                  />

                  <RoleBadge x={x} y={y + 22} role={player.role} />

                  <NameLabel x={x} y={y + 46} name={displayName} />

                  {/* Lån-badge under navn */}
                  {isOnLoan && <LoanBadge x={x} y={y + 56} />}

                  {/* Kondisjonsprikk */}
                  <ConditionDot x={x} y={y} condition={condition} />

                  {/* Spilletid-ring */}
                  {(player.minutesPlayed ?? 0) > 0 && (
                    <circle cx={x} cy={y} r={29} fill="none"
                      stroke={(player.minutesPlayed ?? 0) > 60 ? '#ef4444'
                        : (player.minutesPlayed ?? 0) > 30 ? '#f59e0b' : '#22c55e'}
                      strokeWidth={1.5} opacity={0.35} strokeDasharray="3 2" />
                  )}
                </g>
              );
            })}

            {/* Fremdriftslinje */}
            {isPlaying && (
              <rect x={32} y={VH - 14} rx={3} height={5}
                width={progressFrac * (VW - 64)} fill="#38bdf8" opacity={0.8} />
            )}
          </svg>
        </div>

        {/* ═══ INNBYTTER-PANEL (FM-stil, høyre side) ═══════ */}
        <div className="flex-shrink-0 flex flex-col bg-[#0c1525] border-l border-[#1e3050] overflow-hidden"
          style={{ width: 172 }}>

          {/* Panel-header */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-2
            border-b border-[#1e3050] bg-[#0a1420]">
            <div>
              <div className="text-[9px] font-black text-[#4a6080] uppercase tracking-widest">Innbyttere</div>
              <div className="text-[8px] text-[#2a4060] mt-0.5">Dra hit for å bytte ut</div>
            </div>
            <span className="text-[12px] font-bold text-amber-400">
              {benchPlayers.length}
              <span className="text-[#3a5070] font-normal text-[10px]">/{maxSubs}</span>
            </span>
          </div>

          {/* Innbytter-rader */}
          <div className="flex-1 overflow-y-auto py-0.5">
            {subSlots.map((player, idx) => {
              if (!player) {
                return (
                  <div key={`empty-${idx}`}
                    className="flex items-center gap-2 px-2.5 py-2 border-b border-[#0d1a2a] min-h-[46px]
                      hover:bg-[#0f1a2a]/50 transition-colors">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center
                      text-[9px] text-[#1e3050] bg-[#0f1a2a] border border-[#1a2d45] flex-shrink-0">–</div>
                    <div className="text-[9.5px] text-[#1e3050] italic">Ledig plass</div>
                  </div>
                );
              }

              const meta        = ROLE_META[player.role as keyof typeof ROLE_META] ?? { color: '#555', label: player.role };
              const roleColors  = getDutyColors(player.role);
              const name        = getDisplayName(player);
              // Vis etternavn (siste ord) for å spare plass – FM-stil
              const lastName    = name.includes(' ') ? name.split(' ').slice(-1)[0] : name;
              const isOver      = dragOverSubId === player.id;
              const isOnLoan    = (player as any).onLoan === true;
              
              // Sekundære roller (secondaryRoles) - NYTT
              const secondaryRoles = (player as any).secondaryRoles as string[] | undefined;
              const hasSecondary = secondaryRoles && secondaryRoles.length > 0;

              return (
                <div
                  key={player.id}
                  draggable={!isPlaying ? "true" : "false"}
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                      playerId: player.id, fromIndex: -1, isSubSlot: true,
                    }));
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingFromSub(true);
                  }}
                  onDragEnd={() => setDraggingFromSub(false)}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, player.id)}
                  onDragEnter={() => setDragOverSubId(player.id)}
                  onDragLeave={() => setDragOverSubId(null)}
                  onClick={() => onSelectPlayer(selectedPlayerId === player.id ? null : player.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 border-b border-[#0d1a2a]
                    cursor-pointer min-h-[46px] transition-all group relative
                    ${selectedPlayerId === player.id ? 'bg-sky-500/10' : 'hover:bg-[#0f1a2a]'}
                    ${isOver ? 'bg-amber-500/15' : ''}`}
                >
                  {/* Seleksjons-/drag-streck venstre */}
                  {selectedPlayerId === player.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sky-400 rounded-r" />
                  )}
                  {isOver && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400 rounded-r" />
                  )}

                  {/* Trøye-farget nummerboks */}
                  <div className="w-7 h-7 rounded-md flex items-center justify-center
                    text-[11px] font-black text-white flex-shrink-0 relative"
                    style={{ background: meta.color }}>
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
                      {/* Lån-markering inline */}
                      {isOnLoan && (
                        <span className="text-[7px] font-black text-amber-400 bg-amber-900/50
                          border border-amber-700/50 px-1 rounded flex-shrink-0">LÅN</span>
                      )}
                    </div>
                    {/* Rolle i FM-farge */}
                    <div className="text-[9px] font-semibold leading-tight mt-0.5 truncate"
                      style={{ color: roleColors.text }}>
                      {meta.label ?? player.role}
                    </div>
                    {/* Sekundære roller - NYTT */}
                    {hasSecondary && (
                      <div className="text-[7px] text-[#4a6080] leading-tight mt-0.5 truncate">
                        [{secondaryRoles.map(r => ROLE_SHORT[r] ?? r.slice(0, 3).toUpperCase()).join(', ')}]
                      </div>
                    )}
                  </div>

                  {/* Bytte-indikator ved drag-over */}
                  {isOver && (
                    <span className="text-[14px] text-amber-400 flex-shrink-0 font-bold">⇄</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};