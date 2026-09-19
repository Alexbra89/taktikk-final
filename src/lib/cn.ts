/**
 * Slår sammen klassenavn og hopper over falsy verdier.
 * Bevisst liten – appen har ingen clsx/tailwind-merge-avhengighet,
 * og rekkefølgekonflikter unngås ved at komponentene tar imot
 * className sist i lista.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
