'use client';
import React, {
  useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo,
} from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useActiveTactic, getSlot } from '../../store/selectors';
import { Player } from '../../types';
import { VW, VH, getFormationSlots } from '../../data/formations';
import { BoardStage, type StagePlayer } from './BoardStage';
import { DrawToolbar } from './DrawToolbar';
import { TextLabelModal } from './TextLabelModal';
import { ExportImageButton, ExportVideoButton, ExportError } from './ExportImage';
import { ROLE_INFO } from '../../data/roleInfo';
import { DRAG_THRESH, PITCH_BOX } from './constants';
import { SvgPos } from '../../lib/geometry';
import { DragGhost } from './svg/DragGhost';
import { SnapIndicator } from './svg/SnapIndicator';
import { SvgDefs } from './svg/SvgDefs';
import { PlayerNameBar } from './PlayerNameBar';
import { BoardPanel } from './BoardPanel';
import { TacticTabs } from '../ui/TacticTabs';
import { useViewport } from '../../hooks/useViewport';
import { useBoardZoom } from '../../hooks/useBoardZoom';
import { useDrawingInput } from '../../hooks/useDrawingInput';
import { useBallDrag } from '../../hooks/useBallDrag';
import { useImageExport } from '../../hooks/useImageExport';
import { useVideoExport, videoLengthText } from '../../hooks/useVideoExport';
import { usePlayerStyle } from '../../hooks/usePlayerStyle';
import { ItemControls } from './ItemControls';
import { useBoardItems } from '../../hooks/useBoardItems';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { usePhasePlayback, interpolatePlayers, interpolateBall } from '../../hooks/usePhasePlayback';
import { usePlayerDrag } from '../../hooks/usePlayerDrag';
import { useSvgCoordinates } from '../../hooks/useSvgCoordinates';
import { interpolateItems } from '../../lib/exportVideo';
import { ballArcHeight } from './three/coordinates';
import {
  Plus, Trash2, Undo2, Redo2, PenLine, SkipBack, SkipForward, Play, Pause, ChevronDown, Eraser, Maximize2,
  StickyNote, Minus, X, Plus as PlusIcon, Footprints,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { PhaseNoteModal } from './PhaseNoteModal';
import { Board3DSlot, HoldWhileHidden } from './Board3DSlot';

// ══════════════════════════════════════════════════════════════
//  TACTIC BOARD – KALK
//  Banen er helten: én linje over (taktikk + formasjon) og én under
//  (faser, angre, tegn, avspilling). Alt annet ligger i BoardPanel.
//  Dra/bytte, angre, avspilling, koordinater, notat og 3D-plassen
//  ligger i egne filer; her settes de sammen med verktøylinjene.
// ══════════════════════════════════════════════════════════════

interface TacticBoardProps {
  selectedPlayerId: string | null;
  onSelectPlayer:   (id: string | null) => void;
  /** Vises som knapp i linja over banen når den er satt (desktop). */
  onFullscreen?:    () => void;
}

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

  const [drawMode,         setDrawMode]          = useState(false);
  const [playSpeed,        setPlaySpeed]         = useState(1);
  const [showPanel,        setShowPanel]         = useState(false);
  const [showNote,         setShowNote]          = useState(false);
  const [boardView, setBoardView] = useState<'2d' | '3d'>('2d');
  const teamName = useAppStore(s => s.homeTeamName);

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

  const {
    isPlaying, interpFrom, interpT, startPlayback, stopPlayback,
  } = usePhasePlayback(phases, playSpeed, setActivePhaseIdx);

  const { isMobile } = useViewport();
  const zoomCtl = useBoardZoom();
  const {
    containerRef: zoomContainerRef, transformStyle: zoomTransformStyle,
    zoomIn, zoomOut, canZoomIn, canZoomOut, isZoomed, zoom, reset: resetZoom,
  } = zoomCtl;

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
  const { isGesturing: zoomGesturing, spaceHeld: zoomSpaceHeld } = zoomCtl;
  useLayoutEffect(() => {
    gestureRef.current = { isGesturing: zoomGesturing, spaceHeld: zoomSpaceHeld };
  }, [zoomGesturing, zoomSpaceHeld]);

  // Pekerposisjon → banekoordinater (se useSvgCoordinates).
  const { toSVGRaw, toSVG, clampToPitch } = useSvgCoordinates(svgRef);

  // Slotene i aktiv formasjon: brukes til snapping når en spiller dras.
  const currentHomePlayers = useMemo(() => getFormationSlots(sport, formation), [sport, formation]);

  const {
    undoDepth, redoDepth, pushUndo, doUndo, doRedo, resetHistory,
  } = useUndoRedo(phase, movePlayer, boardView === '3d');

  // Angre/gjør om gjelder bare fasen spilleren ble flyttet i: nullstilles når taktikk, fase,
  // formasjon eller sport byttes, slik at «angre» aldri flytter en spiller i feil fase.
  useEffect(() => {
    resetHistory();
    // Zoomen følger samme regime: den beskriver hvor du står i én fase,
    // ikke noe som skal henge igjen når brettet bytter innhold.
    zoomResetRef.current();
  }, [tactic.id, activePhaseIdx, formation, sport, resetHistory]);

  // Formasjon, sport eller taktikk kan byttes utenfra (Controls/faner) mens avspilling pågår.
  useEffect(() => {
    stopPlayback();
  }, [tactic.id, formation, sport, stopPlayback]);

  const getDisplayPlayers = useCallback((): Player[] => {
    if (!phase) return [];
    return interpolatePlayers(phase, phases, interpFrom, interpT, isPlaying);
  }, [phase, phases, interpFrom, interpT, isPlaying]);

  const getDisplayBall = useCallback((): SvgPos => {
    if (!phase) return { x:VW/2, y:VH/2 };
    return interpolateBall(phase, phases, interpFrom, interpT, isPlaying);
  }, [phase, phases, interpFrom, interpT, isPlaying]);

  // Utstyret: kjegler, motstandere osv. Samme logikk som i fullskjerm.
  const items = useBoardItems({
    phase,
    enabled: boardView === '2d' && !isPlaying && !drawMode,
    toSVG, toSVGRaw,
    isGesturing: () => gestureRef.current.isGesturing || gestureRef.current.spaceHeld,
    dragThreshold: DRAG_THRESH,
  });
  const itemsCancel = items.cancel;

  const draw = useDrawingInput({
    enabled: boardView === '2d' && drawMode && !isPlaying,
    svgRef,
    toSVG,
    isGesturing: () => gestureRef.current.isGesturing || gestureRef.current.spaceHeld,
  });
  const drawCancel = draw.cancel;

  const imageExport = useImageExport(svgRef, activePhaseIdx);
  const videoExport = useVideoExport();
  const [playerStyle] = usePlayerStyle();

  // Dra og bytte av spillere (se usePlayerDrag).
  const {
    ghostPos, snapTarget, dragOverId, draggingPlayerId, bounceId,
    startDrag, moveDrag, endDrag, cancelPlayerDrag,
  } = usePlayerDrag({
    phase, tacticId: tactic.id, activePhaseIdx, isPlaying, drawMode, gestureRef,
    toSVG, clampToPitch, currentHomePlayers, movePlayer, pushUndo,
    selectedPlayerId, onSelectPlayer: stableOnSelectPlayer,
  });

  /** Avbryter et pågående spillerdrag uten å flytte noe. Brukes når en
   *  andre finger lander: da er dette en knipebevegelse, ikke et drag. */
  const cancelDrag = useCallback(() => {
    cancelPlayerDrag();
    // Utstyr som dras slippes der det sto.
    itemsCancel();
    // Også en påbegynt strek skal forkastes, ikke lagres halvferdig.
    drawCancel();
  }, [cancelPlayerDrag, drawCancel, itemsCancel]);

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

  const ballDrag = useBallDrag(svgRef, !isPlaying&&!drawMode, moveBall);

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

  // Alt BoardStage trenger å vite om hver spiller. Interaksjonen ligger igjen her.
  const stagePlayers: StagePlayer[] = useMemo(() => allDisplay.map(player => ({
    id: player.id,
    num: player.num,
    position: player.position,
    label: getSlot(tactic, player.slotIdx).label,
    family: ROLE_INFO[getSlot(tactic, player.slotIdx).role].family,
    name: getDisplayName(player),
    selected: selectedPlayerId===player.id,
    dragging: draggingPlayerId===player.id,
    target: dragOverId===player.id,
    outOfPos: isOutOfPos(player),
    bounce: bounceId===player.id,
  })), [allDisplay, tactic, getDisplayName, selectedPlayerId, draggingPlayerId, dragOverId, isOutOfPos, bounceId]);

  // Under avspilling glir utstyret mellom fasene, som spillerne.
  const shownItems = isPlaying && interpT > 0
    ? interpolateItems(phases[interpFrom]?.items, phases[interpFrom + 1]?.items, interpT)
    : items.displayItems;

  const ghostPlayer = draggingPlayerId ? phase?.players.find(p=>p.id===draggingPlayerId) : null;
  const ghostSlot   = ghostPlayer ? getSlot(tactic, ghostPlayer.slotIdx) : null;

  if (!phase || !isMounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-canvas text-ink-subtle">
        <span className="text-caption">Laster taktikktavle …</span>
      </div>
    );
  }

  // Sletting av tegninger og faser kan ikke angres (angre gjelder bare
  // spillerflytt). Spør derfor først, som ved sletting av en taktikk.
  const confirmClearDrawings = () => {
    if (window.confirm(`Slette alle tegningene i «${phase.name}»?`)) clearDrawings();
  };
  const confirmRemovePhase = () => {
    if (phases.length > 1 && window.confirm(`Slette «${phase.name}»? Plasseringene og tegningene i fasen forsvinner.`)) {
      removePhase(activePhaseIdx);
    }
  };

  const iconBtn = 'tap-auto w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors disabled:opacity-30 disabled:hover:text-ink-subtle disabled:hover:bg-transparent';

  return (
    // Rot-div bruker IKKE overflow-hidden, og touch-action tillater pinch-zoom.
    <div
      className="flex flex-col h-full select-none bg-canvas"
        style={{ touchAction: 'pan-x pan-y pinch-zoom', overflowX: 'hidden', ...(boardView === '3d' ? { minHeight: 0, overflowY: 'auto' } : {}) }}
    >
      {/* --- EN LINJE OVER BANEN: taktikk + formasjon --- */}
      <div className="relative flex-shrink-0 flex items-center gap-2 px-2 py-1.5 bg-canvas-sunken border-b border-rule">
        {isMobile ? (
          <div className="flex-1 min-w-0"><TacticTabs /></div>
        ) : (
          <span className="pl-1 font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">{tactic.empty ? 'Bane' : 'Formasjon'}</span>
        )}
        {boardView === '2d' ? <button
          onClick={() => setShowPanel(v => !v)}
          aria-expanded={showPanel}
          aria-haspopup="dialog"
          title="Oppsett, notat, øyeblikk og fart"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 min-h-[40px] rounded-ctl bg-canvas-raised text-ink shadow-hair hover:bg-canvas-hover transition-colors"
        >
          <span className="font-mono text-body">{tactic.empty ? 'Tom bane' : formation}</span>
          <ChevronDown size={14} strokeWidth={1.75} className="text-ink-subtle" />
        </button> : <span className="font-mono text-body text-ink-muted">{tactic.empty ? 'Tom bane' : formation}</span>}

        <div role="group" aria-label="Visning av tavla" className="flex items-center gap-1 ml-auto">
          <Button size="sm" variant={boardView === '2d' ? 'primary' : 'ghost'} aria-pressed={boardView === '2d'} onClick={() => setBoardView('2d')}>2D</Button>
          <span aria-hidden className="text-ink-faint">|</span>
          <Button size="sm" variant={boardView === '3d' ? 'primary' : 'ghost'} aria-pressed={boardView === '3d'} onClick={() => { drawCancel(); itemsCancel(); setShowPanel(false); setBoardView('3d'); }}>3D</Button>
        </div>

        {onFullscreen && boardView === '2d' && (
          <button onClick={() => { stopPlayback(); onFullscreen(); }} aria-label="Fullskjerm" title="Fullskjerm (F)" className={iconBtn}>
            <Maximize2 size={16} strokeWidth={1.75} />
          </button>
        )}

        {showPanel && boardView === '2d' && (
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
      {boardView === '3d' && <Board3DSlot onSwitchTo2D={() => setBoardView('2d')}
        tactic={tactic} players={stagePlayers} ball={displayBall} drawings={phase.drawings ?? []}
        items={shownItems} playerStyle={playerStyle} isPlaying={isPlaying} speed={playSpeed}
        teamName={teamName} isMobile={isMobile}
        // For 3D fullscreen, which covers the rows below: same rules as those buttons.
        onSelectPhase={idx => !isPlaying && setActivePhaseIdx(idx)}
        onTogglePlay={() => isPlaying ? stopPlayback() : startPlayback()}
        onSpeed={setPlaySpeed}
        trails={showMovement && !isPlaying && activePhaseIdx > 0 ? { from: phases[activePhaseIdx - 1].players, to: phase.players } : null}
        progress={isPlaying ? progressFrac : null}
        // Same clock as 2D; only the height of long passes is added in 3D.
        ballHeight={isPlaying && interpT > 0 && phases[interpFrom + 1]
          ? ballArcHeight(phases[interpFrom].ball, phases[interpFrom + 1].ball, interpT, sport) : 0}
      />}
      <div className={cn('flex-1 min-h-0 overflow-hidden', boardView === '2d' ? 'flex' : 'hidden')} style={isMobile ? { touchAction: 'none' } : undefined}>
        <div
          ref={zoomContainerRef}
          className="flex-1 min-w-0 h-full flex flex-col items-stretch p-1 overflow-hidden"
          onPointerDownCapture={onZoomPtrDown}
          onPointerMoveCapture={onZoomPtrMove}
          onPointerUpCapture={onZoomPtrUp}
          onPointerCancelCapture={onZoomPtrUp}
        >
          {/* Zoom er en CSS-transform her, ikke en endring av viewBox – da er
              toSVG uendret, fordi getBoundingClientRect() allerede tar med
              transformen. Se kommentaren i useBoardZoom.ts. */}
          <div className="flex-1 min-h-0 flex flex-col" style={zoomTransformStyle}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              // Boksen har banens proporsjoner, så det aldri er tomrom inne i
              // SVG-en over og under banen. Det tomrommet malte iOS Safari ikke
              // på nytt når verktøylinja endret høyden, og i portrett viste det
              // en gammel stripe av banen. Bredt brett: høyden begrenser,
              // og tomrommet havner på sidene som før.
              ...PITCH_BOX,
              cursor: zoomSpaceHeld ? 'grab' : drawMode ? (draw.tool === 'label' ? 'text' : 'crosshair') : 'default',
              // Pinch håndteres av oss når vi kan zoome, ellers lar vi
              // nettleseren beholde sin vanlige oppførsel.
              touchAction: 'none',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={draw.onPointerDown}
            onPointerMove={draw.onPointerMove}
            onPointerUp={draw.onPointerUp}
            onPointerCancel={draw.onPointerCancel}
            onPointerLeave={draw.onPointerLeave}
          >
            <SvgDefs/>

            <HoldWhileHidden hold={boardView === '3d' && isPlaying}>
            <BoardStage
              players={stagePlayers}
              playerStyle={playerStyle}
              ball={displayBall}
              drawings={phase.drawings ?? []}
              // Banene skjules under avspilling – da viser brikkene bevegelsen selv.
              trails={showMovement&&!isPlaying&&activePhaseIdx>0
                ? { from: phases[activePhaseIdx-1].players, to: phase.players } : null}
              preview={draw.preview}
              progress={isPlaying ? progressFrac : null}
              ballGroupProps={ballDrag}
              items={shownItems}
              selectedItemId={items.selectedId}
              itemGroupProps={items.itemGroupProps}
              playerGroupProps={player => ({
                onPointerDown: (e: React.PointerEvent) => startDrag(e, player.id),
                onPointerMove: moveDrag,
                onPointerUp: endDrag,
                onPointerCancel: endDrag,
                style: {
                  cursor: !isPlaying&&!drawMode ? 'grab' : 'default',
                  // none her er nødvendig kun for selve spillerne,
                  // for å forhindre at dragging scroller siden.
                  touchAction: 'none',
                  transformOrigin: `${player.position.x}px ${player.position.y}px`,
                  transform: player.bounce?'scale(1.12)':'scale(1)',
                  transition: player.bounce?'transform 0.2s cubic-bezier(.34,1.56,.64,1)':'none',
                },
              })}
              beforePlayers={snapTarget&&ghostPos
                ? <SnapIndicator x={snapTarget.x} y={snapTarget.y}/> : null}
              afterPlayers={<>
                {ghostPos&&ghostPlayer&&ghostSlot&&(
                  <DragGhost x={ghostPos.x} y={ghostPos.y}
                    num={ghostPlayer.num} name={getDisplayName(ghostPlayer)}
                    label={ghostSlot.label} scaleIn={ghostPos.scaleIn}
                    family={ROLE_INFO[ghostSlot.role].family} playerStyle={playerStyle}/>
                )}
                {items.rotHandle}
              </>}
            />
            </HoldWhileHidden>
          </svg>
          </div>
        </div>
      </div>

      {boardView === '2d' && selectedPlayer&&(
        <PlayerNameBar key={selectedPlayer.id} player={selectedPlayer}
          label={getSlot(tactic, selectedPlayer.slotIdx).label}
          onClose={()=>stableOnSelectPlayer(null)}/>
      )}

      {boardView === '2d' && drawMode&&(
        <DrawToolbar
          tool={draw.tool} onTool={draw.setTool}
          color={draw.color} onColor={draw.setColor}
          hasDrawings={(phase?.drawings?.length??0)>0}
          onRemoveLast={removeLastDrawing}
          onClearAll={confirmClearDrawings}
          className="border-t"/>
      )}

      {imageExport.error&&(
        <ExportError message={imageExport.error} onClose={imageExport.clearError} className="border-t"/>
      )}

      {videoExport.error&&(
        <ExportError message={videoExport.error} onClose={videoExport.clearError} className="border-t"/>
      )}

      {videoExport.notice&&(
        <ExportError message={videoExport.notice} onClose={videoExport.clearNotice} tone="info" className="border-t"/>
      )}

      {/* --- EN LINJE UNDER BANEN: faser, angre, tegn, avspilling --- */}
      <div className={cn('flex-shrink-0 flex items-center gap-1 px-2 py-1.5 overflow-x-auto no-scrollbar bg-canvas-sunken border-t border-rule', boardView === '3d' && 'sticky bottom-0 z-10 flex-wrap')}>

        {isMobile ? (
          <select
            value={activePhaseIdx}
            onChange={(e) => !isPlaying && setActivePhaseIdx(parseInt(e.target.value))}
            disabled={isPlaying}
            aria-label="Fase"
            className={cn('flex-shrink-0 rounded-ctl px-2 min-h-[40px] bg-canvas-raised text-body text-ink shadow-hair focus:outline-none disabled:opacity-40', boardView === '3d' && 'w-full min-w-0')}
          >
            {phases.map((ph, idx) => (
              <option key={ph.id} value={idx}>
                {ph.name || `Fase ${idx + 1}`}{ph.stickyNote ? ' ·' : ''}
              </option>
            ))}
          </select>
        ) : (
          <div role="tablist" aria-label="Faser" className={cn('flex items-center gap-1 flex-shrink-0', boardView === '3d' && 'w-full overflow-x-auto')}>
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

        {boardView === '2d' && <>
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
          <button onClick={confirmRemovePhase} disabled={isPlaying}
            aria-label="Slett fasen" title="Slett fasen" className={iconBtn}>
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
        )}
        </>}

        <div className="flex-1 min-w-[4px]"/>

        {boardView === '2d' && <>
        <button onClick={zoomOut} disabled={!canZoomOut}
          aria-label="Zoom ut" title="Zoom ut" className={iconBtn}>
          <Minus size={16} strokeWidth={1.75} />
        </button>
        <button onClick={zoomIn} disabled={!canZoomIn}
          aria-label="Zoom inn" title="Zoom inn (Ctrl+scroll)" className={iconBtn}>
          <PlusIcon size={16} strokeWidth={1.75} />
        </button>
        {isZoomed && (
          <button onClick={resetZoom}
            aria-label="Nullstill zoom" title="Nullstill zoom"
            className="tap-auto flex-shrink-0 inline-flex items-center gap-1 px-2 min-h-[36px] rounded-ctl
              bg-signal/10 text-signal shadow-hair-signal font-mono text-caption transition-colors">
            {zoom.toFixed(1)}× <X size={13} strokeWidth={2} aria-hidden />
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

        <ItemControls selectedItem={items.selectedItem} onAdd={items.add}
          onRotate={items.rotateBy} onRemove={items.removeSelected}
          disabled={isPlaying} buttonClass={iconBtn}/>

        {/* I tegnemodus ligger viskelæret i tegneraden over. */}
        {!drawMode&&(phase?.drawings?.length??0)>0&&(
          <button onClick={confirmClearDrawings} aria-label="Slett tegningene" title="Slett tegningene" className={iconBtn}>
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

        <ExportVideoButton busy={videoExport.busy} progress={videoExport.progress}
          disabled={isPlaying||phases.length<2}
          onClick={videoExport.exportVideo}
          title={phases.length<2
            ? 'Legg til en fase til for å lage video'
            : videoExport.format
              ? `Spill inn avspillingen som ${videoExport.format.label} (${videoLengthText(phases.length)})`
              : 'Nettleseren din støtter ikke videoeksport'}
          className={iconBtn}/>
        </>}

        {boardView === '3d' && <select aria-label="Avspillingsfart" value={playSpeed} disabled={isPlaying}
          onChange={e => setPlaySpeed(Number(e.target.value))}
          className="min-h-[40px] rounded-ctl bg-canvas-raised px-2 font-mono text-caption text-ink shadow-hair focus-ring disabled:opacity-40">
          {[0.5, 1, 1.5, 2, 3].map(speed => <option key={speed} value={speed}>{speed}×</option>)}
        </select>}
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
