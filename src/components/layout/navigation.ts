import {
  LayoutDashboard, Clipboard, Dumbbell, CalendarDays, BookOpen, BarChart3,
  Sparkles, Settings, type LucideIcon,
} from 'lucide-react';
import type { AppView } from '@/types';

// ═══════════════════════════════════════════════════════════════
//  NAVIGASJON – ett sted for alle hovedområdene.
//  Sidefeltet (desktop/nettbrett) og bunnmenyen (mobil) leser herfra.
//  AI-treneren er ikke en egen visning: den åpnes som et panel over
//  visningen du står i, så den senere kan se det du jobber med.
// ═══════════════════════════════════════════════════════════════

export type NavTarget = AppView | 'ai';

export interface NavItem {
  target: NavTarget;
  label: string;
  /** Én linje, brukt i «Mer»-arket på mobil. */
  hint: string;
  icon: LucideIcon;
  /** Ikonflate med områdefarge. Hele klassenavn, så Tailwind finner dem. */
  tile: string;
}

export const NAV: Record<NavTarget, NavItem> = {
  dashboard: { target: 'dashboard', label: 'Oversikt',      hint: 'Uka di på ett sted',            icon: LayoutDashboard, tile: 'bg-signal/15 text-signal' },
  board:     { target: 'board',     label: 'Taktikk',       hint: 'Brett, faser og eksport',       icon: Clipboard,       tile: 'bg-area-board/15 text-area-board' },
  training:  { target: 'training',  label: 'Trening',       hint: 'Økter, innhold og fremmøte',    icon: Dumbbell,        tile: 'bg-area-training/15 text-area-training' },
  calendar:  { target: 'calendar',  label: 'Kalender',      hint: 'Treninger og kamper',           icon: CalendarDays,    tile: 'bg-area-calendar/15 text-area-calendar' },
  drills:    { target: 'drills',    label: 'Øvelser',       hint: 'Bibliotek med øvelser',         icon: BookOpen,        tile: 'bg-area-drills/15 text-area-drills' },
  reports:   { target: 'reports',   label: 'Rapporter',     hint: 'Kamprapporter og historikk',    icon: BarChart3,       tile: 'bg-area-reports/15 text-area-reports' },
  ai:        { target: 'ai',        label: 'AI-trener',     hint: 'Analyse og forslag fra brettet', icon: Sparkles,       tile: 'bg-area-ai/15 text-area-ai' },
  settings:  { target: 'settings',  label: 'Innstillinger', hint: 'Lag, tema og backup',           icon: Settings,        tile: 'bg-canvas-raised text-ink-muted' },
};

/** Grupperingen i sidefeltet. */
export const NAV_GROUPS: { title: string; items: NavTarget[] }[] = [
  { title: 'Oversikt',  items: ['dashboard'] },
  { title: 'Arbeid',    items: ['board', 'training', 'calendar', 'drills', 'reports'] },
  { title: 'Assistent', items: ['ai'] },
];

/** Bunnmenyen på mobil: de fire mest brukte, resten ligger under «Mer». */
export const MOBILE_TABS: AppView[] = ['dashboard', 'board', 'training', 'calendar'];
export const MOBILE_MORE: NavTarget[] = ['drills', 'reports', 'ai', 'settings'];

export const VALID_VIEWS: AppView[] = ['dashboard', 'board', 'training', 'calendar', 'drills', 'reports', 'settings'];
