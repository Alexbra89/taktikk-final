'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CalendarEvent } from '../../types';
import { getDrillsBySport, DrillExercise, CATEGORY_LABELS } from '../../data/drills';

const MONTHS = ['Januar','Februar','Mars','April','Mai','Juni',
                'Juli','August','September','Oktober','November','Desember'];
const DAYS   = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

const FOCUS_OPTIONS = [
  'Pasningsspill','Pressing','Forsvarsstilling','Avslutning','Kontrapress',
  'Innlegg','Dødball','Keepertrening','Kondisjon','Styrke','Taktikk','Individuell teknikk',
];

// ═══════════════════════════════════════════════════════════════
interface CalendarViewProps {
  onGoToTraining?: (training: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onGoToTraining }) => {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate]   = useState<string | null>(null);
  const [showNewEvent, setShowNewEvent]   = useState(false);
  const [showAutoGen, setShowAutoGen]     = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showTodayStatus, setShowTodayStatus] = useState(true);

  const { events, addEvent, updateEvent, deleteEvent, sport, currentUser, playerAccounts, ageGroup } = useAppStore();

  const isCoach = currentUser?.role === 'coach';
  const currentPlayerId = currentUser?.playerId;
  const todayStr = today.toISOString().slice(0, 10);

  const filteredEvents = useMemo(() => {
    if (isCoach) return events;
    return events.map(event => {
      const hasIndividualNote = event.trainingNotes.some(note =>
        note.targetPlayerIds?.includes(currentPlayerId || '')
      );
      return {
        ...event,
        isIndividualForMe: hasIndividualNote
      };
    });
  }, [events, isCoach, currentPlayerId]);

  const todayEvents = useMemo(() => {
    return filteredEvents.filter(e => e.date === todayStr);
  }, [filteredEvents, todayStr]);

  const getTodayStatus = () => {
    if (todayEvents.length === 0) {
      return { type: 'free', label: 'Fri', icon: '😴', color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30' };
    }
    const hasMatch    = todayEvents.some(e => e.type === 'match');
    const hasTraining = todayEvents.some(e => e.type === 'training');
    if (hasMatch)    return { type: 'match',    label: 'Kamp',    icon: '⚽', color: 'text-red-400',     bgColor: 'bg-red-500/10',     borderColor: 'border-red-500/30' };
    if (hasTraining) return { type: 'training', label: 'Trening', icon: '🏃', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' };
    return { type: 'free', label: 'Fri', icon: '😴', color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30' };
  };

  const todayStatus = getTodayStatus();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = (firstDay + 6) % 7;

  const isoDate = (d: number) =>
    `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const eventsOnDate = (date: string) => filteredEvents.filter(e => e.date === date);
  const evtsSelected = selectedDate ? eventsOnDate(selectedDate) : [];
  const openEvent    = selectedEvent ? filteredEvents.find(e => e.id === selectedEvent) : null;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const handleEventClick = (ev: CalendarEvent) => {
    if (ev.type === 'training' && onGoToTraining) {
      onGoToTraining(ev);
    } else {
      setSelectedEvent(ev.id);
    }
  };

  const closeDetailPanel = () => {
    setSelectedDate(null);
    setShowNewEvent(false);
    setShowAutoGen(false);
    setSelectedEvent(null);
  };

  // Mobil: vis kalender ELLER detaljpanel (ikke begge side-om-side)
  const showCalendar = !selectedDate && !showNewEvent && !showAutoGen && !selectedEvent;

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* ── Kalender-kolonne ── */}
      <div className={`
        ${showCalendar ? 'flex' : 'hidden lg:flex'}
        flex-col w-full lg:w-80 lg:min-w-[320px] flex-shrink-0
        border-r border-[#1e3050] bg-[#0c1525] h-full overflow-hidden
      `}>
        {showTodayStatus && (
          <div className={`m-3 p-3 rounded-xl border ${todayStatus.bgColor} ${todayStatus.borderColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{todayStatus.icon}</span>
                <div>
                  <div className="text-[9px] text-[#4a6080] uppercase tracking-wider">Dagens status</div>
                  <div className={`text-sm font-bold ${todayStatus.color}`}>{todayStatus.label}</div>
                </div>
              </div>
              <button onClick={() => setShowTodayStatus(false)} className="text-[#4a6080] hover:text-slate-300 text-[10px] min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
            </div>
            {todayEvents.length > 0 && (
              <div className="mt-2 space-y-1">
                {todayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    onClick={() => { setSelectedDate(todayStr); handleEventClick(event); }}
                    className="text-[10px] text-slate-300 hover:text-sky-400 cursor-pointer truncate min-h-[32px] flex items-center"
                  >
                    {event.type === 'match' ? '⚽' : '🏃'} {event.title}
                    {event.time && ` · ${event.time}`}
                  </div>
                ))}
                {todayEvents.length > 2 && (
                  <div className="text-[9px] text-[#4a6080]">+{todayEvents.length - 2} flere</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3050] flex-shrink-0">
          <button onClick={prevMonth} className="text-[#4a6080] hover:text-white text-lg min-h-[44px] min-w-[44px] flex items-center justify-center">‹</button>
          <span className="text-sm font-bold text-slate-200">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="text-[#4a6080] hover:text-white text-lg min-h-[44px] min-w-[44px] flex items-center justify-center">›</button>
        </div>

        <div className="grid grid-cols-7 px-2 pt-2 flex-shrink-0">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[9px] sm:text-[9.5px] font-bold text-[#3a5070] py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 px-2 pb-2 flex-1 overflow-y-auto">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const iso     = isoDate(day);
            const dayEvts = eventsOnDate(iso);
            const isToday = iso === todayStr;
            const isSel   = selectedDate === iso;
            return (
              <div key={day}
                onClick={() => { setSelectedDate(iso); setSelectedEvent(null); setShowNewEvent(false); setShowAutoGen(false); }}
                className={`relative flex flex-col items-center p-1.5 sm:p-1 rounded-lg cursor-pointer transition-all m-0.5 min-h-[44px] sm:min-h-0
                  ${isSel ? 'bg-sky-500/20 ring-1 ring-sky-500/50' : 'hover:bg-[#111c30]'}`}>
                <span className={`text-[11px] sm:text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-sky-500 text-white' : isSel ? 'text-sky-400' : 'text-slate-400'}`}>
                  {day}
                </span>
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEvts.slice(0, 3).map(e => (
                    <span key={e.id}
                      className={`w-1.5 h-1.5 rounded-full ${e.type === 'match' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {isCoach && (
          <div className="border-t border-[#1e3050] p-3 space-y-2 flex-shrink-0">
            <button onClick={() => { setShowNewEvent(true); setShowAutoGen(false); setSelectedEvent(null); }}
              className="w-full py-3 sm:py-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[12px] font-bold hover:bg-sky-500/25 transition min-h-[44px]">
              ＋ Nytt arrangement
            </button>
            <button onClick={() => { setShowAutoGen(true); setShowNewEvent(false); setSelectedEvent(null); }}
              className="w-full py-3 sm:py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[12px] font-bold hover:bg-emerald-500/20 transition min-h-[44px]">
              ✨ Autogenerer treningsplan
            </button>
          </div>
        )}
      </div>

      {/* ── Detaljpanel ── */}
      <div className={`
        ${!showCalendar ? 'flex' : 'hidden lg:flex'}
        flex-1 flex-col overflow-hidden h-full
      `}>
        <button onClick={closeDetailPanel}
          className="lg:hidden flex-shrink-0 flex items-center gap-1 px-4 py-3
            border-b border-[#1e3050] text-[11px] text-sky-400 min-h-[44px]">
          ‹ Tilbake til kalender
        </button>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">

          {showAutoGen && isCoach && (
            <AutoGenForm
              sport={sport}
              ageGroup={ageGroup}
              onGenerate={(evs) => { evs.forEach(e => addEvent(e)); setShowAutoGen(false); closeDetailPanel(); }}
              onCancel={closeDetailPanel}
            />
          )}

          {showNewEvent && isCoach && !showAutoGen && (
            <NewEventForm
              date={selectedDate ?? todayStr}
              sport={sport}
              ageGroup={ageGroup}
              playerAccounts={playerAccounts as any[]}
              onSave={(ev) => { addEvent(ev); setShowNewEvent(false); closeDetailPanel(); }}
              onCancel={closeDetailPanel}
            />
          )}

          {!showNewEvent && !showAutoGen && !openEvent && selectedDate && (
            <div>
              <h2 className="text-base font-bold text-slate-200 mb-4">
                📅 {new Date(selectedDate + 'T12:00:00').toLocaleDateString('nb-NO',
                  { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              {evtsSelected.length === 0 ? (
                <p className="text-[#4a6080] text-sm">Ingen arrangementer denne dagen.</p>
              ) : (
                <div className="space-y-2">
                  {evtsSelected.map(ev => (
                    <EventCard key={ev.id} event={ev}
                      onClick={() => handleEventClick(ev)}
                      onDelete={() => isCoach && deleteEvent(ev.id)}
                      isCoach={isCoach}
                      currentPlayerId={currentPlayerId}
                      onGoToTraining={onGoToTraining}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!showNewEvent && !showAutoGen && openEvent && (
            <EventDetail
              event={openEvent}
              onBack={() => setSelectedEvent(null)}
              onUpdate={(f) => isCoach && updateEvent(openEvent.id, f)}
              isCoach={isCoach}
              currentPlayerId={currentPlayerId}
              onGoToTraining={onGoToTraining}
            />
          )}

          {!showNewEvent && !showAutoGen && !openEvent && !selectedDate && (
            <div>
              <h2 className="text-base font-bold text-slate-200 mb-4">
                {isCoach ? 'Kommende arrangementer' : 'Dine kommende arrangementer'}
              </h2>
              {filteredEvents
                .filter(e => e.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 10)
                .map(ev => (
                  <EventCard key={ev.id} event={ev}
                    onClick={() => handleEventClick(ev)}
                    onDelete={() => isCoach && deleteEvent(ev.id)}
                    isCoach={isCoach}
                    currentPlayerId={currentPlayerId}
                    onGoToTraining={onGoToTraining}
                  />
                ))}
              {filteredEvents.filter(e => e.date >= todayStr).length === 0 && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-[#4a6080] text-sm mb-4">Ingen kommende arrangementer.</p>
                  {isCoach && (
                    <button onClick={() => setShowAutoGen(true)}
                      className="px-4 py-3 sm:py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[12px] font-bold hover:bg-emerald-500/25 min-h-[44px]">
                      ✨ Autogenerer treningsplan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══ AUTOGENERER TRENINGSPLAN (RESPONSIV OPPDATERT) ═══════════════════════

const AutoGenForm: React.FC<{
  sport: string;
  ageGroup: 'youth' | 'adult';
  onGenerate: (evs: Omit<CalendarEvent, 'id'>[]) => void;
  onCancel: () => void;
}> = ({ sport, ageGroup, onGenerate, onCancel }) => {
  const today = new Date();
  const [weeks, setWeeks]         = useState(4);
  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [time, setTime]           = useState('18:00');
  const [location, setLocation]   = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]);
  const [focusTags, setFocusTags] = useState<string[]>([]);

  const activeSport = sport === 'handball' ? 'handball' : 'football';
  const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  function toggleDay(d: number) {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    );
  }

  const previewDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(startDate + 'T12:00:00');
    let current = new Date(start);
    const dayOfWeek = (current.getDay() + 6) % 7;
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
    return dates.slice(0, weeks * 3 + 2);
  }, [startDate, weeks, selectedDays]);

  function generate() {
    const allDrills = getDrillsBySport(activeSport);
    const drills = allDrills.filter(d => !d.ageGroup || d.ageGroup === ageGroup);
    const events: Omit<CalendarEvent, 'id'>[] = [];

    previewDates.forEach((date, idx) => {
      const drill = drills[idx % drills.length];
      const focusLine = focusTags.length > 0 ? `\nFokus: ${focusTags.join(', ')}` : '';
      const drillDesc = drill
        ? `\n\n📋 Øvelse: ${drill.name}\n${drill.description}`
        : '';

      const eventId = `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`;
      const noteId = `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`;

      events.push({
        type: 'training',
        title: `Trening${focusTags[0] ? ` – ${focusTags[0]}` : ''} ${new Date(date + 'T12:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}`,
        date,
        time,
        location,
        opponent: '',
        result: '',
        teamNote: `Autogenerert treningsøkt.${focusLine}${drillDesc}`,
        trainingNotes: drill ? [{
          id: noteId,
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

  const sportEmoji = activeSport === 'football' ? '⚽' : '🤾';
  const sportName  = activeSport === 'football' ? 'Fotball' : 'Håndball';

  return (
    <div className="bg-[#0f1a2a] rounded-2xl border border-[#1e3050] p-4 sm:p-5 mb-5 max-w-2xl">
      <div className="flex items-center gap-2 mb-4 sm:mb-5">
        <span className="text-2xl">✨</span>
        <div>
          <h3 className="text-sm font-bold text-slate-200">Autogenerer treningsplan</h3>
          <p className="text-[10px] sm:text-[11px] text-[#4a6080]">
            {sportEmoji} {sportName} · {ageGroup === 'youth' ? '🧒 Barneøvelser' : '🧑 Voksenøvelser'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label-cal">Startdato</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="inp-cal" />
        </div>
        <div>
          <label className="label-cal">Treningstid</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="inp-cal" />
        </div>
        <div>
          <label className="label-cal">Sted</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Stadion / hall" className="inp-cal" />
        </div>
        <div>
          <label className="label-cal">Antall uker</label>
          <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="inp-cal">
            {[2, 3, 4, 6, 8, 12].map(w => <option key={w} value={w}>{w} uker</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="label-cal">Treningsdager per uke</label>
        <div className="flex gap-1.5 sm:gap-2 mt-2 flex-wrap">
          {WEEKDAYS.map((d, i) => (
            <button key={i} onClick={() => toggleDay(i)}
              className={`min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:w-10 sm:h-10 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center
                ${selectedDays.includes(i)
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                  : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
              {d}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[#3a5070] mt-1">{selectedDays.length} dager valgt → {selectedDays.length * weeks} treningsøkter totalt</p>
      </div>

      <div className="mb-5">
        <label className="label-cal">Fokusområder (valgfritt)</label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {FOCUS_OPTIONS.map(f => (
            <button key={f} onClick={() => setFocusTags(prev =>
              prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
            )}
              className={`px-2.5 py-1.5 sm:py-1 rounded-full text-[10.5px] font-semibold border transition-all min-h-[36px] sm:min-h-0
                ${focusTags.includes(f)
                  ? 'border-sky-500/60 bg-sky-500/15 text-sky-400'
                  : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {previewDates.length > 0 && (
        <div className="bg-[#0c1525] rounded-xl border border-[#1e3050] p-3 mb-4">
          <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">
            Forhåndsvisning — {previewDates.length} økter
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
            {previewDates.map((d) => (
              <div key={d} className="text-[10.5px] text-slate-300 bg-[#111c30] rounded-lg px-2 py-1.5 border border-[#1e3050] min-h-[36px] flex items-center">
                {new Date(d + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button onClick={generate} disabled={selectedDays.length === 0}
          className="flex-1 py-3 sm:py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[12.5px] hover:bg-emerald-500/25 disabled:opacity-40 min-h-[44px]">
          ✨ Generer {previewDates.length} treningsøkter
        </button>
        <button onClick={onCancel}
          className="px-4 py-3 sm:py-2.5 rounded-lg border border-[#1e3050] text-[#4a6080] font-bold text-[12.5px] hover:text-slate-300 min-h-[44px]">
          Avbryt
        </button>
      </div>

      <CalStyle />
    </div>
  );
};

// ═══ NY HENDELSE-FORM (RESPONSIV OPPDATERT) ═══════════════════════

const NewEventForm: React.FC<{
  date: string;
  sport: string;
  ageGroup: 'youth' | 'adult';
  playerAccounts: any[];
  onSave: (ev: Omit<CalendarEvent, 'id'>) => void;
  onCancel: () => void;
}> = ({ date, sport, ageGroup, playerAccounts, onSave, onCancel }) => {
  const [type, setType]         = useState<'training' | 'match'>('training');
  const [title, setTitle]       = useState('');
  const [evDate, setEvDate]     = useState(date);
  const [time, setTime]         = useState('18:00');
  const [location, setLocation] = useState('');
  const [opponent, setOpponent] = useState('');
  const [teamNote, setTeamNote] = useState('');
  const [focusTags, setFocusTags] = useState<string[]>([]);
  const [selectedDrills, setSelectedDrills] = useState<DrillExercise[]>([]);
  const [showDrillPicker, setShowDrillPicker] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isIndividualTraining, setIsIndividualTraining] = useState(false);
  const [saving, setSaving] = useState(false);

  const [drillSearch, setDrillSearch]       = useState('');
  const [drillCategory, setDrillCategory]   = useState<string>('alle');
  const [drillDifficulty, setDrillDifficulty] = useState<string>('alle');

  const allDrillsForEvent = getDrillsBySport(sport === 'handball' ? 'handball' : 'football');

  const categories = useMemo(() => {
    return Array.from(new Set(allDrillsForEvent.map(d => d.category)));
  }, [allDrillsForEvent]);

  const filteredDrills = useMemo(() => {
    let drills = allDrillsForEvent.filter(d => !d.ageGroup || d.ageGroup === ageGroup);
    if (drillCategory !== 'alle') drills = drills.filter(d => d.category === drillCategory);
    if (drillDifficulty !== 'alle') drills = drills.filter(d => d.difficulty === drillDifficulty);
    if (drillSearch.trim()) {
      const q = drillSearch.toLowerCase();
      drills = drills.filter(d =>
        d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
    }
    return drills;
  }, [allDrillsForEvent, ageGroup, drillCategory, drillDifficulty, drillSearch]);

  const addDrill = (drill: DrillExercise) => {
    if (!selectedDrills.some(d => d.id === drill.id)) {
      setSelectedDrills(prev => [...prev, drill]);
    }
    setShowDrillPicker(false);
  };

  const removeDrill = (drillId: string) => {
    setSelectedDrills(prev => prev.filter(d => d.id !== drillId));
  };

  const save = () => {
    if (!title.trim()) { alert('Fyll inn tittel'); return; }
    if (isIndividualTraining && selectedPlayerIds.length === 0) {
      alert('Velg minst én spiller for individuell trening');
      return;
    }
    setSaving(true);

    const drillNotes = selectedDrills.map(d => `\n📋 ${d.name}\n${d.description}`).join('');
    const focusNote  = focusTags.length > 0 ? `Fokus: ${focusTags.join(', ')}` : '';
    const individualNote = isIndividualTraining && selectedPlayerIds.length > 0
      ? `\n👤 Individuell trening for: ${selectedPlayerIds.map(id => {
          const player = playerAccounts.find(p => p.playerId === id);
          return player?.name || id;
        }).join(', ')}`
      : '';

    const trainingNotes = selectedDrills.map(drill => ({
      id: `tn-${Date.now()}-${drill.id}`,
      createdAt: new Date().toISOString(),
      title: drill.name,
      content: drill.description,
      focus: focusTags,
      targetPlayerIds: isIndividualTraining ? selectedPlayerIds : [],
    }));

    onSave({
      type,
      title: title.trim(),
      date: evDate,
      time,
      location,
      opponent: type === 'match' ? opponent : '',
      result: '',
      teamNote: [focusNote, teamNote, drillNotes, individualNote].filter(Boolean).join('\n'),
      trainingNotes: type === 'training' ? trainingNotes : [],
      matchNotes: [],
    });

    setSaving(false);
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  return (
    <div className="bg-[#0f1a2a] rounded-2xl border border-[#1e3050] p-4 sm:p-5 mb-5 max-w-2xl">
      <h3 className="text-sm font-bold text-slate-200 mb-4">Nytt arrangement</h3>

      <div className="flex gap-2 mb-4">
        {(['training', 'match'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-3 sm:py-2 rounded-lg text-[12px] font-bold border transition-all min-h-[44px]
              ${type === t
                ? t === 'match'
                  ? 'border-red-500 bg-red-500/15 text-red-400'
                  : 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
            {t === 'match' ? '⚽ Kamp' : '🏃 Trening'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="sm:col-span-2">
          <label className="label-cal">Tittel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="inp-cal" placeholder={type === 'match' ? 'Seriekamp runde 5' : 'Teknikktrening'} />
        </div>
        <div>
          <label className="label-cal">Dato</label>
          <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="inp-cal" />
        </div>
        <div>
          <label className="label-cal">Tid</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="inp-cal" />
        </div>
        <div>
          <label className="label-cal">Sted</label>
          <input value={location} onChange={e => setLocation(e.target.value)} className="inp-cal" placeholder="Stadion / hall" />
        </div>
        {type === 'match' && (
          <div>
            <label className="label-cal">Motstander</label>
            <input value={opponent} onChange={e => setOpponent(e.target.value)} className="inp-cal" placeholder="Lag X" />
          </div>
        )}
      </div>

      {type === 'training' && (
        <div className="mb-3">
          <label className="label-cal">Trenings type</label>
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={() => setIsIndividualTraining(false)}
              className={`flex-1 py-3 sm:py-2 rounded-lg text-[11px] font-bold border transition-all min-h-[44px]
                ${!isIndividualTraining ? 'border-sky-500 bg-sky-500/15 text-sky-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
              👥 Felles trening
            </button>
            <button type="button" onClick={() => setIsIndividualTraining(true)}
              className={`flex-1 py-3 sm:py-2 rounded-lg text-[11px] font-bold border transition-all min-h-[44px]
                ${isIndividualTraining ? 'border-amber-500 bg-amber-500/15 text-amber-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
              🎯 Individuell trening
            </button>
          </div>
        </div>
      )}

      {type === 'training' && isIndividualTraining && (
        <div className="mb-3">
          <label className="label-cal">Velg spillere *</label>
          <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto p-2 bg-[#0c1525] rounded-xl border border-[#1e3050]">
            {playerAccounts.map((player: any) => (
              <button key={player.id} type="button" onClick={() => togglePlayer(player.playerId)}
                className={`px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] font-semibold border transition-all min-h-[36px]
                  ${selectedPlayerIds.includes(player.playerId)
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
                {player.name}
              </button>
            ))}
          </div>
          {selectedPlayerIds.length === 0 && (
            <p className="text-[10px] text-red-400/70 mt-1">Velg minst én spiller for individuell trening</p>
          )}
        </div>
      )}

      {type === 'training' && (
        <>
          <div className="mb-3">
            <label className="label-cal">Fokusområder</label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {FOCUS_OPTIONS.slice(0, 8).map(f => (
                <button key={f} onClick={() => setFocusTags(prev =>
                  prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                )}
                  className={`px-2.5 py-1.5 sm:py-1 rounded-full text-[10.5px] font-semibold border transition-all min-h-[36px] sm:min-h-0
                    ${focusTags.includes(f)
                      ? 'border-sky-500/60 bg-sky-500/15 text-sky-400'
                      : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="label-cal">Øvelser fra biblioteket (velg flere)</label>

            {selectedDrills.length > 0 && (
              <div className="mb-2 space-y-1 max-h-32 overflow-y-auto">
                {selectedDrills.map(drill => (
                  <div key={drill.id} className="flex items-center justify-between bg-[#0c1525] rounded-lg px-3 py-2 border border-[#1e3050]">
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-slate-200">{drill.name}</div>
                      <div className="text-[9px] text-[#4a6080]">{drill.duration} min · {drill.players} spillere · {drill.difficulty}</div>
                    </div>
                    <button type="button" onClick={() => removeDrill(drill.id)}
                      className="text-red-400/70 hover:text-red-400 text-[11px] px-2 min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => setShowDrillPicker(!showDrillPicker)}
              className="w-full mt-1 py-3 sm:py-2 px-3 rounded-lg border border-[#1e3050] text-left text-[12px] text-[#4a6080] hover:border-sky-500/50 hover:text-slate-300 transition-all flex items-center justify-between min-h-[44px]">
              <span>{selectedDrills.length > 0 ? `+ Legg til flere øvelser (${selectedDrills.length} valgt)` : '– Velg øvelser –'}</span>
              <span>{showDrillPicker ? '▲' : '▼'}</span>
            </button>

            {showDrillPicker && (
              <div className="mt-2 bg-[#0c1525] border border-[#1e3050] rounded-xl overflow-hidden">
                <div className="p-2 border-b border-[#1e3050] space-y-2">
                  <input type="text" placeholder="🔍 Søk etter øvelse..."
                    value={drillSearch} onChange={e => setDrillSearch(e.target.value)}
                    className="w-full bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500 min-h-[44px]" />
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setDrillCategory('alle')}
                      className={`px-2 py-1.5 sm:py-0.5 rounded-md text-[9px] font-semibold transition-all min-h-[32px] sm:min-h-0
                        ${drillCategory === 'alle' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}>
                      Alle
                    </button>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setDrillCategory(cat)}
                        className={`px-2 py-1.5 sm:py-0.5 rounded-md text-[9px] font-semibold transition-all min-h-[32px] sm:min-h-0
                          ${drillCategory === cat ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}>
                        {CATEGORY_LABELS[cat]?.split(' ')[1] || cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setDrillDifficulty('alle')}
                      className={`px-2 py-1.5 sm:py-0.5 rounded-md text-[9px] font-semibold transition-all min-h-[32px] sm:min-h-0
                        ${drillDifficulty === 'alle' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-[#4a6080] hover:text-slate-300'}`}>
                      Alle
                    </button>
                    {['enkel', 'middels', 'avansert'].map(level => (
                      <button key={level} onClick={() => setDrillDifficulty(level)}
                        className={`px-2 py-1.5 sm:py-0.5 rounded-md text-[9px] font-semibold transition-all min-h-[32px] sm:min-h-0
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
                    <div className="text-center py-8 text-[#4a6080] text-[11px]">Ingen øvelser funnet</div>
                  ) : (
                    filteredDrills.map(drill => {
                      const isSelected = selectedDrills.some(sd => sd.id === drill.id);
                      return (
                        <button key={drill.id} type="button"
                          onClick={() => isSelected ? removeDrill(drill.id) : addDrill(drill)}
                          className={`w-full text-left px-3 py-3 sm:py-2.5 text-[11.5px] hover:bg-[#111c30] border-b border-[#1e3050]/50 transition-all min-h-[44px]
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
        </>
      )}

      <div className="mb-4">
        <label className="label-cal">Beskrivelse / notat</label>
        <textarea value={teamNote} onChange={e => setTeamNote(e.target.value)}
          rows={3} placeholder="Mål for økten, beskjeder til spillerne..."
          className="w-full mt-1 bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-3 sm:py-2.5
            text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={save}
          disabled={saving || (isIndividualTraining && selectedPlayerIds.length === 0)}
          className="flex-1 py-3 sm:py-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[12.5px] hover:bg-sky-500/25 disabled:opacity-40 transition min-h-[44px]">
          {saving ? 'Lagrer...' : 'Lagre'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-3 sm:py-2.5 rounded-lg border border-[#1e3050] text-[#4a6080] font-bold text-[12.5px] hover:text-slate-300 min-h-[44px]">
          Avbryt
        </button>
      </div>

      <CalStyle />
    </div>
  );
};

// ═══ EVENT CARD (RESPONSIV OPPDATERT) ═══════════════════════════

const EventCard: React.FC<{
  event: CalendarEvent;
  onClick: () => void;
  onDelete: () => void;
  isCoach: boolean;
  currentPlayerId?: string;
  onGoToTraining?: (training: CalendarEvent) => void;
}> = ({ event, onClick, onDelete, isCoach, currentPlayerId, onGoToTraining }) => {
  const isIndividualForMe = !isCoach && event.trainingNotes.some(note =>
    note.targetPlayerIds?.includes(currentPlayerId || '')
  );

  return (
    <div className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] hover:border-[#2e4060] cursor-pointer transition-all group mb-2"
      onClick={onClick}>
      <div className="flex items-center gap-3 p-3">
        <div className={`w-2 h-10 rounded-full flex-shrink-0 ${event.type === 'match' ? 'bg-red-400' : isIndividualForMe ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold text-slate-200 truncate">{event.title}</div>
          <div className="text-[10.5px] text-[#4a6080]">
            {event.type === 'match' ? '⚽ Kamp' : '🏃 Trening'}
            {isIndividualForMe && <span className="ml-2 text-amber-400">🎯 Individuell</span>}
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
        {isCoach && (
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 text-sm px-1 transition min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        )}
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

// ═══ EVENT DETAIL (RESPONSIV OPPDATERT) ══════════════════════════

const EventDetail: React.FC<{
  event: CalendarEvent;
  onBack: () => void;
  onUpdate: (f: Partial<CalendarEvent>) => void;
  isCoach: boolean;
  currentPlayerId?: string;
  onGoToTraining?: (training: CalendarEvent) => void;
}> = ({ event, onBack, onUpdate, isCoach, currentPlayerId, onGoToTraining }) => {
  const { addTrainingNote, addMatchNote, deleteTrainingNote, deleteMatchNote, playerAccounts } = useAppStore();
  const [newTrainTitle, setNewTrainTitle]     = useState('');
  const [newTrainContent, setNewTrainContent] = useState('');
  const [newMatchContent, setNewMatchContent] = useState('');
  const [newMatchHalf, setNewMatchHalf]       = useState<1 | 2 | 3>(1);
  const [newMatchTitle, setNewMatchTitle]     = useState('');
  const [focusTags, setFocusTags]             = useState<string[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isIndividualTraining, setIsIndividualTraining] = useState(
    event.trainingNotes.some(n => n.targetPlayerIds?.length > 0)
  );

  const targetPlayers = event.trainingNotes.flatMap(n => n.targetPlayerIds || []);
  const targetPlayerNames = targetPlayers.map(id => {
    const player = (playerAccounts as any[]).find(p => p.playerId === id);
    return player?.name || id;
  });

  const isForMe = !isCoach && targetPlayers.includes(currentPlayerId || '');

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="text-[#4a6080] hover:text-sky-400 text-[12px] mb-4 flex items-center gap-1 min-h-[44px]">
        ‹ Tilbake
      </button>

      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-3
        ${event.type === 'match' ? 'bg-red-500/15 text-red-400' : isForMe ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
        {event.type === 'match' ? '⚽ Kamp' : isForMe ? '🎯 Individuell trening' : '🏃 Felles trening'}
      </div>

      <h2 className="text-xl font-black text-slate-100 mb-1">{event.title}</h2>
      <div className="text-[12px] text-[#4a6080] mb-4">
        📅 {new Date(event.date + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
        {event.time && ` · ⏰ ${event.time}`}
        {event.location && ` · 📍 ${event.location}`}
        {event.opponent && ` · vs. ${event.opponent}`}
        {targetPlayers.length > 0 && (
          <div className="mt-1 text-amber-400">🎯 Individuell trening for: {targetPlayerNames.join(', ')}</div>
        )}
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
          {isCoach ? (
            <input value={event.result || ''} onChange={e => onUpdate({ result: e.target.value })}
              placeholder="f.eks. 2-1"
              className="bg-[#111c30] border border-[#1e3050] rounded-lg px-3 py-2 text-slate-200 text-[13px] w-28 focus:outline-none focus:border-sky-500 min-h-[44px]" />
          ) : (
            <span className="text-slate-200 text-[13px]">{event.result || 'Ikke rapportert'}</span>
          )}
        </div>
      )}

      <div className="mb-5">
        <div className="text-[10px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">Generelt notat</div>
        {isCoach ? (
          <textarea value={event.teamNote}
            onChange={e => onUpdate({ teamNote: e.target.value })}
            rows={3} placeholder="Skriv her..."
            className="w-full bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-3 sm:py-2.5 text-slate-300 text-[12.5px] resize-y focus:outline-none focus:border-sky-500 leading-relaxed" />
        ) : (
          <div className="bg-[#111c30] border border-[#1e3050] rounded-xl px-3 py-2.5 text-slate-300 text-[12.5px] whitespace-pre-wrap">
            {event.teamNote || 'Ingen notat.'}
          </div>
        )}
      </div>

      {event.type === 'training' && (
        <section>
          <h3 className="text-sm font-bold text-emerald-400 mb-3">🏃 Treningsnotater</h3>

          {event.trainingNotes.map(tn => (
            <div key={tn.id} className="bg-[#0f1a2a] border border-[#1e3050] rounded-xl p-4 mb-2">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-[13px] font-bold text-slate-200">{tn.title}</span>
                  {tn.targetPlayerIds?.length > 0 && (
                    <span className="ml-2 text-[10px] text-amber-400">🎯 Individuell</span>
                  )}
                </div>
                {isCoach && (
                  <button onClick={() => deleteTrainingNote(event.id, tn.id)}
                    className="text-red-400/50 hover:text-red-400 text-xs min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
                )}
              </div>
              <p className="text-[12px] text-[#7a9ab8] leading-relaxed whitespace-pre-wrap">{tn.content}</p>
              {tn.focus.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {tn.focus.map((f, i) => (
                    <span key={i} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">{f}</span>
                  ))}
                </div>
              )}
              {tn.targetPlayerIds?.length > 0 && (
                <div className="mt-2 text-[9px] text-amber-400/70">
                  👤 Gjelder: {tn.targetPlayerIds.map(id => {
                    const player = (playerAccounts as any[]).find(p => p.playerId === id);
                    return player?.name || id;
                  }).join(', ')}
                </div>
              )}
            </div>
          ))}

          {isCoach && (
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
              <div className="flex gap-2 mb-2">
                <button onClick={() => setIsIndividualTraining(!isIndividualTraining)}
                  className={`px-2 py-1.5 sm:py-1 rounded-md text-[10px] font-semibold border transition-all min-h-[36px] sm:min-h-0
                    ${isIndividualTraining ? 'border-amber-500 bg-amber-500/15 text-amber-400' : 'border-[#1e3050] text-[#4a6080]'}`}>
                  {isIndividualTraining ? '🎯 Individuell' : '👥 Felles'}
                </button>
              </div>
              {isIndividualTraining && (
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto p-1">
                  {(playerAccounts as any[]).map((player: any) => (
                    <button key={player.id} type="button"
                      onClick={() => setSelectedPlayerIds(prev =>
                        prev.includes(player.playerId) ? prev.filter(id => id !== player.playerId) : [...prev, player.playerId]
                      )}
                      className={`px-2 py-1.5 sm:py-1 rounded-full text-[9px] font-semibold border transition-all min-h-[36px] sm:min-h-0
                        ${selectedPlayerIds.includes(player.playerId)
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'border-[#1e3050] text-[#4a6080]'}`}>
                      {player.name}
                    </button>
                  ))}
                </div>
              )}
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
                  targetPlayerIds: isIndividualTraining ? selectedPlayerIds : [],
                });
                setNewTrainTitle(''); setNewTrainContent(''); setFocusTags([]); setSelectedPlayerIds([]); setIsIndividualTraining(false);
              }} className="px-4 py-3 sm:py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[12px] hover:bg-emerald-500/25 min-h-[44px]">
                Legg til notat
              </button>
            </div>
          )}
        </section>
      )}

      {event.type === 'match' && isCoach && (
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
              addMatchNote(event.id, { half: newMatchHalf, title: newMatchTitle || 'Kampnotat', content: newMatchContent, targetPlayerIds: [] });
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

// ═══ STYLES (URØRT) ═══════════════════════════════════════════

const CalStyle = () => (
  <style>{`
    .inp-cal { width:100%; background:#111c30; border:1px solid #1e3050;
      border-radius:8px; padding:10px 12px; color:#e2e8f0; font-size:12.5px;
      margin-top:4px; box-sizing:border-box; min-height:44px; }
    .inp-cal:focus { outline:none; border-color:#38bdf8; }
    .label-cal { font-size:9.5px; font-weight:700; color:#3a5070;
      text-transform:uppercase; letter-spacing:0.08em; display:block; }
  `}</style>
);