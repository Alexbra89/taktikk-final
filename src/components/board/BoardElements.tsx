'use client';
import React, { useRef, useCallback, useState } from 'react';
import { Player, Drawing } from '../../types';
import { ROLE_META } from '../../data/roleInfo';
import { useAppStore } from '../../store/useAppStore';

// ═══ DraggablePlayer ══════════════════════════════════════════════

interface DraggablePlayerProps {
  player: Player;
  isActive: boolean;
  isSelected: boolean;
  awayTeamColor?: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onSelect: () => void;
  showName?: boolean;
}

export const DraggablePlayer: React.FC<DraggablePlayerProps> = ({
  player, isActive, isSelected, awayTeamColor, onPositionChange, onSelect, showName = true,
}) => {
  const groupRef   = useRef<SVGGElement>(null);
  const isDragging = useRef(false);
  const hasMoved   = useRef(false);
  const rafRef     = useRef<number | null>(null);
  const pendingPos = useRef<{ x: number; y: number } | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const meta      = ROLE_META[player.role] ?? ROLE_META['midfielder'];
  const isHome    = player.team === 'home';
  const fillColor = isHome ? meta.color : (awayTeamColor ?? '#ef4444');
  const ringFill  = isHome ? 'rgba(255,255,255,0.92)' : 'rgba(15,25,40,0.92)';
  const ringStroke = isHome ? 'none' : (awayTeamColor ?? '#ef4444');

  const toSVGCoords = useCallback((clientX: number, clientY: number) => {
    const svg = groupRef.current?.ownerSVGElement;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const vbW  = parseFloat(svg.getAttribute('viewBox')?.split(' ')[2] ?? '880');
    const vbH  = parseFloat(svg.getAttribute('viewBox')?.split(' ')[3] ?? '560');
    return {
      x: Math.max(45, Math.min(vbW - 45, ((clientX - rect.left) / rect.width)  * vbW)),
      y: Math.max(45, Math.min(vbH - 45, ((clientY - rect.top)  / rect.height) * vbH)),
    };
  }, []);

  // RAF-throttled position update — prevents flooding store/Supabase on every touch event
  const flushPosition = useCallback(() => {
    if (pendingPos.current) {
      onPositionChange(pendingPos.current);
      pendingPos.current = null;
    }
    rafRef.current = null;
  }, [onPositionChange]);

  const scheduleUpdate = useCallback((pos: { x: number; y: number }) => {
    pendingPos.current = pos;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(flushPosition);
    }
  }, [flushPosition]);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (!isActive) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    hasMoved.current   = false;
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
  }, [isActive]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (!isDragging.current || !isActive) return;
    e.preventDefault();
    const c = toSVGCoords(e.clientX, e.clientY);
    if (!c) return;
    hasMoved.current = true;
    scheduleUpdate(c);
  }, [isActive, toSVGCoords, scheduleUpdate]);

  const onPointerUp = useCallback((_e: React.PointerEvent<SVGGElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // Flush any pending position immediately on release
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingPos.current) {
      onPositionChange(pendingPos.current);
      pendingPos.current = null;
    }
    if (!hasMoved.current) {
      setShowEditor(prev => !prev);
      onSelect();
    }
    hasMoved.current = false;
  }, [onSelect, onPositionChange]);

  const { x, y } = player.position;

  const playtimeColor = () => {
    const min = player.minutesPlayed ?? 0;
    if (min > 60) return '#ef4444';
    if (min > 30) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <>
      <g
        ref={groupRef}
        data-player="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: isActive ? 'grab' : 'default', userSelect: 'none', touchAction: 'none' }}
        filter="url(#dropShadow)"
        opacity={player.injured ? 0.45 : 1}
      >
        {/* REDUSERT hit area – fra 38 til 24, så man må treffe selve spilleren */}
        <circle cx={x} cy={y} r={24} fill="transparent" style={{ pointerEvents: 'all' }} />
        
        {/* Playtime ring — only shown if minutes logged */}
        {(player.minutesPlayed ?? 0) > 0 && (
          <circle cx={x} cy={y} r={24} fill="none"
            stroke={playtimeColor()} strokeWidth={2}
            opacity={0.5} strokeDasharray="4 2" />
        )}

        {/* Team ring */}
        <circle cx={x} cy={y} r={21}
          fill={ringFill}
          stroke={isSelected ? '#38bdf8' : (isHome ? 'none' : ringStroke)}
          strokeWidth={isSelected ? 2.5 : (isHome ? 0 : 2)} />

        {/* Role fill */}
        <circle cx={x} cy={y} r={18}
          fill={fillColor} stroke={meta.border} strokeWidth={1.5} />

        {/* Number */}
        <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="12" fontWeight="800"
          style={{ pointerEvents: 'none' }}>
          {player.num}
        </text>

        {/* Name */}
        {showName && player.name && (
          <text x={x} y={y + 33} textAnchor="middle" fill="white" fontSize="9.5"
            fontWeight="600" paintOrder="stroke"
            stroke="rgba(0,0,0,0.85)" strokeWidth={3}
            style={{ pointerEvents: 'none' }}>
            {player.name.length > 10 ? player.name.slice(0, 10) + '…' : player.name}
          </text>
        )}

        {/* Injury badge */}
        {player.injured && (
          <text x={x - 10} y={y - 14} fontSize="12" style={{ pointerEvents: 'none' }}>🩹</text>
        )}

        {/* Edit pencil — only visible when active */}
        {isActive && (
          <text x={x + 17} y={y - 15}
            fill={isSelected ? '#38bdf8' : 'rgba(255,255,255,0.5)'}
            fontSize="14"
            style={{ cursor: 'pointer', pointerEvents: 'all' }}>
            ✎
          </text>
        )}
      </g>

      {showEditor && isActive && (
        <NameEditor player={player} svgX={x} svgY={y} onClose={() => setShowEditor(false)} />
      )}
    </>
  );
};

