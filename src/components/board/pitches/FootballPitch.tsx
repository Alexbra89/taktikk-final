'use client';
import React from 'react';
import { VW, VH } from '../../../data/formations';

export const FootballPitch: React.FC = () => {
  const m = 32;
  const W = VW, H = VH;
  const s = 'rgba(255,255,255,0.78)';
  const sw = 1.8;

  return (
    <g stroke={s} strokeWidth={sw} fill="none">
      {/* Ytre ramme */}
      <rect x={m} y={m} width={W - m * 2} height={H - m * 2} />
      
      {/* Midtlinje */}
      <line x1={W / 2} y1={m} x2={W / 2} y2={H - m} />
      
      {/* Midtsirkel */}
      <circle cx={W / 2} cy={H / 2} r={68} />
      <circle cx={W / 2} cy={H / 2} r={4} fill={s} />
      
      {/* Venstre 16-meter (straffefelt) */}
      <rect x={m} y={H / 2 - 110} width={112} height={220} />
      
      {/* Høyre 16-meter (straffefelt) */}
      <rect x={W - m - 112} y={H / 2 - 110} width={112} height={220} />
      
      {/* Venstre 5-meter (keeperfelt) */}
      <rect x={m} y={H / 2 - 54} width={44} height={108} />
      
      {/* Høyre 5-meter (keeperfelt) */}
      <rect x={W - m - 44} y={H / 2 - 54} width={44} height={108} />
      
      {/* Straffepunkter */}
      <circle cx={m + 86} cy={H / 2} r={3.5} fill={s} />
      <circle cx={W - m - 86} cy={H / 2} r={3.5} fill={s} />
      
      {/* Venstre halvbue (straffebue) - KORREKT */}
      <path
        d={`M ${m + 86 + 68 * Math.cos(-0.93)} ${H / 2 + 68 * Math.sin(-0.93)}
            A 68 68 0 0 1 ${m + 86 + 68 * Math.cos(0.93)} ${H / 2 + 68 * Math.sin(0.93)}`}
        stroke={s}
        strokeWidth={sw}
        fill="none"
      />
      
      {/* Høyre halvbue (straffebue) - KORREKT */}
      <path
        d={`M ${W - m - 86 + 68 * Math.cos(Math.PI - 0.93)} ${H / 2 + 68 * Math.sin(Math.PI - 0.93)}
            A 68 68 0 0 0 ${W - m - 86 + 68 * Math.cos(Math.PI + 0.93)} ${H / 2 + 68 * Math.sin(Math.PI + 0.93)}`}
        stroke={s}
        strokeWidth={sw}
        fill="none"
      />
      
      {/* Mål venstre */}
      <rect x={m - 22} y={H / 2 - 36} width={22} height={72}
        fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      
      {/* Mål høyre */}
      <rect x={W - m} y={H / 2 - 36} width={22} height={72}
        fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      
      {/* Hjørnebuer */}
      <path d={`M ${m} ${m} A 10 10 0 0 1 ${m + 10} ${m}`} />
      <path d={`M ${W - m} ${m} A 10 10 0 0 1 ${W - m - 10} ${m}`} />
      <path d={`M ${m} ${H - m} A 10 10 0 0 1 ${m + 10} ${H - m}`} />
      <path d={`M ${W - m} ${H - m} A 10 10 0 0 1 ${W - m - 10} ${H - m}`} />
    </g>
  );
};