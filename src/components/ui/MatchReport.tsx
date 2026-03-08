'use client';
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ReportTag } from '../../types';

// ═══════════════════════════════════════════════════════════════
//  KAMPRAPPORT – Generer og kopier rapport etter kamp
// ═══════════════════════════════════════════════════════════════

const TAG_CONFIG: { tag: ReportTag; label: string; emoji: string; positive: boolean }[] = [
  { tag: 'god_gjennomforing',     label: 'God gjennomføring',      emoji: '✅', positive: true  },
  { tag: 'manglet_konsentrasjon', label: 'Manglet konsentrasjon',   emoji: '😕', positive: false },
  { tag: 'god_pressing',          label: 'God pressing',           emoji: '🔥', positive: true  },
  { tag: 'svak_forsvarsstilling', label: 'Svak forsvarsstilling',   emoji: '🚨', positive: false },
  { tag: 'fin_pasningsspill',     label: 'Fint pasningsspill',      emoji: '🎯', positive: true  },
  { tag: 'mange_balltap',         label: 'Mange balltap',           emoji: '⚠️', positive: false },
  { tag: 'god_kommunikasjon',     label: 'God kommunikasjon',       emoji: '📢', positive: true  },
  { tag: 'manglet_tempo',         label: 'Manglet tempo',           emoji: '🐢', positive: false },
  { tag: 'sterk_defensiv',        label: 'Sterk defensiv innsats',  emoji: '🛡️', positive: true  },
  { tag: 'misset_sjanser',        label: 'Misset sjanser',          emoji: '😬', positive: false },
];

