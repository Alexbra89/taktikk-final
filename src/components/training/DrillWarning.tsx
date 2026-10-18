'use client';
import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Gul advarselsboks for øvelser med `warning`. Brukes av NewTrainingForm og TrainingDetail.

/** Gul advarselsboks for øvelser med `warning`. */
export const DrillWarning: React.FC<{ text: string; compact?: boolean }> = ({ text, compact }) => (
  <div className={`flex gap-2 bg-warn-500/10 border border-warn-500/40 rounded-ctl ${compact ? 'p-2' : 'p-2.5 sm:p-3'}`}>
    <AlertTriangle size={14} strokeWidth={1.75} aria-hidden className="text-warn-400 flex-shrink-0 mt-0.5" />
    <p className="text-meta text-ink-muted leading-relaxed">{text}</p>
  </div>
);
