import { VW, VH } from '@/data/formations';
import { boardToWorld, worldToBoard, PITCHES } from '@/components/board/three/coordinates';
import type { DrillAnimation } from './types';

// ══════════════════════════════════════════════════════════════
//  UTSNITTET – ett fast utsnitt for hele øvelsen, alle faser
//
//  3D: `bounds` i meter, som kameraet tilpasses (CameraRig).
//  2D: `content` er boksen rundt alle spillere, baller, kjegler og tekster
//  i alle faser. fitCrop viser hele banen når den får plass (på smal mobil
//  hele høyden), alltid med hele innholdet og plass til draktene.
//  Draktene og ikonene vokser ikke med zoomen: de får samme skjermstørrelse
//  som når hele banen vises (taktikkbrettet), men aldri mindre enn på mobil.
// ══════════════════════════════════════════════════════════════

export interface Box { x: number; y: number; width: number; height: number }

/** Plass rundt et punkt til drakten, rolleetiketten under, ballen og kjeglene, i brettets enheter ved draktens egen størrelse. */
export const KIT_ROOM = { side: 30, top: 30, bottom: 48 };
/** Draktene blir aldri mindre enn dette på skjermen (piksler per brettenhet), som på mobil før. */
export const MIN_KIT_SCALE = 0.75;
/** Minste utsnitt i meter, så noen få spillere tett i tett ikke zoomes inn til banestreker på flere centimeter. */
const MIN_LENGTH = 15, MIN_WIDTH = 10;

export function drillFraming(animation: DrillAnimation) {
  const boardPoints = animation.phases.flatMap(phase => [
    ...phase.players.map(p => p.position), phase.ball,
    ...(phase.items ?? []).map(item => item.position),
    ...(phase.drawings ?? []).flatMap(d => d.type === 'label' ? [d.at] : []),
  ]);
  const points = boardPoints.map(point => boardToWorld(point, animation.sport));
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const minZ = Math.min(...points.map(p => p.z)), maxZ = Math.max(...points.map(p => p.z));
  const pitch = PITCHES[animation.sport];
  const length = Math.max(MIN_LENGTH, maxX - minX + 2 * Math.max(2, 28 * pitch.length / 816));
  const width = Math.max(MIN_WIDTH, maxZ - minZ + 2 * Math.max(2, 40 * pitch.width / 496));
  const x = (minX + maxX) / 2, z = (minZ + maxZ) / 2;
  const bounds = { minX: x - length / 2, maxX: x + length / 2, minZ: z - width / 2, maxZ: z + width / 2 };

  // 2D: bare punktene, minst MIN_LENGTH × MIN_WIDTH meter, med samme midtpunkt.
  const left = Math.min(...boardPoints.map(p => p.x)), right = Math.max(...boardPoints.map(p => p.x));
  const top = Math.min(...boardPoints.map(p => p.y)), bottom = Math.max(...boardPoints.map(p => p.y));
  const minSize = worldToBoard({ x: MIN_LENGTH, z: MIN_WIDTH }, animation.sport);
  const contentWidth = Math.max(right - left, minSize.x - VW / 2), contentHeight = Math.max(bottom - top, minSize.y - VH / 2);
  const content: Box = {
    x: (left + right - contentWidth) / 2, y: (top + bottom - contentHeight) / 2,
    width: contentWidth, height: contentHeight,
  };
  return { bounds, length, width, content };
}

/** Plassering langs én akse: helst hele banen, ellers rundt øvelsen, og alltid hele øvelsen. */
function place(size: number, pitch: number, needStart: number, needSize: number) {
  const wanted = size >= pitch
    ? (pitch - size) / 2
    : Math.min(Math.max(needStart + needSize / 2 - size / 2, 0), pitch - size);
  return Math.min(Math.max(wanted, needStart + needSize - size), needStart);
}

/**
 * Utsnittet i 2D for en flate på `width` × `height` piksler. Utsnittet har
 * flatens form, så banen fyller hele flaten og aldri kuttes av en kant midt
 * i gresset. Hele banen vises når den får plass; ellers (smal mobil) hele
 * banens høyde, med øvelsen midt i bredden. Øvelsen og plass til draktene er
 * alltid med. `scale` er piksler per brettenhet for banen, `kitScale` hvor
 * mye draktene og ikonene krympes for å beholde skjermstørrelsen (1 = som zoomen).
 */
export function fitCrop(content: Box, width: number, height: number) {
  const w = Math.max(1, width), h = Math.max(1, height);
  // Draktenes skjermstørrelse: som når hele banen får plass på flaten.
  const kit = Math.max(MIN_KIT_SCALE, Math.min(w / VW, h / VH));
  const roomX = 2 * KIT_ROOM.side, roomY = KIT_ROOM.top + KIT_ROOM.bottom;
  const cw = Math.max(1, content.width), ch = Math.max(1, content.height);
  // Største zoom der øvelsen med drakter får plass: draktene følger zoomen …
  let fitsContent = Math.min(w / (cw + roomX), h / (ch + roomY));
  // … til de har nådd sin faste størrelse; da får banen resten av plassen.
  if (fitsContent > kit) fitsContent = Math.min((w - roomX * kit) / cw, (h - roomY * kit) / ch);
  // Hele banen, eller på smal mobil hele høyden uten at draktene blir for små.
  const wholePitch = Math.min(w / VW, h / VH);
  const scale = Math.min(fitsContent, Math.max(wholePitch, Math.min(h / VH, MIN_KIT_SCALE)));
  const kitScale = Math.min(1, kit / scale);
  const need: Box = {
    x: content.x - KIT_ROOM.side * kitScale,
    y: content.y - KIT_ROOM.top * kitScale,
    width: cw + roomX * kitScale,
    height: ch + roomY * kitScale,
  };
  const cropWidth = w / scale, cropHeight = h / scale;
  const crop: Box = {
    x: place(cropWidth, VW, need.x, need.width),
    y: place(cropHeight, VH, need.y, need.height),
    width: cropWidth, height: cropHeight,
  };
  return { crop, scale, kitScale, viewBox: `${crop.x} ${crop.y} ${crop.width} ${crop.height}` };
}
