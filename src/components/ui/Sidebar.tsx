'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META, getRolesForSport } from '@/data/roleInfo';

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
      style={{ width: 260 }}>

      {/* ── Lagnavn header ── */}
      <div className="px-3 py-2.5 border-b border-[#1e3050]">
        <div className="text-[11px] font-black tracking-tight mb-0.5"
          style={{ background: 'linear-gradient(90deg,#38bdf8,#34d399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚽ TAKTIKKBOARD
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-blue-400 font-semibold truncate">{homeTeamName || 'Hjemmelag'}</span>
          <span className="text-[#2a4060]">vs</span>
          <span className="text-red-400 font-semibold truncate">{awayTeamName || 'Bortelag'}</span>
        </div>
      </div>

      {/* ── Bortelag-farge ── */}
      <div className="px-3 py-2 border-b border-[#1e3050] flex items-center gap-2">
        <span className="text-[8.5px] font-bold text-[#3a5070] uppercase tracking-widest shrink-0">
          Bortef.
        </span>
        <div className="flex flex-wrap gap-1">
          {AWAY_COLORS.map(c => (
            <button key={c.hex} onClick={() => setAwayTeamColor(c.hex)} title={c.label}
              className={`w-4.5 h-4.5 rounded-full border-2 transition-all
                ${awayTeamColor === c.hex ? 'border-white scale-125' : 'border-transparent hover:border-white/40'}`}
              style={{ background: c.hex, width: 18, height: 18, borderRadius: '50%',
                border: awayTeamColor === c.hex ? '2px solid white' : '2px solid transparent',
                transform: awayTeamColor === c.hex ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s' }} />
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#1e3050] flex-shrink-0">
        {([
          ['players', '👥'],
          ['assign',  '🔗'],
          ['roles',   '📚'],
        ] as const).map(([t, e]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[12px] font-semibold transition-all min-h-[40px]
              ${tab === t
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-[#3a5070] hover:text-slate-400'}`}>
            {e}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">

        {/* ── SPILLERLISTE ── */}
        {tab === 'players' && phase && (
          <>
            <div className="bg-[#111c30] rounded-lg px-2.5 py-1.5 border border-[#1e3050]
              text-[10.5px] mb-2">
              <span className="text-[#3a5070]">Fase: </span>
              <span className="font-bold text-slate-300">{phase.name}</span>
              <span className="text-[#3a5070] ml-2">
                🔵 {players.filter(p => p.team === 'home').length}
                {' '}🔴 {players.filter(p => p.team === 'away').length}
              </span>
            </div>

            {(['home', 'away'] as const).map(team => (
              <div key={team} className="mb-2">
                <div className={`text-[9px] font-bold uppercase tracking-widest px-1 mb-1
                  ${team === 'home' ? 'text-blue-400' : 'text-red-400'}`}>
                  {team === 'home'
                    ? `🏠 ${homeTeamName || 'Hjemmelag'}`
                    : `✈️ ${awayTeamName || 'Bortelag'}`}
                </div>
                {players.filter(p => p.team === team).map(p => {
                  const m     = ROLE_META[p.role] ?? ROLE_META['midfielder'];
                  const isSel = selectedPlayerId === p.id;
                  const isStart = p.isStarter !== false;
                  return (
                    <div key={p.id}
                      onClick={() => onSelectPlayer(isSel ? null : p.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                        transition-all mb-0.5 border active:scale-[0.98] touch-manipulation
                        ${isSel
                          ? 'bg-sky-500/10 border-sky-500/40'
                          : 'border-transparent hover:bg-[#111c30]'}
                        ${!isStart ? 'opacity-55' : ''}`}>
                      <div className="relative w-6 h-6 rounded-full flex items-center justify-center
                        text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: m.color, opacity: p.injured ? 0.5 : 1 }}>
                        {p.num}
                        {p.injured && <span className="absolute -top-1 -right-1 text-[7px]">🩹</span>}
                        {(p.specialRoles ?? []).includes('captain') &&
                          <span className="absolute -bottom-1 -right-1 text-[7px]">🪖</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold truncate text-slate-200">
                          {p.name || `#${p.num}`}
                        </div>
                        <div className="text-[9px] text-[#3a5070] flex items-center gap-1">
                          {m.label}
                          {!isStart && <span className="text-amber-400">· sub</span>}
                        </div>
                      </div>
                      {p.notes && <span className="text-[10px]" title={p.notes}>📝</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {/* ── TILDEL spiller → brett-slot ── */}
        {tab === 'assign' && phase && (
          <AssignTab
            players={players}
            playerAccounts={playerAccounts as any[]}
            phaseIdx={activePhaseIdx}
            onUpdate={updatePlayerField}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
          />
        )}

        {/* ── ROLLER ── */}
        {tab === 'roles' && (
          <div className="space-y-1">
            <p className="text-[10px] text-[#3a5070] px-1 mb-2">Klikk for forklaring</p>
            {roles.map(r => {
              const m    = ROLE_META[r]; if (!m) return null;
              const open = openRole === r;
              return (
                <button key={r} onClick={() => setOpenRole(open ? null : r)}
                  className="w-full text-left rounded-xl border px-2.5 py-2 transition-all
                    border-transparent hover:bg-[#0f1a2a]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center
                      text-[11px] flex-shrink-0" style={{ background: m.color }}>
                      {m.emoji}
                    </div>
                    <div className="text-[11.5px] text-slate-200 font-semibold flex-1 truncate">
                      {m.label}
                    </div>
                    <span className="text-[#3a5070] text-[9px]">{open ? '▲' : '▼'}</span>
                  </div>
                  {open && (
                    <div className="mt-2 pl-8">
                      <p className="text-[10.5px] text-slate-400 leading-relaxed">
                        {m.description}
                      </p>
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

// ═══ TILDEL-TAB ═══════════════════════════════════════════════

const AssignTab: React.FC<{
  players: any[];
  playerAccounts: any[];
  phaseIdx: number;
  onUpdate: (idx: number, playerId: string, fields: any) => void;
  homeTeamName: string;
  awayTeamName: string;
}> = ({ players, playerAccounts, phaseIdx, onUpdate, homeTeamName, awayTeamName }) => {
  const homePlayers = players.filter(p => p.team === 'home');
  const awayPlayers = players.filter(p => p.team === 'away');

  return (
    <div>
      <p className="text-[10px] text-[#4a6080] mb-3 leading-relaxed">
        Koble registrerte spillere til brett-posisjoner.
      </p>

      <div className="text-[8.5px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">
        🏠 {homeTeamName || 'Hjemmelag'}
      </div>
      <div className="space-y-1.5 mb-4">
        {homePlayers.map(p => {
          const m = ROLE_META[p.role as keyof typeof ROLE_META] ?? null;
          const linked = playerAccounts.find((a: any) => a.playerId === p.id);
          return (
            <div key={p.id}
              className="flex items-center gap-2 p-2 bg-[#0f1a2a] rounded-xl border border-[#1e3050]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center
                text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: m?.color ?? '#555' }}>
                {p.num}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] text-[#4a6080]">{m?.label ?? p.role}</div>
                <select
                  value={linked?.id ?? ''}
                  onChange={e => {
                    const acc = playerAccounts.find((a: any) => a.id === e.target.value);
                    onUpdate(phaseIdx, p.id, { name: acc?.name ?? '' });
                  }}
                  className="w-full mt-0.5 bg-[#111c30] border border-[#1e3050] rounded-lg
                    px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none
                    focus:border-sky-500 min-h-[36px]">
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

      <div className="text-[8.5px] font-bold text-red-400 uppercase tracking-widest mb-1.5">
        ✈️ {awayTeamName || 'Bortelag'}
      </div>
      <div className="space-y-1.5">
        {awayPlayers.map(p => {
          const m = ROLE_META[p.role as keyof typeof ROLE_META] ?? null;
          return (
            <div key={p.id}
              className="flex items-center gap-2 p-2 bg-[#0f1a2a] rounded-xl border border-[#1e3050]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center
                text-[10px] font-bold text-white flex-shrink-0 opacity-60"
                style={{ background: m?.color ?? '#555' }}>
                {p.num}
              </div>
              <input
                value={p.name}
                onChange={e => onUpdate(phaseIdx, p.id, { name: e.target.value })}
                placeholder={`#${p.num}`}
                className="flex-1 bg-[#111c30] border border-[#1e3050] rounded-lg
                  px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none
                  focus:border-red-500 min-h-[36px]" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
