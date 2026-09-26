'use client';
import React from 'react';
import { Timer, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TacticTabs } from '@/components/ui/TacticTabs';
import { IconTile } from '@/components/layout/Surface';
import { NAV } from '@/components/layout/navigation';

// ═══════════════════════════════════════════════════════════════
//  TAKTIKK-TOPP – én kompakt linje over brettet (nettbrett/desktop).
//  Taktikkfanene lå før i sidefeltet. Under 768px viser brettet
//  sine egne faner (TacticBoard, isMobile), så de skjules her.
// ═══════════════════════════════════════════════════════════════

const toolBtn =
  'tap-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-ctl text-caption font-semibold transition-colors';

export const TacticsHeader: React.FC<{
  aiOpen: boolean;
  onToggleAi: () => void;
  onOpenSmartCoach: () => void;
}> = ({ aiOpen, onToggleAi, onOpenSmartCoach }) => (
  <header className="hidden sm:flex flex-shrink-0 items-center gap-3 px-3 lg:px-4 h-14 border-b border-rule bg-canvas">
    <IconTile icon={NAV.board.icon} tone={NAV.board.tile} />
    <h1 className="text-h3 text-ink flex-shrink-0">Taktikk</h1>
    <div aria-hidden className="hidden md:block w-px h-6 bg-rule flex-shrink-0" />
    <div className="hidden md:block flex-1 min-w-0">
      <TacticTabs />
    </div>
    <div className="flex-1 md:hidden" />
    <div className="flex-shrink-0 flex items-center gap-1.5">
      <button onClick={onOpenSmartCoach} title="Kampklokke og ukens øvelser"
        className={cn(toolBtn, 'text-ink-muted hover:text-ink hover:bg-canvas-hover')}>
        <Timer size={15} strokeWidth={1.8} aria-hidden /> <span className="hidden xl:inline">Kampklokke</span>
      </button>
      <button onClick={onToggleAi} aria-pressed={aiOpen}
        className={cn(toolBtn, aiOpen
          ? 'bg-area-ai/20 text-area-ai shadow-[inset_0_0_0_1px_rgb(var(--k-area-ai)/0.45)]'
          : 'bg-area-ai/10 text-area-ai hover:bg-area-ai/20')}>
        <Sparkles size={15} strokeWidth={1.9} aria-hidden /> AI-trener
      </button>
    </div>
  </header>
);
