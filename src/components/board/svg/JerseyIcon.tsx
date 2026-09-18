import React from 'react';

export const JerseyIcon = React.memo<{
  x:number; y:number; num:number; color:string;
  selected:boolean; injured:boolean; specialRoles:string[];
  isDragging:boolean; isTarget:boolean; isOutOfPos:boolean;
}>(({ x,y,num,color,selected,injured,specialRoles,isDragging,isTarget,isOutOfPos }) => {
  const w=38, h=34, sh=9, nw=10, nh=5, tx=x-w/2, ty=y-h/2;
  return (
    <g opacity={isDragging ? 0.32 : 1} style={{ transition:'opacity 0.1s' }}>
      {selected && (
        <>
          <circle cx={x} cy={y} r={38} fill={color} opacity={0.08}/>
          <circle cx={x} cy={y} r={31} fill="none" stroke="#38bdf8"
            strokeWidth={2} strokeDasharray="6,3" opacity={0.9}/>
          <path d={`M ${x-20},${y-26} A 26,26 0 0,1 ${x+20},${y-26}`}
            fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeLinecap="round"/>
        </>
      )}
      {isTarget && !selected && (
        <circle cx={x} cy={y} r={32} fill="rgba(251,191,36,0.08)"
          stroke="#fbbf24" strokeWidth={1.8} opacity={0.85}/>
      )}
      {isOutOfPos && !selected && (
        <circle cx={x} cy={y} r={28} fill="#f97316" opacity={0.08}/>
      )}
      <path d={`M ${tx+nw},${ty} L ${tx},${ty+sh} L ${tx+6},${ty+sh+4}
          L ${tx+6},${ty+h} L ${tx+w-6},${ty+h}
          L ${tx+w-6},${ty+sh+4} L ${tx+w},${ty+sh}
          L ${tx+w-nw},${ty} Q ${x},${ty-nh} ${tx+nw},${ty} Z`}
        fill={injured ? '#334155' : color}
        stroke={selected ? '#38bdf8' : isOutOfPos ? '#f97316' : 'rgba(255,255,255,0.18)'}
        strokeWidth={selected ? 1.6 : 0.7}
        filter="url(#jerseyDrop)"
      />
      <path d={`M ${tx+nw+2},${ty+1} L ${tx+2},${ty+sh-1} L ${tx+7},${ty+sh+3} L ${tx+7},${ty+h*0.45} Q ${x},${ty-nh+4} ${tx+w-nw-2},${ty+1} Z`}
        fill="rgba(255,255,255,0.07)" style={{pointerEvents:'none'}}/>
      <text x={x} y={y+4} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={13} fontWeight="900" fontFamily="system-ui,sans-serif"
        paintOrder="stroke" stroke="rgba(0,0,0,0.6)" strokeWidth={2.5}
        style={{pointerEvents:'none'}}>{num}</text>
      {injured && <text x={x+16} y={y-13} fontSize={11} style={{pointerEvents:'none'}}>🩹</text>}
      {specialRoles.includes('captain') && <text x={x-20} y={y-13} fontSize={11} style={{pointerEvents:'none'}}>🪖</text>}
      {specialRoles.includes('penalty') && <text x={x+16} y={y-13} fontSize={10} style={{pointerEvents:'none'}}>🎯</text>}
      {specialRoles.includes('freekick') && !specialRoles.includes('penalty') &&
        <text x={x+16} y={y-13} fontSize={10} style={{pointerEvents:'none'}}>⚡</text>}
      {specialRoles.includes('corner') && <text x={x+16} y={y-1} fontSize={9} style={{pointerEvents:'none'}}>📍</text>}
    </g>
  );
});
JerseyIcon.displayName = 'JerseyIcon';
