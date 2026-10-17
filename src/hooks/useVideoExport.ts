'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic, getSlot } from '@/store/selectors';
import { VW, VH } from '@/data/formations';
import { BoardStage, type StagePlayer } from '@/components/board/BoardStage';
import { SvgDefs } from '@/components/board/svg/SvgDefs';
import { ROLE_INFO } from '@/data/roleInfo';
import { readPlayerStyle } from '@/hooks/usePlayerStyle';
import { serializeBoardSvg, svgMarkupToImage } from '@/lib/exportImage';
import { downloadBlob } from '@/lib/download';
import { phasePillCanvas, PHASE_PILL_WIDTH } from '@/lib/phasePill';
import {
  VIDEO_FPS, VIDEO_HEIGHT, VIDEO_LEAD_MS, VIDEO_TAIL_MS, VIDEO_WIDTH,
  boardFitSize, drawBoardFrame, frameAt, fullscreenVideoSize, pickVideoFormat, videoDurationMs, videoFilename, videoTotalMs,
  type FrameState,
} from '@/lib/exportVideo';
import type { PlayerStyle } from '@/hooks/usePlayerStyle';
import type { Tactic } from '@/types';

// ══════════════════════════════════════════════════════════════
//  VIDEO-EKSPORT – spiller inn avspillingen uten å røre brettet
//
//  Bildene rendres i en egen SVG utenfor skjermen (BoardStage, uten
//  håndterere), ett bilde om gangen, og males på et canvas som
//  MediaRecorder spiller inn. Brettet på skjermen står stille imens,
//  og ▶-knappen er ikke involvert.
// ══════════════════════════════════════════════════════════════

const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * I bakgrunnen står requestAnimationFrame stille og canvaset males ikke,
 * så videoen ville frosset og hoppet – på iPhone kan opptaket også dø.
 * Eksporten avbrytes derfor, med en beskjed brukeren forstår.
 */
class BackgroundAbort extends Error {
  constructor() { super('Videoen ble avbrutt fordi appen ble lagt i bakgrunnen. Prøv igjen.'); }
}

/** Usynlig, men i dokumentet: ellers finnes ikke CSS-variablene vi bytter ut. */
function createOffscreenSvg(): { host: HTMLDivElement; svg: SVGSVGElement; root: Root } {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:880px;height:560px;pointer-events:none;';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  svg.setAttribute('width', String(VW));
  svg.setAttribute('height', String(VH));
  host.appendChild(svg);
  document.body.appendChild(host);
  return { host, svg, root: createRoot(svg) };
}

const stagePlayers = (tactic: Tactic, players: { id: string; num: number; name: string; slotIdx: number; position: { x: number; y: number } }[]): StagePlayer[] =>
  players.map(p => ({
    id: p.id,
    num: p.num,
    position: p.position,
    label: getSlot(tactic, p.slotIdx).label,
    family: ROLE_INFO[getSlot(tactic, p.slotIdx).role].family,
    name: p.name.trim(),
  }));

/**
 * Ett videobilde: banen, spillerne, ballen, tegningene og utstyret ved et
 * gitt tidspunkt. Egen funksjon, så testene kan sjekke hva bildet inneholder.
 *
 * SvgDefs må med: ballen bruker filter="url(#dropShadow)". Chromium ignorerer
 * et filter som ikke finnes, men WebKit (iPhone, iPad) tegner da ikke ballen
 * i det hele tatt.
 */
export function videoFrameElement(tactic: Tactic, f: FrameState, playerStyle: PlayerStyle): React.ReactElement {
  // Tegningene hører til fasen spillerne kommer fra. Framme i siste fase
  // (slutten og halen) er det dens tegninger som gjelder, som på brettet.
  const drawIdx = f.progress >= 1 ? tactic.phases.length - 1 : f.fromIdx;
  return React.createElement(React.Fragment, null,
    React.createElement(SvgDefs),
    React.createElement(BoardStage, {
      players: stagePlayers(tactic, f.players),
      playerStyle,
      ball: f.ball,
      drawings: tactic.phases[drawIdx]?.drawings ?? [],
      items: f.items,
      progress: f.progress,
    }),
  );
}

