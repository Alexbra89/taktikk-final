'use client';
import React, { useRef, useCallback } from 'react';

// ═══ Ball ═══════════════════════════════════════════════════════

interface BallProps {
  position: { x: number; y: number };
  isDraggable: boolean;
  onPositionChange: (pos: { x: number; y: number }) => void;
}

export const Ball: React.FC<BallProps> = ({ position, isDraggable, onPositionChange }) => {
  const ref        = useRef<SVGGElement>(null);
  const isDragging = useRef(false);
  const rafRef     = useRef<number | null>(null);
  const pendingPos = useRef<{ x: number; y: number } | null>(null);
  const lastMoveTime = useRef(0);
  const MOVE_THROTTLE_MS = 16;

  const toSVGCoords = useCallback((clientX: number, clientY: number) => {
    const svg = ref.current?.ownerSVGElement;
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
  }, []);

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

  const { x, y } = position;
  return (
    <g ref={ref}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      style={{ cursor: isDraggable ? 'grab' : 'default', touchAction: 'none', willChange: 'transform' }}
      filter="url(#dropShadow)"
    >
      <circle cx={x} cy={y} r={28} fill="transparent" style={{ pointerEvents: 'all' }} />
      {/* Kalk: ballen er en blekkprikk med kalkkjerne – leses på både mørk og lys bane. */}
      <circle cx={x} cy={y} r={10} style={{ fill: 'rgb(var(--k-ink))' }} />
      <circle cx={x} cy={y} r={4} style={{ fill: 'rgb(var(--k-pitch))' }} />
    </g>
  );
};
