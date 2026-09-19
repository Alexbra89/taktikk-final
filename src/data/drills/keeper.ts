// src/data/drills/keeper.ts
import type { DrillExercise } from '../../types';

export const KEEPER_YOUTH: DrillExercise[] = [
  {
    id: 'keeper-y-01',
    name: 'Kjeglejakten (forflytning og fallteknikk)',
    category: 'keeper' as const,
    ageGroup: 'youth',
    ageBand: ['8-9'],
    difficulty: 'enkel' as const,
    duration: 10,
    players: '2-4',
    description:
      'Keeperen står i midten av en firkant av kjegler og forflytter seg raskt til den kjeglen treneren roper ut, berører den (evt. med et kontrollert fall), og går tilbake til midten.',
    why: 'Trener utgangsstilling, forflytning og reaksjon i en lek. NFFs fagplan for 8-9 år nevner disse som grunnteknikker som starter «på dag en i keeperlivet», og at «leken, ballen og mye aktivitet er i sentrum». (kilde: Fagplan keeper 8-9 år; sammenkoblingen til øvelsen er min)',
    steps: [
      { id: 'keeper-y-01-s1', name: 'Oppsett', description: 'Sett opp fire fargede kjegler i en firkant på ca. 3×3 m.' },
      { id: 'keeper-y-01-s2', name: 'Utgangsstilling', description: 'Keeperen står i midten i utgangsstilling.' },
      { id: 'keeper-y-01-s3', name: 'Kommando', description: 'Treneren roper en farge.' },
      { id: 'keeper-y-01-s4', name: 'Utførelse', description: 'Keeperen forflytter seg raskt til kjeglen og berører den, evt. med en kontrollert bevegelse mot bakken.' },
      { id: 'keeper-y-01-s5', name: 'Retur', description: 'Tilbake til midten i utgangsstilling.' },
      { id: 'keeper-y-01-s6', name: 'Runde', description: 'Kjør 30 sekunder, bytt keeper.' },
    ],
    coachingPoints: [
      'Utgangsstilling: lett i knærne, på tåballene (kilde: begrep fra Fagplan keeper 8-9 år)',
      '«Se på ballen» / se på kjeglen hele veien (kilde: begrep fra Fagplan keeper 8-9 år)',
      'Bøy i knærne når du går ned',
      'Landing på siden av låret/hoften, ikke direkte på albuer eller kneskåler',
    ],
    commonMistakes: [
      'Blir stående stiv i knærne',
      'Lander på albuer eller kneskåler',
      'Ser ikke på kjeglen underveis',
    ],
    variations: [
      'Lettere: Treneren peker på kjeglen i stedet for å rope farge',
      'Vanskeligere: Treneren kaster en ball mot kjeglen, og keeperen må fange den før den spretter to ganger',
    ],
    equipment: ['4 fargede kjegler', '1 ball'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/fagplan-keeper-8-9-ar (nevner «forflytning», «reaksjon» og «fallteknikk» som grunnteknikker for 8-9 år)',
    unverifiedSource:
      'Gemini oppga «NFF Tiim – Grasrottreneren Øvelsesbank (Øvelse: Fallteknikk og reaksjon i sirkel)» med URL https://www.tiim.no/ (forside, ikke øvelse)',
    sketch:
      'Firkant 3×3 m med en kjegle i hvert hjørne (rød, blå, gul, grønn). Keeper i midten. Trener står utenfor og roper farge.',
  },
  {
    id: 'keeper-y-02',
    name: 'Ballskjoldet (gripe ball langs bakken)',
    category: 'keeper' as const,
    ageGroup: 'youth',
    ageBand: ['8-9'],
    difficulty: 'enkel' as const,
    duration: 10,
    players: '2-3',
    description:
      'Treneren triller baller langs bakken fra ulike vinkler, og keeperen rykker frem, setter kroppen bak ballen og tar den sikkert inn til brystet.',
    why: 'Bygger vanen med å sikre lave baller med kroppen bak og hendene rundt ballen. NFF nevner «store hender bak ballen» som et enkelt begrep for de yngste. (kilde: Fagplan keeper 8-9 år)',
    steps: [
      { id: 'keeper-y-02-s1', name: 'Oppsett', description: 'Sett opp et lite mål (3-4 m bredt) med kjegler.' },
      { id: 'keeper-y-02-s2', name: 'Trener', description: 'Treneren står 8 m unna med 5-6 baller.' },
      { id: 'keeper-y-02-s3', name: 'Serve', description: 'Treneren triller ballene én og én i moderat tempo, rett på eller litt til siden.' },
      { id: 'keeper-y-02-s4', name: 'Grep', description: 'Keeperen rykker frem, setter kroppen bak ballen, går evt. ned på ett kne og trekker ballen inn til brystet.' },
      { id: 'keeper-y-02-s5', name: 'Bytte', description: 'Bytt keeper etter 5-6 baller.' },
    ],
    coachingPoints: [
      '«Store hender bak ballen» (kilde: begrep fra Fagplan keeper 8-9 år)',
      '«Se på ballen» (kilde: begrep fra Fagplan keeper 8-9 år)',
      'Trekk ballen raskt inn til brystet',
      'Kroppen bak ballen, beina som en vegg',
    ],
    commonMistakes: [
      'Bøyer i ryggen uten å bøye knærne',
      'Åpner beina slik at ballen triller gjennom',
      'Hendene er ikke bak ballen',
    ],
    variations: [
      'Lettere: Ballen trilles sakte rett på keeper',
      'Vanskeligere: Ballen trilles litt raskere mot stolpene, slik at keeperen må flytte seg før grepet',
    ],
    equipment: ['6 fotballer', '2 kjegler til mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/fagplan-keeper-8-9-ar (nevner «grep» og «store hender bak ballen»)',
    unverifiedSource:
      'Gemini oppga «Soccer Coach Weekly – Grassroots Goalkeeping: Catching Low Balls» med URL https://www.soccercoachweekly.net/coaching-advice/grassroots-goalkeeping-catching-low-balls (utgiver: Soccer Coach Weekly)',
  },
  {
    id: 'keeper-y-03',
    name: 'Katt og mus i feltet (feltarbeid og kommunikasjon)',
    category: 'keeper' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'middels' as const,
    duration: 12,
    players: '4-6',
    description:
      'En utespiller kaster eller slår myke innlegg fra siden mot feltet. Keeperen vurderer, roper tydelig at den tar ballen, og fanger den foran en «forstyrrende» angriper.',
    why: 'Lærer keeperen å beregne ballbanen, kommunisere høyt og tørre å ta ansvar i feltet. NFF skriver at keeperen skal gi «gode beskjeder til lagkompisene» («keeper», «hjem», «ut», «press») og lister «feltarbeid/høye baller» som tema. (kilde: Fagplan keeper 8-9 år, Læringsmomenter keeper 12-13 år)',
    steps: [
      { id: 'keeper-y-03-s1', name: 'Oppsett', description: 'Sett opp et 5er- eller 7er-mål og et lite felt.' },
      { id: 'keeper-y-03-s2', name: 'Servitør', description: 'En servitør står på kanten av feltet og slår myke innlegg.' },
      { id: 'keeper-y-03-s3', name: 'Angriper', description: 'En angriper starter samtidig og lager litt press på keeperen (ingen hard takling).' },
      { id: 'keeper-y-03-s4', name: 'Beslutning', description: 'Keeperen vurderer om ballen kan tas, roper høyt, og møter ballen på høyeste punkt.' },
      { id: 'keeper-y-03-s5', name: 'Bytte', description: 'Bytt roller jevnlig.' },
    ],
    coachingPoints: [
      'Rop tidlig og tydelig: «Keeper!» (kilde: begrep fra Fagplan keeper 8-9 år)',
      'Møt ballen på det høyeste punktet du rekker',
      'Beslutt: angripe ballen eller la forsvarerne ta den (kilde: begrepet «Beslutte» i Læringsmomenter keeper 12-13 år)',
      'Løft nærmeste kne for balanse og beskyttelse (vurdering: min)',
    ],
    commonMistakes: [
      'Blir stående på streken og venter',
      'Glemmer å rope',
      'Tar ballen for sent',
    ],
    variations: [
      'Lettere: Servitøren kaster ballen i en høy bue uten angriper',
      'Vanskeligere: Sprettende innlegg, eller to angripere',
    ],
    equipment: ['8 baller', 'Kjegler', 'Ett mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/laeringsmomenter-for-unge-keepere (nevner «feltarbeid/høye baller» og «gode beskjeder til lagkompisene»)',
    unverifiedSource:
      'Gemini oppga «NFF Landslagsskolen – Keepertrening i Barne- og Ungdomsfotballen» med URL https://www.fotball.no/trener/landslagsskolen/ (generell side, ikke øvelse)',
    sketch:
      'Mål med keeper. Servitør på kanten av feltet (skrått foran til siden) slår innlegg. Angriper starter ved 5-meteren og løper mot ballen. Keeper står i mål og kommanderer.',
  },
  {
    id: 'keeper-y-04',
    name: 'Reaksjonsspeilet (reaksjon og sideforflytning)',
    category: 'keeper' as const,
    ageGroup: 'youth',
    ageBand: ['8-9', '10-12'],
    difficulty: 'middels' as const,
    duration: 10,
    players: '3-4',
    description:
      'To keepere står overfor hverandre. Den ene er «leder» og gjør raske sidebevegelser og berøringer, og den andre speiler. Uten forvarsel triller treneren en ball, og speileren må reagere og fange den.',
    why: 'Trener reaksjon, balanse og retningsendring, slik NFF beskriver under «hurtighet/reaksjon» og «forflytning» for de yngste. (kilde: Fagplan keeper 8-9 år; øvelsesformen er min/kjent)',
    steps: [
      { id: 'keeper-y-04-s1', name: 'Oppstilling', description: 'Keeper A og B står overfor hverandre, 3 m mellom.' },
      { id: 'keeper-y-04-s2', name: 'Leder', description: 'A gjør sideveis tripping, berører bakken eller tar et lite hopp i 5-10 sekunder.' },
      { id: 'keeper-y-04-s3', name: 'Speiling', description: 'B kopierer umiddelbart.' },
      { id: 'keeper-y-04-s4', name: 'Overraskelse', description: 'Uten forvarsel triller treneren en ball mot B, som må reagere og fange den trygt.' },
      { id: 'keeper-y-04-s5', name: 'Bytte', description: 'Bytt roller.' },
    ],
    coachingPoints: [
      'Lavt tyngdepunkt, hendene klare i brysthøyde',
      'Ikke kryss beina når du beveger deg sidelengs',
      '«Se på ballen» (kilde: begrep fra Fagplan keeper 8-9 år)',
      'Hold blikket på både medspilleren og trenerens ball',
    ],
    commonMistakes: [
      'Krysser beina og mister balansen',
      'Blir stående på hele fotsålen eller hælene',
      'Ser bare på medspilleren og glemmer ballen',
    ],
    variations: [
      'Lettere: Faste bevegelsesmønstre uten overraskelsesball',
      'Vanskeligere: Treneren kaster en sprettball eller skyter lavt i stedet for å trille',
    ],
    equipment: ['4-6 baller', 'Kjegler'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/fagplan-keeper-8-9-ar (nevner «hurtighet/reaksjon» og «forflytning»)',
    unverifiedSource:
      'Gemini oppga «The FA Bootroom – Goalkeeping Session: Footwork and Handling» med URL https://thefa.com/bootroom/resources/coaching/goalkeeping-session-footwork-and-handling (utgiver: The Football Association)',
    sketch:
      'Keeper A og B står 3 m fra hverandre langs en linje. Trener står bak og til siden og triller ballen mot den ene.',
  },
  {
    id: 'keeper-y-05',
    name: 'Presisjonsoppspill (igangsetting med kast og spark)',
    category: 'keeper' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'middels' as const,
    duration: 12,
    players: '3-5',
    description:
      'Keeperen fanger en ball og setter raskt i gang spillet ved å treffe ulike porter (kjegleporter) på banen med kast, og senere spark.',
    why: 'NFF beskriver at keeperen skal kunne starte angrep på flere måter, og at «pasningsferdighet» er et tema for unge keepere (Pasningsspill: «øver begge føttene, korte og lengre pasninger»). (kilde: Læringsmomenter keeper 12-13 år; Pasningsspill-økten)',
    steps: [
      { id: 'keeper-y-05-s1', name: 'Start', description: 'Keeperen står på mållinjen. Treneren skyter et rolig skudd som keeperen fanger.' },
      { id: 'keeper-y-05-s2', name: 'Porter', description: '15-20 m ute på banen står tre porter (høyre, midten, venstre).' },
      { id: 'keeper-y-05-s3', name: 'Kommando', description: 'Treneren roper en port.' },
      { id: 'keeper-y-05-s4', name: 'Kast', description: 'Keeperen kaster (rullekast eller overarmskast) gjennom den valgte porten.' },
      { id: 'keeper-y-05-s5', name: 'Progresjon', description: 'Gå videre til spark (fra bakken/hånd) når kastene sitter.' },
    ],
    coachingPoints: [
      'Ta et bestemt steg frem med motsatt fot når du kaster',
      'Se på målet før du kaster',
      'Start raskt, slik at motstanderen ikke rekker å organisere seg',
      'Prøv begge føttene på sparkene (kilde: Pasningsspill-økten)',
    ],
    commonMistakes: [
      'Kaster uten balanse',
      'Bruker for lang tid fra grep til igangsetting',
      'Treffer ikke porten fordi blikket ikke er på målet',
    ],
    variations: [
      'Lettere: Kun overarmskast mot store soner',
      'Vanskeligere: Medspillere løper i sonene som bevegelige mål',
    ],
    equipment: ['6-8 baller', '6 kjegler (tre porter)'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/laeringsmomenter-for-unge-keepere (lister «Spille rundt / gjennom ledd / i rom / på / bak» som ulike måter for keeper å starte angrep)',
    unverifiedSource:
      'Gemini oppga «NFF Tiim – Grasrottreneren Del 2 (Øvelse: Igangsetting fra keeper)» med URL https://www.tiim.no/ (forside, ikke øvelse)',
    sketch:
      'Mållinje (keeper) → 15-20 m → tre porter side om side (høyre, midten, venstre).',
  },
  {
    id: 'keeper-y-06',
    name: 'Grep og fall – to og to (egentrening med skytter)',
    category: 'keeper' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'enkel' as const,
    duration: 10,
    players: '2',
    description:
      'En keeper i mål og en skytter. Øvelsen starter med skudd rett på keeperen i grep mellomhøyt. Keeperen returnerer ballen og får skudd nede på venstre side, returnerer, og opp i stående for nytt skudd rett på og nede. Til slutt skudd nede på motsatt side. (kilde: organisering)',
    why: 'Fokus er riktig utgangsposisjon, avslappet og med ledige hender, mottak av enkle skudd og fallteknikk på lave baller ganske nært. Deretter hurtig opp i utgangsposisjon og skuddklar igjen. (kilde: læringsmoment)',
    steps: [
      { id: 'keeper-y-06-s1', name: 'Oppsett', description: 'Én keeper i mål, én skytter.' },
      { id: 'keeper-y-06-s2', name: 'Skudd 1', description: 'Skudd rett på keeperen i grep mellomhøyt.' },
      { id: 'keeper-y-06-s3', name: 'Retur', description: 'Keeperen returnerer ballen.' },
      { id: 'keeper-y-06-s4', name: 'Skudd 2', description: 'Skudd nede på keeperens venstre side, returner, og opp igjen i stående.' },
      { id: 'keeper-y-06-s5', name: 'Skudd 3', description: 'Nytt skudd rett på nede.' },
      { id: 'keeper-y-06-s6', name: 'Skudd 4', description: 'Til slutt skudd nede på motsatt side.' },
    ],
    coachingPoints: [
      'Riktig utgangsposisjon, avslappet og med ledige hender (kilde: læringsmoment)',
      'Fallteknikk på lave baller (kilde: læringsmoment)',
      'Hurtig opp i utgangsposisjon og skuddklar igjen (kilde: læringsmoment)',
      'Grep og fallteknikk (kilde: læringsmoment)',
    ],
    commonMistakes: [
      'Blir liggende for lenge etter fall',
      'Stiv utgangsstilling',
      'Lander på albuer eller kneskåler',
    ],
    variations: [
      'Lettere: Færre skudd, rolige baller',
      'Vanskeligere: Valgfritt skudd nede/oppe og til høyre/venstre, varier høyden på ballene til sidene, keeperen ruller ballen ut til skytteren før første skudd og forflytter seg bakover til rett posisjon (kilde: variasjon)',
    ],
    equipment: ['Baller', 'Mål eller kjegler'],
    source: 'https://tiim.no/ovelse/rolletrening-keeper-partrening-1',
    sketch:
      'Mål med keeper. Skytter 6-8 m foran. Skudd: 1) rett på mellomhøyt, 2) nede venstre, 3) rett på nede, 4) nede høyre.',
  },
  {
    id: 'keeper-y-07',
    name: 'Alene mot veggen (kast, mottak og forflytning)',
    category: 'keeper' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'enkel' as const,
    duration: 8,
    players: '1',
    description:
      'Finn en vegg eller garasjedør og kast ballen mot den. Begynn med baller rett på for å øve enkle mottak i ulike høyder. Kast noe skrått slik at du må forflytte deg før mottaket. Fortsett med ulike spark, og varier avstanden til veggen. Utvid slik at du må kaste deg for å redde ballen som kommer i retur. (kilde: organisering)',
    why: 'Egentrening som gir mange repetisjoner på riktig kastteknikk og mottak på ulike typer baller, med forflytning og fallteknikk som progresjon. (kilde: læringsmoment)',
    steps: [
      { id: 'keeper-y-07-s1', name: 'Oppsett', description: 'Finn en vegg, og stå ca. 3-5 m fra den.' },
      { id: 'keeper-y-07-s2', name: 'Mottak', description: 'Kast ballen mot veggen og ta imot i ulike høyder.' },
      { id: 'keeper-y-07-s3', name: 'Forflytning', description: 'Varier med skrå kast, slik at du må forflytte deg.' },
      { id: 'keeper-y-07-s4', name: 'Spark', description: 'Prøv ulike spark (fra bakken og fra hånd), og varier avstanden.' },
      { id: 'keeper-y-07-s5', name: 'Fall', description: 'Når det sitter: kast deg for å redde returer.' },
    ],
    coachingPoints: [
      'Riktig kastteknikk (kilde: læringsmoment)',
      'Mottaksteknikk på ulike typer baller (kilde: læringsmoment)',
      'Forflytt deg før mottak (kilde: læringsmoment)',
      'Ta det rolig: kvalitet fremfor tempo',
    ],
    commonMistakes: [
      'Kaster for hardt og mister kontrollen',
      'Står stille og forflytter seg ikke',
      'Prøver å kaste seg før teknikken sitter',
    ],
    variations: [
      'Lettere: Korte kast rett på',
      'Vanskeligere: Lengre avstand, ulike spark, redde returer med fall (kilde: variasjon)',
    ],
    equipment: ['Ball', 'Vegg (evt. garasjedør)'],
    source: 'https://tiim.no/ovelse/rolletrening-keeper-alene-med-ballen-1',
  },
  {
    id: 'keeper-y-08',
    name: 'Rekkevidde og skyv – kast først',
    category: 'keeper' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'middels' as const,
    duration: 10,
    players: '2-3',
    description:
      'Treneren kaster ballen (ikke skyter) mot keeperens sider, litt utenfor rekkevidde, slik at keeperen må skyve fra og strekke seg. Både foten nærmest og foten lengst unna ballen trenes.',
    why: 'NFF beskriver skyv/rekkevidde som eget keepertema og anbefaler å starte med kast for å få mange og gode repetisjoner, og å gi keeperen nok hvile. Selve øvelsesformen er min; rammene er NFFs. (kilde: Keeperøkt «Skuddklar: Rekkevidde/skyv»)',
    steps: [
      { id: 'keeper-y-08-s1', name: 'Oppsett', description: 'Keeperen står midt i et 5er-mål.' },
      { id: 'keeper-y-08-s2', name: 'Kast', description: 'Treneren står 5-6 m unna og kaster lave og halvhøye baller mot sidene.' },
      { id: 'keeper-y-08-s3', name: 'Skyv', description: 'Keeperen skyver fra og strekker seg mot ballen.' },
      { id: 'keeper-y-08-s4', name: 'Bestemthet', description: 'Vær bestemt, og la «slenget» til siden være litt offensivt fremover. (kilde: NFF-økt)' },
      { id: 'keeper-y-08-s5', name: 'Hvile', description: 'Gi keeperen nok hvile mellom seriene. (kilde: NFF-økt) Tren begge sider.' },
    ],
    coachingPoints: [
      'Vær bestemt (kilde: NFF-økt)',
      'La «slenget» til siden være litt offensivt fremover (kilde: NFF-økt)',
      'Bruk både foten nærmest og foten lengst unna (kilde: NFF-økt)',
      'Myk landing, på siden av kroppen',
    ],
    commonMistakes: [
      'Hopper på stedet i stedet for å skyve utover',
      'Faller bakover',
      'Ikke nok hvile, teknikken forfaller',
    ],
    variations: [
      'Lettere: Ballene kastes rolig og nær',
      'Vanskeligere: Ballene kastes lenger unna og raskere; senere skudd i stedet for kast',
    ],
    equipment: ['Baller', 'Ett mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/okt/keeper-skuddklar-rekkevidde-skyv (gir NFFs rammer: «teknikk og kraften i skyvet», «vær bestemt og la slenget til siden være litt offensiv fremover», «start gjerne med å kaste ballen på de yngste», «pass på at keeper får nok hvile»)',
  },
];

export const KEEPER_ADULT: DrillExercise[] = [
  {
    id: 'keeper-a-01',
    name: '1 mot 1 – nærduell og blokk',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['13-16'],
    difficulty: 'enkel' as const,
    duration: 12,
    players: '3-4',
    description:
      'En angriper kommer alene gjennom mot keeperen. Keeperen vurderer situasjonen og velger mellom blokk (gjøre seg størst mulig) og å gå ned på bakken med hendene på ballen.',
    why: 'NFF skriver at blokk er et godt alternativ når gjennomspilleren er nær keeperen eller keeperen kan komme nær angriperen i avslutningsøyeblikket, mens «ned på bakken» passer når avstanden er stor eller angriperen har en dårlig touch. (kilde: Keeperøkt «En mot en», Økter for keepere 12-13 år)',
    steps: [
      { id: 'keeper-a-01-s1', name: 'Start', description: 'Angriperen starter ca. 20 m fra mål med ball og fører i kontrollert tempo.' },
      { id: 'keeper-a-01-s2', name: 'Lesing', description: 'Keeperen leser angriperens touch og avstand.' },
      { id: 'keeper-a-01-s3', name: 'Valg 1', description: 'Er touchet langt: rykk ut. Er angriperen nær: gå i blokk.' },
      { id: 'keeper-a-01-s4', name: 'Valg 2', description: 'Er avstanden stor eller touchet dårlig: vær tålmodig og gå ned med hendene på ballen. (kilde: Keeperøkt «En mot en»)' },
      { id: 'keeper-a-01-s5', name: 'Hold', description: 'Hold posisjonen til skuddet er avfyrt.' },
    ],
    coachingPoints: [
      'Velg teknikk etter avstand og angriperens touch (kilde: Keeperøkt «En mot en»)',
      'I blokk: gjør deg størst mulig med kroppen (kilde: Keeperøkt «En mot en»)',
      'Vær tålmodig, ikke kast deg for tidlig',
      'Snu ikke ryggen, og hold øynene åpne i skuddøyeblikket',
    ],
    commonMistakes: [
      'Kaster seg for tidlig og blir rundet',
      'Velger blokk når avstanden er stor',
      'Lukker øynene eller snur ryggen',
    ],
    variations: [
      'Lettere: Angriperen tar tre faste touch før skudd, slik at keeperen kan tajme utrykket',
      'Vanskeligere: Angriperen kan velge å legge av til en medspiller på blankt mål',
    ],
    equipment: ['8 baller', '1 mål', 'Kjegler'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/okt/keeper-en-mot-en og https://tiim.no/artikkel/okter-for-keepere-12-13-ar (NFF beskriver «Blokk (gjøre seg størst mulig)» og «Ned på bakken med hendene på ball» som de to teknikkene i 1 mot 1)',
    unverifiedSource:
      'Gemini oppga «US Soccer Coaching Education – Grassroots 11v11 Goalkeeping: 1v1 Shot Stopping» med URL https://www.ussoccer.com/coaching (generell side, ikke øvelse)',
    sketch:
      'Mål med keeper. Angriper starter 20 m ute midt foran mål. En medspiller står i utkanten (for «vanskeligere»-varianten).',
  },
  {
    id: 'keeper-a-02',
    name: 'Reaksjon på kort hold (skudd gjennom skjerming)',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['13-16'],
    difficulty: 'enkel' as const,
    duration: 12,
    players: '3-5',
    description:
      'Skudd fra kort hold gjennom en «skog» av dukker eller utespillere, for å trene reaksjon og å styre ballen til en ufarlig sone.',
    why: 'NFFs 13-19-plan nevner korte reaksjonsøvelser og skudd fra distanse som del av skuddstopping. Skjerming gjør at keeperen leser ballbanen sent og må reagere raskt. (kilde: Fagplan keeper 13-19 år; øvelsesformen er kjent/min)',
    steps: [
      { id: 'keeper-a-02-s1', name: 'Oppsett', description: 'Sett opp to dukker eller to utespillere ca. 11 m fra mål.' },
      { id: 'keeper-a-02-s2', name: 'Skytter', description: 'Skytteren står ca. 16 m unna og skyter plasserte eller harde skudd mellom dukkene.' },
      { id: 'keeper-a-02-s3', name: 'Lesing', description: 'Keeperen leser ballbanen sent og reagerer eksplosivt.' },
      { id: 'keeper-a-02-s4', name: 'Styring', description: 'Kan ikke ballen tas trygt, styres den ut mot sidene, bort fra den farlige sonen foran mål.' },
    ],
    coachingPoints: [
      'Stå klar på tåballene med hendene foran kroppen',
      'Stive håndledd når du må styre ballen til siden',
      'Følg med til ballen er død eller over dødlinjen',
      'Skuddklar: rett utgangsposisjon (kilde: begrep fra Rolletrening Keeper Partrening #1)',
    ],
    commonMistakes: [
      'Styrer ballen rett ut i farlig sone',
      'Faller bakover',
      'Reagerer for sent fordi utgangsstillingen er stiv',
    ],
    variations: [
      'Lettere: Ingen dukker',
      'Vanskeligere: Skuddet snitter en spiller underveis',
    ],
    equipment: ['10-12 baller', '2 dukker eller kjegler', '1 mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/fagplan-keeper-13-19-ar (NFF lister «Skuddstopping: serier med ulike vinkler, korte reaksjonsøvelser, skudd fra distanse»)',
    unverifiedSource:
      'Gemini oppga «Soccer Coach Weekly – Reaction Saves for Goalkeepers» med URL https://www.soccercoachweekly.net/coaching-advice/reaction-saves-for-goalkeepers (utgiver: Soccer Coach Weekly). Rettet fra «11-metersstreken» til «11 m» (11 m er straffemerket, ikke en linje).',
    sketch:
      'Mål med keeper. To dukker ca. 11 m foran, litt fra hverandre. Skytter ca. 16 m unna, skyter mellom dukkene.',
  },
  {
    id: 'keeper-a-03',
    name: 'Skift av akse og skyv til det lange hjørnet',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'middels' as const,
    duration: 15,
    players: '3',
    description:
      'Keeperen flytter seg raskt fra den ene stolpen mot den andre, og må så skyve fra og strekke seg mot et hardt skudd i det lange hjørnet.',
    why: 'Trener skyv og rekkevidde etter en sideforflytning: keeperen må stoppe, bli skuddklar og skyve kraftig med foten lengst unna. NFF trener både foten nærmest og foten lengst unna. (kilde: Keeperøkt «Skuddklar: Rekkevidde/skyv»)',
    steps: [
      { id: 'keeper-a-03-s1', name: 'Start', description: 'Keeperen starter ved den ene stolpen.' },
      { id: 'keeper-a-03-s2', name: 'Berøring', description: 'Treneren ruller en ball rolig mot midten, som keeperen berører med foten.' },
      { id: 'keeper-a-03-s3', name: 'Forflytning', description: 'Keeperen flytter seg raskt mot den andre stolpen.' },
      { id: 'keeper-a-03-s4', name: 'Skudd', description: 'Idet keeperen nærmer seg, skyter en medspiller hardt mot det lange hjørnet.' },
      { id: 'keeper-a-03-s5', name: 'Skyv', description: 'Keeperen stopper, blir skuddklar, skyver fra og strekker seg. (vurdering: min)' },
      { id: 'keeper-a-03-s6', name: 'Landing og hvile', description: 'Land på siden av kroppen. Gi nok hvile mellom seriene. (kilde: Keeperøkt)' },
    ],
    coachingPoints: [
      'Vær bestemt (kilde: Keeperøkt «Skuddklar»)',
      'La «slenget» til siden være litt offensivt fremover (kilde: Keeperøkt «Skuddklar»)',
      'Stopp og bli skuddklar før skuddet',
      'Land på siden av kroppen (låret/hoften), ikke på albuen',
    ],
    commonMistakes: [
      'Hopper på stedet i stedet for å skyve utover',
      'Skyver fra feil fot og mister rekkevidde',
      'Er ikke stoppet og skuddklar når skuddet går',
    ],
    variations: [
      'Lettere: Skuddet kommer nærmere, så skyvet trenger ikke full lengde',
      'Vanskeligere: Treneren skyter uventet i det lange eller korte hjørnet',
    ],
    equipment: ['8-10 baller', '1 mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/okt/keeper-skuddklar-rekkevidde-skyv (NFF beskriver skyvet og rekkevidden, og at «slenget» til siden bør være litt offensivt fremover)',
    unverifiedSource:
      'Gemini oppga «The FA Bootroom – Goalkeeping: Shot Stopping and Diving Technique» med URL https://thefa.com/bootroom/resources/coaching/goalkeeping-shot-stopping-diving (utgiver: The Football Association). «Frasparket» rettet til NFFs begrep «skyv».',
    sketch:
      'Mål med keeper ved venstre stolpe. Trener ruller ball mot midten. Skytter står ved siden og skyter mot høyre hjørne når keeperen nærmer seg høyre stolpe.',
  },
  {
    id: 'keeper-a-04',
    name: 'Presset igangsetting og vending av spillet',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'middels' as const,
    duration: 15,
    players: '6-8',
    description:
      'Keeperen fungerer som ekstra utespiller i frispill bakfra mot press fra motstanderens spisser, og velger mellom pasningsalternativene.',
    why: 'NFF beskriver at keeperen kan starte angrep på flere måter, avhengig av lagets taktikk, medspilleres ferdigheter og motstanderens presshøyde. Øvelsen trener beslutningen under press. (kilde: Læringsmomenter keeper 12-13 år)',
    steps: [
      { id: 'keeper-a-04-s1', name: 'Start', description: 'Keeperen starter med ballen på 5-meteren.' },
      { id: 'keeper-a-04-s2', name: 'Oppstilling', description: 'To stoppere og en dyp midtbane tilbyr seg. To angripere presser høyt.' },
      { id: 'keeper-a-04-s3', name: 'Valg', description: 'Keeperen velger blant NFFs alternativer: spille rundt, gjennom ledd, i rom, på, eller bak. (kilde: NFF-terminologi)' },
      { id: 'keeper-a-04-s4', name: 'Touch', description: 'Keeperen bruker maks to touch, og tåler å bruke svak fot.' },
      { id: 'keeper-a-04-s5', name: 'Bytte', description: 'Bytt roller jevnlig.' },
    ],
    coachingPoints: [
      'Åpen kroppsstilling så du har oversikt (vurdering: min)',
      'Snakk tydelig til stopperne (kilde: begrep «gode beskjeder til lagkompisene», Fagplan keeper 8-9 år)',
      'Pasningen skal ha riktig adresse og fart',
      'Velg alternativ etter presshøyde og medspilleres plassering (kilde: Læringsmomenter keeper 12-13 år)',
    ],
    commonMistakes: [
      'Nøler og blir utfordret i egen femmer',
      'Panikkballer ut over sidelinjen',
      'Ser bare ett pasningsalternativ',
    ],
    variations: [
      'Lettere: Én angriper presser',
      'Vanskeligere: Tre angripere presser høyt, maks to touch totalt',
    ],
    equipment: ['Baller', 'Kjegler', 'Vester'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/laeringsmomenter-for-unge-keepere (NFF lister alternativene «Spille rundt», «Spille gjennom ledd», «Spille i rom», «Spille på», «Spille bak») og https://tiim.no/okt/keeper-pasningsspill',
    unverifiedSource:
      'Gemini oppga «NFF Tiim – Frispilling og keeper som ekstra utespiller» med URL https://www.tiim.no/ (forside, ikke øvelse)',
    sketch:
      'Mål med keeper på 5-meteren. To stoppere på hver side, dyp midtbane foran. To angripere presser fra ca. 15 m.',
  },
  {
    id: 'keeper-a-05',
    name: 'Parade og redd – dobbeltredning',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 12,
    players: '3',
    description:
      'Keeperen redder et skudd, kommer raskt opp igjen og gjør seg skuddklar for et nytt skudd fra en annen vinkel.',
    why: 'NFFs egentreningsøvelse fokuserer på fallteknikk og å komme «hurtig opp i utgangsposisjon» for å være skuddklar igjen. Denne øvelsen bygger videre på det prinsippet med to skudd. (kilde: Rolletrening Keeper Partrening #1)',
    steps: [
      { id: 'keeper-a-05-s1', name: 'Første skudd', description: 'Keeperen står i mål. Trener A står ca. 10 m unna og skyter lavt mot ett hjørne.' },
      { id: 'keeper-a-05-s2', name: 'Redning', description: 'Keeperen kaster seg og fanger eller styrer ballen.' },
      { id: 'keeper-a-05-s3', name: 'Opp', description: 'Keeperen kommer raskt opp med hjelp av hender og bein.' },
      { id: 'keeper-a-05-s4', name: 'Andre skudd', description: 'Trener B (på motsatt side) skyter nytt skudd 2-3 sekunder etter.' },
      { id: 'keeper-a-05-s5', name: 'Omstilling', description: 'Keeperen omstiller seg og redder på nytt.' },
    ],
    coachingPoints: [
      'Hurtig opp i utgangsposisjon (kilde: Rolletrening Partrening #1)',
      'Blikket opp med én gang du er på vei opp',
      'Fallteknikk: land på siden av kroppen (kilde: tema «Fallteknikk/god landing»)',
      'Spillet lever til ballen er død',
    ],
    commonMistakes: [
      'Ruller over på ryggen i stedet for å komme opp via magen og knærne',
      'Blir liggende og ser hvor returen går',
      'Mister kroppskontrollen i fallet',
    ],
    variations: [
      'Lettere: 4-5 sekunder pause mellom skuddene',
      'Vanskeligere: Trener B kan enten skyte eller spille til en angriper som setter returen',
    ],
    equipment: ['8-10 baller', '1 mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/ovelse/rolletrening-keeper-partrening-1 (NFF: «hurtig opp i utgangsposisjon og være skuddklar igjen»); https://tiim.no/artikkel/laeringsmomenter-for-unge-keepere (NFF-tema: «Fallteknikk/god landing»)',
    unverifiedSource:
      'Gemini oppga «YouTube – Become Elite: Goalkeeper Drills for Shot Stopping and Recovery» med URL https://www.youtube.com/watch?v=BecomeEliteGoalkeeping (ugyldig video-ID; utgiver: Become Elite / Matt Sheldon). Flyttet fra Keeper-Barn til Keeper-Voksne.',
    sketch:
      'Mål med keeper. Trener A skrått foran til høyre (10 m). Trener B skrått foran til venstre. Keeper skal komme seg raskt fra fall mot høyre til skuddklar mot venstre.',
  },
  {
    id: 'keeper-a-06',
    name: 'Vinkeljageren – posisjonering i mål',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '4-6',
    description:
      'Keeperen justerer posisjonen sin langs en tenkt bue foran mål etter hvor ballen spilles mellom tre angripere utenfor 16-meteren, før en av dem avslutter.',
    why: 'NFF skriver at keeperens posisjonering styres av motstanders ballfører og plasseringen til med- og motspillere. Øvelsen trener å justere posisjonen kontinuerlig og være skuddklar når skuddet kommer. (kilde: Læringsmomenter keeper 12-13 år)',
    steps: [
      { id: 'keeper-a-06-s1', name: 'Pasningsspill', description: 'Tre angripere spiller ballen seg imellom utenfor 16-meteren.' },
      { id: 'keeper-a-06-s2', name: 'Justering', description: 'Keeperen justerer posisjonen med små, raske steg langs en tenkt bue mellom stolpene og ballen.' },
      { id: 'keeper-a-06-s3', name: 'Utløser', description: 'Når en angriper tar et touch fremover, kan vedkommende skyte.' },
      { id: 'keeper-a-06-s4', name: 'Skuddklar', description: 'Keeperen skal være i balanse og skuddklar i det skuddet avfyres.' },
    ],
    coachingPoints: [
      'Flytt deg mens ballen trilles, og vær skuddklar når skytteren skal avslutte (vurdering: min, formulert med NFFs begrep «skuddklar»)',
      'Følg en tenkt linje fra midten av målet til ballen',
      'Kom noen steg ut fra linjen for å gjøre målet mindre',
      'Kommuniser med forsvarerne (kilde: begrep «gode beskjeder til lagkompisene», Fagplan keeper 8-9 år)',
    ],
    commonMistakes: [
      'Rygger inn i målet i stedet for å møte skytteren',
      'Beveger seg mens skuddet går og blir tatt på feil fot',
      'Står for langt fra linjen',
    ],
    variations: [
      'Lettere: Angriperne spiller i et fast mønster før skudd',
      'Vanskeligere: Angriperne kan enten skyte eller slå en gjennomspilling',
    ],
    equipment: ['6-8 baller', '1 mål', 'Kjegler til vinkelmerking'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/laeringsmomenter-for-unge-keepere (NFF: «Keeperens posisjonering styres av motstanders ballfører og antallet/plasseringen til med- og motspillere»; «Forsvar av målet: Aksjonere»)',
    unverifiedSource:
      'Gemini oppga «UEFA Grassroots Football Development Manual (Section: Goalkeeper Positioning)» med URL https://www.uefa.com/grassroots/ (generell side, ikke øvelse; utgiver: UEFA). «Stå stille når skytteren skal treffe ballen» omformulert til NFFs begrep «skuddklar». Flyttet fra Keeper-Barn.',
    sketch:
      'Mål med keeper. Tre angripere i en trekant utenfor 16-meteren. Kjegler markerer en tenkt bue foran mål som keeperen følger.',
  },
  {
    id: 'keeper-a-07',
    name: 'Felt-duellen – fange eller bokse',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 12,
    players: '4',
    description:
      'Keeperen håndterer høye baller i et trangt felt der ballen ikke alltid kan fanges trygt. Keeperen skal velge mellom å fange og å bokse ballen ut.',
    why: 'NFF skriver at keeperen i 5-meteren må «beslutte» om den aktivt skal angripe ballen eller la forsvarerne gjøre jobben, og NFFs 13-19-plan lister feltarbeid med press i boks. Å bokse er et alternativ når fangst er risikabelt. (kilde: Læringsmomenter keeper 12-13 år, Fagplan keeper 13-19 år)',
    steps: [
      { id: 'keeper-a-07-s1', name: 'Servering', description: 'En trener slår høye baller inn mot 5-meteren.' },
      { id: 'keeper-a-07-s2', name: 'Trangt rom', description: 'En forsvarer og en angriper lager trangt rom foran keeperen.' },
      { id: 'keeper-a-07-s3', name: 'Valg', description: 'Keeperen vurderer: kan ballen fanges, fanger keeperen. Er det for trangt, roper keeperen tydelig og bokser ballen høyt og langt ut mot sidene.' },
      { id: 'keeper-a-07-s4', name: 'Teknikk', description: 'Trener sjekker at boksingen treffer med knokene og stramme håndledd. (vurdering: min; NFF-kildene gir ikke bokseteknikk)' },
    ],
    coachingPoints: [
      'Beslutt tidlig: fange eller bokse (kilde: begrepet «Beslutte»)',
      'Rop tydelig så alle vet hva du gjør',
      'Boks opp og ut mot siden, ikke rett ut i midten',
      'Knokene og stive håndledd',
    ],
    commonMistakes: [
      'Treffer ballen med flate fingre eller løse håndledd',
      'Bokser ballen rett ut i midten',
      'Nøler og blir stående halvveis',
    ],
    variations: [
      'Lettere: Ingen utespillere, myke baller',
      'Vanskeligere: Begge utespillere kjemper aktivt om hodeduellen',
    ],
    equipment: ['6 baller', '1 mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/laeringsmomenter-for-unge-keepere (NFF-tema «Feltarbeid/høye baller» og «Forsvar av 5m: Beslutte»); https://tiim.no/artikkel/fagplan-keeper-13-19-ar (NFF: «Feltarbeid: innlegg fra sidene, dødballer, press i boks med markeringer»)',
    unverifiedSource:
      'Gemini oppga «YouTube – Progressive Soccer: Goalkeeper High Balls and Boxing Technique» med URL https://www.youtube.com/watch?v=ProgressiveSoccerGK (ugyldig video-ID; utgiver: Progressive Soccer). Flyttet fra Keeper-Barn til Keeper-Voksne.',
    sketch:
      'Mål med keeper. Servitør på kanten av feltet slår innlegg mot 5-meteren. En forsvarer og en angriper står foran keeperen.',
  },
  {
    id: 'keeper-a-08',
    name: 'Reaksjon via avbøyning (sprettbrett eller partner)',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 12,
    players: '3',
    description:
      'Ballen skytes mot et sprettbrett (rebounder) eller en medspiller som bevisst avbøyer den, slik at ballbanen endres uforutsigbart rett foran keeperen.',
    why: 'Trener reaksjon og omstilling ved avbøyninger. Hvis klubben ikke har et sprettbrett, fungerer en medspiller med foten eller kroppen like godt. (vurdering: min)',
    steps: [
      { id: 'keeper-a-08-s1', name: 'Oppsett', description: 'Sett opp sprettbrettet (eller en medspiller) ca. 8-10 m foran mål.' },
      { id: 'keeper-a-08-s2', name: 'Skudd', description: 'Trener skyter fra ca. 16 m inn i brettet/medspilleren.' },
      { id: 'keeper-a-08-s3', name: 'Avbøyning', description: 'Ballen skifter retning (høyre, venstre eller over).' },
      { id: 'keeper-a-08-s4', name: 'Reaksjon', description: 'Keeperen står i nøytral utgangsstilling til retningsendringen skjer, og reagerer da.' },
    ],
    coachingPoints: [
      'Nøytral balanse til du ser hvor ballen skifter retning',
      'Korte, eksplosive justeringssteg',
      'Hendene først, og blikket på ballen',
      'Skuddklar: rett utgangsposisjon (kilde: begrep fra Rolletrening Keeper Partrening #1)',
    ],
    commonMistakes: [
      'Gjetter og kaster seg før ballen treffer brettet',
      'Mister balansen bakover',
      'Reagerer for sent',
    ],
    variations: [
      'Lettere: Treneren kaster ballen manuelt inn i brettet i lav fart',
      'Vanskeligere: En medspiller skjermer sikten frem til ballen treffer brettet',
    ],
    equipment: ['10 baller', 'Sprettbrett (eller en medspiller)', '1 mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/fagplan-keeper-13-19-ar (NFF lister «Skuddstopping: korte reaksjonsøvelser»)',
    unverifiedSource:
      'Gemini oppga «YouTube – Become Elite: Goalkeeper Deflection & Rebound Board Drills» med URL https://www.youtube.com/watch?v=BecomeEliteDeflections (ugyldig video-ID; utgiver: Become Elite / Matt Sheldon). Krever sprettbrett; partner-variant lagt til.',
    sketch:
      'Mål med keeper. Sprettbrett 8-10 m foran. Skytter 16 m unna.',
  },
  {
    id: 'keeper-a-09',
    name: 'Feltkommando etter løp (lett belastning)',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '6-8',
    description:
      'Keeperen gjør et kort løp gjennom en kjeglerekke med rask retningsendring, og må umiddelbart håndtere et innlegg i feltet med full trafikk og fysisk duell.',
    why: 'Simulerer kampforhold der keeperen er pustet opp, men må ta gode beslutninger. Gemini-versjonen brukte hekkehopp. Hekkene er erstattet med et kort løp og retningsendring, fordi hopp rett før en duell øker skaderisikoen, og NFF anbefaler kontroll i hopp og landing (kilde: RRR-artikkelen). (vurdering: min)',
    steps: [
      { id: 'keeper-a-09-s1', name: 'Løp', description: 'Keeperen løper gjennom en rekke på 3-4 kjegler med rask retningsendring.' },
      { id: 'keeper-a-09-s2', name: 'Innlegg', description: 'Treneren slår umiddelbart et innlegg fra sidekorridor.' },
      { id: 'keeper-a-09-s3', name: 'Duell', description: 'To angripere og to forsvarere angriper rommet i 5-meteren.' },
      { id: 'keeper-a-09-s4', name: 'Eie feltet', description: 'Keeperen roper tydelig og eier feltet ved å fange eller bokse ballen ut.' },
      { id: 'keeper-a-09-s5', name: 'Sikkerhet', description: 'Gjør kun etter god oppvarming, og stopp ved sårhet eller smerte.' },
    ],
    coachingPoints: [
      'Nullstill hodet med én gang etter løpet',
      'Beslutt tidlig: angripe ballen eller la forsvarerne ta den (kilde: begrepet «Beslutte»)',
      'Rop tydelig så det høres over hele feltet',
      'Bruk kneet aktivt til å beskytte deg i lufta (vurdering: min)',
    ],
    commonMistakes: [
      'Nøler og blir stående halvveis ute',
      'Sparer på stemmen på grunn av tretthet',
      'Går for fort i kjeglerekken og mister kontrollen',
    ],
    variations: [
      'Lettere: Uten løp før innlegget',
      'Vanskeligere: Legg til et skudd fra returrommet hvis keeperen bokser ballen ut',
    ],
    equipment: ['8-10 baller', '4 kjegler', 'Vester', '1 mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/fagplan-keeper-13-19-ar (NFF: «Fysisk styrke, hurtighet og eksplosivitet. Feltarbeid med høyt trykk»); https://tiim.no/artikkel/laeringsmomenter-for-unge-keepere (NFF-tema «Feltarbeid/høye baller»)',
    unverifiedSource:
      'Gemini oppga «US Soccer Player Development Framework – High Balls Under Physical Pressure» med URL https://www.ussoccer.com/coaching (generell side, ikke øvelse; utgiver: US Soccer Federation). Originalen hadde hopp over 3 lavhekker; erstattet.',
    warning:
      'Kjør kun når keeperen er godt oppvarmet, og stopp ved sårhet eller smerte. Gemini-versjonen hadde hekkehopp rett før duellen; det er fjernet for å redusere skaderisiko.',
    sketch:
      'Kjeglerekke (3-4 kjegler) 5 m foran mål. Servitør i sidekorridor slår innlegg. To angripere og to forsvarere foran mål.',
  },
  {
    id: 'keeper-a-10',
    name: 'Straffespark – les og reager',
    category: 'keeper' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 10,
    players: '3-5',
    description:
      'Straffesparktrening der keeperen leser skytterens tilløp og kroppsholdning, står klar på linjen og reagerer eksplosivt.',
    why: 'Trener konsentrasjon, tålmodighet og eksplosivitet under press. NFFs 13-19-plan nevner mentale ferdigheter som håndtering av nervøsitet og press. Geminis påstand om at «krum tilløpsvinkel indikerer motsatt hjørne» er fjernet, fordi den ikke lar seg bekrefte og ikke bør gis som fasit. (kilde: Fagplan keeper 13-19 år; vurdering: min)',
    steps: [
      { id: 'keeper-a-10-s1', name: 'Oppsett', description: 'Skytteren stiller opp ballen på 11-metersmerket.' },
      { id: 'keeper-a-10-s2', name: 'Utgangsposisjon', description: 'Keeperen står med begge beina på mållinjen.' },
      { id: 'keeper-a-10-s3', name: 'Lesing', description: 'Keeperen leser skytterens tilløp, hofter og plantefot.' },
      { id: 'keeper-a-10-s4', name: 'Reaksjon', description: 'Keeperen bestemmer seg sent og kaster seg eksplosivt.' },
    ],
    coachingPoints: [
      'Hold deg på tåballene, blikket på skytterens plantefot og hofter (vurdering: min)',
      'Vær tålmodig, ikke tjuvstart',
      'Skyv frem og til siden så du kutter vinkelen',
      'Ha en rutine som hjelper mot nervøsitet (kilde: tema «Mentale ferdigheter»)',
    ],
    commonMistakes: [
      'Tjuvstarter og blir lett lurt',
      'Faller bakover',
      'For mye fokus på å gjette i stedet for å reagere',
    ],
    variations: [
      'Lettere: Skytteren sier hvilket hjørne, som trener ren reaksjon',
      'Vanskeligere: Konkurranse med poeng under press',
    ],
    equipment: ['6-8 baller', '1 mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/fagplan-keeper-13-19-ar (NFF lister «Mentale ferdigheter: konsentrasjon, håndtering av nervøsitet og press» og «Skuddstopping»)',
    unverifiedSource:
      'Gemini oppga «UEFA Technical Report – Goalkeeping Trends & Penalty Shot Stopping» med URL https://www.uefa.com/insideuefa/documentlibrary/technical-reports/ (generell side, ikke øvelse; utgiver: UEFA)',
    sketch:
      'Mål med keeper på linjen. Skytter ved 11-metersmerket. Ball ligger klar.',
  },
];