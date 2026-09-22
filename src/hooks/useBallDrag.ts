'use client';
import type React from 'react';
import { useCallback, useRef } from 'react';
import type { Position } from '@/types';

// ══════════════════════════════════════════════════════════════
//  DRAG AV BALLEN – lå før inne i Ball-komponenten i BoardElements.
//  Ballen tegnes nå av BoardStage; denne hooken gir håndtererne som
//  legges på ballgruppa. Samme utregning og samme grenser som før.
// ══════════════════════════════════════════════════════════════

const MOVE_THROTTLE_MS = 16;

export function useBallDrag(
  svgRef: React.RefObject<SVGSVGElement>,
  isDraggable: boolean,
  onPositionChange: (pos: Position) => void,
): React.SVGProps<SVGGElement> {
  const isDragging   = useRef(false);
  const rafRef       = useRef<number | null>(null);
  const pendingPos   = useRef<Position | null>(null);
  const lastMoveTime = useRef(0);

  const toSVGCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const vbW  = parseFloat(svg.getAttribute('viewBox')?.split(' ')[2] ?? '880');
    const vbH  = parseFloat(svg.getAttribute('viewBox')?.split(' ')[3] ?? '560');

    // Speil <svg preserveAspectRatio="xMidYMid meet"> (letterbox, skala=min) nøyaktig,
    // ellers blir ballen forskyvet i forhold til musa når brettet har letterbox.
    const scale     = Math.min(rect.width / vbW, rect.height / vbH);
    const renderedW = vbW * scale;
    const renderedH = vbH * scale;
    const offsetX   = (rect.width  - renderedW) / 2;
    const offsetY   = (rect.height - renderedH) / 2;

    return {
      x: Math.max(45, Math.min(vbW - 45, ((clientX - rect.left - offsetX) / renderedW) * vbW)),
      y: Math.max(45, Math.min(vbH - 45, ((clientY - rect.top  - offsetY) / renderedH) * vbH)),
    };
  }, [svgRef]);

  const flushPosition = useCallback(() => {
    if (pendingPos.current) { onPositionChange(pendingPos.current); pendingPos.current = null; }
    rafRef.current = null;
  }, [onPositionChange]);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (!isDraggable) return;
    e.preventDefault(); e.stopPropagation();
    isDragging.current = true;
    lastMoveTime.current = Date.now();
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
  }, [isDraggable]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (!isDragging.current) return;
    e.preventDefault();

    const now = Date.now();
    if (now - lastMoveTime.current < MOVE_THROTTLE_MS) return;
    lastMoveTime.current = now;

    const c = toSVGCoords(e.clientX, e.clientY);
    if (!c) return;
    pendingPos.current = c;
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flushPosition);
  }, [toSVGCoords, flushPosition]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (pendingPos.current) { onPositionChange(pendingPos.current); pendingPos.current = null; }
  }, [onPositionChange]);

  return {
    onPointerDown, onPointerMove, onPointerUp,
    style: { cursor: isDraggable ? 'grab' : 'default', touchAction: 'none', willChange: 'transform' },
  };
}
