'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { VW, VH } from '@/data/formations';
import { FootballPitch } from '@/components/board/pitches/FootballPitch';
import { HandballPitch } from '@/components/board/pitches/HandballPitch';
import { ROLE_META } from '@/data/roleInfo';

// ═══════════════════════════════════════════════════════════════
//  FULLSCREEN BOARD — read-only for players, interactive for coach
//  Used as a modal overlay from both PlayerHome and page.tsx
// ═══════════════════════════════════════════════════════════════

interface FullscreenBoardProps {
  onClose: () => void;
  interactive?: boolean; // true = coach can draw/move
}

const getMeta = (role: any) => ROLE_META[role as keyof typeof ROLE_META] ?? null;
const getNum  = (p: any): number => p.number ?? p.num ?? 0;

export const FullscreenBoard: React.FC<FullscreenBoardProps> = ({ onClose, interactive = false }) => {
  const { phases, sport, activePhaseIdx, setActivePhaseIdx } = useAppStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playRef  = useRef({ from: 0, t: 0 });

  const [activeIdx, setActiveIdx]   = useState(activePhaseIdx);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [playSpeed, setPlaySpeed]   = useState(1);
  const [interpFrom, setInterpFrom] = useState(0);
  const [interpT, setInterpT]       = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after 3s of inactivity
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function resetHideTimer() {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 4000);
  }

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  function startPlayback() {
    if (phases.length < 2) return;
    if (timerRef.current) clearInterval(timerRef.current);
    playRef.current = { from: 0, t: 0 };
    setInterpFrom(0); setInterpT(0); setActiveIdx(0); setIsPlaying(true);
    timerRef.current = setInterval(() => {
      playRef.current.t += 0.025 * playSpeed;
      if (playRef.current.t >= 1) {
        const next = playRef.current.from + 1;
        if (next >= phases.length - 1) {
          clearInterval(timerRef.current!); timerRef.current = null;
          setIsPlaying(false); setActiveIdx(phases.length - 1); setInterpT(0);
          return;
        }
        playRef.current.from = next; playRef.current.t = 0;
        setInterpFrom(next); setInterpT(0); setActiveIdx(next);
      } else {
        setInterpT(playRef.current.t); setInterpFrom(playRef.current.from);
      }
    }, 30);
  }

  function stopPlayback() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsPlaying(false); setInterpT(0);
  }

  const phase = phases[activeIdx];
  if (!phase) return null;

  const displayPlayers = (() => {
    if (!isPlaying || interpT === 0) return phase.players;
    const from = phases[interpFrom];
    const to   = phases[Math.min(interpFrom + 1, phases.length - 1)];
    if (!from || !to) return phase.players;
    return (from.players as any[]).map((fp: any) => {
      const tp = (to.players as any[]).find((p: any) => p.id === fp.id);
      if (!tp) return fp;
      return { ...fp, position: {
        x: fp.position.x + (tp.position.x - fp.position.x) * interpT,
        y: fp.position.y + (tp.position.y - fp.position.y) * interpT,
      }};
    });
  })();

  const displayBall = (() => {
    if (!isPlaying || interpT === 0) return phase.ball;
    const from = phases[interpFrom];
    const to   = phases[Math.min(interpFrom + 1, phases.length - 1)];
    if (!from || !to) return phase.ball;
    return {
      x: from.ball.x + (to.ball.x - from.ball.x) * interpT,
      y: from.ball.y + (to.ball.y - from.ball.y) * interpT,
    };
  })();

  const progressFrac = phases.length > 1 ? (interpFrom + interpT) / (phases.length - 1) : 0;
  const homePlayers = (displayPlayers as any[]).filter((p: any) => p.team === 'home' &&
    p.isStarter !== false && p.isOnField !== false);
  const bench = (phase.players as any[]).filter((p: any) =>
    p.team === 'home' && (p.isStarter === false || p.isOnField === false));

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#050c18] flex flex-col"
      onPointerDown={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* ── Topbar (auto-hides) ── */}
      <div className={`flex-shrink-0 flex items-center gap-2 px-3 h-11
        bg-[#08101e]/95 border-b border-[#1a2d46] transition-all duration-300
        ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

        {/* Fase-knapper */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {phases.map((ph: any, idx: number) => (
            <button key={ph.id}
              onClick={() => { if (!isPlaying) { setActiveIdx(idx); setActivePhaseIdx(idx); } resetHideTimer(); }}
              className={`px-2.5 py-1 rounded text-[10px] font-bold border whitespace-nowrap min-h-[32px] transition-all
                ${activeIdx === idx ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}
                ${isPlaying ? 'opacity-40' : ''}`}>
              {ph.name}
              {ph.stickyNote && <span className="ml-1 text-amber-400">·</span>}
            </button>
          ))}
        </div>

        {/* Playback */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => { isPlaying ? stopPlayback() : startPlayback(); resetHideTimer(); }}
            disabled={phases.length < 2}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border transition-all
              ${phases.length < 2 ? 'border-[#1e3050] text-[#334155] cursor-not-allowed'
              : isPlaying ? 'border-red-500 bg-red-500/15 text-red-400'
              : 'border-sky-500 bg-sky-500/15 text-sky-400'}`}>
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* Lukk */}
        <button onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-[11px] border border-[#1e3050]
            text-[#4a6080] hover:text-white transition min-h-[32px] flex-shrink-0">
          ✕
        </button>
      </div>

      {/* ── SVG bane — med scrolling ── */}
      <div className="flex-1 min-h-0 overflow-auto" style={{ padding: '4px' }}>
        <div className="min-w-[880px] min-h-[560px] flex items-center justify-center">
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            <defs>
              <filter id="ds3">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.6"/>
              </filter>
              <pattern id="gr3" patternUnits="userSpaceOnUse" width="50" height="50">
                <rect width="50" height="50" fill="#1b5e2a"/>
                <rect width="50" height="25" fill="#1d6430"/>
              </pattern>
            </defs>
            <rect width={VW} height={VH} fill="url(#gr3)"/>

            {(sport === 'football' || sport === 'football7') && <FootballPitch />}
            {sport === 'handball' && <HandballPitch />}

            {/* Tegninger */}
            {(phase.drawings ?? []).map((d: any) => {
              if (!d.pts || d.pts.length < 2) return null;
              const p1 = d.pts[d.pts.length - 2];
              const p2 = d.pts[d.pts.length - 1];
              const a  = Math.atan2(p2.y - p1.y, p2.x - p1.x);
              const s  = 12;
              return (
                <g key={d.id}>
                  <polyline points={d.pts.map((p: any) => `${p.x},${p.y}`).join(' ')}
                    stroke={d.color ?? '#f87171'} strokeWidth={3} fill="none"
                    strokeLinecap="round" strokeLinejoin="round" />
                  <polygon fill={d.color ?? '#f87171'} opacity={0.88}
                    points={`${p2.x},${p2.y} ${p2.x-s*Math.cos(a-Math.PI/6)},${p2.y-s*Math.sin(a-Math.PI/6)} ${p2.x-s*Math.cos(a+Math.PI/6)},${p2.y-s*Math.sin(a+Math.PI/6)}`} />
                </g>
              );
            })}

            {/* Ball */}
            {displayBall && (
              <g filter="url(#ds3)">
                <circle cx={displayBall.x} cy={displayBall.y} r={11} fill="white" stroke="#ccc" strokeWidth={1}/>
                {[{dx:-3,dy:-3,r:3},{dx:3.5,dy:-1.5,r:2.5},{dx:0,dy:4,r:2.5},{dx:-4,dy:2,r:2}].map((o,i) => (
                  <circle key={i} cx={displayBall.x+o.dx} cy={displayBall.y+o.dy} r={o.r} fill="#111" opacity={0.7}/>
                ))}
              </g>
            )}

            {/* Spillere — hjemmelaget, kun startere */}
            {homePlayers.map((player: any) => {
              const meta = getMeta(player.role);
              const fill = meta?.color ?? '#64748b';
              const { x, y } = player.position;
              return (
                <g key={player.id} filter="url(#ds3)" opacity={player.injured ? 0.5 : 1}>
                  <circle cx={x} cy={y} r={38} fill="transparent" />
                  <circle cx={x} cy={y} r={21} fill="rgba(255,255,255,0.9)"/>
                  <circle cx={x} cy={y} r={18} fill={fill} stroke={fill} strokeWidth={1.5}/>
                  {(player.specialRoles ?? []).includes('captain') && (
                    <text x={x - 13} y={y - 13} fontSize={13} style={{ pointerEvents: 'none' }}>🪖</text>
                  )}
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize={12} fontWeight="800"
                    fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
                    {player.num}
                  </text>
                  {player.name && (
                    <text x={x} y={y + 31} textAnchor="middle"
                      fill="white" fontSize={9.5} fontWeight="600"
                      fontFamily="system-ui, sans-serif"
                      paintOrder="stroke" stroke="rgba(0,0,0,0.8)" strokeWidth={3}
                      style={{ pointerEvents: 'none' }}>
                      {player.name.length > 10 ? player.name.slice(0, 10) + '…' : player.name}
                    </text>
                  )}
                  {player.injured && (
                    <text x={x - 10} y={y - 14} fontSize={12} style={{ pointerEvents: 'none' }}>🩹</text>
                  )}
                </g>
              );
            })}

            {/* Fremdriftsbar */}
            {isPlaying && (
              <rect x={32} y={VH - 12} rx={3} height={5}
                width={progressFrac * (VW - 64)} fill="#38bdf8" opacity={0.8}/>
            )}
          </svg>
        </div>
      </div>

      {/* Sticky note */}
      {phase.stickyNote && (
        <div className={`flex-shrink-0 px-4 py-2 bg-amber-500/10 border-t border-amber-500/20
          transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[11px] text-amber-300">📌 {phase.stickyNote}</p>
        </div>
      )}

      {/* Innbyttere */}
      {bench.length > 0 && (
        <div className={`flex-shrink-0 px-3 py-2 bg-[#08101e] border-t border-[#1a2d46]
          transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex-shrink-0">
              🪑 Innbyttere
            </span>
            {bench.map((p: any) => {
              const meta = getMeta(p.role);
              return (
                <div key={p.id} className="flex items-center gap-1.5 bg-[#0f1a2a] border border-amber-500/20
                  rounded-lg px-2 py-1 flex-shrink-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: meta?.color ?? '#555' }}>
                    {getNum(p)}
                  </div>
                  <span className="text-[10px] text-slate-300">{p.name || `#${getNum(p)}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tap hint */}
      {!showControls && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/40 text-white/40 text-[10px] px-3 py-1.5 rounded-full">
            Trykk for å vise kontroller
          </div>
        </div>
      )}
    </div>
  );
};

// LEGG TIL DEFAULT EXPORT HER
export default FullscreenBoard;