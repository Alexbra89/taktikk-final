'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META, getRolesForSport } from '@/data/roleInfo';

interface SidebarProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedPlayerId, onSelectPlayer }) => {
  const [tab, setTab] = useState<'players' | 'assign' | 'roles'>('players');
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [showSubConfirm, setShowSubConfirm] = useState<{ outId: string; inId: string } | null>(null);
  const [selectedOutPlayer, setSelectedOutPlayer] = useState<any | null>(null);
  const [eligibleSubs, setEligibleSubs] = useState<any[]>([]);

  const {
    sport, phases, activePhaseIdx,
    updatePlayerField, playerAccounts, homeTeamName,
  } = useAppStore();

  const phase = phases[activePhaseIdx];
  const roles = getRolesForSport(sport);
  const players = phase?.players ?? [];
  const homePlayers = players.filter(p => p.team === 'home');
  
  const teamSize = sport === 'football' ? 11 : sport === 'football7' ? 7 : 7;
  
  // Bruk isStarter for å avgjøre hvem som starter
  const starters = homePlayers.filter(p => p.isStarter === true);
  const subs = homePlayers.filter(p => p.isStarter !== true);
  
  // Fyll opp banen til teamSize med null for tomme plasser
  const fieldSlots: (any | null)[] = [...starters];
  while (fieldSlots.length < teamSize) {
    fieldSlots.push(null);
  }
  const fieldDisplay = fieldSlots.slice(0, teamSize);
  
  // Bytte funksjon – bytter isStarter status
  const swapPlayers = (playerOutId: string, playerInId: string) => {
    const playerOut = homePlayers.find(p => p.id === playerOutId);
    const playerIn = homePlayers.find(p => p.id === playerInId);
    
    if (!playerOut || !playerIn) return;
    
    // Bytt isStarter status
    updatePlayerField(activePhaseIdx, playerOutId, { isStarter: false });
    updatePlayerField(activePhaseIdx, playerInId, { isStarter: true });
    
    // Bytt også posisjoner
    if (playerOut.position && playerIn.position) {
      updatePlayerField(activePhaseIdx, playerOutId, { position: playerIn.position });
      updatePlayerField(activePhaseIdx, playerInId, { position: playerOut.position });
    }
    
    // Force en liten forsinkelse for å sikre at state oppdateres
    setTimeout(() => {
      setShowSubConfirm(null);
      setSelectedOutPlayer(null);
      setEligibleSubs([]);
    }, 50);
  };
  
  // Alle innbyggere er tilgjengelige for bytte
  const getAvailableSubs = (outPlayer: any) => {
    return subs.filter(p => p.id !== outPlayer.id);
  };

  const sportEmoji = sport === 'handball' ? '🤾' : '⚽';
  const sportLabel = sport === 'handball' ? 'Håndball' : sport === 'football7' ? 'Fotball 7er' : 'Fotball 11er';

  const getPositionNameForIndex = (index: number): string => {
    if (sport === 'football7') {
      const positions7 = ['Keeper', 'Back', 'Back', 'Midtbane', 'Midtbane', 'Spiss', 'Spiss'];
      return positions7[index] || `Posisjon ${index + 1}`;
    }
    // Standard 11er formasjon (4-4-2)
    const positions11 = [
      'Keeper', 'Høyreback', 'Venstreback', 'Midtstopper', 'Midtstopper',
      'Høyre midtbane', 'Sentral midtbane', 'Venstre midtbane',
      'Høyre spiss', 'Sentral spiss', 'Venstre spiss'
    ];
    return positions11[index] || `Posisjon ${index + 1}`;
  };

  const getPlayerDisplayName = (player: any) => {
    const account = playerAccounts.find((a: any) => a.playerId === player.id);
    return account?.name || player.name || `#${player.num}`;
  };

