import { slugify } from '@/lib/download';
import { VW, VH } from '@/data/formations';
import type { Player, Position, TacticPhase } from '@/types';

// ══════════════════════════════════════════════════════════════
//  VIDEO-EKSPORT – avspillingen av fasene som WebM
//
//  Bildene lages på nøyaktig samme måte som PNG-eksporten: BoardStage
//  tegnes til SVG, CSS-variablene byttes ut med verdiene de har nå, og
//  resultatet males på et canvas. Canvaset spilles inn med MediaRecorder.
// ══════════════════════════════════════════════════════════════

/** Samme tempo som ▶: 40 steg à 30 ms per overgang. */
export const VIDEO_PHASE_MS = 1200;
/** Litt ekstra på slutten, så siste stilling rekker å bli sett. */
export const VIDEO_TAIL_MS = 600;
/**
 * Åpningsstillingen holdes litt før bevegelsen starter. Gir også koderen tid
 * til å komme i gang – uten dette henger de første bildene igjen ujevnt.
 */
export const VIDEO_LEAD_MS = 300;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;

/** vp9 om nettleseren kan, ellers vp8, ellers ren webm. null = kan ikke spille inn. */
export function pickVideoMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) ?? null;
}

/** `sotra-sk-hoyt-press-2026-09-22.webm` */
export function videoFilename(team: string, tactic: string, when = new Date()): string {
  const d = when.toISOString().slice(0, 10);
  return `${slugify(team, 'lag')}-${slugify(tactic, 'taktikk')}-${d}.webm`;
}

/** Hele avspillingen, uten halen på slutten. */
export const videoDurationMs = (phaseCount: number) =>
  Math.max(0, phaseCount - 1) * VIDEO_PHASE_MS;

/** Hele filens lengde: forspann + avspilling + hale. */
export const videoTotalMs = (phaseCount: number) =>
  VIDEO_LEAD_MS + videoDurationMs(phaseCount) + VIDEO_TAIL_MS;

export interface FrameState {
  players: Player[];
  ball: Position;
  /** Fasen brikkene er på vei fra – tegningene som vises hører til den. */
  fromIdx: number;
  progress: number;
}

/**
 * Stillingen ved et gitt tidspunkt i avspillingen. Samme interpolasjon som
 * brettet bruker under ▶: rett linje mellom fasene, spiller for spiller.
 */
export function frameAt(phases: TacticPhase[], elapsedMs: number): FrameState {
  const last = phases.length - 1;
  const total = videoDurationMs(phases.length);
  const clamped = Math.min(Math.max(0, elapsedMs), total);
  const fromIdx = Math.min(last - 1, Math.floor(clamped / VIDEO_PHASE_MS));
  const t = total === 0 ? 0 : (clamped - fromIdx * VIDEO_PHASE_MS) / VIDEO_PHASE_MS;

  const from = phases[fromIdx];
  const to = phases[Math.min(fromIdx + 1, last)];
  if (!from || !to) {
    const ph = phases[0];
    return { players: ph.players, ball: ph.ball, fromIdx: 0, progress: 0 };
  }

  return {
    players: from.players.map(fp => {
      const tp = to.players.find(p => p.id === fp.id);
      if (!tp) return fp;
      return { ...fp, position: {
        x: fp.position.x + (tp.position.x - fp.position.x) * t,
        y: fp.position.y + (tp.position.y - fp.position.y) * t,
      }};
    }),
    ball: {
      x: from.ball.x + (to.ball.x - from.ball.x) * t,
      y: from.ball.y + (to.ball.y - from.ball.y) * t,
    },
    fromIdx,
    progress: total === 0 ? 0 : clamped / total,
  };
}

/**
 * Største bane som får plass i videobildet, med samme proporsjoner.
 * SVG-en må serialiseres i nøyaktig denne størrelsen: serialiserer man i hele
 * videostørrelsen, legger SVG-en selv banen midt i bildet, og et nytt pass her
 * ville krympet den en gang til.
 */
export function boardFitSize(width = VIDEO_WIDTH, height = VIDEO_HEIGHT) {
  const scale = Math.min(width / VW, height / VH);
  return { width: Math.round(VW * scale), height: Math.round(VH * scale) };
}

/** Banen midt i bildet, med banefargen i kantene. */
export function drawBoardFrame(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  background: string,
): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  const fit = boardFitSize(width, height);
  ctx.drawImage(img, (width - fit.width) / 2, (height - fit.height) / 2, fit.width, fit.height);
}
