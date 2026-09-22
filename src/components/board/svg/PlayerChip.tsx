import React from 'react';

// Kalk: eget lag er fylte signal-sirkler. Rollen leses av
// etiketten under brikken, ikke av fargen – brettet har én farge.
// Fargene settes med CSS-variabler i style, slik at dagslys følger med.

const INK       = 'rgb(var(--k-ink))';
const SIGNAL    = 'rgb(var(--k-signal))';
// Tallet står på signalflaten, så det følger --k-signal-fg: mørkt i kveld,
// hvitt i dagslys. Hvit tekst på signal gir bare 2,9:1 i kveldsmodus.
const SIGNAL_FG = 'rgb(var(--k-signal-fg))';
const R        = 17;

export const PlayerChip = React.memo<{
  x:number; y:number; num:number;
  selected:boolean;
  isDragging:boolean; isTarget:boolean; isOutOfPos:boolean;
  /** Hvor mye brikken dempes under drag. Fullskjerm flytter selve brikken og demper mindre. */
  dragOpacity?:number;
}>(({ x,y,num,selected,isDragging,isTarget,isOutOfPos,dragOpacity=0.3 }) => (
  <g opacity={isDragging ? dragOpacity : 1} style={{ transition:'opacity 0.1s' }}>
    {/* Valgt: hårstrek-ring utenpå brikken. Arbeidsmarkering – ikke med i eksportert bilde. */}
    {selected && (
      <circle data-export="skip" cx={x} cy={y} r={R + 7} fill="none" strokeWidth={1.5}
        style={{ stroke: INK }} opacity={0.65}/>
    )}
    {/* Byttemål under drag */}
    {isTarget && !selected && (
      <circle data-export="skip" cx={x} cy={y} r={R + 9} fill="none" strokeWidth={1.5}
        strokeDasharray="5,4" style={{ stroke: INK }} opacity={0.5}/>
    )}
    {/* Ute av posisjon: liten strek under brikken, ikke en farge til */}
    {isOutOfPos && (
      <line x1={x - 6} y1={y + R + 4} x2={x + 6} y2={y + R + 4}
        strokeWidth={1.5} strokeLinecap="round" style={{ stroke: INK }} opacity={0.4}/>
    )}
    <circle cx={x} cy={y} r={R} style={{ fill: SIGNAL }}/>
    <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
      fontSize={13} fontWeight="600"
      fontFamily="var(--font-mono), ui-monospace, monospace"
      style={{ pointerEvents:'none', fill: SIGNAL_FG }}>{num}</text>
  </g>
));
PlayerChip.displayName = 'PlayerChip';
