// src/components/board/PitchView.tsx
'use client';

import React from 'react';
import { TacticPhase, Drawing, Position, Player } from '@/types';
import { VW, VH } from '@/data/formations';
import { FootballPitch } from './pitches/FootballPitch';
import { HandballPitch } from './pitches/HandballPitch';
import { ROLE_META } from '@/data/roleInfo';
import { DraggablePlayer } from './DraggablePlayer';
import { useAppStore } from '@/store/useAppStore';

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
  
  // Henter både funksjonen og den nåværende indeks-posisjonen fra storen
  const updatePlayerPosition = useAppStore((s) => s.updatePlayerPosition);
  const activePhaseIdx = useAppStore((s) => s.activePhaseIdx);

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
          <filter id="dropShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5" />
          </filter>
          <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="50" height="50">
            <rect width="50" height="50" fill="#1b5e2a"/>
            <rect width="50" height="25" fill="#1d6430"/>
          </pattern>
        </defs>

        {/* Bane-bakgrunn */}
        <rect width={VW} height={VH} fill="url(#grassPattern)"/>
        {(sport === 'football' || sport === 'football7') && <FootballPitch />}
        {sport === 'handball' && <HandballPitch />}

        {/* Tegninger (Piler/Linjer) */}
        {drawings.map((d) => (
          d.pts && d.pts.length >= 2 && (
            <g key={d.id}>
              <polyline
                points={d.pts.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={d.color ?? '#f87171'} 
                strokeWidth={3} 
                fill="none"
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {(() => {
                const pts = d.pts;
                const p1 = pts[pts.length - 2];
                const p2 = pts[pts.length - 1];
                const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const s = 12;
                return (
                  <polygon 
                    fill={d.color ?? '#f87171'} 
                    opacity={0.88}
                    points={`${p2.x},${p2.y} ${p2.x-s*Math.cos(a-Math.PI/6)},${p2.y-s*Math.sin(a-Math.PI/6)} ${p2.x-s*Math.cos(a+Math.PI/6)},${p2.y-s*Math.sin(a+Math.PI/6)}`}
                  />
                );
              })()}
            </g>
          )
        ))}

        {/* Ballen */}
        {ball && (
          <g filter="url(#playerGlow)">
            <circle cx={ball.x} cy={ball.y} r={11} fill="white" stroke="#ccc" strokeWidth={1}/>
            {[
              {dx:-3, dy:-3, r:3},
              {dx:3.5, dy:-1.5, r:2.5},
              {dx:0, dy:4, r:2.5},
              {dx:-4, dy:2, r:2}
            ].map((o, i) => (
              <circle key={i} cx={ball.x+o.dx} cy={ball.y+o.dy} r={o.r} fill="#111" opacity={0.7}/>
            ))}
          </g>
        )}

        {/* Spillere - Nå med korrekt indeks-oppdatering */}
        {homePlayers.map(player => {
          // Viser kun spillere som faktisk er på banen/i startoppstillingen
          if (player.isStarter === false || player.isOnField === false) return null;
          
          return (
            <DraggablePlayer
              key={player.id}
              player={player}
              isActive={!isPlaying} // Kun dra når animasjonen står stille
              onPositionChange={(newPos) => {
                // VIKTIG: Bruker activePhaseIdx her for å lagre i riktig fase
                updatePlayerPosition(activePhaseIdx, player.id, newPos);
              }}
              showName={true}
            />
          );
        })}

        {/* Progressbar for avspilling */}
        {isPlaying && (
          <rect 
            x={32} 
            y={VH - 14} 
            rx={3} 
            height={5}
            width={progressFrac * (VW - 64)} 
            fill="#38bdf8" 
            opacity={0.8}
          />
        )}
      </svg>

      {/* Fullskjerm-knapp flyttet til bunnen */}
      {showFullscreenBtn && onFullscreen && (
        <button
          onClick={onFullscreen}
          className="absolute bottom-6 right-6 h-12 w-12 rounded-xl bg-[#0c1525]/90 backdrop-blur border border-[#1e3050] text-white hover:border-sky-500 hover:text-sky-400 transition-all shadow-2xl flex items-center justify-center z-50"
          title="Fullskjerm"
        >
          <span style={{ fontSize: '20px' }}>⛶</span>
        </button>
      )}
    </div>
  );
};

export default PitchView;