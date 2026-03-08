'use client';
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ROLE_META, getRolesForSport } from '../../data/roleInfo';
import { SPORT_FORMATIONS } from '../../data/formations';
import { Sport } from '../../types';

interface SidebarProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

const AWAY_COLORS = [
  { label: 'Rød',    hex: '#ef4444' },
  { label: 'Gul',    hex: '#f59e0b' },
  { label: 'Grønn',  hex: '#22c55e' },
  { label: 'Hvit',   hex: '#e2e8f0' },
  { label: 'Lilla',  hex: '#a855f7' },
  { label: 'Oransje',hex: '#f97316' },
  { label: 'Cyan',   hex: '#06b6d4' },
  { label: 'Rosa',   hex: '#ec4899' },
];

export const Sidebar: React.FC<SidebarProps> = ({ selectedPlayerId, onSelectPlayer }) => {
  const [tab, setTab]           = useState<'players' | 'roles'>('players');
  const [openRole, setOpenRole] = useState<string | null>(null);

  const { sport, setSport, phases, activePhaseIdx, awayTeamColor, setAwayTeamColor } = useAppStore();
  const phase = phases[activePhaseIdx];
  const roles = getRolesForSport(sport);

  return (
    <aside className="w-68 flex-shrink-0 flex flex-col h-full bg-[#0c1525] border-r border-[#1e3050] overflow-hidden"
      style={{ width: 272 }}>

      {/* Logo */}
      <div className="px-4 py-3 border-b border-[#1e3050]">
        <div className="text-base font-black tracking-tight"
          style={{ background:'linear-gradient(100deg,#38bdf8,#34d399,#a78bfa)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          ⚽ TAKTIKKBOARD
        </div>
        <div className="text-[10px] text-[#3a5070] mt-0.5">Profesjonell lagstrategi</div>
      </div>

      {/* Sport */}
      <div className="px-3 py-2.5 border-b border-[#1e3050]">
        <div className="text-[9px] font-bold text-[#3a5070] uppercase tracking-widest mb-2">Idrett</div>
        <div className="flex flex-col gap-1">
          {(Object.keys(SPORT_FORMATIONS) as Sport[]).map(sp => (
            <button key={sp} onClick={() => setSport(sp)}
              className={`px-3 py-2 rounded-lg text-[11.5px] font-semibold text-left border transition-all
                ${sport === sp
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-transparent text-[#3a5070] hover:bg-[#111c30] hover:text-slate-300'}`}>
              {SPORT_FORMATIONS[sp].emoji} {SPORT_FORMATIONS[sp].name}
            </button>
          ))}
        </div>
      </div>

      {/* Motstander-farge */}
      <div className="px-3 py-2 border-b border-[#1e3050]">
        <div className="text-[9px] font-bold text-[#3a5070] uppercase tracking-widest mb-2">✈️ Bortelag-farge</div>
        <div className="flex flex-wrap gap-1.5">
          {AWAY_COLORS.map(c => (
            <button key={c.hex}
              onClick={() => setAwayTeamColor(c.hex)}
              title={c.label}
              className={`w-6 h-6 rounded-full border-2 transition-all
                ${awayTeamColor === c.hex ? 'border-white scale-110' : 'border-transparent hover:border-white/40'}`}
              style={{ background: c.hex }} />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e3050]">
        {([['players','👥 Spillere'],['roles','📚 Roller']] as const).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[11.5px] font-semibold transition-all
              ${tab === t ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070] hover:text-slate-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Tab-innhold */}
      <div className="flex-1 overflow-y-auto p-2.5">

        {/* ── SPILLERE ── */}
        {tab === 'players' && phase && (
          <>
            <div className="bg-[#111c30] rounded-lg px-3 py-2 border border-[#1e3050] text-[11px] mb-2">
              <span className="text-[#3a5070]">Fase: </span>
              <span className="font-bold text-slate-300">{phase.name}</span>
              <span className="text-[#3a5070] ml-2">
                🔵 {phase.players.filter(p=>p.team==='home').length} &nbsp;
                🔴 {phase.players.filter(p=>p.team==='away').length}
              </span>
            </div>

            {(['home','away'] as const).map(team => (
              <div key={team} className="mb-1">
                <div className={`text-[9.5px] font-bold uppercase tracking-widest px-1 mb-1.5
                  ${team === 'home' ? 'text-blue-400' : 'text-red-400'}`}>
                  {team === 'home' ? '🏠 Hjemmelag' : '✈️ Bortelag'}
                </div>
                {phase.players.filter(p => p.team === team).map(p => {
                  const m   = ROLE_META[p.role] ?? ROLE_META['midfielder'];
                  const isSel = selectedPlayerId === p.id;
                  const min   = p.minutesPlayed ?? 0;
                  const ptColor = min > 60 ? '#ef4444' : min > 30 ? '#f59e0b' : '#22c55e';
                  return (
                    <div key={p.id} onClick={() => onSelectPlayer(isSel ? null : p.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all mb-0.5 border
                        ${isSel ? 'bg-sky-500/10 border-sky-500/40' : 'border-transparent hover:bg-[#111c30]'}`}>
                      <div className="relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: m.color, border: `2px solid ${team==='home'?'white':'#1e293b'}`, opacity: p.injured ? 0.5 : 1 }}>
                        {p.num}
                        {p.injured && <span className="absolute -top-1 -right-1 text-[8px]">🩹</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11.5px] font-semibold truncate">{p.name || `M${p.num}`}</div>
                        <div className="text-[9.5px] text-[#3a5070]">{m.label}</div>
                      </div>
                      {/* Spilletids-dot */}
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ptColor }} title={`${min} min`} />
                      {p.notes && <span className="text-[11px]" title={p.notes}>📝</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
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
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: m.color }}>{m.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-slate-200 font-semibold">{m.label}</div>
                      {!open && <div className="text-[10px] text-[#3a5070] truncate">{m.description.slice(0,48)}…</div>}
                    </div>
                    <span className="text-[#3a5070] text-[10px]">{open ? '▲' : '▼'}</span>
                  </div>
                  {open && (
                    <div className="mt-2 pl-10 space-y-2">
                      <p className="text-[11px] text-slate-400 leading-relaxed">{m.description}</p>
                      <div>
                        <div className="text-[9.5px] font-bold text-sky-400 uppercase tracking-wider mb-1">Ansvar</div>
                        <ul className="space-y-0.5">
                          {m.responsibilities.map((r2,i) => (
                            <li key={i} className="text-[10.5px] text-[#4a6080] flex gap-1.5">
                              <span className="text-sky-500">·</span>{r2}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Taktiske tips</div>
                        <ul className="space-y-0.5">
                          {m.tacticalTips.map((t,i) => (
                            <li key={i} className="text-[10.5px] text-[#4a6080] flex gap-1.5">
                              <span className="text-emerald-500">·</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {m.examplePlayers && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {m.examplePlayers.map((ep,i) => (
                            <span key={i} className="text-[10px] bg-[#0f1a2a] px-2 py-0.5 rounded-full text-slate-400 border border-[#1e3050]">{ep}</span>
                          ))}
                        </div>
                      )}
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