export const MatchReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { createReport, matchReports, deleteReport, events } = useAppStore();

  const [view, setView]             = useState<'create' | 'history'>('create');
  const [selectedTags, setSelectedTags] = useState<ReportTag[]>([]);
  const [freeText, setFreeText]     = useState('');
  const [matchTitle, setMatchTitle] = useState('');
  const [eventId, setEventId]       = useState('');
  const [generated, setGenerated]   = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);

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
      // Fallback: select all text
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

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-[#0c1525] border border-[#1e3050] rounded-2xl w-[500px] max-w-full max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e3050]">
          <h2 className="text-sm font-black text-slate-100">📊 Kamprapport</h2>
          <div className="flex gap-2 items-center">
            <div className="flex border border-[#1e3050] rounded-lg overflow-hidden">
              {([['create','Ny'],['history','Tidligere']] as const).map(([v,l]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1 text-[11px] font-semibold transition-all
                    ${view === v ? 'bg-sky-500/20 text-sky-400' : 'text-[#4a6080] hover:text-slate-300'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-[#3a5070] hover:text-white text-xl ml-1">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">

          {/* ── LAG RAPPORT ── */}
          {view === 'create' && !generated && (
            <div>
              {/* Kamptittel */}
              <div className="mb-4">
                <label className="block text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">
                  Kamptittel (valgfritt)
                </label>
                <input value={matchTitle} onChange={e => setMatchTitle(e.target.value)}
                  placeholder="f.eks. Seriekamp mot FK Ørn"
                  className="inp" />
              </div>

              {/* Koble til kalender-kamp */}
              {matchEvents.length > 0 && (
                <div className="mb-4">
                  <label className="block text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">
                    Koble til kamp i kalender
                  </label>
                  <select value={eventId} onChange={e => setEventId(e.target.value)}
                    className="inp">
                    <option value="">– Ingen –</option>
                    {matchEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.date} · {ev.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tags */}
              <div className="mb-5">
                <div className="text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-2">
                  Velg kategorier (trykk flere)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {TAG_CONFIG.map(({ tag, label, emoji, positive }) => {
                    const sel = selectedTags.includes(tag);
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11.5px] font-semibold border transition-all text-left
                          ${sel
                            ? positive
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                              : 'bg-red-500/15 border-red-500 text-red-400'
                            : 'border-[#1e3050] text-[#4a6080] hover:text-slate-300 hover:border-[#2e4060]'}`}>
                        <span>{emoji}</span>
                        <span className="leading-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fritekst */}
              <div className="mb-5">
                <label className="block text-[9.5px] font-bold text-[#3a5070] uppercase tracking-wider mb-1.5">
                  Tilleggskommentarer
                </label>
                <textarea value={freeText} onChange={e => setFreeText(e.target.value)}
                  rows={3} placeholder="Spesifikke observasjoner, ros til enkeltspillere, forbedringspunkter..."
                  className="inp resize-y leading-relaxed" />
              </div>

              <button onClick={generate}
                disabled={selectedTags.length === 0 && !freeText.trim()}
                className="w-full py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-[13px] hover:bg-sky-500/25 transition disabled:opacity-40">
                ⚡ Generer rapport
              </button>
            </div>
          )}

          {/* ── GENERERT RAPPORT ── */}
          {view === 'create' && generated && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-semibold">Rapport generert</span>
              </div>

              <pre className="bg-[#0a1520] border border-[#1e3050] rounded-xl p-4 text-[12px] text-slate-300
                leading-relaxed whitespace-pre-wrap font-mono mb-4 max-h-60 overflow-y-auto">
                {generated}
              </pre>

              <div className="flex gap-2 mb-4">
                <button onClick={copy}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-[12.5px] border transition-all
                    ${copied
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-[#111c30] border-[#1e3050] text-slate-300 hover:border-sky-500/40 hover:text-sky-400'}`}>
                  {copied ? '✓ Kopiert!' : '📋 Kopier tekst'}
                </button>
                <button onClick={mailTo}
                  className="flex-1 py-2.5 rounded-xl font-bold text-[12.5px] border border-[#1e3050] text-slate-300 hover:border-sky-500/40 hover:text-sky-400 transition">
                  ✉️ Send e-post
                </button>
              </div>

              <button onClick={reset}
                className="w-full py-2 rounded-xl border border-[#1e3050] text-[#4a6080] text-[11.5px] hover:text-slate-300 transition">
                ← Lag ny rapport
              </button>
            </div>
          )}

          {/* ── HISTORIKK ── */}
          {view === 'history' && (
            <div>
              {matchReports.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-[12px] text-[#4a6080]">Ingen rapporter ennå.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...matchReports].reverse().map(r => (
                    <div key={r.id} className="bg-[#0f1a2a] rounded-xl border border-[#1e3050] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e3050]">
                        <div>
                          <div className="text-[12.5px] font-bold text-slate-200">
                            {r.matchTitle || 'Kamprapport'}
                          </div>
                          <div className="text-[10px] text-[#4a6080]">
                            {new Date(r.createdAt).toLocaleDateString('nb-NO', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={async () => {
                            await navigator.clipboard.writeText(r.generatedText).catch(() => {});
                          }}
                            className="text-[10px] text-[#4a6080] hover:text-sky-400 px-2 py-1 border border-[#1e3050] rounded">
                            📋
                          </button>
                          <button onClick={() => deleteReport(r.id)}
                            className="text-[10px] text-[#4a6080] hover:text-red-400 px-2 py-1 border border-[#1e3050] rounded">
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {r.tags.map(t => {
                            const tc = TAG_CONFIG.find(x => x.tag === t);
                            return tc ? (
                              <span key={t}
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold
                                  ${tc.positive
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                {tc.emoji} {tc.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                        {r.freeText && (
                          <p className="text-[11px] text-[#7a9ab8] italic leading-relaxed">
                            "{r.freeText.slice(0, 120)}{r.freeText.length > 120 ? '…' : ''}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <style>{`.inp { width:100%; background:#111c30; border:1px solid #1e3050; border-radius:8px; padding:8px 11px; color:#e2e8f0; font-size:12.5px; box-sizing:border-box; } .inp:focus { outline:none; border-color:#38bdf8; }`}</style>
      </div>
    </div>
  );
};
