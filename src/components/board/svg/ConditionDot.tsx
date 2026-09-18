import React from 'react';

export const ConditionDot = React.memo<{x:number;y:number;condition:number}>(({ x,y,condition }) => {
  const color = condition>80?'#22c55e':condition>60?'#f59e0b':'#ef4444';
  return (
    <g style={{pointerEvents:'none'}}>
      <circle cx={x+22} cy={y-18} r={6} fill={color} opacity={0.25} style={{filter:'blur(2px)'}}/>
      <circle cx={x+22} cy={y-18} r={4.5} fill="#0a0f1e"/>
      <circle cx={x+22} cy={y-18} r={3} fill={color}/>
      <circle cx={x+21} cy={y-19} r={1} fill="rgba(255,255,255,0.5)"/>
    </g>
  );
});
ConditionDot.displayName = 'ConditionDot';
