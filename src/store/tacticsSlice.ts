// Handlinger for taktikker, formasjoner, faser og brettinnhold.
import type { AppSlice } from './types';
import type { Tactic, TacticPhase } from '../types';
import { DEFAULT_FORMATION, getFormations, getFormationSlots } from '../data/formations';
import { buildTemplatePhases } from '../data/tacticTemplates';
import { normalizeRotation } from '../data/boardItems';
import { uid } from './id';
import { createTactic, patchPhase, resetToSlots, syncPlayers, isSport, isPos, patchActiveTactic, freeSpot, patchItemForward, samePos, sameRot } from './tacticModel';

const initialTactic = createTactic('Taktikk 1', 'football');

export const createTacticsSlice: AppSlice<'tactics' | 'activeTacticId' | 'addTactic' | 'addTacticFromTemplate' | 'removeTactic' | 'renameTactic' | 'setActiveTactic' | 'setFormation' | 'setSport' | 'setActivePhaseIdx' | 'addPhase' | 'removePhase' | 'renamePhase' | 'movePlayer' | 'moveBall' | 'setPlayerName' | 'setPlayerNum' | 'addDrawing' | 'addItem' | 'moveItem' | 'rotateItem' | 'removeItem' | 'removeLastDrawing' | 'clearDrawings' | 'updateStickyNote'> = (set, get) => ({

      // ─── Taktikker ─────────────────────────────────────────
      tactics: [initialTactic],
      activeTacticId: initialTactic.id,

      addTactic: (name, opts) => {
        const { tactics, activeTacticId } = get();
        const sport = tactics.find(t => t.id === activeTacticId)?.sport ?? 'football';
        const tactic = createTactic(name?.trim() || `Taktikk ${tactics.length + 1}`, sport, opts?.empty === true);
        set({ tactics: [...tactics, tactic], activeTacticId: tactic.id });
      },

      addTacticFromTemplate: (tpl) => {
        const tactic: Tactic = {
          id: `tactic-${uid()}`,
          name: tpl.name,
          sport: tpl.sport,
          formation: tpl.formation,
          phases: buildTemplatePhases(tpl, uid),
          activePhaseIdx: 0,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ tactics: [...s.tactics, tactic], activeTacticId: tactic.id }));
      },

      removeTactic: (id) => {
        const { tactics, activeTacticId } = get();
        const idx = tactics.findIndex(t => t.id === id);
        if (idx === -1 || tactics.length <= 1) return;
        const rest = tactics.filter(t => t.id !== id);
        // Neste taktikk tar over; var den siste, blir det forrige.
        const nextActive = id === activeTacticId ? rest[Math.min(idx, rest.length - 1)].id : activeTacticId;
        set({ tactics: rest, activeTacticId: nextActive });
      },

      renameTactic: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set(s => ({ tactics: s.tactics.map(t => t.id === id ? { ...t, name: trimmed } : t) }));
      },

      setActiveTactic: (id) => {
        if (get().tactics.some(t => t.id === id)) set({ activeTacticId: id });
      },

      // ─── Formasjon og sport ────────────────────────────────
      // Rollene utledes fra formasjon + slotIdx og følger derfor med i alle faser.
      // Posisjonene nullstilles bare i aktiv fase.
      setFormation: (name) => set(s => ({
        tactics: s.tactics.map(t => {
          if (t.id !== s.activeTacticId || t.empty) return t;
          if (!getFormations(t.sport).some(f => f.name === name)) return t;
          const slots = getFormationSlots(t.sport, name);
          return patchPhase({ ...t, formation: name }, t.activePhaseIdx, ph => resetToSlots(ph, slots));
        }),
      })),

      // Ny sport gir standardformasjonen for sporten. Spillere som ikke har en slot
      // lenger fjernes fra alle faser, og manglende slots fylles opp i alle faser.
      setSport: (sport) => set(s => ({
        tactics: s.tactics.map(t => {
          if (t.id !== s.activeTacticId || t.sport === sport || !isSport(sport)) return t;
          const formation = DEFAULT_FORMATION[sport];
          // Tom bane forblir tom: ingen formasjonsspillere fylles inn.
          const slots = t.empty ? [] : getFormationSlots(sport, formation);
          const synced = { ...t, sport, formation, phases: syncPlayers(t.phases, slots) };
          return patchPhase(synced, t.activePhaseIdx, ph => resetToSlots(ph, slots));
        }),
      })),

      // ─── Faser ─────────────────────────────────────────────
      setActivePhaseIdx: (i) => set(s => patchActiveTactic(s, t =>
        i >= 0 && i < t.phases.length ? { ...t, activePhaseIdx: i } : t)),

      addPhase: () => set(s => patchActiveTactic(s, t => {
        const cur = t.phases[t.activePhaseIdx];
        const copy: TacticPhase = {
          id: `phase-${uid()}`,
          name: `Fase ${t.phases.length + 1}`,
          players: cur.players.map(p => ({ ...p, position: { ...p.position } })),
          // Utstyret følger med, med samme id-er: kjeglene står, og en
          // motstander som flyttes i den nye fasen glir dit under avspilling.
          items: (cur.items ?? []).map(it => ({ ...it, position: { ...it.position } })),
          ball: { ...cur.ball },
          drawings: [],
          stickyNote: '',
        };
        return { ...t, phases: [...t.phases, copy], activePhaseIdx: t.phases.length };
      })),

      removePhase: (idx) => set(s => patchActiveTactic(s, t => {
        if (t.phases.length <= 1 || idx < 0 || idx >= t.phases.length) return t;
        const phases = t.phases.filter((_, i) => i !== idx);
        const active = idx < t.activePhaseIdx ? t.activePhaseIdx - 1 : t.activePhaseIdx;
        return { ...t, phases, activePhaseIdx: Math.min(active, phases.length - 1) };
      })),

      renamePhase: (idx, name) => set(s => patchActiveTactic(s, t => patchPhase(t, idx, ph => ({ ...ph, name })))),

      // NaN/Infinity (f.eks. fra et brett med størrelse 0) lagres som null og
      // forkaster spilleren ved neste lasting. Slike posisjoner avvises her.
      movePlayer: (playerId, pos) => { if (isPos(pos)) set(s => patchActiveTactic(s, t =>
        patchPhase(t, t.activePhaseIdx, ph => ({
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, position: pos } : p),
        })))); },

      moveBall: (pos) => { if (isPos(pos)) set(s => patchActiveTactic(s, t =>
        patchPhase(t, t.activePhaseIdx, ph => ({ ...ph, ball: pos })))); },

      setPlayerName: (playerId, name) => set(s => patchActiveTactic(s, t => ({
        ...t, phases: t.phases.map(ph => ({
          ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, name: name.trim() } : p),
        })),
      }))),

      setPlayerNum: (playerId, num) => set(s => patchActiveTactic(s, t => {
        if (!Number.isInteger(num) || num < 1 || num > 99) return t;
        return {
          ...t, phases: t.phases.map(ph => ({
            ...ph, players: ph.players.map(p => p.id === playerId ? { ...p, num } : p),
          })),
        };
      })),

      addDrawing: (drawing) => set(s => patchActiveTactic(s, t =>
        patchPhase(t, t.activePhaseIdx, ph => ({ ...ph, drawings: [...ph.drawings, { id: uid(), ...drawing }] })))),

      addItem: (type) => {
        const id = `item-${uid()}`;
        set(s => patchActiveTactic(s, t => {
          // Plassen finnes i fasen man står i; de senere fasene får samme plass.
          const position = freeSpot(type, t.phases[t.activePhaseIdx]);
          return {
            ...t, phases: t.phases.map((ph, i) => i < t.activePhaseIdx ? ph : {
              ...ph, items: [...(ph.items ?? []), { id, type, position: { ...position } }],
            }),
          };
        }));
        return id;
      },

      moveItem: (itemId, pos) => { if (isPos(pos)) set(s => patchActiveTactic(s, t =>
        patchItemForward(t, itemId, samePos, it => ({ ...it, position: { ...pos } })))); },

      rotateItem: (itemId, deg) => set(s => patchActiveTactic(s, t =>
        patchItemForward(t, itemId, sameRot, it => ({ ...it, rotation: normalizeRotation(deg) })))),

      // Borte fra og med denne fasen: det gir ingen mening at et element
      // forsvinner og så dukker opp igjen i en senere fase.
      removeItem: (itemId) => set(s => patchActiveTactic(s, t => ({
        ...t, phases: t.phases.map((ph, i) => i < t.activePhaseIdx ? ph : {
          ...ph, items: (ph.items ?? []).filter(it => it.id !== itemId),
        }),
      }))),

      removeLastDrawing: () => set(s => patchActiveTactic(s, t =>
        patchPhase(t, t.activePhaseIdx, ph => ({ ...ph, drawings: ph.drawings.slice(0, -1) })))),

      clearDrawings: () => set(s => patchActiveTactic(s, t =>
        patchPhase(t, t.activePhaseIdx, ph => ({ ...ph, drawings: [] })))),

      updateStickyNote: (note, phaseIdx) => set(s => patchActiveTactic(s, t =>
        patchPhase(t, phaseIdx ?? t.activePhaseIdx, ph => ({ ...ph, stickyNote: note })))),
});
