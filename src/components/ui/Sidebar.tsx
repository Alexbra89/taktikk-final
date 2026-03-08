'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META, getRolesForSport } from '@/data/roleInfo';

// ═══════════════════════════════════════════════════════════════
//  SIDEBAR – vises kun for trener på Brett-visningen
//  · Idrett-bytter FJERNET (valgt ved login, kan endres i innstillinger)
//  · Spillerliste med klikk → PlayerEditor
//  · Nedtrekksmeny for å tildele spiller til brett-slot
// ═══════════════════════════════════════════════════════════════

const AWAY_COLORS = [
  { label: 'Rød',     hex: '#ef4444' },
  { label: 'Gul',     hex: '#f59e0b' },
  { label: 'Grønn',   hex: '#22c55e' },
  { label: 'Hvit',    hex: '#e2e8f0' },
  { label: 'Lilla',   hex: '#a855f7' },
  { label: 'Oransje', hex: '#f97316' },
  { label: 'Cyan',    hex: '#06b6d4' },
  { label: 'Rosa',    hex: '#ec4899' },
];

interface SidebarProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedPlayerId, onSelectPlayer }) => {
  const [tab, setTab]           = useState<'players' | 'assign' | 'roles'>('players');
  const [openRole, setOpenRole] = useState<string | null>(null);

  const {
    sport, phases, activePhaseIdx, awayTeamColor, setAwayTeamColor,
    updatePlayerField, playerAccounts, homeTeamName, awayTeamName,
  } = useAppStore();

  const phase   = phases[activePhaseIdx];
  const roles   = getRolesForSport(sport);
  const players = phase?.players ?? [];

