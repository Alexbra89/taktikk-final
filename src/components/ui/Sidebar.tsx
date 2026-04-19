'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META, getRolesForSport } from '@/data/roleInfo';

// ═══════════════════════════════════════════════════════════════════════════
//  SIDEBAR – FM‑STIL + GLASSMORPHISM
// ═══════════════════════════════════════════════════════════════════════════

interface SidebarProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

const getPlayerDisplayName = (player: any, playerAccounts: any[]) => {
  const account = playerAccounts.find((a: any) => a.playerId === player.id);
  const roleMeta = ROLE_META[player.role as keyof typeof ROLE_META];
  const roleLabel = roleMeta?.label || player.role;
  const name = account?.name || player.name || `#${player.num}`;
  return { name, roleLabel };
};

const getSpecialRolesIcons = (player: any): string => {
  const roles = player.specialRoles || [];
  const icons = [];
  if (roles.includes('captain')) icons.push('🪖');
  if (roles.includes('freekick')) icons.push('🎯');
  if (roles.includes('penalty')) icons.push('⚽');
  if (roles.includes('corner')) icons.push('🚩');
  if (roles.includes('throwin')) icons.push('🤾');
  if (roles.includes('goalkeeper_kicks')) icons.push('🧤');
  return icons.join(' ');
};

