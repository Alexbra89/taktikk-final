import type { PlaybackEasing, TacticPhase } from '@/types';

// ══════════════════════════════════════════════════════════════
//  AVSPILLING – varighet og easing for overgangene mellom faser
// ══════════════════════════════════════════════════════════════

/**
 * Standard overgang. Målt på avspillingen før bolk 5: 40 steg à 30 ms
 * (t += 0,025 per tick) = 1,2 s. Taktikker uten egen varighet spilles
 * derfor av nøyaktig som før.
 */
export const DEFAULT_PHASE_MS = 1200;
export const MIN_PHASE_MS = 200;
export const MAX_PHASE_MS = 30_000;
export const PHASE_PRESETS_MS = [1000, 2000, 3000, 5000];

export const EASINGS: { value: PlaybackEasing; label: string }[] = [
  { value: 'linear',     label: 'Lineær' },
  { value: 'smooth',     label: 'Myk' },
  { value: 'fast-start', label: 'Rask start' },
];

export const isEasing = (v: unknown): v is PlaybackEasing =>
  v === 'linear' || v === 'smooth' || v === 'fast-start';

export const isPhaseDuration = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= MIN_PHASE_MS && v <= MAX_PHASE_MS;

export const phaseDurationMs = (ph: TacticPhase | undefined): number =>
  ph && isPhaseDuration(ph.durationMs) ? ph.durationMs : DEFAULT_PHASE_MS;

/** t ∈ [0, 1] → andel av veien. */
export function ease(kind: PlaybackEasing | undefined, t: number): number {
  const x = Math.min(1, Math.max(0, t));
  switch (kind) {
    case 'smooth':     // myk start og stopp (ease-in-out, kubisk)
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    case 'fast-start': // rask start, myk landing (ease-out, kubisk)
      return 1 - Math.pow(1 - x, 3);
    default:
      return x;
  }
}

/** «1,2 s» – norsk desimalkomma, uten unødvendige desimaler. */
export const formatSeconds = (ms: number): string =>
  `${(ms / 1000).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} s`;
