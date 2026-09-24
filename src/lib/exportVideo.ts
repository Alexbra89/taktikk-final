import { slugify } from '@/lib/download';
import { VW, VH } from '@/data/formations';
import type { BoardItem, Player, Position, TacticPhase } from '@/types';

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
 * til å komme i gang: de første bildene fra MediaRecorder kan bli hengende,
 * særlig med H.264, og da ville starten av bevegelsen blitt hakkete.
 */
export const VIDEO_LEAD_MS = 500;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;

export interface VideoFormat {
  mime: string;
  ext: 'mp4' | 'webm';
  label: string;
  /** WebM spilles ikke av på iPhone og iPad. */
  playsOnIos: boolean;
}

/**
 * MP4 med H.264 først: det er det eneste iPhone og iPad spiller av, og
 * Safari kan bare spille inn det formatet. WebM er reserve for nettlesere
 * som ikke kan spille inn MP4.
 *
 * Kodeken skrives eksplisitt. Bare «video/mp4» kan gi AV1, som iOS ikke
 * spiller av – da ville filen sett riktig ut og likevel vært ubrukelig der.
 * Merk at «video/mp4;codecs=h264» ikke er en gyldig streng i Chromium;
 * den heter avc1.
 */
const FORMATS: VideoFormat[] = [
  { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4',  label: 'MP4 (H.264)', playsOnIos: true },
  { mime: 'video/mp4;codecs=avc1.4d002a', ext: 'mp4',  label: 'MP4 (H.264)', playsOnIos: true },
  { mime: 'video/mp4;codecs=avc1',        ext: 'mp4',  label: 'MP4 (H.264)', playsOnIos: true },
  { mime: 'video/mp4;codecs=h264',        ext: 'mp4',  label: 'MP4 (H.264)', playsOnIos: true },
  { mime: 'video/mp4',                    ext: 'mp4',  label: 'MP4',         playsOnIos: true },
  { mime: 'video/webm;codecs=vp9',        ext: 'webm', label: 'WebM (VP9)',  playsOnIos: false },
  { mime: 'video/webm;codecs=vp8',        ext: 'webm', label: 'WebM (VP8)',  playsOnIos: false },
  { mime: 'video/webm',                   ext: 'webm', label: 'WebM',        playsOnIos: false },
];

/** Beste formatet nettleseren kan spille inn. null = den kan ikke spille inn video. */
export function pickVideoFormat(): VideoFormat | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return null;
  return FORMATS.find(f => MediaRecorder.isTypeSupported(f.mime)) ?? null;
}

/** `sotra-sk-hoyt-press-2026-09-22.mp4` */
export function videoFilename(team: string, tactic: string, ext: string, when = new Date()): string {
  const d = when.toISOString().slice(0, 10);
  return `${slugify(team, 'lag')}-${slugify(tactic, 'taktikk')}-${d}.${ext}`;
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
  /** Utstyret i fasen det er på vei fra, flyttet mot neste fase. */
  items: BoardItem[];
  /** Fasen brikkene er på vei fra – tegningene som vises hører til den. */
  fromIdx: number;
  progress: number;
}

/**
 * Utstyret mellom to faser. Et element med samme id i begge glir dit, og
 * roterer den korteste veien. Et element som bare finnes i fasen det går
 * fra, står stille til fasen skifter; et nytt element dukker opp da.
 * Brukes av både ▶ og videoen, så de viser det samme.
 */
export function interpolateItems(from: BoardItem[] = [], to: BoardItem[] = [], t: number): BoardItem[] {
  if (t <= 0) return from;
  return from.map(fi => {
    const ti = to.find(i => i.id === fi.id);
    if (!ti) return fi;
    const r0 = fi.rotation ?? 0, r1 = ti.rotation ?? 0;
    const dr = ((r1 - r0 + 540) % 360) - 180;   // korteste vei, −180..180
    return {
      ...fi,
      position: {
        x: fi.position.x + (ti.position.x - fi.position.x) * t,
        y: fi.position.y + (ti.position.y - fi.position.y) * t,
      },
      rotation: r0 + dr * t,
    };
  });
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
    return { players: ph.players, ball: ph.ball, items: ph.items ?? [], fromIdx: 0, progress: 0 };
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
    items: interpolateItems(from.items, to.items, t),
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
