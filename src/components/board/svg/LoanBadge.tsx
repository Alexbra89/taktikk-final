import React from 'react';

export const LoanBadge = React.memo<{x:number;y:number}>(({ x,y }) => (
  <g style={{pointerEvents:'none'}}>
    <rect x={x-16} y={y} width={32} height={12} rx={3}
      fill="rgba(120,53,15,0.9)" stroke="#fbbf24" strokeWidth={0.6}/>
    <text x={x} y={y+6.5} textAnchor="middle" dominantBaseline="middle"
      fill="#fbbf24" fontSize={7} fontWeight="800"
      fontFamily="system-ui,sans-serif" letterSpacing="0.06em">LÅN</text>
  </g>
));
LoanBadge.displayName = 'LoanBadge';
