'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ALL_DRILLS, getDrillsByCategory, CATEGORY_LABELS } from '@/data/drills';
import type { CalendarEvent, DrillExercise, DrillCategory, DrillDifficulty, Tactic, TrainingNote } from '@/types';
import { SPORT_LABELS } from '@/store/selectors';
import { TACTIC_DEFAULT_MIN, totalMinutes, sessionShareText } from '@/lib/trainingSession';
import { DrillDetailModal } from './DrillDetailModal';
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus, X, Check, Square, CheckSquare,
  Play, Pause, StopCircle, Timer, MapPin, Trash2, AlertTriangle, CalendarDays,
  ClipboardList, BookOpen, Pencil, ArrowUp, ArrowDown, Share2,
} from 'lucide-react';
import { INPUT_CLASS, TEXTAREA_CLASS, LABEL_CLASS, toggleClass, ICON_BTN, PRIMARY_BTN } from '@/lib/formClasses';
import { ViewHeader, StatTile } from '@/components/layout/Surface';
import { NAV } from '@/components/layout/navigation';

const DRILL_CATEGORIES: DrillCategory[] = ['keeper', 'forsvar', 'midtbane', 'angrep', 'cardio', 'styrke'];

/** Gul advarselsboks for øvelser med `warning`. */
const DrillWarning: React.FC<{ text: string; compact?: boolean }> = ({ text, compact }) => (
  <div className={`flex gap-2 bg-warn-500/10 border border-warn-500/40 rounded-ctl ${compact ? 'p-2' : 'p-2.5 sm:p-3'}`}>
    <AlertTriangle size={14} strokeWidth={1.75} aria-hidden className="text-warn-400 flex-shrink-0 mt-0.5" />
    <p className="text-meta text-ink-muted leading-relaxed">{text}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
//  TRENING-VISNING (RESPONSIV OPPDATERT)
// ═══════════════════════════════════════════════════════════════

interface TrainingViewProps {
  initialTraining?: CalendarEvent;
  onBack?: () => void;
  /** Åpner skjemaet for ny trening med én gang (hurtigvalg på dashbordet). */
  initialNew?: boolean;
  /** Melder hvilken trening som er åpen (null = lista), så AI-treneren kan bruke den. */
  onSelectedChange?: (eventId: string | null) => void;
}

// ═══ OVERSIKT ØVERST I LISTA ══════════════════════════════════════
// Leser bare eksisterende treninger: varighet fra punktene, tema fra fokus.

const DAY_MS = 86_400_000;
const isoOffset = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);

const TrainingOverview: React.FC<{ trainings: CalendarEvent[]; today: string }> = ({ trainings, today }) => {
  const upcoming = trainings.filter(e => e.date >= today);
  const next = upcoming[0];
  const in7 = upcoming.filter(e => e.date <= isoOffset(7));
  const past28 = trainings.filter(e => e.date < today && e.date >= isoOffset(-28));

  // Fokus teller én gang per trening, ikke per punkt.
  const focusCount = new Map<string, number>();
  upcoming.forEach(ev => {
    new Set(ev.trainingNotes.flatMap(n => n.focus)).forEach(f => focusCount.set(f, (focusCount.get(f) ?? 0) + 1));
  });
  const topFocus = [...focusCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => f);

  const nextDate = next ? new Date(next.date + 'T12:00:00') : null;
  const nextLabel = nextDate ? nextDate.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) : '–';
  const nextDay = nextDate ? nextDate.toLocaleDateString('nb-NO', { weekday: 'short' }) : '';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
      <StatTile icon={NAV.training.icon} tone={NAV.training.tile} label="Neste økt"
        value={<span className="text-[1.25rem]">{nextLabel}</span>}
        hint={next ? `${nextDay}${next.time ? ` ${next.time}` : ''} · ${totalMinutes(next.trainingNotes)} min` : 'Ingen planlagt'} />
      <StatTile icon={Timer} label="Neste 7 dager"
        value={in7.length}
        hint={`${in7.reduce((m, e) => m + totalMinutes(e.trainingNotes), 0)} min totalt`} />
      <StatTile icon={ClipboardList} label="Siste 4 uker"
        value={past28.length}
        hint={`${past28.reduce((m, e) => m + totalMinutes(e.trainingNotes), 0)} min gjennomført`} />
      <StatTile icon={BookOpen} label="Tema fremover"
        value={<span className="text-[1.25rem]">{topFocus.length}</span>}
        hint={topFocus.length ? topFocus.join(', ') : 'Ingen fokus satt'} />
    </div>
  );
};

