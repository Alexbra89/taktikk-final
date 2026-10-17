// ══════════════════════════════════════════════════════════════
//  FEILLOGG – de siste feilene, bare på denne enheten
//
//  Ingen server og ingen ekstern tjeneste. Brukeren kopierer selv
//  rapporten fra Innstillinger og sender den til den som skal hjelpe.
//  Loggen ligger under en egen nøkkel, utenfor storen, og kommer
//  derfor aldri med i backupfilen.
//
//  Personvern: bare tidspunkt, appversjon, del av appen, feilmelding,
//  kort stack og nettleser/enhet. Bare kjente tekniske feilmeldinger
//  lagres; all annen tekst (der navn, taktikker og notater kan havne)
//  byttes ut med en fast tekst.
// ══════════════════════════════════════════════════════════════

export const ERROR_LOG_KEY = 'taktikk:error-log';
/** Sendes på window når loggen endres, så Innstillinger kan vise den nye tilstanden. */
export const ERROR_LOG_EVENT = 'taktikk:error-log';
export const MAX_ERRORS = 30;

const MAX_MESSAGE = 300;
const STACK_LINES = 6;
const MAX_STACK = 1200;
/** Samme feil to ganger innen dette regnes som én (React i utvikling melder den både til vinduet og feilskjermen). */
const DUPLICATE_MS = 3000;

/** Delene av appen. Nøkkelen lagres, etiketten vises i rapporten. */
export const AREA_LABELS: Record<string, string> = {
  app: 'Hele appen',
  global: 'Hele appen (rot)',
  dashboard: 'Oversikt',
  board: 'Taktikk (2D)',
  '3d': 'Taktikk (3D)',
  fullscreen: 'Fullskjerm (2D)',
  training: 'Trening',
  calendar: 'Kalender',
  drills: 'Øvelser',
  reports: 'Rapporter',
  settings: 'Innstillinger',
  ai: 'AI-treneren',
  smartcoach: 'Smart Coach',
  report: 'Kamprapport',
};

/** skjerm: fanget av en feilskjerm. vindu: window.onerror. promise: unhandledrejection. */
export type ErrorSource = 'skjerm' | 'vindu' | 'promise';

export interface ErrorEntry {
  at: string;
  version: string;
  area: string;
  source: ErrorSource;
  message: string;
  stack: string;
  device: string;
}

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Vasker stacklinjer. Fjerner det som kan være brukerens egen tekst. Tekst i anførselstegn byttes
 * ut, unntatt korte kodenavn med liten forbokstav («'phases'»), som er
 * nyttige og ikke er navn på folk eller taktikker. E-post fjernes også.
 */
