'use client';
import React from 'react';
import { MoreHorizontal, Sparkles, Timer, Sun, Moon, ChevronRight } from 'lucide-react';
import type { AppView } from '@/types';
import { Modal } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { NAV, MOBILE_TABS, MOBILE_MORE, type NavTarget } from './navigation';
import { BrandMark, IconTile } from './Surface';

// ═══════════════════════════════════════════════════════════════
//  MOBILNAVIGASJON – kompakt topplinje, bunnmeny og «Mer»-ark.
//  Bunnmenyen ligger under innholdet (ikke over), så den aldri
//  dekker brettet eller verktøylinjene. AI-treneren nås fra topplinja.
// ═══════════════════════════════════════════════════════════════

const headerBtn =
  'tap-auto w-10 h-10 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors';

export const MobileTopBar: React.FC<{
  currentView: AppView;
  teamName: string;
  onOpenAi: () => void;
  onOpenSmartCoach: () => void;
  onHome: () => void;
}> = ({ currentView, teamName, onOpenAi, onOpenSmartCoach, onHome }) => {
  const title = currentView === 'dashboard' ? (teamName || 'Taktikkboard') : NAV[currentView].label;
  return (
    <header
      className="flex-shrink-0 flex items-center gap-2 pl-3 pr-1.5 bg-canvas-sunken border-b border-rule z-40"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <button onClick={onHome} aria-label="Til oversikten" className="tap-auto flex items-center gap-2.5 min-w-0 flex-1 h-14 text-left">
        <BrandMark size={30} />
        <span className="min-w-0">
          <span className="block text-h4 text-ink truncate leading-tight">{title}</span>
          {currentView !== 'dashboard' && teamName && (
            <span className="block text-meta text-ink-subtle truncate leading-tight">{teamName}</span>
          )}
        </span>
      </button>
      {currentView === 'board' && (
        <button onClick={onOpenSmartCoach} aria-label="Kampklokke" className={headerBtn}>
          <Timer size={18} strokeWidth={1.75} />
        </button>
      )}
      <button
        onClick={onOpenAi}
        aria-label="AI-trener"
        className="tap-auto h-9 px-3 inline-flex items-center gap-1.5 rounded-pill bg-area-ai/15 text-area-ai text-caption font-bold hover:bg-area-ai/25 transition-colors"
      >
        <Sparkles size={15} strokeWidth={1.9} aria-hidden /> AI
      </button>
    </header>
  );
};

export const MobileTabBar: React.FC<{
  currentView: AppView;
  onNavigate: (v: AppView) => void;
  onOpenMore: () => void;
}> = ({ currentView, onNavigate, onOpenMore }) => {
  const moreActive = !MOBILE_TABS.includes(currentView);
  const tabClass = (active: boolean) => cn(
    'flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] relative transition-colors',
    active ? 'text-ink' : 'text-ink-subtle hover:text-ink-muted',
  );
  return (
    <nav
      aria-label="Hovedmeny"
      className="flex-shrink-0 flex bg-canvas-sunken border-t border-rule z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {MOBILE_TABS.map(v => {
        const { icon: Icon, label } = NAV[v];
        const active = currentView === v;
        return (
          <button key={v} onClick={() => onNavigate(v)} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
            {active && <span aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-signal" />}
            <Icon size={20} strokeWidth={active ? 2.1 : 1.75} />
            <span className="text-[10px] font-semibold leading-none">{label}</span>
          </button>
        );
      })}
      <button onClick={onOpenMore} aria-haspopup="dialog" aria-current={moreActive ? 'page' : undefined} className={tabClass(moreActive)}>
        {moreActive && <span aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-signal" />}
        <MoreHorizontal size={20} strokeWidth={moreActive ? 2.1 : 1.75} />
        <span className="text-[10px] font-semibold leading-none">Mer</span>
      </button>
    </nav>
  );
};

export const MoreSheet: React.FC<{
  currentView: AppView;
  onClose: () => void;
  onSelect: (t: NavTarget) => void;
  onOpenSmartCoach: () => void;
}> = ({ currentView, onClose, onSelect, onOpenSmartCoach }) => {
  const { theme, toggleTheme } = useTheme();
  const row = 'w-full flex items-center gap-3 px-2 min-h-[56px] rounded-panel text-left transition-colors hover:bg-canvas-hover';
  return (
    <Modal onClose={onClose} size="sm" title="Mer">
      <div className="flex flex-col gap-1 -mx-2">
        {MOBILE_MORE.map(t => {
          const item = NAV[t];
          const active = t === currentView;
          return (
            <button key={t} onClick={() => { onClose(); onSelect(t); }}
              aria-current={active ? 'page' : undefined}
              className={cn(row, active && 'bg-canvas-raised')}>
              <IconTile icon={item.icon} tone={item.tile} />
              <span className="flex-1 min-w-0">
                <span className="block text-body font-bold text-ink">{item.label}</span>
                <span className="block text-meta text-ink-subtle truncate">{item.hint}</span>
              </span>
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden className="text-ink-faint" />
            </button>
          );
        })}
        <button onClick={() => { onClose(); onOpenSmartCoach(); }} className={row}>
          <IconTile icon={Timer} tone="bg-canvas-raised text-ink-muted" />
          <span className="flex-1 min-w-0">
            <span className="block text-body font-bold text-ink">Kampklokke</span>
            <span className="block text-meta text-ink-subtle truncate">Klokke og ukens øvelser</span>
          </span>
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden className="text-ink-faint" />
        </button>
        <button onClick={toggleTheme} className={row}>
          <IconTile icon={theme === 'light' ? Moon : Sun} tone="bg-canvas-raised text-ink-muted" />
          <span className="flex-1 text-body font-bold text-ink">
            {theme === 'light' ? 'Bytt til kveld' : 'Bytt til dagslys'}
          </span>
        </button>
      </div>
    </Modal>
  );
};