export interface FullscreenVideoOptions {
  viewport: () => { width: number; height: number; x: number; y: number; boardWidth: number; boardHeight: number; clipX: number; clipY: number; clipWidth: number; clipHeight: number };
  speed: number;
  onFrame: (frame: FrameState | null) => void;
}

export function useVideoExport(fullscreen?: FullscreenVideoOptions) {
  const teamName = useAppStore(s => s.homeTeamName);
  const tactic = useActiveTactic();

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** Beskjed som ikke er en feil, f.eks. at filen ikke kan spilles av på iPhone. */
  const [notice, setNotice] = useState<string | null>(null);
  const busyRef = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const stopped = useRef(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => () => { abort.current?.abort(); }, []);

  // Formatet avgjøres av nettleseren, ikke av oss. Leses ved hvert forsøk.
  const format = typeof window === 'undefined' ? null : pickVideoFormat();

  const exportVideo = useCallback(async () => {
    const phases = tactic.phases;
    if (busyRef.current || phases.length < (fullscreen ? 1 : 2)) return;
    const controller = new AbortController(); abort.current = controller; stopped.current = false;
    setSeconds(0);
    const speed = fullscreen?.speed ?? 1;
    busyRef.current = true;
    setBusy(true);
    setProgress(0);
    setError(null);
    setNotice(null);

    let created: { host: HTMLDivElement; svg: SVGSVGElement; root: Root } | null = null;
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;

    // Blir appen skjult, løser «hidden» seg, så en ventende ramme ikke henger.
    let isHidden = document.hidden;
    let onHidden: () => void = () => {};
    const hidden = new Promise<void>(r => { onHidden = r; });
    const onVisibility = () => { if (document.hidden) { isHidden = true; onHidden(); } };
    document.addEventListener('visibilitychange', onVisibility);
    const checkVisible = () => { controller.signal.throwIfAborted(); if (isHidden) throw new BackgroundAbort(); };

    try {
      checkVisible();
      const fmt = pickVideoFormat();
      if (!fmt) throw new Error('Nettleseren din støtter ikke videoeksport.');
      const mime = fmt.mime;

      created = createOffscreenSvg();
      const { svg, root } = created;

      const canvas = document.createElement('canvas');
      const viewport = fullscreen?.viewport();
      const size = viewport ? fullscreenVideoSize(viewport.width, viewport.height) : { width: VIDEO_WIDTH, height: VIDEO_HEIGHT };
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Nettleseren kan ikke tegne bildene.');
      // Banefargen fyller kantene, så bildet aldri blir svart.
      const background = getComputedStyle(svg).getPropertyValue('--k-pitch').trim();
      const pitch = background ? `rgb(${background.split(/\s+/).join(', ')})` : '#0D110E';

      // Banen tegnes i den størrelsen den får i videoen – ikke i hele videostørrelsen.
      const fit = viewport ? { width: Math.round(viewport.boardWidth * size.width / viewport.width), height: Math.round(viewport.boardHeight * size.height / viewport.height) } : boardFitSize();
      // Samme spillerform som brettet viser.
      const playerStyle = readPlayerStyle();
      let pill: HTMLCanvasElement | null = null, pillIdx = -1;
      const paint = async (elapsed: number) => {
        checkVisible();
        let frame = frameAt(phases, elapsed * speed);
        if (fullscreen && frame.progress >= 1) {
          const last = phases[phases.length - 1];
          frame = { ...frame, players: last.players, ball: last.ball, items: last.items ?? [], fromIdx: phases.length - 1 };
        }
        fullscreen?.onFrame(frame);
        flushSync(() => root.render(videoFrameElement(tactic, frame, playerStyle)));
        const img = await svgMarkupToImage(serializeBoardSvg(svg, fit.width, fit.height));
        checkVisible();
        if (viewport) {
          ctx.fillStyle = pitch; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.save(); ctx.beginPath();
          ctx.rect(viewport.clipX * size.width / viewport.width, viewport.clipY * size.height / viewport.height,
            viewport.clipWidth * size.width / viewport.width, viewport.clipHeight * size.height / viewport.height);
          ctx.clip();
          ctx.drawImage(img, viewport.x * size.width / viewport.width, viewport.y * size.height / viewport.height, fit.width, fit.height);
          ctx.restore();
          if (pillIdx !== frame.fromIdx) {
            pillIdx = frame.fromIdx;
            pill = phasePillCanvas(phases[pillIdx].name || `Fase ${pillIdx + 1}`, phases[pillIdx].stickyNote ?? '');
          }
          if (pill) {
            const scale = Math.min(size.width * .3, size.height * .55) / PHASE_PILL_WIDTH;
            const margin = Math.round(size.height * .025);
            ctx.drawImage(pill, margin, margin, pill.width * scale, pill.height * scale);
          }
        } else drawBoardFrame(ctx, img, pitch);
      };

      // Første bilde før opptaket starter, slik at videoen ikke begynner tom.
      await paint(0);

      stream = canvas.captureStream(VIDEO_FPS);
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
      recorder = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      const finished = new Promise<Blob>((resolve, reject) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
        rec.onerror = () => reject(new Error('Opptaket stoppet uventet.'));
      });
      // Avbrytes eksporten før vi venter på den, skal en sen feil ikke bli ubehandlet.
      finished.catch(() => {});

      rec.start();
      const recordingStarted = performance.now();

      // Forspann: hold åpningsstillingen mens koderen kommer i gang.
      const holdFrame = async (untilMs: number, elapsed: number) => {
        while (performance.now() < untilMs && !stopped.current) {
          checkVisible();
          await paint(elapsed);
          setSeconds((performance.now() - recordingStarted) / 1000);
          await wait(1000 / VIDEO_FPS);
        }
      };
      await holdFrame(performance.now() + VIDEO_LEAD_MS, 0);

      const total = videoDurationMs(phases.length) / speed;
      const started = performance.now();
      for (;;) {
        checkVisible();
        if (stopped.current) break;
        const elapsed = performance.now() - started;
        await paint(elapsed);
        setSeconds((performance.now() - recordingStarted) / 1000);
        setProgress(total ? Math.min(1, elapsed / total) : 1);
        if (elapsed >= total) break;
        await Promise.race([nextFrame(), hidden]);
      }
      // Hold siste stilling litt, ellers forsvinner den i det videoen slutter.
      // Canvaset må males om igjen underveis: captureStream fanger bare nye bilder
      // når noe endres, så en stillestående hale ville blitt klippet bort.
      await holdFrame(performance.now() + VIDEO_TAIL_MS, total);
      checkVisible();
      // Even an immediate stop must give MediaRecorder time to emit a playable frame.
      if (stopped.current) await wait(Math.max(0, 150 - (performance.now() - recordingStarted)));
      checkVisible();
      rec.stop();

      const blob = await finished;
      checkVisible();
      if (!blob.size) throw new Error('Videoen ble tom.');
      downloadBlob(videoFilename(teamName, tactic.name, fmt.ext), blob);
      setProgress(1);
      if (!fmt.playsOnIos) {
        setNotice(`Nettleseren kan bare spille inn ${fmt.label}. Den filen spilles ikke av på iPhone og iPad.`);
      }
    } catch (e) {
      if (controller.signal.aborted) setNotice('Opptaket ble avbrutt.');
      else setError(e instanceof BackgroundAbort
        ? e.message
        : `Kunne ikke lage videoen.${e instanceof Error && e.message ? ' ' + e.message : ''}`);
    } finally {
      // Ryddes uansett hvordan eksporten endte – også etter en feil midt i opptaket.
      document.removeEventListener('visibilitychange', onVisibility);
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch { /* allerede stoppet */ }
      }
      stream?.getTracks().forEach(t => t.stop());
      if (created) {
        const { host, root } = created;
        // unmount må ut av render-fasen, ellers klager React.
        setTimeout(() => { root.unmount(); host.remove(); }, 0);
      }
      busyRef.current = false;
      abort.current = null;
      fullscreen?.onFrame(null);
      setBusy(false);
    }
  }, [tactic, teamName, fullscreen]);

  const clearError = useCallback(() => setError(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    busy, progress, error, notice, exportVideo, clearError, clearNotice, seconds,
    cancel: () => abort.current?.abort(), stop: () => { stopped.current = true; },
    format, phaseCount: tactic.phases.length,
  };
}

/** Sekundene videoen vil vare, til knappens tittel. */
export const videoLengthText = (phaseCount: number) =>
  `${(videoTotalMs(phaseCount) / 1000).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} s`;