export function scrubText(text: string): string {
  return text
    .replace(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`|«[^»\n]*»|“[^”\n]*”|‘[^’\n]*’/g, quoted => {
      const inner = quoted.slice(1, -1);
      return /^[a-z_$][\w$.]{0,40}$/.test(inner) ? quoted : '"…"';
    })
    // (?![\w:]): «fn@fil.js:1:2» i en stack er ikke en e-postadresse.
    .replace(/[^\s@()/:]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}(?![\w:])/gi, '[e-post]');
}

/** Vises i stedet for en melding som ikke er en kjent teknisk feil. */
export const HIDDEN_MESSAGE = '(melding skjult: kan inneholde egen tekst)';

/** Appens egne feilmeldinger som logges. */
const APP_MESSAGES = new Set(['WebGL 2 støttes ikke eller er slått av i nettleseren']);

// Kodenavn og kodeuttrykk slik nettleseren skriver dem: ingen mellomrom, så ikke fritekst.
const ID = String.raw`[A-Za-z_$][\w$]{0,60}`;
const EXPR = String.raw`(?:\(intermediate value\)|${ID})(?:\.${ID}|\(\.\.\.\)|\(\)|\[\d+\])*`;

/** Står i stedet for egenskapsnavnet i «reading '…'» og lignende. */
const HIDDEN_PROP = '…';

/**
 * Egenskapsnavnet i disse meldingene er en verdi fra kjøringen (obj[navn]), ikke fra koden,
 * og kan være et navn fra brukerens data. Bare malen beholdes.
 */
function hideProperty(text: string): string {
  return text
    .replace(/^(Cannot (?:read|set) properties of (?:undefined|null) \((?:reading|setting) )'[\s\S]*'\)$/, `$1'${HIDDEN_PROP}')`)
    .replace(/^(can't access property )"[\s\S]*"(, )/, `$1"${HIDDEN_PROP}"$2`);
}

/**
 * Kjente feilmeldinger fra Chrome/Edge, Firefox, Safari, React og Next.
 * Med $ må hele meldingen passe. Uten $ beholdes bare starten, og resten
 * (som kan være en adresse eller innhold) byttes ut med «…».
 */
const KNOWN_MESSAGES = [
  // Chrome/Edge
  `Cannot read properties of (?:undefined|null) \\(reading '${HIDDEN_PROP}'\\)$`,
  `Cannot set properties of (?:undefined|null) \\(setting '${HIDDEN_PROP}'\\)$`,
  `Cannot destructure property '${ID}' of '${EXPR}' as it is (?:undefined|null)\\.?$`,
  `Cannot access '${ID}' before initialization$`,
  `${EXPR} is not (?:a function|a constructor|defined|iterable)$`,
  `${EXPR} is not a function or its return value is not iterable$`,
  'object is not iterable \\(cannot read property Symbol\\(Symbol\\.iterator\\)\\)$',
  'Assignment to constant variable\\.?$',
  'Maximum call stack size exceeded\\.?$',
  'Invalid (?:time value|array length|string length|Date)$',
  'Unexpected end of JSON input$',
  // Firefox
  `can't access property "${HIDDEN_PROP}", ${EXPR} is (?:undefined|null)$`,
  `can't access lexical declaration '${ID}' before initialization$`,
  `${EXPR} is (?:undefined|null)$`,
  `${EXPR} has no properties$`,
  'too much recursion$',
  'JSON\\.parse: [a-z ]+ at line \\d+ column \\d+ of the JSON data$',
  // Safari
  `(?:undefined|null) is not an object \\(evaluating '[\\w$.()\\[\\]]{1,120}'\\)$`,
  `Can't find variable: ${ID}$`,
  // Nett, lagring og avbrudd
  'Failed to fetch$', 'Load failed$', 'NetworkError when attempting to fetch resource\\.?$',
  'The operation was aborted\\.?$', 'signal is aborted without reason$', 'The user aborted a request\\.?$',
  'The quota has been exceeded\\.?$',
  `Failed to execute '${ID}' on '${ID}'`,
  // React, Next og nye versjoner av appen
  'Minified React error #\\d+',
  'Rendered (?:more|fewer) hooks than',
  'Too many re-renders\\.',
  'Objects are not valid as a React child',
  'Hydration failed',
  'Text content does not match server-rendered HTML\\.?$',
  'There was an error while hydrating',
  'Loading (?:CSS )?chunk [\\w/.-]+ failed',
  'Failed to load chunk',
  'ResizeObserver loop',
  'Script error\\.?$',
  '[Oo]ut of memory\\.?$',
].map(source => new RegExp(`^${source}`));

/** Kjent teknisk melding beholdes (eventuelt bare starten); alt annet skjules. */
function safeMessage(message: string): string {
  const text = hideProperty(message.trim());
  if (!text) return '';
  if (APP_MESSAGES.has(text)) return text;
  // Chrome skriver «Unexpected token 'x', "<innhold>" is not valid JSON»: innholdet skal ikke med.
  if (/is not valid JSON$|in JSON at position \d+$/.test(text)) return 'Ugyldig JSON (innholdet er skjult)';
  for (const re of KNOWN_MESSAGES) {
    const m = text.match(re);
    if (m) return m[0].length < text.length ? `${m[0]} …` : m[0];
  }
  return HIDDEN_MESSAGE;
}

