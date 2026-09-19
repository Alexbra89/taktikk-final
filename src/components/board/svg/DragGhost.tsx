import React from 'react';
import { getDutyColors } from '../../../lib/roleColors';

export const DragGhost = React.memo<{x:number;y:number;color:string;num:number;name:string;role:string;label:string;scaleIn:boolean}>(
({ x,y,color,num,name,role,label,scaleIn }) => {
  const {text} = getDutyColors(role);
  return (
    <g style={{pointerEvents:'none'}} opacity={0.85}
      transform={`translate(${x},${y}) scale(${scaleIn?1.08:1})`}>
      <circle r={34} fill="none" stroke={color} strokeWidth={1} opacity={0.3} style={{filter:'blur(4px)'}}/>
      <circle r={32} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="5,3"/>
      <circle r={22} fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} filter="url(#jerseyDrop)"/>
      <path d="M -14,-16 A 18,18 0 0,1 14,-16" fill="none"
        stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round"/>
      <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={13} fontWeight="900"
        fontFamily="system-ui,sans-serif" paintOrder="stroke" stroke="rgba(0,0,0,0.6)" strokeWidth={2.5}>{num}</text>
      <rect x={-23} y={25} width={46} height={14} rx={3}
        fill="rgba(0,0,0,0.65)" stroke={text} strokeWidth={0.5}/>
      <rect x={-22} y={25.5} width={44} height={6} rx={2.5} fill="rgba(255,255,255,0.05)"/>
      <text x={0} y={33} textAnchor="middle" dominantBaseline="middle"
        fill={text} fontSize={7.5} fontWeight="700"
        fontFamily="system-ui,sans-serif" letterSpacing="0.05em">{label}</text>
      {name&&(
        <text x={0} y={47} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.9)" fontSize={8} fontWeight="600"
          fontFamily="system-ui,sans-serif" paintOrder="stroke"
          stroke="rgba(0,0,0,0.85)" strokeWidth={2.5}>
          {name.length>10?name.slice(0,10)+'…':name}
        </text>
      )}
    </g>
  );
});
DragGhost.displayName = 'DragGhost';
