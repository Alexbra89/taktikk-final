'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META } from '@/data/roleInfo';
import { VW, VH } from '@/data/formations';
import { ReadOnlyTacticBoard } from '@/components/player-portal/PlayerHome';
import { TrainingView } from '@/components/ui/TrainingView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ChatPanel } from '@/components/ui/ChatPanel';
import { StatsView } from '@/components/ui/StatsView';
import { useNotification } from '@/components/NotificationProvider';
import { CalendarEvent } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────
const getMeta = (role: any) => ROLE_META[role as keyof typeof ROLE_META] ?? null;
const getNum  = (p: any): number => p.number ?? p.num ?? 0;

// ═══════════════════════════════════════════════════════════════
//  SPILLERPORTAL  (trener + spiller)
// ═══════════════════════════════════════════════════════════════
export const PlayerPortal: React.FC = () => {
  const {
    currentUser, playerAccounts, coachMessages, events,
    phases, sport, replyToMessage, logout, chatMessages, sendChat,
    homeTeamName, awayTeamName, activePhaseIdx, deleteEvent, setSpecialRole,
  } = useAppStore();

  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'messages' | 'squad' | 'tactics' | 'chat' | 'accounts' | 'calendar' | 'training' | 'stats'>('tactics');
  const [chatInput, setChatInput] = useState('');
  const [selectedTraining, setSelectedTraining] = useState<CalendarEvent | null>(null);

  const { markMessagesAsRead, hasUnreadMessages, unreadCount } = useNotification();

  const isCoach  = currentUser?.role === 'coach';
  const playerId = currentUser?.playerId;
  const phase = phases[activePhaseIdx] ?? phases[0] ?? null;

  // Marker meldinger som lest når man åpner chat eller messages
  useEffect(() => {
    if (tab === 'chat' || tab === 'messages') {
      if (hasUnreadMessages) {
        markMessagesAsRead();
      }
    }
  }, [tab, hasUnreadMessages, markMessagesAsRead]);

  // Sjekk om currentUser er kaptein
  const isCurrentUserCaptain = (() => {
    if (!phase || isCoach) return false;
    const player = phase.players.find(p => 
      p.id === currentUser?.playerId ||
      (playerAccounts as any[]).find(acc => acc.playerId === p.id && acc.id === currentUser?.accountId)
    );
    return player?.specialRoles?.includes('captain') ?? false;
  })();

  // Tabs for trener og spiller
  const coachTabs = [
    { id: 'tactics',  label: '📋 Taktikk' },
    { id: 'squad',    label: '👥 Tropp' },
    { id: 'calendar', label: '📅 Kalender' },
    { id: 'training', label: '🏃 Trening' },
    { id: 'stats',    label: '📊 Statistikk' },
    { id: 'messages', label: '💬 Meldinger' },
    { id: 'chat',     label: '🗨️ Chat' },
    { id: 'accounts', label: '⚙️ Kontoer' },
  ];

  const playerTabs = [
    { id: 'tactics',  label: '📋 Taktikk' },
    { id: 'squad',    label: '👥 Tropp' },
    { id: 'calendar', label: '📅 Kalender' },
    { id: 'training', label: '🏃 Trening' },
    { id: 'stats',    label: '📊 Statistikk' },
    { id: 'messages', label: '💬 Meldinger' },
    { id: 'chat',     label: '🗨️ Chat' },
  ];

  const tabs = isCoach ? coachTabs : playerTabs;

  const myMessages = (coachMessages as any[]).filter((m: any) =>
    isCoach ? true : m.playerId === playerId
  );

  const sendChatMsg = (text: string, targetPlayerId?: string) => {
    if (!text.trim() || !currentUser) return;
    sendChat(currentUser.role as 'coach' | 'player', currentUser.name, text, targetPlayerId);
    setChatInput('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060c18]">
      {/* Header med badge for uleste meldinger */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050] flex-shrink-0">
        <div className="text-2xl">{isCoach ? '🏋️' : '👤'}</div>
        <div>
          <div className="text-sm font-black text-slate-100">{currentUser?.name}</div>
          <div className="text-[10px] text-[#3a5070]">
            {isCoach ? 'Trener · Full tilgang' : isCurrentUserCaptain ? '🪖 Kaptein' : 'Spiller'}
          </div>
        </div>
        <div className="flex-1" />
        {/* Badge for uleste meldinger */}
        {hasUnreadMessages && unreadCount > 0 && (
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-red-400 font-bold mr-1">{unreadCount}</span>
          </div>
        )}
        <button onClick={logout}
          className="text-[11px] text-[#4a6080] hover:text-red-400 transition px-2 min-h-[44px]">
          Logg ut
        </button>
      </div>

      {/* Tabs med badge på chat */}
      <div className="flex border-b border-[#1e3050] bg-[#0c1525] overflow-x-auto flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`relative px-4 py-3 text-[12px] font-semibold whitespace-nowrap transition-all min-h-[44px]
              ${tab === t.id
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-[#3a5070] hover:text-slate-400'}`}>
            {t.label}
            {/* Badge for uleste meldinger på chat-tabben */}
            {hasUnreadMessages && (t.id === 'chat' || t.id === 'messages') && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Innhold — MOBILE FIX: flex-1 min-h-0 for korrekt overflow ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* TAKTIKK */}
        {tab === 'tactics' && (
          <ReadOnlyTacticBoard />
        )}

        {/* TROPP */}
        {tab === 'squad' && (
          <div className="flex-1 overflow-y-auto p-4">
            {phase
              ? <SquadView phase={phase} playerAccounts={playerAccounts as any[]} isCoach={isCoach} setSpecialRole={setSpecialRole} activePhaseIdx={activePhaseIdx} />
              : <EmptyState icon="👥" text="Ingen data." />}
          </div>
        )}

        {/* MELDINGER */}
        {tab === 'messages' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl w-full mx-auto">
            {myMessages.length === 0
              ? <EmptyState icon="💬" text="Ingen meldinger ennå." />
              : myMessages.map((msg: any) => (
                <MessageCard key={msg.id} msg={msg} playerId={playerId}
                  replyText={replyText} setReplyText={setReplyText}
                  replyToMessage={replyToMessage} />
              ))}
          </div>
        )}

        {/* CHAT - med kaptein-støtte */}
        {tab === 'chat' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel
              currentUser={currentUser}
              chatMessages={chatMessages as any[]}
              onSend={sendChatMsg}
              coachView={isCoach}
              isCaptain={isCurrentUserCaptain}
            />
          </div>
        )}

        {/* TRENING */}
        {tab === 'training' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <TrainingView />
          </div>
        )}

        {/* KALENDER - FULL KALENDER MED NAVIGASJON TIL TRENING */}
        {tab === 'calendar' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedTraining ? (
              <TrainingView 
                initialTraining={selectedTraining} 
                onBack={() => setSelectedTraining(null)} 
              />
            ) : (
              <CalendarView 
                onGoToTraining={(training) => setSelectedTraining(training)} 
              />
            )}
          </div>
        )}

        {/* STATISTIKK - LESETILGANG FOR SPILLERE, FULL TILGANG FOR TRENER */}
        {tab === 'stats' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <StatsView />
          </div>
        )}

        {/* KONTOER (trener only) */}
        {tab === 'accounts' && isCoach && (
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl w-full mx-auto">
            <AccountManager />
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ TROPP VIEW — med navn fra playerAccounts og sortering, samt kaptein-velger ═══════════════

const SquadView: React.FC<{ phase: any; playerAccounts: any[]; isCoach: boolean; setSpecialRole: any; activePhaseIdx: number }> = ({ 
  phase, playerAccounts, isCoach, setSpecialRole, activePhaseIdx 
}) => {
  const { homeTeamName } = useAppStore();
  const players: any[] = phase.players ?? [];
  const home = players.filter((p: any) => p.team === 'home');
  
  // Grupper spillere etter rolle
  const groupedByRole = home.reduce((acc: any, player: any) => {
    const role = player.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(player);
    return acc;
  }, {});

  // Sorter roller etter kategori
  const roleOrder = ['keeper', 'defender', 'wingback', 'midfielder', 'winger', 'forward', 'playmaker'];
  const sortedRoles = Object.keys(groupedByRole).sort((a, b) => {
    const aIdx = roleOrder.indexOf(a);
    const bIdx = roleOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const getPlayerName = (player: any) => {
    const account = playerAccounts.find((a: any) => a.playerId === player.id);
    return account?.name || player.name || `#${player.num}`;
  };

  const isCaptain = (player: any) => player.specialRoles?.includes('captain');

  const toggleCaptain = (playerId: string) => {
    if (!isCoach) return;
    const player = home.find(p => p.id === playerId);
    const currentlyCaptain = player?.specialRoles?.includes('captain');
    setSpecialRole(activePhaseIdx, playerId, 'captain', !currentlyCaptain);
  };

  const starters = home.filter((p: any) => p.isStarter !== false && p.isOnField !== false);
  const substitutes = home.filter((p: any) => p.isStarter === false || p.isOnField === false);

  return (
    <div className="max-w-4xl mx-auto">
      <h3 className="text-base font-bold text-slate-100 mb-4">
        👥 {homeTeamName || 'Hjemmelag'} – Tropp
        {isCoach && <span className="ml-2 text-[10px] text-amber-400 font-normal">(Trykk 🪖 for å velge kaptein)</span>}
      </h3>

      {/* Startoppstilling - gruppert etter posisjon */}
      <div className="mb-6">
        <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-3">
          ⚽ Startoppstilling ({starters.length})
        </div>
        <div className="space-y-4">
          {sortedRoles.map(role => {
            const rolePlayers = starters.filter(p => p.role === role);
            if (rolePlayers.length === 0) return null;
            const meta = getMeta(role);
            return (
              <div key={role} className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] overflow-hidden">
                <div className="px-3 py-2 bg-[#0c1525] border-b border-[#1e3050]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full" style={{ background: meta?.color || '#555' }} />
                    <span className="text-[11px] font-bold text-slate-300">{meta?.label || role}</span>
                    <span className="text-[9px] text-[#4a6080]">({rolePlayers.length})</span>
                  </div>
                </div>
                <div className="divide-y divide-[#1e3050]">
                  {rolePlayers.sort((a, b) => getNum(a) - getNum(b)).map(player => (
                    <div key={player.id} className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center
                        text-[13px] font-black text-white flex-shrink-0 relative"
                        style={{ background: meta?.color ?? '#555', opacity: player.injured ? 0.5 : 1 }}>
                        {getNum(player)}
                        {player.injured && <span className="absolute -top-1 -right-1 text-[10px]">🩹</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-[13px] font-bold text-slate-200 truncate">
                            {getPlayerName(player)}
                          </div>
                          {isCaptain(player) && (
                            <span className="text-[13px]">🪖</span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#4a6080]">
                          #{getNum(player)} · {meta?.label || player.role}
                        </div>
                      </div>
                      {(player.minutesPlayed ?? 0) > 0 && (
                        <div className="text-[10px] text-emerald-400">
                          {player.minutesPlayed} min
                        </div>
                      )}
                      {/* Kaptein-velger for trener */}
                      {isCoach && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCaptain(player.id); }}
                          className={`ml-2 px-2 py-1 rounded-md text-[9px] font-semibold transition-all min-h-[32px]
                            ${isCaptain(player) 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-[#1e3050] text-[#4a6080] hover:text-slate-300 border border-transparent'}`}
                        >
                          🪖 {isCaptain(player) ? 'Kaptein' : 'Gjør til kaptein'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Innbyttere */}
      {substitutes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 my-4">
            <div className="h-px flex-1 bg-[#1e3050]"/>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2">
              🪑 Innbyttere ({substitutes.length})
            </span>
            <div className="h-px flex-1 bg-[#1e3050]"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {substitutes.sort((a, b) => getNum(a) - getNum(b)).map(player => {
              const meta = getMeta(player.role);
              return (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-xl border border-amber-500/20">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center
                    text-[13px] font-black text-white flex-shrink-0"
                    style={{ background: meta?.color ?? '#555', opacity: player.injured ? 0.5 : 1 }}>
                    {getNum(player)}
                    {player.injured && <span className="absolute -top-1 -right-1 text-[10px]">🩹</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] font-bold text-slate-200 truncate">
                        {getPlayerName(player)}
                      </div>
                      {isCaptain(player) && <span className="text-[13px]">🪖</span>}
                    </div>
                    <div className="text-[10px] text-[#4a6080]">
                      #{getNum(player)} · {meta?.label || player.role}
                    </div>
                  </div>
                  <div className="text-[9px] text-amber-400 font-semibold">Innbytter</div>
                  {/* Kaptein-velger for trener på innbyggere også */}
                  {isCoach && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCaptain(player.id); }}
                      className={`ml-2 px-2 py-1 rounded-md text-[9px] font-semibold transition-all min-h-[32px]
                        ${isCaptain(player) 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-[#1e3050] text-[#4a6080] hover:text-slate-300 border border-transparent'}`}
                    >
                      🪖 {isCaptain(player) ? 'Kaptein' : 'Gjør til kaptein'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PlaytimeBar players={home} />
    </div>
  );
};

const PlaytimeBar: React.FC<{ players: any[] }> = ({ players }) => {
  const withTime = players.filter((p: any) => (p.minutesPlayed ?? 0) > 0);
  if (!withTime.length) return null;
  return (
    <div className="mt-6">
      <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">
        ⏱ Spilletid
      </div>
      <div className="space-y-2">
        {[...withTime].sort((a: any, b: any) => (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0))
          .map((p: any) => {
            const min  = p.minutesPlayed ?? 0;
            const bar  = min > 60 ? '#ef4444' : min > 30 ? '#f59e0b' : '#22c55e';
            const meta = getMeta(p.role);
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center
                  text-[9px] font-black text-white flex-shrink-0"
                  style={{ background: meta?.color ?? '#555' }}>{getNum(p)}</div>
                <div className="w-20 sm:w-28 truncate text-[11px] text-slate-300">
                  {p.name || `#${getNum(p)}`}
                </div>
                <div className="flex-1 h-2 bg-[#1e3050] rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (min / 90) * 100)}%`, background: bar }}/>
                </div>
                <div className="text-[11px] font-bold w-12 text-right" style={{ color: bar }}>
                  {min} min
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

// ═══ MESSAGE CARD ════════════════════════════════════════════

const MessageCard: React.FC<{
  msg: any; playerId?: string;
  replyText: Record<string, string>;
  setReplyText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  replyToMessage: (id: string, pid: string, content: string) => void;
}> = ({ msg, playerId, replyText, setReplyText, replyToMessage }) => (
  <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl overflow-hidden">
    <div className="p-4 bg-[#0f1a2a]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🏋️</span>
        <span className="text-[11px] font-bold text-amber-400">Trener</span>
        <span className="text-[10px] text-[#3a5070] ml-auto">
          {new Date(msg.createdAt).toLocaleDateString('nb-NO')}
        </span>
      </div>
      <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
    </div>
    {(msg.replies ?? []).map((r: any) => (
      <div key={r.id} className="p-4 border-t border-[#1e3050]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold text-sky-400">Svar</span>
          <span className="text-[10px] text-[#3a5070] ml-auto">
            {new Date(r.createdAt).toLocaleDateString('nb-NO')}
          </span>
        </div>
        <p className="text-[12.5px] text-slate-300 leading-relaxed">{r.content}</p>
      </div>
    ))}
    {playerId && (
      <div className="p-4 border-t border-[#1e3050]">
        <textarea
          value={replyText[msg.id] ?? ''}
          onChange={e => setReplyText(p => ({ ...p, [msg.id]: e.target.value }))}
          rows={2} placeholder="Skriv ditt svar..."
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2
            text-[12.5px] text-slate-300 resize-none focus:outline-none focus:border-sky-500 mb-2"
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
    )}
  </div>
);

// ═══ ACCOUNT MANAGER ═════════════════════════════════════════

const AccountManager: React.FC = () => {
  const { playerAccounts, addPlayerAccount, removePlayerAccount, phases, activePhaseIdx } = useAppStore();

  const [name, setName]     = useState('');
  const [pin, setPin]       = useState('');
  const [linkId, setLinkId] = useState('');

  const allPlayers: any[] = (phases[activePhaseIdx] as any)?.players ?? [];
  const homePlayers = allPlayers.filter((p: any) => p.team === 'home');

  const create = () => {
    if (!name.trim() || pin.length !== 4) return;
    addPlayerAccount({
      name: name.trim(),
      pin,
      playerId: linkId || `custom-${Date.now()}`,
      team: 'home',
    });
    setName(''); setPin(''); setLinkId('');
  };

  return (
    <div>
      <h3 className="text-base font-bold text-slate-100 mb-4">⚙️ Spillerkontoer</h3>

      {(playerAccounts as any[]).length > 0 && (
        <div className="space-y-2 mb-5">
          {(playerAccounts as any[]).map((acc: any) => {
            const pl   = allPlayers.find((p: any) => p.id === acc.playerId);
            const meta = pl ? getMeta(pl.role) : null;
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
                  className="text-red-400/50 hover:text-red-400 px-3 min-h-[44px] text-sm">✕</button>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-[#0c1525] border border-dashed border-[#1e3050] rounded-2xl p-5">
        <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-4">
          Opprett ny spillerkonto
        </div>
        <div className="mb-3">
          <label className="label-sm2">Koble til spiller på brettet (valgfritt)</label>
          <select value={linkId}
            onChange={e => {
              setLinkId(e.target.value);
              const pl = homePlayers.find((p: any) => p.id === e.target.value);
              if (pl?.name && !name) setName(pl.name);
            }}
            className="inp2">
            <option value="">– Ingen kobling / ny spiller –</option>
            {homePlayers.map((p: any) => (
              <option key={p.id} value={p.id}>
                #{getNum(p)} {p.name || 'Navnløs'} – {getMeta(p.role)?.label ?? p.role}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-[#3a5070] mt-1.5">
            Samme posisjon kan ha flere kontoer (f.eks. 3 keepere).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <label className="label-sm2">Navn</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ola Nordmann" className="inp2"/>
          </div>
          <div>
            <label className="label-sm2">4-sifret PIN</label>
            <input value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4} placeholder="••••" type="password" className="inp2"/>
            {pin.length > 0 && pin.length < 4 && (
              <div className="text-[10px] text-amber-400 mt-1">{4 - pin.length} siffer til</div>
            )}
          </div>
        </div>
        <button onClick={create}
          disabled={!name.trim() || pin.length !== 4}
          className="w-full py-3 rounded-xl bg-sky-500/15 border border-sky-500/30
            text-sky-400 font-bold text-[13px] hover:bg-sky-500/25
            disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]">
          ✓ Opprett konto
        </button>
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

// ═══ HELPERS ═════════════════════════════════════════════════

const EmptyState: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="text-center py-12">
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-[#4a6080] text-sm">{text}</p>
  </div>
);