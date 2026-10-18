'use client';
import React from 'react';
import { ChevronRight, Check, Play, ClipboardList } from 'lucide-react';

// ═══ TRAINING CARD (RESPONSIV OPPDATERT) ═══════════════════════
// Ett kort i lista over kommende og gjennomførte treninger.

export const TrainingCard: React.FC<{
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
