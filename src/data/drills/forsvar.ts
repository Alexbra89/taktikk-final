// src/data/drills/forsvar.ts
import type { DrillExercise } from '../../types';

export const FORSVAR_YOUTH: DrillExercise[] = [
  {
    id: 'forsvar-y-01',
    name: 'Skyggen min (sidestilling og reaksjon)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['8-9'],
    difficulty: 'enkel' as const,
    duration: 8,
    players: '2 og 2',
    description:
      'To spillere står overfor hverandre på en linje uten ball. Angriperen gjør sidelengs bevegelser og finter, mens forsvareren skal «skygge» angriperen ved å holde riktig avstand og lavt tyngdepunkt uten å bli lurt.',
    why: 'Lærer barnet grunnleggende forsvarsstilling (sidestilt, bøyde knær, på tåballene) uten stresset fra en ball.',
    steps: [
      { id: 'forsvar-y-01-s1', name: 'Oppsett', description: 'Marker en linje på 5-8 m med to kjegler.' },
      { id: 'forsvar-y-01-s2', name: 'Angriper', description: 'Angriperen beveger seg sidelengs langs linjen med retningsendringer og finter.' },
      { id: 'forsvar-y-01-s3', name: 'Forsvarer', description: 'Forsvareren står 1-2 m unna og holder seg rett foran angriperen.' },
      { id: 'forsvar-y-01-s4', name: 'Bytte', description: 'Etter 30 sekunder roper treneren «BYTT!».' },
    ],
    coachingPoints: [
      'Bøy i knærne og vær lett på tåballene',
      'Stå sidelengs, ikke flat mot angriperen',
      'Se på magen eller hoften til angriperen, ikke på beina',
    ],
    commonMistakes: [
      'Krysser beina i forflytningen og mister balansen',
      'Blir stående på hælene og reagerer for sent',
    ],
    variations: [
      'Lettere: Angriperen går i stedet for å løpe',
      'Vanskeligere: Angriperen dribler en ball langs linjen',
    ],
    equipment: ['2 kjegler per par'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-8-9-ar (NFF nevner «kroppskontroll», «korte raske steg» og at 1F kommer «tett i press med rett fart»)',
    unverifiedSource: 'Gemini oppga «Allment kjent øvelse (Grasrottrener-metodikk)»; ingen lenke',
    sketch:
      'To kjegler 5-8 m fra hverandre. Angriper og forsvarer står vendt mot hverandre midt mellom dem, og beveger seg sidelengs langs linjen.',
  },
  {
    id: 'forsvar-y-02',
    name: 'Kjeglefangeren (1 mot 1: lede og skjerme)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['8-9'],
    difficulty: 'enkel' as const,
    duration: 10,
    players: '4-6',
    description:
      'Angriperen prøver å føre ballen over og berøre en av to kjegler i bakkant av banen, mens forsvareren prøver å lede angriperen bort fra kjeglene og vinne ballen.',
    why: 'Lærer forsvareren å «lede» angriperen ut mot sidene eller bort fra farlig område i stedet for å stupe inn i en takling.',
    steps: [
      { id: 'forsvar-y-02-s1', name: 'Oppsett', description: 'Lag en sone på 10×10 m med to kjeglemål på bakkantlinjen.' },
      { id: 'forsvar-y-02-s2', name: 'Start', description: 'Forsvareren spiller ballen til angriperen og rykker ut for å presse.' },
      { id: 'forsvar-y-02-s3', name: 'Angrep', description: 'Angriperen prøver å finne en luke og stoppe ballen ved en av kjeglene.' },
      { id: 'forsvar-y-02-s4', name: 'Ledning', description: 'Forsvareren vrir kroppen slik at nærmeste kjegle nektes, og tvinger angriperen ut mot kanten.' },
    ],
    coachingPoints: [
      'Brems opp før du kommer helt frem til angriperen',
      'Vis angriperen veien ut mot sidelinjen',
      'Ikke kast deg frem, vent til angriperen tar et for langt touch (kilde: NFF «utnytte dårlige, lange touch», se background)',
    ],
    commonMistakes: [
      'Løper for hardt inn og blir enkelt forbiløpt',
      'Står rett foran angriperen, slik at begge sider er åpne',
    ],
    variations: [
      'Lettere: Smalere bane gjør det enklere å dekke rommet',
      'Vanskeligere: Tredje kjegle gir angriperen flere alternativer',
    ],
    equipment: ['4 kjegler per bane', '1 ball'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-8-9-ar (NFF: «stresse ballfører», «lede vekk», «komme tett i press med rett fart»)',
    unverifiedSource: 'Gemini oppga «YouTube-kanal: @SoccerCoachWeekly», uten videolenke',
    sketch:
      'Sone 10×10 m. To kjegler på bakkantlinjen (ca. 4 m fra hverandre). Angriper starter foran, forsvarer 3 m foran angriperen og presser mot dem.',
  },
  {
    id: 'forsvar-y-03',
    name: 'Nappe haler (nærduell og balanse)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['6-7', '8-9'],
    difficulty: 'enkel' as const,
    duration: 8,
    players: '6-12',
    description:
      'Alle spillerne har en vest stappet ned bak i buksen som en «hale». Hver spiller har en ball på foten og skal beskytte sin egen hale samtidig som de prøver å nappe andres.',
    why: 'Utvikler kroppsbeherskelse, skjerming og balanse når man kjemper om ball og rom under press.',
    steps: [
      { id: 'forsvar-y-03-s1', name: 'Oppsett', description: 'Avgrens et område på 15×15 m.' },
      { id: 'forsvar-y-03-s2', name: 'Ball', description: 'Alle fører hver sin ball.' },
      { id: 'forsvar-y-03-s3', name: 'Napping', description: 'På signal skal man bruke den frie hånden til å nappe haler fra medspillere uten å miste kontrollen på egen ball.' },
      { id: 'forsvar-y-03-s4', name: 'Tap', description: 'Mister man ballen eller halen, gjør man fem hopp på stedet før man er med igjen.' },
    ],
    coachingPoints: [
      'Sett kroppen mellom ballen og motstanderen',
      'Hold tyngdepunktet lavt så ingen dytter deg ut av balanse',
      'Hold blikket opp',
    ],
    commonMistakes: ['Glemmer ballen og løper bare etter haler'],
    variations: [
      'Lettere: Uten ball i starten',
      'Vanskeligere: To utvalgte «jegere» uten ball skal kapre haler fra de som fører ball',
    ],
    equipment: ['1 vest per spiller', '1 ball per spiller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/ovelse/kontroll-pa-egen-ball-jakte-motstanderens (NFF-leken der spillerne verner om egen ball mens de jakter andres)',
    unverifiedSource: 'Gemini oppga «Allment kjent lekeøvelse i barnefotball»; ingen lenke',
  },
  {
    id: 'forsvar-y-04',
    name: 'Tålmodigheten (vinne ballen i riktig øyeblikk)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['8-9', '10-12'],
    difficulty: 'enkel' as const,
    duration: 10,
    players: '4-8',
    description:
      'Forsvareren holder angriperen igjen i en smal korridor og skal time taklingen når angriperen gjør en feil eller tar et ukontrollert touch.',
    why: 'Trener tålmodighet i 1 mot 1, så barna unngår frispark og å bli utspilt med en gang.',
    steps: [
      { id: 'forsvar-y-04-s1', name: 'Oppsett', description: 'Lag en korridor på 12×5 m.' },
      { id: 'forsvar-y-04-s2', name: 'Start', description: 'Angriperen starter i den ene enden, forsvareren i den andre.' },
      { id: 'forsvar-y-04-s3', name: 'Avvent', description: 'Forsvareren rykker frem, bremser 1-2 m foran angriperen og avventer.' },
      { id: 'forsvar-y-04-s4', name: 'Takling', description: 'Når angriperen slår ballen for langt frem, går forsvareren inn med en ren takling med innsiden av foten og fører ballen ut av korridoren.' },
    ],
    coachingPoints: [
      'Vær tålmodig, vent på det lange touchet (kilde: NFF-moment, se background)',
      'Bruk innsiden av foten når du vinner ballen, ikke tåspissen',
      'Hold deg på beina så lenge som mulig',
    ],
    commonMistakes: [
      'Takler mens angriperen har full kontroll på ballen',
      'Takler med strakt bein og mister balansen',
    ],
    variations: [
      'Lettere: Smalere korridor (3 m)',
      'Vanskeligere: Bredere korridor, så angriperen får mer rom å finte på',
    ],
    equipment: ['4 kjegler', '1 ball per par'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «utnytte dårlige, lange og for mange touch», «komme tett i press med rett fart»)',
    unverifiedSource:
      'Gemini oppga «Soccer Coach Weekly – One-on-one defending» med URL https://www.soccercoachweekly.net/practice-plans/smart-sessions-core-skills/one-on-one-defending (utgiver: Soccer Coach Weekly); kunne ikke åpnes. Opprinnelig tittel: «Nøtteliten».',
    sketch:
      'Korridor 12×5 m. Angriper i den ene enden, forsvarer i den andre. Forsvareren rykker frem og stopper 1-2 m foran angriperen.',
  },
  {
    id: 'forsvar-y-05',
    name: 'Murbyggerne (blokkere skudd)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'middels' as const,
    duration: 12,
    players: '4-6',
    description:
      'En angriper prøver å score i et småmål fra 8-10 m, mens en forsvarer rykker ut og blokkerer skuddet med kroppen.',
    why: 'Lærer barna å blokkere skudd uten å snu ryggen til ballen eller lukke øynene. NFF beskriver blokking «med fremsiden av kroppen». (kilde: Spillmodellen 8-9 år)',
    steps: [
      { id: 'forsvar-y-05-s1', name: 'Start', description: 'Angriperen står klar på 10 m med ball.' },
      { id: 'forsvar-y-05-s2', name: 'Forsvarer', description: 'Forsvareren står ved siden av et lite mål.' },
      { id: 'forsvar-y-05-s3', name: 'Skuddforsøk', description: 'Angriperen tar et touch fremover og gjør seg klar til skudd.' },
      { id: 'forsvar-y-05-s4', name: 'Blokk', description: 'Forsvareren rykker ut, gjør seg stor og blokkerer skuddet ved å dekke vinkelen.' },
    ],
    coachingPoints: [
      'Opp i blokk, blokker med fremsiden av kroppen (kilde: NFF-moment, se background)',
      'Ikke snu ryggen til skuddet',
      'Hold hendene inntil kroppen så du ikke lager hands',
    ],
    commonMistakes: [
      'Snur seg helt rundt og dukker unna',
      'Hopper med sprikende armer',
    ],
    variations: [
      'Lettere: Angriperen bruker myk ball eller svak fot',
      'Vanskeligere: Angriperen kan finte før skuddet',
    ],
    equipment: ['1 småmål', '6-8 baller', 'Kjegler'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/laeringsmomenter-for-unge-keepere (NFF: «Forsvar av målet», «hindre avslutning») og https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-8-9-ar (NFF: «Opp i blokk: blokke med fremsiden av kroppen»)',
    unverifiedSource: 'Gemini oppga «Allment kjent øvelse i NFF barnefotball»; ingen lenke. Opprinnelig tittel: «Mur-Byggerne».',
    sketch:
      'Småmål. Angriper 10 m foran med ball. Forsvarer står ved siden av målet og rykker ut mot skytteren.',
  },
  {
    id: 'forsvar-y-06',
    name: 'Rask hjemjobb (returløp og takling)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'middels' as const,
    duration: 12,
    players: '4-6',
    description:
      'En angriper får et forsprang mot mål, og forsvareren må ta et eksplosivt returløp for å innhente angriperen før skuddet.',
    why: 'Utvikler innsatsvilje til å jobbe hjemover når laget har mistet ballen, og lærer å komme inn på «rett side». (kilde: NFF-moment, se background)',
    steps: [
      { id: 'forsvar-y-06-s1', name: 'Start', description: 'Angriperen starter 20 m fra mål, forsvareren 3 m bak eller litt til siden.' },
      { id: 'forsvar-y-06-s2', name: 'Serve', description: 'Treneren triller ballen frem til angriperen, som løper mot mål.' },
      { id: 'forsvar-y-06-s3', name: 'Returløp', description: 'Forsvareren spurter tilbake, kommer inn på rett side (mellom angriper og mål) og tar ballen rent eller presser den over dødlinjen.' },
    ],
    coachingPoints: [
      'Løp den korteste veien mot eget mål for å avskjære',
      'Kom deg inn på målsiden før du prøver å ta ballen (kilde: «rett side av ball», NFF-moment)',
      'Bruk skulder mot skulder hvis du er helt oppe i angriperen',
    ],
    commonMistakes: [
      'Løper inn i angriperen bakfra og lager frispark',
      'Gir opp returløpet ved lite forsprang',
    ],
    variations: [
      'Lettere: Øk avstanden eller gi forsvareren forsprang',
      'Vanskeligere: Angriperen starter likt med forsvareren',
    ],
    equipment: ['1 mål', '6-8 baller', 'Kjegler'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «Raskt på rett side av ball når pressejobben er over», «returløp: spillere på feil side må komme seg på rett side»)',
    unverifiedSource: 'Gemini oppga «YouTube-kanal: @ProgressiveSoccer», uten videolenke. Opprinnelig tittel: «Rask Hjemjobb».',
    sketch:
      'Mål. Angriper starter 20 m ute med ball. Forsvareren starter 3 m bak og litt til siden, og løper for å komme mellom angriper og mål.',
  },
  {
    id: 'forsvar-y-07',
    name: 'Dobbeltmuren (2 mot 1: press og sikring)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'middels' as const,
    duration: 12,
    players: '6',
    description:
      'To forsvarere jobber sammen mot én angriper. Den ene presser ballføreren (1F), mens den andre sikrer bak.',
    why: 'Lærer grunnprinsippet i lagforsvar: press og sikring. NFF bruker begrepene «1F» og «sikring til førsteforsvarer». (kilde: Spillmodellen 10-12 år)',
    steps: [
      { id: 'forsvar-y-07-s1', name: 'Oppsett', description: 'Marker en bane på 12×12 m med ett mål i enden.' },
      { id: 'forsvar-y-07-s2', name: 'Start', description: 'Angriperen starter med ball i motsatt ende.' },
      { id: 'forsvar-y-07-s3', name: 'Press', description: 'Forsvarer 1 rykker ut og støter på ballføreren.' },
      { id: 'forsvar-y-07-s4', name: 'Sikring', description: 'Forsvarer 2 plasserer seg 3-4 m bak Forsvarer 1, på skrå, i sikringsrommet.' },
      { id: 'forsvar-y-07-s5', name: 'Overtakelse', description: 'Dribler angriperen forbi Forsvarer 1, tar Forsvarer 2 over.' },
    ],
    coachingPoints: [
      'Førsteforsvareren roper «Jeg støter!»',
      'Andreforsvareren ligger på skrå bak',
      'Ikke stå på rett linje bak hverandre',
      'Korte avstander bak presset (kilde: NFF-moment, se background)',
    ],
    commonMistakes: [
      'Begge støter samtidig og åpner rom',
      'Andreforsvareren står for langt unna til å hjelpe',
    ],
    variations: [
      'Lettere: Ingen tidspress eller touchbegrensning for angriperen',
      'Vanskeligere: 2 mot 2, der forsvarerne bytter på hvem som presser og hvem som sikrer',
    ],
    equipment: ['4 kjegler', '1 mål', 'Vester', '6 baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «Korte avstander bak presset – Sikring på 1. forsvarer»; «Sikring til førsteforsvarer»)',
    unverifiedSource:
      'Gemini oppga «Soccer Coach Weekly – Back me up, buddy» med URL https://www.soccercoachweekly.net/practice-plans/smart-sessions-core-skills/back-me-up-buddy (utgiver: Soccer Coach Weekly); kunne ikke åpnes',
    sketch:
      'Bane 12×12 m med mål i den ene enden. Angriper i motsatt ende. Forsvarer 1 foran, Forsvarer 2 3-4 m bak og skrått til siden.',
  },
  {
    id: 'forsvar-y-08',
    name: '2 mot 2 kompakt (sidelengs forflytning)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'middels' as const,
    duration: 15,
    players: '4',
    description:
      'To forsvarere forsvarer to kjeglemål mot to angripere som spiller til hverandre. Forsvarerne må flytte seg sammen sidelengs når ballen spilles.',
    why: 'Lærer samhandling i forsvarsleddet og å være kompakt sidelengs. (kilde: NFF-moment «korte avstander i bredden», se background)',
    steps: [
      { id: 'forsvar-y-08-s1', name: 'Oppsett', description: 'Bane på 15×12 m med to små kjegleporter i hver ende.' },
      { id: 'forsvar-y-08-s2', name: 'Angrep', description: 'Angriper A og B spiller til hverandre.' },
      { id: 'forsvar-y-08-s3', name: 'Press A', description: 'Har A ballen, støter Forsvarer 1 på A, mens Forsvarer 2 faller av i sikring mot B.' },
      { id: 'forsvar-y-08-s4', name: 'Press B', description: 'Spilles ballen til B, støter Forsvarer 2 på B, mens Forsvarer 1 sikrer.' },
    ],
    coachingPoints: [
      'Flytt dere sammen, som med et usynlig tau mellom dere',
      'Snakk sammen: «Min ball!» og «Jeg sikrer!»',
      'Hold korte avstander mellom dere (kilde: NFF-moment)',
    ],
    commonMistakes: [
      'En forsvarer blir hengende igjen',
      'Støter for sent når pasningen har gått',
    ],
    variations: [
      'Lettere: Angriperne må ta minst tre touch før de kan score',
      'Vanskeligere: Angriperne kan score direkte på ett touch',
    ],
    equipment: ['8 kjegler', '1 ball', 'Vester'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «Korte avstander mellom spillere i lengden og bredden», «kompakt lag»)',
    unverifiedSource:
      'Gemini oppga «The FA Bootroom – Mastering defensive techniques and roles» med URL https://www.thefa.com/bootroom/resources/coaching/mastering-defensive-techniques-and-roles (utgiver: The Football Association); kunne ikke åpnes. Opprinnelig tittel «NFF 2v2 Kompakt», men kilden var ikke NFF, så «NFF» er fjernet.',
    sketch:
      'Bane 15×12 m med en kjegleport i hver kortende. To angripere står på hver side av banen, to forsvarere i midten mellom dem og målene.',
  },
  {
    id: 'forsvar-y-09',
    name: 'Bryteren (komme foran og bryte pasningen)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'avansert' as const,
    duration: 12,
    players: '3',
    description:
      'En pasningslegger slår en oppspillspasning mot en møtende angriper. Forsvareren står tett bak angriperen, må lese pasningen, komme foran i riktig øyeblikk og bryte ballbanen rent.',
    why: 'Trener spilleforståelse og aktivt forsvarsspill mot oppspill til en møtende spiss.',
    steps: [
      { id: 'forsvar-y-09-s1', name: 'Oppstilling', description: 'Pasningsleggeren står 12-15 m unna.' },
      { id: 'forsvar-y-09-s2', name: 'Møteløp', description: 'Angriperen gjør et lite møteløp mot pasningen.' },
      { id: 'forsvar-y-09-s3', name: 'Kontakt', description: 'Forsvareren har tett kontakt i ryggen på angriperen.' },
      { id: 'forsvar-y-09-s4', name: 'Brudd', description: 'Når pasningen slås, orienterer forsvareren seg, går eksplosivt foran angriperen, bryter pasningen og fører ballen ut av sonen.' },
    ],
    coachingPoints: [
      'Ikke lag frispark ved å dytte angriperen i ryggen',
      'Vær eksplosiv de to første stegene foran spissen',
      'Bruk en arm lett for å kjenne hvor angriperen er, uten å holde fast',
    ],
    commonMistakes: [
      'Går for tidlig og blir lurt av en finte eller et bakromsløp',
      'Løper inn i ryggen på angriperen (frispark)',
    ],
    variations: [
      'Lettere: Pasningen slås sakte, så timingen blir enkel',
      'Vanskeligere: Angriperen kan legge ballen av videre i stedet for å ta imot',
    ],
    equipment: ['6-8 baller', 'Kjegler'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «Overspilte spillere hurtig i press», «Ta duellen før duellen»)',
    unverifiedSource:
      'Gemini oppga «Allment kjent øvelse (Sikre foran-bryting)»; ingen lenke. Opprinnelig tittel: «Bryter’n (Innbrudd foran angriper)».',
    sketch:
      'Pasningslegger 12-15 m unna. Angriper i midten, vendt mot pasningsleggeren. Forsvarer rett bak angriperen.',
  },
  {
    id: 'forsvar-y-10',
    name: 'Boksforsvareren (høye baller og klarering)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '4-6',
    description:
      'Treneren eller en servitør slår myke innlegg i feltet. Forsvareren vurderer ballbanen, timer hoppet og klarerer ballen ut mot siden.',
    why: 'Bygger mot i luftdueller og lærer klareringsteknikk bort fra farlig sone.',
    steps: [
      { id: 'forsvar-y-10-s1', name: 'Oppstilling', description: 'Forsvareren står ca. 7 m foran mål.' },
      { id: 'forsvar-y-10-s2', name: 'Innlegg', description: 'Servitøren slår myke innlegg fra sidene.' },
      { id: 'forsvar-y-10-s3', name: 'Klarering', description: 'Forsvareren rykker frem mot ballen og klarerer den ut av feltet (mot sidelinjen), helst med foten eller, for de som mestrer det, med hodet.' },
      { id: 'forsvar-y-10-s4', name: 'Press', description: 'En angriper settes etter hvert inn for å gi lett press.' },
    ],
    coachingPoints: [
      'Klarer ballen høyt, bredt og langt ut mot sidene',
      'Møt ballen i lufta, ikke vent på at den kommer',
      'Treff ballen med pannen, ikke toppen av hodet',
      'Klarering først, så spill (vurdering: min)',
    ],
    commonMistakes: [
      'Stusser ballen bakover mot eget mål',
      'Blir stående flatfotet',
    ],
    variations: [
      'Lettere: Lett ball eller sprettball; klarering med fot',
      'Vanskeligere: To angripere mot én forsvarer',
    ],
    equipment: ['8-10 baller (gjerne lette)', '1 mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «Innlegg og 45-situasjoner», «Blokkere eller hindre innlegg/pasning»)',
    unverifiedSource:
      'Gemini oppga «The FA Bootroom – How to defend like England: crosses» med URL https://www.thefa.com/bootroom/resources/coaching/how-to-defend-like-england-crosses (utgiver: The Football Association); kunne ikke åpnes. Opprinnelig tittel: «Boks-Forsvarern (Hodebrøyter og klarering)».',
    warning:
      'Øvelsen inneholder hodespill. NFF-kildene som er åpnet gir ingen anbefaling om heading for 10-12 år. Bruk lettvektsball eller myke baller, hold repetisjonene lave, og vurder å bytte hodespillet med klarering med foten hvis det er tvil.',
    sketch:
      'Mål. Servitør på kanten av feltet slår innlegg. Forsvarer 7 m foran mål. Angriper settes inn i feltet senere.',
  },
  {
    id: 'forsvar-y-11',
    name: 'Pressfella i hjørnet (3 mot 2: press mot kanten)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '5',
    description:
      'Tre forsvarere skal stenge inne to angripere i et hjørne av banen ved å lukke pasningsveiene fremover og tvinge frem en feilpasning eller balltap.',
    why: 'Lærer kollektiv forflytning og å stenge rom sammen. NFF beskriver at laget skal «reagere hurtig og samlet» på pressignaler. (kilde: Spillmodellen 10-12 år)',
    steps: [
      { id: 'forsvar-y-11-s1', name: 'Oppsett', description: 'Avmerk en sone på 12×12 m ved sidelinjen eller hjørnet.' },
      { id: 'forsvar-y-11-s2', name: 'Angrep', description: 'Angriperne prøver å spille seg ut av sonen til en nøytral spiller.' },
      { id: 'forsvar-y-11-s3', name: 'Førsteforsvarer', description: 'Førsteforsvareren støter på ballføreren og nekter pasning fremover.' },
      { id: 'forsvar-y-11-s4', name: 'Dekning', description: 'Andre- og tredjeforsvarer dekker nærmeste pasningsalternativ og bakrom.' },
      { id: 'forsvar-y-11-s5', name: 'Krymping', description: 'Sammen krymper de rommet til ballen vinnes.' },
    ],
    coachingPoints: [
      'Gjør banen liten når motstanderen har ballen på kanten',
      'Nekt angriperen å snu seg fremover',
      'Aggressivt, men rent press når feiltouchet kommer',
      'Reager samlet på presssignaler (kilde: NFF-moment)',
    ],
    commonMistakes: ['En forsvarer faller ut av fella og gir en enkel pasningsvei'],
    variations: [
      'Lettere: 3 mot 1 i starten',
      'Vanskeligere: Tidsfrist på 10 sekunder for å vinne ballen',
    ],
    equipment: ['Kjegler', 'Vester', '6 baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «Reagere hurtig og samlet på definerte presssignaler», «Kompakt», «Pressansvar»)',
    unverifiedSource:
      'Gemini oppga «NFF Trenerhåndbok (Seksjon: Pressfeller i barnefotball) – Papirutgave / Ingen direkte URL». Det er ikke bekreftet at denne finnes, og den bør ikke oppgis som kilde uten at den er sjekket. Opprinnelig tittel: «Press-Fella i Hjørnet».',
    sketch:
      'Sone 12×12 m helt ute ved sidelinjen. Ballfører i hjørnet, en angriper i nærheten, en nøytral spiller på utsiden. Tre forsvarere står i trekant rundt ballen.',
  },
  {
    id: 'forsvar-y-12',
    name: 'Bølgeforsvar (3 mot 2 med omstilling)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '8-10',
    description:
      'Kontinuerlig øvelse der to forsvarere må omstille seg umiddelbart når et angrep er avsluttet, og tre nye angripere kommer i bølger mot dem.',
    why: 'Trener omstilling fra angrep til forsvar i undertall. NFF beskriver «rask omstilling» som en sentral del av fotballspillet. (kilde: Spillmodellen 10-12 år)',
    steps: [
      { id: 'forsvar-y-12-s1', name: 'Oppsett', description: 'Bane 20×15 m med mål i begge ender.' },
      { id: 'forsvar-y-12-s2', name: 'Angrep', description: 'Lag A angriper med tre spillere mot to forsvarere fra Lag B.' },
      { id: 'forsvar-y-12-s3', name: 'Avslutning', description: 'Så snart ballen går ut, over linjen eller i mål, løper de to forsvarerne fra Lag B ut.' },
      { id: 'forsvar-y-12-s4', name: 'Rolleskifte', description: 'To av angriperne fra Lag A må umiddelbart snu og bli nye forsvarere, mens tre nye spillere fra Lag B kommer inn som angripere.' },
    ],
    coachingPoints: [
      'Rask omstilling: løp tilbake og finn rollen din med en gang (kilde: NFF-moment)',
      'Forsvar målet først, ikke støt for tidlig i undertall',
      'Forsinke angrepet så medspillere rekker å hjelpe',
    ],
    commonMistakes: [
      'Blir stående og deppe over en misset sjanse',
      'Rusher stivt ut i undertall (2 mot 3)',
    ],
    variations: [
      'Lettere: 2 mot 1 i stedet for 3 mot 2',
      'Vanskeligere: Forsvarerne får poeng hvis de vinner ballen og scorer på et lite mål innen 8 sekunder',
    ],
    equipment: ['2 mål', 'Kjegler', 'Vester', 'Mange baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «å raskt stille om til forsvar – angrep eller angrep – forsvar er en sentral del av fotballspillet»)',
    unverifiedSource:
      'Gemini oppga «Soccer Coach Weekly – 1v1, 2v2, 3v3 Practice» med URL https://www.soccercoachweekly.net/drills-and-games/drills/practice-1v1-2v2-3v3 (utgiver: Soccer Coach Weekly); kunne ikke åpnes. Opprinnelig tittel: «Bølge-Forsvar».',
    sketch:
      'Bane 20×15 m med mål i begge ender. Lag A (3 angripere) i den ene enden, Lag B (2 forsvarere) foran sitt mål. Nye spillere står klare på sidelinjen ved hvert mål.',
  },
  {
    id: 'forsvar-y-13',
    name: 'Taklingsmesteren (timing av støttakling)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'avansert' as const,
    duration: 10,
    players: '4',
    description:
      'En kontrollert øvelse der to spillere løper side om side før forsvareren gjør en ren støttakling (blokktakling) med innsiden av foten.',
    why: 'Bygger riktig og skadefri taklingsteknikk, så barna ikke bruker knotter eller strakt kne.',
    steps: [
      { id: 'forsvar-y-13-s1', name: 'Løp', description: 'Angriper og forsvarer løper side om side i moderat tempo, med ballen mellom seg.' },
      { id: 'forsvar-y-13-s2', name: 'Signal', description: 'Treneren roper «NÅ!».' },
      { id: 'forsvar-y-13-s3', name: 'Takling', description: 'Forsvareren setter standfoten stødig ved siden av ballen og går stivt gjennom ballen med innsiden av foten.' },
      { id: 'forsvar-y-13-s4', name: 'Motstand', description: 'Angriperen gir moderat motstand, så begge kjenner kreftene uten fare for skade.' },
    ],
    coachingPoints: [
      'Lås ankelen når du treffer ballen',
      'Sett standfoten tett inntil ballen for god balanse',
      'Bruk innsiden av foten, aldri tåspissen eller knottene først',
    ],
    commonMistakes: [
      'Løs ankel, så foten slås bakover',
      'Hopper inn i taklingen med begge bein fra bakken',
    ],
    variations: [
      'Lettere: Stående takling mot en stillestående ball i par',
      'Vanskeligere: Takling mot angriper i høyere fart (kun med god kontroll og tilsyn)',
    ],
    equipment: ['1 ball per par', 'Kjegler'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «Tett i ballfører for å vinne ball», «utnytte dårlige, lange og for mange touch»)',
    unverifiedSource:
      'Gemini oppga «Allment kjent øvelse (Ren taklingstrening)»; ingen lenke. Opprinnelig tittel: «Taklings-Mester’n (Timing av støttakling)».',
    warning:
      'Jeg har ikke funnet NFF-materiale om taklingsteknikk for 10-12 år. Denne øvelsen krever nær kroppskontakt og en stiv ankel. Bruk moderat fart, sørg for at barna er godt oppvarmet, og vurder å utelate den uten trenerkompetanse.',
  },
  {
    id: 'forsvar-y-14',
    name: 'Nekt pasningen (stenge pasningslinjer)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['8-9', '10-12'],
    difficulty: 'middels' as const,
    duration: 12,
    players: '6',
    description:
      'Fire angripere står rundt en firkant og spiller til hverandre. To forsvarere inne i firkanten jobber sammen for å dekke pasningslinjene og stoppe pasninger tvers gjennom.',
    why: 'Lærer å bruke kroppen og posisjoneringen til å stenge rom uten å presse ballføreren hver gang. NFF beskriver at 1F skal være «bevisst på rom rundt seg for å stenge avspillpunkter». (kilde: Spillmodellen 10-12 år)',
    steps: [
      { id: 'forsvar-y-14-s1', name: 'Oppsett', description: 'Lag en firkant på 10×10 m.' },
      { id: 'forsvar-y-14-s2', name: 'Angripere', description: 'Angriperne fordeler seg langs sidene.' },
      { id: 'forsvar-y-14-s3', name: 'Forsvarere', description: 'De to forsvarerne plasserer seg hele tiden slik at de stenger direkte pasning tvers gjennom firkanten.' },
      { id: 'forsvar-y-14-s4', name: 'Bytte', description: 'Avskjæres en pasning, bytter pasningslegger plass med forsvareren.' },
    ],
    coachingPoints: [
      'Kikk over skulderen: hvor er den andre angriperen?',
      'Plasser deg i pasningslinjen før pasningen slås',
      'Kommuniser med forsvarsmakkeren',
      'Stenge avspillpunkter (kilde: NFF-moment)',
    ],
    commonMistakes: ['Begge løper etter ballen på utsiden i stedet for å dekke midten'],
    variations: [
      'Lettere: Én forsvarer mot tre angripere',
      'Vanskeligere: Angriperne har maks to touch',
    ],
    equipment: ['4 kjegler', 'Vester', '1 ball'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «Bevisst på rom rundt seg for å stenge avspillpunkter», «posisjonering i forhold til ball og medspillere»)',
    unverifiedSource:
      'Gemini oppga «The FA Bootroom – England DNA 5-11: staying on the ball» med URL https://www.thefa.com/bootroom/resources/coaching/england-dna-5-11-staying-on-the-ball (utgiver: The Football Association); kunne ikke åpnes. Opprinnelig tittel: «Nekt Pasningen! (Skjerme pasningslinje)».',
    sketch:
      'Firkant 10×10 m. Fire angripere, en på hver side. To forsvarere inne i firkanten som plasserer seg i pasningslinjene.',
  },
  {
    id: 'forsvar-y-15',
    name: 'Linjeforsvar 4 mot 4 (støte og falle av)',
    category: 'forsvar' as const,
    ageGroup: 'youth',
    ageBand: ['10-12'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '8',
    description:
      'Spilløvelse 4 mot 4 der forsvarsleddet skal støte og falle av som én enhet, avhengig av presset på ballføreren.',
    why: 'Forbereder de eldste barna på linjeorganisering og bakromsforsvar på større bane. NFF beskriver at laget skal «senke seg samlet» når det ikke er press på ballføreren. (kilde: Spillmodellen 10-12 år)',
    steps: [
      { id: 'forsvar-y-15-s1', name: 'Oppsett', description: 'Spill 4 mot 4 på en bane på 30×20 m med en markert linje av kjegler.' },
      { id: 'forsvar-y-15-s2', name: 'Fall av', description: 'Har motstanderens midtbane ballen uten press, faller forsvarslinjen av for å beskytte bakrommet.' },
      { id: 'forsvar-y-15-s3', name: 'Støt', description: 'Tar motstanderen et dårlig touch eller støtes det på, går linjen ut samlet («LØFT!»).' },
    ],
    coachingPoints: [
      'Følg ballen: se på ballførerens kroppsspråk',
      'Rop «LØFT!» når ballen spilles bakover',
      'Hold linjen rett, så ingen holder motstanderen i spill',
      'Senk dere samlet uten press på ballfører (kilde: NFF-moment)',
    ],
    commonMistakes: [
      'En spiller blir hengende 5 m bak resten av linjen',
      'Linjen rygger helt inn i eget mål uten å støte',
    ],
    variations: [
      'Lettere: Treneren roper «LØFT» eller «FALL» som hjelp i starten',
      'Vanskeligere: Vanlige offsideregler på stor bane',
    ],
    equipment: ['2 mål', 'Markeringskjegler', 'Vester', 'Baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/spillmodellen-og-treningsfilosofi-10-12-ar (NFF: «Senke oss samlet», «Kontinuerlig justering av høyde i forhold til ballfører», «Beholde høyden på ledd»)',
    unverifiedSource:
      'Gemini oppga «US Soccer Coaching DCC (Grassroots 7v7 / 9v9 manual)», uten URL. Opprinnelig tittel «Offside-Fellen (Linjekontroll 4v4)», men øvelsen handler om linjeorganisering, ikke offside.',
    sketch:
      'Bane 30×20 m med mål i hver ende. Forsvarslinje på 4 foran eget mål, en kjeglelinje midt på banen som referanse. Fire angripere spiller mot linjen.',
  },
];

export const FORSVAR_ADULT: DrillExercise[] = [
  {
    id: 'forsvar-a-01',
    name: '1 mot 1 kanalforsvar (lede og tvinge feil)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['13-16'],
    difficulty: 'middels' as const,
    duration: 12,
    players: '4-8',
    description:
      'Forsvareren isolerer en angriper i en smal sidekorridor og bruker kroppsstillingen til å tvinge angriperen ut mot sidelinjen eller inn på svak fot.',
    why: 'Lærer forsvareren å bestemme hvor angriperen får bevege seg, i stedet for å reagere passivt. NFF beskriver at førsteforsvarer skal «lede vekk fra mål» og «reagere raskt og vinne ball ved dårlige, lange touch». (kilde: Landslagsskolens spillmodell, 1 mot 1)',
    steps: [
      { id: 'forsvar-a-01-s1', name: 'Oppsett', description: 'Marker en korridor på 15×8 m langs sidelinjen.' },
      { id: 'forsvar-a-01-s2', name: 'Utrykning', description: 'Forsvareren støter ut i høy fart, bremser 1,5 m foran angriperen og setter en halvåpen kroppsstilling.' },
      { id: 'forsvar-a-01-s3', name: 'Lede', description: 'Kroppsstillingen lukker sporet inn mot banen og tvinger angriperen ut mot sidelinjen.' },
      { id: 'forsvar-a-01-s4', name: 'Vinne ball', description: 'Tar angriperen et urent touch eller slipper ballen for langt frem, går forsvareren inn og vinner ballen.' },
    ],
    coachingPoints: [
      'Ut i fart, brems opp, lavt tyngdepunkt',
      'Lukk sporet inn i banen med skrå kroppsstilling',
      'Gå inn når angriperen ser ned eller tar et langt touch (kilde: NFF-moment, se background)',
      'Rygg litt saktere enn ballførerens fart (kilde: NFF 1v1: «rygge litt saktere enn ballførers fart»)',
    ],
    commonMistakes: [
      'Løper rett frem uten å bremse og blir lurt av én finte',
      'Åpner rommet inn i banen ved å stå feil',
    ],
    variations: [
      'Lettere: Smalere korridor (5 m)',
      'Vanskeligere: Angriperen får poeng for å vende inn mot midten',
    ],
    equipment: ['4 kjegler per bane', '1 ball per par'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF: 1v1-momenter for førsteforsvarer: «Tett i press», «Lede vekk fra mål», «Reagere raskt og vinne ball ved dårlige/lange touch»)',
    unverifiedSource: 'Gemini oppga «Allment kjent øvelse (Grasrottrener / UEFA B-lisens)»; ingen lenke',
    sketch:
      'Korridor 15×8 m langs sidelinjen. Angriper starter i den ene enden med ball, forsvarer møter fra motsatt ende og står mellom angriperen og banen.',
  },
  {
    id: 'forsvar-a-02',
    name: '2 mot 2 soneforsvar (pumping og sikring)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['13-16'],
    difficulty: 'middels' as const,
    duration: 15,
    players: '4',
    description:
      'To forsvarere samarbeider mot to angripere i et sentralt område og veksler kontinuerlig mellom hvem som presser ballfører og hvem som sikrer.',
    why: 'Etablerer den defensive «pumpingen» (støte og falle av) i stopperparet eller på midtbanen. NFF beskriver «pumping» og «sikring til førsteforsvarer» som soneforsvarsprinsipper. (kilde: Landslagsskolens spillmodell)',
    steps: [
      { id: 'forsvar-a-02-s1', name: 'Oppsett', description: 'Sett opp en sone på 18×15 m med ett stort mål og keeper.' },
      { id: 'forsvar-a-02-s2', name: 'Duell', description: 'Angriper A og B mot forsvarer A og B.' },
      { id: 'forsvar-a-02-s3', name: 'Førsteforsvarer', description: 'Førsteforsvareren støter på ballfører og nekter skudd og pasning fremover.' },
      { id: 'forsvar-a-02-s4', name: 'Andreforsvarer', description: 'Andreforsvareren faller av i ca. 45 graders vinkel for å dekke rommet bak og stenge pasningsveien til angriper B.' },
      { id: 'forsvar-a-02-s5', name: 'Veksling', description: 'Ved pasning på tvers veksler forsvarerne roller.' },
    ],
    coachingPoints: [
      'Tydelig kommunikasjon: «Jeg har ball!»',
      'Andreforsvareren ligger dypt nok til å stoppe gjennomspilling i bakrom',
      'Flytt beina i takt når ballen spilles på tvers',
      'Korte avstander mellom 1F og 2F (kilde: NFF-moment, se background)',
    ],
    commonMistakes: [
      'Begge støter på samme mann',
      'Ligger på rett linje, parallelt',
    ],
    variations: [
      'Lettere: Angriperne maks tre touch',
      'Vanskeligere: Legg til en joker (3 mot 2) for å trene undertallsforsvar',
    ],
    equipment: ['1 stort mål', 'Kjegler', 'Vester', 'Baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F1: «Sikring til førsteforsvarer med korte avstander», «Pumping for å ha kontroll på rom mellom ledd»); https://tiim.no/ovelse/prepp-n-4 (NFF: 1F og 2F i soneforsvar)',
    unverifiedSource:
      'Gemini oppga «Soccer Coach Weekly – 2v2 defending in central areas» med URL https://www.soccercoachweekly.net/practice-plans/smart-sessions-core-skills/2v2-defending-in-central-areas (utgiver: Soccer Coach Weekly)',
    sketch:
      'Sone 18×15 m med mål og keeper. Forsvarer 1 presser ballfører, forsvarer 2 3-4 m bak og skrått (45 grader). To angripere.',
  },
  {
    id: 'forsvar-a-03',
    name: 'Firerlinjen som enhet (kollektiv sideforskyvning)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '8-10',
    description:
      'En forsvarsfirer (to stoppere og to backer) flytter seg som en sammenkoblet enhet mens motstanderens midtbane flytter ballen fra side til side. Merk: Geminis tommelfingerregler («8-10 m mellom hver spiller», «ikke strekk linja mer enn 25-30 m») er ikke bekreftet i NFF-kilder.',
    why: 'Lærer laget å holde avstandene i bakre ledd slik at motstanderen ikke finner rom mellom stopper og back. NFF beskriver at laget skal være «kompakt ved å være korte og smale» og bruke «sideforskyvning». (kilde: Landslagsskolens spillmodell)',
    steps: [
      { id: 'forsvar-a-03-s1', name: 'Oppsett', description: 'Sett opp en sone på 30×20 m.' },
      { id: 'forsvar-a-03-s2', name: 'Ballspill', description: 'Fire angripere på midtbanen spiller ball på tvers, uten press til å begynne med.' },
      { id: 'forsvar-a-03-s3', name: 'Skyving', description: 'Forsvarsfireren skyver samlet mot den siden ballen er på.' },
      { id: 'forsvar-a-03-s4', name: 'Press på kant', description: 'Får kantspilleren ballen, støter backen ut, nærmeste stopper sikrer, og motsatt back trekker inn for å holde linjen kompakt.' },
    ],
    coachingPoints: [
      'Hold avstandene mellom spillerne (Gemini oppga 8-10 m mellom hver; vurdering: Gemini)',
      'Motsatt back trekker inn mot midten når ballen er på motsatt kant',
      'Senk dere samlet når motstanderen har ballen uten press (kilde: NFF F2: «Senke oss samlet»)',
      'Kompakte: korte og smale (kilde: NFF-moment)',
    ],
    commonMistakes: [
      'Stopper og back glir for langt fra hverandre og slipper gjennom stikkpasninger',
      'Motsatt back blir stående ute på kanten',
    ],
    variations: [
      'Lettere: Skyving uten motstandere (skyggetrening)',
      'Vanskeligere: Angriperne får lov til å slå frie gjennombruddspasninger når rom oppstår',
    ],
    equipment: ['8 vester', 'Markeringskjegler', 'Baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F1/F2: «Sideforskyvning for å ha kontroll på rom sentralt», «Kompakt lag ved å være korte og smale»)',
    unverifiedSource:
      'Gemini oppga «The FA Bootroom – Understanding the back four unit» med URL https://www.thefa.com/bootroom/resources/coaching/understanding-the-back-four-unit (utgiver: The Football Association). Opprinnelig tittel: «Forskorskyvning i Firerlinje».',
    sketch:
      'Sone 30×20 m. Fire forsvarere på linje. Fire angripere i midtbanen foran, spiller på tvers. Kjegler markerer hvilken side ballen er på.',
  },
  {
    id: 'forsvar-a-04',
    name: 'Lav blokk og boksforsvar (3 mot 4 i undertall)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 20,
    players: '8-10',
    description:
      'Tre forsvarere og keeper forsvarer eget felt mot fire angripere som slår innlegg og trykker på i og rundt 16-meteren.',
    why: 'Trener boksforsvar, duellspill, klareringer under press og oppmerksomhet på løp i «blindsiden». NFF beskriver at forsvarsspillere skal «vinne duellen i boks» og «klarere høyt og langt ut av farlig sone». (kilde: Landslagsskolens spillmodell, F3)',
    steps: [
      { id: 'forsvar-a-04-s1', name: 'Oppsett', description: 'Øvelsen foregår fra ca. 20 m og inn mot 16-meteren.' },
      { id: 'forsvar-a-04-s2', name: 'Angrep', description: 'Angrepslaget har to sentrale spillere og to kantspillere som slår innlegg.' },
      { id: 'forsvar-a-04-s3', name: 'Forsvar', description: 'De tre forsvarerne orienterer seg i feltet, stenger rommet foran mål og klarerer innleggene.' },
      { id: 'forsvar-a-04-s4', name: 'Klarering', description: 'Klareringer rettes ut mot sidene eller over midtstreken.' },
    ],
    coachingPoints: [
      'Angrip ballen på det høyeste punktet',
      'Ha kontakt med angriperen, vit hvor du har spissen',
      'Klarer høyt og langt ut av boksen, aldri inn i midten (kilde: NFF-moment, se background)',
      'Sidestilt kroppsstilling så du ser ball og motspiller (kilde: NFF F3)',
    ],
    commonMistakes: [
      'Ser bare på ballen og mister markeringen bak seg',
      'Svake klareringer som lander på 16-meteren',
    ],
    variations: [
      'Lettere: 3 mot 3 i feltet',
      'Vanskeligere: Ekstra angriper på andreballen',
    ],
    equipment: ['1 stort mål', 'Mange baller', 'Vester'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F3: «Innlegg, pasningsinnlegg og 45-situasjoner», «Blokkere eller hindre innlegg», «Ta kontroll foran eget mål», «Klarering høyt og lang ut av egen sone»)',
    unverifiedSource:
      'Gemini oppga «Allment kjent taktisk øvelse for seniorfotball»; ingen lenke. Opprinnelig tittel: «Lav Blokk og Boks-Forsvar (3v4 I undertall)».',
    sketch:
      'Stort mål med keeper. Tre forsvarere i og rundt 5-meteren. To kantspillere på hver side av 16-meteren, to angripere i feltet.',
  },
  {
    id: 'forsvar-a-05',
    name: 'Høyt press og gjenvinning (4 mot 4 + 2 jokere)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '10',
    description:
      'Intensivt pressespill på et begrenset område der det defensive laget skal tvinge frem balltap ved samlet press.',
    why: 'Bygger organisering og mentalitet for lag som vil presse høyt og gjenvinne raskt. NFF beskriver at laget skal «reagere hurtig og samlet på presssignaler». (kilde: Landslagsskolens spillmodell)',
    steps: [
      { id: 'forsvar-a-05-s1', name: 'Oppsett', description: 'Bane 25×25 m. Lag A holder ballen sammen med 2 jokere (6 mot 4).' },
      { id: 'forsvar-a-05-s2', name: 'Press', description: 'Lag B (4 spillere) stenger pasningsveier og støter samlet på signaler: dårlig touch, støttepasning, ball til back.' },
      { id: 'forsvar-a-05-s3', name: 'Gjenvinning', description: 'Vinner Lag B ballen, slår de ut til trener eller scorer på et lite mål innen tre touch. (vurdering: Gemini, tallene er ikke NFFs)' },
    ],
    coachingPoints: [
      'Press samlet på signal',
      'Nærmeste støter, de tre andre låser pasningsalternativene',
      'Kommuniser høyt når dere støter',
      'Presssignaler: støttepasning, dårlig touch, feilvendt, ball til back (kilde: NFF F1)',
    ],
    commonMistakes: ['Enkeltspillere støter uten støtte fra resten av laget'],
    variations: [
      'Lettere: Større bane, eller 5 mot 5 + 2',
      'Vanskeligere: Maks 2 touch for laget med ballen',
    ],
    equipment: ['Kjegler', 'Vester', 'Mange baller', '1 lite mål'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F1: «Reagere hurtig og samlet på definerte presssignaler som støttepasning, dårlig touch, feilvendte spillere, ball til back»); https://tiim.no/ovelse/f1-f2-spillovelse-68',
    unverifiedSource:
      'Gemini oppga «YouTube-kanal: @BecomeElite», uten videolenke. Opprinnelig tittel: «Høyt Press og Gjenvinning (4v4 + 2 Jokere)». Geminis «innen 6 sekunder» er ikke NFFs tall.',
    sketch:
      'Bane 25×25 m. Lag A (4 spillere + 2 jokere) fordelt rundt kantene. Lag B (4 spillere) i midten. Lite mål på sidelinjen for Lag B.',
  },
  {
    id: 'forsvar-a-06',
    name: 'Restforsvar under kontring (2 mot 3)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '6',
    description:
      'To forsvarere må rygge og forsinke tre angripere for å gi laget tid til å komme hjem.',
    why: 'Utvikler evnen til å håndtere undertall: lede angriperne, nekte raske gjennombrudd og ta rolige valg. NFF beskriver i F2 at «nekte kontrollerte fremoverpasninger er prioritert» og at man skal «oppholde». (kilde: Landslagsskolens spillmodell, F2)',
    steps: [
      { id: 'forsvar-a-06-s1', name: 'Start', description: 'Tre angripere starter fra midtstreken mot to forsvarere ved 16-meteren.' },
      { id: 'forsvar-a-06-s2', name: 'Forsinkelse', description: 'Forsvarerne holder avstand, rygger samlet og forsinker angrepet.' },
      { id: 'forsvar-a-06-s3', name: 'Nekting', description: 'De nekter pasninger tvers gjennom midten og tvinger angriperne til avslutning fra vanskelig vinkel eller til å spille sakte til siden.' },
    ],
    coachingPoints: [
      'Forsink, ikke selg deg tidlig',
      'Nekt angriperne å spille seg rett gjennom midten',
      'Tving ballføreren ut mot kanten',
      'Oppholde og lede vekk fra mål (kilde: NFF F2)',
    ],
    commonMistakes: ['En forsvarer støter desperat og blir utspilt, og det blir 2 mot 1'],
    variations: [
      'Lettere: Tidsfrist på 8 sekunder for angriperne',
      'Vanskeligere: 2 mot 4',
    ],
    equipment: ['1 stort mål med keeper', 'Kjegler', 'Vester', 'Baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F2: «Senke oss samlet og hindre tilgang på prioriterte rom», «Vinne ball når mulig, men nekte kontrollerte fremoverpasninger er prioritert», «Oppholde»)',
    unverifiedSource:
      'Gemini oppga «The FA Bootroom – Managing counter-attacks: defending numerical inferiority» med URL https://www.thefa.com/bootroom/resources/coaching/managing-counter-attacks-defending-numerical-inferiority (utgiver: The Football Association). Opprinnelig tittel: «Krise-Forsvar: Restforsvar under Kontring (2v3)».',
    sketch:
      'Mål med keeper. To forsvarere ved 16-meteren. Tre angripere starter fra midtstreken med ball.',
  },
  {
    id: 'forsvar-a-07',
    name: 'Stopperduell og støttepasning (håndtere feilvendt spiss)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['13-16'],
    difficulty: 'middels' as const,
    duration: 12,
    players: '4',
    description:
      'En midtstopper håndterer en fysisk sterk spiss som feilvendt mottar oppspill, og hindrer at spissen får snu seg og vende opp.',
    why: 'Lærer stoppere å bruke kroppen lovlig i ryggen på spissen, holde armlengdes avstand og time støtet når ballen spilles. NFF beskriver å «holde feilvendte spillere feilvendt – armlengdes avstand». (kilde: Landslagsskolens spillmodell)',
    steps: [
      { id: 'forsvar-a-07-s1', name: 'Oppspill', description: 'En midtbanespiller slår en hard oppspillspasning mot en feilvendt spiss ca. 20 m unna.' },
      { id: 'forsvar-a-07-s2', name: 'Posisjon', description: 'Midtstopperen ligger tett i ryggen på spissen med lavt tyngdepunkt og én arm ut for å kjenne posisjonen.' },
      { id: 'forsvar-a-07-s3', name: 'Løsning', description: 'Stopperen støter foran og bryter pasningen, eller holder spissen feilvendt slik at spissen må spille støttepasning bakover (uten å holde eller dytte).' },
    ],
    coachingPoints: [
      'Ikke lag frispark ved å dytte med to hender',
      'Kjenn hvor spissen har tyngdepunktet',
      'Nekt spissen å snu seg, press hardt på touchet',
      'Hold feilvendte spillere feilvendt (kilde: NFF-moment)',
    ],
    commonMistakes: [
      'Står for langt unna, slik at spissen kan dempe, vende og skyte',
      'Lager unødvendige frispark i farlig posisjon',
    ],
    variations: [
      'Lettere: Pasningen slås rullende langs bakken',
      'Vanskeligere: Halvhøy eller høy pasning i lufta',
    ],
    equipment: ['Baller', 'Kjegler'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F1, Midtstopper: «På jakt etter presseøyeblikk», NFF 1v1: «Hold feilvendte spillere feilvendt – armlengdes avstand» i «Hindre avslutning»)',
    unverifiedSource:
      'Gemini oppga «Allment kjent øvelse for stopperpar / spissdueller»; ingen lenke. Opprinnelig tittel: «Stopper-Duell og Støttepasning (Aktiv spiss-håndtering)».',
    sketch:
      'Midtbanespiller 20 m fra spissen. Spiss vendt mot midtbanespilleren (feilvendt mot mål). Stopper rett bak spissen mellom spiss og mål.',
  },
  {
    id: 'forsvar-a-08',
    name: 'Backspill: stenge innlegg',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['13-16'],
    difficulty: 'middels' as const,
    duration: 15,
    players: '4-6',
    description:
      'Målrettet øvelse for sidebacker som må rykke ut mot en kantspiller for å stenge og blokkere innlegg.',
    why: 'Mange sjanser skapes fra innlegg fra sidekorridorene. NFF beskriver at sidebacken skal «hindre innlegg» og «tvinge eventuelle innlegg foran seg». (kilde: Landslagsskolens spillmodell, F3)',
    steps: [
      { id: 'forsvar-a-08-s1', name: 'Start', description: 'Kantspilleren får ballen ute på 25 m og starter en dribling mot dødlinjen.' },
      { id: 'forsvar-a-08-s2', name: 'Jakt', description: 'Backen tar opp jakten i vinkel, kommer på yttersiden og blokkerer innlegget med foten eller tvinger kantspilleren over dødlinjen.' },
      { id: 'forsvar-a-08-s3', name: 'Innlegg', description: 'Slås innlegget likevel, prøver backen å berøre eller forstyrre ballbanen.' },
    ],
    coachingPoints: [
      'Kom deg tidlig ut, ikke gi kantspilleren ro til å slå inn',
      'Gjør deg bred og blokker med det ytre beinet',
      'Hold armene inntil kroppen så du unngår hands i feltet',
      'Tvinge innlegget foran seg (kilde: NFF-moment)',
    ],
    commonMistakes: [
      'Kaster seg glidende for tidlig og blir fintet vekk',
      'Snur ryggen til innlegget når det slås',
    ],
    variations: [
      'Lettere: Kantspilleren har maks 3 touch før innlegg',
      'Vanskeligere: Kantspilleren kan enten slå inn eller skjære inn i banen for skudd',
    ],
    equipment: ['1 stort mål', 'Kjegler', 'Vester', 'Mange baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F3, Sideback: «Ikke bli passert. Hindre innlegg. Tvinge eventuelle innlegg foran seg. Verne om rom innvendig framfor rom utvendig.»)',
    unverifiedSource:
      'Gemini oppga «Soccer Coach Weekly – Stop the cross» med URL https://www.soccercoachweekly.net/practice-plans/smart-sessions-core-skills/stop-the-cross (utgiver: Soccer Coach Weekly)',
    sketch:
      'Sidekorridor med kantspiller 25 m fra mål. Back 5-8 m foran kantspilleren, mellom kantspiller og mål. Stort mål med keeper.',
  },
  {
    id: 'forsvar-a-09',
    name: 'Defensiv omstilling (gjenvinning ved balltap)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '10-12',
    description:
      'Spilløvelse på halv bane der laget som mister ballen umiddelbart skifter fra angrepsstruktur til aggressivt gjenvinningspress i de første sekundene.',
    why: 'Lærer spillere å utføre umiddelbar omstilling før motstanderen rekker å etablere en kontring. NFF beskriver «umiddelbar reaksjon for gjenvinning» ved balltap. (kilde: Landslagsskolens spillmodell)',
    steps: [
      { id: 'forsvar-a-09-s1', name: 'Angrep', description: 'Lag A angriper mot stort mål.' },
      { id: 'forsvar-a-09-s2', name: 'Signal', description: 'Ved mistet ball roper treneren «OMSTILLING!».' },
      { id: 'forsvar-a-09-s3', name: 'Press', description: 'De tre nærmeste Lag A-spillerne sprintstøter umiddelbart på ballfører og pasningsalternativer.' },
      { id: 'forsvar-a-09-s4', name: 'Sikring', description: 'Resten av laget faller raskt av for å sikre bakrommet.' },
    ],
    coachingPoints: [
      'De første sekundene avgjør, løp umiddelbart på ballfører',
      'Nærmeste spiller «stempler» ballfører uten å lage frispark',
      'Resten av laget rygger og tetter midten',
      'Søke overtall rundt ball (kilde: NFF-moment)',
    ],
    commonMistakes: [
      'Spillere blir stående og reagerer på balltapet',
      'Laget blir strukket ut og gir rom i midtbanesonen',
    ],
    variations: [
      'Lettere: Angriperne må ta 2 touch i oppbyggingen',
      'Vanskeligere: Lag A får bonuspoeng hvis de vinner ballen tilbake innen 5 sekunder og scorer (vurdering: Gemini, tallet er ikke NFFs)',
    ],
    equipment: ['2 store mål med keepere', 'Vester', 'Kjegler'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF: «Umiddelbar reaksjon for gjenvinning og følgelig posisjonsjustering fra alle når vi mister ball. Søke overtall rundt ball.») og https://tiim.no/ovelse/a2-a3-situasjonsovelse-33 (overgangsforsvar)',
    unverifiedSource: 'Gemini oppga «YouTube-kanal: @SoccerCoachWeekly», uten videolenke',
    sketch:
      'Halv bane med stort mål i hver ende. Lag A i angrepsoppstilling. Ved balltap starter gjenvinning fra nærmeste spillere.',
  },
  {
    id: 'forsvar-a-10',
    name: 'Dødballforsvar (sone og mannsmarkering, hjørnespark)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '12-16',
    description:
      'Organisering og gjennomføring av forsvar på motstanderens hjørnespark, med en blanding av sonemarkering i og rundt femmeteren og mannsmarkering i boksen.',
    why: 'Mange mål slippes inn på dødball, så riktig rollefordeling og hurtighet i duellene er viktig. NFF beskriver at «det må markeres og kontroll på farlige rom helt til situasjonen er avklart». (kilde: Landslagsskolens spillmodell)',
    steps: [
      { id: 'forsvar-a-10-s1', name: 'Oppstilling', description: 'Still opp fullt lag i defensiv dødballposisjon under hjørnespark.' },
      { id: 'forsvar-a-10-s2', name: 'Sone', description: 'Tre spillere dekker første stolpe, femmeteren og bakre stolpe i sone.' },
      { id: 'forsvar-a-10-s3', name: 'Mann', description: 'De resterende 4-5 duellsterke spillerne tar tett mannsmarkering.' },
      { id: 'forsvar-a-10-s4', name: 'Hjørnespark', description: 'Ved slått hjørnespark angriper sonespillerne ballen bestemt, mens mannsmarkererne blokkerer og følger sin mann.' },
    ],
    coachingPoints: [
      'Øyekontakt med både mann og ball',
      'Ta plassen din i feltet',
      'Rop tydelig hvem som tar ballen (keeper eller utespiller); «UT!» etter klarering',
      'Oversikt over trusler mot 1. stolpe, bakre stolpe og 45 (kilde: NFF F3)',
    ],
    commonMistakes: [
      'Spillere blir stående passive og venter på ballen',
      'Glemmer å støte ut på andrebølgen etter en halv klarering',
    ],
    variations: [
      'Lettere: Angripende lag slår kun faste innlegg mot første stolpe',
      'Vanskeligere: Angripende lag varierer med korte hjørnespark og harde innlegg',
    ],
    equipment: ['1 stort mål', 'Vester', 'Mange baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF nevner dødballer som del av «kampen om ballen», og F3-momenter som «Oversikt over trusler mot 1. stolpe, bakre stolpe og 45» og «Det må markeres og kontroll på farlige rom helt til situasjonen er avklart»)',
    unverifiedSource:
      'Gemini oppga «The FA Bootroom – Set-piece organisation: defending corners» med URL https://www.thefa.com/bootroom/resources/coaching/set-piece-organisation-defending-corners (utgiver: The Football Association). Opprinnelig tittel: «Dødball-Forsvar (Sone- og mannsmarkering)».',
    sketch:
      'Stort mål med keeper. Tre soneforsvarere ved 1. stolpe, femmeter og bakre stolpe. Fire-fem mannsmarkører rett foran mål, hver med sin angriper.',
  },
  {
    id: 'forsvar-a-11',
    name: 'Midtbaneankeret (skjerme forsvarsfireren)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 15,
    players: '6-8',
    description:
      'En dyp defensiv midtbanespiller (sentral midtbane) skal beskytte rommet foran stopperne (mellomrommet) ved å stenge pasningsveier og rydde opp andreballer.',
    why: 'Lærer den defensive midtbanespilleren å lese spillet, ligge disiplinert foran midtstopperne og hindre motstanderens offensive midtbane i å snu seg. NFF beskriver at sentral midtbane skal «stenge mellomrom sentralt» og «nekte 1A å vende opp». (kilde: Landslagsskolens spillmodell, F1/F2 sentral midtbane)',
    steps: [
      { id: 'forsvar-a-11-s1', name: 'Oppsett', description: 'Lag en sone på 20×15 m foran 16-meteren.' },
      { id: 'forsvar-a-11-s2', name: 'Angrep', description: 'Motstanderen har to offensive midtbanespillere som prøver å treffe en spiss i mellomrommet.' },
      { id: 'forsvar-a-11-s3', name: 'Forflytning', description: 'Den defensive midtbanespilleren forflytter seg kontinuerlig sidelengs og bruker pasningsskyggen til å nekte gjennombrudd.' },
      { id: 'forsvar-a-11-s4', name: 'Inngripen', description: 'Ved pasningsforsøk bryter midtbanespilleren ballen eller går inn i duellen i det spissen mottar.' },
    ],
    coachingPoints: [
      'Ikke bli lokket ut i brede posisjoner, ta vare på midten',
      'Orienter deg hele tiden bak deg for å sjekke hvor spissen står',
      'Gå raskt opp i ryggen på spissen hvis pasningen slås',
      'Nekt 1A å vende opp (kilde: NFF-moment)',
    ],
    commonMistakes: ['Støter for langt opp og etterlater et stort rom bak seg'],
    variations: [
      'Lettere: Angriperne kan bare slå langs bakken',
      'Vanskeligere: To defensive midtbanespillere samarbeider (dobbel anker)',
    ],
    equipment: ['Kjegler', 'Vester', 'Baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F2, Sentral midtbane: «Stenge mellomrom sentralt», «Kontinuerlig justering av posisjon for å stenge mellomrom», «Kort avstand og tett kontakt med midtbaneledd – nekte mellomrom»)',
    unverifiedSource:
      'Gemini oppga «YouTube-kanal: @BecomeElite», uten videolenke. Opprinnelig tittel: «Midtbane-Ankeret (Skjerme forsvarsfirer)».',
    sketch:
      'Sone 20×15 m foran 16-meteren. Ankeret i midten foran to stoppere. To offensive midtbanespillere og en spiss (i mellomrommet) som angripere.',
  },
  {
    id: 'forsvar-a-12',
    name: 'Dobbelt press på kanten (back og kant samarbeider)',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'middels' as const,
    duration: 15,
    players: '6',
    description:
      'Back og egen kantspiller samarbeider om å «doble» på motstanderens kantspiller ute ved sidelinjen for å vinne ballen.',
    why: 'Effektiv måte å nøytralisere en motstander med kantspiller i god form. NFF beskriver at kantspilleren skal ha «pressansvar foran deg» og «umiddelbar omstilling for gjenvinning etter balltap». (kilde: Landslagsskolens spillmodell)',
    steps: [
      { id: 'forsvar-a-12-s1', name: 'Mottak', description: 'Motstanderens kantspiller mottar ballen ute på sidelinjen.' },
      { id: 'forsvar-a-12-s2', name: 'Back', description: 'Backen støter forfra for å bremse fremdriften.' },
      { id: 'forsvar-a-12-s3', name: 'Kant', description: 'Egen kantspiller rykker inn bakfra eller fra siden og fanger angriperen i en «felle» mellom de to forsvarerne.' },
      { id: 'forsvar-a-12-s4', name: 'Ballvinning', description: 'Stopper eller nøler angriperen, vinnes ballen.' },
    ],
    coachingPoints: [
      'Backen bremser og styrer farten, kanten kommer med fart bakfra',
      'Steng begge utveier, klem angriperen mot sidelinjen',
      'Ren takling, så dere ikke lager frispark',
      'Kommuniser hvem som presser og hvem som sikrer',
    ],
    commonMistakes: ['Kommunikasjonssvikt: begge støter fra samme side og åpner motsatt vei'],
    variations: [
      'Lettere: Angriperen får begrenset banebredde',
      'Vanskeligere: Motstanderens back blir med i overtallet (2 mot 2)',
    ],
    equipment: ['Kjegler', 'Vester', '6-8 baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F1, Kant: «Pressansvar foran deg», «Kontroll på rom innvendig før utvendig»; Sideback: «Stå opp på ballsiden»)',
    unverifiedSource:
      'Gemini oppga «Soccer Coach Weekly – Double up on the winger» med URL https://www.soccercoachweekly.net/practice-plans/smart-sessions-core-skills/double-up-on-the-winger (utgiver: Soccer Coach Weekly). Opprinnelig tittel: «Dobbelt-Press på Kanten (Back + KantSamarbeid)».',
    sketch:
      'Sidekorridor. Angriper (kantspiller) med ball ved sidelinjen. Back foran angriperen, egen kant 5-8 m bak og innenfor.',
  },
  {
    id: 'forsvar-a-13',
    name: 'Takling og blokkering under høy belastning',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 12,
    players: '4-8',
    description:
      'Forsvareren gjør en intens sprint med retningsendringer, kaster seg umiddelbart ut i en skuddblokk og går så inn i en 1 mot 1-duell.',
    why: 'Lærer spillere å holde defensiv konsentrasjon og teknikk selv når pulsen er høy. NFF beskriver at man skal «opp i blokk» og «blokke med fremsiden av kroppen». (kilde: Landslagsskolens spillmodell)',
    steps: [
      { id: 'forsvar-a-13-s1', name: 'Sprint', description: 'Forsvareren løper gjennom en rekke på 3-4 kjegler med raske retningsendringer (Gemini brukte hekker/stiger, byttet her til kjegler).' },
      { id: 'forsvar-a-13-s2', name: 'Blokk', description: 'Sprinter ca. 5 m ut og går i blokk mot et løst skudd.' },
      { id: 'forsvar-a-13-s3', name: 'Opp', description: 'Reiser seg raskt opp igjen.' },
      { id: 'forsvar-a-13-s4', name: 'Duell', description: 'Treneren slår umiddelbart en ny ball til en angriper som utfordrer 1 mot 1 mot mål.' },
      { id: 'forsvar-a-13-s5', name: 'Stopp', description: 'Forsvareren må stoppe angriperen.' },
    ],
    coachingPoints: [
      'Rask opp fra bakken etter blokkeringen',
      'Finn balansen umiddelbart før 1 mot 1',
      'Ikke la tretthet ødelegge den lave kroppsstillingen',
      'Blokke med fremsiden av kroppen (kilde: NFF F3)',
    ],
    commonMistakes: [
      'Blir liggende for lenge etter skuddblokken',
      'Går ubalansert inn i 1 mot 1 fordi man er sliten',
    ],
    variations: [
      'Lettere: 5 sekunders pause mellom blokkeringen og 1 mot 1',
      'Vanskeligere: Stasjonsarbeid med faste intervaller (Geminis forslag: 45 sek arbeid / 45 sek pause; vurdering: Gemini, ikke NFFs tall)',
    ],
    equipment: ['1 stort mål med keeper', 'Kjegler', 'Baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F3: «Håndtere avslutning: Opp i BLOKK, blokke med fremsiden av kroppen»); https://tiim.no/artikkel/rask-ra-og-robust-rrr (NFF: kvalitet i kroppskontroll før fart, ingen sårhet eller smerte)',
    unverifiedSource:
      'Gemini oppga «Allment kjent øvelse for A-lag/Senior»; ingen lenke. Opprinnelig tittel: «Takling og Blokkering under Maks Puls (Fysisk/Taktisk)». Originalen hadde hekker/stiger.',
    warning:
      'Dette er en av de mest belastende øvelsene i biblioteket: sprint, fall i skuddblokk og 1 mot 1 rett etterpå, alt under tretthet. Kjør bare etter god oppvarming og med god kontroll på landing. Stopp ved sårhet eller smerte. Er du usikker, hopp over.',
    sketch:
      'Kjeglerekke (3-4) ved 16-meteren. Skytter (trener) 12 m foran mål. Angriper klar for 1 mot 1 ved siden av.',
  },
  {
    id: 'forsvar-a-14',
    name: 'Offsidefelle og linjekontroll',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['17+'],
    difficulty: 'avansert' as const,
    duration: 20,
    players: '10-12',
    description:
      'Avansert taktisk øvelse der forsvarsfireren styres av signaler for enten å heve linjen (offsidefelle) eller falle av.',
    why: 'Trener linjehøyde og samhandling i backlinjen for å hindre at laget presses for lavt. NFF beskriver at stopperen aktivt skal vurdere å «sette offsidelinje eller støte i mellomrom». (kilde: Landslagsskolens spillmodell)',
    steps: [
      { id: 'forsvar-a-14-s1', name: 'Oppsett', description: 'Spill 4 mot 4 + keepere på stor banehalvdel.' },
      { id: 'forsvar-a-14-s2', name: 'Signal', description: 'Når motstanderens spiss spilles feilvendt og legger av bakover (støttepasning), roper forsvarssjefen «PUMP!» eller «UT!».' },
      { id: 'forsvar-a-14-s3', name: 'Heving', description: 'Hele firerlinjen går samlet opp mot kanten av 16-meteren eller midtsirkelen for å sette spissene i offside.' },
      { id: 'forsvar-a-14-s4', name: 'Fall av', description: 'Får motstanderens midtbanespiller rettet seg opp med ballen under full kontroll, faller linjen umiddelbart av.' },
    ],
    coachingPoints: [
      'Se på ballførerens kroppsspråk. Gemini: «Nesa ned = løft linja, nesa opp = fall av» (vurdering: Gemini, ikke NFF-terminologi)',
      'NFFs presssignaler: støttepasning, dårlig touch, feilvendt spiller, ball til back (kilde: NFF F1)',
      'En tydelig forsvarssjef eier ropene',
      'Ekstremt raske steg opp når støttepasningen går',
    ],
    commonMistakes: ['En spiller blir stående igjen, og hele fellen sprekker'],
    variations: [
      'Lettere: Treneren roper signalene i starten',
      'Vanskeligere: Angriperne prøver aktivt å lure linjen med «falske» støttepasninger',
    ],
    equipment: ['Markeringskjegler', 'Vester', 'Baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F1, Midtstopper: «Stopper ballside – aktiv vurdering sette offsidelinje eller støte i mellomrom»; presssignaler: «støttepasning, dårlig touch, feilvendte spillere, ball til back»)',
    unverifiedSource:
      'Gemini oppga «The FA Bootroom – Managing space and pushing the defensive line» med URL https://www.thefa.com/bootroom/resources/coaching/managing-space-and-pushing-the-defensive-line (utgiver: The Football Association). Opprinnelig tittel: «Offside-Felle og Linjekontroll (Masterclass)».',
    sketch:
      'Stor banehalvdel med mål og keeper. Firerlinje ved 16-meteren. Fire angripere foran. Kjegler markerer offsidelinjen (16-meteren) og midtsirkelen.',
  },
  {
    id: 'forsvar-a-15',
    name: 'Forsvar mot lange innkast',
    category: 'forsvar' as const,
    ageGroup: 'adult',
    ageBand: ['13-16', '17+'],
    difficulty: 'middels' as const,
    duration: 15,
    players: '8-10',
    description:
      'Organisering av forsvar mot lange innkast kastet direkte inn i 16-meteren.',
    why: 'Lange innkast er et effektivt angrepsvåpen. Laget må vite hvem som angriper første ball og hvem som tar andreballen. NFF beskriver at «alle er i beredskap frem til situasjonen er avklart» og at man skal «jakte returer». (kilde: Landslagsskolens spillmodell, F3)',
    steps: [
      { id: 'forsvar-a-15-s1', name: 'Innkast', description: 'Motstanderen tar lange innkast høyt oppe på banen inn i boks.' },
      { id: 'forsvar-a-15-s2', name: 'Førsteball', description: 'Forsvarslaget setter sin sterkeste hodespiller til å angripe innkastet foran motstanderens avleder.' },
      { id: 'forsvar-a-15-s3', name: 'Andreball', description: 'To medspillere øremerkes til å sikre og rydde opp andreballen ved 16-meterslinjen.' },
      { id: 'forsvar-a-15-s4', name: 'Klarering', description: 'Ballen klareres ut til innkast eller over midtlinjen.' },
    ],
    coachingPoints: [
      'Stopp avlederen på første stolpe',
      'Vær aggressiv i andreballrommet, ikke la ballen sprette i boks',
      'Skyv laget ut med en gang ballen er klarert',
      'Alle i beredskap til situasjonen er avklart (kilde: NFF F3)',
    ],
    commonMistakes: ['Ballen får sprette i 16-meteren, noe som skaper kaos og sjanser'],
    variations: [
      'Lettere: Innkastene tas med moderat kraft i starten',
      'Vanskeligere: Angripende lag har med to spillere som stormer inn mot keeper fra blindsonen',
    ],
    equipment: ['1 stort mål', 'Vester', 'Baller'],
    source: 'Allment kjent øvelse',
    background:
      'https://tiim.no/artikkel/landslagsskolens-spillmodell (NFF F3: «Innlegg, pasningsinnlegg og 45-situasjoner», «Alle i beredskap frem til situasjonen er avklart», «Jakte returer»)',
    unverifiedSource:
      'Gemini oppga «Allment kjent taktisk drill for seniorlag»; ingen lenke. Opprinnelig tittel: «Forsvar av Felt ved Innkast og Dødballer i Boks». «Stuss-spiller» omskrevet til «avleder».',
    sketch:
      'Stort mål med keeper. Innkaster ved sidelinjen 25-30 m fra mål. Sterkeste hodespiller i feltet foran avlederen. To spillere ved 16-meterslinjen for andreballen.',
  },
];