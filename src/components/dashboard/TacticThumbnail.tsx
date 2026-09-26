'use client';
import React from 'react';
import type { TacticPhase } from '@/types';
import { VW, VH } from '@/data/formations';
import { FootballPitch } from '@/components/board/pitches/FootballPitch';

// Forhåndsvisning av en fase: bane, egne spillere, motstandere og ball.
// Bare visning – ingen drag. viewBox har en marg, så den skiller seg
// fra selve brettet (svg[viewBox="0 0 880 560"]) i røyktestene.

export const TacticThumbnail: React.FC<{ phase: TacticPhase; className?: string }> = ({ phase, className }) => (
  <svg viewBox={`-8 -8 ${VW + 16} ${VH + 16}`} className={className} role="img" aria-label={`Forhåndsvisning av ${phase.name}`}>
    <rect x={-8} y={-8} width={VW + 16} height={VH + 16} rx={28} style={{ fill: 'rgb(var(--k-pitch))' }} />
    <FootballPitch />
    {(phase.items ?? []).filter(it => it.type === 'opponent').map(it => (
      <circle key={it.id} cx={it.position.x} cy={it.position.y} r={15} style={{ fill: 'rgb(var(--k-opponent))' }} />
    ))}
    {phase.players.map(p => (
      <g key={p.id} transform={`translate(${p.position.x} ${p.position.y})`}>
        <circle r={17} style={{ fill: 'rgb(var(--k-signal))' }} />
        <text textAnchor="middle" dy="0.36em" fontSize={17} fontWeight={700}
          className="font-mono" style={{ fill: 'rgb(var(--k-signal-fg))' }}>{p.num}</text>
      </g>
    ))}
    <circle cx={phase.ball.x} cy={phase.ball.y} r={8} fill="#fff" stroke="#111" strokeWidth={2} />
  </svg>
);
