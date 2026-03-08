'use client';
import React from 'react';
import { VW, VH } from '../../../data/formations';

const S = 'rgba(255,255,255,0.78)';

export const FloorballPitch: React.FC = () => {
  const m = 32, W = VW, H = VH;
  return (
    <g stroke={S} strokeWidth={1.8} fill="none">
      <rect x={m} y={m} width={W - m * 2} height={H - m * 2} rx={26} />
      <line x1={W / 2} y1={m} x2={W / 2} y2={H - m} />
      <circle cx={W / 2} cy={H / 2} r={46} />
      <circle cx={W / 2} cy={H / 2} r={4} fill={S} />
      {([[178, 155], [178, 405], [W - 178, 155], [W - 178, 405]] as [number,number][]).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={17} />
      ))}
      <rect x={m - 22} y={H / 2 - 34} width={22} height={68} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      <rect x={W - m} y={H / 2 - 34} width={22} height={68} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
    </g>
  );
};