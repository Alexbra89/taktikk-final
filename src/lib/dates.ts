/** Kalenderdato i brukerens tidssone, uten omveien via UTC. */
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Flytt kalenderdager, også når døgnet er 23 eller 25 timer. */
export function localDateOffset(days: number, date = new Date()): string {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return localDate(shifted);
}
