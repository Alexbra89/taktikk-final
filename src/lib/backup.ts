// ══════════════════════════════════════════════════════════════
//  BACKUP – eksport og import av alt brukeren eier
//
//  Alt skjer lokalt i nettleseren. Ingen server, ingen opplasting:
//  filen havner i nedlastingsmappa, og brukeren flytter den selv
//  via e-post, Dropbox eller minnepinne. Det er også hele poenget –
//  dataene ligger i localStorage, som forsvinner med nettleseren.
// ══════════════════════════════════════════════════════════════

import type { Theme } from '@/hooks/useTheme';

/** Kjennemerke i filen, så vi ikke prøver å lese en vilkårlig JSON. */
export const BACKUP_FORMAT = 'taktikkboard-backup';
/** Økes bare hvis selve konvolutten endrer form – ikke ved datamodellendringer. */
export const BACKUP_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  /** Med for at en bruker skal kjenne igjen filen sin. */
  teamName: string;
  theme: Theme | null;
  /** Nøyaktig det zustand selv lagrer (partialize). */
  data: Record<string, unknown>;
}

export function buildBackup(args: {
  data: Record<string, unknown>;
  teamName: string;
  theme: Theme | null;
}): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    teamName: args.teamName,
    theme: args.theme,
    data: args.data,
  };
}

/** `taktikk-sotra-sk-2026-09-20.json` */
export function backupFilename(teamName: string, when = new Date()): string {
  const slug = (teamName || 'lag')
    .toLowerCase()
    .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'lag';
  const d = when.toISOString().slice(0, 10);
  return `taktikk-${slug}-${d}.json`;
}

export type ParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string };

/**
 * Validerer konvolutten. Selve innholdet repareres av storen etterpå
 * (samme vei som data fra localStorage går), så her sjekker vi bare at
 * dette faktisk er en backupfil vi kan gjøre noe fornuftig med.
 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Filen er ikke gyldig JSON.' };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Filen inneholder ikke et objekt.' };
  }
  const o = raw as Record<string, unknown>;
  if (o.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'Dette ser ikke ut som en backup fra Taktikkboard.' };
  }
  if (typeof o.version !== 'number' || o.version > BACKUP_VERSION) {
    return { ok: false, error: 'Filen er laget av en nyere versjon av appen.' };
  }
  if (!o.data || typeof o.data !== 'object' || Array.isArray(o.data)) {
    return { ok: false, error: 'Filen mangler datadelen.' };
  }
  const data = o.data as Record<string, unknown>;
  if (!Array.isArray(data.tactics)) {
    return { ok: false, error: 'Filen mangler taktikker og kan ikke importeres.' };
  }
  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      version: o.version,
      exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : '',
      teamName: typeof o.teamName === 'string' ? o.teamName : '',
      theme: o.theme === 'dark' || o.theme === 'light' ? o.theme : null,
      data,
    },
  };
}

/** Kort oppsummering vist i bekreftelsesdialogen før overskriving. */
export function describeBackup(b: BackupFile): string {
  const d = b.data;
  const n = (k: string) => Array.isArray(d[k]) ? (d[k] as unknown[]).length : 0;
  const parts = [
    `${n('tactics')} ${n('tactics') === 1 ? 'taktikk' : 'taktikker'}`,
    `${n('events')} hendelser`,
    `${n('matchReports')} rapporter`,
    `${n('moments')} øyeblikk`,
  ];
  return parts.join(' · ');
}

/** Laster ned teksten som fil. Objekt-URL-en ryddes opp etterpå. */
export function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
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
