'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { CalendarEvent, AppView } from '@/types';
import type { AiArea } from '@/lib/ai/request';
import { STORAGE_ERROR_EVENT } from '@/lib/safeStorage';
import dynamic from 'next/dynamic';
import { AlertTriangle, X } from 'lucide-react';
import { Sidebar } from '@/components/ui/Sidebar';
import { MobileTopBar, MobileTabBar, MoreSheet } from '@/components/layout/MobileNav';
import { ViewHeader } from '@/components/layout/Surface';
import { VALID_VIEWS, type NavTarget } from '@/components/layout/navigation';
import { TacticsHeader } from '@/components/board/TacticsHeader';

// ─── ALLE DYNAMISKE IMPORTER ─────────────────────────────────
const TacticBoard = dynamic(() => import('@/components/board/TacticBoard').then(mod => mod.TacticBoard), {
  ssr: false,
  loading: () => <div className="flex-1 bg-canvas" />,
});
const FullscreenBoard = dynamic(() => import('@/components/ui/FullscreenBoard').then(mod => mod.FullscreenBoard), { ssr: false });
const SmartCoach = dynamic(() => import('@/components/ui/SmartCoach').then(mod => mod.SmartCoach), { ssr: false });
const AiCoach = dynamic(() => import('@/components/ui/AiCoach').then(mod => mod.AiCoach), { ssr: false });
const MatchReportModal = dynamic(() => import('@/components/ui/MatchReport').then(mod => mod.MatchReportModal), { ssr: false });
const TrainingView = dynamic(() => import('@/components/ui/TrainingView').then(mod => mod.TrainingView), { ssr: false });
const CalendarView = dynamic(() => import('@/components/calendar/CalendarView').then(mod => mod.CalendarView), { ssr: false });
const DrillsView = dynamic(() => import('@/components/ui/DrillsView').then(mod => mod.DrillsView), { ssr: false });
const DashboardView = dynamic(() => import('@/components/dashboard/DashboardView').then(mod => mod.DashboardView), { ssr: false });
const ReportsView = dynamic(() => import('@/components/reports/ReportsView').then(mod => mod.ReportsView), { ssr: false });
const SettingsView = dynamic(() => import('@/components/settings/SettingsView').then(mod => mod.SettingsView), { ssr: false });

// ═══════════════════════════════════════════════════════════════
//  APPSKALLET
//  Mobil (<640px): topplinje + innhold + bunnmeny.
//  Nettbrett (640–1023px): ikonskinne + innhold. AI-treneren som dialog.
//  Desktop (≥1024px): sidefelt + innhold + dokket AI-panel ved behov.
//  Visningene eier funksjonene sine; skallet sender bare videre
//  («åpne denne treningen», «åpne kalenderen på denne dagen»).
// ═══════════════════════════════════════════════════════════════

/** Hvor en visning skal åpnes – settes av dashbordet og nullstilles ved vanlig navigasjon. */
interface Intent {
  training?: CalendarEvent;
  trainingNew?: boolean;
  /** Visningen «Tilbake» i en åpnet trening fører til. */
  trainingReturn?: AppView;
  calendarDate?: string;
  drillId?: string;
}

function useMedia(query: string): boolean | null {
  const [match, setMatch] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return match;
}

