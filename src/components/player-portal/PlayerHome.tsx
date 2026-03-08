'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META } from '@/data/roleInfo';

// ═══════════════════════════════════════════════════════════════
//  SPILLERHJEM – Det spilleren ser etter innlogging
//  Faner: Meldinger · Laguttak · Taktikkbrett (read-only) · Chat
// ═══════════════════════════════════════════════════════════════

const SPECIAL_LABELS: Record<string, string> = {
  captain:          '🪖 Kaptein',
  freekick:         '🎯 Frispark',
  penalty:          '⚽ Straffe',
  corner:           '🚩 Corner',
  throwin:          '🤾 Innkast',
  goalkeeper_kicks: '🧤 Keeperutspark',
};

const getMeta = (role: any) => ROLE_META[role as keyof typeof ROLE_META] ?? null;
const getNum  = (p: any): number => p.number ?? p.num ?? 0;


export const PlayerHome: React.FC = () => {
  const {
    currentUser, coachMessages, events, phases,
    playerAccounts, homeTeamName, awayTeamName, logout,
    chatMessages, sendChat,
  } = useAppStore();

  const [tab, setTab] = useState<'messages' | 'lineup' | 'board' | 'chat'>('messages');

  const playerId  = currentUser?.playerId;
  const myAccount = (playerAccounts as any[]).find((a: any) => a.playerId === playerId);
  const phase     = (phases[0] as any) ?? null;
  const myPlayer  = phase?.players?.find((p: any) => p.id === playerId) ?? null;

  // Meldinger til denne spilleren
  const myMessages = (coachMessages as any[]).filter((m: any) => m.playerId === playerId);

  // Chat: vis broadcast + meldinger til/fra denne spilleren
  const myChats = (chatMessages as any[]).filter(
    (m: any) => !m.toPlayerId || m.toPlayerId === playerId ||
    (m.fromRole === 'player' && m.toPlayerId === playerId)
  );

  // Neste arrangement
  const today  = new Date().toISOString().slice(0, 10);
  const nextEv = [...(events as any[])]
    .filter((e: any) => e.date >= today)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))[0] ?? null;

  // Laguttak
  const homeStarters = phase?.players?.filter(
    (p: any) => p.team === 'home' && p.isStarter !== false
  ) ?? [];
  const homeSubs = phase?.players?.filter(
    (p: any) => p.team === 'home' && p.isStarter === false
  ) ?? [];

  const unreadChat = myChats.filter(
    (m: any) => m.fromRole !== 'player'
  ).length;

  const tabs = [
    { id: 'messages', label: '📩 Meldinger', badge: myMessages.length },
    { id: 'lineup',   label: '👥 Laguttak',  badge: 0 },
    { id: 'board',    label: '📋 Taktikk',   badge: 0 },
    { id: 'chat',     label: '💬 Chat',       badge: unreadChat },
  ];

  return (
    <div className="flex flex-col h-full bg-[#060c18]">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050] flex-shrink-0">
        <div>
          <div className="text-sm font-black text-slate-100">{currentUser?.name}</div>
          <div className="text-[10px] text-sky-400 flex items-center gap-1.5">
            {myPlayer && (
              <>
                {myPlayer.specialRoles?.includes('captain') && <span>🪖</span>}
                {getMeta(myPlayer.role)?.label ?? myPlayer.role}
                {' · #'}{getNum(myPlayer)}
                {' · '}{homeTeamName || 'Hjemmelag'}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 flex-1 ml-2">
          {(myPlayer?.specialRoles ?? []).map((sr: string) => (
            <span key={sr}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full
                bg-amber-500/15 border border-amber-500/30 text-amber-400">
              {SPECIAL_LABELS[sr] ?? sr}
            </span>
          ))}
        </div>
        <button onClick={logout}
          className="text-[11px] text-[#4a6080] hover:text-red-400 transition min-h-[44px] px-2">
          Logg ut
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#1e3050] bg-[#0c1525] flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 py-3 text-[11.5px] font-semibold transition-all relative min-h-[44px]
              ${tab === t.id
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-[#3a5070] hover:text-slate-400'}`}>
            {t.label}
            {t.badge > 0 && (
              <span className="absolute top-1.5 right-1 w-4 h-4 rounded-full bg-sky-500
                text-white text-[9px] font-black flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── MELDINGER ── */}
        {tab === 'messages' && (
          <div className="p-4 max-w-2xl mx-auto space-y-4">
            {myPlayer?.notes && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  📝 Trenernotat
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {myPlayer.notes}
                </p>
              </div>
            )}

            {myAccount?.individualTrainingNote && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">
                  🏃 Individuell treningsplan
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {myAccount.individualTrainingNote}
                </p>
              </div>
            )}

            {nextEv && (
              <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl p-4">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">
                  📅 Neste arrangement
                </div>
                <div className="text-[14px] font-bold text-slate-100">{nextEv.title}</div>
                <div className="text-[11px] text-[#4a6080] mt-1">
                  {new Date(nextEv.date + 'T12:00:00').toLocaleDateString('nb-NO', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                  {nextEv.time && ` · ${nextEv.time}`}
                  {nextEv.location && ` · 📍${nextEv.location}`}
                </div>
                {nextEv.teamNote && (
                  <p className="mt-2 text-[12px] text-slate-300 italic">
                    "{nextEv.teamNote}"
                  </p>
                )}
              </div>
            )}

            {myMessages.length === 0 && !myPlayer?.notes && (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📩</div>
                <p className="text-[#4a6080] text-sm">Ingen meldinger fra trener ennå.</p>
              </div>
            )}

            {myMessages.map((msg: any) => (
              <MessageCard key={msg.id} msg={msg} playerId={playerId} />
            ))}
          </div>
        )}

        {/* ── LAGUTTAK ── */}
        {tab === 'lineup' && (
          <div className="p-4 max-w-2xl mx-auto">
            {myPlayer && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4
                flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center
                  font-black text-xl text-white flex-shrink-0 relative"
                  style={{ background: getMeta(myPlayer.role)?.color ?? '#555' }}>
                  {getNum(myPlayer)}
                  {myPlayer.specialRoles?.includes('captain') && (
                    <span className="absolute -top-1 -right-1 text-base">🪖</span>
                  )}
                </div>
                <div>
                  <div className="text-[16px] font-black text-slate-100">
                    {myPlayer.name || `#${getNum(myPlayer)}`}
                    <span className="text-[11px] text-sky-400 ml-2 font-normal">(deg)</span>
                  </div>
                  <div className="text-[12px] text-sky-400">
                    {getMeta(myPlayer.role)?.label ?? myPlayer.role}
                    {myPlayer.isStarter === false && (
                      <span className="ml-2 text-amber-400">· Innbytter</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <SectionLabel label={`${homeTeamName || 'Hjemmelag'} – startoppstilling (${homeStarters.length})`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {homeStarters.map((p: any) => (
                <LineupRow key={p.id} player={p} isMe={p.id === playerId} />
              ))}
            </div>

            {homeSubs.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-[#1e3050]" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2">
                    🪑 Innbyttere ({homeSubs.length})
                  </span>
                  <div className="h-px flex-1 bg-[#1e3050]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {homeSubs.map((p: any) => (
                    <LineupRow key={p.id} player={p} isMe={p.id === playerId} isSub />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAKTIKKBRETT (read-only visning) ── */}
        {tab === 'board' && (
          <div className="p-4 max-w-3xl mx-auto">
            <div className="text-[11px] text-amber-400/70 bg-amber-500/10 border border-amber-500/20
              rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
              <span>🔒</span>
              <span>Read-only – du kan se men ikke endre taktikkbrettet</span>
            </div>
            <ReadOnlyBoard phase={phases[0] as any} />
          </div>
        )}

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <ChatPanel
            currentUser={currentUser}
            chatMessages={myChats}
            onSend={(text) => {
              if (!text.trim()) return;
              sendChat('player', currentUser?.name ?? 'Spiller', text.trim());
            }}
          />
        )}
      </div>
    </div>
  );
};

// ─── Read-only brett ────────────────────────────────────────

const ReadOnlyBoard: React.FC<{ phase: any }> = ({ phase }) => {
  if (!phase) return (
    <div className="text-center py-12 text-[#4a6080]">Ingen taktikk satt opp ennå.</div>
  );

  const home = (phase.players ?? []).filter((p: any) => p.team === 'home');
  const away = (phase.players ?? []).filter((p: any) => p.team === 'away');

  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400 mb-3">{phase.name}</div>
      {phase.stickyNote && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
          <div className="text-[9.5px] font-bold text-amber-400 mb-1 uppercase tracking-wider">
            📌 Trenernotat
          </div>
          <p className="text-[12.5px] text-slate-300 leading-relaxed whitespace-pre-wrap">
            {phase.stickyNote}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[9.5px] font-bold text-blue-400 uppercase tracking-widest mb-2">
            🏠 Startoppstilling
          </div>
          {home.filter((p: any) => p.isStarter !== false).map((p: any) => (
            <MiniPlayerRow key={p.id} player={p} />
          ))}
        </div>
        <div>
          <div className="text-[9.5px] font-bold text-red-400 uppercase tracking-widest mb-2">
            ✈️ Motstanderlag
          </div>
          {away.map((p: any) => (
            <MiniPlayerRow key={p.id} player={p} />
          ))}
        </div>
      </div>
    </div>
  );
};

const MiniPlayerRow: React.FC<{ player: any }> = ({ player }) => {
  const m   = getMeta(player.role);
  const num = getNum(player);
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-7 h-7 rounded-full flex items-center justify-center
        font-black text-[11px] text-white flex-shrink-0"
        style={{ background: m?.color ?? '#555' }}>
        {num}
      </div>
      <div className="text-[12px] text-slate-300">{player.name || `#${num}`}</div>
      {(player.specialRoles ?? []).includes('captain') && (
        <span className="text-[10px] text-amber-400">🪖</span>
      )}
    </div>
  );
};

// ─── Chat-panel ─────────────────────────────────────────────

export const ChatPanel: React.FC<{
  currentUser: any;
  chatMessages: any[];
  onSend: (text: string) => void;
  coachView?: boolean;
}> = ({ currentUser, chatMessages, onSend, coachView = false }) => {
  const [text, setText] = useState('');
  const bottomRef       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-[#4a6080] text-sm">Ingen meldinger ennå.</p>
          </div>
        )}
        {chatMessages.map((msg: any, i: number) => {
          const isMe = coachView
            ? msg.fromRole === 'coach'
            : msg.fromRole === 'player';
          return (
            <div key={msg.id ?? i}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed
                ${isMe
                  ? 'bg-sky-500/20 border border-sky-500/30 text-slate-100 rounded-br-sm'
                  : 'bg-[#0f1a2a] border border-[#1e3050] text-slate-300 rounded-bl-sm'}`}>
                {!isMe && (
                  <div className="text-[9.5px] font-bold text-amber-400 mb-1">
                    {msg.fromName}
                  </div>
                )}
                {msg.content}
                <div className="text-[9px] text-slate-500 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString('nb-NO', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Skrivefeltet */}
      <div className="flex-shrink-0 flex gap-2 p-4 border-t border-[#1e3050] bg-[#0c1525]">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Skriv melding..."
          className="flex-1 bg-[#111c30] border border-[#1e3050] rounded-xl px-4 py-3
            text-[13px] text-slate-200 focus:outline-none focus:border-sky-500 min-h-[48px]"
        />
        <button onClick={send}
          disabled={!text.trim()}
          className="px-5 py-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400
            font-bold text-[13px] hover:bg-sky-500/25 disabled:opacity-40 transition min-h-[48px]">
          Send
        </button>
      </div>
    </div>
  );
};

// ─── Hjelpere ────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-2">
    {label}
  </div>
);

const LineupRow: React.FC<{
  player: any; isMe: boolean; isSub?: boolean;
}> = ({ player, isMe, isSub }) => {
  const meta = getMeta(player.role);
  const num  = getNum(player);
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all
      ${isMe
        ? 'bg-sky-500/10 border-sky-500/40'
        : isSub
          ? 'bg-[#0f1a2a] border-amber-500/15 opacity-75'
          : 'bg-[#0f1a2a] border-[#1e3050]'}`}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center
        font-black text-[12px] text-white flex-shrink-0 relative"
        style={{ background: meta?.color ?? '#555' }}>
        {num}
        {(player.specialRoles ?? []).includes('captain') && (
          <span className="absolute -top-1 -right-1 text-[10px]">🪖</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-bold text-slate-200 truncate">
          {player.name || `#${num}`}
          {isMe && <span className="text-[9.5px] text-sky-400 ml-1.5">(deg)</span>}
        </div>
        <div className="text-[10px] text-[#4a6080]">{meta?.label ?? player.role}</div>
      </div>
    </div>
  );
};

const MessageCard: React.FC<{ msg: any; playerId?: string }> = ({ msg, playerId }) => {
  const { replyToMessage } = useAppStore();
  const [reply, setReply]  = useState('');

  const send = () => {
    const txt = reply.trim();
    if (!txt || !playerId) return;
    replyToMessage(msg.id, playerId, txt);
    setReply('');
  };

  return (
    <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl overflow-hidden">
      <div className="p-4 bg-[#0f1a2a]">
        <div className="flex items-center gap-2 mb-2">
          <span>🏋️</span>
          <span className="text-[11px] font-bold text-amber-400">Trener</span>
          <span className="text-[10px] text-[#3a5070] ml-auto">
            {new Date(msg.createdAt).toLocaleDateString('nb-NO')}
          </span>
        </div>
        <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </p>
      </div>
      {(msg.replies ?? []).map((r: any) => (
        <div key={r.id} className="p-4 border-t border-[#1e3050]">
          <div className="text-[11px] font-bold text-sky-400 mb-1">Ditt svar</div>
          <p className="text-[12.5px] text-slate-300">{r.content}</p>
        </div>
      ))}
      <div className="p-4 border-t border-[#1e3050]">
        <textarea value={reply} onChange={e => setReply(e.target.value)}
          rows={2} placeholder="Skriv svar til trener..."
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2
            text-[12.5px] text-slate-300 resize-none focus:outline-none
            focus:border-sky-500 mb-2" />
        <button onClick={send}
          className="px-4 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30
            text-sky-400 font-bold text-[12px] hover:bg-sky-500/25 min-h-[44px]">
          Send
        </button>
      </div>
    </div>
  );
};