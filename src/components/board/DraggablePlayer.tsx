'use client';

import React, { useRef, useCallback } from 'react';
import { Player } from '@/types';

interface DraggablePlayerProps {
  player: Player;
  isActive: boolean;
  onPositionChange: (position: { x: number; y: number }) => void;
  showName?: boolean;
}

const ROLE_COLORS: Record<string, { fill: string; stroke: string }> = {
  keeper:     { fill: '#f59e0b', stroke: '#d97706' },
  defender:   { fill: '#3b82f6', stroke: '#2563eb' },
  midfielder: { fill: '#22c55e', stroke: '#16a34a' },
  forward:    { fill: '#ef4444', stroke: '#dc2626' },
  winger:     { fill: '#a855f7', stroke: '#9333ea' },
  false9:     { fill: '#f97316', stroke: '#ea580c' },
  libero:     { fill: '#6366f1', stroke: '#4f46e5' },
  playmaker:  { fill: '#ec4899', stroke: '#db2777' },
};

const TEAM_OUTLINE: Record<string, string> = {
  home: '#ffffff',
  away: '#1e293b',
};

export const DraggablePlayer: React.FC<DraggablePlayerProps> = ({
  player,
  isActive,
  onPositionChange,
  showName = true,
}) => {
  const isDragging = useRef(false);
  const svgRef = useRef<SVGGElement>(null);

  const colors = ROLE_COLORS[player.role] ?? { fill: '#64748b', stroke: '#475569' };
  const outline = TEAM_OUTLINE[player.team] ?? '#ffffff';

  const getParentSVG = (): SVGSVGElement | null => {
    return svgRef.current?.ownerSVGElement ?? null;
  };

  const getSVGCoords = useCallback((e: MouseEvent | TouchEvent) => {
    const svg = getParentSVG();
    if (!svg) return null;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const { x, y } = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.max(55, Math.min(745, x)),
      y: Math.max(55, Math.min(545, y)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;

    const handleMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const coords = getSVGCoords(ev);
      if (coords) onPositionChange(coords);
    };

    const handleUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [isActive, getSVGCoords, onPositionChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isActive) return;
    e.preventDefault();
    isDragging.current = true;

    const handleMove = (ev: TouchEvent) => {
      if (!isDragging.current) return;
      const coords = getSVGCoords(ev);
      if (coords) onPositionChange(coords);
    };

    const handleEnd = () => {
      isDragging.current = false;
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  }, [isActive, getSVGCoords, onPositionChange]);

  const { x, y } = player.position;
  const r = 18;

  return (
    <g
      ref={svgRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ cursor: isActive ? 'grab' : 'default', userSelect: 'none' }}
      filter="url(#dropShadow)"
    >
      {/* Ytre ring (lag-farge) */}
      <circle
        cx={x} cy={y} r={r + 2.5}
        fill={outline}
        opacity={0.9}
      />
      {/* Indre sirkel (rolle-farge) */}
      <circle
        cx={x} cy={y} r={r}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={1.5}
      />
      {/* Nummer */}
      <text
        x={x} y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={11}
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {player.num}
      </text>
      {/* Navn under */}
      {showName && player.name && (
        <text
          x={x} y={y + r + 11}
          textAnchor="middle"
          fill="white"
          fontSize={9}
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: 'none' }}
          paintOrder="stroke"
          stroke="rgba(0,0,0,0.7)"
          strokeWidth={3}
          strokeLinejoin="round"
        >
          {player.name.length > 9 ? player.name.slice(0, 9) + '…' : player.name}
        </text>
      )}
    </g>
  );
};
