'use client';
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CalendarEvent } from '../../types';

const MONTHS = ['Januar','Februar','Mars','April','Mai','Juni',
                'Juli','August','September','Oktober','November','Desember'];
const DAYS   = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

export const CalendarView: React.FC = () => {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const { events, addEvent, updateEvent, deleteEvent } = useAppStore();

  // Kalenderlogikk
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Start mandag

  const isoDate = (d: number) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const eventsOnDate = (date: string) => events.filter(e => e.date === date);

  const evtsSelected = selectedDate ? eventsOnDate(selectedDate) : [];
  const openEvent = selectedEvent ? events.find(e => e.id === selectedEvent) : null;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y-1); }
    else setMonth(m => m-1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y+1); }
    else setMonth(m => m+1);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Kalender ── */}
      <div className="flex flex-col w-80 flex-shrink-0 border-r border-[#1e3050] bg-[#0c1525]">
        {/* Navigasjon */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3050]">
          <button onClick={prevMonth} className="text-[#4a6080] hover:text-white text-lg">‹</button>
          <span className="text-sm font-bold text-slate-200">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="text-[#4a6080] hover:text-white text-lg">›</button>
        </div>

        {/* Ukedager */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[9.5px] font-bold text-[#3a5070] py-1">{d}</div>
          ))}
        </div>

        {/* Dager */}
        <div className="grid grid-cols-7 px-2 pb-2 flex-1">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i+1).map(day => {
            const iso = isoDate(day);
            const dayEvts = eventsOnDate(iso);
            const isToday = iso === today.toISOString().slice(0,10);
            const isSel   = selectedDate === iso;
            return (
              <div key={day} onClick={() => { setSelectedDate(iso); setSelectedEvent(null); }}
                className={`relative flex flex-col items-center p-1 rounded-lg cursor-pointer transition-all m-0.5
                  ${isSel ? 'bg-sky-500/20 ring-1 ring-sky-500/50' : 'hover:bg-[#111c30]'}`}>
                <span className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-sky-500 text-white' : isSel ? 'text-sky-400' : 'text-slate-400'}`}>
                  {day}
                </span>
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEvts.slice(0,3).map(e => (
                    <span key={e.id}
                      className={`w-1.5 h-1.5 rounded-full ${e.type==='match'?'bg-red-400':'bg-emerald-400'}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legg til arrangement */}
        <div className="border-t border-[#1e3050] p-3">
          <button onClick={() => { setShowNewEvent(true); setSelectedEvent(null); }}
            className="w-full py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[12px] font-bold hover:bg-sky-500/25 transition">
            ＋ Nytt arrangement
          </button>
        </div>
      </div>

      {/* ── Detaljer ── */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Ny hendelse-form */}
        {showNewEvent && (
          <NewEventForm
            date={selectedDate ?? today.toISOString().slice(0,10)}
            onSave={(ev) => { addEvent(ev); setShowNewEvent(false); }}
            onCancel={() => setShowNewEvent(false)}
          />
        )}

        {/* Valgt dag */}
        {!showNewEvent && !openEvent && selectedDate && (
          <div>
            <h2 className="text-base font-bold text-slate-200 mb-4">
              📅 {new Date(selectedDate+'T12:00:00').toLocaleDateString('nb-NO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </h2>
            {evtsSelected.length === 0 ? (
              <p className="text-[#4a6080] text-sm">Ingen arrangementer denne dagen.</p>
            ) : (
              <div className="space-y-2">
                {evtsSelected.map(ev => (
                  <EventCard key={ev.id} event={ev}
                    onClick={() => setSelectedEvent(ev.id)}
                    onDelete={() => deleteEvent(ev.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Åpen hendelse */}
        {!showNewEvent && openEvent && (
          <EventDetail
            event={openEvent}
            onBack={() => setSelectedEvent(null)}
            onUpdate={(f) => updateEvent(openEvent.id, f)}
          />
        )}

        {/* Kommende arrangementer */}
        {!showNewEvent && !openEvent && !selectedDate && (
          <div>
            <h2 className="text-base font-bold text-slate-200 mb-4">Kommende arrangementer</h2>
            {events
              .filter(e => e.date >= today.toISOString().slice(0,10))
              .sort((a,b) => a.date.localeCompare(b.date))
              .slice(0,10)
              .map(ev => (
                <EventCard key={ev.id} event={ev}
                  onClick={() => { setSelectedDate(ev.date); setSelectedEvent(ev.id); }}
                  onDelete={() => deleteEvent(ev.id)} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Hjelpekort ────────────────────────────────────────────────

const EventCard: React.FC<{ event: CalendarEvent; onClick: () => void; onDelete: () => void }> = ({ event, onClick, onDelete }) => (
  <div className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] hover:border-[#2e4060] cursor-pointer transition-all group"
    onClick={onClick}>
    <div className={`w-2 h-10 rounded-full flex-shrink-0 ${event.type==='match'?'bg-red-400':'bg-emerald-400'}`} />
    <div className="flex-1 min-w-0">
      <div className="text-[12.5px] font-bold text-slate-200">{event.title}</div>
      <div className="text-[10.5px] text-[#4a6080]">
        {event.type==='match'?'⚽ Kamp':'🏃 Trening'} · {event.time || ''} {event.location ? `· ${event.location}` : ''}
      </div>
      {event.type==='match' && event.opponent && (
        <div className="text-[10.5px] text-slate-400">vs. {event.opponent} {event.result ? `(${event.result})` : ''}</div>
      )}
    </div>
    <button onClick={e => { e.stopPropagation(); onDelete(); }}
      className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-sm px-1 transition">✕</button>
  </div>
);

// ─── Ny hendelse-form ──────────────────────────────────────────

const NewEventForm: React.FC<{
  date: string;
  onSave: (ev: Omit<CalendarEvent,'id'>) => void;
  onCancel: () => void;
}> = ({ date, onSave, onCancel }) => {
  const [type, setType] = useState<'training'|'match'>('training');
  const [title, setTitle] = useState('');
  const [evDate, setEvDate] = useState(date);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [opponent, setOpponent] = useState('');

  const save = () => {
    if (!title.trim()) return;
    onSave({
      type, title: title.trim(), date: evDate, time, location,
      opponent: type==='match'?opponent:'',
      result: '', teamNote: '', trainingNotes: [], matchNotes: [],
    });
  };

  return (
    <div className="bg-[#0f1a2a] rounded-2xl border border-[#1e3050] p-5 mb-5">
      <h3 className="text-sm font-bold text-slate-200 mb-4">Nytt arrangement</h3>

      {/* Type */}
      <div className="flex gap-2 mb-4">
        {(['training','match'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all
              ${type===t
                ? t==='match' ? 'border-red-500 bg-red-500/15 text-red-400'
                              : 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
            {t==='match' ? '⚽ Kamp' : '🏃 Trening'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label-sm">Tittel *</label>
          <input value={title} onChange={e=>setTitle(e.target.value)}
            className="inp" placeholder={type==='match'?'Seriekamp runde 5':'Teknikktrening'} />
        </div>
        <div>
          <label className="label-sm">Dato</label>
          <input type="date" value={evDate} onChange={e=>setEvDate(e.target.value)} className="inp"/>
        </div>
        <div>
          <label className="label-sm">Tid</label>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="inp"/>
        </div>
        <div>
          <label className="label-sm">Sted</label>
          <input value={location} onChange={e=>setLocation(e.target.value)} className="inp" placeholder="Stadion / hall"/>
        </div>
        {type==='match' && (
          <div>
            <label className="label-sm">Motstander</label>
            <input value={opponent} onChange={e=>setOpponent(e.target.value)} className="inp" placeholder="Lag X"/>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={save}
          className="flex-1 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[12.5px] hover:bg-sky-500/25">
          Lagre
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-[#1e3050] text-[#4a6080] font-bold text-[12.5px] hover:text-slate-300">
          Avbryt
        </button>
      </div>

      <style>{`.inp { width:100%; background:#111c30; border:1px solid #1e3050; border-radius:8px; padding:7px 10px; color:#e2e8f0; font-size:12.5px; margin-top:4px; box-sizing:border-box; }
        .inp:focus { outline:none; border-color:#38bdf8; }
        .label-sm { font-size:9.5px; font-weight:700; color:#3a5070; text-transform:uppercase; letter-spacing:0.08em; }`}</style>
    </div>
  );
};

// ─── Hendelse-detalj ──────────────────────────────────────────

const EventDetail: React.FC<{
  event: CalendarEvent;
  onBack: () => void;
  onUpdate: (f: Partial<CalendarEvent>) => void;
}> = ({ event, onBack, onUpdate }) => {
  const { addTrainingNote, addMatchNote, deleteTrainingNote, deleteMatchNote,
    updateEvent, phases } = useAppStore();
  const [newTrainTitle, setNewTrainTitle] = useState('');
  const [newTrainContent, setNewTrainContent] = useState('');
  const [newMatchContent, setNewMatchContent] = useState('');
  const [newMatchHalf, setNewMatchHalf]   = useState<1|2|3>(1);
  const [newMatchTitle, setNewMatchTitle] = useState('');

  const allPlayers = phases[0]?.players ?? [];

  return (
    <div>
      <button onClick={onBack} className="text-[#4a6080] hover:text-sky-400 text-[12px] mb-4 flex items-center gap-1">
        ‹ Tilbake
      </button>

      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-3
        ${event.type==='match'?'bg-red-500/15 text-red-400':'bg-emerald-500/15 text-emerald-400'}`}>
        {event.type==='match'?'⚽ Kamp':'🏃 Trening'}
      </div>

      <h2 className="text-xl font-black text-slate-100 mb-1">{event.title}</h2>
      <div className="text-[12px] text-[#4a6080] mb-4">
        📅 {new Date(event.date+'T12:00:00').toLocaleDateString('nb-NO',{weekday:'long',day:'numeric',month:'long'})}
        {event.time && ` · ⏰ ${event.time}`}
        {event.location && ` · 📍 ${event.location}`}
        {event.opponent && ` · vs. ${event.opponent}`}
      </div>

      {/* Resultat (kamp) */}
      {event.type==='match' && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[11px] text-[#4a6080] font-bold uppercase tracking-wider">Resultat:</span>
          <input value={event.result||''} onChange={e => onUpdate({ result: e.target.value })}
            placeholder="f.eks. 2-1"
            className="bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-1.5 text-slate-200 text-[13px] w-28 focus:outline-none focus:border-sky-500" />
        </div>
      )}

      {/* Lagets generelle notat */}
      <div className="mb-5">
        <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">Generelt lagsnotat</div>
        <textarea value={event.teamNote}
          onChange={e => onUpdate({ teamNote: e.target.value })}
          rows={3} placeholder="Skriv her..."
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2.5 text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed" />
      </div>

      {/* Treningsnotater */}
      {event.type === 'training' && (
        <section>
          <h3 className="text-sm font-bold text-emerald-400 mb-3">🏃 Treningsnotater</h3>

          {event.trainingNotes.map(tn => (
            <div key={tn.id} className="bg-[#0f1a2a] border border-[#1e3050] rounded-xl p-4 mb-2">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[13px] font-bold text-slate-200">{tn.title}</span>
                <button onClick={() => deleteTrainingNote(event.id, tn.id)}
                  className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
              </div>
              <p className="text-[12px] text-[#7a9ab8] leading-relaxed whitespace-pre-wrap">{tn.content}</p>
              {tn.focus.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {tn.focus.map((f,i) => (
                    <span key={i} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">{f}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="bg-[#0c1525] border border-dashed border-[#1e3050] rounded-xl p-4 mt-2">
            <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">Nytt treningsnotat</div>
            <input value={newTrainTitle} onChange={e=>setNewTrainTitle(e.target.value)}
              placeholder="Tittel"
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 mb-2 focus:outline-none focus:border-sky-500" />
            <textarea value={newTrainContent} onChange={e=>setNewTrainContent(e.target.value)}
              rows={3} placeholder="Innhold / observasjoner..."
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 resize-y focus:outline-none focus:border-sky-500 mb-2 leading-relaxed" />
            <button onClick={() => {
              if (!newTrainContent.trim()) return;
              addTrainingNote(event.id, { title: newTrainTitle||'Notat', content: newTrainContent, focus:[], targetPlayerIds:[] });
              setNewTrainTitle(''); setNewTrainContent('');
            }} className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[12px] hover:bg-emerald-500/25">
              Legg til notat
            </button>
          </div>
        </section>
      )}

      {/* Kampnotater */}
      {event.type === 'match' && (
        <section>
          <h3 className="text-sm font-bold text-red-400 mb-3">⚽ Kampnotater</h3>

          {event.matchNotes.map(mn => (
            <div key={mn.id} className="bg-[#0f1a2a] border border-[#1e3050] rounded-xl p-4 mb-2">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-[13px] font-bold text-slate-200">{mn.title}</span>
                  <span className="ml-2 text-[10px] text-[#4a6080]">
                    {mn.half===1?'1. omgang':mn.half===2?'2. omgang':'Heltid'}
                  </span>
                </div>
                <button onClick={() => deleteMatchNote(event.id, mn.id)}
                  className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
              </div>
              <p className="text-[12px] text-[#7a9ab8] leading-relaxed whitespace-pre-wrap">{mn.content}</p>
            </div>
          ))}

          <div className="bg-[#0c1525] border border-dashed border-[#1e3050] rounded-xl p-4 mt-2">
            <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">Nytt kampnotat</div>
            <div className="flex gap-2 mb-2">
              {([1,2,3] as const).map(h => (
                <button key={h} onClick={() => setNewMatchHalf(h)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all
                    ${newMatchHalf===h?'border-red-500 bg-red-500/15 text-red-400':'border-[#1e3050] text-[#4a6080]'}`}>
                  {h===1?'1. omgang':h===2?'2. omgang':'Heltid'}
                </button>
              ))}
            </div>
            <input value={newMatchTitle} onChange={e=>setNewMatchTitle(e.target.value)}
              placeholder="Tittel"
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 mb-2 focus:outline-none focus:border-sky-500" />
            <textarea value={newMatchContent} onChange={e=>setNewMatchContent(e.target.value)}
              rows={3} placeholder="Observasjoner, taktikknyheter, spillerbidrag..."
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 resize-y focus:outline-none focus:border-sky-500 mb-2 leading-relaxed" />
            <button onClick={() => {
              if (!newMatchContent.trim()) return;
              addMatchNote(event.id, { half: newMatchHalf, title: newMatchTitle||'Kampnotat', content: newMatchContent, targetPlayerIds:[] });
              setNewMatchTitle(''); setNewMatchContent('');
            }} className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-[12px] hover:bg-red-500/25">
              Legg til notat
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
