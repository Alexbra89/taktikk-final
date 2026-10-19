'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Board3DSlot } from '@/components/board/Board3DSlot';
import { RecordingControls } from '@/components/board/RecordingControls';
import { Button, IconButton } from '@/components/ui/Button';
import { usePlayerStyle } from '@/hooks/usePlayerStyle';
import { useVideoExport, type VideoSource } from '@/hooks/useVideoExport';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/cn';
import { DrillAnimationControls } from './DrillAnimationControls';
import { DrillPitch, stagePlayersOf } from './DrillPitch';
import { playbackMs, playheadAt, useDrillPlayback, type Playhead } from './playback';
import { drillFraming, fitCrop } from './framing';
import { drillMotion } from './motion';
import styles from './DrillAnimationViewer.module.css';
import { feedbackMailto } from './feedback';
import { useReducedMotion } from './useReducedMotion';
import type { DrillAnimation } from './types';

// ══════════════════════════════════════════════════════════════
//  ANIMERT ØVELSE – visningen
//
//  Gjenbruker brettets deler uten å røre storen: BoardStage (2D, via
//  DrillPitch), Board3DSlot (3D) og 2D-opptaket useVideoExport.
//  Én klokke (playback.ts) og én bevegelse (motion.ts) for 2D, 3D og
//  videoene. Ingenting lagres. «Reduser bevegelse»: spillerne hopper fra
//  fase til fase i stedet for å gli, i samme takt.
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

/** Hvor langt hele avspillingen har kommet, 0–1 (fremdriftslinja i 3D). */
const progressOf = (head: Playhead, count: number) => (head.from + head.t) / Math.max(1, count - 1);

interface Props {
  animation: DrillAnimation;
  drillName: string;
  onClose: () => void;
}

