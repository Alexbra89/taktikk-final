'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { CalendarEvent } from '@/types';
import { MONTHS, DAYS, EVENT_META, isEventOnDate } from './shared';
import { EventCard } from './EventCard';
import { EventDetail } from './EventDetail';
import { NewEventForm } from './NewEventForm';
import { AutoGenForm } from './AutoGenForm';

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

  const { events, addEvent, updateEvent, deleteEvent, ageGroup } = useAppStore();

  const todayStr = today.toISOString().slice(0, 10);

  const todayEvents = useMemo(() => {
    return events.filter(e => e.date === todayStr);
  }, [events, todayStr]);

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

  const eventsOnDate = (date: string) => events.filter(e => isEventOnDate(e, date));
  const evtsSelected = selectedDate ? eventsOnDate(selectedDate) : [];
  const openEvent    = selectedEvent ? events.find(e => e.id === selectedEvent) : null;

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
                    {EVENT_META[event.type]?.icon ?? '📅'} {event.title}
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
                      className={`w-1.5 h-1.5 rounded-full ${EVENT_META[e.type]?.dot ?? 'bg-emerald-400'}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

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

          {showAutoGen && (
            <AutoGenForm
              ageGroup={ageGroup}
              onGenerate={(evs) => { evs.forEach(e => addEvent(e)); setShowAutoGen(false); closeDetailPanel(); }}
              onCancel={closeDetailPanel}
            />
          )}

          {showNewEvent && !showAutoGen && (
            <NewEventForm
              date={selectedDate ?? todayStr}
              ageGroup={ageGroup}
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
                      onDelete={() => deleteEvent(ev.id)}
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
              onUpdate={(f) => updateEvent(openEvent.id, f)}
              onGoToTraining={onGoToTraining}
            />
          )}

          {!showNewEvent && !showAutoGen && !openEvent && !selectedDate && (
            <div>
              <h2 className="text-base font-bold text-slate-200 mb-4">
                Kommende arrangementer
              </h2>
              {events
                .filter(e => e.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 10)
                .map(ev => (
                  <EventCard key={ev.id} event={ev}
                    onClick={() => handleEventClick(ev)}
                    onDelete={() => deleteEvent(ev.id)}
                    onGoToTraining={onGoToTraining}
                  />
                ))}
              {events.filter(e => e.date >= todayStr).length === 0 && (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-[#4a6080] text-sm mb-4">Ingen kommende arrangementer.</p>
                  <button onClick={() => setShowAutoGen(true)}
                    className="px-4 py-3 sm:py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[12px] font-bold hover:bg-emerald-500/25 min-h-[44px]">
                    ✨ Autogenerer treningsplan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
