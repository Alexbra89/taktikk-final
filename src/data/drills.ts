// ═══════════════════════════════════════════════════════════════
//  ØVELSESBIBLIOTEK — 200+ fotballøvelser + 100 håndballøvelser
// ═══════════════════════════════════════════════════════════════

export type DrillSport = 'football' | 'handball' | 'all';
export type DrillCategory = 'offensivt' | 'defensivt' | 'hele_laget' | 'keeper' | 'fysisk';
export type DrillDifficulty = 'enkel' | 'middels' | 'avansert';

export interface DrillStep {
  id: string;
  name: string;
  description: string;
}

export interface DrillExercise {
  id: string;
  sport: DrillSport;
  category: DrillCategory;
  name: string;
  duration: number;
  players: string;
  difficulty: DrillDifficulty;
  description: string;
  steps: DrillStep[];
  tips: string[];
  equipment: string[];
  tags?: string[];
  ageGroup: 'youth' | 'adult';
  weekNumber?: number;
}

export type Drill = DrillExercise;

export const toDrillSport = (s: string): DrillSport =>
  s === 'football7' ? 'football' : (s as DrillSport);

// ============================================================
//  FOTBALL - OFFENSIVT (60 øvelser)
// ============================================================

export const FOOTBALL_DRILLS: DrillExercise[] = [

  // ─── OFFENSIVT (25 øvelser) ──────────────────────────────────

  { id:'hb-o01', sport:'handball', category:'offensivt', name:'Grunnpasning i par', duration:10, players:'2–20', difficulty:'enkel',
    description:'Grunnleggende kastøvelse: rett arm, snap i håndleddet, riktig fotarbeid.',
    steps:[{ id:'s1', name:'Steg 1', description:'Par stiller seg 5m fra hverandre' }, { id:'s2', name:'Steg 2', description:'Kast med dominant arm: skulder-albue-håndledd-snap' }, { id:'s3', name:'Steg 3', description:'Motta med to hender' }, { id:'s4', name:'Steg 4', description:'Øk avstand til 8m etter 3 min' }, { id:'s5', name:'Steg 5', description:'Øv begge hender' }],
    tips:['Steg inn i kastet: venstre fot frem ved høyrehåndskast','Snap i håndleddet = kraft og presisjon','Motta med hele hendene','Hold blikket på mottakeren'],
    equipment:['Handball'], ageGroup: 'adult' },

  { id:'hb-o02', sport:'handball', category:'offensivt', name:'Tre-stegsskudd', duration:15, players:'2–10', difficulty:'enkel',
    description:'Grunnleggende tre-stegs-teknikk. Basisøvelse for alle nivåer.',
    steps:[{ id:'s1', name:'Steg 1', description:'Pasning til løpende spiller' }, { id:'s2', name:'Steg 2', description:'Tre steg (1–2–3) etter mottak' }, { id:'s3', name:'Steg 3', description:'Tredje steg = avhoppet fot' }, { id:'s4', name:'Steg 4', description:'Skudd over skulder mot mål' }],
    tips:['Tre steg fra ETTER mottak','Hopp: push-off med bakre fot','Skudd i hopp: kast FØR landing','Høy albue, kast fremover'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o03', sport:'handball', category:'offensivt', name:'Kantkast og pivot-kombinasjon', duration:20, players:'4–8', difficulty:'middels',
    description:'Kant passer inn til pivot som snur og skyter eller legger av til kanten.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kant har ball i kantposisjon' }, { id:'s2', name:'Steg 2', description:'Pasning inn til pivot' }, { id:'s3', name:'Steg 3', description:'Pivot snur og avgjør: skyte eller legge av' }, { id:'s4', name:'Steg 4', description:'Kant løper inn for retur-pasning' }],
    tips:['Pivot: vend deg BORT fra forsvareren','Kant: løp inn idet pivoten tar imot','Pivot-skudd: lavt over keeper','Kommuniser hva som er bedre'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o04', sport:'handball', category:'offensivt', name:'Gjennombrudd 1v1 mot keeper', duration:20, players:'2–10', difficulty:'middels',
    description:'Angriper gjennombryter og avslutter 1v1 mot keeper.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angriper starter 12m fra mål' }, { id:'s2', name:'Steg 2', description:'Dribbler/løper mot 6m' }, { id:'s3', name:'Steg 3', description:'Passiv forsvarsspiller forsøker å blokke' }, { id:'s4', name:'Steg 4', description:'Se keeper og skyt' }, { id:'s5', name:'Steg 5', description:'Fokus: høy, lav, spretten' }],
    tips:['Se på keeper FØR du skyter','Spretten: skyt i underlaget','Lav skudd = 70% av mål i håndball','Varier avstand og vinkel'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o05', sport:'handball', category:'offensivt', name:'Rask kontring 3v2', duration:20, players:'5+', difficulty:'middels',
    description:'Tre angripere i kontring mot to forsvarere. Raske avgjørelser.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper distribuerer' }, { id:'s2', name:'Steg 2', description:'3 angripere mot 2 forsvarere' }, { id:'s3', name:'Steg 3', description:'Bred angrepslinje' }, { id:'s4', name:'Steg 4', description:'Midtangriper: trekk forsvarerne, pass til fri kant' }],
    tips:['Tre er sterkere enn to — bruk bredden','Midt: trekk begge, then pass','Kant: hold deg med midtspilleren','Avslutt innen 5 sekunder'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o06', sport:'handball', category:'offensivt', name:'Skuddtrening fra bakbane', duration:20, players:'2–8', difficulty:'middels',
    description:'Bakbane-spillere øver hoppskudd, powerskudd og plassert skudd fra 9m.',
    steps:[{ id:'s1', name:'Steg 1', description:'Bakbanespiller ved 9m' }, { id:'s2', name:'Steg 2', description:'Hoppskudd: løp inn, hopp og skyt' }, { id:'s3', name:'Steg 3', description:'Powerskudd: stående, fullt kraft' }, { id:'s4', name:'Steg 4', description:'Plassert: rolig til hjørnet' }, { id:'s5', name:'Steg 5', description:'Øv alle tre typer fra begge sider' }],
    tips:['Hoppskudd: hopp FREMOVER ikke OPP','Skyt mot hjørnene','Ikke telegrafér retningen','Shoot low to the far post'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o07', sport:'handball', category:'offensivt', name:'7-meter straffekast', duration:15, players:'1–8', difficulty:'enkel',
    description:'Teknikk og mental trening på 7-meter straffekast.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kø ved 7m-strek' }, { id:'s2', name:'Steg 2', description:'Bestem hjørne FØR du kaster' }, { id:'s3', name:'Steg 3', description:'Øv alle 4 hjørner' }, { id:'s4', name:'Steg 4', description:'Avansert: keeper beveger seg' }, { id:'s5', name:'Steg 5', description:'Hele laget ser på — press-situasjon' }],
    tips:['Bestem hjørne FØR du løfter ballen','Øy-kontakt gjør keeper usikker','Håndleddet snapper ned for lavt skudd','Presisjon over kraft fra 7m'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o08', sport:'handball', category:'offensivt', name:'Pivot-arbeid og vendinger', duration:20, players:'2–6', difficulty:'middels',
    description:'Pivot øver mottak, vendinger og avslutning i 6m-sonen.',
    steps:[{ id:'s1', name:'Steg 1', description:'Pivot ved 6m-sonen' }, { id:'s2', name:'Steg 2', description:'Bakbanespiller sender pasning' }, { id:'s3', name:'Steg 3', description:'Pivot mottar og vender raskt' }, { id:'s4', name:'Steg 4', description:'Avslutning umiddelbart etter vending' }, { id:'s5', name:'Steg 5', description:'Begge retninger' }],
    tips:['Vend ALLTID bort fra forsvareren','Spin-turn: pivotpunkt venstre fot','Motta med hånden UNNA forsvareren','Lav og spretten er best fra 6m'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o09', sport:'handball', category:'offensivt', name:'Løpsmønster — kryss og overlap', duration:20, players:'4–8', difficulty:'middels',
    description:'Kryssløp og overlappende bevegelser for å skape forvirring i forsvaret.',
    steps:[{ id:'s1', name:'Steg 1', description:'3 angripere: venstre-midt-høyre' }, { id:'s2', name:'Steg 2', description:'Venstre og midt bytter plass (kryss)' }, { id:'s3', name:'Steg 3', description:'Ballen følger en av dem' }, { id:'s4', name:'Steg 4', description:'Forsvar forvirret om hvem som har ballen' }],
    tips:['Kryss: full fart — ikke halvhjertet','Ballen følger alltid kroppens retning','Kombiner kryss og pivot-innspill'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-o10', sport:'handball', category:'offensivt', name:'Pasningskjede 5-mann', duration:15, players:'5–10', difficulty:'enkel',
    description:'Fem spillere passer raskt fremover og bakover. Koordinasjon og presisjon.',
    steps:[{ id:'s1', name:'Steg 1', description:'5 spillere i linje, 3m avstand' }, { id:'s2', name:'Steg 2', description:'Ball starter hos nr. 1: fremover til nr. 5' }, { id:'s3', name:'Steg 3', description:'Tilbake 5 til 1' }, { id:'s4', name:'Steg 4', description:'Linja beveger seg fremover' }, { id:'s5', name:'Steg 5', description:'Avansert: to baller simultant' }],
    tips:['Alle tar imot og passer straks','Hold linja strak','Kommuniser: "mine!"','Avansert: kast til annenhver'],
    equipment:['Handball (1–2 baller)'], ageGroup: 'adult' },

  { id:'hb-o11', sport:'handball', category:'offensivt', name:'Innspill til pivot fra høyre bakbane', duration:20, players:'3–6', difficulty:'middels',
    description:'Høyre bakbane øver innspill til pivot med timing og presisjon.',
    steps:[{ id:'s1', name:'Steg 1', description:'Høyre bakbane (HB) med ball ved 9m' }, { id:'s2', name:'Steg 2', description:'Pivot beveger seg langs 6m-linjen' }, { id:'s3', name:'Steg 3', description:'HB venter på riktig posisjon' }, { id:'s4', name:'Steg 4', description:'Innspill: flat rask pasning til pivot' }],
    tips:['Innspillet MÅ gå mellom forsvarernes armer','Pivot: signal med armen NÅR du er fri','Ikke kast om linjen er blokkert','Underarm-flat for mer kontroll'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o12', sport:'handball', category:'offensivt', name:'Gjennombrudd kant — vinkelskudd', duration:20, players:'3–8', difficulty:'middels',
    description:'Kantspiller gjennombryter og avslutter i smal vinkel.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kant får pasning' }, { id:'s2', name:'Steg 2', description:'Løper inn over 6m-linjen' }, { id:'s3', name:'Steg 3', description:'Avslutning i smal vinkel' }, { id:'s4', name:'Steg 4', description:'Finte: fake skudd tidlig' }, { id:'s5', name:'Steg 5', description:'Begge kanter' }],
    tips:['Sett ned foten FØR 6m-linjen','Sikt ute mot stolpen','Vent til siste øyeblikk','Fake skudd for å trekke keeper'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o13', sport:'handball', category:'offensivt', name:'Dribbling og gjennombrudd', duration:15, players:'2–12', difficulty:'enkel',
    description:'Dribbling i håndball: lav og kontrollert. Kun for gjennombrudd.',
    steps:[{ id:'s1', name:'Steg 1', description:'Dribler 10m i ett tempo' }, { id:'s2', name:'Steg 2', description:'Dribble lavt under hoften' }, { id:'s3', name:'Steg 3', description:'Stopp: tre steg og skyt' }, { id:'s4', name:'Steg 4', description:'Bytte hånd midt i sekvens' }, { id:'s5', name:'Steg 5', description:'Dribble forbi kjegle' }],
    tips:['Dribble kun for å komme forbi forsvarere','Hold under hoften — høyt er lettere å stjele','Aldri dribble uten plan','Tre steg gjelder etter dribleing'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-o14', sport:'handball', category:'offensivt', name:'Tidlig skudd — snapshot', duration:15, players:'2–8', difficulty:'middels',
    description:'Raskt skudd uten å hoppe. Overrumpler keeper.',
    steps:[{ id:'s1', name:'Steg 1', description:'Bakbanespiller mottar pasning' }, { id:'s2', name:'Steg 2', description:'Ingen tid til hopp — skyt fra stand' }, { id:'s3', name:'Steg 3', description:'Fokus: lav bred og overraskende' }, { id:'s4', name:'Steg 4', description:'Fra venstre, høyre og senter' }],
    tips:['Snapshot: 8–11m fra mål','Snappy håndledd: kraft fra håndledd ikke kropp','Sikt under keepers arm (hip-level)','Se KEEPER ikke mål — skyt dit han er IKKE'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o15', sport:'handball', category:'offensivt', name:'Overlapp back til kant', duration:20, players:'4–8', difficulty:'middels',
    description:'Back overlapper ut til kant for å skape overtal på flanken.',
    steps:[{ id:'s1', name:'Steg 1', description:'Venstre back har ball' }, { id:'s2', name:'Steg 2', description:'Kant løper INN (dummy-løp)' }, { id:'s3', name:'Steg 3', description:'Back løper ut til kantposisjon' }, { id:'s4', name:'Steg 4', description:'Midt passer til back ute' }, { id:'s5', name:'Steg 5', description:'Back avslutter' }],
    tips:['Dummy-løp MÅ trekke forsvareren','Back: vent til kant er forbi','Timing: pasning nøyaktig idet back er ute','Forsvarerne er alltid et steg bak'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o16', sport:'handball', category:'offensivt', name:'Gjennombrudd med skjerming', duration:20, players:'4–8', difficulty:'middels',
    description:'Angriper skjermer for lagkamerat som bryter. Blokk, timing, mottak i fart.',
    steps:[{ id:'s1', name:'Steg 1', description:'A skjermer mellom forsvareren og B' }, { id:'s2', name:'Steg 2', description:'B løper forbi A mot målet' }, { id:'s3', name:'Steg 3', description:'C passer til B i bevegelsen' }, { id:'s4', name:'Steg 4', description:'B avslutter i fart' }],
    tips:['Skjermspiller: stå STILLE','Skjerm kun lovlig ved forsvarerens bevegelse','Timing: B bryter FØR forsvareren komme forbi','C: pass tidlig'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o17', sport:'handball', category:'offensivt', name:'Sammensatt 6-mann kombinasjon', duration:25, players:'6–10', difficulty:'avansert',
    description:'Seks spillere kombinerer: kryss, innspill, gjennombrudd, avslutning.',
    steps:[{ id:'s1', name:'Steg 1', description:'Definert mønster: A→B (kryss)→C (pivot)→D (kant)→E (back)→skudd' }, { id:'s2', name:'Steg 2', description:'Sakte 3 ganger' }, { id:'s3', name:'Steg 3', description:'75% fart 3 ganger' }, { id:'s4', name:'Steg 4', description:'100% fart' }, { id:'s5', name:'Steg 5', description:'Passivt forsvar' }],
    tips:['Alle husker rekkefølgen FØR start','Timing er alt','Pivot: vend riktig for å åpne for neste','Skytter: tilpass til hva keeper gjør'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o18', sport:'handball', category:'offensivt', name:'Innspilfri bevegelse (kompassøvelse)', duration:20, players:'6–10', difficulty:'middels',
    description:'Spillere øver rotasjon uten ball for å finne frie rom.',
    steps:[{ id:'s1', name:'Steg 1', description:'3-2-1 angrepsformasjon' }, { id:'s2', name:'Steg 2', description:'Ball sirkuleres langs ytre linje' }, { id:'s3', name:'Steg 3', description:'Spillere uten ball: kompassbevegelse — 4 retninger' }, { id:'s4', name:'Steg 4', description:'Alle beveger seg alltid' }, { id:'s5', name:'Steg 5', description:'Etter 5 sirkulasjoner: angrip' }],
    tips:['Stå aldri stille','Bakbane: gå bredt ved ball på andre siden','Pivot: inn og ut av 6m-sonen','Kant: inn mot midten for å distrahere forsvar'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-o19', sport:'handball', category:'offensivt', name:'2v2 bakbane vs forsvar', duration:20, players:'4–8', difficulty:'middels',
    description:'To bakbanespillere mot to forsvarere. Kombinasjonsspill og gjennombrudd.',
    steps:[{ id:'s1', name:'Steg 1', description:'2 bakbanespillere ved 9m' }, { id:'s2', name:'Steg 2', description:'2 forsvarere kompakt' }, { id:'s3', name:'Steg 3', description:'Kombiner: pasning og løp' }, { id:'s4', name:'Steg 4', description:'Skyt fra 9m eller gjennombryting' }, { id:'s5', name:'Steg 5', description:'Bytt roller etter 3 min' }],
    tips:['Hold bredde: aldri la forsvarerne dekke begge','Skudd fra 9m: trekk forsvarerne, pass til den andre','2v2: én trekker, én skyter','Kommuniser: "skyt!" eller "pass!"'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o20', sport:'handball', category:'offensivt', name:'Raskt angrep etter gjenvinning', duration:20, players:'7–10', difficulty:'middels',
    description:'Laget angriper raskt etter gjenvinning. Kontringsmentalitet.',
    steps:[{ id:'s1', name:'Steg 1', description:'7v7 — forsvar vinner ball' }, { id:'s2', name:'Steg 2', description:'Umiddelbar kontring' }, { id:'s3', name:'Steg 3', description:'Maks 3 pasninger til avslutning' }, { id:'s4', name:'Steg 4', description:'Forsvar: reorganiser raskt' }],
    tips:['Keeper: distribuer innen 2 sek etter redning','Signalspiller alltid klar fremover','3 pasninger til avslutning er maksimum','Kontringsmål er de beste målene'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o21', sport:'handball', category:'offensivt', name:'Pasningshastighet i sirkel', duration:15, players:'5–8', difficulty:'enkel',
    description:'Rask pasningssirkel — tempo og presisjon under tidspress.',
    steps:[{ id:'s1', name:'Steg 1', description:'5–8 spillere i sirkel, 3m diameter' }, { id:'s2', name:'Steg 2', description:'Rask pasning rundt: 1 touch' }, { id:'s3', name:'Steg 3', description:'Etter 10 pasninger: hopp over én (annenhver)' }, { id:'s4', name:'Steg 4', description:'Avansert: to baller i sirkel' }, { id:'s5', name:'Steg 5', description:'Konkurranse: raskest uten feil' }],
    tips:['1-touch krav: trener presisjon','Fortell alltid hvem du passer til','Sirkel av riktig størrelse: for stor er for lett','Avansert: tydelig signal til riktig mottaker'],
    equipment:['Handball (1–2 baller)'], ageGroup: 'adult' },

  { id:'hb-o22', sport:'handball', category:'offensivt', name:'Avslutning fra alle vinkler', duration:20, players:'2–10', difficulty:'middels',
    description:'Systematisk skuddtrening fra 6 ulike posisjoner rundt 9m-linjen.',
    steps:[{ id:'s1', name:'Steg 1', description:'6 merker rundt 9m: venstre kant, venstre back, senter, høyre back, høyre kant, pivot' }, { id:'s2', name:'Steg 2', description:'Skudd fra hver posisjon ×5' }, { id:'s3', name:'Steg 3', description:'Fokus på teknikk per posisjon' }, { id:'s4', name:'Steg 4', description:'Keeper aktiv — sammenlign redningsprosent per posisjon' }],
    tips:['Venstre kant: hoppskudd inn mot stolpe','Senter back: rett hoppskudd','Pivot: vendingsskudd lavt','Sammenlign: hvilken posisjon er mest effektiv for deg?'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o23', sport:'handball', category:'offensivt', name:'Senter kombinasjon med kryss', duration:20, players:'4–8', difficulty:'middels',
    description:'Senter og midt kombinerer med kryss for å åpne for gjennombrudd.',
    steps:[{ id:'s1', name:'Steg 1', description:'Senter mottar pasning fra back' }, { id:'s2', name:'Steg 2', description:'Kryss-løp: senter og venstre back bytter' }, { id:'s3', name:'Steg 3', description:'Pasning til den som er fri' }, { id:'s4', name:'Steg 4', description:'Avslutning mot mål' }],
    tips:['Kryss: gjennomfør med full fart','Forsvarerne MÅ bestemme seg — skaper alltid en fri','Kombiner med pivot-innspill'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o24', sport:'handball', category:'offensivt', name:'Oppsett av angrep fra 7m', duration:15, players:'5–8', difficulty:'middels',
    description:'Laget øver å sette opp angrep effektivt etter tilkjent 7m. Posisjonering og timing.',
    steps:[{ id:'s1', name:'Steg 1', description:'7m tilkjent' }, { id:'s2', name:'Steg 2', description:'Kassetter setter opp spillere i posisjon' }, { id:'s3', name:'Steg 3', description:'7m-kaster venter på keeper' }, { id:'s4', name:'Steg 4', description:'Øvrige: beredt for retur-angrep' }, { id:'s5', name:'Steg 5', description:'Scenariet: retur-ball → raskt angrep' }],
    tips:['Ikke rush 7m-kastet — ta kontroll','Spillerne i posisjon INNEN kastet tas','Retur-angrep: starter straks hvis ball returneres','Ha klar PLAN A og B'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-o25', sport:'handball', category:'offensivt', name:'Bakbane kombinasjon 3-mann', duration:20, players:'3–9', difficulty:'middels',
    description:'Tre bakbanespillere kombinerer med kryssløp og innspill til pivot.',
    steps:[{ id:'s1', name:'Steg 1', description:'3 bakbanespillere ved 9m (venstre, senter, høyre)' }, { id:'s2', name:'Steg 2', description:'Sirkuler ballen raskt' }, { id:'s3', name:'Steg 3', description:'Kryss: venstre og senter bytter' }, { id:'s4', name:'Steg 4', description:'Åpner for gjennombrudd senter' }, { id:'s5', name:'Steg 5', description:'Pivot-innspill fra senter' }],
    tips:['Bakbanens styrke: bredde og distanse','Cirkuler fort for å flytte forsvaret','Kryss: avgjørende timing','Pivot MÅ alltid være tilgjengelig'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  // ─── DEFENSIVT (20 øvelser) ──────────────────────────────────

  { id:'hb-d01', sport:'handball', category:'defensivt', name:'6-0 forsvar grunnposisjon', duration:20, players:'6–7', difficulty:'middels',
    description:'Seks forsvarere øver grunnposisjon i 6-0: kompakt linje, rotasjon.',
    steps:[{ id:'s1', name:'Steg 1', description:'6 forsvarere langs 6m-linjen' }, { id:'s2', name:'Steg 2', description:'Ball sirkuleres langs angrepet' }, { id:'s3', name:'Steg 3', description:'Forsvarslinja glider mot ballen' }, { id:'s4', name:'Steg 4', description:'Nærmeste: hopp ut og press angriperen' }, { id:'s5', name:'Steg 5', description:'Andre: fyller inn etter utbrekk' }],
    tips:['6-0: kompakt FØR aggressiv','Glide: flytt som én enhet','Utbrekk: maks 1–2 steg fra 6m','Kommuniser: "komme ut!" og "fyller!"'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-d02', sport:'handball', category:'defensivt', name:'5-1 forsvar med spiss', duration:20, players:'6–7', difficulty:'avansert',
    description:'5-1: fem på linjen, én spiss som presser sentermidt.',
    steps:[{ id:'s1', name:'Steg 1', description:'5 forsvarere på linjen, 1 spiss foran' }, { id:'s2', name:'Steg 2', description:'Spissen presser CM' }, { id:'s3', name:'Steg 3', description:'5-linja dekker kanter' }, { id:'s4', name:'Steg 4', description:'Spissen kanaliserer CM bort fra senter' }, { id:'s5', name:'Steg 5', description:'Bytt spiss etter 5 min' }],
    tips:['Spissen: press CM — ikke chase ballen','5-linjen: komprimér mot ballen','5-1 krever god kondisjon — krevende','Kommuniser: "spiss ut!" ved pressing'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-d03', sport:'handball', category:'defensivt', name:'Blokkering av skudd', duration:15, players:'2–8', difficulty:'middels',
    description:'Forsvarere øver timing av blokkeringen: hopp, armer opp.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angriper med ball 9m fra mål' }, { id:'s2', name:'Steg 2', description:'Forsvarspiller rett foran' }, { id:'s3', name:'Steg 3', description:'Forsvarspiller hopper på skuddsignalet' }, { id:'s4', name:'Steg 4', description:'Armer oppe — blokker skuddet' }],
    tips:['Hopp IDET ballen forlater hånden','Armer OPP og fremover','Aldri hopp for tidlig','Feil timing = straffeblokk'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-d04', sport:'handball', category:'defensivt', name:'Forsvare pivot langs 6m', duration:20, players:'3–6', difficulty:'middels',
    description:'Forsvarspiller dekker pivot langs 6m-linjen.',
    steps:[{ id:'s1', name:'Steg 1', description:'Pivot beveger seg langs 6m' }, { id:'s2', name:'Steg 2', description:'Forsvarspiller holder posisjon FORAN pivot' }, { id:'s3', name:'Steg 3', description:'Hender oppe — blokkere innspillinjen' }, { id:'s4', name:'Steg 4', description:'Pasning inn forsøkes' }, { id:'s5', name:'Steg 5', description:'Forsvarspilleren forstyrrer mottaket' }],
    tips:['Stå FORAN pivoten (mellom ball og pivot)','Aldri full kropp til pivot','Hender oppe blokkerer 30% av linjer','Kommuniser med nabospillere'],
    equipment:['Handball'], ageGroup: 'adult' },

  { id:'hb-d05', sport:'handball', category:'defensivt', name:'Rotasjon ved utbrekk', duration:20, players:'6–7', difficulty:'avansert',
    description:'Koordinert rotasjon etter at en forsvarspiller bryter ut.',
    steps:[{ id:'s1', name:'Steg 1', description:'6-0 i posisjon' }, { id:'s2', name:'Steg 2', description:'En forsvarspiller bryter ut' }, { id:'s3', name:'Steg 3', description:'Naboer roterer mot ballen' }, { id:'s4', name:'Steg 4', description:'Ingen åpen sone i 6m-linjen' }],
    tips:['Rotasjon MÅ skje SIMULTANT med utbrekket','Nærmeste naboer: ett steg inn','Kommuniser: "jeg er ut!" → "jeg fyller!"','Øv til rotasjonen er automatisk'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-d06', sport:'handball', category:'defensivt', name:'Keeper-forsvar samarbeid', duration:20, players:'4–7', difficulty:'middels',
    description:'Keeper og forsvarspillere koordinerer hvem som tar hva.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper + 2 forsvarere mot 3 angripere' }, { id:'s2', name:'Steg 2', description:'Keeper kommanderer "min" eller "din"' }, { id:'s3', name:'Steg 3', description:'Forsvarspiller kommuniserer med keeper' }, { id:'s4', name:'Steg 4', description:'Situasjoner: innlegg, gjennombrudd, sideskudd' }],
    tips:['Keeper er sjefen — alle hører på keeper','Forsvarerne: si fra om du er usikker','"BYT!" = ta mannen og la keeper ha ball','Kommunisér med navn'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-d07', sport:'handball', category:'defensivt', name:'Høy pressing for gjenvinning', duration:20, players:'6–8', difficulty:'avansert',
    description:'Pressing høyt for rask gjenvinning. Koordinert og aggressivt.',
    steps:[{ id:'s1', name:'Steg 1', description:'Forsvar presser i motstanderens halvdel' }, { id:'s2', name:'Steg 2', description:'6 forsvarere kompakt 9m fra mål' }, { id:'s3', name:'Steg 3', description:'Press bæreren med 2 spillere' }, { id:'s4', name:'Steg 4', description:'Andre blokkerer pasningslinjer' }],
    tips:['Pressing er risikabelt — koordiner alltid','To nærmeste: presser ballen','Fire andre: blokkerer innspill','Trekk tilbake ved mislykket pressing'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-d08', sport:'handball', category:'defensivt', name:'3-2-1 forsvar', duration:25, players:'7', difficulty:'avansert',
    description:'3-2-1: tre foran, to bak, én keeper. Aggressivt og dynamisk.',
    steps:[{ id:'s1', name:'Steg 1', description:'3 framme, 2 bak, keeper' }, { id:'s2', name:'Steg 2', description:'Framste tre: aggressivt press' }, { id:'s3', name:'Steg 3', description:'Bak to: dekker flanker og pivot' }, { id:'s4', name:'Steg 4', description:'Øv overgangene fra 6-0 til 3-2-1' }],
    tips:['3-2-1: kun mot svake oppbyggere','De tre framme: MÅ være lynraske','Bak to: aldri miste pivoten','Enerving og krevende — kondisjon er avgjørende'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-d09', sport:'handball', category:'defensivt', name:'Blocking og lovlig kroppskontakt', duration:15, players:'2–8', difficulty:'middels',
    description:'Forsvarere øver lovlig kroppskontakt: blokkere med kropp, ikke dytte.',
    steps:[{ id:'s1', name:'Steg 1', description:'Forsvarspiller mot angriper 1v1' }, { id:'s2', name:'Steg 2', description:'Forsvarspiller: bruk overkroppens fremside' }, { id:'s3', name:'Steg 3', description:'Blokkere bevegelsesretning (ikke dytte)' }, { id:'s4', name:'Steg 4', description:'Angriperen løper inn mot 6m' }],
    tips:['Lovlig: kropp mot kropp front','Ulovlig: dytte med armer, rive, holde','Hold armene noe ut fra kroppen','Vurder alltid fra kontaktets retning'],
    equipment:['Handball'], ageGroup: 'adult' },

  { id:'hb-d10', sport:'handball', category:'defensivt', name:'Forsvar ved numerisk underlegenhet', duration:20, players:'5–7', difficulty:'avansert',
    description:'Laget øver å forsvare med én mann utvist. 5v6.',
    steps:[{ id:'s1', name:'Steg 1', description:'5 forsvarere vs 6 angripere' }, { id:'s2', name:'Steg 2', description:'Tilpasse 5-0 eller 4-1' }, { id:'s3', name:'Steg 3', description:'Kommuniser hvem som tar hvem' }, { id:'s4', name:'Steg 4', description:'Øv å holde kompakt 60 sek' }],
    tips:['5 forsvarere MÅ være doblet kompakt','Prioriter midten: stopp gjennombrudd og pivot','Ekstra fokus på keeper ved underlegenhet','Hold disiplin — feil her er fatalt'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-d11', sport:'handball', category:'defensivt', name:'Mann-markering av pivot', duration:20, players:'3–6', difficulty:'avansert',
    description:'Spesiell mann-markering av pivot. Tett og aggressiv dekking.',
    steps:[{ id:'s1', name:'Steg 1', description:'Én forsvarspiller mann-markerer pivot' }, { id:'s2', name:'Steg 2', description:'Pivot forsøker å frigjøre seg' }, { id:'s3', name:'Steg 3', description:'Forsvarspilleren holder kontakten' }, { id:'s4', name:'Steg 4', description:'Øv ved inn-pasning og vendinger' }],
    tips:['Mann-markering: hold kontakt med hånden','Aldri miste pivoten av syne','Fysisk og krevende — bytt etter 3 min','Koordiner med nabospillere'],
    equipment:['Handball'], ageGroup: 'adult' },

  { id:'hb-d12', sport:'handball', category:'defensivt', name:'Tidlig press fra 9m', duration:15, players:'4–8', difficulty:'middels',
    description:'Forsvarere bryter ut til 9m-linjen tidlig for å presse bakbanespillere.',
    steps:[{ id:'s1', name:'Steg 1', description:'To forsvarere bryter ut til 9m' }, { id:'s2', name:'Steg 2', description:'Presser bakbanespillere aggressivt' }, { id:'s3', name:'Steg 3', description:'To bak holder 6m-linjen' }, { id:'s4', name:'Steg 4', description:'Bytt etter 3 min' }],
    tips:['Tidlig press fra 9m: best mot langsom oppbygging','Pressen: press BALLEN, ikke mannen','De to bak: hold 6m kompakt','Risikabelt — revolver tilbake om pressen mislykkes'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-d13', sport:'handball', category:'defensivt', name:'Forsvare frispark', duration:15, players:'5–7', difficulty:'middels',
    description:'Forsvarsposisjonering ved frispark. Mur og posisjon.',
    steps:[{ id:'s1', name:'Steg 1', description:'Forsvar sett opp ved frispark' }, { id:'s2', name:'Steg 2', description:'2–3 spillere i mur' }, { id:'s3', name:'Steg 3', description:'Resten posisjonerer seg' }, { id:'s4', name:'Steg 4', description:'Keeper kommanderer muren' }, { id:'s5', name:'Steg 5', description:'Øv alle frispark-posisjoner' }],
    tips:['Muren: 3m fra ballen (regelen)','Hopp som én enhet ved skudd','Keeper: styr muren til riktig posisjon','Alltid en bak muren for korreksjon'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-d14', sport:'handball', category:'defensivt', name:'Forsvar ved kontring mot deg', duration:20, players:'5–8', difficulty:'middels',
    description:'Forsvar øver å håndtere kontring: race tilbake, blokkere og reorganisere.',
    steps:[{ id:'s1', name:'Steg 1', description:'Laget i angrepposisjon' }, { id:'s2', name:'Steg 2', description:'Signal: mister ball' }, { id:'s3', name:'Steg 3', description:'Alle sprinter tilbake' }, { id:'s4', name:'Steg 4', description:'Reorganiser til 6-0 i 4 sek' }],
    tips:['Sprint tilbake: ingen er unntatt','Nærmeste to: holder ballen nede (delay)','Keeper: kommanderer og motiverer','Reorganisering: fra utsiden og inn'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-d15', sport:'handball', category:'defensivt', name:'6-0 rotasjon øvelse', duration:20, players:'6', difficulty:'middels',
    description:'6-0-linja øver rotasjon ved utbrekk fra begge sider.',
    steps:[{ id:'s1', name:'Steg 1', description:'Ball sirkuleres venstre kant → senter → høyre kant' }, { id:'s2', name:'Steg 2', description:'Nærmeste: bryter ut ved bakbanespiller' }, { id:'s3', name:'Steg 3', description:'Naboer: fyller systematisk' }, { id:'s4', name:'Steg 4', description:'Øv fra begge sider 5 ganger' }],
    tips:['Rotasjon: en enhet — ikke individuell','Tydelig kommunikasjon: "min!" og "din!"','Aldri to tomrom i linjen','Lag automatikken gjennom repetisjon'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-d16', sport:'handball', category:'defensivt', name:'Forsvar av kant-gjennombrudd', duration:20, players:'3–6', difficulty:'middels',
    description:'Forsvar øver å stoppe kant-gjennombrudd.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kantspiller forsøker gjennombrudd' }, { id:'s2', name:'Steg 2', description:'Forsvarspilleren setter press' }, { id:'s3', name:'Steg 3', description:'Kanaliserer mot baklinjen' }, { id:'s4', name:'Steg 4', description:'Keeper dekker vinkelposisjon' }],
    tips:['Styr kanten UT — ikke inn mot senter','Arm og skulder blokkerer inngangen','Keeper: ut på kanten for å redusere vinkel','Kommuniser med nabospilleren'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-d17', sport:'handball', category:'defensivt', name:'Dobbeldekke pivot', duration:15, players:'4–6', difficulty:'avansert',
    description:'To forsvarere samarbeider om å dekke pivot og avskaffe innspilllinjer.',
    steps:[{ id:'s1', name:'Steg 1', description:'Pivot i 6m-sonen' }, { id:'s2', name:'Steg 2', description:'To forsvarere: én foran, én bak' }, { id:'s3', name:'Steg 3', description:'Begge aktive mot mottak' }, { id:'s4', name:'Steg 4', description:'Bakbane forsøker innspill' }],
    tips:['Fremre forsvarspiller: blokkerer fra forsiden','Bakre: blokkerer fra baksiden','Kommuniser hvem som tar hva','Effektivt men risikabelt: åpner naboposisjoner'],
    equipment:['Handball'], ageGroup: 'adult' },

  { id:'hb-d18', sport:'handball', category:'defensivt', name:'Forsvar i overtall — 7v6', duration:20, players:'13', difficulty:'middels',
    description:'Forsvar med overtall (7 mot 6) øver å utnytte fordelen og skape raskt angrep.',
    steps:[{ id:'s1', name:'Steg 1', description:'7 forsvarere vs 6 angripere' }, { id:'s2', name:'Steg 2', description:'Forsvarerne: ekstrem pressing' }, { id:'s3', name:'Steg 3', description:'Gjenvinning → umiddelbar kontring' }, { id:'s4', name:'Steg 4', description:'Mål: skore innen 5 sek etter gjenvinning' }],
    tips:['7v6: bruk nummeret ditt — press alle','Gjenvinning er starten på ditt angrep','Keeper: distribuer umiddelbart','Lagspill ikke individuelt'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-d19', sport:'handball', category:'defensivt', name:'Pressing mot oppbygging', duration:20, players:'6–8', difficulty:'avansert',
    description:'Fullt press mot motstanderens oppbygging fra keeper.',
    steps:[{ id:'s1', name:'Steg 1', description:'6 forsvarere presser i motstanderens halvdel' }, { id:'s2', name:'Steg 2', description:'Keeper bytter til ekstra spiller' }, { id:'s3', name:'Steg 3', description:'Forsvarerne: press alle motstanderens spillere' }, { id:'s4', name:'Steg 4', description:'Mål: forhindre oppbygging over halvbanen' }],
    tips:['Kun effektivt de siste 2 min av kamp','Krevende: MÅ gjenvinne eller score raskt','Keeper til banen: stor risiko','Kommuniser hvem som dekker hvem'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-d20', sport:'handball', category:'defensivt', name:'Individuell forsvarsteknikk', duration:15, players:'2–8', difficulty:'enkel',
    description:'Basisteknikk for forsvarsspill: stilling, steg, og press.',
    steps:[{ id:'s1', name:'Steg 1', description:'Basisstilling: bøyd, lav, vekt fremover' }, { id:'s2', name:'Steg 2', description:'Sidestep 3m: høyre og venstre ×10' }, { id:'s3', name:'Steg 3', description:'Press: ett skritt frem mot angriperen' }, { id:'s4', name:'Steg 4', description:'Tilbake: glid tilbake til linjen' }, { id:'s5', name:'Steg 5', description:'Øv mot passiv angriper' }],
    tips:['Alltid lav stilling — lavere enn angriperen','Sidestep: IKKE kryss beina','Press: én steg frem, ikke mer','Blikket på brystet til angriperen — ikke beina'],
    equipment:['Kjegler'], ageGroup: 'adult' },

  // ─── HELE LAGET (15 øvelser) ─────────────────────────────────

  { id:'hb-t01', sport:'handball', category:'hele_laget', name:'7v7 taktikkspill', duration:40, players:'14', difficulty:'avansert',
    description:'Full 7v7 med ett taktisk fokus. Trener stopper og demonstrerer.',
    steps:[{ id:'s1', name:'Steg 1', description:'Fullt 7v7' }, { id:'s2', name:'Steg 2', description:'Fokus: ett tema (f.eks. 6-0 mot 3-3 angrep)' }, { id:'s3', name:'Steg 3', description:'20 min angrep, 20 min forsvar' }, { id:'s4', name:'Steg 4', description:'Fri treningskamp til slutt' }],
    tips:['Fokus: ÉTT tema','Stoppene: korte og konkrete','Video etterpå om mulig','La spillerne foreslå løsninger'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-t02', sport:'handball', category:'hele_laget', name:'Hurtig kontring — hele laget', duration:20, players:'7–10', difficulty:'middels',
    description:'Hele laget øver kontring etter gjenvinning. Fra forsvar til angrep under 5 sek.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper redder' }, { id:'s2', name:'Steg 2', description:'Umiddelbar distribusjon til signalspiller' }, { id:'s3', name:'Steg 3', description:'2–3 løper fremover' }, { id:'s4', name:'Steg 4', description:'Avslutt innen 5 sek' }],
    tips:['Keeper: RASKT — ikke hold ballen','Signalspiller alltid klar','Hold bredde','Etter 5 sek: standard angrep'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-t03', sport:'handball', category:'hele_laget', name:'Sett-stykker — frispark og 7m', duration:20, players:'7', difficulty:'middels',
    description:'Teamtrening på frispark-situasjoner og 7m under press.',
    steps:[{ id:'s1', name:'Steg 1', description:'5 ulike frispark-oppsett' }, { id:'s2', name:'Steg 2', description:'Keeper kjenner alle oppsettene' }, { id:'s3', name:'Steg 3', description:'Avslutning: 7m under press' }, { id:'s4', name:'Steg 4', description:'Keeper analyserer motstanderens kastere' }],
    tips:['Frispark: alltid alternativ kaster','Keeper: kjenn spillernes svake retning','Blokkere: konsekvent'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-t04', sport:'handball', category:'hele_laget', name:'Overgang forsvar-angrep', duration:25, players:'10–14', difficulty:'avansert',
    description:'Umiddelbar overgang fra defensiv til offensiv etter gjenvinning.',
    steps:[{ id:'s1', name:'Steg 1', description:'7v7' }, { id:'s2', name:'Steg 2', description:'Forsvar vinner ball → kontre' }, { id:'s3', name:'Steg 3', description:'Maks 3 pasninger til avslutning' }, { id:'s4', name:'Steg 4', description:'Bytt lag etter mål' }],
    tips:['Keeper starter overgangen — distribuer raskt','Alltid én fremover alltid','Direkte skudd er ofte bedre enn overpassing','Kontringsmål teller dobbelt'],
    equipment:['Handball','Mål','Kjegler'], ageGroup: 'adult' },

  { id:'hb-t05', sport:'handball', category:'hele_laget', name:'3-2-1 mot 3-3 angrep', duration:25, players:'12–14', difficulty:'avansert',
    description:'Taktisk duell: 3-2-1 forsvar mot 3-3 angrep.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angripere: 3-3 formasjon' }, { id:'s2', name:'Steg 2', description:'Forsvarerne: 3-2-1' }, { id:'s3', name:'Steg 3', description:'3 min; pause og diskuter' }, { id:'s4', name:'Steg 4', description:'Bytt til 6-0 mot 2-4 angrep' }, { id:'s5', name:'Steg 5', description:'Evaluering: hva fungerte?' }],
    tips:['3-2-1: aggressiv men krevende','Spiss i 3-2-1: alltid press på CM','3-3: bruk pivoten for å bryte 3-2-1','Ha Plan B klar'],
    equipment:['Handball','Mål','Kjegler'], ageGroup: 'adult' },

  { id:'hb-t06', sport:'handball', category:'hele_laget', name:'Oppvarming håndball-spesifikk', duration:15, players:'alle', difficulty:'enkel',
    description:'Oppvarming med ball: pasning, bevegelse, dynamisk strekk.',
    steps:[{ id:'s1', name:'Steg 1', description:'2 min lett jogg' }, { id:'s2', name:'Steg 2', description:'Pasning i par under jogg' }, { id:'s3', name:'Steg 3', description:'Dynamiske strekk: skulder, hofter, ankler' }, { id:'s4', name:'Steg 4', description:'Kastkraft: lette kast x10 per arm' }, { id:'s5', name:'Steg 5', description:'Mini-kontring 3v2 × 3' }],
    tips:['Skulder: varm opp tidlig — varme skulder er sunne skulder','Lett kasting FØR hardt kasting','Kommuniser fra starten'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-t07', sport:'handball', category:'hele_laget', name:'Kondisjonsspill 4v4 press', duration:25, players:'8', difficulty:'middels',
    description:'Intenst 4v4 der begge lag alltid presser. Utholdenhets- og taktikktrening.',
    steps:[{ id:'s1', name:'Steg 1', description:'4v4 på halvbane' }, { id:'s2', name:'Steg 2', description:'Mister du ballen: press umiddelbart' }, { id:'s3', name:'Steg 3', description:'Maks 3 touch' }, { id:'s4', name:'Steg 4', description:'3×5 min med 2 min pause' }],
    tips:['Kondisjonsmessig intenst','Bytt lag mellom periodene','Teller mål — motivasjon'],
    equipment:['Handball','Kjegler','Mål'], ageGroup: 'adult' },

  { id:'hb-t08', sport:'handball', category:'hele_laget', name:'Defensiv organisasjonstrening', duration:30, players:'7', difficulty:'avansert',
    description:'Laget øver alle tre forsvarssystemer systematisk.',
    steps:[{ id:'s1', name:'Steg 1', description:'Øv 6-0 i 8 min' }, { id:'s2', name:'Steg 2', description:'Øv 5-1 i 8 min' }, { id:'s3', name:'Steg 3', description:'Øv 3-2-1 i 8 min' }, { id:'s4', name:'Steg 4', description:'Kombiner: bytt på signal fra trener' }, { id:'s5', name:'Steg 5', description:'Evaluering: when to use what?' }],
    tips:['6-0: kompakt og rolig','5-1: aggressiv spiss er nøkkelen','3-2-1: kun mot svake oppbyggere','Trener: bytt raskt mellom systemene'],
    equipment:['Handball','Mål','Kjegler'], ageGroup: 'adult' },

  { id:'hb-t09', sport:'handball', category:'hele_laget', name:'Simulert kampsituasjon', duration:30, players:'14', difficulty:'avansert',
    description:'Treningskamp med realistiske kampsituasjoner: utvisning, 7m, og siste minutt.',
    steps:[{ id:'s1', name:'Steg 1', description:'Normal 7v7 i 15 min' }, { id:'s2', name:'Steg 2', description:'Simuler: rødt kort (6v7)' }, { id:'s3', name:'Steg 3', description:'Simuler: 1 min igjen, én scoring foran' }, { id:'s4', name:'Steg 4', description:'Simuler: 7m i siste sekund' }, { id:'s5', name:'Steg 5', description:'Evaluering: hvordan reagerte laget?' }],
    tips:['Simulerte situasjoner trener mentalitet','Tren 6v7 systematisk — det skjer alltid','Siste minutt: rolig og disiplinert','Lagleder tar kommandoen ved kritiske situasjoner'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-t10', sport:'handball', category:'hele_laget', name:'Pasnings-nøyaktighet under bevegelse', duration:20, players:'8–14', difficulty:'middels',
    description:'Laget øver pasningspresisjon mens alle beveger seg.',
    steps:[{ id:'s1', name:'Steg 1', description:'Alle 7 i bevegelse (jogg)' }, { id:'s2', name:'Steg 2', description:'Pasning til bevegelig mottaker' }, { id:'s3', name:'Steg 3', description:'Mottaker signaliserer med arm' }, { id:'s4', name:'Steg 4', description:'Øv på alle pasningstyper' }, { id:'s5', name:'Steg 5', description:'Avansert: pasning foran løpet' }],
    tips:['Passer: sikt foran mottakeren','Mottaker: arm opp = klar for mottak','Hold laget kompakt — ikke for spredt','Kommunisér hvem som sender til hvem'],
    equipment:['Handball'], ageGroup: 'adult' },

  { id:'hb-t11', sport:'handball', category:'hele_laget', name:'Overtalls- og undertalls-spill', duration:25, players:'12–14', difficulty:'avansert',
    description:'Trener med numerisk overlegenhet og ulempe. 7v6 og 6v7.',
    steps:[{ id:'s1', name:'Steg 1', description:'7v6: angripere i overtall 5 min' }, { id:'s2', name:'Steg 2', description:'6v7: forsvarerne i undertall 5 min' }, { id:'s3', name:'Steg 3', description:'Bytt roller' }, { id:'s4', name:'Steg 4', description:'Evaluering: hva fungerte best?' }],
    tips:['7v6 angrep: bruk den ekstra — press alltid','6v7 forsvar: prioriter midten','6v7: keeper er ekstra viktig','Tren begge situasjonene like mye'],
    equipment:['Handball','Mål','Kjegler'], ageGroup: 'adult' },

  { id:'hb-t12', sport:'handball', category:'hele_laget', name:'Lagstrategisk møte og demonstrasjon', duration:20, players:'7', difficulty:'middels',
    description:'Trener forklarer taktikk på banen med spillere på plass. Dynamisk taktikktavle.',
    steps:[{ id:'s1', name:'Steg 1', description:'Spillere i sin formasjon' }, { id:'s2', name:'Steg 2', description:'Trener forklarer oppgave til hver rolle' }, { id:'s3', name:'Steg 3', description:'3 situasjoner demonstreres: angrep, forsvar, overgang' }, { id:'s4', name:'Steg 4', description:'Spillerne gjennomfører mot passive' }, { id:'s5', name:'Steg 5', description:'Øk motstand til 50%' }],
    tips:['Banen er tavlen — ikke whiteboardet','Vis — ikke bare fortell','Start sakte og øk farten','La spillerne stille spørsmål'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-t13', sport:'handball', category:'hele_laget', name:'Frekvent bytting og spillerotasjon', duration:20, players:'10–14', difficulty:'middels',
    description:'Trening på effektiv rotasjon og bytte av spillere uten å miste tempo.',
    steps:[{ id:'s1', name:'Steg 1', description:'7v7 med 3–4 reserver' }, { id:'s2', name:'Steg 2', description:'Bytte skjer hvert 3. min — i løpende spill' }, { id:'s3', name:'Steg 3', description:'Mål: bytte uten avbrudd' }, { id:'s4', name:'Steg 4', description:'Reservene er alltid klare' }],
    tips:['Bytte i løpende spill er krevende — øv dette','Spiller ute: gi signal til trener','Bytte: alltid på hjemmesiden av banen','Hold tempoet oppe ved bytte'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-t14', sport:'handball', category:'hele_laget', name:'Psykisk motstandsdyktighetstrening', duration:20, players:'7–14', difficulty:'avansert',
    description:'Spillerne øver under psykisk press: publikum-lyder, dommerstress, og tidstrykk.',
    steps:[{ id:'s1', name:'Steg 1', description:'Trener spiller folkemengde-lyder (mobil/høyttaler)' }, { id:'s2', name:'Steg 2', description:'Timer setter ekstreme tidsbegrensninger' }, { id:'s3', name:'Steg 3', description:'Dommerfeil innimellom' }, { id:'s4', name:'Steg 4', description:'Spillerne: hold fokus og disiplin' }],
    tips:['Psykisk trening er undervurdert i håndball','Øv å beholde roen ved kontroverser','Lagleder: buffer mellom dommer og spillere','Evaluer: hvem beholdt fokus, hvem mistet det?'],
    equipment:['Handball','Mål','Høyttaler (valgfritt)'], ageGroup: 'adult' },

  { id:'hb-t15', sport:'handball', category:'hele_laget', name:'Treningskamp med taktisk tema', duration:60, players:'14', difficulty:'avansert',
    description:'Treningskamp der ett taktisk punkt evalueres kontinuerlig.',
    steps:[{ id:'s1', name:'Steg 1', description:'Normal 7v7' }, { id:'s2', name:'Steg 2', description:'Fokus: ett taktisk tema' }, { id:'s3', name:'Steg 3', description:'Trener stopper maks 5 ganger' }, { id:'s4', name:'Steg 4', description:'Siste 20 min: fritt spill' }, { id:'s5', name:'Steg 5', description:'Video og evaluering etterpå' }],
    tips:['Kun ÉTT tema — ikke alt','Stopp og vis: maks 30 sek','La spillerne ta initiativ på banen','Evaluer laget, ikke enkeltpersoner'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  // ─── KEEPER (10 øvelser) ─────────────────────────────────────

  { id:'hb-k01', sport:'handball', category:'keeper', name:'Reaksjonsredning multi-retning', duration:15, players:'2', difficulty:'middels',
    description:'Keeper øver raske bevegelser i alle retninger fra basisstilling.',
    steps:[{ id:'s1', name:'Steg 1', description:'Basisstilling: litt fremover, knær bøyd' }, { id:'s2', name:'Steg 2', description:'Trener peker raskt i retning' }, { id:'s3', name:'Steg 3', description:'Keeper: ett steg i retningen' }, { id:'s4', name:'Steg 4', description:'Opp, ned, venstre, høyre' }, { id:'s5', name:'Steg 5', description:'Legg til ball etter 5 min' }],
    tips:['Tyngdepunkt FREMOVER','Sidestep — ikke kryss beina','Hender foran kroppen','Første steg er avgjørende'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-k02', sport:'handball', category:'keeper', name:'Hjørneredning — stjerne-teknikk', duration:15, players:'2–4', difficulty:'middels',
    description:'Keeper øver å strekke seg til alle fire hjørner.',
    steps:[{ id:'s1', name:'Steg 1', description:'Skudd mot lav hjørne ×5 per side' }, { id:'s2', name:'Steg 2', description:'Dykk: push-off med motstående fot' }, { id:'s3', name:'Steg 3', description:'Skudd mot høy hjørne' }, { id:'s4', name:'Steg 4', description:'Strekk med arm, blokker ballen' }, { id:'s5', name:'Steg 5', description:'Doble skudd raskt' }],
    tips:['Dykk med beina — ikke bare armer','Lav: push-off nærmeste hjørne, dykk','Høy: begge bein, strekk armen','Øynene på ballen alltid'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-k03', sport:'handball', category:'keeper', name:'1v1 mot gjennombrudd', duration:20, players:'2–8', difficulty:'middels',
    description:'Keeper øver 1v1 mot gjennombrytende angriper.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angriper fra 10m mot keeper' }, { id:'s2', name:'Steg 2', description:'Keeper holder til angriper er 6m' }, { id:'s3', name:'Steg 3', description:'Bli "stor": armer ut, bein fra hverandre' }, { id:'s4', name:'Steg 4', description:'Avgjøre angriper til én side' }, { id:'s5', name:'Steg 5', description:'Redde med beina' }],
    tips:['Ikke kast deg — vent','Bli stor uten å helle','Armer OPP dekker mer areal','Dykk mot ballen idet angriper setter av'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-k04', sport:'handball', category:'keeper', name:'Distribusjon etter redning', duration:15, players:'3–6', difficulty:'enkel',
    description:'Keeper øver rask distribusjon til riktig spiller etter redning.',
    steps:[{ id:'s1', name:'Steg 1', description:'Trener skyter' }, { id:'s2', name:'Steg 2', description:'Keeper redder' }, { id:'s3', name:'Steg 3', description:'To spillere i ulike posisjoner' }, { id:'s4', name:'Steg 4', description:'Keeper velger raskt og kaster' }],
    tips:['Stå opp RASKT og se feltet','Kast til frieren — aldri markerte','Underarmskast: trygt og presist','Keeper starter angrepet!'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-k05', sport:'handball', category:'keeper', name:'Hoppskudd-sekvens', duration:15, players:'2–6', difficulty:'middels',
    description:'Keeper øver mot serie av hoppskudd. Posisjonering og timing.',
    steps:[{ id:'s1', name:'Steg 1', description:'Tre kastere, én om gangen' }, { id:'s2', name:'Steg 2', description:'Hoppskudd fra 9m' }, { id:'s3', name:'Steg 3', description:'Keeper: juster posisjon for hver' }, { id:'s4', name:'Steg 4', description:'10 sek pause mellom kastere' }, { id:'s5', name:'Steg 5', description:'Avansert: hoppskudd fra alle vinkler' }],
    tips:['Hoppskudd: kasteren beveger seg — juster posisjonen','Start i midten, beveg deg mot kanten i løpet','Ikke commit FØR kastet er sluppet','Arms up — stor areal'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-k06', sport:'handball', category:'keeper', name:'Fotarbeid og posisjonering', duration:15, players:'2', difficulty:'enkel',
    description:'Keeper øver posisjonering i mål: halvmåne og vinkelkutt.',
    steps:[{ id:'s1', name:'Steg 1', description:'Trener viser kasterposisjon' }, { id:'s2', name:'Steg 2', description:'Keeper: beveg til riktig posisjon (vinkelkutt)' }, { id:'s3', name:'Steg 3', description:'Øv fra alle 6 soner' }, { id:'s4', name:'Steg 4', description:'Avansert: keeper posisjonerer FØR skudd' }, { id:'s5', name:'Steg 5', description:'Keeper: "halvmåne" bevegelse' }],
    tips:['Halvmåne: alltid på vinkelens bisektrise','1.5–2m fremover fra mål: gjør deg stor','For nær: taper høyde; For langt: romsitter','Øv uten skudd FØR med skudd'],
    equipment:['Handball','Mål','Kjegler'], ageGroup: 'adult' },

  { id:'hb-k07', sport:'handball', category:'keeper', name:'Lave og harde skudd', duration:15, players:'2–4', difficulty:'middels',
    description:'Keeper øver spesifikt på lave harde skudd nær stolper og gulv.',
    steps:[{ id:'s1', name:'Steg 1', description:'Skyttere fra 9m: lave og harde skudd' }, { id:'s2', name:'Steg 2', description:'Keeper: lav posisjon forberedt' }, { id:'s3', name:'Steg 3', description:'Redde med beina (split)' }, { id:'s4', name:'Steg 4', description:'Avansert: raskt opp igjen etter redning' }],
    tips:['Split: spre beina snabbt og lavt','Hold rumpa nede — ikke opp','Hender foran — suppler beina','Øv split-stilling uten ball FØR med ball'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-k08', sport:'handball', category:'keeper', name:'Vinkelskudd fra kanter', duration:15, players:'3–6', difficulty:'middels',
    description:'Keeper øver posisjonering og redning av skudd fra smal vinkel.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kaster fra kant-posisjon (liten vinkel)' }, { id:'s2', name:'Steg 2', description:'Keeper: posisjonér seg til å kutte vinkelen' }, { id:'s3', name:'Steg 3', description:'Kant skyter' }, { id:'s4', name:'Steg 4', description:'Keeper redder' }, { id:'s5', name:'Steg 5', description:'Begge kanter' }],
    tips:['Kantskudd: posisjonér deg nær nærmeste stolpe','Du dekker 60% av mål — kaster reduseres til 40%','Ikke forsøk å dekke bakre stolpe (for langt)','Nær stolpe: stopp nær og blokker'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-k09', sport:'handball', category:'keeper', name:'Kommunikasjon og kommandogiving', duration:15, players:'3–7', difficulty:'enkel',
    description:'Keeper øver å ta kommandoen og kommunisere med forsvarerne.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper + 2 forsvarere vs angripere' }, { id:'s2', name:'Steg 2', description:'Keeper: kommanderer alle forsvarsbeslutninger' }, { id:'s3', name:'Steg 3', description:'Situasjoner: innlegg, 7m, gjennombrudd' }, { id:'s4', name:'Steg 4', description:'Fokus: høy og klar stemme' }],
    tips:['Keeper: du er øynene bak forsvaret','Kommandér tidlig — ikke i siste sekund','Bruk navn: "Ole: din!" ikke bare "din!"','Etter redning: kommandér umiddelbart'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  { id:'hb-k10', sport:'handball', category:'keeper', name:'Psykisk trening for keepere', duration:20, players:'2', difficulty:'middels',
    description:'Keeper øver å håndtere mål, dårlige perioder og prestasjon under press.',
    steps:[{ id:'s1', name:'Steg 1', description:'Serie: 10 skudd — keeper SKAL slippe noen inn' }, { id:'s2', name:'Steg 2', description:'Fokus: rask recovery etter mål' }, { id:'s3', name:'Steg 3', description:'Visualisering: se deg selv redde neste skudd' }, { id:'s4', name:'Steg 4', description:'Avansert: hele laget ser på' }, { id:'s5', name:'Steg 5', description:'Trener: gi konstruktiv feedback' }],
    tips:['Mål er uunngåelig — recovery er nøkkelen','Aldri heng hodet — neste ball er ny sjanse','Visualisering FØR økt: 5 min mental forberedelse','Trener: aldri klandre keeper for lagets feil'],
    equipment:['Handball','Mål'], ageGroup: 'adult' },

  // ─── FYSISK (10 øvelser) ─────────────────────────────────────

  { id:'hb-f01', sport:'handball', category:'fysisk', name:'Eksplosiv startsprint', duration:20, players:'alle', difficulty:'middels',
    description:'Eksplosive startsteg og sprint 5–10m. Grunnlag for gjennombrudd.',
    steps:[{ id:'s1', name:'Steg 1', description:'Startposisjon: sidestep-stance (lav)' }, { id:'s2', name:'Steg 2', description:'Sprint 5m ×8' }, { id:'s3', name:'Steg 3', description:'Sprint 10m ×6' }, { id:'s4', name:'Steg 4', description:'Backpedal 3m → sprint 8m ×5' }, { id:'s5', name:'Steg 5', description:'Pause 45 sek mellom rep' }],
    tips:['Første steg: push-off fra bakre fot','Knærne bøyd ved start','Armer: pump frem og bak','Reaksjon: se signal, reagér umiddelbart'],
    equipment:['Kjegler'], ageGroup: 'adult' },

  { id:'hb-f02', sport:'handball', category:'fysisk', name:'Kastkraft med medisinball', duration:20, players:'2–10', difficulty:'middels',
    description:'Kastkraft-trening med medisinball. Skulder, overkropp og kastkraft.',
    steps:[{ id:'s1', name:'Steg 1', description:'Brystkast til partner ×15' }, { id:'s2', name:'Steg 2', description:'Overhead kast ×12' }, { id:'s3', name:'Steg 3', description:'Sidekast: roter og kast ×10 per side' }, { id:'s4', name:'Steg 4', description:'Etterhånds kast som håndballkast ×10 per arm' }],
    tips:['Brystkast: push fra brystet','Etterhånds: fullt kast-mønster','Juster vekt: 2–4 kg','Strekk skulder og nakke etterpå'],
    equipment:['Medisinball (2–4 kg)'], ageGroup: 'adult' },

  { id:'hb-f03', sport:'handball', category:'fysisk', name:'Sidestep og lateral agilitet', duration:15, players:'alle', difficulty:'enkel',
    description:'Lateral agilitet for forsvarsspillet.',
    steps:[{ id:'s1', name:'Steg 1', description:'5m sidestep venstre ×10' }, { id:'s2', name:'Steg 2', description:'5m sidestep høyre ×10' }, { id:'s3', name:'Steg 3', description:'Kjegle-touch: 6 kjegler, touch alle ×5' }, { id:'s4', name:'Steg 4', description:'Med armer oppe ×8' }, { id:'s5', name:'Steg 5', description:'Med ball i hånden ×8' }],
    tips:['IKKE kryss beina','Knærne bøyd gjennom bevegelsen','Hurtig og lett','Armer oppe simulerer blokkering'],
    equipment:['Kjegler'], ageGroup: 'adult' },

  { id:'hb-f04', sport:'handball', category:'fysisk', name:'Skulder-styrketrening (prevensjon)', duration:20, players:'alle', difficulty:'middels',
    description:'Skulder-styrketrening for kastere. Prevensjon og kraftutvikling.',
    steps:[{ id:'s1', name:'Steg 1', description:'Ekstern rotasjon med strikk ×15 per arm' }, { id:'s2', name:'Steg 2', description:'Intern rotasjon med strikk ×15' }, { id:'s3', name:'Steg 3', description:'Front-raises 2–3 kg ×12' }, { id:'s4', name:'Steg 4', description:'Side-raises 2–3 kg ×12' }, { id:'s5', name:'Steg 5', description:'Skulder-press sittende ×10' }],
    tips:['Ekstern rotasjon: viktigst for skadeforebygging','Lett vekt','Kontrollert bevegelse ikke fart','Gjør dette ETTER kast-trening'],
    equipment:['Gummistrikk','Lette hantler (1–3 kg)'], ageGroup: 'adult' },

  { id:'hb-f05', sport:'handball', category:'fysisk', name:'Hoppstyrke og landing', duration:15, players:'alle', difficulty:'middels',
    description:'Hoppstyrke og landing-teknikk. Kritisk for hoppskudd.',
    steps:[{ id:'s1', name:'Steg 1', description:'Box-jump ×8' }, { id:'s2', name:'Steg 2', description:'Single-leg landing ×8 per bein' }, { id:'s3', name:'Steg 3', description:'Lengdehopp ×8' }, { id:'s4', name:'Steg 4', description:'Kontinuerlig hoppeserier ×6' }, { id:'s5', name:'Steg 5', description:'Dribble + hopp + kast kombinasjon' }],
    tips:['Landing: bøyde knær alltid','Single-leg: aktiv muskel, ikke "kræsj"','Hoppskudd: fremover ikke bare opp','Landingsøvelser like viktig som hopp'],
    equipment:['Kasse','Handball'], ageGroup: 'adult' },

  { id:'hb-f06', sport:'handball', category:'fysisk', name:'Intervall-løp med ball', duration:25, players:'alle', difficulty:'middels',
    description:'Intervall-kondisjonstrening med håndball. Spesifikk for kampsituasjoner.',
    steps:[{ id:'s1', name:'Steg 1', description:'Løp halvbane med ball i 30 sek, pause 30 sek' }, { id:'s2', name:'Steg 2', description:'8 intervaller' }, { id:'s3', name:'Steg 3', description:'Variere: sprint, jog, sprint, jog' }, { id:'s4', name:'Steg 4', description:'Avansert: pasning + løp i intervallet' }],
    tips:['Intervall med ball = spesifikk for håndball','Hold dribbling teknisk korrekt UNDER belastning','Pause: aktiv (saktere jogg, ikke stopp)','Juster tid: 20 sek/40 sek for nybegynnere'],
    equipment:['Handball','Kjegler'], ageGroup: 'adult' },

  { id:'hb-f07', sport:'handball', category:'fysisk', name:'Core-styrke for kastere', duration:20, players:'alle', difficulty:'enkel',
    description:'Core-trening spesifikt designet for kast-kraft i håndball.',
    steps:[{ id:'s1', name:'Steg 1', description:'Plank 45 sek ×3' }, { id:'s2', name:'Steg 2', description:'Side-plank 30 sek per side ×2' }, { id:'s3', name:'Steg 3', description:'Russian twists med ball ×20' }, { id:'s4', name:'Steg 4', description:'Pallof press med strikk ×12 per side' }, { id:'s5', name:'Steg 5', description:'Dead bug ×10 per side' }],
    tips:['Core er koblingen mellom bein og armer i kastet','Plank: alt aktivt — ikke passivt','Russian twists: rotasjon = kastkraft','Gjør dette 3× per uke'],
    equipment:['Matter','Gummistrikk','Medisinball (valgfritt)'], ageGroup: 'adult' },

  { id:'hb-f08', sport:'handball', category:'fysisk', name:'Plyometri for angripere', duration:20, players:'alle', difficulty:'middels',
    description:'Eksplosive øvelser for angripere og pivotspillere.',
    steps:[{ id:'s1', name:'Steg 1', description:'Jump squats ×10' }, { id:'s2', name:'Steg 2', description:'Tuck jumps ×8' }, { id:'s3', name:'Steg 3', description:'Lateral bounds ×10 per side' }, { id:'s4', name:'Steg 4', description:'Depth jump ×8 (hopp ned fra kasse, umiddelbart opp)' }, { id:'s5', name:'Steg 5', description:'Hopp + kast kombinasjon ×8' }],
    tips:['Maksimal kraft hvert hopp','Pause 60–90 sek mellom serier','Depth jump: minimalisér kontakttid','Kombiner alltid med kast til slutt'],
    equipment:['Kasse','Handball'], ageGroup: 'adult' },

  { id:'hb-f09', sport:'handball', category:'fysisk', name:'Aerob grunntrening', duration:30, players:'alle', difficulty:'enkel',
    description:'Aerob kapasitet for håndball-utholdenheten.',
    steps:[{ id:'s1', name:'Steg 1', description:'30 min jogg 65–70% makspuls' }, { id:'s2', name:'Steg 2', description:'Alternativt: 3×10 min jogg, 1 min gå-pause' }, { id:'s3', name:'Steg 3', description:'Du skal KUNNE snakke' }, { id:'s4', name:'Steg 4', description:'Øk 10% per uke' }],
    tips:['Aerob grunnlag støtter alt annet i håndball','Variér underlag','Ikke løp for fort — du trener feil system','Kombiner med ball-øvelser om ønskelig'],
    equipment:['Ingen spesialutstyr'], ageGroup: 'adult' },

  { id:'hb-f10', sport:'handball', category:'fysisk', name:'Håndball-spesifikt HIIT', duration:25, players:'alle', difficulty:'avansert',
    description:'HIIT-protokoll tilpasset håndball: kast, sprint, forsvar i serie.',
    steps:[{ id:'s1', name:'Steg 1', description:'30 sek: sprint + kast (5 kast i rad)' }, { id:'s2', name:'Steg 2', description:'15 sek pause' }, { id:'s3', name:'Steg 3', description:'30 sek: defensiv sidestep' }, { id:'s4', name:'Steg 4', description:'15 sek pause' }, { id:'s5', name:'Steg 5', description:'30 sek: burpee + hopp' }, { id:'s6', name:'Steg 6', description:'15 sek pause; 5 runder' }],
    tips:['Håndball-HIIT: kombinerer alle elementer','Hold kasteknikk god under belastning','ALLE 30 sek: maksimal innsats','Registrer antall kast per runde for fremgang'],
    equipment:['Handball','Mål','Kjegler'], ageGroup: 'adult' },

];

// ════════════════════════════════════════════════════════════════
//  KOMBINERT BIBLIOTEK OG HJELPEFUNKSJONER
// ════════════════════════════════════════════════════════════════

export const HANDBALL_DRILLS: DrillExercise[] = [];
export const ALL_DRILLS: DrillExercise[] = [...FOOTBALL_DRILLS, ...HANDBALL_DRILLS];

export function getDrillsBySport(sport: DrillSport): DrillExercise[] {
  return ALL_DRILLS.filter(d => d.sport === sport);
}

export function getDrillsByCategory(sport: DrillSport, category: DrillCategory): DrillExercise[] {
  return ALL_DRILLS.filter(d => d.sport === sport && d.category === category);
}

export function getISOWeek(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
}

const VALID_CATEGORIES = ['offensivt','defensivt','hele_laget','keeper','fysisk'];

export function getWeeklyDrills(sport: DrillSport, categoryOrGroup?: DrillCategory | string): DrillExercise[] {
  const cat = (categoryOrGroup && VALID_CATEGORIES.includes(categoryOrGroup))
    ? categoryOrGroup as DrillCategory : undefined;
  const pool = cat ? getDrillsByCategory(sport, cat) : getDrillsBySport(sport);
  if (pool.length === 0) return [];
  const offset = getISOWeek() % pool.length;
  const result: DrillExercise[] = [];
  for (let i = 0; i < Math.min(4, pool.length); i++) {
    result.push(pool[(offset + i) % pool.length]);
  }
  return result;
}

export function getDrillsForContext(sport: DrillSport, categoryOrGroup?: DrillCategory | string): DrillExercise[] {
  const cat = (categoryOrGroup && VALID_CATEGORIES.includes(categoryOrGroup))
    ? categoryOrGroup as DrillCategory : undefined;
  return cat ? getDrillsByCategory(sport, cat) : getDrillsBySport(sport);
}

export const CATEGORY_LABELS: Record<DrillCategory, string> = {
  offensivt: '⚔️ Offensivt',
  defensivt: '🛡️ Defensivt',
  hele_laget: '👥 Hele laget',
  keeper: '🧤 Keepertrening',
  fysisk: '💪 Fysisk',
};

export const DRILL_LIBRARY = ALL_DRILLS;
export type Sport = DrillSport;