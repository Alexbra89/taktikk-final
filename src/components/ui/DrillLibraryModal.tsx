'use client';
import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic } from '@/store/selectors';
import { getDrillsBySport, toDrillSport, DrillExercise, DrillCategory, CATEGORY_LABELS } from '@/data/drills';
import { DrillDetailModal } from './DrillDetailModal';

const DIFFICULTY_COLORS: Record<string, string> = {
  enkel:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  middels:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  avansert: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  enkel: 'Enkel',
  middels: 'Middels',
  avansert: 'Avansert',
};

export const DrillLibraryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { ageGroup } = useAppStore();
  const { sport } = useActiveTactic();
  const [selectedDrill, setSelectedDrill] = useState<DrillExercise | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const drills = useMemo(
    () => getDrillsBySport(toDrillSport(sport)).filter(d => !d.ageGroup || d.ageGroup === ageGroup),
    [sport, ageGroup]
  );

  const groups = useMemo(
    () => (Object.keys(CATEGORY_LABELS) as DrillCategory[])
      .map(cat => ({ cat, label: CATEGORY_LABELS[cat], drills: drills.filter(d => d.category === cat) }))
      .filter(g => g.drills.length > 0),
    [drills]
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[#1e3050] flex-shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-100">📚 Øvelsesbibliotek</h2>
            <p className="text-[10px] sm:text-[11px] text-[#4a6080] mt-0.5">
              {drills.length} øvelser · {ageGroup === 'youth' ? 'Barn' : 'Voksen'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#4a6080] hover:text-white text-2xl min-h-[44px] min-w-[44px] px-2 flex items-center justify-center">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {groups.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">Ingen øvelser for denne aldersgruppen.</p>
          )}

          {groups.map(group => {
            const isCollapsed = !!collapsed[group.cat];
            return (
              <div key={group.cat} className="rounded-xl border border-[#1e3050] overflow-hidden">
                <button
                  onClick={() => setCollapsed(c => ({ ...c, [group.cat]: !c[group.cat] }))}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#0f1a2a] hover:bg-[#111f33] transition-all min-h-[44px]"
                >
                  <span className="text-[11px] sm:text-[12px] font-bold text-slate-200">{group.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[9px] text-[#4a6080]">{group.drills.length}</span>
                    <span className="text-[#4a6080] text-xs">{isCollapsed ? '+' : '-'}</span>
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-[#1e3050]/60">
                    {group.drills.map(drill => (
                      <button
                        key={drill.id}
                        onClick={() => setSelectedDrill(drill)}
                        className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-sky-500/5 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] sm:text-[12px] font-semibold text-slate-200 flex-1">{drill.name}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap ${DIFFICULTY_COLORS[drill.difficulty]}`}>
                            {DIFFICULTY_LABELS[drill.difficulty]}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7a9ab8] mt-0.5 line-clamp-2">{drill.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-[9px] text-[#4a6080]">
                          <span>⏱ {drill.duration} min</span>
                          <span>👥 {drill.players} spillere</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDrill && (
        <DrillDetailModal drill={selectedDrill} onClose={() => setSelectedDrill(null)} />
      )}
    </div>
  );
};