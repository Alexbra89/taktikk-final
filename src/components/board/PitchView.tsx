// src/components/board/PitchView.tsx
'use client';
import React from 'react';
import { TacticPhase, Drawing, Position, Player } from '@/types';
import { VW, VH } from '@/data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { HandballPitch } from './pitches/HandballPitch';
import { ROLE_META } from '@/data/roleInfo';

interface PitchViewProps {
  phase: TacticPhase;
  sport: string;
  isPlaying?: boolean;
  progressFrac?: number;
  displayBall?: Position;
  homePlayers: Player[];
  drawings: Drawing[];
  onFullscreen?: () => void;
  showFullscreenBtn?: boolean;
}

export const PitchView: React.FC<PitchViewProps> = ({
  phase,
  sport,
  isPlaying = false,
  progressFrac = 0,
  displayBall,
  homePlayers,
  drawings,
  onFullscreen,
  showFullscreenBtn = false,
}) => {
  const ball = displayBall ?? phase.ball;

  return (
    <div className="relative flex-1 min-h-0 flex flex-col items-stretch" style={{ padding: '4px' }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-full rounded-xl touch-none select-none shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="pitchShadow">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.5" />
          </filter>
          <filter id="playerGlow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.6" />
          </filter>
          <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="50" height="50">
            <rect width="50" height="50" fill="#1b5e2a"/>
            <rect width="50" height="25" fill="#1d6430"/>
          </pattern>
        </defs>
        <rect width={VW} height={VH} fill="url(#grassPattern)"/>
        {(sport === 'football' || sport === 'football7') && <FootballPitch />}
        {sport === 'handball' && <HandballPitch />}

        {/* Tegninger */}
        {drawings.map((d) => (
          d.pts && d.pts.length >= 2 && (
            <g key={d.id}>
              <polyline
                points={d.pts.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={d.color ?? '#f87171'} strokeWidth={3} fill="none"
                strokeLinecap="round" strokeLinejoin="round" />
              {(() => {
                const pts = d.pts;
                const p1 = pts[pts.length - 2];
                const p2 = pts[pts.length - 1];
                const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const s = 12;
                return (
                  <polygon fill={d.color ?? '#f87171'} opacity={0.88}
                    points={`${p2.x},${p2.y} ${p2.x-s*Math.cos(a-Math.PI/6)},${p2.y-s*Math.sin(a-Math.PI/6)} ${p2.x-s*Math.cos(a+Math.PI/6)},${p2.y-s*Math.sin(a+Math.PI/6)}`}
                  />
                );
              })()}
            </g>
          )
        ))}

        {/* Ball */}
        {ball && (
          <g filter="url(#playerGlow)">
            <circle cx={ball.x} cy={ball.y} r={11} fill="white" stroke="#ccc" strokeWidth={1}/>
            {[{dx:-3,dy:-3,r:3},{dx:3.5,dy:-1.5,r:2.5},{dx:0,dy:4,r:2.5},{dx:-4,dy:2,r:2}].map((o,i) => (
              <circle key={i} cx={ball.x+o.dx} cy={ball.y+o.dy} r={o.r} fill="#111" opacity={0.7}/>
            ))}
          </g>
        )}

        {/* Spillere */}
        {homePlayers.map(player => {
          const meta = ROLE_META[player.role as keyof typeof ROLE_META] ?? { color: '#64748b', label: player.role };
          const fill = meta.color;
          const { x, y } = player.position;
          if (player.isStarter === false || player.isOnField === false) return null;
          return (
            <g key={player.id} filter="url(#playerGlow)" opacity={player.injured ? 0.5 : 1}>
              {(player.minutesPlayed ?? 0) > 0 && (
                <circle cx={x} cy={y} r={24} fill="none"
                  stroke={(player.minutesPlayed ?? 0) > 60 ? '#ef4444' : (player.minutesPlayed ?? 0) > 30 ? '#f59e0b' : '#22c55e'}
                  strokeWidth={2} opacity={0.5} strokeDasharray="4 2" />
              )}
              <circle cx={x} cy={y} r={21} fill="rgba(255,255,255,0.9)"/>
              <circle cx={x} cy={y} r={18} fill={fill} stroke={fill} strokeWidth={1.5}/>
              {(player.specialRoles ?? []).includes('captain') && (
                <text x={x - 13} y={y - 13} fontSize={13} style={{ pointerEvents: 'none' }}>🪖</text>
              )}
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={11} fontWeight="800"
                fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
                {player.num}
              </text>
              {player.name && (
                <text x={x} y={y + 30} textAnchor="middle"
                  fill="white" fontSize={9} fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: 'none' }}
                  paintOrder="stroke" stroke="rgba(0,0,0,0.75)" strokeWidth={3}>
                  {player.name.length > 9 ? player.name.slice(0, 9) + '…' : player.name}
                </text>
              )}
              {player.injured && (
                <text x={x - 10} y={y - 14} fontSize={12} style={{ pointerEvents: 'none' }}>🩹</text>
              )}
              <title>{meta.label} · #{player.num} {player.name}</title>
            </g>
          );
        })}

        {isPlaying && (
          <rect x={32} y={VH - 14} rx={3} height={5}
            width={progressFrac * (VW - 64)} fill="#38bdf8" opacity={0.8}/>
        )}
      </svg>

      {showFullscreenBtn && onFullscreen && (
        <button
          onClick={onFullscreen}
          className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-[#0c1525]/80 backdrop-blur border border-[#1e3050] text-white hover:border-sky-500 transition-all shadow-lg flex items-center justify-center"
        >
          ⛶
        </button>
      )}
    </div>
  );
};

export default PitchView;