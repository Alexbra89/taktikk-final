import React from 'react';
import type { RoleFamily } from '@/data/roleInfo';
import type { PlayerStyle } from '@/hooks/usePlayerStyle';
import { KitShape } from './PlayerKit';

// Brikken som følger fingeren under drag. Samme form som spilleren
// (drakt eller sirkel), litt større og med en hårstrek-ring rundt.

export const DragGhost = React.memo<{
  x:number; y:number; num:number; name:string; label:string; scaleIn:boolean;
  family: RoleFamily; playerStyle: PlayerStyle;
}>(({ x,y,num,name,label,scaleIn,family,playerStyle }) => {
  const kit = playerStyle === 'kit';
  const labelY = kit ? 40 : 37;
  return (
  <g style={{pointerEvents:'none'}} opacity={0.9}
    transform={`translate(${x},${y}) scale(${scaleIn?1.08:1})`}>
    <circle r={kit ? 29 : 26} fill="none" strokeWidth={1.5} strokeDasharray="4,5"
      style={{ stroke:'rgb(var(--k-ink))' }} opacity={0.45}/>
    {kit ? <KitShape family={family} num={num}/> : (
      <>
        <circle r={18} style={{ fill:'rgb(var(--k-signal))' }}/>
        <text textAnchor="middle" dominantBaseline="middle"
          fontSize={13} fontWeight="600"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          style={{ fill:'rgb(var(--k-signal-fg))' }}>{num}</text>
      </>
    )}
    <text x={0} y={labelY} textAnchor="middle" dominantBaseline="middle"
      fontSize={8.5} fontWeight="700" letterSpacing="0.09em"
      fontFamily="var(--font-mono), ui-monospace, monospace"
      strokeWidth={3} strokeLinejoin="round"
      style={{ fill:'rgb(var(--k-ink))', stroke:'rgb(var(--k-pitch))', paintOrder:'stroke' }}>{label.toUpperCase()}</text>
    {name&&(
      <text x={0} y={labelY + 14} textAnchor="middle" dominantBaseline="middle"
        fontSize={9.5} fontWeight="500"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        style={{ fill:'rgb(var(--k-ink))' }}>
        {name.length>10?name.slice(0,10)+'…':name}
      </text>
    )}
  </g>
  );
});
DragGhost.displayName = 'DragGhost';
