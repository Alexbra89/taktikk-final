'use client';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META } from '@/data/roleInfo';

// ═══════════════════════════════════════════════════════════════
//  DOMMER-VISNING
//  Vises når currentUser.role === 'referee'
//  · Navn, nummer, drakt, lag — ingen redigering
//  · Kampklokke
//  · Gult/rødt kort-registrering (lokal logg)
//  · Enkel dommer-PIN login via trener-dashboard
// ═══════════════════════════════════════════════════════════════

interface CardEvent {
  boardPlayerId: string;
  playerName: string;
  num: number;
  team: string;
  type: 'yellow' | 'red';
  minute: number;
}

export const RefereeView: React.FC = () => {
  const {
    phases, homeTeamName, awayTeamName, currentUser,
    refereePin, setRefereePin, logout,
  } = useAppStore();

  const [matchMinute, setMatchMinute] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [cardLog, setCardLog]   = useState<CardEvent[]>([]);
  const [sending, setSending]   = useState<string | null>(null);

  // Kampklokke
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setMatchMinute(m => m + 1), 60000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const phase      = (phases[0] as any) ?? null;
  const allPlayers: any[] = phase?.players ?? [];
  const homePlayers = allPlayers.filter((p: any) => p.team === 'home');
  const awayPlayers = allPlayers.filter((p: any) => p.team === 'away');

  // Vis bare startere (isStarter !== false)
  const homeStarters = homePlayers.filter((p: any) => p.isStarter !== false);
  const awayStarters = awayPlayers.filter((p: any) => p.isStarter !== false);

  const registerCard = (player: any, type: 'yellow' | 'red') => {
    setSending(`${player.id}-${type}`);
    const ev: CardEvent = {
      boardPlayerId: player.id,
      playerName:    player.name || `#${player.num ?? player.number ?? '?'}`,
      num:           player.num ?? player.number ?? 0,
      team:          player.team === 'home'
                       ? (homeTeamName || 'Hjemmelag')
                       : (awayTeamName || 'Bortelag'),
      type,
      minute:        matchMinute,
    };
    setCardLog(prev => [...prev, ev]);
    setTimeout(() => setSending(null), 600);
  };

  return (
    <div className="flex flex-col h-full bg-[#060c18]">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050] flex-shrink-0">
        <div className="text-sm font-black text-slate-100">🏁 Dommervisning</div>

        {/* Kampklokke */}
        <div className="flex items-center gap-2 ml-4">
          <div className={`text-[18px] font-black tabular-nums
            ${timerRunning ? 'text-emerald-400' : 'text-[#4a6080]'}`}>
            {String(Math.floor(matchMinute / 60)).padStart(2, '0')}:{String(matchMinute % 60).padStart(2, '0')}
          </div>
          <button onClick={() => setTimerRunning(r => !r)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all min-h-[36px]
              ${timerRunning
                ? 'bg-red-500/15 border-red-500 text-red-400'
                : 'bg-emerald-500/15 border-emerald-500 text-emerald-400'}`}>
            {timerRunning ? '⏸' : '▶'}
          </button>
          <button onClick={() => { setTimerRunning(false); setMatchMinute(0); }}
            className="px-2 py-1.5 rounded-lg text-[11px] border border-[#1e3050]
              text-[#4a6080] hover:text-red-400 transition min-h-[36px]">↺</button>
          <div className="flex gap-1">
            <button onClick={() => setMatchMinute(m => Math.max(0, m - 1))}
              className="w-7 h-7 rounded bg-[#111c30] border border-[#1e3050] text-[#4a6080]
                hover:text-slate-300 text-[11px]">−</button>
            <button onClick={() => setMatchMinute(m => m + 1)}
              className="w-7 h-7 rounded bg-[#111c30] border border-[#1e3050] text-[#4a6080]
                hover:text-slate-300 text-[11px]">+</button>
          </div>
        </div>

        <div className="flex-1" />

        {/* PIN-innstilling for dommer */}
        <RefereePinSetter pin={refereePin} onSave={setRefereePin} />

        <button onClick={logout}
          className="text-[11px] text-[#4a6080] hover:text-red-400 transition px-2 min-h-[36px]">
          Logg ut
        </button>
      </div>

      {/* ── Lagvisning ── */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">

          {/* Hjemmelag */}
          <TeamPanel
            title={homeTeamName || 'Hjemmelag'}
            players={homeStarters}
            teamColor="#3b82f6"
            sending={sending}
            matchMinute={matchMinute}
            onCard={registerCard}
          />

          {/* Bortelag */}
          <TeamPanel
            title={awayTeamName || 'Bortelag'}
            players={awayStarters}
            teamColor="#ef4444"
            sending={sending}
            matchMinute={matchMinute}
            onCard={registerCard}
          />
        </div>

        {/* ── Kortlogg ── */}
        {cardLog.length > 0 && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">
              📋 Kortlogg denne kampen
            </div>
            <div className="space-y-2">
              {[...cardLog].reverse().map((ev, i) => (
                <div key={i}
                  className="flex items-center gap-3 p-3 bg-[#0c1525] rounded-xl border border-[#1e3050]">
                  <span className="text-xl">{ev.type === 'yellow' ? '🟡' : '🔴'}</span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-200 text-[13px]">
                      #{ev.num} {ev.playerName}
                    </span>
                    <span className="text-[11px] text-[#4a6080] ml-2">{ev.team}</span>
                  </div>
                  <span className="text-[11px] text-[#4a6080]">Min {ev.minute}'</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Lagpanel ────────────────────────────────────────────────

const TeamPanel: React.FC<{
  title: string;
  players: any[];
  teamColor: string;
  sending: string | null;
  matchMinute: number;
  onCard: (player: any, type: 'yellow' | 'red') => void;
}> = ({ title, players, teamColor, sending, matchMinute, onCard }) => (
  <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl overflow-hidden">
    <div className="px-4 py-3 border-b border-[#1e3050] flex items-center gap-2"
      style={{ background: `${teamColor}18` }}>
      <div className="w-3 h-3 rounded-full" style={{ background: teamColor }} />
      <span className="font-black text-slate-100 text-[14px]">{title}</span>
      <span className="text-[11px] text-[#4a6080] ml-auto">{players.length} spillere</span>
    </div>
    <div className="divide-y divide-[#1e3050]">
      {players.length === 0 ? (
        <div className="px-4 py-6 text-center text-[12px] text-[#3a5070]">
          Ingen startspillere registrert
        </div>
      ) : (
        players.map((p: any) => {
          const num   = p.num ?? p.number ?? 0;
          const name  = p.name || `#${num}`;
          const meta  = ROLE_META[p.role as keyof typeof ROLE_META] ?? null;
          const yKey  = `${p.id}-yellow`;
          const rKey  = `${p.id}-red`;
          return (
            <div key={p.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition">
              {/* Drakt-nummer */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center
                font-black text-[14px] text-white flex-shrink-0"
                style={{ background: meta?.color ?? teamColor }}>
                {num}
              </div>
              {/* Navn + posisjon */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-200 text-[13px] truncate">{name}</div>
                <div className="text-[10px] text-[#4a6080]">{meta?.label ?? p.role}</div>
              </div>
              {/* Kortknapper */}
              <div className="flex gap-2">
                <button
                  onClick={() => onCard(p, 'yellow')}
                  disabled={sending === yKey}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl
                    bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/30
                    active:scale-90 transition-all disabled:opacity-40 touch-manipulation">
                  🟡
                </button>
                <button
                  onClick={() => onCard(p, 'red')}
                  disabled={sending === rKey}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl
                    bg-red-500/15 border border-red-500/40 hover:bg-red-500/30
                    active:scale-90 transition-all disabled:opacity-40 touch-manipulation">
                  🔴
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

// ─── PIN-setter (inline) ─────────────────────────────────────

const RefereePinSetter: React.FC<{
  pin: string; onSave: (pin: string) => void;
}> = ({ pin, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(pin);

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="text-[10px] text-[#3a5070] hover:text-sky-400 transition px-2 min-h-[36px]">
        PIN: {pin}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        type="password" maxLength={4}
        value={val}
        onChange={e => setVal(e.target.value.replace(/\D/g, '').slice(0, 4))}
        className="w-16 bg-[#111c30] border border-sky-500 rounded-lg px-2 py-1
          text-center text-[13px] text-slate-200 focus:outline-none tracking-widest"
        placeholder="••••" />
      <button onClick={() => { onSave(val || pin); setEditing(false); }}
        className="text-[11px] text-emerald-400 hover:text-emerald-300 px-1">✓</button>
      <button onClick={() => { setVal(pin); setEditing(false); }}
        className="text-[11px] text-[#4a6080] hover:text-red-400 px-1">✕</button>
    </div>
  );
};
