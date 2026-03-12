'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CalendarEvent } from '../../types';
import { getDrillsBySport, getWeeklyDrills, DrillExercise } from '../../data/drills';

const MONTHS = ['Januar','Februar','Mars','April','Mai','Juni',
                'Juli','August','September','Oktober','November','Desember'];
const DAYS   = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

const FOCUS_OPTIONS = [
  'Pasningsspill','Pressing','Forsvarsstilling','Avslutning','Kontrapress',
  'Innlegg','Dødball','Keepertrening','Kondisjon','Styrke','Taktikk','Individuell teknikk',
];

// ═══════════════════════════════════════════════════════════════
export const CalendarView: React.FC = () => {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate]   = useState<string | null>(null);
  const [showNewEvent, setShowNewEvent]   = useState(false);
  const [showAutoGen, setShowAutoGen]     = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const { events, addEvent, updateEvent, deleteEvent, sport } = useAppStore();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = (firstDay + 6) % 7;

  const isoDate = (d: number) =>
    `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const eventsOnDate = (date: string) => events.filter(e => e.date === date);
  const evtsSelected  = selectedDate ? eventsOnDate(selectedDate) : [];
  const openEvent     = selectedEvent ? events.find(e => e.id === selectedEvent) : null;

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
      {/* ── Kalender-kolonne ── */}
      <div className="flex flex-col w-80 flex-shrink-0 border-r border-[#1e3050] bg-[#0c1525]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3050]">
          <button onClick={prevMonth} className="text-[#4a6080] hover:text-white text-lg w-8 h-8 flex items-center justify-center">‹</button>
          <span className="text-sm font-bold text-slate-200">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="text-[#4a6080] hover:text-white text-lg w-8 h-8 flex items-center justify-center">›</button>
        </div>

        <div className="grid grid-cols-7 px-2 pt-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[9.5px] font-bold text-[#3a5070] py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 px-2 pb-2 flex-1">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i+1).map(day => {
            const iso      = isoDate(day);
            const dayEvts  = eventsOnDate(iso);
            const isToday  = iso === today.toISOString().slice(0,10);
            const isSel    = selectedDate === iso;
            return (
              <div key={day}
                onClick={() => { setSelectedDate(iso); setSelectedEvent(null); setShowNewEvent(false); setShowAutoGen(false); }}
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

        {/* Knapper */}
        <div className="border-t border-[#1e3050] p-3 space-y-2">
          <button onClick={() => { setShowNewEvent(true); setShowAutoGen(false); setSelectedEvent(null); }}
            className="w-full py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[12px] font-bold hover:bg-sky-500/25 transition">
            ＋ Nytt arrangement
          </button>
          <button onClick={() => { setShowAutoGen(true); setShowNewEvent(false); setSelectedEvent(null); }}
            className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[12px] font-bold hover:bg-emerald-500/20 transition">
            ✨ Autogenerer treningsplan
          </button>
        </div>
      </div>

      {/* ── Detaljpanel ── */}
      <div className="flex-1 overflow-y-auto p-5">

        {showAutoGen && (
          <AutoGenForm
            sport={sport}
            onGenerate={(evs) => { evs.forEach(e => addEvent(e)); setShowAutoGen(false); }}
            onCancel={() => setShowAutoGen(false)}
          />
        )}

        {showNewEvent && !showAutoGen && (
          <NewEventForm
            date={selectedDate ?? today.toISOString().slice(0,10)}
            sport={sport}
            onSave={(ev) => { addEvent(ev); setShowNewEvent(false); }}
            onCancel={() => setShowNewEvent(false)}
          />
        )}

        {!showNewEvent && !showAutoGen && !openEvent && selectedDate && (
          <div>
            <h2 className="text-base font-bold text-slate-200 mb-4">
              📅 {new Date(selectedDate+'T12:00:00').toLocaleDateString('nb-NO',
                { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
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

        {!showNewEvent && !showAutoGen && openEvent && (
          <EventDetail
            event={openEvent}
            onBack={() => setSelectedEvent(null)}
            onUpdate={(f) => updateEvent(openEvent.id, f)}
          />
        )}

        {!showNewEvent && !showAutoGen && !openEvent && !selectedDate && (
          <div>
            <h2 className="text-base font-bold text-slate-200 mb-4">Kommende arrangementer</h2>
            {events
              .filter(e => e.date >= today.toISOString().slice(0,10))
              .sort((a,b) => a.date.localeCompare(b.date))
              .slice(0, 10)
              .map(ev => (
                <EventCard key={ev.id} event={ev}
                  onClick={() => { setSelectedDate(ev.date); setSelectedEvent(ev.id); }}
                  onDelete={() => deleteEvent(ev.id)} />
              ))}
            {events.filter(e => e.date >= today.toISOString().slice(0,10)).length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-[#4a6080] text-sm mb-4">Ingen kommende arrangementer.</p>
                <button onClick={() => setShowAutoGen(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[12px] font-bold hover:bg-emerald-500/25">
                  ✨ Autogenerer treningsplan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ AUTOGENERER TRENINGSPLAN ════════════════════════════════

const AutoGenForm: React.FC<{
  sport: string;
  onGenerate: (evs: Omit<CalendarEvent,'id'>[]) => void;
  onCancel: () => void;
}> = ({ sport, onGenerate, onCancel }) => {
  const today = new Date();
  const [weeks, setWeeks]         = useState(4);
  const [perWeek, setPerWeek]     = useState(3);
  const [startDate, setStartDate] = useState(today.toISOString().slice(0,10));
  const [time, setTime]           = useState('18:00');
  const [location, setLocation]   = useState('');
  const [activeSport, setActiveSport] = useState<'football'|'handball'>(
    sport === 'handball' ? 'handball' : 'football'
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Man, Ons, Fre
  const [focusTags, setFocusTags] = useState<string[]>([]);

  const WEEKDAYS = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

  function toggleDay(d: number) {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    );
  }

  // Forhåndsvisning av genererte datoer
  const previewDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(startDate + 'T12:00:00');
    let current = new Date(start);
    // Gå til første dag i uken
    const dayOfWeek = (current.getDay() + 6) % 7; // 0=man
    current.setDate(current.getDate() - dayOfWeek);

    for (let w = 0; w < weeks; w++) {
      for (const d of selectedDays) {
        const date = new Date(current);
        date.setDate(current.getDate() + d);
        if (date >= start) {
          dates.push(date.toISOString().slice(0, 10));
        }
      }
      current.setDate(current.getDate() + 7);
    }
    return dates.slice(0, weeks * perWeek + 2);
  }, [startDate, weeks, selectedDays]);

  function generate() {
    const drills = getDrillsBySport(activeSport as any);
    const events: Omit<CalendarEvent,'id'>[] = [];

    previewDates.forEach((date, idx) => {
      const drill = drills[idx % drills.length];
      const focusLine = focusTags.length > 0 ? `\nFokus: ${focusTags.join(', ')}` : '';
      const drillDesc = drill
        ? `\n\n📋 Ukens øvelse: ${drill.name}\n${drill.description}`
        : '';

      events.push({
        type: 'training',
        title: `Trening${focusTags[0] ? ` – ${focusTags[0]}` : ''}`,
        date,
        time,
        location,
        opponent: '',
        result: '',
        teamNote: `Autogenerert treningsøkt.${focusLine}${drillDesc}`,
        trainingNotes: drill ? [{
          id: `tn-${Date.now()}-${idx}`,
          createdAt: new Date().toISOString(),
          title: drill.name,
          content: drill.description,
          focus: focusTags,
          targetPlayerIds: [],
        }] : [],
        matchNotes: [],
      });
    });

    onGenerate(events);
  }

  return (
    <div className="bg-[#0f1a2a] rounded-2xl border border-[#1e3050] p-5 mb-5 max-w-2xl">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">✨</span>
        <div>
          <h3 className="text-sm font-bold text-slate-200">Autogenerer treningsplan</h3>
          <p className="text-[11px] text-[#4a6080]">Systemet lager treningsøkter med øvelser fra biblioteket</p>
        </div>
      </div>

      {/* Sport */}
      <div className="mb-4">
        <label className="label-cal">Sport</label>
        <div className="flex gap-2 mt-1">
          {(['football','handball'] as const).map(s => (
            <button key={s} onClick={() => setActiveSport(s)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all
                ${activeSport === s
                  ? 'border-sky-500 bg-sky-500/15 text-sky-400'
                  : 'border-[#1e3050] text-[#4a6080]'}`}>
              {s === 'football' ? '⚽ Fotball' : '🤾 Håndball'}
            </button>
          ))}
        </div>
      </div>

      {/* Startdato + tid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label-cal">Startdato</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="inp-cal"/>
        </div>
        <div>
          <label className="label-cal">Treningstid</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="inp-cal"/>
        </div>
        <div>
          <label className="label-cal">Sted</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Stadion / hall" className="inp-cal"/>
        </div>
        <div>
          <label className="label-cal">Antall uker</label>
          <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="inp-cal">
            {[2,3,4,6,8,12].map(w => <option key={w} value={w}>{w} uker</option>)}
          </select>
        </div>
      </div>

      {/* Treningsdager */}
      <div className="mb-4">
        <label className="label-cal">Treningsdager per uke</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {WEEKDAYS.map((d, i) => (
            <button key={i} onClick={() => toggleDay(i)}
              className={`w-10 h-10 rounded-lg text-[11px] font-bold border transition-all
                ${selectedDays.includes(i)
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                  : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
              {d}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[#3a5070] mt-1">{selectedDays.length} dager valgt → {selectedDays.length * weeks} treningsøkter totalt</p>
      </div>

      {/* Fokusområder */}
      <div className="mb-5">
        <label className="label-cal">Fokusområder (valgfritt)</label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {FOCUS_OPTIONS.map(f => (
            <button key={f} onClick={() => setFocusTags(prev =>
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

      {/* Forhåndsvisning */}
      {previewDates.length > 0 && (
        <div className="bg-[#0c1525] rounded-xl border border-[#1e3050] p-3 mb-4">
          <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">
            Forhåndsvisning — {previewDates.length} økter
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
            {previewDates.map((d, i) => (
              <div key={d} className="text-[10.5px] text-slate-300 bg-[#111c30] rounded-lg px-2 py-1 border border-[#1e3050]">
                {new Date(d+'T12:00:00').toLocaleDateString('nb-NO', { weekday:'short', day:'numeric', month:'short' })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={generate} disabled={selectedDays.length === 0}
          className="flex-1 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[12.5px] hover:bg-emerald-500/25 disabled:opacity-40">
          ✨ Generer {previewDates.length} treningsøkter
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-[#1e3050] text-[#4a6080] font-bold text-[12.5px] hover:text-slate-300">
          Avbryt
        </button>
      </div>

      <CalStyle />
    </div>
  );
};

// ═══ NY HENDELSE-FORM (med treningsbeskrivelse) ═══════════════

const NewEventForm: React.FC<{
  date: string;
  sport: string;
  onSave: (ev: Omit<CalendarEvent,'id'>) => void;
  onCancel: () => void;
}> = ({ date, sport, onSave, onCancel }) => {
  const [type, setType]         = useState<'training'|'match'>('training');
  const [title, setTitle]       = useState('');
  const [evDate, setEvDate]     = useState(date);
  const [time, setTime]         = useState('18:00');
  const [location, setLocation] = useState('');
  const [opponent, setOpponent] = useState('');
  const [teamNote, setTeamNote] = useState('');
  const [focusTags, setFocusTags] = useState<string[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<DrillExercise | null>(null);
  const [showDrillPicker, setShowDrillPicker] = useState(false);

  const drills = getDrillsBySport(sport === 'handball' ? 'handball' : 'football');

  const save = () => {
    if (!title.trim()) return;
    const drillNote = selectedDrill
      ? `\n\n📋 Øvelse: ${selectedDrill.name}\n${selectedDrill.description}`
      : '';
    const focusNote = focusTags.length > 0 ? `Fokus: ${focusTags.join(', ')}` : '';

    onSave({
      type, title: title.trim(), date: evDate, time, location,
      opponent: type === 'match' ? opponent : '',
      result: '',
      teamNote: [focusNote, teamNote, drillNote].filter(Boolean).join('\n'),
      trainingNotes: selectedDrill && type === 'training' ? [{
        id: `tn-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: selectedDrill.name,
        content: selectedDrill.description,
        focus: focusTags,
        targetPlayerIds: [],
      }] : [],
      matchNotes: [],
    });
  };

  return (
    <div className="bg-[#0f1a2a] rounded-2xl border border-[#1e3050] p-5 mb-5 max-w-2xl">
      <h3 className="text-sm font-bold text-slate-200 mb-4">Nytt arrangement</h3>

      <div className="flex gap-2 mb-4">
        {(['training','match'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all
              ${type === t
                ? t === 'match'
                  ? 'border-red-500 bg-red-500/15 text-red-400'
                  : 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
            {t === 'match' ? '⚽ Kamp' : '🏃 Trening'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-2">
          <label className="label-cal">Tittel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="inp-cal" placeholder={type==='match'?'Seriekamp runde 5':'Teknikktrening'} />
        </div>
        <div>
          <label className="label-cal">Dato</label>
          <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="inp-cal"/>
        </div>
        <div>
          <label className="label-cal">Tid</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="inp-cal"/>
        </div>
        <div>
          <label className="label-cal">Sted</label>
          <input value={location} onChange={e => setLocation(e.target.value)} className="inp-cal" placeholder="Stadion / hall"/>
        </div>
        {type === 'match' && (
          <div>
            <label className="label-cal">Motstander</label>
            <input value={opponent} onChange={e => setOpponent(e.target.value)} className="inp-cal" placeholder="Lag X"/>
          </div>
        )}
      </div>

      {/* Fokusområder (kun trening) */}
      {type === 'training' && (
        <>
          <div className="mb-3">
            <label className="label-cal">Fokusområder</label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {FOCUS_OPTIONS.slice(0, 8).map(f => (
                <button key={f} onClick={() => setFocusTags(prev =>
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

          {/* Velg øvelse fra biblioteket */}
          <div className="mb-3">
            <label className="label-cal">Øvelse fra biblioteket (valgfritt)</label>
            <button onClick={() => setShowDrillPicker(!showDrillPicker)}
              className="w-full mt-1 py-2 px-3 rounded-lg border border-[#1e3050] text-left text-[12px] text-[#4a6080] hover:border-sky-500/50 hover:text-slate-300 transition-all flex items-center justify-between">
              <span>{selectedDrill ? `📋 ${selectedDrill.name}` : '– Velg øvelse –'}</span>
              <span>{showDrillPicker ? '▲' : '▼'}</span>
            </button>
            {showDrillPicker && (
              <div className="mt-1 bg-[#0c1525] border border-[#1e3050] rounded-xl max-h-48 overflow-y-auto">
                <button onClick={() => { setSelectedDrill(null); setShowDrillPicker(false); }}
                  className="w-full text-left px-3 py-2 text-[11px] text-[#4a6080] hover:bg-[#111c30] border-b border-[#1e3050]">
                  – Ingen øvelse –
                </button>
                {drills.slice(0, 30).map(d => (
                  <button key={d.id} onClick={() => { setSelectedDrill(d); setShowDrillPicker(false); }}
                    className={`w-full text-left px-3 py-2.5 text-[11.5px] hover:bg-[#111c30] border-b border-[#1e3050]/50 transition-all
                      ${selectedDrill?.id === d.id ? 'text-sky-400 bg-sky-500/10' : 'text-slate-300'}`}>
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-[10px] text-[#4a6080]">{d.duration} min · {d.players} spillere · {d.difficulty}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Beskrivelse / notat */}
      <div className="mb-4">
        <label className="label-cal">Beskrivelse / notat</label>
        <textarea value={teamNote} onChange={e => setTeamNote(e.target.value)}
          rows={3} placeholder="Mål for økten, beskjeder til spillerne..."
          className="w-full mt-1 bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2.5
            text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed"/>
      </div>

      <div className="flex gap-2">
        <button onClick={save}
          className="flex-1 py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[12.5px] hover:bg-sky-500/25">
          Lagre
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-[#1e3050] text-[#4a6080] font-bold text-[12.5px] hover:text-slate-300">
          Avbryt
        </button>
      </div>

      <CalStyle />
    </div>
  );
};

// ═══ EVENT CARD ═══════════════════════════════════════════════

const EventCard: React.FC<{ event: CalendarEvent; onClick: () => void; onDelete: () => void }> = ({ event, onClick, onDelete }) => (
  <div className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-xl border border-[#1e3050] hover:border-[#2e4060] cursor-pointer transition-all group mb-2"
    onClick={onClick}>
    <div className={`w-2 h-10 rounded-full flex-shrink-0 ${event.type==='match'?'bg-red-400':'bg-emerald-400'}`} />
    <div className="flex-1 min-w-0">
      <div className="text-[12.5px] font-bold text-slate-200">{event.title}</div>
      <div className="text-[10.5px] text-[#4a6080]">
        {event.type==='match'?'⚽ Kamp':'🏃 Trening'}
        {event.time && ` · ${event.time}`}
        {event.location && ` · 📍 ${event.location}`}
      </div>
      {event.type==='match' && event.opponent && (
        <div className="text-[10.5px] text-slate-400">vs. {event.opponent} {event.result?`(${event.result})`:''}</div>
      )}
      {event.trainingNotes.length > 0 && (
        <div className="text-[10px] text-emerald-400/70 mt-0.5">📋 {event.trainingNotes[0].title}</div>
      )}
    </div>
    <button onClick={e => { e.stopPropagation(); onDelete(); }}
      className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-sm px-1 transition">✕</button>
  </div>
);

// ═══ EVENT DETAIL ═════════════════════════════════════════════

const EventDetail: React.FC<{
  event: CalendarEvent;
  onBack: () => void;
  onUpdate: (f: Partial<CalendarEvent>) => void;
}> = ({ event, onBack, onUpdate }) => {
  const { addTrainingNote, addMatchNote, deleteTrainingNote, deleteMatchNote } = useAppStore();
  const [newTrainTitle, setNewTrainTitle]   = useState('');
  const [newTrainContent, setNewTrainContent] = useState('');
  const [newMatchContent, setNewMatchContent] = useState('');
  const [newMatchHalf, setNewMatchHalf]     = useState<1|2|3>(1);
  const [newMatchTitle, setNewMatchTitle]   = useState('');
  const [focusTags, setFocusTags]           = useState<string[]>([]);

  return (
    <div className="max-w-2xl">
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

      {event.type==='match' && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[11px] text-[#4a6080] font-bold uppercase tracking-wider">Resultat:</span>
          <input value={event.result||''} onChange={e => onUpdate({ result: e.target.value })}
            placeholder="f.eks. 2-1"
            className="bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-1.5 text-slate-200 text-[13px] w-28 focus:outline-none focus:border-sky-500" />
        </div>
      )}

      <div className="mb-5">
        <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">Generelt notat</div>
        <textarea value={event.teamNote}
          onChange={e => onUpdate({ teamNote: e.target.value })}
          rows={3} placeholder="Skriv her..."
          className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2.5 text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed" />
      </div>

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
            <div className="flex flex-wrap gap-1.5 mb-2">
              {FOCUS_OPTIONS.slice(0, 6).map(f => (
                <button key={f} onClick={() => setFocusTags(prev =>
                  prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                )}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all
                    ${focusTags.includes(f) ? 'border-sky-500/60 bg-sky-500/15 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
                  {f}
                </button>
              ))}
            </div>
            <input value={newTrainTitle} onChange={e => setNewTrainTitle(e.target.value)}
              placeholder="Tittel"
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 mb-2 focus:outline-none focus:border-sky-500" />
            <textarea value={newTrainContent} onChange={e => setNewTrainContent(e.target.value)}
              rows={3} placeholder="Innhold / observasjoner..."
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 resize-y focus:outline-none focus:border-sky-500 mb-2 leading-relaxed" />
            <button onClick={() => {
              if (!newTrainContent.trim()) return;
              addTrainingNote(event.id, { title: newTrainTitle||'Notat', content: newTrainContent, focus: focusTags, targetPlayerIds: [] });
              setNewTrainTitle(''); setNewTrainContent(''); setFocusTags([]);
            }} className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[12px] hover:bg-emerald-500/25">
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
            <input value={newMatchTitle} onChange={e => setNewMatchTitle(e.target.value)}
              placeholder="Tittel"
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 mb-2 focus:outline-none focus:border-sky-500" />
            <textarea value={newMatchContent} onChange={e => setNewMatchContent(e.target.value)}
              rows={3} placeholder="Observasjoner, taktikknyheter, spillerbidrag..."
              className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[12.5px] text-slate-300 resize-y focus:outline-none focus:border-sky-500 mb-2 leading-relaxed" />
            <button onClick={() => {
              if (!newMatchContent.trim()) return;
              addMatchNote(event.id, { half: newMatchHalf, title: newMatchTitle||'Kampnotat', content: newMatchContent, targetPlayerIds: [] });
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
