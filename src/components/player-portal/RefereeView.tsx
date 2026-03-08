'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { ROLE_META } from '../../data/roleInfo';

// ═══════════════════════════════════════════════════════════════
//  DOMMER-VISNING
//  – Viser kun navn, nummer og lag
//  – Dommer kan registrere gult/rødt kort → INSERT til Supabase
//  – Trener/spiller mottar varsel via Realtime-kanal
// ═══════════════════════════════════════════════════════════════

interface CardEvent {
  playerId: string;
  playerName: string;
  type: 'yellow' | 'red';
  minute: number;
  at: string; // ISO timestamp
}

export const RefereeView: React.FC = () => {
  const { phases, playerAccounts } = useAppStore();

  const [matchMinute, setMatchMinute] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [events, setEvents]     = useState<CardEvent[]>([]);
  const [sending, setSending]   = useState<string | null>(null); // playerId currently sending
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [refPin, setRefPin]     = useState('');
  const [authed, setAuthed]     = useState(false);
  const [pinError, setPinError] = useState('');

  // Simple referee PIN (store could expose this; hardcoded for now)
  const REF_PIN = '0000';

  // ─── Live kampklokke ────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setMatchMinute(m => m + 1), 60000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // ─── Hent spillere fra Zustand (brett fase 0) ───────────
  const phase = (phases[0] as any) ?? null;
  const allPlayers: any[] = phase?.players ?? [];

  // Grupper etter lag
  const homePlayers = allPlayers.filter((p: any) => p.team === 'home');
  const awayPlayers = allPlayers.filter((p: any) => p.team === 'away');

  // ─── Finn Supabase player_account_id fra lokal konto ────
  const getAccountId = (boardPlayerId: string): string | null => {
    const acc = (playerAccounts as any[]).find((a: any) => a.playerId === boardPlayerId);
    return acc?.id ?? null;
  };

  // ─── Send hendelse til Supabase ──────────────────────────
  const registerCard = async (player: any, type: 'yellow' | 'red') => {
    const accountId = getAccountId(player.id);
    setSending(`${player.id}-${type}`);

    const payload = {
      player_account_id: accountId,   // null hvis ikke koblet
      event_type:        `${type}_card`,
      minute:            matchMinute,
      note:              `${type === 'yellow' ? 'Gult' : 'Rødt'} kort – min ${matchMinute}`,
      // team_id: legg til her hvis du har team_id tilgjengelig
    };

    const { error } = await supabase.from('match_events').insert([payload]);

    if (error) {
      setFeedback({ id: player.id, ok: false, msg: `Feil: ${error.message}` });
    } else {
      const ev: CardEvent = {
        playerId:   player.id,
        playerName: player.name || `#${player.num}`,
        type,
        minute:     matchMinute,
        at:         new Date().toISOString(),
      };
      setEvents(prev => [ev, ...prev]);
      setFeedback({ id: player.id, ok: true, msg: `${type === 'yellow' ? '🟡' : '🔴'} Registrert` });
    }

    setSending(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  // ─── PIN-innlogging ──────────────────────────────────────
  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[#060c18]">
        <div className="w-full max-w-xs">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🏁</div>
            <h2 className="text-xl font-black text-slate-100">Dommer-modus</h2>
            <p className="text-[12px] text-[#4a6080] mt-1">
              Skriv inn dommer-PIN for å fortsette
            </p>
          </div>
          <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] p-6">
            <input
              type="password" maxLength={4} value={refPin}
              onChange={e => setRefPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (refPin === REF_PIN) setAuthed(true);
                  else setPinError('Feil PIN. Standard er 0000.');
                }
              }}
              placeholder="••••"
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-4
                text-slate-200 text-[22px] tracking-[0.5em] text-center focus:outline-none
                focus:border-sky-500 mb-3 min-h-[56px]"
            />
            {pinError && (
              <div className="text-red-400 text-[11.5px] text-center mb-3">{pinError}</div>
            )}
            <button
              onClick={() => {
                if (refPin === REF_PIN) { setAuthed(true); setPinError(''); }
                else setPinError('Feil PIN. Standard er 0000.');
              }}
              className="w-full py-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30
                text-sky-400 font-bold text-[14px] hover:bg-sky-500/25 transition min-h-[52px]">
              Logg inn som dommer
            </button>
            <p className="text-[10px] text-[#3a5070] text-center mt-3">
              Standard PIN: 0000 (endre i innstillinger)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── HOVED-VISNING ──────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#060c18]">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <div className="text-xl">🏁</div>
        <div>
          <div className="text-sm font-black text-slate-100">Dommer-visning</div>
          <div className="text-[10px] text-[#3a5070]">Kun kamp-hendelser — ingen taktisk info</div>
        </div>
        <div className="flex-1" />

        {/* Kampklokke */}
        <div className="flex items-center gap-2 bg-[#111c30] rounded-xl px-3 py-2 border border-[#1e3050]">
          <span className="text-[22px] font-black text-slate-100 tabular-nums w-10 text-right">
            {matchMinute}′
          </span>
          <button
            onClick={() => setTimerRunning(r => !r)}
            className={`px-3 py-2 rounded-lg text-[12px] font-bold border transition-all min-h-[44px]
              ${timerRunning
                ? 'bg-red-500/15 border-red-500 text-red-400'
                : 'bg-emerald-500/15 border-emerald-500 text-emerald-400'}`}>
            {timerRunning ? '⏸ Pause' : '▶ Start'}
          </button>
          <button
            onClick={() => { setMatchMinute(0); setTimerRunning(false); }}
            className="px-2.5 py-2 rounded-lg text-[11px] border border-[#1e3050]
              text-[#4a6080] hover:text-red-400 transition min-h-[44px]">
            ↺
          </button>
        </div>
      </div>

      {/* Manuell minutt-justering */}
      <div className="px-4 py-2 bg-[#0c1525] border-b border-[#1e3050] flex items-center gap-3">
        <span className="text-[10px] text-[#4a6080] font-bold uppercase tracking-wider">
          Juster minutt:
        </span>
        <button onClick={() => setMatchMinute(m => Math.max(0, m - 1))}
          className="w-9 h-9 rounded-lg bg-[#111c30] border border-[#1e3050] text-slate-300
            hover:bg-[#1e3050] text-lg font-bold flex items-center justify-center min-h-[44px]">
          −
        </button>
        <span className="text-[16px] font-black text-slate-200 w-10 text-center tabular-nums">
          {matchMinute}
        </span>
        <button onClick={() => setMatchMinute(m => m + 1)}
          className="w-9 h-9 rounded-lg bg-[#111c30] border border-[#1e3050] text-slate-300
            hover:bg-[#1e3050] text-lg font-bold flex items-center justify-center min-h-[44px]">
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#1e3050]">

          {/* ── Hjemmelag ── */}
          <TeamColumn
            title="🏠 Hjemmelag"
            players={homePlayers}
            onCard={registerCard}
            sending={sending}
            feedback={feedback}
            events={events}
          />

          {/* ── Bortelag ── */}
          <TeamColumn
            title="✈️ Bortelag"
            players={awayPlayers}
            onCard={registerCard}
            sending={sending}
            feedback={feedback}
            events={events}
          />
        </div>

        {/* ── Kamp-logg ── */}
        {events.length > 0 && (
          <div className="p-4 border-t border-[#1e3050]">
            <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">
              📋 Kamp-logg
            </div>
            <div className="space-y-1.5">
              {events.map((ev, i) => (
                <div key={i}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-[12px]
                    ${ev.type === 'yellow'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                  <span className="text-base">{ev.type === 'yellow' ? '🟡' : '🔴'}</span>
                  <span className="font-bold">{ev.minute}′</span>
                  <span>{ev.playerName}</span>
                  <span className="ml-auto text-[10px] opacity-60">
                    {new Date(ev.at).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Lag-kolonne med spillerliste ────────────────────────────

const TeamColumn: React.FC<{
  title: string;
  players: any[];
  onCard: (player: any, type: 'yellow' | 'red') => void;
  sending: string | null;
  feedback: { id: string; ok: boolean; msg: string } | null;
  events: CardEvent[];
}> = ({ title, players, onCard, sending, feedback, events }) => (
  <div className="p-4">
    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
      {title} · {players.length} spillere
    </div>
    {players.length === 0 ? (
      <p className="text-[12px] text-[#3a5070] italic">Ingen spillere på dette laget.</p>
    ) : (
      <div className="space-y-2">
        {players.map((p: any) => {
          const cardCount = events.filter(e => e.playerId === p.id);
          const yellowCount = cardCount.filter(e => e.type === 'yellow').length;
          const redCount    = cardCount.filter(e => e.type === 'red').length;
          const isSendingY  = sending === `${p.id}-yellow`;
          const isSendingR  = sending === `${p.id}-red`;
          const fb          = feedback?.id === p.id ? feedback : null;

          return (
            <div key={p.id}
              className={`flex items-center gap-3 p-3 rounded-xl border
                ${redCount > 0
                  ? 'bg-red-500/10 border-red-500/30 opacity-60'
                  : 'bg-[#0f1a2a] border-[#1e3050]'}`}>

              {/* Nummer */}
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center
                text-[14px] font-black text-white flex-shrink-0">
                {p.num ?? p.number ?? '?'}
              </div>

              {/* Navn og status */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-slate-200 truncate">
                  {p.name || `Spiller #${p.num}`}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {Array.from({ length: yellowCount }).map((_, i) => (
                    <span key={i} className="text-[14px]">🟡</span>
                  ))}
                  {Array.from({ length: redCount }).map((_, i) => (
                    <span key={i} className="text-[14px]">🔴</span>
                  ))}
                  {fb && (
                    <span className={`text-[10px] ml-1 ${fb.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fb.msg}
                    </span>
                  )}
                </div>
              </div>

              {/* Kortknapper — min 44px for touch */}
              {redCount === 0 && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onCard(p, 'yellow')}
                    disabled={!!isSendingY}
                    title="Gult kort"
                    className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40
                      text-[20px] flex items-center justify-center hover:bg-amber-500/25
                      active:scale-95 transition-all disabled:opacity-40 touch-manipulation">
                    {isSendingY ? '⏳' : '🟡'}
                  </button>
                  <button
                    onClick={() => onCard(p, 'red')}
                    disabled={!!isSendingR}
                    title="Rødt kort"
                    className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/40
                      text-[20px] flex items-center justify-center hover:bg-red-500/25
                      active:scale-95 transition-all disabled:opacity-40 touch-manipulation">
                    {isSendingR ? '⏳' : '🔴'}
                  </button>
                </div>
              )}
              {redCount > 0 && (
                <span className="text-[11px] text-red-400 font-bold shrink-0">Utvist</span>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

// Re-export CardEvent type for use in page.tsx if needed
export type { CardEvent };
