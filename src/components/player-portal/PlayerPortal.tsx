'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ROLE_META } from '../../data/roleInfo';
import { supabase } from '@/lib/supabase';

// ─── Trygg ROLE_META-oppslag (løser strict-mode Vercel-feil) ──
const getMeta = (role: any) =>
  ROLE_META[role as keyof typeof ROLE_META] ?? null;

// ─── Støtter .num og evt. fremtidig .number ──────────────────
const getNum = (p: any): number => p.number ?? p.num ?? 0;

// ─── Toast-type ──────────────────────────────────────────────
interface Toast {
  id: string;
  type: 'yellow' | 'red' | 'info';
  message: string;
}

// ═══════════════════════════════════════════════════════════════
//  SPILLERPORTAL
// ═══════════════════════════════════════════════════════════════

export const PlayerPortal: React.FC = () => {
  const {
    currentUser, playerAccounts, coachMessages, events,
    phases, replyToMessage, addPlayerAccount, removePlayerAccount,
    loginPlayer, logout,
  } = useAppStore();

  const [replyText, setReplyText]   = useState<Record<string, string>>({});
  const [tab, setTab]               = useState<'messages' | 'squad' | 'plan' | 'accounts'>('messages');
  const [myTeamSide, setMyTeamSide] = useState<'home' | 'away'>('home');
  const [toasts, setToasts]         = useState<Toast[]>([]);

  const isCoach  = currentUser?.role === 'coach';
  const playerId = currentUser?.playerId;

  // ─── Supabase Realtime: lytt på match_events ─────────────
  useEffect(() => {
    if (!isCoach) return;

    const channel = supabase
      .channel('match-events-portal')
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'match_events' },
        (payload: any) => {
          const ev     = payload.new;
          const isYellow = ev.event_type === 'yellow_card';
          const isRed    = ev.event_type === 'red_card';

          // Finn spillernavn fra lokale kontoer
          const acc = (playerAccounts as any[]).find(
            (a: any) => a.id === ev.player_account_id
          );
          const who = acc?.name ?? 'Spiller';

          if (isYellow || isRed) {
            const toast: Toast = {
              id:      ev.id ?? `${Date.now()}`,
              type:    isYellow ? 'yellow' : 'red',
              message: isYellow
                ? `🟡 Gult kort – ${who} (min ${ev.minute ?? '–'})`
                : `🔴 Rødt kort – ${who} (min ${ev.minute ?? '–'})`,
            };
            setToasts(prev => [...prev, toast]);
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 8000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isCoach, playerAccounts]);

  if (!currentUser || (currentUser.role === 'player' && !playerId)) {
    return <PlayerLogin />;
  }

  const tabs = [
    { id: 'messages', label: '💬 Meldinger' },
    { id: 'squad',    label: '👥 Tropp & innbyttere' },
    { id: 'plan',     label: '📋 Min plan' },
    ...(isCoach ? [{ id: 'accounts', label: '⚙️ Kontoer' }] : []),
  ];

  const myMessages = (coachMessages as any[]).filter((m: any) => m.playerId === playerId);
  const phase      = (phases[0] as any) ?? null;

  return (
    <div className="flex flex-col h-full bg-[#060c18]">

      {/* ── Toast-varsler (sanntid fra dommer) ── */}
      {toasts.length > 0 && (
        <div className="fixed top-14 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id}
              className={`px-4 py-3 rounded-xl border shadow-2xl text-[13px] font-bold
                animate-pulse pointer-events-auto
                ${t.type === 'yellow'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : t.type === 'red'
                    ? 'bg-red-500/20 border-red-400 text-red-300'
                    : 'bg-sky-500/20 border-sky-400 text-sky-300'}`}>
              {t.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <div className="text-2xl">👤</div>
        <div>
          <div className="text-sm font-black text-slate-100">{currentUser.name}</div>
          <div className="text-[10px] text-[#3a5070]">
            {isCoach ? 'Trener · Full tilgang' : 'Spiller'}
          </div>
        </div>

        {/* Hjemme/Borte-toggle — kun trener, kun squad-fanen */}
        {isCoach && tab === 'squad' && (
          <div className="flex items-center gap-1.5 ml-3 bg-[#111c30] rounded-xl p-1 border border-[#1e3050]">
            <button
              onClick={() => setMyTeamSide('home')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all min-h-[36px]
                ${myTeamSide === 'home'
                  ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                  : 'text-[#4a6080] hover:text-slate-300'}`}>
              🏠 Vi er hjemme
            </button>
            <button
              onClick={() => setMyTeamSide('away')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all min-h-[36px]
                ${myTeamSide === 'away'
                  ? 'bg-red-500/20 border border-red-500 text-red-400'
                  : 'text-[#4a6080] hover:text-slate-300'}`}>
              ✈️ Vi er borte
            </button>
          </div>
        )}

        <div className="flex-1" />
        <button onClick={logout}
          className="text-[11px] text-[#4a6080] hover:text-red-400 transition px-2 min-h-[44px]">
          Logg ut
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e3050] bg-[#0c1525] overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-3 text-[12px] font-semibold whitespace-nowrap transition-all min-h-[44px]
              ${tab === t.id
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-[#3a5070] hover:text-slate-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">

        {/* ── MELDINGER ── */}
        {tab === 'messages' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {myMessages.length === 0 ? (
              <EmptyState icon="💬" text="Ingen meldinger fra trener ennå." />
            ) : (
              myMessages.map((msg: any) => (
                <div key={msg.id}
                  className="bg-[#0c1525] border border-[#1e3050] rounded-2xl overflow-hidden">
                  <div className="p-4 bg-[#0f1a2a]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🏋️</span>
                      <span className="text-[11px] font-bold text-amber-400">Trener</span>
                      <span className="text-[10px] text-[#3a5070] ml-auto">
                        {new Date(msg.createdAt).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                  {msg.replies?.map((r: any) => (
                    <div key={r.id} className="p-4 border-t border-[#1e3050]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-sky-400">Du svarte</span>
                        <span className="text-[10px] text-[#3a5070] ml-auto">
                          {new Date(r.createdAt).toLocaleDateString('nb-NO')}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {r.content}
                      </p>
                    </div>
                  ))}
                  <div className="p-4 border-t border-[#1e3050]">
                    <textarea
                      value={replyText[msg.id] ?? ''}
                      onChange={e => setReplyText(p => ({ ...p, [msg.id]: e.target.value }))}
                      rows={2}
                      placeholder="Skriv ditt svar..."
                      className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2
                        text-[12.5px] text-slate-300 resize-none focus:outline-none
                        focus:border-sky-500 mb-2"
                    />
                    <button
                      onClick={() => {
                        const txt = replyText[msg.id]?.trim();
                        if (!txt || !playerId) return;
                        replyToMessage(msg.id, playerId, txt);
                        setReplyText(p => ({ ...p, [msg.id]: '' }));
                      }}
                      className="px-4 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30
                        text-sky-400 font-bold text-[12px] hover:bg-sky-500/25 min-h-[44px]">
                      Send svar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TROPP & INNBYTTERE ── */}
        {tab === 'squad' && phase && (
          <div className="max-w-3xl mx-auto">
            <SquadView phase={phase} myTeamSide={myTeamSide} />
          </div>
        )}

        {/* ── MIN PLAN ── */}
        {tab === 'plan' && (
          <div className="max-w-2xl mx-auto">
            <MyPlan playerId={playerId} events={events} phases={phases} />
          </div>
        )}

        {/* ── KONTOER (trener) ── */}
        {tab === 'accounts' && isCoach && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-base font-bold text-slate-100 mb-4">⚙️ Spillerkontoer</h3>
            <AccountManager />
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ TROPP & INNBYTTERE ══════════════════════════════════════

const SquadView: React.FC<{ phase: any; myTeamSide: 'home' | 'away' }> = ({
  phase, myTeamSide,
}) => {
  const players: any[] = phase.players ?? [];

  // "Mitt lag" er det valgte laget, "motstander" er det andre
  const myTeam   = myTeamSide;
  const oppTeam  = myTeamSide === 'home' ? 'away' : 'home';

  const myOnField  = players.filter((p: any) => p.team === myTeam   && p.isOnField !== false);
  const myBench    = players.filter((p: any) => p.team === myTeam   && p.isOnField === false);
  const oppOnField = players.filter((p: any) => p.team === oppTeam  && p.isOnField !== false);
  const oppBench   = players.filter((p: any) => p.team === oppTeam  && p.isOnField === false);

  const myLabel  = myTeamSide === 'home' ? '🏠 Hjemmelag' : '✈️ Bortelag';
  const oppLabel = myTeamSide === 'home' ? '✈️ Motstanderlag' : '🏠 Motstanderlag';
  const myBadge  = myTeamSide === 'home'
    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    : 'bg-red-500/15 text-red-400 border-red-500/30';

  return (
    <div>
      <h3 className="text-base font-bold text-slate-100 mb-4">👥 Tropp og innbyttere</h3>

      {/* ── Vårt lag – startoppstilling ── */}
      <SectionHeader label={`${myLabel} – startoppstilling`} badge={myBadge} count={myOnField.length} />
      {myOnField.length === 0 ? (
        <p className="text-[12px] text-[#3a5070] italic px-2 mb-4">Ingen spillere markert som på banen</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          {myOnField.map((p: any) => <PlayerCard key={p.id} player={p} />)}
        </div>
      )}

      {/* ── Vårt lag – innbyttere ── */}
      {myBench.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-[#1e3050]" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2">
              🪑 Innbyttere – {myLabel}
            </span>
            <div className="h-px flex-1 bg-[#1e3050]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {myBench.map((p: any) => <PlayerCard key={p.id} player={p} isBench />)}
          </div>
        </div>
      )}

      {/* ── Motstanderlag – startoppstilling ── */}
      {oppOnField.length > 0 && (
        <>
          <SectionHeader
            label={`${oppLabel} – startoppstilling`}
            badge="bg-slate-500/15 text-slate-400 border-slate-500/30"
            count={oppOnField.length}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
            {oppOnField.map((p: any) => <PlayerCard key={p.id} player={p} isOpponent />)}
          </div>
        </>
      )}

      {/* ── Motstanderlag – innbyttere ── */}
      {oppBench.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-[#1e3050]" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
              🪑 Innbyttere – {oppLabel}
            </span>
            <div className="h-px flex-1 bg-[#1e3050]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {oppBench.map((p: any) => <PlayerCard key={p.id} player={p} isBench isOpponent />)}
          </div>
        </div>
      )}

      {/* ── Spilletids-oversikt ── */}
      <PlaytimeBar players={players.filter((p: any) => p.team === myTeam)} />
    </div>
  );
};

const SectionHeader: React.FC<{ label: string; badge: string; count: number }> = ({
  label, badge, count,
}) => (
  <div className="flex items-center gap-2 mb-3">
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge}`}>
      {label}
    </span>
    <span className="text-[10px] text-[#3a5070]">{count} spillere</span>
  </div>
);

const PlayerCard: React.FC<{
  player: any;
  isBench?: boolean;
  isOpponent?: boolean;
}> = ({ player, isBench, isOpponent }) => {
  // FIX: bruker 'player' + as keyof typeof ROLE_META
  const meta = ROLE_META[player.role as keyof typeof ROLE_META] ?? null;
  const num  = getNum(player);

  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all
      ${isBench
        ? 'bg-[#0f1a2a] border-amber-500/20 opacity-80'
        : isOpponent
          ? 'bg-[#0f1a2a] border-slate-700/50'
          : 'bg-[#0f1a2a] border-[#1e3050]'}`}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center
          text-[13px] font-black text-white flex-shrink-0 relative"
        style={{
          background: isOpponent ? '#475569' : (meta?.color ?? '#555'),
          opacity: player.injured ? 0.5 : 1,
        }}>
        {num}
        {player.injured && (
          <span className="absolute -top-1 -right-1 text-[10px]">🩹</span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[12.5px] font-bold text-slate-200 truncate">
          {player.name || `#${num}`}
        </div>
        <div className="text-[10px] text-[#4a6080]">
          {isOpponent ? 'Motstander' : (meta?.label ?? player.role)}
        </div>
        {isBench && (
          <div className="text-[9.5px] text-amber-400 font-semibold">Innbytter</div>
        )}
      </div>
    </div>
  );
};

const PlaytimeBar: React.FC<{ players: any[] }> = ({ players }) => {
  if (players.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">
        ⏱ Spilletid denne kampen
      </div>
      <div className="space-y-2">
        {[...players]
          .sort((a: any, b: any) => (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0))
          .map((p: any) => {
            const min      = p.minutesPlayed ?? 0;
            const barColor = min > 60 ? '#ef4444' : min > 30 ? '#f59e0b' : '#22c55e';
            // FIX: as keyof typeof ROLE_META i liste-mapping
            const meta     = ROLE_META[p.role as keyof typeof ROLE_META] ?? null;
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center
                    text-[9px] font-black text-white flex-shrink-0"
                  style={{ background: meta?.color ?? '#555' }}>
                  {getNum(p)}
                </div>
                <div className="w-20 sm:w-28 truncate text-[11px] text-slate-300">
                  {p.name || `#${getNum(p)}`}
                </div>
                <div className="flex-1 h-2 bg-[#1e3050] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (min / 90) * 100)}%`, background: barColor }} />
                </div>
                <div className="text-[11px] font-bold w-12 text-right shrink-0"
                  style={{ color: barColor }}>{min} min</div>
                {p.isOnField === false && (
                  <span className="text-[9.5px] text-amber-400 bg-amber-500/10
                    border border-amber-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                    benk
                  </span>
                )}
                {p.injured && <span className="text-[10px] shrink-0">🩹</span>}
              </div>
            );
          })}
      </div>
      <div className="text-[10px] text-[#3a5070] mt-2">
        🟢 &lt;30 min · 🟡 30–60 min · 🔴 &gt;60 min
      </div>
    </div>
  );
};

// ═══ MIN PLAN ═══════════════════════════════════════════════

const MyPlan: React.FC<{ playerId?: string; events: any[]; phases: any[] }> = ({
  playerId, events, phases,
}) => {
  const myPlayer = (phases[0] as any)?.players?.find((p: any) => p.id === playerId) ?? null;
  // FIX: as keyof typeof ROLE_META i MyPlan
  const meta     = myPlayer
    ? (ROLE_META[myPlayer.role as keyof typeof ROLE_META] ?? null)
    : null;

  const today    = new Date().toISOString().slice(0, 10);
  const upcoming = [...events]
    .filter((e: any) => e.date >= today)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div>
      <h3 className="text-base font-bold text-slate-100 mb-4">📋 Min taktiske plan</h3>
      {myPlayer && (
        <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl p-5 mb-5">
          <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-3">
            Din spillerprofil
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center
              text-lg font-black text-white" style={{ background: meta?.color ?? '#555' }}>
              {getNum(myPlayer)}
            </div>
            <div>
              <div className="text-base font-black text-slate-100">{myPlayer.name}</div>
              <div className="text-[12px] text-sky-400">
                {meta?.label ?? myPlayer.role} · {myPlayer.team === 'home' ? 'Hjemmelag' : 'Bortelag'}
              </div>
            </div>
            {myPlayer.injured && (
              <span className="ml-auto text-[11px] text-red-400 bg-red-500/10
                border border-red-500/20 px-2.5 py-1 rounded-full">🩹 Skadet</span>
            )}
          </div>
          {myPlayer.notes && (
            <div className="bg-[#111c30] rounded-xl p-4 border border-[#1e3050]">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                📝 Notat fra trener
              </div>
              <p className="text-[12.5px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                {myPlayer.notes}
              </p>
            </div>
          )}
        </div>
      )}
      <h4 className="text-sm font-bold text-slate-300 mb-3">Kommende arrangementer</h4>
      {upcoming.length === 0 ? (
        <EmptyState icon="📅" text="Ingen kommende arrangementer." />
      ) : (
        upcoming.map((ev: any) => (
          <div key={ev.id} className="bg-[#0c1525] border border-[#1e3050] rounded-xl p-4 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                ${ev.type === 'match' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                {ev.type === 'match' ? '⚽ Kamp' : '🏃 Trening'}
              </span>
              <span className="text-[11px] text-[#4a6080]">
                {new Date(ev.date + 'T12:00:00').toLocaleDateString('nb-NO', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })}
                {ev.time ? ` · ${ev.time}` : ''}
              </span>
            </div>
            <div className="text-[13px] font-bold text-slate-200">{ev.title}</div>
            {ev.location && <div className="text-[11px] text-[#4a6080] mt-0.5">📍 {ev.location}</div>}
            {ev.teamNote && <div className="mt-2 text-[12px] text-slate-400 italic">"{ev.teamNote}"</div>}
          </div>
        ))
      )}
    </div>
  );
};

// ═══ KONTOER ════════════════════════════════════════════════

const AccountManager: React.FC = () => {
  const { playerAccounts, addPlayerAccount, removePlayerAccount, phases } = useAppStore();

  const [name, setName]       = useState('');
  const [pin, setPin]         = useState('');
  const [playerId, setPlayerId] = useState('');
  const [customNum, setCustomNum] = useState('');
  const [customRole, setCustomRole] = useState('midfielder');

  // Kun hjemmelaget vises — bortelaget har ikke bruk for app-kontoer
  const allPlayers: any[] = (phases[0] as any)?.players ?? [];
  const homePlayers       = allPlayers.filter((p: any) => p.team === 'home');

  const alreadyLinked = new Set((playerAccounts as any[]).map((a: any) => a.playerId));

  // Spiller valgt fra bane, eller ny/manuell oppføring
  const selectedPlayer = allPlayers.find((p: any) => p.id === playerId) ?? null;

  const create = () => {
    if (!name.trim() || pin.length !== 4) return;
    addPlayerAccount({
      name:     name.trim(),
      pin,
      playerId: playerId || `custom-${Date.now()}`,
      team:     'home',
    });
    setName(''); setPin(''); setPlayerId(''); setCustomNum(''); setCustomRole('midfielder');
  };

  return (
    <div>
      {/* Eksisterende kontoer */}
      {(playerAccounts as any[]).length > 0 && (
        <div className="space-y-2 mb-5">
          {(playerAccounts as any[]).map((acc: any) => {
            const pl   = allPlayers.find((p: any) => p.id === acc.playerId);
            // FIX: as keyof typeof ROLE_META
            const meta = pl ? (ROLE_META[pl.role as keyof typeof ROLE_META] ?? null) : null;
            return (
              <div key={acc.id}
                className="flex items-center gap-3 p-3 bg-[#0c1525] rounded-xl border border-[#1e3050]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center
                  text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: meta?.color ?? '#3b82f6' }}>
                  {pl ? getNum(pl) : '?'}
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold text-slate-200">{acc.name}</div>
                  <div className="text-[10.5px] text-[#4a6080]">
                    PIN: {acc.pin} · {meta?.label ?? (pl?.role ?? '–')}
                  </div>
                </div>
                <button onClick={() => removePlayerAccount(acc.id)}
                  className="text-red-400/50 hover:text-red-400 px-3 min-h-[44px] transition text-sm">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Opprett ny konto */}
      <div className="bg-[#0c1525] border border-dashed border-[#1e3050] rounded-2xl p-5">
        <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-4">
          Opprett ny spillerkonto
        </div>

        {/* Velg fra bane ELLER legg til manuelt — kun hjemmelaget */}
        <div className="mb-3">
          <label className="label-sm2">
            Koble til spiller på brettet (valgfritt)
          </label>
          <select
            value={playerId}
            onChange={e => {
              setPlayerId(e.target.value);
              const pl = homePlayers.find((p: any) => p.id === e.target.value);
              if (pl?.name && !name) setName(pl.name);
            }}
            className="inp2">
            <option value="">– Ingen kobling / ny spiller –</option>
            {homePlayers.map((p: any) => (
              <option key={p.id} value={p.id} disabled={alreadyLinked.has(p.id)}>
                #{getNum(p)} {p.name || 'Navnløs'}
                {' – '}{ROLE_META[p.role as keyof typeof ROLE_META]?.label ?? p.role}
                {alreadyLinked.has(p.id) ? ' ✓ konto finnes' : ''}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-[#3a5070] mt-1.5">
            Kun hjemmelaget vises. Spillere kan legges til uten kobling til brettet.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <label className="label-sm2">Navn</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ola Nordmann" className="inp2" />
          </div>
          <div>
            <label className="label-sm2">4-sifret PIN</label>
            <input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4} placeholder="••••" type="password" className="inp2" />
            {pin.length > 0 && pin.length < 4 && (
              <div className="text-[10px] text-amber-400 mt-1">{4 - pin.length} siffer til</div>
            )}
          </div>
          <div>
            <label className="label-sm2">Draktnummer (valgfritt)</label>
            <input
              value={customNum}
              onChange={e => setCustomNum(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="7" className="inp2" />
          </div>
        </div>

        <button
          onClick={create}
          disabled={!name.trim() || pin.length !== 4}
          className="w-full py-3 rounded-xl bg-sky-500/15 border border-sky-500/30
            text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 transition
            disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]">
          ✓ Opprett konto
        </button>

        {(!name.trim() || pin.length !== 4) && (
          <div className="mt-2 text-[10.5px] text-[#3a5070] text-center">
            {!name.trim() ? 'Fyll inn navn' : `PIN mangler ${4 - pin.length} siffer`}
          </div>
        )}
      </div>

      <style>{`
        .inp2 { width:100%; background:#111c30; border:1px solid #1e3050;
          border-radius:8px; padding:10px 12px; color:#e2e8f0; font-size:13px;
          margin-top:5px; box-sizing:border-box; min-height:44px; }
        .inp2:focus { outline:none; border-color:#38bdf8; }
        .label-sm2 { font-size:9.5px; font-weight:700; color:#3a5070;
          text-transform:uppercase; letter-spacing:0.08em; display:block; }
      `}</style>
    </div>
  );
};

// ═══ SPILLER-INNLOGGING ══════════════════════════════════════

const PlayerLogin: React.FC = () => {
  const { playerAccounts, loginPlayer } = useAppStore();
  const [accountId, setAccountId] = useState('');
  const [pin, setPin]             = useState('');
  const [error, setError]         = useState('');

  const submit = () => {
    if (!accountId) { setError('Velg en konto.'); return; }
    if (!loginPlayer(accountId, pin)) setError('Feil PIN. Prøv igjen.');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-[#060c18]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">👤</div>
          <h2 className="text-xl font-black text-slate-100">Spillerportal</h2>
          <p className="text-[12px] text-[#4a6080] mt-1">Logg inn med din konto og PIN</p>
        </div>
        <div className="bg-[#0c1525] rounded-2xl border border-[#1e3050] p-6">
          <label className="block mb-3">
            <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">
              Velg konto
            </div>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-3
                text-slate-200 text-[13px] focus:outline-none focus:border-sky-500 min-h-[44px]">
              <option value="">– Velg navn –</option>
              {(playerAccounts as any[]).map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label className="block mb-5">
            <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">
              PIN-kode
            </div>
            <input
              type="password" maxLength={4} value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••"
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-3
                text-slate-200 text-[18px] tracking-widest focus:outline-none
                focus:border-sky-500 min-h-[44px]"
            />
          </label>
          {error && (
            <div className="text-red-400 text-[11.5px] mb-3 text-center">{error}</div>
          )}
          {(playerAccounts as any[]).length === 0 && (
            <p className="text-[11px] text-amber-400/70 mb-3 text-center">
              Ingen spillerkontoer er opprettet ennå.
            </p>
          )}
          <button onClick={submit}
            className="w-full py-3 rounded-xl bg-sky-500/15 border border-sky-500/30
              text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 transition min-h-[44px]">
            Logg inn
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══ HELPERS ════════════════════════════════════════════════

const EmptyState: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="text-center py-12">
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-[#4a6080] text-sm">{text}</p>
  </div>
);
