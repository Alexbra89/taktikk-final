import type { AiArea, AiMode } from './request';

// ══════════════════════════════════════════════════════════════
//  HURTIGVALG I AI-TRENEREN – snarveier som starter en samtale.
//  label vises i chatten som trenerens melding; prompt er det som
//  sendes. Etterpå fortsetter samtalen fritt (modus CHAT).
//  mode styrer bare oppgaven i prompten; en brettmodus sender brettet.
// ══════════════════════════════════════════════════════════════

export interface QuickAction {
  id: string;
  label: string;
  hint?: string;
  mode: AiMode;
  prompt: string;
}

/** «Still AI et spørsmål» – setter bare fokus i tekstfeltet. */
export const ASK_ACTION_ID = 'ask';

const ask: QuickAction = { id: ASK_ACTION_ID, label: 'Still AI et spørsmål', hint: 'Skriv fritt', mode: 'CHAT', prompt: '' };

const DASHBOARD: QuickAction[] = [
  { id: 'plan-next', label: 'Planlegg neste trening', hint: 'Bygger på kalenderen og det dere har trent på',
    mode: 'CHAT', prompt: 'Planlegg neste trening for oss: oppvarming, hoveddel og avslutning med minutter. Bygg på neste trening, neste kamp og det vi har trent på den siste tiden.' },
  { id: 'drill', label: 'Lag en øvelse', hint: 'Tilpasset laget og formasjonen',
    mode: 'CHAT', prompt: 'Lag en øvelse til oss.' },
  { id: 'analyze', label: 'Analyser taktikken min', hint: 'Aktiv taktikk og fase på brettet',
    mode: 'ANALYZE_PHASE', prompt: 'Analyser taktikken min, med vekt på fasen som er aktiv på brettet.' },
  { id: 'what-train', label: 'Hva bør vi trene på?', hint: 'Ut fra trening, kamper og rapporter',
    mode: 'CHAT', prompt: 'Hva bør vi trene på nå? Begrunn ut fra det du ser om treningene, kampene og rapportene våre, og foreslå 2–3 prioriteringer.' },
  { id: 'week', label: 'Hjelp meg planlegge uka', hint: 'Forslag – du legger det inn selv',
    mode: 'CHAT', prompt: 'Hjelp meg å planlegge uka: tema og innhold for hver trening, og hvordan vi forbereder oss til neste kamp.' },
  { id: 'development', label: 'Spillerutvikling', hint: 'Prioriteringer for aldersgruppen',
    mode: 'CHAT', prompt: 'Gi meg råd om spillerutvikling for laget vårt: hva bør vi prioritere for denne aldersgruppen, og hvordan følger jeg opp enkeltspillere på trening?' },
  ask,
];

const BOARD: QuickAction[] = [
  { id: 'analyze', label: 'Analyser denne fasen', hint: 'Styrker, svakheter og forbedringer',
    mode: 'ANALYZE_PHASE', prompt: 'Analyser denne fasen.' },
  { id: 'coaching', label: 'Hva bør jeg coache?', hint: 'Punkter du kan si på banen',
    mode: 'COACHING', prompt: 'Hva bør jeg coache i denne fasen?' },
  { id: 'improve', label: 'Hvordan kan vi forbedre denne fasen?', hint: 'Konkrete endringer med spiller og retning',
    mode: 'CHAT', prompt: 'Hvordan kan vi forbedre denne fasen? Gi konkrete endringer: hvilke spillere, hvor de bør stå eller løpe (i prosent av banen), og hvorfor.' },
  { id: 'drill', label: 'Lag en øvelse basert på denne fasen', hint: 'Mål, organisering og progresjon',
    mode: 'DRILL', prompt: 'Lag en øvelse basert på denne fasen.' },
  { id: 'next-phase', label: 'Hva bør være neste fase?', hint: 'Bevegelser og ballens vei',
    mode: 'NEXT_PHASE', prompt: 'Hva bør være neste fase?' },
  { id: 'explain', label: 'Forklar dette til spillerne', hint: 'Enkelt språk og stikkord',
    mode: 'CHAT', prompt: 'Forklar denne fasen slik at jeg kan si det direkte til spillerne: hva laget skal gjøre, hva de viktigste rollene gjør, og 2–3 stikkord jeg kan rope på banen.' },
  ask,
];

const TRAINING: QuickAction[] = [
  { id: 'plan', label: 'Planlegg treningen', hint: 'Oppvarming, hoveddel og avslutning',
    mode: 'CHAT', prompt: 'Planlegg treningen: oppvarming, hoveddel og avslutning med minutter. Bygg på treningen i dataene hvis den finnes.' },
  { id: 'warmup', label: 'Lag oppvarming', hint: 'Med ball, knyttet til temaet',
    mode: 'CHAT', prompt: 'Lag en oppvarming med ball til treningen, knyttet til temaet for økta.' },
  { id: 'main', label: 'Lag hovedøvelse', hint: 'Mål, organisering og coachingpunkter',
    mode: 'CHAT', prompt: 'Lag en hovedøvelse til treningen.' },
  { id: 'progression', label: 'Lag progresjon', hint: 'Fra enkelt til kamplikt',
    mode: 'CHAT', prompt: 'Lag en progresjon for treningen: hvordan øvelsene bygger på hverandre fra enkelt til kamplikt, med varighet per steg.' },
  ask,
];

/** Tema for en hovedøvelse i Trening. */
export const TRAINING_THEMES = ['Angrep', 'Forsvar', 'Overgang', 'Press', 'Spilloppbygging', 'Avslutninger'] as const;

export const themeAction = (theme: string): QuickAction => ({
  id: `theme-${theme}`,
  label: `Hovedøvelse: ${theme.toLowerCase()}`,
  mode: 'CHAT',
  prompt: `Lag en hovedøvelse med fokus på ${theme.toLowerCase()}, tilpasset treningen vår.`,
});

const CALENDAR: QuickAction[] = [
  { id: 'what-train', label: 'Hva bør vi trene på?', hint: 'Ut fra det som kommer og det dere har gjort',
    mode: 'CHAT', prompt: 'Hva bør vi trene på de neste ukene? Begrunn ut fra kommende aktiviteter og det vi har trent på den siste tiden.' },
  { id: 'plan-next', label: 'Planlegg neste trening', hint: 'Innhold og minutter',
    mode: 'CHAT', prompt: 'Planlegg neste trening i kalenderen: tema, oppvarming, hoveddel og avslutning med minutter.' },
  { id: 'session', label: 'Foreslå treningsøkt', hint: 'En komplett økt du kan legge inn',
    mode: 'CHAT', prompt: 'Foreslå en komplett treningsøkt vi kan legge inn i kalenderen: tittel, varighet, tema og innhold med minutter.' },
  { id: 'week', label: 'Hjelp meg planlegge uka', hint: 'Forslag – du legger det inn selv',
    mode: 'CHAT', prompt: 'Hjelp meg å planlegge uka ut fra kalenderen: hva hver trening bør handle om, og belastning mot neste kamp.' },
  { id: 'match-prep', label: 'Forbered oss til neste kamp', hint: 'Treninger og fokus frem mot kampen',
    mode: 'CHAT', prompt: 'Hvordan bør vi forberede oss til neste kamp? Foreslå fokus og innhold for treningene frem mot kampen.' },
  ask,
];

export const QUICK_ACTIONS: Record<AiArea, QuickAction[]> = {
  dashboard: DASHBOARD,
  board: BOARD,
  training: TRAINING,
  calendar: CALENDAR,
  general: DASHBOARD,
};
