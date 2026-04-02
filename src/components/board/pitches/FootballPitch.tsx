'use client';
import React from 'react';
import { VW, VH } from '../../../data/formations';

export const FootballPitch: React.FC = () => {
  const m = 32;
  const W = VW, H = VH;
  const s = 'rgba(255,255,255,0.78)';
  const sw = 1.8;

  // Straffebue parametere
  const penaltySpotX = m + 86;
  const penaltySpotY = H / 2;
  const arcRadius = 68;
  const startAngle = -0.92;
  const endAngle = 0.92;

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
      
      {/* Venstre halvbue (straffebue) - KORREKT HALVSIRKEL */}
      <path
        d={`M ${penaltySpotX + arcRadius * Math.cos(startAngle)} ${penaltySpotY + arcRadius * Math.sin(startAngle)}
            A ${arcRadius} ${arcRadius} 0 0 1 ${penaltySpotX + arcRadius * Math.cos(endAngle)} ${penaltySpotY + arcRadius * Math.sin(endAngle)}`}
      />
      
      {/* Høyre halvbue (straffebue) - KORREKT HALVSIRKEL */}
      <path
        d={`M ${W - m - 86 + arcRadius * Math.cos(Math.PI - startAngle)} ${H / 2 + arcRadius * Math.sin(Math.PI - startAngle)}
            A ${arcRadius} ${arcRadius} 0 0 0 ${W - m - 86 + arcRadius * Math.cos(Math.PI - endAngle)} ${H / 2 + arcRadius * Math.sin(Math.PI - endAngle)}`}
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