// ═══════════════════════════════════════════════════════════════
//  ØVELSESBIBLIOTEK — fotballøvelser
// ═══════════════════════════════════════════════════════════════

export type DrillSport = 'football' | 'all';
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
  (s === 'football5' || s === 'football7' || s === 'football9') ? 'football' : (s as DrillSport);

// ═══════════════════════════════════════════════════════════════
//  FOTBALL – OFFENSIVT (25 øvelser)
// ═══════════════════════════════════════════════════════════════

export const FOOTBALL_OFFENSIVE: DrillExercise[] = [
  { id:'fb-off-01', sport:'football', category:'offensivt', name:'Rondó 4v2', duration:15, players:'6', difficulty:'middels',
    description:'Fire spillere holder ballen mot to forsvarere. Klassisk ballbesittelsesøvelse.',
    steps:[{ id:'s1', name:'Steg 1', description:'Sett opp sirkel 8m diameter' }, { id:'s2', name:'Steg 2', description:'4 angripere rundt, 2 forsvarere inni' }, { id:'s3', name:'Steg 3', description:'Maks 2 touch' }, { id:'s4', name:'Steg 4', description:'Taper bytter med forsvarer' }],
    tips:['Flytt deg alltid','Gi vinkler','Kommuniser','Press i par'], equipment:['Kjegler','Ball'], ageGroup:'adult' },
  { id:'fb-off-02', sport:'football', category:'offensivt', name:'Pasningsfirkant 1-2 touch', duration:15, players:'4-8', difficulty:'enkel',
    description:'Spillere i firkant passer rundt. Bygger rytme og presisjon.',
    steps:[{ id:'s1', name:'Steg 1', description:'4 kjegler i 10x10m firkant' }, { id:'s2', name:'Steg 2', description:'En spiller per hjørne' }, { id:'s3', name:'Steg 3', description:'Pass til høyre med ett touch' }, { id:'s4', name:'Steg 4', description:'Løp til ballen du sendte' }],
    tips:['Hold ballen lav','Bruk innsiden av foten','Åpne kroppen før mottak'], equipment:['Kjegler','Ball'], ageGroup:'adult' },
  { id:'fb-off-03', sport:'football', category:'offensivt', name:'Veggpasning (giv-og-gå)', duration:20, players:'3-9', difficulty:'middels',
    description:'Grunnleggende angrepskombinasjon med veggpasning.',
    steps:[{ id:'s1', name:'Steg 1', description:'A passer til B' }, { id:'s2', name:'Steg 2', description:'B ett-touch tilbake til A i løp' }, { id:'s3', name:'Steg 3', description:'A leverer til C' }],
    tips:['B: ett touch alltid','A: start løpet IDET ballen går','C: bryt på riktig tidspunkt'], equipment:['Kjegler','Ball'], ageGroup:'adult' },
  { id:'fb-off-04', sport:'football', category:'offensivt', name:'Kontring 3v2', duration:20, players:'5+', difficulty:'middels',
    description:'Tre angripere mot to forsvarere. Raske beslutninger.',
    steps:[{ id:'s1', name:'Steg 1', description:'3 angripere mot 2 forsvarere' }, { id:'s2', name:'Steg 2', description:'Avslutt innen 10 sekunder' }, { id:'s3', name:'Steg 3', description:'Bytt roller' }],
    tips:['Bruk bredden','Pass mellom forsvarerne','Aldri stopp'], equipment:['Kjegler','Ball','Vester','Mål'], ageGroup:'adult' },
  { id:'fb-off-05', sport:'football', category:'offensivt', name:'Overlapp med kant', duration:20, players:'4-8', difficulty:'middels',
    description:'Back overlapper kanten for å skape 2v1 på flanken.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kant mottar' }, { id:'s2', name:'Steg 2', description:'Back løper overlapp' }, { id:'s3', name:'Steg 3', description:'Back mottar og slår innlegg' }],
    tips:['Back: start løpet tidlig','Kant: hold ballen','Back: full fart'], equipment:['Kjegler','Ball','Mål'], ageGroup:'adult' },
  { id:'fb-off-06', sport:'football', category:'offensivt', name:'Avslutning fra innlegg', duration:20, players:'5-10', difficulty:'middels',
    description:'Øver heading og volleyavslutning fra innlegg.',
    steps:[{ id:'s1', name:'Steg 1', description:'Innlegg fra flanken' }, { id:'s2', name:'Steg 2', description:'2 angripere i boksen' }, { id:'s3', name:'Steg 3', description:'Heading/volley mot mål' }],
    tips:['Beveg deg til siste øyeblikk','Øye på ballen','Angrip ballen'], equipment:['Kjegler','Ball','Mål'], ageGroup:'adult' },
  { id:'fb-off-07', sport:'football', category:'offensivt', name:'Skuddtrening fra distanse', duration:20, players:'2-10', difficulty:'middels',
    description:'Avslutninger fra 18-25 meter med korrekt teknikk.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kø 20m fra mål' }, { id:'s2', name:'Steg 2', description:'Dribble og skyt' }, { id:'s3', name:'Steg 3', description:'Bytt side' }],
    tips:['Plant foten ved siden av ballen','Støttebenet peker mot målet','Følg gjennom'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-off-08', sport:'football', category:'offensivt', name:'1v1 gjennombrudd', duration:20, players:'2-12', difficulty:'middels',
    description:'Angriper dribler forbi forsvareren og avslutter.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angriper starter 15m fra mål' }, { id:'s2', name:'Steg 2', description:'Forsvarer 3m foran' }, { id:'s3', name:'Steg 3', description:'Dribble forbi og skyt' }],
    tips:['Bruk kroppsfinte','Akselerer etter passering','Bestem deg raskt'], equipment:['Kjegler','Baller','Mål'], ageGroup:'adult' },
  { id:'fb-off-09', sport:'football', category:'offensivt', name:'Dribling med Cruyff-vending', duration:15, players:'2-15', difficulty:'enkel',
    description:'Øver Cruyff-vendingen for å snu med ball.',
    steps:[{ id:'s1', name:'Steg 1', description:'Dribble mot kjegle' }, { id:'s2', name:'Steg 2', description:'Fake innspill' }, { id:'s3', name:'Steg 3', description:'Trekk ballen bakover med innsiden' }, { id:'s4', name:'Steg 4', description:'Akselerer andre vei' }],
    tips:['Øyenkontakt med "forsvarer"','Trykk ned i underlaget','Eksplosiv start'], equipment:['Kjegler','Ball'], ageGroup:'adult' },
  { id:'fb-off-10', sport:'football', category:'offensivt', name:'Frispark direkte', duration:20, players:'3-6', difficulty:'middels',
    description:'Direkte frispark på mål fra ulike posisjoner.',
    steps:[{ id:'s1', name:'Steg 1', description:'Ball 25m fra mål' }, { id:'s2', name:'Steg 2', description:'Mur 9.15m fra ball' }, { id:'s3', name:'Steg 3', description:'Skudd over/rundt mur' }],
    tips:['Krum ballen','Plant foten bak for loft','Følg gjennom'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-off-11', sport:'football', category:'offensivt', name:'Tredjemannsløp', duration:25, players:'6-12', difficulty:'avansert',
    description:'Kombinasjon der tredje mann kommer i dybden.',
    steps:[{ id:'s1', name:'Steg 1', description:'A→B' }, { id:'s2', name:'Steg 2', description:'B→C (vegg)' }, { id:'s3', name:'Steg 3', description:'A→C i dybden' }],
    tips:['Timing avgjør alt','C må bryte i riktig øyeblikk','God forståelse'], equipment:['Kjegler','Ball','Mål'], ageGroup:'adult' },
  { id:'fb-off-12', sport:'football', category:'offensivt', name:'Kantspill og innlegg', duration:25, players:'5-10', difficulty:'middels',
    description:'Kantspillere øver innlegg fra ulike posisjoner.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kant mottar' }, { id:'s2', name:'Steg 2', description:'Dribble mot baklinjen' }, { id:'s3', name:'Steg 3', description:'Innlegg' }],
    tips:['Innlegg bak keeper','Angriperne: løp motsatt vei først','Tidlig innlegg'], equipment:['Kjegler','Ball','Mål'], ageGroup:'adult' },
  { id:'fb-off-13', sport:'football', category:'offensivt', name:'Heading mot mål', duration:15, players:'2-10', difficulty:'enkel',
    description:'Grunnleggende heading med fokus på teknikk.',
    steps:[{ id:'s1', name:'Steg 1', description:'Server kaster fra siden' }, { id:'s2', name:'Steg 2', description:'Angriper løper mot ballen' }, { id:'s3', name:'Steg 3', description:'Heading mot mål' }],
    tips:['Øynene MÅ være åpne','Pannebenet treffer','Nakken stiv'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-off-14', sport:'football', category:'offensivt', name:'Sidevendt mottak og vending', duration:15, players:'2-8', difficulty:'middels',
    description:'Midtbanespillere øver å motta sidevendt for å se begge sider.',
    steps:[{ id:'s1', name:'Steg 1', description:'Spiller i midten' }, { id:'s2', name:'Steg 2', description:'Mottaker åpner kropp' }, { id:'s3', name:'Steg 3', description:'Første touch inn til neste pasning' }],
    tips:['Snu kroppen FØR ballen ankommer','Første touch med yttersiden','Si "ja!" høyt'], equipment:['Kjegler','Ball'], ageGroup:'adult' },
  { id:'fb-off-15', sport:'football', category:'offensivt', name:'Pasningsspill i trekant', duration:15, players:'3-6', difficulty:'enkel',
    description:'Tre spillere i trekant passer ballen med 1-2 touch.',
    steps:[{ id:'s1', name:'Steg 1', description:'Sett opp trekant 5x5m' }, { id:'s2', name:'Steg 2', description:'A→B, B→C, C→A' }, { id:'s3', name:'Steg 3', description:'Øk tempo gradvis' }],
    tips:['Beveg deg etter pasning','Kall på ballen','Hold blikket oppe'], equipment:['Kjegler','Ball'], ageGroup:'adult' },
  { id:'fb-off-16', sport:'football', category:'offensivt', name:'Langpasningstrening', duration:15, players:'2-4', difficulty:'middels',
    description:'Øver på presise langpasninger over 25-30 meter.',
    steps:[{ id:'s1', name:'Steg 1', description:'Stå 25m fra hverandre' }, { id:'s2', name:'Steg 2', description:'Slå langpasning med innside' }, { id:'s3', name:'Steg 3', description:'Motta og legg tilbake' }],
    tips:['Vrista gir mer kraft','Plant foten ved siden av ballen','Følg gjennom mot mottaker'], equipment:['Baller'], ageGroup:'adult' },
  { id:'fb-off-17', sport:'football', category:'offensivt', name:'Skudd fra vinkel', duration:20, players:'2-6', difficulty:'middels',
    description:'Avslutninger fra skrå vinkel mot mål.',
    steps:[{ id:'s1', name:'Steg 1', description:'Skytter 18m fra mål i vinkel' }, { id:'s2', name:'Steg 2', description:'Skudd mot lengste hjørne' }, { id:'s3', name:'Steg 3', description:'Skudd mot nærmeste hjørne' }],
    tips:['Sikt mot stolpen','Skru ballen innover','Juster vinkel'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-off-18', sport:'football', category:'offensivt', name:'Volleyavslutning', duration:20, players:'2-6', difficulty:'avansert',
    description:'Øver volley og halvvolley avslutninger mot mål.',
    steps:[{ id:'s1', name:'Steg 1', description:'Server fra luften' }, { id:'s2', name:'Steg 2', description:'Volley på mål' }, { id:'s3', name:'Steg 3', description:'Halvvolley etter stuss' }],
    tips:['Følg ballen hele veien','Hold ankelen låst','Treff midt på ballen'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-off-19', sport:'football', category:'offensivt', name:'Friløp og timing i dybden', duration:20, players:'4-8', difficulty:'middels',
    description:'Angripere øver timing av løpet bak forsvarslinjen.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angriper 5m foran forsvarslinja' }, { id:'s2', name:'Steg 2', description:'Midtbane slår dybdeball' }, { id:'s3', name:'Steg 3', description:'Angriper: motta og avslutt' }],
    tips:['Løpet starter ETTER ballen er slått','Sprint mot ballen','Midtbane: se skulderens posisjon'], equipment:['Baller','Kjegler','Mål'], ageGroup:'adult' },
  { id:'fb-off-20', sport:'football', category:'offensivt', name:'Slalåmdribling', duration:15, players:'2-10', difficulty:'enkel',
    description:'Dribling gjennom kjegler med begge føtter.',
    steps:[{ id:'s1', name:'Steg 1', description:'Sett opp 6-8 kjegler' }, { id:'s2', name:'Steg 2', description:'Drible slalåm' }, { id:'s3', name:'Steg 3', description:'Øk fart gradvis' }],
    tips:['Ballen tett til foten','Bruk oversiden av foten','Løft blikket'], equipment:['Kjegler','Baller'], ageGroup:'adult' },
  { id:'fb-off-21', sport:'football', category:'offensivt', name:'Step-over finte', duration:15, players:'2-8', difficulty:'middels',
    description:'Øver step-over finte for å lure forsvarer.',
    steps:[{ id:'s1', name:'Steg 1', description:'Dribble mot kjegle' }, { id:'s2', name:'Steg 2', description:'Step-over med høyre fot' }, { id:'s3', name:'Steg 3', description:'Dra ballen med venstre' }],
    tips:['Flytt vekten på steget','Akselerer etter finten','Gjør den rask'], equipment:['Kjegler','Baller'], ageGroup:'adult' },
  { id:'fb-off-22', sport:'football', category:'offensivt', name:'Elastico finte', duration:20, players:'2-6', difficulty:'avansert',
    description:'Øver Elastico-finten (flip-flap).',
    steps:[{ id:'s1', name:'Steg 1', description:'Dribble sakte' }, { id:'s2', name:'Steg 2', description:'Dytt ballen ut med utsiden' }, { id:'s3', name:'Steg 3', description:'Trekk raskt inn med innsiden' }],
    tips:['Rask overgang er nøkkelen','Trening foran speil','Krevende teknikk'], equipment:['Baller'], ageGroup:'adult' },
  { id:'fb-off-23', sport:'football', category:'offensivt', name:'Kryss i bakrom', duration:20, players:'4-8', difficulty:'middels',
    description:'To angripere krysser løp i bakrom.',
    steps:[{ id:'s1', name:'Steg 1', description:'Midtbane har ball' }, { id:'s2', name:'Steg 2', description:'Angripere krysser' }, { id:'s3', name:'Steg 3', description:'Pasning i rommet' }],
    tips:['Kryss på 45 grader','Forsvarere blir forvirret','Timing er viktig'], equipment:['Kjegler','Ball','Mål'], ageGroup:'adult' },
  { id:'fb-off-24', sport:'football', category:'offensivt', name:'Spille bakre stolpe', duration:20, players:'4-8', difficulty:'middels',
    description:'Trening på innlegg til bakre stolpe.',
    steps:[{ id:'s1', name:'Steg 1', description:'Innlegg fra høyre' }, { id:'s2', name:'Steg 2', description:'Angriper ved bakre' }, { id:'s3', name:'Steg 3', description:'Heading/volley' }],
    tips:['Løp rundt forsvarer','Vinkelløp','Siste øyeblikks avgjørelse'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-off-25', sport:'football', category:'offensivt', name:'Innlegg fra dybden', duration:20, players:'4-8', difficulty:'avansert',
    description:'Innlegg fra dyp posisjon (tidlig innlegg).',
    steps:[{ id:'s1', name:'Steg 1', description:'Ball ved midtbane' }, { id:'s2', name:'Steg 2', description:'Tidlig innlegg' }, { id:'s3', name:'Steg 3', description:'Løp i bakrom' }],
    tips:['Overraske forsvar','Lese spissens løp','Forsvar baklengs'], equipment:['Baller','Mål'], ageGroup:'adult' },
];

// ═══════════════════════════════════════════════════════════════
//  FOTBALL – DEFENSIVT (25 øvelser)
// ═══════════════════════════════════════════════════════════════

export const FOOTBALL_DEFENSIVE: DrillExercise[] = [
  { id:'fb-def-01', sport:'football', category:'defensivt', name:'1v1 forsvar — posisjon og timing', duration:20, players:'2-12', difficulty:'middels',
    description:'Forsvareren øver korrekt posisjon, vinkel og glidetakling.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angriper mot forsvarer i kanal' }, { id:'s2', name:'Steg 2', description:'Forsvarer: sett press men hold form' }, { id:'s3', name:'Steg 3', description:'Vent på feil fra angriper' }],
    tips:['Tyngdepunktet lavt','En fots avstand','Styr mot hjørnet'], equipment:['Kjegler','Baller'], ageGroup:'adult' },
  { id:'fb-def-02', sport:'football', category:'defensivt', name:'Press-signal og høyt press', duration:20, players:'6-11', difficulty:'middels',
    description:'Koordinert høyt press utløst av signal.',
    steps:[{ id:'s1', name:'Steg 1', description:'Oppbygging 4-back mot 4 angripere' }, { id:'s2', name:'Steg 2', description:'Trener passer ball til bestemt spiller' }, { id:'s3', name:'Steg 3', description:'Nærmeste presser direkte' }],
    tips:['Press i 45°','Dekk nabopassningen','Aldri press alene'], equipment:['Kjegler','Baller','Vester'], ageGroup:'adult' },
  { id:'fb-def-03', sport:'football', category:'defensivt', name:'Back-4 komprimering', duration:25, players:'6-8', difficulty:'avansert',
    description:'Firerbacken øver å komprimere sone og glide som en enhet.',
    steps:[{ id:'s1', name:'Steg 1', description:'4 forsvarere på linja' }, { id:'s2', name:'Steg 2', description:'Trener passer ball til ulike punkter' }, { id:'s3', name:'Steg 3', description:'Back-4 glider mot ballen' }],
    tips:['Innerback: dekker sentralt','Ytterback: presser kant','Aldri bredere enn nødvendig'], equipment:['Kjegler','Vester','Baller'], ageGroup:'adult' },
  { id:'fb-def-04', sport:'football', category:'defensivt', name:'Gegenpressing etter balltap', duration:20, players:'6-8', difficulty:'avansert',
    description:'Umiddelbar gjenvinning innen 3 sekunder etter balltap.',
    steps:[{ id:'s1', name:'Steg 1', description:'5v5 + keeper' }, { id:'s2', name:'Steg 2', description:'Trener piper = balltap' }, { id:'s3', name:'Steg 3', description:'Alle presser mot ballen' }],
    tips:['Nærmeste: press direkte','Andre: kutt pasningsalternativet','Etter 5 sek: organiser forsvar'], equipment:['Kjegler','Vester','Baller'], ageGroup:'adult' },
  { id:'fb-def-05', sport:'football', category:'defensivt', name:'Offsidefellen', duration:20, players:'5-9', difficulty:'avansert',
    description:'Back-4 øver koordinert offsidefelle.',
    steps:[{ id:'s1', name:'Steg 1', description:'4 backer stiller opp' }, { id:'s2', name:'Steg 2', description:'Keeper/back roper "step"' }, { id:'s3', name:'Steg 3', description:'Alle 4 løper fremover simultant' }],
    tips:['Alle MÅ løpe samtidig','Innerback roper kommandoen','Aldri step ved lavball'], equipment:['Kjegler','Baller'], ageGroup:'adult' },
  { id:'fb-def-06', sport:'football', category:'defensivt', name:'Forsvare innlegg', duration:20, players:'4-7', difficulty:'middels',
    description:'Back øver korrekt posisjon mot innlegg fra flanken.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kant på flanken' }, { id:'s2', name:'Steg 2', description:'Back setter press og kanaliserer' }, { id:'s3', name:'Steg 3', description:'Back: finn angriperen (ikke ballen)' }],
    tips:['Prioritet: finn angriperen','Aldri vend ryggen til ballen','Kommuniser med keeper'], equipment:['Kjegler','Baller','Mål'], ageGroup:'adult' },
  { id:'fb-def-07', sport:'football', category:'defensivt', name:'Sentralt forsvar 2v2', duration:20, players:'4-8', difficulty:'middels',
    description:'To forsvarere mot to angripere i trang sone.',
    steps:[{ id:'s1', name:'Steg 1', description:'Firkant 12x12m; 2v2' }, { id:'s2', name:'Steg 2', description:'Angriperne: hold ballen 60 sek' }, { id:'s3', name:'Steg 3', description:'Forsvarerne: gjenvinne' }],
    tips:['Presser: vinkel','Dekk nabopassningen','Max 3m mellom forsvarerne'], equipment:['Kjegler','Baller','Vester'], ageGroup:'adult' },
  { id:'fb-def-08', sport:'football', category:'defensivt', name:'Forsvare hjørnespark', duration:15, players:'8-11', difficulty:'middels',
    description:'Øver forsvar av hjørnespark: zonal + mannmarkering.',
    steps:[{ id:'s1', name:'Steg 1', description:'3 i zonal marking på 5m-boksen' }, { id:'s2', name:'Steg 2', description:'2 man-marker farlige angripere' }, { id:'s3', name:'Steg 3', description:'Keeper kommanderer' }],
    tips:['Keeper eier feltet foran 5m','Zona: hold posisjonen','Man-marker: hold FORAN angriperen'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-def-09', sport:'football', category:'defensivt', name:'Lav blokkering 5-4-1', duration:25, players:'10-11', difficulty:'avansert',
    description:'Lav blokk i 5-4-1 mot ballbesittende motstand.',
    steps:[{ id:'s1', name:'Steg 1', description:'Lag i 5-4-1 i eget halvplan' }, { id:'s2', name:'Steg 2', description:'Motstand har ball' }, { id:'s3', name:'Steg 3', description:'Laget holder kompakt blokk' }],
    tips:['5-4-1: kompakt','Midtbane 4: hold linja','Spissen: kanaliser mot en side'], equipment:['Kjegler','Vester','Baller'], ageGroup:'adult' },
  { id:'fb-def-10', sport:'football', category:'defensivt', name:'Dobbelpress og gjenvinning', duration:15, players:'4-8', difficulty:'middels',
    description:'To spillere samarbeider om å vinne ballen.',
    steps:[{ id:'s1', name:'Steg 1', description:'1 angriper mot 2 forsvarere' }, { id:'s2', name:'Steg 2', description:'Første presser og kanaliserer' }, { id:'s3', name:'Steg 3', description:'Andre venter og tar ballen' }],
    tips:['Press alltid med én','Den som venter: 3m bak','Signal "nå!"'], equipment:['Kjegler','Baller'], ageGroup:'adult' },
  { id:'fb-def-11', sport:'football', category:'defensivt', name:'Midtbane-blokkering', duration:15, players:'4-8', difficulty:'middels',
    description:'Midtbane-trekant blokkerer pasninger mellom linjene.',
    steps:[{ id:'s1', name:'Steg 1', description:'3 midtbanespillere i trekant' }, { id:'s2', name:'Steg 2', description:'2 angripere prøver å passere' }, { id:'s3', name:'Steg 3', description:'Trekanten forflyttes som enhet' }],
    tips:['Beveg deg som én enhet','Komprimer mot ballen','Kommuniser hvem som presser'], equipment:['Kjegler','Baller','Vester'], ageGroup:'adult' },
  { id:'fb-def-12', sport:'football', category:'defensivt', name:'Dekke løp i dybden', duration:20, players:'4-8', difficulty:'middels',
    description:'Forsvareren øver å dekke løp i dybden.',
    steps:[{ id:'s1', name:'Steg 1', description:'Forsvarer og angriper side ved side' }, { id:'s2', name:'Steg 2', description:'Signal: angriper sprinter dypt' }, { id:'s3', name:'Steg 3', description:'Forsvarer: følg men hold avstand' }],
    tips:['Se angriperen OG ballen','Aldri la angriperen løpe bak ryggen','Keeper: si "hold"'], equipment:['Kjegler','Baller','Mål'], ageGroup:'adult' },
  { id:'fb-def-13', sport:'football', category:'defensivt', name:'Pressing 4-3-3 med triggere', duration:25, players:'9-11', difficulty:'avansert',
    description:'Øver koordinerte pressing-triggere i 4-3-3.',
    steps:[{ id:'s1', name:'Steg 1', description:'Lag i 4-3-3' }, { id:'s2', name:'Steg 2', description:'Trener slår ball til bestemt posisjon' }, { id:'s3', name:'Steg 3', description:'Nærmeste angriper presser direkte' }],
    tips:['Triggere: ball til back/dårlig touch','Presser: kanaliser mot ytterlinjen','Tren en trigger om gangen'], equipment:['Kjegler','Vester','Baller'], ageGroup:'adult' },
  { id:'fb-def-14', sport:'football', category:'defensivt', name:'Covering og sone-forsvar', duration:25, players:'7-11', difficulty:'avansert',
    description:'Sonebasert dekning. Alle eier et område.',
    steps:[{ id:'s1', name:'Steg 1', description:'4-4 mot 6 angripere' }, { id:'s2', name:'Steg 2', description:'Forsvarslinjene dekker soner' }, { id:'s3', name:'Steg 3', description:'Angripere løper inn og ut' }],
    tips:['Du eier et område','Kommuniser "din" og "min"','Aldri la to dekke samme sone'], equipment:['Kjegler','Vester','Baller'], ageGroup:'adult' },
  { id:'fb-def-15', sport:'football', category:'defensivt', name:'Forsvar ved overgang', duration:20, players:'7-11', difficulty:'avansert',
    description:'Laget reorganiserer ved balltap til defensiv 4-4-2.',
    steps:[{ id:'s1', name:'Steg 1', description:'Lag i angrepposisjon' }, { id:'s2', name:'Steg 2', description:'Signal: balltap' }, { id:'s3', name:'Steg 3', description:'Alle løper tilbake til 4-4-2' }],
    tips:['Designert back løper umiddelbart','Midtbane: løp til posisjon','Tren til det er automatisk'], equipment:['Kjegler','Baller','Vester'], ageGroup:'adult' },
  { id:'fb-def-16', sport:'football', category:'defensivt', name:'Kanalisering utover', duration:15, players:'2-6', difficulty:'middels',
    description:'Tvinge angriper ut mot sidelinjen.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angriper sentralt' }, { id:'s2', name:'Steg 2', description:'Forsvarer vinkler' }, { id:'s3', name:'Steg 3', description:'Tving ut' }],
    tips:['Stå skrått','Blokker innersving','Styr mot flagg'], equipment:['Kjegler','Baller'], ageGroup:'adult' },
  { id:'fb-def-17', sport:'football', category:'defensivt', name:'Jockey-teknikk', duration:15, players:'2-6', difficulty:'middels',
    description:'Lære jockey-teknikk (sidesteg baklengs).',
    steps:[{ id:'s1', name:'Steg 1', description:'Sidesteg baklengs' }, { id:'s2', name:'Steg 2', description:'Hold avstand' }, { id:'s3', name:'Steg 3', description:'Ikke stikk bein' }],
    tips:['Lavt tyngdepunkt','Ikke kryss beina','Tålmodighet'], equipment:['Kjegler'], ageGroup:'adult' },
  { id:'fb-def-18', sport:'football', category:'defensivt', name:'Forsvar 2v1 overtall', duration:15, players:'3-9', difficulty:'middels',
    description:'To forsvarere mot én angriper.',
    steps:[{ id:'s1', name:'Steg 1', description:'1 angriper vs 2 forsvarere' }, { id:'s2', name:'Steg 2', description:'En presser' }, { id:'s3', name:'Steg 3', description:'Den andre: backing og blokkerer' }],
    tips:['2v1: aldri la angriperen velge','Press den svake siden','Gjenvinning = kontring'], equipment:['Kjegler','Baller'], ageGroup:'adult' },
  { id:'fb-def-19', sport:'football', category:'defensivt', name:'Forsvar langball fra back', duration:20, players:'4-8', difficulty:'middels',
    description:'Forsvarere øver å forsvare mot direktespill med lang ball.',
    steps:[{ id:'s1', name:'Steg 1', description:'Motstandens back slår lang ball' }, { id:'s2', name:'Steg 2', description:'Innerback vinner heading' }, { id:'s3', name:'Steg 3', description:'Clearance til kant' }],
    tips:['Innerback: ta ansvar for luftdueller','Heading: angrip ballen aktivt','Clearance til kanten'], equipment:['Baller','Kjegler','Mål'], ageGroup:'adult' },
  { id:'fb-def-20', sport:'football', category:'defensivt', name:'Kontring-stopp 1v1', duration:15, players:'2-10', difficulty:'middels',
    description:'Forsvarspilleren stopper kontringsangriper 1v1.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angriper i full fart mot mål' }, { id:'s2', name:'Steg 2', description:'Forsvarer løper parallelt' }, { id:'s3', name:'Steg 3', description:'Vinner duellen ved 16m' }],
    tips:['Hold skulderen foran','Press mot svak fot','Glidtak kun om du er sikker'], equipment:['Baller','Kjegler','Mål'], ageGroup:'adult' },
  { id:'fb-def-21', sport:'football', category:'defensivt', name:'Forsvare overlapp', duration:20, players:'4-8', difficulty:'middels',
    description:'Forsvarerne koordinerer mot overlapp-angrep.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kant + overlappende back' }, { id:'s2', name:'Steg 2', description:'Forsvarerne: hvem tar kant, hvem tar back' }, { id:'s3', name:'Steg 3', description:'Forhindre innlegg' }],
    tips:['Ytterback: ta overlappende back','Innerback: følger kanten inn','Kommuniser "min!" og "din!"'], equipment:['Kjegler','Baller','Vester'], ageGroup:'adult' },
  { id:'fb-def-22', sport:'football', category:'defensivt', name:'Pressing fra spissene', duration:20, players:'7-11', difficulty:'avansert',
    description:'Spissene initierer pressing høyt og tvinger feil.',
    steps:[{ id:'s1', name:'Steg 1', description:'2 spisser initierer press' }, { id:'s2', name:'Steg 2', description:'Presser motstanderens back-4' }, { id:'s3', name:'Steg 3', description:'Tvinger feil fra back eller keeper' }],
    tips:['Spiss 1: presser mot ballen','Spiss 2: blokkerer sentralt','Løpet: bue mot ytterlinjen'], equipment:['Kjegler','Vester','Baller'], ageGroup:'adult' },
  { id:'fb-def-23', sport:'football', category:'defensivt', name:'Forsvare 4v4 med keepere', duration:25, players:'10', difficulty:'middels',
    description:'4v4 med keepere på halvbane. Defensiv organisering.',
    steps:[{ id:'s1', name:'Steg 1', description:'4v4 + 2 keepere' }, { id:'s2', name:'Steg 2', description:'Fritt spill' }, { id:'s3', name:'Steg 3', description:'Fokus: defensiv komprimering' }],
    tips:['4-mann komprimerer mot ball','Keeper: kommuniser','Bytt lag hvert 5. min'], equipment:['Kjegler','Baller','Vester','Mål'], ageGroup:'adult' },
  { id:'fb-def-24', sport:'football', category:'defensivt', name:'Forsvarets balluttak', duration:15, players:'4-8', difficulty:'enkel',
    description:'Forsvarere øver sikre balluttak under press.',
    steps:[{ id:'s1', name:'Steg 1', description:'Forsvarer med ball under press' }, { id:'s2', name:'Steg 2', description:'Velg sikker pasning' }, { id:'s3', name:'Steg 3', description:'Aldri pass gjennom midten' }],
    tips:['Under press: enkel og sikker','Spill aldri ut gjennom midten under press','Clearance fremfor risiko'], equipment:['Baller','Kjegler','Vester'], ageGroup:'adult' },
  { id:'fb-def-25', sport:'football', category:'defensivt', name:'Keeper-back kommunikasjon', duration:15, players:'3-6', difficulty:'enkel',
    description:'Keeper og back øver kommunikasjon og koordinering.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper + 2 backer' }, { id:'s2', name:'Steg 2', description:'Keeper kommanderer "din!" og "min!"' }, { id:'s3', name:'Steg 3', description:'Back responderer og løper' }],
    tips:['Keeper: tidlig og tydelig kommando','Back: reagerer umiddelbart','Bruk navn alltid'], equipment:['Baller','Mål'], ageGroup:'adult' },
];

