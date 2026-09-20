'use client';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic, getSlot } from '@/store/selectors';
import { VW, VH, getFormationSlots } from '@/data/formations';
import { FootballPitch } from '@/components/board/pitches/FootballPitch';
import { LONG_PRESS, DRAG_THRESH, CLAMP_X, CLAMP_Y_TOP, CLAMP_Y_BOTTOM } from '@/components/board/constants';
import { nearestSlotPos, type SvgPos } from '@/lib/geometry';
import { useBoardZoom } from '@/hooks/useBoardZoom';
import { X, Play, Pause, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

// ═══════════════════════════════════════════════════════════════
//  FULLSCREEN BOARD — read-only for players, interactive for coach
//  Used as a modal overlay from both PlayerHome and page.tsx
//
//  Drag var aldri implementert her: `interactive` ble tatt imot og
//  aldri brukt, og spillerne var rene <circle> uten håndterere. Den
//  er nå på plass, med samme regler som TacticBoard (langtrykk på
//  berøring, terskel før draget starter, snapping til formasjonen)
//  og samme zoom via useBoardZoom.
// ═══════════════════════════════════════════════════════════════

/** Hva som dras. Ballen har ingen id – det finnes bare én. */
type DragTarget = { kind: 'player'; id: string } | { kind: 'ball' };

interface FullscreenBoardProps {
  onClose: () => void;
  interactive?: boolean; // true = coach can draw/move
}

const getNum  = (p: any): number => p.number ?? p.num ?? 0;

export const FullscreenBoard: React.FC<FullscreenBoardProps> = ({ onClose, interactive = false }) => {
  const { setActivePhaseIdx, movePlayer, moveBall } = useAppStore();
  const tactic = useActiveTactic();
  const { phases, activePhaseIdx, sport, formation } = tactic;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playRef  = useRef({ from: 0, t: 0 });
  const svgRef   = useRef<SVGSVGElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zoomCtl = useBoardZoom();
  // Samme grunn som i TacticBoard: håndtererne under er useCallback-er, og
  // ville ellers fryse gest-flagget fra renderen de sist ble laget i.
  const gestureRef = useRef({ isGesturing: false, spaceHeld: false });
  gestureRef.current = { isGesturing: zoomCtl.isGesturing, spaceHeld: zoomCtl.spaceHeld };

  const [activeIdx, setActiveIdx]   = useState(activePhaseIdx);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [playSpeed, setPlaySpeed]   = useState(1);
  const [interpFrom, setInterpFrom] = useState(0);
  const [interpT, setInterpT]       = useState(0);
  const [showControls, setShowControls] = useState(true);

  const dragRef = useRef<{
    target: DragTarget; pointerId: number;
    startX: number; startY: number; started: boolean; ready: boolean;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ target: DragTarget } & SvgPos | null>(null);

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

  // Fullskjerm har sin egen activeIdx, mens movePlayer/moveBall skriver til
  // fasen storen står i. Uten denne synkingen havner et drag etter avspilling
  // i feil fase.
  useEffect(() => {
    if (!isPlaying && activeIdx !== activePhaseIdx) setActivePhaseIdx(activeIdx);
  }, [activeIdx, isPlaying, activePhaseIdx, setActivePhaseIdx]);

  // Zoom skal ikke henge igjen når man bytter fase.
  const zoomResetRef = useRef(zoomCtl.reset);
  useEffect(() => { zoomResetRef.current = zoomCtl.reset; }, [zoomCtl.reset]);
  useEffect(() => { zoomResetRef.current(); }, [activeIdx, tactic.id, formation, sport]);

  // ─── Koordinater ────────────────────────────────────────────
  // Samme utregning som i TacticBoard: speiler preserveAspectRatio="xMidYMid
  // meet". getBoundingClientRect() tar med CSS-transformen, så zoomen krever
  // ingen egen korreksjon her.
  const toSVG = useCallback((cx: number, cy: number): SvgPos => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / VW, rect.height / VH);
    const renderedW = VW * scale, renderedH = VH * scale;
    const localX = cx - rect.left - (rect.width - renderedW) / 2;
    const localY = cy - rect.top - (rect.height - renderedH) / 2;
    const x = (localX / renderedW) * VW;
    const y = (localY / renderedH) * VH;
    return {
      x: Math.max(CLAMP_X, Math.min(VW - CLAMP_X, x)),
      y: Math.max(CLAMP_Y_TOP, Math.min(VH - CLAMP_Y_BOTTOM, y)),
    };
  }, []);

  const slots = useMemo(() => getFormationSlots(sport, formation), [sport, formation]);

  // ─── Drag av spillere og ball ───────────────────────────────
  const canDrag = interactive && !isPlaying;

  const onItemDown = useCallback((e: React.PointerEvent, target: DragTarget) => {
    if (!canDrag) return;
    if (gestureRef.current.isGesturing || gestureRef.current.spaceHeld) return;
    e.preventDefault();
    e.stopPropagation();
    const isTouch = e.pointerType !== 'mouse';
    dragRef.current = {
      target, pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      started: false, ready: !isTouch,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (isTouch) {
      if (longPressRef.current) clearTimeout(longPressRef.current);
      longPressRef.current = setTimeout(() => {
        if (dragRef.current) dragRef.current.ready = true;
      }, LONG_PRESS);
    }
  }, [canDrag]);

  const onItemMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (gestureRef.current.isGesturing) { dragRef.current = null; setDragPreview(null); return; }
    e.preventDefault();
    if (!d.started) {
      const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      if (moved <= DRAG_THRESH || !d.ready) return;
      d.started = true;
    }
    const p = toSVG(e.clientX, e.clientY);
    setDragPreview({ target: d.target, x: p.x, y: p.y });
  }, [toSVG]);

  const onItemUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
    dragRef.current = null;
    const preview = dragPreview;
    setDragPreview(null);
    if (!d.started || !preview) return;
    e.preventDefault();
    if (d.target.kind === 'ball') {
      moveBall({ x: preview.x, y: preview.y });
    } else {
      const snap = nearestSlotPos({ x: preview.x, y: preview.y }, slots);
      movePlayer(d.target.id, snap ?? { x: preview.x, y: preview.y });
    }
  }, [dragPreview, moveBall, movePlayer, slots]);

  /** Andre finger lander – da er dette et knip, ikke et drag. */
  const cancelDrag = useCallback(() => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
    dragRef.current = null;
    setDragPreview(null);
  }, []);

  const onZoomDown = useCallback((e: React.PointerEvent) => {
    if (zoomCtl.onPointerDown(e)) cancelDrag();
  }, [zoomCtl, cancelDrag]);

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

        <button onClick={() => { zoomCtl.zoomOut(); resetHideTimer(); }} disabled={!zoomCtl.canZoomOut}
          aria-label="Zoom ut" title="Zoom ut"
          className="tap-auto w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors disabled:opacity-30">
          <Minus size={16} strokeWidth={1.75} />
        </button>
        <button onClick={() => { zoomCtl.zoomIn(); resetHideTimer(); }} disabled={!zoomCtl.canZoomIn}
          aria-label="Zoom inn" title="Zoom inn (Ctrl+scroll)"
          className="tap-auto w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors disabled:opacity-30">
          <Plus size={16} strokeWidth={1.75} />
        </button>
        {zoomCtl.isZoomed && (
          <button onClick={() => { zoomCtl.reset(); resetHideTimer(); }}
            aria-label="Nullstill zoom" title="Nullstill zoom"
            className="tap-auto flex-shrink-0 inline-flex items-center gap-1 px-2 min-h-[36px] rounded-ctl
              bg-signal/10 text-signal shadow-hair-signal font-mono text-caption transition-colors">
            {zoomCtl.zoom.toFixed(1)}× <X size={13} strokeWidth={2} aria-hidden />
          </button>
        )}

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
      <div
        ref={zoomCtl.containerRef}
        className="flex-1 min-h-0 p-1 overflow-hidden"
        onPointerDownCapture={onZoomDown}
        onPointerMoveCapture={zoomCtl.onPointerMove}
        onPointerUpCapture={zoomCtl.onPointerUp}
        onPointerCancelCapture={zoomCtl.onPointerUp}
      >
        {/* Zoom som CSS-transform, ikke viewBox – da er toSVG uendret. */}
        <div className="w-full h-full" style={zoomCtl.transformStyle}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            touchAction: 'none',
            userSelect: 'none',
            cursor: zoomCtl.spaceHeld ? 'grab' : 'default',
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
          {displayBall && (() => {
            const drag = dragPreview?.target.kind === 'ball' ? dragPreview : null;
            const bx = drag ? drag.x : displayBall.x;
            const by = drag ? drag.y : displayBall.y;
            return (
              <g filter="url(#ds3)"
                data-ball="true"
                onPointerDown={e => onItemDown(e, { kind: 'ball' })}
                onPointerMove={onItemMove}
                onPointerUp={onItemUp}
                onPointerCancel={onItemUp}
                style={{ cursor: canDrag ? 'grab' : 'default', touchAction: 'none' }}>
                {/* Usynlig treffflate – ballen er liten å treffe med finger. */}
                <circle cx={bx} cy={by} r={22} fill="transparent" />
                <circle cx={bx} cy={by} r={10} style={{ fill: 'rgb(var(--k-ink))' }}/>
                <circle cx={bx} cy={by} r={4} style={{ fill: 'rgb(var(--k-pitch))' }}/>
              </g>
            );
          })()}

          {/* Spillere - hjemmelaget, kun startere */}
          {homePlayers.map((player: any) => {
            const drag = dragPreview?.target.kind === 'player' && dragPreview.target.id === player.id
              ? dragPreview : null;
            const x = drag ? drag.x : player.position.x;
            const y = drag ? drag.y : player.position.y;
            const label = getSlot(tactic, player.slotIdx).label;
            return (
              <g key={player.id}
                data-player="true"
                onPointerDown={e => onItemDown(e, { kind: 'player', id: player.id })}
                onPointerMove={onItemMove}
                onPointerUp={onItemUp}
                onPointerCancel={onItemUp}
                style={{ cursor: canDrag ? 'grab' : 'default', touchAction: 'none' }}>
                <circle cx={x} cy={y} r={17}
                  style={{ fill: 'rgb(var(--k-signal))', opacity: drag ? 0.85 : 1 }}/>
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