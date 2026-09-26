'use client';
import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Sparkle, Moon, Swords, Activity, CalendarDays,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { CalendarEvent } from '@/types';
import {
  MONTHS, DAYS, EVENT_META, isEventOnDate, formatDayTitle, formatDateLong,
} from './shared';
import { EventCard } from './EventCard';
import { EventDetail } from './EventDetail';
import { NewEventForm } from './NewEventForm';
import { AutoGenForm } from './AutoGenForm';

// ═══════════════════════════════════════════════════════════════
interface CalendarViewProps {
  onGoToTraining?: (training: CalendarEvent) => void;
  /** Åpner kalenderen på en bestemt dag (YYYY-MM-DD), f.eks. fra ukestripa på dashbordet. */
  initialDate?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onGoToTraining, initialDate }) => {
  const today = new Date();
  const start = initialDate ? new Date(initialDate + 'T12:00:00') : today;
  const [year,  setYear]  = useState(start.getFullYear());
  const [month, setMonth] = useState(start.getMonth());
  const [selectedDate, setSelectedDate]   = useState<string | null>(initialDate ?? null);
  const [showNewEvent, setShowNewEvent]   = useState(false);
  const [showAutoGen, setShowAutoGen]     = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const { events, addEvent, updateEvent, deleteEvent, ageGroup } = useAppStore();

  const todayStr = today.toISOString().slice(0, 10);

  const todayEvents = useMemo(() => {
    return events.filter(e => e.date === todayStr);
  }, [events, todayStr]);

  // Dagens status – også inngangen til Baneklar-modus senere.
  const getTodayStatus = () => {
    const hasMatch    = todayEvents.some(e => e.type === 'match');
    const hasTraining = todayEvents.some(e => e.type === 'training');
    if (hasMatch)    return { type: 'match'    as const, label: 'Kamp',    Icon: Swords,   tone: 'text-signal' };
    if (hasTraining) return { type: 'training' as const, label: 'Trening', Icon: Activity, tone: 'text-ink' };
    return { type: 'free' as const, label: 'Fri', Icon: Moon, tone: 'text-ink-muted' };
  };

  const todayStatus = getTodayStatus();
  const StatusIcon  = todayStatus.Icon;

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

  // Mobil: vis kalender ELLER detaljpanel. Skjemaene ligger i Modal over begge,
  // slik at måneden aldri forsvinner mens treneren fyller ut.
  const showCalendar = !selectedDate && !selectedEvent;

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-canvas text-ink">
      {/* ── Kalender-kolonne ── */}
      <div className={`
        ${showCalendar ? 'flex' : 'hidden lg:flex'}
        flex-col w-full lg:w-80 lg:min-w-[320px] flex-shrink-0
        border-r border-rule bg-canvas-sunken h-full overflow-hidden
      `}>
        {/* I dag – status og dagens hendelser */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-rule">
          <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">I dag</div>
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <h2 className="font-serif text-[1.75rem] leading-tight text-ink">{formatDayTitle(todayStr)}</h2>
            <span className={`inline-flex items-center gap-1.5 text-body font-bold ${todayStatus.tone}`}>
              <StatusIcon size={14} strokeWidth={1.75} aria-hidden />
              {todayStatus.label}
            </span>
          </div>

          {todayEvents.length > 0 && (
            <ul className="mt-2 space-y-px">
              {todayEvents.slice(0, 2).map(event => {
                const meta = EVENT_META[event.type] ?? EVENT_META.training;
                return (
                  <li key={event.id}>
                    <button
                      onClick={() => { setSelectedDate(todayStr); handleEventClick(event); }}
                      className="tap-auto w-full flex items-center gap-2 min-h-[32px] px-2 -mx-2 rounded-ctl
                                 text-left text-caption text-ink-muted hover:text-ink hover:bg-canvas-hover transition-colors"
                    >
                      <span aria-hidden className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                      <span className="flex-1 min-w-0 truncate">{event.title}</span>
                      {event.time && <span className="font-mono text-meta text-ink-subtle">{event.time}</span>}
                    </button>
                  </li>
                );
              })}
              {todayEvents.length > 2 && (
                <li className="font-mono text-meta text-ink-subtle pt-0.5">+{todayEvents.length - 2} flere</li>
              )}
            </ul>
          )}
        </div>

        {/* Månedsnavigasjon */}
        <div className="flex-shrink-0 flex items-center justify-between px-2 py-2 border-b border-rule">
          <button onClick={prevMonth} aria-label="Forrige måned"
            className="tap-auto w-9 h-9 flex items-center justify-center rounded-ctl
                       text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors">
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <span className="text-body font-bold text-ink">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} aria-label="Neste måned"
            className="tap-auto w-9 h-9 flex items-center justify-center rounded-ctl
                       text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors">
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Ukedager */}
        <div className="grid grid-cols-7 px-2 pt-2 flex-shrink-0">
          {DAYS.map(d => (
            <div key={d} className="text-center font-mono text-meta uppercase tracking-[0.06em] text-ink-faint py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Rutenett – faste dagshøyder, maks to prikker per dag */}
        <div className="grid grid-cols-7 gap-px px-2 pb-2 flex-1 overflow-y-auto content-start">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} className="h-[54px]" />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const iso     = isoDate(day);
            const dayEvts = eventsOnDate(iso);
            const isToday = iso === todayStr;
            const isSel   = selectedDate === iso;
            const extra   = dayEvts.length - 2;
            return (
              <button key={day}
                onClick={() => { setSelectedDate(iso); setSelectedEvent(null); }}
                aria-label={`${day}. ${MONTHS[month]}${dayEvts.length ? `, ${dayEvts.length} hendelser` : ''}`}
                aria-pressed={isSel}
                className={`tap-auto h-[54px] flex flex-col items-center justify-start pt-1.5 gap-1
                            rounded-ctl transition-colors
                            ${isSel ? 'bg-canvas-raised shadow-hair-strong' : 'hover:bg-canvas-hover'}`}>
                <span className={`font-mono text-caption w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-signal text-signal-fg font-bold'
                    : isSel ? 'text-ink' : 'text-ink-muted'}`}>
                  {day}
                </span>
                <span className="flex items-center gap-0.5 h-3">
                  {dayEvts.slice(0, 2).map(e => (
                    <span key={e.id} aria-hidden
                      className={`w-1.5 h-1.5 rounded-full ${(EVENT_META[e.type] ?? EVENT_META.training).dot}`} />
                  ))}
                  {extra > 0 && (
                    <span className="font-mono text-[9px] leading-none text-ink-subtle">+{extra}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Handlinger */}
        <div className="flex-shrink-0 border-t border-rule p-3 space-y-2">
          <button onClick={() => { setShowNewEvent(true); setShowAutoGen(false); }}
            className="w-full min-h-[44px] rounded-ctl bg-signal text-signal-fg text-body font-bold
                       hover:brightness-110 transition-all flex items-center justify-center gap-1.5">
            <Plus size={15} strokeWidth={2} aria-hidden /> Nytt arrangement
          </button>
          <button onClick={() => { setShowAutoGen(true); setShowNewEvent(false); }}
            className="w-full min-h-[44px] rounded-ctl bg-canvas-raised text-ink-muted hover:text-ink
                       text-body font-bold shadow-hair transition-colors flex items-center justify-center gap-1.5">
            <Sparkle size={15} strokeWidth={1.75} aria-hidden /> Autogenerer treningsplan
          </button>
        </div>
      </div>

      {/* ── Detaljpanel ── */}
      <div className={`
        ${!showCalendar ? 'flex' : 'hidden lg:flex'}
        flex-1 flex-col overflow-hidden h-full
      `}>
        <button onClick={closeDetailPanel}
          className="lg:hidden flex-shrink-0 flex items-center gap-1 px-4 min-h-[44px]
            border-b border-rule text-body text-ink-muted hover:text-ink transition-colors">
          <ChevronLeft size={15} strokeWidth={1.75} aria-hidden /> Tilbake til kalender
        </button>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {!openEvent && selectedDate && (
            <div>
              <h2 className="font-serif text-title text-ink">{formatDayTitle(selectedDate)}</h2>
              <p className="text-meta text-ink-subtle mt-1 mb-4">{formatDateLong(selectedDate)}</p>

              {evtsSelected.length === 0 ? (
                <p className="text-body text-ink-subtle">Ingen arrangementer denne dagen.</p>
              ) : (
                <div>
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

          {openEvent && (
            <EventDetail
              event={openEvent}
              onBack={() => setSelectedEvent(null)}
              onUpdate={(f) => updateEvent(openEvent.id, f)}
              onGoToTraining={onGoToTraining}
            />
          )}

          {!openEvent && !selectedDate && (
            <div>
              <h2 className="font-serif text-title text-ink mb-4">Kommende</h2>
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
                <div className="flex flex-col items-center text-center py-16">
                  <CalendarDays size={26} strokeWidth={1.5} aria-hidden className="text-ink-faint mb-3" />
                  <p className="text-body text-ink-subtle mb-4">Ingen kommende arrangementer.</p>
                  <button onClick={() => setShowAutoGen(true)}
                    className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-ctl
                               bg-canvas-raised text-ink-muted hover:text-ink text-body font-bold
                               shadow-hair transition-colors">
                    <Sparkle size={15} strokeWidth={1.75} aria-hidden /> Autogenerer treningsplan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Skjemaene ligger i Modal over begge kolonnene ── */}
      {showAutoGen && (
        <AutoGenForm
          ageGroup={ageGroup}
          onGenerate={(evs) => { evs.forEach(e => addEvent(e)); setShowAutoGen(false); }}
          onCancel={() => setShowAutoGen(false)}
        />
      )}

      {showNewEvent && (
        <NewEventForm
          date={selectedDate ?? todayStr}
          ageGroup={ageGroup}
          onSave={(ev) => { addEvent(ev); setShowNewEvent(false); }}
          onCancel={() => setShowNewEvent(false)}
        />
      )}
    </div>
  );
};
