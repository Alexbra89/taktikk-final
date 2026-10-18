'use client';
import { localDateOffset } from '@/lib/dates';
import React from 'react';
import { Timer, ClipboardList, BookOpen } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { totalMinutes } from '@/lib/trainingSession';
import { StatTile } from '@/components/layout/Surface';
import { NAV } from '@/components/layout/navigation';

// ═══ OVERSIKT ØVERST I LISTA ══════════════════════════════════════
// Leser bare eksisterende treninger: varighet fra punktene, tema fra fokus.
export const TrainingOverview: React.FC<{ trainings: CalendarEvent[]; today: string }> = ({ trainings, today }) => {
  const referenceDate = new Date(today + 'T12:00:00');
  const weekEnd = localDateOffset(7, referenceDate);
  const historyStart = localDateOffset(-28, referenceDate);
  const upcoming = trainings.filter(e => e.date >= today);
  const next = upcoming[0];
  const in7 = upcoming.filter(e => e.date <= weekEnd);
  const past28 = trainings.filter(e => e.date < today && e.date >= historyStart);

  // Fokus teller én gang per trening, ikke per punkt.
  const focusCount = new Map<string, number>();
  upcoming.forEach(ev => {
    new Set(ev.trainingNotes.flatMap(n => n.focus)).forEach(f => focusCount.set(f, (focusCount.get(f) ?? 0) + 1));
  });
  const topFocus = [...focusCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => f);

  const nextDate = next ? new Date(next.date + 'T12:00:00') : null;
  const nextLabel = nextDate ? nextDate.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) : '–';
  const nextDay = nextDate ? nextDate.toLocaleDateString('nb-NO', { weekday: 'short' }) : '';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
      <StatTile icon={NAV.training.icon} tone={NAV.training.tile} label="Neste økt"
        value={<span className="text-[1.25rem]">{nextLabel}</span>}
        hint={next ? `${nextDay}${next.time ? ` ${next.time}` : ''} · ${totalMinutes(next.trainingNotes)} min` : 'Ingen planlagt'} />
      <StatTile icon={Timer} label="Neste 7 dager"
        value={in7.length}
        hint={`${in7.reduce((m, e) => m + totalMinutes(e.trainingNotes), 0)} min totalt`} />
      <StatTile icon={ClipboardList} label="Siste 4 uker"
        value={past28.length}
        hint={`${past28.reduce((m, e) => m + totalMinutes(e.trainingNotes), 0)} min gjennomført`} />
      <StatTile icon={BookOpen} label="Tema fremover"
        value={<span className="text-[1.25rem]">{topFocus.length}</span>}
        hint={topFocus.length ? topFocus.join(', ') : 'Ingen fokus satt'} />
    </div>
  );
};