export const TrainingView: React.FC<TrainingViewProps> = ({ initialTraining, onBack, initialNew, onSelectedChange }) => {
  const {
    events, addEvent, updateEvent,
    addTrainingNote, deleteTrainingNote,
    rosterNames, setRosterNames,
    ageGroup,
  } = useAppStore();

  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialTraining?.id || null);
  const [showNewTraining, setShowNewTraining] = useState(!!initialNew);

  useEffect(() => {
    if (initialTraining?.id) {
      setSelectedEventId(initialTraining.id);
    }
  }, [initialTraining]);

  useEffect(() => { onSelectedChange?.(selectedEventId); }, [selectedEventId, onSelectedChange]);

  const today = new Date().toISOString().slice(0, 10);
  const trainings = useMemo(() =>
    events.filter(e => e.type === 'training').sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );
  const upcoming = trainings.filter(e => e.date >= today);
  const past     = trainings.filter(e => e.date < today).reverse();

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

  if (showNewTraining) {
    return (
      <NewTrainingForm
        onSave={(ev) => { addEvent(ev); setShowNewTraining(false); }}
        onCancel={() => setShowNewTraining(false)}
        ageGroup={ageGroup}
      />
    );
  }

  if (selectedEvent) {
    return (
      <TrainingDetail
        event={selectedEvent}
        rosterNames={rosterNames}
        ageGroup={ageGroup}
        onBack={() => {
          setSelectedEventId(null);
          if (initialTraining && onBack) onBack();
        }}
        onUpdate={(fields) => updateEvent(selectedEvent.id, fields)}
        onAddNote={(note) => addTrainingNote(selectedEvent.id, note)}
        onDeleteNote={(nid) => deleteTrainingNote(selectedEvent.id, nid)}
        onSaveRoster={setRosterNames}
      />
    );
  }

  const newBtn = (
    <button onClick={() => setShowNewTraining(true)} className={PRIMARY_BTN}>
      <Plus size={15} strokeWidth={2} aria-hidden /> Ny trening
    </button>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ViewHeader
        eyebrow="Arbeid"
        title="Trening"
        subtitle="Økter, innhold, varighet og fremmøte"
        actions={newBtn}
      />
      {/* Mobil: topplinja viser tittelen, her står bare hovedhandlingen. */}
      <div className="sm:hidden flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-rule bg-canvas">
        <p className="flex-1 min-w-0 text-meta text-ink-subtle truncate">Økter og fremmøte</p>
        {newBtn}
      </div>

      <div className="flex-shrink-0 flex border-b border-rule bg-canvas px-2 sm:px-4">
        {([
          ['upcoming', 'Kommende',  upcoming.length],
          ['history',  'Historikk',  past.length],
        ] as const).map(([id, label, count]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 sm:flex-none sm:px-4 py-2.5 sm:py-3 text-body font-semibold transition-all min-h-[44px] leading-tight px-1 border-b-2
              ${tab === id ? 'text-ink border-signal' : 'text-ink-subtle border-transparent hover:text-ink'}`}>
            {label} {count > 0 ? `(${count})` : ''}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6">

        {tab === 'upcoming' && (
          <div className="space-y-3 max-w-4xl mx-auto">
            <TrainingOverview trainings={trainings} today={today} />
            {upcoming.length === 0 && (
              <div className="text-center py-12">
                <CalendarDays size={26} strokeWidth={1.5} aria-hidden className="mx-auto text-ink-faint mb-3" />
                <p className="text-body text-ink-subtle">Ingen kommende treninger.</p>
                <button onClick={() => setShowNewTraining(true)}
                  className="inline-flex items-center justify-center gap-1.5 mt-4 px-4 py-2.5 sm:py-2 rounded-panel bg-signal/10 border border-signal/40
                    text-signal text-body font-bold hover:bg-signal/15 transition min-h-[44px]">
                  <Plus size={15} strokeWidth={2} aria-hidden /> Opprett ny trening
                </button>
              </div>
            )}
            {upcoming.map(ev => (
              <TrainingCard
                key={ev.id}
                event={ev}
                onClick={() => setSelectedEventId(ev.id)}
                onStart={() => setSelectedEventId(ev.id)}
              />
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3 max-w-4xl mx-auto">
            {past.length === 0 && (
              <div className="text-center py-12">
                <ClipboardList size={26} strokeWidth={1.5} aria-hidden className="mx-auto text-ink-faint mb-3" />
                <p className="text-body text-ink-subtle">Ingen gjennomførte treninger ennå.</p>
              </div>
            )}
            {past.map(ev => (
              <TrainingCard
                key={ev.id}
                event={ev}
                past
                onClick={() => setSelectedEventId(ev.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ NY TRENINGSFORM (RESPONSIV OPPDATERT) ═══════════════════════

const NewTrainingForm: React.FC<{
  onSave: (ev: Omit<any, 'id'>) => void;
  onCancel: () => void;
  ageGroup: 'youth' | 'adult';
}> = ({ onSave, onCancel, ageGroup }) => {
  const today = new Date().toISOString().slice(0, 10);
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
  const [saving, setSaving] = useState(false);
  const [customDrillName, setCustomDrillName] = useState('');
  const [customDrillDesc, setCustomDrillDesc] = useState('');
  const [customDrillDuration, setCustomDrillDuration] = useState(10);
  const [showCustomDrill, setShowCustomDrill] = useState(false);
  const [error, setError] = useState('');
  const [customDrillError, setCustomDrillError] = useState('');

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
    setSaving(true);

    const drillNotes = selectedDrills.map(d =>
      `\n${d.name}\n${d.description}\nVarighet: ${d.duration} min${d.warning ? `\nAdvarsel: ${d.warning}` : ''}`
    ).join('');

    const focusNote = focusTags.length > 0 ? `Fokus: ${focusTags.join(', ')}` : '';

    const trainingNotes = selectedDrills.map(drill => ({
      id: `tn-${Date.now()}-${drill.id}`,
      createdAt: new Date().toISOString(),
      title: drill.name,
      content: drill.description,
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

    setSaving(false);
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
            {FOCUS_OPTIONS.slice(0, 8).map(f => (
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
                    Ingen øvelser funnet. Klikk "Legg til egen øvelse" for å opprette en.
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
          <button type="button" onClick={save} disabled={saving || !title.trim()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-panel bg-signal/10 border border-signal/40 text-signal font-bold text-lead hover:bg-signal/15 disabled:opacity-40 transition min-h-[48px]">
            {saving ? 'Oppretter …' : 'Opprett trening'}
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

// ═══ TRAINING CARD (RESPONSIV OPPDATERT) ═══════════════════════

const TrainingCard: React.FC<{
  event: any;
  past?: boolean; onClick: () => void; onStart?: () => void;
}> = ({ event, past, onClick, onStart }) => {
  const dateStr = new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const attendeeCount: number = event.attendance?.length ?? 0;

  const isUpcoming = !past && new Date(event.date) >= new Date();

  return (
    <div className="bg-canvas-panel rounded-panel border border-rule hover:border-rule-strong transition-all">
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5">
        <div onClick={onClick} className="flex-1 flex items-center gap-2 sm:gap-3 cursor-pointer active:scale-[0.99]">
          <div className={`w-2 h-12 rounded-full flex-shrink-0 ${past ? 'bg-ink-faint' : 'bg-signal'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-body font-bold text-ink truncate">{event.title}</div>
            <div className="text-meta text-ink-subtle">
              {dateStr}{event.time && ` · ${event.time}`}
              {event.location && ` · ${event.location}`}
            </div>
            {event.trainingNotes?.length > 0 && (
              <div className="text-meta text-ink-subtle mt-0.5 inline-flex items-center gap-1">
                <ClipboardList size={12} strokeWidth={1.75} aria-hidden />
                {event.trainingNotes[0].title}
                {event.trainingNotes.length > 1 && ` +${event.trainingNotes.length - 1}`}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {attendeeCount > 0 && (
              <div className="text-meta text-signal font-bold inline-flex items-center gap-1">
                <Check size={12} strokeWidth={2} aria-hidden /> {attendeeCount} møtte
              </div>
            )}
            <ChevronRight size={14} strokeWidth={1.75} aria-hidden className="text-ink-faint" />
          </div>
        </div>
        {isUpcoming && onStart && (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-ctl bg-signal/10 border border-signal/40
              text-signal text-meta font-bold hover:bg-signal/15 transition min-h-[44px]"
          >
            <Play size={14} strokeWidth={2} fill="currentColor" aria-hidden /> Start
          </button>
        )}
      </div>
    </div>
  );
};

// ═══ STOPPEKLOKKE (RESPONSIV OPPDATERT) ═══════════════════════

const Stopwatch: React.FC<{
  duration: number;
  onComplete: () => void;
  onCancel: () => void;
}> = ({ duration, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState((duration || 5) * 60);
  const [isActive, setIsActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="bg-canvas-sunken rounded-panel p-3 sm:p-4 border border-rule">
      <div className="text-center">
        <div className="text-[2.25rem] font-mono font-bold text-ink mb-2">{formatTime(timeLeft)}</div>
        <div className="w-full bg-canvas-raised rounded-full h-2 mb-4">
          <div className="bg-signal h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-2 justify-center">
          <button onClick={() => setIsPaused(!isPaused)}
            className="px-3 sm:px-4 py-2 sm:py-2 rounded-ctl bg-signal/10 border border-signal/40 text-signal text-body font-semibold min-h-[44px]">
            {isPaused
              ? <><Play size={14} strokeWidth={2} fill="currentColor" aria-hidden /> Fortsett</>
              : <><Pause size={14} strokeWidth={2} fill="currentColor" aria-hidden /> Pause</>}
          </button>
          <button onClick={onCancel}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2 rounded-ctl bg-bad-500/15 border border-bad-500/40 text-bad-400 text-body font-semibold min-h-[44px]">
            <StopCircle size={14} strokeWidth={1.75} aria-hidden /> Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══ TRAINING DETAIL (RESPONSIV OPPDATERT) ═════════════════════

const TrainingDetail: React.FC<{
  event: any;
  rosterNames: string[]; ageGroup: 'youth' | 'adult';
  onBack: () => void;
  onUpdate: (fields: any) => void;
  onAddNote: (note: any) => void;
  onDeleteNote: (nid: string) => void;
  onSaveRoster: (names: string[]) => void;
}> = ({ event, rosterNames, ageGroup, onBack, onUpdate, onAddNote, onDeleteNote, onSaveRoster }) => {
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAddNote, setShowAddNote]       = useState(false);
  const [noteTitle, setNoteTitle]           = useState('');
  const [noteContent, setNoteContent]       = useState('');
  const [selectedDrill, setSelectedDrill]   = useState<DrillExercise | null>(null);
  const [showDrillPicker, setShowDrillPicker] = useState(false);
  const [activeStopwatch, setActiveStopwatch] = useState<string | null>(null);
  const [completedDrills, setCompletedDrills] = useState<Set<string>>(new Set());
  const [selectedDrillForModal, setSelectedDrillForModal] = useState<DrillExercise | null>(null);
  const [showTacticPicker, setShowTacticPicker] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const tactics            = useAppStore(s => s.tactics);
  const setActiveTactic    = useAppStore(s => s.setActiveTactic);
  const setView            = useAppStore(s => s.setView);
  const moveTrainingNote   = useAppStore(s => s.moveTrainingNote);
  const updateTrainingNote = useAppStore(s => s.updateTrainingNote);
  const notes: TrainingNote[] = event.trainingNotes ?? [];

  const addTacticItem = (t: Tactic, minutes: number) => {
    const phases = t.phases.length === 1 ? '1 fase' : `${t.phases.length} faser`;
    onAddNote({
      title: t.name,
      content: `${SPORT_LABELS[t.sport]} · ${t.formation} · ${phases}`,
      duration: minutes,
      completed: false,
      focus: [],
      tacticId: t.id,
    });
    setShowTacticPicker(false);
  };

  const openTactic = (id: string) => { setActiveTactic(id); setView('board'); };

  // Delingsark på mobil, ellers utklippstavla. Avbrutt deling er ingen feil.
  const share = async () => {
    const text = sessionShareText({ date: event.date, trainingNotes: notes });
    try {
      if (typeof navigator.share === 'function') { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      setShareMsg('Kopiert – lim inn i en melding.');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setShareMsg('Klarte ikke å dele. Prøv igjen.');
    }
    setTimeout(() => setShareMsg(''), 3000);
  };

  const drills = useMemo(() => ALL_DRILLS.filter(d => d.ageGroup === ageGroup), [ageGroup]);
  const dateStr = new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const weekday = new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'long' });
  const dayTitle = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${new Date(event.date + 'T12:00:00').getDate()}.`;

  const attendance: string[] = event.attendance ?? [];
  const attendedCount = rosterNames.filter(n => attendance.includes(n)).length;

  const toggleAttendance = (name: string) => {
    onUpdate({
      attendance: attendance.includes(name)
        ? attendance.filter(n => n !== name)
        : [...attendance, name],
    });
  };

  const saveNote = () => {
    if (!noteTitle.trim() && !selectedDrill) return;
    onAddNote({
      title: selectedDrill ? selectedDrill.name : noteTitle.trim(),
      content: selectedDrill ? selectedDrill.description : noteContent.trim(),
      duration: selectedDrill?.duration || 5,
      completed: false,
      focus: [],
    });
    setNoteTitle(''); setNoteContent(''); setSelectedDrill(null); setShowAddNote(false);
  };

  const handleCompleteDrill = (noteId: string) => {
    setCompletedDrills(prev => new Set(prev).add(noteId));
    setActiveStopwatch(null);
    const updatedNotes = event.trainingNotes?.map((tn: any) =>
      tn.id === noteId ? { ...tn, completed: true } : tn
    );
    onUpdate({ trainingNotes: updatedNotes });
  };

  const handleTeamNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ teamNote: e.target.value });
  }, [onUpdate]);

  const findDrillByName = (title: string) => {
    const searchTitle = title.trim().toLowerCase();
    const matches = (d: DrillExercise) => d.name.trim().toLowerCase() === searchTitle;
    // Aldersgruppen først; øktene kan være laget for den andre gruppen.
    return drills.find(matches) ?? ALL_DRILLS.find(matches);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-canvas-sunken border-b border-rule">
        <button onClick={onBack} className="text-meta text-ink-subtle hover:text-signal mb-2 inline-flex items-center gap-1 min-h-[44px]">
          <ChevronLeft size={15} strokeWidth={1.75} aria-hidden /> Tilbake
        </button>
        <h2 className="font-serif text-[1.75rem] leading-tight text-ink">{dayTitle}</h2>
        <p className="text-lead text-ink mt-0.5">{event.title}</p>
        <p className="text-meta text-ink-subtle mt-1 flex items-center gap-x-3 gap-y-0.5 flex-wrap">
          <span>{dateStr}</span>
          {event.time && <span className="font-mono">{event.time}</span>}
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} strokeWidth={1.75} aria-hidden /> {event.location}
            </span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-w-2xl mx-auto w-full">

        {activeStopwatch && (
          <div className="bg-signal/10 border border-signal/40 rounded-panel p-3 sm:p-4">
            <div className="text-meta font-bold text-signal mb-2 inline-flex items-center gap-1.5">
              <Timer size={13} strokeWidth={1.75} aria-hidden /> Pågående øvelse
            </div>
            <Stopwatch
              duration={activeStopwatch === 'custom' ? 5 : (event.trainingNotes?.find((tn: any) => tn.id === activeStopwatch)?.duration || 5)}
              onComplete={() => {
                if (activeStopwatch !== 'custom') {
                  handleCompleteDrill(activeStopwatch);
                } else {
                  setActiveStopwatch(null);
                }
              }}
              onCancel={() => setActiveStopwatch(null)}
            />
          </div>
        )}

        {event.teamNote && (
          <div className="bg-canvas-panel border border-rule rounded-panel p-3 sm:p-4">
            <div className={LABEL_CLASS + ' mb-2'}>Fra trener</div>
            <p className="text-body text-ink-muted leading-relaxed whitespace-pre-wrap">{event.teamNote}</p>
          </div>
        )}

        <div>
          <div className="text-meta font-bold text-ink-faint uppercase tracking-wider mb-1.5">Generelt notat</div>
          <textarea value={event.teamNote ?? ''} onChange={handleTeamNoteChange}
            rows={3} placeholder="Mål for økten, beskjeder til spillerne..."
            className={TEXTAREA_CLASS} />
        </div>

        <div>
          <button onClick={() => setShowAttendance(!showAttendance)}
            className="flex items-center gap-2 w-full text-left mb-2 min-h-[44px]">
            <span className={LABEL_CLASS}>
              Fremmøte ({attendedCount}/{rosterNames.length})
            </span>
            {showAttendance
              ? <ChevronUp size={14} strokeWidth={1.75} aria-hidden className="text-ink-faint" />
              : <ChevronDown size={14} strokeWidth={1.75} aria-hidden className="text-ink-faint" />}
          </button>
          {showAttendance && (
            <>
              {rosterNames.length === 0 && (
                <p className="text-meta text-ink-faint italic mb-1">
                  Ingen navn i listen ennå – legg dem til under for å registrere fremmøte.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rosterNames.map(name => {
                  const attended = attendance.includes(name);
                  return (
                    <button key={name} onClick={() => toggleAttendance(name)}
                      className={`flex items-center gap-2 p-2.5 sm:p-2.5 rounded-panel border transition-all text-left min-h-[44px]
                        ${attended
                          ? 'bg-signal/10 border-signal/50 text-signal'
                          : 'bg-canvas-panel border-rule text-ink-subtle'}`}>
                      {attended
                        ? <CheckSquare size={16} strokeWidth={1.75} aria-hidden className="flex-shrink-0" />
                        : <Square size={16} strokeWidth={1.75} aria-hidden className="flex-shrink-0" />}
                      <span className="text-meta sm:text-body font-semibold truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
              <RosterEditor rosterNames={rosterNames} onSave={onSaveRoster} />
            </>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={LABEL_CLASS}>Øvelser og notater</span>
            <button onClick={() => { setShowTacticPicker(!showTacticPicker); setShowAddNote(false); }}
              className="inline-flex items-center justify-center gap-1.5 ml-auto text-meta text-signal hover:brightness-110 font-semibold min-h-[44px] px-2">
              <Plus size={14} strokeWidth={2} aria-hidden className="inline" /> Legg til taktikk
            </button>
            <button onClick={() => { setShowAddNote(!showAddNote); setShowTacticPicker(false); }}
              className="inline-flex items-center justify-center gap-1.5 text-meta text-signal hover:brightness-110 font-semibold min-h-[44px] px-2">
              <Plus size={14} strokeWidth={2} aria-hidden className="inline" /> Legg til
            </button>
          </div>

          {showTacticPicker && (
            <TacticPicker tactics={tactics} onPick={addTacticItem} onCancel={() => setShowTacticPicker(false)} />
          )}

          {showAddNote && (
            <div className="bg-canvas-sunken border border-dashed border-rule rounded-panel p-3 sm:p-4 mb-3">
              <button onClick={() => setShowDrillPicker(!showDrillPicker)}
                className="w-full text-left py-2.5 sm:py-2 px-3 rounded-ctl border border-rule
                  text-body text-ink-subtle hover:border-signal/50 mb-3 flex items-center justify-between min-h-[44px]">
                <span>{selectedDrill ? selectedDrill.name : 'Velg fra øvelsesbiblioteket'}</span>
                {showDrillPicker
                  ? <ChevronUp size={15} strokeWidth={1.75} aria-hidden />
                  : <ChevronDown size={15} strokeWidth={1.75} aria-hidden />}
              </button>
              {showDrillPicker && (
                <div className="bg-canvas-raised border border-rule rounded-panel max-h-40 overflow-y-auto mb-3">
                  <button onClick={() => { setSelectedDrill(null); setShowDrillPicker(false); }}
                    className="w-full text-left px-3 py-2.5 text-body text-ink-subtle hover:bg-canvas-hover border-b border-rule min-h-[44px]">
                    Ingen øvelse
                  </button>
                  {drills.map(d => (
                    <button key={d.id} onClick={() => { setSelectedDrill(d); setShowDrillPicker(false); setNoteTitle(d.name); }}
                      className="w-full text-left px-3 py-2.5 text-body text-ink-muted hover:bg-canvas-hover border-b border-rule min-h-[44px]">
                      <div className="font-semibold inline-flex items-center gap-1">
                        {d.warning && <AlertTriangle size={12} strokeWidth={1.75} aria-hidden className="text-warn-400" />}
                        {d.name}
                      </div>
                      <div className="text-meta text-ink-subtle">{CATEGORY_LABELS[d.category]} · {d.duration} min · {d.difficulty}</div>
                    </button>
                  ))}
                </div>
              )}
              {!selectedDrill && (
                <>
                  <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)}
                    placeholder="Tittel" className={TEXTAREA_CLASS} />
                  <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                    rows={2} placeholder="Beskrivelse..."
                    className={TEXTAREA_CLASS} />
                </>
              )}
              <div className="flex gap-2">
                <button onClick={saveNote}
                  className="flex-1 py-2.5 rounded-ctl bg-signal/10 border border-signal/40 text-signal font-bold text-body hover:bg-signal/15 min-h-[44px]">
                  Lagre
                </button>
                <button onClick={() => setShowAddNote(false)}
                  className="px-4 py-2.5 rounded-ctl border border-rule text-ink-subtle text-body min-h-[44px]">
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {notes.map((tn, idx) => {
              const isCompleted = completedDrills.has(tn.id) || tn.completed;
              const hasTimer = (tn.duration && tn.duration > 0) || tn.duration === undefined;
              const isTactic = !!tn.tacticId;
              // En slettet taktikk står igjen som notat: grå, og uten vei til brettet.
              const tacticGone = isTactic && !tactics.some(t => t.id === tn.tacticId);
              const fullDrill = isTactic ? undefined : findDrillByName(tn.title);

              return (
                <div key={tn.id} className={`bg-canvas-panel border rounded-panel p-3 sm:p-4 mb-3 transition-all
                  ${isCompleted ? 'border-signal/40 opacity-70' : 'border-rule'}`}>
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {tacticGone ? (
                          <span className="text-body font-bold text-ink-faint min-h-[44px] inline-flex items-center">
                            {tn.title}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (tn.tacticId) openTactic(tn.tacticId);
                              else if (fullDrill) setSelectedDrillForModal(fullDrill);
                            }}
                            title={isTactic ? 'Åpne på brettet' : undefined}
                            className="text-body font-bold text-ink hover:text-signal hover:underline transition text-left min-h-[44px]"
                          >
                            {tn.title}
                          </button>
                        )}
                        {isTactic && (
                          <span className="text-meta bg-canvas-raised px-2 py-0.5 rounded-full text-ink-muted">
                            {tacticGone ? 'Taktikk · slettet' : 'Taktikk'}
                          </span>
                        )}
                        {isTactic ? (
                          <label className="inline-flex items-center gap-1 text-meta text-ink-muted">
                            <Timer size={11} strokeWidth={1.75} aria-hidden />
                            <input type="number" inputMode="numeric" min={1} max={180}
                              value={tn.duration ?? TACTIC_DEFAULT_MIN}
                              onChange={e => {
                                const v = Math.round(Number(e.target.value));
                                if (Number.isFinite(v) && v >= 1 && v <= 180) updateTrainingNote(event.id, tn.id, { duration: v });
                              }}
                              aria-label={`Minutter for ${tn.title}`}
                              className="w-14 rounded-ctl bg-canvas-raised shadow-hair px-1.5 py-0.5 text-meta text-ink text-right focus:outline-none focus:shadow-hair-signal" />
                            min
                          </label>
                        ) : hasTimer && (
                          <span className="text-meta bg-canvas-raised px-2 py-0.5 rounded-full text-ink-muted">
                            <Timer size={11} strokeWidth={1.75} aria-hidden className="inline -mt-px" /> {tn.duration || 5} min
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-meta bg-signal/15 px-2 py-0.5 rounded-full text-signal">
                            <Check size={11} strokeWidth={2} aria-hidden className="inline -mt-px" /> Fullført
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center ml-2">
                      <button onClick={() => moveTrainingNote(event.id, tn.id, -1)} disabled={idx === 0}
                        className={ICON_BTN + ' disabled:opacity-30 disabled:hover:bg-transparent'} aria-label={`Flytt ${tn.title} opp`}>
                        <ArrowUp size={14} strokeWidth={1.75} /></button>
                      <button onClick={() => moveTrainingNote(event.id, tn.id, 1)} disabled={idx === notes.length - 1}
                        className={ICON_BTN + ' disabled:opacity-30 disabled:hover:bg-transparent'} aria-label={`Flytt ${tn.title} ned`}>
                        <ArrowDown size={14} strokeWidth={1.75} /></button>
                      <button onClick={() => onDeleteNote(tn.id)}
                        className={ICON_BTN} aria-label={`Slett ${tn.title}`}><Trash2 size={14} strokeWidth={1.75} /></button>
                    </div>
                  </div>

                  <p className={`text-body leading-relaxed mb-3 ${tacticGone ? 'text-ink-faint' : 'text-ink-muted'}`}>{tn.content}</p>

                  {fullDrill && (
                    <div className="mt-3 pt-3 border-t border-rule space-y-2">

                      {fullDrill.warning && <DrillWarning text={fullDrill.warning} />}

                      {fullDrill.steps.length > 0 && (
                        <div>
                          <div className={LABEL_CLASS + ' mb-1.5'}>Steg</div>
                          <div className="space-y-1">
                            {fullDrill.steps.slice(0, 3).map((step, idx) => (
                              <div key={step.id} className="flex gap-2 text-meta text-ink-muted">
                                <span className="text-signal font-bold">{idx + 1}.</span>
                                <span>{step.name || step.description}</span>
                              </div>
                            ))}
                            {fullDrill.steps.length > 3 && (
                              <button
                                onClick={() => setSelectedDrillForModal(fullDrill)}
                                className="text-meta text-signal hover:underline mt-1 min-h-[32px]"
                              >
                                + {fullDrill.steps.length - 3} flere steg...
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {fullDrill.coachingPoints.length > 0 && (
                        <div>
                          <div className={LABEL_CLASS + ' mb-1.5'}>Coachingpunkter</div>
                          <div className="flex flex-wrap gap-1">
                            {fullDrill.coachingPoints.slice(0, 2).map((tip, idx) => (
                              <span key={idx} className="text-meta text-ink-muted bg-canvas-raised px-2 py-0.5 rounded-full">
                                {tip.length > 30 ? tip.slice(0, 30) + '…' : tip}
                              </span>
                            ))}
                            {fullDrill.coachingPoints.length > 2 && (
                              <button
                                onClick={() => setSelectedDrillForModal(fullDrill)}
                                className="text-meta text-ink-muted hover:underline min-h-[32px]"
                              >
                                +{fullDrill.coachingPoints.length - 2} til
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {fullDrill.equipment.length > 0 && (
                        <div>
                          <div className={LABEL_CLASS + ' mb-1.5'}>Utstyr</div>
                          <div className="flex flex-wrap gap-1">
                            {fullDrill.equipment.slice(0, 3).map((item, idx) => (
                              <span key={idx} className="text-meta text-ink-muted bg-canvas-raised px-2 py-0.5 rounded-full">
                                {item}
                              </span>
                            ))}
                            {fullDrill.equipment.length > 3 && (
                              <button
                                onClick={() => setSelectedDrillForModal(fullDrill)}
                                className="text-meta text-signal hover:underline min-h-[32px]"
                              >
                                +{fullDrill.equipment.length - 3} til
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedDrillForModal(fullDrill)}
                        className="inline-flex items-center justify-center gap-1.5 w-full mt-2 py-2 sm:py-1.5 rounded-ctl bg-signal/10 border border-signal/30 text-signal text-meta font-semibold hover:bg-signal/15 transition min-h-[44px]"
                      >
                        <BookOpen size={14} strokeWidth={1.75} aria-hidden /> Vis full detalj
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    {hasTimer && !isCompleted && activeStopwatch !== tn.id && (
                      <button 
                        onClick={() => setActiveStopwatch(tn.id)}
                        className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 sm:py-1.5 rounded-ctl bg-signal/10 border border-signal/40 text-signal text-meta font-semibold hover:bg-signal/15 transition min-h-[44px]"
                      >
                        <Play size={14} strokeWidth={2} fill="currentColor" aria-hidden /> Start øvelse ({tn.duration || 5} min)
                      </button>
                    )}

                    {!isCompleted && !hasTimer && (
                      <button 
                        onClick={() => handleCompleteDrill(tn.id)}
                        className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 sm:py-1.5 rounded-ctl bg-signal/10 border border-signal/40 text-signal text-meta font-semibold hover:bg-signal/15 transition min-h-[44px]"
                      >
                        <Check size={14} strokeWidth={2} aria-hidden /> Marker som fullført
                      </button>
                    )}
                  </div>

                  {activeStopwatch === tn.id && (
                    <div className="mt-2 text-meta text-signal inline-flex items-center gap-1.5">
                      <Timer size={12} strokeWidth={1.75} aria-hidden /> Øvelse pågår …
                    </div>
                  )}
                </div>
              );
            })}

          {notes.length === 0 && (
            <p className="text-meta text-ink-faint italic">Ingen øvelser lagt til ennå.</p>
          )}

          {notes.length > 0 && (
            <div className="mt-1 pt-3 border-t border-rule flex items-center gap-3">
              <span className="text-body text-ink">
                Total tid <span className="font-mono font-bold">{totalMinutes(notes)} min</span>
              </span>
              <button onClick={share}
                className="ml-auto inline-flex items-center justify-center gap-1.5 px-3 rounded-ctl bg-canvas-raised shadow-hair text-meta font-semibold text-ink-muted hover:text-ink min-h-[44px]">
                <Share2 size={14} strokeWidth={1.75} aria-hidden /> Del økten
              </button>
            </div>
          )}
          {shareMsg && <p role="status" className="mt-2 text-meta text-ink-muted text-right">{shareMsg}</p>}
        </div>
      </div>

      {selectedDrillForModal && (
        <DrillDetailModal
          drill={selectedDrillForModal}
          onClose={() => setSelectedDrillForModal(null)}
        />
      )}
    </div>
  );
};

// ═══ TAKTIKKVELGER ══════════════════════════════════════════════
// Velg en av taktikkene på brettet og hvor lenge den skal trenes.

const TacticPicker: React.FC<{
  tactics: Tactic[];
  onPick: (t: Tactic, minutes: number) => void;
  onCancel: () => void;
}> = ({ tactics, onPick, onCancel }) => {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [minutes, setMinutes]   = useState(TACTIC_DEFAULT_MIN);
  const picked = tactics.find(t => t.id === pickedId);
  const validMin = Number.isFinite(minutes) && minutes >= 1 && minutes <= 180;

  return (
    <div className="bg-canvas-sunken border border-dashed border-rule rounded-panel p-3 sm:p-4 mb-3">
      <div role="listbox" aria-label="Taktikker"
        className="bg-canvas-raised border border-rule rounded-panel max-h-48 overflow-y-auto mb-3">
        {tactics.map(t => (
          <button key={t.id} role="option" aria-selected={t.id === pickedId} onClick={() => setPickedId(t.id)}
            className={`w-full text-left px-3 py-2.5 border-b border-rule last:border-b-0 min-h-[44px] transition-colors
              ${t.id === pickedId ? 'bg-signal/10 text-signal' : 'text-ink-muted hover:bg-canvas-hover'}`}>
            <div className="text-body font-semibold">{t.name}</div>
            <div className="text-meta text-ink-subtle">
              {SPORT_LABELS[t.sport]} · {t.formation} · {t.phases.length === 1 ? '1 fase' : `${t.phases.length} faser`}
            </div>
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 mb-3 text-body text-ink-muted">
        Varighet
        <input type="number" inputMode="numeric" min={1} max={180} value={minutes}
          onChange={e => setMinutes(Math.round(Number(e.target.value)))}
          className="w-20 rounded-ctl bg-canvas-raised shadow-hair px-2 min-h-[40px] text-body text-ink text-right focus:outline-none focus:shadow-hair-signal" />
        min
      </label>
      <div className="flex gap-2">
        <button onClick={() => picked && validMin && onPick(picked, minutes)} disabled={!picked || !validMin}
          className="flex-1 py-2.5 rounded-ctl bg-signal/10 border border-signal/40 text-signal font-bold text-body hover:bg-signal/15 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed">
          Legg til
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-ctl border border-rule text-ink-subtle text-body min-h-[44px]">
          Avbryt
        </button>
      </div>
    </div>
  );
};

// ═══ NAVNELISTE (KUN FOR FREMMØTE) ═════════════════════════════

const RosterEditor: React.FC<{
  rosterNames: string[];
  onSave: (names: string[]) => void;
}> = ({ rosterNames, onSave }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const openEditor = () => { setText(rosterNames.join('\n')); setOpen(true); };
  const save = () => { onSave(text.split('\n')); setOpen(false); };

  if (!open) {
    return (
      <button onClick={openEditor}
        className="mt-2 text-meta text-signal hover:brightness-110 font-semibold min-h-[44px]">
        <Pencil size={13} strokeWidth={1.75} aria-hidden className="inline -mt-px" /> Rediger navneliste
      </button>
    );
  }

  return (
    <div className="mt-3 bg-canvas-sunken border border-dashed border-rule rounded-panel p-3">
      <div className={LABEL_CLASS + ' mb-1.5'}>Navneliste – ett navn per linje</div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={6}
        placeholder={'Ola\nKari\nPer'}
        className={TEXTAREA_CLASS} />
      <div className="flex gap-2 mt-2">
        <button onClick={save}
          className="flex-1 py-2.5 rounded-ctl bg-signal/10 border border-signal/40 text-signal font-bold text-body hover:bg-signal/15 min-h-[44px]">
          Lagre navneliste
        </button>
        <button onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-ctl border border-rule text-ink-subtle text-body min-h-[44px]">
          Avbryt
        </button>
      </div>
    </div>
  );
};