export default function Home() {
  const [selectedPlayerId,    setSelectedPlayerId]    = useState<string | null>(null);
  // null til vi vet skjermbredden: bare én av layoutene monteres, slik at brettet aldri finnes to ganger.
  const isDesktop = useMedia('(min-width: 640px)');
  const isWide    = useMedia('(min-width: 1024px)');
  const [showSmartCoach,      setShowSmartCoach]      = useState(false);
  const [aiOpen,              setAiOpen]              = useState(false);
  // Treningen som er åpen i Trening-visningen – AI-treneren bruker den som kontekst.
  const [openTrainingId,      setOpenTrainingId]      = useState<string | null>(null);
  const [reportFor,           setReportFor]           = useState<{ eventId?: string } | null>(null);
  const [showMore,            setShowMore]            = useState(false);
  const [showFullscreenBoard, setShowFullscreenBoard] = useState(false);
  const [storageError,        setStorageError]        = useState<string | null>(null);
  const [intent,              setIntent]              = useState<Intent>({});

  const { currentView, setView, homeTeamName } = useAppStore();

  // Dashbordet er startsiden: appen åpner alltid der, uansett hvor du slapp.
  useEffect(() => { setView('dashboard'); }, [setView]);

  // safeStorage varsler når localStorage er full slik at lagringen stille feiler.
  useEffect(() => {
    const onStorageError = (e: Event) => setStorageError((e as CustomEvent<string>).detail);
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
  }, []);

  // Et lagret view fra en fjernet fane skal ikke gi blank side.
  useEffect(() => {
    if (!VALID_VIEWS.includes(currentView)) setView('dashboard');
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

  // ─── NAVIGASJON ──────────────────────────────────────────────
  const navigate = (v: AppView, next: Intent = {}) => { setIntent(next); setView(v); };
  const openAi = () => setAiOpen(true);
  const toggleAi = () => setAiOpen(o => !o);
  const selectNav = (t: NavTarget) => (t === 'ai' ? openAi() : navigate(t));
  const openTraining = (t: CalendarEvent, from: AppView) => navigate('training', { training: t, trainingReturn: from });

  // AI-treneren følger visningen du står i: forslag og kontekst byttes med den.
  const aiArea: AiArea =
    currentView === 'board' ? 'board'
    : currentView === 'training' ? 'training'
    : currentView === 'calendar' ? 'calendar'
    : 'dashboard';

  // ─── VISNINGENE ──────────────────────────────────────────────
  const renderView = (mobile: boolean) => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={v => navigate(v)}
            onOpenTraining={t => openTraining(t, 'dashboard')}
            onNewTraining={() => navigate('training', { trainingNew: true })}
            onOpenDate={d => navigate('calendar', { calendarDate: d })}
            onOpenDrill={id => navigate('drills', { drillId: id })}
            onOpenAi={openAi}
            onOpenReport={eventId => setReportFor({ eventId })}
          />
        );
      case 'board':
        return mobile ? (
          /* Brettet eier sine egne linjer over og under banen (se TacticBoard). */
          <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
        ) : (
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden animate-in fade-in">
            <TacticsHeader aiOpen={aiOpen} onToggleAi={toggleAi} onOpenSmartCoach={() => setShowSmartCoach(true)} />
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <TacticBoard
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={setSelectedPlayerId}
                onFullscreen={() => setShowFullscreenBoard(true)}
              />
            </div>
          </div>
        );
      case 'training':
        return (
          <TrainingView
            initialTraining={intent.training}
            initialNew={intent.trainingNew}
            onSelectedChange={setOpenTrainingId}
            onBack={() => navigate(intent.trainingReturn ?? 'calendar')}
          />
        );
      case 'calendar': {
        const cal = (
          <CalendarView initialDate={intent.calendarDate} onGoToTraining={t => openTraining(t, 'calendar')} />
        );
        return mobile ? cal : (
          <div className="flex flex-col h-full overflow-hidden">
            <ViewHeader eyebrow="Arbeid" title="Kalender" subtitle="Treninger og kamper – dato, tid, sted og innhold" />
            <div className="flex-1 min-h-0 overflow-hidden">{cal}</div>
          </div>
        );
      }
      case 'drills':
        return <DrillsView focusDrillId={intent.drillId} />;
      case 'reports':
        return <ReportsView onNewReport={eventId => setReportFor({ eventId })} />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  // ─── BETINGEDE RETURNS ─────────────────────────────────────────
  if (isDesktop === null || isWide === null) return null;

  const dockAi = isDesktop && isWide;

  return (
    <>
      {storageError && (
        <div role="alert"
          className="fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-2.5 bg-bad-500 px-4 py-2 text-caption font-bold text-white"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
          <AlertTriangle size={14} strokeWidth={2} aria-hidden className="flex-shrink-0" />
          <span>{storageError}</span>
          <button onClick={() => setStorageError(null)} aria-label="Lukk varsel" className="px-2 min-h-[32px]">
            <X size={14} strokeWidth={2} aria-hidden />
          </button>
        </div>
      )}

      {isDesktop ? (
        <div className="flex h-[100dvh] overflow-hidden bg-canvas text-ink">
          <Sidebar
            currentView={currentView}
            onNavigate={v => navigate(v)}
            teamName={homeTeamName}
            aiOpen={aiOpen}
            onToggleAi={toggleAi}
            onOpenSmartCoach={() => setShowSmartCoach(true)}
          />
          <main className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
            {renderView(false)}
          </main>
          {aiOpen && dockAi && (
            <AiCoach variant="panel" area={aiArea} trainingId={currentView === 'training' ? openTrainingId : null} onClose={() => setAiOpen(false)} />
          )}
        </div>
      ) : (
        <div className="flex flex-col h-[100dvh] overflow-hidden bg-canvas text-ink">
          <MobileTopBar
            currentView={currentView}
            teamName={homeTeamName}
            onOpenAi={() => openAi()}
            onOpenSmartCoach={() => setShowSmartCoach(true)}
            onHome={() => navigate('dashboard')}
          />
          <main className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
            {currentView === 'calendar'
              ? <div className="h-full overflow-y-auto">{renderView(true)}</div>
              : renderView(true)}
          </main>
          <MobileTabBar currentView={currentView} onNavigate={v => navigate(v)} onOpenMore={() => setShowMore(true)} />
        </div>
      )}

      {showMore && (
        <MoreSheet
          currentView={currentView}
          onClose={() => setShowMore(false)}
          onSelect={selectNav}
          onOpenSmartCoach={() => setShowSmartCoach(true)}
        />
      )}
      {showSmartCoach && <SmartCoach onClose={() => setShowSmartCoach(false)} />}
      {aiOpen && !dockAi && (
        <AiCoach area={aiArea} trainingId={currentView === 'training' ? openTrainingId : null} onClose={() => setAiOpen(false)} />
      )}
      {reportFor && <MatchReportModal initialEventId={reportFor.eventId} onClose={() => setReportFor(null)} />}
      {showFullscreenBoard && (
        <FullscreenBoard onClose={() => setShowFullscreenBoard(false)} interactive />
      )}
    </>
  );
}
