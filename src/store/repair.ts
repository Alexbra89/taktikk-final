// Reparerer lagrede data og migrerer versjon 1 ved innlasting.
import type { AppView, TrainingNote, MatchNote, CalendarEvent, MatchReport, ReportTag, TacticMoment, TacticPhase, BoardItem, BoardItemType, Drawing, PathDrawing, Tactic, Sport, Player, DrillExercise } from '../types';
import { DEFAULT_FORMATION, getFormations, getFormationSlots } from '../data/formations';
import { BOARD_ITEM_TYPES, normalizeRotation } from '../data/boardItems';
import { drawingColorKey } from '../components/board/drawTools';
import { repairCustomDrill } from '../lib/customDrills';
import { TAG_LABELS } from './reportText';
import { uid } from './id';
import { isSport, isPos, inBoard, centerBall, syncPlayers, createPhase } from './tacticModel';
import type { AppStore } from './types';

const VALID_VIEWS: AppView[] = ['dashboard', 'board', 'drills', 'calendar', 'training', 'reports', 'settings'];

// Hendelsene vaskes felt for felt, som taktikkene. Én ødelagt hendelse
// (null, feil type, manglende dato) fikk tidligere hele innlastingen til å
// kaste – da startet appen med standarddata og overskrev de lagrede dataene
// ved neste endring. Feltene hvitlistes: ukjente felt (som det gamle
// targetPlayerIds) forsvinner, og visningene kan stole på typen.
export const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;
const optStr = (v: unknown): string | undefined => typeof v === 'string' ? v : undefined;
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/**
 * Et objekt med samme id som et tidligere i lista får ny id. Handlingene finner
 * objekter på id, så to med samme id ble endret eller slettet sammen
 * (og removeTactic krasjet). Kan bare oppstå fra importerte eller skadde data.
 */
function uniqueIds<T extends { id: string }>(list: T[], make: () => string): T[] {
  const seen = new Set<string>();
  return list.map(x => {
    if (!seen.has(x.id)) { seen.add(x.id); return x; }
    const id = make();
    seen.add(id);
    return { ...x, id };
  });
}

function repairTrainingNote(raw: unknown): TrainingNote | null {
  const n = obj(raw);
  // Uten tittel er det ikke noe å vise – et tomt kort hjelper ingen.
  if (!n || typeof n.title !== 'string') return null;
  return {
    id: typeof n.id === 'string' ? n.id : uid(),
    createdAt: typeof n.createdAt === 'string' ? n.createdAt : new Date().toISOString(),
    title: n.title,
    content: typeof n.content === 'string' ? n.content : '',
    focus: strList(n.focus),
    ...(Number.isFinite(n.duration) && (n.duration as number) >= 0 ? { duration: n.duration as number } : {}),
    ...(typeof n.completed === 'boolean' ? { completed: n.completed } : {}),
    ...(typeof n.tacticId === 'string' ? { tacticId: n.tacticId } : {}),
  };
}

function repairMatchNote(raw: unknown): MatchNote | null {
  const n = obj(raw);
  // Kampnotatet er teksten; uten den er det ingenting igjen.
  if (!n || typeof n.content !== 'string') return null;
  return {
    id: typeof n.id === 'string' ? n.id : uid(),
    createdAt: typeof n.createdAt === 'string' ? n.createdAt : new Date().toISOString(),
    half: n.half === 2 || n.half === 3 ? n.half : 1,
    title: typeof n.title === 'string' ? n.title : '',
    content: n.content,
  };
}

