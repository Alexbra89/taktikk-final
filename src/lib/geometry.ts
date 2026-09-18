import { VW, VH } from '../data/formations';
import {
  MIN_DIST, SNAP_R, CLAMP_X, CLAMP_Y_TOP, CLAMP_Y_BOTTOM,
} from '../components/board/constants';

export interface SvgPos { x: number; y: number }

export function separatePlayers(pts: SvgPos[], minDist = MIN_DIST): SvgPos[] {
  const r = pts.map(p => ({ ...p }));
  for (let it = 0; it < 1; it++) {
    for (let i = 0; i < r.length; i++) {
      for (let j = i + 1; j < r.length; j++) {
        const dx = r[j].x - r[i].x, dy = r[j].y - r[i].y;
        const d  = Math.hypot(dx, dy);
        if (d < minDist && d > 0.01) {
          const push = (minDist - d) * 0.1, nx = dx / d, ny = dy / d;
          r[i].x -= nx * push; r[i].y -= ny * push;
          r[i].x = Math.max(CLAMP_X, Math.min(VW - CLAMP_X, r[i].x));
          r[i].y = Math.max(CLAMP_Y_TOP, Math.min(VH - CLAMP_Y_BOTTOM, r[i].y));
          r[j].x = Math.max(CLAMP_X, Math.min(VW - CLAMP_X, r[j].x));
          r[j].y = Math.max(CLAMP_Y_TOP, Math.min(VH - CLAMP_Y_BOTTOM, r[j].y));
        }
      }
    }
  }
  return r;
}

export function nearestSlotPos(
  pos: SvgPos,
  slots: { position: { x: number; y: number } }[],
  r = SNAP_R,
): SvgPos | null {
  let best: SvgPos | null = null, bestD = r;
  for (const s of slots) {
    const d = Math.hypot(s.position.x - pos.x, s.position.y - pos.y);
    if (d < bestD) { bestD = d; best = s.position; }
  }
  return best;
}
