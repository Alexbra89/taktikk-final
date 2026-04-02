'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DRILL_LIBRARY, getDrillsForContext, getWeeklyDrills, getISOWeek, toDrillSport } from '@/data/drills';
import { Drill } from '@/types';

// ═══════════════════════════════════════════════════════════════
//  SMART COACH – Kampklokke · Bytteplan · Ukentlige øvelser
// ═══════════════════════════════════════════════════════════════

export const SmartCoach: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { sport } = useAppStore();
  const [tab, setTab] = useState<'timer' | 'subs' | 'drills'>('timer');
  
  // Bytteplan kun for håndball og 7er fotball
  const showSubsTab = sport === 'handball' || sport === 'football7';
  
  // Definer tabs basert på sport
  const allTabs = [
    { id: 'timer' as const, label: '⏱ Klokke' },
    ...(showSubsTab ? [{ id: 'subs' as const, label: '🔄 Bytteplan' }] : []),
    { id: 'drills' as const, label: '📚 Øvelser' },
  ];

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-[#0c1525] border border-[#1e3050] rounded-2xl w-full max-w-[500px]
          max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e3050] flex-shrink-0">
          <h2 className="text-sm font-black text-slate-100">⚡ Smart Coach</h2>
          <button onClick={onClose} className="text-[#3a5070] hover:text-white text-xl">✕</button>
        </div>

        <div className="flex border-b border-[#1e3050] flex-shrink-0">
          {allTabs.map((t) => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-[12px] font-semibold transition-all min-h-[44px]
                ${tab === t.id ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070] hover:text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'timer'  && <TimerTab />}
          {tab === 'subs'   && showSubsTab && <SubsTab />}
          {tab === 'drills' && <DrillsTab />}
        </div>
      </div>
    </div>
  );
};

// ═══ KAMPKLOKKE ══════════════════════════════════════════════