/** Uten gyldig dato kan hendelsen ikke plasseres i kalenderen, og forkastes. */
export function repairEvent(raw: unknown): CalendarEvent | null {
  const e = obj(raw);
  if (!e || typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return null;
  const notes = <T,>(v: unknown, fix: (x: unknown) => T | null): T[] =>
    (Array.isArray(v) ? v : []).map(fix).filter((x): x is T => x !== null);
  return {
    id: typeof e.id === 'string' ? e.id : uid(),
    type: e.type === 'match' ? 'match' : 'training',
    title: typeof e.title === 'string' ? e.title : '',
    date: e.date,
    time: optStr(e.time),
    location: optStr(e.location),
    opponent: optStr(e.opponent),
    result: optStr(e.result),
    teamNote: typeof e.teamNote === 'string' ? e.teamNote : '',
    trainingNotes: uniqueIds(notes(e.trainingNotes, repairTrainingNote), uid),
    matchNotes: uniqueIds(notes(e.matchNotes, repairMatchNote), uid),
    ...(Array.isArray(e.attendance) ? { attendance: strList(e.attendance) } : {}),
  };
}

// Rapporter og øyeblikk vises i lister (MatchReport, BoardPanel) som leser
// feltene direkte. Uten vasking ga f.eks. `null` eller tags som streng en krasj
// hver gang listen ble åpnet.
const REPORT_TAGS = Object.keys(TAG_LABELS) as ReportTag[];

export function repairReport(raw: unknown): MatchReport | null {
  const r = obj(raw);
  // Den genererte teksten er selve rapporten; uten den er det ingenting å vise.
  if (!r || typeof r.generatedText !== 'string') return null;
  return {
    id: typeof r.id === 'string' ? r.id : uid(),
    eventId: optStr(r.eventId),
    matchTitle: optStr(r.matchTitle),
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    tags: strList(r.tags).filter((t): t is ReportTag => REPORT_TAGS.includes(t as ReportTag)),
    freeText: typeof r.freeText === 'string' ? r.freeText : '',
    generatedText: r.generatedText,
  };
}

// Snapshotet vises ikke noe sted i dag, så det sjekkes bare at det er et objekt.
export function repairMoment(raw: unknown): TacticMoment | null {
  const m = obj(raw);
  const snapshot = obj(m?.snapshot);
  if (!m || typeof m.name !== 'string' || !snapshot) return null;
  return {
    id: typeof m.id === 'string' ? m.id : uid(),
    name: m.name,
    timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date().toISOString(),
    ...(typeof m.tacticId === 'string' ? { tacticId: m.tacticId } : {}),
    snapshot: snapshot as unknown as TacticPhase,
  };
}

// v1 → v2: bare innstillinger, hendelser og navneliste tas med. Taktikkene starter på nytt.
export function migrateV1(old: Record<string, unknown>): Record<string, unknown> {
  const keep = ['homeTeamName', 'awayTeamName', 'awayTeamColor', 'ageGroup', 'moments', 'events', 'rosterNames', 'currentView'];
  const out: Record<string, unknown> = {};
  keep.forEach(k => { if (old[k] !== undefined) out[k] = old[k]; });
  return out;
}

const PATH_TYPES = ['freehand', 'arrow', 'curved-arrow', 'dashed'] as const;

export function repairItem(raw: unknown): BoardItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const i = raw as Record<string, unknown>;
  if (!BOARD_ITEM_TYPES.includes(i.type as BoardItemType) || !isPos(i.position)) return null;
  const rotation = Number.isFinite(i.rotation) ? normalizeRotation(i.rotation as number) : 0;
  return {
    id: typeof i.id === 'string' ? i.id : `item-${uid()}`, type: i.type as BoardItemType, position: inBoard(i.position),
    ...(Number.isFinite(i.rotation) ? { rotation } : {}),
  };
}

// Hver tegnetype har sine egne felter. De hvitlistes her, slik at et felt som
// mangler i denne funksjonen ikke forsvinner stille ved neste innlasting.
// Tegninger som ikke kan tegnes (for få punkter, tom tekst) forkastes.
export function repairDrawing(raw: unknown): Drawing | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const id = typeof d.id === 'string' ? d.id : `drawing-${uid()}`;
  const color = typeof d.color === 'string' ? d.color : '#EDEDEF';
  // Tegninger fra før temafargene får nærmeste palettfarge.
  const colorKey = drawingColorKey(d);

  if (d.type === 'circle' || d.type === 'rectangle') {
    return isPos(d.start) && isPos(d.end) ? { id, color, colorKey, type: d.type, start: d.start, end: d.end } : null;
  }
  if (d.type === 'label') {
    return isPos(d.at) && typeof d.text === 'string' && d.text.trim()
      ? { id, color, colorKey, type: 'label', at: d.at, text: d.text } : null;
  }
  // Uten type er det frihånd fra før verktøyene kom – den skal forbli uten type.
  if (d.type !== undefined && !PATH_TYPES.includes(d.type as PathDrawing['type'] & string)) return null;
  const pts = (Array.isArray(d.pts) ? d.pts : []).filter(isPos);
  if (pts.length < (d.type === 'curved-arrow' ? 3 : 2)) return null;
  return d.type === undefined
    ? { id, color, colorKey, pts }
    : { id, color, colorKey, type: d.type as PathDrawing['type'], pts };
}

