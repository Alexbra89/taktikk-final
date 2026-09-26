'use client';
import React, { useRef, useState } from 'react';
import { Sun, Moon, Baby, User, Check, AlertTriangle, Download, Upload, Users, Palette, Database, Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BTN, SECONDARY_BTN, toggleClass } from '@/lib/formClasses';
import { buildBackup, backupFilename, parseBackup, describeBackup, downloadJson, type BackupFile } from '@/lib/backup';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { ViewHeader, Tile, TileHeader } from '@/components/layout/Surface';

// ═══════════════════════════════════════════════════════════════
//  INNSTILLINGER – lag, utseende, øvelsesnivå og backup.
//  Flyttet fra innstillingsdialogen i page.tsx; logikken er den samme.
// ═══════════════════════════════════════════════════════════════

// ─── DATA: EKSPORT OG IMPORT ─────────────────────────────────
// Alt skjer lokalt. Filen lastes ned til enheten, og brukeren flytter
// den selv videre – ingen server er involvert.
const DataSection: React.FC = () => {
  const { homeTeamName, lastExportedAt, exportSnapshot, markExported, importSnapshot } = useAppStore();
  const { theme, setTheme } = useTheme();

  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [pending, setPending] = useState<BackupFile | null>(null);

  const doExport = () => {
    setError(''); setDone('');
    try {
      const backup = buildBackup({ data: exportSnapshot(), teamName: homeTeamName, theme });
      downloadJson(backupFilename(homeTeamName), JSON.stringify(backup, null, 2));
      markExported();
      setDone('Backup lastet ned.');
    } catch {
      setError('Klarte ikke å lage filen. Er det plass på enheten?');
    }
  };

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); setDone(''); setPending(null);
    const file = e.target.files?.[0];
    // Nullstill med én gang, så samme fil kan velges på nytt etterpå.
    e.target.value = '';
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError('Klarte ikke å lese filen.');
      return;
    }
    const res = parseBackup(text);
    if (!res.ok) { setError(res.error); return; }
    setPending(res.backup);
  };

  const confirmImport = () => {
    if (!pending) return;
    try {
      importSnapshot(pending.data);
    } catch {
      // Dataene dine er urørt: importen erstatter først når alt er vasket.
      setPending(null);
      setError('Klarte ikke å importere filen. Dataene dine er ikke endret.');
      return;
    }
    if (pending.theme) setTheme(pending.theme);
    setPending(null);
    setDone('Dataene er importert.');
  };

  const exportedLabel = lastExportedAt
    ? new Date(lastExportedAt).toLocaleString('nb-NO', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div>
      <p className="text-body text-ink-muted">
        Alt lagres bare på denne enheten. Eksporter en backup-fil jevnlig, og importer den for å flytte dataene.
      </p>

      <div className="mt-3 flex gap-2">
        <button onClick={doExport} className={`flex-1 ${SECONDARY_BTN}`}>
          <Download size={15} strokeWidth={1.75} aria-hidden /> Eksporter
        </button>
        <button onClick={() => fileRef.current?.click()} className={`flex-1 ${SECONDARY_BTN}`}>
          <Upload size={15} strokeWidth={1.75} aria-hidden /> Importer
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json"
          onChange={pickFile} className="hidden" aria-hidden tabIndex={-1} />
      </div>

      <p className="mt-1.5 text-meta text-ink-subtle">
        {exportedLabel ? `Sist eksportert: ${exportedLabel}` : 'Aldri eksportert.'}
      </p>

      {/* Import overskriver alt, så den skal bekreftes – med tall på bordet. */}
      {pending && (
        <div className="mt-3 rounded-panel border border-warn-500/40 bg-warn-500/10 p-3">
          <div className="flex gap-2.5">
            <AlertTriangle size={16} strokeWidth={1.75} aria-hidden
              className="text-warn-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-body text-warn-300 leading-relaxed">
                Dette erstatter alt du har nå.
              </p>
              <p className="mt-1 text-meta text-ink-muted">
                {pending.teamName || 'Ukjent lag'} · {describeBackup(pending)}
                {pending.exportedAt && ` · ${new Date(pending.exportedAt).toLocaleDateString('nb-NO')}`}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={confirmImport} className={`flex-1 ${PRIMARY_BTN}`}>
              Erstatt alt
            </button>
            <button onClick={() => setPending(null)} className={SECONDARY_BTN}>
              Avbryt
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-caption text-signal">{error}</p>}
      {done && !error && <p role="status" className="mt-2 text-caption text-ink-muted">{done}</p>}
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const { homeTeamName, setHomeTeamName, ageGroup, setAgeGroup } = useAppStore();
  const { theme, setTheme } = useTheme();

  const [home, setHome] = useState(homeTeamName);
  const [saved, setSaved] = useState(false);
  const dirty = home.trim() !== '' && home.trim() !== homeTeamName;

  const save = () => {
    if (home.trim()) setHomeTeamName(home.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ViewHeader title="Innstillinger" subtitle="Lag, utseende, øvelsesnivå og backup" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid gap-4 md:grid-cols-2 items-start">
          <Tile aria-label="Laget">
            <TileHeader icon={Users} tone="bg-signal/15 text-signal" title="Laget" subtitle="Vises i sidefeltet og på rapporter" />
            <label className={LABEL_CLASS} htmlFor="sett-lagnavn">Ditt lagnavn</label>
            <div className="flex gap-2 mt-1.5">
              <input id="sett-lagnavn" value={home} onChange={e => setHome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && dirty) save(); }}
                className={cn(INPUT_CLASS, 'mt-0')} placeholder="Eks: Sotra SK" />
              <button onClick={save} disabled={!dirty && !saved} className={PRIMARY_BTN}>
                {saved ? <><Check size={15} strokeWidth={2} aria-hidden /> Lagret</> : 'Lagre'}
              </button>
            </div>
          </Tile>

          <Tile aria-label="Utseende">
            <TileHeader icon={Palette} tone="bg-area-drills/15 text-area-drills" title="Utseende" subtitle="Kveld for skjerm, dagslys for sidelinja i sol" />
            <div role="radiogroup" aria-label="Tema" className="flex p-0.5 rounded-ctl bg-canvas-raised shadow-hair">
              {([
                { v: 'dark',  label: 'Kveld',   icon: Moon },
                { v: 'light', label: 'Dagslys', icon: Sun },
              ] as const).map(({ v, label, icon: Icon }) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={theme === v}
                  onClick={() => setTheme(v)}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-[6px] text-body transition-colors',
                    theme === v ? 'bg-canvas-panel text-ink shadow-hair-strong' : 'text-ink-subtle hover:text-ink',
                  )}
                >
                  <Icon size={14} strokeWidth={1.75} aria-hidden /> {label}
                </button>
              ))}
            </div>
          </Tile>

          <Tile aria-label="Aldersgruppe">
            <TileHeader icon={Baby} tone="bg-area-training/15 text-area-training" title="Aldersgruppe" subtitle="Styrer hvilke øvelser som vises" />
            <div className="flex gap-2">
              {([
                { v: 'youth', label: 'Barn',   hint: 'lettere',      icon: Baby },
                { v: 'adult', label: 'Voksne', hint: 'mer krevende', icon: User },
              ] as const).map(({ v, label, hint, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setAgeGroup(v)}
                  aria-pressed={ageGroup === v}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] rounded-ctl transition-colors',
                    toggleClass(ageGroup === v),
                  )}
                >
                  <span className="inline-flex items-center gap-1.5 text-body font-bold">
                    <Icon size={14} strokeWidth={1.75} aria-hidden /> {label}
                  </span>
                  <span className="text-meta opacity-70">{hint}</span>
                </button>
              ))}
            </div>
          </Tile>

          <Tile aria-label="Data">
            <TileHeader icon={Database} tone="bg-area-calendar/15 text-area-calendar" title="Data og backup" />
            <DataSection />
          </Tile>

          <Tile aria-label="Om appen" className="md:col-span-2">
            <TileHeader icon={Info} tone="bg-canvas-raised text-ink-muted" title="Om Taktikkboard" />
            <p className="text-body text-ink-muted">
              Taktikkboard fungerer uten nett og lagrer alt lokalt. AI-treneren trenger nett og en tilgangskode,
              som lagres bare på denne enheten. Tegn fasen på brettet, planlegg trening og skriv rapport – alt på ett sted.
            </p>
          </Tile>
        </div>
      </div>
    </div>
  );
};
