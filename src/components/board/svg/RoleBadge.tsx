import React from 'react';
import { getDutyColors } from '../../../lib/roleColors';

export const RoleBadge = React.memo<{x:number;y:number;role:string;label:string}>(({ x,y,role,label }) => {
  const {bg, text, glow} = getDutyColors(role);
  return (
    <g style={{pointerEvents:'none'}}>
      <rect x={x-34} y={y+1} width={68} height={14} rx={5}
        fill={glow} opacity={0.5} style={{filter:'blur(3px)'}}/>
      <rect x={x-34} y={y} width={68} height={15} rx={4}
        fill={bg} stroke={text} strokeWidth={0.5} opacity={0.92}/>
      <rect x={x-33} y={y+0.5} width={66} height={6} rx={3.5}
        fill="rgba(255,255,255,0.06)" style={{pointerEvents:'none'}}/>
      <text x={x} y={y+8.5} textAnchor="middle" dominantBaseline="middle"
        fill={text} fontSize={8} fontWeight="700"
        fontFamily="system-ui,sans-serif" letterSpacing="0.07em">{label}</text>
    </g>
  );
});
RoleBadge.displayName = 'RoleBadge';