export function repairTactic(raw: unknown): Tactic | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Partial<Tactic>;
  const sport: Sport = isSport(t.sport) ? t.sport : 'football';
  const formation = getFormations(sport).some(f => f.name === t.formation)
    ? (t.formation as string) : DEFAULT_FORMATION[sport];
  const empty = t.empty === true;
  // Tom bane har ingen formasjonsplasser: syncPlayers fjerner da alle
  // formasjonsspillere i stedet for å fylle dem inn.
  const slots = empty ? [] : getFormationSlots(sport, formation);

  const phases = uniqueIds((Array.isArray(t.phases) ? t.phases : [])
    .filter((ph): ph is TacticPhase => !!ph && typeof ph === 'object')
    .map((ph, i): TacticPhase => {
      // Samme spiller-id to ganger i én fase: den andre forkastes, og syncPlayers
      // fyller sloten med spilleren som står der i de andre fasene.
      const playerIds = new Set<string>();
      return {
      id: typeof ph.id === 'string' ? ph.id : `phase-${uid()}`,
      name: typeof ph.name === 'string' ? ph.name : `Fase ${i + 1}`,
      players: (Array.isArray(ph.players) ? ph.players : [])
        .filter((p): p is Player => !!p && typeof p.id === 'string' && isPos(p.position)
          && !playerIds.has(p.id) && (playerIds.add(p.id), true))
        .map(p => ({
          id: p.id, slotIdx: p.slotIdx, position: inBoard(p.position),
          // Samme regel som setPlayerNum: heltall 1–99.
          num: Number.isInteger(p.num) && p.num >= 1 && p.num <= 99
            ? p.num : (Number.isInteger(p.slotIdx) ? p.slotIdx + 1 : 0),
          name: typeof p.name === 'string' ? p.name : '',
          notes: typeof p.notes === 'string' ? p.notes : '',
        })),
      ball: isPos(ph.ball) ? inBoard(ph.ball) : centerBall(),
      drawings: uniqueIds((Array.isArray(ph.drawings) ? ph.drawings : [])
        .map(repairDrawing).filter((d): d is Drawing => d !== null), () => `drawing-${uid()}`),
      ...(ph.items === undefined ? {} : { items: uniqueIds((Array.isArray(ph.items) ? ph.items : [])
        .map(repairItem).filter((it): it is BoardItem => it !== null), () => `item-${uid()}`) }),
      ...(ph.stickyNote === undefined ? {} : { stickyNote: typeof ph.stickyNote === 'string' ? ph.stickyNote : '' }),
      };
    }), () => `phase-${uid()}`);
  const safePhases = syncPlayers(phases.length ? phases : [createPhase('Fase 1', slots)], slots);

  return {
    id: typeof t.id === 'string' ? t.id : `tactic-${uid()}`,
    name: typeof t.name === 'string' && t.name.trim() ? t.name : 'Taktikk',
    sport, formation,
    phases: safePhases,
    activePhaseIdx: Number.isInteger(t.activePhaseIdx)
      ? Math.max(0, Math.min(t.activePhaseIdx as number, safePhases.length - 1)) : 0,
    createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString(),
    ...(empty ? { empty: true } : {}),
  };
}

// Vaskefunksjonene over og under er eksportert for testene (useAppStore.test.ts).
// Appen bruker dem bare gjennom innlasting og import.

// Et korrupt lager skal aldri gi hvit skjerm: alt som ikke er gyldig erstattes med `current`.
export function repairPersisted(persisted: unknown, current: AppStore): Partial<AppStore> {
  const p = (persisted && typeof persisted === 'object' ? persisted : {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) => typeof v === 'string' ? v : fallback;
  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];

  const tactics = uniqueIds(arr<unknown>(p.tactics).map(repairTactic).filter((t): t is Tactic => t !== null),
    () => `tactic-${uid()}`);
  const safeTactics = tactics.length ? tactics : current.tactics;

  return {
    tactics: safeTactics,
    activeTacticId: safeTactics.some(t => t.id === p.activeTacticId) ? p.activeTacticId as string : safeTactics[0].id,
    ageGroup: p.ageGroup === 'youth' || p.ageGroup === 'adult' ? p.ageGroup : current.ageGroup,
    homeTeamName: str(p.homeTeamName, current.homeTeamName),
    awayTeamName: str(p.awayTeamName, current.awayTeamName),
    awayTeamColor: str(p.awayTeamColor, current.awayTeamColor),
    rosterNames: arr<unknown>(p.rosterNames).filter((n): n is string => typeof n === 'string'),
    events: uniqueIds(arr<unknown>(p.events).map(repairEvent).filter((e): e is CalendarEvent => e !== null), uid),
    customDrills: uniqueIds(arr<unknown>(p.customDrills).map(repairCustomDrill).filter((d): d is DrillExercise => d !== null)
      .map(d => ({ ...d, id: d.id.startsWith('custom-') ? d.id : `custom-${uid()}` })), () => `custom-${uid()}`),
    matchReports: uniqueIds(arr<unknown>(p.matchReports).map(repairReport).filter((r): r is MatchReport => r !== null), uid),
    moments: uniqueIds(arr<unknown>(p.moments).map(repairMoment).filter((m): m is TacticMoment => m !== null), uid),
    currentView: VALID_VIEWS.includes(p.currentView as AppView) ? p.currentView as AppView : current.currentView,
    lastExportedAt: typeof p.lastExportedAt === 'string' ? p.lastExportedAt : null,
    showMovement: p.showMovement === true,
  };
}
