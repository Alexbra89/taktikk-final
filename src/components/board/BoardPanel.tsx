'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useActiveTactic } from '../../store/selectors';
import { Controls } from '../ui/Controls';
import { cn } from '../../lib/cn';

// ═══════════════════════════════════════════════════════════════
//  BRETTPANEL – alt som før lå som egne linjer og knapper rundt banen:
//  oppsett (sport/formasjon/roller), notat, øyeblikk og avspillingsfart.
//  Bunn-sheet på mobil, popover på desktop. Banen skal eie plassen.
// ═══════════════════════════════════════════════════════════════

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-2">{children}</div>
);

interface BoardPanelProps {
  isMobile: boolean;
  onClose: () => void;
  playSpeed: number;
  setPlaySpeed: (v: number) => void;
}

export const BoardPanel: React.FC<BoardPanelProps> = ({ isMobile, onClose, playSpeed, setPlaySpeed }) => {
  const tactic           = useActiveTactic();
  const updateStickyNote = useAppStore(s => s.updateStickyNote);
  const moments          = useAppStore(s => s.moments);
  const saveMoment       = useAppStore(s => s.saveMoment);
  const deleteMoment     = useAppStore(s => s.deleteMoment);

  const phase = tactic.phases[tactic.activePhaseIdx] ?? null;

  // ─── Notat ─────────────────────────────────────────────────
  // Skrives lokalt og lagres med forsinkelse, som før. Siste tastetrykk
  // skylles også når panelet lukkes.
  const [note, setNote]  = useState(phase?.stickyNote ?? '');
  const latest           = useRef(note);
  const pending          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseIdx         = tactic.activePhaseIdx;

  const flushNote = () => {
    if (!pending.current) return;
    clearTimeout(pending.current);
    pending.current = null;
    updateStickyNote(latest.current, phaseIdx);
  };
  useEffect(() => () => flushNote(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const onNoteChange = (v: string) => {
    setNote(v);
    latest.current = v;
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(flushNote, 400);
  };

  // ─── Øyeblikk ──────────────────────────────────────────────
  // Lå tidligere i lokal useState og forsvant ved refresh. Nå i store,
  // som lagrer dem sammen med resten av appen.
  const [momentLabel, setMomentLabel] = useState('');
  const tacticMoments = moments.filter(m => !m.tacticId || m.tacticId === tactic.id);

  const addMoment = () => {
    const name = momentLabel.trim();
    if (!name || !phase) return;
    saveMoment(name);
    setMomentLabel('');
  };

  // Escape lukker panelet begge steder – men ikke når en modal ligger oppå
  // (f.eks. rolleforklaringene). Da skal Escape bare lukke den øverste.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[data-modal-layer]')) return;
      onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const inputClass = 'flex-1 min-w-0 rounded-ctl px-3 min-h-[40px] bg-canvas-raised text-body text-ink placeholder-ink-faint shadow-hair focus:outline-none focus:shadow-hair-signal';

  const body = (
    <div className="flex flex-col gap-5">
      <Controls />

      <section>
        <SectionTitle>Notat for {phase?.name || 'fasen'}</SectionTitle>
        <input
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          onBlur={flushNote}
          placeholder="Hva skal spillerne huske?"
          className={cn(inputClass, 'w-full')}
        />
      </section>

      <section>
        <SectionTitle>Taktiske øyeblikk</SectionTitle>
        <div className="flex gap-2">
          <input
            value={momentLabel}
            onChange={e => setMomentLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addMoment(); }}
            placeholder="Navn på øyeblikk"
            className={inputClass}
          />
          <button
            onClick={addMoment}
            disabled={!momentLabel.trim() || !phase}
            className="px-3 min-h-[40px] rounded-ctl bg-signal text-signal-fg text-body font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >Lagre</button>
        </div>
        {tacticMoments.length > 0 ? (
          <ul className="mt-2 flex flex-col divide-y divide-rule">
            {tacticMoments.map(m => (
              <li key={m.id} className="flex items-center gap-2 py-1.5">
                <span className="flex-1 min-w-0 truncate text-body text-ink">{m.name}</span>
                <span className="font-mono text-meta text-ink-subtle">
                  {new Date(m.timestamp).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit' })}
                </span>
                <button
                  onClick={() => deleteMoment(m.id)}
                  aria-label={`Slett øyeblikket ${m.name}`}
                  className="tap-auto w-8 h-8 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink"
                ><Trash2 size={14} strokeWidth={1.75} /></button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-caption text-ink-subtle">
            Et øyeblikk lagrer stillingen i denne fasen, slik at du finner den igjen senere.
          </p>
        )}
      </section>

      <section>
        <SectionTitle>Avspillingsfart</SectionTitle>
        <div role="group" aria-label="Avspillingsfart" className="flex gap-1.5">
          {[0.5, 1, 1.5, 2].map(v => (
            <button
              key={v}
              onClick={() => setPlaySpeed(v)}
              aria-pressed={playSpeed === v}
              className={cn(
                'tap-auto min-h-[32px] px-3 rounded-ctl font-mono text-caption transition-colors',
                playSpeed === v
                  ? 'bg-signal/10 text-signal shadow-hair-signal'
                  : 'bg-canvas-raised text-ink-muted hover:text-ink shadow-hair',
              )}
            >{v}×</button>
          ))}
        </div>
      </section>
    </div>
  );

  const header = (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-h4 text-ink">Brettoppsett</h2>
      <button onClick={onClose} aria-label="Lukk panelet"
        className="tap-auto w-9 h-9 flex items-center justify-center rounded-ctl text-ink-subtle hover:text-ink hover:bg-canvas-hover">
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Brettoppsett">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative max-h-[85vh] overflow-y-auto bg-canvas-panel border-t border-rule rounded-t-panel px-4 pt-4 sheet-safe animate-sheet-up">
          {header}
          {body}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Klikk utenfor lukker popoveren. */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Brettoppsett"
        className="absolute top-full right-2 z-50 mt-1 w-[340px] max-h-[70vh] overflow-y-auto rounded-panel bg-canvas-panel p-4 shadow-pop animate-pop"
      >
        {header}
        {body}
      </div>
    </>
  );
};
