'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  ALL_DRILLS,
  getDrillsByCategory,
  getDrillsByAgeGroup,
  getDrillsByAgeBand,
  CATEGORY_LABELS,
} from '@/data/drills';
import type { DrillExercise, DrillCategory, DrillAgeBand, DrillDifficulty } from '@/types';
import {
  Hand, Shield, Shuffle, Zap, HeartPulse, Dumbbell,
  Clock, Users, Cake, Package, Calendar, Check, ChevronLeft,
  AlertTriangle, CircleDot, X, Goal, type LucideIcon,
} from 'lucide-react';
import {
  Card, SectionLabel, Button, IconButton, Badge, Meta,
  Modal, FilterBar, FilterRow, FilterChip, SearchInput, EmptyState,
} from '@/components/ui';
import { SketchPreview, canRenderSketch } from '@/components/board/SketchPreview';

type ViewMode = 'browse' | 'detail';
type AgeGroup = 'youth' | 'adult';

const CATEGORIES: DrillCategory[] = ['keeper', 'forsvar', 'midtbane', 'angrep', 'cardio', 'styrke'];
const AGE_BANDS: DrillAgeBand[] = ['6-7', '8-9', '10-12', '13-16', '17+'];
const DIFFICULTIES: DrillDifficulty[] = ['enkel', 'middels', 'avansert'];

const DIFFICULTY_LABELS: Record<DrillDifficulty, string> = {
  enkel:    'Lett',
  middels:  'Middels',
  avansert: 'Avansert',
};

/** Vanskelighetsgrad er status, ikke identitet – derfor Badge-toner. */
const DIFFICULTY_TONE = {
  enkel:    'ok',
  middels:  'warn',
  avansert: 'bad',
} as const;

/** Kategorifarge brukes kun som identitet: venstrestripe og prikk.
 *  Verdiene speiler `category` i tailwind.config.js – dempet, aldri handling. */
const CAT_COLOR: Record<DrillCategory, string> = {
  keeper:   '#D9A93E',
  forsvar:  '#6E93E6',
  midtbane: '#9A88F0',
  angrep:   '#E8834A',
  cardio:   '#D97599',
  styrke:   '#5BAE84',
};

/** Kategoriikon – monokromt, som resten av Kalk. Fargen ligger i stripen. */
const CAT_ICON: Record<DrillCategory, LucideIcon> = {
  keeper:   Hand,
  forsvar:  Shield,
  midtbane: Shuffle,
  angrep:   Zap,
  cardio:   HeartPulse,
  styrke:   Dumbbell,
};

const CatIcon: React.FC<{ category: DrillCategory }> = ({ category }) => {
  const Icon = CAT_ICON[category];
  return <Icon size={13} strokeWidth={1.75} aria-hidden />;
};

/** ISO-ukenummer, brukes til å rotere ukens anbefalte øvelser. */
function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Kilder er ofte URL-er (tiim.no o.l.), men kan også være fritekst. */
function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

function stepText(step: DrillExercise['steps'][number]): string {
  return step.name ? `${step.name}: ${step.description}` : step.description;
}

const Section: React.FC<{ title: string; tone?: string; children: React.ReactNode }> = ({
  title, tone = 'text-ink-subtle', children,
}) => (
  <section>
    <SectionLabel tone={tone} className="mb-2.5">{title}</SectionLabel>
    {children}
  </section>
);

const BulletList: React.FC<{ items: string[]; bullet: string; bulletColor: string }> = ({
  items, bullet, bulletColor,
}) => (
  <div className="space-y-2">
    {items.map((item, i) => (
      <Card key={i} variant="sunken" padding="sm" className="flex gap-3">
        <span className={`${bulletColor} flex-shrink-0 leading-5`}>{bullet}</span>
        <p className="text-body text-ink-muted">{item}</p>
      </Card>
    ))}
  </div>
);

