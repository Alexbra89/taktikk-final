'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META, getRolesForSport } from '@/data/roleInfo';

const FORMATION_NAMES: Record<string, string> = {
  football: '4-3-3',
  football7: '3-2-1',
  handball: '6-0',
};

interface SidebarProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedPlayerId, onSelectPlayer }) => {
  const [tab, setTab]           = useState<'players' | 'assign' | 'roles'>('players');
  const [openRole, setOpenRole] = useState<string | null>(null);

  const {
    sport, phases, activePhaseIdx,
    updatePlayerField, playerAccounts, homeTeamName,
  } = useAppStore();

  const phase   = phases[activePhaseIdx];
  const roles   = getRolesForSport(sport);
  const players = phase?.players ?? [];
  const homePlayers = players.filter(p => p.team === 'home');
  const starters    = homePlayers.filter(p => p.isStarter !== false && p.isOnField !== false);
  const subs        = homePlayers.filter(p => p.isStarter === false || p.isOnField === false);

  const sportEmoji = sport === 'handball' ? '🤾' : '⚽';
  const sportLabel = sport === 'handball' ? 'Håndball' : sport === 'football7' ? 'Fotball 7er' : 'Fotball 11er';

  return (
    <aside className="flex-shrink-0 flex flex-col h-full bg-[#0c1525] border-r border-[#1e3050] overflow-hidden"
      style={{ width: 260 }}>

      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1e3050]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-black"
            style={{ background: 'linear-gradient(90deg,#38bdf8,#34d399)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {homeTeamName || 'TAKTIKKBOARD'}
          </span>
        </div>
        {/* Formation + sport */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#4a6080]">{sportEmoji} {sportLabel}</span>
          <span className="text-[#2a4060]">·</span>
          <span className="text-amber-400/70 font-semibold">
            {FORMATION_NAMES[sport] ?? ''} formasjon
          </span>
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

        {/* ── SPILLERLISTE ── */}
        {tab === 'players' && phase && (
          <>
            {/* Startoppstilling */}
            <div className="text-[8.5px] font-bold text-sky-400 uppercase tracking-widest px-1 mb-1">
              ⚽ Startoppstilling ({starters.length})
            </div>
            {starters.map(p => (
              <PlayerRow 
                key={p.id} 
                player={p} 
                selected={selectedPlayerId === p.id} 
                onSelect={onSelectPlayer} 
                playerAccounts={playerAccounts as any[]}
              />
            ))}

            {/* Innbyttere */}
            {subs.length > 0 && (
              <>
                <div className="flex items-center gap-2 my-2 px-1">
                  <div className="h-px flex-1 bg-[#1e3050]" />
                  <span className="text-[8.5px] font-bold text-amber-400 uppercase tracking-widest">
                    🪑 Innbyttere ({subs.length})
                  </span>
                  <div className="h-px flex-1 bg-[#1e3050]" />
                </div>
                {subs.map(p => (
                  <PlayerRow 
                    key={p.id} 
                    player={p} 
                    selected={selectedPlayerId === p.id} 
                    onSelect={onSelectPlayer} 
                    isSub 
                    playerAccounts={playerAccounts as any[]}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ── TILDEL ── */}
        {tab === 'assign' && phase && (
          <AssignTab players={players} playerAccounts={playerAccounts as any[]}
            phaseIdx={activePhaseIdx} onUpdate={updatePlayerField}
            homeTeamName={homeTeamName} />
        )}

        {/* ── ROLLER ── */}
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
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-shrink-0"
                      style={{ background: m.color }}>{m.emoji}</div>
                    <div className="text-[11.5px] text-slate-200 font-semibold flex-1 truncate">{m.label}</div>
                    <span className="text-[#3a5070] text-[9px]">{open ? '▲' : '▼'}</span>
                  </div>
                  {open && (
                    <div className="mt-2 pl-8">
                      <p className="text-[10.5px] text-slate-400 leading-relaxed">{m.description}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

const PlayerRow: React.FC<{
  player: any; selected: boolean;
  onSelect: (id: string | null) => void; isSub?: boolean;
  playerAccounts?: any[];
}> = ({ player, selected, onSelect, isSub, playerAccounts = [] }) => {
  const m = ROLE_META[player.role as keyof typeof ROLE_META] ?? ROLE_META['midfielder'];
  
  // Finn spillerkonto for å få riktig navn
  const account = playerAccounts.find((acc: any) => acc.playerId === player.id);
  const displayName = account?.name || player.name || `#${player.num}`;
  
  return (
    <div onClick={() => onSelect(selected ? null : player.id)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
        transition-all mb-0.5 border active:scale-[0.98] touch-manipulation
        ${selected ? 'bg-sky-500/10 border-sky-500/40' : 'border-transparent hover:bg-[#111c30]'}
        ${isSub ? 'opacity-70' : ''}`}>
      <div className="relative w-6 h-6 rounded-full flex items-center justify-center
        text-[10px] font-bold text-white flex-shrink-0"
        style={{ background: m.color, opacity: player.injured ? 0.5 : 1 }}>
        {player.num}
        {player.injured && <span className="absolute -top-1 -right-1 text-[7px]">🩹</span>}
        {(player.specialRoles ?? []).includes('captain') &&
          <span className="absolute -bottom-1 -right-1 text-[7px]">🪖</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold truncate text-slate-200">
          {displayName}
        </div>
        <div className="text-[9px] text-[#3a5070]">
          {m.label}{isSub && <span className="text-amber-400 ml-1">· innbytter</span>}
        </div>
      </div>
    </div>
  );
};

const AssignTab: React.FC<{
  players: any[]; playerAccounts: any[]; phaseIdx: number;
  onUpdate: (idx: number, id: string, fields: any) => void;
  homeTeamName: string;
}> = ({ players, playerAccounts, phaseIdx, onUpdate, homeTeamName }) => {
  const homePlayers = players.filter(p => p.team === 'home');
  return (
    <div>
      <p className="text-[10px] text-[#4a6080] mb-3 leading-relaxed">
        Koble spillerkontoer til brett-posisjoner.
      </p>
      <div className="space-y-1.5">
        {homePlayers.map(p => {
          const m = ROLE_META[p.role as keyof typeof ROLE_META] ?? null;
          return (
            <div key={p.id} className="flex items-center gap-2 p-2 bg-[#0f1a2a] rounded-xl border border-[#1e3050]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: m?.color ?? '#555' }}>{p.num}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] text-[#4a6080]">{m?.label ?? p.role}</div>
                <select value={playerAccounts.find((a: any) => a.playerId === p.id)?.id ?? ''}
                  onChange={e => {
                    const acc = playerAccounts.find((a: any) => a.id === e.target.value);
                    onUpdate(phaseIdx, p.id, { name: acc?.name ?? '' });
                  }}
                  className="w-full mt-0.5 bg-[#111c30] border border-[#1e3050] rounded px-2 py-1
                    text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 min-h-[32px]">
                  <option value="">– {p.name || `#${p.num}`} –</option>
                  {playerAccounts.filter((a: any) => a.team !== 'away').map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
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