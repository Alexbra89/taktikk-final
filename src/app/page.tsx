'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { CalendarEvent, AppView } from '@/types';
import { STORAGE_ERROR_EVENT } from '@/lib/safeStorage';
import dynamic from 'next/dynamic';
import { Lightbulb, Settings, Sun, Moon, Baby, User, Check, AlertTriangle, X, Download, Upload } from 'lucide-react';
import { Sidebar, NAV_ITEMS } from '@/components/ui/Sidebar';
import { Modal } from '@/components/ui';
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BTN, SECONDARY_BTN, toggleClass } from '@/lib/formClasses';
import { buildBackup, backupFilename, parseBackup, describeBackup, downloadJson, type BackupFile } from '@/lib/backup';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';

// ─── ALLE DYNAMISKE IMPORTER ─────────────────────────────────
const TacticBoard = dynamic(() => import('@/components/board/TacticBoard').then(mod => mod.TacticBoard), {
  ssr: false,
  loading: () => <div className="flex-1 bg-canvas" />,
});
const DrawDebugOverlay = dynamic(() => import('@/components/board/DrawDebugOverlay').then(mod => mod.DrawDebugOverlay), { ssr: false });
const FullscreenBoard = dynamic(() => import('@/components/ui/FullscreenBoard').then(mod => mod.FullscreenBoard), { ssr: false });
const SmartCoach = dynamic(() => import('@/components/ui/SmartCoach').then(mod => mod.SmartCoach), { ssr: false });
const MatchReportModal = dynamic(() => import('@/components/ui/MatchReport').then(mod => mod.MatchReportModal), { ssr: false });
const TrainingView = dynamic(() => import('@/components/ui/TrainingView').then(mod => mod.TrainingView), { ssr: false });
const CalendarView = dynamic(() => import('@/components/calendar/CalendarView').then(mod => mod.CalendarView), { ssr: false });
const DrillsView = dynamic(() => import('@/components/ui/DrillsView').then(mod => mod.DrillsView), { ssr: false });

// ─── NAVIGASJON ──────────────────────────────────────────────
// Menypunktene bor i Sidebar.tsx; mobilmenyen bruker de samme.
const VALID_VIEWS: AppView[] = NAV_ITEMS.map(n => n.view);

