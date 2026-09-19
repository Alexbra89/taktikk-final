import React from 'react';

// Kalk: rolleetiketten er ren tekst i monofont – ingen pille, ingen farge.
// Den er nå eneste bærer av rolleinformasjon, siden brikkene er ensfargede.

export const RoleBadge = React.memo<{x:number;y:number;label:string}>(({ x,y,label }) => (
  <text x={x} y={y + 7} textAnchor="middle" dominantBaseline="middle"
    fontSize={8} fontWeight="500" letterSpacing="0.09em"
    fontFamily="var(--font-mono), ui-monospace, monospace"
    style={{ pointerEvents:'none', fill:'rgb(var(--k-ink-muted))' }}>
    {label.toUpperCase()}
  </text>
));
RoleBadge.displayName = 'RoleBadge';
