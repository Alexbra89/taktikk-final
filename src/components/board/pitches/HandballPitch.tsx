'use client';
import React from 'react';
import { VW, VH } from '../../../data/formations';

const S = 'rgba(255,255,255,0.78)';

export const HandballPitch: React.FC = () => {
  const m = 32, W = VW, H = VH;
  return (
    <g stroke={S} strokeWidth={1.8} fill="none">
      <rect x={m} y={m} width={W - m * 2} height={H - m * 2} />
      <line x1={W / 2} y1={m} x2={W / 2} y2={H - m} />
      <path d={`M${m} ${H/2-122} Q${m+175} ${H/2-122} ${m+175} ${H/2} Q${m+175} ${H/2+122} ${m} ${H/2+122}`} />
      <path d={`M${W-m} ${H/2-122} Q${W-m-175} ${H/2-122} ${W-m-175} ${H/2} Q${W-m-175} ${H/2+122} ${W-m} ${H/2+122}`} />
      <path d={`M${m} ${H/2-168} Q${m+242} ${H/2-168} ${m+242} ${H/2} Q${m+242} ${H/2+168} ${m} ${H/2+168}`} strokeDasharray="9,6" />
      <path d={`M${W-m} ${H/2-168} Q${W-m-242} ${H/2-168} ${W-m-242} ${H/2} Q${W-m-242} ${H/2+168} ${W-m} ${H/2+168}`} strokeDasharray="9,6" />
      <circle cx={m + 135} cy={H / 2} r={5} fill={S} />
      <circle cx={W - m - 135} cy={H / 2} r={5} fill={S} />
      <rect x={m - 26} y={H / 2 - 48} width={26} height={96} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      <rect x={W - m} y={H / 2 - 48} width={26} height={96} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
    </g>
  );
};