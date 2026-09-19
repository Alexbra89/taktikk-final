'use client';
import React, { useState, useMemo } from 'react';
import type { CalendarEvent } from '@/types';
import { getDrillsByCategory } from '@/data/drills';
import { Modal } from '@/components/ui';
import {
  AUTOGEN_CATEGORIES, FOCUS_OPTIONS, INPUT_CLASS, LABEL_CLASS, toggleClass, formatDateShort,
} from './shared';

// ═══ AUTOGENERER TRENINGSPLAN – i Modal, som Nytt arrangement ═══

export const AutoGenForm: React.FC<{
  ageGroup: 'youth' | 'adult';
  onGenerate: (evs: Omit<CalendarEvent, 'id'>[]) => void;
  onCancel: () => void;
}> = ({ ageGroup, onGenerate, onCancel }) => {
  const today = new Date();
  const [weeks, setWeeks]         = useState(4);
  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [time, setTime]           = useState('18:00');
  const [location, setLocation]   = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]);
  const [focusTags, setFocusTags] = useState<string[]>([]);

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
    // Roter mellom kategoriene (ikke gjennom ALL_DRILLS i rekkefølge, da ville
    // de første øktene bare vært én kategori), og gå videre i hver kategori.
    const pools = AUTOGEN_CATEGORIES
      .map(cat => getDrillsByCategory(cat).filter(d => d.ageGroup === ageGroup))
      .filter(pool => pool.length > 0);
    const events: Omit<CalendarEvent, 'id'>[] = [];

    previewDates.forEach((date, idx) => {
      const pool = pools.length > 0 ? pools[idx % pools.length] : undefined;
      const drill = pool ? pool[Math.floor(idx / pools.length) % pool.length] : undefined;
      const focusLine = focusTags.length > 0 ? `\nFokus: ${focusTags.join(', ')}` : '';
      const drillDesc = drill
        ? `\n\nØvelse: ${drill.name}\n${drill.description}`
        : '';

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
        }] : [],
        matchNotes: [],
      });
    });

    onGenerate(events);
  }

  return (
    <Modal
      onClose={onCancel}
      title="Autogenerer treningsplan"
      subtitle={
        <p className="text-meta text-ink-subtle">
          Fotball · {ageGroup === 'youth' ? 'Barneøvelser' : 'Voksenøvelser'}
        </p>
      }
      size="md"
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={generate} disabled={selectedDays.length === 0}
            className="flex-1 min-h-[44px] rounded-ctl bg-signal text-signal-fg text-body font-bold
                       hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Generer {previewDates.length} treningsøkter
          </button>
          <button onClick={onCancel}
            className="px-4 min-h-[44px] rounded-ctl text-body font-bold text-ink-muted
                       hover:text-ink shadow-hair transition-colors">
            Avbryt
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className={LABEL_CLASS}>Startdato</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Treningstid</span>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Sted</span>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Stadion / hall" className={INPUT_CLASS} />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Antall uker</span>
          <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className={INPUT_CLASS}>
            {[2, 3, 4, 6, 8, 12].map(w => <option key={w} value={w}>{w} uker</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <span className={LABEL_CLASS}>Treningsdager per uke</span>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {WEEKDAYS.map((d, i) => (
            <button key={i} onClick={() => toggleDay(i)}
              aria-pressed={selectedDays.includes(i)}
              className={`w-11 h-11 rounded-ctl text-meta font-bold transition-colors
                ${toggleClass(selectedDays.includes(i))}`}>
              {d}
            </button>
          ))}
        </div>
        <p className="font-mono text-meta text-ink-subtle mt-2">
          {selectedDays.length} dager valgt → {selectedDays.length * weeks} treningsøkter totalt
        </p>
      </div>

      <div className="mt-4">
        <span className={LABEL_CLASS}>Fokusområder (valgfritt)</span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {FOCUS_OPTIONS.map(f => (
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
      </div>

      {previewDates.length > 0 && (
        <div className="mt-4 rounded-panel bg-canvas-sunken shadow-hair p-3">
          <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-2">
            Forhåndsvisning — {previewDates.length} økter
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
            {previewDates.map(d => (
              <div key={d} className="rounded-ctl bg-canvas-raised px-2 py-1.5 min-h-[32px] flex items-center
                                      font-mono text-meta text-ink-muted shadow-hair">
                {formatDateShort(d)}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
