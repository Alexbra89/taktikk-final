import React from 'react';
import { Player } from '../../../types';
import { ROLE_META } from '../../../data/roleInfo';
import { getDutyColors } from '../../../lib/roleColors';

export const SubRow: React.FC<{
  player:          Player|null;
  idx:             number;
  isSelected:      boolean;
  isDragOver:      boolean;
  displayName:     string;
  isLimited:       boolean;
  onSelect:        () => void;
  onPointerDown:   (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove:   (e: React.PointerEvent) => void;
  onPointerUp:     (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  isDraggable:     boolean;
}> = React.memo(({
  player, idx, isSelected, isDragOver, displayName,
  isLimited, onSelect,
  onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  isDraggable,
}) => {
  if (!player) {
    return (
      <div data-bench-row data-bench-idx={idx} data-player-id=""
        style={{
          borderBottom:'1px solid rgba(255,255,255,0.04)',
          background: isDragOver?'rgba(52,211,153,0.1)':'transparent',
          borderLeft: isDragOver?'2px solid #34d399':'2px solid transparent',
          transition:'background 0.1s, border-color 0.1s',
        }}
        className="flex items-center gap-2 px-2.5 py-2 min-h-[46px] hover:bg-white/[0.02] transition-colors">
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] text-slate-600 flex-shrink-0">–</div>
        <div className="text-[9.5px] text-slate-600 italic">{isDragOver?'Slipp for å sette på benk':`R${idx+1}`}</div>
      </div>
    );
  }

  const meta     = ROLE_META[player.role as keyof typeof ROLE_META]??{color:'#555',label:player.role};
  const rc       = getDutyColors(player.role);
  const lastName = displayName.includes(' ') ? displayName.split(' ').slice(-1)[0] : displayName;
  const returnDate = player.injury?.expectedReturn
    ? new Date(player.injury.expectedReturn + 'T12:00:00').toLocaleDateString('nb-NO')
    : 'ukjent dato';

  return (
    <div
      data-bench-row data-bench-idx={idx} data-player-id={player.id}
      onPointerDown={isDraggable ? onPointerDown : undefined}
      onPointerMove={isDraggable ? (e => onPointerMove(e as React.PointerEvent)) : undefined}
      onPointerUp={isDraggable   ? (e => onPointerUp(e as React.PointerEvent))   : undefined}
      onPointerCancel={isDraggable ? (e => onPointerCancel(e as React.PointerEvent)) : undefined}
      onClick={onSelect}
      title={player.injury ? `Skadet – returnerer ${returnDate}` : undefined}
      style={{
        background: isDragOver?'rgba(251,191,36,0.08)':isSelected?'rgba(56,189,248,0.06)':'transparent',
        borderBottom:'1px solid rgba(255,255,255,0.04)',
        borderLeft: isDragOver?'2px solid #fbbf24':isSelected?'2px solid #38bdf8':'2px solid transparent',
        touchAction:'none', userSelect:'none',
        opacity: player.injury?0.6:1,
        cursor: player.injury?'not-allowed':'pointer',
        transition:'background 0.1s, border-color 0.1s',
      }}
      className="flex items-center gap-2 px-2.5 py-2 min-h-[46px] relative hover:bg-white/[0.03]"
    >
      <div className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 relative"
        style={{
          background: (meta as {color:string}).color ?? '#555',
          boxShadow: `0 0 8px ${(meta as {color:string}).color}33`,
        }}>
        {player.num}
        {(player.specialRoles??[]).includes('captain')&&<span className="absolute -top-1 -right-1 text-[8px] leading-none">🪖</span>}
        {player.injured&&<span className="absolute -top-1 -right-1 text-[8px] leading-none">🩹</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-slate-200 truncate leading-tight">
          {lastName.length>10?lastName.slice(0,10)+'…':lastName}
        </div>
        <div className="text-[9px] font-semibold leading-tight mt-0.5 truncate" style={{color:rc.text}}>
          {(meta as {label?:string}).label??player.role}
        </div>
      </div>

      {isDragOver&&<span className="text-[14px] text-amber-400 flex-shrink-0">⇄</span>}
    </div>
  );
});
SubRow.displayName = 'SubRow';
