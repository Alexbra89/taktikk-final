'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, StopCircle } from 'lucide-react';

// ═══ STOPPEKLOKKE (RESPONSIV OPPDATERT) ═══════════════════════
// Teller ned varigheten til en øvelse, med pause og avbryt.

export const Stopwatch: React.FC<{
  duration: number;
  onComplete: () => void;
  onCancel: () => void;
}> = ({ duration, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState((duration || 5) * 60);
  const isActive = useRef(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive.current && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive.current) {
      isActive.current = false;
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isPaused, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="bg-canvas-sunken rounded-panel p-3 sm:p-4 border border-rule">
      <div className="text-center">
        <div className="text-[2.25rem] font-mono font-bold text-ink mb-2">{formatTime(timeLeft)}</div>
        <div className="w-full bg-canvas-raised rounded-full h-2 mb-4">
          <div className="bg-signal h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-2 justify-center">
          <button onClick={() => setIsPaused(!isPaused)}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2 rounded-ctl bg-signal/10 border border-signal/40 text-signal text-body font-semibold min-h-[44px]">
            {isPaused
              ? <><Play size={14} strokeWidth={2} fill="currentColor" aria-hidden /> Fortsett</>
              : <><Pause size={14} strokeWidth={2} fill="currentColor" aria-hidden /> Pause</>}
          </button>
          <button onClick={onCancel}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2 rounded-ctl bg-bad-500/15 border border-bad-500/40 text-bad-400 text-body font-semibold min-h-[44px]">
            <StopCircle size={14} strokeWidth={1.75} aria-hidden /> Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};
