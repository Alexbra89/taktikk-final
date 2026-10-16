'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, Video, X } from 'lucide-react';
import { Button, IconButton } from '../ui/Button';
import { BoardScene, type CameraView, type SceneFrame } from './three/BoardScene';
import { PITCHES, playbackBallHeight, playbackFrame } from './three/coordinates';
import { chooseEncoder, exportVideo3D, type EncoderChoice } from '@/lib/exportVideo3D';
import { VIDEO_PHASE_MS } from '@/lib/exportVideo';
import { getSlot, SPORT_LABELS } from '@/store/selectors';
import { ROLE_INFO } from '@/data/roleInfo';
import type { PlayerStyle } from '@/hooks/usePlayerStyle';
import type { Tactic } from '@/types';

interface Props extends SceneFrame {
  tactic: Tactic;
  playerStyle: PlayerStyle;
  isPlaying: boolean;
  speed: number;
  teamName: string;
  isMobile: boolean;
}

const VIEWS: [CameraView, string][] = [['overview', 'Oversikt'], ['top', 'Ovenfra'], ['ball', 'Følg ballen'], ['player', 'Spillerperspektiv']];

export default function Board3D(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BoardScene | null>(null);
  const latest = useRef(props); latest.current = props;
  const abort = useRef<AbortController | null>(null);
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
  const selectedId = props.players.some(p => p.id === playerId) ? playerId : props.players.find(p => p.num === 1)?.id ?? props.players[0]?.id ?? '';
  const sceneFrame = (p: Props): SceneFrame => ({ ...p,
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
    chooseEncoder().then(result => { if (active) { setChoice(result); setChecking(false); } }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; abort.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!host.current) return;
    let board: BoardScene;
    setReady(false); setError(''); setAssetNotice(''); setAssetsLoaded(false);
    try { board = new BoardScene(props.tactic.sport, props.playerStyle, props.isMobile); }
    catch { setError('3D kunne ikke startes. Prøv å slå på maskinvareakselerasjon i nettleseren. 2D kan fortsatt brukes.'); return; }
    scene.current = board;
    const element = host.current;
    element.appendChild(board.renderer.domElement);
    const resize = () => board.resize(element.clientWidth, element.clientHeight);
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    board.setFrame(sceneFrame(latest.current), false); board.render(0, true);
    board.setDrawings(latest.current.drawings, latest.current.trails).catch(() => setError('Tegningene kunne ikke lastes i 3D. Prøv å åpne 3D på nytt.'));
    let raf = 0, last = performance.now(), active = true;
    board.assetsReady.then(() => { if (active) { setAssetNotice(board.assetWarnings.join(' ')); setAssetsLoaded(true); } });
    const render = (now: number) => {
      if (!active) return;
      raf = requestAnimationFrame(render);
      if (document.hidden || (props.isMobile && now - last < 32)) return;
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
  }, [props.tactic.id, props.tactic.sport, props.playerStyle, props.isMobile, theme]);

  useEffect(() => { scene.current?.setFrame(sceneFrame(props), props.isPlaying); }, [props]);
  useEffect(() => {
    let active = true;
    scene.current?.setDrawings(props.drawings, props.trails).catch(() => { if (active) setError('Tegningene kunne ikke lastes i 3D.'); });
    return () => { active = false; };
  }, [props.drawings, props.trails]);
  useEffect(() => { scene.current?.selectCamera(view, selectedId); }, [view, selectedId, props.tactic.id, props.tactic.sport, props.playerStyle, props.isMobile, theme]);

  const exportVideo = async () => {
    if (!scene.current || !choice || abort.current) return;
    const controller = new AbortController(); abort.current = controller;
    setProgress(0); setNotice(''); setError('');
    let exporter: BoardScene | null = null;
    try {
      // Isolated scene and immutable snapshot: exporting never moves or seeks the board.
      const snapshot = structuredClone(props.tactic);
      const camera = scene.current.cameraState();
      exporter = new BoardScene(snapshot.sport, props.playerStyle, false, true);
      const board = exporter;
      board.resize(choice.config.width, choice.config.height, 1);
      // A CPU-backed snapshot also works with H.264 hardware encoders that
      // otherwise read a cleared/stale WebGL surface after multiple passes.
      const capture = document.createElement('canvas');
      capture.width = choice.config.width; capture.height = choice.config.height;
      const captureContext = capture.getContext('2d', { alpha: false, willReadFrequently: true });
      if (!captureContext) throw new Error('Nettleseren kunne ikke klargjøre videobildene.');
      board.controls.enabled = false;
      await board.assetsReady;
      controller.signal.throwIfAborted();
      await Promise.all(snapshot.phases.map(p => board.prepareDrawings(p.drawings ?? [])));
      const first = snapshot.phases[0];
      board.setFrame({ phaseName: first.name, stickyNote: first.stickyNote, players: first.players.map(p => ({ ...p, label: getSlot(snapshot, p.slotIdx).label, family: ROLE_INFO[getSlot(snapshot, p.slotIdx).role].family })), ball: first.ball, items: first.items ?? [], drawings: first.drawings }, false);
      board.restoreCamera(camera);
      await exportVideo3D({
        choice, phaseCount: snapshot.phases.length, speed: props.speed, team: props.teamName, tactic: snapshot.name,
        signal: controller.signal, onProgress: setProgress,
        draw: async (elapsed, index) => {
          const f = playbackFrame(snapshot.phases, elapsed, props.speed);
          const drawings = snapshot.phases[f.fromIdx].drawings ?? [];
          await board.setDrawings(drawings);
          board.setFrame({ ...f, drawings, phaseName: snapshot.phases[f.fromIdx].name, stickyNote: snapshot.phases[f.fromIdx].stickyNote,
            progress: snapshot.phases.length > 1 ? Math.min(1, elapsed * props.speed / ((snapshot.phases.length - 1) * VIDEO_PHASE_MS)) : null,
            ballHeight: playbackBallHeight(snapshot.phases, elapsed, props.speed, snapshot.sport), players: f.players.map(p => ({
            id: p.id, num: p.num, name: p.name.trim(), position: p.position,
            label: getSlot(snapshot, p.slotIdx).label, family: ROLE_INFO[getSlot(snapshot, p.slotIdx).role].family,
          })) }, index > 0);
          board.render(1 / 30, index === 0);
          captureContext.drawImage(board.renderer.domElement, 0, 0);
          return capture;
        },
      });
      setNotice(choice.ext === 'mp4' ? '3D-videoen er lastet ned.' : '3D-videoen er lastet ned som WebM. Avspilling på iPhone og iPad kan være begrenset.');
    } catch (e) {
      if (controller.signal.aborted) setNotice('Videoeksporten ble avbrutt.');
      // Our own errors are in Norwegian; browser/encoder exceptions (DOMException) are not.
      else setError(e instanceof Error && !(e instanceof DOMException) ? e.message : 'Videoen kunne ikke lages. Prøv igjen, eller bruk en annen nettleser.');
    } finally { exporter?.dispose(); abort.current = null; setProgress(null); }
  };

  const pitch = PITCHES[props.tactic.sport];
  return (
    <section aria-label="3D-visning" className="flex flex-col flex-1 min-w-0 bg-canvas" style={{ minHeight: 360 }}>
      <div className="shrink-0 flex flex-wrap items-center gap-2 border-b border-rule bg-canvas-sunken px-2 py-2">
        <div role="group" aria-label="Kameravinkel" className="flex flex-wrap gap-1">
          {VIEWS.map(([value, label]) => <Button key={value} size="sm" variant={view === value ? 'primary' : 'ghost'}
            aria-pressed={view === value} disabled={!ready || (value === 'player' && !props.players.length)}
            onClick={() => { setView(value); scene.current?.selectCamera(value, selectedId); }}>{label}</Button>)}
        </div>
        {view === 'player' && <select aria-label="Velg spillerperspektiv" value={selectedId}
          onChange={e => setPlayerId(e.target.value)} className="min-h-[40px] max-w-[220px] rounded-ctl bg-canvas-raised px-2 text-caption text-ink shadow-hair focus-ring">
          {props.players.map(p => <option key={p.id} value={p.id}>{p.num}{p.num === 1 ? ' · Keeper' : ''}{p.name ? ` · ${p.name}` : ''}</option>)}
        </select>}
        <div className="flex items-center gap-1 ml-auto">
          <IconButton size="sm" aria-label="Zoom ut i 3D" disabled={!ready} onClick={() => scene.current?.zoom(1.2)}><Minus size={16} /></IconButton>
          <IconButton size="sm" aria-label="Zoom inn i 3D" disabled={!ready} onClick={() => scene.current?.zoom(1 / 1.2)}><Plus size={16} /></IconButton>
          <IconButton size="sm" aria-label="Tilbakestill kamera" disabled={!ready} onClick={() => { setView('overview'); scene.current?.selectCamera('overview'); }}><RotateCcw size={16} /></IconButton>
        </div>
      </div>
      <div className="relative flex-1" style={{ minHeight: 180 }}>
        <div ref={host} data-testid="board-3d" className="absolute inset-0" />
        <span className="sr-only">{sceneFrame(props).phaseName}. {sceneFrame(props).stickyNote}</span>
        {!ready && !error && <p role="status" className="absolute inset-0 flex items-center justify-center text-caption text-ink-muted">Laster 3D-banen …</p>}
      </div>
      <div className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 border-t border-rule bg-canvas-sunken">
        <div className="w-full sm:flex-1 sm:min-w-[220px] sm:w-auto">
          <p className="text-caption text-ink-muted">Dra for å rotere · Rull eller klyp for å zoome</p>
          <p className="font-mono text-meta text-ink-subtle">{SPORT_LABELS[props.tactic.sport]} · {pitch.length} × {pitch.width} m · Rediger i 2D</p>
        </div>
        <Button size="sm" icon={<Video size={15} />} disabled={!ready || !assetsLoaded || !choice || progress !== null || props.tactic.phases.length < 2}
          title={props.tactic.phases.length < 2 ? 'Legg til en fase til for å lage video' : choice?.label} onClick={exportVideo}>Eksporter 3D-video</Button>
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