  return (
    <aside className="flex-shrink-0 flex flex-col h-full bg-[#0c1525] border-r border-[#1e3050] overflow-hidden"
      style={{ width: 272 }}>

      {/* ── Logo + lagnavn ── */}
      <div className="px-4 py-3 border-b border-[#1e3050]">
        <div className="text-[13px] font-black tracking-tight mb-0.5"
          style={{ background: 'linear-gradient(100deg,#38bdf8,#34d399,#a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚽ TAKTIKKBOARD
        </div>
        <div className="text-[10px] text-[#3a5070]">Profesjonell lagstrategi</div>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-[#4a6080]">
          <span className="text-blue-400 font-semibold">{homeTeamName || 'Hjemmelag'}</span>
          <span>vs</span>
          <span className="text-red-400 font-semibold">{awayTeamName || 'Bortelag'}</span>
        </div>
      </div>

      {/* ── Bortelag-farge (kompakt) ── */}
      <div className="px-3 py-2 border-b border-[#1e3050] flex items-center gap-2">
        <span className="text-[9px] font-bold text-[#3a5070] uppercase tracking-widest shrink-0">
          ✈️ Bortef.
        </span>
        <div className="flex flex-wrap gap-1">
          {AWAY_COLORS.map(c => (
            <button key={c.hex} onClick={() => setAwayTeamColor(c.hex)} title={c.label}
              className={`w-5 h-5 rounded-full border-2 transition-all
                ${awayTeamColor === c.hex ? 'border-white scale-110' : 'border-transparent hover:border-white/40'}`}
              style={{ background: c.hex }} />
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#1e3050] flex-shrink-0">
        {([
          ['players', '👥 Spillere'],
          ['assign',  '🔗 Tildel'],
          ['roles',   '📚 Roller'],
        ] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10.5px] font-semibold transition-all
              ${tab === t ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070] hover:text-slate-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Tab-innhold ── */}
      <div className="flex-1 overflow-y-auto p-2.5">

        {/* ── SPILLERLISTE ── */}
        {tab === 'players' && phase && (
          <>
            <div className="bg-[#111c30] rounded-lg px-3 py-2 border border-[#1e3050] text-[11px] mb-2">
              <span className="text-[#3a5070]">Fase: </span>
              <span className="font-bold text-slate-300">{phase.name}</span>
              <span className="text-[#3a5070] ml-2">
                🔵 {players.filter(p => p.team === 'home').length}
                &nbsp;🔴 {players.filter(p => p.team === 'away').length}
              </span>
            </div>

            {(['home', 'away'] as const).map(team => (
              <div key={team} className="mb-2">
                <div className={`text-[9.5px] font-bold uppercase tracking-widest px-1 mb-1.5
                  ${team === 'home' ? 'text-blue-400' : 'text-red-400'}`}>
                  {team === 'home'
                    ? `🏠 ${homeTeamName || 'Hjemmelag'}`
                    : `✈️ ${awayTeamName || 'Bortelag'}`}
                </div>
                {players.filter(p => p.team === team).map(p => {
                  const m     = ROLE_META[p.role] ?? ROLE_META['midfielder'];
                  const isSel = selectedPlayerId === p.id;
                  const min   = p.minutesPlayed ?? 0;
                  const ptCol = min > 60 ? '#ef4444' : min > 30 ? '#f59e0b' : '#22c55e';
                  const isStart = p.isStarter !== false;
                  return (
                    <div key={p.id}
                      onClick={() => onSelectPlayer(isSel ? null : p.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                        transition-all mb-0.5 border
                        ${isSel ? 'bg-sky-500/10 border-sky-500/40' : 'border-transparent hover:bg-[#111c30]'}
                        ${!isStart ? 'opacity-60' : ''}`}>
                      <div className="relative w-6 h-6 rounded-full flex items-center justify-center
                        text-[10px] font-bold text-white flex-shrink-0"
                        style={{
                          background: m.color,
                          border: `2px solid ${team === 'home' ? 'white' : '#1e293b'}`,
                          opacity: p.injured ? 0.5 : 1,
                        }}>
                        {p.num}
                        {p.injured && <span className="absolute -top-1 -right-1 text-[7px]">🩹</span>}
                        {(p.specialRoles ?? []).includes('captain') &&
                          <span className="absolute -bottom-1 -right-1 text-[7px]">🪖</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11.5px] font-semibold truncate text-slate-200">
                          {p.name || `#${p.num}`}
                        </div>
                        <div className="text-[9px] text-[#3a5070] flex items-center gap-1">
                          {m.label}
                          {!isStart && <span className="text-amber-400">· innbytter</span>}
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ptCol }}
                        title={`${min} min`} />
                      {p.notes && <span className="text-[10px]" title={p.notes}>📝</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {/* ── TILDEL SPILLERE til brett-posisjoner ── */}
        {tab === 'assign' && phase && (
          <AssignTab
            players={players}
            playerAccounts={playerAccounts as any[]}
            phaseIdx={activePhaseIdx}
            onUpdate={updatePlayerField}
          />
        )}

        {/* ── ROLLER ── */}
        {tab === 'roles' && (
          <div className="space-y-1">
            <p className="text-[10px] text-[#3a5070] px-1 mb-2">Klikk for full forklaring</p>
            {roles.map(r => {
              const m    = ROLE_META[r]; if (!m) return null;
              const open = openRole === r;
              return (
                <button key={r} onClick={() => setOpenRole(open ? null : r)}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all
                    ${open ? 'bg-[#111c30] border-[#1e3050]' : 'border-transparent hover:bg-[#0f1a2a]'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: m.color }}>{m.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-slate-200 font-semibold">{m.label}</div>
                      {!open && (
                        <div className="text-[10px] text-[#3a5070] truncate">
                          {m.description.slice(0, 48)}…
                        </div>
                      )}
                    </div>
                    <span className="text-[#3a5070] text-[10px]">{open ? '▲' : '▼'}</span>
                  </div>
                  {open && (
                    <div className="mt-2 pl-9 space-y-2">
                      <p className="text-[11px] text-slate-400 leading-relaxed">{m.description}</p>
                      <ul className="space-y-0.5">
                        {m.responsibilities.map((r2, i) => (
                          <li key={i} className="text-[10.5px] text-[#4a6080] flex gap-1.5">
                            <span className="text-sky-500">·</span>{r2}
                          </li>
                        ))}
                      </ul>
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

// ═══ TILDEL-TAB: koble registrerte spillere til brett-posisjoner ═══

const AssignTab: React.FC<{
  players: any[];
  playerAccounts: any[];
  phaseIdx: number;
  onUpdate: (phaseIdx: number, playerId: string, fields: any) => void;
}> = ({ players, playerAccounts, phaseIdx, onUpdate }) => {
  const homeAccounts = playerAccounts.filter((a: any) => a.team !== 'away');

  // Bygg en mapping: brett-spiller → konto-navn
  const getLinked = (boardPlayerId: string) =>
    playerAccounts.find((a: any) => a.playerId === boardPlayerId)?.name ?? null;

  const homePlayers = players.filter(p => p.team === 'home');
  const awayPlayers = players.filter(p => p.team === 'away');

  return (
    <div>
      <p className="text-[10.5px] text-[#4a6080] mb-3 leading-relaxed">
        Velg hvilken registrert spiller som skal stå i hver posisjon.
        Navne-endringen vises på brettet og for dommeren.
      </p>

      <div className="text-[9.5px] font-bold text-blue-400 uppercase tracking-widest mb-2">
        🏠 Hjemmelag
      </div>
      <div className="space-y-1.5 mb-4">
        {homePlayers.map(p => {
          const m = ROLE_META[p.role as keyof typeof ROLE_META] ?? null;
          return (
            <div key={p.id}
              className="flex items-center gap-2 p-2.5 bg-[#0f1a2a] rounded-xl border border-[#1e3050]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center
                text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: m?.color ?? '#555' }}>
                {p.num}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-[#4a6080]">{m?.label ?? p.role}</div>
                <select
                  value={getLinked(p.id) ? playerAccounts.find((a: any) => a.playerId === p.id)?.id ?? '' : ''}
                  onChange={e => {
                    const acc = playerAccounts.find((a: any) => a.id === e.target.value);
                    if (acc) {
                      onUpdate(phaseIdx, p.id, { name: acc.name, num: p.num });
                    } else {
                      // reset to generic name
                      onUpdate(phaseIdx, p.id, { name: '' });
                    }
                  }}
                  className="w-full mt-1 bg-[#111c30] border border-[#1e3050] rounded-lg
                    px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none
                    focus:border-sky-500 min-h-[36px]">
                  <option value="">– {p.name || `#${p.num}`} –</option>
                  {homeAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[9.5px] font-bold text-red-400 uppercase tracking-widest mb-2">
        ✈️ Bortelag
      </div>
      <div className="space-y-1.5">
        {awayPlayers.map(p => {
          const m = ROLE_META[p.role as keyof typeof ROLE_META] ?? null;
          return (
            <div key={p.id}
              className="flex items-center gap-2 p-2.5 bg-[#0f1a2a] rounded-xl border border-[#1e3050]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center
                text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: m?.color ?? '#555', opacity: 0.6 }}>
                {p.num}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-[#4a6080]">{m?.label ?? p.role}</div>
                <input
                  value={p.name}
                  onChange={e => onUpdate(phaseIdx, p.id, { name: e.target.value })}
                  placeholder={`Motstander #${p.num}`}
                  className="w-full mt-1 bg-[#111c30] border border-[#1e3050] rounded-lg
                    px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none
                    focus:border-red-500 min-h-[36px]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
