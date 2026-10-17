/** Har øvelsen en skissebeskrivelse i det hele tatt? Dette er sjekken
 *  øvelseslista bruker til bane-ikonet. */
export function hasSketch(sketch?: string): boolean {
  return Boolean(sketch && sketch.trim());
}
