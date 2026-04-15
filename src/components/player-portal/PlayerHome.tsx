// src/components/player-portal/PlayerHome.tsx
'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppStore, subscribeToSupabase } from '@/store/useAppStore';
import { useNotification } from '@/components/NotificationProvider';
import { ROLE_META, getRolesForSport } from '@/data/roleInfo';
import { TrainingView } from '@/components/ui/TrainingView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ChatPanel } from '@/components/ui/ChatPanel';
import { PitchView } from '@/components/board/PitchView';
import type { TacticPhase, CalendarEvent, CoachMessage, ChatMessage, Player } from '@/types';
import { PlayerProfile } from './PlayerProfile';

// ─── KONSTANTER OG HJELPEFUNKSJONER ──────────────────────────
const SPECIAL_LABELS: Record<string, string> = {
  captain:          '🪖 Kaptein',
  freekick:         '🎯 Frispark',
  penalty:          '⚽ Straffe',
  corner:           '🚩 Corner',
  throwin:          '🤾 Innkast',
  goalkeeper_kicks: '🧤 Keeperutspark',
};

const SPECIAL_ROLE_TOOLTIPS: Record<string, string> = {
  captain:          'Kaptein – leder laget på banen',
  freekick:         'Frispark-taker – utfører frispark',
  penalty:          'Straffesparktaker – utfører straffespark',
  corner:           'Cornertaker – utfører cornere',
  throwin:          'Innkasttaker – utfører innkast',
  goalkeeper_kicks: 'Keeperutspark – slår ut ballen fra mål',
};

const getMeta = (role: string) => ROLE_META[role as keyof typeof ROLE_META] ?? null;
const getNum = (p: { num?: number; number?: number }) => p.number ?? p.num ?? 0;

