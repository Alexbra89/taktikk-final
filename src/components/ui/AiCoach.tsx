'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, KeyRound, RotateCcw, ChevronRight, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic } from '@/store/selectors';
import { buildAiContext } from '@/lib/ai/context';
import { buildAppContext } from '@/lib/ai/appContext';
import {
  AI_ACCESS_HEADER, AI_LIMITS, BOARD_MODES, type AiArea, type AiHistoryMessage, type AiMode,
} from '@/lib/ai/request';
import { QUICK_ACTIONS, TRAINING_THEMES, ASK_ACTION_ID, themeAction, type QuickAction } from '@/lib/ai/quickActions';
import { Modal } from './Modal';
import { DockPanel } from '@/components/layout/DockPanel';
import { INPUT_CLASS, LABEL_CLASS, PRIMARY_BTN, SECONDARY_BTN, TEXTAREA_CLASS } from '@/lib/formClasses';
import { cn } from '@/lib/cn';

// ══════════════════════════════════════════════════════════════
//  AI-TRENER – en assistenttrener som leser appen og svarer.
//  Endrer aldri noe: ikke brettet, ikke kalenderen, ikke treningene.
//
//  Hurtigvalgene avhenger av hvor i appen treneren står (area) og
//  starter bare en samtale; deretter er det fri chat (CHAT).
//  Konteksten bygges her på enheten ved hver melding:
//    Taktikk → aktiv fase (+ fasen før) fra brettet, uten spillernavn.
//    Ellers  → utdrag av treninger, kalender og taktikkoversikt.
//  Rammen velges av den som åpner: modal/bunnark eller dokket panel.
// ══════════════════════════════════════════════════════════════

const CODE_KEY = 'taktikk:ai-access-code';

interface Turn { role: 'user' | 'assistant'; content: string; label?: string; truncated?: boolean }

