'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Minus, Pause, Play, Plus, RotateCcw, SkipBack, SkipForward, Video, X } from 'lucide-react';
import { Button, IconButton } from '../ui/Button';
import { cn } from '@/lib/cn';
import { BoardScene, type CameraView, type SceneFrame } from './three/BoardScene';
import { PITCHES, exportDuration, playbackBallHeight, playbackFrame } from './three/coordinates';
import { cameraAt, recordCameraTrack, type CameraSample } from './three/cameraTrack';
import { chooseEncoder, exportVideo3D, warmEncoder, type EncoderChoice } from '@/lib/exportVideo3D';
import { VIDEO_FPS, VIDEO_LEAD_MS, VIDEO_PHASE_MS, VIDEO_TAIL_MS, fullscreenVideoSize } from '@/lib/exportVideo';
import { RecordingControls } from './RecordingControls';
import { getSlot, SPORT_LABELS } from '@/store/selectors';
import { ROLE_INFO } from '@/data/roleInfo';
import type { PlayerStyle } from '@/hooks/usePlayerStyle';
import type { Tactic } from '@/types';
import type { StagePlayer } from './BoardStage';

/** What moves during playback; the rest of the frame comes from the props. */
type LiveFrame = Pick<SceneFrame, 'players' | 'ball' | 'items' | 'ballHeight' | 'progress'>;

interface Props extends SceneFrame {
  /** Explicit drill roles, also used by the existing video exporter. */
  playerRoles?: Record<string, Pick<StagePlayer, 'label' | 'family'>>;
  /**
   * Animated drills: read on every animation frame from their shared clock, so
   * 3D moves in step with the clock rather than when React next renders.
   * null while stopped. The tactic board passes none.
   */
  liveFrame?: () => LiveFrame | null;
  /** Animated drills: their own tempo (pauses, passes) for the 3D video. The tactic board passes none. */
  timeline?: {
    /** Playback at `speed`, without lead-in and tail. */
    durationMs: (speed: number) => number;
    /** `phase` is the phase the pill and drawings show. */
    frameAt: (elapsedMs: number, speed: number) => LiveFrame & { phase: number };
  };
  tactic: Tactic;
  playerStyle: PlayerStyle;
  isPlaying: boolean;
  speed: number;
  teamName: string;
  isMobile: boolean;
  /** Fullscreen hides the board's own rows, so it repeats phase choice and playback. */
  onSelectPhase: (index: number) => void;
  onTogglePlay: () => void;
  onSpeed: (speed: number) => void;
}

const VIEWS: [CameraView, string][] = [['overview', 'Oversikt'], ['top', 'Ovenfra'], ['ball', 'Følg ballen'], ['player', 'Spillerperspektiv']];
const SPEEDS = [0.5, 1, 1.5, 2, 3];
/** How long the fullscreen controls stay after the last touch, mouse move or key. */
const CONTROLS_MS = 3000;

// Safari (iPad, older macOS) only has the webkit-prefixed Fullscreen API; iPhone has none for elements.
type WebkitDocument = Document & { webkitFullscreenElement?: Element | null; webkitFullscreenEnabled?: boolean; webkitExitFullscreen?: () => Promise<void> | void };
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
const webkitDocument = () => document as WebkitDocument;
const fullscreenElement = () => document.fullscreenElement ?? webkitDocument().webkitFullscreenElement ?? null;
const orientation = () => (typeof screen === 'undefined' ? undefined : screen.orientation) as
  (ScreenOrientation & { lock?: (orientation: string) => Promise<void> }) | undefined;
/** Not every browser can lock rotation (desktop, iPhone); that is fine. */
function lockLandscape() { try { orientation()?.lock?.('landscape')?.catch(() => {}); } catch { /* unsupported */ } }
function unlockOrientation() { try { orientation()?.unlock?.(); } catch { /* unsupported */ } }
/** Tab and Shift+Tab wrap around inside fullscreen. Faded controls count: focusing one shows the row. */
function trapTab(element: HTMLElement, event: KeyboardEvent) {
  const items = Array.from(element.querySelectorAll<HTMLElement>('button, select'))
    .filter(item => !(item as HTMLButtonElement).disabled && item.getClientRects().length > 0);
  const first = items[0], last = items[items.length - 1], active = document.activeElement;
  const outside = !active || active === element || !element.contains(active);
  if (!items.length) { event.preventDefault(); element.focus({ preventScroll: true }); }
  else if (event.shiftKey ? outside || active === first : outside || active === last) {
    event.preventDefault(); (event.shiftKey ? last : first).focus({ preventScroll: true });
  }
}

