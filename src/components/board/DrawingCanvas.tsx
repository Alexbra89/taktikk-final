'use client';

import React from 'react';
import { Drawing, Position } from '@/types';

interface DrawingCanvasProps {
  drawing: Drawing;
}

const ArrowHead: React.FC<{
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
  opacity?: number;
}> = ({ start, end, color, opacity }) => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const size = 14;
  const x1 = end.x - size * Math.cos(angle - Math.PI / 6);
  const y1 = end.y - size * Math.sin(angle - Math.PI / 6);
  const x2 = end.x - size * Math.cos(angle + Math.PI / 6);
  const y2 = end.y - size * Math.sin(angle + Math.PI / 6);
  return (
    <polygon points={`${end.x},${end.y} ${x1},${y1} ${x2},${y2}`} fill={color} opacity={opacity} />
  );
};

// Felles uttrykk: streken som frihånd alltid har hatt, og en svak fylling
// på figurer, slik at en sone kan leses uten å skjule spillerne i den.
const STROKE = { strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.85 } as const;
const AREA   = { strokeWidth: 3, strokeLinejoin: 'round', strokeOpacity: 0.85, fillOpacity: 0.12 } as const;

// Fasene repareres ved innlasting (repairDrawing), men øyeblikk lagres urørt.
// Formen sjekkes derfor her også, og en manglende farge må ikke gi usynlig strek.
const ok = (p: unknown): p is Position =>
  !!p && Number.isFinite((p as Position).x) && Number.isFinite((p as Position).y);

// Eneste tegne-rendring i appen: brukes av både TacticBoard og FullscreenBoard.
export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ drawing }) => {
  const color: string = drawing.color ?? '#EDEDEF';

  switch (drawing.type) {
    case 'circle': {
      const { start, end } = drawing;
      if (!ok(start) || !ok(end)) return null;
      const r = Math.hypot(end.x - start.x, end.y - start.y);
      return <circle cx={start.x} cy={start.y} r={r} stroke={color} fill={color} {...AREA} />;
    }

    case 'rectangle': {
      const { start, end } = drawing;
      if (!ok(start) || !ok(end)) return null;
      return (
        <rect
          x={Math.min(start.x, end.x)} y={Math.min(start.y, end.y)}
          width={Math.abs(end.x - start.x)} height={Math.abs(end.y - start.y)}
          rx={4} stroke={color} fill={color} {...AREA}
        />
      );
    }

    case 'label': {
      const { at, text } = drawing;
      if (!ok(at) || !text) return null;
      // Kanten i banefarge gir lesbar tekst oppå linjer og andre streker.
      return (
        <text x={at.x} y={at.y} textAnchor="middle" dominantBaseline="middle"
          fontSize={18} fontWeight={600}
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fill={color} strokeWidth={4} strokeLinejoin="round"
          style={{ stroke: 'rgb(var(--k-pitch))', paintOrder: 'stroke', pointerEvents: 'none' }}>
          {text}
        </text>
      );
    }
  }

  // Resten er streker gjennom punkter.
  const { pts } = drawing;
  if (!pts || pts.length < 2) return null;
  const first = pts[0];
  const last  = pts[pts.length - 1];

  switch (drawing.type) {
    case 'arrow':
      return (
        <g>
          <line x1={first.x} y1={first.y} x2={last.x} y2={last.y} stroke={color} {...STROKE} />
          <ArrowHead start={first} end={last} color={color} opacity={0.88} />
        </g>
      );

    case 'curved-arrow': {
      if (pts.length < 3) return null;
      const c = pts[1];
      return (
        <g>
          <path d={`M ${first.x} ${first.y} Q ${c.x} ${c.y} ${last.x} ${last.y}`}
            stroke={color} fill="none" {...STROKE} />
          {/* Kurvens retning i endepunktet går fra kontrollpunktet. */}
          <ArrowHead start={c} end={last} color={color} opacity={0.88} />
        </g>
      );
    }

    case 'dashed':
      return (
        <line x1={first.x} y1={first.y} x2={last.x} y2={last.y}
          stroke={color} strokeDasharray="10,9" {...STROKE} />
      );

    // Default: frihånd med pilspiss – alle tegninger lagret uten type.
    // Ser nøyaktig ut som tegningene på brettet har gjort hele tiden.
    default:
      return (
        <g>
          <polyline
            points={pts.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' ')}
            stroke={color}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
          <ArrowHead
            start={pts[pts.length - 2]}
            end={pts[pts.length - 1]}
            color={color}
            opacity={0.88}
          />
        </g>
      );
  }
};
