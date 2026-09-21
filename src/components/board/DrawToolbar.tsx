'use client';
import React from 'react';
import { Delete, Eraser } from 'lucide-react';
import type { DrawingType } from '../../types';
import { DRAW_COLORS, DRAW_TOOLS } from './drawTools';
import { cn } from '../../lib/cn';

// ══════════════════════════════════════════════════════════════
//  TEGNERAD – vises over verktøylinja mens tegnemodus er på.
//  Brukes likt i vanlig brett og fullskjerm. Brytes til to linjer
//  på smal skjerm; i stående format har banen høyde nok til overs.
// ══════════════════════════════════════════════════════════════

// Ikonene viser figuren verktøyet faktisk lager, i stedet for å låne
// lucide-ikoner som betyr noe annet ellers i appen (angre, gjør om).
const ICON_PROPS = {
  width: 18, height: 18, viewBox: '0 0 16 16', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
} as const;

const TOOL_ICONS: Record<DrawingType, React.ReactNode> = {
  freehand:       <path d="M2 11c1.5-3 3-5.5 5-3s3.5 1 7-4" />,
  arrow:          <><path d="M3 13 13 3" /><path d="M7.5 3H13v5.5" /></>,
  'curved-arrow': <><path d="M2.5 13C2.5 6 6 3.5 12.5 3.5" /><path d="M9.5 1 12.5 3.5 9.5 6" /></>,
  dashed:         <path d="M2 8h12" strokeDasharray="2.6 2.2" />,
  circle:         <circle cx="8" cy="8" r="5.5" />,
  rectangle:      <rect x="2.5" y="4" width="11" height="8" rx="1" />,
  label:          <path d="M3.5 3.5h9M8 3.5V13" />,
};

const BTN = 'tap-auto w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover transition-colors disabled:opacity-30 disabled:hover:text-ink-subtle disabled:hover:bg-transparent';
const ACTIVE = 'bg-signal/10 text-signal shadow-hair-signal hover:text-signal hover:bg-signal/10';

interface DrawToolbarProps {
  tool: DrawingType;
  onTool: (t: DrawingType) => void;
  color: string;
  onColor: (c: string) => void;
  hasDrawings: boolean;
  onRemoveLast: () => void;
  onClearAll: () => void;
  /** Hvilken side kanten skal ligge på, f.eks. 'border-t'. */
  className?: string;
}

export const DrawToolbar: React.FC<DrawToolbarProps> = ({
  tool, onTool, color, onColor, hasDrawings, onRemoveLast, onClearAll, className,
}) => (
  <div role="toolbar" aria-label="Tegneverktøy"
    className={cn('flex flex-wrap items-center gap-x-1 gap-y-1 px-2 py-1.5 bg-canvas-sunken border-rule', className)}>

    <div className="flex items-center gap-0.5">
      {DRAW_TOOLS.map(t => (
        <button key={t.type} onClick={() => onTool(t.type)}
          aria-pressed={tool === t.type}
          aria-label={t.label} title={t.label}
          className={cn(BTN, tool === t.type && ACTIVE)}>
          <svg {...ICON_PROPS} aria-hidden>{TOOL_ICONS[t.type]}</svg>
        </button>
      ))}
    </div>

    <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-rule">
      {DRAW_COLORS.map(c => (
        <button key={c} onClick={() => onColor(c)}
          aria-label={`Tegnefarge ${c}`}
          aria-pressed={color === c}
          className={cn(
            'tap-auto w-6 h-6 flex-shrink-0 rounded-full transition-transform',
            color === c ? 'scale-110 shadow-hair-strong' : 'opacity-55',
          )}
          style={{ background: c }} />
      ))}
    </div>

    <div className="flex items-center gap-0.5 ml-auto">
      <button onClick={onRemoveLast} disabled={!hasDrawings}
        aria-label="Slett siste tegning" title="Slett siste tegning" className={BTN}>
        <Delete size={16} strokeWidth={1.75} />
      </button>
      <button onClick={onClearAll} disabled={!hasDrawings}
        aria-label="Slett alle tegningene" title="Slett alle tegningene" className={BTN}>
        <Eraser size={16} strokeWidth={1.75} />
      </button>
    </div>
  </div>
);
