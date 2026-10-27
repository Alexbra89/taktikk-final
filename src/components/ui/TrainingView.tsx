'use client';
import { localDate } from '@/lib/dates';
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { CalendarEvent } from '@/types';
import { Plus, CalendarDays, ClipboardList } from 'lucide-react';
import { PRIMARY_BTN } from '@/lib/formClasses';
import { ViewHeader } from '@/components/layout/Surface';
import { TrainingOverview } from '@/components/training/TrainingOverview';
import { NewTrainingForm } from '@/components/training/NewTrainingForm';
import { TrainingCard } from '@/components/training/TrainingCard';
import { TrainingDetail } from '@/components/training/TrainingDetail';

// ═══════════════════════════════════════════════════════════════
//  TRENING-VISNING (RESPONSIV OPPDATERT)
//  Inngangen til Trening: lista (kommende/historikk), ny trening og valgt
//  trening. Delene ligger i `components/training/`.
// ═══════════════════════════════════════════════════════════════

interface TrainingViewProps {
  initialTraining?: CalendarEvent;
  onBack?: () => void;
  /** Åpner skjemaet for ny trening med én gang (hurtigvalg på dashbordet). */
  initialNew?: boolean;
  /** Melder hvilken trening som er åpen (null = lista), så AI-treneren kan bruke den. */
  onSelectedChange?: (eventId: string | null) => void;
}

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

  const [previousInitialTraining, setPreviousInitialTraining] = useState(initialTraining);
  if (initialTraining !== previousInitialTraining) {
    setPreviousInitialTraining(initialTraining);
    if (initialTraining?.id) {
      setSelectedEventId(initialTraining.id);
    }
  }

  useEffect(() => { onSelectedChange?.(selectedEventId); }, [selectedEventId, onSelectedChange]);

  const today = localDate();
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
