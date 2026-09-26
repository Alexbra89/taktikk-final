'use client';
import React, { useMemo } from 'react';
import {
  Plus, Clipboard, BookOpen, CalendarDays, Sparkles, Clock, MapPin, ListChecks,
  Swords, Activity, ChevronRight, ClipboardCheck, UserCheck, FileText, HardDriveDownload,
  type LucideIcon,
} from 'lucide-react';
import type { AppView, CalendarEvent, DrillCategory } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useActiveTactic, SPORT_LABELS } from '@/store/selectors';
import { getWeeklyDrills, CATEGORY_LABELS } from '@/data/drills';
import { totalMinutes } from '@/lib/trainingSession';
import { PRIMARY_BTN, SECONDARY_BTN } from '@/lib/formClasses';
import { cn } from '@/lib/cn';
import { NAV } from '@/components/layout/navigation';
import { Tile, TileHeader, TileEmpty, StatTile, IconTile } from '@/components/layout/Surface';
import { TacticThumbnail } from './TacticThumbnail';
import { deriveTasks, localIso, type TaskKind } from './tasks';

// ═══════════════════════════════════════════════════════════════
//  DASHBORD – trenerens oversikt og startside.
//  Leser bare fra storen; alle handlinger sender deg videre til
//  visningen som eier funksjonen (trening, kalender, brett, AI).
// ═══════════════════════════════════════════════════════════════

interface DashboardProps {
  onNavigate: (v: AppView) => void;
  onOpenTraining: (ev: CalendarEvent) => void;
  onNewTraining: () => void;
  onOpenDate: (iso: string) => void;
  onOpenDrill: (id: string) => void;
  onOpenAi: () => void;
  onOpenReport: (eventId?: string) => void;
}

const DAY_MS = 86_400_000;
const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

const CAT_DOT: Record<DrillCategory, string> = {
  keeper: 'bg-category-keeper', forsvar: 'bg-category-forsvar', midtbane: 'bg-category-midtbane',
  angrep: 'bg-category-angrep', cardio: 'bg-category-cardio', styrke: 'bg-category-styrke',
};

const TASK_ICON: Record<TaskKind, { icon: LucideIcon; tone: string }> = {
  plan:       { icon: ClipboardCheck,    tone: NAV.training.tile },
  attendance: { icon: UserCheck,         tone: NAV.calendar.tile },
  report:     { icon: FileText,          tone: NAV.reports.tile },
  backup:     { icon: HardDriveDownload, tone: 'bg-canvas-raised text-ink-muted' },
};


const daysBetween = (from: string, to: string) =>
  Math.round((new Date(to + 'T12:00:00').getTime() - new Date(from + 'T12:00:00').getTime()) / DAY_MS);

