'use client';
import React, { useState, useMemo } from 'react';
import type { CalendarEvent, DrillExercise, DrillCategory, DrillDifficulty } from '@/types';
import { ALL_DRILLS, getDrillsByCategory, CATEGORY_LABELS } from '@/data/drills';
import { DRILL_CATEGORIES, FOCUS_OPTIONS, CalStyle } from './shared';

// ═══ NY HENDELSE-FORM (RESPONSIV OPPDATERT) ═══════════════════════

export const NewEventForm: React.FC<{
  date: string;
  ageGroup: 'youth' | 'adult';
  onSave: (ev: Omit<CalendarEvent, 'id'>) => void;
  onCancel: () => void;
}> = ({ date, ageGroup, onSave, onCancel }) => {
  const [type, setType]         = useState<'training' | 'match'>('training');
  const [title, setTitle]       = useState('');
  const [evDate, setEvDate]     = useState(date);
  const [time, setTime]         = useState('18:00');
  const [location, setLocation] = useState('');
  const [opponent, setOpponent] = useState('');
  const [teamNote, setTeamNote] = useState('');
  const [focusTags, setFocusTags] = useState<string[]>([]);
  const [selectedDrills, setSelectedDrills] = useState<DrillExercise[]>([]);
  const [showDrillPicker, setShowDrillPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [drillSearch, setDrillSearch]       = useState('');
  const [drillCategory, setDrillCategory]   = useState<DrillCategory | 'alle'>('alle');
  const [drillDifficulty, setDrillDifficulty] = useState<DrillDifficulty | 'alle'>('alle');

  const filteredDrills = useMemo(() => {
    let drills = (drillCategory === 'alle' ? ALL_DRILLS : getDrillsByCategory(drillCategory))
      .filter(d => d.ageGroup === ageGroup);
    if (drillDifficulty !== 'alle') drills = drills.filter(d => d.difficulty === drillDifficulty);
    if (drillSearch.trim()) {
      const q = drillSearch.toLowerCase();
      drills = drills.filter(d =>
        d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
    }
    return drills;
  }, [ageGroup, drillCategory, drillDifficulty, drillSearch]);

  const addDrill = (drill: DrillExercise) => {
    if (!selectedDrills.some(d => d.id === drill.id)) {
      setSelectedDrills(prev => [...prev, drill]);
    }
    setShowDrillPicker(false);
  };

  const removeDrill = (drillId: string) => {
    setSelectedDrills(prev => prev.filter(d => d.id !== drillId));
  };

  const save = () => {
    if (!title.trim()) { alert('Fyll inn tittel'); return; }
    setSaving(true);

    const drillNotes = selectedDrills.map(d => `\n📋 ${d.name}\n${d.description}`).join('');
    const focusNote  = focusTags.length > 0 ? `Fokus: ${focusTags.join(', ')}` : '';
    const trainingNotes = selectedDrills.map(drill => ({
      id: `tn-${Date.now()}-${drill.id}`,
      createdAt: new Date().toISOString(),
      title: drill.name,
      content: drill.description,
      focus: focusTags,
    }));

    onSave({
      type,
      title: title.trim(),
      date: evDate,
      time,
      location,
      opponent: type === 'match' ? opponent : '',
      result: '',
      teamNote: [focusNote, teamNote, drillNotes].filter(Boolean).join('\n'),
      trainingNotes: type === 'training' ? trainingNotes : [],
      matchNotes: [],
    });

    setSaving(false);
  };

  return (
    <div className="bg-[#0f1a2a] rounded-2xl border border-[#1e3050] p-4 sm:p-5 mb-5 max-w-2xl">
      <h3 className="text-sm font-bold text-slate-200 mb-4">Nytt arrangement</h3>

      <div className="flex gap-2 mb-4">
        {(['training', 'match'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-3 sm:py-2 rounded-lg text-[12px] font-bold border transition-all min-h-[44px]
              ${type === t
                ? t === 'match'
                  ? 'border-red-500 bg-red-500/15 text-red-400'
                  : 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
            {t === 'match' ? '⚽ Kamp' : '🏃 Trening'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="sm:col-span-2">
          <label className="label-cal">Tittel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="inp-cal" placeholder={type === 'match' ? 'Seriekamp runde 5' : 'Teknikktrening'} />
        </div>
        <div>
          <label className="label-cal">Dato</label>
          <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="inp-cal" />
        </div>
        <div>
          <label className="label-cal">Tid</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="inp-cal" />
        </div>
        <div>
          <label className="label-cal">Sted</label>
          <input value={location} onChange={e => setLocation(e.target.value)} className="inp-cal" placeholder="Stadion / hall" />
        </div>
        {type === 'match' && (
          <div>
            <label className="label-cal">Motstander</label>
            <input value={opponent} onChange={e => setOpponent(e.target.value)} className="inp-cal" placeholder="Lag X" />
          </div>
        )}
      </div>

      {type === 'training' && (
        <>
          <div className="mb-3">
            <label className="label-cal">Fokusområder</label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {FOCUS_OPTIONS.slice(0, 8).map(f => (
                <button key={f} onClick={() => setFocusTags(prev =>
                  prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                )}
                  className={`px-2.5 py-1.5 sm:py-1 rounded-full text-[10.5px] font-semibold border transition-all min-h-[36px] sm:min-h-0
                    ${focusTags.includes(f)
                      ? 'border-sky-500/60 bg-sky-500/15 text-sky-400'
                      : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="label-cal">Øvelser fra biblioteket (velg flere)</label>

            {selectedDrills.length > 0 && (
              <div className="mb-2 space-y-1 max-h-32 overflow-y-auto">
                {selectedDrills.map(drill => (
                  <div key={drill.id} className="flex items-center justify-between bg-[#0c1525] rounded-lg px-3 py-2 border border-[#1e3050]">
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-slate-200">{drill.name}</div>
                      <div className="text-[9px] text-[#4a6080]">{drill.duration} min · {drill.players} spillere · {drill.difficulty}</div>
                    </div>
                    <button type="button" onClick={() => removeDrill(drill.id)}
                      className="text-red-400/70 hover:text-red-400 text-[11px] px-2 min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => setShowDrillPicker(!showDrillPicker)}
              className="w-full mt-1 py-3 sm:py-2 px-3 rounded-lg border border-[#1e3050] text-left text-[12px] text-[#4a6080] hover:border-sky-500/50 hover:text-slate-300 transition-all flex items-center justify-between min-h-[44px]">
              <span>{selectedDrills.length > 0 ? `+ Legg til flere øvelser (${selectedDrills.length} valgt)` : '– Velg øvelser –'}</span>
              <span>{showDrillPicker ? '▲' : '▼'}</span>
            </button>

            {showDrillPicker && (
              <div className="mt-2 bg-[#0c1525] border border-[#1e3050] rounded-xl overflow-hidden">
                <div className="p-2 border-b border-[#1e3050] space-y-2">
                  <input type="text" placeholder="🔍 Søk etter øvelse..."
                    value={drillSearch} onChange={e => setDrillSearch(e.target.value)}
                    className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500 min-h-[44px]" />
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setDrillCategory('alle')}
                      className={`px-2 py-1.5 sm:py-0.5 rounded-md text-[9px] font-semibold transition-all min-h-[32px] sm:min-h-0
                        ${drillCategory === 'alle' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}>
                      Alle
                    </button>
                    {DRILL_CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setDrillCategory(cat)}
                        className={`px-2 py-1.5 sm:py-0.5 rounded-md text-[9px] font-semibold transition-all min-h-[32px] sm:min-h-0
                          ${drillCategory === cat ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}>
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setDrillDifficulty('alle')}
                      className={`px-2 py-1.5 sm:py-0.5 rounded-md text-[9px] font-semibold transition-all min-h-[32px] sm:min-h-0
                        ${drillDifficulty === 'alle' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}>
                      Alle
                    </button>
                    {(['enkel', 'middels', 'avansert'] as const).map(level => (
                      <button key={level} onClick={() => setDrillDifficulty(level)}
                        className={`px-2 py-1.5 sm:py-0.5 rounded-md text-[9px] font-semibold transition-all min-h-[32px] sm:min-h-0
                          ${drillDifficulty === level
                            ? level === 'enkel' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : level === 'middels' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'text-[#4a6080] hover:text-slate-300'}`}>
                        {level === 'enkel' ? '⭐ Enkel' : level === 'middels' ? '⭐⭐ Middels' : '⭐⭐⭐ Avansert'}
                      </button>
                    ))}
                  </div>
                  <div className="text-[9px] text-[#4a6080] text-right">{filteredDrills.length} øvelser</div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredDrills.length === 0 ? (
                    <div className="text-center py-8 text-[#4a6080] text-[11px]">Ingen øvelser funnet</div>
                  ) : (
                    filteredDrills.map(drill => {
                      const isSelected = selectedDrills.some(sd => sd.id === drill.id);
                      return (
                        <button key={drill.id} type="button"
                          onClick={() => isSelected ? removeDrill(drill.id) : addDrill(drill)}
                          className={`w-full text-left px-3 py-3 sm:py-2.5 text-[11.5px] hover:bg-[#111c30] border-b border-[#1e3050]/50 transition-all min-h-[44px]
                            ${isSelected ? 'text-sky-400 bg-sky-500/10' : 'text-slate-300'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px]">{isSelected ? '✓' : '○'}</span>
                            <div className="flex-1">
                              <div className="font-semibold">{drill.name}</div>
                              <div className="text-[10px] text-[#4a6080]">
                                {CATEGORY_LABELS[drill.category]} · {drill.duration} min · {drill.players} spillere ·
                                <span className={drill.difficulty === 'enkel' ? 'text-emerald-400' : drill.difficulty === 'middels' ? 'text-yellow-400' : 'text-red-400'}> {drill.difficulty}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mb-4">
        <label className="label-cal">Beskrivelse / notat</label>
        <textarea value={teamNote} onChange={e => setTeamNote(e.target.value)}
          rows={3} placeholder="Mål for økten, beskjeder til spillerne..."
          className="w-full mt-1 bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-3 sm:py-2.5
            text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={save}
          disabled={saving}
          className="flex-1 py-3 sm:py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[12.5px] hover:bg-sky-500/25 disabled:opacity-40 transition min-h-[44px]">
          {saving ? 'Lagrer...' : 'Lagre'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-3 sm:py-2.5 rounded-lg border border-[#1e3050] text-[#4a6080] font-bold text-[12.5px] hover:text-slate-300 min-h-[44px]">
          Avbryt
        </button>
      </div>

      <CalStyle />
    </div>
  );
};
