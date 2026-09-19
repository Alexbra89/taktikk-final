'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Trash2, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { CalendarEvent } from '@/types';
import {
  EVENT_META, FOCUS_OPTIONS, INPUT_CLASS, TEXTAREA_CLASS, LABEL_CLASS,
  toggleClass, formatDayTitle, formatDateLong,
} from './shared';

// ═══ EVENT DETAIL – én hendelse med notater ══════════════════════

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-2">{children}</div>
);

export const EventDetail: React.FC<{
  event: CalendarEvent;
  onBack: () => void;
  onUpdate: (f: Partial<CalendarEvent>) => void;
  onGoToTraining?: (training: CalendarEvent) => void;
}> = ({ event, onBack, onUpdate, onGoToTraining }) => {
  const { addTrainingNote, addMatchNote, deleteTrainingNote, deleteMatchNote } = useAppStore();
  const [newTrainTitle, setNewTrainTitle]     = useState('');
  const [newTrainContent, setNewTrainContent] = useState('');
  const [newMatchContent, setNewMatchContent] = useState('');
  const [newMatchHalf, setNewMatchHalf]       = useState<1 | 2 | 3>(1);
  const [newMatchTitle, setNewMatchTitle]     = useState('');
  const [focusTags, setFocusTags]             = useState<string[]>([]);

  const meta = EVENT_META[event.type] ?? EVENT_META.training;
  const { Icon } = meta;

  return (
    <div className="max-w-2xl">
      <button onClick={onBack}
        className="tap-auto inline-flex items-center gap-1 min-h-[36px] pr-2 mb-4 rounded-ctl
                   text-body text-ink-muted hover:text-ink transition-colors">
        <ChevronLeft size={15} strokeWidth={1.75} aria-hidden /> Tilbake
      </button>

      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-meta font-bold mb-3
        ${meta.bg} ${meta.text}`}>
        <Icon size={12} strokeWidth={1.75} aria-hidden /> {meta.label}
      </div>

      {/* Sidetittel i serif – dagen er det man leter etter. */}
      <h1 className="font-serif text-title text-ink">{formatDayTitle(event.date)}</h1>
      <p className="text-lead text-ink mt-1">{event.title}</p>

      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-2 text-meta text-ink-subtle">
        <span>{formatDateLong(event.date)}</span>
        {event.time && (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} strokeWidth={1.75} aria-hidden />
            <span className="font-mono">{event.time}</span>
          </span>
        )}
        {event.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} strokeWidth={1.75} aria-hidden /> {event.location}
          </span>
        )}
        {event.opponent && <span>mot {event.opponent}</span>}
      </div>

      {event.type === 'training' && onGoToTraining && (
        <button
          onClick={() => onGoToTraining(event)}
          className="mt-4 w-full min-h-[44px] rounded-ctl bg-signal text-signal-fg text-body font-bold
                     hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
        >
          Gå til treningssiden
          <ChevronRight size={15} strokeWidth={2} aria-hidden />
        </button>
      )}

      {event.type === 'match' && (
        <div className="mt-4 flex items-center gap-3">
          <span className={LABEL_CLASS}>Resultat</span>
          <input value={event.result || ''} onChange={e => onUpdate({ result: e.target.value })}
            placeholder="2–1" aria-label="Resultat"
            className="w-24 rounded-ctl px-3 min-h-[44px] bg-canvas-raised font-mono text-body text-ink
                       placeholder:text-ink-faint shadow-hair focus:outline-none focus:shadow-hair-signal" />
        </div>
      )}

      <div className="mt-5">
        <SectionTitle>Generelt notat</SectionTitle>
        <textarea value={event.teamNote}
          onChange={e => onUpdate({ teamNote: e.target.value })}
          rows={3} placeholder="Skriv her …"
          className={TEXTAREA_CLASS} />
      </div>

      {event.type === 'training' && (
        <section className="mt-6">
          <SectionTitle>Treningsnotater</SectionTitle>

          {event.trainingNotes.map(tn => (
            <div key={tn.id} className="rounded-panel bg-canvas-panel shadow-hair p-4 mb-2">
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="text-body font-bold text-ink">{tn.title}</span>
                <button onClick={() => deleteTrainingNote(event.id, tn.id)}
                  aria-label={`Slett notatet ${tn.title}`}
                  className="tap-auto w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-ctl
                             text-ink-faint hover:text-ink hover:bg-canvas-hover transition-colors">
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
              <p className="text-body text-ink-muted leading-relaxed whitespace-pre-wrap">{tn.content}</p>
              {tn.focus.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {tn.focus.map((f, i) => (
                    <span key={i} className="rounded-pill bg-canvas-raised px-2 py-0.5 text-meta text-ink-muted shadow-hair">{f}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="rounded-panel bg-canvas-sunken shadow-hair p-4 mt-2">
            <SectionTitle>Nytt treningsnotat</SectionTitle>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {FOCUS_OPTIONS.slice(0, 6).map(f => (
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
            <input value={newTrainTitle} onChange={e => setNewTrainTitle(e.target.value)}
              placeholder="Tittel" aria-label="Tittel på treningsnotat" className={INPUT_CLASS} />
            <textarea value={newTrainContent} onChange={e => setNewTrainContent(e.target.value)}
              rows={3} placeholder="Innhold / observasjoner …"
              aria-label="Innhold i treningsnotat" className={TEXTAREA_CLASS} />
            <button onClick={() => {
              if (!newTrainContent.trim()) return;
              addTrainingNote(event.id, {
                title: newTrainTitle || 'Notat',
                content: newTrainContent,
                focus: focusTags,
              });
              setNewTrainTitle(''); setNewTrainContent(''); setFocusTags([]);
            }}
              className="mt-3 inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-ctl
                         bg-signal text-signal-fg text-body font-bold hover:brightness-110 transition-all">
              <Plus size={15} strokeWidth={2} aria-hidden /> Legg til notat
            </button>
          </div>
        </section>
      )}

      {event.type === 'match' && (
        <section className="mt-6">
          <SectionTitle>Kampnotater</SectionTitle>
          {event.matchNotes.map(mn => (
            <div key={mn.id} className="rounded-panel bg-canvas-panel shadow-hair p-4 mb-2">
              <div className="flex justify-between items-start gap-2 mb-1">
                <div className="min-w-0">
                  <span className="text-body font-bold text-ink">{mn.title}</span>
                  <span className="ml-2 font-mono text-meta text-ink-subtle">
                    {mn.half === 1 ? '1. omgang' : mn.half === 2 ? '2. omgang' : 'Heltid'}
                  </span>
                </div>
                <button onClick={() => deleteMatchNote(event.id, mn.id)}
                  aria-label={`Slett notatet ${mn.title}`}
                  className="tap-auto w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-ctl
                             text-ink-faint hover:text-ink hover:bg-canvas-hover transition-colors">
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
              <p className="text-body text-ink-muted leading-relaxed whitespace-pre-wrap">{mn.content}</p>
            </div>
          ))}

          <div className="rounded-panel bg-canvas-sunken shadow-hair p-4 mt-2">
            <SectionTitle>Nytt kampnotat</SectionTitle>
            <div className="flex gap-1.5 mb-2">
              {([1, 2, 3] as const).map(h => (
                <button key={h} onClick={() => setNewMatchHalf(h)}
                  aria-pressed={newMatchHalf === h}
                  className={`tap-auto min-h-[32px] px-3 rounded-ctl text-meta font-bold transition-colors
                    ${toggleClass(newMatchHalf === h)}`}>
                  {h === 1 ? '1. omgang' : h === 2 ? '2. omgang' : 'Heltid'}
                </button>
              ))}
            </div>
            <input value={newMatchTitle} onChange={e => setNewMatchTitle(e.target.value)}
              placeholder="Tittel" aria-label="Tittel på kampnotat" className={INPUT_CLASS} />
            <textarea value={newMatchContent} onChange={e => setNewMatchContent(e.target.value)}
              rows={3} placeholder="Observasjoner, taktikk, spillerbidrag …"
              aria-label="Innhold i kampnotat" className={TEXTAREA_CLASS} />
            <button onClick={() => {
              if (!newMatchContent.trim()) return;
              addMatchNote(event.id, { half: newMatchHalf, title: newMatchTitle || 'Kampnotat', content: newMatchContent });
              setNewMatchTitle(''); setNewMatchContent('');
            }}
              className="mt-3 inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-ctl
                         bg-signal text-signal-fg text-body font-bold hover:brightness-110 transition-all">
              <Plus size={15} strokeWidth={2} aria-hidden /> Legg til notat
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
