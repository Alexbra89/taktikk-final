'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getDrillsBySport, toDrillSport, DrillExercise, CATEGORY_LABELS } from '@/data/drills';
import { CalendarEvent } from '@/types';

// ═══════════════════════════════════════════════════════════════
//  TRENING-VISNING — trener og spiller
// ═══════════════════════════════════════════════════════════════

interface TrainingViewProps {
  initialTraining?: CalendarEvent;
  onBack?: () => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({ initialTraining, onBack }) => {
  const store = useAppStore();
  const {
    currentUser, events, playerAccounts, phases, activePhaseIdx,
    sport, addEvent, updateEvent, deleteEvent,
    addTrainingNote, deleteTrainingNote, updatePlayerAccount,
    ageGroup: storeAgeGroup,
  } = store;

  const isCoach    = currentUser?.role === 'coach';
  const myAccId    = currentUser?.accountId;
  const myPlayerId = currentUser?.playerId;
  const myAcc      = (playerAccounts as any[]).find((a: any) => a.id === myAccId);

  const [tab, setTab] = useState<'upcoming' | 'history' | 'individual'>('upcoming');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialTraining?.id || null);
  const [showNewTraining, setShowNewTraining] = useState(false);

  useEffect(() => {
    if (initialTraining?.id) {
      setSelectedEventId(initialTraining.id);
    }
  }, [initialTraining]);

  const today = new Date().toISOString().slice(0, 10);
  const trainings = useMemo(() =>
    events.filter(e => e.type === 'training').sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );
  const upcoming = trainings.filter(e => e.date >= today);
  const past     = trainings.filter(e => e.date < today).reverse();

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;
  const ageGroup = storeAgeGroup;

  const sportKey = toDrillSport(sport);
  const allDrills = getDrillsBySport(sportKey);

  if (showNewTraining && isCoach) {
    return (
      <NewTrainingForm
        onSave={(ev) => { addEvent(ev); setShowNewTraining(false); }}
        onCancel={() => setShowNewTraining(false)}
        sport={sport}
        ageGroup={ageGroup}
        playerAccounts={playerAccounts as any[]}
      />
    );
  }

