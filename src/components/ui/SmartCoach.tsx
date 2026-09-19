'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DRILL_LIBRARY, getDrillsForContext, getWeeklyDrills, getISOWeek, toDrillSport } from '@/data/drills';
import { Drill } from '@/types';

// ═══════════════════════════════════════════════════════════════
//  SMART COACH – Kampklokke · Ukentlige øvelser (RESPONSIV)
// ═══════════════════════════════════════════════════════════════

export const SmartCoach: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<'timer' | 'drills'>('timer');

  const allTabs = [
    { id: 'timer' as const, label: '⏱ Klokke' },
    { id: 'drills' as const, label: '📚 Øvelser' },
  ];

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}>
      <div
        className="bg-[#0c1525] border border-[#1e3050] rounded-2xl w-full max-w-[500px]
          max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[#1e3050] flex-shrink-0">
          <h2 className="text-xs sm:text-sm font-black text-slate-100">⚡ Smart Coach</h2>
          <button onClick={onClose} className="text-[#3a5070] hover:text-white text-xl min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>

        <div className="flex border-b border-[#1e3050] flex-shrink-0">
          {allTabs.map((t) => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-[12px] font-semibold transition-all min-h-[44px]
                ${tab === t.id ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070] hover:text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {tab === 'timer'  && <TimerTab />}
          {tab === 'drills' && <DrillsTab />}
        </div>
      </div>
    </div>
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
      <div className="text-center mb-5">
        <div className={`text-[44px] sm:text-[52px] font-black tabular-nums tracking-tight
          ${matchTimer.running ? 'text-emerald-400' : display > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
          {fmt(display)}
        </div>
        <div className="text-[10px] sm:text-[11px] text-[#3a5070] mt-0.5">
          {matchTimer.running ? 'Kamp pågår' : display > 0 ? 'Pauset' : 'Ikke startet'}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={matchTimer.running ? stopTimer : startTimer}
          className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-[12px] sm:text-[13px] border transition-all min-h-[44px] sm:min-h-[48px]
            ${matchTimer.running
              ? 'bg-red-500/15 border-red-500 text-red-400 hover:bg-red-500/25'
              : 'bg-emerald-500/15 border-emerald-500 text-emerald-400 hover:bg-emerald-500/25'}`}>
          {matchTimer.running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button onClick={resetTimer}
          className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-[#1e3050] text-[#4a6080]
            hover:text-red-400 text-[11px] sm:text-[12px] font-bold transition min-h-[44px] sm:min-h-[48px]">
          ↺ Reset
        </button>
      </div>
    </div>
  );
};

// ═══ ØVELSESBIBLIOTEK ══════════════════════════════════════════

const DrillsTab: React.FC = () => {
  const { sport, phases, activePhaseIdx, updateStickyNote, ageGroup: storeAgeGroup } = useAppStore();

  const [activeDrill, setActiveDrill] = useState<Drill | null>(null);
  const [activeStep, setActiveStep]   = useState(0);
  const [showAll, setShowAll]         = useState(false);

  const ageGroup = storeAgeGroup;

  const week        = getISOWeek();
  const weeklyDrills = getWeeklyDrills(toDrillSport(sport), ageGroup);
  const allDrills    = getDrillsForContext(toDrillSport(sport), ageGroup);
  const displayed    = showAll ? allDrills : weeklyDrills;

  const sportLabel: Record<string, string> = {
    football: 'Fotball 11er', football5: 'Fotball 5er', football7: 'Fotball 7er', football9: 'Fotball 9er',
  };

  const applyNote = (drill: Drill, stepIdx: number) => {
    const step = drill.steps[stepIdx];
    if (!step) return;
    updateStickyNote(activePhaseIdx, `${drill.name} · Steg ${stepIdx + 1}: ${step.name}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">{sportLabel[sport] ?? sport}</span>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-1 rounded-xl text-[9px] sm:text-[10px] font-bold ${
            ageGroup === 'youth' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
          }`}>
            {ageGroup === 'youth' ? '🧒 Barn' : '🧑 Voksen'}
          </span>
        </div>
      </div>

      {!activeDrill ? (
        <>
          {!showAll && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl
              bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 text-[13px]">📅</span>
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold text-amber-400">
                  Uke {week} – ukens øvelser
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#4a6080]">
                  Roterer automatisk neste uke
                </div>
              </div>
              <button onClick={() => setShowAll(true)}
                className="ml-auto text-[9px] sm:text-[10px] text-[#4a6080] hover:text-sky-400 transition min-h-[44px] px-2">
                Vis alle →
              </button>
            </div>
          )}

          {showAll && (
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setShowAll(false)}
                className="text-[9px] sm:text-[10px] text-[#4a6080] hover:text-sky-400 transition min-h-[44px] px-2">
                ← Tilbake til ukas øvelser
              </button>
              <span className="text-[9px] sm:text-[10px] text-[#3a5070]">({allDrills.length} totalt)</span>
            </div>
          )}

          <div className="space-y-2">
            {displayed.length === 0 ? (
              <p className="text-[11px] sm:text-[12px] text-[#4a6080] text-center py-6">
                Ingen øvelser for {ageGroup === 'youth' ? 'barne-' : 'voksen-'}{sportLabel[sport]}.
              </p>
            ) : (
              displayed.map((d, idx) => (
                <button key={d.id}
                  onClick={() => { setActiveDrill(d); setActiveStep(0); }}
                  className="w-full text-left p-3 sm:p-3.5 bg-[#0f1a2a] rounded-xl border
                    border-[#1e3050] hover:border-[#2e4060] transition-all min-h-[44px]">
                  <div className="flex items-start gap-2">
                    {!showAll && (
                      <span className="w-6 h-6 rounded-full bg-sky-500/15 border border-sky-500/20
                        text-sky-400 text-[10px] font-black flex items-center justify-center
                        shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                    )}
                    <div className="flex-1">
                      <div className="text-[11px] sm:text-[12.5px] font-bold text-slate-200">{d.name}</div>
                      <div className="text-[10px] sm:text-[11px] text-[#4a6080] mt-0.5 leading-relaxed">
                        {d.description}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-sky-500/60 mt-1">{d.steps.length} steg</div>
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
            className="text-[10px] sm:text-[11px] text-[#4a6080] hover:text-sky-400 mb-3 flex items-center gap-1 min-h-[44px]">
            ‹ Tilbake til liste
          </button>

          <h3 className="text-xs sm:text-sm font-black text-slate-100 mb-1">{activeDrill.name}</h3>
          <p className="text-[10px] sm:text-[11.5px] text-[#7a9ab8] mb-4 leading-relaxed">
            {activeDrill.description}
          </p>

          <div className="flex gap-1.5 mb-4">
            {activeDrill.steps.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                className={`flex-1 h-2 rounded-full transition-all min-h-[20px]
                  ${i === activeStep ? 'bg-sky-400'
                    : i < activeStep ? 'bg-sky-800' : 'bg-[#1e3050]'}`} />
            ))}
          </div>

          {activeDrill.steps[activeStep] && (
            <div className="bg-[#0f1a2a] rounded-xl p-3 sm:p-4 border border-[#1e3050] mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
                <span className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40
                  text-sky-400 text-[11px] sm:text-[12px] font-black flex items-center justify-center shrink-0">
                  {activeStep + 1}
                </span>
                <span className="text-[12px] sm:text-[13px] font-bold text-slate-200">
                  {activeDrill.steps[activeStep].name}
                </span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-[#7a9ab8] leading-relaxed pl-9">
                {activeDrill.steps[activeStep].description}
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-2">
            <button onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              className="flex-1 py-2.5 rounded-xl border border-[#1e3050] text-[#4a6080]
                text-[11px] sm:text-[12px] font-bold hover:text-slate-300 disabled:opacity-30 min-h-[44px]">
              ‹ Forrige
            </button>
            {activeStep < activeDrill.steps.length - 1 ? (
              <button onClick={() => setActiveStep(s => s + 1)}
                className="flex-1 py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30
                  text-sky-400 text-[11px] sm:text-[12px] font-bold hover:bg-sky-500/25 min-h-[44px]">
                Neste steg ›
              </button>
            ) : (
              <button onClick={() => setActiveDrill(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30
                  text-emerald-400 text-[11px] sm:text-[12px] font-bold hover:bg-emerald-500/25 min-h-[44px]">
                ✓ Ferdig
              </button>
            )}
          </div>

          <button onClick={() => applyNote(activeDrill, activeStep)}
            className="w-full py-2 rounded-xl border border-amber-500/30 text-amber-400/70
              text-[10px] sm:text-[11px] hover:text-amber-400 transition min-h-[44px]">
            📌 Fest til fase-notat
          </button>
        </div>
      )}
    </div>
  );
};