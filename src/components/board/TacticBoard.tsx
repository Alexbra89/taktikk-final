'use client';
import React, { useRef, useState, useEffect } from 'react'; // Fjernet useCallback (ubrukt)
import { useAppStore } from '../../store/useAppStore';
import { Player } from '../../types';
import { VW, VH } from '../../data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { HandballPitch } from './pitches/HandballPitch';
// FJERN DENNE LINJEN: import { FloorballPitch } from './pitches/FloorballPitch';
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

  // ─── Playback ────────────────────────────────────────────────
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

  // ─── Interpolerte posisjoner ─────────────────────────────────
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

  // ─── SVG input ───────────────────────────────────────────────
  function svgXY(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current; if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(45, Math.min(VW-45, ((e.clientX-rect.left)/rect.width)*VW)),
      y: Math.max(45, Math.min(VH-45, ((e.clientY-rect.top)/rect.height)*VH)),
    };
  }

  function onSvgMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (isPlaying || !drawMode) return;
    const pt = svgXY(e);
    isDrawing.current = true;
    drawPts.current = [pt];
    setLiveDrawPts([pt]);
  }

  function onSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (isPlaying) return;
    if (drawMode && isDrawing.current) {
      const { x, y } = svgXY(e);
      drawPts.current.push({ x, y });
      setLiveDrawPts([...drawPts.current]);
    }
  }

  function onSvgMouseUp() {
    if (drawMode && isDrawing.current && drawPts.current.length > 4) {
      addDrawing(activePhaseIdx, { pts: [...drawPts.current], color: '#f87171' });
    }
    isDrawing.current = false;
    drawPts.current = [];
    setLiveDrawPts([]);
  }

  const displayPlayers = getDisplayPlayers();
  const displayBall    = getDisplayBall();
  const progressFrac   = phases.length > 1 ? (interpFrom + interpT) / (phases.length - 1) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* ── Kontrollrad ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-[#0d1626] border-b border-[#1e3050] flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-[#4a6080] uppercase tracking-widest mr-1">Faser</span>
          {phases.map((ph, idx) => (
            <button key={ph.id}
              onClick={() => !isPlaying && setActivePhaseIdx(idx)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all
                ${activePhaseIdx === idx ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                  : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}
                ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              {ph.name}
              {ph.stickyNote && <span className="ml-1 text-amber-400">📌</span>}
            </button>
          ))}
          <button onClick={() => !isPlaying && addPhase()} disabled={isPlaying}
            className="w-6 h-6 flex items-center justify-center rounded text-emerald-400 border border-[#1e3050] hover:border-emerald-500 text-sm disabled:opacity-40">＋</button>
          {phases.length > 1 && (
            <button onClick={() => !isPlaying && removePhase(activePhaseIdx)} disabled={isPlaying}
              className="w-6 h-6 flex items-center justify-center rounded text-red-400 border border-[#1e3050] hover:border-red-500 text-sm disabled:opacity-40">－</button>
          )}
        </div>

        <div className="flex-1" />

        <button onClick={() => setShowSticky(!showSticky)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all
            ${showSticky ? 'bg-amber-500/15 border-amber-500 text-amber-400'
              : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
          📌 Notat
        </button>

        <button onClick={() => setDrawMode(!drawMode)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all
            ${drawMode ? 'bg-red-500/15 border-red-500 text-red-400'
              : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
          {drawMode ? '✏️ Avslutt' : '✏️ Tegn'}
        </button>

        {(phase?.drawings?.length ?? 0) > 0 && (
          <button onClick={() => clearDrawings(activePhaseIdx)}
            className="px-2.5 py-1 rounded-md text-[11px] border border-[#1e3050] text-red-400/70 hover:text-red-400">
            🗑️
          </button>
        )}

        <div className="flex items-center gap-1.5 bg-[#111c30] rounded-lg px-2.5 py-1.5 border border-[#1e3050]">
          <button onClick={() => !isPlaying && setActivePhaseIdx(Math.max(0, activePhaseIdx-1))}
            disabled={isPlaying || activePhaseIdx === 0}
            className="text-slate-400 disabled:opacity-30 text-base px-0.5">⏮</button>
          <button onClick={() => isPlaying ? stopPlayback() : startPlayback()}
            disabled={phases.length < 2}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-all
              ${phases.length < 2 ? 'border-[#1e3050] text-[#334155] cursor-not-allowed'
                : isPlaying ? 'border-red-500 bg-red-500/15 text-red-400'
                : 'border-sky-500 bg-sky-500/15 text-sky-400'}`}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => !isPlaying && setActivePhaseIdx(Math.min(phases.length-1, activePhaseIdx+1))}
            disabled={isPlaying || activePhaseIdx === phases.length-1}
            className="text-slate-400 disabled:opacity-30 text-base px-0.5">⏭</button>
          <select value={playSpeed} onChange={e => setPlaySpeed(Number(e.target.value))}
            className="bg-transparent border-none text-[#4a6080] text-[11px] cursor-pointer ml-1">
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={3}>3×</option>
          </select>
        </div>
      </div>

      {showSticky && phase && (
        <div className="flex-shrink-0 px-3 py-2 bg-amber-500/8 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-[11px] font-bold whitespace-nowrap">📌 Fase-notat:</span>
            <input
              value={phase.stickyNote ?? ''}
              onChange={e => updateStickyNote(activePhaseIdx, e.target.value)}
              placeholder={`Hurtignotat for ${phase.name}…`}
              className="flex-1 bg-transparent border-none text-amber-100 text-[12px] placeholder-amber-500/40 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* ── SVG-bane ── */}
      <div className="flex-1 flex items-center justify-center p-3 bg-[#050c18] overflow-hidden">
        <svg ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          className="max-w-full max-h-full rounded-xl"
          style={{ boxShadow: '0 0 80px rgba(0,0,0,0.9)', cursor: drawMode ? 'crosshair' : 'default' }}
          onMouseDown={onSvgMouseDown}
          onMouseMove={onSvgMouseMove}
          onMouseUp={onSvgMouseUp}
          onMouseLeave={onSvgMouseUp}
        >
          <defs>
            <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.6"/></filter>
            <pattern id="grass" patternUnits="userSpaceOnUse" width="50" height="50">
              <rect width="50" height="50" fill="#1b5e2a"/>
              <rect width="50" height="25" fill="#1d6430"/>
            </pattern>
          </defs>
          <rect width={VW} height={VH} fill="url(#grass)"/>

          {/* RENDERING AV BANER - INNEBANDY ER FJERNET HERFRA */}
          {sport === 'football'  && <FootballPitch />}
          {sport === 'handball'  && <HandballPitch />}

          {phase?.drawings?.map(d => <DrawingCanvas key={d.id} drawing={d} />)}

          {liveDrawPts.length > 1 && (
            <polyline points={liveDrawPts.map(p => `${p.x},${p.y}`).join(' ')}
              stroke="#f87171" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray="8,5" />
          )}

          {phase && (
            <Ball position={displayBall} isDraggable={!isPlaying && !drawMode}
              onPositionChange={pos => updateBallPosition(activePhaseIdx, pos)} />
          )}

          {displayPlayers.map(player => (
            <DraggablePlayer key={player.id} player={player}
              isActive={!isPlaying && !drawMode}
              isSelected={selectedPlayerId === player.id}
              awayTeamColor={awayTeamColor}
              onPositionChange={pos => updatePlayerPosition(activePhaseIdx, player.id, pos)}
              onSelect={() => onSelectPlayer(selectedPlayerId === player.id ? null : player.id)}
              showName
            />
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