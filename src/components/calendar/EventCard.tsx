'use client';
import React from 'react';
import type { CalendarEvent } from '@/types';
import { EVENT_META } from './shared';

// ═══ EVENT CARD (RESPONSIV OPPDATERT) ═══════════════════════════

export const EventCard: React.FC<{
  event: CalendarEvent;
  onClick: () => void;
  onDelete: () => void;
  onGoToTraining?: (training: CalendarEvent) => void;
}> = ({ event, onClick, onDelete, onGoToTraining }) => {
  return (
    <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] hover:border-[#2e4060] cursor-pointer transition-all group mb-2"
      onClick={onClick}>
      <div className="flex items-center gap-3 p-3">
        <div className={`w-2 h-10 rounded-full flex-shrink-0 ${EVENT_META[event.type]?.dot ?? 'bg-emerald-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold text-slate-200 truncate">{event.title}</div>
          <div className="text-[10.5px] text-[#4a6080]">
            {EVENT_META[event.type] ? `${EVENT_META[event.type].icon} ${EVENT_META[event.type].label}` : event.title}
            {event.time && ` · ${event.time}`}
            {event.location && ` · 📍 ${event.location}`}
          </div>
          {event.type === 'match' && event.opponent && (
            <div className="text-[10.5px] text-slate-400">vs. {event.opponent} {event.result ? `(${event.result})` : ''}</div>
          )}
          {event.trainingNotes.length > 0 && (
            <div className="text-[10px] text-emerald-400/70 mt-0.5">📋 {event.trainingNotes[0].title}</div>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-sm px-1 transition min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
      </div>
      {event.type === 'training' && onGoToTraining && (
        <div className="px-3 pb-3 pt-0 border-t border-[#1e3050]/50">
          <button
            onClick={(e) => { e.stopPropagation(); onGoToTraining(event); }}
            className="w-full py-2.5 sm:py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-semibold hover:bg-sky-500/25 transition flex items-center justify-center gap-1 min-h-[44px]"
          >
            🏃 Gå til treningssiden
          </button>
        </div>
      )}
    </div>
  );
};
