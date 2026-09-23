'use client';
import React, { useCallback, useRef, useState } from 'react';
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
import {
  VIDEO_FPS, VIDEO_HEIGHT, VIDEO_LEAD_MS, VIDEO_TAIL_MS, VIDEO_WIDTH,
  boardFitSize, drawBoardFrame, frameAt, pickVideoFormat, videoDurationMs, videoFilename, videoTotalMs,
} from '@/lib/exportVideo';
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

export function useVideoExport() {
  const teamName = useAppStore(s => s.homeTeamName);
  const tactic = useActiveTactic();

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** Beskjed som ikke er en feil, f.eks. at filen ikke kan spilles av på iPhone. */
  const [notice, setNotice] = useState<string | null>(null);
  const busyRef = useRef(false);

  // Formatet avgjøres av nettleseren, ikke av oss. Leses ved hvert forsøk.
  const format = typeof window === 'undefined' ? null : pickVideoFormat();

  const exportVideo = useCallback(async () => {
    const phases = tactic.phases;
    if (busyRef.current || phases.length < 2) return;
    busyRef.current = true;
    setBusy(true);
    setProgress(0);
    setError(null);
    setNotice(null);

    let created: { host: HTMLDivElement; svg: SVGSVGElement; root: Root } | null = null;
    try {
      const fmt = pickVideoFormat();
      if (!fmt) throw new Error('Nettleseren din støtter ikke videoeksport.');
      const mime = fmt.mime;

      created = createOffscreenSvg();
      const { svg, root } = created;

      const canvas = document.createElement('canvas');
      canvas.width = VIDEO_WIDTH;
      canvas.height = VIDEO_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Nettleseren kan ikke tegne bildene.');
      // Banefargen fyller kantene, så bildet aldri blir svart.
      const background = getComputedStyle(svg).getPropertyValue('--k-pitch').trim();
      const pitch = background ? `rgb(${background.split(/\s+/).join(', ')})` : '#0D110E';

      // Banen tegnes i den størrelsen den får i videoen – ikke i hele videostørrelsen.
      const fit = boardFitSize();
      // Samme spillerform som brettet viser.
      const playerStyle = readPlayerStyle();
      const paint = async (elapsed: number) => {
        const f = frameAt(phases, elapsed);
        // SvgDefs må med: ballen bruker filter="url(#dropShadow)". Chromium
        // ignorerer et filter som ikke finnes, men WebKit (iPhone, iPad) tegner
        // da ikke ballen i det hele tatt.
        flushSync(() => root.render(
          React.createElement(React.Fragment, null,
            React.createElement(SvgDefs),
            React.createElement(BoardStage, {
              players: stagePlayers(tactic, f.players),
              playerStyle,
              ball: f.ball,
              drawings: phases[f.fromIdx]?.drawings ?? [],
              progress: f.progress,
            }),
          ),
        ));
        const img = await svgMarkupToImage(serializeBoardSvg(svg, fit.width, fit.height));
        drawBoardFrame(ctx, img, pitch);
      };

      // Første bilde før opptaket starter, slik at videoen ikke begynner tom.
      await paint(0);

      const stream = canvas.captureStream(VIDEO_FPS);
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      const finished = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
        recorder.onerror = () => reject(new Error('Opptaket stoppet uventet.'));
      });

      recorder.start();

      // Forspann: hold åpningsstillingen mens koderen kommer i gang.
      const holdFrame = async (untilMs: number, elapsed: number) => {
        while (performance.now() < untilMs) {
          await paint(elapsed);
          await wait(1000 / VIDEO_FPS);
        }
      };
      await holdFrame(performance.now() + VIDEO_LEAD_MS, 0);

      const total = videoDurationMs(phases.length);
      const started = performance.now();
      for (;;) {
        const elapsed = performance.now() - started;
        await paint(elapsed);
        setProgress(Math.min(1, elapsed / total));
        if (elapsed >= total) break;
        await nextFrame();
      }
      // Hold siste stilling litt, ellers forsvinner den i det videoen slutter.
      // Canvaset må males om igjen underveis: captureStream fanger bare nye bilder
      // når noe endres, så en stillestående hale ville blitt klippet bort.
      await holdFrame(performance.now() + VIDEO_TAIL_MS, total);
      recorder.stop();
      stream.getTracks().forEach(t => t.stop());

      const blob = await finished;
      if (!blob.size) throw new Error('Videoen ble tom.');
      downloadBlob(videoFilename(teamName, tactic.name, fmt.ext), blob);
      setProgress(1);
      if (!fmt.playsOnIos) {
        setNotice(`Nettleseren kan bare spille inn ${fmt.label}. Den filen spilles ikke av på iPhone og iPad.`);
      }
    } catch (e) {
      setError(`Kunne ikke lage videoen.${e instanceof Error && e.message ? ' ' + e.message : ''}`);
    } finally {
      if (created) {
        const { host, root } = created;
        // unmount må ut av render-fasen, ellers klager React.
        setTimeout(() => { root.unmount(); host.remove(); }, 0);
      }
      busyRef.current = false;
      setBusy(false);
    }
  }, [tactic, teamName]);

  const clearError = useCallback(() => setError(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    busy, progress, error, notice, exportVideo, clearError, clearNotice,
    format, phaseCount: tactic.phases.length,
  };
}

/** Sekundene videoen vil vare, til knappens tittel. */
export const videoLengthText = (phaseCount: number) =>
  `${(videoTotalMs(phaseCount) / 1000).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} s`;
