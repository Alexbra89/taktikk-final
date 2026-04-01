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
      {/* Midtsirkel + punkt */}
      <circle cx={W / 2} cy={H / 2} r={68} />
      <circle cx={W / 2} cy={H / 2} r={4} fill={s} />
      
      {/* Venstre 16m */}
      <rect x={m} y={H / 2 - 110} width={112} height={220} />
      {/* Høyre 16m */}
      <rect x={W - m - 112} y={H / 2 - 110} width={112} height={220} />
      
      {/* Venstre 5m */}
      <rect x={m} y={H / 2 - 54} width={44} height={108} />
      {/* Høyre 5m */}
      <rect x={W - m - 44} y={H / 2 - 54} width={44} height={108} />
      
      {/* Straffepunkter */}
      <circle cx={m + 86} cy={H / 2} r={3.5} fill={s} />
      <circle cx={W - m - 86} cy={H / 2} r={3.5} fill={s} />
      
      {/* Straffebue venstre - bue utover (riktig vei) */}
      <path
        d={`M ${m + 86 + 68 * Math.cos(-0.93)} ${H / 2 + 68 * Math.sin(-0.93)}
            A 68 68 0 0 1 ${m + 86 + 68 * Math.cos(0.93)} ${H / 2 + 68 * Math.sin(0.93)}`}
      />
      {/* Straffebue høyre - bue utover (riktig vei) */}
      <path
        d={`M ${W - m - 86 + 68 * Math.cos(Math.PI - 0.93)} ${H / 2 + 68 * Math.sin(Math.PI - 0.93)}
            A 68 68 0 0 0 ${W - m - 86 + 68 * Math.cos(Math.PI + 0.93)} ${H / 2 + 68 * Math.sin(Math.PI + 0.93)}`}
      />
      
      {/* Mål venstre */}
      <rect x={m - 22} y={H / 2 - 36} width={22} height={72}
        fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      {/* Mål høyre */}
      <rect x={W - m} y={H / 2 - 36} width={22} height={72}
        fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      
      {/* Hjørne-bueer */}
      {[
        [m, m, 0, Math.PI / 2],
        [W - m, m, Math.PI / 2, Math.PI],
        [m, H - m, -Math.PI / 2, 0],
        [W - m, H - m, Math.PI, 1.5 * Math.PI],
      ].map(([cx, cy, a1, a2], i) => {
        const r = 10;
        const x1 = (cx as number) + r * Math.cos(a1 as number);
        const y1 = (cy as number) + r * Math.sin(a1 as number);
        const x2 = (cx as number) + r * Math.cos(a2 as number);
        const y2 = (cy as number) + r * Math.sin(a2 as number);
        return <path key={i} d={`M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`} />;
      })}
    </g>
  );
};