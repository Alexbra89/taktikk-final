'use client';
import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Player, PlayerRole } from '../../types';
import {
  VW, VH, getFormations, DEFAULT_FORMATION, getSquadCapacity,
} from '../../data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { Ball, DrawingCanvas } from './BoardElements';
import { ROLE_META, ROLE_FAMILY } from '../../data/roleInfo';
import { LONG_PRESS, DRAG_THRESH, MAX_UNDO, CLAMP_X, CLAMP_Y_TOP, CLAMP_Y_BOTTOM, GLASS } from './constants';
import { SvgPos, separatePlayers, nearestSlotPos } from '../../lib/geometry';
import { JerseyIcon } from './svg/JerseyIcon';
import { RoleBadge } from './svg/RoleBadge';
import { NameLabel } from './svg/NameLabel';
import { ConditionDot } from './svg/ConditionDot';
import { SwapOverlay } from './svg/SwapOverlay';
import { DragGhost } from './svg/DragGhost';
import { SnapIndicator } from './svg/SnapIndicator';
import { LoanBadge } from './svg/LoanBadge';
import { SvgDefs } from './svg/SvgDefs';
import { SubRow } from './panels/SubRow';
import { useViewport } from '../../hooks/useViewport';

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
  const [dragOverEmptyIdx, setDragOverEmptyIdx]  = useState<number|null>(null);
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

  const { isMobile, isLandscape } = useViewport();

  const availableFormations = useMemo(() =>
    getFormations(sport), [sport]);
  const defaultFormation = DEFAULT_FORMATION[
    sport
  ];

  useEffect(() => {
    if (availableFormations.length > 0 && !selectedFormation) {
      setSelectedFormation(defaultFormation);
    }
  }, [sport, availableFormations, defaultFormation, selectedFormation]);

  const clamp = useCallback((v:number,lo:number,hi:number) => Math.max(lo,Math.min(hi,v)), []);
  const clampToPitch = useCallback((x:number, y:number): SvgPos => ({
    x: clamp(x, CLAMP_X, VW - CLAMP_X),
    y: clamp(y, CLAMP_Y_TOP, VH - CLAMP_Y_BOTTOM),
  }), [clamp]);

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
        position: clampToPitch(slot.position.x, slot.position.y),
        role: slot.role as PlayerRole,
      });
    });
    setSelectedFormation(name);
  }, [phase, activePhaseIdx, availableFormations, updatePlayerField, clampToPitch]);

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

  // ─── toSVG med letter-box/crop-korreksjon ─────────────────────
  // Må speile <svg preserveAspectRatio> nøyaktig: "meet" (letterbox,
  // tomme kanter, skala=min) i portrett, "slice" (fyller/beskjærer,
  // skala=max) i landskap. Feil skala her ga feil dra-posisjon i
  // liggende mobilvisning.
  const toSVG = useCallback((cx: number, cy: number): SvgPos => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const rectW = rect.width;
    const rectH = rect.height;

    const scaleX = rectW / VW;
    const scaleY = rectH / VH;
    const scale  = isLandscape ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

    const renderedW = VW * scale;
    const renderedH = VH * scale;

    // Sentrert offset (xMidYMid) – negativ ved "slice" (beskjæring)
    const offsetX = (rectW - renderedW) / 2;
    const offsetY = (rectH - renderedH) / 2;

    // Klientkoordinater relativt til SVG-rektangelet
    const localX = cx - rect.left - offsetX;
    const localY = cy - rect.top  - offsetY;

    return clampToPitch((localX / renderedW) * VW, (localY / renderedH) * VH);
  }, [clampToPitch, isLandscape]);

  const findPlayerAt = useCallback((sx:number, sy:number, excludeId?:string): Player|null => {
    let best:Player|null=null, bestD=54;
    for (const p of (phase?.players??[])) {
      // Kun spillere som faktisk vises på banen kan være mål for en
      // posisjons-basert treff – ellers kan en benkespiller med en
      // gammel/tilfeldig posisjon feilaktig "treffes" og byttes inn.
      if (p.id===excludeId||p.team!=='home'||p.isStarter!==true) continue;
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
    droppedOnEmptyBench:boolean,
  ) => {
    if (!phase) return;
    const dragged = phase.players.find(p=>p.id===draggedId); if (!dragged) return;
    const target  = targetId ? phase.players.find(p=>p.id===targetId) : null;

    if (target && target.id !== dragged.id) {
      if (!canSub(dragged.isStarter===false || target.isStarter===false)) return;
      swapPlayers(dragged.id, target.id);
      return;
    }

    // Dratt fra bane og sluppet på en tom benkerad → sett på benken (FM-stil).
    if (droppedOnEmptyBench && !fromSub && dragged.isStarter !== false) {
      if (!canSub(true)) return;
      moveToBench(dragged.id);
      setBounceId(dragged.id); setTimeout(()=>setBounceId(null),400);
      return;
    }

    let pos: SvgPos = clampToPitch(svgX, svgY);
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
  }, [phase, canSub, swapPlayers, currentHomePlayers, moveToField, moveToBench, pushUndo, updatePlayerPosition, activePhaseIdx, scheduleSpacing, clampToPitch]);

  const startDrag = useCallback((
    e: React.PointerEvent, playerId:string, fromSub:boolean,
  ) => {
    if (isPlaying||drawMode) return;
    e.preventDefault();
    e.stopPropagation();

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
      // Sjekk først om pekeren er over en benkerad (kun relevant når vi
      // drar en spiller FRA banen – pointer capture gjør at vanlige
      // pointer-events på benkeradene aldri fyres, så vi må slå opp
      // elementet under pekeren direkte via elementFromPoint.
      if (!ad.fromSub) {
        const overEl  = document.elementFromPoint(cx, cy) as HTMLElement | null;
        const benchEl = overEl?.closest('[data-bench-row]') as HTMLElement | null;
        if (benchEl) {
          const pid = benchEl.dataset.playerId || '';
          const idxAttr = benchEl.dataset.benchIdx;
          setDragOverId(pid || null);
          setDragOverEmptyIdx(pid ? null : (idxAttr ? parseInt(idxAttr, 10) : null));
          setSnapTarget(null);
          return;
        }
      }
      setDragOverEmptyIdx(null);
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

    const wasDragging          = ad.started;
    const targetId              = dragOverId;
    const droppedOnEmptyBench   = dragOverEmptyIdx !== null;

    activeDragRef.current = null;
    setGhostPos(null);
    setDragOverId(null);
    setDragOverEmptyIdx(null);
    setDraggingPlayerId(null);
    setDragFromSub(false);
    setSnapTarget(null);

    if (!wasDragging) {
      stableOnSelectPlayer(selectedPlayerId === ad.playerId ? null : ad.playerId);
      return;
    }
    if (!phase) return;

    const finalPos = toSVG(lastClientRef.current.x, lastClientRef.current.y);
    resolveDrop(ad.playerId, ad.fromSub, targetId ?? undefined, finalPos.x, finalPos.y, droppedOnEmptyBench);
  }, [dragOverId, dragOverEmptyIdx, phase, selectedPlayerId, resolveDrop, stableOnSelectPlayer, toSVG]);

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

  const maxSubs = isTrainingMatch?30:getSquadCapacity(sport).maxSubs;
  const subSlots = useMemo(()=>
    [...benchPlayers,...Array(Math.max(0,maxSubs-benchPlayers.length)).fill(null)] as (Player|null)[],
    [benchPlayers, maxSubs]);

  // Navn skal kun kunne endres via PlayerProfile.tsx (som skriver til
  // PlayerAccount.name) – ikke inline på brettet. player.playerAccountId
  // settes aldri noe sted i appen, så vi matcher på playerId (samme
  // oppslag som PlayerHome/PlayerPortal bruker) for at navneendringer
  // faktisk vises her.
  const getDisplayName = useCallback((player: Player): string => {
    const acc = playerAccounts.find(a => a.id === player.playerAccountId)
      ?? playerAccounts.find(a => a.playerId === player.id);
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

    const teamSize = getSquadCapacity(sport).teamSize;
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
            position: clampToPitch(pos.x, pos.y),
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
        position: clampToPitch(pos.x, pos.y),
        team: 'home', notes: '', isStarter: true, isOnField: true, minutesPlayed: 0, specialRoles: [],
      });
    }
    hasEnsuredStarters.current = true;
    isAddingPlayersRef.current = false;
  }, [phase, sport, availableFormations, selectedFormation, activePhaseIdx, updatePlayerField, addPlayer, clampToPitch]);

  // Teststall seedes ikke lenger automatisk her – phase.players-only
  // seeding var årsaken til at testspillere manglet i Spillerstall
  // (ingen PlayerAccount ble opprettet). Bruk "🧪 Seed testspillere"
  // i PlayerManager, som oppretter begge deler via seedTestSquad().

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
        <div
          className="flex-1 min-w-0 h-full flex flex-col items-stretch"
          style={{ padding: '4px', overflow: 'hidden' }}
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

          <svg
            ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio={isLandscape ? 'xMidYMid slice' : 'xMidYMid meet'}
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
                    selected={selectedPlayerId===player.id}
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
                    isDragOver={player ? dragOverId===player.id : dragOverEmptyIdx===idx}
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

      {isMobile&&draggingPlayerId&&!dragFromSub&&!showBottomSheet&&(
        <div data-bench-row data-bench-idx={-1} data-player-id=""
          style={{
            background: dragOverEmptyIdx===-1?'rgba(52,211,153,0.22)':'rgba(251,191,36,0.14)',
            border: dragOverEmptyIdx===-1?'2px dashed #34d399':'2px dashed rgba(251,191,36,0.5)',
            backdropFilter:'blur(12px)',
            transition:'background 0.15s, border-color 0.15s',
          }}
          className="fixed left-2 right-2 bottom-2 z-[60] rounded-xl py-3 flex items-center justify-center gap-2 pointer-events-auto">
          <span className="text-[13px]">🪑</span>
          <span className={`text-[11px] font-bold ${dragOverEmptyIdx===-1?'text-emerald-300':'text-amber-300'}`}>
            {dragOverEmptyIdx===-1?'Slipp her for å sette på benken':'Dra hit for å bytte ut'}
          </span>
        </div>
      )}

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
                  isDragOver={player ? dragOverId===player.id : dragOverEmptyIdx===idx}
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
