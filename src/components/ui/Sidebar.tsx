'use client';
import React from 'react';
import {
  Clipboard, BookOpen, CalendarDays, Dumbbell,
  Lightbulb, BarChart3, Settings, Sun, Moon, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { AppView } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { TacticTabs } from './TacticTabs';

// ═══════════════════════════════════════════════════════════════
//  SIDEFELT (desktop) – Kalk-layouten.
//  Lagnavn øverst, hovednavigasjon, taktikkene til brettet,
//  og verktøy + tema + innstillinger nederst.
//  Mobil beholder egen navigasjon i page.tsx, men deler NAV_ITEMS.
// ═══════════════════════════════════════════════════════════════

export const NAV_ITEMS: { view: AppView; label: string; icon: LucideIcon }[] = [
  { view: 'board',    label: 'Brett',    icon: Clipboard },
  { view: 'drills',   label: 'Øvelser',  icon: BookOpen },
  { view: 'calendar', label: 'Kalender', icon: CalendarDays },
  { view: 'training', label: 'Trening',  icon: Dumbbell },
];

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pb-1.5 font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">{children}</div>
);

const RowButton: React.FC<{
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={cn(
      'tap-auto relative w-full flex items-center gap-2.5 px-3 min-h-[36px] rounded-ctl text-body transition-colors focus-visible:outline-none focus-visible:shadow-hair-signal',
      active ? 'bg-canvas-raised text-ink' : 'text-ink-muted hover:text-ink hover:bg-canvas-hover',
    )}
  >
    {active && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-signal" />}
    <Icon size={16} strokeWidth={1.75} className={active ? 'text-ink' : 'text-ink-subtle'} />
    <span className="truncate">{label}</span>
  </button>
);

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  teamName: string;
  onOpenSmartCoach: () => void;
  onOpenAiCoach: () => void;
  onOpenReport: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView, onNavigate, teamName, onOpenSmartCoach, onOpenAiCoach, onOpenReport, onOpenSettings,
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="flex-shrink-0 w-60 h-full flex flex-col bg-canvas-sunken border-r border-rule">
      {/* Lagnavn */}
      <button
        onClick={() => onNavigate('board')}
        className="tap-auto flex-shrink-0 text-left px-5 pt-5 pb-4"
        title="Til brettet"
      >
        <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">Taktikkboard</div>
        <div className="font-serif text-[1.75rem] leading-tight text-ink truncate">
          {teamName || 'Mitt lag'}
        </div>
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4">
        <nav aria-label="Hovedmeny" className="flex flex-col gap-px">
          {NAV_ITEMS.map(n => (
            <RowButton
              key={n.view}
              icon={n.icon}
              label={n.label}
              active={currentView === n.view}
              onClick={() => onNavigate(n.view)}
            />
          ))}
        </nav>

        <div className="mt-6">
          <SectionTitle>Taktikker</SectionTitle>
          <TacticTabs variant="list" onActivate={() => onNavigate('board')} />
        </div>

        {currentView === 'board' && (
          <div className="mt-6">
            <SectionTitle>Verktøy</SectionTitle>
            <div className="flex flex-col gap-px">
              <RowButton icon={Sparkles} label="AI-trener" onClick={onOpenAiCoach} />
              <RowButton icon={Lightbulb} label="Smart Coach" onClick={onOpenSmartCoach} />
              <RowButton icon={BarChart3} label="Kamprapport" onClick={onOpenReport} />
            </div>
          </div>
        )}
      </div>

      {/* Tema og innstillinger */}
      <div className="flex-shrink-0 border-t border-rule p-2 flex items-center gap-1">
        <div role="radiogroup" aria-label="Tema" className="flex-1 flex p-0.5 rounded-ctl bg-canvas-raised shadow-hair">
          {([
            { v: 'dark',  label: 'Kveld',   icon: Moon },
            { v: 'light', label: 'Dagslys', icon: Sun },
          ] as const).map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              role="radio"
              aria-checked={theme === v}
              onClick={() => setTheme(v)}
              className={cn(
                'tap-auto flex-1 flex items-center justify-center gap-1.5 min-h-[30px] rounded-[5px] text-caption transition-colors',
                theme === v ? 'bg-canvas-panel text-ink shadow-hair-strong' : 'text-ink-subtle hover:text-ink',
              )}
            >
              <Icon size={13} strokeWidth={1.75} /> {label}
            </button>
          ))}
        </div>
        <button
          onClick={onOpenSettings}
          aria-label="Innstillinger"
          title="Innstillinger"
          className="tap-auto w-9 h-9 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors"
        >
          <Settings size={16} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
};