// ═══════════════════════════════════════════════════════════════
//  READ-ONLY TACTIC BOARD (RESPONSIV OPPDATERT)
// ═══════════════════════════════════════════════════════════════
export const ReadOnlyTacticBoard: React.FC = () => {
  const { phases: rawPhases, sport } = useAppStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playRef  = useRef({ from: 0, t: 0 });

  const [activeIdx, setActiveIdx]   = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [playSpeed, setPlaySpeed]   = useState(1);
  const [interpFrom, setInterpFrom] = useState(0);
  const [interpT, setInterpT]       = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const phases = useMemo(() => {
    const uniqueMap = new Map<string, TacticPhase>();
    for (const ph of rawPhases) {
      if (!uniqueMap.has(ph.id)) {
        uniqueMap.set(ph.id, ph);
      } else {
        console.warn(`[PlayerHome] Duplikat fase oppdaget: ${ph.id} (${ph.name}). Bruker første forekomst.`);
      }
    }
    const uniquePhases = Array.from(uniqueMap.values());
    return uniquePhases.sort((a, b) => {
      const orderA = (a as any).sort_order ?? 999;
      const orderB = (b as any).sort_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    });
  }, [rawPhases]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startPlayback = useCallback(() => {
    if (phases.length < 2) return;
    if (timerRef.current) clearInterval(timerRef.current);
    playRef.current = { from: 0, t: 0 };
    setInterpFrom(0); setInterpT(0); setActiveIdx(0); setIsPlaying(true);
    timerRef.current = setInterval(() => {
      playRef.current.t += 0.025 * playSpeed;
      if (playRef.current.t >= 1) {
        const next = playRef.current.from + 1;
        if (next >= phases.length - 1) {
          clearInterval(timerRef.current!); timerRef.current = null;
          setIsPlaying(false); setActiveIdx(phases.length - 1); setInterpT(0);
          return;
        }
        playRef.current.from = next; playRef.current.t = 0;
        setInterpFrom(next); setInterpT(0); setActiveIdx(next);
      } else {
        setInterpT(playRef.current.t); setInterpFrom(playRef.current.from);
      }
    }, 30);
  }, [phases, playSpeed]);

  const stopPlayback = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsPlaying(false); setInterpT(0);
  }, []);

  const phase = phases[activeIdx];
  if (!phase) return (
    <div className="flex-1 flex items-center justify-center text-[#4a6080]">
      <div className="text-center py-12">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-sm">Ingen taktikk tilgjengelig ennå.</p>
      </div>
    </div>
  );

  const displayPlayers = useMemo(() => {
    if (!isPlaying || interpT === 0) return phase.players;
    const from = phases[interpFrom];
    const to   = phases[Math.min(interpFrom + 1, phases.length - 1)];
    if (!from || !to) return phase.players;
    return from.players.map(fp => {
      const tp = to.players.find(p => p.id === fp.id);
      if (!tp) return fp;
      return { ...fp, position: {
        x: fp.position.x + (tp.position.x - fp.position.x) * interpT,
        y: fp.position.y + (tp.position.y - fp.position.y) * interpT,
      }};
    });
  }, [phase, isPlaying, interpT, interpFrom, phases]);

  const displayBall = useMemo(() => {
    if (!isPlaying || interpT === 0) return phase.ball;
    const from = phases[interpFrom];
    const to   = phases[Math.min(interpFrom + 1, phases.length - 1)];
    if (!from || !to) return phase.ball;
    return {
      x: from.ball.x + (to.ball.x - from.ball.x) * interpT,
      y: from.ball.y + (to.ball.y - from.ball.y) * interpT,
    };
  }, [phase, isPlaying, interpT, interpFrom, phases]);

  const progressFrac = phases.length > 1 ? (interpFrom + interpT) / (phases.length - 1) : 0;
  const homePlayers  = (displayPlayers as Player[]).filter(p => p.team === 'home' && p.isStarter !== false && p.isOnField !== false);
  const bench        = (phase.players ?? []).filter(p => p.team === 'home' && (p.isStarter === false || p.isOnField === false));

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#060c18]">
      {/* Read-only banner – kompakt på mobil */}
      <div className="flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-500/10 backdrop-blur-sm border-b border-amber-500/20 flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-amber-400 text-[10px] sm:text-[11px]">🔒</span>
          <span className="text-[9px] sm:text-[10.5px] text-amber-400/80 truncate">
            {isMobile ? 'Read-only' : 'Read-only – du kan se men ikke endre taktikkbrettet'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isMobile && (
            <button onClick={() => setShowInfo(!showInfo)}
              className="px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[9px] font-semibold">
              {showInfo ? 'Skjul info' : 'Vis info'}
            </button>
          )}
          <button onClick={() => setIsFullscreen(true)}
            className="px-2 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[9px] sm:text-[10px] font-semibold hover:bg-sky-500/25 transition">
            ⛶ Fullskjerm
          </button>
        </div>
      </div>

      {/* Fase-velger + spillekontroller – responsiv */}
      <div className="flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#0d1626]/80 backdrop-blur-sm border-b border-[#1e3050]">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <span className="text-[9px] sm:text-[10px] font-bold text-[#4a6080] uppercase tracking-widest">Faser</span>
          
          {isMobile ? (
            <select
              value={activeIdx}
              onChange={(e) => !isPlaying && setActiveIdx(parseInt(e.target.value))}
              disabled={isPlaying}
              className="bg-[#111c30] border border-[#1e3050] rounded-md px-2 py-1 text-[10px] text-slate-200 min-h-[32px] flex-1"
            >
              {phases.map((ph, idx) => (
                <option key={ph.id} value={idx}>{ph.name}</option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-1">
              {phases.map((ph, idx) => (
                <button key={ph.id} onClick={() => !isPlaying && setActiveIdx(idx)}
                  className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold border transition-all min-h-[32px] sm:min-h-[36px]
                    ${activeIdx === idx ? 'bg-sky-500/15 border-sky-500 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}
                    ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {ph.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap mt-1.5">
          <div className="flex items-center gap-1 bg-[#111c30]/80 backdrop-blur rounded-lg px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-[#1e3050]">
            <button onClick={() => !isPlaying && setActiveIdx(Math.max(0, activeIdx - 1))}
              disabled={isPlaying || activeIdx === 0}
              className="text-slate-400 disabled:opacity-30 text-sm sm:text-base px-0.5 sm:px-1 min-w-[28px] sm:min-w-[32px] min-h-[32px] sm:min-h-[36px]">⏮</button>
            <button onClick={() => isPlaying ? stopPlayback() : startPlayback()} disabled={phases.length < 2}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm border transition-all
                ${phases.length < 2 ? 'border-[#1e3050] text-[#334155] cursor-not-allowed' : isPlaying ? 'border-red-500 bg-red-500/15 text-red-400' : 'border-sky-500 bg-sky-500/15 text-sky-400'}`}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={() => !isPlaying && setActiveIdx(Math.min(phases.length - 1, activeIdx + 1))}
              disabled={isPlaying || activeIdx === phases.length - 1}
              className="text-slate-400 disabled:opacity-30 text-sm sm:text-base px-0.5 sm:px-1 min-w-[28px] sm:min-w-[32px] min-h-[32px] sm:min-h-[36px]">⏭</button>
            <select value={playSpeed} onChange={e => setPlaySpeed(Number(e.target.value))}
              className="bg-transparent border-none text-[#4a6080] text-[9px] sm:text-[11px] cursor-pointer ml-0.5 sm:ml-1">
              <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option>
            </select>
          </div>
          {phases.length < 2 && <span className="text-[9px] sm:text-[10px] text-[#3a5070] italic">Trenger minst 2 faser</span>}
          {phase.stickyNote && (
            <span className="text-[10px] sm:text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 sm:py-1 rounded-lg truncate max-w-[150px] sm:max-w-none">
              📌 {phase.stickyNote}
            </span>
          )}
        </div>
      </div>

      {/* PitchView */}
      <PitchView
        phase={phase}
        sport={sport}
        isPlaying={isPlaying}
        progressFrac={progressFrac}
        displayBall={displayBall}
        homePlayers={homePlayers}
        drawings={phase.drawings}
        onFullscreen={() => setIsFullscreen(true)}
        showFullscreenBtn={false}
      />

      {/* Rollelegende – kun synlig på desktop eller når showInfo er aktiv på mobil */}
      {(!isMobile || showInfo) && (
        <div className="flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#0d1626]/80 backdrop-blur border-t border-[#1e3050]">
          <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-0.5">
            {Object.entries(ROLE_META).slice(0, 8).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0" style={{ background: meta.color }}/>
                <span className="text-[7px] sm:text-[8.5px] text-[#4a6080]">{meta.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Innbyttere – horisontalt scrollbar på mobil, flex-wrap på desktop */}
      {bench.length > 0 && (!isMobile || showInfo) && (
        <div className="flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#0a1422]/80 backdrop-blur border-t border-[#1e3050]">
          <div className="text-[8px] sm:text-[9.5px] font-bold text-amber-400 uppercase tracking-widest mb-1 sm:mb-1.5">🪑 Innbyttere</div>
          <div className={`flex gap-1.5 sm:gap-2 ${isMobile ? 'overflow-x-auto pb-1 -mx-2 px-2' : 'flex-wrap'}`}>
            {bench.sort((a,b) => (a.num || 0) - (b.num || 0)).map(p => {
              const meta = ROLE_META[p.role as keyof typeof ROLE_META] ?? { color: '#555', label: p.role };
              return (
                <div key={p.id} className={`flex items-center gap-1 sm:gap-1.5 bg-[#0f1a2a]/90 backdrop-blur border border-amber-500/20 rounded-lg px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-md ${isMobile ? 'flex-shrink-0' : ''}`}>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white flex-shrink-0" style={{ background: meta.color }}>{p.num}</div>
                  <div>
                    <div className="text-[9px] sm:text-[10.5px] font-bold text-slate-200 leading-none truncate max-w-[80px] sm:max-w-none">{p.name || `#${p.num}`}</div>
                    <div className="text-[7px] sm:text-[8.5px] text-amber-400 mt-0.5 truncate">{meta.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullskjerm modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto p-4 sm:p-6">
          <div className="relative min-h-full flex items-center justify-center">
            <div className="relative w-full max-w-[1200px] bg-[#060c18] rounded-2xl shadow-2xl border border-[#1e3050]">
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-semibold hover:bg-red-500/25 transition"
              >
                ✕ Lukk fullskjerm
              </button>
              <div className="w-full aspect-[16/10]">
                <PitchView
                  phase={phase}
                  sport={sport}
                  isPlaying={isPlaying}
                  progressFrac={progressFrac}
                  displayBall={displayBall}
                  homePlayers={homePlayers}
                  drawings={phase.drawings}
                  showFullscreenBtn={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  HOVED-KOMPONENT: PlayerHome (URØRT – kun responsive tabs)
// ═══════════════════════════════════════════════════════════════

export const PlayerHome: React.FC = () => {
  const { currentUser, coachMessages, events, phases, sport, playerAccounts, homeTeamName, logout, chatMessages, sendChat } = useAppStore();
  const { markMessagesAsRead } = useNotification();

  const [tab, setTab] = useState<'messages' | 'lineup' | 'board' | 'chat' | 'roles' | 'calendar' | 'training' | 'profile'>('board');
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0);
  const [lastSeenChatCount, setLastSeenChatCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const playerId = currentUser?.playerId;
  const myAccount = useMemo(() => (playerAccounts as any[]).find((a: any) => a.playerId === playerId), [playerAccounts, playerId]);
  const phase = (phases[0] as TacticPhase | undefined) ?? null;
  const myPlayer = useMemo(() => phase?.players?.find((p: Player) => p.id === playerId) ?? null, [phase, playerId]);

  const myMessages = useMemo(() => (coachMessages as CoachMessage[]).filter(m => m.playerId === playerId), [coachMessages, playerId]);
  const myChats = useMemo(() => (chatMessages as ChatMessage[]).filter(m => !m.toPlayerId || m.toPlayerId === playerId || (m.fromRole === 'player' && m.toPlayerId === playerId)), [chatMessages, playerId]);

  const unreadMessages = myMessages.length - lastSeenMessageCount;
  const unreadChats = myChats.filter(m => m.fromRole !== 'player').length - lastSeenChatCount;

  const today = new Date().toISOString().slice(0, 10);
  const nextEv = useMemo(() => (events as CalendarEvent[]).filter(e => e.date >= today).sort((a,b) => a.date.localeCompare(b.date))[0] ?? null, [events, today]);

  useEffect(() => {
    if (typeof window !== 'undefined' && playerId) {
      const savedCount = localStorage.getItem(`taktikkboard_seen_messages_${playerId}`);
      if (savedCount) setLastSeenMessageCount(parseInt(savedCount, 10));
      const savedChatCount = localStorage.getItem(`taktikkboard_seen_chats_${playerId}`);
      if (savedChatCount) setLastSeenChatCount(parseInt(savedChatCount, 10));
    }
  }, [playerId]);

  useEffect(() => {
    if (tab === 'messages' && myMessages.length > 0) {
      setLastSeenMessageCount(myMessages.length);
      markMessagesAsRead();
      if (typeof window !== 'undefined' && playerId) localStorage.setItem(`taktikkboard_seen_messages_${playerId}`, String(myMessages.length));
    }
  }, [tab, myMessages.length, markMessagesAsRead, playerId]);

  useEffect(() => {
    if (tab === 'chat' && myChats.length > 0) {
      const coachChatCount = myChats.filter(m => m.fromRole !== 'player').length;
      setLastSeenChatCount(coachChatCount);
      markMessagesAsRead();
      if (typeof window !== 'undefined' && playerId) localStorage.setItem(`taktikkboard_seen_chats_${playerId}`, String(coachChatCount));
    }
  }, [tab, myChats.length, markMessagesAsRead, playerId]);

  useEffect(() => {
    useAppStore.getState().syncFromSupabase();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSupabase(() => {
      useAppStore.getState().syncFromSupabase();
    });
    return () => { unsubscribe(); };
  }, []);

  const resolvePlayerName = useCallback((p: any) => {
    let acc = (playerAccounts as any[]).find(a => a.id === p.playerAccountId);
    if (!acc) acc = (playerAccounts as any[]).find(a => a.playerId === p.id);
    if (!acc && p.name) acc = (playerAccounts as any[]).find(a => a.name === p.name);
    return acc?.name || p.name || `#${p.num}`;
  }, [playerAccounts]);

  const homeStarters = useMemo(() => (phase?.players?.filter(p => p.team === 'home' && p.isStarter !== false) ?? []).map(p => ({ ...p, name: resolvePlayerName(p) })), [phase, resolvePlayerName]);
  const homeSubs = useMemo(() => (phase?.players?.filter(p => p.team === 'home' && p.isStarter === false) ?? []).map(p => ({ ...p, name: resolvePlayerName(p) })), [phase, resolvePlayerName]);

  const tabs = [
    { id: 'board',    label: isMobile ? '📋' : '📋 Taktikk',   badge: 0 },
    { id: 'lineup',   label: isMobile ? '👥' : '👥 Laguttak',  badge: 0 },
    { id: 'training', label: isMobile ? '🏃' : '🏃 Trening',   badge: 0 },
    { id: 'calendar', label: isMobile ? '📅' : '📅 Kalender',  badge: 0 },
    { id: 'roles',    label: isMobile ? '📚' : '📚 Roller',    badge: 0 },
    { id: 'profile',  label: isMobile ? '👤' : '👤 Profil',    badge: 0 },
    { id: 'messages', label: isMobile ? '📩' : '📩 Meldinger', badge: Math.max(0, unreadMessages) },
    { id: 'chat',     label: isMobile ? '💬' : '💬 Chat',      badge: Math.max(0, unreadChats) },
  ];

  return (
    <div className="flex flex-col h-full bg-[#060c18] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-[#0c1525]/80 backdrop-blur border-b border-[#1e3050] flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-black text-slate-100 truncate">{currentUser?.name}</div>
          <div className="text-[9px] sm:text-[10px] text-sky-400 flex items-center gap-1 sm:gap-1.5 truncate">
            {myPlayer ? (
              <>{myPlayer.specialRoles?.includes('captain') && <span>🪖</span>}{getMeta(myPlayer.role)?.label ?? myPlayer.role} · #{getNum(myPlayer)} · {isMobile ? '' : homeTeamName || 'Hjemmelag'}</>
            ) : 'Spiller'}
          </div>
        </div>
        {(myPlayer?.specialRoles ?? []).length > 0 && !isMobile && (
          <div className="flex flex-wrap gap-1">
            {(myPlayer?.specialRoles ?? []).map(sr => (
              <div key={sr} className="relative group">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full cursor-help bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1">{SPECIAL_LABELS[sr] ?? sr}</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 bg-[#0c1525] border border-amber-500/40 rounded-lg px-2 py-1.5 text-[9.5px] text-amber-300 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{SPECIAL_ROLE_TOOLTIPS[sr] ?? sr}<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-500/40" /></div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => useAppStore.getState().syncFromSupabase()}
          className="text-[14px] sm:text-[16px] text-sky-400 hover:text-sky-300 transition min-h-[44px] px-1 sm:px-2"
          title="Hent nyeste data fra server"
        >
          🔄
        </button>
        <button onClick={logout} className="text-[10px] sm:text-[11px] text-[#4a6080] hover:text-red-400 transition min-h-[44px] px-1 sm:px-2 flex-shrink-0">Ut</button>
      </div>

      {/* Tabs – kortere på mobil */}
      <div className="flex border-b border-[#1e3050] bg-[#0c1525]/80 backdrop-blur flex-shrink-0 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 py-2 sm:py-3 text-[10px] sm:text-[11px] font-semibold transition-all relative min-h-[40px] sm:min-h-[44px] whitespace-nowrap px-1
              ${tab === t.id ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070] hover:text-slate-400'}`}>
            {t.label}
            {t.badge > 0 && <span className="absolute top-1 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-sky-500 text-white text-[7px] sm:text-[8px] font-black flex items-center justify-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Innhold – urørt */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {tab === 'board' && <ReadOnlyTacticBoard />}
        {tab === 'lineup' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 max-w-2xl mx-auto w-full">
            {myPlayer && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 backdrop-blur">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-lg sm:text-xl text-white flex-shrink-0 relative" style={{ background: getMeta(myPlayer.role)?.color ?? '#555' }}>
                  {getNum(myPlayer)}
                  {myPlayer.specialRoles?.includes('captain') && <span className="absolute -top-1 -right-1 text-sm sm:text-base">🪖</span>}
                </div>
                <div>
                  <div className="text-[14px] sm:text-[16px] font-black text-slate-100">{resolvePlayerName(myPlayer)}<span className="text-[10px] sm:text-[11px] text-sky-400 ml-1.5 sm:ml-2 font-normal">(deg)</span></div>
                  <div className="text-[11px] sm:text-[12px] text-sky-400">{getMeta(myPlayer.role)?.label ?? myPlayer.role}{myPlayer.isStarter === false && <span className="ml-1.5 sm:ml-2 text-amber-400">· Innbytter</span>}</div>
                  {(myPlayer.specialRoles ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 sm:mt-1.5">
                      {(myPlayer.specialRoles ?? []).map(sr => (
                        <div key={sr} className="relative group">
                          <span className="text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full cursor-help bg-amber-500/15 border border-amber-500/30 text-amber-400">{SPECIAL_LABELS[sr] ?? sr}</span>
                          <div className="absolute bottom-full left-0 mb-1 z-50 bg-[#0c1525] border border-amber-500/40 rounded-lg px-2 py-1.5 text-[9px] sm:text-[9.5px] text-amber-300 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{SPECIAL_ROLE_TOOLTIPS[sr] ?? sr}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {myPlayer?.notes && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 backdrop-blur">
                <div className="text-[8px] sm:text-[9.5px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 sm:mb-2">📝 Trenernotat</div>
                <p className="text-[12px] sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">{myPlayer.notes}</p>
              </div>
            )}
            {nextEv && (
              <div className="bg-[#0c1525]/80 backdrop-blur border border-[#1e3050] rounded-xl p-3 sm:p-4 mb-4 sm:mb-5">
                <div className="text-[8px] sm:text-[9.5px] font-bold text-sky-400 uppercase tracking-wider mb-1.5 sm:mb-2">📅 Neste arrangement</div>
                <div className="text-[13px] sm:text-[14px] font-bold text-slate-100">{nextEv.title}</div>
                <div className="text-[10px] sm:text-[11px] text-[#4a6080] mt-1">{new Date(nextEv.date + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}{nextEv.time && ` · ${nextEv.time}`}{nextEv.location && ` · 📍${nextEv.location}`}</div>
              </div>
            )}
            <div className="text-[9px] sm:text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-1.5 sm:mb-2">{homeTeamName || 'Hjemmelag'} – startoppstilling ({homeStarters.length})</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {homeStarters.sort((a,b) => getNum(a) - getNum(b)).map(p => <LineupRow key={p.id} player={p} isMe={p.id === playerId} />)}
            </div>
            {homeSubs.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2 sm:mb-3"><div className="h-px flex-1 bg-[#1e3050]" /><span className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2">🪑 Innbyttere ({homeSubs.length})</span><div className="h-px flex-1 bg-[#1e3050]" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                  {homeSubs.sort((a,b) => getNum(a) - getNum(b)).map(p => <LineupRow key={p.id} player={p} isMe={p.id === playerId} isSub />)}
                </div>
              </>
            )}
          </div>
        )}
        {tab === 'training' && <TrainingView />}
        {tab === 'calendar' && <CalendarView />}
        {tab === 'roles' && <RoleDescriptionsView sport={sport} myRole={myPlayer?.role} />}
        {tab === 'profile' && <PlayerProfile />}
        {tab === 'messages' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 max-w-2xl mx-auto w-full space-y-3 sm:space-y-4">
            {myAccount?.individualTrainingNote && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-3 sm:p-4 backdrop-blur">
                <div className="text-[8px] sm:text-[9.5px] font-bold text-purple-400 uppercase tracking-wider mb-1.5 sm:mb-2">🏃 Individuell treningsplan</div>
                <p className="text-[12px] sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">{myAccount.individualTrainingNote}</p>
              </div>
            )}
            {myMessages.length === 0 && !myPlayer?.notes && <div className="text-center py-10 sm:py-12"><div className="text-2xl sm:text-3xl mb-2">📩</div><p className="text-[#4a6080] text-xs sm:text-sm">Ingen meldinger fra trener ennå.</p></div>}
            {myMessages.map(msg => <MessageCard key={msg.id} msg={msg} playerId={playerId} />)}
          </div>
        )}
        {tab === 'chat' && (
          <ChatPanel currentUser={currentUser} chatMessages={myChats} onSend={(text) => { if (text.trim()) sendChat('player', currentUser?.name ?? 'Spiller', text.trim()); }} />
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  UNDERKOMPONENTER (urørt)
// ═══════════════════════════════════════════════════════════════

const LineupRow: React.FC<{ player: any; isMe: boolean; isSub?: boolean }> = ({ player, isMe, isSub }) => {
  const meta = getMeta(player.role);
  const num  = getNum(player);
  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border transition-all backdrop-blur ${isMe ? 'bg-sky-500/10 border-sky-500/40' : isSub ? 'bg-[#0f1a2a]/80 border-amber-500/15 opacity-80' : 'bg-[#0f1a2a]/80 border-[#1e3050]'}`}>
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-[11px] sm:text-[12px] text-white flex-shrink-0 relative" style={{ background: meta?.color ?? '#555' }}>
        {num}
        {(player.specialRoles ?? []).includes('captain') && <span className="absolute -top-1 -right-1 text-[9px] sm:text-[10px]">🪖</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] sm:text-[12.5px] font-bold text-slate-200 truncate">{player.name || `#${num}`}{isMe && <span className="text-[8px] sm:text-[9.5px] text-sky-400 ml-1 sm:ml-1.5">(deg)</span>}</div>
        <div className="text-[9px] sm:text-[10px] text-[#4a6080]">{meta?.label ?? player.role}</div>
      </div>
    </div>
  );
};

const MessageCard: React.FC<{ msg: any; playerId?: string }> = ({ msg, playerId }) => {
  const { replyToMessage } = useAppStore();
  const [reply, setReply] = useState('');
  const send = () => { const txt = reply.trim(); if (!txt || !playerId) return; replyToMessage(msg.id, playerId, txt); setReply(''); };
  return (
    <div className="bg-[#0c1525]/80 backdrop-blur border border-[#1e3050] rounded-2xl overflow-hidden">
      <div className="p-3 sm:p-4 bg-[#0f1a2a]/80">
        <div className="flex items-center gap-2 mb-2"><span>🏋️</span><span className="text-[10px] sm:text-[11px] font-bold text-amber-400">Trener</span><span className="text-[9px] sm:text-[10px] text-[#3a5070] ml-auto">{new Date(msg.createdAt).toLocaleDateString('nb-NO')}</span></div>
        <p className="text-[12px] sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
      {(msg.replies ?? []).map((r: any) => (
        <div key={r.id} className="p-3 sm:p-4 border-t border-[#1e3050]"><div className="text-[10px] sm:text-[11px] font-bold text-sky-400 mb-1">Ditt svar</div><p className="text-[11px] sm:text-[12.5px] text-slate-300">{r.content}</p></div>
      ))}
      <div className="p-3 sm:p-4 border-t border-[#1e3050]">
        <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2} placeholder="Skriv svar til trener..." className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2 text-[11px] sm:text-[12.5px] text-slate-300 resize-none focus:outline-none focus:border-sky-500 mb-2" />
        <button onClick={send} className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[11px] sm:text-[12px] hover:bg-sky-500/25 min-h-[40px] sm:min-h-[44px]">Send</button>
      </div>
    </div>
  );
};

const RoleDescriptionsView: React.FC<{ sport: string; myRole?: string }> = ({ sport, myRole }) => {
  const [openRole, setOpenRole] = useState<string | null>(myRole ?? null);
  const roles = getRolesForSport(sport === 'football7' ? 'football' : sport as any);
  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 max-w-2xl mx-auto w-full">
      <h3 className="text-xs sm:text-sm font-bold text-slate-100 mb-1">📚 Rollebeskrivelser</h3>
      <p className="text-[10px] sm:text-[11px] text-[#4a6080] mb-3 sm:mb-4">Trykk på en rolle for å se hva den innebærer.</p>
      {myRole && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-4 backdrop-blur">
          <div className="text-[8px] sm:text-[9.5px] font-bold text-sky-400 uppercase tracking-wider mb-1">Din rolle</div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm flex-shrink-0" style={{ background: ROLE_META[myRole as keyof typeof ROLE_META]?.color ?? '#555' }}>{ROLE_META[myRole as keyof typeof ROLE_META]?.emoji ?? '?'}</div>
            <div><div className="text-[12px] sm:text-[13px] font-bold text-slate-200">{ROLE_META[myRole as keyof typeof ROLE_META]?.label ?? myRole}</div><div className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed mt-0.5">{ROLE_META[myRole as keyof typeof ROLE_META]?.description ?? ''}</div></div>
          </div>
        </div>
      )}
      <div className="space-y-1">
        {roles.map(r => {
          const m = ROLE_META[r]; if (!m) return null;
          const isMe = r === myRole;
          const open = openRole === r;
          return (
            <button key={r} onClick={() => setOpenRole(open ? null : r)} className={`w-full text-left rounded-xl border px-2.5 sm:px-3 py-2 sm:py-2.5 transition-all backdrop-blur ${isMe ? 'border-sky-500/30 bg-sky-500/5' : 'border-[#1e3050] hover:bg-[#0f1a2a]/80'}`}>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-[12px] flex-shrink-0" style={{ background: m.color }}>{m.emoji}</div>
                <div className="text-[11px] sm:text-[12px] text-slate-200 font-semibold flex-1 text-left">{m.label}{isMe && <span className="ml-1.5 sm:ml-2 text-[8px] sm:text-[9px] text-sky-400 font-bold">(deg)</span>}</div>
                <span className="text-[#3a5070] text-[9px] sm:text-[10px]">{open ? '▲' : '▼'}</span>
              </div>
              {open && <p className="mt-2 pl-8 sm:pl-9 text-[10px] sm:text-[11px] text-slate-400 leading-relaxed text-left">{m.description}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
};