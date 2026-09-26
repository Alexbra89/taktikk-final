'use client';
import React, { useState } from 'react';
import { Copy, Check, Mail, ArrowLeft, Trash2, FileText } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { ReportTag } from '@/types';
import { Modal, Badge, EmptyState, IconButton } from '@/components/ui';
import { INPUT_CLASS, TEXTAREA_CLASS, LABEL_CLASS, PRIMARY_BTN, SECONDARY_BTN, toggleClass } from '@/lib/formClasses';
import { cn } from '@/lib/cn';

// ═══════════════════════════════════════════════════════════════
//  KAMPRAPPORT – Generer og kopier rapport etter kamp.
//  Kalk: signal markerer valgt kategori, ok/bad kun som prikk –
//  om et punkt er ros eller kritikk er informasjon, ikke handling.
// ═══════════════════════════════════════════════════════════════

export const TAG_CONFIG: { tag: ReportTag; label: string; positive: boolean }[] = [
  { tag: 'god_gjennomforing',     label: 'God gjennomføring',      positive: true  },
  { tag: 'manglet_konsentrasjon', label: 'Manglet konsentrasjon',  positive: false },
  { tag: 'god_pressing',          label: 'God pressing',           positive: true  },
  { tag: 'svak_forsvarsstilling', label: 'Svak forsvarsstilling',  positive: false },
  { tag: 'fin_pasningsspill',     label: 'Fint pasningsspill',     positive: true  },
  { tag: 'mange_balltap',         label: 'Mange balltap',          positive: false },
  { tag: 'god_kommunikasjon',     label: 'God kommunikasjon',      positive: true  },
  { tag: 'manglet_tempo',         label: 'Manglet tempo',          positive: false },
  { tag: 'sterk_defensiv',        label: 'Sterk defensiv innsats', positive: true  },
  { tag: 'misset_sjanser',        label: 'Misset sjanser',         positive: false },
];

const VIEWS = [
  { v: 'create'  as const, label: 'Ny' },
  { v: 'history' as const, label: 'Tidligere' },
];

