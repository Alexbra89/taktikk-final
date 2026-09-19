'use client';
import React from 'react';
import type { DrillExercise } from '@/types';
import { CATEGORY_LABELS } from '@/data/drills';

const HEADING = 'text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-2';

const Bullets: React.FC<{ items: string[]; bullet: string; color: string }> = ({ items, bullet, color }) => (
  <ul className="space-y-1">
    {items.map((item, idx) => (
      <li key={idx} className="text-[10px] sm:text-[11px] text-slate-300 flex gap-2">
        <span className={`${color} flex-shrink-0`}>{bullet}</span>
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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="sticky top-0 bg-[#0c1525] border-b border-[#1e3050] px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100">{drill.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-semibold
                ${drill.difficulty === 'enkel' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : drill.difficulty === 'middels' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {drill.difficulty === 'enkel' ? '⭐ Lett' : drill.difficulty === 'middels' ? '⭐⭐ Middels' : '⭐⭐⭐ Avansert'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#4a6080]">{CATEGORY_LABELS[drill.category]}</span>
              <span className="text-[9px] sm:text-[10px] text-[#4a6080]">⏱ {drill.duration} min</span>
              <span className="text-[9px] sm:text-[10px] text-[#4a6080]">👥 {drill.players} spillere</span>
              <span className="text-[9px] sm:text-[10px] text-[#4a6080]">🎂 {drill.ageBand.join(', ')} år</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#4a6080] hover:text-white text-2xl min-h-[44px] min-w-[44px] px-2 flex items-center justify-center">✕</button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">

          {drill.warning && (
            <div className="flex gap-2 bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-3">
              <span className="text-yellow-400 leading-none flex-shrink-0">⚠️</span>
              <div>
                <div className="text-[9px] sm:text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-1">Advarsel</div>
                <p className="text-[11px] sm:text-[12px] text-yellow-100/90 leading-relaxed">{drill.warning}</p>
              </div>
            </div>
          )}

          <div>
            <div className={`${HEADING} text-sky-400`}>📋 Beskrivelse</div>
            <p className="text-[12px] sm:text-[13px] text-slate-300 leading-relaxed">{drill.description}</p>
          </div>

          {drill.why && (
            <div>
              <div className={`${HEADING} text-purple-400`}>🎯 Hvorfor</div>
              <p className="text-[11px] sm:text-[12px] text-slate-300 leading-relaxed">{drill.why}</p>
            </div>
          )}

          {drill.sketch && (
            <div>
              <div className={`${HEADING} text-slate-400`}>✏️ Skisse / oppsett</div>
              <p className="text-[11px] sm:text-[12px] text-slate-300 leading-relaxed whitespace-pre-line bg-[#0f1a2a] border border-dashed border-[#1e3050] rounded-lg p-3">
                {drill.sketch}
              </p>
            </div>
          )}

          {drill.steps.length > 0 && (
            <div>
              <div className={`${HEADING} text-sky-400`}>📝 Steg-for-steg</div>
              <ol className="space-y-2">
                {drill.steps.map((step, idx) => (
                  <li key={step.id} className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      {step.name && <div className="text-[11px] sm:text-[12px] font-semibold text-slate-200">{step.name}</div>}
                      {step.description && (
                        <p className="text-[10px] sm:text-[11px] text-[#7a9ab8] mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {drill.coachingPoints.length > 0 && (
            <div>
              <div className={`${HEADING} text-amber-400`}>💡 Coachingpunkter</div>
              <Bullets items={drill.coachingPoints} bullet="•" color="text-amber-400" />
            </div>
          )}

          {drill.commonMistakes.length > 0 && (
            <div>
              <div className={`${HEADING} text-red-400`}>🚫 Vanlige feil</div>
              <Bullets items={drill.commonMistakes} bullet="✕" color="text-red-400" />
            </div>
          )}

          {drill.variations.length > 0 && (
            <div>
              <div className={`${HEADING} text-orange-400`}>🔀 Variasjoner</div>
              <Bullets items={drill.variations} bullet="↳" color="text-orange-400" />
            </div>
          )}

          {drill.equipment.length > 0 && (
            <div>
              <div className={`${HEADING} text-emerald-400`}>🛠 Utstyr</div>
              <div className="flex flex-wrap gap-1.5">
                {drill.equipment.map((item, idx) => (
                  <span key={idx} className="text-[9px] sm:text-[10px] px-2 py-1 rounded-full bg-[#0f1a2a] border border-[#1e3050] text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {drill.background && (
            <div>
              <div className={`${HEADING} text-slate-400`}>📚 Bakgrunn</div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">{drill.background}</p>
            </div>
          )}

          {(drill.source || drill.unverifiedSource) && (
            <div className="text-[10px] text-[#4a6080] space-y-1 break-all">
              {[
                { label: 'Kilde', value: drill.source },
                { label: 'Uverifisert kilde', value: drill.unverifiedSource },
              ].filter(s => s.value).map(s => (
                <div key={s.label}>
                  <span className="font-bold uppercase tracking-wider text-[9px]">{s.label}:</span>{' '}
                  {isUrl(s.value!) ? (
                    <a href={s.value} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline">
                      {s.value!.replace(/^https?:\/\//i, '')}
                    </a>
                  ) : s.value}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
