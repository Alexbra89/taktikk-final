'use client';
import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useActiveTactic, getSlot } from '../../store/selectors';
import { Player } from '../../types';
import { VW, VH, getFormationSlots } from '../../data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { Ball, DrawingCanvas } from './BoardElements';
import { ROLE_INFO } from '../../data/roleInfo';
import { LONG_PRESS, DRAG_THRESH, MAX_UNDO, CLAMP_X, CLAMP_Y_TOP, CLAMP_Y_BOTTOM, GLASS } from './constants';
import { SvgPos, separatePlayers, nearestSlotPos } from '../../lib/geometry';
import { JerseyIcon } from './svg/JerseyIcon';
import { RoleBadge } from './svg/RoleBadge';
import { NameLabel } from './svg/NameLabel';
import { DragGhost } from './svg/DragGhost';
import { SnapIndicator } from './svg/SnapIndicator';
import { SvgDefs } from './svg/SvgDefs';
import { PlayerNameBar } from './PlayerNameBar';
import { useViewport } from '../../hooks/useViewport';

// ══════════════════════════════════════════════════════════════
//  TACTIC BOARD v8 – FM LOOK + GLASSMORPHISM (RESPONSIV OPPDATERT)
// ══════════════════════════════════════════════════════════════

interface TacticBoardProps {
  selectedPlayerId: string | null;
  onSelectPlayer:   (id: string | null) => void;
}

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

interface UndoEntry {
  playerId:      string;
  prevPos:       { x: number; y: number };
}

interface TacticMoment { id: string; label: string; snapshot: string; at: string }

