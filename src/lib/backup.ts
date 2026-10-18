import { localDate } from '@/lib/dates';
// ══════════════════════════════════════════════════════════════
//  BACKUP – eksport og import av alt brukeren eier
//
//  Alt skjer lokalt i nettleseren. Ingen server, ingen opplasting:
//  filen havner i nedlastingsmappa, og brukeren flytter den selv
//  via e-post, Dropbox eller minnepinne. Det er også hele poenget –
//  dataene ligger i localStorage, som forsvinner med nettleseren.
// ══════════════════════════════════════════════════════════════

import type { Theme } from '@/hooks/useTheme';
import { slugify, downloadBlob } from '@/lib/download';
import { prepareBackupSnapshot, useAppStore } from '@/store/useAppStore';
import type { PlayerStyle } from '@/hooks/usePlayerStyle';

export interface BackupSettings {
  playerStyle: PlayerStyle;
}

export function isBackupDue(lastExportedAt: string | null, now = Date.now()): boolean {
  const at = lastExportedAt ? Date.parse(lastExportedAt) : NaN;
  return !Number.isFinite(at) || now - at > 30 * 86_400_000;
}

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
  /** Valgfrie tillegg; gamle versjon 1-filer kan fortsatt leses. */
  settings?: BackupSettings;
  /** Lagrede brukerdata og innstillinger, uten enhetens eksporttidspunkt. */
  data: Record<string, unknown>;
}

export function buildBackup(args: {
  data: Record<string, unknown>;
  teamName: string;
  theme: Theme | null;
  settings?: BackupSettings;
}): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    teamName: args.teamName,
    theme: args.theme,
    ...(args.settings ? { settings: { playerStyle: args.settings.playerStyle } } : {}),
    data: JSON.parse(JSON.stringify(args.data)),
  };
}

/** `taktikk-sotra-sk-2026-09-20.json` */
export function backupFilename(teamName: string, when = new Date()): string {
  const d = localDate(when);
  return `taktikk-${slugify(teamName, 'lag')}-${d}.json`;
}

export type ParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string };

/**
 * Kontrollerer hele kopien før brukeren får bekrefte. Ingenting lagres her.
 */
export function parseBackup(text: string, filename?: string): ParseResult {
  const fail = (error: string): ParseResult => ({ ok: false, error: `${error} Dataene dine er ikke endret.` });
  if (filename && !/\.json$/i.test(filename)) return fail('Velg en sikkerhetskopi med filtypen .json.');
  if (!text.trim()) return fail('Filen er tom. Velg en sikkerhetskopi du har eksportert fra appen.');
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('Filen kunne ikke leses som en sikkerhetskopi. Den kan være skadet.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return fail('Filen inneholder ikke en sikkerhetskopi.');
  }
  const o = raw as Record<string, unknown>;
  if (o.format !== BACKUP_FORMAT) {
    return fail('Dette er ikke en sikkerhetskopi fra Taktikkboard.');
  }
  if (typeof o.version !== 'number' || !Number.isInteger(o.version) || o.version < 0) {
    return fail('Filen har et ugyldig versjonsnummer.');
  }
  if (o.version > BACKUP_VERSION) {
    return fail('Filen er laget av en nyere versjon av appen. Oppdater appen før du importerer.');
  }
  if (!o.data || typeof o.data !== 'object' || Array.isArray(o.data)) {
    return fail('Sikkerhetskopien mangler data.');
  }
  const data = o.data as Record<string, unknown>;
  if (!Array.isArray(data.tactics)) {
    return fail('Sikkerhetskopien mangler taktikker og kan ikke importeres.');
  }
  try { prepareBackupSnapshot(data, useAppStore.getState()); }
  catch { return fail('Sikkerhetskopien er skadet eller inneholder ugyldige data.'); }
  if (o.theme !== undefined && o.theme !== null && o.theme !== 'dark' && o.theme !== 'light') {
    return fail('Sikkerhetskopien inneholder et ugyldig tema.');
  }
  const settings = o.settings as BackupSettings | undefined;
  if (settings !== undefined && (!settings || typeof settings !== 'object' || Array.isArray(settings) ||
      !['kit', 'chip'].includes(settings.playerStyle))) {
    return fail('Sikkerhetskopien inneholder ugyldige innstillinger.');
  }
  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      version: o.version,
      exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : '',
      teamName: typeof o.teamName === 'string' ? o.teamName : '',
      theme: o.theme === 'dark' || o.theme === 'light' ? o.theme : null,
      // Gamle kopier kan inneholde aiAccessCode. Ignorer den; importer aldri tilgang.
      ...(settings ? { settings: { playerStyle: settings.playerStyle } } : {}),
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
    `${n('customDrills')} egne øvelser`,
  ];
  return parts.join(' · ');
}

/** Laster ned teksten som fil. */
export function downloadJson(filename: string, json: string): void {
  downloadBlob(filename, new Blob([json], { type: 'application/json' }));
}
