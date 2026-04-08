'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { LoginGate } from '@/components/ui/LoginGate';
import type { CalendarEvent, AppView, ChatMessage } from '@/types';
import dynamic from 'next/dynamic';

// ─── ALLE DYNAMISKE IMPORTER (må stå før de brukes) ─────────
const TacticBoard = dynamic(() => import('@/components/board/TacticBoard').then(mod => mod.TacticBoard), { 
  ssr: false,
  loading: () => <div className="flex-1 bg-[#060c18]" />
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

// ─── TYPER ─────────────────────────────────────────────────────
type CoachTab = 'dashboard' | 'board' | 'calendar' | 'players' | 'training' | 'admin' | 'stats' | 'chat';

interface BentoCardProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onClick: () => void;
  className?: string;
}

// ─── GLASSMORFISME BENTO CARD ────────────────────────────────
const BentoCard: React.FC<BentoCardProps> = ({ title, subtitle, icon, color, onClick, className = '' }) => {
  const colorMap: Record<string, { bg: string; glow: string }> = {
    sky:   { bg: 'rgba(56, 189, 248, 0.08)', glow: '#38bdf8' },
    yellow:{ bg: 'rgba(250, 204, 21, 0.08)', glow: '#facc15' },
    emerald:{bg: 'rgba(16, 185, 129, 0.08)', glow: '#10b981' },
    amber: { bg: 'rgba(245, 158, 11, 0.08)', glow: '#f59e0b' },
    indigo:{ bg: 'rgba(99, 102, 241, 0.08)', glow: '#6366f1' },
  };
  const active = colorMap[color] || colorMap.sky;

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-[#1e3050] backdrop-blur-xl p-6 text-left transition-all duration-300 hover:border-${color}-400/50 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] ${className}`}
      style={{ background: active.bg, boxShadow: `0 0 0 0 ${active.glow}20` }}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
        style={{ background: `${active.glow}20`, color: active.glow }}>
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

// ─── DASHBOARD VIEW (med glassmorfisme) ──────────────────────
const DashboardView: React.FC<{
  currentUser: { name: string };
  homeTeamName: string;
  sport: string;
  unreadFromPlayers: number;
  onOpenChat: () => void;
  setView: (view: AppView) => void;
  setShowSmartCoach: (show: boolean) => void;
  setShowMatchReport: (show: boolean) => void;
}> = ({ currentUser, homeTeamName, sport, unreadFromPlayers, onOpenChat, setView, setShowSmartCoach, setShowMatchReport }) => {
  const firstName = currentUser.name.split(' ')[0];
  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Velkommen, {firstName} 👋
        </h1>
        <p className="text-slate-400 font-medium text-sm md:text-base">
          Strategisk oversikt for <span className="text-sky-400 font-bold">{homeTeamName || 'TAKTIKKBOARD'}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <BentoCard title="Taktikktavle" subtitle={`Gjør klar formasjonen for neste kamp (${sport})`} icon="📋" color="sky" onClick={() => setView('board')} className="md:col-span-2 md:row-span-2" />
        <BentoCard title="SmartCoach AI" subtitle="Få analytiske råd av din AI-assistent" icon="⚡" color="yellow" onClick={() => setShowSmartCoach(true)} />
        <BentoCard title="Kalender" subtitle="Se treninger og terminliste" icon="📅" color="emerald" onClick={() => setView('calendar')} />
        <BentoCard title="Kamprapport" subtitle="Loggfør hendelser og analyser statistikk" icon="📊" color="amber" onClick={() => setShowMatchReport(true)} className="md:col-span-2" />
        <BentoCard title="Tropp" subtitle="Administrer spillerstall og profiler" icon="👥" color="indigo" onClick={() => setView('admin')} />
        <BentoCard title="Treninger" subtitle="Gå gjennom dagens treningsprogram" icon="🏃" color="emerald" onClick={() => setView('training')} />
      </div>

      {/* Kommunikasjonskort – glassmorfisme */}
      <div className="rounded-3xl border border-slate-700/50 bg-slate-800/20 backdrop-blur-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-sky-500/10 flex items-center justify-center text-3xl md:text-4xl backdrop-blur-sm">
            💬
          </div>
          <div>
            <h4 className="text-lg md:text-xl font-black text-slate-100">Kommunikasjonskanal</h4>
            <p className="text-xs md:text-sm text-slate-400 font-medium">{unreadFromPlayers} nye meldinger fra spillerne dine</p>
          </div>
        </div>
        <button
          onClick={onOpenChat}
          className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white rounded-xl font-black tracking-wider transition-all shadow-lg active:scale-95 text-sm"
        >
          ÅPNE CHAT
        </button>
      </div>
    </div>
  );
};

// ─── INNSTILLINGER MODAL – oppgradert glassmorfisme ──────────
const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    coachEmail, coachPassword, homeTeamName, awayTeamName,
    setCoachEmail, setCoachPassword, setHomeTeamName, setAwayTeamName,
    sport, setSport, ageGroup, setAgeGroup,
  } = useAppStore();

  const [email, setEmail] = useState(coachEmail);
  const [pw, setPw] = useState(coachPassword);
  const [home, setHome] = useState(homeTeamName);
  const [away, setAway] = useState(awayTeamName);
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (email.trim()) setCoachEmail(email.trim());
    if (pw.trim()) setCoachPassword(pw.trim());
    if (home.trim()) setHomeTeamName(home.trim());
    if (away.trim()) setAwayTeamName(away.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-slate-100 text-base">⚙️ Innstillinger</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl min-h-[44px] px-2 transition">✕</button>
        </div>

        <div className="mb-5">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Idrett</div>
          <div className="flex gap-2">
            {([
              { v: 'football',  e: '⚽', l: 'Fotball 11er' },
              { v: 'football7', e: '⚽', l: 'Fotball 7er' },
              { v: 'football9', e: '⚽', l: 'Fotball 9er' },
              { v: 'handball',  e: '🤾', l: 'Håndball' },
            ] as const).map(({ v, e, l }) => (
              <button key={v} onClick={() => setSport(v as any)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all min-h-[48px] backdrop-blur
                  ${sport === v
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                    : 'border-slate-700 text-slate-500 hover:bg-slate-800/50'}`}>
                {e}<br/>{l}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Aldersgruppe</div>
          <div className="flex gap-2">
            {([
              { v: 'youth', l: '🧒 Barneøvelser (lettere)' },
              { v: 'adult', l: '🧑 Voksenøvelser (mer krevende)' },
            ] as const).map(({ v, l }) => (
              <button key={v} onClick={() => setAgeGroup(v)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all min-h-[48px] backdrop-blur
                  ${ageGroup === v
                    ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                    : 'border-slate-700 text-slate-500 hover:bg-slate-800/50'}`}>
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

        <button onClick={save}
          className={`w-full py-3.5 rounded-xl font-bold text-[14px] transition min-h-[52px] backdrop-blur
            ${saved
              ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
              : 'bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500'}`}>
          {saved ? '✓ Lagret!' : 'Lagre endringer'}
        </button>

        <style jsx>{`
          .sett-inp {
            width:100%; background:#0f172a; border:1px solid #334155;
            border-radius:10px; padding:12px 14px; color:#e2e8f0; font-size:14px;
            box-sizing:border-box; min-height:48px; transition: all 0.2s ease;
          }
          .sett-inp:focus { outline:none; border-color:#38bdf8; box-shadow: 0 0 0 2px rgba(56,189,248,0.2); }
        `}</style>
      </div>
    </div>
  );
};

// ─── SYNC INDIKATOR ──────────────────────────────────────────
const SyncIndicator: React.FC<{ syncing: boolean }> = ({ syncing }) => (
  syncing ? (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 backdrop-blur-sm">
      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
      <span className="text-[9px] text-sky-400 font-bold tracking-widest uppercase">Synk</span>
    </div>
  ) : null
);

// ─── MOBIL FULLSKJERM BRETT ───────────────────────────────────
const MobileFullscreenBoard: React.FC<{
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
  activePhaseIdx: number;
  onClose: () => void;
}> = ({ selectedPlayerId, onSelectPlayer, activePhaseIdx, onClose }) => (
  <div className="fixed inset-0 z-[60] bg-[#060c18] flex flex-col animate-in slide-in-from-bottom duration-300">
    <div className="flex-shrink-0 flex items-center justify-between px-3 h-12 bg-[#08101e]/90 backdrop-blur border-b border-[#1a2d46]">
      <span className="text-[11px] font-black text-sky-400 tracking-widest uppercase">📋 Taktikktavle</span>
      <button onClick={onClose}
        className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-700 text-slate-400 hover:text-white transition min-h-[36px]">
        ✕ Lukk
      </button>
    </div>
    <div className="flex flex-1 overflow-hidden">
      <Sidebar selectedPlayerId={selectedPlayerId} onSelectPlayer={onSelectPlayer} />
      <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={onSelectPlayer} />
    </div>
    {selectedPlayerId && (
      <PlayerEditor playerId={selectedPlayerId} phaseIdx={activePhaseIdx} onClose={() => onSelectPlayer(null)} />
    )}
  </div>
);

// ─── MOBIL TABS (coach) ──────────────────────────────────────
const COACH_MOBILE_TABS: { id: CoachTab; label: string; emoji: string }[] = [
  { id: 'dashboard', label: 'Hjem',     emoji: '🏠' },
  { id: 'board',     label: 'Brett',    emoji: '📋' },
  { id: 'calendar',  label: 'Kalender', emoji: '📅' },
  { id: 'admin',     label: 'Spillere', emoji: '👥' },
  { id: 'stats',     label: 'Stats',    emoji: '📊' },
  { id: 'chat',      label: 'Chat',     emoji: '💬' },
];

// ─── HOVEDSIDE ───────────────────────────────────────────────
export default function Home() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showSmartCoach, setShowSmartCoach] = useState(false);
  const [showMatchReport, setShowMatchReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [mobileBoardFullscreen, setMobileBoardFullscreen] = useState(false);
  const [showFullscreenBoard, setShowFullscreenBoard] = useState(false);
  const [mobileCoachTab, setMobileCoachTab] = useState<CoachTab>('dashboard');
  const [lastReadChatCount, setLastReadChatCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<CalendarEvent | null>(null);

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

  // F-tast for fullskjerm
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

  if (!isMounted) return null;
  if (!currentUser) return <LoginGate />;

  const isCoach = currentUser.role === 'coach';
  const allChats = chatMessages as ChatMessage[];
  const playerMessages = allChats.filter(m => m.fromRole === 'player');
  const unreadFromPlayers = Math.max(0, playerMessages.length - lastReadChatCount);

  const openChat = useCallback(() => {
    setLastReadChatCount(playerMessages.length);
    setShowChat(true);
  }, [playerMessages.length]);

  // ─── DESKTOP LAYOUT ────────────────────────────────────────
  const DesktopLayout = useMemo(() => (
    <div className="hidden sm:flex flex-col h-[100dvh] overflow-hidden bg-[#060c18]">
      <header className="flex-shrink-0 flex items-center gap-2 px-4 bg-[#08101e]/90 backdrop-blur-md border-b border-slate-800 h-14 z-40">
        <div className="mr-2 text-base font-black tracking-tighter whitespace-nowrap cursor-pointer" onClick={() => setView('dashboard')}>
          <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">⚽ {homeTeamName || 'TAKTIKKBOARD'}</span>
        </div>
        <SyncIndicator syncing={syncing} />

        {isCoach && (
          <nav className="flex gap-1 ml-4">
            {([
              { view: 'dashboard', label: 'Hjem',     emoji: '🏠' },
              { view: 'board',     label: 'Brett',    emoji: '📋' },
              { view: 'calendar',  label: 'Kalender', emoji: '📅' },
              { view: 'stats',     label: 'Stats',    emoji: '📊' },
              { view: 'training',  label: 'Trening',  emoji: '🏃' },
              { view: 'admin',     label: 'Spillere', emoji: '⚙️' },
            ] as const).map(n => (
              <button key={n.view} onClick={() => setView(n.view)}
                className={`relative px-3 py-2 rounded-xl text-[11.5px] font-bold transition-all min-h-[40px] group
                  ${(currentView === n.view || (currentView === undefined && n.view === 'dashboard'))
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
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
                <button onClick={() => setShowSmartCoach(true)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition min-h-[36px] backdrop-blur">
                  ⚡ AI Coach
                </button>
                <button onClick={() => setShowMatchReport(true)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition min-h-[36px] backdrop-blur">
                  📊 Rapport
                </button>
              </>
            )}
            <button onClick={openChat}
              className="relative px-3 py-1.5 rounded-xl text-[12px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-sky-500/50 hover:text-sky-400 transition min-h-[36px] shadow-sm backdrop-blur">
              💬
              {unreadFromPlayers > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#08101e]">
                  {unreadFromPlayers > 9 ? '9+' : unreadFromPlayers}
                </span>
              )}
            </button>
            <button onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 rounded-xl text-[12px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-300 transition min-h-[36px] shadow-sm backdrop-blur">
              ⚙️
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-800">
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hidden md:inline truncate max-w-[80px]">
            {currentUser.name}
          </span>
          <button onClick={() => useAppStore.getState().logout()}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white transition min-h-[36px]">
            Logg ut
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {(currentView === 'dashboard' || currentView === undefined) && isCoach && (
          <DashboardView
            currentUser={currentUser}
            homeTeamName={homeTeamName}
            sport={sport}
            unreadFromPlayers={unreadFromPlayers}
            onOpenChat={() => setMobileCoachTab('chat')}
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
              <button onClick={() => setShowFullscreenBoard(true)}
                className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl text-white hover:border-sky-500 transition-colors shadow-lg z-10">
                ⛶
              </button>
            </div>
          </>
        )}
        {currentView === 'calendar' && isCoach && <div className="flex-1 overflow-hidden"><CalendarView onGoToTraining={(t) => { setSelectedTraining(t); setView('training'); }} /></div>}
        {currentView === 'players' && isCoach && <div className="flex-1 overflow-hidden"><PlayerPortal /></div>}
        {currentView === 'stats' && isCoach && <div className="flex-1 overflow-hidden"><StatsView /></div>}
        {currentView === 'training' && isCoach && <div className="flex-1 overflow-hidden"><TrainingView initialTraining={selectedTraining || undefined} onBack={() => { setSelectedTraining(null); setView('calendar'); }} /></div>}
        {currentView === 'admin' && isCoach && <div className="flex-1 overflow-hidden"><PlayerManager /></div>}
        {currentUser.role === 'player' && <div className="flex-1 overflow-hidden"><PlayerHome /></div>}
      </main>
    </div>
  ), [currentView, isCoach, currentUser, homeTeamName, sport, unreadFromPlayers, syncing, selectedPlayerId, selectedTraining, setView, openChat, setSelectedTraining]);

  // ─── MOBIL LAYOUT ──────────────────────────────────────────
  const MobileLayout = useMemo(() => (
    <div className="flex sm:hidden flex-col h-[100dvh] overflow-hidden bg-[#060c18]">
      {mobileBoardFullscreen && isCoach && (
        <MobileFullscreenBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} activePhaseIdx={activePhaseIdx} onClose={() => setMobileBoardFullscreen(false)} />
      )}

      <header className="flex-shrink-0 flex items-center gap-2 px-4 bg-[#08101e]/95 backdrop-blur-md border-b border-slate-800 h-14 z-40">
        <span className="text-[13px] font-black bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
          {homeTeamName || 'TAKTIKKBOARD'}
        </span>
        <SyncIndicator syncing={syncing} />
        <div className="flex-1" />
        {isCoach && (
          <button onClick={() => setShowSettings(true)} className="px-2.5 py-1.5 rounded-xl text-[14px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-300 transition min-h-[36px] shadow-sm">
            ⚙️
          </button>
        )}
      </header>

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
        {isCoach && mobileCoachTab === 'board' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
            </div>
            <div className="flex-shrink-0 flex gap-2 px-3 py-3 bg-[#08101e] border-t border-slate-800">
              <button onClick={() => setMobileBoardFullscreen(true)} className="px-4 py-2.5 rounded-xl text-[12px] font-black tracking-wider border border-slate-700 text-sky-400 bg-sky-500/10 transition min-h-[44px]">
                ⛶ FULL
              </button>
              <button onClick={() => setShowSmartCoach(true)} className="flex-1 py-2.5 rounded-xl text-[12px] font-black tracking-wider border border-yellow-500/20 text-yellow-500 bg-yellow-500/10 transition min-h-[44px]">
                ⚡ AI COACH
              </button>
            </div>
          </div>
        )}
        {isCoach && mobileCoachTab === 'training' && <TrainingView initialTraining={selectedTraining || undefined} onBack={() => { setSelectedTraining(null); setMobileCoachTab('calendar'); }} />}
        {isCoach && mobileCoachTab === 'admin' && <PlayerManager />}
        {isCoach && mobileCoachTab === 'stats' && <StatsView />}
        {isCoach && mobileCoachTab === 'calendar' && <CalendarView onGoToTraining={(t) => { setSelectedTraining(t); setMobileCoachTab('training'); }} />}
        {isCoach && mobileCoachTab === 'players' && <PlayerPortal />}
        {isCoach && mobileCoachTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-shrink-0 px-4 py-4 bg-slate-800/50 border-b border-slate-700">
              <h2 className="font-black text-slate-100 text-base">💬 Chat med spillere</h2>
            </div>
            <ChatPanel currentUser={currentUser} chatMessages={chatMessages} coachView onSend={(text, toPlayerId) => sendChat('coach', 'Trener', text, toPlayerId)} />
          </div>
        )}
      </div>

      {isCoach && (
        <nav className="flex-shrink-0 flex border-t border-slate-800 bg-[#08101e]/95 backdrop-blur-md relative z-40" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
          {COACH_MOBILE_TABS.map(t => {
            const badge = t.id === 'chat' ? unreadFromPlayers : 0;
            const isActive = mobileCoachTab === t.id;
            return (
              <button key={t.id}
                onClick={() => {
                  setMobileCoachTab(t.id);
                  if (t.id === 'chat') setLastReadChatCount(playerMessages.length);
                }}
                className={`flex-1 flex flex-col items-center justify-center py-3 relative min-h-[60px] transition-all group
                  ${isActive ? 'text-sky-400' : 'text-slate-500 hover:text-slate-400'}`}>
                <span className={`text-[22px] leading-none mb-1 transition-transform ${isActive ? 'scale-110' : ''}`}>{t.emoji}</span>
                <span className="text-[9px] font-bold tracking-widest uppercase">{t.label}</span>
                {badge > 0 && (
                  <span className="absolute top-1.5 right-1/4 w-4 h-4 rounded-full bg-sky-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-[#08101e]">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-sky-400 rounded-b-full shadow-[0_2px_8px_rgba(56,189,248,0.5)]" />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  ), [isCoach, currentUser, homeTeamName, sport, unreadFromPlayers, syncing, selectedPlayerId, selectedTraining, mobileCoachTab, mobileBoardFullscreen, activePhaseIdx, chatMessages, sendChat, setMobileCoachTab, setSelectedTraining, setSelectedPlayerId, setShowSmartCoach, setShowMatchReport, setShowSettings, openChat, playerMessages.length]);

  return (
    <>
      {DesktopLayout}
      {MobileLayout}

      {selectedPlayerId && isCoach && !mobileBoardFullscreen && (
        <PlayerEditor playerId={selectedPlayerId} phaseIdx={activePhaseIdx} onClose={() => setSelectedPlayerId(null)} />
      )}
      {showSmartCoach && <SmartCoach onClose={() => setShowSmartCoach(false)} />}
      {showMatchReport && <MatchReportModal onClose={() => setShowMatchReport(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showFullscreenBoard && isCoach && <FullscreenBoard onClose={() => setShowFullscreenBoard(false)} interactive />}

      {showChat && isCoach && (
        <div className="hidden sm:flex fixed inset-0 bg-black/80 backdrop-blur-md z-[100] items-center justify-center p-4 animate-in fade-in" onClick={() => setShowChat(false)}>
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl w-full max-w-md h-[600px] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700 flex-shrink-0 bg-slate-800/50">
              <h2 className="font-black text-slate-100 text-base">💬 Chat med spillere</h2>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white text-xl transition-colors min-h-[44px] px-2">✕</button>
            </div>
            <ChatPanel currentUser={currentUser} chatMessages={chatMessages} coachView onSend={(text, toPlayerId) => sendChat('coach', 'Trener', text, toPlayerId)} />
          </div>
        </div>
      )}
    </>
  );
}