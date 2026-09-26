'use client';
import React, { useMemo, useState } from 'react';
import { Plus, Copy, Check, Trash2, ChevronDown, Swords, FileText, ThumbsUp, ThumbsDown, CalendarDays } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { ReportTag } from '@/types';
import { TAG_CONFIG } from '@/components/ui/MatchReport';
import { PRIMARY_BTN, SECONDARY_BTN, ICON_BTN } from '@/lib/formClasses';
import { cn } from '@/lib/cn';
import { NAV } from '@/components/layout/navigation';
import { ViewHeader, Tile, TileHeader, TileEmpty, StatTile, IconTile } from '@/components/layout/Surface';
import { localIso } from '@/components/dashboard/tasks';

// ═══════════════════════════════════════════════════════════════
//  RAPPORTER – kamprapportene som hovedområde.
//  Leser matchReports og kampene i kalenderen som de er. Ny rapport
//  lages i den eksisterende kamprapport-dialogen (onNewReport).
// ═══════════════════════════════════════════════════════════════

const TAG = Object.fromEntries(TAG_CONFIG.map(t => [t.tag, t])) as Record<ReportTag, (typeof TAG_CONFIG)[number]>;

const fmtDate = (iso: string) =>
  new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });

export const ReportsView: React.FC<{ onNewReport: (eventId?: string) => void }> = ({ onNewReport }) => {
  const matchReports = useAppStore(s => s.matchReports);
  const events       = useAppStore(s => s.events);
  const deleteReport = useAppStore(s => s.deleteReport);

  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const today = localIso(new Date());
  const reports = useMemo(() => [...matchReports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [matchReports]);
  const played = events.filter(e => e.type === 'match' && e.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  const reported = new Set(matchReports.map(r => r.eventId).filter(Boolean));
  const missing = played.filter(e => !reported.has(e.id));

  const tagCounts = useMemo(() => {
    const m = new Map<ReportTag, number>();
    matchReports.forEach(r => r.tags.forEach(t => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [matchReports]);
  const topPositive = tagCounts.find(([t]) => TAG[t]?.positive);
  const topNegative = tagCounts.find(([t]) => TAG[t] && !TAG[t].positive);

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(c => (c === id ? null : c)), 2000);
    } catch { /* brukeren kan merke teksten selv */ }
  };

  const askDelete = (id: string, title: string) => {
    if (window.confirm(`Slette rapporten «${title}»?`)) deleteReport(id);
  };

  const newBtn = (
    <button onClick={() => onNewReport()} className={PRIMARY_BTN}>
      <Plus size={15} strokeWidth={2} aria-hidden /> Ny kamprapport
    </button>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ViewHeader eyebrow="Arbeid" title="Rapporter" subtitle="Kamprapporter og det laget ditt går igjen på" actions={newBtn} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
          <div className="sm:hidden">{newBtn}</div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatTile icon={FileText} tone={NAV.reports.tile} label="Rapporter" value={matchReports.length} />
            <StatTile icon={Swords} tone="bg-signal/15 text-signal" label="Spilte kamper" value={played.length}
              hint={missing.length ? `${missing.length} uten rapport` : 'Alle har rapport'} />
            <StatTile icon={ThumbsUp} tone="bg-ok-500/15 text-ok-400" label="Styrke oftest"
              value={topPositive ? topPositive[1] : '–'} hint={topPositive ? TAG[topPositive[0]].label : 'Ingen ennå'} />
            <StatTile icon={ThumbsDown} tone="bg-bad-500/15 text-bad-400" label="Forbedring oftest"
              value={topNegative ? topNegative[1] : '–'} hint={topNegative ? TAG[topNegative[0]].label : 'Ingen ennå'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 items-start">
            <Tile aria-label="Rapporthistorikk" className="lg:col-span-2">
              <TileHeader icon={FileText} tone={NAV.reports.tile} title="Historikk"
                subtitle={reports.length ? `${reports.length} rapporter, nyeste først` : 'Ingen rapporter ennå'} />
              {reports.length === 0 ? (
                <TileEmpty action={newBtn}>Rapportene du skriver etter kamp havner her.</TileEmpty>
              ) : (
                <ul className="space-y-2">
                  {reports.map(r => {
                    const ev = r.eventId ? events.find(e => e.id === r.eventId) : undefined;
                    const title = r.matchTitle || ev?.title || 'Kamprapport';
                    const open = openId === r.id;
                    return (
                      <li key={r.id} className="rounded-panel border border-rule bg-canvas-raised/50">
                        <div className="flex items-start gap-2 p-3">
                          <button onClick={() => setOpenId(open ? null : r.id)} aria-expanded={open}
                            className="tap-auto flex-1 min-w-0 text-left">
                            <span className="flex items-center gap-2">
                              <span className="text-body font-bold text-ink truncate">{title}</span>
                              <ChevronDown size={14} aria-hidden
                                className={cn('flex-shrink-0 text-ink-subtle transition-transform', open && 'rotate-180')} />
                            </span>
                            <span className="block text-meta text-ink-subtle mt-0.5">
                              {fmtDate(r.createdAt)}{ev ? ` · kamp ${fmtDate(ev.date)}` : ''}
                            </span>
                            {r.tags.length > 0 && (
                              <span className="mt-2 flex flex-wrap gap-1">
                                {r.tags.map(t => (
                                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-canvas-panel shadow-hair text-meta text-ink-muted">
                                    <span aria-hidden className={cn('w-1.5 h-1.5 rounded-full', TAG[t]?.positive ? 'bg-ok-400' : 'bg-bad-400')} />
                                    {TAG[t]?.label ?? t}
                                  </span>
                                ))}
                              </span>
                            )}
                          </button>
                          <button onClick={() => copy(r.id, r.generatedText)} aria-label={`Kopier ${title}`} className={ICON_BTN}>
                            {copiedId === r.id ? <Check size={15} /> : <Copy size={15} />}
                          </button>
                          <button onClick={() => askDelete(r.id, title)} aria-label={`Slett ${title}`} className={ICON_BTN}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {open && (
                          <pre className="mx-3 mb-3 p-3 rounded-ctl bg-canvas-sunken shadow-hair text-caption text-ink-muted whitespace-pre-wrap font-sans leading-relaxed">
                            {r.generatedText}
                          </pre>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Tile>

            <Tile aria-label="Kamper uten rapport">
              <TileHeader icon={CalendarDays} tone={NAV.calendar.tile} title="Mangler rapport"
                subtitle={missing.length ? `${missing.length} spilte kamper` : 'Ingen'} />
              {missing.length === 0 ? (
                <TileEmpty>Alle spilte kamper i kalenderen har rapport.</TileEmpty>
              ) : (
                <ul className="space-y-2">
                  {missing.slice(0, 8).map(e => (
                    <li key={e.id} className="flex items-center gap-3">
                      <IconTile icon={Swords} tone="bg-signal/15 text-signal" size="sm" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-body font-semibold text-ink truncate">
                          {e.opponent ? `Mot ${e.opponent}` : e.title}
                        </span>
                        <span className="block text-meta text-ink-subtle">{fmtDate(e.date)}{e.result ? ` · ${e.result}` : ''}</span>
                      </span>
                      <button onClick={() => onNewReport(e.id)} className={cn(SECONDARY_BTN, 'min-h-[36px] px-3 text-caption')}>
                        Skriv
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Tile>
          </div>
        </div>
      </div>
    </div>
  );
};
