'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, ChevronDown, Target, Shield, 
  Sword, Users, Info, Star 
} from 'lucide-react';
// FIKSET: Bruker riktig store-navn
import { useAppStore } from '@/store/useAppStore';

// Vi definerer typene her slik at TypeScript ikke klager på manglende filer
interface RoleExplanation {
  role: string;
  name: string;
  description: string;
  responsibilities: string[];
  tacticalNotes: string[];
  examplePlayers?: string[];
}

// Her legger vi inn de fulle listene for alle idretter rett i fila
const footballRoles: RoleExplanation[] = [
  {
    role: 'keeper',
    name: 'Målvakt',
    description: 'Lagets bakerste ledd og den eneste som kan bruke hendene i eget felt.',
    responsibilities: ['Stoppe skudd', 'Sette i gang spillet', 'Dirigere forsvaret'],
    tacticalNotes: ['Vær offensiv i feltet', 'Kommuniser tydelig med stopperne'],
  },
  {
    role: 'defender',
    name: 'Midtstopper',
    description: 'Sørger for trygghet i forsvaret og bryter motstanderens angrep.',
    responsibilities: ['Markering', 'Vinne hodedueller', 'Posisjonering'],
    tacticalNotes: ['Hold linja', 'Faller av ved bakromstrussel'],
  }
];

// Du kan lime inn handballRoles og floorballRoles her på samme måte

export const RoleExplanations: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleExplanation | null>(null);
  const { sport: currentSport } = useAppStore();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'keeper': return <Shield className="w-5 h-5" />;
      case 'defender': return <Shield className="w-5 h-5" />;
      case 'midfielder': return <Users className="w-5 h-5" />;
      case 'forward': return <Sword className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-700/50 transition"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-sm">Rolleforklaringer</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700"
          >
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {footballRoles.map((role) => (
                <motion.button
                  key={role.role}
                  whileHover={{ scale: 1.02, x: 5 }}
                  onClick={() => setSelectedRole(role)}
                  className="w-full bg-slate-900/50 rounded-lg p-3 text-left hover:bg-slate-800 transition border border-slate-700"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getRoleIcon(role.role)}
                    <h4 className="font-bold text-sm">{role.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{role.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRole(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full p-6 shadow-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    {getRoleIcon(selectedRole.role)}
                 </div>
                 <h2 className="text-2xl font-bold">{selectedRole.name}</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-blue-400 text-sm font-bold flex items-center gap-2 mb-2">
                    <Target size={14}/> ANSVAR
                  </h3>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {selectedRole.responsibilities.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setSelectedRole(null)}
                className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg"
              >
                Ferdig
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};