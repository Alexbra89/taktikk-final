'use client';
import React, { useState } from 'react';
import type { Tactic } from '@/types';
import { SPORT_LABELS } from '@/store/selectors';
import { TACTIC_DEFAULT_MIN } from '@/lib/trainingSession';

// ═══ TAKTIKKVELGER ══════════════════════════════════════════════
// Velg en av taktikkene på brettet og hvor lenge den skal trenes.

export const TacticPicker: React.FC<{
  tactics: Tactic[];
  onPick: (t: Tactic, minutes: number) => void;
  onCancel: () => void;
}> = ({ tactics, onPick, onCancel }) => {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [minutes, setMinutes]   = useState(TACTIC_DEFAULT_MIN);
  const picked = tactics.find(t => t.id === pickedId);
  const validMin = Number.isFinite(minutes) && minutes >= 1 && minutes <= 180;

  return (
    <div className="bg-canvas-sunken border border-dashed border-rule rounded-panel p-3 sm:p-4 mb-3">
      <div role="listbox" aria-label="Taktikker"
        className="bg-canvas-raised border border-rule rounded-panel max-h-48 overflow-y-auto mb-3">
        {tactics.map(t => (
          <button key={t.id} role="option" aria-selected={t.id === pickedId} onClick={() => setPickedId(t.id)}
            className={`w-full text-left px-3 py-2.5 border-b border-rule last:border-b-0 min-h-[44px] transition-colors
              ${t.id === pickedId ? 'bg-signal/10 text-signal' : 'text-ink-muted hover:bg-canvas-hover'}`}>
            <div className="text-body font-semibold">{t.name}</div>
            <div className="text-meta text-ink-subtle">
              {SPORT_LABELS[t.sport]} · {t.formation} · {t.phases.length === 1 ? '1 fase' : `${t.phases.length} faser`}
            </div>
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 mb-3 text-body text-ink-muted">
        Varighet
        <input type="number" inputMode="numeric" min={1} max={180} value={minutes}
          onChange={e => setMinutes(Math.round(Number(e.target.value)))}
          className="w-20 rounded-ctl bg-canvas-raised shadow-hair px-2 min-h-[40px] text-body text-ink text-right focus:outline-none focus:shadow-hair-signal" />
        min
      </label>
      <div className="flex gap-2">
        <button onClick={() => picked && validMin && onPick(picked, minutes)} disabled={!picked || !validMin}
          className="flex-1 py-2.5 rounded-ctl bg-signal/10 border border-signal/40 text-signal font-bold text-body hover:bg-signal/15 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed">
          Legg til
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-ctl border border-rule text-ink-subtle text-body min-h-[44px]">
          Avbryt
        </button>
      </div>
    </div>
  );
};
