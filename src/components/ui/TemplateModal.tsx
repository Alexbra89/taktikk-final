'use client';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from './Modal';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic, SPORT_LABELS } from '@/store/selectors';
import { TACTIC_TEMPLATES, type TacticTemplate } from '@/data/tacticTemplates';
import { SECONDARY_BTN, toggleClass } from '@/lib/formClasses';
import { cn } from '@/lib/cn';
import type { Sport } from '@/types';

// ══════════════════════════════════════════════════════════════
//  NY TAKTIKK – velg en mal eller start tomt.
//  Malene for sporten til aktiv taktikk vises først; «Vis alle» tar
//  med resten. Et valg lager en ny taktikk og lukker dialogen.
// ══════════════════════════════════════════════════════════════

/** Samme rekkefølge som sportvelgeren, største bane sist. */
const SPORT_ORDER: Sport[] = ['football', 'football9', 'football7', 'football5'];

const phaseCount = (n: number) => (n === 1 ? '1 fase' : `${n} faser`);

interface TemplateModalProps {
  onClose: () => void;
  /** Kalles når en taktikk er opprettet – sidefeltet bruker den til å åpne brettet. */
  onCreated?: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ onClose, onCreated }) => {
  const addTactic             = useAppStore(s => s.addTactic);
  const addTacticFromTemplate = useAppStore(s => s.addTacticFromTemplate);
  const activeSport           = useActiveTactic().sport;
  const [showAll, setShowAll] = useState(false);

  const sports = showAll
    ? [activeSport, ...SPORT_ORDER.filter(s => s !== activeSport)]
    : [activeSport];

  const done = () => { onCreated?.(); onClose(); };
  const pick = (tpl: TacticTemplate) => { addTacticFromTemplate(tpl); done(); };
  const empty = () => { addTactic(); done(); };

  return (
    <Modal
      onClose={onClose}
      title="Ny taktikk"
      subtitle={<p className="text-meta text-ink-muted">Start fra en mal, eller med en tom bane.</p>}
      footer={
        <button onClick={empty} className={cn('w-full', SECONDARY_BTN)}>
          <Plus size={15} strokeWidth={1.75} aria-hidden /> Tom taktikk
        </button>
      }
    >
      <div className="flex justify-end">
        <button
          onClick={() => setShowAll(v => !v)}
          aria-pressed={showAll}
          className={cn('min-h-[36px] px-3 rounded-ctl text-caption font-bold transition-colors', toggleClass(showAll))}
        >
          Vis alle
        </button>
      </div>

      {sports.map(sport => {
        const templates = TACTIC_TEMPLATES.filter(t => t.sport === sport);
        if (!templates.length) return null;
        return (
          <section key={sport} className="mt-3">
            <h3 className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">
              {SPORT_LABELS[sport]}
            </h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {templates.map(tpl => (
                <li key={tpl.id}>
                  <button
                    onClick={() => pick(tpl)}
                    className="w-full text-left rounded-ctl bg-canvas-raised shadow-hair px-3 py-2.5 hover:bg-canvas-hover transition-colors"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-body font-bold text-ink">{tpl.name}</span>
                      <span className="flex-shrink-0 font-mono text-meta text-ink-subtle">
                        {phaseCount(tpl.phases.length)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-caption text-ink-muted leading-relaxed">
                      {tpl.description}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Modal>
  );
};
