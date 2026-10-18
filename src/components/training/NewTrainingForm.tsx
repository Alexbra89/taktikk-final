'use client';
import { localDate } from '@/lib/dates';
import React, { useState, useMemo } from 'react';
import { CATEGORY_LABELS } from '@/data/drills';
import { useDrillLibrary } from '@/hooks/useDrillLibrary';
import { AI_DRILL_LABEL } from '@/lib/customDrills';
import { DrillOrigin } from '@/components/ui/DrillOrigin';
import type { DrillExercise, DrillCategory, DrillDifficulty } from '@/types';
import { ChevronLeft, ChevronUp, ChevronDown, X, Check } from 'lucide-react';
import { INPUT_CLASS, TEXTAREA_CLASS, LABEL_CLASS, toggleClass, ICON_BTN } from '@/lib/formClasses';
import { DrillWarning } from './DrillWarning';

// ═══ NY TRENINGSFORM (RESPONSIV OPPDATERT) ═══════════════════════
// Skjemaet for ny trening: tittel, tid, sted, fokus, øvelser fra biblioteket og egne øvelser.

const DRILL_CATEGORIES: DrillCategory[] = ['keeper', 'forsvar', 'midtbane', 'angrep', 'cardio', 'styrke'];

export const NewTrainingForm: React.FC<{
  onSave: (ev: Omit<any, 'id'>) => void;
  onCancel: () => void;
  ageGroup: 'youth' | 'adult';
}> = ({ onSave, onCancel, ageGroup }) => {
  const library = useDrillLibrary();
  const today = localDate();
  const [title, setTitle]       = useState('');
  const [date, setDate]         = useState(today);
  const [time, setTime]         = useState('18:00');
  const [location, setLocation] = useState('');
  const [teamNote, setTeamNote] = useState('');
  const [focusTags, setFocusTags] = useState<string[]>([]);
  const [selectedDrills, setSelectedDrills] = useState<DrillExercise[]>([]);
  const [showDrillPicker, setShowDrillPicker] = useState(false);
  const [drillSearch, setDrillSearch]         = useState('');
  const [drillCategory, setDrillCategory]     = useState<DrillCategory | 'alle'>('alle');
  const [drillDifficulty, setDrillDifficulty] = useState<DrillDifficulty | 'alle'>('alle');
  const [customDrillName, setCustomDrillName] = useState('');
  const [customDrillDesc, setCustomDrillDesc] = useState('');
  const [customDrillDuration, setCustomDrillDuration] = useState(10);
  const [showCustomDrill, setShowCustomDrill] = useState(false);
  const [error, setError] = useState('');
  const [customDrillError, setCustomDrillError] = useState('');

  const filteredDrills = useMemo(() => {
    let drills = library.filter(d => drillCategory === 'alle' || d.category === drillCategory)
      .filter(d => d.ageGroup === ageGroup);
    if (drillDifficulty !== 'alle') drills = drills.filter(d => d.difficulty === drillDifficulty);
    if (drillSearch.trim()) {
      const q = drillSearch.toLowerCase();
      drills = drills.filter(d =>
        d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
    }
    return drills;
  }, [ageGroup, drillCategory, drillDifficulty, drillSearch, library]);

  const addDrill = (drill: DrillExercise) => {
    if (!selectedDrills.some(d => d.id === drill.id)) {
      setSelectedDrills(prev => [...prev, drill]);
    }
    setShowDrillPicker(false);
  };

  const addCustomDrill = () => {
    if (!customDrillName.trim()) {
      setCustomDrillError('Fyll inn øvelsesnavn');
      return;
    }
    setCustomDrillError('');
    const newDrill: DrillExercise = {
      id: `custom-${Date.now()}`,
      category: 'angrep',
      name: customDrillName.trim(),
      duration: customDrillDuration,
      players: 'alle',
      difficulty: 'enkel',
      description: customDrillDesc.trim() || 'Egendefinert øvelse',
      why: '',
      steps: [{ id: 's1', name: 'Øvelse', description: customDrillDesc.trim() || 'Gjenta øvelsen etter instruksjoner' }],
      coachingPoints: [],
      commonMistakes: [],
      variations: [],
      equipment: [],
      ageGroup: ageGroup,
      ageBand: ageGroup === 'youth' ? ['6-7', '8-9', '10-12', '13-16'] : ['17+'],
    };
    setSelectedDrills(prev => [...prev, newDrill]);
    setCustomDrillName('');
    setCustomDrillDesc('');
    setCustomDrillDuration(10);
    setShowCustomDrill(false);
  };

  const removeDrill = (drillId: string) => {
    setSelectedDrills(prev => prev.filter(d => d.id !== drillId));
  };

  const save = () => {
    if (!title.trim()) { setError('Fyll inn tittel'); return; }
    setError('');

    const drillNotes = selectedDrills.map(d =>
      `\n${d.name}\n${d.aiGenerated ? AI_DRILL_LABEL + '\n' : ''}${d.description}\nVarighet: ${d.duration} min${d.warning ? `\nAdvarsel: ${d.warning}` : ''}`
    ).join('');

    const focusNote = focusTags.length > 0 ? `Fokus: ${focusTags.join(', ')}` : '';

    const trainingNotes = selectedDrills.map(drill => ({
      id: `tn-${Date.now()}-${drill.id}`,
      createdAt: new Date().toISOString(),
      title: drill.name,
      content: `${drill.aiGenerated ? AI_DRILL_LABEL + '\n' : ''}${drill.description}`,
      duration: drill.duration || 5,
      focus: focusTags,
      completed: false,
    }));

    onSave({
      type: 'training',
      title: title.trim(),
      date,
      time,
      location,
      opponent: '',
      result: '',
      teamNote: [focusNote, teamNote, drillNotes].filter(Boolean).join('\n'),
      trainingNotes,
      matchNotes: [],
    });
  };

  const FOCUS_OPTIONS = [
    'Pasningsspill', 'Pressing', 'Forsvarsstilling', 'Avslutning', 'Kontrapress',
    'Innlegg', 'Dødball', 'Keepertrening', 'Kondisjon', 'Styrke', 'Taktikk', 'Individuell teknikk',
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-canvas-sunken border-b border-rule">
        <button onClick={onCancel} className="text-meta text-ink-subtle hover:text-signal mb-2 inline-flex items-center gap-1 min-h-[44px]">
          <ChevronLeft size={15} strokeWidth={1.75} aria-hidden /> Tilbake
        </button>
        <h2 className="font-serif text-[1.5rem] leading-tight text-ink">Ny trening</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-w-2xl mx-auto w-full">
        <div>
          <label className={LABEL_CLASS}>Tittel *</label>
          <input value={title} onChange={e => { setTitle(e.target.value); if (error) setError(''); }}
            placeholder="F.eks. Teknikktrening, 4-3-3 trening..."
            className={INPUT_CLASS} />
          {error && <p role="alert" className="mt-2 text-caption text-signal">{error}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Dato</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Tid</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className={INPUT_CLASS} />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Sted</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Stadion / hall" className={INPUT_CLASS} />
        </div>

        <div>
          <label className={LABEL_CLASS}>Fokusområder (valgfritt)</label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {FOCUS_OPTIONS.map(f => (
              <button key={f} type="button"
                onClick={() => setFocusTags(prev =>
                  prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                )}
                className={`px-2.5 py-1.5 sm:py-1 rounded-full text-meta font-semibold border transition-all min-h-[36px] sm:min-h-0
                  ${toggleClass(focusTags.includes(f))}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Øvelser fra biblioteket (velg flere)</label>

          {selectedDrills.length > 0 && (
            <div className="mb-2 space-y-1 max-h-32 overflow-y-auto">
              {selectedDrills.map(drill => (
                <div key={drill.id} className="flex items-center justify-between bg-canvas-sunken rounded-ctl px-3 py-2 border border-rule">
                  <div className="flex-1">
                    <div className="text-body font-semibold text-ink">{drill.name}</div>
                    <DrillOrigin drill={drill} />
                    <div className="text-meta text-ink-subtle">{drill.duration} min · {drill.players} spillere</div>
                    {drill.warning && <div className="mt-1"><DrillWarning text={drill.warning} compact /></div>}
                  </div>
                  <button type="button" onClick={() => removeDrill(drill.id)}
                    className={ICON_BTN} aria-label="Fjern"><X size={14} strokeWidth={1.75} /></button>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => setShowDrillPicker(!showDrillPicker)}
            className="w-full mt-1 py-2.5 sm:py-2 px-3 rounded-ctl border border-rule text-left text-body text-ink-subtle hover:border-signal/50 hover:text-ink-muted transition-all flex items-center justify-between min-h-[44px]">
            <span>{selectedDrills.length > 0 ? `Legg til flere (${selectedDrills.length} valgt)` : 'Velg øvelser'}</span>
            {showDrillPicker
              ? <ChevronUp size={15} strokeWidth={1.75} aria-hidden />
              : <ChevronDown size={15} strokeWidth={1.75} aria-hidden />}
          </button>

          <button
            type="button"
            onClick={() => setShowCustomDrill(!showCustomDrill)}
            className="w-full mt-2 py-2.5 sm:py-2 px-3 rounded-ctl border border-dashed border-signal/50 text-left text-body text-signal hover:bg-signal/10 transition-all flex items-center justify-between min-h-[44px]"
          >
            <span>Legg til egen øvelse</span>
            {showCustomDrill
              ? <ChevronUp size={15} strokeWidth={1.75} aria-hidden />
              : <ChevronDown size={15} strokeWidth={1.75} aria-hidden />}
          </button>

          {showCustomDrill && (
            <div className="mt-2 p-3 bg-canvas-sunken rounded-panel border border-signal/40">
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Øvelsesnavn *"
                  value={customDrillName}
                  onChange={e => { setCustomDrillName(e.target.value); if (customDrillError) setCustomDrillError(''); }}
                  className="w-full bg-canvas-raised border border-rule rounded-ctl px-3 py-2.5 text-body text-ink min-h-[44px]"
                />
                {customDrillError && (
                  <p role="alert" className="mt-1.5 text-caption text-signal">{customDrillError}</p>
                )}
              </div>
              <textarea
                placeholder="Beskrivelse (valgfritt)"
                value={customDrillDesc}
                onChange={e => setCustomDrillDesc(e.target.value)}
                rows={2}
                className="w-full mb-2 bg-canvas-raised border border-rule rounded-ctl px-3 py-2.5 text-body text-ink resize-y"
              />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-meta text-ink-subtle">Varighet:</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customDrillDuration}
                  onChange={e => setCustomDrillDuration(Number(e.target.value))}
                  className="w-20 bg-canvas-raised border border-rule rounded-ctl px-2 py-2 text-body text-ink text-center min-h-[44px]"
                />
                <span className="text-meta text-ink-subtle">minutter</span>
              </div>
              <button
                type="button"
                onClick={addCustomDrill}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-ctl bg-signal/10 border border-signal/40 text-signal text-body font-semibold hover:bg-signal/15 min-h-[44px]"
              >
                <Check size={15} strokeWidth={2} aria-hidden /> Legg til øvelse
              </button>
            </div>
          )}

          {showDrillPicker && (
            <div className="mt-2 bg-canvas-sunken border border-rule rounded-panel overflow-hidden">
              <div className="p-2 border-b border-rule space-y-2">
                <input type="text" placeholder="Søk etter øvelse …"
                  value={drillSearch} onChange={e => setDrillSearch(e.target.value)}
                  className={TEXTAREA_CLASS} />
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setDrillCategory('alle')}
                    className={`px-2 py-1.5 sm:py-1 rounded-ctl text-meta font-semibold transition-all min-h-[32px] sm:min-h-0
                      ${drillCategory === 'alle' ? 'bg-signal/15 text-signal border border-signal/40' : 'text-ink-subtle hover:text-ink-muted'}`}>
                    Alle
                  </button>
                  {DRILL_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setDrillCategory(cat)}
                      className={`px-2 py-1.5 sm:py-1 rounded-ctl text-meta font-semibold transition-all min-h-[32px] sm:min-h-0
                        ${drillCategory === cat ? 'bg-signal/15 text-signal border border-signal/40' : 'text-ink-subtle hover:text-ink-muted'}`}>
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setDrillDifficulty('alle')}
                    className={`px-2 py-1.5 sm:py-1 rounded-ctl text-meta font-semibold transition-all min-h-[32px] sm:min-h-0
                      ${drillDifficulty === 'alle' ? 'bg-signal/15 text-signal border border-signal/40' : 'text-ink-subtle hover:text-ink-muted'}`}>
                    Alle
                  </button>
                  {(['enkel', 'middels', 'avansert'] as const).map(level => (
                    <button key={level} onClick={() => setDrillDifficulty(level)}
                      className={`px-2 py-1.5 sm:py-1 rounded-ctl text-meta font-semibold transition-all min-h-[32px] sm:min-h-0
                        ${drillDifficulty === level
                          ? level === 'enkel' ? 'bg-signal/15 text-signal border border-signal/40'
                            : level === 'middels' ? 'bg-warn-500/15 text-warn-400 border border-warn-500/40'
                            : 'bg-bad-500/15 text-bad-400 border border-bad-500/40'
                          : 'text-ink-subtle hover:text-ink-muted'}`}>
                      {level === 'enkel' ? 'Enkel' : level === 'middels' ? 'Middels' : 'Avansert'}
                    </button>
                  ))}
                </div>
                <div className="text-meta text-ink-subtle text-right">{filteredDrills.length} øvelser</div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredDrills.length === 0 ? (
                  <div className="text-center py-8 text-ink-subtle text-body">
                    Ingen øvelser funnet. Klikk &quot;Legg til egen øvelse&quot; for å opprette en.
                  </div>
                ) : (
                  filteredDrills.map(drill => {
                    const isSelected = selectedDrills.some(sd => sd.id === drill.id);
                    return (
                      <button key={drill.id} type="button"
                        onClick={() => isSelected ? removeDrill(drill.id) : addDrill(drill)}
                        className={`w-full text-left px-3 py-3 sm:py-2.5 text-body hover:bg-canvas-raised border-b border-rule transition-all min-h-[44px]
                          ${isSelected ? 'text-signal bg-signal/10' : 'text-ink-muted'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-4 flex-shrink-0 ${isSelected ? 'text-signal' : 'text-ink-faint'}`}>
                            {isSelected ? <Check size={14} strokeWidth={2} aria-hidden /> : '·'}
                          </span>
                          <div className="flex-1">
                            <div className="font-semibold">{drill.name}</div>
                            <DrillOrigin drill={drill} />
                            <div className="text-meta text-ink-subtle">
                              {CATEGORY_LABELS[drill.category]} · {drill.duration} min · {drill.players} spillere ·
                              <span className={drill.difficulty === 'enkel' ? 'text-signal' : drill.difficulty === 'middels' ? 'text-warn-400' : 'text-bad-400'}> {drill.difficulty}</span>
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

        <div>
          <label className={LABEL_CLASS}>Beskrivelse / notat</label>
          <textarea value={teamNote} onChange={e => setTeamNote(e.target.value)}
            rows={3} placeholder="Mål for økten, beskjeder til spillerne..."
            className={TEXTAREA_CLASS} />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button type="button" onClick={save} disabled={!title.trim()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-panel bg-signal/10 border border-signal/40 text-signal font-bold text-lead hover:bg-signal/15 disabled:opacity-40 transition min-h-[48px]">
            Opprett trening
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-3 rounded-panel border border-rule text-ink-subtle font-bold text-lead hover:text-ink-muted transition min-h-[48px]">
            Avbryt
          </button>
        </div>
      </div>

    </div>
  );
};