// ═══ NameEditor (uendret) ══════════════════════════════════════════════

const NameEditor: React.FC<{
  player: Player; svgX: number; svgY: number; onClose: () => void;
}> = ({ player, svgX, svgY, onClose }) => {
  const { playerAccounts, activePhaseIdx, updatePlayerField } = useAppStore();
  const [customName, setCustomName] = useState(player.name ?? '');

  const accounts = (playerAccounts as any[]).filter((a: any) => a.team === (player.team ?? 'home'));
  const meta = ROLE_META[player.role] ?? ROLE_META['midfielder'];

  const apply = (name: string) => {
    updatePlayerField(activePhaseIdx, player.id, { name });
    onClose();
  };

  const fW = 240;
  const fx = Math.max(5, Math.min(svgX - fW / 2, 875 - fW));
  const fy = svgY + 32;

  return (
    <foreignObject x={fx} y={fy} width={fW} height={190} style={{ overflow: 'visible' }}>
      {/* @ts-ignore */}
      <div xmlns="http://www.w3.org/1999/xhtml"
        onPointerDown={(e: any) => e.stopPropagation()}
        style={{
          background: '#0c1525', border: '1px solid rgba(56,189,248,0.45)',
          borderRadius: 12, padding: '10px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.85)',
          fontFamily: 'system-ui, sans-serif',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#4a6080', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {meta.label} · #{player.num}
          </span>
          <button onPointerDown={(e: any) => { e.stopPropagation(); onClose(); }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#4a6080', fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>

        {accounts.length > 0 && (
          <select defaultValue=""
            onChange={(e: any) => { if (e.target.value) apply(e.target.value); }}
            style={{
              width: '100%', background: '#111c30', border: '1px solid #1e3050',
              borderRadius: 8, padding: '6px 8px', color: '#e2e8f0',
              fontSize: 12, marginBottom: 6, minHeight: 36, boxSizing: 'border-box' as const,
            }}>
            <option value="">– Velg registrert spiller –</option>
            {accounts.map((a: any) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
        )}

        <div style={{ display: 'flex', gap: 5 }}>
          <input value={customName}
            onChange={(e: any) => setCustomName(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') apply(customName);
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Skriv navn..."
            autoFocus
            style={{
              flex: 1, background: '#111c30', border: '1px solid #1e3050',
              borderRadius: 8, padding: '5px 8px', color: '#e2e8f0',
              fontSize: 12, minHeight: 34, boxSizing: 'border-box' as const,
            }} />
          <button onPointerDown={(e: any) => { e.stopPropagation(); apply(customName); }}
            style={{
              padding: '0 10px', background: 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.4)',
              borderRadius: 8, color: '#38bdf8',
              fontSize: 11, fontWeight: 700, minHeight: 34, cursor: 'pointer',
            }}>✓</button>
        </div>
      </div>
    </foreignObject>
  );
};

// ═══ Ball (uendret) ════════════════════════════════════════════════════

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
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
  }, [isDraggable]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (!isDragging.current) return;
    e.preventDefault();
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
      style={{ cursor: isDraggable ? 'grab' : 'default', touchAction: 'none' }}
      filter="url(#dropShadow)">
      {/* Redusert hit area for ball – fra 32 til 24 */}
      <circle cx={x} cy={y} r={24} fill="transparent" style={{ pointerEvents: 'all' }} />
      <circle cx={x} cy={y} r={12} fill="white" />
      <circle cx={x} cy={y} r={12} fill="none" stroke="#ddd" strokeWidth={0.5} />
      {[
        { dx: -4, dy: -4, r: 3.5 }, { dx: 4.5, dy: -2, r: 3 },
        { dx: 0, dy: 5, r: 3 },     { dx: -5, dy: 2.5, r: 2.5 },
      ].map((o, i) => (
        <circle key={i} cx={x + o.dx} cy={y + o.dy} r={o.r} fill="#111" opacity={0.72} />
      ))}
    </g>
  );
};

// ═══ DrawingCanvas (uendret) ════════════════════════════════════════════════

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