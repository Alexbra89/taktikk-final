'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipForward, SkipBack,
  Plus, Trash2, Zap, Target, Trophy, Pencil
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Sport } from '@/types';

const SPORTS: { id: Sport; name: string; icon: React.ReactNode }[] = [
  { id: 'football',  name: 'Fotball',   icon: <Trophy className="w-3.5 h-3.5" /> },
  { id: 'handball',  name: 'Håndball',  icon: <Target className="w-3.5 h-3.5" /> },
];

export const Controls: React.FC = () => {
  const {
    sport: currentSport, 
    phases, 
    activePhaseIdx,
    setSport, 
    addPhase, 
    removePhase,
    setActivePhaseIdx,
  } = useAppStore();

  const currentIndex = activePhaseIdx;

  const nextPhase = () => {
    if (currentIndex < phases.length - 1) setActivePhaseIdx(currentIndex + 1);
  };

  const previousPhase = () => {
    if (currentIndex > 0) setActivePhaseIdx(currentIndex - 1);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-800 p-3 shadow-xl"
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Idrett-velger */}
        <div className="flex gap-1 bg-slate-800/70 rounded-lg p-1">
          {SPORTS.map(s => (
            <button
              key={s.id}
              onClick={() => setSport(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentSport === s.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {s.icon}
              {s.name}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-700" />

        {/* Fase-navigasjon */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={previousPhase}
            disabled={currentIndex <= 0}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={nextPhase}
            disabled={currentIndex >= phases.length - 1}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        {/* Fase-tabs */}
        <div className="flex gap-1.5 overflow-x-auto max-w-xs">
          {phases.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActivePhaseIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                idx === activePhaseIdx
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Handlinger */}
        <div className="flex gap-1.5 ml-auto">
          <button
            onClick={() => addPhase()}
            className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30 transition"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => phases.length > 1 && removePhase(activePhaseIdx)}
            disabled={phases.length <= 1}
            className="p-2 rounded-lg bg-red-600/10 text-red-400 border border-red-600/20 hover:bg-red-600/25 disabled:opacity-30 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};