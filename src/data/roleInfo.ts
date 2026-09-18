import { Sport, PlayerRole } from '../types';

export interface RoleMeta {
  label:       string;
  color:       string;
  border:      string;
  emoji:       string;
  description: string;
  responsibilities?: string[];
}

export const ROLE_META: Record<PlayerRole, RoleMeta> = {

  // ─── FOTBALL ───────────────────────────────────────────────

  keeper: {
    label: 'Keeper', color: '#f59e0b', border: '#d97706', emoji: '🧤',
    description:
      'Keeperen er lagets siste forsvarslinje og eneste spiller som kan bruke hendene innenfor eget 16-meter felt. ' +
      'Oppgavene inkluderer å redde skudd, organisere forsvaret, lese spillet og starte angrep med presise utkast og spark. ' +
      'En god keeper kommuniserer konstant med forsvarerne, er eksplosiv på korte distanser og trygg i luftdueller. ' +
      'Moderne keepere forventes også å delta aktivt i pasningsspillet.',
    responsibilities: [
      'Redde skudd fra alle vinkler',
      'Organisere forsvaret med kommunikasjon',
      'Starte angrep med presise utspark',
      'Være trygg i luftdueller',
      'Leser motstanderens avslutninger'
    ]
  },

  defender: {
    label: 'Midtback', color: '#3b82f6', border: '#2563eb', emoji: '🛡️',
    description:
      'Midtbacken er ryggraden i forsvaret og har ansvar for å hindre motstanderens spisser fra å komme til skudd. ' +
      'Viktige egenskaper er posisjonering, heading, taklinger og evne til å lese spillet tidlig. ' +
      'Midtbacken starter ofte angrep med lange baller eller korte pasninger til vingbackene. ' +
      'I moderne fotball forventes midtbacken å være komfortabel med ballen og bidra i oppbyggingsspillet.',
    responsibilities: [
      'Vinne hodedueller og taklinger',
      'Dekke bakrom og posisjonere seg riktig',
      'Bygge opp spill bakfra',
      'Kommunisere med keeper og backs',
      'Leser motstanderens angrepsmønster'
    ]
  },

  wingback: {
    label: 'Vingback', color: '#06b6d4', border: '#0891b2', emoji: '⚡',
    description:
      'Vingbacken er en hybrid mellom back og kantspiller. De opererer langs sidelinjene og har ansvar for ' +
      'både defensivt arbeid og offensivt løpsspill. Vingbacken overlapper mye, slår innlegg og skaper overtalssituasjoner. ' +
      'Defensivt dekker de bredsiden og hjelper til mot motstanderens kantspillere. ' +
      'Krever stor utholdenhet og evne til å løpe frem og tilbake gjennom hele kampen.',
    responsibilities: [
      'Dekke bredsiden defensivt',
      'Overlappe og slå innlegg',
      'Skape overtall i angrep',
      'Løpe frem og tilbake hele kampen',
      'Stoppe motstanderens kantspillere'
    ]
  },

  sweeper: {
    label: 'Sweeper', color: '#1d4ed8', border: '#1e40af', emoji: '🔒',
    description:
      'Sweeperen er en ekstra forsvarsspiller som dekker rommet bak de andre forsvarerne. ' +
      'Rollen brukes sjelden i moderne fotball, men er effektiv mot hurtige spisser. ' +
      'Sweeperen griper inn der det er hull i forsvaret og er lagets siste feltspiller.',
    responsibilities: [
      'Dekke rom bak forsvarslinjen',
      'Gripe inn ved gjennombrudd',
      'Være lagets siste feltspiller',
      'Kommunisere med resten av forsvaret'
    ]
  },

  midfielder: {
    label: 'Midtbane', color: '#22c55e', border: '#16a34a', emoji: '⚙️',
    description:
      'Midtbanespilleren er lagets motor og bindeleddet mellom forsvar og angrep. ' +
      'De vinner baller, fordeler spillet og dekker store områder av banen. ' +
      'En sentral midtbanespiller må kunne skjermball, slå korte og lange pasninger, komme seg inn i boksen og ' +
      'delta defensivt. God løpskapasitet, tekniske ferdigheter og taktisk forståelse er avgjørende.',
    responsibilities: [
      'Vinne baller i midtbanen',
      'Fordele spillet med pasninger',
      'Dekke store områder av banen',
      'Delta både offensivt og defensivt',
      'Skjerme ball under press'
    ]
  },

  box2box: {
    label: 'Box-to-box', color: '#10b981', border: '#059669', emoji: '🔄',
    description:
      'Box-to-box-spilleren løper fra straffefelt til straffefelt og deltar aktivt i både forsvar og angrep. ' +
      'De er lagets mest arbeidsomme spiller, alltid i bevegelse for å støtte lagkameratene. ' +
      'Må ha ekstraordinær utholdenhet, god skuddføre og evne til å komme inn fra bakre rekker.',
    responsibilities: [
      'Løpe fra straffefelt til straffefelt',
      'Delta i både forsvar og angrep',
      'Komme inn fra bakre rekker',
      'Ha ekstraordinær utholdenhet',
      'True mål med skudd utenfra boksen'
    ]
  },

  playmaker: {
    label: 'Playmaker', color: '#8b5cf6', border: '#7c3aed', emoji: '🎯',
    description:
      'Playmakerens oppgave er å styre lagets spill og skape sjanser for medspillerne. ' +
      'De har høy teknisk standard, utmerkede pasningsferdigheter og evnen til å lese spillet flere trekk frem i tid. ' +
      'En ekte playmaker ser rom andre ikke ser, spiller nøkkelpasninger og dikterer spillets tempo. ' +
      'Krever ro under press og evne til å ta gode beslutninger raskt.',
    responsibilities: [
      'Styre lagets spill og tempo',
      'Spille nøkkelpasninger',
      'Skape sjanser for medspillere',
      'Ha ro under press',
      'Leser spillet flere trekk frem'
    ]
  },

  winger: {
    label: 'Kantspiller', color: '#f97316', border: '#ea580c', emoji: '💨',
    description:
      'Kantspilleren opererer langs sidelinjene og er lagets viktigste dribbler og innleggsmaker. ' +
      'De utnytter fart og teknikk til å passere motstandere en-mot-en og slå innlegg eller skjære inn mot mål. ' +
      'Moderne kantspillere forventes å score mål, presse motstanderens backs defensivt og bidra i pressing. ' +
      'Kreativitet, fart over kort distanse og god avslutning er nøkkelkvaliteter.',
    responsibilities: [
      'Drible og passere en-mot-en',
      'Slå innlegg fra kant',
      'Skjære inn mot mål og avslutte',
      'Presse motstanderens backs',
      'Score mål'
    ]
  },

  forward: {
    label: 'Spiss', color: '#ef4444', border: '#dc2626', emoji: '⚡',
    description:
      'Spissen er lagets fremste målscorer og presser motstanderens forsvar konstant. ' +
      'Oppgavene inkluderer å score mål, holde på ballen for medspillere og presse motstanderens forsvarsspillere. ' +
      'En klassisk spiss er sterk i luften og i dueller i boksen. En moderne spiss er ofte mobile og deltar ' +
      'aktivt i kombinasjonsspillet. Avslutningsstyrke, timing og posisjonering i boksen er avgjørende.',
    responsibilities: [
      'Score mål',
      'Holde på ballen for medspillere',
      'Presse motstanderens forsvar',
      'Være sterk i luftdueller',
      'Posisjonere seg riktig i boksen'
    ]
  },

  false9: {
    label: 'Falsk 9er', color: '#ec4899', border: '#db2777', emoji: '🎭',
    description:
      'Den falske 9eren starter som spiss men trekker seg tilbake for å skape rom og forvirre motstanderens forsvar. ' +
      'Dette åpner rom for kantspillere og box-to-box-spillere som løper inn fra bakre rekker. ' +
      'Rollen krever høy teknisk kvalitet, god oversikt og evne til å kombinere med medspillere i trange rom.',
    responsibilities: [
      'Trekke tilbake fra spissposisjon',
      'Skape rom for medspillere',
      'Kombinere i trange rom',
      'Forvirre motstanderens forsvar',
      'Ha høy teknisk kvalitet'
    ]
  },

  trequartista: {
    label: 'Trequartista', color: '#a855f7', border: '#9333ea', emoji: '✨',
    description:
      'Trequartista er en kreativ angripende midtbanespiller som opererer i rommet mellom motstanderens midtbane og forsvar. ' +
      'Rollen stammer fra italiensk fotball og betyr bokstavelig talt "trekvartsposisjon". ' +
      'Spilleren skaper sjanser gjennom geniale pasninger, dribblinger og uventede bevegelser. ' +
      'Defensivt arbeid prioriteres lavt — lagets andre midtbanespillere kompenserer.',
    responsibilities: [
      'Operere mellom motstanderens midtbane og forsvar',
      'Skape sjanser med geniale pasninger',
      'Drible og uventede bevegelser',
      'Fokusere på offensiv kreativitet',
      'La andre midtbanespillere dekke defensivt'
    ]
  },

  targetman: {
    label: 'Targetman', color: '#dc2626', border: '#b91c1c', emoji: '🎯',
    description:
      'Targetmannen er en fysisk sterk spiss som er et mål for lange baller og høye innlegg. ' +
      'De vinner dueller i luften og holder på ballen for medspillere som løper inn. ' +
      'Viktige egenskaper er fysisk styrke, heading, skjerming av ball og evne til å holde seg oppe mot tøffe forsvarere.',
    responsibilities: [
      'Være mål for lange baller',
      'Vinne hodedueller',
      'Holde på ballen og skjerme',
      'Legge av til medspillere',
      'Være fysisk sterk'
    ]
  },

  pressforward: {
    label: 'Pressforward', color: '#f43f5e', border: '#e11d48', emoji: '🏃',
    description:
      'Pressforward er en spiss med ekstraordinær arbeidskapasitet og pressing-evner. ' +
      'De jager motstanderens forsvarere konstant, tvinger feil og vinner baller høyt på banen. ' +
      'I tillegg til pressing forventes de å score mål og bidra i overgangsspillet. ' +
      'Krever enorm utholdenhet, aggressivitet og evne til å lese når presset skal settes inn.',
    responsibilities: [
      'Presse motstanderens forsvarere',
      'Tvinge feil høyt på banen',
      'Vinne baller i angrepssone',
      'Ha enorm arbeidskapasitet',
      'Score mål og bidra i overgangsspillet'
    ]
  },

  libero: {
    label: 'Libero', color: '#64748b', border: '#475569', emoji: '🛡️',
    description:
      'Libero er en allsidig forsvarsspiller som kan rykke frem og delta i oppbyggingsspillet. ' +
      'I moderne bruk betyr libero ofte en forsvarsspiller med gode tekniske ferdigheter som fungerer som en ekstra midtbane ' +
      'når laget har ballen. Defensivt er libero ansvarlig for å dekke rom og hjelpe til i direkte dueller.',
    responsibilities: [
      'Rykke frem i oppbyggingsspillet',
      'Fungere som ekstra midtbanespiller',
      'Dekke rom defensivt',
      'Ha gode tekniske ferdigheter',
      'Hjelpe til i direkte dueller'
    ]
  },
};

// ─── Hjelpefunksjoner ──────────────────────────────────────────

export function getRolesForSport(sport: Sport): PlayerRole[] {
  // football + football5 + football7 + football9
  return ['keeper','defender','wingback','sweeper','midfielder','box2box','playmaker','winger','forward','false9','trequartista','targetman','pressforward','libero'];
}

// For barn/fotball7 – forenklede roller
export function getRolesForYouth(): PlayerRole[] {
  return ['keeper', 'defender', 'midfielder', 'forward'];
}

// ─── ROLE FAMILY (brukes for out-of-position detection i TacticBoard) ───
export const ROLE_FAMILY: Record<string, string> = {
  keeper: 'gk',
  sweeper: 'gk',
  libero: 'gk',
  defender: 'def',
  wingback: 'def',
  sweeper_keeper: 'def',
  midfielder: 'mid',
  box2box: 'mid',
  playmaker: 'mid',
  defensive_mid: 'mid',
  winger: 'att',
  forward: 'att',
  false9: 'att',
  trequartista: 'att',
  targetman: 'att',
  pressforward: 'att',
};