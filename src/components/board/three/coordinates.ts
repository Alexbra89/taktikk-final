import { VW, VH } from '@/data/formations';
import { frameAt, VIDEO_PHASE_MS, VIDEO_LEAD_MS, VIDEO_TAIL_MS } from '@/lib/exportVideo';
import type { Position, Sport, TacticPhase } from '@/types';

// Representative pitch sizes in metres. Small-sided pitches allow a range;
// these are view presets, never changes to the saved 880 × 560 board.
export const PITCHES = {
  football:  { length: 105, width: 68, goal: 7.32, goalHeight: 2.44, areaDepth: 16.5, areaWidth: 40.32, spot: 11, circle: 9.15 },
  football9: { length: 70, width: 50, goal: 5, goalHeight: 2, areaDepth: 13, areaWidth: 29, spot: 8, circle: 7 },
  football7: { length: 60, width: 40, goal: 5, goalHeight: 2, areaDepth: 8, areaWidth: 21, spot: 8, circle: 5 },
  football5: { length: 40, width: 30, goal: 3, goalHeight: 2, areaDepth: 6, areaWidth: 15, spot: 6, circle: 5 },
} satisfies Record<Sport, object>;

// Stylised TV figures are drawn larger than life on big pitches, so they stay
// readable from the overview camera.
export const figureScale = (sport: Sport) => 1.3 + 0.6 * PITCHES[sport].length / 105;

/** SVG x goes along the pitch; SVG y goes across it. Y in Three is height. */
export function boardToWorld(p: Position, sport: Sport, height = 0) {
  const pitch = PITCHES[sport];
  return { x: (p.x - VW / 2) / (VW - 64) * pitch.length, y: height, z: (p.y - VH / 2) / (VH - 64) * pitch.width };
}

export function worldToBoard(p: { x: number; z: number }, sport: Sport): Position {
  const pitch = PITCHES[sport];
  return { x: p.x / pitch.length * (VW - 64) + VW / 2, y: p.z / pitch.width * (VH - 64) + VH / 2 };
}

/** Positive SVG rotation is clockwise when viewed from above. */
export const boardRotation = (degrees = 0) => -degrees * Math.PI / 180;
export const playbackDuration = (phaseCount: number, speed: number) => Math.max(0, phaseCount - 1) * VIDEO_PHASE_MS / speed;
export const exportDuration = (phaseCount: number, speed: number) => VIDEO_LEAD_MS + playbackDuration(phaseCount, speed) + VIDEO_TAIL_MS;

/**
 * The saved model has no pass height. Short moves roll along the grass; from
 * about 15 m the ball is lifted in a gentle parabola, like a long pass. The
 * ground path is still exactly the 2D path. Returns height in metres.
 */
export function ballArcHeight(from: Position, to: Position, t: number, sport: Sport) {
  const a = boardToWorld(from, sport), b = boardToWorld(to, sport);
  const distance = Math.hypot(b.x - a.x, b.z - a.z);
  const lift = Math.min(1, Math.max(0, (distance - 15) / 15));
  const peak = lift * Math.min(distance * 0.15, 9);
  const k = Math.min(1, Math.max(0, t));
  return 4 * peak * k * (1 - k);
}

/** Ball height at a playback time; same clock as playbackFrame. */
export function playbackBallHeight(phases: TacticPhase[], elapsedMs: number, speed: number, sport: Sport) {
  const time = Math.max(0, elapsedMs) * speed;
  if (phases.length < 2 || time >= (phases.length - 1) * VIDEO_PHASE_MS) return 0;
  const from = Math.min(phases.length - 2, Math.floor(time / VIDEO_PHASE_MS));
  return ballArcHeight(phases[from].ball, phases[from + 1].ball, time / VIDEO_PHASE_MS - from, sport);
}

/** Reuses the 2D export's linear interpolation, including shortest-path equipment rotation. */
export function playbackFrame(phases: TacticPhase[], elapsedMs: number, speed: number) {
  if (!phases.length) throw new Error('Taktikken har ingen faser.');
  if (!Number.isFinite(speed) || speed <= 0) throw new Error('Ugyldig avspillingsfart.');
  const time = Math.max(0, elapsedMs) * speed;
  const end = Math.max(0, phases.length - 1) * VIDEO_PHASE_MS;
  // The board switches to the entire destination phase at the endpoint,
  // including newly added players/items and drawings.
  if (time >= end) {
    const last = phases[phases.length - 1];
    return { players: last.players, ball: last.ball, items: last.items ?? [], fromIdx: phases.length - 1, progress: 1 };
  }
  return frameAt(phases, time);
}
