import React from 'react';

export const SwapOverlay = React.memo<{x:number;y:number}>(({ x,y }) => (
  <g style={{pointerEvents:'none'}}>
    <circle cx={x} cy={y} r={40}
      fill="rgba(251,191,36,0.06)" stroke="#fbbf24"
      strokeWidth={2} strokeDasharray="8,4" opacity={0.9}/>
    <circle cx={x} cy={y} r={16} fill="rgba(251,191,36,0.18)"/>
    <circle cx={x} cy={y} r={15} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1}/>
    <text x={x} y={y+1.5} textAnchor="middle" dominantBaseline="middle"
      fontSize={16} fill="#fbbf24" fontWeight="bold">⇄</text>
    <text x={x} y={y-52} textAnchor="middle" fontSize={9} fill="#fbbf24" fontWeight="800"
      paintOrder="stroke" stroke="rgba(0,0,0,0.9)" strokeWidth={2.5}>BYTT</text>
  </g>
));
SwapOverlay.displayName = 'SwapOverlay';
