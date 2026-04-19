'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { LoginGate } from '@/components/ui/LoginGate';
import type { CalendarEvent, AppView, ChatMessage } from '@/types';
import dynamic from 'next/dynamic';

// ─── ALLE DYNAMISKE IMPORTER ─────────────────────────────────
const TacticBoard = dynamic(() => import('@/components/board/TacticBoard').then(mod => mod.TacticBoard), {
  ssr: false,
  loading: () => <div className="flex-1 bg-[#060c18]" />,
});
const PlayerEditor = dynamic(() => import('@/components/ui/PlayerEditor').then(mod => mod.PlayerEditor), { ssr: false });
const FullscreenBoard = dynamic(() => import('@/components/ui/FullscreenBoard').then(mod => mod.FullscreenBoard), { ssr: false });
const SmartCoach = dynamic(() => import('@/components/ui/SmartCoach').then(mod => mod.SmartCoach), { ssr: false });
const MatchReportModal = dynamic(() => import('@/components/ui/MatchReport').then(mod => mod.MatchReportModal), { ssr: false });
const StatsView = dynamic(() => import('@/components/ui/StatsView').then(mod => mod.StatsView), { ssr: false });
const TrainingView = dynamic(() => import('@/components/ui/TrainingView').then(mod => mod.TrainingView), { ssr: false });
const CalendarView = dynamic(() => import('@/components/calendar/CalendarView').then(mod => mod.CalendarView), { ssr: false });
const Sidebar = dynamic(() => import('@/components/ui/Sidebar').then(mod => mod.Sidebar), { ssr: false });
const ChatPanel = dynamic(() => import('@/components/ui/ChatPanel').then(mod => mod.ChatPanel), { ssr: false });
const PlayerPortal = dynamic(() => import('@/components/player-portal/PlayerPortal').then(mod => mod.PlayerPortal), { ssr: false });
const PlayerManager = dynamic(() => import('@/components/ui/PlayerManager').then(mod => mod.PlayerManager), { ssr: false });
const PlayerHome = dynamic(() => import('@/components/player-portal/PlayerHome').then(mod => mod.PlayerHome), { ssr: false });
const CoachMessages = dynamic(() => import('@/components/ui/CoachMessages').then(mod => mod.CoachMessages), { ssr: false });

// ─── TYPER ───────────────────────────────────────────────────
type CoachTab = 'dashboard' | 'board' | 'calendar' | 'players' | 'training' | 'admin' | 'stats' | 'chat' | 'messages';

interface BentoCardProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onClick: () => void;
  className?: string;
}

// ─── BENTO CARD ──────────────────────────────────────────────
const BentoCard: React.FC<BentoCardProps> = ({ title, subtitle, icon, color, onClick, className = '' }) => {
  const colorMap: Record<string, { bg: string; glow: string; hoverBorder: string }> = {
    sky:    { bg: 'rgba(56, 189, 248, 0.08)',  glow: '#38bdf8', hoverBorder: 'hover:border-sky-400/50' },
    yellow: { bg: 'rgba(250, 204, 21, 0.08)',  glow: '#facc15', hoverBorder: 'hover:border-yellow-400/50' },
    emerald:{ bg: 'rgba(16, 185, 129, 0.08)',  glow: '#10b981', hoverBorder: 'hover:border-emerald-400/50' },
    amber:  { bg: 'rgba(245, 158, 11, 0.08)',  glow: '#f59e0b', hoverBorder: 'hover:border-amber-400/50' },
    indigo: { bg: 'rgba(99, 102, 241, 0.08)',  glow: '#6366f1', hoverBorder: 'hover:border-indigo-400/50' },
  };
  const active = colorMap[color] || colorMap.sky;

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-[#1e3050] backdrop-blur-xl p-6 text-left transition-all duration-300 ${active.hoverBorder} hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] ${className}`}
      style={{ background: active.bg }}
    >
      <div
        className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
        style={{ background: `${active.glow}20`, color: active.glow }}
      >
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg font-black text-slate-100 leading-tight tracking-tight">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <span className="text-sm font-bold" style={{ color: active.glow }}>Åpne →</span>
      </div>
    </button>
  );
};