/** Feiltypen er et kodenavn (TypeError, ChunkLoadError). Noe annet regnes som «Error». */
function safeName(name: unknown): string {
  return typeof name === 'string' && /^[A-Za-z_$][\w$]{0,40}$/.test(name) ? name : 'Error';
}

function shortMessage(error: unknown): string {
  let text: string;
  if (error instanceof Error) {
    text = `${safeName(error.name)}: ${safeMessage(String(error.message ?? '')) || 'Ukjent feil'}`;
  } else if (typeof error === 'string') {
    // window.onerror uten feilobjekt: «Uncaught TypeError: x is not a function».
    const m = error.trim().replace(/^Uncaught\s+/, '').match(/^([A-Za-z_$][\w$]*(?:Error|Exception)): ([\s\S]*)$/);
    text = m ? `${m[1]}: ${safeMessage(m[2]) || 'Ukjent feil'}` : safeMessage(error) || 'Ukjent feil';
  } else {
    text = 'Ukjent feil (ikke et Error-objekt)';
  }
  return text.length > MAX_MESSAGE ? `${text.slice(0, MAX_MESSAGE)}…` : text;
}

/** De første linjene av stacken, uten adresse og spørreparametre. */
function shortStack(error: unknown): string {
  if (!(error instanceof Error) || !error.stack) return '';
  // Chrome begynner stacken med meldingen. Den står allerede (vasket) i message.
  const head = `${error.name}: ${error.message}`;
  const frames = error.stack.startsWith(head) ? error.stack.slice(head.length) : error.stack;
  const lines = frames.split('\n')
    .map(l => l.trim())
    // Bare kallrammene: «at fn (fil:1:2)» i Chrome, «fn@fil:1:2» ellers.
    .filter(l => l.startsWith('at ') || /@.*:\d+/.test(l))
    .slice(0, STACK_LINES)
    // Bare filnavnet blir igjen: ingen adresse, spørreparametre eller mappesti (som kan ha et brukernavn).
    .map(l => scrubText(l
      .replace(/[?#][^\s:)]*/g, '')
      .replace(/(?:[a-z][\w+.-]*:\/\/[^/\s)]*)?(?:[^\s()]*[\\/])?([^\s()\\/]+:\d+:\d+)/gi, '$1')));
  const stack = lines.join('\n');
  return stack.length > MAX_STACK ? `${stack.slice(0, MAX_STACK)}…` : stack;
}

/** «Edge 140 · Windows · 1400×900 · berøring». Ingen fullstendig user agent. */
export function describeDevice(): string {
  try {
    const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent ?? '';
    const browser =
      match(ua, /Edg(?:A|iOS)?\/(\d+)/, 'Edge') ??
      match(ua, /OPR\/(\d+)/, 'Opera') ??
      match(ua, /SamsungBrowser\/(\d+)/, 'Samsung Internet') ??
      match(ua, /(?:Firefox|FxiOS)\/(\d+)/, 'Firefox') ??
      match(ua, /(?:Chrome|CriOS)\/(\d+)/, 'Chrome') ??
      match(ua, /Version\/(\d+).*Safari/, 'Safari') ??
      'Ukjent nettleser';
    const os =
      /iPhone/.test(ua) ? 'iPhone' :
      /iPad/.test(ua) ? 'iPad' :
      /Android/.test(ua) ? 'Android' :
      /Windows/.test(ua) ? 'Windows' :
      /Mac OS X|Macintosh/.test(ua) ? 'macOS' :
      /Linux/.test(ua) ? 'Linux' : 'ukjent system';
    const parts = [browser, os];
    if (typeof window !== 'undefined' && window.innerWidth) {
      parts.push(`${window.innerWidth}×${window.innerHeight}`);
      if (window.matchMedia?.('(pointer: coarse)').matches) parts.push('berøring');
      if (window.matchMedia?.('(display-mode: standalone)').matches) parts.push('installert app');
    }
    return parts.join(' · ');
  } catch {
    return 'ukjent enhet';
  }
}

function match(ua: string, re: RegExp, name: string): string | undefined {
  const m = ua.match(re);
  return m ? `${name} ${m[1]}` : undefined;
}

export function readErrorLog(): ErrorEntry[] {
  try {
    const raw = getStorage()?.getItem(ERROR_LOG_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(e => e && typeof e.message === 'string').slice(0, MAX_ERRORS) : [];
  } catch {
    return [];
  }
}

function writeErrorLog(list: ErrorEntry[]) {
  // Loggen er et hjelpemiddel: full eller blokkert lagring skal ikke gi nye feil eller varsler.
  try {
    const storage = getStorage();
    if (!storage) return;
    if (list.length) storage.setItem(ERROR_LOG_KEY, JSON.stringify(list.slice(0, MAX_ERRORS)));
    else storage.removeItem(ERROR_LOG_KEY);
    window.dispatchEvent(new CustomEvent(ERROR_LOG_EVENT));
  } catch { /* ignoreres */ }
}

/** Lagrer feilen øverst i loggen. Kaster aldri. */
export function logError(error: unknown, area: string, source: ErrorSource = 'skjerm'): void {
  try {
    const entry: ErrorEntry = {
      at: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'ukjent',
      area,
      source,
      message: shortMessage(error),
      stack: shortStack(error),
      device: describeDevice(),
    };
    const list = readErrorLog();
    const last = list[0];
    if (last && last.message === entry.message && last.stack === entry.stack
      && Date.parse(entry.at) - Date.parse(last.at) < DUPLICATE_MS) {
      // Feilskjermen vet bedre hvilken del som feilet enn vinduet gjør.
      if (source === 'skjerm' && last.source !== 'skjerm') {
        list[0] = { ...last, area, source };
        writeErrorLog(list);
      }
      return;
    }
    writeErrorLog([entry, ...list]);
  } catch { /* loggen skal aldri lage nye feil */ }
}

export function clearErrorLog(): void {
  writeErrorLog([]);
}

/** Lesbar tekst til utklippstavlen. */
export function formatErrorReport(list: ErrorEntry[], now = new Date()): string {
  const head = [
    'Feilrapport – Taktikkboard',
    `Laget: ${formatTime(now.toISOString())}`,
    `Appversjon: ${process.env.NEXT_PUBLIC_APP_VERSION || 'ukjent'}`,
    `Enhet: ${describeDevice()}`,
    `Antall feil: ${list.length} (de siste ${MAX_ERRORS} lagres)`,
    'Rapporten inneholder ikke taktikker, notater eller navn.',
  ];
  if (!list.length) return [...head, '', 'Ingen feil er registrert.'].join('\n');
  const source: Record<ErrorSource, string> = {
    skjerm: 'vist som feilskjerm',
    vindu: 'ufanget feil',
    promise: 'ufanget feil i bakgrunnen',
  };
  const body = list.map((e, i) => [
    `#${i + 1} · ${formatTime(e.at)} · ${AREA_LABELS[e.area] ?? e.area} (${source[e.source] ?? e.source})`,
    `Versjon ${e.version} · ${e.device}`,
    e.message,
    ...(e.stack ? e.stack.split('\n').map(l => `  ${l}`) : []),
  ].join('\n'));
  return [...head, '', ...body.flatMap(b => [b, ''])].join('\n').trimEnd();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('nb-NO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/**
 * Fanger feil som ingen feilskjerm ser: window.onerror og avviste løfter.
 * getArea gir delen brukeren står i. Returnerer opprydding.
 */
export function installGlobalErrorHandlers(getArea: () => string): () => void {
  const onError = (e: ErrorEvent) => {
    // Lastefeil for script og bilder har ingen error; de er ikke kodefeil.
    if (!e.error && !e.message) return;
    // Ufarlig nettlesermelding (3D bruker ResizeObserver), og «Script error.» uten innhold.
    if (!e.error && /^(ResizeObserver loop|Script error)/.test(e.message)) return;
    logError(e.error ?? e.message, getArea(), 'vindu');
  };
  const onRejection = (e: PromiseRejectionEvent) => logError(e.reason, getArea(), 'promise');
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
