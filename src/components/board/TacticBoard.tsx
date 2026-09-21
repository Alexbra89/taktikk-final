'use client';
import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useActiveTactic, getSlot } from '../../store/selectors';
import { Player } from '../../types';
import { VW, VH, getFormationSlots } from '../../data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { Ball } from './BoardElements';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawToolbar } from './DrawToolbar';
import { TextLabelModal } from './TextLabelModal';
import { ExportImageButton, ExportImageError } from './ExportImage';
import { ROLE_INFO } from '../../data/roleInfo';
import { LONG_PRESS, DRAG_THRESH, MAX_UNDO, CLAMP_X, CLAMP_Y_TOP, CLAMP_Y_BOTTOM } from './constants';
import { SvgPos, separatePlayers, nearestSlotPos } from '../../lib/geometry';
import { PlayerChip } from './svg/PlayerChip';
import { RoleBadge } from './svg/RoleBadge';
import { NameLabel } from './svg/NameLabel';
import { DragGhost } from './svg/DragGhost';
import { SnapIndicator } from './svg/SnapIndicator';
import { SvgDefs } from './svg/SvgDefs';
import { PlayerTrails } from './svg/PlayerTrails';
import { PlayerNameBar } from './PlayerNameBar';
import { BoardPanel } from './BoardPanel';
import { TacticTabs } from '../ui/TacticTabs';
import { useViewport } from '../../hooks/useViewport';
import { useBoardZoom } from '../../hooks/useBoardZoom';
import { useDrawingInput } from '../../hooks/useDrawingInput';
import { useImageExport } from '../../hooks/useImageExport';
import {
  Plus, Trash2, Undo2, Redo2, PenLine, SkipBack, SkipForward, Play, Pause, ChevronDown, Eraser, Maximize2,
  StickyNote, Minus, X, Plus as PlusIcon, Footprints,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { Modal } from '../ui';
import { LABEL_CLASS, TEXTAREA_CLASS, PRIMARY_BTN, SECONDARY_BTN } from '../../lib/formClasses';

// ══════════════════════════════════════════════════════════════
//  TACTIC BOARD – KALK
//  Banen er helten: én linje over (taktikk + formasjon) og én under
//  (faser, angre, tegn, avspilling). Alt annet ligger i BoardPanel.
// ══════════════════════════════════════════════════════════════

interface TacticBoardProps {
  selectedPlayerId: string | null;
  onSelectPlayer:   (id: string | null) => void;
  /** Vises som knapp i linja over banen når den er satt (desktop). */
  onFullscreen?:    () => void;
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

// ══════════════════════════════════════════════════════════════
//  NOTAT FOR FASEN – lå tidligere i BoardPanel. Ligger nå på verktøy-
//  linja sammen med fasene, fordi notatet hører til fasen man står i.
// ══════════════════════════════════════════════════════════════
const PhaseNoteModal: React.FC<{
  phaseName: string;
  note: string;
  onSave: (note: string) => void;
  onClose: () => void;
}> = ({ phaseName, note, onSave, onClose }) => {
  const [draft, setDraft] = useState(note);

  const save = () => { onSave(draft); onClose(); };

  return (
    <Modal
      onClose={onClose}
      size="sm"
      title={<span className="font-serif text-[1.5rem] leading-tight">Notat</span>}
      subtitle={<span className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">{phaseName}</span>}
      footer={
        <div className="flex gap-2">
          <button onClick={save} className={`flex-1 ${PRIMARY_BTN}`}>Lagre</button>
          {note && (
            <button onClick={() => { onSave(''); onClose(); }} className={SECONDARY_BTN}>
              Tøm
            </button>
          )}
        </div>
      }
    >
      <label className={LABEL_CLASS} htmlFor="fase-notat">Hva skal spillerne huske?</label>
      <textarea
        id="fase-notat"
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={5}
        placeholder="F.eks. Hold linja høy til ballen er vunnet."
        className={TEXTAREA_CLASS}
      />
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════
//  HOVED-KOMPONENT
// ══════════════════════════════════════════════════════════════
export const TacticBoard: React.FC<TacticBoardProps> = ({
  selectedPlayerId,
  onSelectPlayer: onSelectPlayerProp,
  onFullscreen,
}) => {
  const onSelectPlayerRef = useRef(onSelectPlayerProp);
  useEffect(() => { onSelectPlayerRef.current = onSelectPlayerProp; }, [onSelectPlayerProp]);
  const stableOnSelectPlayer = useCallback((id: string | null) => {
    onSelectPlayerRef.current(id);
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const svgRef        = useRef<SVGSVGElement>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval>|null>(null);
  const playRef       = useRef({ from:0, t:0 });
  const spacingDebRef = useRef<ReturnType<typeof setTimeout>|null>(null);
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
  const [drawMode,         setDrawMode]          = useState(false);
  const [isPlaying,        setIsPlaying]         = useState(false);
  const [playSpeed,        setPlaySpeed]         = useState(1);
  const [interpFrom,       setInterpFrom]        = useState(0);
  const [interpT,          setInterpT]           = useState(0);
  const [showPanel,        setShowPanel]         = useState(false);
  const [showNote,         setShowNote]          = useState(false);
  const [undoDepth,        setUndoDepth]         = useState(0);
  const [redoDepth,        setRedoDepth]         = useState(0);

  const {
    setActivePhaseIdx, addPhase, removePhase,
    movePlayer, moveBall,
    removeLastDrawing, clearDrawings,
    updateStickyNote,
    showMovement, setShowMovement,
  } = useAppStore();

  const tactic = useActiveTactic();
  const { sport, formation, phases, activePhaseIdx } = tactic;
  const phase = phases[activePhaseIdx] ?? null;

  const { isMobile } = useViewport();
  const zoomCtl = useBoardZoom();

  // Via ref, slik at nullstillingseffekten under ikke kjører på nytt bare
  // fordi funksjonsidentiteten endrer seg – den skal følge fase og formasjon.
  const zoomResetRef = useRef(zoomCtl.reset);
  useEffect(() => { zoomResetRef.current = zoomCtl.reset; }, [zoomCtl.reset]);

  // Gest-flaggene MÅ leses gjennom en ref. Drag-håndtererne under er
  // useCallback-er med egne avhengigheter; leste de flaggene direkte ville
  // de fryse verdien fra den renderen de sist ble laget i. Panorering satte
  // isGesturing=true midt i en slik render, og da ble drag blokkert for godt
  // etterpå – uten at noe var galt med selve tilstanden.
  const gestureRef = useRef({ isGesturing: false, spaceHeld: false });
  gestureRef.current = { isGesturing: zoomCtl.isGesturing, spaceHeld: zoomCtl.spaceHeld };


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
    if (longPressRef.current)  clearTimeout(longPressRef.current);
    if (rafRef.current)        cancelAnimationFrame(rafRef.current);
    if (timerRef.current)      clearInterval(timerRef.current);
  }, []);

  // Stablene ligger i refs (de skal ikke utløse ny tegning under drag), men
  // knappene må vite om det finnes noe å angre. Dybden speiles derfor i state.
  const syncDepths = useCallback(() => {
    setUndoDepth(undoStack.current.length);
    setRedoDepth(redoStack.current.length);
  }, []);

  const pushUndo = useCallback((e:UndoEntry) => {
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO+1), e];
    redoStack.current = [];
    syncDepths();
  }, [syncDepths]);

  const doUndo = useCallback(() => {
    const e = undoStack.current.pop(); if (!e||!phase) return;
    const p = phase.players.find(pl=>pl.id===e.playerId); if (!p) return;
    redoStack.current.push({ playerId:e.playerId, prevPos:{...p.position} });
    movePlayer(e.playerId, e.prevPos);
    syncDepths();
  }, [phase, movePlayer, syncDepths]);

  const doRedo = useCallback(() => {
    const e = redoStack.current.pop(); if (!e||!phase) return;
    const p = phase.players.find(pl=>pl.id===e.playerId); if (!p) return;
    undoStack.current.push({ playerId:e.playerId, prevPos:{...p.position} });
    movePlayer(e.playerId, e.prevPos);
    syncDepths();
  }, [phase, movePlayer, syncDepths]);

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
    syncDepths();
    // Zoomen følger samme regime: den beskriver hvor du står i én fase,
    // ikke noe som skal henge igjen når brettet bytter innhold.
    zoomResetRef.current();
  }, [tactic.id, activePhaseIdx, formation, sport, syncDepths]);

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

  const draw = useDrawingInput({
    enabled: drawMode && !isPlaying,
    toSVG,
    isGesturing: () => gestureRef.current.isGesturing || gestureRef.current.spaceHeld,
  });
  const drawCancel = draw.cancel;

  const imageExport = useImageExport(svgRef, activePhaseIdx);

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

  /** Avbryter et pågående spillerdrag uten å flytte noe. Brukes når en
   *  andre finger lander: da er dette en knipebevegelse, ikke et drag. */
  const cancelDrag = useCallback(() => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    activeDragRef.current = null;
    setGhostPos(null);
    setDragOverId(null);
    setDraggingPlayerId(null);
    setSnapTarget(null);
    // Også en påbegynt strek skal forkastes, ikke lagres halvferdig.
    drawCancel();
  }, [drawCancel]);

  const onZoomPtrDown = useCallback((e: React.PointerEvent) => {
    if (zoomCtl.onPointerDown(e)) cancelDrag();
  }, [zoomCtl, cancelDrag]);

  const onZoomPtrMove = useCallback((e: React.PointerEvent) => {
    zoomCtl.onPointerMove(e);
  }, [zoomCtl]);

  const onZoomPtrUp = useCallback((e: React.PointerEvent) => {
    zoomCtl.onPointerUp(e);
  }, [zoomCtl]);

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

  if (!phase || !isMounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-canvas text-ink-subtle">
        <span className="text-caption">Laster taktikktavle …</span>
      </div>
    );
  }

  const iconBtn = 'tap-auto w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors disabled:opacity-30 disabled:hover:text-ink-subtle disabled:hover:bg-transparent';

  return (
    // Rot-div bruker IKKE overflow-hidden, og touch-action tillater pinch-zoom.
    <div
      className="flex flex-col h-full select-none bg-canvas"
      style={{ touchAction: 'pan-x pan-y pinch-zoom', overflowX: 'hidden' }}
    >
      {/* --- EN LINJE OVER BANEN: taktikk + formasjon --- */}
      <div className="relative flex-shrink-0 flex items-center gap-2 px-2 py-1.5 bg-canvas-sunken border-b border-rule">
        {isMobile ? (
          <div className="flex-1 min-w-0"><TacticTabs /></div>
        ) : (
          <span className="pl-1 font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">Formasjon</span>
        )}
        <button
          onClick={() => setShowPanel(v => !v)}
          aria-expanded={showPanel}
          aria-haspopup="dialog"
          title="Oppsett, notat, øyeblikk og fart"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 min-h-[40px] rounded-ctl bg-canvas-raised text-ink shadow-hair hover:bg-canvas-hover transition-colors"
        >
          <span className="font-mono text-body">{formation}</span>
          <ChevronDown size={14} strokeWidth={1.75} className="text-ink-subtle" />
        </button>

        {onFullscreen && (
          <button onClick={onFullscreen} aria-label="Fullskjerm" title="Fullskjerm (F)" className={iconBtn}>
            <Maximize2 size={16} strokeWidth={1.75} />
          </button>
        )}

        {showPanel && (
          <BoardPanel
            isMobile={isMobile}
            onClose={() => setShowPanel(false)}
            playSpeed={playSpeed}
            setPlaySpeed={setPlaySpeed}
          />
        )}
      </div>

      {/* touchAction none rundt selve banen på mobil – forhindrer at siden scroller
          under drag. Linjene over og under ligger utenfor, så de kan rulles. */}
      <div className="flex flex-1 min-h-0 overflow-hidden" style={isMobile ? { touchAction: 'none' } : undefined}>
        <div
          ref={zoomCtl.containerRef}
          className="flex-1 min-w-0 h-full flex flex-col items-stretch p-1 overflow-hidden"
          onPointerDownCapture={onZoomPtrDown}
          onPointerMoveCapture={onZoomPtrMove}
          onPointerUpCapture={onZoomPtrUp}
          onPointerCancelCapture={onZoomPtrUp}
        >
          {/* Zoom er en CSS-transform her, ikke en endring av viewBox – da er
              toSVG uendret, fordi getBoundingClientRect() allerede tar med
              transformen. Se kommentaren i useBoardZoom.ts. */}
          <div className="flex-1 min-h-0 flex flex-col" style={zoomCtl.transformStyle}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              flex: 1, width: '100%', height: '100%', display: 'block',
              cursor: zoomCtl.spaceHeld ? 'grab' : drawMode ? (draw.tool === 'label' ? 'text' : 'crosshair') : 'default',
              // Pinch håndteres av oss når vi kan zoome, ellers lar vi
              // nettleseren beholde sin vanlige oppførsel.
              touchAction: 'none',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={draw.onPointerDown}
            onPointerMove={draw.onPointerMove}
            onPointerUp={draw.onPointerUp}
            onPointerLeave={draw.onPointerUp}
          >
            <SvgDefs/>
            <rect width={VW} height={VH} style={{ fill: 'rgb(var(--k-pitch))' }}/>

            <FootballPitch/>
            {/* Under tegningene: banene er avledet og skal ikke skjule det treneren har tegnet.
                Skjules under avspilling – da viser brikkene bevegelsen selv. */}
            {showMovement&&!isPlaying&&activePhaseIdx>0&&(
              <PlayerTrails from={phases[activePhaseIdx-1].players} to={phase.players}/>
            )}
            {phase.drawings?.map(d=><DrawingCanvas key={d.id} drawing={d}/>)}
            {draw.preview&&(
              <g opacity={0.85} style={{ pointerEvents:'none' }}>
                <DrawingCanvas drawing={{ id:'preview', ...draw.preview }}/>
              </g>
            )}
            {phase&&(
              <Ball position={displayBall} isDraggable={!isPlaying&&!drawMode}
                onPositionChange={pos=>moveBall(pos)}/>
            )}

            {snapTarget&&ghostPos&&<SnapIndicator x={snapTarget.x} y={snapTarget.y}/>}

            {allDisplay.map(player => {
              const slot       = getSlot(tactic, player.slotIdx);
              const name       = getDisplayName(player);
              const isTarget   = dragOverId===player.id;
              const isSrc      = draggingPlayerId===player.id;
              const isBouncing = bounceId===player.id;
              const outOfPos   = isOutOfPos(player);
              const {x,y}      = player.position;

              return (
                <g key={player.id} data-player="true"
                  onPointerDown={e=>startDrag(e, player.id)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  style={{
                    cursor: !isPlaying&&!drawMode ? 'grab' : 'default',
                    // none her er nødvendig kun for selve spillerne,
                    // for å forhindre at dragging scroller siden.
                    touchAction: 'none',
                    transformOrigin: `${x}px ${y}px`,
                    transform: isBouncing?'scale(1.12)':'scale(1)',
                    transition: isBouncing?'transform 0.2s cubic-bezier(.34,1.56,.64,1)':'none',
                  }}
                >
                  <PlayerChip x={x} y={y} num={player.num}
                    selected={selectedPlayerId===player.id} isDragging={!!isSrc}
                    isTarget={isTarget} isOutOfPos={outOfPos}/>
                  <RoleBadge x={x} y={y+22} label={slot.label}/>
                  {name&&<NameLabel x={x} y={y+44} name={name}/>}
                </g>
              );
            })}

            {ghostPos&&ghostPlayer&&ghostSlot&&(
              <DragGhost x={ghostPos.x} y={ghostPos.y}
                num={ghostPlayer.num} name={getDisplayName(ghostPlayer)}
                label={ghostSlot.label} scaleIn={ghostPos.scaleIn}/>
            )}

            {isPlaying&&(
              <rect x={32} y={VH-14} rx={2} height={4}
                width={progressFrac*(VW-64)} style={{ fill:'rgb(var(--k-signal))' }}/>
            )}
          </svg>
          </div>
        </div>
      </div>

      {selectedPlayer&&(
        <PlayerNameBar key={selectedPlayer.id} player={selectedPlayer}
          label={getSlot(tactic, selectedPlayer.slotIdx).label}
          onClose={()=>stableOnSelectPlayer(null)}/>
      )}

      {drawMode&&(
        <DrawToolbar
          tool={draw.tool} onTool={draw.setTool}
          color={draw.color} onColor={draw.setColor}
          hasDrawings={(phase?.drawings?.length??0)>0}
          onRemoveLast={removeLastDrawing}
          onClearAll={clearDrawings}
          className="border-t"/>
      )}

      {imageExport.error&&(
        <ExportImageError message={imageExport.error} onClose={imageExport.clearError} className="border-t"/>
      )}

      {/* --- EN LINJE UNDER BANEN: faser, angre, tegn, avspilling --- */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 overflow-x-auto no-scrollbar bg-canvas-sunken border-t border-rule">

        {isMobile ? (
          <select
            value={activePhaseIdx}
            onChange={(e) => !isPlaying && setActivePhaseIdx(parseInt(e.target.value))}
            disabled={isPlaying}
            aria-label="Fase"
            className="flex-shrink-0 rounded-ctl px-2 min-h-[40px] bg-canvas-raised text-body text-ink shadow-hair focus:outline-none disabled:opacity-40"
          >
            {phases.map((ph, idx) => (
              <option key={ph.id} value={idx}>
                {ph.name || `Fase ${idx + 1}`}{ph.stickyNote ? ' ·' : ''}
              </option>
            ))}
          </select>
        ) : (
          <div role="tablist" aria-label="Faser" className="flex items-center gap-1 flex-shrink-0">
            {phases.map((ph, idx) => {
              const active = activePhaseIdx === idx;
              return (
                <button key={ph.id} role="tab" aria-selected={active}
                  onClick={() => !isPlaying && setActivePhaseIdx(idx)}
                  className={cn(
                    'px-3 min-h-[40px] rounded-ctl text-body whitespace-nowrap transition-colors',
                    active ? 'bg-canvas-raised text-ink shadow-hair' : 'text-ink-muted hover:text-ink hover:bg-canvas-hover',
                    isPlaying && 'opacity-50',
                  )}>
                  {ph.name || `Fase ${idx + 1}`}
                  {ph.stickyNote && <span className="ml-1 text-signal" aria-hidden>·</span>}
                </button>
              );
            })}
          </div>
        )}

        <button onClick={() => !isPlaying && addPhase()} disabled={isPlaying}
          aria-label="Legg til fase" title="Legg til fase" className={iconBtn}>
          <Plus size={16} strokeWidth={1.75} />
        </button>

        {/* Notatet hører til fasen, så knappen står ved fase-knappene.
            Prikken gjentar indikatoren på selve fasen. */}
        <button onClick={() => setShowNote(true)} disabled={isPlaying || !phase}
          aria-label={phase?.stickyNote ? 'Rediger notat for fasen' : 'Legg til notat for fasen'}
          title="Notat for fasen"
          className={cn(iconBtn, 'relative', phase?.stickyNote && 'text-signal hover:text-signal')}>
          <StickyNote size={16} strokeWidth={1.75} />
        </button>
        {phases.length > 1 && (
          <button onClick={() => { if (phases.length > 1) removePhase(activePhaseIdx); }} disabled={isPlaying}
            aria-label="Slett fasen" title="Slett fasen" className={iconBtn}>
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
        )}

        <div className="flex-1 min-w-[4px]"/>

        <button onClick={zoomCtl.zoomOut} disabled={!zoomCtl.canZoomOut}
          aria-label="Zoom ut" title="Zoom ut" className={iconBtn}>
          <Minus size={16} strokeWidth={1.75} />
        </button>
        <button onClick={zoomCtl.zoomIn} disabled={!zoomCtl.canZoomIn}
          aria-label="Zoom inn" title="Zoom inn (Ctrl+scroll)" className={iconBtn}>
          <PlusIcon size={16} strokeWidth={1.75} />
        </button>
        {zoomCtl.isZoomed && (
          <button onClick={zoomCtl.reset}
            aria-label="Nullstill zoom" title="Nullstill zoom"
            className="tap-auto flex-shrink-0 inline-flex items-center gap-1 px-2 min-h-[36px] rounded-ctl
              bg-signal/10 text-signal shadow-hair-signal font-mono text-caption transition-colors">
            {zoomCtl.zoom.toFixed(1)}× <X size={13} strokeWidth={2} aria-hidden />
          </button>
        )}

        <button onClick={doUndo} disabled={undoDepth === 0 || isPlaying}
          aria-label="Angre" title="Angre (Ctrl+Z)" className={iconBtn}>
          <Undo2 size={16} strokeWidth={1.75} />
        </button>
        <button onClick={doRedo} disabled={redoDepth === 0 || isPlaying}
          aria-label="Gjør om" title="Gjør om (Ctrl+Y)" className={iconBtn}>
          <Redo2 size={16} strokeWidth={1.75} />
        </button>

        <button onClick={()=>setDrawMode(!drawMode)}
          aria-pressed={drawMode}
          aria-label={drawMode ? 'Stopp tegning' : 'Tegn'}
          title={drawMode ? 'Stopp tegning' : 'Tegn'}
          className={cn(iconBtn, drawMode && 'bg-signal/10 text-signal shadow-hair-signal hover:text-signal')}>
          <PenLine size={16} strokeWidth={1.75} />
        </button>

        {/* I tegnemodus ligger viskelæret i tegneraden over. */}
        {!drawMode&&(phase?.drawings?.length??0)>0&&(
          <button onClick={()=>clearDrawings()} aria-label="Slett tegningene" title="Slett tegningene" className={iconBtn}>
            <Eraser size={16} strokeWidth={1.75} />
          </button>
        )}

        <button onClick={()=>setShowMovement(!showMovement)}
          aria-pressed={showMovement}
          aria-label="Vis bevegelse"
          title="Vis bevegelse fra forrige fase"
          className={cn(iconBtn, showMovement && 'bg-signal/10 text-signal shadow-hair-signal hover:text-signal')}>
          <Footprints size={16} strokeWidth={1.75} />
        </button>

        <ExportImageButton busy={imageExport.busy} disabled={isPlaying}
          onClick={imageExport.exportPng} className={iconBtn}/>

        <div className="flex items-center gap-0.5 flex-shrink-0 pl-1 ml-1 border-l border-rule">
          <button onClick={()=>!isPlaying&&setActivePhaseIdx(Math.max(0,activePhaseIdx-1))}
            disabled={isPlaying||activePhaseIdx===0}
            aria-label="Forrige fase" className={iconBtn}>
            <SkipBack size={15} strokeWidth={1.75} />
          </button>
          <button onClick={()=>isPlaying?stopPlayback():startPlayback()} disabled={phases.length<2}
            aria-label={isPlaying ? 'Stopp avspilling' : 'Spill av fasene'}
            className={cn(
              'tap-auto w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-colors',
              phases.length<2
                ? 'text-ink-faint cursor-not-allowed shadow-hair'
                : 'bg-signal text-signal-fg hover:brightness-110',
            )}>
            {isPlaying
              ? <Pause size={16} strokeWidth={2} fill="currentColor" />
              : <Play size={16} strokeWidth={2} fill="currentColor" />}
          </button>
          <button onClick={()=>!isPlaying&&setActivePhaseIdx(Math.min(phases.length-1,activePhaseIdx+1))}
            disabled={isPlaying||activePhaseIdx===phases.length-1}
            aria-label="Neste fase" className={iconBtn}>
            <SkipForward size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {draw.pendingLabel && (
        <TextLabelModal onSave={draw.commitLabel} onClose={draw.cancelLabel}/>
      )}

      {showNote && phase && (
        <PhaseNoteModal
          phaseName={phase.name || `Fase ${activePhaseIdx + 1}`}
          note={phase.stickyNote ?? ''}
          onSave={(v) => updateStickyNote(v, activePhaseIdx)}
          onClose={() => setShowNote(false)}
        />
      )}
    </div>
  );
};
