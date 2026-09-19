'use client';
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { CalendarEvent } from '@/types';
import { EVENT_META, FOCUS_OPTIONS } from './shared';

// ═══ EVENT DETAIL (RESPONSIV OPPDATERT) ══════════════════════════

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

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="text-[#4a6080] hover:text-sky-400 text-[12px] mb-4 flex items-center gap-1 min-h-[44px]">
        ‹ Tilbake
      </button>

      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-3
        ${EVENT_META[event.type]?.bg ?? 'bg-emerald-500/15'} ${EVENT_META[event.type]?.text ?? 'text-emerald-400'}`}>
        {EVENT_META[event.type] ? `${EVENT_META[event.type].icon} ${EVENT_META[event.type].label}` : event.title}
      </div>

      <h2 className="text-xl font-black text-slate-100 mb-1">{event.title}</h2>
      <div className="text-[12px] text-[#4a6080] mb-4">
        📅 {new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
        {event.time && ` · ⏰ ${event.time}`}
        {event.location && ` · 📍 ${event.location}`}
        {event.opponent && ` · vs. ${event.opponent}`}
      </div>

      {event.type === 'training' && onGoToTraining && (
        <button
          onClick={() => onGoToTraining(event)}
          className="mb-4 w-full py-3 sm:py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[12px] font-semibold hover:bg-sky-500/25 transition flex items-center justify-center gap-2 min-h-[44px]"
        >
          🏃 Gå til treningssiden (stoppeklokke og fullfør)
        </button>
      )}

      {event.type === 'match' && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[11px] text-[#4a6080] font-bold uppercase tracking-wider">Resultat:</span>
          <input value={event.result || ''} onChange={e => onUpdate({ result: e.target.value })}
            placeholder="f.eks. 2-1"
            className="bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-[13px] w-28 focus:outline-none focus:border-sky-500 min-h-[44px]" />
        </div>
      )}

      <div className="mb-5">
        <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">Generelt notat</div>
        <textarea value={event.teamNote}
          onChange={e => onUpdate({ teamNote: e.target.value })}
          rows={3} placeholder="Skriv her..."
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-3 sm:py-2.5 text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed" />
      </div>

      {event.type === 'training' && (
        <section>
          <h3 className="text-sm font-bold text-emerald-400 mb-3">🏃 Treningsnotater</h3>

          {event.trainingNotes.map(tn => (
            <div key={tn.id} className="bg-[#0f1a2a] border border-[#1e3050] rounded-xl p-4 mb-2">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-[13px] font-bold text-slate-200">{tn.title}</span>
                </div>
                <button onClick={() => deleteTrainingNote(event.id, tn.id)}
                  className="text-red-400/50 hover:text-red-400 text-xs min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
              </div>
              <p className="text-[12px] text-[#7a9ab8] leading-relaxed whitespace-pre-wrap">{tn.content}</p>
              {tn.focus.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {tn.focus.map((f, i) => (
                    <span key={i} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">{f}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="bg-[#0c1525] border border-dashed border-[#1e3050] rounded-xl p-4 mt-2">
            <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">Nytt treningsnotat</div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {FOCUS_OPTIONS.slice(0, 6).map(f => (
                <button key={f} onClick={() => setFocusTags(prev =>
                  prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                )}
                  className={`px-2 py-1.5 sm:py-1 rounded-full text-[10px] font-semibold border transition-all min-h-[36px] sm:min-h-0
                    ${focusTags.includes(f) ? 'border-sky-500/60 bg-sky-500/15 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
                  {f}
                </button>
              ))}
            </div>
            <input value={newTrainTitle} onChange={e => setNewTrainTitle(e.target.value)}
              placeholder="Tittel"
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 mb-2 focus:outline-none focus:border-sky-500 min-h-[44px]" />
            <textarea value={newTrainContent} onChange={e => setNewTrainContent(e.target.value)}
              rows={3} placeholder="Innhold / observasjoner..."
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-3 sm:py-2 text-[12.5px] text-slate-300 resize-y focus:outline-none focus:border-sky-500 mb-2 leading-relaxed" />
            <button onClick={() => {
              if (!newTrainContent.trim()) return;
              addTrainingNote(event.id, {
                title: newTrainTitle || 'Notat',
                content: newTrainContent,
                focus: focusTags,
              });
              setNewTrainTitle(''); setNewTrainContent(''); setFocusTags([]);
            }} className="px-4 py-3 sm:py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[12px] hover:bg-emerald-500/25 min-h-[44px]">
              Legg til notat
            </button>
          </div>
        </section>
      )}

      {event.type === 'match' && (
        <section>
          <h3 className="text-sm font-bold text-red-400 mb-3">⚽ Kampnotater</h3>
          {event.matchNotes.map(mn => (
            <div key={mn.id} className="bg-[#0f1a2a] border border-[#1e3050] rounded-xl p-4 mb-2">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-[13px] font-bold text-slate-200">{mn.title}</span>
                  <span className="ml-2 text-[10px] text-[#4a6080]">
                    {mn.half === 1 ? '1. omgang' : mn.half === 2 ? '2. omgang' : 'Heltid'}
                  </span>
                </div>
                <button onClick={() => deleteMatchNote(event.id, mn.id)}
                  className="text-red-400/50 hover:text-red-400 text-xs min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
              </div>
              <p className="text-[12px] text-[#7a9ab8] leading-relaxed whitespace-pre-wrap">{mn.content}</p>
            </div>
          ))}

          <div className="bg-[#0c1525] border border-dashed border-[#1e3050] rounded-xl p-4 mt-2">
            <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">Nytt kampnotat</div>
            <div className="flex gap-2 mb-2">
              {([1, 2, 3] as const).map(h => (
                <button key={h} onClick={() => setNewMatchHalf(h)}
                  className={`px-2.5 py-1.5 sm:py-1 rounded-md text-[11px] font-semibold border transition-all min-h-[36px] sm:min-h-0
                    ${newMatchHalf === h ? 'border-red-500 bg-red-500/15 text-red-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
                  {h === 1 ? '1. omgang' : h === 2 ? '2. omgang' : 'Heltid'}
                </button>
              ))}
            </div>
            <input value={newMatchTitle} onChange={e => setNewMatchTitle(e.target.value)}
              placeholder="Tittel"
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 mb-2 focus:outline-none focus:border-sky-500 min-h-[44px]" />
            <textarea value={newMatchContent} onChange={e => setNewMatchContent(e.target.value)}
              rows={3} placeholder="Observasjoner, taktikknyheter, spillerbidrag..."
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-3 sm:py-2 text-[12.5px] text-slate-300 resize-y focus:outline-none focus:border-sky-500 mb-2 leading-relaxed" />
            <button onClick={() => {
              if (!newMatchContent.trim()) return;
              addMatchNote(event.id, { half: newMatchHalf, title: newMatchTitle || 'Kampnotat', content: newMatchContent });
              setNewMatchTitle(''); setNewMatchContent('');
            }} className="px-4 py-3 sm:py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-[12px] hover:bg-red-500/25 min-h-[44px]">
              Legg til notat
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
