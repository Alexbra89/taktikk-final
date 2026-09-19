import React from 'react';

// Snap-punktet er en nøytral hårstrek-ring. Signal er reservert til spillerne,
// så plassen brikken lander på markeres med blekk, ikke med en ny farge.

export const SnapIndicator = React.memo<{x:number;y:number}>(({ x,y }) => (
  <g style={{pointerEvents:'none'}}>
    <circle cx={x} cy={y} r={22} fill="none" strokeWidth={1.5} strokeDasharray="4,5"
      style={{ stroke:'rgb(var(--k-ink))' }} opacity={0.45}/>
    <circle cx={x} cy={y} r={2.5} style={{ fill:'rgb(var(--k-ink))' }} opacity={0.6}/>
  </g>
));
SnapIndicator.displayName = 'SnapIndicator';
