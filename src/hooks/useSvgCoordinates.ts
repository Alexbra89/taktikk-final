'use client';
import type React from 'react';
import { useCallback } from 'react';
import { VW, VH } from '@/data/formations';
import { CLAMP_X, CLAMP_Y_TOP, CLAMP_Y_BOTTOM } from '@/components/board/constants';
import type { SvgPos } from '@/lib/geometry';

// ══════════════════════════════════════════════════════════════
//  FRA SKJERM TIL BANE – felles for TacticBoard og FullscreenBoard,
//  som før hadde hver sin kopi av samme utregning. Gjør om en
//  pekerposisjon til banens koordinater, med og uten klemming.
// ══════════════════════════════════════════════════════════════

export function useSvgCoordinates(svgRef: React.RefObject<SVGSVGElement | null>) {
  const clamp = useCallback((v:number,lo:number,hi:number) => Math.max(lo,Math.min(hi,v)), []);
  const clampToPitch = useCallback((x:number, y:number): SvgPos => ({
    x: clamp(x, CLAMP_X, VW - CLAMP_X),
    y: clamp(y, CLAMP_Y_TOP, VH - CLAMP_Y_BOTTOM),
  }), [clamp]);

  // ─── toSVG med letter-box-korreksjon ──────────────────────────
  // Må speile <svg preserveAspectRatio="xMidYMid meet"> nøyaktig (letterbox, skala=min).
  // Banen vises alltid i sin helhet: med faner, kontroller og verktøylinje rundt blir
  // brettet lavt i liggende format, og "slice" (skala=max) ville beskåret vinger og backer.
  // getBoundingClientRect() tar med CSS-transformen, så zoomen krever ingen egen korreksjon.
  const toSVGRaw = useCallback((cx: number, cy: number): SvgPos => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const rectW = rect.width;
    const rectH = rect.height;

    const scaleX = rectW / VW;
    const scaleY = rectH / VH;
    const scale  = Math.min(scaleX, scaleY);

    const renderedW = VW * scale;
    const renderedH = VH * scale;

    // Sentrert offset (xMidYMid)
    const offsetX = (rectW - renderedW) / 2;
    const offsetY = (rectH - renderedH) / 2;

    // Klientkoordinater relativt til SVG-rektangelet
    const localX = cx - rect.left - offsetX;
    const localY = cy - rect.top  - offsetY;

    return { x: (localX / renderedW) * VW, y: (localY / renderedH) * VH };
  }, [svgRef]);

  // Det meste skal holde seg innenfor banen. Rotasjonshåndtaket bruker den
  // rå posisjonen, så vinkelen blir riktig også når pekeren er utenfor.
  const toSVG = useCallback((cx: number, cy: number): SvgPos => {
    const p = toSVGRaw(cx, cy);
    return clampToPitch(p.x, p.y);
  }, [toSVGRaw, clampToPitch]);

  return { toSVGRaw, toSVG, clampToPitch };
}
