import { VW, VH } from '@/data/formations';
import { boardToWorld, worldToBoard, PITCHES } from '@/components/board/three/coordinates';
import type { DrillAnimation } from './types';

// ══════════════════════════════════════════════════════════════
//  UTSNITTET – ett fast utsnitt for hele øvelsen, alle faser
//
//  3D: `bounds` i meter, som kameraet tilpasses (CameraRig).
//  2D: `content` er boksen rundt alle spillere, baller, kjegler og tekster
//  i alle faser. fitCrop viser alltid hele banen (også på mobil i stående
//  modus), med hele innholdet og plass til draktene. Draktene og ikonene har
//  samme skjermstørrelse som når hele banen vises (taktikkbrettet), men aldri
//  mindre enn på mobil.
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

/**
 * Utsnittet i 2D for en flate på `width` × `height` piksler. Hele banen vises
 * alltid, også på smal mobil i stående modus (contain): utsnittet har flatens
 * form, og det som er til overs, blir gress rundt banen. Draktene og ikonene
 * har fast skjermstørrelse – som når hele banen får plass, men aldri mindre
 * enn på mobil (MIN_KIT_SCALE) – så på mobil tegnes de større enn zoomen
 * (`kitScale` > 1). Står en spiller så nær kanten at drakten ellers ville blitt
 * kuttet, zoomes det litt ut, så både banen og draktene får plass.
 * `scale` er piksler per brettenhet for banen, `kitScale` hvor mye draktene
 * skaleres i forhold til zoomen.
 */
export function fitCrop(content: Box, width: number, height: number) {
  const w = Math.max(1, width), h = Math.max(1, height);
  const kit = Math.max(MIN_KIT_SCALE, Math.min(w / VW, h / VH));
  /** Det som må synes ved zoomen `scale`: hele banen, øvelsen og plass til draktene. */
  const extent = (scale: number) => {
    const k = kit / scale;
    return {
      left: Math.min(0, content.x - KIT_ROOM.side * k),
      right: Math.max(VW, content.x + content.width + KIT_ROOM.side * k),
      top: Math.min(0, content.y - KIT_ROOM.top * k),
      bottom: Math.max(VH, content.y + content.height + KIT_ROOM.bottom * k),
    };
  };
  const fits = (scale: number) => {
    const e = extent(scale);
    return (e.right - e.left) * scale <= w + 1e-9 && (e.bottom - e.top) * scale <= h + 1e-9;
  };
  // Største zoom der alt får plass. Behovet i piksler vokser med zoomen, så et halveringssøk holder.
  let scale = Math.min(w / VW, h / VH);
  if (!fits(scale)) {
    let lo = 0, hi = scale;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    scale = lo || hi;
  }
  const e = extent(scale);
  const cropWidth = w / scale, cropHeight = h / scale;
  const crop: Box = {
    x: (e.left + e.right) / 2 - cropWidth / 2,
    y: (e.top + e.bottom) / 2 - cropHeight / 2,
    width: cropWidth, height: cropHeight,
  };
  return { crop, scale, kitScale: kit / scale, viewBox: `${crop.x} ${crop.y} ${crop.width} ${crop.height}` };
}