  if (selectedEvent) {
    return (
      <TrainingDetail
        event={selectedEvent}
        isCoach={isCoach}
        myPlayerId={myPlayerId}
        playerAccounts={playerAccounts as any[]}
        sport={sport}
        onBack={() => {
          setSelectedEventId(null);
          if (initialTraining && onBack) onBack();
        }}
        onUpdate={(fields) => updateEvent(selectedEvent.id, fields)}
        onAddNote={(note) => addTrainingNote(selectedEvent.id, note)}
        onDeleteNote={(nid) => deleteTrainingNote(selectedEvent.id, nid)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="mr-1 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-semibold hover:bg-sky-500/25 transition"
              >
                ‹ Tilbake til kalender
              </button>
            )}
            <div>
              <h2 className="text-sm font-black text-slate-100">🏃 Trening</h2>
              <p className="text-[10px] text-[#4a6080] mt-0.5">
                {isCoach ? 'Alle treninger — marker fremmøte og legg til øvelser'
                         : 'Dine treninger og individuell plan'}
              </p>
            </div>
          </div>
          {isCoach && (
            <button
              onClick={() => setShowNewTraining(true)}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30
                text-emerald-400 text-[12px] font-bold hover:bg-emerald-500/25 transition min-h-[40px]"
            >
              ✨ Opprett ny trening
            </button>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 flex border-b border-[#1e3050] bg-[#0c1525]">
        {([
          ['upcoming', `📅 Kommende (${upcoming.length})`],
          ['history',  `📋 Historikk (${past.length})`],
          ['individual', '🎯 Individuell'],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-3 text-[10.5px] font-semibold transition-all min-h-[44px] leading-tight px-1
              ${tab === id ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[#3a5070]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {tab === 'upcoming' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {upcoming.length === 0 && (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-[12px] text-[#4a6080]">Ingen kommende treninger.</p>
                {isCoach && (
                  <button onClick={() => setShowNewTraining(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30
                      text-emerald-400 text-[12px] font-bold hover:bg-emerald-500/25 transition">
                    ✨ Opprett ny trening
                  </button>
                )}
              </div>
            )}
            {upcoming.map(ev => (
              <TrainingCard 
                key={ev.id} 
                event={ev} 
                isCoach={isCoach}
                myPlayerId={myPlayerId}
                onClick={() => setSelectedEventId(ev.id)}
                onStart={() => setSelectedEventId(ev.id)}
              />
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {past.length === 0 && (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-[12px] text-[#4a6080]">Ingen gjennomførte treninger ennå.</p>
              </div>
            )}
            {past.map(ev => (
              <TrainingCard 
                key={ev.id} 
                event={ev} 
                isCoach={isCoach}
                myPlayerId={myPlayerId} 
                past
                onClick={() => setSelectedEventId(ev.id)}
              />
            ))}
          </div>
        )}

        {tab === 'individual' && (
          <div className="max-w-2xl mx-auto">
            {isCoach ? (
              <CoachIndividualPanel
                playerAccounts={playerAccounts as any[]}
                onUpdate={(id, note) => updatePlayerAccount(id, { individualTrainingNote: note })}
              />
            ) : (
              <PlayerIndividualPanel acc={myAcc} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ NY TRENINGSFORM med "Legg til egen øvelse" knapp ════════════

const NewTrainingForm: React.FC<{
  onSave: (ev: Omit<any, 'id'>) => void;
  onCancel: () => void;
  sport: string;
  ageGroup: 'youth' | 'adult';
  playerAccounts: any[];
}> = ({ onSave, onCancel, sport, ageGroup, playerAccounts }) => {
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
  const [drillCategory, setDrillCategory]     = useState<string>('alle');
  const [drillDifficulty, setDrillDifficulty] = useState<string>('alle');
  const [saving, setSaving] = useState(false);
  const [customDrillName, setCustomDrillName] = useState('');
  const [customDrillDesc, setCustomDrillDesc] = useState('');
  const [customDrillDuration, setCustomDrillDuration] = useState(10);
  const [showCustomDrill, setShowCustomDrill] = useState(false);

  const allDrills = getDrillsBySport(toDrillSport(sport));
  const categories = useMemo(() => {
    return Array.from(new Set(allDrills.map(d => d.category)));
  }, [allDrills]);

  const filteredDrills = useMemo(() => {
    let drills = allDrills.filter(d => !d.ageGroup || d.ageGroup === ageGroup);
    if (drillCategory !== 'alle') drills = drills.filter(d => d.category === drillCategory);
    if (drillDifficulty !== 'alle') drills = drills.filter(d => d.difficulty === drillDifficulty);
    if (drillSearch.trim()) {
      const q = drillSearch.toLowerCase();
      drills = drills.filter(d =>
        d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
    }
    return drills;
  }, [allDrills, ageGroup, drillCategory, drillDifficulty, drillSearch]);

  const addDrill = (drill: DrillExercise) => {
    if (!selectedDrills.some(d => d.id === drill.id)) {
      setSelectedDrills(prev => [...prev, drill]);
    }
    setShowDrillPicker(false);
  };

  const addCustomDrill = () => {
    if (!customDrillName.trim()) {
      alert('Fyll inn øvelsesnavn');
      return;
    }
    const newDrill: DrillExercise = {
      id: `custom-${Date.now()}`,
      sport: toDrillSport(sport),
      category: 'offensivt',
      name: customDrillName.trim(),
      duration: customDrillDuration,
      players: 'alle',
      difficulty: 'enkel',
      description: customDrillDesc.trim() || 'Egendefinert øvelse',
      steps: [{ id: 's1', name: 'Øvelse', description: customDrillDesc.trim() || 'Gjenta øvelsen etter instruksjoner' }],
      tips: [],
      equipment: [],
      ageGroup: ageGroup,
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
    if (!title.trim()) { alert('Fyll inn tittel'); return; }
    setSaving(true);

    const drillNotes = selectedDrills.map(d =>
      `\n📋 ${d.name}\n${d.description}\nVarighet: ${d.duration} min`
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
      targetPlayerIds: [],
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
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <button onClick={onCancel} className="text-[11px] text-[#4a6080] hover:text-sky-400 mb-2 flex items-center gap-1">
          ‹ Tilbake
        </button>
        <h2 className="text-base font-black text-slate-100">✨ Start ny trening</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        <div>
          <label className="label-cal">Tittel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="F.eks. Teknikktrening, 4-3-3 trening..."
            className="inp-cal" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-cal">Dato</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="inp-cal" />
          </div>
          <div>
            <label className="label-cal">Tid</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="inp-cal" />
          </div>
        </div>

        <div>
          <label className="label-cal">Sted</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Stadion / hall" className="inp-cal" />
        </div>

        <div>
          <label className="label-cal">Fokusområder (valgfritt)</label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {FOCUS_OPTIONS.slice(0, 8).map(f => (
              <button key={f} type="button"
                onClick={() => setFocusTags(prev =>
                  prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                )}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold border transition-all
                  ${focusTags.includes(f)
                    ? 'border-sky-500/60 bg-sky-500/15 text-sky-400'
                    : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label-cal">Øvelser fra biblioteket (velg flere)</label>

          {selectedDrills.length > 0 && (
            <div className="mb-2 space-y-1 max-h-32 overflow-y-auto">
              {selectedDrills.map(drill => (
                <div key={drill.id} className="flex items-center justify-between bg-[#0c1525] rounded-lg px-3 py-2 border border-[#1e3050]">
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold text-slate-200">{drill.name}</div>
                    <div className="text-[9px] text-[#4a6080]">{drill.duration} min · {drill.players} spillere</div>
                  </div>
                  <button type="button" onClick={() => removeDrill(drill.id)}
                    className="text-red-400/70 hover:text-red-400 text-[11px] px-2">✕</button>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => setShowDrillPicker(!showDrillPicker)}
            className="w-full mt-1 py-2 px-3 rounded-lg border border-[#1e3050] text-left text-[12px] text-[#4a6080] hover:border-sky-500/50 hover:text-slate-300 transition-all flex items-center justify-between">
            <span>{selectedDrills.length > 0 ? `+ Legg til flere øvelser (${selectedDrills.length} valgt)` : '– Velg øvelser –'}</span>
            <span>{showDrillPicker ? '▲' : '▼'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomDrill(!showCustomDrill)}
            className="w-full mt-2 py-2 px-3 rounded-lg border border-dashed border-sky-500/50 text-left text-[12px] text-sky-400 hover:bg-sky-500/10 transition-all flex items-center justify-between"
          >
            <span>➕ Legg til egen øvelse</span>
            <span>{showCustomDrill ? '▲' : '▼'}</span>
          </button>

          {showCustomDrill && (
            <div className="mt-2 p-3 bg-[#0c1525] rounded-xl border border-sky-500/30">
              <input
                type="text"
                placeholder="Øvelsesnavn *"
                value={customDrillName}
                onChange={e => setCustomDrillName(e.target.value)}
                className="w-full mb-2 bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12px] text-slate-200"
              />
              <textarea
                placeholder="Beskrivelse (valgfritt)"
                value={customDrillDesc}
                onChange={e => setCustomDrillDesc(e.target.value)}
                rows={2}
                className="w-full mb-2 bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12px] text-slate-200 resize-y"
              />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-[#4a6080]">Varighet:</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customDrillDuration}
                  onChange={e => setCustomDrillDuration(Number(e.target.value))}
                  className="w-20 bg-[#111c30] border border-[#1e3050] rounded-lg px-2 py-1 text-[12px] text-slate-200 text-center"
                />
                <span className="text-[11px] text-[#4a6080]">minutter</span>
              </div>
              <button
                type="button"
                onClick={addCustomDrill}
                className="w-full py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-500/25"
              >
                ✓ Legg til øvelse
              </button>
            </div>
          )}

          {showDrillPicker && (
            <div className="mt-2 bg-[#0c1525] border border-[#1e3050] rounded-xl overflow-hidden">
              <div className="p-2 border-b border-[#1e3050] space-y-2">
                <input type="text" placeholder="🔍 Søk etter øvelse..."
                  value={drillSearch} onChange={e => setDrillSearch(e.target.value)}
                  className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500" />
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setDrillCategory('alle')}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-all
                      ${drillCategory === 'alle' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}>
                    Alle
                  </button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setDrillCategory(cat)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-all
                        ${drillCategory === cat ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}>
                      {CATEGORY_LABELS[cat]?.split(' ')[1] || cat}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setDrillDifficulty('alle')}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-all
                      ${drillDifficulty === 'alle' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}>
                    Alle
                  </button>
                  {['enkel', 'middels', 'avansert'].map(level => (
                    <button key={level} onClick={() => setDrillDifficulty(level)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-all
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
                  <div className="text-center py-8 text-[#4a6080] text-[11px]">
                    Ingen øvelser funnet. Klikk "Legg til egen øvelse" for å opprette en.
                  </div>
                ) : (
                  filteredDrills.map(drill => {
                    const isSelected = selectedDrills.some(sd => sd.id === drill.id);
                    return (
                      <button key={drill.id} type="button"
                        onClick={() => isSelected ? removeDrill(drill.id) : addDrill(drill)}
                        className={`w-full text-left px-3 py-2.5 text-[11.5px] hover:bg-[#111c30] border-b border-[#1e3050]/50 transition-all
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

        <div>
          <label className="label-cal">Beskrivelse / notat</label>
          <textarea value={teamNote} onChange={e => setTeamNote(e.target.value)}
            rows={3} placeholder="Mål for økten, beskjeder til spillerne..."
            className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2.5
              text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed" />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={save} disabled={saving || !title.trim()}
            className="flex-1 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[13px] hover:bg-emerald-500/25 disabled:opacity-40 transition min-h-[48px]">
            {saving ? 'Oppretter...' : '✨ Opprett trening'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-3 rounded-xl border border-[#1e3050] text-[#4a6080] font-bold text-[13px] hover:text-slate-300 transition min-h-[48px]">
            Avbryt
          </button>
        </div>
      </div>

      <CalStyle />
    </div>
  );
};

// ═══ TRAINING CARD ════════════════════════════════════════════

const TrainingCard: React.FC<{
  event: any; isCoach: boolean; myPlayerId?: string;
  past?: boolean; onClick: () => void; onStart?: () => void;
}> = ({ event, isCoach, myPlayerId, past, onClick, onStart }) => {
  const dateStr = new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const iAttended = myPlayerId && event.trainingNotes?.some(
    (tn: any) => tn.targetPlayerIds?.includes(myPlayerId)
  );

  const attendeeCount = event.trainingNotes?.reduce((acc: number, tn: any) =>
    acc + (tn.targetPlayerIds?.length ?? 0), 0) ?? 0;

  const isUpcoming = !past && new Date(event.date) >= new Date();

  return (
    <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] hover:border-[#2e4060] transition-all">
      <div className="flex items-center gap-3 p-3.5">
        <div onClick={onClick} className="flex-1 flex items-center gap-3 cursor-pointer active:scale-[0.99]">
          <div className={`w-2 h-12 rounded-full flex-shrink-0 ${past ? 'bg-[#2e4060]' : 'bg-emerald-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-slate-200 truncate">{event.title}</div>
            <div className="text-[10.5px] text-[#4a6080]">
              {dateStr}{event.time && ` · ${event.time}`}
              {event.location && ` · 📍 ${event.location}`}
            </div>
            {event.trainingNotes?.length > 0 && (
              <div className="text-[10px] text-emerald-400/70 mt-0.5">
                📋 {event.trainingNotes[0].title}
                {event.trainingNotes.length > 1 && ` +${event.trainingNotes.length - 1}`}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {isCoach && attendeeCount > 0 && (
              <div className="text-[9.5px] text-emerald-400 font-bold">✅ {attendeeCount} møtte</div>
            )}
            {!isCoach && iAttended && (
              <div className="text-[9.5px] text-emerald-400 font-bold">✅ Du møtte</div>
            )}
            <span className="text-[#3a5070] text-[11px]">›</span>
          </div>
        </div>
        {isUpcoming && onStart && (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30
              text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/25 transition min-h-[40px]"
          >
            ▶ Start
          </button>
        )}
      </div>
    </div>
  );
};

// ═══ STOPPEKLOKKE ═════════════════════════════════════════════

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
    <div className="bg-[#0c1525] rounded-xl p-4 border border-[#1e3050]">
      <div className="text-center">
        <div className="text-4xl font-mono font-bold text-slate-200 mb-2">{formatTime(timeLeft)}</div>
        <div className="w-full bg-[#1e3050] rounded-full h-2 mb-4">
          <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-2 justify-center">
          <button onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-sm font-semibold">
            {isPaused ? '▶ Fortsett' : '⏸ Pause'}
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-semibold">
            ⏹ Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══ DETALJERT ØVELSESMODAL ═══════════════════════════════════════

const DrillDetailModal: React.FC<{
  drill: DrillExercise | null;
  onClose: () => void;
}> = ({ drill, onClose }) => {
  if (!drill) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        <div className="sticky top-0 bg-[#0c1525] border-b border-[#1e3050] px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">{drill.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                ${drill.difficulty === 'enkel' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : drill.difficulty === 'middels' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {drill.difficulty === 'enkel' ? '⭐ Enkel' : drill.difficulty === 'middels' ? '⭐⭐ Middels' : '⭐⭐⭐ Avansert'}
              </span>
              <span className="text-[10px] text-[#4a6080]">⏱ {drill.duration} min</span>
              <span className="text-[10px] text-[#4a6080]">👥 {drill.players} spillere</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#4a6080] hover:text-white text-2xl min-h-[44px] px-2">✕</button>
        </div>

        <div className="p-5 space-y-4">
          
          <div>
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">📋 Beskrivelse</div>
            <p className="text-[13px] text-slate-300 leading-relaxed">{drill.description}</p>
          </div>

          {drill.steps && drill.steps.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">📝 Steg-for-steg</div>
              <ol className="space-y-2">
                {drill.steps.map((step, idx) => (
                  <li key={step.id} className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-[12px] font-semibold text-slate-200">{step.name}</div>
                      {step.description && (
                        <p className="text-[11px] text-[#7a9ab8] mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {drill.tips && drill.tips.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">💡 Tips</div>
              <ul className="space-y-1">
                {drill.tips.map((tip, idx) => (
                  <li key={idx} className="text-[11px] text-slate-300 flex gap-2">
                    <span className="text-amber-400">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {drill.equipment && drill.equipment.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">🛠 Utstyr</div>
              <div className="flex flex-wrap gap-1.5">
                {drill.equipment.map((item, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-[#0f1a2a] border border-[#1e3050] text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══ TRAINING DETAIL ══════════════════════════════════════════

const TrainingDetail: React.FC<{
  event: any; isCoach: boolean; myPlayerId?: string;
  playerAccounts: any[]; sport: string;
  onBack: () => void;
  onUpdate: (fields: any) => void;
  onAddNote: (note: any) => void;
  onDeleteNote: (nid: string) => void;
}> = ({ event, isCoach, myPlayerId, playerAccounts, sport, onBack, onUpdate, onAddNote, onDeleteNote }) => {
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAddNote, setShowAddNote]       = useState(false);
  const [noteTitle, setNoteTitle]           = useState('');
  const [noteContent, setNoteContent]       = useState('');
  const [selectedDrill, setSelectedDrill]   = useState<DrillExercise | null>(null);
  const [showDrillPicker, setShowDrillPicker] = useState(false);
  const [activeStopwatch, setActiveStopwatch] = useState<string | null>(null);
  const [completedDrills, setCompletedDrills] = useState<Set<string>>(new Set());
  const [selectedDrillForModal, setSelectedDrillForModal] = useState<DrillExercise | null>(null);

  const drills = getDrillsBySport(toDrillSport(sport));
  const dateStr = new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const attendedIds = new Set<string>(
    event.trainingNotes?.flatMap((tn: any) => tn.targetPlayerIds ?? []) ?? []
  );

  const toggleAttendance = (playerId: string) => {
    const attNote = event.trainingNotes?.find((tn: any) => tn.title === '✅ Fremmøte');
    if (attNote) {
      const ids: string[] = attNote.targetPlayerIds ?? [];
      const newIds = ids.includes(playerId)
        ? ids.filter((id: string) => id !== playerId)
        : [...ids, playerId];
      onUpdate({
        trainingNotes: event.trainingNotes.map((tn: any) =>
          tn.id === attNote.id ? { ...tn, targetPlayerIds: newIds } : tn
        ),
      });
    } else {
      onAddNote({
        title: '✅ Fremmøte',
        content: 'Fremmøteregistrering',
        focus: [],
        duration: 0,
        completed: false,
        targetPlayerIds: [playerId],
      });
    }
  };

  const saveNote = () => {
    if (!noteTitle.trim() && !selectedDrill) return;
    onAddNote({
      title: selectedDrill ? selectedDrill.name : noteTitle.trim(),
      content: selectedDrill ? selectedDrill.description : noteContent.trim(),
      duration: selectedDrill?.duration || 5,
      completed: false,
      focus: [],
      targetPlayerIds: [],
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

  const myNotes = myPlayerId
    ? event.trainingNotes?.filter((tn: any) =>
        tn.targetPlayerIds?.includes(myPlayerId) || tn.targetPlayerIds?.length === 0
      )
    : event.trainingNotes ?? [];

  const handleTeamNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ teamNote: e.target.value });
  }, [onUpdate]);

  // Hjelpefunksjon for å finne full drill fra tittel
  const findDrillByName = (title: string) => {
    // Fjern ekstra mellomrom og gjør case-insensitive
    const searchTitle = title.trim().toLowerCase();
    return drills.find(d => d.name.trim().toLowerCase() === searchTitle);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 bg-[#0c1525] border-b border-[#1e3050]">
        <button onClick={onBack} className="text-[11px] text-[#4a6080] hover:text-sky-400 mb-2 flex items-center gap-1">
          ‹ Tilbake
        </button>
        <h2 className="text-base font-black text-slate-100">{event.title}</h2>
        <p className="text-[10.5px] text-[#4a6080]">
          {dateStr}{event.time && ` · ${event.time}`}
          {event.location && ` · 📍 ${event.location}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">

        {activeStopwatch && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="text-[11px] font-bold text-emerald-400 mb-2">⏱ Pågående øvelse</div>
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
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="text-[9.5px] font-bold text-amber-400 uppercase tracking-wider mb-2">📝 Fra trener</div>
            <p className="text-[12.5px] text-slate-300 leading-relaxed whitespace-pre-wrap">{event.teamNote}</p>
          </div>
        )}

        {isCoach && (
          <div>
            <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">Generelt notat</div>
            <textarea value={event.teamNote ?? ''} onChange={handleTeamNoteChange}
              rows={3} placeholder="Mål for økten, beskjeder til spillerne..."
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2.5
                text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed" />
          </div>
        )}

        {isCoach && (
          <div>
            <button onClick={() => setShowAttendance(!showAttendance)}
              className="flex items-center gap-2 w-full text-left mb-2">
              <span className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider">
                ✅ Fremmøte ({attendedIds.size}/{playerAccounts.length})
              </span>
              <span className="text-[#3a5070] text-[9px]">{showAttendance ? '▲' : '▼'}</span>
            </button>
            {showAttendance && (
              <div className="grid grid-cols-2 gap-2">
                {playerAccounts.map((acc: any) => {
                  const attended = attendedIds.has(acc.playerId);
                  return (
                    <button key={acc.id} onClick={() => toggleAttendance(acc.playerId)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left
                        ${attended
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#0f1a2a] border-[#1e3050] text-[#4a6080]'}`}>
                      <span className="text-[14px]">{attended ? '✅' : '⬜'}</span>
                      <span className="text-[11.5px] font-semibold truncate">{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider">
              📋 Øvelser og notater
            </span>
            {isCoach && (
              <button onClick={() => setShowAddNote(!showAddNote)}
                className="ml-auto text-[10px] text-sky-400 hover:text-sky-300 font-semibold">
                ＋ Legg til
              </button>
            )}
          </div>

          {isCoach && showAddNote && (
            <div className="bg-[#0c1525] border border-dashed border-[#1e3050] rounded-xl p-4 mb-3">
              <button onClick={() => setShowDrillPicker(!showDrillPicker)}
                className="w-full text-left py-2 px-3 rounded-lg border border-[#1e3050]
                  text-[12px] text-[#4a6080] hover:border-sky-500/50 mb-3 flex items-center justify-between">
                <span>{selectedDrill ? `📋 ${selectedDrill.name}` : '– Velg fra øvelsesbibliotek –'}</span>
                <span>{showDrillPicker ? '▲' : '▼'}</span>
              </button>
              {showDrillPicker && (
                <div className="bg-[#111c30] border border-[#1e3050] rounded-xl max-h-40 overflow-y-auto mb-3">
                  <button onClick={() => { setSelectedDrill(null); setShowDrillPicker(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] text-[#4a6080] hover:bg-[#1a2a40] border-b border-[#1e3050]">
                    – Ingen øvelse –
                  </button>
                  {drills.slice(0, 30).map(d => (
                    <button key={d.id} onClick={() => { setSelectedDrill(d); setShowDrillPicker(false); setNoteTitle(d.name); }}
                      className="w-full text-left px-3 py-2 text-[11.5px] text-slate-300 hover:bg-[#1a2a40] border-b border-[#1e3050]/50">
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-[9.5px] text-[#4a6080]">{d.duration} min · {d.difficulty}</div>
                    </button>
                  ))}
                </div>
              )}
              {!selectedDrill && (
                <>
                  <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)}
                    placeholder="Tittel" className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2
                      text-[12.5px] text-slate-300 focus:outline-none focus:border-sky-500 mb-2 min-h-[40px]" />
                  <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                    rows={2} placeholder="Beskrivelse..."
                    className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2
                      text-[12.5px] text-slate-300 resize-y focus:outline-none focus:border-sky-500 mb-2" />
                </>
              )}
              <div className="flex gap-2">
                <button onClick={saveNote}
                  className="flex-1 py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[12px] hover:bg-sky-500/25">
                  Lagre
                </button>
                <button onClick={() => setShowAddNote(false)}
                  className="px-4 py-2 rounded-lg border border-[#1e3050] text-[#4a6080] text-[12px]">
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {(isCoach ? event.trainingNotes : myNotes)
            ?.filter((tn: any) => tn.title !== '✅ Fremmøte')
            .map((tn: any) => {
              const isCompleted = completedDrills.has(tn.id) || tn.completed;
              const hasTimer = (tn.duration && tn.duration > 0) || tn.duration === undefined;
              const fullDrill = findDrillByName(tn.title);

              return (
                <div key={tn.id} className={`bg-[#0f1a2a] border rounded-xl p-4 mb-2 transition-all
                  ${isCompleted ? 'border-emerald-500/30 opacity-70' : 'border-[#1e3050]'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            if (fullDrill) {
                              setSelectedDrillForModal(fullDrill);
                            }
                          }}
                          className="text-[13px] font-bold text-slate-200 hover:text-sky-400 hover:underline transition text-left"
                        >
                          {tn.title}
                        </button>
                        {hasTimer && (
                          <span className="text-[9px] bg-[#1e3050] px-2 py-0.5 rounded-full text-amber-400">
                            ⏱ {tn.duration || 5} min
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[9px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400">
                            ✅ Fullført
                          </span>
                        )}
                      </div>
                    </div>
                    {isCoach && (
                      <button onClick={() => onDeleteNote(tn.id)}
                        className="text-red-400/50 hover:text-red-400 text-xs ml-2 flex-shrink-0">✕</button>
                    )}
                  </div>
                  <p className="text-[12px] text-[#7a9ab8] leading-relaxed whitespace-pre-wrap mb-3">{tn.content}</p>

                  {!isCoach && hasTimer && !isCompleted && activeStopwatch !== tn.id && (
                    <button 
                      onClick={() => {
                        console.log('Starting stopwatch for:', tn.id, 'Duration:', tn.duration || 5);
                        setActiveStopwatch(tn.id);
                      }}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/25 transition flex items-center gap-1"
                    >
                      ⏱ Start øvelse ({tn.duration || 5} min)
                    </button>
                  )}

                  {isCoach && hasTimer && !isCompleted && activeStopwatch !== tn.id && (
                    <button 
                      onClick={() => {
                        console.log('Coach starting stopwatch for:', tn.id, 'Duration:', tn.duration || 5);
                        setActiveStopwatch(tn.id);
                      }}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/25 transition flex items-center gap-1"
                    >
                      ⏱ Start øvelse ({tn.duration || 5} min)
                    </button>
                  )}

                  {isCoach && !isCompleted && !hasTimer && (
                    <button 
                      onClick={() => handleCompleteDrill(tn.id)}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/25 transition flex items-center gap-1"
                    >
                      ✅ Marker som fullført
                    </button>
                  )}

                  {!isCoach && activeStopwatch === tn.id && (
                    <div className="mt-2 text-[10px] text-amber-400">⏱ Øvelse pågår...</div>
                  )}

                  {isCoach && activeStopwatch === tn.id && (
                    <div className="mt-2 text-[10px] text-amber-400">⏱ Øvelse pågår (trener)...</div>
                  )}
                </div>
              );
            })}

          {(isCoach ? event.trainingNotes : myNotes)?.filter((tn: any) => tn.title !== '✅ Fremmøte').length === 0 && (
            <p className="text-[11px] text-[#3a5070] italic">Ingen øvelser lagt til ennå.</p>
          )}
        </div>
      </div>

      {/* Detaljert øvelsesmodal */}
      {selectedDrillForModal && (
        <DrillDetailModal
          drill={selectedDrillForModal}
          onClose={() => setSelectedDrillForModal(null)}
        />
      )}
    </div>
  );
};

// ═══ INDIVIDUELL PANEL ════════════════════════════════════════

const CoachIndividualPanel: React.FC<{
  playerAccounts: any[];
  onUpdate: (id: string, note: string) => void;
}> = ({ playerAccounts, onUpdate }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote]         = useState('');
  const [saved, setSaved]       = useState(false);

  const acc = playerAccounts.find((a: any) => a.id === selected);

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-100 mb-2">🎯 Individuell treningsplan</h3>
      <p className="text-[11px] text-[#4a6080] mb-4 leading-relaxed">
        Skriv individuelle treningsnotater per spiller. Spilleren ser kun sin egen plan.
      </p>

      <div className="mb-4">
        <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">Velg spiller</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {playerAccounts.map((a: any) => (
            <button key={a.id} onClick={() => { setSelected(a.id); setNote(a.individualTrainingNote ?? ''); setSaved(false); }}
              className={`p-2.5 rounded-xl border text-left transition-all
                ${selected === a.id
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                  : 'bg-[#0f1a2a] border-[#1e3050] text-slate-300 hover:border-[#2e4060]'}`}>
              <div className="text-[12px] font-bold truncate">{a.name}</div>
              {a.individualTrainingNote && (
                <div className="text-[9.5px] text-emerald-400 mt-0.5">✓ Plan satt</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selected && acc && (
        <div>
          <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">
            Individuell plan for {acc.name}
          </div>
          <textarea value={note} onChange={e => { setNote(e.target.value); setSaved(false); }}
            rows={6} placeholder="Skriv individuell treningsplan, mål og fokusområder for denne spilleren..."
            className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-3
              text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500
              leading-relaxed mb-3" />
          <button onClick={() => { onUpdate(selected, note); setSaved(true); }}
            className={`w-full py-3 rounded-xl font-bold text-[13px] transition min-h-[48px]
              ${saved
                ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                : 'bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25'}`}>
            {saved ? '✓ Lagret!' : 'Lagre plan'}
          </button>
        </div>
      )}

      {playerAccounts.length === 0 && (
        <p className="text-[12px] text-[#4a6080] italic text-center py-8">
          Ingen spillere registrert ennå. Legg til spillere via ⚙️ Spillere-fanen.
        </p>
      )}
    </div>
  );
};

const PlayerIndividualPanel: React.FC<{ acc: any }> = ({ acc }) => {
  if (!acc?.individualTrainingNote) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-2">🎯</div>
        <p className="text-[12px] text-[#4a6080]">
          Treneren har ikke satt opp en individuell plan for deg ennå.
        </p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-100 mb-4">🎯 Din individuelle treningsplan</h3>
      <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5">
        <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
          {acc.individualTrainingNote}
        </p>
      </div>
    </div>
  );
};

// ═══ STYLES ══════════════════════════════════════════════════

const CalStyle = () => (
  <style>{`
    .inp-cal { width:100%; background:#111c30; border:1px solid #1e3050;
      border-radius:8px; padding:8px 10px; color:#e2e8f0; font-size:12.5px;
      margin-top:4px; box-sizing:border-box; min-height:38px; }
    .inp-cal:focus { outline:none; border-color:#38bdf8; }
    .label-cal { font-size:9.5px; font-weight:700; color:#3a5070;
      text-transform:uppercase; letter-spacing:0.08em; display:block; }
  `}</style>
);