'use client';
import React from 'react';
import { AlertTriangle, Clock, Users, Cake, Package } from 'lucide-react';
import type { DrillExercise } from '@/types';
import { CATEGORY_LABELS } from '@/data/drills';
import { Modal, Badge, Meta } from '@/components/ui';
import { SketchPreview } from '@/components/board/SketchPreview';

// ═══════════════════════════════════════════════════════════════
//  FULL ØVELSESDETALJ – åpnes fra en økt i TrainingView.
//  Kalk: én aksent, status kun på vanskelighetsgrad og advarsel.
// ═══════════════════════════════════════════════════════════════

const DIFFICULTY_LABELS: Record<string, string> = {
  enkel: 'Lett', middels: 'Middels', avansert: 'Avansert',
};

const DIFFICULTY_TONE = {
  enkel: 'ok', middels: 'warn', avansert: 'bad',
} as const;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-2">{title}</div>
    {children}
  </section>
);

const Bullets: React.FC<{ items: string[]; bullet: string }> = ({ items, bullet }) => (
  <ul className="space-y-1">
    {items.map((item, idx) => (
      <li key={idx} className="text-body text-ink-muted flex gap-2">
        <span aria-hidden className="text-ink-faint flex-shrink-0">{bullet}</span>
        {item}
      </li>
    ))}
  </ul>
);

export const DrillDetailModal: React.FC<{
  drill: DrillExercise | null;
  onClose: () => void;
}> = ({ drill, onClose }) => {
  if (!drill) return null;

  const isUrl = (s: string) => /^https?:\/\//i.test(s);

  return (
    <Modal
      onClose={onClose}
      title={drill.name}
      size="md"
      subtitle={
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <Badge tone={DIFFICULTY_TONE[drill.difficulty]}>
            {DIFFICULTY_LABELS[drill.difficulty] ?? drill.difficulty}
          </Badge>
          <Meta>{CATEGORY_LABELS[drill.category]}</Meta>
          <Meta icon={<Clock size={13} strokeWidth={1.75} />}>{drill.duration} min</Meta>
          <Meta icon={<Users size={13} strokeWidth={1.75} />}>{drill.players}</Meta>
          <Meta icon={<Cake size={13} strokeWidth={1.75} />}>{drill.ageBand.join(', ')} år</Meta>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Skjematisk oppsett øverst – tegner bare det som kan telles ut av
            skissteksten. Selve teksten står lenger ned under «Skisse / oppsett». */}
        <SketchPreview sketch={drill.sketch} players={drill.players} />

        {drill.warning && (
          <div className="flex gap-3 rounded-panel border border-warn-500/40 bg-warn-500/10 p-3">
            <AlertTriangle size={16} strokeWidth={1.75} aria-hidden className="text-warn-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-meta uppercase tracking-[0.08em] text-warn-400 mb-1">Advarsel</div>
              <p className="text-body text-warn-300 leading-relaxed">{drill.warning}</p>
            </div>
          </div>
        )}

        <p className="text-lead text-ink-muted leading-relaxed">{drill.description}</p>

        {drill.why && (
          <Section title="Hvorfor">
            <p className="text-body text-ink-muted leading-relaxed">{drill.why}</p>
          </Section>
        )}

        {drill.sketch && (
          <Section title="Skisse / oppsett">
            <p className="text-body text-ink-muted leading-relaxed whitespace-pre-line
                          rounded-panel bg-canvas-sunken shadow-hair p-3">
              {drill.sketch}
            </p>
          </Section>
        )}

        {drill.steps.length > 0 && (
          <Section title="Steg for steg">
            <ol className="space-y-2">
              {drill.steps.map((step, idx) => (
                <li key={step.id} className="flex gap-3">
                  <span className="h-6 w-6 flex-shrink-0 rounded-full bg-signal/15 shadow-hair-signal
                                   flex items-center justify-center font-mono text-meta text-signal">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    {step.name && <div className="text-body font-bold text-ink">{step.name}</div>}
                    {step.description && (
                      <p className="text-body text-ink-muted leading-relaxed">{step.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {drill.coachingPoints.length > 0 && (
          <Section title="Coachingpunkter">
            <Bullets items={drill.coachingPoints} bullet="✦" />
          </Section>
        )}

        {drill.commonMistakes.length > 0 && (
          <Section title="Vanlige feil">
            <Bullets items={drill.commonMistakes} bullet="✕" />
          </Section>
        )}

        {drill.variations.length > 0 && (
          <Section title="Variasjoner">
            <Bullets items={drill.variations} bullet="↳" />
          </Section>
        )}

        {drill.equipment.length > 0 && (
          <Section title="Utstyr">
            <div className="flex flex-wrap gap-1.5">
              {drill.equipment.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 rounded-pill bg-canvas-raised
                                           px-2.5 py-1 text-meta text-ink-muted shadow-hair">
                  <Package size={12} strokeWidth={1.75} aria-hidden />
                  {item}
                </span>
              ))}
            </div>
          </Section>
        )}

        {drill.background && (
          <Section title="Bakgrunn">
            <p className="text-body text-ink-subtle leading-relaxed">{drill.background}</p>
          </Section>
        )}

        {(drill.source || drill.unverifiedSource) && (
          <div className="text-meta text-ink-faint space-y-1 break-all pt-2 border-t border-rule">
            {[
              { label: 'Kilde', value: drill.source },
              { label: 'Uverifisert kilde', value: drill.unverifiedSource },
            ].filter(s => s.value).map(s => (
              <div key={s.label}>
                <span className="font-mono uppercase tracking-[0.08em]">{s.label}:</span>{' '}
                {isUrl(s.value!) ? (
                  <a href={s.value} target="_blank" rel="noopener noreferrer"
                    className="text-signal hover:brightness-110 underline">
                    {s.value!.replace(/^https?:\/\//i, '')}
                  </a>
                ) : s.value}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
