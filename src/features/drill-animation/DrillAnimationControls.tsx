'use client';
import React from 'react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui/Button';

// Spill/pause, forrige/neste fase, faseprikker og fart. Ren visning:
// tilstanden ligger i DrillAnimationViewer.

export const SPEEDS = [0.5, 1, 1.5, 2];

interface Props {
  phaseNames: string[];
  shown: number;
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onSelect: (index: number) => void;
  onSpeed: (speed: number) => void;
  /** Under opptak i 2D: opptaket styrer avspillingen selv. */
  disabled?: boolean;
}

export const DrillAnimationControls: React.FC<Props> = ({
  phaseNames, shown, isPlaying, speed, onTogglePlay, onSelect, onSpeed, disabled = false,
}) => {
  const last = phaseNames.length - 1;
  return (
    <div role="group" aria-label="Avspilling" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <div className="flex items-center gap-1">
        <IconButton aria-label="Forrige fase" size="sm" disabled={disabled || shown === 0} onClick={() => onSelect(shown - 1)}>
          <SkipBack size={15} strokeWidth={1.75} />
        </IconButton>
        <button type="button" aria-label={isPlaying ? 'Pause' : 'Spill av'} onClick={onTogglePlay} disabled={disabled}
          className="tap-auto w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full bg-signal text-signal-fg hover:brightness-110 focus-ring disabled:opacity-40">
          {isPlaying
            ? <Pause size={17} strokeWidth={2} fill="currentColor" />
            : <Play size={17} strokeWidth={2} fill="currentColor" />}
        </button>
        <IconButton aria-label="Neste fase" size="sm" disabled={disabled || shown === last} onClick={() => onSelect(shown + 1)}>
          <SkipForward size={15} strokeWidth={1.75} />
        </IconButton>
      </div>

      <div role="group" aria-label="Faser" className="flex items-center">
        {phaseNames.map((name, index) => (
          <button key={index} type="button" aria-label={`Fase ${index + 1}: ${name}`} disabled={disabled}
            aria-current={index === shown ? 'step' : undefined} onClick={() => onSelect(index)}
            className="tap-auto h-8 w-7 flex items-center justify-center rounded-full focus-ring">
            <span aria-hidden className={cn('block rounded-full transition-colors',
              index === shown ? 'h-3 w-3 bg-signal' : 'h-2 w-2 bg-ink-faint')} />
          </button>
        ))}
      </div>

      {/* Klokka leser farten når den starter, så den byttes mellom avspillingene. */}
      <select aria-label="Fart" value={speed} disabled={disabled || isPlaying} onChange={e => onSpeed(Number(e.target.value))}
        className="min-h-[36px] rounded-ctl bg-canvas-raised px-2 font-mono text-caption text-ink shadow-hair focus-ring disabled:opacity-40">
        {SPEEDS.map(s => <option key={s} value={s}>{s}×</option>)}
      </select>
    </div>
  );
};
