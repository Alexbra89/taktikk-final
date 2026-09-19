'use client';
import React, { useState, useMemo } from 'react';
import { Swords, Activity, Search, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { CalendarEvent, DrillExercise, DrillCategory, DrillDifficulty } from '@/types';
import { ALL_DRILLS, getDrillsByCategory, CATEGORY_LABELS } from '@/data/drills';
import { Modal, FilterChip } from '@/components/ui';
import {
  DRILL_CATEGORIES, FOCUS_OPTIONS, INPUT_CLASS, TEXTAREA_CLASS, LABEL_CLASS, toggleClass,
} from './shared';

// ═══ NY HENDELSE – ligger i Modal, så måneden blir stående bak ═══

const DIFFICULTIES: DrillDifficulty[] = ['enkel', 'middels', 'avansert'];
const DIFFICULTY_LABELS: Record<DrillDifficulty, string> = {
  enkel: 'Enkel', middels: 'Middels', avansert: 'Avansert',
};

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
  const [error, setError] = useState('');

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
    if (!title.trim()) { setError('Fyll inn tittel'); return; }
    setError('');
    setSaving(true);

    const drillNotes = selectedDrills.map(d => `\n${d.name}\n${d.description}`).join('');
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
    <Modal
      onClose={onCancel}
      title="Nytt arrangement"
      size="md"
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={save} disabled={saving}
            className="flex-1 min-h-[44px] rounded-ctl bg-signal text-signal-fg text-body font-bold
                       hover:brightness-110 disabled:opacity-40 transition-all">
            {saving ? 'Lagrer …' : 'Lagre'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 min-h-[44px] rounded-ctl text-body font-bold text-ink-muted
                       hover:text-ink shadow-hair transition-colors">
            Avbryt
          </button>
        </div>
      }
    >
      <div className="flex gap-2 mb-4">
        {(['training', 'match'] as const).map(t => {
          const Icon = t === 'match' ? Swords : Activity;
          return (
            <button key={t} onClick={() => setType(t)} aria-pressed={type === t}
              className={`flex-1 min-h-[44px] rounded-ctl text-body font-bold transition-colors
                          inline-flex items-center justify-center gap-1.5 ${toggleClass(type === t)}`}>
              <Icon size={15} strokeWidth={1.75} aria-hidden />
              {t === 'match' ? 'Kamp' : 'Trening'}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="sm:col-span-2 block">
          <span className={LABEL_CLASS}>Tittel *</span>
          <input value={title} onChange={e => { setTitle(e.target.value); if (error) setError(''); }}
            className={INPUT_CLASS} placeholder={type === 'match' ? 'Seriekamp runde 5' : 'Teknikktrening'} />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Dato</span>
          <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Tid</span>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Sted</span>
          <input value={location} onChange={e => setLocation(e.target.value)} className={INPUT_CLASS} placeholder="Stadion / hall" />
        </label>
        {type === 'match' && (
          <label className="block">
            <span className={LABEL_CLASS}>Motstander</span>
            <input value={opponent} onChange={e => setOpponent(e.target.value)} className={INPUT_CLASS} placeholder="Lag X" />
          </label>
        )}
      </div>

      {error && <p role="alert" className="mt-2 text-caption text-signal">{error}</p>}

      {type === 'training' && (
        <>
          <div className="mt-4">
            <span className={LABEL_CLASS}>Fokusområder</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {FOCUS_OPTIONS.slice(0, 8).map(f => (
                <button key={f} onClick={() => setFocusTags(prev =>
                  prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                )}
                  aria-pressed={focusTags.includes(f)}
                  className={`tap-auto min-h-[32px] px-2.5 rounded-pill text-meta font-bold transition-colors
                    ${toggleClass(focusTags.includes(f))}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <span className={LABEL_CLASS}>Øvelser fra biblioteket</span>

            {selectedDrills.length > 0 && (
              <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {selectedDrills.map(drill => (
                  <li key={drill.id} className="flex items-center gap-2 rounded-ctl bg-canvas-raised px-3 py-2 shadow-hair">
                    <div className="flex-1 min-w-0">
                      <div className="text-body font-bold text-ink truncate">{drill.name}</div>
                      <div className="font-mono text-meta text-ink-subtle">
                        {drill.duration} min · {drill.players} spillere · {drill.difficulty}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeDrill(drill.id)}
                      aria-label={`Fjern ${drill.name}`}
                      className="tap-auto w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-ctl
                                 text-ink-faint hover:text-ink hover:bg-canvas-hover transition-colors">
                      <X size={14} strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button type="button" onClick={() => setShowDrillPicker(!showDrillPicker)}
              aria-expanded={showDrillPicker}
              className="w-full mt-2 min-h-[44px] px-3 rounded-ctl bg-canvas-raised shadow-hair
                         text-body text-ink-muted hover:text-ink transition-colors
                         flex items-center justify-between gap-2">
              <span>{selectedDrills.length > 0 ? `Legg til flere (${selectedDrills.length} valgt)` : 'Velg øvelser'}</span>
              {showDrillPicker
                ? <ChevronUp size={15} strokeWidth={1.75} aria-hidden />
                : <ChevronDown size={15} strokeWidth={1.75} aria-hidden />}
            </button>

            {showDrillPicker && (
              <div className="mt-2 rounded-panel bg-canvas-sunken shadow-hair overflow-hidden">
                <div className="p-2 border-b border-rule space-y-2">
                  <div className="relative">
                    <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
                      <Search size={14} strokeWidth={1.75} />
                    </span>
                    <input type="text" placeholder="Søk etter øvelse …"
                      value={drillSearch} onChange={e => setDrillSearch(e.target.value)}
                      aria-label="Søk etter øvelse"
                      className="w-full rounded-ctl pl-9 pr-3 min-h-[44px] bg-canvas-raised text-body text-ink
                                 placeholder:text-ink-faint shadow-hair focus:outline-none focus:shadow-hair-signal" />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <FilterChip accent="neutral" active={drillCategory === 'alle'} onClick={() => setDrillCategory('alle')}>
                      Alle
                    </FilterChip>
                    {DRILL_CATEGORIES.map(cat => (
                      <FilterChip key={cat} active={drillCategory === cat} onClick={() => setDrillCategory(cat)}>
                        {CATEGORY_LABELS[cat]}
                      </FilterChip>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <FilterChip accent="neutral" active={drillDifficulty === 'alle'} onClick={() => setDrillDifficulty('alle')}>
                      Alle
                    </FilterChip>
                    {DIFFICULTIES.map(level => (
                      <FilterChip key={level} active={drillDifficulty === level} onClick={() => setDrillDifficulty(level)}>
                        {DIFFICULTY_LABELS[level]}
                      </FilterChip>
                    ))}
                  </div>

                  <div className="font-mono text-meta text-ink-subtle text-right">{filteredDrills.length} øvelser</div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {filteredDrills.length === 0 ? (
                    <div className="text-center py-8 text-body text-ink-subtle">Ingen øvelser funnet</div>
                  ) : (
                    filteredDrills.map(drill => {
                      const isSelected = selectedDrills.some(sd => sd.id === drill.id);
                      return (
                        <button key={drill.id} type="button"
                          onClick={() => isSelected ? removeDrill(drill.id) : addDrill(drill)}
                          aria-pressed={isSelected}
                          className={`w-full text-left px-3 py-2.5 min-h-[44px] border-b border-rule
                                      transition-colors hover:bg-canvas-hover
                                      ${isSelected ? 'bg-signal/10' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-4 flex-shrink-0 ${isSelected ? 'text-signal' : 'text-ink-faint'}`}>
                              {isSelected ? <Check size={14} strokeWidth={2} aria-hidden /> : '·'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className={`text-body font-bold truncate ${isSelected ? 'text-signal' : 'text-ink'}`}>
                                {drill.name}
                              </div>
                              <div className="font-mono text-meta text-ink-subtle truncate">
                                {CATEGORY_LABELS[drill.category]} · {drill.duration} min · {drill.players} spillere · {drill.difficulty}
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

      <label className="block mt-4">
        <span className={LABEL_CLASS}>Beskrivelse / notat</span>
        <textarea value={teamNote} onChange={e => setTeamNote(e.target.value)}
          rows={3} placeholder="Mål for økten, beskjeder til spillerne …"
          className={TEXTAREA_CLASS} />
      </label>
    </Modal>
  );
};
