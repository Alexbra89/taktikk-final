'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { CalendarEvent, AppView } from '@/types';
import { STORAGE_ERROR_EVENT } from '@/lib/safeStorage';
import dynamic from 'next/dynamic';

// ─── ALLE DYNAMISKE IMPORTER ─────────────────────────────────
const TacticBoard = dynamic(() => import('@/components/board/TacticBoard').then(mod => mod.TacticBoard), {
  ssr: false,
  loading: () => <div className="flex-1 bg-[#060c18]" />,
});
const TacticTabs = dynamic(() => import('@/components/ui/TacticTabs').then(mod => mod.TacticTabs), { ssr: false });
const Controls = dynamic(() => import('@/components/ui/Controls').then(mod => mod.Controls), { ssr: false });
const FullscreenBoard = dynamic(() => import('@/components/ui/FullscreenBoard').then(mod => mod.FullscreenBoard), { ssr: false });
const SmartCoach = dynamic(() => import('@/components/ui/SmartCoach').then(mod => mod.SmartCoach), { ssr: false });
const MatchReportModal = dynamic(() => import('@/components/ui/MatchReport').then(mod => mod.MatchReportModal), { ssr: false });
const TrainingView = dynamic(() => import('@/components/ui/TrainingView').then(mod => mod.TrainingView), { ssr: false });
const CalendarView = dynamic(() => import('@/components/calendar/CalendarView').then(mod => mod.CalendarView), { ssr: false });
const DrillsView = dynamic(() => import('@/components/ui/DrillsView').then(mod => mod.DrillsView), { ssr: false });

// ─── NAVIGASJON ──────────────────────────────────────────────
const NAV: { view: AppView; label: string; emoji: string }[] = [
  { view: 'board',    label: 'Brett',    emoji: '📋' },
  { view: 'drills',   label: 'Øvelser',  emoji: '📚' },
  { view: 'calendar', label: 'Kalender', emoji: '📅' },
  { view: 'training', label: 'Trening',  emoji: '🏃' },
];
const VALID_VIEWS: AppView[] = NAV.map(n => n.view);

