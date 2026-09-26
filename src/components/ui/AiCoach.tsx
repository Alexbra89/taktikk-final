'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, KeyRound, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic } from '@/store/selectors';
import { buildAiContext } from '@/lib/ai/context';
import {
  AI_ACCESS_HEADER, AI_LIMITS, BOARD_MODES, type AiHistoryMessage, type AiMode,
} from '@/lib/ai/request';
import { Modal } from './Modal';
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BTN, SECONDARY_BTN, TEXTAREA_CLASS, toggleClass } from '@/lib/formClasses';
import { cn } from '@/lib/cn';

// ══════════════════════════════════════════════════════════════
//  AI-TRENER – leser brettet og svarer. Endrer aldri noe.
//  Brettet gjøres om til en kompakt kontekst her på enheten
//  (uten spillernavn og interne id-er) før det sendes til /api/ai.
// ══════════════════════════════════════════════════════════════

const CODE_KEY = 'taktikk:ai-access-code';

const MODES: { mode: AiMode; label: string; placeholder: string }[] = [
  { mode: 'ANALYZE_PHASE', label: 'Analyser fase',       placeholder: 'Valgfritt: noe spesielt du vil ha vurdert?' },
  { mode: 'COACHING',      label: 'Hva bør jeg coache?', placeholder: 'Valgfritt: f.eks. «fokus på backene»' },
  { mode: 'DRILL',         label: 'Lag øvelse',          placeholder: 'Valgfritt: antall spillere, tid, fokus …' },
  { mode: 'NEXT_PHASE',    label: 'Foreslå neste fase',  placeholder: 'Valgfritt: hva skal neste fase føre til?' },
  { mode: 'GENERAL',       label: 'Spør AI',             placeholder: 'F.eks. «Hvordan trener jeg høyt press med 12 spillere?»' },
];

interface Turn { role: 'user' | 'assistant'; content: string; label?: string; truncated?: boolean }

const readCode = () => { try { return localStorage.getItem(CODE_KEY) ?? ''; } catch { return ''; } };
const writeCode = (v: string) => {
  try { if (v) localStorage.setItem(CODE_KEY, v); else localStorage.removeItem(CODE_KEY); } catch { /* gjelder denne økten */ }
};

