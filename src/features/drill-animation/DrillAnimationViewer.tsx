'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { VW, VH } from '@/data/formations';
import { BoardStage, type StagePlayer } from '@/components/board/BoardStage';
import { Board3DSlot } from '@/components/board/Board3DSlot';
import { SvgDefs } from '@/components/board/svg/SvgDefs';
import { PITCH_BOX } from '@/components/board/constants';
import { ballArcHeight } from '@/components/board/three/coordinates';
import { Button, IconButton } from '@/components/ui/Button';
import { usePhasePlayback, interpolatePlayers, interpolateBall } from '@/hooks/usePhasePlayback';
import { usePlayerStyle } from '@/hooks/usePlayerStyle';
import { useViewport } from '@/hooks/useViewport';
import { interpolateItems } from '@/lib/exportVideo';
import { cn } from '@/lib/cn';
import { DrillAnimationControls } from './DrillAnimationControls';
import { clockIndexOf, shownPhase, withPauses } from './playback';
import { feedbackMailto } from './feedback';
import { useReducedMotion } from './useReducedMotion';
import type { DrillAnimation } from './types';

// ══════════════════════════════════════════════════════════════
//  ANIMERT ØVELSE – visningen
//
//  Gjenbruker brettets deler uten å røre storen: BoardStage (2D),
//  Board3DSlot (3D) og faseklokka usePhasePlayback. Ingenting lagres.
//  «Reduser bevegelse»: spillerne hopper fra fase til fase i stedet
//  for å gli, i samme takt.
// ══════════════════════════════════════════════════════════════

type WebkitDocument = Document & { webkitFullscreenElement?: Element | null; webkitFullscreenEnabled?: boolean; webkitExitFullscreen?: () => void };
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => void };
const fullscreenElement = () => document.fullscreenElement ?? (document as WebkitDocument).webkitFullscreenElement ?? null;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Holder Tab inne i dialogen: fra siste til første kontroll og motsatt. */
function trapTab(e: KeyboardEvent, root: HTMLElement | null) {
  if (!root) return;
  const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.getClientRects().length > 0);
  const first = focusable[0], last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (!first || !last) { e.preventDefault(); root.focus(); return; }
  if (!root.contains(active) || (e.shiftKey ? active === first || active === root : active === last)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  }
}

interface Props {
  animation: DrillAnimation;
  drillName: string;
  onClose: () => void;
}