const readCode = () => { try { return localStorage.getItem(CODE_KEY) ?? ''; } catch { return ''; } };
const writeCode = (v: string) => {
  try { if (v) localStorage.setItem(CODE_KEY, v); else localStorage.removeItem(CODE_KEY); } catch { /* gjelder denne økten */ }
};

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AREA_INTRO: Record<AiArea, string> = {
  dashboard: 'Jeg ser neste trening, kommende kamper og taktikken din. Velg et forslag, eller skriv hva du lurer på.',
  board: 'Jeg ser taktikken og fasen du står i. Velg et forslag, eller spør om noe på brettet.',
  training: 'Jeg ser treningen og hva dere har trent på i det siste. Velg et forslag, eller skriv fritt.',
  calendar: 'Jeg ser kommende aktiviteter i kalenderen. Jeg foreslår planer – du legger dem inn selv.',
  general: 'Spør om taktikk, trening, kamp eller spillerutvikling.',
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

interface AiCoachProps {
  onClose: () => void;
  /** 'panel' dokkes ved siden av visningen; standard er modal (bunnark på mobil). */
  variant?: 'modal' | 'panel';
  /** Hvor i appen treneren står. Styrer forslag og kontekst; kan endres mens panelet er åpent. */
  area?: AiArea;
  /** Treningen som er åpen i Trening-visningen, hvis noen. */
  trainingId?: string | null;
}

export const AiCoach: React.FC<AiCoachProps> = ({ onClose, variant = 'modal', area = 'dashboard', trainingId }) => {
  const tactic       = useActiveTactic();
  const ageGroup     = useAppStore(s => s.ageGroup);
  const events       = useAppStore(s => s.events);
  const matchReports = useAppStore(s => s.matchReports);

  const [code, setCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setCode(readCode()); }, []);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [turns, loading]);

  const actions = QUICK_ACTIONS[area];
  const phase = tactic.phases[tactic.activePhaseIdx] ?? tactic.phases[0];
  const openTraining = trainingId ? events.find(e => e.id === trainingId) : undefined;

  // Hva AI-en ser akkurat nå – vises over samtalen, så treneren vet hva som sendes.
  const seeing = (() => {
    const today = localToday();
    switch (area) {
      case 'board':
        return `${tactic.name} · ${phase?.name ?? 'fase'} (${tactic.activePhaseIdx + 1}/${tactic.phases.length}) · ${tactic.formation}`;
      case 'training': {
        const t = openTraining ?? events.filter(e => e.type === 'training' && e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
        return t ? `Trening: ${t.title} (${t.date})` : 'Ingen trening planlagt – generelle treningsråd';
      }
      case 'calendar': {
        const n = events.filter(e => e.date >= today).length;
        return `Kalender: ${n} kommende ${n === 1 ? 'aktivitet' : 'aktiviteter'}`;
      }
      case 'general':
        return 'Generelt – ingen data fra appen';
      default:
        return `Oversikt: treninger, kamper og ${tactic.name} (${tactic.formation})`;
    }
  })();

  const canSendText = !loading && !!code && !!question.trim() && question.length <= AI_LIMITS.question;

  const saveCode = () => {
    const v = codeInput.trim();
    if (!v) return;
    writeCode(v); setCode(v); setCodeInput(''); setError('');
  };
  const forgetCode = () => { writeCode(''); setCode(''); };

  const send = async (mode: AiMode, text: string, label?: string) => {
    if (loading || !code || !text.trim()) return;
    const q = text.trim().slice(0, AI_LIMITS.question);

    // Brettet sendes når modusen krever det, og i fri chat mens treneren står på Taktikk.
    const useBoard = BOARD_MODES.includes(mode) || (mode === 'CHAT' && area === 'board');
    const context = useBoard
      ? buildAiContext(tactic, tactic.activePhaseIdx, { ageGroup, includePrevious: area === 'board' || mode === 'NEXT_PHASE' })
      : null;
    if (useBoard && !context) { setError('Fant ingen aktiv fase å analysere.'); return; }
    // Utenfor brettet: et utdrag av treninger og kalender (se appContext.ts).
    const appContext = area === 'board'
      ? null
      : buildAppContext({ area, today: localToday(), ageGroup, tactic, events, matchReports, trainingId });

    // Bare teksten fra de siste meldingene – data sendes kun med den nye.
    const history: AiHistoryMessage[] = turns
      .slice(-AI_LIMITS.historyMessages)
      .map(t => ({ role: t.role, content: t.content.slice(0, AI_LIMITS.historyMessageChars) }));

    setTurns(t => [...t, { role: 'user', content: q, label }]);
    // Et hurtigvalg sletter ikke det treneren holder på å skrive.
    if (!label) setQuestion('');
    setError(''); setLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [AI_ACCESS_HEADER]: code },
        body: JSON.stringify({ mode, question: q, context, appContext, area, history }),
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

  const runAction = (a: QuickAction) => {
    if (a.id === ASK_ACTION_ID) { inputRef.current?.focus(); return; }
    void send(a.mode, a.prompt, a.label);
  };
  const sendText = () => { if (canSendText) void send('CHAT', question); };

  const chip = 'flex-shrink-0 inline-flex items-center gap-1 px-3 min-h-[32px] rounded-pill text-caption font-semibold transition-colors ' +
    'bg-canvas-raised text-ink-muted shadow-hair hover:text-ink hover:shadow-hair-strong disabled:opacity-40';

  const Frame = variant === 'panel' ? DockPanel : Modal;

  return (
    <Frame
      onClose={onClose}
      size="lg"
      title={
        <span className="inline-flex items-center gap-2 font-serif text-[1.5rem] leading-tight">
          <Sparkles size={18} strokeWidth={1.75} aria-hidden className="text-area-ai" /> AI-trener
        </span>
      }
      subtitle={
        <p className="inline-flex items-center gap-1.5 max-w-full text-meta text-ink-subtle" data-testid="ai-seeing">
          <Eye size={13} strokeWidth={1.75} aria-hidden className="flex-shrink-0" />
          <span className="truncate">{seeing}</span>
        </p>
      }
      footer={code ? (
        <div className="flex flex-col gap-2">
          {/* Etter første melding ligger forslagene her som snarveier. */}
          {turns.length > 0 && (
            <div role="group" aria-label="Forslag" className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
              {actions.filter(a => a.id !== ASK_ACTION_ID).map(a => (
                <button key={a.id} onClick={() => runAction(a)} disabled={loading} className={chip}>{a.label}</button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea ref={inputRef} value={question} onChange={e => setQuestion(e.target.value)} rows={2}
              maxLength={AI_LIMITS.question}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } }}
              placeholder={turns.length ? 'Svar eller spør videre …' : 'Skriv hva du lurer på …'}
              aria-label="Melding til AI-treneren"
              className={cn(TEXTAREA_CLASS, 'mt-0 flex-1 resize-none')} />
            <button onClick={sendText} disabled={!canSendText} aria-label="Send" className={cn(PRIMARY_BTN, 'px-3')}>
              <Send size={15} strokeWidth={1.75} aria-hidden /> <span className="hidden sm:inline">{loading ? 'Tenker …' : 'Send'}</span>
            </button>
          </div>
          <p className="text-meta text-ink-subtle">
            {area === 'board' ? 'Sender fasen uten spillernavn.' : area === 'general' ? 'Sender ingen data fra appen.' : 'Sender et utdrag av treninger og kalender, uten navn.'}{' '}
            AI kan ta feil og endrer ingenting i appen.
          </p>
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
            <div>
              <p className="text-body text-ink-muted">{AREA_INTRO[area]}</p>
              <div role="group" aria-label="Forslag" className="mt-3 grid gap-1.5">
                {actions.map(a => (
                  <button key={a.id} onClick={() => runAction(a)}
                    className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-panel bg-canvas-raised/60 border border-rule text-left hover:border-area-ai/50 hover:bg-canvas-raised transition-colors">
                    <span className="flex-1 min-w-0 py-2">
                      <span className="block text-body font-semibold text-ink">{a.label}</span>
                      {a.hint && <span className="block text-meta text-ink-subtle truncate">{a.hint}</span>}
                    </span>
                    <ChevronRight size={15} aria-hidden className="flex-shrink-0 text-ink-faint" />
                  </button>
                ))}
              </div>
              {area === 'training' && (
                <div className="mt-4">
                  <div className={LABEL_CLASS}>Hovedøvelse med tema</div>
                  <div role="group" aria-label="Tema" className="mt-2 flex flex-wrap gap-1.5">
                    {TRAINING_THEMES.map(t => (
                      <button key={t} onClick={() => runAction(themeAction(t))} className={chip}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {turns.map((t, i) => t.role === 'user' ? (
            <div key={i} className="ml-auto max-w-[85%] w-fit rounded-panel bg-area-ai/10 px-3 py-2 text-body text-ink">
              {t.label ?? t.content}
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
    </Frame>
  );
};
