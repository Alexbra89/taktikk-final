import React from 'react';

// Brikken som følger fingeren under drag. Samme form som PlayerChip,
// litt større og med en hårstrek-ring rundt.

export const DragGhost = React.memo<{x:number;y:number;num:number;name:string;label:string;scaleIn:boolean}>(
({ x,y,num,name,label,scaleIn }) => (
  <g style={{pointerEvents:'none'}} opacity={0.9}
    transform={`translate(${x},${y}) scale(${scaleIn?1.08:1})`}>
    <circle r={26} fill="none" strokeWidth={1.5} strokeDasharray="4,5"
      style={{ stroke:'rgb(var(--k-ink))' }} opacity={0.45}/>
    <circle r={18} style={{ fill:'rgb(var(--k-signal))' }}/>
    <text textAnchor="middle" dominantBaseline="middle"
      fontSize={13} fontWeight="600"
      fontFamily="var(--font-mono), ui-monospace, monospace"
      style={{ fill:'rgb(var(--k-signal-fg))' }}>{num}</text>
    <text x={0} y={37} textAnchor="middle" dominantBaseline="middle"
      fontSize={8} fontWeight="500" letterSpacing="0.09em"
      fontFamily="var(--font-mono), ui-monospace, monospace"
      style={{ fill:'rgb(var(--k-ink-muted))' }}>{label.toUpperCase()}</text>
    {name&&(
      <text x={0} y={51} textAnchor="middle" dominantBaseline="middle"
        fontSize={9.5} fontWeight="500"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        style={{ fill:'rgb(var(--k-ink))' }}>
        {name.length>10?name.slice(0,10)+'…':name}
      </text>
    )}
  </g>
));
DragGhost.displayName = 'DragGhost';
