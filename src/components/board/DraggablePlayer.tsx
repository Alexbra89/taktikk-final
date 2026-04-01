'use client';

import React, { useRef, useCallback, useState } from 'react';
import { Player } from '@/types';
import { ROLE_META } from '@/data/roleInfo';
import { useAppStore } from '@/store/useAppStore';

interface DraggablePlayerProps {
  player: Player;
  isActive: boolean;
  isSelected?: boolean;
  awayTeamColor?: string;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSelect?: () => void;
  showName?: boolean;
  displayName?: string; // NY
}

const ROLE_COLORS: Record<string, string> = {
  keeper:     '#f59e0b',
  defender:   '#3b82f6',
  midfielder: '#22c55e',
  forward:    '#ef4444',
  winger:     '#a855f7',
  false9:     '#f97316',
  libero:     '#6366f1',
  playmaker:  '#ec4899',
};

// ─── Inline name editor rendered as SVG foreignObject ────────
const NameEditor: React.FC<{
  player: Player;
  svgX: number;
  svgY: number;
  onClose: () => void;
}> = ({ player, svgX, svgY, onClose }) => {
  const { playerAccounts, activePhaseIdx, updatePlayerField } = useAppStore();
  const [customName, setCustomName] = useState(player.name ?? '');

  const accounts = (playerAccounts as any[]).filter(
    (a: any) => a.team === (player.team ?? 'home')
  );
  const meta = ROLE_META[player.role as keyof typeof ROLE_META];

  const apply = (name: string) => {
    updatePlayerField(activePhaseIdx, player.id, { name });
    onClose();
  };

  // Keep editor within SVG bounds (VW=880, VH=560)
  const fW = 240, fH = 180;
  const fx = Math.max(5, Math.min(svgX - fW / 2, 875 - fW));
  const fy = svgY + 32;

  return (
    <foreignObject x={fx} y={fy} width={fW} height={fH} style={{ overflow: 'visible' }}>
      {/* @ts-ignore — xmlns needed for foreignObject children */}
      <div xmlns="http://www.w3.org/1999/xhtml"
        style={{
          background: '#0c1525',
          border: '1px solid rgba(56,189,248,0.4)',
          borderRadius: 12,
          padding: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          fontFamily: 'system-ui, sans-serif',
        }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Role header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
            background: meta?.color ?? '#555',
          }}/>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#4a6080',
            textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {meta?.label ?? player.role} · #{player.num}
          </span>
        </div>

        {/* Registered players dropdown */}
        {accounts.length > 0 && (
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) apply(e.target.value); }}
            style={{
              width: '100%', background: '#111c30', border: '1px solid #1e3050',
              borderRadius: 8, padding: '6px 8px', color: '#e2e8f0',
              fontSize: 12, marginBottom: 6, minHeight: 34, boxSizing: 'border-box',
            }}
          >
            <option value="">– Velg registrert spiller –</option>
            {accounts.map((a: any) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
        )}

        {/* Manual name input */}
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') apply(customName);
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Skriv navn..."
            autoFocus
            style={{
              flex: 1, background: '#111c30', border: '1px solid #1e3050',
              borderRadius: 8, padding: '5px 8px', color: '#e2e8f0',
              fontSize: 12, minHeight: 32, boxSizing: 'border-box',
            }}
          />
          <button
            onPointerDown={e => { e.stopPropagation(); apply(customName); }}
            style={{
              padding: '0 10px', background: 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.4)', borderRadius: 8,
              color: '#38bdf8', fontSize: 11, fontWeight: 700,
              minHeight: 32, cursor: 'pointer',
            }}>✓</button>
          <button
            onPointerDown={e => { e.stopPropagation(); onClose(); }}
            style={{
              padding: '0 8px', border: '1px solid #1e3050', borderRadius: 8,
              color: '#4a6080', fontSize: 11, minHeight: 32, cursor: 'pointer',
              background: 'transparent',
            }}>✕</button>
        </div>
      </div>
    </foreignObject>
  );
};

// ─── Main DraggablePlayer ────────────────────────────────────
export const DraggablePlayer: React.FC<DraggablePlayerProps> = ({
  player,
  isActive,
  isSelected = false,
  awayTeamColor,
  onPositionChange,
  onSelect,
  showName = true,
  displayName, // NY
}) => {
  const isDragging  = useRef(false);
  const hasMoved    = useRef(false);
  const svgRef      = useRef<SVGGElement>(null);
  const [showEditor, setShowEditor] = useState(false);

  const fillColor    = player.team === 'away' && awayTeamColor
    ? awayTeamColor
    : (ROLE_COLORS[player.role] ?? '#64748b');
  const outlineColor = player.team === 'away' ? '#1e293b' : '#ffffff';

  const getSVGCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current?.ownerSVGElement;
    if (!svg) return null;
    const pt  = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const { x, y } = pt.matrixTransform(ctm.inverse());
    return { x: Math.max(55, Math.min(825, x)), y: Math.max(55, Math.min(505, y)) };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    hasMoved.current   = false;
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [isActive]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !isActive) return;
    e.preventDefault();
    hasMoved.current = true;
    const coords = getSVGCoords(e.clientX, e.clientY);
    if (coords) onPositionChange(coords);
  }, [isActive, getSVGCoords, onPositionChange]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (!hasMoved.current && isActive) {
      setShowEditor(prev => !prev);
      if (onSelect) onSelect();
    }
    hasMoved.current = false;
  }, [isActive, onSelect]);

  const { x, y } = player.position;
  const r = 18;
  
  // Bruk displayName hvis tilgjengelig, ellers player.name
  const nameToShow = displayName || player.name || `#${player.num}`;
  const truncatedName = nameToShow.length > 10 ? nameToShow.slice(0, 10) + '…' : nameToShow;

  return (
    <>
      <g
        ref={svgRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: isActive ? 'grab' : 'default', userSelect: 'none', touchAction: 'none' }}
        filter="url(#dropShadow)"
      >
        {/* Større hit area for bedre dra-funksjon */}
        <circle cx={x} cy={y} r={28} fill="transparent" style={{ pointerEvents: 'all' }} />
        
        {isSelected && (
          <circle cx={x} cy={y} r={r + 7} fill="none"
            stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="5,3" opacity={0.9}/>
        )}
        <circle cx={x} cy={y} r={r + 2.5} fill={outlineColor} opacity={0.9}/>
        <circle cx={x} cy={y} r={r} fill={fillColor} stroke={fillColor} strokeWidth={1.5}/>
        <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={11} fontWeight="800"
          fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
          {player.num}
        </text>
        {showName && nameToShow && (
          <text x={x} y={y + r + 13} textAnchor="middle"
            fill="white" fontSize={9} fontWeight="600"
            fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}
            paintOrder="stroke" stroke="rgba(0,0,0,0.7)"
            strokeWidth={3} strokeLinejoin="round">
            {truncatedName}
          </text>
        )}
        <title>
          {ROLE_META[player.role as keyof typeof ROLE_META]?.label ?? player.role}
          {' · Trykk for å endre navn'}
        </title>
      </g>

      {showEditor && isActive && (
        <NameEditor
          player={player}
          svgX={x}
          svgY={y}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
};