const TimerTab: React.FC = () => {
  const { matchTimer, startTimer, stopTimer, resetTimer,
    phases, activePhaseIdx, togglePlayerOnField, addMinutesPlayed, playerAccounts } = useAppStore();

  const [display, setDisplay] = useState(matchTimer.elapsed);
  const rafRef = useRef<number | null>(null);
  const [subAlert, setSubAlert] = useState<string | null>(null);
  const prevMinuteRef = useRef(Math.floor(matchTimer.elapsed / 60));

  useEffect(() => {
    const tick = () => {
      const { matchTimer: mt } = useAppStore.getState();
      const elapsed = mt.running && mt.startedAt
        ? mt.elapsed + Math.floor((Date.now() - mt.startedAt) / 1000)
        : mt.elapsed;
      setDisplay(elapsed);
      const minute = Math.floor(elapsed / 60);
      if (minute !== prevMinuteRef.current) {
        prevMinuteRef.current = minute;
        if (minute > 0 && minute % 10 === 0) {
          setSubAlert(`⏱ ${minute}. minutt – vurder bytte!`);
          setTimeout(() => setSubAlert(null), 6000);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const phase   = phases[activePhaseIdx];
  const players = phase?.players.filter(p => p.team === 'home') ?? [];

  const getPlayerName = (player: any) => {
    const account = playerAccounts.find((a: any) => a.playerId === player.id);
    return account?.name || player.name || `#${player.num}`;
  };

  return (
    <div>
      {subAlert && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/40
          text-amber-400 text-[12.5px] font-bold text-center animate-pulse">
          {subAlert}
        </div>
      )}

      <div className="text-center mb-5">
        <div className={`text-[52px] font-black tabular-nums tracking-tight
          ${matchTimer.running ? 'text-emerald-400' : display > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
          {fmt(display)}
        </div>
        <div className="text-[11px] text-[#3a5070] mt-0.5">
          {matchTimer.running ? 'Kamp pågår' : display > 0 ? 'Pauset' : 'Ikke startet'}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={matchTimer.running ? stopTimer : startTimer}
          className={`flex-1 py-3 rounded-xl font-bold text-[13px] border transition-all min-h-[48px]
            ${matchTimer.running
              ? 'bg-red-500/15 border-red-500 text-red-400 hover:bg-red-500/25'
              : 'bg-emerald-500/15 border-emerald-500 text-emerald-400 hover:bg-emerald-500/25'}`}>
          {matchTimer.running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button onClick={resetTimer}
          className="px-4 py-3 rounded-xl border border-[#1e3050] text-[#4a6080]
            hover:text-red-400 text-[12px] font-bold transition min-h-[48px]">
          ↺ Reset
        </button>
      </div>

      <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-3">
        Spilletid per spiller
      </div>
      <div className="space-y-2">
        {players.map(p => {
          const min = p.minutesPlayed ?? 0;
          const barColor = min > 60 ? '#ef4444' : min > 30 ? '#f59e0b' : '#22c55e';
          const playerName = getPlayerName(p);
          return (
            <div key={p.id} className="flex items-center gap-2.5">
              <div className="w-24 truncate text-[11.5px] text-slate-300">
                #{p.num} {playerName}
              </div>
              <div className="flex-1 h-2 bg-[#1e3050] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (min / 90) * 100)}%`, background: barColor }} />
              </div>
              <div className="text-[11px] font-bold w-10 text-right shrink-0"
                style={{ color: barColor }}>{min}m</div>
              <button onClick={() => addMinutesPlayed(activePhaseIdx, p.id, 10)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e3050] text-[#4a6080]
                  hover:text-sky-400 transition min-w-[28px] text-center">
                +10
              </button>
              <button onClick={() => togglePlayerOnField(activePhaseIdx, p.id)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition shrink-0
                  ${p.isOnField !== false
                    ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                    : 'border-[#1e3050] text-[#4a6080]'}`}>
                {p.isOnField !== false ? '✅' : '🪑'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══ BYTTEPLAN – KUN FOR HÅNDBALL OG 7ER ═══════════════════════

const SubsTab: React.FC = () => {
  const { phases, activePhaseIdx, getSubstitutionSuggestions,
    updatePlayerField, togglePlayerOnField, matchTimer, playerAccounts } = useAppStore();

  const [intervalVal, setIntervalVal] = useState(10);
  const phase    = phases[activePhaseIdx];
  const players  = phase?.players.filter(p => p.team === 'home') ?? [];
  const onField  = players.filter(p => p.isOnField !== false);
  const onBench  = players.filter(p => p.isOnField === false);
  const elapsed  = matchTimer.elapsed + (
    matchTimer.running && matchTimer.startedAt
      ? Math.floor((Date.now() - matchTimer.startedAt) / 1000) : 0
  );
  const minute = Math.floor(elapsed / 60);
  const suggestions = getSubstitutionSuggestions(activePhaseIdx, intervalVal);

  const getPlayerName = (player: any) => {
    const account = playerAccounts.find((a: any) => a.playerId === player.id);
    return account?.name || player.name || `#${player.num}`;
  };

  const doSwap = (outId: string, inId: string) => {
    togglePlayerOnField(activePhaseIdx, outId);
    togglePlayerOnField(activePhaseIdx, inId);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 bg-[#0f1a2a] rounded-xl p-3 border border-[#1e3050]">
        <span className="text-[11px] text-[#4a6080]">Varsle hvert</span>
        {([5, 10, 15, 20] as const).map(n => (
          <button key={n} onClick={() => setIntervalVal(n)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all
              ${intervalVal === n ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
            {n}m
          </button>
        ))}
        <span className="text-[11px] text-[#3a5070] ml-auto">Min: {minute}</span>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">
            💡 Anbefalte bytter
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const out = players.find(p => p.id === s.outPlayerId);
              const inn = players.find(p => p.id === s.inPlayerId);
              if (!out || !inn) return null;
              const outName = getPlayerName(out);
              const innName = getPlayerName(inn);
              return (
                <div key={i}
                  className="flex items-center gap-2 p-3 bg-[#0f1a2a] rounded-xl border border-amber-500/20">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11.5px] text-slate-300">
                      <span className="text-red-400 font-bold">Ut: #{out.num} {outName}</span>
                      {' → '}
                      <span className="text-emerald-400 font-bold">Inn: #{inn.num} {innName}</span>
                    </div>
                    <div className="text-[10px] text-[#4a6080] mt-0.5">
                      Min {s.atMinute} · {s.reason}
                    </div>
                  </div>
                  <button onClick={() => doSwap(s.outPlayerId, s.inPlayerId)}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30
                      text-sky-400 text-[11px] font-bold hover:bg-sky-500/25 shrink-0 min-h-[36px]">
                    Byt
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-widest mb-2">
        Manuelt bytte
      </div>
      <ManualSwap onField={onField} onBench={onBench} onSwap={doSwap} getPlayerName={getPlayerName} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[9.5px] text-emerald-400 font-bold mb-1.5">På banen ({onField.length})</div>
          {onField.map(p => {
            const playerName = getPlayerName(p);
            return (
              <div key={p.id} className="text-[11px] text-slate-300 py-0.5">
                #{p.num} {playerName}
                <span className="text-[9px] text-[#4a6080] ml-1">{p.minutesPlayed ?? 0}m</span>
              </div>
            );
          })}
        </div>
        <div>
          <div className="text-[9.5px] text-amber-400 font-bold mb-1.5">Benken ({onBench.length})</div>
          {onBench.map(p => {
            const playerName = getPlayerName(p);
            return (
              <div key={p.id} className="text-[11px] text-slate-400 py-0.5">
                #{p.num} {playerName}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ManualSwap: React.FC<{
  onField: any[]; onBench: any[];
  onSwap: (outId: string, inId: string) => void;
  getPlayerName: (player: any) => string;
}> = ({ onField, onBench, onSwap, getPlayerName }) => {
  const [outId, setOutId] = useState('');
  const [inId, setInId]   = useState('');
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <div className="text-[9px] text-[#3a5070] mb-1 uppercase font-bold">Ut</div>
        <select value={outId} onChange={e => setOutId(e.target.value)}
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-2 py-2
            text-[11.5px] text-slate-300 focus:outline-none min-h-[40px]">
          <option value="">– velg –</option>
          {onField.map(p => (
            <option key={p.id} value={p.id}>#{p.num} {getPlayerName(p)}</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <div className="text-[9px] text-[#3a5070] mb-1 uppercase font-bold">Inn</div>
        <select value={inId} onChange={e => setInId(e.target.value)}
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-2 py-2
            text-[11.5px] text-slate-300 focus:outline-none min-h-[40px]">
          <option value="">– velg –</option>
          {onBench.map(p => (
            <option key={p.id} value={p.id}>#{p.num} {getPlayerName(p)}</option>
          ))}
        </select>
      </div>
      <button onClick={() => { if (outId && inId) { onSwap(outId, inId); setOutId(''); setInId(''); } }}
        disabled={!outId || !inId}
        className="px-3 py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400
          text-[11px] font-bold hover:bg-sky-500/25 disabled:opacity-40 min-h-[40px]">
        Byt
      </button>
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
    football: 'Fotball 11er', football7: 'Fotball 7er', handball: 'Håndball',
  };

  const applyNote = (drill: Drill, stepIdx: number) => {
    const step = drill.steps[stepIdx];
    if (!step) return;
    updateStickyNote(activePhaseIdx, `${drill.name} · Steg ${stepIdx + 1}: ${step.name}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-400">{sportLabel[sport] ?? sport}</span>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-1 rounded-xl text-[10px] font-bold ${
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
                <div className="text-[11px] font-bold text-amber-400">
                  Uke {week} – ukens øvelser
                </div>
                <div className="text-[10px] text-[#4a6080]">
                  Roterer automatisk neste uke
                </div>
              </div>
              <button onClick={() => setShowAll(true)}
                className="ml-auto text-[10px] text-[#4a6080] hover:text-sky-400 transition">
                Vis alle →
              </button>
            </div>
          )}

          {showAll && (
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setShowAll(false)}
                className="text-[10px] text-[#4a6080] hover:text-sky-400 transition">
                ← Tilbake til ukas øvelser
              </button>
              <span className="text-[10px] text-[#3a5070]">({allDrills.length} totalt)</span>
            </div>
          )}

          <div className="space-y-2">
            {displayed.length === 0 ? (
              <p className="text-[12px] text-[#4a6080] text-center py-6">
                Ingen øvelser for {ageGroup === 'youth' ? 'barne-' : 'voksen-'}{sportLabel[sport]}.
              </p>
            ) : (
              displayed.map((d, idx) => (
                <button key={d.id}
                  onClick={() => { setActiveDrill(d); setActiveStep(0); }}
                  className="w-full text-left p-3.5 bg-[#0f1a2a] rounded-xl border
                    border-[#1e3050] hover:border-[#2e4060] transition-all">
                  <div className="flex items-start gap-2">
                    {!showAll && (
                      <span className="w-6 h-6 rounded-full bg-sky-500/15 border border-sky-500/20
                        text-sky-400 text-[10px] font-black flex items-center justify-center
                        shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                    )}
                    <div className="flex-1">
                      <div className="text-[12.5px] font-bold text-slate-200">{d.name}</div>
                      <div className="text-[11px] text-[#4a6080] mt-0.5 leading-relaxed">
                        {d.description}
                      </div>
                      <div className="text-[10px] text-sky-500/60 mt-1">{d.steps.length} steg</div>
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
            className="text-[11px] text-[#4a6080] hover:text-sky-400 mb-3 flex items-center gap-1">
            ‹ Tilbake til liste
          </button>

          <h3 className="text-sm font-black text-slate-100 mb-1">{activeDrill.name}</h3>
          <p className="text-[11.5px] text-[#7a9ab8] mb-4 leading-relaxed">
            {activeDrill.description}
          </p>

          <div className="flex gap-1.5 mb-4">
            {activeDrill.steps.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                className={`flex-1 h-2 rounded-full transition-all
                  ${i === activeStep ? 'bg-sky-400'
                    : i < activeStep ? 'bg-sky-800' : 'bg-[#1e3050]'}`} />
            ))}
          </div>

          {activeDrill.steps[activeStep] && (
            <div className="bg-[#0f1a2a] rounded-xl p-4 border border-[#1e3050] mb-4">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40
                  text-sky-400 text-[12px] font-black flex items-center justify-center shrink-0">
                  {activeStep + 1}
                </span>
                <span className="text-[13px] font-bold text-slate-200">
                  {activeDrill.steps[activeStep].name}
                </span>
              </div>
              <p className="text-[12px] text-[#7a9ab8] leading-relaxed pl-9">
                {activeDrill.steps[activeStep].description}
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-2">
            <button onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              className="flex-1 py-2.5 rounded-xl border border-[#1e3050] text-[#4a6080]
                text-[12px] font-bold hover:text-slate-300 disabled:opacity-30 min-h-[44px]">
              ‹ Forrige
            </button>
            {activeStep < activeDrill.steps.length - 1 ? (
              <button onClick={() => setActiveStep(s => s + 1)}
                className="flex-1 py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30
                  text-sky-400 text-[12px] font-bold hover:bg-sky-500/25 min-h-[44px]">
                Neste steg ›
              </button>
            ) : (
              <button onClick={() => setActiveDrill(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30
                  text-emerald-400 text-[12px] font-bold hover:bg-emerald-500/25 min-h-[44px]">
                ✓ Ferdig
              </button>
            )}
          </div>

          <button onClick={() => applyNote(activeDrill, activeStep)}
            className="w-full py-2 rounded-xl border border-amber-500/30 text-amber-400/70
              text-[11px] hover:text-amber-400 transition">
            📌 Fest til fase-notat
          </button>
        </div>
      )}
    </div>
  );
};