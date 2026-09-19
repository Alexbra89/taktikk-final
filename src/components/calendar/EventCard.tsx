'use client';
import React from 'react';
import { Clock, MapPin, NotebookPen, Trash2, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { EVENT_META } from './shared';

// ═══ EVENT CARD – én hendelse i en liste ════════════════════════

export const EventCard: React.FC<{
  event: CalendarEvent;
  onClick: () => void;
  onDelete: () => void;
  onGoToTraining?: (training: CalendarEvent) => void;
}> = ({ event, onClick, onDelete, onGoToTraining }) => {
  const meta = EVENT_META[event.type] ?? EVENT_META.training;
  const { Icon } = meta;

  return (
    <div
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      className="group mb-2 rounded-panel bg-canvas-panel shadow-hair hover:bg-canvas-hover
                 cursor-pointer transition-colors focus-ring"
    >
      <div className="flex items-start gap-3 p-3">
        <span aria-hidden className={`mt-1 w-[3px] h-9 rounded-full flex-shrink-0 ${meta.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="text-body font-bold text-ink truncate">{event.title}</div>

          <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-1 text-meta text-ink-subtle">
            <span className={`inline-flex items-center gap-1 ${meta.text}`}>
              <Icon size={12} strokeWidth={1.75} aria-hidden /> {meta.label}
            </span>
            {event.time && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} strokeWidth={1.75} aria-hidden />
                <span className="font-mono">{event.time}</span>
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin size={12} strokeWidth={1.75} aria-hidden />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>

          {event.type === 'match' && event.opponent && (
            <div className="text-meta text-ink-muted mt-0.5">
              mot {event.opponent}
              {event.result && <span className="font-mono text-ink"> {event.result}</span>}
            </div>
          )}

          {event.trainingNotes.length > 0 && (
            <div className="inline-flex items-center gap-1 text-meta text-ink-subtle mt-1">
              <NotebookPen size={12} strokeWidth={1.75} aria-hidden />
              <span className="truncate">{event.trainingNotes[0].title}</span>
            </div>
          )}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          aria-label={`Slett ${event.title}`}
          className="tap-auto w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-ctl
                     text-ink-faint hover:text-ink hover:bg-canvas-hover transition-colors
                     sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>

      {event.type === 'training' && onGoToTraining && (
        <div className="px-3 pb-3">
          <button
            onClick={e => { e.stopPropagation(); onGoToTraining(event); }}
            className="w-full min-h-[40px] rounded-ctl bg-canvas-raised text-ink-muted hover:text-ink
                       text-caption font-bold shadow-hair transition-colors
                       flex items-center justify-center gap-1.5"
          >
            Gå til treningssiden
            <ChevronRight size={13} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
};
