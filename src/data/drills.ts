// src/data/drills.ts
import type { DrillCategory, DrillAgeBand, DrillExercise } from '../types';

import { KEEPER_YOUTH, KEEPER_ADULT } from './drills/keeper';
import { FORSVAR_YOUTH, FORSVAR_ADULT } from './drills/forsvar';
import { MIDTBANE_YOUTH, MIDTBANE_ADULT } from './drills/midtbane';
import { ANGREP_YOUTH, ANGREP_ADULT } from './drills/angrep';
import { CARDIO_YOUTH, CARDIO_ADULT } from './drills/cardio';
import { STYRKE_YOUTH, STYRKE_ADULT } from './drills/styrke';

/**
 * Alle øvelser i biblioteket, samlet fra de seks kategorifilene.
 * Rekkefølge: keeper, forsvar, midtbane, angrep, cardio, styrke.
 * Innen hver kategori: barn (youth) først, deretter voksne (adult).
 */
export const ALL_DRILLS: DrillExercise[] = [
  ...KEEPER_YOUTH,
  ...KEEPER_ADULT,
  ...FORSVAR_YOUTH,
  ...FORSVAR_ADULT,
  ...MIDTBANE_YOUTH,
  ...MIDTBANE_ADULT,
  ...ANGREP_YOUTH,
  ...ANGREP_ADULT,
  ...CARDIO_YOUTH,
  ...CARDIO_ADULT,
  ...STYRKE_YOUTH,
  ...STYRKE_ADULT,
];

/** Alle øvelser i én kategori (barn og voksne). */
export function getDrillsByCategory(category: DrillCategory): DrillExercise[] {
  return ALL_DRILLS.filter((drill) => drill.category === category);
}

/** Alle øvelser for én aldersgruppe ('youth' = barn, 'adult' = voksne). */
export function getDrillsByAgeGroup(
  ageGroup: 'youth' | 'adult',
): DrillExercise[] {
  return ALL_DRILLS.filter((drill) => drill.ageGroup === ageGroup);
}

/**
 * Alle øvelser som passer for et aldersbånd.
 * En øvelse kan ha flere bånd (f.eks. ['6-7', '8-9']), og treffer da begge.
 */
export function getDrillsByAgeBand(ageBand: DrillAgeBand): DrillExercise[] {
  return ALL_DRILLS.filter((drill) => drill.ageBand.includes(ageBand));
}

export const CATEGORY_LABELS: Record<DrillCategory, string> = {
  keeper:   'Keeper',
  forsvar:  'Forsvar',
  midtbane: 'Midtbane',
  angrep:   'Angrep',
  cardio:   'Cardio',
  styrke:   'Styrke',
};

// Kontroll av antall og unike id-er (kun i utvikling).
// Forventet: 8+10 keeper, 15+15 forsvar, 15+15 midtbane, 15+15 angrep,
// 10+10 cardio, 12+13 styrke = 153.
const EXPECTED_TOTAL = 153;

if (process.env.NODE_ENV !== 'production') {
  if (ALL_DRILLS.length !== EXPECTED_TOTAL) {
    console.warn(
      `[drills] Forventet ${EXPECTED_TOTAL} øvelser, fant ${ALL_DRILLS.length}.`,
    );
  }
  const ids = new Set<string>();
  for (const drill of ALL_DRILLS) {
    if (ids.has(drill.id)) {
      console.warn(`[drills] Duplikat-id: ${drill.id}`);
    }
    ids.add(drill.id);
  }
}