// ═══════════════════════════════════════════════════════════════
//  FOTBALL – HELE LAGET (20 øvelser)
// ═══════════════════════════════════════════════════════════════

export const FOOTBALL_TEAM: DrillExercise[] = [
  { id:'fb-team-01', sport:'football', category:'hele_laget', name:'11v11 taktikkspill', duration:40, players:'22', difficulty:'avansert',
    description:'Fullt 11 mot 11 med fokus på ett taktisk tema.',
    steps:[{ id:'s1', name:'Steg 1', description:'Fullt lag i kamp-utstyr' }, { id:'s2', name:'Steg 2', description:'Fokus: ett taktisk tema' }, { id:'s3', name:'Steg 3', description:'Trener stopper og korrigerer' }],
    tips:['Stopp og demonstrer','Fokuser på ÉN ting','Bruk video om mulig'], equipment:['Fullt mål','Baller','Vester'], ageGroup:'adult' },
  { id:'fb-team-02', sport:'football', category:'hele_laget', name:'Oppvarming med ball', duration:15, players:'alle', difficulty:'enkel',
    description:'Strukturert oppvarming: pasning, bevegelse, dynamiske strekk.',
    steps:[{ id:'s1', name:'Steg 1', description:'2 min lett jogg' }, { id:'s2', name:'Steg 2', description:'Pasning i par i bevegelse' }, { id:'s3', name:'Steg 3', description:'Dynamiske strekk' }],
    tips:['Aldri strekk kaldt','Kommuniser fra start','Øk intensitet gradvis'], equipment:['Baller','Kjegler'], ageGroup:'adult' },
  { id:'fb-team-03', sport:'football', category:'hele_laget', name:'Posisjonsspill halvbane 6v6', duration:25, players:'12+', difficulty:'middels',
    description:'Seks mot seks med mål. Fritt spill kobler ferdigheter til taktikk.',
    steps:[{ id:'s1', name:'Steg 1', description:'6v6 på halvbane med keepere' }, { id:'s2', name:'Steg 2', description:'Fritt spill 5 min' }, { id:'s3', name:'Steg 3', description:'Trener stopper og korrigerer' }],
    tips:['La spillerne gjøre feil','Begrensning: f.eks. 2 touch','Inkludér keepere'], equipment:['Kjegler','Baller','Vester','Mål'], ageGroup:'adult' },
  { id:'fb-team-04', sport:'football', category:'hele_laget', name:'Sett-stykke trening', duration:25, players:'11', difficulty:'middels',
    description:'Hjørnespark og frispark-varianter. Angrep og forsvar.',
    steps:[{ id:'s1', name:'Steg 1', description:'Øv 5 hjørnespark-varianter' }, { id:'s2', name:'Steg 2', description:'Øv 3 frispark-varianter' }, { id:'s3', name:'Steg 3', description:'Legg inn passive motstandere' }],
    tips:['Alle MÅ huske sin oppgave','Standardspill avgjør 30% av mål','Keeper: ta kommandoen høyt'], equipment:['Baller','Mål','Kjegler'], ageGroup:'adult' },
  { id:'fb-team-05', sport:'football', category:'hele_laget', name:'Overgang angrep-forsvar', duration:25, players:'10-14', difficulty:'avansert',
    description:'Umiddelbar omstilling fra angrep til forsvar ved balltap.',
    steps:[{ id:'s1', name:'Steg 1', description:'8v8 på halvbane' }, { id:'s2', name:'Steg 2', description:'Score/tap = umiddelbar omstilling' }, { id:'s3', name:'Steg 3', description:'Forsvar: reorganiser til 4-4 på 3 sek' }],
    tips:['Bestem én omstillingsprinsipp','Kommuniser "vi mistet!"','Under 3 sek'], equipment:['Kjegler','Baller','Vester','Mål'], ageGroup:'adult' },
  { id:'fb-team-06', sport:'football', category:'hele_laget', name:'Kondisjonsspill 5v5 høyt press', duration:25, players:'10', difficulty:'middels',
    description:'Intenst 5v5 med krav om å trykke høyt.',
    steps:[{ id:'s1', name:'Steg 1', description:'5v5 på 40x25m' }, { id:'s2', name:'Steg 2', description:'Laget som mister presser umiddelbart' }, { id:'s3', name:'Steg 3', description:'Maks 3 touch' }],
    tips:['Bytt lag etter tredje periode','Begge lag MÅ alltid presse','Registrer poeng'], equipment:['Kjegler','Baller','Vester','2 mål'], ageGroup:'adult' },
  { id:'fb-team-07', sport:'football', category:'hele_laget', name:'Pasningsbevegelse i 3-linjer', duration:20, players:'9-11', difficulty:'middels',
    description:'Lag øver struktur i tre linjer og kommunikasjon.',
    steps:[{ id:'s1', name:'Steg 1', description:'4 back, 3 midtbane, 3 front' }, { id:'s2', name:'Steg 2', description:'Keeper starter' }, { id:'s3', name:'Steg 3', description:'Spill frem: back → midtbane → front' }],
    tips:['Aldri hopp en linje','Midtbane: beveg deg alltid','Se på linjeseparasjonen'], equipment:['Baller','Kjegler','Vester'], ageGroup:'adult' },
  { id:'fb-team-08', sport:'football', category:'hele_laget', name:'Treningskamp med taktisk fokus', duration:60, players:'14-22', difficulty:'avansert',
    description:'Treningskamp der ett taktisk punkt evalueres.',
    steps:[{ id:'s1', name:'Steg 1', description:'11v11' }, { id:'s2', name:'Steg 2', description:'Fokus: ett taktisk tema' }, { id:'s3', name:'Steg 3', description:'Trener stopper maks 5 ganger' }],
    tips:['Fokuser kun på temaet','Demonstrer ved typiske feil','La kaptein ta ansvar'], equipment:['Baller','Vester','Mål'], ageGroup:'adult' },
  { id:'fb-team-09', sport:'football', category:'hele_laget', name:'Psykisk presstrening', duration:25, players:'10-14', difficulty:'avansert',
    description:'Spillere øver under press: trange begrensninger, regler endres.',
    steps:[{ id:'s1', name:'Steg 1', description:'8v8: 1-touch max' }, { id:'s2', name:'Steg 2', description:'Timer: 5 sek per berøring' }, { id:'s3', name:'Steg 3', description:'Trener endrer regler underveis' }],
    tips:['Psykisk trening: tilpasning er nøkkelen','Feil er OK — lær raskt','Trener: endrer regler for å skape ubehag'], equipment:['Kjegler','Baller','Vester'], ageGroup:'adult' },
  { id:'fb-team-10', sport:'football', category:'hele_laget', name:'Formasjonell angrepstrening 11v0', duration:30, players:'11', difficulty:'avansert',
    description:'Fullt lag øver angrep i formasjon uten motstand.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper starter med ball' }, { id:'s2', name:'Steg 2', description:'Spill opp via back → midtbane → front' }, { id:'s3', name:'Steg 3', description:'Fokus: rotasjoner, løpsmønstre' }],
    tips:['Lytt etter kommunikasjon','Alle beveger seg','Fokuser på ÉN ting'], equipment:['Baller','Kjegler','Mål'], ageGroup:'adult' },
  { id:'fb-team-11', sport:'football', category:'hele_laget', name:'7v7 spillende trening', duration:30, players:'14', difficulty:'middels',
    description:'7v7 med keepere og mål. Fokus på samspill og tempo.',
    steps:[{ id:'s1', name:'Steg 1', description:'7v7 på 60x40m' }, { id:'s2', name:'Steg 2', description:'Fritt spill 10 min' }, { id:'s3', name:'Steg 3', description:'Trener legger til tema' }],
    tips:['Fokuser på ÉTT tema','La spillerne ta avgjørelser','Ingen unødvendige stopp'], equipment:['Baller','Vester','Mål','Kjegler'], ageGroup:'adult' },
  { id:'fb-team-12', sport:'football', category:'hele_laget', name:'Overgangsspill 4+4v4+4', duration:25, players:'16', difficulty:'avansert',
    description:'Raskt overgangsspill med fire spillere i reserve.',
    steps:[{ id:'s1', name:'Steg 1', description:'4v4 på banen, 4+4 på sidene' }, { id:'s2', name:'Steg 2', description:'Score: lag bytter med reserve' }, { id:'s3', name:'Steg 3', description:'Umiddelbare bytter' }],
    tips:['Overgangsspill: test omstillingsevne','Reservene er alltid klare','Byttet er raskt'], equipment:['Baller','Vester','Kjegler','2 mål'], ageGroup:'adult' },
  { id:'fb-team-13', sport:'football', category:'hele_laget', name:'Keeper-pluss-10 kombinasjon', duration:20, players:'11', difficulty:'middels',
    description:'Keeper inkludert i alle angrepskjeder.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper med ball' }, { id:'s2', name:'Steg 2', description:'Starter oppbygging' }, { id:'s3', name:'Steg 3', description:'10 utespillere kombinerer' }],
    tips:['Keeper er spiller nr 11','Distribuer med hendene ved press','Øv begge sider'], equipment:['Baller','Kjegler','Mål'], ageGroup:'adult' },
  { id:'fb-team-14', sport:'football', category:'hele_laget', name:'Kamp-forberedelse dagene før', duration:30, players:'11', difficulty:'middels',
    description:'Lett treningsøkt dagen før kamp. Teknisk og taktisk gjennomgang.',
    steps:[{ id:'s1', name:'Steg 1', description:'Lett oppvarming' }, { id:'s2', name:'Steg 2', description:'Pasningsspill 10 min' }, { id:'s3', name:'Steg 3', description:'Dødball-gjennomgang' }],
    tips:['Dagen før: lett og positivt','Ingen intensive løp','Fokus på mentalt forberedelse'], equipment:['Baller','Mål','Kjegler'], ageGroup:'adult' },
  { id:'fb-team-15', sport:'football', category:'hele_laget', name:'Avslutningstrening — alle skyter', duration:20, players:'11', difficulty:'enkel',
    description:'Alle spillere øver avslutning.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kø fra midtsirkelen' }, { id:'s2', name:'Steg 2', description:'Pasning fra back og avslutning' }, { id:'s3', name:'Steg 3', description:'Varier: fra venstre, høyre, senter' }],
    tips:['Alle skyter — ikke bare spissene','Back-spillere trenger avslutning også','Konkurranse: hvem scorer flest'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-team-16', sport:'football', category:'hele_laget', name:'Rondó konkurranse 5v2', duration:15, players:'7-14', difficulty:'middels',
    description:'5v2 Rondó med konkurranse.',
    steps:[{ id:'s1', name:'Steg 1', description:'7 spillere: 5 rundt, 2 i midten' }, { id:'s2', name:'Steg 2', description:'5 holder ballen mot 2' }, { id:'s3', name:'Steg 3', description:'Taper bytter med forsvareren' }],
    tips:['Beveg deg konstant','Triangler alltid','Kommuniser'], equipment:['Baller','Kjegler'], ageGroup:'adult' },
  { id:'fb-team-17', sport:'football', category:'hele_laget', name:'Taktisk orientering uten ball', duration:15, players:'11', difficulty:'middels',
    description:'Hele laget øver posisjonering uten ball på signal.',
    steps:[{ id:'s1', name:'Steg 1', description:'Lag i sin formasjon' }, { id:'s2', name:'Steg 2', description:'Trener roper posisjon' }, { id:'s3', name:'Steg 3', description:'Alle beveger seg til korrekt posisjon' }],
    tips:['Se hele laget i bevegelse','Kommuniser alltid','Øv alle situasjoner'], equipment:['Kjegler','Vester'], ageGroup:'adult' },
  { id:'fb-team-18', sport:'football', category:'hele_laget', name:'Hurtig angrepstrening', duration:20, players:'8-11', difficulty:'middels',
    description:'Laget øver rask overgang fra forsvar til angrep.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper distribuerer' }, { id:'s2', name:'Steg 2', description:'3 spillere kontrer' }, { id:'s3', name:'Steg 3', description:'Maks 5 sek til avslutning' }],
    tips:['Hastighet > presisjon i konter','3 pasninger maks','Avslutning alltid sist'], equipment:['Baller','Kjegler','Mål'], ageGroup:'adult' },
  { id:'fb-team-19', sport:'football', category:'hele_laget', name:'Rotasjons-spill 3-lags', duration:30, players:'9-12', difficulty:'middels',
    description:'Tre lag roterer: ett spiller, ett forsvarer, ett hviler.',
    steps:[{ id:'s1', name:'Steg 1', description:'3 lag med 3-4 spillere' }, { id:'s2', name:'Steg 2', description:'Lag 1 vs Lag 2' }, { id:'s3', name:'Steg 3', description:'Vinneren fortsetter, taperen hviler' }],
    tips:['Rotasjonsspill: holder alle aktive','Høy intensitet','Fokus på tempo'], equipment:['Baller','Kjegler','Vester','2 mål'], ageGroup:'adult' },
  { id:'fb-team-20', sport:'football', category:'hele_laget', name:'Dødball-sesjon angrep og forsvar', duration:30, players:'11', difficulty:'middels',
    description:'Fullstendig dødball-sesjon: hjørnespark, frispark, innkast.',
    steps:[{ id:'s1', name:'Steg 1', description:'Hjørnespark: angrep ×5' }, { id:'s2', name:'Steg 2', description:'Hjørnespark: forsvar ×5' }, { id:'s3', name:'Steg 3', description:'Frispark: angrep ×5' }],
    tips:['Dødball: prioriter FØR kamp','Alle husker sin rolle','Evaluer hva som fungerte'], equipment:['Baller','Mål','Kjegler','Vester'], ageGroup:'adult' },
];

