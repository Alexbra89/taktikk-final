import { boardToWorld, worldToBoard, PITCHES } from '@/components/board/three/coordinates';
import type { DrillAnimation } from './types';

/** One fixed crop for the entire drill. Padding includes kits, badges and cones. */
export function drillFraming(animation: DrillAnimation) {
  const points = animation.phases.flatMap(phase => [
    ...phase.players.map(p => p.position), phase.ball,
    ...(phase.items ?? []).map(item => item.position),
    ...(phase.drawings ?? []).flatMap(d => d.type === 'label' ? [d.at] : []),
  ]).map(point => boardToWorld(point, animation.sport));
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const minZ = Math.min(...points.map(p => p.z)), maxZ = Math.max(...points.map(p => p.z));
  const pitch = PITCHES[animation.sport];
  const length = Math.max(15, maxX - minX + 2 * Math.max(2, 28 * pitch.length / 816));
  const width = Math.max(10, maxZ - minZ + 2 * Math.max(2, 40 * pitch.width / 496));
  const x = (minX + maxX) / 2, z = (minZ + maxZ) / 2;
  const bounds = { minX: x - length / 2, maxX: x + length / 2, minZ: z - width / 2, maxZ: z + width / 2 };
  const topLeft = worldToBoard({ x: bounds.minX, z: bounds.minZ }, animation.sport);
  const bottomRight = worldToBoard({ x: bounds.maxX, z: bounds.maxZ }, animation.sport);
  const board = { x: topLeft.x, y: topLeft.y, width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y };
  return { bounds, board, length, width, viewBox: `${board.x} ${board.y} ${board.width} ${board.height}` };
}