// ─── INNSTILLINGER MODAL ─────────────────────────────────────
const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    homeTeamName, awayTeamName,
    setHomeTeamName, setAwayTeamName,
    ageGroup, setAgeGroup,
  } = useAppStore();

  const [home,  setHome]  = useState(homeTeamName);
  const [away,  setAway]  = useState(awayTeamName);
  const [saved, setSaved] = useState(false);

  const save = () => {
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
        <div className="mb-6">
          <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">Motstanderlag</div>
          <input value={away} onChange={e => setAway(e.target.value)} className="sett-inp mt-1" placeholder="Eks: Bergen SK" />
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

// ─── HOVEDSIDE ────────────────────────────────────────────────
export default function Home() {
  const [selectedPlayerId,    setSelectedPlayerId]    = useState<string | null>(null);
  // null til vi vet skjermbredden: bare én av layoutene monteres, slik at brettet aldri finnes to ganger.
  const [isDesktop,           setIsDesktop]           = useState<boolean | null>(null);
  const [showSmartCoach,      setShowSmartCoach]      = useState(false);
  const [showMatchReport,     setShowMatchReport]     = useState(false);
  const [showSettings,        setShowSettings]        = useState(false);
  const [showFullscreenBoard, setShowFullscreenBoard] = useState(false);
  const [storageError,        setStorageError]        = useState<string | null>(null);
  const [selectedTraining,    setSelectedTraining]    = useState<CalendarEvent | null>(null);

  const { currentView, setView, homeTeamName } = useAppStore();

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // safeStorage varsler når localStorage er full slik at lagringen stille feiler.
  useEffect(() => {
    const onStorageError = (e: Event) => setStorageError((e as CustomEvent<string>).detail);
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
  }, []);

  // Et lagret view fra en fjernet fane (dashboard, stats, admin, messages …) skal ikke gi blank side.
  useEffect(() => {
    if (!VALID_VIEWS.includes(currentView)) setView('board');
  }, [currentView, setView]);

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

  // Kalender og trening er felles for desktop og mobil; bare rammen rundt er ulik.
  const calendarView = (
    <CalendarView onGoToTraining={(t) => { setSelectedTraining(t); setView('training'); }} />
  );
  const trainingView = (
    <TrainingView initialTraining={selectedTraining || undefined}
      onBack={() => { setSelectedTraining(null); setView('calendar'); }} />
  );

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────
  const DesktopLayout = useMemo(() => {
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#060c18]">
        <header className="flex-shrink-0 flex items-center gap-2 px-4 bg-[#08101e]/90 backdrop-blur-md border-b border-slate-800 h-14 z-40">
          <div
            className="mr-2 text-base font-black tracking-tighter whitespace-nowrap cursor-pointer"
            onClick={() => setView('board')}
          >
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              ⚽ {homeTeamName || 'TAKTIKKBOARD'}
            </span>
          </div>

          <nav className="flex gap-1 ml-4">
            {NAV.map(n => (
              <button
                key={n.view}
                onClick={() => setView(n.view)}
                className={`relative px-3 py-2 rounded-xl text-[11.5px] font-bold transition-all min-h-[40px]
                  ${currentView === n.view
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
              >
                {n.emoji} {n.label}
                {currentView === n.view && (
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

          <button onClick={() => setShowSettings(true)} aria-label="Innstillinger" title="Innstillinger"
            className="ml-1 px-2.5 py-1.5 rounded-xl text-[14px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition min-h-[36px] shadow-sm">
            ⚙️
          </button>
        </header>

        <main className="flex flex-1 overflow-hidden relative">
          {currentView === 'board' && (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden animate-in fade-in">
              <TacticTabs />
              <Controls />
              <div className="flex-1 min-h-0 overflow-hidden relative">
                <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
                <button onClick={() => setShowFullscreenBoard(true)}
                  className="absolute top-2 right-2 h-10 w-10 flex items-center justify-center bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl text-white hover:border-sky-500 transition-colors shadow-lg z-10"
                  title="Fullskjerm (F)">⛶</button>
              </div>
            </div>
          )}
          {currentView === 'drills' && <div className="flex-1 min-w-0 overflow-hidden"><DrillsView /></div>}
          {currentView === 'calendar' && <div className="flex-1 overflow-hidden">{calendarView}</div>}
          {currentView === 'training' && <div className="flex-1 overflow-hidden">{trainingView}</div>}
        </main>
      </div>
    );
  }, [currentView, homeTeamName, selectedPlayerId, selectedTraining, setView]);

  // ─── MOBIL LAYOUT ────────────────────────────────────────────
  const MobileLayout = useMemo(() => {
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#060c18]">
        <header className="flex-shrink-0 flex items-center gap-2 px-4 bg-[#08101e]/95 backdrop-blur-md border-b border-slate-800 h-14 z-40">
          <span className="text-[13px] font-black bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            {homeTeamName || 'TAKTIKKBOARD'}
          </span>
          <div className="flex-1" />
          {currentView === 'board' && (
            <button onClick={() => setShowSmartCoach(true)} aria-label="Smart Coach"
              className="px-2.5 py-1.5 rounded-xl text-[14px] border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition min-h-[36px]">
              💡
            </button>
          )}
          <button onClick={() => setShowSettings(true)} aria-label="Innstillinger"
            className="px-2.5 py-1.5 rounded-xl text-[14px] border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-300 transition min-h-[36px] shadow-sm">
            ⚙️
          </button>
        </header>

        <nav className="flex-shrink-0 flex border-b border-slate-800 bg-[#08101e]/95 backdrop-blur-md relative z-40">
          {NAV.map(n => {
            const isActive = currentView === n.view;
            return (
              <button key={n.view} onClick={() => setView(n.view)}
                className={`flex-1 flex flex-col items-center justify-center py-2 relative min-h-[52px] transition-all
                  ${isActive ? 'text-sky-400' : 'text-slate-500 hover:text-slate-400'}`}>
                <span className={`text-[18px] leading-none mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {n.emoji}
                </span>
                <span className="text-[8px] font-bold tracking-widest uppercase">{n.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-sky-400 rounded-t-full shadow-[0_-2px_8px_rgba(56,189,248,0.5)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-h-0 overflow-hidden relative">
          {currentView === 'board' && (
            <div className="flex flex-col h-full">
              {/* Faner og kontroller ligger utenfor touch-action:none-wrapperen, slik at fanene kan rulles. */}
              <TacticTabs />
              <Controls />
              {/* touchAction none på wrapper – forhindrer scrolling under drag */}
              <div className="flex flex-1 min-h-0 overflow-hidden relative" style={{ touchAction: 'none' }}>
                <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
              </div>
            </div>
          )}
          {/* DrillsView scroller selv (egen filterrad + liste), så ingen overflow-y her. */}
          {currentView === 'drills' && <div className="h-full overflow-hidden"><DrillsView /></div>}
          {currentView === 'calendar' && <div className="h-full overflow-y-auto">{calendarView}</div>}
          {currentView === 'training' && <div className="h-full overflow-y-auto">{trainingView}</div>}
        </div>
      </div>
    );
  }, [currentView, homeTeamName, selectedPlayerId, selectedTraining, setView]);

  // ─── BETINGEDE RETURNS ─────────────────────────────────────────
  if (isDesktop === null) return null;

  return (
    <>
      {storageError && (
        <div role="alert"
          className="fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-3 bg-red-600/90 backdrop-blur px-4 py-2 text-[12px] font-bold text-white"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
          <span>⚠️ {storageError}</span>
          <button onClick={() => setStorageError(null)} aria-label="Lukk varsel" className="px-2 min-h-[32px]">✕</button>
        </div>
      )}
      {isDesktop ? DesktopLayout : MobileLayout}

      {showSmartCoach  && <SmartCoach onClose={() => setShowSmartCoach(false)} />}
      {showMatchReport && <MatchReportModal onClose={() => setShowMatchReport(false)} />}
      {showSettings    && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showFullscreenBoard && (
        <FullscreenBoard onClose={() => setShowFullscreenBoard(false)} interactive />
      )}
    </>
  );
}