export default function DrillAnimationViewer({ animation, drillName, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const gliding = !reducedMotion;
  const { isMobile } = useViewport();
  const [playerStyle] = usePlayerStyle();
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen] = useState(() => !!(document.fullscreenEnabled || (document as WebkitDocument).webkitFullscreenEnabled));

  // Klokka spiller fra `offset` (starten av en fase), så «Spill av» fortsetter
  // fra fasen som vises. clockIdx er klokkas indeks i hele lista.
  const allClockPhases = useMemo(() => withPauses(animation.phases), [animation]);
  const [offset, setOffset] = useState(0);
  const [clockIdx, setClockIdx] = useState(0);
  const clockPhases = useMemo(() => allClockPhases.slice(offset), [allClockPhases, offset]);
  const setFromClock = useCallback((idx: number) => setClockIdx(offset + idx), [offset]);
  const { isPlaying, interpFrom, interpT, startPlayback, stopPlayback } = usePhasePlayback(clockPhases, speed, setFromClock);

  // Start etter at klokka har fått de nye fasene (offset settes i samme klikk).
  const [playRequest, setPlayRequest] = useState(0);
  const handledRequest = useRef(0);
  useEffect(() => {
    if (playRequest === handledRequest.current) return;
    handledRequest.current = playRequest;
    startPlayback();
  }, [playRequest, startPlayback]);

  const phases = animation.phases;
  const last = phases.length - 1;
  const glide = isPlaying && gliding;
  const from = offset + interpFrom;
  const shown = Math.min(last, shownPhase(clockIdx, from, interpT, glide));
  const phase = phases[shown];
  // Bevegelse pågår: overgangen fra en pause til neste fase (oddetall i klokka).
  const moving = glide && interpT > 0 && from % 2 === 1;

  const local = clockPhases[clockIdx - offset] ?? allClockPhases[clockIdx] ?? phases[0];
  const players = interpolatePlayers(local, clockPhases, interpFrom, interpT, glide);
  const ball = interpolateBall(local, clockPhases, interpFrom, interpT, glide);
  const items = glide && interpT > 0
    ? interpolateItems(clockPhases[interpFrom]?.items, clockPhases[interpFrom + 1]?.items, interpT)
    : local.items ?? [];
  const progress = isPlaying && allClockPhases.length > 1 ? (from + (glide ? interpT : 0)) / (allClockPhases.length - 1) : null;
  const ballHeight = moving && allClockPhases[from + 1]
    ? ballArcHeight(allClockPhases[from].ball, allClockPhases[from + 1].ball, interpT, animation.sport) : 0;

  const stagePlayers: StagePlayer[] = players.map(p => ({
    id: p.id, num: p.num, position: p.position, name: '',
    label: animation.cast[p.id]?.label ?? '', family: animation.cast[p.id]?.family ?? 'mid',
  }));
  // 3D viser fasens navn og tekst i pillen; fasen er den som vises nå.
  const tactic = useMemo(() => ({ ...animation, activePhaseIdx: shown }), [animation, shown]);

  const select = (index: number) => {
    stopPlayback();
    const next = Math.max(0, Math.min(last, index));
    setOffset(clockIndexOf(next));
    setClockIdx(clockIndexOf(next));
  };
  const togglePlay = () => {
    // Pause midt i en bevegelse: stå i fasen teksten forklarer.
    if (isPlaying) { select(shown); return; }
    // Fra siste fase starter avspillingen forfra.
    setOffset(shown === last ? 0 : clockIndexOf(shown));
    setPlayRequest(n => n + 1);
  };

  // Escape lukker. 3D-fullskjermen tar Escape selv først (preventDefault).
  // Tab og Shift+Tab går rundt inne i dialogen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !fullscreenElement()) onClose();
      if (e.key === 'Tab') trapTab(e, rootRef.current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Siden bak skal ikke rulle eller kunne brukes, og fokus går tilbake dit
  // brukeren kom fra. Dialogen ligger rett i body, så resten gjøres inert.
  useEffect(() => {
    const root = rootRef.current;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const background = Array.from(document.body.children).filter(el => el !== root && !el.hasAttribute('inert'));
    document.body.style.overflow = 'hidden';
    background.forEach(el => el.setAttribute('inert', ''));
    root?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      background.forEach(el => el.removeAttribute('inert'));
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const changed = () => setFullscreen(fullscreenElement() === rootRef.current);
    document.addEventListener('fullscreenchange', changed);
    document.addEventListener('webkitfullscreenchange', changed);
    const root = rootRef.current;
    return () => {
      document.removeEventListener('fullscreenchange', changed);
      document.removeEventListener('webkitfullscreenchange', changed);
      if (root && fullscreenElement() === root) Promise.resolve(document.exitFullscreen?.()).catch(() => {});
    };
  }, []);

  const toggleFullscreen = () => {
    const doc = document as WebkitDocument;
    if (fullscreenElement()) {
      const exit = document.exitFullscreen ?? doc.webkitExitFullscreen;
      try { Promise.resolve(exit?.call(document)).catch(() => {}); } catch { /* ikke støttet */ }
      return;
    }
    const element = rootRef.current as WebkitElement | null;
    const request = element?.requestFullscreen ?? element?.webkitRequestFullscreen;
    try { Promise.resolve(request?.call(element)).catch(() => {}); } catch { /* ikke støttet */ }
  };

  const viewButton = (value: '2d' | '3d', label: string) => (
    <Button size="sm" variant={view === value ? 'primary' : 'ghost'} aria-pressed={view === value}
      onClick={() => setView(value)}>{label}</Button>
  );

  return createPortal(
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label={`Animert øvelse: ${drillName}`} tabIndex={-1}
      className="fixed inset-0 z-[90] flex flex-col bg-canvas outline-none">
      <header className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-rule bg-canvas-sunken">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">Animert øvelse</p>
          <h2 className="text-body font-bold text-ink truncate">{drillName}</h2>
        </div>
        <div role="group" aria-label="Visning" className="flex items-center gap-1">
          {viewButton('2d', '2D')}
          <span aria-hidden className="text-ink-faint">|</span>
          {viewButton('3d', '3D')}
        </div>
        {canFullscreen && (
          <IconButton size="sm" aria-label={fullscreen ? 'Lukk fullskjerm' : 'Fullskjerm for animasjonen'}
            title={fullscreen ? 'Lukk fullskjerm' : 'Fullskjerm'} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 size={16} strokeWidth={1.75} /> : <Maximize2 size={16} strokeWidth={1.75} />}
          </IconButton>
        )}
        <IconButton size="sm" aria-label="Lukk animasjonen" title="Lukk (Esc)" onClick={onClose}>
          <X size={16} strokeWidth={1.75} />
        </IconButton>
      </header>

      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        <div className={cn('relative flex flex-col', view === '2d' ? 'flex-1 min-h-[180px] p-1' : 'flex-1')}>
          {view === '2d' ? (
            <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" role="img"
              aria-label={`Bane i 2D. ${phase.name}.`} style={PITCH_BOX}>
              <SvgDefs />
              <BoardStage players={stagePlayers} playerStyle={playerStyle} ball={ball}
                drawings={local.drawings ?? []} items={items} progress={progress} />
            </svg>
          ) : (
            <Board3DSlot onSwitchTo2D={() => setView('2d')}
              tactic={tactic} players={stagePlayers} ball={ball} drawings={local.drawings ?? []}
              items={items} playerStyle={playerStyle} isPlaying={isPlaying} speed={speed}
              teamName="Øvelse" isMobile={isMobile}
              onSelectPhase={select} onTogglePlay={togglePlay} onSpeed={setSpeed}
              trails={null} progress={progress} ballHeight={ballHeight} />
          )}
          {phase.highlight && !moving && (
            <p aria-hidden className={cn('pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-pill bg-signal px-4 py-1.5',
              'text-lead font-bold text-signal-fg shadow-pop', view === '2d' ? 'top-3' : 'top-14', !reducedMotion && 'animate-pop')}>
              {phase.highlight}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-rule bg-canvas-sunken px-4 pt-3 pb-2 space-y-3 sheet-safe sm:pb-3">
          <div className="min-h-[3.25rem] text-center">
            <p className="font-mono text-meta text-ink-subtle">Fase {shown + 1} av {phases.length} · {phase.name}</p>
            <p data-testid="drill-animation-text" aria-live="polite" className="text-body text-ink mt-0.5">
              {phase.text}{phase.highlight ? ` ${phase.highlight}` : ''}
            </p>
          </div>
          <DrillAnimationControls phaseNames={phases.map(p => p.name)} shown={shown} isPlaying={isPlaying}
            speed={speed} onTogglePlay={togglePlay} onSelect={select} onSpeed={setSpeed} />
          <p className="text-center text-meta text-ink-faint">
            Illustrasjon laget ut fra øvelsesteksten ·{' '}
            <a href={feedbackMailto(drillName, shown + 1, phases.length)} className="text-signal underline">Ser noe feil ut?</a>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