// ─── DASHBOARD VIEW ──────────────────────────────────────────
const DashboardView: React.FC<{
  currentUser: { name: string };
  homeTeamName: string;
  sport: string;
  unreadFromPlayers: number;
  onOpenChat: () => void;
  setView: (view: AppView) => void;
  setShowSmartCoach: (show: boolean) => void;
  setShowMatchReport: (show: boolean) => void;
}> = ({ currentUser, homeTeamName, sport, unreadFromPlayers, onOpenChat, setView }) => {
  const firstName = currentUser.name.split(' ')[0];
  return (
    <div className="p-6 lg:p-12 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
          Velkommen, {firstName} 👋
        </h1>
        <p className="text-slate-400 font-medium">
          {homeTeamName || 'TAKTIKKBOARD'} ·{' '}
          {sport === 'football' ? 'Fotball 11er'
            : sport === 'football7' ? 'Fotball 7er'
            : sport === 'football9' ? 'Fotball 9er'
            : 'Håndball'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <BentoCard title="Taktikktavle" subtitle="Sett opp lagoppstilling og formasjon" icon="📋" color="sky"     onClick={() => setView('board')} />
        <BentoCard title="Kalender"     subtitle="Terminliste og treninger"              icon="📅" color="emerald" onClick={() => setView('calendar')} />
        <BentoCard title="Spillerstall" subtitle="Administrer spillere og profiler"      icon="👥" color="indigo"  onClick={() => setView('admin')} />
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-2xl">💬</div>
          <div>
            <h3 className="font-bold text-slate-200">Meldinger</h3>
            <p className="text-sm text-slate-400">
              {unreadFromPlayers > 0 ? `${unreadFromPlayers} uleste fra spillerne` : 'Ingen nye meldinger'}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenChat}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium transition"
        >
          Åpne chat
        </button>
      </div>
    </div>
  );
};

