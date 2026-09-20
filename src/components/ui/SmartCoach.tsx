'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Timer, BookOpen, Play, Pause, RotateCcw, CalendarDays, AlertTriangle,
  Target, Pin, ChevronLeft, ChevronRight, Check,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ALL_DRILLS, getDrillsByAgeGroup } from '@/data/drills';
import { Modal, Badge } from '@/components/ui';
import { PRIMARY_BTN, SECONDARY_BTN, toggleClass } from '@/lib/formClasses';
import type { DrillExercise } from '@/types';

/** ISO-ukenummer (samme beregning som i DrillsView). */
function getWeekInfo(date = new Date()): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

/**
 * Deterministisk «tilfeldig» utvalg: samme uke gir samme øvelser,
 * ny uke gir nytt utvalg. Seeded shuffle (mulberry32) av øvelsene.
 */
function pickWeekly(drills: DrillExercise[], count: number, seed: number): DrillExercise[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pool = [...drills];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

const WEEKLY_COUNT = 5;

// ═══════════════════════════════════════════════════════════════
//  SMART COACH – Kampklokke · Ukentlige øvelser
//  Kalk: én aksent (signal) på «nå» og primærhandling. Resten grafitt.
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: 'timer'  as const, label: 'Klokke',  icon: Timer },
  { id: 'drills' as const, label: 'Øvelser', icon: BookOpen },
];

