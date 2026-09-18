import React from 'react';

export const NameLabel = React.memo<{x:number;y:number;name:string}>(({ x,y,name }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
    fill="rgba(255,255,255,0.92)" fontSize={9} fontWeight="600"
    fontFamily="system-ui,sans-serif"
    paintOrder="stroke" stroke="rgba(0,0,0,0.85)" strokeWidth={3}
    style={{pointerEvents:'none'}}>
    {name.length>12 ? name.slice(0,12)+'…' : name}
  </text>
));
NameLabel.displayName = 'NameLabel';
