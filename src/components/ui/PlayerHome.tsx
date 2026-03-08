'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_META } from '@/data/roleInfo';

// ═══════════════════════════════════════════════════════════════
//  SPILLERHJEM – Det spilleren ser etter innlogging
//  • Kun egne meldinger + kaptein-meldinger
//  • Laguttak (hvem starter, hvem er innbytter)
//  • Taktikkbrettet som read-only
//  • Spesialroller (kaptein, straffe, etc.)
//  • Kommende arrangement
//  Optimalisert for mobil (touch targets ≥ 44px)
// ═══════════════════════════════════════════════════════════════

const SPECIAL_LABELS: Record<string, string> = {
  captain:           '🪖 Kaptein',
  freekick:          '🎯 Frispark',
  penalty:           '⚽ Straffespark',
  corner:            '🚩 Corner',
  throwin:           '🤾 Innkast',
  goalkeeper_kicks:  '🧤 Keeperutspark',
};

const getMeta = (role: any) =>
  ROLE_META[role as keyof typeof ROLE_META] ?? null;

const getNum = (p: any): number => p.number ?? p.num ?? 0;

export const PlayerHome: React.FC = () => {
  const {
    currentUser, coachMessages, events, phases,
    playerAccounts, logout,
  } = useAppStore();

  const [tab, setTab] = useState<'messages' | 'lineup' | 'next'>('messages');

  const playerId  = currentUser?.playerId;
  const myAccount = (playerAccounts as any[]).find((a: any) => a.playerId === playerId);
  const phase     = (phases[0] as any) ?? null;
  const myPlayer  = phase?.players?.find((p: any) => p.id === playerId) ?? null;

  // Meldinger kun til denne spilleren (trener + kaptein)
  const myMessages = (coachMessages as any[]).filter(
    (m: any) => m.playerId === playerId
  );

  // Neste arrangement
  const today  = new Date().toISOString().slice(0, 10);
  const nextEv = [...(events as any[])]
    .filter((e: any) => e.date >= today)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))[0] ?? null;

  // Startoppstilling
  const starters  = phase?.players?.filter((p: any) => p.team === 'home' && p.isStarter !== false && p.isOnField !== false) ?? [];
  const subs      = phase?.players?.filter((p: any) => p.team === 'home' && (p.isStarter === false || p.isOnField === false)) ?? [];

  const tabs = [
    { id: 'messages', label: '💬 Meldinger', badge: myMessages.length > 0 ? myMessages.length : 0 },
    { id: 'lineup',   label: '👥 Laguttak',  badge: 0 },
    { id: 'next',     label: '📅 Neste kamp', badge: 0 },
  ];

  return (
    <div className="flex flex-col h-full bg-[#060c18]">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <div>
          <div className="text-sm font-black text-slate-100">{currentUser?.name}</div>
          {myPlayer && (
            <div className="text-[10px] text-sky-400 flex items-center gap-1.5">
              {myPlayer.specialRoles?.includes('captain') && <span>🪖 Kaptein</span>}
              {getMeta(myPlayer.role)?.label ?? myPlayer.role}
              {' · #'}{getNum(myPlayer)}
            </div>
          )}
        </div>

        {/* Spesialroller som badges */}
        <div className="flex flex-wrap gap-1 flex-1 ml-2">
          {(myPlayer?.specialRoles ?? []).map((sr: string) => (
            <span key={sr}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15
                border border-amber-500/30 text-amber-400">
              {SPECIAL_LABELS[sr] ?? sr}
            </span>
          ))}
        </div>

        <button onClick={logout}
          className="text-[11px] text-[#4a6080] hover:text-red-400 transition px-2 min-h-[44px]">
          Logg ut
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e3050] bg-[#0c1525]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 py-3 text-[12px] font-semibold transition-all relative min-h-[44px]
              ${tab === t.id
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-[#3a5070] hover:text-slate-400'}`}>
            {t.label}
            {t.badge > 0 && (
              <span className="absolute top-1.5 right-3 w-4 h-4 rounded-full bg-sky-500
                text-white text-[9px] font-black flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── MELDINGER ── */}
        {tab === 'messages' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {myPlayer?.notes && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  📝 Trenernotat til deg
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {myPlayer.notes}
                </p>
              </div>
            )}

            {myAccount?.individualTrainingNote && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">
                  🏃 Individuell trening
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {myAccount.individualTrainingNote}
                </p>
              </div>
            )}

            {myMessages.length === 0 && !myPlayer?.notes ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-[#4a6080] text-sm">Ingen meldinger fra trener ennå.</p>
              </div>
            ) : (
              myMessages.map((msg: any) => (
                <MessageCard key={msg.id} msg={msg} playerId={playerId} />
              ))
            )}
          </div>
        )}

        {/* ── LAGUTTAK ── */}
        {tab === 'lineup' && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-base font-bold text-slate-100 mb-4">👥 Laguttak</h3>

            {/* Din posisjon fremhevet */}
            {myPlayer && (
              <MyPositionCard player={myPlayer} />
            )}

            {/* Startoppstilling */}
            <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-2 mt-4">
              Startoppstilling ({starters.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {starters.map((p: any) => (
                <LineupCard key={p.id} player={p} isMe={p.id === playerId} />
              ))}
            </div>

            {/* Innbyttere */}
            {subs.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-[#1e3050]" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2">
                    🪑 Innbyttere ({subs.length})
                  </span>
                  <div className="h-px flex-1 bg-[#1e3050]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subs.map((p: any) => (
                    <LineupCard key={p.id} player={p} isMe={p.id === playerId} isSub />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── NESTE KAMP / TRENING ── */}
        {tab === 'next' && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-base font-bold text-slate-100 mb-4">📅 Neste arrangement</h3>
            {!nextEv ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-[#4a6080] text-sm">Ingen kommende arrangementer.</p>
              </div>
            ) : (
              <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border
                    ${nextEv.type === 'match'
                      ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}`}>
                    {nextEv.type === 'match' ? '⚽ Kamp' : '🏃 Trening'}
                  </span>
                  <span className="text-[11px] text-[#4a6080]">
                    {new Date(nextEv.date + 'T12:00:00').toLocaleDateString('nb-NO', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </span>
                </div>
                <div className="text-[18px] font-black text-slate-100 mb-3">{nextEv.title}</div>
                {nextEv.time && (
                  <div className="flex items-center gap-2 text-[13px] text-slate-300 mb-1.5">
                    <span>🕐</span> {nextEv.time}
                  </div>
                )}
                {nextEv.location && (
                  <div className="flex items-center gap-2 text-[13px] text-slate-300 mb-1.5">
                    <span>📍</span> {nextEv.location}
                  </div>
                )}
                {nextEv.opponent && (
                  <div className="flex items-center gap-2 text-[13px] text-slate-300 mb-1.5">
                    <span>⚔️</span> Mot: {nextEv.opponent}
                  </div>
                )}
                {nextEv.teamNote && (
                  <div className="mt-4 bg-[#111c30] rounded-xl p-4 border border-[#1e3050]">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                      📣 Beskjed fra trener
                    </div>
                    <p className="text-[13px] text-slate-300 leading-relaxed">
                      {nextEv.teamNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Min posisjon-kort ───────────────────────────────────────

const MyPositionCard: React.FC<{ player: any }> = ({ player }) => {
  const meta = getMeta(player.role);
  return (
    <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-14 h-14 rounded-full flex items-center justify-center font-black
        text-xl text-white flex-shrink-0 relative"
        style={{ background: meta?.color ?? '#555' }}>
        {getNum(player)}
        {player.specialRoles?.includes('captain') && (
          <span className="absolute -top-1 -right-1 text-base">🪖</span>
        )}
      </div>
      <div>
        <div className="text-[16px] font-black text-slate-100">
          {player.name || `#${getNum(player)}`}
        </div>
        <div className="text-[12px] text-sky-400">{meta?.label ?? player.role}</div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {(player.specialRoles ?? []).map((sr: string) => (
            <span key={sr}
              className="text-[9.5px] font-bold px-2 py-0.5 rounded-full
                bg-amber-500/15 border border-amber-500/30 text-amber-400">
              {SPECIAL_LABELS[sr] ?? sr}
            </span>
          ))}
          {player.isStarter === false && (
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full
              bg-amber-500/15 border border-amber-500/30 text-amber-300">
              🪑 Innbytter
            </span>
          )}
          {player.injured && (
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full
              bg-red-500/15 border border-red-500/30 text-red-400">
              🩹 Skadet
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Laguttak-kort ───────────────────────────────────────────

const LineupCard: React.FC<{
  player: any; isMe: boolean; isSub?: boolean;
}> = ({ player, isMe, isSub }) => {
  const meta = getMeta(player.role);
  const num  = getNum(player);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all
      ${isMe
        ? 'bg-sky-500/10 border-sky-500/40'
        : isSub
          ? 'bg-[#0f1a2a] border-amber-500/20 opacity-80'
          : 'bg-[#0f1a2a] border-[#1e3050]'}`}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center
        font-black text-[13px] text-white flex-shrink-0 relative"
        style={{
          background: meta?.color ?? '#555',
          opacity: player.injured ? 0.5 : 1,
        }}>
        {num}
        {player.specialRoles?.includes('captain') && (
          <span className="absolute -top-1 -right-1 text-[11px]">🪖</span>
        )}
        {player.injured && (
          <span className="absolute -top-1 -right-1 text-[11px]">🩹</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-bold text-slate-200 truncate flex items-center gap-1.5">
          {player.name || `#${num}`}
          {isMe && <span className="text-[9.5px] text-sky-400 font-bold">(deg)</span>}
        </div>
        <div className="text-[10px] text-[#4a6080]">{meta?.label ?? player.role}</div>
        <div className="flex gap-1 flex-wrap mt-0.5">
          {(player.specialRoles ?? []).filter((sr: string) => sr !== 'captain').map((sr: string) => (
            <span key={sr} className="text-[8.5px] text-amber-400/70">{SPECIAL_LABELS[sr]}</span>
          ))}
        </div>
      </div>
      {isSub && (
        <span className="text-[9.5px] text-amber-400 font-bold shrink-0">Innbytter</span>
      )}
    </div>
  );
};

// ─── Meldings-kort ───────────────────────────────────────────

const MessageCard: React.FC<{ msg: any; playerId?: string }> = ({ msg, playerId }) => {
  const { replyToMessage } = useAppStore();
  const [reply, setReply] = useState('');

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
          <span>{msg.fromCaptain ? '🪖' : '🏋️'}</span>
          <span className="text-[11px] font-bold text-amber-400">
            {msg.fromCaptain ? 'Kaptein' : 'Trener'}
          </span>
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
          <div className="text-[11px] font-bold text-sky-400 mb-1">Du svarte</div>
          <p className="text-[12.5px] text-slate-300 leading-relaxed">{r.content}</p>
        </div>
      ))}

      <div className="p-4 border-t border-[#1e3050]">
        <textarea value={reply} onChange={e => setReply(e.target.value)}
          rows={2} placeholder="Skriv svar..."
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
