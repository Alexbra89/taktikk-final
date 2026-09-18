'use client';
import React, { useRef, useCallback } from 'react';
import { Drawing } from '../../types';

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
    return {
      x: Math.max(45, Math.min(vbW - 45, ((clientX - rect.left) / rect.width)  * vbW)),
      y: Math.max(45, Math.min(vbH - 45, ((clientY - rect.top)  / rect.height) * vbH)),
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
      <circle cx={x} cy={y} r={12} fill="white" />
      <circle cx={x} cy={y} r={12} fill="none" stroke="#ddd" strokeWidth={0.5} />
      {[
        { dx: -4, dy: -4, r: 3.5 },
        { dx: 4.5, dy: -2, r: 3 },
        { dx: 0, dy: 5, r: 3 },
        { dx: -5, dy: 2.5, r: 2.5 },
      ].map((o, i) => (
        <circle key={i} cx={x + o.dx} cy={y + o.dy} r={o.r} fill="#111" opacity={0.72} />
      ))}
    </g>
  );
};

// ═══ DrawingCanvas ════════════════════════════════════════════════

interface DrawingCanvasProps { drawing: Drawing; }

const ArrowHead: React.FC<{
  p1: { x: number; y: number }; p2: { x: number; y: number }; color: string;
}> = ({ p1, p2, color }) => {
  const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const s = 14;
  return (
    <polygon fill={color} opacity={0.88}
      points={`${p2.x},${p2.y} ${p2.x - s * Math.cos(a - Math.PI/6)},${p2.y - s * Math.sin(a - Math.PI/6)} ${p2.x - s * Math.cos(a + Math.PI/6)},${p2.y - s * Math.sin(a + Math.PI/6)}`}
    />
  );
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ drawing }) => {
  const { pts, color } = drawing;
  if (!pts || pts.length < 2) return null;
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  return (
    <g>
      <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')}
        stroke={color} strokeWidth={3} fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <ArrowHead p1={prev} p2={last} color={color} />
    </g>
  );
};
