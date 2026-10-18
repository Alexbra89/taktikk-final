// Kalender, treningsnotater, egne øvelser og fremmøtenavneliste.
import type { AppSlice } from './types';
import type { TrainingNote, MatchNote } from '../types';
import { repairCustomDrill } from '../lib/customDrills';
import { uid } from './id';

export const createCalendarSlice: AppSlice<'events' | 'customDrills' | 'saveCustomDrill' | 'deleteCustomDrill' | 'addEvent' | 'updateEvent' | 'deleteEvent' | 'addTrainingNote' | 'updateTrainingNote' | 'deleteTrainingNote' | 'moveTrainingNote' | 'addMatchNote' | 'updateMatchNote' | 'deleteMatchNote' | 'rosterNames' | 'setRosterNames'> = (set, get) => ({

      // ─── Kalender og trening ───────────────────────────────
      events: [],
      customDrills: [],
      saveCustomDrill: (drill) => {
        const clean = repairCustomDrill(drill);
        if (!clean) throw new Error('Fyll ut navn, beskrivelse, spillere, alder og gyldig varighet.');
        const existing = get().customDrills.find(d => d.id === clean.id);
        const saved = { ...clean, id: existing?.id ?? `custom-${uid()}`, aiGenerated: existing?.aiGenerated || clean.aiGenerated };
        set(s => ({ customDrills: existing
          ? s.customDrills.map(d => d.id === saved.id ? saved : d)
          : [...s.customDrills, saved] }));
        return saved;
      },
      deleteCustomDrill: (id) => set(s => ({ customDrills: s.customDrills.filter(d => d.id !== id) })),
      addEvent: (ev) => {
        const newEv = { id: uid(), ...ev };
        set(s => ({ events: [...s.events, newEv] }));
      },
      updateEvent: (id, fields) => {
        set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...fields } : e) }));
      },
      deleteEvent: (id) => {
        set(s => ({ events: s.events.filter(e => e.id !== id) }));
      },
      addTrainingNote: (eventId, note) => {
        const n: TrainingNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e
          : { ...e, trainingNotes: [...e.trainingNotes, n] }) }));
      },
      updateTrainingNote: (eventId, noteId, fields) => {
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, trainingNotes: e.trainingNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
        })}));
      },
      deleteTrainingNote: (eventId, noteId) => {
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, trainingNotes: e.trainingNotes.filter(n => n.id !== noteId),
        })}));
      },
      moveTrainingNote: (eventId, noteId, dir) => {
        set(s => ({ events: s.events.map(e => {
          if (e.id !== eventId) return e;
          const i = e.trainingNotes.findIndex(n => n.id === noteId);
          const j = i + dir;
          if (i === -1 || j < 0 || j >= e.trainingNotes.length) return e;
          const notes = [...e.trainingNotes];
          [notes[i], notes[j]] = [notes[j], notes[i]];
          return { ...e, trainingNotes: notes };
        })}));
      },
      addMatchNote: (eventId, note) => {
        const n: MatchNote = { id: uid(), createdAt: new Date().toISOString(), ...note };
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e
          : { ...e, matchNotes: [...e.matchNotes, n] }) }));
      },
      updateMatchNote: (eventId, noteId, fields) => {
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, matchNotes: e.matchNotes.map(n => n.id !== noteId ? n : { ...n, ...fields }),
        })}));
      },
      deleteMatchNote: (eventId, noteId) => {
        set(s => ({ events: s.events.map(e => e.id !== eventId ? e : {
          ...e, matchNotes: e.matchNotes.filter(n => n.id !== noteId),
        })}));
      },

      rosterNames: [],
      setRosterNames: (names) => {
        const seen = new Set<string>();
        const cleaned = names
          .map(n => n.trim())
          .filter(n => n && !seen.has(n.toLowerCase()) && (seen.add(n.toLowerCase()), true));
        set({ rosterNames: cleaned });
      },
});