// ═══════════════════════════════════════════════════════════════
//  FOTBALL – KEEPER (15 øvelser)
// ═══════════════════════════════════════════════════════════════

export const FOOTBALL_KEEPER: DrillExercise[] = [
  { id:'fb-kep-01', sport:'football', category:'keeper', name:'Reaksjonsredning fra kloss hold', duration:15, players:'2', difficulty:'middels',
    description:'Keeper øver raske reaksjoner fra 5-7m.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper i basisstilling' }, { id:'s2', name:'Steg 2', description:'Trener slår baller fra 5-7m' }, { id:'s3', name:'Steg 3', description:'Lav, middels og høye baller' }],
    tips:['Basisstilling: knær bøyd, fremover','Small shuffles mellom skudd','Dykk gjennom ballen'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-kep-02', sport:'football', category:'keeper', name:'1v1 mot keeper', duration:15, players:'2-8', difficulty:'middels',
    description:'Keeper øver 1v1: komme ut, bli stor, time beina.',
    steps:[{ id:'s1', name:'Steg 1', description:'Angriper 25m fra mål' }, { id:'s2', name:'Steg 2', description:'Dribbler alene mot keeper' }, { id:'s3', name:'Steg 3', description:'Keeper: kom ut til riktig tidspunkt' }],
    tips:['Kom UT','Timing: ut senest ved 12m','Sett deg i vinkel'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-kep-03', sport:'football', category:'keeper', name:'Utspark og distribusjon', duration:20, players:'3-6', difficulty:'enkel',
    description:'Keeper øver rask distribusjon til bestemte soner.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper redder' }, { id:'s2', name:'Steg 2', description:'Signal: trener viser side' }, { id:'s3', name:'Steg 3', description:'Kast til riktig spiller' }],
    tips:['Underarmskast: sikrere','Utspark: plant benet 20cm ved siden','Aldri distribuer mot press'], equipment:['Baller','Kjegler'], ageGroup:'adult' },
  { id:'fb-kep-04', sport:'football', category:'keeper', name:'Innlegg — komme og klatre', duration:15, players:'3-6', difficulty:'middels',
    description:'Keeper øver å komme ut og rydde innlegg.',
    steps:[{ id:'s1', name:'Steg 1', description:'Innlegger fra flanken' }, { id:'s2', name:'Steg 2', description:'Keeper: "min" eller "ikke min"' }, { id:'s3', name:'Steg 3', description:'Klatre med én arm som skjold' }],
    tips:['Rop "KEEPER!" høyt','Kom UT ved 5-11m','Fullt commitment'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-kep-05', sport:'football', category:'keeper', name:'Langskudd — posisjonering og diving', duration:15, players:'2-6', difficulty:'middels',
    description:'Keeper øver redning av harde skudd fra distanse.',
    steps:[{ id:'s1', name:'Steg 1', description:'Skyttere fra 18-22m' }, { id:'s2', name:'Steg 2', description:'Posisjon: 1m frem' }, { id:'s3', name:'Steg 3', description:'Mottaksskudd — redde rebound' }],
    tips:['Posisjon: del mål i to','Diving: skyv med nærmeste fot','Rull til siden ved landing'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-kep-06', sport:'football', category:'keeper', name:'Keeper-fotarbeid sidestep', duration:15, players:'1-2', difficulty:'enkel',
    description:'Keeper øver fotarbeid: sidestep og posisjonering i mål.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper i sentrum av mål' }, { id:'s2', name:'Steg 2', description:'Sidestep til stolpe' }, { id:'s3', name:'Steg 3', description:'Tilbake til sentrum' }],
    tips:['Sidestep: aldri kryss beina','Hold basisstilling','Lett på tærne'], equipment:['Mål'], ageGroup:'adult' },
  { id:'fb-kep-07', sport:'football', category:'keeper', name:'Keeper-grunnposisjon', duration:10, players:'1-2', difficulty:'enkel',
    description:'Øver korrekt basisstilling og vinkelberegning.',
    steps:[{ id:'s1', name:'Steg 1', description:'Ball ved ulike kanter av 16m' }, { id:'s2', name:'Steg 2', description:'Keeper: posisjoner på bisektrise' }, { id:'s3', name:'Steg 3', description:'Trener evaluerer' }],
    tips:['Bisektrise: del vinkelen i to','1-1.5m frem fra mål','Basisstilling: knær lett bøyd'], equipment:['Baller','Mål','Kjegler'], ageGroup:'adult' },
  { id:'fb-kep-08', sport:'football', category:'keeper', name:'Redning høy ball', duration:15, players:'2-4', difficulty:'middels',
    description:'Keeper øver redning av høye baller: hopp, grep og landing.',
    steps:[{ id:'s1', name:'Steg 1', description:'Server kaster høy ball' }, { id:'s2', name:'Steg 2', description:'Keeper hopper og griper' }, { id:'s3', name:'Steg 3', description:'Venstre og høyre side' }],
    tips:['Hopp: push-off fra én fot','Grep: to hender','Rop "KEEPER!"'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-kep-09', sport:'football', category:'keeper', name:'Keeper mot straffespark-serie', duration:20, players:'2-8', difficulty:'middels',
    description:'Keeper øver på straffespark-redning og mental forberedelse.',
    steps:[{ id:'s1', name:'Steg 1', description:'Kø ved 11m-merket' }, { id:'s2', name:'Steg 2', description:'Keeper: les kroppens signal' }, { id:'s3', name:'Steg 3', description:'Velg side og dykk' }],
    tips:['Ikke velg side FØR skuddet','Les støttebeinas retning','Midt-skudd stopper: dyp basisstilling'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-kep-10', sport:'football', category:'keeper', name:'Keeper-kommunikasjon', duration:15, players:'4-7', difficulty:'enkel',
    description:'Keeper øver å kommunisere med forsvarslinja.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper + 4 forsvarere' }, { id:'s2', name:'Steg 2', description:'Keeper kommanderer: "ut!", "hold!", "step!"' }, { id:'s3', name:'Steg 3', description:'Forsvarerne responderer' }],
    tips:['Tydelig og tidlig kommando','Bruk navn: "Ola, ut!"','Hold stemmen rolig under press'], equipment:['Baller','Mål','Kjegler'], ageGroup:'adult' },
  { id:'fb-kep-11', sport:'football', category:'keeper', name:'Keeper-agilitet kurs', duration:15, players:'1-2', difficulty:'middels',
    description:'Agilitets-kurs for keeper med stiger, kjegler og reaksjon.',
    steps:[{ id:'s1', name:'Steg 1', description:'Koordinasjonsstige' }, { id:'s2', name:'Steg 2', description:'Rundt 4 kjegler' }, { id:'s3', name:'Steg 3', description:'Redning av ball på slutten' }],
    tips:['Raskest mulig','Lett og eksplosiv','Gjenta 4-6 ganger'], equipment:['Stige','Kjegler','Baller','Mål'], ageGroup:'adult' },
  { id:'fb-kep-12', sport:'football', category:'keeper', name:'Keeper-skudd fra vinkel', duration:15, players:'2-6', difficulty:'middels',
    description:'Keeper øver redning fra skudd fra smal vinkel.',
    steps:[{ id:'s1', name:'Steg 1', description:'Skytter fra kant, 45° vinkel' }, { id:'s2', name:'Steg 2', description:'Keeper: kutt vinkelen' }, { id:'s3', name:'Steg 3', description:'Redde mot stolpen' }],
    tips:['Nærmere stolpen mot kanten','Ikke gi for stor gap','Stopp skudd med kropp'], equipment:['Baller','Mål','Kjegler'], ageGroup:'adult' },
  { id:'fb-kep-13', sport:'football', category:'keeper', name:'Keeper psykisk trening', duration:15, players:'1-2', difficulty:'enkel',
    description:'Keeper øver mental tilbakestilling etter slippe inn mål.',
    steps:[{ id:'s1', name:'Steg 1', description:'Keeper slipper inn mål bevisst' }, { id:'s2', name:'Steg 2', description:'Visualiser neste redning' }, { id:'s3', name:'Steg 3', description:'Reset-rutine: puste, posisjoner' }],
    tips:['Mental tilbakestilling er avgjørende','Rutine: pust dypt','Aldri heng hodet'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-kep-14', sport:'football', category:'keeper', name:'Keeper-timing ved innlegg', duration:20, players:'3-6', difficulty:'middels',
    description:'Keeper øver timing av utkomme ved innlegg.',
    steps:[{ id:'s1', name:'Steg 1', description:'Innlegger fra flanken' }, { id:'s2', name:'Steg 2', description:'Keeper: avgjør "min" eller ikke' }, { id:'s3', name:'Steg 3', description:'Tidlig beslutning: kom eller stå' }],
    tips:['Beslutning tidlig: aldri halvveis','Kom: rop tydelig','Stå: kommander back'], equipment:['Baller','Mål'], ageGroup:'adult' },
  { id:'fb-kep-15', sport:'football', category:'keeper', name:'Keeper-spilletid med fot', duration:20, players:'2-6', difficulty:'middels',
    description:'Keeper øver å spille med foten og delta i oppbygging.',
    steps:[{ id:'s1', name:'Steg 1', description:'Pasning til back fra keeper' }, { id:'s2', name:'Steg 2', description:'Back sender tilbake' }, { id:'s3', name:'Steg 3', description:'Keeper: ett touch videre' }],
    tips:['Keeper med fot: viktig','Rolig og kontrollert','Distribuer til fri side'], equipment:['Baller','Mål'], ageGroup:'adult' },
];

