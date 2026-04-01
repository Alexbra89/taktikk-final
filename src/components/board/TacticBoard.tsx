'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Player } from '../../types';
import { VW, VH } from '../../data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { HandballPitch } from './pitches/HandballPitch';
import { DraggablePlayer, Ball, DrawingCanvas } from './BoardElements';

interface TacticBoardProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

export const TacticBoard: React.FC<TacticBoardProps> = ({ selectedPlayerId, onSelectPlayer }) => {
  const svgRef    = useRef<SVGSVGElement>(null);
  const drawPts   = useRef<{x:number;y:number}[]>([]);
  const isDrawing = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const playRef   = useRef({ from: 0, t: 0 });

  const [drawMode, setDrawMode]       = useState(false);
  const [drawColor, setDrawColor]     = useState('#f87171');
  const [isPlaying, setIsPlaying]     = useState(false);
  const [playSpeed, setPlaySpeed]     = useState(1);
  const [interpFrom, setInterpFrom]   = useState(0);
  const [interpT, setInterpT]         = useState(0);
  const [liveDrawPts, setLiveDrawPts] = useState<{x:number;y:number}[]>([]);
  const [showSticky, setShowSticky]   = useState(false);

  const {
    sport, phases, activePhaseIdx,
    setActivePhaseIdx, addPhase, removePhase,
    updatePlayerPosition, updateBallPosition, addDrawing, clearDrawings,
    updateStickyNote, awayTeamColor,
  } = useAppStore();

  const phase = phases[activePhaseIdx];

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
          setIsPlaying(false); setActivePhaseIdx(phases.length - 1); setInterpT(0);
          return;
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

  function toSVGCoords(clientX: number, clientY: number) {
    const svg = svgRef.current; if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(20, Math.min(VW - 20, ((clientX - rect.left) / rect.width) * VW)),
      y: Math.max(20, Math.min(VH - 20, ((clientY - rect.top)  / rect.height) * VH)),
    };
  }

  function onSvgPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (isPlaying || !drawMode) return;
    const target = e.target as SVGElement;
    if (target.closest('[data-player]')) return;
    e.preventDefault();
    isDrawing.current = true;
    const pt = toSVGCoords(e.clientX, e.clientY);
    drawPts.current = [pt];
    setLiveDrawPts([pt]);
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function onSvgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawMode || !isDrawing.current) return;
    e.preventDefault();
    const pt = toSVGCoords(e.clientX, e.clientY);
    drawPts.current.push(pt);
    setLiveDrawPts([...drawPts.current]);
  }

  function onSvgPointerUp() {
    if (drawMode && isDrawing.current && drawPts.current.length > 2)
      addDrawing(activePhaseIdx, { pts: [...drawPts.current], color: drawColor });
    isDrawing.current = false;
    drawPts.current = [];
    setLiveDrawPts([]);
  }

  // Filtrer kun hjemmelag-spillere for visning
  const allDisplayPlayers = getDisplayPlayers();
  const homeDisplayPlayers = allDisplayPlayers.filter(player => player.team === 'home');
  const displayBall    = getDisplayBall();
  const progressFrac   = phases.length > 1 ? (interpFrom + interpT) / (phases.length - 1) : 0;

  const DRAW_COLORS = ['#f87171','#60a5fa','#4ade80','#fbbf24','#ffffff'];

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Control bar */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 bg-[#0d1626] border-b border-[#1e3050] overflow-x-auto">
        {/* Faser */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {phases.map((ph, idx) => (
            <button key={ph.id}
              onClick={() => !isPlaying && setActivePhaseIdx(idx)}
              className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all min-h-[32px] whitespace-nowrap
                ${activePhaseIdx === idx ? 'bg-sky-500/15 border-sky-500 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}
                ${isPlaying ? 'opacity-50' : ''}`}>
              {ph.name}
              {ph.stickyNote && <span className="ml-1 text-amber-400">·</span>}
            </button>
          ))}
          <button onClick={() => !isPlaying && addPhase()} disabled={isPlaying}
            className="w-7 h-7 flex items-center justify-center rounded text-emerald-400 border border-[#1e3050] text-sm disabled:opacity-40">＋</button>
          {phases.length > 1 && (
            <button onClick={() => !isPlaying && removePhase(activePhaseIdx)} disabled={isPlaying}
              className="w-7 h-7 flex items-center justify-center rounded text-red-400 border border-[#1e3050] text-sm disabled:opacity-40">🗑️</button>
          )}
        </div>

        <div className="flex-1 min-w-[8px]" />

        {/* Sticky note */}
        <button onClick={() => setShowSticky(!showSticky)}
          className={`px-2 py-1 rounded text-[11px] border min-h-[32px] transition-all
            ${showSticky ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
          📌
        </button>

        {/* Draw mode */}
        <button onClick={() => setDrawMode(!drawMode)}
          className={`px-2 py-1 rounded text-[10px] font-bold border min-h-[32px] transition-all whitespace-nowrap
            ${drawMode ? 'bg-red-500/15 border-red-500 text-red-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
          {drawMode ? '✏️ Stopp' : '✏️ Tegn'}
        </button>

        {/* Draw colors — only when drawing */}
        {drawMode && DRAW_COLORS.map(c => (
          <button key={c} onClick={() => setDrawColor(c)}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all
              ${drawColor === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
            style={{ background: c }} />
        ))}

        {(phase?.drawings?.length ?? 0) > 0 && (
          <button onClick={() => clearDrawings(activePhaseIdx)}
            className="px-2 py-1 rounded text-[11px] border border-[#1e3050] text-red-400/70 min-h-[32px]">🗑️</button>
        )}

        {/* Playback */}
        <div className="flex items-center gap-1 bg-[#111c30] rounded px-1.5 py-1 border border-[#1e3050] flex-shrink-0">
          <button onClick={() => !isPlaying && setActivePhaseIdx(Math.max(0, activePhaseIdx-1))}
            disabled={isPlaying || activePhaseIdx === 0}
            className="text-slate-400 disabled:opacity-30 text-sm px-0.5 min-w-[24px] min-h-[28px]">⏮</button>
          <button onClick={() => isPlaying ? stopPlayback() : startPlayback()}
            disabled={phases.length < 2}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border transition-all
              ${phases.length < 2 ? 'border-[#1e3050] text-[#334155] cursor-not-allowed'
                : isPlaying ? 'border-red-500 bg-red-500/15 text-red-400'
                : 'border-sky-500 bg-sky-500/15 text-sky-400'}`}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => !isPlaying && setActivePhaseIdx(Math.min(phases.length-1, activePhaseIdx+1))}
            disabled={isPlaying || activePhaseIdx === phases.length-1}
            className="text-slate-400 disabled:opacity-30 text-sm px-0.5 min-w-[24px] min-h-[28px]">⏭</button>
        </div>
      </div>

      {showSticky && phase && (
        <div className="flex-shrink-0 px-3 py-1.5 bg-amber-500/8 border-b border-amber-500/20 flex items-center gap-2">
          <span className="text-amber-400 text-[11px]">📌</span>
          <input value={phase.stickyNote ?? ''}
            onChange={e => updateStickyNote(activePhaseIdx, e.target.value)}
            placeholder={`Notat for ${phase.name}…`}
            className="flex-1 bg-transparent border-none text-amber-100 text-[12px] placeholder-amber-500/40 focus:outline-none" />
        </div>
      )}

      {/* SVG — flex-1 min-h-0 critical for mobile */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-[#050c18]" style={{padding:'4px'}}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'block',
            boxShadow: '0 0 60px rgba(0,0,0,0.9)',
            cursor: drawMode ? 'crosshair' : 'default',
            touchAction: 'none',   // CRITICAL for mobile drawing
            userSelect: 'none',
          }}
          onPointerDown={onSvgPointerDown}
          onPointerMove={onSvgPointerMove}
          onPointerUp={onSvgPointerUp}
          onPointerLeave={onSvgPointerUp}
        >
          <defs>
            <filter id="dropShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.6"/>
            </filter>
            <pattern id="grass" patternUnits="userSpaceOnUse" width="50" height="50">
              <rect width="50" height="50" fill="#1b5e2a"/>
              <rect width="50" height="25" fill="#1d6430"/>
            </pattern>
          </defs>
          <rect width={VW} height={VH} fill="url(#grass)"/>

          {(sport === 'football' || sport === 'football7') && <FootballPitch />}
          {sport === 'handball' && <HandballPitch />}

          {phase?.drawings?.map(d => <DrawingCanvas key={d.id} drawing={d} />)}

          {/* Live drawing preview */}
          {liveDrawPts.length > 1 && (
            <g>
              <polyline points={liveDrawPts.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={drawColor} strokeWidth={3} fill="none"
                strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
              {(() => {
                const p1 = liveDrawPts[liveDrawPts.length-2];
                const p2 = liveDrawPts[liveDrawPts.length-1];
                const a = Math.atan2(p2.y-p1.y, p2.x-p1.x);
                const s = 12;
                return <polygon fill={drawColor} opacity={0.8}
                  points={`${p2.x},${p2.y} ${p2.x-s*Math.cos(a-Math.PI/6)},${p2.y-s*Math.sin(a-Math.PI/6)} ${p2.x-s*Math.cos(a+Math.PI/6)},${p2.y-s*Math.sin(a+Math.PI/6)}`}/>;
              })()}
            </g>
          )}

          {phase && (
            <Ball position={displayBall} isDraggable={!isPlaying && !drawMode}
              onPositionChange={pos => updateBallPosition(activePhaseIdx, pos)} />
          )}

          {/* Kun hjemmelag vises – bortelag filtreres ut */}
          {homeDisplayPlayers.map(player => (
            <DraggablePlayer key={player.id} player={player}
              isActive={!isPlaying && !drawMode}
              isSelected={selectedPlayerId === player.id}
              awayTeamColor={awayTeamColor}
              onPositionChange={pos => updatePlayerPosition(activePhaseIdx, player.id, pos)}
              onSelect={() => onSelectPlayer(selectedPlayerId === player.id ? null : player.id)}
              showName />
          ))}

          {isPlaying && (
            <rect x={32} y={VH - 14} rx={3} height={5}
              width={progressFrac * (VW - 64)} fill="#38bdf8" opacity={0.8} />
          )}
        </svg>
      </div>
    </div>
  );
};