'use client';
import React from 'react';
import { DrillExercise } from '@/data/drills';

export const DrillDetailModal: React.FC<{
  drill: DrillExercise | null;
  onClose: () => void;
}> = ({ drill, onClose }) => {
  if (!drill) return null;

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
                {drill.difficulty === 'enkel' ? '⭐ Enkel' : drill.difficulty === 'middels' ? '⭐⭐ Middels' : '⭐⭐⭐ Avansert'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#4a6080]">⏱ {drill.duration} min</span>
              <span className="text-[9px] sm:text-[10px] text-[#4a6080]">👥 {drill.players} spillere</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#4a6080] hover:text-white text-2xl min-h-[44px] min-w-[44px] px-2 flex items-center justify-center">✕</button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">📋 Beskrivelse</div>
            <p className="text-[12px] sm:text-[13px] text-slate-300 leading-relaxed">{drill.description}</p>
          </div>

          {drill.steps && drill.steps.length > 0 && (
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2">📝 Steg-for-steg</div>
              <ol className="space-y-2">
                {drill.steps.map((step, idx) => (
                  <li key={step.id} className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-[11px] sm:text-[12px] font-semibold text-slate-200">{step.name}</div>
                      {step.description && (
                        <p className="text-[10px] sm:text-[11px] text-[#7a9ab8] mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {drill.tips && drill.tips.length > 0 && (
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">💡 Tips</div>
              <ul className="space-y-1">
                {drill.tips.map((tip, idx) => (
                  <li key={idx} className="text-[10px] sm:text-[11px] text-slate-300 flex gap-2">
                    <span className="text-amber-400">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {drill.equipment && drill.equipment.length > 0 && (
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">🛠 Utstyr</div>
              <div className="flex flex-wrap gap-1.5">
                {drill.equipment.map((item, idx) => (
                  <span key={idx} className="text-[9px] sm:text-[10px] px-2 py-1 sm:py-1 rounded-full bg-[#0f1a2a] border border-[#1e3050] text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
