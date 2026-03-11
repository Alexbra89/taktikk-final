'use client';

import React, { useRef, useCallback } from 'react';
import { Player } from '@/types';

interface DraggablePlayerProps {
  player: Player;
  isActive: boolean;
  isSelected?: boolean;
  awayTeamColor?: string;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSelect?: () => void;
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

export const DraggablePlayer: React.FC<DraggablePlayerProps> = ({
  player,
  isActive,
  isSelected = false,
  awayTeamColor,
  onPositionChange,
  onSelect,
  showName = true,
}) => {
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const svgRef = useRef<SVGGElement>(null);

  const colors = ROLE_COLORS[player.role] ?? { fill: '#64748b', stroke: '#475569' };

  // Away team uses awayTeamColor for fill, home team uses role colors
  const fillColor = player.team === 'away' && awayTeamColor ? awayTeamColor : colors.fill;
  const strokeColor = player.team === 'away' && awayTeamColor ? awayTeamColor : colors.stroke;

  // Outline ring: white for home, dark for away
  const outlineColor = player.team === 'away' ? '#1e293b' : '#ffffff';

  const getParentSVG = (): SVGSVGElement | null =>
    svgRef.current?.ownerSVGElement ?? null;

  const getSVGCoords = useCallback((clientX: number, clientY: number) => {
    const svg = getParentSVG();
    if (!svg) return null;
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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    hasMoved.current = false;
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [isActive]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !isActive) return;
    e.preventDefault();
    hasMoved.current = true;
    const coords = getSVGCoords(e.clientX, e.clientY);
    if (coords) onPositionChange(coords);
  }, [isActive, getSVGCoords, onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // Only fire onSelect if the user just tapped (didn't drag)
    if (!hasMoved.current && onSelect) {
      onSelect();
    }
    hasMoved.current = false;
  }, [onSelect]);

  const { x, y } = player.position;
  const r = 18;

  return (
    <g
      ref={svgRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ cursor: isActive ? 'grab' : 'default', userSelect: 'none', touchAction: 'none' }}
      filter="url(#dropShadow)"
    >
      {/* Selection ring */}
      {isSelected && (
        <circle
          cx={x} cy={y} r={r + 7}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={2.5}
          strokeDasharray="5,3"
          opacity={0.9}
        />
      )}
      {/* Outer ring (team color) */}
      <circle
        cx={x} cy={y} r={r + 2.5}
        fill={outlineColor}
        opacity={0.9}
      />
      {/* Inner circle (role color) */}
      <circle
        cx={x} cy={y} r={r}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.5}
      />
      {/* Number */}
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
      {/* Name below */}
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
