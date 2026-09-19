'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic, getSportChangeMessage, SPORT_LABELS } from '@/store/selectors';
import { getFormations } from '@/data/formations';
import { Sport } from '@/types';
import { FilterChip } from './FilterBar';
import { RoleExplanations } from './RoleExplanations';

// ═══════════════════════════════════════════════════════════════
//  OPPSETT FOR AKTIV TAKTIKK: sport (5/7/9/11), formasjon og roller.
//  Ligger i brettpanelet (BoardPanel) – ikke lenger som egen linje
//  over banen. Kalk: chips i stedet for nedtrekk, signal som aksent.
// ═══════════════════════════════════════════════════════════════

const SPORT_ORDER: Sport[] = ['football5', 'football7', 'football9', 'football'];

export const Controls: React.FC = () => {
  const tactic       = useActiveTactic();
  const setSport     = useAppStore(s => s.setSport);
  const setFormation = useAppStore(s => s.setFormation);
  const [showRoles, setShowRoles] = useState(false);

  // Sportbytte fjerner eller legger til spillere i alle faser, så vi spør når det finnes flere faser.
  const changeSport = (next: Sport) => {
    if (next === tactic.sport) return;
    const warning = getSportChangeMessage(tactic, next);
    if (warning && !window.confirm(warning)) return;
    setSport(next);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <section>
          <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-2">Antall spillere</div>
          <div role="group" aria-label="Antall spillere" className="flex flex-wrap gap-1.5">
            {SPORT_ORDER.map(s => (
              <FilterChip
                key={s}
                accent="signal"
                active={tactic.sport === s}
                onClick={() => changeSport(s)}
              >
                {SPORT_LABELS[s]}
              </FilterChip>
            ))}
          </div>
        </section>

        <section>
          <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-2">Formasjon</div>
          <div role="group" aria-label="Formasjon" className="flex flex-wrap gap-1.5">
            {getFormations(tactic.sport).map(f => (
              <FilterChip
                key={f.name}
                accent="signal"
                active={tactic.formation === f.name}
                onClick={() => setFormation(f.name)}
              >
                {f.name}
              </FilterChip>
            ))}
          </div>
        </section>

        <button
          onClick={() => setShowRoles(true)}
          className="self-start px-3 min-h-[36px] rounded-ctl text-body text-ink-muted hover:text-ink hover:bg-canvas-hover shadow-hair transition-colors"
        >Forklar rollene</button>
      </div>

      {showRoles && <RoleExplanations onClose={() => setShowRoles(false)} />}
    </>
  );
};
