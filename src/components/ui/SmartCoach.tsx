'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DRILL_LIBRARY, getDrillsForContext } from '../../data/drills';
import { Drill } from '../../types';

// ═══════════════════════════════════════════════════════════════
//  SMART COACH – Kampklokke + Bytteplan + Øvelsesbibliotek
// ═══════════════════════════════════════════════════════════════

export const SmartCoach: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<'timer' | 'subs' | 'drills'>('timer');

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl w-[480px] max-w-full max-h-[88vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e3050]">
          <h2 className="text-sm font-black text-slate-100">⚡ Smart Coach</h2>
          <button onClick={onClose} className="text-[#3a5070] hover:text-white text-xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e3050] flex-shrink-0">
          {([
            ['timer', '⏱ Klokke'],
            ['subs',  '🔄 Bytteplan'],
            ['drills','📚 Øvelser'],
          ] as const).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[11.5px] font-semibold transition-all
                ${tab === t ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070] hover:text-slate-400'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'timer'  && <TimerTab />}
          {tab === 'subs'   && <SubsTab />}
          {tab === 'drills' && <DrillsTab />}
        </div>
      </div>
    </div>
  );
};

// ─── KAMPKLOKKE ──────────────────────────────────────────────

const TimerTab: React.FC = () => {
  const { matchTimer, startTimer, stopTimer, resetTimer,
    phases, activePhaseIdx, togglePlayerOnField, addMinutesPlayed } = useAppStore();

  const [display, setDisplay] = useState(matchTimer.elapsed);
  const rafRef = useRef<number | null>(null);
  const [subAlert, setSubAlert] = useState<string | null>(null);
  const prevMinuteRef = useRef(Math.floor(matchTimer.elapsed / 60));

  // Live-oppdatering av klokken
  useEffect(() => {
    const tick = () => {
      const { matchTimer: mt } = useAppStore.getState();
      const live = mt.running && mt.startedAt
        ? mt.elapsed + Math.floor((Date.now() - mt.startedAt) / 1000)
        : mt.elapsed;
      setDisplay(live);

      // Sjekk byttevarsel hvert 10. minutt
      const currentMin = Math.floor(live / 60);
      if (currentMin > 0 && currentMin !== prevMinuteRef.current && currentMin % 10 === 0) {
        setSubAlert(`⏰ ${currentMin} min – tid for spillerbytter!`);
        prevMinuteRef.current = currentMin;
        setTimeout(() => setSubAlert(null), 8000);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const fmt = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const phase = phases[activePhaseIdx];
  const players = phase?.players.filter(p => p.team === 'home') ?? [];

  return (
    <div>
      {/* Klokke-display */}
      <div className="flex flex-col items-center mb-6">
        <div className="text-6xl font-black text-slate-100 tabular-nums tracking-tight mb-4"
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          {fmt(display)}
        </div>
        <div className="flex gap-2">
          <button onClick={() => matchTimer.running ? stopTimer() : startTimer()}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm border transition-all
              ${matchTimer.running
                ? 'bg-red-500/15 border-red-500 text-red-400 hover:bg-red-500/25'
                : 'bg-emerald-500/15 border-emerald-500 text-emerald-400 hover:bg-emerald-500/25'}`}>
            {matchTimer.running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={resetTimer}
            className="px-4 py-2.5 rounded-xl font-bold text-sm border border-[#1e3050] text-[#4a6080] hover:text-red-400 hover:border-red-500/40 transition">
            ↺ Null
          </button>
        </div>

        {/* Bytte-varsel */}
        {subAlert && (
          <div className="mt-4 px-4 py-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-400 text-[12px] font-bold text-center animate-pulse">
            {subAlert}
          </div>
        )}
      </div>

      {/* Spilletids-oversikt */}
      <div className="mb-4">
        <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">
          Spilletid – Hjemmelag
        </div>
        <div className="space-y-1.5">
          {players.map(p => {
            const min = p.minutesPlayed ?? 0;
            const ptColor = min > 60 ? '#ef4444' : min > 30 ? '#f59e0b' : '#22c55e';
            const barW = Math.min(100, (min / 90) * 100);
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                  style={{ background: ptColor }}>
                  {p.num}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[11px] text-slate-300">{p.name || `#${p.num}`}</span>
                    <span className="text-[11px] font-bold" style={{ color: ptColor }}>{min} min</span>
                  </div>
                  <div className="h-1 bg-[#1e3050] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${barW}%`, background: ptColor }} />
                  </div>
                </div>
                <button onClick={() => addMinutesPlayed(activePhaseIdx, p.id, 10)}
                  className="text-[10px] text-[#3a5070] hover:text-sky-400 px-1">＋10</button>
                <button
                  onClick={() => togglePlayerOnField(activePhaseIdx, p.id)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-all
                    ${p.isOnField
                      ? 'text-emerald-400 border-emerald-500/40'
                      : 'text-[#4a6080] border-[#1e3050] hover:text-slate-300'}`}>
                  {p.isOnField ? '✅' : '🪑'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-[#3a5070] text-center">
        🟢 &lt;30 min · 🟡 30–60 min · 🔴 &gt;60 min spilt
      </p>
    </div>
  );
};

// ─── BYTTEPLAN ───────────────────────────────────────────────

const SubsTab: React.FC = () => {
  const { getSubstitutionSuggestions, phases, activePhaseIdx,
    addMinutesPlayed, togglePlayerOnField } = useAppStore();
  const [interval, setInterval_] = useState(10);
  const suggestions = getSubstitutionSuggestions(activePhaseIdx, interval);
  const phase = phases[activePhaseIdx];

  const allHome = phase?.players.filter(p => p.team === 'home') ?? [];
  const onField = allHome.filter(p => p.isOnField);
  const onBench = allHome.filter(p => !p.isOnField);

  const applySwap = (outId: string, inId: string) => {
    togglePlayerOnField(activePhaseIdx, outId);
    togglePlayerOnField(activePhaseIdx, inId);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] text-[#4a6080]">Bytte-intervall:</span>
        {[5, 10, 15, 20].map(n => (
          <button key={n} onClick={() => setInterval_(n)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all
              ${interval === n
                ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
            {n} min
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050] text-center">
          <div className="text-xl font-black text-emerald-400">{onField.length}</div>
          <div className="text-[10px] text-[#3a5070]">På banen</div>
        </div>
        <div className="flex-1 bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050] text-center">
          <div className="text-xl font-black text-amber-400">{onBench.length}</div>
          <div className="text-[10px] text-[#3a5070]">Benk</div>
        </div>
        <div className="flex-1 bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050] text-center">
          <div className="text-xl font-black text-sky-400">{allHome.length}</div>
          <div className="text-[10px] text-[#3a5070]">Totalt</div>
        </div>
      </div>

      {/* Forslag */}
      {suggestions.length > 0 ? (
        <div>
          <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">
            Anbefalte bytter
          </div>
          {suggestions.map((s, i) => {
            const out = phase?.players.find(p => p.id === s.outPlayerId);
            const inn = phase?.players.find(p => p.id === s.inPlayerId);
            if (!out || !inn) return null;
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] mb-2">
                <div className="flex-1">
                  <div className="text-[11.5px] font-semibold text-slate-200">
                    Min {s.atMinute}: <span className="text-red-400">↓ {out.name || '#' + out.num}</span>
                    {' → '}<span className="text-emerald-400">↑ {inn.name || '#' + inn.num}</span>
                  </div>
                  <div className="text-[10px] text-[#4a6080] mt-0.5">{s.reason}</div>
                </div>
                <button onClick={() => applySwap(s.outPlayerId, s.inPlayerId)}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-bold hover:bg-sky-500/25 whitespace-nowrap">
                  Byt
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-[12px] text-[#4a6080]">
            {onBench.length === 0
              ? 'Ingen spillere på benken – legg til spillere med 🪑-knappen i Klokke-fanen'
              : 'Alle spillere har tilnærmet lik spilletid'}
          </p>
        </div>
      )}

      {/* Manuell bytteliste */}
      {onField.length > 0 && onBench.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">Manuelt bytte</div>
          <ManualSubForm
            onField={onField}
            onBench={onBench}
            onSwap={(outId, inId) => applySwap(outId, inId)}
          />
        </div>
      )}
    </div>
  );
};

const ManualSubForm: React.FC<{
  onField: any[];
  onBench: any[];
  onSwap: (outId: string, inId: string) => void;
}> = ({ onField, onBench, onSwap }) => {
  const [outId, setOutId] = useState('');
  const [inId, setInId]   = useState('');
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <div className="text-[9.5px] text-[#3a5070] mb-1">Ut</div>
        <select value={outId} onChange={e => setOutId(e.target.value)}
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-2 py-1.5 text-[11.5px] text-slate-300 focus:outline-none">
          <option value="">– velg –</option>
          {onField.map(p => <option key={p.id} value={p.id}>#{p.num} {p.name}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <div className="text-[9.5px] text-[#3a5070] mb-1">Inn</div>
        <select value={inId} onChange={e => setInId(e.target.value)}
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-2 py-1.5 text-[11.5px] text-slate-300 focus:outline-none">
          <option value="">– velg –</option>
          {onBench.map(p => <option key={p.id} value={p.id}>#{p.num} {p.name}</option>)}
        </select>
      </div>
      <button onClick={() => { if (outId && inId) { onSwap(outId, inId); setOutId(''); setInId(''); } }}
        disabled={!outId || !inId}
        className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-bold hover:bg-sky-500/25 disabled:opacity-40">
        Byt
      </button>
    </div>
  );
};

// ─── ØVELSESBIBLIOTEK ────────────────────────────────────────

const DrillsTab: React.FC = () => {
  const { sport, phases, activePhaseIdx, updateStickyNote } = useAppStore();
  const [ageGroup, setAgeGroup]       = useState<'youth' | 'adult'>('adult');
  const [activeDrill, setActiveDrill] = useState<Drill | null>(null);
  const [activeStep, setActiveStep]   = useState(0);

  const drills = getDrillsForContext(sport, ageGroup);

  const applyDrillNote = (drill: Drill, stepIdx: number) => {
    const step = drill.steps[stepIdx];
    if (!step) return;
    updateStickyNote(activePhaseIdx, `${drill.name} · Steg ${stepIdx + 1}: ${step.name}`);
  };

  return (
    <div>
      {/* Aldersgruppe */}
      <div className="flex gap-2 mb-4">
        {([['youth', '👦 Barneidrett (5er/7er)'], ['adult', '👨 Voksenidrett']] as const).map(([ag, lbl]) => (
          <button key={ag} onClick={() => { setAgeGroup(ag); setActiveDrill(null); }}
            className={`flex-1 py-2 rounded-xl text-[11.5px] font-bold border transition-all
              ${ageGroup === ag
                ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Drill-liste eller detalj */}
      {!activeDrill ? (
        <div className="space-y-2">
          {drills.length === 0 ? (
            <p className="text-[12px] text-[#4a6080] text-center py-6">
              Ingen øvelser for denne kombinasjonen ennå.
            </p>
          ) : (
            drills.map(d => (
              <button key={d.id} onClick={() => { setActiveDrill(d); setActiveStep(0); }}
                className="w-full text-left p-3.5 bg-[#0f1a2a] rounded-xl border border-[#1e3050] hover:border-[#2e4060] transition-all">
                <div className="text-[12.5px] font-bold text-slate-200">{d.name}</div>
                <div className="text-[11px] text-[#4a6080] mt-0.5">{d.description}</div>
                <div className="text-[10px] text-sky-500/70 mt-1">{d.steps.length} steg</div>
              </button>
            ))
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => setActiveDrill(null)}
            className="text-[11px] text-[#4a6080] hover:text-sky-400 mb-3 flex items-center gap-1">
            ‹ Tilbake til liste
          </button>

          <h3 className="text-sm font-black text-slate-100 mb-1">{activeDrill.name}</h3>
          <p className="text-[11.5px] text-[#7a9ab8] mb-4 leading-relaxed">{activeDrill.description}</p>

          {/* Steg-indikator */}
          <div className="flex gap-1.5 mb-4">
            {activeDrill.steps.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                className={`flex-1 h-1.5 rounded-full transition-all
                  ${i === activeStep ? 'bg-sky-400' : i < activeStep ? 'bg-sky-800' : 'bg-[#1e3050]'}`} />
            ))}
          </div>

          {/* Aktivt steg */}
          {activeDrill.steps[activeStep] && (
            <div className="bg-[#0f1a2a] rounded-xl p-4 border border-[#1e3050] mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-[11px] font-black flex items-center justify-center">
                  {activeStep + 1}
                </span>
                <span className="text-[13px] font-bold text-slate-200">
                  {activeDrill.steps[activeStep].name}
                </span>
              </div>
              <p className="text-[12px] text-[#7a9ab8] leading-relaxed pl-8">
                {activeDrill.steps[activeStep].description}
              </p>
            </div>
          )}

          {/* Navigasjon */}
          <div className="flex gap-2">
            <button onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              className="flex-1 py-2 rounded-xl border border-[#1e3050] text-[#4a6080] text-[12px] font-bold hover:text-slate-300 disabled:opacity-30">
              ‹ Forrige
            </button>
            {activeStep < activeDrill.steps.length - 1 ? (
              <button onClick={() => setActiveStep(s => s + 1)}
                className="flex-1 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[12px] font-bold hover:bg-sky-500/25">
                Neste steg ›
              </button>
            ) : (
              <button onClick={() => setActiveDrill(null)}
                className="flex-1 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[12px] font-bold hover:bg-emerald-500/25">
                ✓ Ferdig
              </button>
            )}
          </div>

          {/* Fest til fase */}
          <button onClick={() => applyDrillNote(activeDrill, activeStep)}
            className="w-full mt-2 py-1.5 rounded-lg border border-amber-500/30 text-amber-400/70 text-[11px] hover:text-amber-400 transition">
            📌 Fest dette steget som fase-notat
          </button>
        </div>
      )}
    </div>
  );
};
