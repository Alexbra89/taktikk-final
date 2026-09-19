import React from 'react';

// Kalk: eget lag er fylte signal-sirkler med hvite tall. Rollen leses av
// etiketten under brikken, ikke av fargen – brettet har én farge.
// Fargene settes med CSS-variabler i style, slik at dagslys følger med.

const INK      = 'rgb(var(--k-ink))';
const SIGNAL   = 'rgb(var(--k-signal))';
const R        = 17;

export const PlayerChip = React.memo<{
  x:number; y:number; num:number;
  selected:boolean;
  isDragging:boolean; isTarget:boolean; isOutOfPos:boolean;
}>(({ x,y,num,selected,isDragging,isTarget,isOutOfPos }) => (
  <g opacity={isDragging ? 0.3 : 1} style={{ transition:'opacity 0.1s' }}>
    {/* Valgt: hårstrek-ring utenpå brikken */}
    {selected && (
      <circle cx={x} cy={y} r={R + 7} fill="none" strokeWidth={1.5}
        style={{ stroke: INK }} opacity={0.65}/>
    )}
    {/* Byttemål under drag */}
    {isTarget && !selected && (
      <circle cx={x} cy={y} r={R + 9} fill="none" strokeWidth={1.5}
        strokeDasharray="5,4" style={{ stroke: INK }} opacity={0.5}/>
    )}
    {/* Ute av posisjon: liten strek under brikken, ikke en farge til */}
    {isOutOfPos && (
      <line x1={x - 6} y1={y + R + 4} x2={x + 6} y2={y + R + 4}
        strokeWidth={1.5} strokeLinecap="round" style={{ stroke: INK }} opacity={0.4}/>
    )}
    <circle cx={x} cy={y} r={R} style={{ fill: SIGNAL }}/>
    <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
      fill="#FFFFFF" fontSize={13} fontWeight="600"
      fontFamily="var(--font-mono), ui-monospace, monospace"
      style={{ pointerEvents:'none' }}>{num}</text>
  </g>
));
PlayerChip.displayName = 'PlayerChip';