export default function Board3D(props: Props) {
  // Landscape phones can be wider than the layout's mobile breakpoint.
  const lowPower = props.isMobile || matchMedia('(pointer: coarse)').matches;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BoardScene | null>(null);
  const latest = useRef(props); latest.current = props;
  const abort = useRef<AbortController | null>(null);
  const recording = useRef(false);
  const stopped = useRef(false);
  /** The recording draws the live view itself, then the video gets the GPU alone. */
  const livePaused = useRef(false);
  const [recordStage, setRecordStage] = useState<'preparing' | 'recording' | 'rendering' | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingPhase, setRecordingPhase] = useState<number | null>(null);
  const [view, setView] = useState<CameraView>('overview');
  const [playerId, setPlayerId] = useState(props.players.find(p => p.num === 1)?.id ?? props.players[0]?.id ?? '');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState<EncoderChoice | null>(null);
  const [checking, setChecking] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [assetNotice, setAssetNotice] = useState('');
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme);
  const stage = useRef<HTMLDivElement>(null);
  /** native: Fullscreen API. css: fixed over the page, where elements cannot go fullscreen (iPhone). */
  const [fullscreen, setFullscreen] = useState<'native' | 'css' | null>(null);
  const [controlsShown, setControlsShown] = useState(true);
  const [noteOpen, setNoteOpen] = useState(false);
  /** A history entry while in fullscreen, so Android's back button closes it instead of leaving the page. */
  const historyEntry = useRef(false);
  /** Where focus goes back to when fullscreen closes (normally the fullscreen button). */
  const returnFocus = useRef<HTMLElement | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const selectedId = props.players.some(p => p.id === playerId) ? playerId : props.players.find(p => p.num === 1)?.id ?? props.players[0]?.id ?? '';
  const sceneFrame = (p: Props, live = recording.current ? null : p.liveFrame?.() ?? null): SceneFrame => ({ ...p, ...(live ?? {}),
    phaseName: p.tactic.phases[p.tactic.activePhaseIdx]?.name,
    stickyNote: p.tactic.phases[p.tactic.activePhaseIdx]?.stickyNote,
  });

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.dataset.theme));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    setChecking(true); setChoice(null);
    chooseEncoder(lowPower).then(result => { if (active) { setChoice(result); setChecking(false); } }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; abort.current?.abort(); };
  }, [lowPower]);

  useEffect(() => {
    if (!host.current) return;
    let board: BoardScene;
    setReady(false); setError(''); setAssetNotice(''); setAssetsLoaded(false);
    try { board = new BoardScene(props.tactic.sport, props.playerStyle, lowPower); }
    catch { setError('3D kunne ikke startes. Prøv å slå på maskinvareakselerasjon i nettleseren. 2D kan fortsatt brukes.'); return; }
    scene.current = board;
    const element = host.current;
    element.appendChild(board.renderer.domElement);
    // Redrawn at once: resizing clears the canvas, and on phones the next frame can be 30 ms away
    // (entering fullscreen, rotating the phone).
    const resize = () => { board.resize(element.clientWidth, element.clientHeight); board.render(0, !!latest.current.cameraBounds); };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    board.setFrame(sceneFrame(latest.current), false); board.render(0, true);
    board.setDrawings(latest.current.drawings, latest.current.trails).catch(() => setError('Tegningene kunne ikke lastes i 3D. Prøv å åpne 3D på nytt.'));
    let raf = 0, last = performance.now(), active = true;
    // Reuse the live scene envelope too; the drill's numeric buffers are borrowed.
    const liveSceneFrame = sceneFrame(latest.current);
    board.assetsReady.then(() => { if (active) { setAssetNotice(board.assetWarnings.join(' ')); setAssetsLoaded(true); } });
    const render = (now: number) => {
      if (!active) return;
      raf = requestAnimationFrame(render);
      if (document.hidden || livePaused.current || (lowPower && now - last < 32)) return;
      // Animated drills: the moving players and ball straight from the clock, for this very frame.
      const live = recording.current ? null : latest.current.liveFrame?.() ?? null;
      if (live) {
        Object.assign(liveSceneFrame, latest.current, live);
        liveSceneFrame.phaseName = latest.current.tactic.phases[latest.current.tactic.activePhaseIdx]?.name;
        liveSceneFrame.stickyNote = latest.current.tactic.phases[latest.current.tactic.activePhaseIdx]?.stickyNote;
        board.setMotionFrame(liveSceneFrame);
      }
      board.render(Math.min(.1, (now - last) / 1000)); last = now;
    };
    const lost = (event: Event) => { event.preventDefault(); setReady(false); setError('3D mistet forbindelsen til grafikkortet. Bytt til 2D og åpne 3D igjen.'); abort.current?.abort(); };
    board.renderer.domElement.addEventListener('webglcontextlost', lost);
    raf = requestAnimationFrame(render); setReady(true);
    return () => {
      active = false; cancelAnimationFrame(raf); observer.disconnect(); abort.current?.abort();
      board.renderer.domElement.removeEventListener('webglcontextlost', lost);
      board.dispose(); board.renderer.domElement.remove(); scene.current = null;
    };
  }, [props.tactic.id, props.tactic.sport, props.playerStyle, lowPower, theme]);

  useEffect(() => { if (!recording.current) scene.current?.setFrame(sceneFrame(props), props.isPlaying); }, [props]);
  useEffect(() => {
    let active = true;
    if (!recording.current) scene.current?.setDrawings(props.drawings, props.trails).catch(() => { if (active) setError('Tegningene kunne ikke lastes i 3D.'); });
    return () => { active = false; };
  }, [props.drawings, props.trails]);
  useEffect(() => {
    const current = scene.current?.cameraState();
    // Restoring an aborted recording also restores these selectors. Do not
    // reset its manual orbit/zoom just because React updates the menu labels.
    if (current && (current.view !== view || current.playerId !== selectedId)) scene.current?.selectCamera(view, selectedId);
  }, [view, selectedId, props.tactic.id, props.tactic.sport, props.playerStyle, lowPower, theme]);

  const phaseIdx = props.tactic.activePhaseIdx;
  const activePhase = props.tactic.phases[recordingPhase ?? phaseIdx];
  const pillName = activePhase ? activePhase.name || `Fase ${(recordingPhase ?? phaseIdx) + 1}` : '';
  const pillNote = activePhase?.stickyNote?.trim() ?? '';
  useEffect(() => { setNoteOpen(false); }, [phaseIdx, pillNote]);

  const chooseView = (value: CameraView) => { setView(value); scene.current?.selectCamera(value, selectedId); };
  const resetCamera = () => { setView('overview'); scene.current?.selectCamera('overview'); };

  /** Clears fullscreen state once the element has left fullscreen (or never had it, in CSS mode). */
  const leaveFullscreen = useCallback(() => {
    if (recording.current) abort.current?.abort();
    setFullscreen(null); unlockOrientation();
    if (historyEntry.current) { historyEntry.current = false; history.back(); }
  }, []);
  const exitFullscreen = useCallback(() => {
    if (!fullscreenElement()) { leaveFullscreen(); return; }
    // fullscreenchange then calls leaveFullscreen.
    const exit = (document.exitFullscreen ?? webkitDocument().webkitExitFullscreen) as (() => Promise<void> | void) | undefined;
    try { Promise.resolve(exit?.call(document)).catch(leaveFullscreen); } catch { leaveFullscreen(); }
  }, [leaveFullscreen]);
  const enterFullscreen = async () => {
    const element = stage.current as WebkitElement | null;
    if (!element || fullscreen) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const request = (element.requestFullscreen ?? element.webkitRequestFullscreen) as (() => Promise<void> | void) | undefined;
    let native = false;
    if (request && (document.fullscreenEnabled || webkitDocument().webkitFullscreenEnabled)) {
      // Older Safari returns nothing instead of a promise; a refusal then arrives as fullscreenerror.
      try { await request.call(element); native = true; } catch { /* CSS fullscreen below */ }
    }
    setFullscreen(native ? 'native' : 'css');
    history.pushState({ board3dFullscreen: true }, ''); historyEntry.current = true;
    if (native) lockLandscape();
  };

  const wakeControls = useCallback(() => {
    setControlsShown(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsShown(false), CONTROLS_MS);
  }, []);

  useEffect(() => {
    if (!fullscreen) { setControlsShown(true); return; }
    wakeControls();
    const changed = () => { if (fullscreen === 'native' && !fullscreenElement()) leaveFullscreen(); };
    const refused = () => { if (fullscreen === 'native' && !fullscreenElement()) setFullscreen('css'); };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); exitFullscreen(); }
      else if (event.key === 'Tab' && stage.current) trapTab(stage.current, event);
      // F opens the 2D fullscreen board (page.tsx); it would end up hidden behind this one.
      else if ((event.key === 'f' || event.key === 'F') && !event.ctrlKey && !event.metaKey) event.stopPropagation();
    };
    const back = () => {
      if (!historyEntry.current) return;
      historyEntry.current = false;
      if (fullscreenElement()) exitFullscreen(); else leaveFullscreen();
    };
    const events = ['fullscreenchange', 'webkitfullscreenchange'], errors = ['fullscreenerror', 'webkitfullscreenerror'];
    events.forEach(name => document.addEventListener(name, changed));
    errors.forEach(name => document.addEventListener(name, refused));
    window.addEventListener('keydown', key, true);
    window.addEventListener('popstate', back);
    // The page behind must not scroll under a CSS fullscreen on iPhone.
    const overflow = document.documentElement.style.overflow;
    if (fullscreen === 'css') document.documentElement.style.overflow = 'hidden';
    return () => {
      clearTimeout(hideTimer.current);
      events.forEach(name => document.removeEventListener(name, changed));
      errors.forEach(name => document.removeEventListener(name, refused));
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('popstate', back);
      document.documentElement.style.overflow = overflow;
    };
  }, [fullscreen, wakeControls, exitFullscreen, leaveFullscreen]);

  // Fullscreen is modal: focus moves in, cannot leave (the page behind is covered, but its
  // buttons can still be reached with Tab), and returns to where it was on close.
  const isFullscreen = fullscreen !== null;
  useEffect(() => {
    const element = stage.current;
    if (!isFullscreen || !element) return;
    if (!element.contains(document.activeElement)) element.focus({ preventScroll: true });
    const keep = (event: FocusEvent) => { if (!element.contains(event.target as Node)) element.focus({ preventScroll: true }); };
    document.addEventListener('focusin', keep);
    return () => {
      document.removeEventListener('focusin', keep);
      const back = returnFocus.current; returnFocus.current = null;
      if (back?.isConnected) back.focus({ preventScroll: true });
    };
  }, [isFullscreen]);

  // Leaving 3D (or the page) while in fullscreen must not leave the browser stuck in it.
  useEffect(() => {
    const element = stage.current;
    return () => {
      if (element && fullscreenElement() === element) Promise.resolve(document.exitFullscreen?.()).catch(() => {});
      if (historyEntry.current) { historyEntry.current = false; history.back(); }
      unlockOrientation();
    };
  }, []);

  const exportVideo = async (fromFullscreen = false) => {
    if (!scene.current || !choice || abort.current) return;
    const controller = new AbortController(); abort.current = controller;
    recording.current = fromFullscreen; stopped.current = false; setRecordingSeconds(0);
    setRecordStage(fromFullscreen ? 'preparing' : null);
    const live = scene.current;
    const initialCamera = live.cameraState();
    const hidden = () => { if (document.hidden && fromFullscreen) controller.abort(); };
    document.addEventListener('visibilitychange', hidden);
    setProgress(0); setNotice(''); setError('');
    let exporter: BoardScene | null = null;
    try {
      // Isolated scene and immutable snapshot: exporting never moves or seeks the board.
      const snapshot = structuredClone(props.tactic);
      const speed = props.speed;
      const timeline = props.timeline;
      const totalMs = timeline ? VIDEO_LEAD_MS + timeline.durationMs(speed) + VIDEO_TAIL_MS : exportDuration(snapshot.phases.length, speed);
      const camera = scene.current.cameraState();
      const size = fromFullscreen ? fullscreenVideoSize(host.current!.clientWidth, host.current!.clientHeight) : null;
      const selectedChoice = size ? await chooseEncoder(false, size) : choice;
      controller.signal.throwIfAborted();
      if (!selectedChoice) throw new Error('Nettleseren støtter ikke opptak i denne skjermstørrelsen. Prøv en annen nettleser.');
      // The encoder starts up while models and sky load, before any clock runs.
      const encoderWarm = fromFullscreen ? warmEncoder(selectedChoice) : Promise.resolve();
      exporter = new BoardScene(snapshot.sport, props.playerStyle, lowPower, true);
      const board = exporter;
      board.resize(selectedChoice.config.width, selectedChoice.config.height, 1);
      // Reuse one CPU buffer, including the HUD. Allocating a new full-HD
      // canvas snapshot per frame can exhaust mobile memory before GC runs.
      const pixels = new ImageData(selectedChoice.config.width, selectedChoice.config.height);
      const bytes = new Uint8Array(pixels.data.buffer);
      const stride = pixels.width * 4, row = new Uint8Array(stride);
      const gl = board.renderer.getContext();
      board.controls.enabled = false;
      await board.assetsReady;
      controller.signal.throwIfAborted();
      /** The same frame for the live preview and the video, `elapsed` ms into playback. */
      const frameAt = (elapsed: number) => {
        if (timeline) {
          // The drill's own tempo and passes; same crop and camera as the live view.
          const { phase, ...moving } = timeline.frameAt(elapsed, speed);
          const drawings = snapshot.phases[phase]?.drawings ?? [];
          const frame: SceneFrame = { ...moving, drawings, cameraBounds: props.cameraBounds,
            phaseName: snapshot.phases[phase]?.name || `Fase ${phase + 1}`, stickyNote: snapshot.phases[phase]?.stickyNote };
          return { frame, drawings, phase };
        }
        const f = playbackFrame(snapshot.phases, elapsed, speed);
        const drawings = snapshot.phases[f.fromIdx].drawings ?? [];
        const frame: SceneFrame = { ...f, drawings, phaseName: snapshot.phases[f.fromIdx].name || `Fase ${f.fromIdx + 1}`, stickyNote: snapshot.phases[f.fromIdx].stickyNote,
          cameraBounds: props.cameraBounds,
          progress: snapshot.phases.length > 1 ? Math.min(1, elapsed * speed / ((snapshot.phases.length - 1) * VIDEO_PHASE_MS)) : null,
          ballHeight: playbackBallHeight(snapshot.phases, elapsed, speed, snapshot.sport), players: f.players.map(p => ({
          id: p.id, num: p.num, name: p.name.trim(), position: p.position,
          label: props.playerRoles ? props.playerRoles[p.id]?.label ?? '' : getSlot(snapshot, p.slotIdx).label,
          family: props.playerRoles ? props.playerRoles[p.id]?.family ?? 'mid' : ROLE_INFO[getSlot(snapshot, p.slotIdx).role].family,
        })) };
        return { frame, drawings, phase: f.fromIdx };
      };
      const first = frameAt(0);
      await board.setDrawings(first.drawings);
      controller.signal.throwIfAborted();
      board.setFrame(first.frame, false);
      board.restoreCamera(camera);
      let track: CameraSample[] | null = null, frameCount: number | undefined;
      if (fromFullscreen) {
        // Warm-up: decode the first phases' drawings (the earliest last, so the
        // bounded caches keep them), compile the video's shaders and wait for the
        // encoder. Otherwise the first second could freeze.
        const early = snapshot.phases.slice(0, 3).reverse().map(phase => phase.drawings ?? []);
        await Promise.all([encoderWarm, ...early.flatMap(drawings => [board.prepareDrawings(drawings), live.prepareDrawings(drawings)])]);
        controller.signal.throwIfAborted();
        await Promise.all([board.setDrawings(first.drawings), live.setDrawings(first.drawings)]);
        controller.signal.throwIfAborted();
        board.render(0, true);
        // Live: only the camera path is recorded, which is cheap even on a slow PC.
        livePaused.current = true; setRecordStage('recording');
        const recorded = await recordCameraTrack({
          durationMs: totalMs, signal: controller.signal,
          shouldStop: () => stopped.current, onElapsed: setRecordingSeconds,
          show: (time, dt, index) => {
            const { frame, drawings, phase } = frameAt(Math.max(0, time - VIDEO_LEAD_MS));
            // Prepared above; the live view never waits for a drawing layer.
            live.setDrawings(drawings).catch(() => {});
            live.setFrame(frame, index > 0);
            live.render(dt);
            setRecordingPhase(phase);
            return { state: live.cameraState(), pose: live.cameraPose() };
          },
        });
        track = recorded.track;
        frameCount = Math.ceil(recorded.durationMs * VIDEO_FPS / 1000 - 1e-6);
        // The video is made next; the live board shows the tactic as before meanwhile.
        live.setFrame(sceneFrame(latest.current), false);
        await live.setDrawings(latest.current.drawings, latest.current.trails);
        controller.signal.throwIfAborted();
        live.render(0); setRecordingPhase(null);
        setProgress(0); setRecordStage('rendering');
      }
      const path = track;
      await exportVideo3D({
        choice: selectedChoice, phaseCount: snapshot.phases.length, speed, team: props.teamName, tactic: snapshot.name,
        signal: controller.signal, onProgress: setProgress, frameCount, durationMs: totalMs,
        draw: async (elapsed, index) => {
          const { frame, drawings } = frameAt(elapsed);
          await board.setDrawings(drawings);
          controller.signal.throwIfAborted();
          board.setFrame(frame, index > 0);
          // Fullscreen: the recorded live camera path at this frame's exact time.
          const sample = path ? cameraAt(path, index * 1000 / VIDEO_FPS) : null;
          if (sample) board.restoreCamera(sample.state);
          board.render(1 / 30, index === 0, sample?.pose);
          gl.readPixels(0, 0, pixels.width, pixels.height, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
          // WebGL's origin is bottom-left; VideoFrame's is top-left.
          for (let y = 0; y < Math.floor(pixels.height / 2); y++) {
            const top = y * stride, bottom = (pixels.height - 1 - y) * stride;
            row.set(bytes.subarray(top, top + stride));
            bytes.copyWithin(top, bottom, bottom + stride); bytes.set(row, bottom);
          }
          return pixels;
        },
      });
      setNotice(selectedChoice.ext === 'mp4' ? '3D-videoen er lastet ned.' : '3D-videoen er lastet ned som WebM. Avspilling på iPhone og iPad kan være begrenset.');
    } catch (e) {
      if (controller.signal.aborted) setNotice('Videoeksporten ble avbrutt.');
      // Our own errors are in Norwegian; browser/encoder exceptions (DOMException) are not.
      else setError(e instanceof Error && !(e instanceof DOMException) ? e.message : 'Videoen kunne ikke lages. Prøv igjen, eller bruk en annen nettleser.');
    } finally {
      document.removeEventListener('visibilitychange', hidden);
      try {
        if (fromFullscreen && scene.current === live) {
          live.setFrame(sceneFrame(latest.current), false);
          await live.setDrawings(latest.current.drawings, latest.current.trails);
          if (scene.current === live) {
            if (controller.signal.aborted) {
              live.restoreCamera(initialCamera); setView(initialCamera.view); setPlayerId(initialCamera.playerId);
            }
            live.render(0);
          }
        }
      } finally {
        exporter?.dispose(); abort.current = null; recording.current = false; livePaused.current = false;
        setRecordingPhase(null); setProgress(null); setRecordStage(null);
      }
    }
  };

  const pitch = PITCHES[props.tactic.sport];
  const playerSelect = (className: string) => <select aria-label="Velg spillerperspektiv" value={selectedId}
    onChange={e => setPlayerId(e.target.value)} className={className}>
    {props.players.map(p => <option key={p.id} value={p.id}>{p.num}{props.playerRoles ? (p.label ? ` · ${p.label}` : '') : p.num === 1 ? ' · Keeper' : ''}{p.name ? ` · ${p.name}` : ''}</option>)}
  </select>;
  return (
    <section aria-label="3D-visning" className="flex flex-col flex-1 min-w-0 bg-canvas" style={{ minHeight: 360 }}>
      <div className="shrink-0 flex flex-wrap items-center gap-2 border-b border-rule bg-canvas-sunken px-2 py-2">
        <div role="group" aria-label="Kameravinkel" className="flex flex-wrap gap-1">
          {VIEWS.map(([value, label]) => <Button key={value} size="sm" variant={view === value ? 'primary' : 'ghost'}
            aria-pressed={view === value} disabled={!ready || (value === 'player' && !props.players.length)}
            onClick={() => chooseView(value)}>{label}</Button>)}
        </div>
        {view === 'player' && !fullscreen && playerSelect('min-h-[40px] max-w-[220px] rounded-ctl bg-canvas-raised px-2 text-caption text-ink shadow-hair focus-ring')}
        <div className="flex items-center gap-1 ml-auto">
          <IconButton size="sm" aria-label="Zoom ut i 3D" disabled={!ready} onClick={() => scene.current?.zoom(1.2)}><Minus size={16} /></IconButton>
          <IconButton size="sm" aria-label="Zoom inn i 3D" disabled={!ready} onClick={() => scene.current?.zoom(1 / 1.2)}><Plus size={16} /></IconButton>
          <IconButton size="sm" aria-label="Tilbakestill kamera" disabled={!ready} onClick={resetCamera}><RotateCcw size={16} /></IconButton>
          <IconButton size="sm" aria-label="Fullskjerm for 3D" title="Fullskjerm" disabled={!ready} onClick={enterFullscreen}><Maximize2 size={16} /></IconButton>
        </div>
      </div>
      <div ref={stage} data-testid="board-3d-stage" style={{ minHeight: 180 }}
        className={cn('board3d-stage flex-1', fullscreen && 'is-fullscreen', fullscreen === 'css' && 'is-pseudo-fullscreen')}
        {...(fullscreen ? { role: 'dialog', 'aria-modal': true, 'aria-label': '3D-bane i fullskjerm', tabIndex: -1 } : {})}
        onPointerDownCapture={fullscreen ? wakeControls : undefined}
        onPointerMove={fullscreen ? e => { if (e.pointerType === 'mouse') wakeControls(); } : undefined}
        onKeyDownCapture={fullscreen ? wakeControls : undefined}
        onFocusCapture={fullscreen ? wakeControls : undefined}>
        <div ref={host} data-testid="board-3d" className="absolute inset-0" />
        <span className="sr-only">{sceneFrame(props).phaseName}. {sceneFrame(props).stickyNote}</span>
        {/* Small corner pill; a long note is cut with … and opens on tap. Screen readers get the text above. */}
        {pillName && (pillNote
          ? <button type="button" className={cn('board3d-phase', noteOpen && 'is-open')} aria-expanded={noteOpen}
              aria-label={noteOpen ? 'Skjul fasenotatet' : 'Vis hele fasenotatet'} onClick={() => setNoteOpen(open => !open)}>
              <span aria-hidden className="board3d-phase-name">{pillName}</span>
              <span aria-hidden className="board3d-phase-note">{pillNote}</span>
            </button>
          : <div aria-hidden className="board3d-phase"><span className="board3d-phase-name">{pillName}</span></div>)}
        {!ready && !error && <p role="status" className="absolute inset-0 flex items-center justify-center text-caption text-ink-muted">Laster 3D-banen …</p>}
        {fullscreen && <div role="group" aria-label="Kontroller" className={cn('board3d-fsbar no-scrollbar', !controlsShown && !recording.current && 'is-hidden')}>
          <RecordingControls busy={recording.current} seconds={recordingSeconds} disabled={!ready || !assetsLoaded || !choice || progress !== null || props.isPlaying}
            preparing={recordStage === 'preparing'} progress={recordStage === 'rendering' ? progress : null}
            onStart={() => exportVideo(true)} onStop={() => { stopped.current = true; }} onCancel={() => abort.current?.abort()} />
          <select aria-label="Fase" className="board3d-fsselect" value={recordingPhase ?? phaseIdx} disabled={props.isPlaying || recording.current}
            onChange={e => props.onSelectPhase(Number(e.target.value))}>
            {props.tactic.phases.map((phase, index) => <option key={phase.id} value={index}>
              {phase.name || `Fase ${index + 1}`}{phase.stickyNote ? ' ·' : ''}</option>)}
          </select>
          <button type="button" aria-label="Forrige fase" className="board3d-fsbtn" disabled={props.isPlaying || recording.current || phaseIdx === 0}
            onClick={() => props.onSelectPhase(Math.max(0, phaseIdx - 1))}><SkipBack size={15} strokeWidth={1.75} /></button>
          <button type="button" aria-label={props.isPlaying ? 'Stopp avspilling' : 'Spill av fasene'} className="board3d-fsbtn is-play"
            disabled={props.tactic.phases.length < 2 || recording.current} onClick={props.onTogglePlay}>
            {props.isPlaying ? <Pause size={15} strokeWidth={2} fill="currentColor" /> : <Play size={15} strokeWidth={2} fill="currentColor" />}
          </button>
          <button type="button" aria-label="Neste fase" className="board3d-fsbtn" disabled={props.isPlaying || recording.current || phaseIdx === props.tactic.phases.length - 1}
            onClick={() => props.onSelectPhase(Math.min(props.tactic.phases.length - 1, phaseIdx + 1))}><SkipForward size={15} strokeWidth={1.75} /></button>
          <select aria-label="Avspillingsfart" className="board3d-fsselect" value={props.speed} disabled={props.isPlaying || recording.current}
            onChange={e => props.onSpeed(Number(e.target.value))}>
            {SPEEDS.map(speed => <option key={speed} value={speed}>{speed}×</option>)}
          </select>
          <span aria-hidden className="board3d-fsbar-sep" />
          <select aria-label="Kameravinkel" className="board3d-fsselect" value={view} disabled={!ready}
            onChange={e => chooseView(e.target.value as CameraView)}>
            {VIEWS.map(([value, label]) => <option key={value} value={value} disabled={value === 'player' && !props.players.length}>{label}</option>)}
          </select>
          {view === 'player' && playerSelect('board3d-fsselect')}
          <span aria-hidden className="board3d-fsbar-sep" />
          <button type="button" aria-label="Zoom ut i 3D" className="board3d-fsbtn" disabled={!ready} onClick={() => scene.current?.zoom(1.2)}><Minus size={16} /></button>
          <button type="button" aria-label="Zoom inn i 3D" className="board3d-fsbtn" disabled={!ready} onClick={() => scene.current?.zoom(1 / 1.2)}><Plus size={16} /></button>
          <button type="button" aria-label="Tilbakestill kamera" className="board3d-fsbtn" disabled={!ready} onClick={resetCamera}><RotateCcw size={16} /></button>
          <button type="button" aria-label="Avslutt fullskjerm" title="Avslutt fullskjerm (Esc)" className="board3d-fsbtn ml-auto" onClick={exitFullscreen}><Minimize2 size={16} /></button>
        </div>}
        {fullscreen && (error || notice) && <p role={error ? 'alert' : 'status'} className="absolute top-12 right-3 max-w-[65%] rounded-ctl bg-canvas-panel px-3 py-2 text-caption">{error || notice}</p>}
        {fullscreen && !checking && !choice && <p className="absolute top-12 right-3 bg-canvas-panel px-3 py-2 text-caption">Opptak krever nyere Chrome eller Edge på denne enheten.</p>}
      </div>
      <div className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 border-t border-rule bg-canvas-sunken">
        <div className="w-full sm:flex-1 sm:min-w-[220px] sm:w-auto">
          <p className="text-caption text-ink-muted">{lowPower
            ? 'Én finger: roter · To fingre: flytt kameraet og klyp for å zoome · ↺ tilbakestiller'
            : 'Dra: roter · Høyreklikk og dra (eller Shift + dra): flytt kameraet · Rull: zoom · ↺ tilbakestiller'}</p>
          <p className="font-mono text-meta text-ink-subtle">{props.cameraBounds
            ? `Øvelsesutsnitt · ${Math.round(props.cameraBounds.maxX - props.cameraBounds.minX)} × ${Math.round(props.cameraBounds.maxZ - props.cameraBounds.minZ)} m`
            : `${SPORT_LABELS[props.tactic.sport]} · ${pitch.length} × ${pitch.width} m · Rediger i 2D`}</p>
        </div>
        <Button size="sm" icon={<Video size={15} />} disabled={!ready || !assetsLoaded || !choice || progress !== null || props.tactic.phases.length < 2}
          title={props.tactic.phases.length < 2 ? 'Legg til en fase til for å lage video' : choice?.label} onClick={() => exportVideo()}>Eksporter 3D-video</Button>
        {choice && <span className="text-meta text-ink-subtle">{choice.label}</span>}
        {!checking && !choice && <p className="w-full text-caption text-ink-muted">Denne nettleseren støtter ikke bildefor-bilde-eksport. Prøv nyere Chrome eller Edge.</p>}
      </div>
      {progress !== null && <div className="flex items-center gap-3 px-3 py-2 bg-canvas-panel border-t border-rule" role="status" aria-live="polite">
        <span className="text-caption text-ink tabular-nums">Lager video · {Math.round(progress * 100)} %</span>
        <progress aria-label="Fremdrift for 3D-video" max={1} value={progress} className="flex-1 min-w-0 accent-signal" />
        <Button size="sm" onClick={() => abort.current?.abort()} icon={<X size={14} />}>Avbryt</Button>
      </div>}
      {(error || notice) && <p role={error ? 'alert' : 'status'} className="px-3 py-2 text-caption text-ink bg-canvas-panel border-t border-rule">{error || notice}</p>}
      {assetNotice && <p role="status" className="shrink-0 px-3 py-1 text-meta text-ink-muted bg-canvas-panel">{assetNotice}</p>}
      {ready && !assetsLoaded && <p role="status" className="shrink-0 px-3 py-1 text-meta text-ink-muted">Laster spillermodell og himmel …</p>}
    </section>
  );
}
