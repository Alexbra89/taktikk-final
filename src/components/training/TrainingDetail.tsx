'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CATEGORY_LABELS } from '@/data/drills';
import { useDrillLibrary } from '@/hooks/useDrillLibrary';
import { AI_DRILL_LABEL } from '@/lib/customDrills';
import { DrillOrigin } from '@/components/ui/DrillOrigin';
import type { DrillExercise, Tactic, TrainingNote } from '@/types';
import { SPORT_LABELS } from '@/store/selectors';
import { TACTIC_DEFAULT_MIN, totalMinutes, sessionShareText } from '@/lib/trainingSession';
import { DrillDetailModal } from '@/components/ui/DrillDetailModal';
import {
  ChevronLeft, ChevronUp, ChevronDown, Plus, Check, Square, CheckSquare,
  Play, Timer, MapPin, Trash2, AlertTriangle, BookOpen, ArrowUp, ArrowDown, Share2,
} from 'lucide-react';
import { TEXTAREA_CLASS, LABEL_CLASS, ICON_BTN } from '@/lib/formClasses';
import { DrillWarning } from './DrillWarning';
import { Stopwatch } from './Stopwatch';
import { TacticPicker } from './TacticPicker';
import { RosterEditor } from './RosterEditor';

// ═══ TRAINING DETAIL (RESPONSIV OPPDATERT) ═════════════════════
// Én valgt trening: notat, fremmøte, øvelser/taktikker med stoppeklokke, rekkefølge og deling.

export const TrainingDetail: React.FC<{
  event: any;
  rosterNames: string[]; ageGroup: 'youth' | 'adult';
  onBack: () => void;
  onUpdate: (fields: any) => void;
  onAddNote: (note: any) => void;
  onDeleteNote: (nid: string) => void;
  onSaveRoster: (names: string[]) => void;
}> = ({ event, rosterNames, ageGroup, onBack, onUpdate, onAddNote, onDeleteNote, onSaveRoster }) => {
  const library = useDrillLibrary();
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

  const drills = useMemo(() => library.filter(d => d.ageGroup === ageGroup), [ageGroup, library]);
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
      content: selectedDrill ? `${selectedDrill.aiGenerated ? AI_DRILL_LABEL + '\n' : ''}${selectedDrill.description}` : noteContent.trim(),
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
    return drills.find(matches) ?? library.find(matches);
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
                      <DrillOrigin drill={d} />
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
