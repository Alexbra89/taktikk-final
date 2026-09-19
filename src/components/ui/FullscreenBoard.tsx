'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic, getSlot } from '@/store/selectors';
import { VW, VH } from '@/data/formations';
import { FootballPitch } from '@/components/board/pitches/FootballPitch';
import { X, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/cn';

// ═══════════════════════════════════════════════════════════════
//  FULLSCREEN BOARD — read-only for players, interactive for coach
//  Used as a modal overlay from both PlayerHome and page.tsx
// ═══════════════════════════════════════════════════════════════

interface FullscreenBoardProps {
  onClose: () => void;
  interactive?: boolean; // true = coach can draw/move
}

const getNum  = (p: any): number => p.number ?? p.num ?? 0;

export const FullscreenBoard: React.FC<FullscreenBoardProps> = ({ onClose, interactive = false }) => {
  const { setActivePhaseIdx } = useAppStore();
  const tactic = useActiveTactic();
  const { phases, activePhaseIdx } = tactic;

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
  const homePlayers = displayPlayers as any[];

  return (
    <div
      className="fixed inset-0 z-[100] bg-canvas flex flex-col"
      onPointerDown={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* -- Topplinje (skjules automatisk) -- */}
      <div className={cn(
        'flex-shrink-0 flex items-center gap-1 px-2 h-12 bg-canvas-sunken border-b border-rule transition-opacity duration-300',
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}>
        <div role="tablist" aria-label="Faser" className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
          {phases.map((ph: any, idx: number) => {
            const active = activeIdx === idx;
            return (
              <button key={ph.id} role="tab" aria-selected={active}
                onClick={() => { if (!isPlaying) { setActiveIdx(idx); setActivePhaseIdx(idx); } resetHideTimer(); }}
                className={cn(
                  'px-3 min-h-[40px] rounded-ctl text-body whitespace-nowrap transition-colors',
                  active ? 'bg-canvas-raised text-ink shadow-hair' : 'text-ink-muted hover:text-ink hover:bg-canvas-hover',
                  isPlaying && 'opacity-50',
                )}>
                {ph.name}
                {ph.stickyNote && <span className="ml-1 text-signal" aria-hidden>·</span>}
              </button>
            );
          })}
        </div>

        <button onClick={() => { isPlaying ? stopPlayback() : startPlayback(); resetHideTimer(); }}
          disabled={phases.length < 2}
          aria-label={isPlaying ? 'Stopp avspilling' : 'Spill av fasene'}
          className={cn(
            'tap-auto w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-colors',
            phases.length < 2
              ? 'text-ink-faint cursor-not-allowed shadow-hair'
              : 'bg-signal text-signal-fg hover:brightness-110',
          )}>
          {isPlaying
            ? <Pause size={16} strokeWidth={2} fill="currentColor" />
            : <Play size={16} strokeWidth={2} fill="currentColor" />}
        </button>

        <button onClick={onClose} aria-label="Lukk fullskjerm"
          className="tap-auto w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors">
          <X size={17} strokeWidth={1.75} />
        </button>
      </div>

      {/* -- Banen tar hele hoyden som er igjen -- */}
      <div className="flex-1 min-h-0 p-1">
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
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.35"/>
            </filter>
          </defs>
          <rect width={VW} height={VH} style={{ fill: 'rgb(var(--k-pitch))' }}/>

          <FootballPitch />

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
                  stroke={d.color ?? '#EDEDEF'} strokeWidth={3} fill="none"
                  strokeLinecap="round" strokeLinejoin="round" />
                <polygon fill={d.color ?? '#EDEDEF'} opacity={0.88}
                  points={`${p2.x},${p2.y} ${p2.x-s*Math.cos(a-Math.PI/6)},${p2.y-s*Math.sin(a-Math.PI/6)} ${p2.x-s*Math.cos(a+Math.PI/6)},${p2.y-s*Math.sin(a+Math.PI/6)}`} />
              </g>
            );
          })}

          {/* Ball */}
          {displayBall && (
            <g filter="url(#ds3)">
              <circle cx={displayBall.x} cy={displayBall.y} r={10} style={{ fill: 'rgb(var(--k-ink))' }}/>
              <circle cx={displayBall.x} cy={displayBall.y} r={4} style={{ fill: 'rgb(var(--k-pitch))' }}/>
            </g>
          )}

          {/* Spillere - hjemmelaget, kun startere */}
          {homePlayers.map((player: any) => {
            const { x, y } = player.position;
            const label = getSlot(tactic, player.slotIdx).label;
            return (
              <g key={player.id}>
                <circle cx={x} cy={y} r={17} style={{ fill: 'rgb(var(--k-signal))' }}/>
                <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                  fontSize={13} fontWeight="600"
                  fontFamily="var(--font-mono), ui-monospace, monospace"
                  style={{ pointerEvents: 'none', fill: 'rgb(var(--k-signal-fg))' }}>
                  {player.num}
                </text>
                <text x={x} y={y + 29} textAnchor="middle" dominantBaseline="middle"
                  fontSize={8} fontWeight="500" letterSpacing="0.09em"
                  fontFamily="var(--font-mono), ui-monospace, monospace"
                  style={{ pointerEvents: 'none', fill: 'rgb(var(--k-ink-muted))' }}>
                  {label.toUpperCase()}
                </text>
                {player.name && (
                  <text x={x} y={y + 44} textAnchor="middle" dominantBaseline="middle"
                    fontSize={9.5} fontWeight="500"
                    fontFamily="var(--font-sans), system-ui, sans-serif"
                    style={{ pointerEvents: 'none', fill: 'rgb(var(--k-ink))' }}>
                    {player.name.length > 10 ? player.name.slice(0, 10) + '…' : player.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Fremdriftsbar */}
          {isPlaying && (
            <rect x={32} y={VH - 12} rx={2} height={4}
              width={progressFrac * (VW - 64)} style={{ fill: 'rgb(var(--k-signal))' }}/>
          )}
        </svg>
      </div>

      {/* Notat for fasen */}
      {phase.stickyNote && (
        <div className={cn(
          'flex-shrink-0 px-4 py-2 bg-canvas-sunken border-t border-rule transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0',
        )}>
          <p className="text-body text-ink-muted">{phase.stickyNote}</p>
        </div>
      )}

      {/* Hint */}
      {!showControls && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="rounded-pill bg-canvas-panel/80 px-3 py-1.5 text-caption text-ink-subtle">
            Trykk for å vise kontroller
          </div>
        </div>
      )}
    </div>
  );
};

// LEGG TIL DEFAULT EXPORT HER
export default FullscreenBoard;