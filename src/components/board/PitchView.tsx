'use client';

// ─────────────────────────────────────────────────────────────
//  PitchView  –  ren visningskomponent (RESPONSIV OPPDATERT)
//
//  DRAG-HÅNDTERING ER FJERNET HER.
//  All drag (pointer events) håndteres i TacticBoard v8 direkte
//  på SVG-elementene. PitchView brukes KUN for read-only-visning,
//  f.eks. i PlayerHome (ReadOnlyTacticBoard) eller print-view.
//
//  Trenger du interaktivt brett? Bruk <TacticBoard> direkte.
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { TacticPhase, Drawing, Position, Player } from '@/types';
import { VW, VH } from '@/data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { HandballPitch } from './pitches/HandballPitch';
import { ROLE_META } from '@/data/roleInfo';

// ── Glassmorphism SVG-defs (gjenbrukes) ──────────────────────
const PitchDefs: React.FC = () => (
  <defs>
    <filter id="pitchShadow">
      <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.5"/>
    </filter>
    <filter id="playerGlow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.55"/>
    </filter>
    <filter id="dropShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.45"/>
    </filter>
    <filter id="jerseyDrop">
      <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.7"/>
    </filter>
    <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="50" height="50">
      <rect width="50" height="50" fill="#1a5c28"/>
      <rect width="50" height="25" fill="#1c6229"/>
    </pattern>
    <radialGradient id="pitchVignette" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stopColor="transparent"/>
      <stop offset="100%" stopColor="rgba(0,0,0,0.3)"/>
    </radialGradient>
  </defs>
);

// ── Trøye-ikon (read-only versjon) ───────────────────────────
const ReadOnlyJersey: React.FC<{
  player: Player;
  selected?: boolean;
}> = ({ player, selected }) => {
  const meta = ROLE_META[player.role as keyof typeof ROLE_META];
  const color = meta?.color ?? '#64748b';
  const { x, y } = player.position;
  const w=38, h=34, sh=9, nw=10, nh=5, tx=x-w/2, ty=y-h/2;

  return (
    <g filter="url(#jerseyDrop)" opacity={player.injured ? 0.55 : 1}>
      {selected && (
        <>
          <circle cx={x} cy={y} r={36} fill={color} opacity={0.08}/>
          <circle cx={x} cy={y} r={29} fill="none" stroke="#38bdf8"
            strokeWidth={2} strokeDasharray="6,3" opacity={0.9}/>
        </>
      )}
      <path d={`M ${tx+nw},${ty} L ${tx},${ty+sh} L ${tx+6},${ty+sh+4}
          L ${tx+6},${ty+h} L ${tx+w-6},${ty+h}
          L ${tx+w-6},${ty+sh+4} L ${tx+w},${ty+sh}
          L ${tx+w-nw},${ty} Q ${x},${ty-nh} ${tx+nw},${ty} Z`}
        fill={player.injured ? '#334155' : color}
        stroke={selected?'#38bdf8':'rgba(255,255,255,0.18)'}
        strokeWidth={selected?1.6:0.7}
      />
      {/* Glassmorphism highlight */}
      <path d={`M ${tx+nw+2},${ty+1} L ${tx+2},${ty+sh-1} L ${tx+7},${ty+sh+3} L ${tx+7},${ty+h*0.42} Q ${x},${ty-nh+4} ${tx+w-nw-2},${ty+1} Z`}
        fill="rgba(255,255,255,0.07)" style={{pointerEvents:'none'}}/>
      <text x={x} y={y+4} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={13} fontWeight="900" fontFamily="system-ui,sans-serif"
        paintOrder="stroke" stroke="rgba(0,0,0,0.6)" strokeWidth={2.5}
        style={{pointerEvents:'none'}}>{player.num}</text>
      {player.name && (
        <text x={x} y={y+30} textAnchor="middle"
          fill="rgba(255,255,255,0.9)" fontSize={9} fontWeight="600"
          fontFamily="system-ui,sans-serif" style={{pointerEvents:'none'}}
          paintOrder="stroke" stroke="rgba(0,0,0,0.8)" strokeWidth={3}>
          {player.name.length>10?player.name.slice(0,10)+'…':player.name}
        </text>
      )}
      {/* Spesialroller */}
      {player.injured && <text x={x+15} y={y-13} fontSize={11} style={{pointerEvents:'none'}}>🩹</text>}
      {(player.specialRoles??[]).includes('captain') && <text x={x-19} y={y-13} fontSize={11} style={{pointerEvents:'none'}}>🪖</text>}
    </g>
  );
};

// ─── Eksportert komponent ─────────────────────────────────────
interface PitchViewProps {
  phase:             TacticPhase;
  sport:             string;
  homePlayers:       Player[];
  drawings:          Drawing[];
  displayBall?:      Position;
  isPlaying?:        boolean;
  progressFrac?:     number;
  selectedPlayerId?: string | null;
  onSelectPlayer?:   (id: string | null) => void;
  showFullscreenBtn?: boolean;
  onFullscreen?:     () => void;
}

