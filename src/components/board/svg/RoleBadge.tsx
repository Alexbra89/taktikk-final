import React from 'react';

// Kalk: rolleetiketten er ren tekst i monofont – ingen pille, ingen farge.
// Full blekkfarge (hvit i kveld, svart i dagslys) og en kant i banefargen,
// så den leses også oppå banelinjer og tegninger.

export const RoleBadge = React.memo<{x:number;y:number;label:string}>(({ x,y,label }) => (
  <text x={x} y={y + 7} textAnchor="middle" dominantBaseline="middle"
    fontSize={8.5} fontWeight="700" letterSpacing="0.09em"
    fontFamily="var(--font-mono), ui-monospace, monospace"
    strokeWidth={3} strokeLinejoin="round"
    style={{ pointerEvents:'none', fill:'rgb(var(--k-ink))', stroke:'rgb(var(--k-pitch))', paintOrder:'stroke' }}>
    {label.toUpperCase()}
  </text>
));
RoleBadge.displayName = 'RoleBadge';
