import { PlayerRole, Sport } from '../types';

export interface RoleMeta {
  label: string;
  color: string;
  border: string;
  emoji: string;
  sports: Sport[];
  description: string;
  responsibilities: string[];
  tacticalTips: string[];
  examplePlayers?: string[];
}

export const ROLE_META: Record<PlayerRole, RoleMeta> = {

  // ─── FOTBALL – PRIMÆRNØKLER (brukes på brettet) ─────────────

  keeper: {
    label: 'Keeper', color: '#f59e0b', border: '#d97706', emoji: '🧤',
    sports: ['football', 'handball'],
    description: 'Siste skanse – hindrer mål og starter oppspill fra bakre linje.',
    responsibilities: [
      'Redde skudd fra alle vinkler og distanser',
      'Styre forsvarslinjen og organisere offsidefelle',
      'Starte oppspill med nøyaktige korte og lange pasninger',
      'Beherske feltsituasjoner – innlegg og corner',
    ],
    tacticalTips: [
      'Les avslutternes kroppsspråk og øyne for å forutsi skuddretning',
      'Posisjon på ballen – alltid minste vinkel mot skytter',
      'Moderne keeper er første passningsspiller i oppbygging',
      'Kommuniser konstant – du ser hele banen foran deg',
    ],
    examplePlayers: ['Manuel Neuer', 'Alisson Becker', 'Ederson'],
  },

  defender: {
    label: 'Forsvarer', color: '#3b82f6', border: '#2563eb', emoji: '🛡️',
    sports: ['football'],
    description: 'Stopper motstanderens angrep og beskytter eget mål.',
    responsibilities: [
      'Vinne defensive dueller og taklinger',
      'Holde kompakt forsvarslinje med lagkameratene',
      'Dekke bakrom ved gjennombrudd',
      'Bidra i oppspill bakfra',
    ],
    tacticalTips: [
      'Posisjonering er viktigere enn aggressive taklinger',
      'Hold øye med ball OG motstander – ikke kun ballen',
      'Kommuniser offsidefellen kontinuerlig med keeper',
      'Tving motstanderen ut mot kanten – aldri innover',
    ],
    examplePlayers: ['Virgil van Dijk', 'Rúben Dias', 'William Saliba'],
  },

  midfielder: {
    label: 'Midtbane', color: '#22c55e', border: '#16a34a', emoji: '⚙️',
    sports: ['football'],
    description: 'Linken mellom forsvar og angrep – styrer tempoet i kampen.',
    responsibilities: [
      'Kontrollere balleie og kampens tempo',
      'Gjenvinne ballen raskt ved balltap',
      'Skape sjanser med presise pasninger og løp',
      'Jobbe hardt i begge retninger',
    ],
    tacticalTips: [
      'Alltid ha to-tre pasningsalternativer klare',
      'Rotasjon og bevegelse – ikke stå stille med ball',
      'Press høyt – gjenvinning høyt på banen er gull',
      'Defensiv midtbane: ødelegg motstanders spill FØR de er farlige',
    ],
    examplePlayers: ["N'Golo Kanté", 'Rodri', 'Casemiro', 'Declan Rice'],
  },

  forward: {
    label: 'Spiss / Angriper', color: '#ef4444', border: '#dc2626', emoji: '⚡',
    sports: ['football'],
    description: 'Skal score mål og skape rom for medspillere gjennom hele angrepsfasen.',
    responsibilities: [
      'Avslutte sjanser med presisjon',
      'Holde ballen og koble medspillere under press',
      'Presse motstanderens forsvarere høyt opp',
      'Bevege seg smart i bakrom for å skape dybde',
    ],
    tacticalTips: [
      'Bevegelse UTEN ball er like viktig som med ball',
      'Avslutt alltid – det er bedre å treffe keeper enn å ikke skyte',
      'Trekk motstandere ut av posisjon for å skape rom for andre',
      'Press starter alltid fra spissen – gi signal til resten av laget',
    ],
    examplePlayers: ['Erling Haaland', 'Kylian Mbappé', 'Robert Lewandowski'],
  },

  winger: {
    label: 'Kantspiller', color: '#a855f7', border: '#9333ea', emoji: '🏃',
    sports: ['football'],
    description: 'Skaper fart og ubalanse langs sidene – dribbler og slår innlegg.',
    responsibilities: [
      'Utfordre i 1v1-situasjoner langs kanten',
      'Slå presise innlegg eller kutte innover for skudd',
      'Samarbeide med back i overlapping for overtall',
      'Forsvare fra kanten ved balltap',
    ],
    tacticalTips: [
      'Fart er din X-faktor – bruk den med intelligens',
      'Inverted winger: kutt inn på sterk fot for skudd',
      'Traditional winger: hold bredde og cross',
      'Defensivt: aldri la backen komme usett inn i banen',
    ],
    examplePlayers: ['Vinícius Jr.', 'Bukayo Saka', 'Mohamed Salah'],
  },

  false9: {
    label: 'Falsk nier', color: '#f97316', border: '#ea580c', emoji: '🎭',
    sports: ['football'],
    description: 'Spiss som trekker ned og skaper hull og forvirring i motstanderens forsvar.',
    responsibilities: [
      'Trekke ned mellom linjene og skape overtall på midtbanen',
      'Åpne bakrom for kantspillere å løpe inn i',
      'Koble spill mellom midtbane og angrep',
      'Dribling og presise pasninger i trange rom',
    ],
    tacticalTips: [
      'Beveg deg ned kun når det skaper et hull – ikke alltid',
      'Timing: trekk ned når kantspilleren er klar til å løpe',
      'Teknisk eksellens er ikke valgfritt i denne rollen',
      'Uforutsigbarhet er din største styrke',
    ],
    examplePlayers: ['Lionel Messi', 'Roberto Firmino'],
  },

  libero: {
    label: 'Libero / Svever', color: '#6366f1', border: '#4f46e5', emoji: '🌊',
    sports: ['football'],
    description: 'Fri forsvarer med unik frihet til å rydde opp og starte angrep.',
    responsibilities: [
      'Dekke bakrom fritt og dynamisk',
      'Starte angrep med langpasninger fremover',
      'Styre og dirigere forsvarslinjen',
      'Rydde opp der andre forsvarere er ute av posisjon',
    ],
    tacticalTips: [
      'Du har INGEN fast motstander – bruk friheten med intelligens',
      'Alltid siste mann – aldri la deg dra ut av posisjon',
      'Ballbehandling under press er avgjørende',
      'Les spillet fremover – du ser mer enn alle andre',
    ],
    examplePlayers: ['Franz Beckenbauer', 'Matthias Sammer'],
  },

  playmaker: {
    label: 'Playmaker', color: '#ec4899', border: '#db2777', emoji: '🧠',
    sports: ['football', 'handball'],
    description: 'Hjernen på laget – setter opp spillet og skaper avgjørende sjanser.',
    responsibilities: [
      'Skape sjanser med gjennombruddspasninger',
      'Styre kampens tempo og retning',
      'Finne riktig pasning til rett tid',
      'Alltid tilgjengelig for ball i hele banen',
    ],
    tacticalTips: [
      'Motta alltid vendt – vet hva du gjør FØR ballen kommer',
      'Bruk kroppen til å skjule pasningsintensjon',
      'Tempo på pasninger: hard til bein, myk i løpene',
      'Du er lagets metronom – rolig under press er ikke valgfritt',
    ],
    examplePlayers: ['Andrea Pirlo', 'Xavi Hernández', 'Martin Ødegaard'],
  },

  sweeper: {
    label: 'Sweeper (Kosten)', color: '#1d4ed8', border: '#1e40af', emoji: '🧹',
    sports: ['football'],
    description: 'Fri forsvarer bak de andre backene som rydder opp og leser spillet.',
    responsibilities: [
      'Rydde opp bak forsvarerne ved gjennombrudd',
      'Starte angrep med langpasninger',
      'Lese spillet og dekke rom proaktivt',
      'Dirigere og organisere backrekken',
    ],
    tacticalTips: [
      'Ingen fast motstander å markere – du er en "forsikring"',
      'Alltid siste mann bak alle andre forsvarere',
      'God ballbehandling – du starter mye av oppspillet',
      'Oversikt er din viktigste egenskap',
    ],
    examplePlayers: ['Franz Beckenbauer', 'Franco Baresi'],
  },

  wingback: {
    label: 'Wingback', color: '#0891b2', border: '#0e7490', emoji: '↔️',
    sports: ['football'],
    description: 'Kombinerer rollen som back og kantspiller – løper hele banen.',
    responsibilities: [
      'Angripe langs siden og slå innlegg',
      'Forsvar på egen banehalvdel',
      'Overlapping med kantspiller for overtall',
      'Støtte i sentral forsvarslinje ved behov',
    ],
    tacticalTips: [
      'Kondis er nøkkelen – du løper dobbelt så mye som de andre',
      'Timing av overlapping – gå kun når du har dekning bak deg',
      'Være et pasningsalternativ både offensivt og defensivt',
      'Kommuniser med midtbanespiller som dekker rommet du forlater',
    ],
    examplePlayers: ['Trent Alexander-Arnold', 'Achraf Hakimi', 'Theo Hernández'],
  },

  box2box: {
    label: 'Box-to-box', color: '#059669', border: '#047857', emoji: '🔁',
    sports: ['football'],
    description: 'Midtbanespiller like aktiv i begge boksene – offensivt og defensivt.',
    responsibilities: [
      'Gjenvinne ball defensivt og umiddelbart bidra offensivt',
      'Ankomme boksen på avslutninger',
      'Støtte forsvar ved tap og angrep ved ball',
      'Høy løpsdistanse gjennom hele kampen',
    ],
    tacticalTips: [
      'Timing av angrepsløp er alt – ikke vær for tidlig',
      'Spar krefter strategisk – velg dine stunder',
      'God aerob kapasitet er ikke valgfritt – det er en forutsetning',
      'Dobbeltheten gjør deg uforutsigbar for motstanderen',
    ],
    examplePlayers: ['Luka Modrić', 'Kevin De Bruyne', 'Frank Lampard'],
  },

  trequartista: {
    label: 'Trequartista (10-er)', color: '#d946ef', border: '#c026d3', emoji: '🎨',
    sports: ['football'],
    description: 'Kreativ spiller mellom midtbane og angrep – spillets kunstner.',
    responsibilities: [
      'Skape sjanser fra posisjon bak spissen',
      'Dribble gjennom tette forsvar',
      'Kombinere med spiss og kantspillere',
      'Fri rolle – bidrar minimalt defensivt',
    ],
    tacticalTips: [
      'Finn rom mellom forsvar og midtbane – det er ditt kontor',
      'Kreativitet og intuisjon er dine sterkeste kort',
      'Ikke presses på defensivt bidrag – det tar fra deg energi',
      'Kommuniser med spissen – dere er et par',
    ],
    examplePlayers: ['Francesco Totti', 'Paulo Dybala', 'Bernardo Silva'],
  },

  targetman: {
    label: 'Targetman (Holde-spiss)', color: '#b45309', border: '#92400e', emoji: '🏋️',
    sports: ['football'],
    description: 'Fysisk sterk spiss som holder ballen og vinner luftdueller.',
    responsibilities: [
      'Vinne luftdueller og hold-up play',
      'Legge ballen av til løpende medspillere',
      'Skape rom og chaos i motstanderens forsvar',
      'Avslutte på nært hold etter innlegg',
    ],
    tacticalTips: [
      'Bruk kroppen som skjold mellom ball og forsvarer',
      'Alltid kjennskap til nærmeste medspillers løp',
      'Duellstyrke er din viktigste asset – tren det',
      'Enkle avlegg er bedre enn å miste ballen i press',
    ],
    examplePlayers: ['Romelu Lukaku', 'Olivier Giroud', 'Diego Costa'],
  },

  pressforward: {
    label: 'Press-forward (Jager)', color: '#dc2626', border: '#b91c1c', emoji: '🐺',
    sports: ['football'],
    description: 'Angriper spesialisert på å presse og jage ballen høyt på banen.',
    responsibilities: [
      'Presse motstanderens keepere og forsvarere aggressivt',
      'Lede lagets pressingstruktur fra topp',
      'Utnytte feil skapt av press til å score',
      'Blokkere pasningsveier under pressing',
    ],
    tacticalTips: [
      'Press på signal fra trener – ikke ukoordinert',
      'Blokker den lette pasningsveien, ikke ballen direkte',
      'Kondis er din viktigste egenskap',
      'Etter pressing: raske til stillingene i kontringsposisjon',
    ],
    examplePlayers: ['Roberto Firmino', 'Sadio Mané', 'Diogo Jota'],
  },

  // ─── FOTBALL – fb_* aliaser (kreves av PlayerRole-typen) ────

  fb_keeper: {
    label: 'Keeper', color: '#f59e0b', border: '#d97706', emoji: '🧤',
    sports: ['football'],
    description: 'Siste skanse – hindrer mål og starter oppspill fra bakre linje.',
    responsibilities: ['Redde skudd', 'Styre forsvarslinjen', 'Starte oppspill', 'Organisere feltsituasjoner'],
    tacticalTips: ['Minste vinkel mot skytter', 'Kommuniser konstant', 'Første passningsspiller i oppbygging'],
  },

  fb_back: {
    label: 'Back', color: '#3b82f6', border: '#2563eb', emoji: '🛡️',
    sports: ['football'],
    description: 'Forsvarer langs siden eller sentralt – stopper motstanderens angrep.',
    responsibilities: ['Vinne defensive dueller', 'Holde kompakt linje', 'Dekke bakrom', 'Bidra i oppspill'],
    tacticalTips: ['Posisjonering over takling', 'Hold øye med ball OG motstander', 'Tving motstanderen ut'],
  },

  fb_midfielder: {
    label: 'Midtbane', color: '#22c55e', border: '#16a34a', emoji: '⚙️',
    sports: ['football'],
    description: 'Linken mellom forsvar og angrep – styrer tempoet i kampen.',
    responsibilities: ['Kontrollere balleie', 'Gjenvinne ballen', 'Skape sjanser', 'Jobbe i begge retninger'],
    tacticalTips: ['Alltid ha pasningsalternativer klare', 'Beveg deg uten ball', 'Press høyt'],
  },

  fb_forward: {
    label: 'Angriper', color: '#ef4444', border: '#dc2626', emoji: '⚡',
    sports: ['football'],
    description: 'Skal score mål og skape rom for medspillere.',
    responsibilities: ['Avslutte sjanser', 'Holde ballen under press', 'Presse motstanderens forsvarere', 'Bevege seg i bakrom'],
    tacticalTips: ['Bevegelse uten ball er avgjørende', 'Avslutt alltid', 'Press starter fra spissen'],
  },

  // ─── HÅNDBALL ───────────────────────────────────────────────

  hb_keeper: {
    label: 'Keeper (HB)', color: '#f59e0b', border: '#d97706', emoji: '🧤',
    sports: ['handball'],
    description: 'Stopper skudd fra alle vinkler – bruker hele kroppen som skjold.',
    responsibilities: [
      'Redde skudd med refleksivt hurtige bevegelser',
      'Lese avslutternes kroppsspråk og ladning',
      'Starte raske kontringer umiddelbart etter redning',
      'Styre forsvaret og kommunisere plasseringsfeil',
    ],
    tacticalTips: [
      'Minimere vinkelen til skytteren – komme ut på ballen',
      'Studer avslutterens angrepsarm og skulderbevegelse',
      'Etter redning: finn den åpne løperen umiddelbart',
      'Mental styrke – du MÅ glemme mål du slipper inn',
    ],
    examplePlayers: ['Niklas Landin', 'Thierry Omeyer', 'Andreas Wolff'],
  },

  hb_pivot: {
    label: 'Pivot (HB)', color: '#14b8a6', border: '#0d9488', emoji: '🔄',
    sports: ['handball'],
    description: 'Innerst i angrepet – skaper rom og er farligst nær målet.',
    responsibilities: [
      'Binde forsvaret med kroppen og skape hull',
      'Motta ball i trange rom uten å miste den',
      'Lage veggspill for bakspillere',
      'Avslutte fra nært hold og fra høy posisjon',
    ],
    tacticalTips: [
      'Bruk kroppen som et skipanker – hold posisjonen',
      'Timing er alt: beveg deg NÅR bakspilleren er klar',
      'Kontakt med forsvareren er lovlig – bruk det',
      'Alltid vendt med ansiktet mot ballen',
    ],
    examplePlayers: ['Bertrand Gille', 'Laszlo Nagy'],
  },

  hb_backcourt: {
    label: 'Bakspiller (HB)', color: '#8b5cf6', border: '#7c3aed', emoji: '🎯',
    sports: ['handball'],
    description: 'Skyter fra distanse og organiserer angrepet fra bakre posisjon.',
    responsibilities: [
      'Skyte fra 8-10 meters distanse med kraft og presisjon',
      'Dirigere angrepsspillet fra bakre rekke',
      'Gjennombrudd for å lage hull til pivot',
      'Samarbeide med fløyspillere',
    ],
    tacticalTips: [
      'Gjennombruddsfinte: tving forsvareren bakover før du passer',
      'Skuddfinte brukes for å åpne rom – ikke bare for å score',
      'Alltid kjennskap til pivotens posisjon',
      'Variasjon i skuddtyper gjør deg uleselig',
    ],
    examplePlayers: ['Nikola Karabatić', 'Mikkel Hansen', 'Sander Sagosen'],
  },

  hb_wing: {
    label: 'Fløyspiller (HB)', color: '#f43f5e', border: '#e11d48', emoji: '🦅',
    sports: ['handball'],
    description: 'Angriper fra ytterste posisjon – bratte vinkler og eksplosjoner i kontring.',
    responsibilities: [
      'Avslutte fra vanskelige ytre vinkler',
      'Utnytte åpne rom i hurtige kontringer',
      'Dekke flanken defensivt',
      'Motta pass i fart uten å miste kontroll',
    ],
    tacticalTips: [
      'Fart til siden er din viktigste egenskap',
      'Bruk kroppen til å skyve forsvareren ut av banen',
      'Studer keeperens posisjon – finn den korteste åpningen',
      'Defensivt: aldri la motstanderens fløy komme fritt inn',
    ],
    examplePlayers: ['Valero Rivera', 'Marcus Ahlm', 'Luc Abalo'],
  },

  hb_center: {
    label: 'Midtback (HB)', color: '#06b6d4', border: '#0891b2', emoji: '👑',
    sports: ['handball'],
    description: 'Dirigenten i angrepet – organiserer og skaper fra midten.',
    responsibilities: [
      'Sette opp medspillere med smarte gjennomspill',
      'Gjennombrudd og direkteavslutning fra midten',
      'Styre kampens tempo i angrepsfase',
      'Organisere lagets taktikk løpende i kamp',
    ],
    tacticalTips: [
      'Du har overblikk over hele angrepssystemet',
      'Veksle mellom gjennombrudd og pasning – ikke bli lesbar',
      'Kommuniser konstant med pivot og bakspillere',
      'I 5-1 forsvar: din binding er avgjørende',
    ],
    examplePlayers: ['Filip Jícha', 'Kiril Lazarov', 'Stefan Lövgren'],
  },

  hb_playmaker: {
    label: 'Playmaker (HB)', color: '#ec4899', border: '#db2777', emoji: '🧠',
    sports: ['handball'],
    description: 'Kreatøren – dikterer tempoet og finner hull i forsvaret.',
    responsibilities: [
      'Lese forsvarets struktur og finne svakheter',
      'Dele opp forsvar med presise pasninger',
      'Skape overlegen med smarte pasningsvekslinger',
      'Styre lagets rytme og timing',
    ],
    tacticalTips: [
      'Aldri hast – rolig spillfordeling skaper mer enn fart',
      'Øynene forteller deg mer enn bena – se alltid opp',
      'Gjennomspill til pivot: timing er viktigere enn kraft',
      'Variasjon i angrepsretning holder forsvaret på vakt',
    ],
    examplePlayers: ['Aleksandar Rakita', 'Domagoj Duvnjak'],
  },

};

// ─── Hjelpefunksjon ──────────────────────────────────────────

export function getRolesForSport(sport: Sport): PlayerRole[] {
  const allRoles = Object.keys(ROLE_META) as PlayerRole[];
  return allRoles.filter(r => ROLE_META[r].sports.includes(sport));
}