export const MatchReportModal: React.FC<{
  onClose: () => void;
  /** Kobler rapporten til en kamp fra start, f.eks. fra Rapporter-siden. */
  initialEventId?: string;
}> = ({ onClose, initialEventId }) => {
  const { createReport, matchReports, deleteReport, events } = useAppStore();
  const initialEvent = initialEventId ? events.find(e => e.id === initialEventId) : undefined;

  const [view, setView]                 = useState<'create' | 'history'>('create');
  const [selectedTags, setSelectedTags] = useState<ReportTag[]>([]);
  const [freeText, setFreeText]         = useState('');
  const [matchTitle, setMatchTitle]     = useState(initialEvent?.title ?? '');
  const [eventId, setEventId]           = useState(initialEvent?.id ?? '');
  const [generated, setGenerated]       = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);

  const matchEvents = events.filter(e => e.type === 'match');

  const toggleTag = (tag: ReportTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const generate = () => {
    const report = createReport(selectedTags, freeText, matchTitle || undefined, eventId || undefined);
    setGenerated(report.generatedText);
  };

  const copy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: brukeren merker teksten selv
    }
  };

  const mailTo = () => {
    if (!generated) return;
    const subject = encodeURIComponent(`Kamprapport: ${matchTitle || 'Kamp'}`);
    const body = encodeURIComponent(generated);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const reset = () => {
    setSelectedTags([]);
    setFreeText('');
    setMatchTitle('');
    setGenerated(null);
  };

  // Bunnlinja bærer hovedhandlingen og endrer seg med steget man står i.
  const footer =
    view === 'create' && !generated ? (
      <button onClick={generate}
        disabled={selectedTags.length === 0 && !freeText.trim()}
        className={`w-full ${PRIMARY_BTN}`}>
        Generer rapport
      </button>
    ) : view === 'create' && generated ? (
      <div className="flex gap-2">
        <button onClick={copy} className={`flex-1 ${copied ? SECONDARY_BTN : PRIMARY_BTN}`}>
          {copied
            ? <><Check size={15} strokeWidth={2} aria-hidden /> Kopiert</>
            : <><Copy size={15} strokeWidth={1.75} aria-hidden /> Kopier tekst</>}
        </button>
        <button onClick={mailTo} className={SECONDARY_BTN}>
          <Mail size={15} strokeWidth={1.75} aria-hidden /> E-post
        </button>
      </div>
    ) : undefined;

  return (
    <Modal
      onClose={onClose}
      size="md"
      title={<span className="font-serif text-[1.5rem] leading-tight">Kamprapport</span>}
      subtitle={
        <div role="tablist" aria-label="Kamprapport" className="flex gap-1.5">
          {VIEWS.map(({ v, label }) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={cn(
                'px-3 min-h-[36px] rounded-ctl text-body font-semibold transition-colors',
                toggleClass(view === v),
              )}>
              {label}
            </button>
          ))}
        </div>
      }
      footer={footer}
    >
      {/* ── LAG RAPPORT ── */}
      {view === 'create' && !generated && (
        <div className="space-y-5">
          <div>
            <label className={LABEL_CLASS} htmlFor="rap-tittel">Kamptittel (valgfritt)</label>
            <input id="rap-tittel" value={matchTitle} onChange={e => setMatchTitle(e.target.value)}
              placeholder="F.eks. Seriekamp mot FK Ørn" className={INPUT_CLASS} />
          </div>

          {matchEvents.length > 0 && (
            <div>
              <label className={LABEL_CLASS} htmlFor="rap-kamp">Koble til kamp i kalender</label>
              <select id="rap-kamp" value={eventId} onChange={e => setEventId(e.target.value)}
                className={INPUT_CLASS}>
                <option value="">– Ingen –</option>
                {matchEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.date} · {ev.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className={LABEL_CLASS}>Velg kategorier (trykk flere)</div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {TAG_CONFIG.map(({ tag, label, positive }) => {
                const sel = selectedTags.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    aria-pressed={sel}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-ctl',
                      'text-body font-semibold text-left transition-colors',
                      toggleClass(sel),
                    )}>
                    <span aria-hidden className={cn(
                      'h-1.5 w-1.5 rounded-full flex-shrink-0',
                      positive ? 'bg-ok-400' : 'bg-bad-400',
                    )} />
                    <span className="leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS} htmlFor="rap-fritekst">Tilleggskommentarer</label>
            <textarea id="rap-fritekst" value={freeText} onChange={e => setFreeText(e.target.value)}
              rows={3} placeholder="Spesifikke observasjoner, ros til enkeltspillere, forbedringspunkter …"
              className={TEXTAREA_CLASS} />
          </div>
        </div>
      )}

      {/* ── GENERERT RAPPORT ── */}
      {view === 'create' && generated && (
        <div>
          <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-2">
            Rapport generert
          </div>

          <pre className="rounded-panel bg-canvas-sunken shadow-hair p-4 mb-4 max-h-60 overflow-y-auto
            font-mono text-caption text-ink-muted leading-relaxed whitespace-pre-wrap">
            {generated}
          </pre>

          <button onClick={reset} className={`w-full ${SECONDARY_BTN}`}>
            <ArrowLeft size={15} strokeWidth={1.75} aria-hidden /> Lag ny rapport
          </button>
        </div>
      )}

      {/* ── HISTORIKK ── */}
      {view === 'history' && (
        matchReports.length === 0 ? (
          <EmptyState
            icon={<FileText size={26} strokeWidth={1.5} />}
            title="Ingen rapporter ennå"
            hint="Lag en rapport under «Ny», så dukker den opp her."
          />
        ) : (
          <div className="space-y-3">
            {[...matchReports].reverse().map(r => (
              <div key={r.id} className="rounded-panel bg-canvas-sunken shadow-hair overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-rule">
                  <div className="min-w-0">
                    <div className="text-body font-bold text-ink truncate">
                      {r.matchTitle || 'Kamprapport'}
                    </div>
                    <div className="font-mono text-meta text-ink-subtle">
                      {new Date(r.createdAt).toLocaleDateString('nb-NO', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <IconButton aria-label="Kopier rapport" size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(r.generatedText).catch(() => {});
                      }}>
                      <Copy size={14} strokeWidth={1.75} />
                    </IconButton>
                    <IconButton aria-label="Slett rapport" size="sm"
                      className="hover:text-bad-400"
                      onClick={() => deleteReport(r.id)}>
                      <Trash2 size={14} strokeWidth={1.75} />
                    </IconButton>
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.tags.map(t => {
                      const tc = TAG_CONFIG.find(x => x.tag === t);
                      return tc ? (
                        <Badge key={t} tone={tc.positive ? 'ok' : 'bad'}>{tc.label}</Badge>
                      ) : null;
                    })}
                  </div>
                  {r.freeText && (
                    <p className="text-body text-ink-muted italic leading-relaxed">
                      «{r.freeText.slice(0, 120)}{r.freeText.length > 120 ? '…' : ''}»
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </Modal>
  );
};