export const PitchView: React.FC<PitchViewProps> = ({
  phase, sport, homePlayers, drawings,
  displayBall, isPlaying = false, progressFrac = 0,
  selectedPlayerId, onSelectPlayer,
  showFullscreenBtn = false, onFullscreen,
}) => {
  const ball = displayBall ?? phase.ball;

  return (
    // FIX 4: Wrapper bruker IKKE overflow-hidden og IKKE touch-action none.
    // Dette er en read-only visning – pinch-zoom skal alltid fungere her.
    <div
      className="relative w-full h-full min-h-0 flex items-center justify-center"
      style={{
        padding: '4px',
        // Tillat pinch-zoom og scroll i read-only-visning
        touchAction: 'pan-x pan-y pinch-zoom',
      }}
    >
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-full max-h-full object-contain select-none"
        style={{
          boxShadow: '0 0 60px rgba(0,0,0,0.9)',
          display: 'block',
          // FIX 4: Kun touch-action none når komponenten er interaktiv (har onSelectPlayer).
          // Ellers tillat pinch-zoom.
          touchAction: onSelectPlayer ? 'none' : 'pan-x pan-y pinch-zoom',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <PitchDefs/>

        <rect width={VW} height={VH} fill="url(#grassPattern)"/>
        <rect width={VW} height={VH} fill="url(#pitchVignette)"/>

        {(sport==='football'||sport==='football7'||sport==='football9') && <FootballPitch/>}
        {sport==='handball' && <HandballPitch/>}

        {/* Tegninger */}
        {drawings.map(d => d.pts && d.pts.length >= 2 && (
          <g key={d.id}>
            <polyline
              points={d.pts.map(p=>`${p.x},${p.y}`).join(' ')}
              stroke={d.color??'#f87171'} strokeWidth={3} fill="none"
              strokeLinecap="round" strokeLinejoin="round"/>
            {(() => {
              const pts=d.pts, p1=pts[pts.length-2], p2=pts[pts.length-1];
              const a=Math.atan2(p2.y-p1.y, p2.x-p1.x), s=12;
              return (
                <polygon fill={d.color??'#f87171'} opacity={0.88}
                  points={`${p2.x},${p2.y} ${p2.x-s*Math.cos(a-Math.PI/6)},${p2.y-s*Math.sin(a-Math.PI/6)} ${p2.x-s*Math.cos(a+Math.PI/6)},${p2.y-s*Math.sin(a+Math.PI/6)}`}/>
              );
            })()}
          </g>
        ))}

        {/* Ball */}
        {ball && (
          <g filter="url(#playerGlow)">
            <circle cx={ball.x} cy={ball.y} r={12} fill="white" stroke="#ddd" strokeWidth={0.8}/>
            <ellipse cx={ball.x-3} cy={ball.y-4} rx={4} ry={3} fill="rgba(255,255,255,0.4)" transform={`rotate(-25,${ball.x},${ball.y})`}/>
            {[{dx:-3,dy:-3,r:3},{dx:3.5,dy:-1.5,r:2.5},{dx:0,dy:4,r:2.5},{dx:-4,dy:2,r:2}].map((o,i)=>(
              <circle key={i} cx={ball.x+o.dx} cy={ball.y+o.dy} r={o.r} fill="#111" opacity={0.65}/>
            ))}
          </g>
        )}

        {/* Read-only spillere */}
        {homePlayers.map(player => {
          if (player.isStarter===false||player.isOnField===false) return null;
          return (
            <g key={player.id}
              style={{ cursor: onSelectPlayer ? 'pointer' : 'default' }}
              onClick={() => onSelectPlayer?.(selectedPlayerId===player.id ? null : player.id)}>
              <ReadOnlyJersey player={player} selected={selectedPlayerId===player.id}/>
            </g>
          );
        })}

        {/* Progressbar */}
        {isPlaying && (
          <rect x={32} y={VH-14} rx={3} height={5}
            width={progressFrac*(VW-64)} fill="#38bdf8" opacity={0.8}/>
        )}
      </svg>

      {showFullscreenBtn && onFullscreen && (
        <button
          onClick={onFullscreen}
          style={{
            background: 'rgba(5,10,28,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56,189,248,0.15)',
          }}
          className="absolute top-4 left-4 h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-white hover:border-sky-400/40 hover:text-sky-400 transition-all shadow-2xl flex items-center justify-center z-20"
          title="Fullskjerm (F)"
        >
          <span style={{ fontSize: '16px' }} className="sm:text-[18px]">⛶</span>
        </button>
      )}
    </div>
  );
};

export default PitchView;