function relativeDay(today: string, iso: string): string {
  const n = daysBetween(today, iso);
  if (n === 0) return 'I dag';
  if (n === 1) return 'I morgen';
  if (n > 1 && n < 7) return `Om ${n} dager`;
  return new Date(iso + 'T12:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
}

const longDate = (iso: string) => {
  const s = new Date(iso + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function greeting(hour: number): string {
  if (hour < 5) return 'God kveld';
  if (hour < 10) return 'God morgen';
  if (hour < 17) return 'God dag';
  return 'God kveld';
}

const sortEvents = (a: CalendarEvent, b: CalendarEvent) =>
  a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '');

export const DashboardView: React.FC<DashboardProps> = ({
  onNavigate, onOpenTraining, onNewTraining, onOpenDate, onOpenDrill, onOpenAi, onOpenReport,
}) => {
  const events          = useAppStore(s => s.events);
  const tactics         = useAppStore(s => s.tactics);
  const matchReports    = useAppStore(s => s.matchReports);
  const rosterNames     = useAppStore(s => s.rosterNames);
  const homeTeamName    = useAppStore(s => s.homeTeamName);
  const ageGroup        = useAppStore(s => s.ageGroup);
  const lastExportedAt  = useAppStore(s => s.lastExportedAt);
  const setActiveTactic = useAppStore(s => s.setActiveTactic);
  const setActivePhase  = useAppStore(s => s.setActivePhaseIdx);
  const tactic          = useActiveTactic();

  const now = new Date();
  const today = localIso(now);

  const upcoming = useMemo(() => events.filter(e => e.date >= today).sort(sortEvents), [events, today]);
  const nextTraining = upcoming.find(e => e.type === 'training');
  const nextMatch    = upcoming.find(e => e.type === 'match');

  // Uka fra mandag til søndag.
  const week = useMemo(() => {
    const d = new Date(today + 'T12:00:00');
    const monday = new Date(d.getTime() - ((d.getDay() + 6) % 7) * DAY_MS);
    return Array.from({ length: 7 }, (_, i) => localIso(new Date(monday.getTime() + i * DAY_MS)));
  }, [today]);
  const weekEvents = events.filter(e => e.date >= week[0] && e.date <= week[6]);

  const tasks = useMemo(
    () => deriveTasks({ events, matchReports, rosterNames, lastExportedAt, today }),
    [events, matchReports, rosterNames, lastExportedAt, today],
  );
  const weeklyDrills = useMemo(() => getWeeklyDrills(ageGroup).slice(0, 4), [ageGroup]);

  const month = today.slice(0, 7);
  const monthEvents = events.filter(e => e.date.startsWith(month));
  const plannedMin7 = upcoming
    .filter(e => e.type === 'training' && daysBetween(today, e.date) <= 7)
    .reduce((m, e) => m + totalMinutes(e.trainingNotes), 0);

  const phase = tactic.phases[tactic.activePhaseIdx] ?? tactic.phases[0];
  const otherTactics = tactics.filter(t => t.id !== tactic.id).slice(0, 3);

  const openBoard = () => onNavigate('board');

  const runTask = (kind: TaskKind, eventId?: string) => {
    const ev = eventId ? events.find(e => e.id === eventId) : undefined;
    if (kind === 'backup') onNavigate('settings');
    else if (kind === 'report') onOpenReport(eventId);
    else if (ev) onOpenTraining(ev);
  };

  const quickActions: { label: string; icon: LucideIcon; tone: string; onClick: () => void; primary?: boolean }[] = [
    { label: 'Ny trening',    icon: Plus,         tone: '', onClick: onNewTraining, primary: true },
    { label: 'Åpne taktikk',  icon: Clipboard,    tone: NAV.board.tile,    onClick: openBoard },
    { label: 'Kalender',      icon: CalendarDays, tone: NAV.calendar.tile, onClick: () => onNavigate('calendar') },
    { label: 'AI-trener',     icon: Sparkles,     tone: NAV.ai.tile,       onClick: () => onOpenAi() },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5 sm:space-y-6">

        {/* ── Hilsen og hurtigvalg ─────────────────────────── */}
        <div className="flex flex-col xl:flex-row xl:items-end gap-4 justify-between">
          <div className="min-w-0">
            <p className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle">{longDate(today)}</p>
            <h1 className="text-[1.75rem] sm:text-display text-ink font-extrabold tracking-tight mt-1">
              {greeting(now.getHours())}, trener
            </h1>
            <p className="text-body text-ink-muted mt-1">
              {homeTeamName ? `${homeTeamName} · ` : ''}
              {weekEvents.length === 0
                ? 'Ingen aktiviteter denne uka ennå.'
                : `${weekEvents.length} ${weekEvents.length === 1 ? 'aktivitet' : 'aktiviteter'} denne uka.`}
            </p>
          </div>

          <div aria-label="Hurtigvalg" role="group"
            className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {quickActions.map(a => (
              <button key={a.label} onClick={a.onClick}
                className={cn(
                  'flex-shrink-0 inline-flex items-center gap-2 pl-1.5 pr-3.5 min-h-[44px] rounded-pill text-body font-bold transition-colors',
                  a.primary
                    ? 'bg-signal text-signal-fg hover:brightness-110 pl-3'
                    : 'bg-canvas-panel border border-rule text-ink hover:bg-canvas-raised hover:border-rule-strong',
                )}>
                {a.primary
                  ? <a.icon size={16} strokeWidth={2} aria-hidden />
                  : <IconTile icon={a.icon} tone={a.tone} size="sm" className="rounded-full" />}
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Nøkkeltall ───────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatTile icon={Activity} tone={NAV.training.tile} label="Treninger"
            value={monthEvents.filter(e => e.type === 'training').length} hint="denne måneden" />
          <StatTile icon={Swords} tone="bg-signal/15 text-signal" label="Kamper"
            value={monthEvents.filter(e => e.type === 'match').length} hint="denne måneden" />
          <StatTile icon={Clock} tone={NAV.calendar.tile} label="Planlagt"
            value={<>{plannedMin7}<span className="text-body text-ink-subtle ml-1">min</span></>} hint="neste 7 dager" />
          <StatTile icon={FileText} tone={NAV.reports.tile} label="Rapporter"
            value={matchReports.length} hint="kamprapporter totalt" />
        </div>

        {/* ── Neste trening · neste kamp · aktiv taktikk ────── */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Tile aria-label="Neste trening">
            <TileHeader icon={NAV.training.icon} tone={NAV.training.tile} title="Neste trening"
              subtitle={nextTraining ? relativeDay(today, nextTraining.date) : 'Ingen planlagt'}
              action={{ label: 'Alle', onClick: () => onNavigate('training') }} />
            {nextTraining ? (
              <div>
                <p className="text-h3 text-ink truncate">{nextTraining.title}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} aria-hidden />{longDate(nextTraining.date)}</span>
                  {nextTraining.time && <span className="inline-flex items-center gap-1.5"><Clock size={13} aria-hidden />{nextTraining.time}</span>}
                  {nextTraining.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} aria-hidden />{nextTraining.location}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-pill bg-canvas-raised text-meta text-ink-muted">
                    {totalMinutes(nextTraining.trainingNotes)} min
                  </span>
                  <span className="px-2 py-0.5 rounded-pill bg-canvas-raised text-meta text-ink-muted">
                    {nextTraining.trainingNotes.length} punkter
                  </span>
                  {[...new Set(nextTraining.trainingNotes.flatMap(n => n.focus))].slice(0, 2).map(f => (
                    <span key={f} className="px-2 py-0.5 rounded-pill bg-area-training/15 text-meta text-area-training">{f}</span>
                  ))}
                </div>
                <button onClick={() => onOpenTraining(nextTraining)} className={cn(PRIMARY_BTN, 'w-full mt-4')}>
                  Åpne økta <ChevronRight size={15} aria-hidden />
                </button>
              </div>
            ) : (
              <TileEmpty action={
                <button onClick={onNewTraining} className={PRIMARY_BTN}><Plus size={15} aria-hidden /> Planlegg trening</button>
              }>Ingen kommende treninger.</TileEmpty>
            )}
          </Tile>

          <Tile aria-label="Neste kamp">
            <TileHeader icon={Swords} tone="bg-signal/15 text-signal" title="Neste kamp"
              subtitle={nextMatch ? relativeDay(today, nextMatch.date) : 'Ingen planlagt'}
              action={{ label: 'Rapporter', onClick: () => onNavigate('reports') }} />
            {nextMatch ? (
              <div>
                <p className="text-h3 text-ink truncate">
                  {nextMatch.opponent ? `Mot ${nextMatch.opponent}` : nextMatch.title}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} aria-hidden />{longDate(nextMatch.date)}</span>
                  {nextMatch.time && <span className="inline-flex items-center gap-1.5"><Clock size={13} aria-hidden />{nextMatch.time}</span>}
                  {nextMatch.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} aria-hidden />{nextMatch.location}</span>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={openBoard} className={SECONDARY_BTN}><Clipboard size={15} aria-hidden /> Taktikk</button>
                  <button onClick={() => onOpenDate(nextMatch.date)} className={SECONDARY_BTN}><CalendarDays size={15} aria-hidden /> Kalender</button>
                </div>
              </div>
            ) : (
              <TileEmpty action={
                <button onClick={() => onNavigate('calendar')} className={SECONDARY_BTN}><Plus size={15} aria-hidden /> Legg inn kamp</button>
              }>Ingen kamper i kalenderen.</TileEmpty>
            )}
          </Tile>

          <Tile aria-label="Aktiv taktikk" className="md:col-span-2 xl:col-span-1">
            <TileHeader icon={NAV.board.icon} tone={NAV.board.tile} title={tactic.name}
              subtitle={`${tactic.formation} · ${SPORT_LABELS[tactic.sport]} · ${tactic.phases.length} ${tactic.phases.length === 1 ? 'fase' : 'faser'}`}
              action={{ label: 'Åpne', onClick: openBoard }} />
            <div className="grid md:grid-cols-2 xl:grid-cols-1 gap-3">
              <button onClick={openBoard} aria-label={`Åpne ${tactic.name} på brettet`}
                className="block w-full rounded-panel overflow-hidden shadow-hair hover:shadow-hair-strong transition-shadow">
                <TacticThumbnail phase={phase} className="block w-full h-auto" />
              </button>
              <div className="min-w-0">
                <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-1.5">Faser</div>
                <div className="flex flex-wrap gap-1.5">
                  {tactic.phases.map((ph, i) => (
                    <button key={ph.id}
                      onClick={() => { setActivePhase(i); openBoard(); }}
                      aria-current={i === tactic.activePhaseIdx ? 'true' : undefined}
                      className={cn(
                        'px-2.5 min-h-[32px] rounded-pill text-caption font-semibold transition-colors',
                        i === tactic.activePhaseIdx
                          ? 'bg-area-board/15 text-area-board shadow-[inset_0_0_0_1px_rgb(var(--k-area-board)/0.4)]'
                          : 'bg-canvas-raised text-ink-muted hover:text-ink',
                      )}>
                      {ph.name}
                    </button>
                  ))}
                </div>
                {otherTactics.length > 0 && (
                  <>
                    <div className="font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mt-3 mb-1.5">Andre taktikker</div>
                    <ul className="space-y-px">
                      {otherTactics.map(t => (
                        <li key={t.id}>
                          <button onClick={() => { setActiveTactic(t.id); openBoard(); }}
                            className="w-full flex items-center gap-2 min-h-[34px] px-2 -mx-2 rounded-ctl text-left text-body text-ink-muted hover:text-ink hover:bg-canvas-hover transition-colors">
                            <span className="flex-1 min-w-0 truncate">{t.name}</span>
                            <span className="font-mono text-meta text-ink-subtle">{t.formation}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </Tile>
        </div>

        {/* ── Uka og oppgaver ──────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Tile aria-label="Denne uka" className="lg:col-span-2">
            <TileHeader icon={NAV.calendar.icon} tone={NAV.calendar.tile} title="Denne uka"
              subtitle="Trykk på en dag for å åpne den i kalenderen"
              action={{ label: 'Kalender', onClick: () => onNavigate('calendar') }} />
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {week.map((iso, i) => {
                const dayEvents = events.filter(e => e.date === iso);
                const isToday = iso === today;
                return (
                  <button key={iso} onClick={() => onOpenDate(iso)}
                    aria-label={`${longDate(iso)}${dayEvents.length ? `, ${dayEvents.length} aktiviteter` : ''}`}
                    className={cn(
                      'tap-auto flex flex-col items-center gap-1 py-2 sm:py-3 rounded-panel transition-colors',
                      isToday ? 'bg-signal/10 shadow-hair-signal' : 'bg-canvas-raised/60 hover:bg-canvas-hover',
                    )}>
                    <span className={cn('text-meta', isToday ? 'text-signal font-bold' : 'text-ink-subtle')}>{WEEKDAYS[i]}</span>
                    <span className={cn('font-mono text-lead', isToday ? 'text-ink font-bold' : 'text-ink-muted')}>
                      {Number(iso.slice(8))}
                    </span>
                    <span className="flex gap-0.5 h-1.5">
                      {dayEvents.slice(0, 3).map(e => (
                        <span key={e.id} aria-hidden
                          className={cn('w-1.5 h-1.5 rounded-full', e.type === 'match' ? 'bg-signal' : 'bg-area-training')} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 font-mono text-meta uppercase tracking-[0.08em] text-ink-subtle mb-1.5">Kommende aktiviteter</div>
            {upcoming.length === 0 ? (
              <TileEmpty>Ingen kommende aktiviteter.</TileEmpty>
            ) : (
              <ul className="divide-y divide-rule">
                {upcoming.slice(0, 5).map(e => {
                  const isMatch = e.type === 'match';
                  return (
                    <li key={e.id}>
                      <button onClick={() => (isMatch ? onOpenDate(e.date) : onOpenTraining(e))}
                        className="tap-auto w-full flex items-center gap-3 py-2.5 text-left hover:bg-canvas-hover rounded-ctl px-2 -mx-2 transition-colors">
                        <IconTile icon={isMatch ? Swords : Activity} size="sm"
                          tone={isMatch ? 'bg-signal/15 text-signal' : NAV.training.tile} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-body font-semibold text-ink truncate">
                            {isMatch && e.opponent ? `Kamp mot ${e.opponent}` : e.title}
                          </span>
                          <span className="block text-meta text-ink-subtle truncate">
                            {relativeDay(today, e.date)}{e.time ? ` · ${e.time}` : ''}{e.location ? ` · ${e.location}` : ''}
                          </span>
                        </span>
                        {!isMatch && (
                          <span className="flex-shrink-0 font-mono text-meta text-ink-subtle">{totalMinutes(e.trainingNotes)} min</span>
                        )}
                        <ChevronRight size={15} aria-hidden className="flex-shrink-0 text-ink-faint" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Tile>

          <Tile aria-label="Oppgaver">
            <TileHeader icon={ListChecks} tone="bg-canvas-raised text-ink-muted" title="Oppgaver"
              subtitle={tasks.length ? `${tasks.length} å gjøre` : 'Alt er à jour'} />
            {tasks.length === 0 ? (
              <TileEmpty>Ingen åpne oppgaver. Godt jobbet!</TileEmpty>
            ) : (
              <ul className="space-y-2">
                {tasks.map(t => {
                  const { icon, tone } = TASK_ICON[t.kind];
                  return (
                    <li key={t.id}>
                      <button onClick={() => runTask(t.kind, t.eventId)}
                        className="tap-auto w-full flex items-center gap-3 p-2.5 rounded-panel bg-canvas-raised/60 border border-rule hover:border-rule-strong hover:bg-canvas-raised text-left transition-colors">
                        <IconTile icon={icon} tone={tone} size="sm" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-body font-semibold text-ink truncate">{t.title}</span>
                          <span className="block text-meta text-ink-subtle truncate">{t.detail}</span>
                        </span>
                        <ChevronRight size={15} aria-hidden className="flex-shrink-0 text-ink-faint" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Tile>
        </div>

        {/* ── Øvelser og AI-trener ─────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Tile aria-label="Ukens øvelser" className="lg:col-span-2">
            <TileHeader icon={BookOpen} tone={NAV.drills.tile} title="Ukens øvelser"
              subtitle={`Utvalg for ${ageGroup === 'youth' ? 'barn' : 'voksne'} – bytter hver uke`}
              action={{ label: 'Bibliotek', onClick: () => onNavigate('drills') }} />
            <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
              {weeklyDrills.map(d => (
                <button key={d.id} onClick={() => onOpenDrill(d.id)}
                  className="tap-auto text-left p-3 rounded-panel bg-canvas-raised/60 border border-rule hover:border-rule-strong hover:bg-canvas-raised transition-colors">
                  <span className="flex items-center gap-1.5 text-meta text-ink-subtle">
                    <span aria-hidden className={cn('w-1.5 h-1.5 rounded-full', CAT_DOT[d.category])} />
                    {CATEGORY_LABELS[d.category]} · {d.duration} min
                  </span>
                  <span className="block mt-1 text-body font-bold text-ink truncate">{d.name}</span>
                  <span className="block mt-0.5 text-meta text-ink-subtle clamp-2">{d.why || d.description}</span>
                </button>
              ))}
            </div>
          </Tile>

          <Tile aria-label="AI-trener" className="relative overflow-hidden">
            <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-area-ai/15 blur-2xl" />
            <TileHeader icon={Sparkles} tone={NAV.ai.tile} title="AI-trener" subtitle="Din assistenttrener" />
            <p className="text-body text-ink-muted">
              Planlegg neste trening, få en øvelse til laget, en vurdering av {tactic.name} eller hjelp med uka.
              Forslagene tilpasses det du jobber med.
            </p>
            <button onClick={onOpenAi}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-ctl bg-area-ai/15 text-area-ai text-body font-bold hover:bg-area-ai/25 transition-colors">
              <Sparkles size={16} strokeWidth={1.9} aria-hidden /> Åpne AI-treneren
            </button>
            <p className="mt-3 text-meta text-ink-subtle">AI kan ta feil. Svarene endrer aldri dataene dine.</p>
          </Tile>
        </div>
      </div>
    </div>
  );
};