// ─── INNSTILLINGER MODAL ─────────────────────────────────────
const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    coachEmail, coachPassword, homeTeamName, awayTeamName,
    setCoachEmail, setCoachPassword, setHomeTeamName, setAwayTeamName,
    sport, setSport, ageGroup, setAgeGroup,
  } = useAppStore();

  const [email, setEmail] = useState(coachEmail);
  const [pw,    setPw]    = useState(coachPassword);
  const [home,  setHome]  = useState(homeTeamName);
  const [away,  setAway]  = useState(awayTeamName);
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
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-slate-100 text-base">⚙️ Innstillinger</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl min-h-[44px] px-2 transition">✕</button>
        </div>

        {/* Idrett */}
        <div className="mb-5">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Idrett</div>
          <div className="flex gap-2">
            {([
              { v: 'football',  e: '⚽', l: 'Fotball 11er' },
              { v: 'football7', e: '⚽', l: 'Fotball 7er' },
              { v: 'football9', e: '⚽', l: 'Fotball 9er' },
              { v: 'handball',  e: '🤾', l: 'Håndball' },
            ] as const).map(({ v, e, l }) => (
              <button
                key={v}
                onClick={() => setSport(v as any)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all min-h-[48px] backdrop-blur
                  ${sport === v
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                    : 'border-slate-700 text-slate-500 hover:bg-slate-800/50'}`}
              >
                {e}<br />{l}
              </button>
            ))}
          </div>
        </div>

        {/* Aldersgruppe */}
        <div className="mb-5">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Aldersgruppe</div>
          <div className="flex gap-2">
            {([
              { v: 'youth', l: '🧒 Barneøvelser (lettere)' },
              { v: 'adult', l: '🧑 Voksenøvelser (mer krevende)' },
            ] as const).map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setAgeGroup(v)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all min-h-[48px] backdrop-blur
                  ${ageGroup === v
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                    : 'border-slate-700 text-slate-500 hover:bg-slate-800/50'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-500 mt-1.5">Velg aldersgruppe – påvirker hvilke øvelser som vises</p>
        </div>

        <div className="mb-4">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">Ditt lagnavn</div>
          <input value={home} onChange={e => setHome(e.target.value)} className="sett-inp mt-1" placeholder="Eks: Sotra SK" />
        </div>
        <div className="mb-5">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">Motstanderlag</div>
          <input value={away} onChange={e => setAway(e.target.value)} className="sett-inp mt-1" placeholder="Eks: Bergen SK" />
        </div>
        <div className="border-t border-slate-700 my-4" />
        <div className="mb-4">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">Trener e-post</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="sett-inp mt-1" />
        </div>
        <div className="mb-6">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">Trener passord</div>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="sett-inp mt-1" />
        </div>

        <button
          onClick={save}
          className={`w-full py-3.5 rounded-xl font-bold text-[14px] transition min-h-[52px] backdrop-blur
            ${saved
              ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
              : 'bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500'}`}
        >
          {saved ? '✓ Lagret!' : 'Lagre endringer'}
        </button>

        <style jsx>{`
          .sett-inp {
            width: 100%; background: #0f172a; border: 1px solid #334155;
            border-radius: 10px; padding: 12px 14px; color: #e2e8f0; font-size: 14px;
            box-sizing: border-box; min-height: 48px; transition: all 0.2s ease;
          }
          .sett-inp:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56,189,248,0.2); }
        `}</style>
      </div>
    </div>
  );
};

// ─── SYNC INDIKATOR ──────────────────────────────────────────
const SyncIndicator: React.FC<{ syncing: boolean }> = ({ syncing }) =>
  syncing ? (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 backdrop-blur-sm">
      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
      <span className="text-[9px] text-sky-400 font-bold tracking-widest uppercase">Synk</span>
    </div>
  ) : null;

// ─── MOBIL TABS ───────────────────────────────────────────────
const COACH_MOBILE_TABS: { id: CoachTab; label: string; emoji: string }[] = [
  { id: 'dashboard', label: 'Hjem',      emoji: '🏠' },
  { id: 'board',     label: 'Brett',     emoji: '📋' },
  { id: 'calendar',  label: 'Kalender',  emoji: '📅' },
  { id: 'admin',     label: 'Spillere',  emoji: '👥' },
  { id: 'stats',     label: 'Stats',     emoji: '📊' },
  { id: 'messages',  label: 'Meldinger', emoji: '📩' },
  { id: 'chat',      label: 'Chat',      emoji: '💬' },
];

// ─── HOVEDSIDE ────────────────────────────────────────────────
export default function Home() {
  const [selectedPlayerId,    setSelectedPlayerId]    = useState<string | null>(null);
  const [isMounted,           setIsMounted]           = useState(false);
  const [showSmartCoach,      setShowSmartCoach]      = useState(false);
  const [showMatchReport,     setShowMatchReport]     = useState(false);
  const [showSettings,        setShowSettings]        = useState(false);
  const [showChat,            setShowChat]            = useState(false);
  const [showFullscreenBoard, setShowFullscreenBoard] = useState(false);
  const [mobileCoachTab,      setMobileCoachTab]      = useState<CoachTab>('dashboard');
  const [showMobileSidebar,   setShowMobileSidebar]   = useState(false);
  const [lastReadChatCount,   setLastReadChatCount]   = useState(0);
  const [syncing,             setSyncing]             = useState(false);
  const [selectedTraining,    setSelectedTraining]    = useState<CalendarEvent | null>(null);

  const {
    currentView, setView, currentUser, activePhaseIdx,
    chatMessages, sendChat, homeTeamName, sport,
  } = useAppStore();

  // Last inn data ved oppstart
  useEffect(() => {
    setIsMounted(true);
    const load = async () => {
      setSyncing(true);
      await useAppStore.getState().syncFromSupabase();
      setSyncing(false);
    };
    load();
  }, []);

  // Lukk sidebar når man bytter bort fra brett-fanen
  useEffect(() => {
    if (mobileCoachTab !== 'board') setShowMobileSidebar(false);
  }, [mobileCoachTab]);

  // FIX 3 – Nullstill uleste meldinger når chat-fanen åpnes
  useEffect(() => {
    if (mobileCoachTab === 'chat') {
      setLastReadChatCount(playerMessages.length);
    }
    // playerMessages.length er ikke inkludert her for å unngå re-run ved nye meldinger
    // mens chat allerede er åpen – vi vil bare nullstille ved tab-bytte
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileCoachTab]);

  // F-tast for fullskjerm (desktop)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && currentUser?.role === 'coach' && currentView === 'board') {
        setShowFullscreenBoard(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentUser, currentView]);

  const isCoach = currentUser?.role === 'coach';
  const allChats = chatMessages as ChatMessage[];
  const playerMessages = allChats.filter(m => m.fromRole === 'player');
  const unreadFromPlayers = Math.max(0, playerMessages.length - lastReadChatCount);

  const openChat = useCallback(() => {
    setLastReadChatCount(playerMessages.length);
    setShowChat(true);
  }, [playerMessages.length]);

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────
  const DesktopLayout = useMemo(() => {
    if (!currentUser) return null;
    return (
      <div className="hidden sm:flex flex-col h-[100dvh] overflow-hidden bg-[#060c18]">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center gap-2 px-4 bg-[#08101e]/90 backdrop-blur-md border-b border-slate-800 h-14 z-40">
          <div
            className="mr-2 text-base font-black tracking-tighter whitespace-nowrap cursor-pointer"
            onClick={() => setView('dashboard')}
          >
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              ⚽ {homeTeamName || 'TAKTIKKBOARD'}
            </span>
          </div>
          <SyncIndicator syncing={syncing} />

          {isCoach && (
            <nav className="flex gap-1 ml-4">
              {([
                { view: 'dashboard', label: 'Hjem',      emoji: '🏠' },
                { view: 'board',     label: 'Brett',     emoji: '📋' },
                { view: 'calendar',  label: 'Kalender',  emoji: '📅' },
                { view: 'stats',     label: 'Stats',     emoji: '📊' },
                { view: 'training',  label: 'Trening',   emoji: '🏃' },
                { view: 'admin',     label: 'Spillere',  emoji: '⚙️' },
                { view: 'messages',  label: 'Meldinger', emoji: '📩' },
              ] as const).map(n => (
                <button
                  key={n.view}
                  onClick={() => setView(n.view)}
                  className={`relative px-3 py-2 rounded-xl text-[11.5px] font-bold transition-all min-h-[40px]
                    ${(currentView === n.view || (currentView === undefined && n.view === 'dashboard'))
                      ? 'bg-sky-500/10 text-sky-400'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  {n.emoji} {n.label}
                  {(currentView === n.view || (currentView === undefined && n.view === 'dashboard')) && (
                    <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-[3px] bg-sky-500 rounded-t-full" />
                  )}
                </button>
              ))}
            </nav>
          )}

          <div className="flex-1" />

          {isCoach && (
            <div className="flex items-center gap-1.5">
              {currentView === 'board' && (
                <>
                  <button
                    onClick={() => setShowSmartCoach(true)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition min-h-[36px] backdrop-blur"
                  >
                    💡 Smart Coach
                  </button>
                  <button
                    onClick={() => setShowMatchReport(true)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition min-h-[36px] backdrop-blur"
                  >
                    📊 Rapport
                  </button>
                </>
              )}
              <button
                onClick={openChat}
                className="relative px-3 py-1.5 rounded-xl text-[12px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-sky-500/50 hover:text-sky-400 transition min-h-[36px] shadow-sm backdrop-blur"
              >
                💬
                {unreadFromPlayers > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#08101e]">
                    {unreadFromPlayers > 9 ? '9+' : unreadFromPlayers}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-1.5 rounded-xl text-[12px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-300 transition min-h-[36px] shadow-sm backdrop-blur"
              >
                ⚙️
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-800">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hidden md:inline truncate max-w-[80px]">
              {currentUser.name}
            </span>
            <button
              onClick={() => useAppStore.getState().logout()}
              className="px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white transition min-h-[36px]"
            >
              Logg ut
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex flex-1 overflow-hidden relative">
          {(currentView === 'dashboard' || currentView === undefined) && isCoach && (
            <DashboardView
              currentUser={currentUser}
              homeTeamName={homeTeamName}
              sport={sport}
              unreadFromPlayers={unreadFromPlayers}
              onOpenChat={openChat}
              setView={setView}
              setShowSmartCoach={setShowSmartCoach}
              setShowMatchReport={setShowMatchReport}
            />
          )}
          {currentView === 'board' && isCoach && (
            <>
              <Sidebar selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
              <div className="flex-1 overflow-hidden relative animate-in fade-in">
                <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
                <button
                  onClick={() => setShowFullscreenBoard(true)}
                  className="absolute bottom-4 left-4 h-10 w-10 flex items-center justify-center bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl text-white hover:border-sky-500 transition-colors shadow-lg z-10"
                  title="Fullskjerm (F)"
                >
                  ⛶
                </button>
              </div>
            </>
          )}
          {currentView === 'calendar' && isCoach && (
            <div className="flex-1 overflow-hidden">
              <CalendarView onGoToTraining={(t) => { setSelectedTraining(t); setView('training'); }} />
            </div>
          )}
          {currentView === 'players'  && isCoach && <div className="flex-1 overflow-hidden"><PlayerPortal /></div>}
          {currentView === 'stats'    && isCoach && <div className="flex-1 overflow-hidden"><StatsView /></div>}
          {currentView === 'training' && isCoach && (
            <div className="flex-1 overflow-hidden">
              <TrainingView
                initialTraining={selectedTraining || undefined}
                onBack={() => { setSelectedTraining(null); setView('calendar'); }}
              />
            </div>
          )}
          {currentView === 'admin'    && isCoach && <div className="flex-1 overflow-hidden"><PlayerManager /></div>}
          {currentView === 'messages' && isCoach && <div className="flex-1 overflow-hidden"><CoachMessages /></div>}
          {currentUser.role === 'player' && <div className="flex-1 overflow-hidden"><PlayerHome /></div>}
        </main>
      </div>
    );
  }, [
    currentView, isCoach, currentUser, homeTeamName, sport,
    unreadFromPlayers, syncing, selectedPlayerId, selectedTraining,
    setView, openChat,
  ]);

  // ─── MOBIL LAYOUT ────────────────────────────────────────────
  const MobileLayout = useMemo(() => {
    if (!currentUser) return null;

    // ── Brett: fullskjerm med sidebar som overlay ──────────────
    if (isCoach && mobileCoachTab === 'board') {
      return (
        <div className="flex sm:hidden flex-col h-[100dvh] landscape:h-screen overflow-hidden bg-[#060c18]">
          {/* Brett-header */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 h-12 bg-[#08101e]/90 backdrop-blur border-b border-[#1a2d46]">
            <span className="text-[11px] font-black text-sky-400 tracking-widest uppercase">
              📋 Taktikktavle
            </span>
            {/* FIX 2 – Smart Coach tilbake på mobil, plassert i brett-headeren */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSmartCoach(true)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition min-h-[36px]"
              >
                💡
              </button>
              <button
                onClick={() => setShowMobileSidebar(s => !s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition min-h-[36px]
                  ${showMobileSidebar
                    ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                    : 'border-sky-700/60 text-sky-500 hover:bg-sky-500/10'}`}
              >
                👥 Tropp
              </button>
              <button
                onClick={() => setMobileCoachTab('dashboard')}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-700 text-slate-400 hover:text-white transition min-h-[36px]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Brett – fyller resten */}
          <div className="flex flex-1 overflow-hidden relative" style={{ touchAction: 'none' }}>
            <TacticBoard
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={setSelectedPlayerId}
            />

            {/* Sidebar overlay */}
            {showMobileSidebar && (
              <>
                {/* Backdrop */}
                <div
                  className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowMobileSidebar(false)}
                />
                {/* Drawer fra høyre */}
                <div className="absolute right-0 top-0 h-full z-50 w-[260px] shadow-2xl animate-in slide-in-from-right duration-200">
                  <Sidebar
                    selectedPlayerId={selectedPlayerId}
                    onSelectPlayer={setSelectedPlayerId}
                  />
                </div>
              </>
            )}
          </div>

          {selectedPlayerId && (
            <PlayerEditor
              playerId={selectedPlayerId}
              phaseIdx={activePhaseIdx}
              onClose={() => setSelectedPlayerId(null)}
            />
          )}
        </div>
      );
    }

    // ── Wrapper med tilbakeknapp ───────────────────────────────
    const renderPageWithBackButton = (children: React.ReactNode, title?: string) => {
      if (mobileCoachTab === 'dashboard') return children;
      return (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex-shrink-0 flex items-center px-3 py-2 bg-[#0c1525] border-b border-[#1e3050]">
            <button
              onClick={() => setMobileCoachTab('dashboard')}
              className="flex items-center gap-1 text-[12px] text-sky-400 min-h-[44px]"
            >
              ‹ Tilbake til dashboard
            </button>
            {title && (
              <span className="ml-2 text-[11px] font-bold text-slate-300 truncate">{title}</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      );
    };

    return (
      <div className="flex sm:hidden flex-col h-[100dvh] overflow-hidden bg-[#060c18]">
        {/* Toppmeny-header */}
        <header className="flex-shrink-0 flex items-center gap-2 px-4 bg-[#08101e]/95 backdrop-blur-md border-b border-slate-800 h-14 z-40">
          <span className="text-[13px] font-black bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            {homeTeamName || 'TAKTIKKBOARD'}
          </span>
          <SyncIndicator syncing={syncing} />
          <div className="flex-1" />
          {isCoach && (
            <button
              onClick={() => setShowSettings(true)}
              className="px-2.5 py-1.5 rounded-xl text-[14px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-300 transition min-h-[36px] shadow-sm"
            >
              ⚙️
            </button>
          )}
        </header>

        {/* Navigasjonsfaner – under header */}
        {isCoach && (
          <nav className="flex-shrink-0 flex border-b border-slate-800 bg-[#08101e]/95 backdrop-blur-md relative z-40">
            {COACH_MOBILE_TABS.map(t => {
              const badge    = t.id === 'chat' ? unreadFromPlayers : 0;
              const isActive = mobileCoachTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setMobileCoachTab(t.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 relative min-h-[52px] transition-all
                    ${isActive ? 'text-sky-400' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  <span className={`text-[18px] leading-none mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}>
                    {t.emoji}
                  </span>
                  <span className="text-[8px] font-bold tracking-widest uppercase">{t.label}</span>
                  {badge > 0 && (
                    <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full bg-sky-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-[#08101e]">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-sky-400 rounded-t-full shadow-[0_-2px_8px_rgba(56,189,248,0.5)]" />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Sideinnhold */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {currentUser.role === 'player' && <PlayerHome />}

          {isCoach && mobileCoachTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              homeTeamName={homeTeamName}
              sport={sport}
              unreadFromPlayers={unreadFromPlayers}
              onOpenChat={() => setMobileCoachTab('chat')}
              setView={(v: AppView) => setMobileCoachTab(v as CoachTab)}
              setShowSmartCoach={setShowSmartCoach}
              setShowMatchReport={setShowMatchReport}
            />
          )}

          {isCoach && mobileCoachTab === 'calendar' && renderPageWithBackButton(
            <CalendarView onGoToTraining={(t) => { setSelectedTraining(t); setMobileCoachTab('training'); }} />,
            'Kalender',
          )}

          {isCoach && mobileCoachTab === 'stats' && renderPageWithBackButton(
            <StatsView />, 'Statistikk',
          )}

          {isCoach && mobileCoachTab === 'admin' && renderPageWithBackButton(
            <PlayerManager />, 'Spilleradmin',
          )}

          {isCoach && mobileCoachTab === 'messages' && renderPageWithBackButton(
            <CoachMessages />, 'Meldinger',
          )}

          {isCoach && mobileCoachTab === 'training' && renderPageWithBackButton(
            <TrainingView
              initialTraining={selectedTraining || undefined}
              onBack={() => { setSelectedTraining(null); setMobileCoachTab('calendar'); }}
            />,
            'Trening',
          )}

          {isCoach && mobileCoachTab === 'players' && renderPageWithBackButton(
            <PlayerPortal />, 'Spillere',
          )}

          {isCoach && mobileCoachTab === 'chat' && renderPageWithBackButton(
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 px-4 py-4 bg-slate-800/50 border-b border-slate-700">
                <h2 className="font-black text-slate-100 text-base">💬 Chat med spillere</h2>
              </div>
              <ChatPanel
                currentUser={currentUser}
                chatMessages={chatMessages}
                coachView
                onSend={(text, toPlayerId) => sendChat('coach', 'Trener', text, toPlayerId)}
              />
            </div>,
            'Chat',
          )}
        </div>
      </div>
    );
  }, [
    isCoach, currentUser, homeTeamName, sport, unreadFromPlayers, syncing,
    selectedPlayerId, selectedTraining, mobileCoachTab, activePhaseIdx,
    chatMessages, sendChat, showMobileSidebar,
    setMobileCoachTab, setSelectedTraining, setSelectedPlayerId,
    setShowSmartCoach, setShowMatchReport, setShowSettings, openChat,
  ]);

  // ─── BETINGEDE RETURNS (etter alle hooks) ─────────────────────
  if (!isMounted) return null;
  if (!currentUser) return <LoginGate />;

  return (
    <>
      {DesktopLayout}
      {MobileLayout}

      {/* PlayerEditor – kun utenfor brett (håndteres internt der) */}
      {selectedPlayerId && isCoach && mobileCoachTab !== 'board' && (
        <PlayerEditor
          playerId={selectedPlayerId}
          phaseIdx={activePhaseIdx}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {showSmartCoach  && <SmartCoach onClose={() => setShowSmartCoach(false)} />}
      {showMatchReport && <MatchReportModal onClose={() => setShowMatchReport(false)} />}
      {showSettings    && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showFullscreenBoard && isCoach && (
        <FullscreenBoard onClose={() => setShowFullscreenBoard(false)} interactive />
      )}

      {/* Chat-modal (kun desktop) */}
      {showChat && isCoach && (
        <div
          className="hidden sm:flex fixed inset-0 bg-black/80 backdrop-blur-md z-[100] items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowChat(false)}
        >
          <div
            className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl w-full max-w-md h-[80vh] max-h-[600px] flex flex-col shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700 flex-shrink-0 bg-slate-800/50">
              <h2 className="font-black text-slate-100 text-base">💬 Chat med spillere</h2>
              <button
                onClick={() => setShowChat(false)}
                className="text-slate-400 hover:text-white text-xl transition-colors min-h-[44px] px-2"
              >
                ✕
              </button>
            </div>
            <ChatPanel
              currentUser={currentUser}
              chatMessages={chatMessages}
              coachView
              onSend={(text, toPlayerId) => sendChat('coach', 'Trener', text, toPlayerId)}
            />
          </div>
        </div>
      )}
    </>
  );
}