// ─── DATA: EKSPORT OG IMPORT ─────────────────────────────────
// Alt skjer lokalt. Filen lastes ned til enheten, og brukeren flytter
// den selv videre – ingen server er involvert.
const DataSection: React.FC = () => {
  const { homeTeamName, lastExportedAt, exportSnapshot, markExported, importSnapshot } = useAppStore();
  const { theme, setTheme } = useTheme();

  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [pending, setPending] = useState<BackupFile | null>(null);

  const doExport = () => {
    setError(''); setDone('');
    try {
      const backup = buildBackup({ data: exportSnapshot(), teamName: homeTeamName, theme });
      downloadJson(backupFilename(homeTeamName), JSON.stringify(backup, null, 2));
      markExported();
      setDone('Backup lastet ned.');
    } catch {
      setError('Klarte ikke å lage filen. Er det plass på enheten?');
    }
  };

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); setDone(''); setPending(null);
    const file = e.target.files?.[0];
    // Nullstill med én gang, så samme fil kan velges på nytt etterpå.
    e.target.value = '';
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError('Klarte ikke å lese filen.');
      return;
    }
    const res = parseBackup(text);
    if (!res.ok) { setError(res.error); return; }
    setPending(res.backup);
  };

  const confirmImport = () => {
    if (!pending) return;
    importSnapshot(pending.data);
    if (pending.theme) setTheme(pending.theme);
    setPending(null);
    setDone('Dataene er importert.');
  };

  const exportedLabel = lastExportedAt
    ? new Date(lastExportedAt).toLocaleString('nb-NO', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div>
      <div className={LABEL_CLASS}>Data</div>

      <div className="mt-2 flex gap-2">
        <button onClick={doExport} className={`flex-1 ${SECONDARY_BTN}`}>
          <Download size={15} strokeWidth={1.75} aria-hidden /> Eksporter
        </button>
        <button onClick={() => fileRef.current?.click()} className={`flex-1 ${SECONDARY_BTN}`}>
          <Upload size={15} strokeWidth={1.75} aria-hidden /> Importer
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json"
          onChange={pickFile} className="hidden" aria-hidden tabIndex={-1} />
      </div>

      <p className="mt-1.5 text-meta text-ink-subtle">
        {exportedLabel ? `Sist eksportert: ${exportedLabel}` : 'Aldri eksportert.'}
      </p>

      {/* Import overskriver alt, så den skal bekreftes – med tall på bordet. */}
      {pending && (
        <div className="mt-3 rounded-panel border border-warn-500/40 bg-warn-500/10 p-3">
          <div className="flex gap-2.5">
            <AlertTriangle size={16} strokeWidth={1.75} aria-hidden
              className="text-warn-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-body text-warn-300 leading-relaxed">
                Dette erstatter alt du har nå.
              </p>
              <p className="mt-1 text-meta text-ink-muted">
                {pending.teamName || 'Ukjent lag'} · {describeBackup(pending)}
                {pending.exportedAt && ` · ${new Date(pending.exportedAt).toLocaleDateString('nb-NO')}`}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={confirmImport} className={`flex-1 ${PRIMARY_BTN}`}>
              Erstatt alt
            </button>
            <button onClick={() => setPending(null)} className={SECONDARY_BTN}>
              Avbryt
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-caption text-signal">{error}</p>}
      {done && !error && <p role="status" className="mt-2 text-caption text-ink-muted">{done}</p>}
    </div>
  );
};

// ─── INNSTILLINGER MODAL ─────────────────────────────────────
const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    homeTeamName,
    setHomeTeamName,
    ageGroup, setAgeGroup,
  } = useAppStore();
  const { theme, setTheme } = useTheme();

  const [home,  setHome]  = useState(homeTeamName);
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (home.trim())  setHomeTeamName(home.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  return (
    <Modal
      onClose={onClose}
      size="sm"
      title={<span className="font-serif text-[1.5rem] leading-tight">Innstillinger</span>}
      footer={
        <button onClick={save} className={`w-full ${PRIMARY_BTN}`}>
          {saved
            ? <><Check size={15} strokeWidth={2} aria-hidden /> Lagret</>
            : 'Lagre endringer'}
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <div className={LABEL_CLASS}>Tema</div>
          {/* Samme segmenterte velger som i sidefeltet – ett valg, alltid synlig. */}
          <div role="radiogroup" aria-label="Tema" className="mt-2 flex p-0.5 rounded-ctl bg-canvas-raised shadow-hair">
            {([
              { v: 'dark',  label: 'Kveld',   icon: Moon },
              { v: 'light', label: 'Dagslys', icon: Sun },
            ] as const).map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                role="radio"
                aria-checked={theme === v}
                onClick={() => setTheme(v)}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-[5px] text-body transition-colors',
                  theme === v ? 'bg-canvas-panel text-ink shadow-hair-strong' : 'text-ink-subtle hover:text-ink',
                )}
              >
                <Icon size={14} strokeWidth={1.75} aria-hidden /> {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className={LABEL_CLASS}>Aldersgruppe</div>
          <div className="mt-2 flex gap-2">
            {([
              { v: 'youth', label: 'Barn',   hint: 'lettere',      icon: Baby },
              { v: 'adult', label: 'Voksne', hint: 'mer krevende', icon: User },
            ] as const).map(({ v, label, hint, icon: Icon }) => (
              <button
                key={v}
                onClick={() => setAgeGroup(v)}
                aria-pressed={ageGroup === v}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] rounded-ctl transition-colors',
                  toggleClass(ageGroup === v),
                )}
              >
                <span className="inline-flex items-center gap-1.5 text-body font-bold">
                  <Icon size={14} strokeWidth={1.75} aria-hidden /> {label}
                </span>
                <span className="text-meta opacity-70">{hint}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-meta text-ink-subtle">Styrer hvilke øvelser som vises.</p>
        </div>

        <div>
          <label className={LABEL_CLASS} htmlFor="sett-lagnavn">Ditt lagnavn</label>
          <input id="sett-lagnavn" value={home} onChange={e => setHome(e.target.value)}
            className={INPUT_CLASS} placeholder="Eks: Sotra SK" />
        </div>

        <div className="pt-1 border-t border-rule">
          <div className="pt-4">
            <DataSection />
          </div>
        </div>
      </div>
    </Modal>
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
  const { theme, toggleTheme } = useTheme();

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
  // Kalk: sidefelt til venstre i stedet for toppmeny. Taktikkene ligger i sidefeltet.
  const DesktopLayout = useMemo(() => {
    return (
      <div className="flex h-[100dvh] overflow-hidden bg-canvas text-ink">
        <Sidebar
          currentView={currentView}
          onNavigate={setView}
          teamName={homeTeamName}
          onOpenSmartCoach={() => setShowSmartCoach(true)}
          onOpenReport={() => setShowMatchReport(true)}
          onOpenSettings={() => setShowSettings(true)}
        />

        <main className="flex flex-1 min-w-0 overflow-hidden relative">
          {currentView === 'board' && (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden animate-in fade-in">
              <TacticBoard
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={setSelectedPlayerId}
                onFullscreen={() => setShowFullscreenBoard(true)}
              />
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
    const headerBtn = 'tap-auto w-9 h-9 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors';
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-canvas text-ink">
        <header className="flex-shrink-0 flex items-center gap-1 pl-4 pr-2 bg-canvas-sunken border-b border-rule h-14 z-40">
          <span className="font-serif text-[1.375rem] leading-none text-ink truncate">
            {homeTeamName || 'Taktikkboard'}
          </span>
          <div className="flex-1" />
          {currentView === 'board' && (
            <button onClick={() => setShowSmartCoach(true)} aria-label="Smart Coach" className={headerBtn}>
              <Lightbulb size={17} strokeWidth={1.75} />
            </button>
          )}
          <button onClick={toggleTheme} aria-label={theme === 'light' ? 'Bytt til kveld' : 'Bytt til dagslys'} className={headerBtn}>
            {theme === 'light' ? <Moon size={17} strokeWidth={1.75} /> : <Sun size={17} strokeWidth={1.75} />}
          </button>
          <button onClick={() => setShowSettings(true)} aria-label="Innstillinger" className={headerBtn}>
            <Settings size={17} strokeWidth={1.75} />
          </button>
        </header>

        <nav aria-label="Hovedmeny" className="flex-shrink-0 flex border-b border-rule bg-canvas-sunken relative z-40">
          {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
            const isActive = currentView === view;
            return (
              <button key={view} onClick={() => setView(view)} aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 py-2 relative min-h-[52px] transition-colors',
                  isActive ? 'text-ink' : 'text-ink-subtle hover:text-ink-muted',
                )}>
                <Icon size={18} strokeWidth={1.75} />
                <span className="font-mono text-[9px] uppercase tracking-[0.08em]">{label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-signal rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-h-0 overflow-hidden relative">
          {currentView === 'board' && (
            /* Brettet eier nå sine egne linjer over og under banen (se TacticBoard). */
            <TacticBoard selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
          )}
          {/* DrillsView scroller selv (egen filterrad + liste), så ingen overflow-y her. */}
          {currentView === 'drills' && <div className="h-full overflow-hidden"><DrillsView /></div>}
          {currentView === 'calendar' && <div className="h-full overflow-y-auto">{calendarView}</div>}
          {currentView === 'training' && <div className="h-full overflow-y-auto">{trainingView}</div>}
        </div>
      </div>
    );
  }, [currentView, homeTeamName, selectedPlayerId, selectedTraining, setView, theme, toggleTheme]);

  // ─── BETINGEDE RETURNS ─────────────────────────────────────────
  if (isDesktop === null) return null;

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
      {isDesktop ? DesktopLayout : MobileLayout}

      {showSmartCoach  && <SmartCoach onClose={() => setShowSmartCoach(false)} />}
      {showMatchReport && <MatchReportModal onClose={() => setShowMatchReport(false)} />}
      {showSettings    && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showFullscreenBoard && (
        <FullscreenBoard onClose={() => setShowFullscreenBoard(false)} interactive />
      )}
      {/* MIDLERTIDIG: vises bare med ?debug=draw. */}
      <DrawDebugOverlay />
    </>
  );
}
