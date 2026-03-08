'use client';
import React, { useRef, useCallback } from 'react';
import { Player, Drawing } from '../../types';
import { ROLE_META } from '../../data/roleInfo';

// ═══ DraggablePlayer ══════════════════════════════════════════════

interface DraggablePlayerProps {
  player: Player;
  isActive: boolean;
  isSelected: boolean;
  awayTeamColor?: string;   // overrides default red for away team
  onPositionChange: (pos: { x: number; y: number }) => void;
  onSelect: () => void;
  showName?: boolean;
}

export const DraggablePlayer: React.FC<DraggablePlayerProps> = ({
  player, isActive, isSelected, awayTeamColor, onPositionChange, onSelect, showName = true,
}) => {
  const groupRef = useRef<SVGGElement>(null);
  const meta = ROLE_META[player.role] ?? ROLE_META['midfielder'];
  const isInjured = !!player.injured;
  const isHome = player.team === 'home';

  // For away team, use awayTeamColor to tint the outer ring
  const outerFill = isHome
    ? 'rgba(255,255,255,0.92)'
    : (awayTeamColor ? awayTeamColor + '33' : 'rgba(20,30,45,0.92)'); // 33 = 20% opacity hex
  const outerStroke = isHome ? undefined : (awayTeamColor ?? '#ef4444');

  const getSVGCoords = useCallback((e: MouseEvent | TouchEvent) => {
    const svg = groupRef.current?.ownerSVGElement;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const scaleX = parseFloat(svg.getAttribute('viewBox')?.split(' ')[2] || '880') / rect.width;
    const scaleY = parseFloat(svg.getAttribute('viewBox')?.split(' ')[3] || '560') / rect.height;
    return {
      x: Math.max(45, Math.min(835, (clientX - rect.left) * scaleX)),
      y: Math.max(45, Math.min(515, (clientY - rect.top) * scaleY)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive) return;
    e.preventDefault(); e.stopPropagation();
    const handleMove = (ev: MouseEvent) => {
      const c = getSVGCoords(ev); if (c) onPositionChange(c);
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [isActive, getSVGCoords, onPositionChange]);

  const { x, y } = player.position;

  // Spilletids-fargekoding for kjerne-sirkel grense
  const getPlaytimeRing = () => {
    const min = player.minutesPlayed ?? 0;
    if (min > 60) return '#ef4444';   // rød – spilt mye
    if (min > 30) return '#f59e0b';   // gul
    return '#22c55e';                 // grønn – lite spilt
  };

  return (
    <g ref={groupRef} onMouseDown={handleMouseDown}
      style={{ cursor: isActive ? 'grab' : 'default', userSelect: 'none' }}
      filter="url(#shadow)"
      opacity={isInjured ? 0.45 : 1}>

      {/* Spilletids-ring (ytre) */}
      <circle cx={x} cy={y} r={24}
        fill="none"
        stroke={getPlaytimeRing()}
        strokeWidth={2}
        opacity={0.6}
        strokeDasharray="4 2"
      />

      {/* Lag-ring */}
      <circle cx={x} cy={y} r={21}
        fill={outerFill}
        stroke={isSelected ? '#38bdf8' : (isHome ? 'none' : (outerStroke ?? '#ef4444'))}
        strokeWidth={isSelected ? 2.5 : (isHome ? 0 : 2)} />

      {/* Rolle-sirkel */}
      <circle cx={x} cy={y} r={18} fill={meta.color} stroke={meta.border} strokeWidth={1.5} />

      {/* Nummer */}
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="12" fontWeight="800"
        style={{ pointerEvents: 'none' }}>
        {player.num}
      </text>

      {/* Navn */}
      {showName && (
        <text x={x} y={y + 33} textAnchor="middle" fill="white" fontSize="9.5"
          fontWeight="600" paintOrder="stroke" stroke="rgba(0,0,0,0.85)" strokeWidth={3}
          style={{ pointerEvents: 'none' }}>
          {player.name.length > 10 ? player.name.slice(0, 10) + '…' : player.name}
        </text>
      )}

      {/* Skade-emoji */}
      {isInjured && (
        <text x={x - 10} y={y - 14} fontSize="12" style={{ pointerEvents: 'none' }}>🩹</text>
      )}

      {/* Blyant-ikon */}
      {isActive && (
        <text x={x + 17} y={y - 15}
          fill={isSelected ? '#38bdf8' : 'rgba(255,255,255,0.5)'}
          fontSize="14"
          style={{ cursor: 'pointer', pointerEvents: 'all' }}
          onClick={e => { e.stopPropagation(); onSelect(); }}>
          ✎
        </text>
      )}
    </g>
  );
};

// ═══ Ball ════════════════════════════════════════════════════════

interface BallProps {
  position: { x: number; y: number };
  isDraggable: boolean;
  onPositionChange: (pos: { x: number; y: number }) => void;
}

export const Ball: React.FC<BallProps> = ({ position, isDraggable, onPositionChange }) => {
  const ref = useRef<SVGGElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDraggable) return;
    e.preventDefault(); e.stopPropagation();
    const svg = ref.current?.ownerSVGElement;
    if (!svg) return;
    const handleMove = (ev: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const scaleX = parseFloat(svg.getAttribute('viewBox')?.split(' ')[2] || '880') / rect.width;
      const scaleY = parseFloat(svg.getAttribute('viewBox')?.split(' ')[3] || '560') / rect.height;
      onPositionChange({
        x: Math.max(45, Math.min(835, (ev.clientX - rect.left) * scaleX)),
        y: Math.max(45, Math.min(515, (ev.clientY - rect.top) * scaleY)),
      });
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [isDraggable, onPositionChange]);

  const { x, y } = position;
  return (
    <g ref={ref} onMouseDown={handleMouseDown}
      style={{ cursor: isDraggable ? 'grab' : 'default' }}
      filter="url(#shadow)">
      <circle cx={x} cy={y} r={12} fill="white" />
      <circle cx={x} cy={y} r={12} fill="none" stroke="#ddd" strokeWidth={0.5} />
      {[{ dx: -4, dy: -4, r: 3.5 }, { dx: 4.5, dy: -2, r: 3 },
        { dx: 0, dy: 5, r: 3 }, { dx: -5, dy: 2.5, r: 2.5 }].map((o, i) => (
        <circle key={i} cx={x + o.dx} cy={y + o.dy} r={o.r} fill="#111" opacity={0.72} />
      ))}
    </g>
  );
};

// ═══ DrawingCanvas ════════════════════════════════════════════════

interface DrawingCanvasProps { drawing: Drawing; }

const ArrowHead: React.FC<{ p1: {x:number,y:number}; p2: {x:number,y:number}; color: string }> = ({ p1, p2, color }) => {
  const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const s = 14;
  return (
    <polygon fill={color} opacity={0.88}
      points={`${p2.x},${p2.y} ${p2.x - s * Math.cos(a - Math.PI / 6)},${p2.y - s * Math.sin(a - Math.PI / 6)} ${p2.x - s * Math.cos(a + Math.PI / 6)},${p2.y - s * Math.sin(a + Math.PI / 6)}`}
    />
  );
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ drawing }) => {
  const { pts, color } = drawing;
  if (pts.length < 2) return null;
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
