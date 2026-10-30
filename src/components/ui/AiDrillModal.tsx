'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { DrillExercise, DrillAgeBand } from '@/types';
import { AI_DRILL_LABEL, DRILL_BANDS, repairCustomDrill } from '@/lib/customDrills';
import { AI_ACCESS_HEADER, AI_ACCESS_ERROR, AI_LIMITS } from '@/lib/ai/request';
import { useAiAccessCode } from '@/hooks/useAiAccessCode';
import { INPUT_CLASS, LABEL_CLASS, TEXTAREA_CLASS } from '@/lib/formClasses';
import { CATEGORY_LABELS } from '@/data/drills';
import { Modal } from './Modal';
import { Button } from './Button';

export function AiDrillModal({ ageGroup, baseDrill, onClose, onEdit }: {
  ageGroup: 'youth' | 'adult'; baseDrill?: DrillExercise; onClose: () => void; onEdit: (d: DrillExercise) => void;
}) {
  const [code, saveCode] = useAiAccessCode();
  const [codeInput, setCodeInput] = useState('');
  const [group, setGroup] = useState(baseDrill?.ageGroup ?? ageGroup);
  const [band, setBand] = useState<DrillAgeBand>(baseDrill?.ageBand[0] ?? (ageGroup === 'adult' ? '17+' : '8-9'));
  const [wish, setWish] = useState(baseDrill ? `Lag en enklere variant av «${baseDrill.name}».` : '');
  const [result, setResult] = useState<DrillExercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  async function suggest() {
    if (loading) return;
    setError(''); setResult(null); setLoading(true);
    const ctrl = new AbortController(); abort.current = ctrl;
    const timer = setTimeout(() => ctrl.abort(), 50_000);
    const accessCode = code || codeInput.trim();
    saveCode(accessCode); setCodeInput('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json', [AI_ACCESS_HEADER]: accessCode },
        body: JSON.stringify({ mode: 'SUGGEST_DRILL', question: wish.trim(), area: 'training',
          appContext: { ageGroup: group, ageBand: band, baseDrillId: baseDrill?.id,
            ...(baseDrill?.isCustom ? { baseDrill } : {}) } }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { saveCode(''); setError(AI_ACCESS_ERROR); return; }
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'AI svarte ikke. Prøv igjen.'); return; }
      const drill = repairCustomDrill({ ...data.drill, aiGenerated: true, id: '' });
      if (!drill || drill.ageGroup !== group || !drill.ageBand.includes(band)) {
        setError('AI-svaret var ufullstendig eller passet ikke valgt alder. Prøv igjen.'); return;
      }
      setResult(drill);
    } catch (err) {
      setError((err as Error).name === 'AbortError'
        ? 'AI brukte for lang tid. Prøv igjen.' : 'Fikk ikke kontakt med AI. Sjekk internettforbindelsen og prøv igjen.');
    } finally { clearTimeout(timer); abort.current = null; setLoading(false); }
  }

  return <Modal title={baseDrill ? 'Foreslå variant med AI' : 'Foreslå øvelse med AI'} onClose={onClose} size="lg"
    footer={result ? <div className="flex flex-wrap justify-end gap-2">
      <Button onClick={onClose}>Forkast</Button>
      <Button variant="primary" onClick={() => onEdit(result)}>Lagre som min øvelse</Button>
    </div> : undefined}>
    <div className="space-y-4">
      <p className="text-body text-warn-300">{AI_DRILL_LABEL}</p>
      <p className="text-body text-ink-subtle">Bygger på appens øvelser og vanlig fotballtrening. Ingenting lagres automatisk. Du får redigere før lagring.</p>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void suggest(); }}>
        {code ? <p className="text-body text-ink-muted">AI-tilgang er aktiv på denne enheten.</p> :
          <label className={LABEL_CLASS}>Tilgangskode (samme som AI-treneren)
            <input type="password" autoComplete="off" className={INPUT_CLASS} required value={codeInput} disabled={loading} onChange={e => setCodeInput(e.target.value)} />
          </label>}
        {baseDrill && <p className="text-body text-ink-muted">Variant av: <strong>{baseDrill.name}</strong></p>}
        <div className="grid grid-cols-2 gap-3">
          <label className={LABEL_CLASS}>Aldersgruppe
            <select className={INPUT_CLASS} value={group} disabled={loading} onChange={e => {
              const next = e.target.value as typeof group; setGroup(next); setBand(next === 'adult' ? '17+' : '8-9'); setResult(null);
            }}><option value="youth">Barn</option><option value="adult">Voksne</option></select>
          </label>
          <label className={LABEL_CLASS}>Alder
            <select className={INPUT_CLASS} value={band} disabled={loading} onChange={e => { setBand(e.target.value as DrillAgeBand); setResult(null); }}>
              {DRILL_BANDS.filter(b => group === 'adult' ? b === '17+' : b !== '17+').map(b => <option key={b} value={b}>{b} år</option>)}
            </select>
          </label>
        </div>
        {group === 'youth' && <p className="text-caption text-ink-subtle">For barn ber vi om korte serier, mye ballkontakt og aktivitet tilpasset valgt alder.</p>}
        {baseDrill && <div className="flex flex-wrap gap-2" aria-label="Velg variant">
          {['Enklere', 'Færre spillere', 'Mer intensitet'].map(v => <Button size="sm" key={v} disabled={loading}
            onClick={() => setWish(`Lag en variant av «${baseDrill.name}»: ${v.toLowerCase()}. Tilpass til valgt alder.`)}>{v}</Button>)}
        </div>}
        <label className={LABEL_CLASS}>Hva ønsker du?
          <textarea className={TEXTAREA_CLASS} rows={3} required maxLength={AI_LIMITS.question} disabled={loading}
            placeholder="Pasningsøvelse for 10 spillere, 9 år, 15 min" value={wish} onChange={e => setWish(e.target.value)} />
        </label>
        <p className="text-meta text-ink-subtle">Ønsket sendes til en AI-tjeneste. Ikke skriv navn på spillere. Mer under Innstillinger → Personvern.</p>
        <Button type="submit" variant={result ? 'secondary' : 'primary'} disabled={loading || !(code || codeInput.trim()) || !wish.trim()}>
          {loading ? 'AI foreslår …' : result ? 'Foreslå på nytt' : 'Hent AI-forslag'}
        </Button>
      </form>
      {loading && <p role="status" className="text-body text-ink-subtle">Venter på AI. Dette kan ta opptil 50 sekunder.</p>}
      {error && <p role="alert" className="text-body text-bad-300">{error}</p>}
      {result && <article className="space-y-3 border-t border-rule pt-4" aria-label="AI-forslag">
        <h3 className="text-h3 text-ink">{result.name}</h3>
        <p className="text-meta text-ink-subtle">{CATEGORY_LABELS[result.category]} · {result.players} spillere · {result.duration} min · {result.ageBand.join(', ')} år</p>
        <p className="text-body text-ink-muted">{result.description}</p>
        {result.warning && <p className="text-body text-warn-300">Hensyn: {result.warning}</p>}
        {[
          ['Utstyr', result.equipment.join(', ')], ['Hvorfor', result.why], ['Skisse / oppsett', result.sketch],
          ['Slik gjøres det', result.steps.map((s, i) => `${i + 1}. ${s.name ? s.name + ': ' : ''}${s.description}`).join('\n')],
          ['Coachingpunkter', result.coachingPoints.join('\n')], ['Vanlige feil', result.commonMistakes.join('\n')],
          ['Variasjoner', result.variations.join('\n')],
        ].filter(([, value]) => value).map(([label, value]) => <section key={label}>
          <h4 className={LABEL_CLASS}>{label}</h4><p className="text-body text-ink-muted whitespace-pre-line mt-1">{value}</p>
        </section>)}
      </article>}
    </div>
  </Modal>;
}