// ══════════════════════════════════════════════════════════════
//  HOVED-KOMPONENT
// ══════════════════════════════════════════════════════════════
export const TacticBoard: React.FC<TacticBoardProps> = ({
  selectedPlayerId,
  onSelectPlayer: onSelectPlayerProp,
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
  const [moments,          setMoments]           = useState<TacticMoment[]>([]);
  const [showMoments,      setShowMoments]       = useState(false);
  const [momentLabel,      setMomentLabel]       = useState('');
  const [showMoreMenu,     setShowMoreMenu]      = useState(false);

  const {
    setActivePhaseIdx, addPhase, removePhase,
    movePlayer, moveBall,
    addDrawing, clearDrawings, updateStickyNote,
  } = useAppStore();

  const tactic = useActiveTactic();
  const { sport, formation, phases, activePhaseIdx } = tactic;
  const phase = phases[activePhaseIdx] ?? null;

  const { isMobile } = useViewport();


  const clamp = useCallback((v:number,lo:number,hi:number) => Math.max(lo,Math.min(hi,v)), []);
  const clampToPitch = useCallback((x:number, y:number): SvgPos => ({
    x: clamp(x, CLAMP_X, VW - CLAMP_X),
    y: clamp(y, CLAMP_Y_TOP, VH - CLAMP_Y_BOTTOM),
  }), [clamp]);

  // Slotene i aktiv formasjon: brukes til snapping når en spiller dras.
  const currentHomePlayers = useMemo(() => getFormationSlots(sport, formation), [sport, formation]);

  useEffect(() => {
    if (spacingDebRef.current) clearTimeout(spacingDebRef.current);
  }, [tactic.id, activePhaseIdx]);

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
    stickyDebRef.current = setTimeout(() => updateStickyNote(v, activePhaseIdx), 500);
  }, [activePhaseIdx, updateStickyNote]);

  const pushUndo = useCallback((e:UndoEntry) => {
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO+1), e];
    redoStack.current = [];
  }, []);

  const doUndo = useCallback(() => {
    const e = undoStack.current.pop(); if (!e||!phase) return;
    const p = phase.players.find(pl=>pl.id===e.playerId); if (!p) return;
    redoStack.current.push({ playerId:e.playerId, prevPos:{...p.position} });
    movePlayer(e.playerId, e.prevPos);
  }, [phase, movePlayer]);

  const doRedo = useCallback(() => {
    const e = redoStack.current.pop(); if (!e||!phase) return;
    const p = phase.players.find(pl=>pl.id===e.playerId); if (!p) return;
    undoStack.current.push({ playerId:e.playerId, prevPos:{...p.position} });
    movePlayer(e.playerId, e.prevPos);
  }, [phase, movePlayer]);

  useEffect(() => {
    const h = (e:KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable)) return;
      if ((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey) { e.preventDefault(); doUndo(); }
      if ((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); doRedo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [doUndo, doRedo]);

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

  // Angre/gjør om gjelder bare fasen spilleren ble flyttet i: nullstilles når taktikk, fase,
  // formasjon eller sport byttes, slik at «angre» aldri flytter en spiller i feil fase.
  useEffect(() => {
    undoStack.current = [];
    redoStack.current = [];
  }, [tactic.id, activePhaseIdx, formation, sport]);

  // Formasjon, sport eller taktikk kan byttes utenfra (Controls/faner) mens avspilling pågår.
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsPlaying(false); setInterpT(0);
  }, [tactic.id, formation, sport]);

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

  // ─── toSVG med letter-box-korreksjon ──────────────────────────
  // Må speile <svg preserveAspectRatio="xMidYMid meet"> nøyaktig (letterbox, skala=min).
  // Banen vises alltid i sin helhet: med faner, kontroller og verktøylinje rundt blir
  // brettet lavt i liggende format, og "slice" (skala=max) ville beskåret vinger og backer.
  const toSVG = useCallback((cx: number, cy: number): SvgPos => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const rectW = rect.width;
    const rectH = rect.height;

    const scaleX = rectW / VW;
    const scaleY = rectH / VH;
    const scale  = Math.min(scaleX, scaleY);

    const renderedW = VW * scale;
    const renderedH = VH * scale;

    // Sentrert offset (xMidYMid)
    const offsetX = (rectW - renderedW) / 2;
    const offsetY = (rectH - renderedH) / 2;

    // Klientkoordinater relativt til SVG-rektangelet
    const localX = cx - rect.left - offsetX;
    const localY = cy - rect.top  - offsetY;

    return clampToPitch((localX / renderedW) * VW, (localY / renderedH) * VH);
  }, [clampToPitch]);

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
    pushUndo({ playerId:aId, prevPos:{...a.position} });
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

    pushUndo({ playerId:dragged.id, prevPos:{...dragged.position} });
    movePlayer(dragged.id, pos);
    scheduleSpacing(dragged.id);
    setBounceId(dragged.id); setTimeout(()=>setBounceId(null),400);
  }, [phase, swapPlayers, currentHomePlayers, pushUndo, movePlayer, scheduleSpacing, clampToPitch]);

  const startDrag = useCallback((
    e: React.PointerEvent, playerId:string,
  ) => {
    if (isPlaying||drawMode) return;
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
      addDrawing({pts:[...drawPts.current], color:drawColor});
    isDrawingRef.current=false; drawPts.current=[]; setLiveDrawPts([]);
  };

  const allDisplay   = useMemo(()=>getDisplayPlayers(),  [getDisplayPlayers]);

  const displayBall  = useMemo(()=>getDisplayBall(), [getDisplayBall]);
  const progressFrac = phases.length>1?(interpFrom+interpT)/(phases.length-1):0;

  // Kallenavn er valgfritt: tomt navn betyr at brikken bare viser nummer.
  const getDisplayName = useCallback((player: Player): string => player.name.trim(), []);
  const selectedPlayer = selectedPlayerId ? phase?.players.find(p => p.id === selectedPlayerId) ?? null : null;

  const isOutOfPos = useCallback((player:Player):boolean => {
    const fam = ROLE_INFO[getSlot(tactic, player.slotIdx).role].family;
    const yFrac = player.position.y / VH;
    if (fam==='gk'  && yFrac < 0.7) return true;
    if (fam==='att' && yFrac > 0.5) return true;
    return false;
  }, [tactic]);

  const ghostPlayer = draggingPlayerId ? phase?.players.find(p=>p.id===draggingPlayerId) : null;
  const ghostSlot   = ghostPlayer ? getSlot(tactic, ghostPlayer.slotIdx) : null;

  const DRAW_COLORS     = ['#f87171','#60a5fa','#4ade80','#fbbf24','#ffffff'];
  const glassStyle      = { '--glass-bg': GLASS.panel, '--glass-border': GLASS.border, '--glass-hover': GLASS.hover } as React.CSSProperties;

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
      style={{ ...glassStyle, touchAction: 'pan-x pan-y pinch-zoom', overflowX: 'hidden' }}
    >
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div
          className="flex-1 min-w-0 h-full flex flex-col items-stretch"
          style={{ padding: '4px', overflow: 'hidden' }}
        >
          {formation&&(
            <div className="flex-shrink-0 flex items-center justify-center py-1">
              <div style={{
                background:'rgba(5,10,28,0.7)',backdropFilter:'blur(12px)',
                border:'1px solid rgba(56,189,248,0.12)',boxShadow:'0 0 20px rgba(56,189,248,0.05)',
              }} className="flex items-center gap-2 px-4 py-1.5 rounded-xl">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Formasjon</span>
                <span className="text-[13px] font-black text-slate-100 tracking-wider uppercase">{formation}</span>
              </div>
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              flex: 1, width: '100%', height: '100%', display: 'block',
              boxShadow: '0 0 80px rgba(0,0,0,0.95)',
              cursor: drawMode ? 'crosshair' : 'default',
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

            <FootballPitch/>
            {phase.drawings?.map(d=><DrawingCanvas key={d.id} drawing={d}/>)}
            {liveDrawPts.length>1&&(
              <polyline points={liveDrawPts.map(p=>`${p.x},${p.y}`).join(' ')}
                stroke={drawColor} strokeWidth={4} fill="none"
                strokeLinecap="round" strokeLinejoin="round" opacity={0.85}/>
            )}
            {phase&&(
              <Ball position={displayBall} isDraggable={!isPlaying&&!drawMode}
                onPositionChange={pos=>moveBall(pos)}/>
            )}

            {snapTarget&&ghostPos&&<SnapIndicator x={snapTarget.x} y={snapTarget.y}/>}

            {allDisplay.map(player => {
              const slot       = getSlot(tactic, player.slotIdx);
              const color      = ROLE_INFO[slot.role].color;
              const name       = getDisplayName(player);
              const isTarget   = dragOverId===player.id;
              const isSrc      = draggingPlayerId===player.id;
              const isBouncing = bounceId===player.id;
              const outOfPos   = isOutOfPos(player);
              const {x,y}      = player.position;
              const showHover  = isTarget;

              return (
                <g key={player.id} data-player="true"
                  onPointerDown={e=>startDrag(e, player.id)}
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
                  {showHover&&(
                    <circle cx={x} cy={y} r={32} fill="none"
                      stroke="rgba(56,189,248,0.6)" strokeWidth={2} strokeDasharray="6,4"/>
                  )}
                  <JerseyIcon x={x} y={y} num={player.num} color={color}
                    selected={selectedPlayerId===player.id} isDragging={!!isSrc}
                    isTarget={isTarget} isOutOfPos={outOfPos}/>
                  <RoleBadge x={x} y={y+23} role={slot.role} label={slot.label}/>
                  {name&&<NameLabel x={x} y={y+47} name={name}/>}
                </g>
              );
            })}

            {ghostPos&&ghostPlayer&&ghostSlot&&(
              <DragGhost x={ghostPos.x} y={ghostPos.y}
                color={ROLE_INFO[ghostSlot.role].color}
                num={ghostPlayer.num} name={getDisplayName(ghostPlayer)}
                role={ghostSlot.role} label={ghostSlot.label} scaleIn={ghostPos.scaleIn}/>
            )}

            {isPlaying&&(
              <rect x={32} y={VH-14} rx={3} height={5}
                width={progressFrac*(VW-64)} fill="#38bdf8" opacity={0.8}/>
            )}
          </svg>
        </div>

      </div>

      {showSticky&&phase&&(
        <div style={{background:'rgba(251,191,36,0.05)',backdropFilter:'blur(12px)',borderTop:'1px solid rgba(251,191,36,0.15)'}}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2">
          <span className="text-amber-400 text-[13px]">📌</span>
          <input value={localStickyNote} onChange={e=>handleStickyChange(e.target.value)}
            placeholder={`Notat for ${phase.name}…`}
            className="flex-1 bg-transparent border-none text-amber-100 text-[13px] placeholder-amber-500/35 focus:outline-none min-h-[40px]"/>
        </div>
      )}

      {showMoments&&(
        <div style={{background:'rgba(5,8,22,0.88)',backdropFilter:'blur(16px)',borderTop:'1px solid rgba(167,139,250,0.15)'}}
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

      {selectedPlayer&&(
        <PlayerNameBar key={selectedPlayer.id} player={selectedPlayer}
          label={getSlot(tactic, selectedPlayer.slotIdx).label}
          onClose={()=>stableOnSelectPlayer(null)}/>
      )}

      <div style={{
        background:'rgba(5,10,25,0.82)',
        backdropFilter:'blur(16px) saturate(1.4)',
        WebkitBackdropFilter:'blur(16px) saturate(1.4)',
        borderTop:'1px solid rgba(56,189,248,0.1)',
        boxShadow:'0 1px 0 rgba(255,255,255,0.04)',
      }} className="relative flex-shrink-0 flex flex-wrap items-center gap-1 px-2 py-1.5">

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

        <div className="flex-1 min-w-[4px]"/>

        {[{fn:doUndo,icon:'↩',title:'Angre (Ctrl+Z)'},{fn:doRedo,icon:'↪',title:'Gjør om (Ctrl+Y)'}].map(({fn,icon,title})=>(
          <button key={icon} onClick={fn} title={title}
            style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(8px)'}}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 text-sm hover:text-slate-300 flex-shrink-0">
            {icon}
          </button>
        ))}

        {isMobile ? (
          <>
            <button onClick={()=>setShowMoreMenu(!showMoreMenu)}
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(8px)'}}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 min-h-[40px] flex-shrink-0">
              ⋮ Mer
            </button>
            {showMoreMenu && (
              <div className="absolute bottom-full right-2 z-50 mb-1 p-2 rounded-xl shadow-2xl"
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
          <button onClick={()=>clearDrawings()}
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

      </div>


    </div>
  );
};
