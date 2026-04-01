'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore, loadFromSupabase, subscribeToSupabase } from '@/store/useAppStore';
import { Sidebar } from '@/components/ui/Sidebar';
import { TacticBoard } from '@/components/board/TacticBoard';
import { PlayerEditor } from '@/components/ui/PlayerEditor';
import { CalendarView } from '@/components/calendar/CalendarView';
import { PlayerPortal } from '@/components/player-portal/PlayerPortal';
import { PlayerHome, ChatPanel } from '@/components/player-portal/PlayerHome';
import { LoginGate } from '@/components/ui/LoginGate';
import { SmartCoach } from '@/components/ui/SmartCoach';
import { MatchReportModal } from '@/components/ui/MatchReport';
import { AppView } from '@/types';
import { StatsView } from '@/components/ui/StatsView';
import { PlayerManager } from '@/components/ui/PlayerManager';
import { TrainingView } from '@/components/ui/TrainingView';
import { FullscreenBoard } from '@/components/ui/FullscreenBoard';

// ─── Innstillinger-modal ─────────────────────────────────────
const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    coachEmail, coachPassword, homeTeamName, awayTeamName,
    setCoachEmail, setCoachPassword, setHomeTeamName, setAwayTeamName,
    sport, setSport,
  } = useAppStore();

  const [email, setEmail] = useState(coachEmail);
  const [pw, setPw]       = useState(coachPassword);
  const [home, setHome]   = useState(homeTeamName);
  const [away, setAway]   = useState(awayTeamName);
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (email.trim()) setCoachEmail(email.trim());
    if (pw.trim())    setCoachPassword(pw.trim());
    if (home.trim())  setHomeTeamName(home.trim());
    if (away.trim())  setAwayTeamName(away.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl p-6 w-full max-w-sm
        shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-slate-100 text-base">⚙️ Innstillinger</h2>
          <button onClick={onClose} className="text-[#3a5070] hover:text-white text-xl min-h-[44px] px-2">✕</button>
        </div>

        <div className="mb-5">
          <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest mb-1.5">Idrett</div>
          <div className="flex gap-2">
            {([
              { v: 'football',  e: '⚽', l: 'Fotball 11er' },
              { v: 'football7', e: '⚽', l: 'Fotball 7er' },
              { v: 'handball',  e: '🤾', l: 'Håndball' },
            ] as const).map(({ v, e, l }) => (
              <button key={v} onClick={() => setSport(v as any)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all min-h-[48px]
                  ${sport === v ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
                {e}<br/>{l}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest">Ditt lagnavn</div>
          <input value={home} onChange={e => setHome(e.target.value)} className="sett-inp mt-1" placeholder="Eks: Sotra SK" />
        </div>
        <div className="mb-5">
          <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest">Motstanderlag</div>
          <input value={away} onChange={e => setAway(e.target.value)} className="sett-inp mt-1" placeholder="Eks: Bergen SK" />
        </div>
        <div className="border-t border-[#1e3050] my-4" />
        <div className="mb-4">
          <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest">Trener e-post</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="sett-inp mt-1" />
        </div>
        <div className="mb-6">
          <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-widest">Trener passord</div>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="sett-inp mt-1" />
        </div>

        <button onClick={save}
          className={`w-full py-3.5 rounded-xl font-bold text-[14px] transition min-h-[52px]
            ${saved ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                    : 'bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25'}`}>
          {saved ? '✓ Lagret!' : 'Lagre'}
        </button>

        <style>{`
          .sett-inp { width:100%; background:#111c30; border:1px solid #1e3050;
            border-radius:10px; padding:12px 14px; color:#e2e8f0; font-size:14px;
            box-sizing:border-box; min-height:48px; }
          .sett-inp:focus { outline:none; border-color:#38bdf8; }
        `}</style>
      </div>
    </div>
  );
};

// ─── Synk-status indikator ────────────────────────────────────
const SyncIndicator: React.FC<{ syncing: boolean }> = ({ syncing }) => (
  syncing ? (
    <span className="text-[9px] text-sky-400/60 animate-pulse">↕ synker...</span>
  ) : null
);

// ─── Mobil fullskjerm taktikktavle ───────────────────────────
const MobileFullscreenBoard: React.FC<{
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
  activePhaseIdx: number;
  onClose: () => void;
}> = ({ selectedPlayerId, onSelectPlayer, activePhaseIdx, onClose }) => (
  <div className="fixed inset-0 z-[60] bg-[#060c18] flex flex-col">
    <div className="flex-shrink-0 flex items-center justify-between px-3 h-10
      bg-[#08101e] border-b border-[#1a2d46]">
      <span className="text-[11px] font-bold text-sky-400">📋 Taktikktavle</span>
      <button onClick={onClose}
        className="px-3 py-1.5 rounded-lg text-[11px] border border-[#1e3050]
          text-[#4a6080] hover:text-white transition min-h-[36px]">
        ✕ Lukk
      </button>
    </div>
    <div className="flex flex-1 overflow-hidden">
      <Sidebar selectedPlayerId={selectedPlayerId} onSelectPlayer={onSelectPlayer} />
      <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={onSelectPlayer} />
    </div>
    {selectedPlayerId && (
      <PlayerEditor playerId={selectedPlayerId} phaseIdx={activePhaseIdx}
        onClose={() => onSelectPlayer(null)} />
    )}
  </div>
);

// ─── Trener mobil-nav (bunn) ──────────────────────────────────
type CoachTab = 'board' | 'calendar' | 'players' | 'training' | 'admin' | 'stats' | 'chat';

const COACH_MOBILE_TABS: { id: CoachTab; label: string; emoji: string }[] = [
  { id: 'board',    label: 'Brett',    emoji: '📋' },
  { id: 'calendar', label: 'Kalender', emoji: '📅' },
  { id: 'players',  label: 'Tropp',    emoji: '👥' },
  { id: 'training', label: 'Trening',  emoji: '🏃' },
  { id: 'admin',    label: 'Spillere', emoji: '⚙️' },
  { id: 'stats',    label: 'Stats',    emoji: '📊' },
  { id: 'chat',     label: 'Chat',     emoji: '💬' },
];

// ─── Hovedside ────────────────────────────────────────────────
export default function Home() {
  // ALLE useState hooks FØRST
  const [selectedPlayerId, setSelectedPlayerId]       = useState<string | null>(null);
  const [isMounted, setIsMounted]                     = useState(false);
  const [showSmartCoach, setShowSmartCoach]           = useState(false);
  const [showMatchReport, setShowMatchReport]         = useState(false);
  const [showSettings, setShowSettings]               = useState(false);
  const [showChat, setShowChat]                       = useState(false);
  const [mobileBoardFullscreen, setMobileBoardFullscreen] = useState(false);
  const [showFullscreenBoard, setShowFullscreenBoard] = useState(false);
  const [mobileCoachTab, setMobileCoachTab]           = useState<CoachTab>('board');
  const [lastReadChatCount, setLastReadChatCount]     = useState(0);
  const [syncing, setSyncing]                         = useState(false);

  // Hent fra store (etter useState, før useEffect)
  const {
    currentView, setView, currentUser, activePhaseIdx,
    chatMessages, sendChat, homeTeamName,
  } = useAppStore();

  // ALLE useEffect hooks HER (før conditional returns)
  // ── Supabase: last inn ved oppstart + abonner på endringer ──
  useEffect(() => {
    setIsMounted(true);

    // Initial sync
    setSyncing(true);
    useAppStore.getState().syncFromSupabase().finally(() => setSyncing(false));

    // Realtime: reload når noe endres på en annen enhet
    const unsub = subscribeToSupabase(() => {
      useAppStore.getState().syncFromSupabase();
    });
    return () => { unsub(); };
  }, []);

  // Vi må deklarere isCoach for useEffect, men den brukes senere også
  const isCoachFromStore = currentUser?.role === 'coach';
  const currentViewFromStore = currentView;

  // Fullskjerm F-tast (må være etter at isCoachFromStore er deklarert)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Sjekk at vi ikke er i et input-felt eller textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && isCoachFromStore && currentViewFromStore === 'board') {
        setShowFullscreenBoard(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isCoachFromStore, currentViewFromStore]);

  // ── Conditional returns (ETTER alle hooks) ──
  if (!isMounted) return null;
  if (!currentUser) return <LoginGate />;

  const role    = currentUser.role;
  const isCoach = role === 'coach';

  const allChats          = chatMessages as any[];
  const playerMessages    = allChats.filter((m: any) => m.fromRole === 'player');
  const unreadFromPlayers = Math.max(0, playerMessages.length - lastReadChatCount);

  function openChat() {
    setLastReadChatCount(playerMessages.length);
    setShowChat(true);
  }

  // ── PC-layout (sm og større) ─────────────────────────────────
  const DesktopLayout = (
    <div className="hidden sm:flex flex-col h-[100dvh] overflow-hidden bg-[#060c18]">
      {/* Topbar */}
      <header className="flex-shrink-0 flex items-center gap-1 px-3
        bg-[#08101e] border-b border-[#1a2d46] h-12">
        <div className="mr-2 text-[11px] font-black tracking-tight whitespace-nowrap"
          style={{ background: 'linear-gradient(90deg,#38bdf8,#34d399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚽ {homeTeamName || 'TAKTIKKBOARD'}
        </div>
        <SyncIndicator syncing={syncing} />

        {isCoach && (
          <nav className="flex gap-0.5 ml-2">
            {([
              { view: 'board',    label: 'Brett',    emoji: '📋' },
              { view: 'calendar', label: 'Kalender', emoji: '📅' },
              { view: 'players',  label: 'Tropp',    emoji: '👥' },
              { view: 'stats',    label: 'Stats',    emoji: '📊' },
              { view: 'training', label: 'Trening',   emoji: '🏃' },
              { view: 'admin',    label: 'Spillere',  emoji: '⚙️' },
            ] as const).map(n => (
              <button key={n.view} onClick={() => setView(n.view)}
                className={`px-3 py-2 rounded-lg text-[11.5px] font-semibold transition-all min-h-[40px]
                  ${currentView === n.view ? 'bg-sky-500/15 text-sky-400' : 'text-[#4a6080] hover:text-slate-300 hover:bg-white/5'}`}>
                {n.emoji} {n.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex-1" />

        {isCoach && (
          <div className="flex items-center gap-1">
            {currentView === 'board' && (
              <>
                <button onClick={() => setShowSmartCoach(true)}
                  className="px-2 py-1.5 rounded-lg text-[11px] font-semibold border border-[#1e3050]
                    text-[#4a6080] hover:text-yellow-400 hover:border-yellow-500/40 transition min-h-[36px]">
                  ⚡ Coach
                </button>
                <button onClick={() => setShowMatchReport(true)}
                  className="px-2 py-1.5 rounded-lg text-[11px] border border-[#1e3050]
                    text-[#4a6080] hover:text-amber-400 hover:border-amber-500/40 transition min-h-[36px]">
                  📊
                </button>
              </>
            )}
            <button onClick={openChat}
              className="relative px-2.5 py-1.5 rounded-lg text-[12px] border border-[#1e3050]
                text-[#4a6080] hover:text-sky-400 transition min-h-[36px]">
              💬
              {unreadFromPlayers > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500
                  text-white text-[8px] font-black flex items-center justify-center">
                  {unreadFromPlayers > 9 ? '9+' : unreadFromPlayers}
                </span>
              )}
            </button>
            <button onClick={() => setShowSettings(true)}
              className="px-2.5 py-1.5 rounded-lg text-[12px] border border-[#1e3050]
                text-[#4a6080] hover:text-slate-300 hover:bg-white/5 transition min-h-[36px]">
              ⚙️
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 ml-1">
          <span className="text-[10px] text-[#3a5070] hidden md:inline truncate max-w-[72px]">
            {currentUser.name}
          </span>
          <button onClick={() => useAppStore.getState().logout()}
            className="px-2 py-1.5 rounded-lg text-[11px] border border-[#1e3050]
              text-[#3a5070] hover:text-red-400 hover:border-red-500/30 transition min-h-[36px]">
            Ut
          </button>
        </div>
      </header>

      {/* Innhold */}
      <main className="flex flex-1 overflow-hidden relative">
        {currentView === 'board' && isCoach && (
          <>
            <Sidebar selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
            <div className="flex-1 overflow-hidden">
              <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
            </div>
          </>
        )}
        {currentView === 'calendar' && isCoach && <div className="flex-1 overflow-hidden"><CalendarView /></div>}
        {currentView === 'players'  && isCoach && <div className="flex-1 overflow-hidden"><PlayerPortal /></div>}
        {currentView === 'stats'    && isCoach && <div className="flex-1 overflow-hidden"><StatsView /></div>}
        {currentView === 'training' && isCoach && <div className="flex-1 overflow-hidden"><TrainingView /></div>}
        {currentView === 'admin'    && isCoach && <div className="flex-1 overflow-hidden"><PlayerManager /></div>}
        {role === 'player'          && <div className="flex-1 overflow-hidden"><PlayerHome /></div>}
      </main>
    </div>
  );

  // ── MOBIL-LAYOUT (under sm) ───────────────────────────────────
  const MobileLayout = (
    <div className="flex sm:hidden flex-col h-[100dvh] overflow-hidden bg-[#060c18]">

      {/* Fullskjerm taktikktavle for trener */}
      {mobileBoardFullscreen && isCoach && (
        <MobileFullscreenBoard
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
          activePhaseIdx={activePhaseIdx}
          onClose={() => setMobileBoardFullscreen(false)}
        />
      )}

      {/* ── Mini topbar ── */}
      <header className="flex-shrink-0 flex items-center gap-2 px-3
        bg-[#08101e] border-b border-[#1a2d46] h-11">
        <span className="text-[11px] font-black"
          style={{ background: 'linear-gradient(90deg,#38bdf8,#34d399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {homeTeamName || 'TAKTIKKBOARD'}
        </span>
        <SyncIndicator syncing={syncing} />
        <div className="flex-1" />
        {isCoach && (
          <>
            <button onClick={() => setShowSettings(true)}
              className="px-2 py-1.5 rounded-lg text-[13px] border border-[#1e3050]
                text-[#4a6080] hover:text-slate-300 transition min-h-[36px]">⚙️</button>
          </>
        )}
        <button onClick={() => useAppStore.getState().logout()}
          className="px-2.5 py-1.5 rounded-lg text-[11px] border border-[#1e3050]
            text-[#3a5070] hover:text-red-400 transition min-h-[36px]">Ut</button>
      </header>

      {/* ── Innhold ── */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* SPILLER */}
        {role === 'player' && <PlayerHome />}

        {/* TRENER — brett */}
        {isCoach && mobileCoachTab === 'board' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
            </div>
            {/* Bunn-verktøylinje */}
            <div className="flex-shrink-0 flex gap-2 px-3 py-2 bg-[#08101e] border-t border-[#1a2d46]">
              <button onClick={() => setMobileBoardFullscreen(true)}
                className="px-3 py-2 rounded-lg text-[11px] font-bold border border-[#1e3050]
                  text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition min-h-[40px]">
                ⛶
              </button>
              <button onClick={() => setShowSmartCoach(true)}
                className="flex-1 py-2 rounded-lg text-[11px] font-bold border border-[#1e3050]
                  text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition min-h-[40px]">
                ⚡ Coach
              </button>
              <button onClick={() => setShowMatchReport(true)}
                className="flex-1 py-2 rounded-lg text-[11px] font-bold border border-[#1e3050]
                  text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition min-h-[40px]">
                📊 Rapport
              </button>
            </div>
          </div>
        )}

        {/* TRENER — trening */}
        {isCoach && mobileCoachTab === 'training' && (
          <div className="h-full overflow-hidden"><TrainingView /></div>
        )}

        {/* TRENER — spilleradmin */}
        {isCoach && mobileCoachTab === 'admin' && (
          <div className="h-full overflow-hidden"><PlayerManager /></div>
        )}

        {/* TRENER — statistikk */}
        {isCoach && mobileCoachTab === 'stats' && (
          <div className="h-full overflow-hidden"><StatsView /></div>
        )}

        {/* TRENER — kalender */}
        {isCoach && mobileCoachTab === 'calendar' && (
          <div className="h-full overflow-hidden"><CalendarView /></div>
        )}

        {/* TRENER — tropp/spilleradmin */}
        {isCoach && mobileCoachTab === 'players' && (
          <div className="h-full overflow-hidden"><PlayerPortal /></div>
        )}

        {/* TRENER — chat */}
        {isCoach && mobileCoachTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
              <h2 className="font-black text-slate-100 text-sm">💬 Chat med spillere</h2>
            </div>
            <ChatPanel
              currentUser={currentUser}
              chatMessages={allChats}
              coachView
              onSend={(text) => sendChat('coach', 'Trener', text)}
            />
          </div>
        )}
      </div>

      {/* ── Bunn-navigasjon for trener ── */}
      {isCoach && (
        <nav className="flex-shrink-0 flex border-t border-[#1a2d46] bg-[#08101e]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {COACH_MOBILE_TABS.map(t => {
            const badge = t.id === 'chat' ? unreadFromPlayers : 0;
            return (
              <button key={t.id}
                onClick={() => {
                  setMobileCoachTab(t.id);
                  if (t.id === 'chat') setLastReadChatCount(playerMessages.length);
                }}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 relative
                  min-h-[56px] transition-all
                  ${mobileCoachTab === t.id ? 'text-sky-400' : 'text-[#3a5070]'}`}>
                <span className="text-[20px] leading-none">{t.emoji}</span>
                <span className="text-[9px] font-semibold mt-0.5">{t.label}</span>
                {badge > 0 && (
                  <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full bg-sky-500
                    text-white text-[8px] font-black flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                {mobileCoachTab === t.id && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sky-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );

  return (
    <>
      {DesktopLayout}
      {MobileLayout}

      {/* ── Modaler (deles mellom PC og mobil) ── */}
      {selectedPlayerId && isCoach && !mobileBoardFullscreen && (
        <PlayerEditor playerId={selectedPlayerId} phaseIdx={activePhaseIdx}
          onClose={() => setSelectedPlayerId(null)} />
      )}
      {showSmartCoach  && <SmartCoach onClose={() => setShowSmartCoach(false)} />}
      {showMatchReport && <MatchReportModal onClose={() => setShowMatchReport(false)} />}
      {showSettings    && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Fullskjerm bane */}
      {showFullscreenBoard && isCoach && (
        <FullscreenBoard onClose={() => setShowFullscreenBoard(false)} interactive />
      )}

      {/* Chat modal — PC only */}
      {showChat && isCoach && (
        <div className="hidden sm:flex fixed inset-0 bg-black/70 z-50 items-center justify-center p-4"
          onClick={() => setShowChat(false)}>
          <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl w-full max-w-md
            h-[560px] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3050] flex-shrink-0">
              <h2 className="font-black text-slate-100 text-sm">💬 Chat med spillere</h2>
              <button onClick={() => setShowChat(false)}
                className="text-[#3a5070] hover:text-white text-xl min-h-[44px] px-2">✕</button>
            </div>
            <ChatPanel currentUser={currentUser} chatMessages={allChats} coachView
              onSend={(text) => sendChat('coach', 'Trener', text)} />
          </div>
        </div>
      )}
    </>
  );
}