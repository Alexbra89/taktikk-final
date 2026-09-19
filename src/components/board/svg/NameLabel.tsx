import React from 'react';

// Navnet står rett på banen uten halo: banen er flat i Kalk, så
// blekkfargen alene gir nok kontrast i både kveld og dagslys.

export const NameLabel = React.memo<{x:number;y:number;name:string}>(({ x,y,name }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
    fontSize={9.5} fontWeight="500"
    fontFamily="var(--font-sans), system-ui, sans-serif"
    style={{ pointerEvents:'none', fill:'rgb(var(--k-ink))' }}>
    {name.length>12 ? name.slice(0,12)+'…' : name}
  </text>
));
NameLabel.displayName = 'NameLabel';
