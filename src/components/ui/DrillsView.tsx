'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  getDrillsBySport, getWeeklyDrills, CATEGORY_LABELS,
  Drill, DrillCategory, DrillSport, toDrillSport,
} from '../../data/drills';

type ViewMode = 'browse' | 'detail';

const SPORT_LABELS: Record<string, string> = {
  football: '⚽ Fotball',
  handball: '🤾 Håndball',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  enkel:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  middels:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  avansert: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const CAT_STRIPE: Record<string, string> = {
  offensivt:    'bg-orange-400',
  defensivt:    'bg-blue-400',
  hele_laget:   'bg-purple-400',
  keeper:       'bg-yellow-400',
  fysisk:       'bg-emerald-400',
};

export const DrillsView: React.FC = () => {
  const { addEvent, sport, ageGroup: storeAgeGroup } = useAppStore();

  // Bruk sport fra store, men normaliser football7 -> football
  const activeSport = toDrillSport(sport);
  
  // Bruk ageGroup fra store - ingen manuell velger lenger
  const ageGroup = storeAgeGroup;
  
  const [activeCategory, setActiveCategory] = useState<DrillCategory | 'alle'>('alle');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('alle');
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [viewMode, setViewMode]           = useState<ViewMode>('browse');
  const [scheduleDate, setScheduleDate]   = useState('');
  const [scheduleTime, setScheduleTime]   = useState('18:00');
  const [scheduleNote, setScheduleNote]   = useState('');
  const [scheduledId, setScheduledId]     = useState<string | null>(null);
  const [toast, setToast]                 = useState<string | null>(null);

  // Ukens anbefalte øvelser basert på sport og aldersgruppe
  const weeklyDrills = useMemo(() => {
    const all = getWeeklyDrills(activeSport);
    return all.filter(d => !d.ageGroup || d.ageGroup === ageGroup);
  }, [activeSport, ageGroup]);

  // Filtrerte øvelser basert på alle kriterier
  const filteredDrills = useMemo(() => {
    let drills = getDrillsBySport(activeSport);
    
    // Filtrer på aldersgruppe
    drills = drills.filter(d => !d.ageGroup || d.ageGroup === ageGroup);
    
    // Filtrer på kategori
    if (activeCategory !== 'alle') {
      drills = drills.filter(d => d.category === activeCategory);
    }
    
    // Filtrer på vanskelighetsgrad
    if (difficultyFilter !== 'alle') {
      drills = drills.filter(d => d.difficulty === difficultyFilter);
    }
    
    // Filtrer på søk
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      drills = drills.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }
    
    return drills;
  }, [activeSport, activeCategory, searchQuery, ageGroup, difficultyFilter]);

  const categories = useMemo(() => {
    const drills = getDrillsBySport(activeSport);
    const cats = Array.from(new Set(drills.map(d => d.category)));
    return cats as DrillCategory[];
  }, [activeSport]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function buildTeamNote(drill: Drill, extra?: string): string {
    const base = `📋 ${drill.description}\n\n📝 Slik gjøres det:\n${drill.steps.map((s, i) => `${i + 1}. ${typeof s === "string" ? s : (s as any).description ?? (s as any).name ?? ""}`).join('\n')}\n\n💡 Tips:\n${drill.tips.map(t => `• ${t}`).join('\n')}`;
    return extra ? `${extra}\n\n${base}` : base;
  }

  function scheduleDrill(drill: Drill, date?: string) {
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
            {drill.difficulty === 'enkel' ? '⭐ Enkel' : drill.difficulty === 'middels' ? '⭐⭐ Middels' : '⭐⭐⭐ Avansert'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <div className="text-[10px] text-[#4a6080] font-bold uppercase tracking-wider mb-1">
              {CATEGORY_LABELS[drill.category]} · {SPORT_LABELS[drill.sport]}
              {ageGroup === 'youth' && <span className="ml-2 text-emerald-400">🧒 Barneøvelse</span>}
            </div>
            <h2 className="text-2xl font-black text-slate-100 mb-1">{drill.name}</h2>
            <div className="flex gap-3 text-[11px] text-[#4a6080]">
              <span>⏱ {drill.duration} min</span>
              <span>👥 {drill.players}</span>
              {drill.equipment?.length > 0 && <span>🎯 {drill.equipment.join(', ')}</span>}
            </div>
          </div>

          <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-4">
            <p className="text-[13px] text-slate-300 leading-relaxed">{drill.description}</p>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-3">📝 Slik gjøres det</h3>
            <div className="space-y-2">
              {drill.steps.map((step, i) => {
                const text = typeof step === 'string' ? step : (step as any).description ?? (step as any).name ?? '';
                return (
                  <div key={i} className="flex gap-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3">
                    <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-[11px] font-bold text-sky-400 flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-[12.5px] text-slate-300 leading-relaxed">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-3">💡 Tips og triks</h3>
            <div className="space-y-2">
              {drill.tips.map((tip, i) => (
                <div key={i} className="flex gap-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] p-3">
                  <span className="text-emerald-400 flex-shrink-0">✦</span>
                  <p className="text-[12.5px] text-slate-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

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
  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[12px] font-bold px-4 py-2.5 rounded-xl shadow-xl pointer-events-none">
          {toast}
        </div>
      )}

      <div className="flex-shrink-0 border-b border-[#1e3050] bg-[#0c1525]">
        {/* Header med sport og aldersgruppe info */}
        <div className="flex px-4 pt-3 pb-2 gap-2 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-200">
              {SPORT_LABELS[activeSport]}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              ageGroup === 'youth' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            }`}>
              {ageGroup === 'youth' ? '🧒 Barnefotball' : '🧑 Voksen'}
            </span>
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

        {/* Filter-linje */}
        <div className="px-4 pb-2 flex flex-wrap gap-2 items-center border-b border-[#1e3050]">
          {/* Kategorifilter */}
          <div className="flex flex-wrap gap-1.5 flex-1">
            <button onClick={() => setActiveCategory('alle')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
                activeCategory === 'alle' ? 'border-slate-500/50 bg-slate-500/15 text-slate-300' : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'
              }`}>
              🗂 Alle
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
                  activeCategory === cat ? 'border-sky-500/50 bg-sky-500/15 text-sky-400' : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'
                }`}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          
          {/* Vanskelighetsgrad-filter */}
          <div className="flex gap-1">
            <button onClick={() => setDifficultyFilter('alle')}
              className={`px-2 py-1 rounded-md text-[9px] font-semibold border transition-all ${
                difficultyFilter === 'alle' ? 'border-slate-500/50 bg-slate-500/15 text-slate-300' : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'
              }`}>
              Alle
            </button>
            {['enkel', 'middels', 'avansert'].map(level => (
              <button key={level} onClick={() => setDifficultyFilter(level)}
                className={`px-2 py-1 rounded-md text-[9px] font-semibold border transition-all ${
                  difficultyFilter === level ? 
                    (level === 'enkel' ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400' :
                     level === 'middels' ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400' :
                     'border-red-500 bg-red-500/15 text-red-400') : 
                    'border-[#1e3050] text-[#4a6080] hover:text-slate-300'
                }`}>
                {level === 'enkel' ? '⭐' : level === 'middels' ? '⭐⭐' : '⭐⭐⭐'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Ukens anbefalte øvelser */}
        {activeCategory === 'alle' && !searchQuery && difficultyFilter === 'alle' && (
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
                <div key={drill.id} onClick={() => { setSelectedDrill(drill); setViewMode('detail'); setScheduledId(null); setScheduleDate(''); }}
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
              onClick={() => { setSelectedDrill(drill); setViewMode('detail'); setScheduledId(null); setScheduleDate(''); }}>
              <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${CAT_STRIPE[drill.category] ?? 'bg-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[13px] font-bold text-slate-200 leading-tight">{drill.name}</span>
                  <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${DIFFICULTY_COLORS[drill.difficulty]}`}>
                    {drill.difficulty === 'enkel' ? '⭐ Enkel' : drill.difficulty === 'middels' ? '⭐⭐ Middels' : '⭐⭐⭐ Avansert'}
                  </span>
                </div>
                <p className="text-[11px] text-[#5a7090] leading-relaxed line-clamp-2 mb-2">{drill.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-[#3a5070]">
                  <span>⏱ {drill.duration} min</span>
                  <span>👥 {drill.players}</span>
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