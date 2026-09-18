'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { CalendarEvent, AppView } from '@/types';
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
const TrainingView = dynamic(() => import('@/components/ui/TrainingView').then(mod => mod.TrainingView), { ssr: false });
const CalendarView = dynamic(() => import('@/components/calendar/CalendarView').then(mod => mod.CalendarView), { ssr: false });
const Sidebar = dynamic(() => import('@/components/ui/Sidebar').then(mod => mod.Sidebar), { ssr: false });
const DrillLibraryModal = dynamic(() => import('@/components/ui/DrillLibraryModal').then(mod => mod.DrillLibraryModal), { ssr: false });
const InjuryReturnBanner = dynamic(() => import('@/components/ui/InjuryReturnBanner').then(mod => mod.InjuryReturnBanner), { ssr: false });

// ─── TYPER ───────────────────────────────────────────────────
type CoachTab = 'dashboard' | 'board' | 'calendar' | 'training';
const VALID_VIEWS: AppView[] = ['dashboard', 'board', 'calendar', 'training'];

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
  setView: (view: AppView) => void;
  setShowSmartCoach: (show: boolean) => void;
  setShowMatchReport: (show: boolean) => void;
  setShowDrillLibrary: (show: boolean) => void;
}> = ({ currentUser, homeTeamName, sport, setView, setShowDrillLibrary }) => {
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
            : sport === 'football5' ? 'Fotball 5er'
            : sport === 'football7' ? 'Fotball 7er'
            : sport === 'football9' ? 'Fotball 9er'
            : 'Fotball'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <BentoCard title="Taktikktavle" subtitle="Sett opp lagoppstilling og formasjon" icon="📋" color="sky"     onClick={() => setView('board')} />
        <BentoCard title="Kalender"     subtitle="Terminliste og treninger"              icon="📅" color="emerald" onClick={() => setView('calendar')} />
        <BentoCard title="Øvelsesbibliotek" subtitle="Bla gjennom øvelser for trening" icon="📚" color="amber" onClick={() => setShowDrillLibrary(true)} />
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

        <div className="mb-5">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Idrett</div>
          <div className="flex gap-2">
            {([
              { v: 'football',  e: '⚽', l: 'Fotball 11er' },
              { v: 'football5', e: '⚽', l: 'Fotball 5er' },
              { v: 'football7', e: '⚽', l: 'Fotball 7er' },
              { v: 'football9', e: '⚽', l: 'Fotball 9er' },
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
];

// ─── HOVEDSIDE ────────────────────────────────────────────────
export default function Home() {
  const [selectedPlayerId,    setSelectedPlayerId]    = useState<string | null>(null);
  const [isMounted,           setIsMounted]           = useState(false);
  const [showSmartCoach,      setShowSmartCoach]      = useState(false);
  const [showMatchReport,     setShowMatchReport]     = useState(false);
  const [showSettings,        setShowSettings]        = useState(false);
  const [showFullscreenBoard, setShowFullscreenBoard] = useState(false);
  const [showDrillLibrary,    setShowDrillLibrary]    = useState(false);
  const [mobileCoachTab,      setMobileCoachTab]      = useState<CoachTab>('dashboard');
  const [showMobileSidebar,   setShowMobileSidebar]   = useState(false);
  const [syncing,             setSyncing]             = useState(false);
  const [selectedTraining,    setSelectedTraining]    = useState<CalendarEvent | null>(null);

  const {
    currentView, setView, currentUser, activePhaseIdx,
    homeTeamName, sport,
  } = useAppStore();

  useEffect(() => {
    setIsMounted(true);
    const load = async () => {
      setSyncing(true);
      await useAppStore.getState().syncFromSupabase();
      setSyncing(false);
    };
    load();
  }, []);

  // Et lagret view fra en fjernet fane (stats, admin, messages …) skal ikke gi blank side.
  useEffect(() => {
    if (currentView && !VALID_VIEWS.includes(currentView)) setView('dashboard');
  }, [currentView, setView]);

  useEffect(() => {
    if (mobileCoachTab !== 'board') setShowMobileSidebar(false);
  }, [mobileCoachTab]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && currentView === 'board') {
        setShowFullscreenBoard(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentView]);

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────
  const DesktopLayout = useMemo(() => {
    if (!currentUser) return null;
    return (
      <div className="hidden sm:flex flex-col h-[100dvh] overflow-hidden bg-[#060c18]">
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

          <nav className="flex gap-1 ml-4">
            {([
              { view: 'dashboard', label: 'Hjem',      emoji: '🏠' },
              { view: 'board',     label: 'Brett',     emoji: '📋' },
              { view: 'calendar',  label: 'Kalender',  emoji: '📅' },
              { view: 'training',  label: 'Trening',   emoji: '🏃' },
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

          <div className="flex-1" />

          {currentView === 'board' && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowSmartCoach(true)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition min-h-[36px] backdrop-blur">
                💡 Smart Coach
              </button>
              <button onClick={() => setShowMatchReport(true)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition min-h-[36px] backdrop-blur">
                📊 Rapport
              </button>
            </div>
          )}
        </header>

        <main className="flex flex-1 overflow-hidden relative">
          {(currentView === 'dashboard' || currentView === undefined) && (
            <DashboardView
              currentUser={currentUser} homeTeamName={homeTeamName} sport={sport}
              setView={setView}
              setShowSmartCoach={setShowSmartCoach} setShowMatchReport={setShowMatchReport} setShowDrillLibrary={setShowDrillLibrary}
            />
          )}
          {currentView === 'board' && (
            <>
              <Sidebar selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
              <div className="flex-1 overflow-hidden relative animate-in fade-in">
                <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
                <button onClick={() => setShowFullscreenBoard(true)}
                  className="absolute bottom-4 left-4 h-10 w-10 flex items-center justify-center bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl text-white hover:border-sky-500 transition-colors shadow-lg z-10"
                  title="Fullskjerm (F)">⛶</button>
              </div>
            </>
          )}
          {currentView === 'calendar' && (
            <div className="flex-1 overflow-hidden">
              <CalendarView onGoToTraining={(t) => { setSelectedTraining(t); setView('training'); }} />
            </div>
          )}
          {currentView === 'training' && (
            <div className="flex-1 overflow-hidden">
              <TrainingView initialTraining={selectedTraining || undefined}
                onBack={() => { setSelectedTraining(null); setView('calendar'); }} />
            </div>
          )}
        </main>
      </div>
    );
  }, [
    currentView, currentUser, homeTeamName, sport,
    syncing, selectedPlayerId, selectedTraining,
    setView,
  ]);

  // ─── MOBIL LAYOUT ────────────────────────────────────────────
  const MobileLayout = useMemo(() => {
    if (!currentUser) return null;

    // ── Brett: fullskjerm med sidebar som overlay ──────────────
    if (mobileCoachTab === 'board') {
      return (
        <div className="flex sm:hidden flex-col h-[100dvh] landscape:h-screen overflow-hidden bg-[#060c18]">
          <div
            className="flex-shrink-0 flex items-center justify-between px-3 min-h-[48px] bg-[#08101e]/90 backdrop-blur border-b border-[#1a2d46]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: '8px' }}
          >
            <span className="text-[11px] font-black text-sky-400 tracking-widest uppercase">📋 Taktikktavle</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowSmartCoach(true)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition min-h-[36px]">
                💡
              </button>
              <button
                onClick={() => setShowMobileSidebar(s => !s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition min-h-[36px]
                  ${showMobileSidebar ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-sky-700/60 text-sky-500 hover:bg-sky-500/10'}`}>
                👥 Tropp
              </button>
              <button onClick={() => setMobileCoachTab('dashboard')}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-700 text-slate-400 hover:text-white transition min-h-[36px]">
                ✕
              </button>
            </div>
          </div>

          {/* touchAction none på wrapper – forhindrer scrolling under drag */}
          <div className="flex flex-1 overflow-hidden relative" style={{ touchAction: 'none' }}>
            <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
            {showMobileSidebar && (
              <>
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowMobileSidebar(false)} />
                <div className="absolute right-0 top-0 h-full z-50 w-[260px] shadow-2xl animate-in slide-in-from-right duration-200">
                  <Sidebar selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
                </div>
              </>
            )}
          </div>

          {selectedPlayerId && (
            <PlayerEditor playerId={selectedPlayerId} phaseIdx={activePhaseIdx} onClose={() => setSelectedPlayerId(null)} />
          )}
        </div>
      );
    }

    // ─────────────────────────────────────────────────────────────
    // renderPageWithBackButton
    //
    // SCROLL-MODELL:
    //   • Ytterste wrapper: overflow-y-auto  → selve scroll-containeren
    //   • Tilbake-header:   sticky top-0     → klistret til toppen ved scroll
    //   • Innholds-div:     flex-1 (ingen overflow) → strekker seg naturlig
    // ─────────────────────────────────────────────────────────────
    const renderPageWithBackButton = (children: React.ReactNode, title?: string) => {
      if (mobileCoachTab === 'dashboard') return children;
      return (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Tilbake-knapp – sticky så den alltid er synlig */}
          <div className="flex-shrink-0 flex items-center px-3 py-2 bg-[#0c1525] border-b border-[#1e3050] sticky top-0 z-10">
            <button
              onClick={() => setMobileCoachTab('dashboard')}
              className="flex items-center gap-1 text-[12px] text-sky-400 min-h-[44px]"
            >
              ‹ Tilbake til dashboard
            </button>
            {title && <span className="ml-2 text-[11px] font-bold text-slate-300 truncate">{title}</span>}
          </div>
          {/* Ingen overflow-hidden her – innholdet flyter naturlig og kan scrolles */}
          <div className="flex-1">
            {children}
          </div>
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
          <button onClick={() => setShowSettings(true)}
            className="px-2.5 py-1.5 rounded-xl text-[14px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-300 transition min-h-[36px] shadow-sm">
            ⚙️
          </button>
        </header>

        {/* Navigasjonsfaner */}
        <nav className="flex-shrink-0 flex border-b border-slate-800 bg-[#08101e]/95 backdrop-blur-md relative z-40">
          {COACH_MOBILE_TABS.map(t => {
            const isActive = mobileCoachTab === t.id;
            return (
              <button key={t.id} onClick={() => setMobileCoachTab(t.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 relative min-h-[52px] transition-all
                  ${isActive ? 'text-sky-400' : 'text-slate-500 hover:text-slate-400'}`}>
                <span className={`text-[18px] leading-none mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {t.emoji}
                </span>
                <span className="text-[8px] font-bold tracking-widest uppercase">{t.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-sky-400 rounded-t-full shadow-[0_-2px_8px_rgba(56,189,248,0.5)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sideinnhold */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {mobileCoachTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser} homeTeamName={homeTeamName} sport={sport}
              setView={(v: AppView) => setMobileCoachTab(v as CoachTab)}
              setShowSmartCoach={setShowSmartCoach} setShowMatchReport={setShowMatchReport} setShowDrillLibrary={setShowDrillLibrary}
            />
          )}

          {mobileCoachTab === 'calendar' && renderPageWithBackButton(
            <CalendarView onGoToTraining={(t) => { setSelectedTraining(t); setMobileCoachTab('training'); }} />,
            'Kalender',
          )}

          {mobileCoachTab === 'training' && renderPageWithBackButton(
            <TrainingView
              initialTraining={selectedTraining || undefined}
              onBack={() => { setSelectedTraining(null); setMobileCoachTab('calendar'); }}
            />,
            'Trening',
          )}
        </div>
      </div>
    );
  }, [
    currentUser, homeTeamName, sport, syncing,
    selectedPlayerId, selectedTraining, mobileCoachTab, activePhaseIdx,
    showMobileSidebar,
    setMobileCoachTab, setSelectedTraining, setSelectedPlayerId,
    setShowSmartCoach, setShowMatchReport, setShowSettings, setShowDrillLibrary,
  ]);

  // ─── BETINGEDE RETURNS ─────────────────────────────────────────
  if (!isMounted) return null;

  return (
    <>
      <InjuryReturnBanner />
      {DesktopLayout}
      {MobileLayout}

      {selectedPlayerId && mobileCoachTab !== 'board' && (
        <PlayerEditor playerId={selectedPlayerId} phaseIdx={activePhaseIdx} onClose={() => setSelectedPlayerId(null)} />
      )}

      {showSmartCoach  && <SmartCoach onClose={() => setShowSmartCoach(false)} />}
      {showMatchReport && <MatchReportModal onClose={() => setShowMatchReport(false)} />}
      {showSettings    && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showDrillLibrary && <DrillLibraryModal onClose={() => setShowDrillLibrary(false)} />}
      {showFullscreenBoard && (
        <FullscreenBoard onClose={() => setShowFullscreenBoard(false)} interactive />
      )}
    </>
  );
}
