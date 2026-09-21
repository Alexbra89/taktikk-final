// ══════════════════════════════════════════════════════════════
//  NEDLASTING – felles for backup (JSON) og bilde-eksport (PNG)
// ══════════════════════════════════════════════════════════════

/** «Sotra SK» → `sotra-sk`. Tom eller bare tegn → `fallback`. */
export function slugify(text: string, fallback: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

/** Laster ned blob-en som fil. Objekt-URL-en ryddes opp etterpå. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke etter at nedlastingen har startet – umiddelbar revoke
  // avbryter den i enkelte nettlesere.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
