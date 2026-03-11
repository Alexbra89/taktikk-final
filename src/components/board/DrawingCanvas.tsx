'use client';

import React from 'react';
import { Drawing } from '@/types';

interface DrawingCanvasProps {
  drawing: Drawing;
}

const ArrowHead: React.FC<{
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
}> = ({ start, end, color }) => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const size = 14;
  const x1 = end.x - size * Math.cos(angle - Math.PI / 6);
  const y1 = end.y - size * Math.sin(angle - Math.PI / 6);
  const x2 = end.x - size * Math.cos(angle + Math.PI / 6);
  const y2 = end.y - size * Math.sin(angle + Math.PI / 6);
  return (
    <polygon points={`${end.x},${end.y} ${x1},${y1} ${x2},${y2}`} fill={color} />
  );
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ drawing }) => {
  const { pts, color } = drawing as any;
  // Support both typed and untyped drawings — untyped = freehand polyline
  const type: string = (drawing as any).type ?? 'freehand';

  if (!pts || pts.length < 2) return null;

  const d = pts.reduce((path: string, pt: { x: number; y: number }, i: number) =>
    i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`, '');

  switch (type) {
    case 'arrow':
      return (
        <g>
          <path d={d} stroke={color} strokeWidth={3} fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
          <ArrowHead
            start={pts[pts.length - 2]}
            end={pts[pts.length - 1]}
            color={color}
          />
        </g>
      );

    case 'line':
      return (
        <line
          x1={pts[0].x} y1={pts[0].y}
          x2={pts[pts.length - 1].x} y2={pts[pts.length - 1].y}
          stroke={color} strokeWidth={3} strokeLinecap="round"
        />
      );

    case 'circle': {
      const cx = pts[0].x;
      const cy = pts[0].y;
      const r = Math.sqrt(
        Math.pow(pts[1].x - cx, 2) + Math.pow(pts[1].y - cy, 2)
      );
      return (
        <circle cx={cx} cy={cy} r={r}
          stroke={color} strokeWidth={3} fill="none" strokeDasharray="8,5" />
      );
    }

    case 'movement':
      return (
        <g opacity={0.7}>
          <path d={d} stroke={color} strokeWidth={2.5} fill="none"
            strokeDasharray="8,5" strokeLinecap="round" />
          <ArrowHead
            start={pts[pts.length - 2]}
            end={pts[pts.length - 1]}
            color={color}
          />
        </g>
      );

    // Default: freehand polyline (drawings saved without a type field)
    default:
      return (
        <polyline
          points={pts.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' ')}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }
};
