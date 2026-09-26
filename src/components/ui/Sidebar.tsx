'use client';
import React from 'react';
import { Sun, Moon, Timer } from 'lucide-react';
import type { AppView } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { NAV, NAV_GROUPS, type NavTarget } from '@/components/layout/navigation';
import { BrandMark } from '@/components/layout/Surface';

// ═══════════════════════════════════════════════════════════════
//  SIDEFELT – hovednavigasjonen på nettbrett og desktop.
//  ≥1024px: fullt sidefelt med etiketter og grupper.
//  640–1023px: smal ikonskinne, så brettet får plassen på nettbrett.
//  Mobil (<640px) bruker MobileNav med de samme menypunktene.
//  Taktikklista som lå her før, ligger nå i toppen av Taktikk-visningen.
// ═══════════════════════════════════════════════════════════════

const NavButton: React.FC<{
  target: NavTarget;
  active: boolean;
  onClick: () => void;
}> = ({ target, active, onClick }) => {
  const { icon: Icon, label, tile } = NAV[target];
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-pressed={target === 'ai' ? active : undefined}
      title={label}
      className={cn(
        'group relative w-full flex items-center gap-3 rounded-panel transition-colors',
        'justify-center lg:justify-start min-h-[44px] lg:min-h-[40px] px-0 lg:px-2',
        'focus-visible:outline-none focus-visible:shadow-hair-signal',
        active ? 'bg-canvas-raised text-ink shadow-hair' : 'text-ink-muted hover:text-ink hover:bg-canvas-hover',
      )}
    >
      {active && <span aria-hidden className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-signal" />}
      <span
        aria-hidden
        className={cn(
          'w-8 h-8 flex-shrink-0 inline-flex items-center justify-center rounded-ctl transition-colors',
          active ? tile : 'text-ink-subtle group-hover:text-ink',
        )}
      >
        <Icon size={17} strokeWidth={1.85} />
      </span>
      <span className="hidden lg:inline text-body font-semibold truncate">{label}</span>
    </button>
  );
};

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  teamName: string;
  aiOpen: boolean;
  onToggleAi: () => void;
  onOpenSmartCoach: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView, onNavigate, teamName, aiOpen, onToggleAi, onOpenSmartCoach,
}) => {
  const { theme, setTheme } = useTheme();

  const isActive = (t: NavTarget) => (t === 'ai' ? aiOpen : currentView === t);
  const go = (t: NavTarget) => (t === 'ai' ? onToggleAi() : onNavigate(t));

  return (
    <aside
      aria-label="Sidefelt"
      className="flex-shrink-0 w-[72px] lg:w-64 h-full flex flex-col bg-canvas-sunken border-r border-rule"
    >
      {/* Merke og lagnavn */}
      <button
        onClick={() => onNavigate('dashboard')}
        title="Til oversikten"
        className="tap-auto flex-shrink-0 flex items-center gap-3 justify-center lg:justify-start px-3 lg:px-4 pt-5 pb-5 text-left"
      >
        <BrandMark />
        <span className="hidden lg:block min-w-0">
          <span className="block text-h4 text-ink truncate">{teamName || 'Mitt lag'}</span>
          <span className="block font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">Taktikkboard</span>
        </span>
      </button>

      <nav aria-label="Hovedmeny" className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 pb-4">
        {NAV_GROUPS.map((g, gi) => (
          <div key={g.title} className={cn(gi > 0 && 'mt-5')}>
            <div className="hidden lg:block px-2 pb-1.5 font-mono text-meta uppercase tracking-[0.08em] text-ink-faint">
              {g.title}
            </div>
            {gi > 0 && <div aria-hidden className="lg:hidden mx-3 mb-3 h-px bg-rule" />}
            <div className="flex flex-col gap-1">
              {g.items.map(t => (
                <NavButton key={t} target={t} active={isActive(t)} onClick={() => go(t)} />
              ))}
              {g.title === 'Assistent' && (
                <button
                  onClick={onOpenSmartCoach}
                  title="Kampklokke og ukens øvelser"
                  className="group w-full flex items-center gap-3 justify-center lg:justify-start min-h-[44px] lg:min-h-[40px] px-0 lg:px-2 rounded-panel text-ink-muted hover:text-ink hover:bg-canvas-hover transition-colors"
                >
                  <span aria-hidden className="w-8 h-8 flex-shrink-0 inline-flex items-center justify-center rounded-ctl text-ink-subtle group-hover:text-ink">
                    <Timer size={17} strokeWidth={1.85} />
                  </span>
                  <span className="hidden lg:inline text-body font-semibold truncate">Kampklokke</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Innstillinger og tema */}
      <div className="flex-shrink-0 border-t border-rule p-3 flex flex-col gap-2">
        <NavButton target="settings" active={currentView === 'settings'} onClick={() => onNavigate('settings')} />

        <div role="radiogroup" aria-label="Tema" className="hidden lg:flex p-0.5 rounded-ctl bg-canvas-raised shadow-hair">
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
                'flex-1 flex items-center justify-center gap-1.5 min-h-[30px] rounded-[6px] text-caption transition-colors',
                theme === v ? 'bg-canvas-panel text-ink shadow-hair-strong' : 'text-ink-subtle hover:text-ink',
              )}
            >
              <Icon size={13} strokeWidth={1.75} /> {label}
            </button>
          ))}
        </div>
        {/* Skinnen har ikke plass til segmentet – én knapp bytter tema. */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={theme === 'light' ? 'Bytt til kveld' : 'Bytt til dagslys'}
          title={theme === 'light' ? 'Bytt til kveld' : 'Bytt til dagslys'}
          className="lg:hidden tap-auto mx-auto w-10 h-10 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors"
        >
          {theme === 'light' ? <Moon size={16} strokeWidth={1.75} /> : <Sun size={16} strokeWidth={1.75} />}
        </button>
      </div>
    </aside>
  );
};