export const SmartCoach: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<'timer' | 'drills'>('timer');

  return (
    <Modal
      onClose={onClose}
      size="md"
      title={<span className="font-serif text-[1.5rem] leading-tight">Smart Coach</span>}
      subtitle={
        <div role="tablist" aria-label="Smart Coach" className="flex gap-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-ctl
                text-body font-semibold transition-colors ${toggleClass(tab === id)}`}
            >
              <Icon size={14} strokeWidth={1.75} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      }
    >
      {tab === 'timer' ? <TimerTab /> : <DrillsTab />}
    </Modal>
  );
};

// ═══ KAMPKLOKKE ══════════════════════════════════════════════

const TimerTab: React.FC = () => {
  const { matchTimer, startTimer, stopTimer, resetTimer } = useAppStore();

  const [display, setDisplay] = useState(matchTimer.elapsed);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const { matchTimer: mt } = useAppStore.getState();
      const elapsed = mt.running && mt.startedAt
        ? mt.elapsed + Math.floor((Date.now() - mt.startedAt) / 1000)
        : mt.elapsed;
      setDisplay(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div>
      <div className="text-center mb-6">
        <div
          className={`font-mono text-[52px] leading-none tabular-nums tracking-tight
            ${matchTimer.running ? 'text-signal' : display > 0 ? 'text-ink' : 'text-ink-faint'}`}
        >
          {fmt(display)}
        </div>
        <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mt-2">
          {matchTimer.running ? 'Kamp pågår' : display > 0 ? 'Pauset' : 'Ikke startet'}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={matchTimer.running ? stopTimer : startTimer}
          className={`flex-1 ${matchTimer.running ? SECONDARY_BTN : PRIMARY_BTN}`}
        >
          {matchTimer.running
            ? <><Pause size={15} strokeWidth={2} aria-hidden /> Pause</>
            : <><Play size={15} strokeWidth={2} aria-hidden /> Start</>}
        </button>
        <button onClick={resetTimer} className={SECONDARY_BTN}>
          <RotateCcw size={15} strokeWidth={1.75} aria-hidden /> Nullstill
        </button>
      </div>
    </div>
  );
};

// ═══ ØVELSESBIBLIOTEK ══════════════════════════════════════════

const Section: React.FC<{ title: string; bullet: string; items: string[] }> = ({ title, bullet, items }) => (
  <div className="mb-4">
    <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-1.5">{title}</div>
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-body text-ink-muted flex gap-2">
          <span aria-hidden className="text-ink-faint flex-shrink-0">{bullet}</span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const DrillsTab: React.FC = () => {
  const { updateStickyNote, ageGroup } = useAppStore();

  const [activeDrill, setActiveDrill] = useState<DrillExercise | null>(null);
  const [activeStep, setActiveStep]   = useState(0);
  const [showAll, setShowAll]         = useState(false);

  const { week, year } = useMemo(() => getWeekInfo(), []);
  const allDrills = useMemo(() => getDrillsByAgeGroup(ageGroup), [ageGroup]);
  const weeklyDrills = useMemo(
    () => pickWeekly(
      ALL_DRILLS.filter(d => d.ageGroup === ageGroup),
      WEEKLY_COUNT,
      year * 100 + week + (ageGroup === 'youth' ? 0 : 7919),
    ),
    [ageGroup, week, year],
  );
  const displayed = showAll ? allDrills : weeklyDrills;

  const applyNote = (drill: DrillExercise, stepIdx: number) => {
    const step = drill.steps[stepIdx];
    if (!step) return;
    const lines = [`${drill.name} · Steg ${stepIdx + 1}: ${step.name || step.description}`];
    drill.coachingPoints.slice(0, 3).forEach(p => lines.push(`• ${p}`));
    updateStickyNote(lines.join('\n'));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">Fotball</span>
        <Badge tone="neutral">{ageGroup === 'youth' ? 'Barn' : 'Voksen'}</Badge>
      </div>

      {!activeDrill ? (
        <>
          {!showAll && (
            <div className="flex items-center gap-2.5 mb-3 px-3 py-2.5 rounded-panel bg-canvas-sunken shadow-hair">
              <CalendarDays size={16} strokeWidth={1.75} aria-hidden className="text-ink-faint flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-body font-bold text-ink">Uke {week} – ukens øvelser</div>
                <div className="text-meta text-ink-subtle">Roterer automatisk neste uke</div>
              </div>
              <button onClick={() => setShowAll(true)}
                className="ml-auto flex-shrink-0 inline-flex items-center gap-1 px-2 min-h-[36px]
                  text-meta text-ink-subtle hover:text-signal transition-colors">
                Vis alle <ChevronRight size={13} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          )}

          {showAll && (
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setShowAll(false)}
                className="inline-flex items-center gap-1 px-2 min-h-[36px] text-meta text-ink-subtle hover:text-signal transition-colors">
                <ChevronLeft size={13} strokeWidth={1.75} aria-hidden /> Tilbake til ukas øvelser
              </button>
              <span className="text-meta text-ink-faint">({allDrills.length} totalt)</span>
            </div>
          )}

          <div className="space-y-2">
            {displayed.length === 0 ? (
              <p className="text-body text-ink-subtle text-center py-6">
                Ingen øvelser for {ageGroup === 'youth' ? 'barn' : 'voksne'}.
              </p>
            ) : (
              displayed.map((d, idx) => (
                <button key={d.id}
                  onClick={() => { setActiveDrill(d); setActiveStep(0); }}
                  className="w-full text-left p-3 rounded-panel bg-canvas-sunken shadow-hair
                    hover:bg-canvas-hover transition-colors min-h-[44px]">
                  <div className="flex items-start gap-2.5">
                    {!showAll && (
                      <span className="h-6 w-6 flex-shrink-0 mt-0.5 rounded-full bg-signal/15 shadow-hair-signal
                        flex items-center justify-center font-mono text-meta text-signal">
                        {idx + 1}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-body font-bold text-ink">{d.name}</div>
                      <div className="text-body text-ink-muted mt-0.5 leading-relaxed">{d.description}</div>
                      <div className="text-meta text-ink-faint mt-1">{d.steps.length} steg</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <div>
          <button onClick={() => setActiveDrill(null)}
            className="inline-flex items-center gap-1 px-2 min-h-[36px] mb-3 text-meta text-ink-subtle hover:text-signal transition-colors">
            <ChevronLeft size={13} strokeWidth={1.75} aria-hidden /> Tilbake til liste
          </button>

          <h3 className="text-h4 text-ink mb-2">{activeDrill.name}</h3>

          {activeDrill.warning && (
            <div className="flex gap-3 rounded-panel border border-warn-500/40 bg-warn-500/10 p-3 mb-3">
              <AlertTriangle size={16} strokeWidth={1.75} aria-hidden className="text-warn-400 flex-shrink-0 mt-0.5" />
              <p className="text-body text-warn-300 leading-relaxed">{activeDrill.warning}</p>
            </div>
          )}

          <p className="text-body text-ink-muted mb-2 leading-relaxed">{activeDrill.description}</p>
          {activeDrill.why && (
            <p className="text-body text-ink-muted mb-4 leading-relaxed flex gap-2">
              <Target size={14} strokeWidth={1.75} aria-hidden className="text-ink-faint flex-shrink-0 mt-1" />
              <span><span className="font-bold text-ink">Hvorfor: </span>{activeDrill.why}</span>
            </p>
          )}

          <div className="flex gap-1.5 mb-4">
            {activeDrill.steps.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                aria-label={`Steg ${i + 1}`}
                className="flex-1 py-2 flex items-center">
                <span className={`block w-full h-1.5 rounded-full transition-colors
                  ${i === activeStep ? 'bg-signal' : i < activeStep ? 'bg-signal/35' : 'bg-rule-strong'}`} />
              </button>
            ))}
          </div>

          {activeDrill.steps[activeStep] && (
            <div className="rounded-panel bg-canvas-sunken shadow-hair p-3 mb-4">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="h-7 w-7 flex-shrink-0 rounded-full bg-signal/15 shadow-hair-signal
                  flex items-center justify-center font-mono text-meta text-signal">
                  {activeStep + 1}
                </span>
                <span className="text-body font-bold text-ink">
                  {activeDrill.steps[activeStep].name || `Steg ${activeStep + 1}`}
                </span>
              </div>
              <p className="text-body text-ink-muted leading-relaxed pl-9">
                {activeDrill.steps[activeStep].description}
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-2">
            <button onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              className={`flex-1 ${SECONDARY_BTN} disabled:opacity-30`}>
              <ChevronLeft size={15} strokeWidth={1.75} aria-hidden /> Forrige
            </button>
            {activeStep < activeDrill.steps.length - 1 ? (
              <button onClick={() => setActiveStep(s => s + 1)} className={`flex-1 ${PRIMARY_BTN}`}>
                Neste steg <ChevronRight size={15} strokeWidth={2} aria-hidden />
              </button>
            ) : (
              <button onClick={() => setActiveDrill(null)} className={`flex-1 ${PRIMARY_BTN}`}>
                <Check size={15} strokeWidth={2} aria-hidden /> Ferdig
              </button>
            )}
          </div>

          <button onClick={() => applyNote(activeDrill, activeStep)}
            className={`w-full mb-4 ${SECONDARY_BTN}`}>
            <Pin size={15} strokeWidth={1.75} aria-hidden /> Fest til fase-notat
          </button>

          {([
            { title: 'Coachingpunkter', items: activeDrill.coachingPoints, bullet: '✦' },
            { title: 'Vanlige feil',    items: activeDrill.commonMistakes, bullet: '✕' },
            { title: 'Variasjoner',     items: activeDrill.variations,     bullet: '↳' },
          ]).filter(sec => sec.items.length > 0).map(sec => (
            <Section key={sec.title} title={sec.title} bullet={sec.bullet} items={sec.items} />
          ))}
        </div>
      )}
    </div>
  );
};