/** **fet**, overskrifter og punkter uten et markdown-bibliotek. Alt rendres som tekst. */
function renderAnswer(text: string): React.ReactNode {
  return text.split('\n').map((raw, i) => {
    const heading = /^#{1,6}\s+/.test(raw);
    const line = raw.replace(/^#{1,6}\s+/, '');
    const parts = line.split(/\*\*(.+?)\*\*/g).map((p, j) => (j % 2 ? <strong key={j}>{p}</strong> : p));
    return (
      <p key={i} className={cn(heading && 'font-bold text-ink mt-2', !line.trim() && 'h-2')}>
        {heading ? <strong>{parts}</strong> : parts}
      </p>
    );
  });
}

export const AiCoach: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const tactic = useActiveTactic();
  const ageGroup = useAppStore(s => s.ageGroup);

  const [code, setCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [mode, setMode] = useState<AiMode>('ANALYZE_PHASE');
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setCode(readCode()); }, []);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [turns, loading]);

  const current = MODES.find(m => m.mode === mode)!;
  const needsQuestion = mode === 'GENERAL';
  const canSend = !loading && !!code && (!needsQuestion || !!question.trim()) && question.length <= AI_LIMITS.question;

  const saveCode = () => {
    const v = codeInput.trim();
    if (!v) return;
    writeCode(v); setCode(v); setCodeInput(''); setError('');
  };
  const forgetCode = () => { writeCode(''); setCode(''); };

  const send = async () => {
    if (!canSend) return;
    const q = question.trim();
    const context = BOARD_MODES.includes(mode)
      ? buildAiContext(tactic, tactic.activePhaseIdx, { ageGroup, includePrevious: mode === 'NEXT_PHASE' })
      : null;
    if (BOARD_MODES.includes(mode) && !context) { setError('Fant ingen aktiv fase å analysere.'); return; }

    // Bare teksten fra de siste meldingene – brettet sendes kun med denne.
    const history: AiHistoryMessage[] = turns
      .slice(-AI_LIMITS.historyMessages)
      .map(t => ({ role: t.role, content: t.content.slice(0, AI_LIMITS.historyMessageChars) }));

    const label = q ? `${current.label}: ${q}` : current.label;
    setTurns(t => [...t, { role: 'user', content: label }]);
    setQuestion(''); setError(''); setLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [AI_ACCESS_HEADER]: code },
        body: JSON.stringify({ mode, question: q, context, history }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) forgetCode();
      if (!res.ok || typeof data.answer !== 'string') {
        setError(typeof data.error === 'string' ? data.error : 'AI-tjenesten er midlertidig utilgjengelig. Prøv igjen.');
        return;
      }
      setTurns(t => [...t, { role: 'assistant', content: data.answer, truncated: data.truncated === true }]);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError('Fikk ikke kontakt med AI-tjenesten. Er du på nett?');
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setLoading(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      size="lg"
      title={
        <span className="inline-flex items-center gap-2 font-serif text-[1.5rem] leading-tight">
          <Sparkles size={18} strokeWidth={1.75} aria-hidden className="text-signal" /> AI-trener
        </span>
      }
      subtitle={
        <div role="tablist" aria-label="Hva vil du ha hjelp til?" className="flex flex-wrap gap-1.5">
          {MODES.map(m => (
            <button key={m.mode} role="tab" aria-selected={mode === m.mode} onClick={() => setMode(m.mode)}
              className={cn('px-3 min-h-[36px] rounded-ctl text-body font-semibold transition-colors', toggleClass(mode === m.mode))}>
              {m.label}
            </button>
          ))}
        </div>
      }
      footer={code ? (
        <div className="flex flex-col gap-2">
          <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2}
            maxLength={AI_LIMITS.question}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
            placeholder={current.placeholder} aria-label="Spørsmål til AI-treneren"
            className={cn(TEXTAREA_CLASS, 'mt-0')} />
          <div className="flex items-center gap-2">
            <p className="flex-1 min-w-0 text-meta text-ink-subtle">
              {BOARD_MODES.includes(mode) ? 'Sender aktiv fase uten spillernavn.' : 'Brettet sendes ikke med.'} AI kan ta feil og endrer ikke brettet.
            </p>
            <button onClick={send} disabled={!canSend} className={PRIMARY_BTN}>
              <Send size={15} strokeWidth={1.75} aria-hidden /> {loading ? 'Tenker …' : 'Send'}
            </button>
          </div>
        </div>
      ) : undefined}
    >
      {!code ? (
        <div className="space-y-3">
          <div className="flex gap-2.5 text-body text-ink-muted">
            <KeyRound size={16} strokeWidth={1.75} aria-hidden className="flex-shrink-0 mt-0.5" />
            <p>AI-treneren krever en tilgangskode. Den lagres bare på denne enheten.</p>
          </div>
          <label className={LABEL_CLASS} htmlFor="ai-kode">Tilgangskode</label>
          <div className="flex gap-2">
            <input id="ai-kode" type="password" autoComplete="off" value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveCode(); }}
              className={cn(INPUT_CLASS, 'mt-0')} />
            <button onClick={saveCode} disabled={!codeInput.trim()} className={PRIMARY_BTN}>Lagre</button>
          </div>
          {error && <p role="alert" className="text-caption text-signal">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4" aria-live="polite">
          {turns.length === 0 && !loading && (
            <p className="text-body text-ink-subtle">
              Velg hva du vil ha hjelp til. Analyse, coaching, øvelse og neste fase bruker fasen du står i
              ({tactic.phases[tactic.activePhaseIdx]?.name ?? 'fase'}). «Spør AI» svarer på generelle spørsmål.
            </p>
          )}
          {turns.map((t, i) => t.role === 'user' ? (
            <div key={i} className="ml-auto max-w-[85%] w-fit rounded-panel bg-signal/10 px-3 py-2 text-body text-ink">
              {t.content}
            </div>
          ) : (
            <div key={i} className="rounded-panel bg-canvas-sunken shadow-hair px-4 py-3 text-body text-ink-muted leading-relaxed space-y-1 break-words">
              {renderAnswer(t.content)}
              {t.truncated && <p className="text-meta text-ink-subtle italic">Svaret ble avkortet.</p>}
            </div>
          ))}
          {loading && <p className="text-body text-ink-subtle animate-pulse">AI-treneren tenker …</p>}
          {error && <p role="alert" className="text-caption text-signal">{error}</p>}
          <div ref={endRef} />
          <div className="flex gap-2 pt-1">
            {turns.length > 0 && (
              <button onClick={() => { setTurns([]); setError(''); }} className={cn(SECONDARY_BTN, 'min-h-[36px] px-3 text-caption')}>
                <RotateCcw size={13} strokeWidth={1.75} aria-hidden /> Ny samtale
              </button>
            )}
            <button onClick={forgetCode} className={cn(SECONDARY_BTN, 'min-h-[36px] px-3 text-caption')}>
              <KeyRound size={13} strokeWidth={1.75} aria-hidden /> Bytt tilgangskode
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
