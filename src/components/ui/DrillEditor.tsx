'use client';
import React, { useState } from 'react';
import type { DrillExercise } from '@/types';
import { AI_DRILL_LABEL, DRILL_BANDS, DRILL_CATEGORIES, repairCustomDrill } from '@/lib/customDrills';
import { CATEGORY_LABELS } from '@/data/drills';
import { INPUT_CLASS, LABEL_CLASS, TEXTAREA_CLASS } from '@/lib/formClasses';
import { Modal } from './Modal';
import { Button } from './Button';

export function DrillEditor({ initial, onClose, onSave }: {
  initial: DrillExercise; onClose: () => void; onSave: (drill: DrillExercise) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const patch = (fields: Partial<DrillExercise>) => setDraft(d => ({ ...d, ...fields }));
  const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);
  const textField = (label: string, field: 'name' | 'description' | 'players' | 'why' | 'sketch' | 'warning', required = false, multiline = false) => (
    <label className={LABEL_CLASS}>{label}
      {multiline ? <textarea className={TEXTAREA_CLASS} rows={3} required={required} maxLength={6000}
        value={draft[field] ?? ''} onChange={e => patch({ [field]: e.target.value })} />
        : <input className={INPUT_CLASS} required={required} maxLength={300}
          value={draft[field] ?? ''} onChange={e => patch({ [field]: e.target.value })} />}
    </label>
  );
  const listField = (label: string, field: 'equipment' | 'coachingPoints' | 'commonMistakes' | 'variations') => (
    <label className={LABEL_CLASS}>{label} (én per linje)
      <textarea className={TEXTAREA_CLASS} rows={3} maxLength={6000} defaultValue={draft[field].join('\n')}
        onChange={e => patch({ [field]: lines(e.target.value) })} />
    </label>
  );
  return <Modal title={initial.id ? 'Rediger min øvelse' : 'Legg til egen øvelse'} size="lg" onClose={onClose}
    footer={<div className="flex justify-end gap-2">
      <Button onClick={onClose}>Avbryt</Button>
      <Button variant="primary" type="submit" form="drill-editor">Lagre øvelse</Button>
    </div>}>
    <form id="drill-editor" className="space-y-4" onSubmit={e => {
      e.preventDefault();
      const clean = repairCustomDrill(draft);
      if (!clean) { setError('Fyll ut navn, beskrivelse, antall spillere, alder og varighet (1–240 minutter).'); return; }
      try { onSave(clean); } catch (err) { setError((err as Error).message); }
    }}>
      <p className="text-body text-ink-subtle">Lagres som «Min øvelse» i denne nettleseren og tas med i sikkerhetskopier.</p>
      {draft.aiGenerated && <p className="text-body text-warn-300">{AI_DRILL_LABEL}. Se gjennom og tilpass før du lagrer.</p>}
      {textField('Navn', 'name', true)}
      {textField('Beskrivelse', 'description', true, true)}
      <div className="grid sm:grid-cols-2 gap-4">
        <label className={LABEL_CLASS}>Aldersgruppe
          <select className={INPUT_CLASS} value={draft.ageGroup} onChange={e => {
            const ageGroup = e.target.value as DrillExercise['ageGroup'];
            patch({ ageGroup, ageBand: [ageGroup === 'adult' ? '17+' : '8-9'] });
          }}><option value="youth">Barn</option><option value="adult">Voksne</option></select>
        </label>
        <label className={LABEL_CLASS}>Tema / kategori
          <select className={INPUT_CLASS} value={draft.category} onChange={e => patch({ category: e.target.value as DrillExercise['category'] })}>
            {DRILL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </label>
      </div>
      <fieldset><legend className={LABEL_CLASS}>Alder (velg minst én)</legend>
        <div className="flex flex-wrap gap-4 mt-2">
          {DRILL_BANDS.filter(b => draft.ageGroup === 'adult' ? b === '17+' : b !== '17+').map(b =>
            <label key={b} className="flex items-center gap-2 text-body text-ink-muted min-h-[44px]">
              <input type="checkbox" checked={draft.ageBand.includes(b)} onChange={e => patch({ ageBand: e.target.checked ? [...draft.ageBand, b] : draft.ageBand.filter(x => x !== b) })} />{b} år
            </label>)}
        </div>
      </fieldset>
      <div className="grid sm:grid-cols-2 gap-4">
        {textField('Antall spillere', 'players', true)}
        <label className={LABEL_CLASS}>Varighet (minutter)
          <input className={INPUT_CLASS} type="number" min={1} max={240} step={1} required value={draft.duration || ''}
            onChange={e => patch({ duration: Number(e.target.value) })} />
        </label>
      </div>
      <label className={LABEL_CLASS}>Vanskelighetsgrad
        <select className={INPUT_CLASS} value={draft.difficulty} onChange={e => patch({ difficulty: e.target.value as DrillExercise['difficulty'] })}>
          <option value="enkel">Lett</option><option value="middels">Middels</option><option value="avansert">Avansert</option>
        </select>
      </label>
      {listField('Utstyr', 'equipment')}
      {textField('Hvorfor denne øvelsen', 'why', false, true)}
      {textField('Skisse / oppsett (beskriv med ord)', 'sketch', false, true)}
      <label className={LABEL_CLASS}>Slik gjøres det (ett steg per linje)
        <textarea className={TEXTAREA_CLASS} rows={4} maxLength={6000}
          defaultValue={draft.steps.map(s => s.name ? `${s.name}: ${s.description}` : s.description).join('\n')}
          onChange={e => patch({ steps: lines(e.target.value).map((description, i) => ({ id: `step-${i}`, name: '', description })) })} />
      </label>
      {listField('Coachingpunkter', 'coachingPoints')}
      {listField('Vanlige feil', 'commonMistakes')}
      {listField('Variasjoner', 'variations')}
      {textField('Advarsel / hensyn', 'warning', false, true)}
      {error && <p role="alert" className="text-body text-bad-300">{error}</p>}
    </form>
  </Modal>;
}
