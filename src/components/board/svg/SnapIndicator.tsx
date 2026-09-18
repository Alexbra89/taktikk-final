import React from 'react';

export const SnapIndicator = React.memo<{x:number;y:number}>(({ x,y }) => (
  <g style={{pointerEvents:'none'}}>
    <circle cx={x} cy={y} r={24} fill="rgba(34,197,94,0.08)"
      stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.9}/>
    <circle cx={x} cy={y} r={5} fill="#22c55e" opacity={0.6}/>
    <circle cx={x} cy={y} r={3} fill="rgba(255,255,255,0.5)"/>
  </g>
));
SnapIndicator.displayName = 'SnapIndicator';