export default function DrillAnimationViewer({ animation, drillName, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();
  const { isMobile } = useViewport();
  const [playerStyle] = usePlayerStyle();
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen] = useState(() => !!(document.fullscreenEnabled || (document as WebkitDocument).webkitFullscreenEnabled));
  const [area, setArea] = useState({ width: 0, height: 0 });
  /** Under 2D-opptak: tiden i opptaket (ms ved 1×). Skjermen viser det samme som videoen. */
  const [recordingAt, setRecordingAt] = useState<number | null>(null);

  const phases = animation.phases;
  const count = phases.length;
  const framing = useMemo(() => drillFraming(animation), [animation]);
  // Før flaten er målt: brettets egen størrelse.
  const fit = useMemo(() => fitCrop(framing.content, area.width || 880, area.height || 560), [framing, area]);
  const { isPlaying, moving, shown: playShown, from, interpT, select, togglePlay, sample } =
    useDrillPlayback(phases, speed, reducedMotion, view === '2d');

  // Opptaket styrer det som vises mens det pågår; ellers gjør klokka det.
  const recordingHead = recordingAt === null ? null : playheadAt(0, count, recordingAt);
  const head = recordingHead ?? { from, t: interpT, moving, shown: playShown };
  const shown = head.shown;
  const phase = phases[shown];
  const drawings = phases[head.from]?.drawings ?? [];
  const frame2d = drillMotion(animation, head.from, head.t, head.moving, fit.kitScale);
  // 3D har egne figurer: ballen ligger der øvelsen sier, uten krymping.
  const frame3d = view === '3d' ? drillMotion(animation, head.from, head.t, head.moving) : frame2d;
  const progress = isPlaying ? (head.from + head.t) / Math.max(1, count - 1) : null;

  // 3D-tilstanden ellers: fasen som vises (pillen og fullskjermens fasevalg).
  const tactic = useMemo(() => ({ ...animation, activePhaseIdx: shown }), [animation, shown]);
  const players3d = useMemo(() => stagePlayersOf(animation, frame3d.players), [animation, frame3d.players]);

  /** 3D leser klokka selv i hvert bilde, så den ikke venter på at siden tegnes på nytt. */
  const liveFrame = useCallback(() => {
    const now = sample();
    if (!now) return null;
    const f = drillMotion(animation, now.from, now.t, now.moving);
    return { players: stagePlayersOf(animation, f.players), ball: f.ball, items: f.items, ballHeight: f.ballHeight, progress: progressOf(now, count) };
  }, [sample, animation, count]);

  /** 3D-videoen: samme tempo, pauser og pasninger som visningen. */
  const timeline = useMemo(() => ({
    durationMs: (s: number) => playbackMs(0, count, s),
    frameAt: (elapsed: number, s: number) => {
      const at = playheadAt(0, count, elapsed, s);
      const f = drillMotion(animation, at.from, at.t, at.moving);
      return { players: stagePlayersOf(animation, f.players), ball: f.ball, items: f.items, ballHeight: f.ballHeight,
        progress: progressOf(at, count), phase: at.shown };
    },
  }), [animation, count]);

  // 2D-opptak: samme opptak som 2D-fullskjermen på taktikkbrettet, med øvelsens bilder.
  const videoSource: VideoSource = useMemo(() => {
    const at = (elapsed: number) => playheadAt(0, count, elapsed);
    return {
      tactic: animation, viewBox: fit.viewBox, durationMs: playbackMs(0, count),
      frameAt: elapsed => {
        const h = at(elapsed), f = drillMotion(animation, h.from, h.t, h.moving);
        return { players: f.players, ball: f.ball, items: f.items, fromIdx: h.shown, progress: progressOf(h, count) };
      },
      render: elapsed => {
        const h = at(elapsed);
        return <DrillPitch animation={animation} frame={drillMotion(animation, h.from, h.t, h.moving, fit.kitScale)}
          drawings={animation.phases[h.from]?.drawings ?? []} crop={fit.crop} kitScale={fit.kitScale} playerStyle={playerStyle} />;
      },
    };
  }, [animation, count, fit, playerStyle]);
  const video = useVideoExport({
    speed, source: videoSource,
    onFrame: (f, elapsed) => setRecordingAt(f ? elapsed ?? 0 : null),
    viewport: () => {
      const screen = pitchRef.current!.getBoundingClientRect(), board = svgRef.current!.getBoundingClientRect();
      return { width: screen.width, height: screen.height, x: board.left - screen.left, y: board.top - screen.top,
        boardWidth: board.width, boardHeight: board.height, clipX: 0, clipY: 0, clipWidth: screen.width, clipHeight: screen.height };
    },
  });
  const recording = video.busy;
  const { clearError: clearVideoError, clearNotice: clearVideoNotice } = video;
  useEffect(() => {
    if (!video.error && !video.notice) return;
    const timeout = setTimeout(() => { clearVideoError(); clearVideoNotice(); }, 5000);
    return () => clearTimeout(timeout);
  }, [video.error, video.notice, clearVideoError, clearVideoNotice]);
  const startRecording = () => { select(0); video.exportVideo(); };

  // Flaten 2D-banen får. Utsnittet regnes ut på nytt når den endrer størrelse.
  useLayoutEffect(() => {
    const element = areaRef.current;
    if (!element) return;
    const measure = () => setArea(current => current.width === element.clientWidth && current.height === element.clientHeight
      ? current : { width: element.clientWidth, height: element.clientHeight });
    const observer = new ResizeObserver(measure);
    observer.observe(element); measure();
    return () => observer.disconnect();
  }, [view]);

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
    const request = (element?.requestFullscreen ?? element?.webkitRequestFullscreen) as (() => Promise<void> | void) | undefined;
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
        {view === '2d' && video.format && (
          <RecordingControls busy={recording} seconds={video.seconds} disabled={count < 2}
            onStart={startRecording} onStop={video.stop} onCancel={video.cancel} />
        )}
        {/* Under opptak er visningen låst; knappene gir plass til opptakskontrollene på mobil. */}
        {!recording && <div role="group" aria-label="Visning" className="flex items-center gap-1">
          {viewButton('2d', '2D')}
          <span aria-hidden className="text-ink-faint">|</span>
          {viewButton('3d', '3D')}
        </div>}
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

      <div className={styles.content}>
        <div ref={pitchRef} className={styles.pitch}>
          {view === '2d' ? (
            <div ref={areaRef} data-testid="drill-animation-area" className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
              <svg ref={svgRef} data-testid="drill-animation-pitch" viewBox={fit.viewBox} preserveAspectRatio="xMidYMid meet" role="img"
                aria-label={`Bane i 2D. ${phase.name}.`} className="absolute inset-0" style={{ display: 'block', width: '100%', height: '100%' }}>
                <DrillPitch animation={animation} frame={frame2d} drawings={drawings}
                  crop={fit.crop} kitScale={fit.kitScale} playerStyle={playerStyle} />
              </svg>
            </div>
          ) : (
            <Board3DSlot onSwitchTo2D={() => setView('2d')}
              tactic={tactic} players={players3d} ball={frame3d.ball} drawings={drawings}
              cameraBounds={framing.bounds} playerRoles={animation.cast}
              items={frame3d.items} playerStyle={playerStyle} isPlaying={isPlaying} speed={speed}
              teamName="Øvelse" isMobile={isMobile}
              onSelectPhase={select} onTogglePlay={togglePlay} onSpeed={setSpeed}
              trails={null} progress={progress} ballHeight={frame3d.ballHeight}
              liveFrame={liveFrame} timeline={timeline} />
          )}
          {phase.highlight && !head.moving && (
            <p aria-hidden className={cn('pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-pill bg-signal px-4 py-1.5',
              'text-lead font-bold text-signal-fg shadow-pop', view === '2d' ? 'top-3' : 'top-14', !reducedMotion && 'animate-pop')}>
              {phase.highlight}
            </p>
          )}
        </div>

        <div className={cn(styles.notes, 'border-t border-rule bg-canvas-sunken px-4 pt-3 pb-2 space-y-3 sheet-safe sm:pb-3')}>
          <div className="min-h-[3.25rem] text-center">
            <p className="font-mono text-meta text-ink-subtle truncate">Fase {shown + 1} av {count} · {phase.name}</p>
            {/* Mål alle tekstene i samme rute, så banen står stille når teksten byttes. */}
            <div className="grid mt-0.5">
              {phases.map(p => <p key={p.id} aria-hidden="true" className="invisible col-start-1 row-start-1 text-body">
                {p.text}{p.highlight ? ` ${p.highlight}` : ''}
              </p>)}
              <p data-testid="drill-animation-text" aria-live="polite" className="col-start-1 row-start-1 text-body text-ink">
                {phase.text}{phase.highlight ? ` ${phase.highlight}` : ''}
              </p>
            </div>
          </div>
          <DrillAnimationControls phaseNames={phases.map(p => p.name)} shown={shown} isPlaying={isPlaying} disabled={recording}
            speed={speed} onTogglePlay={togglePlay} onSelect={select} onSpeed={setSpeed} />
          {(video.error || video.notice) && (
            <p role={video.error ? 'alert' : 'status'} className="text-center text-caption text-ink">{video.error || video.notice}</p>
          )}
          <p className="text-center text-meta text-ink-faint">
            Illustrasjon laget ut fra øvelsesteksten ·{' '}
            <a href={feedbackMailto(drillName, shown + 1, count)} className="text-signal underline">Ser noe feil ut?</a>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
