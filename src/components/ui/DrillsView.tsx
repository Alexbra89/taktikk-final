'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  ALL_DRILLS,
  getDrillsByCategory,
  getDrillsByAgeGroup,
  getDrillsByAgeBand,
  CATEGORY_LABELS,
} from '@/data/drills';
import type { DrillExercise, DrillCategory, DrillAgeBand, DrillDifficulty } from '@/types';

type ViewMode = 'browse' | 'detail';
type AgeGroup = 'youth' | 'adult';

const CATEGORIES: DrillCategory[] = ['keeper', 'forsvar', 'midtbane', 'angrep', 'cardio', 'styrke'];
const AGE_BANDS: DrillAgeBand[] = ['6-7', '8-9', '10-12', '13-16', '17+'];
const DIFFICULTIES: DrillDifficulty[] = ['enkel', 'middels', 'avansert'];

const DIFFICULTY_LABELS: Record<DrillDifficulty, string> = {
  enkel:    '⭐ Lett',
  middels:  '⭐⭐ Middels',
  avansert: '⭐⭐⭐ Avansert',
};

const DIFFICULTY_COLORS: Record<DrillDifficulty, string> = {
  enkel:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  middels:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  avansert: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const DIFFICULTY_ACTIVE: Record<DrillDifficulty, string> = {
  enkel:    'border-emerald-500 bg-emerald-500/15 text-emerald-400',
  middels:  'border-yellow-500 bg-yellow-500/15 text-yellow-400',
  avansert: 'border-red-500 bg-red-500/15 text-red-400',
};

const CAT_STRIPE: Record<DrillCategory, string> = {
  keeper:   'bg-yellow-400',
  forsvar:  'bg-blue-400',
  midtbane: 'bg-purple-400',
  angrep:   'bg-orange-400',
  cardio:   'bg-rose-400',
  styrke:   'bg-emerald-400',
};

const CHIP_BASE = 'px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all';
const CHIP_IDLE = 'border-[#1e3050] text-[#4a6080] hover:text-slate-300';
const CHIP_ALL_ACTIVE = 'border-slate-500/50 bg-slate-500/15 text-slate-300';
const CHIP_ACTIVE = 'border-sky-500/50 bg-sky-500/15 text-sky-400';

/** ISO-ukenummer, brukes til å rotere ukens anbefalte øvelser. */
function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Kilder er ofte URL-er (tiim.no o.l.), men kan også være fritekst. */
function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

function stepText(step: DrillExercise['steps'][number]): string {
  return step.name ? `${step.name}: ${step.description}` : step.description;
}

const Section: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => (
  <div>
    <h3 className={`text-[11px] font-bold ${color} uppercase tracking-wider mb-3`}>{title}</h3>
    {children}
  </div>
);

const BulletList: React.FC<{ items: string[]; bullet: string; bulletColor: string }> = ({ items, bullet, bulletColor }) => (
  <div className="space-y-2">
    {items.map((item, i) => (
      <div key={i} className="flex gap-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3">
        <span className={`${bulletColor} flex-shrink-0`}>{bullet}</span>
        <p className="text-[12.5px] text-slate-300 leading-relaxed">{item}</p>
      </div>
    ))}
  </div>
);

const SourceLink: React.FC<{ value: string }> = ({ value }) =>
  isUrl(value) ? (
    <a href={value} target="_blank" rel="noopener noreferrer"
      className="text-sky-400 hover:text-sky-300 underline break-all">
      {value.replace(/^https?:\/\//i, '')}
    </a>
  ) : (
    <span>{value}</span>
  );

export const DrillsView: React.FC = () => {
  const { addEvent, ageGroup: storeAgeGroup } = useAppStore();

  // Starter på appens aldersgruppe, men kan byttes lokalt i biblioteket.
  const [ageGroup, setAgeGroup]           = useState<AgeGroup>(storeAgeGroup);
  const [activeCategory, setActiveCategory] = useState<DrillCategory | 'alle'>('alle');
  const [ageBand, setAgeBand]             = useState<DrillAgeBand | 'alle'>('alle');
  const [difficultyFilter, setDifficultyFilter] = useState<DrillDifficulty | 'alle'>('alle');
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedDrill, setSelectedDrill] = useState<DrillExercise | null>(null);
  const [viewMode, setViewMode]           = useState<ViewMode>('browse');
  const [scheduleDate, setScheduleDate]   = useState('');
  const [scheduleTime, setScheduleTime]   = useState('18:00');
  const [scheduleNote, setScheduleNote]   = useState('');
  const [scheduledId, setScheduledId]     = useState<string | null>(null);
  const [toast, setToast]                 = useState<string | null>(null);

  function changeAgeGroup(next: AgeGroup) {
    setAgeGroup(next);
    setAgeBand('alle');
  }

  // Aldersbånd som faktisk finnes i valgt aldersgruppe
  const availableBands = useMemo(() => {
    const present = new Set<DrillAgeBand>();
    ALL_DRILLS.filter(d => d.ageGroup === ageGroup)
      .forEach(d => d.ageBand.forEach(b => present.add(b)));
    return AGE_BANDS.filter(b => present.has(b));
  }, [ageGroup]);

  // Antall øvelser per kategori (innenfor valgt aldersgruppe) til fanene
  const categoryCounts = useMemo(() => {
    const counts = {} as Record<DrillCategory, number>;
    CATEGORIES.forEach(cat => {
      counts[cat] = getDrillsByCategory(cat).filter(d => d.ageGroup === ageGroup).length;
    });
    return counts;
  }, [ageGroup]);

  // Ukens anbefalte øvelser: én fra hver av fire kategorier, roterer med ukenummer
  const weeklyDrills = useMemo(() => {
    const week = isoWeek(new Date());
    const picks: DrillExercise[] = [];
    for (let i = 0; i < 4; i++) {
      const cat = CATEGORIES[(week + i) % CATEGORIES.length];
      const pool = getDrillsByCategory(cat).filter(d => d.ageGroup === ageGroup);
      if (pool.length > 0) picks.push(pool[week % pool.length]);
    }
    return picks;
  }, [ageGroup]);

  const filteredDrills = useMemo(() => {
    let drills = activeCategory === 'alle'
      ? getDrillsByAgeGroup(ageGroup)
      : getDrillsByCategory(activeCategory).filter(d => d.ageGroup === ageGroup);

    if (ageBand !== 'alle') {
      const inBand = new Set(getDrillsByAgeBand(ageBand).map(d => d.id));
      drills = drills.filter(d => inBand.has(d.id));
    }

    if (difficultyFilter !== 'alle') {
      drills = drills.filter(d => d.difficulty === difficultyFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      drills = drills.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }

    return drills;
  }, [activeCategory, ageGroup, ageBand, difficultyFilter, searchQuery]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function openDrill(drill: DrillExercise) {
    setSelectedDrill(drill);
    setViewMode('detail');
    setScheduledId(null);
    setScheduleDate('');
  }

  function buildTeamNote(drill: DrillExercise, extra?: string): string {
    const parts = [
      `📋 ${drill.description}`,
      `📝 Slik gjøres det:\n${drill.steps.map((s, i) => `${i + 1}. ${stepText(s)}`).join('\n')}`,
    ];
    if (drill.coachingPoints.length > 0) {
      parts.push(`💡 Coachingpunkter:\n${drill.coachingPoints.map(t => `• ${t}`).join('\n')}`);
    }
    if (drill.warning) parts.push(`⚠️ ${drill.warning}`);
    const base = parts.join('\n\n');
    return extra ? `${extra}\n\n${base}` : base;
  }

  function scheduleDrill(drill: DrillExercise, date?: string) {
    const d = date ?? scheduleDate;
    if (!d) return;
    addEvent({
      type: 'training',
      title: `🏋️ ${drill.name}`,
      date: d,
      time: scheduleTime,
      location: '',
      opponent: '',
      result: '',
      teamNote: buildTeamNote(drill, scheduleNote || undefined),
      trainingNotes: [],
      matchNotes: [],
    });
    setScheduledId(drill.id);
    showToast(`✅ "${drill.name}" lagt til i kalender!`);
  }

  function scheduleWeekPlan() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
    const offsets = [0, 2, 4, 5];
    weeklyDrills.forEach((drill, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() + daysUntilMonday + offsets[idx]);
      scheduleDrill(drill, date.toISOString().slice(0, 10));
    });
    showToast(`✅ Ukens ${weeklyDrills.length} øvelser lagt til i kalender!`);
  }

  // ── Detail View ──────────────────────────────────────────
  if (viewMode === 'detail' && selectedDrill) {
    const drill = selectedDrill;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#1e3050] bg-[#0c1525] flex-shrink-0">
          <button onClick={() => { setViewMode('browse'); setScheduledId(null); }}
            className="text-[#4a6080] hover:text-sky-400 text-[12px]">
            ‹ Tilbake
          </button>
          <div className="flex-1" />
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${DIFFICULTY_COLORS[drill.difficulty]}`}>
            {DIFFICULTY_LABELS[drill.difficulty]}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <div className="text-[10px] text-[#4a6080] font-bold uppercase tracking-wider mb-1">
              {CATEGORY_LABELS[drill.category]} · ⚽ Fotball
              <span className={`ml-2 ${drill.ageGroup === 'youth' ? 'text-emerald-400' : 'text-sky-400'}`}>
                {drill.ageGroup === 'youth' ? '🧒 Barn' : '🧑 Voksne'}
              </span>
              <span className="ml-2 normal-case tracking-normal font-semibold">{drill.ageBand.join(', ')} år</span>
            </div>
            <h2 className="text-2xl font-black text-slate-100 mb-1">{drill.name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#4a6080]">
              <span>⏱ {drill.duration} min</span>
              <span>👥 {drill.players}</span>
              {drill.equipment.length > 0 && <span>🎯 {drill.equipment.join(', ')}</span>}
            </div>
          </div>

          {drill.warning && (
            <div className="flex gap-3 bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4">
              <span className="text-yellow-400 text-[16px] leading-none flex-shrink-0">⚠️</span>
              <div>
                <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-1">Advarsel</div>
                <p className="text-[12.5px] text-yellow-100/90 leading-relaxed">{drill.warning}</p>
              </div>
            </div>
          )}

          <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-4">
            <p className="text-[13px] text-slate-300 leading-relaxed">{drill.description}</p>
          </div>

          {drill.why && (
            <Section title="🎯 Hvorfor denne øvelsen" color="text-purple-400">
              <div className="bg-purple-500/5 rounded-xl border border-purple-500/20 p-4">
                <p className="text-[12.5px] text-slate-300 leading-relaxed">{drill.why}</p>
              </div>
            </Section>
          )}

          {drill.sketch && (
            <Section title="✏️ Skisse / oppsett" color="text-slate-400">
              <div className="bg-[#0c1525] rounded-xl border border-dashed border-[#1e3050] p-4">
                <p className="text-[12.5px] text-slate-300 leading-relaxed whitespace-pre-line">{drill.sketch}</p>
              </div>
            </Section>
          )}

          <Section title="📝 Slik gjøres det" color="text-sky-400">
            <div className="space-y-2">
              {drill.steps.map((step, i) => (
                <div key={step.id ?? i} className="flex gap-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-[11px] font-bold text-sky-400 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    {step.name && <div className="text-[12.5px] font-bold text-slate-200 mb-0.5">{step.name}</div>}
                    <p className="text-[12.5px] text-slate-300 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {drill.coachingPoints.length > 0 && (
            <Section title="💡 Coachingpunkter" color="text-emerald-400">
              <BulletList items={drill.coachingPoints} bullet="✦" bulletColor="text-emerald-400" />
            </Section>
          )}

          {drill.commonMistakes.length > 0 && (
            <Section title="🚫 Vanlige feil" color="text-red-400">
              <BulletList items={drill.commonMistakes} bullet="✕" bulletColor="text-red-400" />
            </Section>
          )}

          {drill.variations.length > 0 && (
            <Section title="🔀 Variasjoner" color="text-orange-400">
              <BulletList items={drill.variations} bullet="↳" bulletColor="text-orange-400" />
            </Section>
          )}

          {drill.background && (
            <Section title="📚 Bakgrunn" color="text-slate-400">
              <p className="text-[12.5px] text-slate-400 leading-relaxed">{drill.background}</p>
            </Section>
          )}

          {(drill.source || drill.unverifiedSource) && (
            <div className="text-[11px] text-[#4a6080] space-y-1">
              {drill.source && (
                <div><span className="font-bold uppercase tracking-wider text-[10px]">Kilde:</span> <SourceLink value={drill.source} /></div>
              )}
              {drill.unverifiedSource && (
                <div><span className="font-bold uppercase tracking-wider text-[10px]">Uverifisert kilde:</span> <SourceLink value={drill.unverifiedSource} /></div>
              )}
            </div>
          )}

          <div className="bg-[#0c1525] rounded-xl border border-dashed border-[#1e3050] p-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">📅 Legg til i kalender</h3>
            {scheduledId === drill.id ? (
              <div className="text-emerald-400 text-[13px] font-bold text-center py-2">✅ Lagt til i kalender!</div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider">Dato *</label>
                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                      className="mt-1 w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-[12.5px] focus:outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider">Tid</label>
                    <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                      className="mt-1 w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-[12.5px] focus:outline-none focus:border-sky-500" />
                  </div>
                </div>
                <input value={scheduleNote} onChange={e => setScheduleNote(e.target.value)}
                  placeholder="Ekstra notat (valgfritt)"
                  className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-[12.5px] focus:outline-none focus:border-sky-500" />
                <button onClick={() => scheduleDrill(drill)} disabled={!scheduleDate}
                  className="w-full py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[12.5px] hover:bg-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Legg til i kalender
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Browse View ──────────────────────────────────────────
  const showWeekly = activeCategory === 'alle' && ageBand === 'alle' && difficultyFilter === 'alle' && !searchQuery;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[12px] font-bold px-4 py-2.5 rounded-xl shadow-xl pointer-events-none">
          {toast}
        </div>
      )}

      <div className="flex-shrink-0 border-b border-[#1e3050] bg-[#0c1525]">
        {/* Header: Barn/Voksne + antall */}
        <div className="flex px-4 pt-3 pb-2 gap-2 items-center flex-wrap">
          <span className="text-[13px] font-bold text-slate-200">⚽ Fotball</span>
          <div className="flex gap-1">
            {(['youth', 'adult'] as const).map(g => (
              <button key={g} onClick={() => changeAgeGroup(g)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  ageGroup === g
                    ? (g === 'youth'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-sky-500/20 text-sky-400 border-sky-500/30')
                    : CHIP_IDLE
                }`}>
                {g === 'youth' ? '🧒 Barn' : '🧑 Voksne'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-[11px] text-[#3a5070]">{filteredDrills.length} øvelser</span>
        </div>

        {/* Søk */}
        <div className="px-4 py-2">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Søk etter øvelse..."
            className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-[12.5px] focus:outline-none focus:border-sky-500" />
        </div>

        {/* Kategorifaner */}
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          <button onClick={() => setActiveCategory('alle')}
            className={`${CHIP_BASE} ${activeCategory === 'alle' ? CHIP_ALL_ACTIVE : CHIP_IDLE}`}>
            🗂 Alle
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`${CHIP_BASE} ${activeCategory === cat ? CHIP_ACTIVE : CHIP_IDLE}`}>
              {CATEGORY_LABELS[cat]} <span className="opacity-60">{categoryCounts[cat]}</span>
            </button>
          ))}
        </div>

        {/* Aldersbånd + vanskelighetsgrad */}
        <div className="px-4 pb-2 flex flex-wrap gap-x-4 gap-y-2 items-center border-b border-[#1e3050]">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[9px] font-bold text-[#3a5070] uppercase tracking-wider mr-1">Alder</span>
            <button onClick={() => setAgeBand('alle')}
              className={`px-2 py-1 rounded-md text-[9px] font-semibold border transition-all ${ageBand === 'alle' ? CHIP_ALL_ACTIVE : CHIP_IDLE}`}>
              Alle
            </button>
            {availableBands.map(band => (
              <button key={band} onClick={() => setAgeBand(band)}
                className={`px-2 py-1 rounded-md text-[9px] font-semibold border transition-all ${ageBand === band ? CHIP_ACTIVE : CHIP_IDLE}`}>
                {band}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-[#3a5070] uppercase tracking-wider mr-1">Nivå</span>
            <button onClick={() => setDifficultyFilter('alle')}
              className={`px-2 py-1 rounded-md text-[9px] font-semibold border transition-all ${difficultyFilter === 'alle' ? CHIP_ALL_ACTIVE : CHIP_IDLE}`}>
              Alle
            </button>
            {DIFFICULTIES.map(level => (
              <button key={level} onClick={() => setDifficultyFilter(level)}
                className={`px-2 py-1 rounded-md text-[9px] font-semibold border transition-all ${
                  difficultyFilter === level ? DIFFICULTY_ACTIVE[level] : CHIP_IDLE
                }`}>
                {level === 'enkel' ? 'Lett' : level === 'middels' ? 'Middels' : 'Avansert'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Ukens anbefalte øvelser */}
        {showWeekly && weeklyDrills.length > 0 && (
          <div className="bg-[#0c1525] rounded-2xl border border-sky-500/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[12px] font-bold text-sky-400">⭐ Ukens anbefalte øvelser</h3>
                <p className="text-[10px] text-[#4a6080] mt-0.5">Roterer automatisk hver uke</p>
              </div>
              <button onClick={scheduleWeekPlan}
                className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-bold hover:bg-sky-500/25 transition whitespace-nowrap">
                📅 Legg alle i kalender
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {weeklyDrills.map(drill => (
                <div key={drill.id} onClick={() => openDrill(drill)}
                  className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] hover:border-sky-500/30 p-3 cursor-pointer transition-all">
                  <div className="text-[12px] font-bold text-slate-200 mb-1 leading-tight">{drill.name}</div>
                  <div className="text-[10px] text-[#4a6080]">{CATEGORY_LABELS[drill.category]} · {drill.duration} min</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Øvelsesliste */}
        <div className="space-y-2">
          {filteredDrills.map(drill => (
            <div key={drill.id}
              className="flex items-start gap-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] hover:border-[#2e4060] p-3.5 cursor-pointer transition-all group"
              onClick={() => openDrill(drill)}>
              <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${CAT_STRIPE[drill.category]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[13px] font-bold text-slate-200 leading-tight">
                    {drill.warning && <span className="mr-1" title="Har advarsel">⚠️</span>}
                    {drill.name}
                  </span>
                  <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${DIFFICULTY_COLORS[drill.difficulty]}`}>
                    {DIFFICULTY_LABELS[drill.difficulty]}
                  </span>
                </div>
                <p className="text-[11px] text-[#5a7090] leading-relaxed line-clamp-2 mb-2">{drill.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-[#3a5070]">
                  <span>⏱ {drill.duration} min</span>
                  <span>👥 {drill.players}</span>
                  <span>🎂 {drill.ageBand.join(', ')}</span>
                  <span className="ml-auto">{CATEGORY_LABELS[drill.category]}</span>
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  scheduleDrill(drill, new Date().toISOString().slice(0, 10));
                }}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 hover:bg-sky-500/25 transition"
                title="Legg til i dag">
                📅
              </button>
            </div>
          ))}
          {filteredDrills.length === 0 && (
            <div className="text-center py-12 text-[#4a6080]">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-[13px]">Ingen øvelser funnet</p>
              <p className="text-[11px] mt-1">Prøv å endre filter eller søk</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
