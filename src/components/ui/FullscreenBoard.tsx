'use client';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic, getSlot } from '@/store/selectors';
import { VW, VH, getFormationSlots } from '@/data/formations';
import { BoardStage, type StagePlayer } from '@/components/board/BoardStage';
import { DrawToolbar } from '@/components/board/DrawToolbar';
import { TextLabelModal } from '@/components/board/TextLabelModal';
import { ExportImageButton, ExportImageError } from '@/components/board/ExportImage';
import { LONG_PRESS, DRAG_THRESH, CLAMP_X, CLAMP_Y_TOP, CLAMP_Y_BOTTOM } from '@/components/board/constants';
import { nearestSlotPos, type SvgPos } from '@/lib/geometry';
import { useBoardZoom } from '@/hooks/useBoardZoom';
import { useDrawingInput } from '@/hooks/useDrawingInput';
import { useImageExport } from '@/hooks/useImageExport';
import { X, Play, Pause, Minus, Plus, PenLine, Footprints } from 'lucide-react';
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
  const { setActivePhaseIdx, movePlayer, moveBall, removeLastDrawing, clearDrawings, showMovement, setShowMovement } = useAppStore();
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
  const [drawMode, setDrawMode]     = useState(false);

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

  // ─── Tegning ────────────────────────────────────────────────
  // Samme verktøy og samme lagring som på vanlig brett. Strekene havner i
  // fasen storen står i, som synkes med activeIdx over.
  const draw = useDrawingInput({
    enabled: interactive && drawMode && !isPlaying,
    toSVG,
    isGesturing: () => gestureRef.current.isGesturing || gestureRef.current.spaceHeld,
  });
  const drawCancel = draw.cancel;

  // Fullskjerm har sin egen fase-indeks; bildet skal vise fasen som står her.
  const imageExport = useImageExport(svgRef, activeIdx);

  // ─── Drag av spillere og ball ───────────────────────────────
  // I tegnemodus eier tegningen pekeren, som på vanlig brett.
  const canDrag = interactive && !isPlaying && !drawMode;

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
    drawCancel();
  }, [drawCancel]);

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

  // Brikken som dras flyttes her i fullskjerm (ingen drag-skygge), og dempes mindre
  // enn på vanlig brett. Navnet kortes ned til 10 tegn, som før.
  const ballDrag = dragPreview?.target.kind === 'ball' ? dragPreview : null;
  const displayBallPos = ballDrag ? { x: ballDrag.x, y: ballDrag.y } : displayBall;
  const stagePlayers: StagePlayer[] = (displayPlayers as any[]).map((player: any) => {
    const drag = dragPreview?.target.kind === 'player' && dragPreview.target.id === player.id ? dragPreview : null;
    const name: string = player.name ?? '';
    return {
      id: player.id,
      num: getNum(player),
      position: drag ? { x: drag.x, y: drag.y } : player.position,
      label: getSlot(tactic, player.slotIdx).label,
      name: name.length > 10 ? name.slice(0, 10) + '…' : name,
      dragging: !!drag,
      dragOpacity: 0.85,
    };
  });

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

        <button onClick={() => { setShowMovement(!showMovement); resetHideTimer(); }}
          aria-pressed={showMovement}
          aria-label="Vis bevegelse"
          title="Vis bevegelse fra forrige fase"
          className={cn(
            'tap-auto w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors',
            showMovement && 'bg-signal/10 text-signal shadow-hair-signal hover:text-signal',
          )}>
          <Footprints size={16} strokeWidth={1.75} />
        </button>

        <ExportImageButton busy={imageExport.busy} disabled={isPlaying}
          onClick={() => { imageExport.exportPng(); resetHideTimer(); }}
          className="tap-auto w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors disabled:opacity-30" />

        {interactive && (
          <button onClick={() => { setDrawMode(v => !v); resetHideTimer(); }}
            aria-pressed={drawMode}
            aria-label={drawMode ? 'Stopp tegning' : 'Tegn'}
            title={drawMode ? 'Stopp tegning' : 'Tegn'}
            className={cn(
              'tap-auto w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors',
              drawMode && 'bg-signal/10 text-signal shadow-hair-signal hover:text-signal',
            )}>
            <PenLine size={16} strokeWidth={1.75} />
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

      {imageExport.error && (
        <ExportImageError message={imageExport.error} onClose={imageExport.clearError} className="border-b" />
      )}

      {interactive && drawMode && (
        <DrawToolbar
          tool={draw.tool} onTool={draw.setTool}
          color={draw.color} onColor={draw.setColor}
          hasDrawings={(phase.drawings?.length ?? 0) > 0}
          onRemoveLast={removeLastDrawing}
          onClearAll={clearDrawings}
          className={cn('border-b transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none')}/>
      )}

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
            cursor: zoomCtl.spaceHeld ? 'grab'
              : drawMode && interactive ? (draw.tool === 'label' ? 'text' : 'crosshair') : 'default',
          }}
          onPointerDown={draw.onPointerDown}
          onPointerMove={draw.onPointerMove}
          onPointerUp={draw.onPointerUp}
          onPointerLeave={draw.onPointerUp}
        >
          <defs>
            <filter id="ds3">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.35"/>
            </filter>
          </defs>
          <BoardStage
            players={stagePlayers}
            ball={displayBallPos}
            drawings={phase.drawings ?? []}
            trails={showMovement && !isPlaying && activeIdx > 0
              ? { from: phases[activeIdx - 1].players, to: phase.players } : null}
            preview={draw.preview}
            progress={isPlaying ? progressFrac : null}
            progressY={VH - 12}
            ballFilterId="ds3"
            ballGroupProps={{
              'data-ball': 'true',
              onPointerDown: (e: React.PointerEvent) => onItemDown(e, { kind: 'ball' }),
              onPointerMove: onItemMove,
              onPointerUp: onItemUp,
              onPointerCancel: onItemUp,
              style: { cursor: canDrag ? 'grab' : 'default', touchAction: 'none' },
            } as React.SVGProps<SVGGElement>}
            playerGroupProps={player => ({
              onPointerDown: (e: React.PointerEvent) => onItemDown(e, { kind: 'player', id: player.id }),
              onPointerMove: onItemMove,
              onPointerUp: onItemUp,
              onPointerCancel: onItemUp,
              style: { cursor: canDrag ? 'grab' : 'default', touchAction: 'none' },
            })}
          />
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

      {draw.pendingLabel && (
        <TextLabelModal onSave={draw.commitLabel} onClose={draw.cancelLabel} />
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