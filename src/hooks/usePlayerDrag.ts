'use client';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Player, Position, TacticPhase } from '@/types';
import type { getFormationSlots } from '@/data/formations';
import { LONG_PRESS, DRAG_THRESH } from '@/components/board/constants';
import { SvgPos, separatePlayers, nearestSlotPos } from '@/lib/geometry';
import type { UndoEntry } from './useUndoRedo';

// ══════════════════════════════════════════════════════════════
//  DRAG OG BYTTE AV SPILLERE PÅ BRETTET – lå før inne i TacticBoard.
//  Langtrykk på berøring, terskel før draget starter, drag-skygge,
//  snapping til formasjonen, bytte ved slipp på en annen spiller,
//  avstand til de andre etterpå, og valg av spiller ved trykk.
//  Brettet eier koordinatene, angrestabelen og når drag er tillatt.
// ══════════════════════════════════════════════════════════════

interface ActiveDrag {
  playerId:       string;
  pointerId:      number;
  startClientX:   number;
  startClientY:   number;
  started:        boolean;
  longPressReady: boolean;
  isTouch:        boolean;
}

interface GhostPos { x: number; y: number; scaleIn: boolean }

interface Options {
  /** Fasen storen står i. */
  phase: TacticPhase | null;
  /** Avstandsjusteringen som venter, forkastes når taktikk eller fase byttes. */
  tacticId: string;
  activePhaseIdx: number;
  isPlaying: boolean;
  drawMode: boolean;
  /** Gest-flaggene fra zoomen, lest gjennom en ref (se TacticBoard). */
  gestureRef: { current: { isGesturing: boolean; spaceHeld: boolean } };
  toSVG: (cx: number, cy: number) => SvgPos;
  clampToPitch: (x: number, y: number) => SvgPos;
  /** Slotene i aktiv formasjon: brukes til snapping når en spiller dras. */
  currentHomePlayers: ReturnType<typeof getFormationSlots>;
  movePlayer: (playerId: string, pos: Position) => void;
  pushUndo: (e: UndoEntry) => void;
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

export function usePlayerDrag({
  phase, tacticId, activePhaseIdx, isPlaying, drawMode, gestureRef,
  toSVG, clampToPitch, currentHomePlayers, movePlayer, pushUndo,
  selectedPlayerId, onSelectPlayer: stableOnSelectPlayer,
}: Options) {
  const spacingDebRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const longPressRef  = useRef<ReturnType<typeof setTimeout>|null>(null);
  const rafRef        = useRef<number|null>(null);

  const lastClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeDragRef = useRef<ActiveDrag|null>(null);

  const [ghostPos,         setGhostPos]         = useState<GhostPos|null>(null);
  const [snapTarget,       setSnapTarget]        = useState<SvgPos|null>(null);
  const [dragOverId,       setDragOverId]        = useState<string|null>(null);
  const [draggingPlayerId, setDraggingPlayerId]  = useState<string|null>(null);
  const [bounceId,         setBounceId]          = useState<string|null>(null);

  useEffect(() => {
    if (spacingDebRef.current) clearTimeout(spacingDebRef.current);
  }, [tacticId, activePhaseIdx]);

  useEffect(() => () => {
    if (spacingDebRef.current) clearTimeout(spacingDebRef.current);
    if (longPressRef.current)  clearTimeout(longPressRef.current);
    if (rafRef.current)        cancelAnimationFrame(rafRef.current);
  }, []);

  const findPlayerAt = useCallback((sx:number, sy:number, excludeId?:string): Player|null => {
    let best:Player|null=null, bestD=54;
    for (const p of (phase?.players??[])) {
      if (p.id===excludeId) continue;
      const d = Math.hypot(p.position.x - sx, p.position.y - sy);
      if (d<bestD) { bestD=d; best=p; }
    }
    return best;
  }, [phase]);

  const scheduleSpacing = useCallback((movedId:string) => {
    if (spacingDebRef.current) clearTimeout(spacingDebRef.current);
    spacingDebRef.current = setTimeout(() => {
      if (!phase) return;
      const others = phase.players.filter(p=>p.id!==movedId);
      const pts    = others.map(p=>({x:p.position.x,y:p.position.y}));
      const sep    = separatePlayers(pts);
      sep.forEach((sp,i) => {
        const o=others[i]; if (!o) return;
        if (Math.abs(sp.x-o.position.x)>1||Math.abs(sp.y-o.position.y)>1)
          movePlayer(o.id, {x:sp.x,y:sp.y});
      });
    }, 200);
  }, [phase, movePlayer]);

  const swapPlayers = useCallback((aId:string, bId:string) => {
    if (!phase) return;
    const a=phase.players.find(p=>p.id===aId), b=phase.players.find(p=>p.id===bId);
    if (!a||!b) return;
    pushUndo({ moves: [
      { playerId:aId, prevPos:{...a.position} },
      { playerId:bId, prevPos:{...b.position} },
    ] });
    const [ap,bp] = [{...a.position},{...b.position}];
    movePlayer(aId, bp);
    movePlayer(bId, ap);
    setBounceId(bId); setTimeout(()=>setBounceId(null),400);
  }, [phase, movePlayer, pushUndo]);

  const resolveDrop = useCallback((
    draggedId:string,
    targetId:string|undefined,
    svgX:number, svgY:number,
  ) => {
    if (!phase) return;
    const dragged = phase.players.find(p=>p.id===draggedId); if (!dragged) return;
    const target  = targetId ? phase.players.find(p=>p.id===targetId) : null;

    if (target && target.id !== dragged.id) {
      swapPlayers(dragged.id, target.id);
      return;
    }

    let pos: SvgPos = clampToPitch(svgX, svgY);
    const snap = nearestSlotPos(pos, currentHomePlayers);
    if (snap) pos = snap;

    pushUndo({ moves: [{ playerId:dragged.id, prevPos:{...dragged.position} }] });
    movePlayer(dragged.id, pos);
    scheduleSpacing(dragged.id);
    setBounceId(dragged.id); setTimeout(()=>setBounceId(null),400);
  }, [phase, swapPlayers, currentHomePlayers, pushUndo, movePlayer, scheduleSpacing, clampToPitch]);

  const startDrag = useCallback((
    e: React.PointerEvent, playerId:string,
  ) => {
    if (isPlaying||drawMode) return;
    // Knipebevegelse eller panorering eier pekeren – ikke start et drag.
    if (gestureRef.current.isGesturing || gestureRef.current.spaceHeld) return;
    e.preventDefault();
    e.stopPropagation();

    lastClientRef.current = { x: e.clientX, y: e.clientY };

    const isTouch = e.pointerType !== 'mouse';
    activeDragRef.current = {
      playerId, pointerId:e.pointerId,
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
  }, [isPlaying, drawMode, phase]);

  const moveDrag = useCallback((e: React.PointerEvent) => {
    const ad = activeDragRef.current;
    if (!ad) return;
    if (gestureRef.current.isGesturing) return;
    e.preventDefault();

    lastClientRef.current = { x: e.clientX, y: e.clientY };

    const moved = Math.hypot(e.clientX - ad.startClientX, e.clientY - ad.startClientY);

    if (!ad.started) {
      if (moved > DRAG_THRESH && ad.longPressReady) {
        ad.started = true;
        setDraggingPlayerId(ad.playerId);
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
    setSnapTarget(null);

    if (!wasDragging) {
      stableOnSelectPlayer(selectedPlayerId === ad.playerId ? null : ad.playerId);
      return;
    }
    if (!phase) return;

    const finalPos = toSVG(lastClientRef.current.x, lastClientRef.current.y);
    resolveDrop(ad.playerId, targetId ?? undefined, finalPos.x, finalPos.y);
  }, [dragOverId, phase, selectedPlayerId, resolveDrop, stableOnSelectPlayer, toSVG]);

  /** Avbryter et pågående spillerdrag uten å flytte noe. Brettet forkaster
   *  også utstyr som dras og en påbegynt strek (se cancelDrag i TacticBoard). */
  const cancelPlayerDrag = useCallback(() => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    activeDragRef.current = null;
    setGhostPos(null);
    setDragOverId(null);
    setDraggingPlayerId(null);
    setSnapTarget(null);
  }, []);

  return {
    ghostPos, snapTarget, dragOverId, draggingPlayerId, bounceId,
    startDrag, moveDrag, endDrag, cancelPlayerDrag,
  };
}