// ═══════════════════════════════════════════════════════════════
//  FOTBALL – FYSISK (15 øvelser)
// ═══════════════════════════════════════════════════════════════

export const FOOTBALL_PHYSICAL: DrillExercise[] = [
  { id:'fb-phy-01', sport:'football', category:'fysisk', name:'Sprintintervall 40m', duration:20, players:'alle', difficulty:'middels',
    description:'Intervalltrening med 40m-sprintserie.',
    steps:[{ id:'s1', name:'Steg 1', description:'Varm opp 10 min' }, { id:'s2', name:'Steg 2', description:'Sprint 40m ×8 rep' }, { id:'s3', name:'Steg 3', description:'Pause 60 sek' }],
    tips:['100% intensitet','Armer fremover, ikke sideveis','Eksplosiv start'], equipment:['Kjegler'], ageGroup:'adult' },
  { id:'fb-phy-02', sport:'football', category:'fysisk', name:'Koordinasjonsstige', duration:15, players:'alle', difficulty:'enkel',
    description:'Koordinasjonsstige for fotkontakt, rytme og agilitet.',
    steps:[{ id:'s1', name:'Steg 1', description:'Én fot inn hvert felt' }, { id:'s2', name:'Steg 2', description:'To fot inn hvert felt' }, { id:'s3', name:'Steg 3', description:'Side-sidepass' }],
    tips:['Lette raske steg','Løft knærne','Korrekthet FØR fart'], equipment:['Koordinasjonsstige'], ageGroup:'adult' },
  { id:'fb-phy-03', sport:'football', category:'fysisk', name:'Plyometri og eksplosive hopp', duration:20, players:'alle', difficulty:'middels',
    description:'Eksplosive hoppeøvelser for power og vertikalt hopp.',
    steps:[{ id:'s1', name:'Steg 1', description:'Squat-jump ×10' }, { id:'s2', name:'Steg 2', description:'Box-jump ×8' }, { id:'s3', name:'Steg 3', description:'Lateral bounds ×10 per side' }],
    tips:['Land alltid med bøyde knær','Pause 60-90 sek','Maksimal kraft'], equipment:['Bokser/stepper','Lavhekker'], ageGroup:'adult' },
  { id:'fb-phy-04', sport:'football', category:'fysisk', name:'HIIT-sirkel 6 stasjoner', duration:25, players:'alle', difficulty:'middels',
    description:'Seks HIIT-stasjoner à 45 sek.',
    steps:[{ id:'s1', name:'Steg 1', description:'Burpees 45 sek' }, { id:'s2', name:'Steg 2', description:'Push-ups 45 sek' }, { id:'s3', name:'Steg 3', description:'Mountain climbers 45 sek' }],
    tips:['Hold intensiteten','God teknikk viktigere enn antall','Plank: core aktiv'], equipment:['Matter'], ageGroup:'adult' },
  { id:'fb-phy-05', sport:'football', category:'fysisk', name:'Endurance-løp aerob basis', duration:30, players:'alle', difficulty:'enkel',
    description:'Rolig langt løp for aerob kapasitet.',
    steps:[{ id:'s1', name:'Steg 1', description:'30 min jogg 65-70% makspuls' }, { id:'s2', name:'Steg 2', description:'Du skal KUNNE snakke' }, { id:'s3', name:'Steg 3', description:'Øk 10% per uke' }],
    tips:['Aerob trening er grunnmuren','Ikke løp for fort','Varier underlag'], equipment:[], ageGroup:'adult' },
  { id:'fb-phy-06', sport:'football', category:'fysisk', name:'Akselerasjons-øvelse', duration:15, players:'alle', difficulty:'middels',
    description:'Eksplosiv akselerasjon fra ulike startposisjoner.',
    steps:[{ id:'s1', name:'Steg 1', description:'Fra stillstand: sprint 10m ×8' }, { id:'s2', name:'Steg 2', description:'Fra bakpedal: sprint 10m ×6' }, { id:'s3', name:'Steg 3', description:'Fra sidestep: sprint 10m ×6' }],
    tips:['Første 3 steg er avgjørende','Lav vinkel på kroppen','Armer hjelper akselerasjonen'], equipment:['Kjegler'], ageGroup:'adult' },
  { id:'fb-phy-07', sport:'football', category:'fysisk', name:'Core-trening for fotball', duration:20, players:'alle', difficulty:'middels',
    description:'Core-trening spesifikt for fotball.',
    steps:[{ id:'s1', name:'Steg 1', description:'Plank 45 sek ×3' }, { id:'s2', name:'Steg 2', description:'Side-plank 30 sek ×2' }, { id:'s3', name:'Steg 3', description:'Russian twist med ball ×20' }],
    tips:['Core er grunnlaget','Plank: aktiv hele veien','Gjør 3× per uke'], equipment:['Matter','Medisinball'], ageGroup:'adult' },
  { id:'fb-phy-08', sport:'football', category:'fysisk', name:'Styrke-program bein', duration:25, players:'alle', difficulty:'middels',
    description:'Bein-styrkeprogram for fotball.',
    steps:[{ id:'s1', name:'Steg 1', description:'Squat ×12 ×3' }, { id:'s2', name:'Steg 2', description:'Split-squat ×10 per bein ×3' }, { id:'s3', name:'Steg 3', description:'Calf raises ×15 ×3' }],
    tips:['Squat: knærne peker mot tærne','Dyp squat','Øk vekt gradvis'], equipment:['Vekter','Manualer'], ageGroup:'adult' },
  { id:'fb-phy-09', sport:'football', category:'fysisk', name:'Balanse og proprioception', duration:15, players:'alle', difficulty:'enkel',
    description:'Balanse-trening for skadeforebygging.',
    steps:[{ id:'s1', name:'Steg 1', description:'Enbens stå 30 sek ×3' }, { id:'s2', name:'Steg 2', description:'Enbens squat ×8' }, { id:'s3', name:'Steg 3', description:'Med øynene lukket 30 sek' }],
    tips:['Balanse: skadeforebygging nr 1','Start enkelt','Gjør daglig'], equipment:['Balanseplate'], ageGroup:'adult' },
  { id:'fb-phy-10', sport:'football', category:'fysisk', name:'Hamstring-trening', duration:15, players:'alle', difficulty:'middels',
    description:'Hamstring-styrke og skadeforebygging.',
    steps:[{ id:'s1', name:'Steg 1', description:'Nordisk hamstring-curl ×6 ×3' }, { id:'s2', name:'Steg 2', description:'Romanian deadlift ×10 ×3' }, { id:'s3', name:'Steg 3', description:'Glute bridge ×15 ×3' }],
    tips:['Nordisk curl: kontrollert ned','Hamstring: viktigste muskel','Gjør 2× per uke'], equipment:['Partner eller benk'], ageGroup:'adult' },
  { id:'fb-phy-11', sport:'football', category:'fysisk', name:'Shuttleløp (beep test)', duration:20, players:'alle', difficulty:'middels',
    description:'Shuttleløp for aerob og anaerob kapasitet.',
    steps:[{ id:'s1', name:'Steg 1', description:'20m shuttleløp med lydsignal' }, { id:'s2', name:'Steg 2', description:'Øk fart etter hvert nivå' }, { id:'s3', name:'Steg 3', description:'Mål: nivå 10+' }],
    tips:['Shuttleløp: best test for fotball-kondisjon','Rund kjeglene raskt','Gjør 2× i sesong'], equipment:['Kjegler','Lydspor'], ageGroup:'adult' },
  { id:'fb-phy-12', sport:'football', category:'fysisk', name:'Hurtighetsøvelse 5-5-5', duration:15, players:'alle', difficulty:'middels',
    description:'5m-5m-5m hurtighetsdrill for eksplosiv retningsskifte.',
    steps:[{ id:'s1', name:'Steg 1', description:'Sprint 5m' }, { id:'s2', name:'Steg 2', description:'Bytte retning: sprint tilbake 5m' }, { id:'s3', name:'Steg 3', description:'Bytte: sprint fremover 5m' }],
    tips:['5-5-5: spesifikt for fotball','Lavt tyngdepunkt ved retningsskifte','Plant foten hardt'], equipment:['Kjegler'], ageGroup:'adult' },
  { id:'fb-phy-13', sport:'football', category:'fysisk', name:'Reaktiv sprint med signal', duration:15, players:'alle', difficulty:'middels',
    description:'Sprint på visuelt eller auditivt signal.',
    steps:[{ id:'s1', name:'Steg 1', description:'Spillere venter på signal' }, { id:'s2', name:'Steg 2', description:'Trener gir signal' }, { id:'s3', name:'Steg 3', description:'Sprint 20m' }],
    tips:['Reaksjon: første steg avgjørende','Hold lav basisstilling','Varier type signal'], equipment:['Kjegler'], ageGroup:'adult' },
  { id:'fb-phy-14', sport:'football', category:'fysisk', name:'Fleksibilitet og bevegelighet', duration:20, players:'alle', difficulty:'enkel',
    description:'Bevegelighetsøkt for alle muskelgrupper.',
    steps:[{ id:'s1', name:'Steg 1', description:'Dynamiske strekk: 10 min' }, { id:'s2', name:'Steg 2', description:'Statiske strekk etter økt: 10 min' }, { id:'s3', name:'Steg 3', description:'Hofteåpning og rotasjon' }],
    tips:['Dynamisk FØR trening','Statisk ETTER trening','Hold 30 sek statisk strekk'], equipment:['Matter'], ageGroup:'adult' },
  { id:'fb-phy-15', sport:'football', category:'fysisk', name:'Intervall-sprint 15-15', duration:20, players:'alle', difficulty:'avansert',
    description:'15 sek sprint, 15 sek hvil.',
    steps:[{ id:'s1', name:'Steg 1', description:'Sprint 15 sek 90-95%' }, { id:'s2', name:'Steg 2', description:'Hvil 15 sek (aktiv jogg)' }, { id:'s3', name:'Steg 3', description:'Gjenta 15 ganger' }],
    tips:['15-15: krevende men effektivt','90-95% intensitet alltid','Aktiv pause, ikke stopp'], equipment:['Kjegler'], ageGroup:'adult' },
];

// ═══════════════════════════════════════════════════════════════
//  KOMBINERT BIBLIOTEK
// ═══════════════════════════════════════════════════════════════

export const FOOTBALL_DRILLS: DrillExercise[] = [
  ...FOOTBALL_OFFENSIVE,
  ...FOOTBALL_DEFENSIVE,
  ...FOOTBALL_TEAM,
  ...FOOTBALL_KEEPER,
  ...FOOTBALL_PHYSICAL,
];

export const ALL_DRILLS: DrillExercise[] = [...FOOTBALL_DRILLS];

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

const VALID_CATEGORIES = ['offensivt', 'defensivt', 'hele_laget', 'keeper', 'fysisk'];

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