export const Sidebar: React.FC<SidebarProps> = ({ selectedPlayerId, onSelectPlayer }) => {
  // FIX 1: Kun 'players' og 'roles' – 'assign' er fjernet
  const [tab, setTab] = useState<'players' | 'roles'>('players');
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [showSubConfirm, setShowSubConfirm] = useState<{ outId: string; inId: string } | null>(null);
  const [selectedOutPlayer, setSelectedOutPlayer] = useState<any | null>(null);
  const [eligibleSubs, setEligibleSubs] = useState<any[]>([]);
  const [showEmptySlotPicker, setShowEmptySlotPicker] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverSubIndex, setDragOverSubIndex] = useState<number | null>(null);

  const {
    sport, phases, activePhaseIdx,
    updatePlayerField, playerAccounts, homeTeamName,
    reorderBenchPlayers,
  } = useAppStore();

  const phase = phases[activePhaseIdx];
  const roles = getRolesForSport(sport);
  const players = phase?.players ?? [];
  const homePlayers = players.filter(p => p.team === 'home');

  const teamSize = sport === 'football' ? 11 : sport === 'football7' ? 7 : sport === 'football9' ? 9 : 7;
  const maxSubs  = sport === 'football' ? 7  : sport === 'football7' ? 5 : sport === 'football9' ? 5 : 5;

  const starters = homePlayers.filter(p => p.isStarter === true);
  const subs     = homePlayers.filter(p => p.isStarter !== true);

  const fieldSlots: (any | null)[] = [...starters];
  while (fieldSlots.length < teamSize) fieldSlots.push(null);
  const fieldDisplay = fieldSlots.slice(0, teamSize);

  const subSlots: (any | null)[] = [...subs];
  while (subSlots.length < maxSubs) subSlots.push(null);

  const handleDragStart = (e: React.DragEvent, playerId: string, fromIndex: number, isSubSlot = false) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ playerId, fromIndex, isSubSlot }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver  = (e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverIndex(index); };
  const handleDragLeave = () => setDragOverIndex(null);
  const handleSubDragOver  = (e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverSubIndex(index); };
  const handleSubDragLeave = () => setDragOverSubIndex(null);

  const getPositionForIndex = (index: number) => {
    const positions = [
      { x: 440, y: 515 }, { x: 260, y: 450 }, { x: 620, y: 450 },
      { x: 370, y: 450 }, { x: 510, y: 450 }, { x: 260, y: 380 },
      { x: 440, y: 380 }, { x: 620, y: 380 }, { x: 280, y: 230 },
      { x: 440, y: 210 }, { x: 600, y: 230 },
    ];
    return positions[index] || { x: 440, y: 280 };
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { playerId, fromIndex, isSubSlot } = data;
      const draggedPlayer = homePlayers.find(p => p.id === playerId);
      if (!draggedPlayer) return;
      if (isSubSlot) {
        const targetPlayer = fieldDisplay[toIndex];
        if (targetPlayer) {
          updatePlayerField(activePhaseIdx, draggedPlayer.id, { isStarter: true, position: targetPlayer.position });
          updatePlayerField(activePhaseIdx, targetPlayer.id, { isStarter: false, position: draggedPlayer.position });
        } else {
          updatePlayerField(activePhaseIdx, draggedPlayer.id, { isStarter: true, position: getPositionForIndex(toIndex) });
        }
        return;
      }
      const targetPlayer = fieldDisplay[toIndex];
      if (targetPlayer) {
        updatePlayerField(activePhaseIdx, draggedPlayer.id, { position: targetPlayer.position });
        updatePlayerField(activePhaseIdx, targetPlayer.id, { position: draggedPlayer.position });
      } else {
        updatePlayerField(activePhaseIdx, draggedPlayer.id, { position: getPositionForIndex(toIndex) });
      }
    } catch (err) { console.error('Drag drop error:', err); }
  };

  const handleSubDrop = (e: React.DragEvent, toSubIndex: number) => {
    e.preventDefault();
    setDragOverSubIndex(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { playerId, isSubSlot, fromIndex } = data;
      const draggedPlayer = homePlayers.find(p => p.id === playerId);
      if (!draggedPlayer) return;
      const targetSub = subSlots[toSubIndex];
      if (!isSubSlot) {
        if (targetSub) {
          updatePlayerField(activePhaseIdx, draggedPlayer.id, { isStarter: false, position: targetSub.position ?? draggedPlayer.position });
          updatePlayerField(activePhaseIdx, targetSub.id, { isStarter: true, position: draggedPlayer.position });
        } else {
          updatePlayerField(activePhaseIdx, draggedPlayer.id, { isStarter: false });
        }
      } else {
        if (targetSub && fromIndex !== undefined && fromIndex !== toSubIndex) {
          reorderBenchPlayers(activePhaseIdx, fromIndex, toSubIndex);
        }
      }
    } catch (err) { console.error('Sub drop error:', err); }
  };

  const swapPlayers = (playerOutId: string, playerInId: string) => {
    const playerOut = homePlayers.find(p => p.id === playerOutId);
    const playerIn  = homePlayers.find(p => p.id === playerInId);
    if (!playerOut || !playerIn) return;
    updatePlayerField(activePhaseIdx, playerOutId, { isStarter: false });
    updatePlayerField(activePhaseIdx, playerInId,  { isStarter: true });
    if (playerOut.position && playerIn.position) {
      updatePlayerField(activePhaseIdx, playerOutId, { position: playerIn.position });
      updatePlayerField(activePhaseIdx, playerInId,  { position: playerOut.position });
    }
    setTimeout(() => { setShowSubConfirm(null); setSelectedOutPlayer(null); setEligibleSubs([]); }, 50);
  };

  const assignToEmptySlot = (playerId: string, slotIndex: number) => {
    const player = homePlayers.find(p => p.id === playerId);
    if (!player) return;
    if (player.isStarter !== true) updatePlayerField(activePhaseIdx, playerId, { isStarter: true });
    setShowEmptySlotPicker(null);
  };

  const sportEmoji = sport === 'handball' ? '🤾' : '⚽';
  const sportLabel = sport === 'handball' ? 'Håndball' : sport === 'football7' ? 'Fotball 7er' : sport === 'football9' ? 'Fotball 9er' : 'Fotball 11er';

  const getPositionNameForIndex = (index: number): string => {
    if (sport === 'football7') {
      return ['Keeper','Back','Back','Midtbane','Midtbane','Spiss','Spiss'][index] || `Posisjon ${index+1}`;
    }
    if (sport === 'football9') {
      return ['Keeper','Back','Back','Midtstopper','Midtbane','Midtbane','Kant','Spiss','Spiss'][index] || `Posisjon ${index+1}`;
    }
    return ['Keeper','Høyreback','Venstreback','Midtstopper','Midtstopper','Høyre midtbane','Sentral midtbane','Venstre midtbane','Høyre spiss','Sentral spiss','Venstre spiss'][index] || `Posisjon ${index+1}`;
  };

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-full overflow-hidden w-[260px] sm:w-[280px] md:w-[300px] landscape:w-[180px]"
      style={{
        background: 'rgba(8, 15, 35, 0.82)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        borderRight: '1px solid rgba(56, 189, 248, 0.1)',
        boxShadow: '2px 0 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b" style={{ borderColor: 'rgba(56, 189, 248, 0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] sm:text-xs font-black uppercase tracking-wider truncate"
            style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {homeTeamName || 'TAKTIKKBOARD'}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-slate-400">
          <span>{sportEmoji} {sportLabel}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
          <span className="font-medium text-sky-400/80 truncate hidden sm:block">{homeTeamName || 'Hjemmelag'}</span>
        </div>
      </div>

      {/* FIX 1: Kun to faner – Tildel er fjernet */}
      <div className="flex border-b px-2 gap-1" style={{ borderColor: 'rgba(56, 189, 248, 0.08)' }}>
        {([
          ['players', '👥 Tropp'],
          ['roles',   '📚 Roller'],
        ] as const).map(([t, l]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold transition-all relative"
            style={{ color: tab === t ? '#38bdf8' : '#64748b', borderBottom: tab === t ? '2px solid #38bdf8' : '2px solid transparent' }}
          >
            {l}
            {tab === t && (
              <div className="absolute inset-x-0 -bottom-px h-px" style={{ background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Innhold */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 custom-scrollbar">

        {/* Tropp-fane */}
        {tab === 'players' && phase && (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[8px] sm:text-[9px] font-black text-sky-400 uppercase tracking-widest">
                ⚽ Startoppstilling ({starters.length}/{teamSize})
              </div>
              {starters.length < teamSize && (
                <span className="text-[7px] sm:text-[8px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                  ⚠️ Mangler {teamSize - starters.length}
                </span>
              )}
            </div>

            <div className="space-y-1 mb-4">
              {fieldDisplay.map((player, index) => {
                const isDragOver = dragOverIndex === index;
                const posName = getPositionNameForIndex(index);
                if (!player) {
                  return (
                    <div
                      key={`empty-${index}`}
                      draggable={false}
                      onDragOver={e => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, index)}
                      className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border transition-all cursor-default
                        ${isDragOver ? 'bg-sky-500/15 border-sky-400 shadow-lg shadow-sky-500/10' : 'border-dashed border-white/10 hover:border-sky-500/30 bg-white/[0.02]'}`}
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 italic">Ledig plass</div>
                        <div className="text-[8px] sm:text-[9px] text-sky-400/60 truncate">{posName}</div>
                      </div>
                      <button
                        onClick={() => setShowEmptySlotPicker(index)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-bold transition-all bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 active:scale-95"
                      >
                        Sett inn
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={player.id}
                    draggable={true}
                    onDragStart={e => handleDragStart(e, player.id, index, false)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, index)}
                    className={`transition-all ${isDragOver ? 'ring-2 ring-sky-400 rounded-xl scale-[1.01]' : ''}`}
                  >
                    <PlayerRow player={player} selected={selectedPlayerId === player.id} onSelect={onSelectPlayer} playerAccounts={playerAccounts as any[]} isStarter={true} />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 my-2 sm:my-3">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent)' }} />
              <span className="text-[8px] sm:text-[9px] font-black text-amber-400 uppercase tracking-widest">🪑 Innbyttere ({subs.length}/{maxSubs})</span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent)' }} />
            </div>
            <div className="text-[7px] sm:text-[8px] text-slate-500 italic text-center mb-2">
              💡 Dra starter hit for å bytte · Dra innbytter til start for å sette inn
            </div>

            <div className="space-y-1">
              {subSlots.map((p, subIndex) => {
                const isDragOverSub = dragOverSubIndex === subIndex;
                if (!p) {
                  return (
                    <div
                      key={`sub-empty-${subIndex}`}
                      onDragOver={e => handleSubDragOver(e, subIndex)}
                      onDragLeave={handleSubDragLeave}
                      onDrop={e => handleSubDrop(e, subIndex)}
                      className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-dashed transition-all
                        ${isDragOverSub ? 'bg-amber-500/15 border-amber-400' : 'border-white/10 bg-white/[0.01]'}`}
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[8px] sm:text-[9px] font-bold flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
                        R{subIndex + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-[9px] sm:text-[10px] text-slate-500 italic">Ledig plass</div>
                        <div className="text-[7px] sm:text-[8px] text-slate-600">Innbytter {subIndex + 1}</div>
                      </div>
                      {isDragOverSub && <span className="text-[7px] sm:text-[8px] font-bold text-amber-400">Slipp her</span>}
                    </div>
                  );
                }
                return (
                  <div
                    key={p.id}
                    draggable={true}
                    onDragStart={e => handleDragStart(e, p.id, subIndex, true)}
                    onDragOver={e => handleSubDragOver(e, subIndex)}
                    onDragLeave={handleSubDragLeave}
                    onDrop={e => handleSubDrop(e, subIndex)}
                    className={`cursor-grab active:cursor-grabbing transition-all ${isDragOverSub ? 'ring-2 ring-amber-400 rounded-xl' : ''}`}
                  >
                    <PlayerRow player={p} selected={selectedPlayerId === p.id} onSelect={onSelectPlayer} playerAccounts={playerAccounts as any[]} isStarter={false} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Roller-fane */}
        {tab === 'roles' && (
          <div className="space-y-1.5">
            <p className="text-[9px] sm:text-[10px] text-slate-500 px-1 mb-3">Trykk for rollebeskrivelse</p>
            {roles.map(r => {
              const m = ROLE_META[r];
              if (!m) return null;
              const open = openRole === r;
              return (
                <button
                  key={r}
                  onClick={() => setOpenRole(open ? null : r)}
                  className="w-full text-left rounded-xl p-2 sm:p-3 transition-all border"
                  style={{ background: open ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.02)', borderColor: open ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm flex-shrink-0 shadow-lg"
                      style={{ background: m.color, boxShadow: `0 4px 12px ${m.color}40` }}>
                      {m.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] sm:text-xs font-bold text-slate-200">{m.label}</div>
                      <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{r}</div>
                    </div>
                    <span className="text-slate-500 text-[10px] sm:text-xs">{open ? '▲' : '▼'}</span>
                  </div>
                  {open && (
                    <div className="mt-3 pl-9 sm:pl-11">
                      <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">{m.description}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Bekreft bytte */}
      {showSubConfirm && selectedOutPlayer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border w-full max-w-sm p-5 shadow-2xl"
            style={{ background: 'rgba(8, 15, 35, 0.95)', backdropFilter: 'blur(16px)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
            <h3 className="text-sm font-black text-slate-100 mb-4 flex items-center gap-2">
              <span className="text-amber-400">🔄</span> Bekreft bytte
            </h3>
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm">⬆️</div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{getPlayerDisplayName(selectedOutPlayer, playerAccounts as any[]).name}</div>
                  <div className="text-[9px] text-slate-500">{getPlayerDisplayName(selectedOutPlayer, playerAccounts as any[]).roleLabel} · #{selectedOutPlayer.num}</div>
                </div>
              </div>
              <div className="text-center text-slate-500 text-lg">⬇️</div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">⬇️</div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{getPlayerDisplayName(eligibleSubs[0], playerAccounts as any[]).name}</div>
                  <div className="text-[9px] text-slate-500">{getPlayerDisplayName(eligibleSubs[0], playerAccounts as any[]).roleLabel} · #{eligibleSubs[0].num}</div>
                </div>
              </div>
            </div>
            {eligibleSubs.length > 1 && (
              <div className="mb-4">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Andre alternativer</div>
                <div className="flex flex-wrap gap-1.5">
                  {eligibleSubs.slice(1).map(sub => (
                    <button key={sub.id} onClick={() => setShowSubConfirm({ outId: showSubConfirm.outId, inId: sub.id })}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all">
                      {getPlayerDisplayName(sub, playerAccounts as any[]).name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => swapPlayers(showSubConfirm.outId, showSubConfirm.inId)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs transition-all bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 active:scale-[0.98]">
                ✓ Bekreft bytte
              </button>
              <button onClick={() => { setShowSubConfirm(null); setSelectedOutPlayer(null); setEligibleSubs([]); }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs border transition-all bg-transparent border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 active:scale-[0.98]">
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Velg spiller til tom plass */}
      {showEmptySlotPicker !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border w-full max-w-sm p-5 shadow-2xl"
            style={{ background: 'rgba(8, 15, 35, 0.95)', backdropFilter: 'blur(16px)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
            <h3 className="text-sm font-black text-slate-100 mb-1">Sett inn spiller</h3>
            <p className="text-[11px] text-sky-400/80 mb-4">Posisjon: {getPositionNameForIndex(showEmptySlotPicker)}</p>
            <div className="max-h-56 overflow-y-auto space-y-1.5 mb-4 custom-scrollbar">
              {homePlayers.filter(p => p.isStarter !== true).map(p => {
                const { name, roleLabel } = getPlayerDisplayName(p, playerAccounts as any[]);
                return (
                  <button key={p.id} onClick={() => assignToEmptySlot(p.id, showEmptySlotPicker)}
                    className="w-full text-left p-3 rounded-xl border transition-all bg-white/[0.02] border-white/10 hover:bg-sky-500/10 hover:border-sky-500/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: ROLE_META[p.role]?.color || '#555' }}>
                        {p.num}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{name}</div>
                        <div className="text-[9px] text-slate-500">{roleLabel} · #{p.num}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {homePlayers.filter(p => p.isStarter !== true).length === 0 && (
                <p className="text-center text-slate-500 text-xs py-4">Ingen innbyttere tilgjengelig</p>
              )}
            </div>
            <button onClick={() => setShowEmptySlotPicker(null)}
              className="w-full py-2.5 rounded-xl font-bold text-xs border border-white/10 text-slate-400 hover:text-slate-200 transition-all">
              Avbryt
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  PLAYER ROW
// ═══════════════════════════════════════════════════════════════════════════
const PlayerRow: React.FC<{
  player: any;
  selected: boolean;
  onSelect: (id: string | null) => void;
  playerAccounts?: any[];
  isStarter: boolean;
}> = ({ player, selected, onSelect, playerAccounts = [], isStarter }) => {
  const m = ROLE_META[player.role as keyof typeof ROLE_META] ?? ROLE_META['midfielder'];
  const { name, roleLabel } = getPlayerDisplayName(player, playerAccounts);
  const specialIcons = getSpecialRolesIcons(player);

  return (
    <div className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border transition-all
      ${selected ? 'bg-sky-500/10 border-sky-500/40 shadow-lg shadow-sky-500/5' : 'border-transparent hover:bg-white/[0.03] hover:border-white/10'}
      ${!isStarter ? 'opacity-90' : ''}`}
    >
      <div onClick={() => onSelect(selected ? null : player.id)}
        className="flex items-center gap-2 sm:gap-3 flex-1 cursor-pointer active:scale-[0.99] transition-transform">
        <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-[11px] font-black text-white flex-shrink-0 shadow-md"
          style={{ background: m.color, opacity: player.injured ? 0.5 : 1, boxShadow: `0 4px 8px ${m.color}40` }}>
          {player.num}
          {player.injured && <span className="absolute -top-1 -right-1 text-[8px] sm:text-[9px]">🩹</span>}
          {(player.specialRoles ?? []).includes('captain') && <span className="absolute -bottom-1 -right-1 text-[8px] sm:text-[9px]">🪖</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold truncate text-slate-100">{name}</span>
            {specialIcons && <span className="text-[9px] sm:text-[10px] opacity-80">{specialIcons}</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[8px] sm:text-[9px] text-sky-400/80 font-medium">{roleLabel}</span>
            <span className="text-[7px] sm:text-[8px] text-slate-500">#{player.num}</span>
            {!isStarter && <span className="text-[7px] sm:text-[8px] font-semibold text-amber-400/80 ml-auto">Innbytter</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom scrollbar
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.2); border-radius: 20px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.4); }
`;
if (typeof document !== 'undefined') document.head.appendChild(style);
