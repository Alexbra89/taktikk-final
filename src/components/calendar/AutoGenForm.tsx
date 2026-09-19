'use client';
import React, { useState, useMemo } from 'react';
import type { CalendarEvent } from '@/types';
import { getDrillsByCategory } from '@/data/drills';
import { AUTOGEN_CATEGORIES, FOCUS_OPTIONS, CalStyle } from './shared';

// ═══ AUTOGENERER TRENINGSPLAN (RESPONSIV OPPDATERT) ═══════════════════════

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
        }] : [],
        matchNotes: [],
      });
    });

    onGenerate(events);
  }

  const sportEmoji = '⚽';
  const sportName  = 'Fotball';

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