  return (
    <aside className="flex-shrink-0 flex flex-col h-full bg-[#0c1525] border-r border-[#1e3050] overflow-hidden" style={{ width: 260 }}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1e3050]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-black" style={{ background: 'linear-gradient(90deg,#38bdf8,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {homeTeamName || 'TAKTIKKBOARD'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#4a6080]">{sportEmoji} {sportLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
          <span className="text-blue-400 font-semibold truncate">{homeTeamName || 'Hjemmelag'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e3050] flex-shrink-0">
        {([
          ['players', '👥 Tropp'],
          ['assign',  '🔗 Tildel'],
          ['roles',   '📚 Roller'],
        ] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10.5px] font-semibold transition-all min-h-[36px]
              ${tab === t ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070]'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* SPILLERLISTE */}
        {tab === 'players' && phase && (
          <>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[8.5px] font-bold text-sky-400 uppercase tracking-widest">
                ⚽ Startoppstilling ({starters.length}/{teamSize})
              </div>
              {starters.length < teamSize && (
                <span className="text-[8px] text-red-400">⚠️ Mangler {teamSize - starters.length} spillere</span>
              )}
            </div>
            
            {/* Vis ALLTID teamSize plasser på banen */}
            {fieldDisplay.map((player, index) => {
              if (!player) {
                const posName = getPositionNameForIndex(index);
                return (
                  <div key={`empty-${index}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 border border-dashed border-[#1e3050] opacity-70">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 bg-[#1e3050]">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-slate-400 italic">Ledig plass</div>
                      <div className="text-[9px] text-sky-400/70">{posName}</div>
                    </div>
                  </div>
                );
              }
              return (
                <PlayerRow 
                  key={player.id} 
                  player={player} 
                  selected={selectedPlayerId === player.id} 
                  onSelect={onSelectPlayer} 
                  playerAccounts={playerAccounts as any[]}
                  isStarter={true}
                  onSubstituteOut={() => {
                    const eligible = getAvailableSubs(player);
                    if (eligible.length > 0) {
                      setSelectedOutPlayer(player);
                      setEligibleSubs(eligible);
                      setShowSubConfirm({ outId: player.id, inId: eligible[0].id });
                    } else {
                      alert(`Ingen innbyggere tilgjengelig.`);
                    }
                  }}
                />
              );
            })}

            {/* Innbyttere – alle som ikke er startere */}
            {subs.length > 0 && (
              <>
                <div className="flex items-center gap-2 my-2 px-1">
                  <div className="h-px flex-1 bg-[#1e3050]" />
                  <span className="text-[8.5px] font-bold text-amber-400 uppercase tracking-widest">🪑 Innbyttere ({subs.length})</span>
                  <div className="h-px flex-1 bg-[#1e3050]" />
                </div>
                {subs.map(p => (
                  <PlayerRow 
                    key={p.id} 
                    player={p} 
                    selected={selectedPlayerId === p.id} 
                    onSelect={onSelectPlayer} 
                    playerAccounts={playerAccounts as any[]}
                    isStarter={false}
                    onSubstituteIn={() => {
                      if (starters.length > 0) {
                        const anyStarter = starters[0];
                        setSelectedOutPlayer(anyStarter);
                        setEligibleSubs([p]);
                        setShowSubConfirm({ outId: anyStarter.id, inId: p.id });
                      } else if (starters.length < teamSize) {
                        updatePlayerField(activePhaseIdx, p.id, { isStarter: true });
                      } else {
                        alert(`Ingen startere tilgjengelig for bytte.`);
                      }
                    }}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* TILDEL */}
        {tab === 'assign' && phase && (
          <AssignTab 
            players={players} 
            playerAccounts={playerAccounts as any[]}
            phaseIdx={activePhaseIdx} 
            onUpdate={updatePlayerField}
            homeTeamName={homeTeamName} 
          />
        )}

        {/* ROLLER */}
        {tab === 'roles' && (
          <div className="space-y-1">
            <p className="text-[10px] text-[#4a6080] px-1 mb-2">Trykk for rollebeskrivelse</p>
            {roles.map(r => {
              const m = ROLE_META[r]; if (!m) return null;
              const open = openRole === r;
              return (
                <button key={r} onClick={() => setOpenRole(open ? null : r)}
                  className="w-full text-left rounded-xl border px-2.5 py-2 transition-all border-transparent hover:bg-[#0f1a2a]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-shrink-0" style={{ background: m.color }}>{m.emoji}</div>
                    <div className="text-[11.5px] text-slate-200 font-semibold flex-1 truncate">{m.label}</div>
                    <span className="text-[#3a5070] text-[9px]">{open ? '▲' : '▼'}</span>
                  </div>
                  {open && <div className="mt-2 pl-8"><p className="text-[10.5px] text-slate-400 leading-relaxed">{m.description}</p></div>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bytt-bekreftelse modal */}
      {showSubConfirm && selectedOutPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] max-w-sm w-full p-4">
            <h3 className="text-sm font-bold text-slate-200 mb-3">🔄 Bekreft bytte</h3>
            <p className="text-[12px] text-slate-300 mb-2">
              <span className="text-amber-400 font-bold">{getPlayerDisplayName(selectedOutPlayer)}</span>
              <span className="text-[#4a6080]"> ({ROLE_META[selectedOutPlayer.role as keyof typeof ROLE_META]?.label || selectedOutPlayer.role})</span>
            </p>
            <p className="text-[12px] text-slate-300 mb-2 text-center">⬇️ byttes med ⬇️</p>
            <p className="text-[12px] text-slate-300 mb-4">
              <span className="text-emerald-400 font-bold">{getPlayerDisplayName(eligibleSubs[0])}</span>
              <span className="text-[#4a6080]"> ({ROLE_META[eligibleSubs[0]?.role as keyof typeof ROLE_META]?.label || eligibleSubs[0]?.role})</span>
            </p>
            {eligibleSubs.length > 1 && (
              <div className="mb-4">
                <div className="text-[9px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">Andre innbyggere:</div>
                <div className="flex flex-wrap gap-1">
                  {eligibleSubs.slice(1).map(sub => (
                    <button key={sub.id} onClick={() => setShowSubConfirm({ outId: showSubConfirm.outId, inId: sub.id })}
                      className="px-2 py-0.5 rounded-full text-[9px] bg-[#111c30] hover:bg-sky-500/20 text-slate-300 border border-[#1e3050]">
                      {getPlayerDisplayName(sub)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => swapPlayers(showSubConfirm.outId, showSubConfirm.inId)} 
                className="flex-1 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[12px] hover:bg-emerald-500/25">
                ✓ Ja, bytt
              </button>
              <button onClick={() => { setShowSubConfirm(null); setSelectedOutPlayer(null); setEligibleSubs([]); }} 
                className="flex-1 py-2 rounded-lg border border-[#1e3050] text-[#4a6080] font-bold text-[12px] hover:text-slate-300">
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

const PlayerRow: React.FC<{
  player: any; selected: boolean;
  onSelect: (id: string | null) => void;
  playerAccounts?: any[];
  isStarter: boolean;
  onSubstituteOut?: () => void;
  onSubstituteIn?: () => void;
}> = ({ player, selected, onSelect, playerAccounts = [], isStarter, onSubstituteOut, onSubstituteIn }) => {
  const m = ROLE_META[player.role as keyof typeof ROLE_META] ?? ROLE_META['midfielder'];
  const account = playerAccounts.find((acc: any) => acc.playerId === player.id);
  const displayName = account?.name || player.name || `#${player.num}`;
  
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 border transition-all
      ${selected ? 'bg-sky-500/10 border-sky-500/40' : 'border-transparent hover:bg-[#111c30]'}
      ${!isStarter ? 'opacity-80' : ''}`}>
      <div onClick={() => onSelect(selected ? null : player.id)} className="flex items-center gap-2 flex-1 cursor-pointer active:scale-[0.98] touch-manipulation">
        <div className="relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ background: m.color, opacity: player.injured ? 0.5 : 1 }}>
          {player.num}
          {player.injured && <span className="absolute -top-1 -right-1 text-[7px]">🩹</span>}
          {(player.specialRoles ?? []).includes('captain') && <span className="absolute -bottom-1 -right-1 text-[7px]">🪖</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold truncate text-slate-200">{displayName}</div>
          <div className="text-[9px] text-[#3a5070]">{m.label}{!isStarter && <span className="text-amber-400 ml-1">· innbytter</span>}</div>
        </div>
      </div>
      {isStarter && onSubstituteOut && (
        <button onClick={(e) => { e.stopPropagation(); onSubstituteOut(); }} 
          className="px-2 py-1 rounded-md text-[9px] font-semibold transition-all min-h-[32px] flex-shrink-0 bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25">
          🔄 Bytte ut
        </button>
      )}
      {!isStarter && onSubstituteIn && (
        <button onClick={(e) => { e.stopPropagation(); onSubstituteIn(); }} 
          className="px-2 py-1 rounded-md text-[9px] font-semibold transition-all min-h-[32px] flex-shrink-0 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25">
          ⬆️ Til start
        </button>
      )}
    </div>
  );
};

const AssignTab: React.FC<{
  players: any[]; playerAccounts: any[]; phaseIdx: number;
  onUpdate: (idx: number, id: string, fields: any) => void;
  homeTeamName: string;
}> = ({ players, playerAccounts, phaseIdx, onUpdate, homeTeamName }) => {
  const homePlayers = players.filter(p => p.team === 'home');

  const handleAssign = (playerId: string, accountId: string) => {
    const account = playerAccounts.find((a: any) => a.id === accountId);
    if (account) {
      onUpdate(phaseIdx, playerId, { name: account.name, playerAccountId: account.id });
    } else {
      onUpdate(phaseIdx, playerId, { name: '', playerAccountId: undefined });
    }
  };

  const allAccounts = playerAccounts.filter((a: any) => a.team !== 'away');

  return (
    <div>
      <p className="text-[10px] text-[#4a6080] mb-3 leading-relaxed">
        Koble spillerkontoer til brett-posisjoner. <span className="text-amber-400">💡 Velg en spiller fra listen</span>
      </p>
      <div className="space-y-1.5">
        {homePlayers.map(p => {
          const m = ROLE_META[p.role as keyof typeof ROLE_META] ?? null;
          const currentAccount = playerAccounts.find((a: any) => a.playerId === p.id);
          
          return (
            <div key={p.id} className="flex items-center gap-2 p-2 bg-[#0f1a2a] rounded-xl border border-[#1e3050]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: m?.color ?? '#555' }}>{p.num}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] text-[#4a6080]">{m?.label ?? p.role}</div>
                  <div className="text-[8px] text-[#4a6080]">
                    #{p.num} {p.name || 'Navnløs'}
                  </div>
                </div>
                <select 
                  value={currentAccount?.id ?? ''}
                  onChange={e => handleAssign(p.id, e.target.value)}
                  className="w-full mt-0.5 bg-[#111c30] border border-[#1e3050] rounded px-2 py-1
                    text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 min-h-[32px]"
                >
                  <option value="">– Ingen tilknytning –</option>
                  {allAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.positionPreferences ? `(${a.positionPreferences})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};