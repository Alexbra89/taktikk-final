'use client';
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useActiveTactic } from '../../store/selectors';
import { cn } from '../../lib/cn';
import {
  DEFAULT_PHASE_MS, EASINGS, MAX_PHASE_MS, MIN_PHASE_MS, PHASE_PRESETS_MS, formatSeconds,
} from '../../lib/playback';

// ═══════════════════════════════════════════════════════════════
//  AVSPILLING – fart, bevegelse (easing), loop og varighet per overgang.
//
//  IKKE I BRUK (2026-09-22). Avspillingen er slått av i brukergrensesnittet:
//  brikke og ball hakket under animasjon hos brukeren (Windows + Edge), og
//  årsaken ble ikke funnet. Se «Avspilling slått av» i
//  docs/plan-taktikkbrett-5-funksjoner.md.
//
//  For å slå på igjen: vis denne seksjonen i BoardPanel, og legg ▶-knappen
//  tilbake i TacticBoard og FullscreenBoard. Motoren (usePhasePlayback),
//  datamodellen og lagringen står klar.
// ═══════════════════════════════════════════════════════════════

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-2">{children}</div>
);

const segClass = (active: boolean) => cn(
  'tap-auto min-h-[32px] px-2.5 rounded-ctl font-mono text-caption transition-colors whitespace-nowrap',
  active
    ? 'bg-signal/10 text-signal shadow-hair-signal'
    : 'bg-canvas-raised text-ink-muted hover:text-ink shadow-hair',
);

const SubLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-caption text-ink-muted mb-1.5">{children}</div>
);

// Én rad per overgang: standard, faste valg og et felt for egen verdi i sekunder.
const PhaseDurationRow: React.FC<{
  label: string;
  hint?: string;
  durationMs: number | undefined;
  onChange: (ms: number | undefined) => void;
}> = ({ label, hint, durationMs, onChange }) => {
  const isCustom = durationMs !== undefined && !PHASE_PRESETS_MS.includes(durationMs);
  const shown = isCustom ? String(durationMs / 1000).replace('.', ',') : '';
  const [draft, setDraft] = useState(shown);
  useEffect(() => { setDraft(shown); }, [shown]);

  const commit = () => {
    const sec = parseFloat(draft.replace(',', '.'));
    if (!draft.trim()) { setDraft(shown); return; }
    if (!Number.isFinite(sec)) { setDraft(shown); return; }
    onChange(Math.round(sec * 1000));
  };

  return (
    <li className="py-2">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="flex-1 min-w-0 truncate text-body text-ink">{label}</span>
        {hint && <span className="text-caption text-ink-subtle">{hint}</span>}
      </div>
      <div role="group" aria-label={`Varighet ${label}`} className="flex flex-wrap items-center gap-1.5">
        <button onClick={() => onChange(undefined)} aria-pressed={durationMs === undefined}
          title={`Standard: ${formatSeconds(DEFAULT_PHASE_MS)}`}
          className={segClass(durationMs === undefined)}>Std</button>
        {PHASE_PRESETS_MS.map(ms => (
          <button key={ms} onClick={() => onChange(ms)} aria-pressed={durationMs === ms}
            className={segClass(durationMs === ms)}>{ms / 1000} s</button>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          inputMode="decimal"
          placeholder="Egen"
          aria-label={`Egen varighet i sekunder, ${label}`}
          title={`Sekunder, ${formatSeconds(MIN_PHASE_MS)}–${formatSeconds(MAX_PHASE_MS)}`}
          className={cn(
            'w-16 min-h-[32px] px-2 rounded-ctl font-mono text-caption bg-canvas-raised text-ink placeholder-ink-faint focus:outline-none',
            isCustom ? 'shadow-hair-signal text-signal' : 'shadow-hair focus:shadow-hair-signal',
          )}
        />
      </div>
    </li>
  );
};

export const PlaybackSettings: React.FC<{
  playSpeed: number;
  setPlaySpeed: (v: number) => void;
}> = ({ playSpeed, setPlaySpeed }) => {
  const tactic           = useActiveTactic();
  const setPhaseDuration = useAppStore(s => s.setPhaseDuration);
  const setEasing        = useAppStore(s => s.setPlaybackEasing);
  const setLoop          = useAppStore(s => s.setPlaybackLoop);

  return (
    <section>
      <SectionTitle>Avspilling</SectionTitle>

      <SubLabel>Fart</SubLabel>
      <div role="group" aria-label="Avspillingsfart" className="flex gap-1.5">
        {[0.5, 1, 1.5, 2].map(v => (
          <button
            key={v}
            onClick={() => setPlaySpeed(v)}
            aria-pressed={playSpeed === v}
            className={segClass(playSpeed === v)}
          >{v}×</button>
        ))}
      </div>

      <div className="mt-3"><SubLabel>Bevegelse</SubLabel></div>
      <div role="group" aria-label="Bevegelse" className="flex gap-1.5">
        {EASINGS.map(e => {
          const active = (tactic.easing ?? 'linear') === e.value;
          return (
            <button key={e.value} onClick={() => setEasing(e.value)} aria-pressed={active}
              className={segClass(active)}>{e.label}</button>
          );
        })}
      </div>

      <button onClick={() => setLoop(!tactic.loop)} aria-pressed={!!tactic.loop}
        className="mt-3 flex items-center gap-2.5 min-h-[36px] text-body text-ink">
        <span aria-hidden className={cn(
          'relative w-8 h-[18px] rounded-full transition-colors shadow-hair',
          tactic.loop ? 'bg-signal' : 'bg-canvas-raised',
        )}>
          <span className={cn(
            'absolute top-[2px] w-[14px] h-[14px] rounded-full bg-ink transition-[left]',
            tactic.loop ? 'left-[16px]' : 'left-[2px]',
          )} />
        </span>
        Spill av i loop
      </button>

      <div className="mt-3"><SubLabel>Varighet per overgang</SubLabel></div>
      {tactic.phases.length < 2 ? (
        <p className="text-caption text-ink-subtle">Legg til en fase til for å kunne spille av.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-rule">
          {tactic.phases.map((ph, i) => {
            const last = i === tactic.phases.length - 1;
            // Siste fase har ingen overgang videre – varigheten er pausen før ny runde i loop.
            if (last && !tactic.loop) return null;
            const name = (idx: number) => tactic.phases[idx].name || `Fase ${idx + 1}`;
            return (
              <PhaseDurationRow
                key={ph.id}
                label={`${name(i)} → ${name(last ? 0 : i + 1)}`}
                hint={last ? 'pause før ny runde' : undefined}
                durationMs={ph.durationMs}
                onChange={ms => setPhaseDuration(i, ms)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
};
