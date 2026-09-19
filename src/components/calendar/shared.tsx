'use client';
import React from 'react';
import type { CalendarEvent, EventType, DrillCategory } from '@/types';

// Felles for kalenderfilene: oppsett, visuell metadata og skjemastilene.
// Delt ut av CalendarView.tsx da den ble splittet opp.

export const DRILL_CATEGORIES: DrillCategory[] = ['keeper', 'forsvar', 'midtbane', 'angrep', 'cardio', 'styrke'];
// Autogenerert økt er for hele laget, så keeperøvelser tas ikke med i rotasjonen.
export const AUTOGEN_CATEGORIES: DrillCategory[] = ['forsvar', 'midtbane', 'angrep', 'cardio', 'styrke'];

export const MONTHS = ['Januar','Februar','Mars','April','Mai','Juni',
                'Juli','August','September','Oktober','November','Desember'];
export const DAYS   = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

// Visuell metadata per hendelsestype – felles kilde for ikon/farge.
export const EVENT_META: Record<EventType, { icon: string; label: string; dot: string; text: string; bg: string; border: string }> = {
  match:    { icon: '⚽', label: 'Kamp',       dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30' },
  training: { icon: '🏃', label: 'Trening',    dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
};

export function isEventOnDate(event: CalendarEvent, date: string): boolean {
  return event.date === date;
}

export const FOCUS_OPTIONS = [
  'Pasningsspill','Pressing','Forsvarsstilling','Avslutning','Kontrapress',
  'Innlegg','Dødball','Keepertrening','Kondisjon','Styrke','Taktikk','Individuell teknikk',
];

// ═══ STYLES (URØRT) ═══════════════════════════════════════════

export const CalStyle = () => (
  <style>{`
    .inp-cal { width:100%; background:#111c30; border:1px solid #1e3050;
      border-radius:8px; padding:10px 12px; color:#e2e8f0; font-size:12.5px;
      margin-top:4px; box-sizing:border-box; min-height:44px; }
    .inp-cal:focus { outline:none; border-color:#38bdf8; }
    .label-cal { font-size:9.5px; font-weight:700; color:#3a5070;
      text-transform:uppercase; letter-spacing:0.08em; display:block; }
  `}</style>
);