const SourceLink: React.FC<{ value: string }> = ({ value }) =>
  isUrl(value) ? (
    <a href={value} target="_blank" rel="noopener noreferrer"
      className="text-signal hover:text-signal underline break-all">
      {value.replace(/^https?:\/\//i, '')}
    </a>
  ) : (
    <span>{value}</span>
  );

/** Radkort i øvelseslista. */
const DrillRow: React.FC<{
  drill: DrillExercise;
  onOpen: () => void;
  onQuickAdd: () => void;
}> = ({ drill, onOpen, onQuickAdd }) => (
  <Card
    interactive
    accent={CAT_COLOR[drill.category]}
    padding="sm"
    className="group"
    onClick={onOpen}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
  >
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lead font-bold text-ink leading-snug">
            {drill.warning && (
              <AlertTriangle size={14} strokeWidth={1.75} aria-hidden
                className="inline-block mr-1 -mt-0.5 text-warn-400" />
            )}
            {/* Samme sjekk som detaljvisningen bruker, så ikonet aldri lover
                en skisse som ikke lar seg tegne. */}
            {canRenderSketch(drill.sketch, drill.players) && (
              <Goal size={14} strokeWidth={1.75} aria-label="Har skjematisk oppsett"
                className="inline-block mr-1 -mt-0.5 text-ink-faint" />
            )}
            {drill.name}
          </h3>
          <Badge tone={DIFFICULTY_TONE[drill.difficulty]} className="mt-0.5">
            {DIFFICULTY_LABELS[drill.difficulty]}
          </Badge>
        </div>

        <p className="text-caption text-ink-subtle clamp-2 mt-1">{drill.description}</p>

        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          <Meta icon={<Clock size={13} strokeWidth={1.75} />}>{drill.duration} min</Meta>
          <Meta icon={<Users size={13} strokeWidth={1.75} />}>{drill.players}</Meta>
          <Meta icon={<Cake size={13} strokeWidth={1.75} />}>{drill.ageBand.join(', ')}</Meta>
          <Meta className="ml-auto text-ink-faint" icon={<CatIcon category={drill.category} />}>
            {CATEGORY_LABELS[drill.category]}
          </Meta>
        </div>
      </div>

      {/* Alltid synlig på touch, framhevet på hover på desktop. */}
      <IconButton
        aria-label={`Legg ${drill.name} i kalenderen i dag`}
        title="Legg til i dag"
        size="sm"
        variant="secondary"
        className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 transition-opacity"
        onClick={e => { e.stopPropagation(); onQuickAdd(); }}
      >
        <Calendar size={15} strokeWidth={1.75} />
      </IconButton>
    </div>
  </Card>
);

export const DrillsView: React.FC = () => {
  const { addEvent, ageGroup: storeAgeGroup } = useAppStore();

  // Starter på appens aldersgruppe, men kan byttes lokalt i biblioteket.
  const [ageGroup, setAgeGroup]                 = useState<AgeGroup>(storeAgeGroup);
  const [activeCategory, setActiveCategory]     = useState<DrillCategory | 'alle'>('alle');
  const [ageBand, setAgeBand]                   = useState<DrillAgeBand | 'alle'>('alle');
  const [difficultyFilter, setDifficultyFilter] = useState<DrillDifficulty | 'alle'>('alle');
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedDrill, setSelectedDrill]       = useState<DrillExercise | null>(null);
  const [viewMode, setViewMode]                 = useState<ViewMode>('browse');
  const [scheduleOpen, setScheduleOpen]         = useState(false);
  const [scheduleDate, setScheduleDate]         = useState('');
  const [scheduleTime, setScheduleTime]         = useState('18:00');
  const [scheduleNote, setScheduleNote]         = useState('');
  const [scheduledId, setScheduledId]           = useState<string | null>(null);
  const [toast, setToast]                       = useState<string | null>(null);

  function changeAgeGroup(next: AgeGroup) {
    setAgeGroup(next);
    setAgeBand('alle');
  }

  // Aldersbånd som faktisk finnes i valgt aldersgruppe
  const availableBands = useMemo(() => {
    const present = new Set<DrillAgeBand>();
    ALL_DRILLS.filter(d => d.ageGroup === ageGroup)
      .forEach(d => d.ageBand.forEach(b => present.add(b)));
    return AGE_BANDS.filter(b => present.has(b));
  }, [ageGroup]);

  // Antall øvelser per kategori (innenfor valgt aldersgruppe) til fanene
  const categoryCounts = useMemo(() => {
    const counts = {} as Record<DrillCategory, number>;
    CATEGORIES.forEach(cat => {
      counts[cat] = getDrillsByCategory(cat).filter(d => d.ageGroup === ageGroup).length;
    });
    return counts;
  }, [ageGroup]);

  // Ukens anbefalte øvelser: én fra hver av fire kategorier, roterer med ukenummer
  const weeklyDrills = useMemo(() => {
    const week = isoWeek(new Date());
    const picks: DrillExercise[] = [];
    for (let i = 0; i < 4; i++) {
      const cat = CATEGORIES[(week + i) % CATEGORIES.length];
      const pool = getDrillsByCategory(cat).filter(d => d.ageGroup === ageGroup);
      if (pool.length > 0) picks.push(pool[week % pool.length]);
    }
    return picks;
  }, [ageGroup]);

  const filteredDrills = useMemo(() => {
    let drills = activeCategory === 'alle'
      ? getDrillsByAgeGroup(ageGroup)
      : getDrillsByCategory(activeCategory).filter(d => d.ageGroup === ageGroup);

    if (ageBand !== 'alle') {
      const inBand = new Set(getDrillsByAgeBand(ageBand).map(d => d.id));
      drills = drills.filter(d => inBand.has(d.id));
    }

    if (difficultyFilter !== 'alle') {
      drills = drills.filter(d => d.difficulty === difficultyFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      drills = drills.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }

    return drills;
  }, [activeCategory, ageGroup, ageBand, difficultyFilter, searchQuery]);

  const hasFilters = activeCategory !== 'alle' || ageBand !== 'alle'
    || difficultyFilter !== 'alle' || searchQuery.trim() !== '';

  function resetFilters() {
    setActiveCategory('alle');
    setAgeBand('alle');
    setDifficultyFilter('alle');
    setSearchQuery('');
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function openDrill(drill: DrillExercise) {
    setSelectedDrill(drill);
    setViewMode('detail');
    setScheduledId(null);
    setScheduleDate('');
  }

  function buildTeamNote(drill: DrillExercise, extra?: string): string {
    const parts = [
      drill.description,
      `Slik gjøres det:\n${drill.steps.map((s, i) => `${i + 1}. ${stepText(s)}`).join('\n')}`,
    ];
    if (drill.coachingPoints.length > 0) {
      parts.push(`Coachingpunkter:\n${drill.coachingPoints.map(t => `• ${t}`).join('\n')}`);
    }
    if (drill.warning) parts.push(`Advarsel: ${drill.warning}`);
    const base = parts.join('\n\n');
    return extra ? `${extra}\n\n${base}` : base;
  }

  function scheduleDrill(drill: DrillExercise, date?: string) {
    const d = date ?? scheduleDate;
    if (!d) return;
    addEvent({
      type: 'training',
      title: drill.name,
      date: d,
      time: scheduleTime,
      location: '',
      opponent: '',
      result: '',
      teamNote: buildTeamNote(drill, scheduleNote || undefined),
      trainingNotes: [],
      matchNotes: [],
    });
    setScheduledId(drill.id);
    setScheduleOpen(false);
    showToast(`«${drill.name}» lagt til i kalender`);
  }

  function scheduleWeekPlan() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
    const offsets = [0, 2, 4, 5];
    weeklyDrills.forEach((drill, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() + daysUntilMonday + offsets[idx]);
      scheduleDrill(drill, date.toISOString().slice(0, 10));
    });
    showToast(`Ukens ${weeklyDrills.length} øvelser lagt til i kalender`);
  }

  // ── Toast ────────────────────────────────────────────────
  const toastEl = toast && (
    <div
      role="status"
      className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none
                 bg-canvas-panel border border-ok-500/40 text-ok-300 text-body font-bold
                 px-4 py-2.5 rounded-pill shadow-pop animate-rise"
    >
      {toast}
    </div>
  );

  // ── Detaljvisning ────────────────────────────────────────
  if (viewMode === 'detail' && selectedDrill) {
    const drill = selectedDrill;
    const isScheduled = scheduledId === drill.id;

    return (
      <div className="flex flex-col h-full overflow-hidden relative bg-canvas">
        {toastEl}

        <header className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-rule bg-canvas-sunken bg-panel-grad">
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronLeft size={15} strokeWidth={1.75} />}
            onClick={() => { setViewMode('browse'); setScheduledId(null); }}
          >
            Tilbake
          </Button>
          <div className="flex-1" />
          <Badge tone={DIFFICULTY_TONE[drill.difficulty]} size="md">
            {DIFFICULTY_LABELS[drill.difficulty]}
          </Badge>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Tittelblokk – eneste sted på skjermen med stor typografi */}
          <div className="px-5 pt-5 pb-4 border-b border-rule">
            <div className="flex items-center gap-2 mb-2">
              <Badge tone="neutral" dot={CAT_COLOR[drill.category]}>
                {CATEGORY_LABELS[drill.category]}
              </Badge>
              <Badge tone="neutral">
                {drill.ageGroup === 'youth' ? 'Barn' : 'Voksne'}
              </Badge>
            </div>

            <h1 className="text-h1 text-ink mb-2">{drill.name}</h1>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Meta icon={<Clock size={13} strokeWidth={1.75} />}>{drill.duration} min</Meta>
              <Meta icon={<Users size={13} strokeWidth={1.75} />}>{drill.players}</Meta>
              <Meta icon={<Cake size={13} strokeWidth={1.75} />}>{drill.ageBand.join(', ')} år</Meta>
              {drill.equipment.length > 0 && (
                <Meta icon={<Package size={13} strokeWidth={1.75} />}>{drill.equipment.join(', ')}</Meta>
              )}
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Skjematisk oppsett øverst. Samme komponent som i DrillDetailModal
                (økt-visningen i TrainingView), så de to detaljvisningene viser likt. */}
            <SketchPreview sketch={drill.sketch} players={drill.players} />

            {drill.warning && (
              <div className="flex gap-3 rounded-panel border border-warn-500/40 bg-warn-500/10 p-4">
                <AlertTriangle size={16} strokeWidth={1.75} aria-hidden
                  className="text-warn-400 flex-shrink-0 mt-0.5" />
                <div>
                  <SectionLabel tone="text-warn-400" className="mb-1">Advarsel</SectionLabel>
                  <p className="text-body text-warn-300">{drill.warning}</p>
                </div>
              </div>
            )}

            <Card variant="sunken">
              <p className="text-lead text-ink-muted">{drill.description}</p>
            </Card>

            {drill.why && (
              <Section title="Hvorfor denne øvelsen" tone="text-ink-subtle">
                <Card variant="sunken">
                  <p className="text-body text-ink-muted">{drill.why}</p>
                </Card>
              </Section>
            )}

            {drill.sketch && (
              <Section title="Skisse / oppsett">
                <Card variant="outline">
                  <p className="text-body text-ink-muted whitespace-pre-line">{drill.sketch}</p>
                </Card>
              </Section>
            )}

            <Section title="Slik gjøres det" tone="text-signal">
              <ol className="space-y-2">
                {drill.steps.map((step, i) => (
                  <Card as="li" key={step.id ?? i} variant="sunken" padding="sm" className="flex gap-3">
                    <span className="h-6 w-6 flex-shrink-0 rounded-full bg-signal/15 border border-signal/35
                                     flex items-center justify-center text-label text-signal tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      {step.name && <div className="text-body font-bold text-ink mb-0.5">{step.name}</div>}
                      <p className="text-body text-ink-muted">{step.description}</p>
                    </div>
                  </Card>
                ))}
              </ol>
            </Section>

            {drill.coachingPoints.length > 0 && (
              <Section title="Coachingpunkter" tone="text-ok-300">
                <BulletList items={drill.coachingPoints} bullet="✦" bulletColor="text-ok-400" />
              </Section>
            )}

            {drill.commonMistakes.length > 0 && (
              <Section title="Vanlige feil" tone="text-bad-300">
                <BulletList items={drill.commonMistakes} bullet="✕" bulletColor="text-bad-400" />
              </Section>
            )}

            {drill.variations.length > 0 && (
              <Section title="Variasjoner" tone="text-warn-300">
                <BulletList items={drill.variations} bullet="↳" bulletColor="text-warn-400" />
              </Section>
            )}

            {drill.background && (
              <Section title="Bakgrunn">
                <p className="text-body text-ink-subtle">{drill.background}</p>
              </Section>
            )}

            {(drill.source || drill.unverifiedSource) && (
              <div className="text-meta text-ink-faint space-y-1 pt-2 border-t border-rule">
                {drill.source && (
                  <div><span className="text-label uppercase">Kilde:</span> <SourceLink value={drill.source} /></div>
                )}
                {drill.unverifiedSource && (
                  <div><span className="text-label uppercase">Uverifisert kilde:</span> <SourceLink value={drill.unverifiedSource} /></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Handlingslinje – alltid innen rekkevidde nederst, også på mobil */}
        <div className="flex-shrink-0 border-t border-rule bg-canvas-sunken px-4 py-3 sheet-safe sm:pb-3">
          {isScheduled ? (
            <Button variant="success" size="lg" fullWidth
              icon={<Check size={16} strokeWidth={2} />} disabled>
              Lagt til i kalender
            </Button>
          ) : (
            <Button variant="primary" size="lg" fullWidth
              icon={<Calendar size={16} strokeWidth={1.75} />} onClick={() => setScheduleOpen(true)}>
              Legg i kalenderen
            </Button>
          )}
        </div>

        <Modal
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          title="Legg i kalenderen"
          subtitle={<p className="text-meta text-ink-subtle">{drill.name}</p>}
          size="sm"
          footer={
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!scheduleDate}
              onClick={() => scheduleDrill(drill)}
            >
              {scheduleDate ? 'Legg til' : 'Velg en dato først'}
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-label uppercase text-ink-faint">Dato *</span>
                <input
                  type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                  className="mt-1.5 w-full bg-canvas-panel border border-rule rounded-xl px-3 py-2.5
                             text-body text-ink focus:outline-none focus:border-signal/60"
                />
              </label>
              <label className="block">
                <span className="text-label uppercase text-ink-faint">Tid</span>
                <input
                  type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  className="mt-1.5 w-full bg-canvas-panel border border-rule rounded-xl px-3 py-2.5
                             text-body text-ink focus:outline-none focus:border-signal/60"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-label uppercase text-ink-faint">Notat (valgfritt)</span>
              <input
                value={scheduleNote} onChange={e => setScheduleNote(e.target.value)}
                placeholder="F.eks. fokus på førstetouch"
                className="mt-1.5 w-full bg-canvas-panel border border-rule rounded-xl px-3 py-2.5
                           text-body text-ink placeholder:text-ink-faint focus:outline-none focus:border-signal/60"
              />
            </label>
            <p className="text-meta text-ink-faint">
              Hele øvelsen – steg, coachingpunkter og advarsler – følger med som lagnotat.
            </p>
          </div>
        </Modal>
      </div>
    );
  }

  // ── Oversikt ─────────────────────────────────────────────
  const showWeekly = !hasFilters;

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-canvas">
      {toastEl}

      <FilterBar>
        {/* Rad 1: aldersgruppe + treffantall */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <CircleDot size={15} strokeWidth={1.75} aria-hidden className="text-ink-faint" />
          <div className="flex gap-1.5">
            {(['youth', 'adult'] as const).map(g => (
              <FilterChip
                key={g}
                active={ageGroup === g}
                onClick={() => changeAgeGroup(g)}
              >
                {g === 'youth' ? 'Barn' : 'Voksne'}
              </FilterChip>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-meta text-ink-faint tabular-nums">
            {filteredDrills.length} øvelser
          </span>
        </div>

        {/* Rad 2: søk */}
        <div className="px-4 py-2">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Søk etter øvelse…" />
        </div>

        {/* Rad 3: kategori */}
        <FilterRow>
          <FilterChip active={activeCategory === 'alle'} accent="neutral" onClick={() => setActiveCategory('alle')}>
            Alle
          </FilterChip>
          {CATEGORIES.map(cat => (
            <FilterChip
              key={cat}
              active={activeCategory === cat}
              count={categoryCounts[cat]}
              onClick={() => setActiveCategory(cat)}
            >
              <CatIcon category={cat} /> {CATEGORY_LABELS[cat]}
            </FilterChip>
          ))}
        </FilterRow>

        {/* Rad 4: alder */}
        <FilterRow label="Alder">
          <FilterChip active={ageBand === 'alle'} accent="neutral" onClick={() => setAgeBand('alle')}>
            Alle
          </FilterChip>
          {availableBands.map(band => (
            <FilterChip key={band} active={ageBand === band} onClick={() => setAgeBand(band)}>
              {band}
            </FilterChip>
          ))}
        </FilterRow>

        {/* Rad 5: nivå + nullstill */}
        <FilterRow label="Nivå" className="pb-1.5">
          <FilterChip active={difficultyFilter === 'alle'} accent="neutral" onClick={() => setDifficultyFilter('alle')}>
            Alle
          </FilterChip>
          {DIFFICULTIES.map(level => (
            <FilterChip
              key={level}
              active={difficultyFilter === level}
              accent={DIFFICULTY_TONE[level]}
              onClick={() => setDifficultyFilter(level)}
            >
              {DIFFICULTY_LABELS[level]}
            </FilterChip>
          ))}
          {hasFilters && (
            <FilterChip accent="neutral" onClick={resetFilters} className="ml-1">
              <X size={12} strokeWidth={2} aria-hidden /> Nullstill
            </FilterChip>
          )}
        </FilterRow>
      </FilterBar>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Ukens anbefalte øvelser */}
        {showWeekly && weeklyDrills.length > 0 && (
          <Card variant="solid" className="border-signal/25">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h2 className="text-h4 text-signal">Ukens anbefalte</h2>
                <p className="text-meta text-ink-subtle mt-0.5">Roterer automatisk hver uke</p>
              </div>
              <Button size="sm" variant="secondary"
                icon={<Calendar size={13} strokeWidth={1.75} />} onClick={scheduleWeekPlan}>
                Legg alle i kalender
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {weeklyDrills.map(drill => (
                <Card
                  key={drill.id}
                  variant="sunken"
                  padding="sm"
                  interactive
                  accent={CAT_COLOR[drill.category]}
                  onClick={() => openDrill(drill)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(drill); } }}
                >
                  <div className="text-body font-bold text-ink leading-snug">{drill.name}</div>
                  <div className="text-meta text-ink-faint mt-1">
                    {CATEGORY_LABELS[drill.category]} · {drill.duration} min
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Øvelsesliste */}
        <div className="space-y-2">
          {filteredDrills.map(drill => (
            <DrillRow
              key={drill.id}
              drill={drill}
              onOpen={() => openDrill(drill)}
              onQuickAdd={() => scheduleDrill(drill, new Date().toISOString().slice(0, 10))}
            />
          ))}
          {filteredDrills.length === 0 && (
            <EmptyState
              title="Ingen øvelser funnet"
              hint="Prøv et annet søkeord, eller nullstill filtrene for å se hele biblioteket."
              action={<Button variant="secondary" onClick={resetFilters}>Nullstill filtre</Button>}
            />
          )}
        </div>
      </div>
    </div>
  );
};
