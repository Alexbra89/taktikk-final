'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic, getSportChangeMessage, SPORT_LABELS } from '@/store/selectors';
import { getFormations } from '@/data/formations';
import { Sport } from '@/types';
import { RoleExplanations } from './RoleExplanations';

// ═══════════════════════════════════════════════════════════════
//  KONTROLLER FOR AKTIV TAKTIKK: sport (5/7/9/11), formasjon og roller.
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
      <div
        style={{ background: 'rgba(5,10,25,0.82)', borderBottom: '1px solid rgba(56,189,248,0.1)' }}
        className="flex-shrink-0 flex flex-wrap items-center gap-2 px-2 py-1.5"
      >
        <div
          role="group"
          aria-label="Antall spillere"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          className="flex items-center gap-0.5 rounded-lg p-0.5 flex-shrink-0"
        >
          <span className="pl-2 pr-1 text-[13px]" aria-hidden>⚽</span>
          {SPORT_ORDER.map(s => {
            const active = tactic.sport === s;
            return (
              <button
                key={s}
                onClick={() => changeSport(s)}
                aria-pressed={active}
                className={`px-2.5 rounded-md min-h-[36px] text-[11px] font-bold transition-colors
                  ${active ? 'bg-sky-500/20 text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {SPORT_LABELS[s]}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Formasjon</span>
          <select
            value={tactic.formation}
            onChange={e => setFormation(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            className="rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500/50 min-h-[40px]"
          >
            {getFormations(tactic.sport).map(f => (
              <option key={f.name} value={f.name} style={{ background: '#0c1525' }}>{f.name}</option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setShowRoles(true)}
          style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)' }}
          className="px-3 rounded-lg min-h-[40px] text-[11px] font-bold text-violet-300 hover:bg-violet-500/15 flex-shrink-0"
        >🎓 Roller</button>
      </div>

      {showRoles && <RoleExplanations onClose={() => setShowRoles(false)} />}
    </>
  );
};
