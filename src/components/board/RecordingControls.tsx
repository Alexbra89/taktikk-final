'use client';
import React from 'react';

/** Kept outside the SVG/WebGL renderers, so controls never enter the video. */
export function RecordingControls({ busy, seconds, disabled, onStart, onStop, onCancel }: {
  busy: boolean; seconds: number; disabled?: boolean;
  onStart: () => void; onStop: () => void; onCancel: () => void;
}) {
  const button = 'shrink-0 min-h-[40px] px-3 rounded-ctl text-caption font-semibold shadow-hair focus-ring active:scale-[0.97] disabled:opacity-40';
  return <div role="group" aria-label="Videoopptak" className="sticky left-0 z-10 flex shrink-0 items-center gap-2 rounded-ctl bg-canvas-panel px-1">
    {busy ? <>
      <span role="status" aria-label="Opptak pågår" className="inline-flex items-center gap-1.5 whitespace-nowrap text-caption tabular-nums">
        <span aria-hidden className="h-2 w-2 rounded-full bg-red-500" />
        {Math.floor(seconds / 60)}:{String(Math.floor(seconds % 60)).padStart(2, '0')}
      </span>
      <button type="button" className={button} onClick={onStop}>Stopp opptak</button>
      <button type="button" className={button} onClick={onCancel}>Avbryt</button>
    </> : <button type="button" className={`${button} bg-signal text-signal-fg`} disabled={disabled} onClick={onStart}>Ta opp</button>}
  </div>;
}
