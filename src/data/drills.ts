// ═══════════════════════════════════════════════════════════════
//  ØVELSESBIBLIOTEK — 200+ øvelser, fotball + håndball
//  Erstatter: src/data/drills.ts
// ═══════════════════════════════════════════════════════════════

export type DrillSport    = 'football' | 'handball';
export type DrillCategory = 'offensivt' | 'defensivt' | 'hele_laget' | 'keeper' | 'fysisk';
export type DrillDifficulty = 'enkel' | 'middels' | 'avansert';

export interface Drill {
  id:          string;
  sport:       DrillSport;
  category:    DrillCategory;
  name:        string;
  duration:    number;
  players:     string;
  difficulty:  DrillDifficulty;
  description: string;
  steps:       string[];
  tips:        string[];
  equipment:   string[];
  tags?:       string[];
}

export const FOOTBALL_DRILLS: Drill[] = [

  // ─── OFFENSIVT (20 øvelser) ──────────────────────────────────

  { id:'fb-o01', sport:'football', category:'offensivt', name:'Rondó 4v2', duration:15, players:'6', difficulty:'middels',
    description:'Fire spillere holder ballen mot to forsvarere i en sirkel. Klassisk øvelse for ballbesittelse og støttespill.',
    steps:['Sett opp sirkel Ø8m','4 angripere rundt, 2 forsvarere inni','Maks 2 touch per spiller','Taper ballen bytter med forsvareren som vant den','Mål: 20 pass uten å miste'],
    tips:['Flytt alltid — aldri stå stille','Gi vinkler bak forsvarerne','Kommuniser: kall på ballen med navn','Forsvarerne presser i par'],
    equipment:['6–8 kjegler','1 ball'] },

  { id:'fb-o02', sport:'football', category:'offensivt', name:'Pasningsfirkant 1–2-touch', duration:15, players:'4–8', difficulty:'enkel',
    description:'Spillere i firkant passer rundt med ett eller to touch. Bygger rytme, timing og presisjon.',
    steps:['4 kjegler i 10×10m firkant','En spiller per hjørne','Pass til høyre med ett touch','Etter pasning: løp til ballen du sendte','Bytt retning etter 3 min'],
    tips:['Hold ballen lav inn foran foten','Bruk innsiden for presisjon','Mottaker: åpne kroppen mot neste FØR du mottar','Øk tempo gradvis'],
    equipment:['4 kjegler','1–2 baller'] },

  { id:'fb-o03', sport:'football', category:'offensivt', name:'1v1 gjennombrudd', duration:20, players:'2–12', difficulty:'middels',
    description:'Angriper forsøker å dribble forbi forsvareren og nå mållinjen.',
    steps:['Kanal 12m bred × 18m lang','Angriper starter med ball','Forsvareren 3m foran angriperen','Angriperen: nå baklinjen','Bytt roller etter hvert gjennombrudd'],
    tips:['Bruk kroppsfinte FØR driblingen','Akselerér på full kraft etter at forsvareren er passert','Forsvareren: sett press men hold form','Bestem deg RASKT'],
    equipment:['Kjegler','Baller'] },

  { id:'fb-o04', sport:'football', category:'offensivt', name:'Veggpasning (giv-og-gå)', duration:20, players:'3–9', difficulty:'middels',
    description:'To spillere kombinerer med raske veggpasninger. Grunnleggende angrepskombo.',
    steps:['A passer til B (vegg)','B ett-touch tilbake til A i løp','A leverer til C som bryter fri','Roter roller etter 5 kombinasjoner'],
    tips:['B: aldri hold ballen — ett touch alltid','A starter løpet IDET ballen går til B','C: bryt på riktig tidspunkt','Øynene oppe — se rommet FØR du passer'],
    equipment:['Kjegler','Baller'] },

  { id:'fb-o05', sport:'football', category:'offensivt', name:'Kontring 3v2', duration:20, players:'5+', difficulty:'middels',
    description:'Tre angripere mot to forsvarere. Raske beslutninger, riktige rom.',
    steps:['3 angripere mot 2 forsvarere fra midtbanen','Angrepet starter på signal','Avslutt innen 10 sekunder','Forsvarerne samler seg sentralt','Bytt roller etter hvert angrep'],
    tips:['Midtspiller: bestem raskt','Yterspillere: løp diagonalt og gjør deg bred','Pass mellom forsvarerne er oftest riktig','Aldri stopp i kontring'],
    equipment:['Kjegler','Baller','Vester'] },

  { id:'fb-o06', sport:'football', category:'offensivt', name:'Overlappskombinasjon med kant', duration:20, players:'4–8', difficulty:'middels',
    description:'Back overlapper kanten utenfra for å skape 2v1 på flanken.',
    steps:['Kant mottar fra midtbane','Back løper overlapp utenfra','Kant holder ballen til back er forbi','Back mottar og slår innlegg'],
    tips:['Back: start løpet tidlig','Kant: hold ballen og trekk forsvareren','Back: full fart på overlappet','Innlegget: inn bak keeper, foran back'],
    equipment:['Kjegler','Baller'] },

  { id:'fb-o07', sport:'football', category:'offensivt', name:'Avslutning fra innlegg', duration:20, players:'5–10', difficulty:'middels',
    description:'Øver heading og volleyavslutning fra innlegg.',
    steps:['Innlegger ved flanken','2 angripere: fremstolpe og bakstolpe','Innlegger slår inn','Spiss ved fremstolpe angriper sin sone','Midtbane dekker bakstolpe'],
    tips:['Angripere: beveg deg til siste øyeblikk','Heading: øye på ballen, panne treffer','Bakstolpe: angrip ballen bakfra','Innlegg: bak keeper, foran back'],
    equipment:['Kjegler','Baller','Mål'] },

  { id:'fb-o08', sport:'football', category:'offensivt', name:'Fri pasningstrening (sirkulasjon)', duration:20, players:'8–11', difficulty:'avansert',
    description:'Ballbesittelse i formasjon med raske kombinasjoner og romforståelse.',
    steps:['Fullt lag i sin formasjon på halvbane','Spill 50%, deretter 75%, deretter 100%','Legg inn 4 skyggepress etter 10 min','Krav: maks 2 touch i sentrum'],
    tips:['Spillerne MÅ kommunisere hele veien','Triangler alltid','Nr. 6 er navet — alltid tilgjengelig','Yterspillere: flytt inn og ut for å skape plass til backene'],
    equipment:['Baller','Vester','Kjegler'] },

  { id:'fb-o09', sport:'football', category:'offensivt', name:'Skuddtrening fra distanse', duration:20, players:'2–10', difficulty:'middels',
    description:'Øver avslutninger fra 18–25 meter med korrekt teknikk.',
    steps:['Kø 20m fra mål','Dribble 3 steg, sett opp','Skudd med vristsparka — plasser i hjørne','Bytt side etter 5 skudd','Statisk ball fra ulike posisjoner'],
    tips:['Plant foten 20cm ved siden av ballen','Støttebenet peker mot målet','Treffer litt over midten på ballen — holder banen lav','Armer ut for balanse'],
    equipment:['Baller','Mål'] },

  { id:'fb-o10', sport:'football', category:'offensivt', name:'Posisjonsspill 5v5+2 (joker)', duration:25, players:'12', difficulty:'avansert',
    description:'Fem mot fem med to nøytrale jokere alltid på ballholders side.',
    steps:['Halvbane; 5v5 med 2 jokere','Jokere spiller alltid med ballholder','Mål: angrep via minimum 2 pasninger','Bytt jokere hvert 5. min'],
    tips:['Jokere er alltid fri — bruk dem konstant','5v5: bruk joker for å snu spillet','Joker + vanlig spiller = overtal','Fokus på romforståelse'],
    equipment:['Kjegler','Vester','Baller'] },

  { id:'fb-o11', sport:'football', category:'offensivt', name:'Friløp og timing i dybden', duration:20, players:'4–8', difficulty:'middels',
    description:'Angripere øver timing av løpet bak forsvarslinjen koordinert med passereren.',
    steps:['Angriper 5m foran forsvarslinja','Signal: angriper peker og starter løpet','Midtbane slår dybdeball på 1. steg','Angriper: motta og avslutt'],
    tips:['Løpet starter ETTER ballen er slått','Sprint mot ballen, ikke rett fremover','Midtbane: se skulderens posisjon FØR du slår'],
    equipment:['Baller','Kjegler','Mål'] },

  { id:'fb-o12', sport:'football', category:'offensivt', name:'Frispark-trening', duration:20, players:'3–6', difficulty:'middels',
    description:'Øver frispark fra ulike posisjoner: direkte, mur-over, og kombinasjoner.',
    steps:['Mur 9.15m fra ballen','Frispark direkte over/rundt mur','Variasjon: én løper over ballen, neste skyter','Keeper aktiv'],
    tips:['Krum ball: treffer under ekvator','Plant foten litt bak for loft','Mur: hopp som en enhet','Psykologi: se en annen vei enn du skyter'],
    equipment:['Baller','Mål'] },

  { id:'fb-o13', sport:'football', category:'offensivt', name:'Heading mot mål', duration:15, players:'2–10', difficulty:'enkel',
    description:'Grunnleggende heading med fokus på teknikk.',
    steps:['Server kaster fra siden','Angriper løper mot ballen','Heading mot mål','Fra fremstolpe, bakstolpe og bakre sone','Keeper etter 8 min'],
    tips:['Øynene MÅ være åpne','Pannebenet treffer','Nakken stiv','Armer for balanse'],
    equipment:['Baller','Mål'] },

  { id:'fb-o14', sport:'football', category:'offensivt', name:'Kantspill og innlegg', duration:25, players:'5–10', difficulty:'middels',
    description:'Kantspillere øver innlegg fra ulike posisjoner.',
    steps:['Kant mottar fra midtbane','Dribble mot baklinjen','Innlegg: fremstolpe / bak 5-meteren / tilbake til 16m','2 angripere timer løp'],
    tips:['Innlegg bak keeper, foran back','Svink ballen inn','Angriperne: løp motsatt vei FØR du bryter','Innlegget: tidligst like etter ditt siste touch'],
    equipment:['Kjegler','Baller','Mål'] },

  { id:'fb-o15', sport:'football', category:'offensivt', name:'Sidevendt mottak og vending', duration:15, players:'2–8', difficulty:'middels',
    description:'Midtbanespillere øver å motta sidevendt for å se begge sider.',
    steps:['Spiller i midten; pasning fra én side','Mottaker åpner kropp mot begge retninger','Første touch inn til neste pasning','Neste pasning sendes motsatt side'],
    tips:['Snu kroppen FØR ballen ankommer','Første touch med yttersiden av foten','Si "ja!" høyt','Bruk informasjonen du ser FØR mottak'],
    equipment:['Kjegler','Baller'] },

  { id:'fb-o16', sport:'football', category:'offensivt', name:'Tredjemann-kombinasjon', duration:25, players:'6–10', difficulty:'avansert',
    description:'Trekombinasjon der tredje mann frigis via skjermende spiller.',
    steps:['A→B, B→C (skjerm)','C ryggen til, legger til D som bryter','D avslutter mot mål','Roter etter 4 min'],
    tips:['Skjerm: bruk kroppen bredde','C: kall "fri" til D ved mottak','Timing av D sitt løp er alt','Øv med passiv press FØR aktiv'],
    equipment:['Kjegler','Baller','Vester'] },

  { id:'fb-o17', sport:'football', category:'offensivt', name:'Sprint etter ball — 1v1 konkurranse', duration:15, players:'2–12', difficulty:'enkel',
    description:'Begge spillere løper etter en ball slått inn. Ren konkurranse om å komme til ballen først.',
    steps:['To spillere ryggen til hverandre, 3m fra ball','Trener slår ball 20m fremover på signal','Begge løper om ballen','Den som når ballen: avslutning mot mål'],
    tips:['Første steg er avgjørende','Hold skulderen foran motstanderens','Ikke brems etter du vinner duellen'],
    equipment:['Baller','Kjegler','2 mål'] },

  { id:'fb-o18', sport:'football', category:'offensivt', name:'Overtal-spill 6v4', duration:25, players:'10+', difficulty:'avansert',
    description:'Seks angripende mot fire forsvarere. Øver å bruke overtal effektivt.',
    steps:['6 angrep vs 4 forsvar på halvbane','Mål: sett opp avslutning innen 12 sek','Forsvar: kompakt, ingen offensivt','Bytt lag etter hvert angrep'],
    tips:['Bruk alltid flankene','6v4 = alltid et fritt løp et sted','Sirkuler ballen raskt for å flytte forsvaret','Prioriter god posisjonering over kraft'],
    equipment:['Kjegler','Vester','Baller','Mål'] },

  { id:'fb-o19', sport:'football', category:'offensivt', name:'Dribling med Cruyff-vending', duration:15, players:'2–15', difficulty:'enkel',
    description:'Øver Cruyff-vendingen: fakeinnspill, vend 180°.',
    steps:['Dribble mot kjegle','Fakt innspill','Trekk ballen bakover med innsiden','Vend 180° og akselerér','Øv begge retninger'],
    tips:['Øyenkontakt mot "forsvareren"','Trykk ned i underlaget FØR vendingen','Hold skulderen som skjerm etter vendingen'],
    equipment:['Kjegler','En ball per spiller'] },

  { id:'fb-o20', sport:'football', category:'offensivt', name:'Dribble-kurs med avslutning', duration:20, players:'2–10', difficulty:'enkel',
    description:'Individuell dribbelkurs med kjegler etterfulgt av avslutning.',
    steps:['6 kjegler slalåm, 18m til mål','Dribl gjennom kjeglene','Avslutning etter siste kjegle','Bytt side etter 3 runder'],
    tips:['Ballen tett til foten gjennom slalåmen','Løft blikket etter siste kjegle','Avslutning: ett steg til for bedre vinkel'],
    equipment:['Kjegler','Baller','Mål'] },

  // ─── DEFENSIVT (15 øvelser) ──────────────────────────────────

  { id:'fb-d01', sport:'football', category:'defensivt', name:'Press-signal og høyt press', duration:20, players:'6–11', difficulty:'middels',
    description:'Koordinert høyt press utløst av signal. Hvem presser og hvem dekker.',
    steps:['Oppbygging 4-back mot 4 angripere','Trener passer ball til bestemt spiller (= signal)','Nearest: press direkte mot ballen','Andre komprimerer nærmeste linje'],
    tips:['Press i 45° — kanalisér mot ytterlinjen','2. forsvarspiller: dekker nabopassningen','Aldri press alene — press i lag','Om motstand slår langt: reorganiser raskt'],
    equipment:['Kjegler','Baller','Vester'] },

  { id:'fb-d02', sport:'football', category:'defensivt', name:'1v1 forsvar — posisjon og timing', duration:20, players:'2–12', difficulty:'middels',
    description:'Forsvareren øver korrekt posisjon, vinkel og glidetakling mot angriper.',
    steps:['Angriper mot forsvareren i kanal','Forsvareren: sett press men hold form','Vent på feil fra angriperen','Glidtakling: velg riktig øyeblikk'],
    tips:['Tyngdepunktet lavt','En fots avstand til angriperen','Styr mot hjørnet','Ta aldri benet ut FØR du er sikker'],
    equipment:['Kjegler','Baller'] },

  { id:'fb-d03', sport:'football', category:'defensivt', name:'Back-4 komprimering', duration:25, players:'6–8', difficulty:'avansert',
    description:'Firerbacken øver å komprimer sone og glide som en enhet.',
    steps:['4 forsvarere på linja','Trener peker/passer ball til ulike punkter','Back-4 glider mot ballen','Legg til angriper etter 10 min'],
    tips:['Innerback: dekker sentralt','Ytterback: presser kant men holder posisjon','Aldri bredere enn nødvendig','Kommuniser konstant'],
    equipment:['Kjegler','Vester','Baller'] },

  { id:'fb-d04', sport:'football', category:'defensivt', name:'Gegenpressing etter balltap', duration:20, players:'6–8', difficulty:'avansert',
    description:'Umiddelbar gjenvinning innen 3 sekunder etter balltap.',
    steps:['5v5 + keeper på halvbane','TRENER piper = balltap','5 spillere presser ALLE mot ballen','Mål: gjenvinne innen 5 sek'],
    tips:['Alle 5 løper mot ballen','Nærmeste: press direkte','Andre: kutt pasningsalternativet','Etter 5 sek: gi opp og organiser forsvar'],
    equipment:['Kjegler','Vester','Baller'] },

  { id:'fb-d05', sport:'football', category:'defensivt', name:'Offsidefellen', duration:20, players:'5–9', difficulty:'avansert',
    description:'Back-4 øver koordinert offsidefelle.',
    steps:['4 backer stiller opp','Keeper/back roper "step" på signal','Alle 4 løper fremover SIMULTANT','Angriper fanges i offside'],
    tips:['Alle MÅ løpe på NØYAKTIG samme tid','Innerback roper kommandoen','Aldri step ved lavball','Tren uten angripere FØRST'],
    equipment:['Kjegler','Baller'] },

  { id:'fb-d06', sport:'football', category:'defensivt', name:'Forsvare innlegg', duration:20, players:'4–7', difficulty:'middels',
    description:'Back øver korrekt posisjon mot innlegg fra flanken.',
    steps:['Kant på flanken','Back setter press og kanaliserer','Kant slår innlegg','Back: finn angriperen (ikke ballen)','Hode bort innlegget'],
    tips:['Prioritet: finn angriperen og marker','Aldri vend ryggen til ballen','Kommuniser med keeper'],
    equipment:['Kjegler','Baller','Mål'] },

  { id:'fb-d07', sport:'football', category:'defensivt', name:'Sentralt forsvar 2v2', duration:20, players:'4–8', difficulty:'middels',
    description:'To forsvarere mot to angripere i trang sone. Dobbelpress og kompakt spill.',
    steps:['Firkant 12×12m; 2v2','Angriperne: hold ballen 60 sek','Forsvarerne: gjenvinne','Bytt hver 90 sek'],
    tips:['Presser: vinkél det — ikke rett mot ballen','Nr. 2: dekker nabopassningen','Max 3m mellom forsvarerne','Aldri stikk bein — vent på feilen'],
    equipment:['Kjegler','Baller','Vester'] },

  { id:'fb-d08', sport:'football', category:'defensivt', name:'Forsvare hjørnespark', duration:15, players:'8–11', difficulty:'middels',
    description:'Øver forsvar av hjørnespark: zonal + mannmarkering.',
    steps:['3 i zonal marking på 5m-boksen','2 man-marker farlige angripere','1 spiller nær ballen','Keeper kommanderer'],
    tips:['Keeper eier feltet foran 5m','Zona: hold posisjonen','Man-marker: hold FORAN angriperen','Etter redning: alle ut raskt!'],
    equipment:['Baller','Mål'] },

  { id:'fb-d09', sport:'football', category:'defensivt', name:'Lav blokkering 5-4-1', duration:25, players:'10–11', difficulty:'avansert',
    description:'Lav blokk i 5-4-1 mot ballbesittende motstand.',
    steps:['Lag i 5-4-1 i eget halvplan','Motstand (6 spillere) har ball','Laget holder kompakt blokk','Bytt etter 5 min'],
    tips:['5-4-1: kompakt, aldri spre deg','Midtbane 4: hold linja','Spissen: kanalisér mot en side','Aldri chase — hold linja'],
    equipment:['Kjegler','Vester','Baller'] },

  { id:'fb-d10', sport:'football', category:'defensivt', name:'Dobbelpress og gjenvinning', duration:15, players:'4–8', difficulty:'middels',
    description:'To spillere samarbeider om å vinne ballen. Koordinert dobbelpress.',
    steps:['1 angriper mot 2 forsvarere i kanal','Første forsvarspiller presser og kanaliserer','Andre venter og tar ballen dit den kanaliseres'],
    tips:['Press alltid med én, vent med den andre','Den som venter: 3m bak','Signal til hverandre: "nå!"','Timing og koordinasjon, ikke kraft'],
    equipment:['Kjegler','Baller'] },

  { id:'fb-d11', sport:'football', category:'defensivt', name:'Midtbane-blokkering', duration:15, players:'4–8', difficulty:'middels',
    description:'Midtbane-trekant blokkerer pasninger mellom linjene.',
    steps:['3 midtbanespillere i trekant','2 angripere prøver å passere','Trekanten forflyttes som enhet','Ingen passer gjennom'],
    tips:['Beveg deg som én enhet','Aldri med siden til ballen','Komprimér mot ballen','Kommuniser hvem som presser'],
    equipment:['Kjegler','Baller','Vester'] },

  { id:'fb-d12', sport:'football', category:'defensivt', name:'Dekke løp i dybden', duration:20, players:'4–8', difficulty:'middels',
    description:'Forsvareren øver å dekke løp i dybden uten å miste posisjon.',
    steps:['Forsvareren og angriper side ved side','Signal: angriper sprinter dypt','Forsvareren: følg men hold avstand','Pasning slås inn i dybden'],
    tips:['Se angriperen OG ballen','Aldri la angriperen løpe bak ryggen din','Keeper: si "hold" om du dekker dybden'],
    equipment:['Kjegler','Baller','Mål'] },

  { id:'fb-d13', sport:'football', category:'defensivt', name:'Pressing 4-3-3 med triggere', duration:25, players:'9–11', difficulty:'avansert',
    description:'9–11 spillere øver koordinerte pressing-triggere i 4-3-3.',
    steps:['Lag i 4-3-3','Trener slår ball til bestemt posisjon','Nærmeste angriper: press direkte','Alle andre komprimerer langs linjene'],
    tips:['Triggere: ball til back / dårlig touch / keeper har ball','Presser: bue-løp, kanalisér mot ytterlinjen','Komprimering: midtbane opp, back inn','Tren en trigger om gangen'],
    equipment:['Kjegler','Vester','Baller'] },

  { id:'fb-d14', sport:'football', category:'defensivt', name:'Covering og sone-forsvar', duration:25, players:'7–11', difficulty:'avansert',
    description:'Sonebasert dekning. Alle eier et område, ikke en mann.',
    steps:['4-4 mot 6 angripere','Forsvarslinjene dekker soner','Angripere løper inn og ut','Forsvarere: følg SONEN, ikke mannen'],
    tips:['Du eier et område av banen','Kommuniser: "din" og "min" høyt','Aldri la to dekke samme sone'],
    equipment:['Kjegler','Vester','Baller'] },

  { id:'fb-d15', sport:'football', category:'defensivt', name:'Forsvar ved overgang', duration:20, players:'7–11', difficulty:'avansert',
    description:'Laget reorganiserer ved balltap til defensiv 4-4-2 umiddelbart.',
    steps:['Lag i angrepposisjon','Signal: balltap','Alle løper tilbake til 4-4-2','Tidsbegrensning: 5 sek','Legg til kontrangrep'],
    tips:['Designert back løper UMIDDELBART','Midtbane: løp til posisjon, ikke ballen','Definer klart hvem løper raskt','Tren til det er automatisk'],
    equipment:['Kjegler','Baller','Vester'] },

  // ─── HELE LAGET (10 øvelser) ─────────────────────────────────

  { id:'fb-t01', sport:'football', category:'hele_laget', name:'11v11 taktikkspill', duration:40, players:'22', difficulty:'avansert',
    description:'Fullt 11 mot 11 med fokus på ett taktisk tema.',
    steps:['Fullt lag i kamp-utstyr','Fokus: ett taktisk tema per økt','Trener stopper og korrigerer','15 min angrep, 15 min forsvar','Avslutning: fri kamp'],
    tips:['Stopp og demonstrer — ikke bare snakk','Fokuser på ÉN ting','Bruk video om mulig','Spillerne: still spørsmål'],
    equipment:['Fullt mål','Baller','Vester'] },

  { id:'fb-t02', sport:'football', category:'hele_laget', name:'Oppvarming med ball', duration:15, players:'alle', difficulty:'enkel',
    description:'Strukturert oppvarming: pasning, bevegelse, dynamiske strekk.',
    steps:['2 min lett jogg','Pasning i par i bevegelse','Dynamiske strekk','Sprintstarter x4 per side','Mini-rondó 4v2 i 3 min'],
    tips:['Aldri strekk kaldt','Kommuniser fra start','Ball alltid med: kondisjon + teknikk','Øk intensitet gradvis'],
    equipment:['Baller','Kjegler'] },

  { id:'fb-t03', sport:'football', category:'hele_laget', name:'Posisjonsspill halvbane 6v6', duration:25, players:'12+', difficulty:'middels',
    description:'Seks mot seks med mål. Fritt spill kobler ferdigheter til taktikk.',
    steps:['6v6 på halvbane med keepere','Fritt spill 5 min','Trener stopper og korrigerer','Gjenspill med én begrensning'],
    tips:['La spillerne gjøre feil i starten','Begrensning: f.eks. 2 touch i forsvarsonen','Inkludér keepere i all taktisk trening'],
    equipment:['Kjegler','Baller','Vester','Mål'] },

  { id:'fb-t04', sport:'football', category:'hele_laget', name:'Sett-stykke trening', duration:25, players:'11', difficulty:'middels',
    description:'Hjørnespark og frispark-varianter. Angrep og forsvar.',
    steps:['Øv 5 hjørnespark-varianter','Øv 3 frispark-varianter','Legg inn passive motstandere','Aktive motstandere 50%'],
    tips:['Alle MÅ huske sin oppgave','Standardspill avgjør 30% av mål','Keeper: ta kommandoen høyt'],
    equipment:['Baller','Mål','Kjegler'] },

  { id:'fb-t05', sport:'football', category:'hele_laget', name:'Overgang angrep-forsvar', duration:25, players:'10–14', difficulty:'avansert',
    description:'Umiddelbar omstilling fra angrep til forsvar ved balltap.',
    steps:['8v8 på halvbane','Score/tap = umiddelbar omstilling','Forsvar: reorganiser til 4-4 på 3 sek','Teller vellykkede overganger'],
    tips:['Bestem én omstillingsprinsipp','Kommuniser: "vi mistet!" høyt','Under 3 sek fra balltap til defensiv form'],
    equipment:['Kjegler','Baller','Vester','Mål'] },

  { id:'fb-t06', sport:'football', category:'hele_laget', name:'Kondisjonsspill 5v5 høyt press', duration:25, players:'10', difficulty:'middels',
    description:'Intenst 5v5 med krav om å trykke høyt. Kombinert utholdenhets- og taktikktrening.',
    steps:['5v5 på 40×25m','Laget som mister presser umiddelbart','Maks 3 touch','Poeng kun etter 4+ pasninger','3×5 min med 2 min pause'],
    tips:['Bytt lag etter tredje periode','Begge lag MÅ alltid presse','Registrer poeng — motiverer spillerne'],
    equipment:['Kjegler','Baller','Vester','2 mål'] },

  { id:'fb-t07', sport:'football', category:'hele_laget', name:'Pasningsbevegelse i 3-linjer', duration:20, players:'9–11', difficulty:'middels',
    description:'Lag øver struktur i tre linjer og kommunikasjon mellom dem.',
    steps:['4 back, 3 midtbane, 3 front','Keeper starter','Spill frem: back → midtbane → front','Alle linjer berører ballen','Press etter 5 runder'],
    tips:['Aldri hopp en linje','Midtbane: beveg deg alltid','Front: faser til siden for å gi vinkel','Se på linjeseparasjonen'],
    equipment:['Baller','Kjegler','Vester'] },

  { id:'fb-t08', sport:'football', category:'hele_laget', name:'Treningskamp med taktisk fokus', duration:60, players:'14–22', difficulty:'avansert',
    description:'Treningskamp der ett taktisk punkt evalueres. Trener stopper og korrigerer.',
    steps:['11v11','Fokus: ett taktisk tema','Trener stopper maks 5 ganger','Siste 15 min: fritt spill','Evaluering i garderobe'],
    tips:['Fokusér kun på temaet','Demonstrer ved typiske feil','La kaptein ta ansvar på banen'],
    equipment:['Baller','Vester','Mål'] },

  { id:'fb-t09', sport:'football', category:'hele_laget', name:'Psykisk presstrening', duration:25, players:'10–14', difficulty:'avansert',
    description:'Spillere øver under press: trange begrensninger, regler endres underveis.',
    steps:['8v8: 1-touch max','Timer: 5 sek per berøring','Trener endrer regler underveis','Tilpasning under press er målet'],
    tips:['Psykisk trening: tilpasning er nøkkelen','Feil er OK — lær raskt','Trener: endrer regler for å skape ubehag'],
    equipment:['Kjegler','Baller','Vester'] },

  { id:'fb-t10', sport:'football', category:'hele_laget', name:'Formasjonell angrepstrening 11v0', duration:30, players:'11', difficulty:'avansert',
    description:'Fullt lag øver angrep i formasjon uten motstand. Automatiserer mønstre.',
    steps:['Keeper starter med ball','Spill opp via back → midtbane → front','Fokus: rotasjoner, løpsmønstre','Fra begge sider, 4 ganger hver'],
    tips:['Lytt etter kommunikasjon','Alle beveger seg','Fokuser på ÉN ting av gangen','50% → 75% → 100%'],
    equipment:['Baller','Kjegler','Mål'] },

  // ─── KEEPER (5 øvelser) ──────────────────────────────────────

  { id:'fb-k01', sport:'football', category:'keeper', name:'Reaksjonsredning fra kloss hold', duration:15, players:'2', difficulty:'middels',
    description:'Keeper øver raske reaksjoner fra 5–7m.',
    steps:['Keeper i basisstilling','Trener slår baller fra 5–7m raskt','Lav, middels og høye baller','Doble redninger','10 sek pause mellom serier'],
    tips:['Basisstilling: knær bøyd, fremover','Small shuffles mellom skudd','Dykk gjennom ballen','Neven: kun ved for høy ball'],
    equipment:['Baller','Mål'] },

  { id:'fb-k02', sport:'football', category:'keeper', name:'1v1 mot keeper', duration:15, players:'2–8', difficulty:'middels',
    description:'Keeper øver 1v1: komme ut, bli stor, time beina.',
    steps:['Angriper 25m fra mål','Dribbler alene mot keeper','Keeper: kom ut til riktig tidspunkt','Bli bred','Redde med beina eller kropp'],
    tips:['Kom UT — passiv keeper slipper alltid inn','Timing: ut senest ved 12m','Sett deg i vinkel','Ikke kast deg for tidlig'],
    equipment:['Baller','Mål'] },

  { id:'fb-k03', sport:'football', category:'keeper', name:'Utspark og distribusjon', duration:20, players:'3–6', difficulty:'enkel',
    description:'Keeper øver rask distribusjon til bestemte soner.',
    steps:['Keeper redder','Signal: trener viser side','Kast til riktig spiller','Deretter: utspark med fot','Avansert: keeper bestemmer selv'],
    tips:['Underarmskast: sikrere og mer presis','Utspark: plant benet 20cm ved siden','Aldri distribuer mot press'],
    equipment:['Baller','Kjegler'] },

  { id:'fb-k04', sport:'football', category:'keeper', name:'Innlegg — komme og klatre', duration:15, players:'3–6', difficulty:'middels',
    description:'Keeper øver å komme ut og rydde innlegg.',
    steps:['Innlegger fra flanken','Keeper: "min" eller "ikke min"','Klatre med én arm som skjold','Ta ballen høyest','Rulle ved landing'],
    tips:['Rop "KEEPER!" høyt','Kom UT ved 5–11m fra mål','Én neve om du ikke kan gripe','Fullt commitment — aldri stopp halvveis'],
    equipment:['Baller','Mål'] },

  { id:'fb-k05', sport:'football', category:'keeper', name:'Langskudd — posisjonering og diving', duration:15, players:'2–6', difficulty:'middels',
    description:'Keeper øver redning av harde skudd fra distanse.',
    steps:['Skyttere fra 18–22m','Posisjon: 1m frem','Mottaksskudd — redde rebound','Diving høyre og venstre','Kurvet ball fra vinkel'],
    tips:['Posisjon: del mål i to','Diving: skyv med nærmeste fot','Aldri fall bakover','Rull til siden ved landing'],
    equipment:['Baller','Mål'] },

  // ─── FYSISK (5 øvelser) ──────────────────────────────────────

  { id:'fb-f01', sport:'football', category:'fysisk', name:'Sprintintervall 40m', duration:20, players:'alle', difficulty:'middels',
    description:'Intervalltrening med 40m-sprintserie. Akselerasjon og toppfart.',
    steps:['Varm opp 10 min','Sprint 40m × 8 rep','Pause: 60 sek','Serie 2: staggered start','Cool down 5 min'],
    tips:['100% intensitet — ikke 90%','Armer fremover, ikke sideveis','Eksplosiv start de første 5m'],
    equipment:['Kjegler'] },

  { id:'fb-f02', sport:'football', category:'fysisk', name:'Koordinasjonsstige', duration:15, players:'alle', difficulty:'enkel',
    description:'Koordinasjonsstige for fotkontakt, rytme og agilitet.',
    steps:['Én fot inn hvert felt fremover','To fot inn hvert felt','Side-sidepass gjennom stige','Kryss-steg gjennom stige','"In-in-out-out" mønster'],
    tips:['Lette raske steg, ikke kraftige','Løft knærne','Korrekthet FØR fart'],
    equipment:['Koordinasjonsstige'] },

  { id:'fb-f03', sport:'football', category:'fysisk', name:'Plyometri og eksplosive hopp', duration:20, players:'alle', difficulty:'middels',
    description:'Eksplosive hoppeøvelser for power og vertikalt hopp.',
    steps:['Squat-jump ×10','Box-jump ×8','Lateral bounds ×10 per side','Hurdle-jump ×8','Tuck-jump ×8'],
    tips:['Land alltid med bøyde knær','Pause 60–90 sek mellom serier','Maksimal kraft i hvert hopp','Myk landing = aktiv muskel'],
    equipment:['Bokser/stepper','Lavhekker'] },

  { id:'fb-f04', sport:'football', category:'fysisk', name:'HIIT-sirkel 6 stasjoner', duration:25, players:'alle', difficulty:'middels',
    description:'Seks HIIT-stasjoner à 45 sek. Full kropp, høy intensitet.',
    steps:['Burpees 45 sek','Push-ups 45 sek','Mountain climbers 45 sek','Squat jumps 45 sek','Plank 45 sek','Lateral shuffle 45 sek; 15 sek pause; 3 runder'],
    tips:['Hold intensiteten gjennom hele 45 sek','God teknikk viktigere enn antall','Plank: core aktiv, hofte nede'],
    equipment:['Matter'] },

  { id:'fb-f05', sport:'football', category:'fysisk', name:'Endurance-løp aerob basis', duration:30, players:'alle', difficulty:'enkel',
    description:'Rolig langt løp for aerob kapasitet.',
    steps:['30 min jogg 65–70% av makspuls','Du skal KUNNE snakke','Øk 10% per uke over 4 uker'],
    tips:['Aerob trening er grunnmuren','Ikke løp for fort — feil system','Varier underlag for å redusere skader'],
    equipment:['Ingen spesialutstyr'] },
];

// ════════════════════════════════════════════════════════════════
//  HÅNDBALL — 100 øvelser
// ════════════════════════════════════════════════════════════════

export const HANDBALL_DRILLS: Drill[] = [

  // ─── OFFENSIVT (25 øvelser) ──────────────────────────────────

  { id:'hb-o01', sport:'handball', category:'offensivt', name:'Grunnpasning i par', duration:10, players:'2–20', difficulty:'enkel',
    description:'Grunnleggende kastøvelse: rett arm, snap i håndleddet, riktig fotarbeid.',
    steps:['Par stiller seg 5m fra hverandre','Kast med dominant arm: skulder-albue-håndledd-snap','Motta med to hender','Øk avstand til 8m etter 3 min','Øv begge hender'],
    tips:['Steg inn i kastet: venstre fot frem ved høyrehåndskast','Snap i håndleddet = kraft og presisjon','Motta med hele hendene','Hold blikket på mottakeren'],
    equipment:['Handball'] },

  { id:'hb-o02', sport:'handball', category:'offensivt', name:'Tre-stegsskudd', duration:15, players:'2–10', difficulty:'enkel',
    description:'Grunnleggende tre-stegs-teknikk. Basisøvelse for alle nivåer.',
    steps:['Pasning til løpende spiller','Tre steg (1–2–3) etter mottak','Tredje steg = avhoppet fot','Skudd over skulder mot mål'],
    tips:['Tre steg fra ETTER mottak','Hopp: push-off med bakre fot','Skudd i hopp: kast FØR landing','Høy albue, kast fremover'],
    equipment:['Handball','Mål'] },

  { id:'hb-o03', sport:'handball', category:'offensivt', name:'Kantkast og pivot-kombinasjon', duration:20, players:'4–8', difficulty:'middels',
    description:'Kant passer inn til pivot som snur og skyter eller legger av til kanten.',
    steps:['Kant har ball i kantposisjon','Pasning inn til pivot','Pivot snur og avgjør: skyte eller legge av','Kant løper inn for retur-pasning'],
    tips:['Pivot: vend deg BORT fra forsvareren','Kant: løp inn idet pivoten tar imot','Pivot-skudd: lavt over keeper','Kommuniser hva som er bedre'],
    equipment:['Handball','Mål'] },

  { id:'hb-o04', sport:'handball', category:'offensivt', name:'Gjennombrudd 1v1 mot keeper', duration:20, players:'2–10', difficulty:'middels',
    description:'Angriper gjennombryter og avslutter 1v1 mot keeper.',
    steps:['Angriper starter 12m fra mål','Dribbler/løper mot 6m','Passiv forsvarsspiller forsøker å blokke','Se keeper og skyt','Fokus: høy, lav, spretten'],
    tips:['Se på keeper FØR du skyter','Spretten: skyt i underlaget','Lav skudd = 70% av mål i håndball','Varier avstand og vinkel'],
    equipment:['Handball','Mål'] },

  { id:'hb-o05', sport:'handball', category:'offensivt', name:'Rask kontring 3v2', duration:20, players:'5+', difficulty:'middels',
    description:'Tre angripere i kontring mot to forsvarere. Raske avgjørelser.',
    steps:['Keeper distribuerer','3 angripere mot 2 forsvarere','Bred angrepslinje','Midtangriper: trekk forsvarerne, pass til fri kant'],
    tips:['Tre er sterkere enn to — bruk bredden','Midt: trekk begge, then pass','Kant: hold deg med midtspilleren','Avslutt innen 5 sekunder'],
    equipment:['Handball','Mål'] },

  { id:'hb-o06', sport:'handball', category:'offensivt', name:'Skuddtrening fra bakbane', duration:20, players:'2–8', difficulty:'middels',
    description:'Bakbane-spillere øver hoppskudd, powerskudd og plassert skudd fra 9m.',
    steps:['Bakbanespiller ved 9m','Hoppskudd: løp inn, hopp og skyt','Powerskudd: stående, fullt kraft','Plassert: rolig til hjørnet','Øv alle tre typer fra begge sider'],
    tips:['Hoppskudd: hopp FREMOVER ikke OPP','Skyt mot hjørnene','Ikke telegrafér retningen','Shoot low to the far post'],
    equipment:['Handball','Mål'] },

  { id:'hb-o07', sport:'handball', category:'offensivt', name:'7-meter straffekast', duration:15, players:'1–8', difficulty:'enkel',
    description:'Teknikk og mental trening på 7-meter straffekast.',
    steps:['Kø ved 7m-strek','Bestem hjørne FØR du kaster','Øv alle 4 hjørner','Avansert: keeper beveger seg','Hele laget ser på — press-situasjon'],
    tips:['Bestem hjørne FØR du løfter ballen','Øy-kontakt gjør keeper usikker','Håndleddet snapper ned for lavt skudd','Presisjon over kraft fra 7m'],
    equipment:['Handball','Mål'] },

  { id:'hb-o08', sport:'handball', category:'offensivt', name:'Pivot-arbeid og vendinger', duration:20, players:'2–6', difficulty:'middels',
    description:'Pivot øver mottak, vendinger og avslutning i 6m-sonen.',
    steps:['Pivot ved 6m-sonen','Bakbanespiller sender pasning','Pivot mottar og vender raskt','Avslutning umiddelbart etter vending','Begge retninger'],
    tips:['Vend ALLTID bort fra forsvareren','Spin-turn: pivotpunkt venstre fot','Motta med hånden UNNA forsvareren','Lav og spretten er best fra 6m'],
    equipment:['Handball','Mål'] },

  { id:'hb-o09', sport:'handball', category:'offensivt', name:'Løpsmønster — kryss og overlap', duration:20, players:'4–8', difficulty:'middels',
    description:'Kryssløp og overlappende bevegelser for å skape forvirring i forsvaret.',
    steps:['3 angripere: venstre-midt-høyre','Venstre og midt bytter plass (kryss)','Ballen følger en av dem','Forsvar forvirret om hvem som har ballen'],
    tips:['Kryss: full fart — ikke halvhjertet','Ballen følger alltid kroppens retning','Kombiner kryss og pivot-innspill'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-o10', sport:'handball', category:'offensivt', name:'Pasningskjede 5-mann', duration:15, players:'5–10', difficulty:'enkel',
    description:'Fem spillere passer raskt fremover og bakover. Koordinasjon og presisjon.',
    steps:['5 spillere i linje, 3m avstand','Ball starter hos nr. 1: fremover til nr. 5','Tilbake 5 til 1','Linja beveger seg fremover','Avansert: to baller simultant'],
    tips:['Alle tar imot og passer straks','Hold linja strak','Kommuniser: "mine!"','Avansert: kast til annenhver'],
    equipment:['Handball (1–2 baller)'] },

  { id:'hb-o11', sport:'handball', category:'offensivt', name:'Innspill til pivot fra høyre bakbane', duration:20, players:'3–6', difficulty:'middels',
    description:'Høyre bakbane øver innspill til pivot med timing og presisjon.',
    steps:['Høyre bakbane (HB) med ball ved 9m','Pivot beveger seg langs 6m-linjen','HB venter på riktig posisjon','Innspill: flat rask pasning til pivot'],
    tips:['Innspillet MÅ gå mellom forsvarernes armer','Pivot: signal med armen NÅR du er fri','Ikke kast om linjen er blokkert','Underarm-flat for mer kontroll'],
    equipment:['Handball','Mål'] },

  { id:'hb-o12', sport:'handball', category:'offensivt', name:'Gjennombrudd kant — vinkelskudd', duration:20, players:'3–8', difficulty:'middels',
    description:'Kantspiller gjennombryter og avslutter i smal vinkel.',
    steps:['Kant får pasning','Løper inn over 6m-linjen','Avslutning i smal vinkel','Finte: fake skudd tidlig','Begge kanter'],
    tips:['Sett ned foten FØR 6m-linjen','Sikt ute mot stolpen','Vent til siste øyeblikk','Fake skudd for å trekke keeper'],
    equipment:['Handball','Mål'] },

  { id:'hb-o13', sport:'handball', category:'offensivt', name:'Dribbling og gjennombrudd', duration:15, players:'2–12', difficulty:'enkel',
    description:'Dribbling i håndball: lav og kontrollert. Kun for gjennombrudd.',
    steps:['Dribler 10m i ett tempo','Dribble lavt under hoften','Stopp: tre steg og skyt','Bytte hånd midt i sekvens','Dribble forbi kjegle'],
    tips:['Dribble kun for å komme forbi forsvarere','Hold under hoften — høyt er lettere å stjele','Aldri dribble uten plan','Tre steg gjelder etter dribleing'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-o14', sport:'handball', category:'offensivt', name:'Tidlig skudd — snapshot', duration:15, players:'2–8', difficulty:'middels',
    description:'Raskt skudd uten å hoppe. Overrumpler keeper.',
    steps:['Bakbanespiller mottar pasning','Ingen tid til hopp — skyt fra stand','Fokus: lav bred og overraskende','Fra venstre, høyre og senter'],
    tips:['Snapshot: 8–11m fra mål','Snappy håndledd: kraft fra håndledd ikke kropp','Sikt under keepers arm (hip-level)','Se KEEPER ikke mål — skyt dit han er IKKE'],
    equipment:['Handball','Mål'] },

  { id:'hb-o15', sport:'handball', category:'offensivt', name:'Overlapp back til kant', duration:20, players:'4–8', difficulty:'middels',
    description:'Back overlapper ut til kant for å skape overtal på flanken.',
    steps:['Venstre back har ball','Kant løper INN (dummy-løp)','Back løper ut til kantposisjon','Midt passer til back ute','Back avslutter'],
    tips:['Dummy-løp MÅ trekke forsvareren','Back: vent til kant er forbi','Timing: pasning nøyaktig idet back er ute','Forsvarerne er alltid et steg bak'],
    equipment:['Handball','Mål'] },

  { id:'hb-o16', sport:'handball', category:'offensivt', name:'Gjennombrudd med skjerming', duration:20, players:'4–8', difficulty:'middels',
    description:'Angriper skjermer for lagkamerat som bryter. Blokk, timing, mottak i fart.',
    steps:['A skjermer mellom forsvareren og B','B løper forbi A mot målet','C passer til B i bevegelsen','B avslutter i fart'],
    tips:['Skjermspiller: stå STILLE','Skjerm kun lovlig ved forsvarerens bevegelse','Timing: B bryter FØR forsvareren komme forbi','C: pass tidlig'],
    equipment:['Handball','Mål'] },

  { id:'hb-o17', sport:'handball', category:'offensivt', name:'Sammensatt 6-mann kombinasjon', duration:25, players:'6–10', difficulty:'avansert',
    description:'Seks spillere kombinerer: kryss, innspill, gjennombrudd, avslutning.',
    steps:['Definert mønster: A→B (kryss)→C (pivot)→D (kant)→E (back)→skudd','Sakte 3 ganger','75% fart 3 ganger','100% fart','Passivt forsvar'],
    tips:['Alle husker rekkefølgen FØR start','Timing er alt','Pivot: vend riktig for å åpne for neste','Skytter: tilpass til hva keeper gjør'],
    equipment:['Handball','Mål'] },

  { id:'hb-o18', sport:'handball', category:'offensivt', name:'Innspilfri bevegelse (kompassøvelse)', duration:20, players:'6–10', difficulty:'middels',
    description:'Spillere øver rotasjon uten ball for å finne frie rom.',
    steps:['3-2-1 angrepsformasjon','Ball sirkuleres langs ytre linje','Spillere uten ball: kompassbevegelse — 4 retninger','Alle beveger seg alltid','Etter 5 sirkulasjoner: angrip'],
    tips:['Stå aldri stille','Bakbane: gå bredt ved ball på andre siden','Pivot: inn og ut av 6m-sonen','Kant: inn mot midten for å distrahere forsvar'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-o19', sport:'handball', category:'offensivt', name:'2v2 bakbane vs forsvar', duration:20, players:'4–8', difficulty:'middels',
    description:'To bakbanespillere mot to forsvarere. Kombinasjonsspill og gjennombrudd.',
    steps:['2 bakbanespillere ved 9m','2 forsvarere kompakt','Kombiner: pasning og løp','Skyt fra 9m eller gjennombryting','Bytt roller etter 3 min'],
    tips:['Hold bredde: aldri la forsvarerne dekke begge','Skudd fra 9m: trekk forsvarerne, pass til den andre','2v2: én trekker, én skyter','Kommuniser: "skyt!" eller "pass!"'],
    equipment:['Handball','Mål'] },

  { id:'hb-o20', sport:'handball', category:'offensivt', name:'Raskt angrep etter gjenvinning', duration:20, players:'7–10', difficulty:'middels',
    description:'Laget angriper raskt etter gjenvinning. Kontringsmentalitet.',
    steps:['7v7 — forsvar vinner ball','Umiddelbar kontring','Maks 3 pasninger til avslutning','Forsvar: reorganiser raskt'],
    tips:['Keeper: distribuer innen 2 sek etter redning','Signalspiller alltid klar fremover','3 pasninger til avslutning er maksimum','Kontringsmål er de beste målene'],
    equipment:['Handball','Mål'] },

  { id:'hb-o21', sport:'handball', category:'offensivt', name:'Pasningshastighet i sirkel', duration:15, players:'5–8', difficulty:'enkel',
    description:'Rask pasningssirkel — tempo og presisjon under tidspress.',
    steps:['5–8 spillere i sirkel, 3m diameter','Rask pasning rundt: 1 touch','Etter 10 pasninger: hopp over én (annenhver)','Avansert: to baller i sirkel','Konkurranse: raskest uten feil'],
    tips:['1-touch krav: trener presisjon','Fortell alltid hvem du passer til','Sirkel av riktig størrelse: for stor er for lett','Avansert: tydelig signal til riktig mottaker'],
    equipment:['Handball (1–2 baller)'] },

  { id:'hb-o22', sport:'handball', category:'offensivt', name:'Avslutning fra alle vinkler', duration:20, players:'2–10', difficulty:'middels',
    description:'Systematisk skuddtrening fra 6 ulike posisjoner rundt 9m-linjen.',
    steps:['6 merker rundt 9m: venstre kant, venstre back, senter, høyre back, høyre kant, pivot','Skudd fra hver posisjon ×5','Fokus på teknikk per posisjon','Keeper aktiv — sammenlign redningsprosent per posisjon'],
    tips:['Venstre kant: hoppskudd inn mot stolpe','Senter back: rett hoppskudd','Pivot: vendingsskudd lavt','Sammenlign: hvilken posisjon er mest effektiv for deg?'],
    equipment:['Handball','Mål'] },

  { id:'hb-o23', sport:'handball', category:'offensivt', name:'Senter kombinasjon med kryss', duration:20, players:'4–8', difficulty:'middels',
    description:'Senter og midt kombinerer med kryss for å åpne for gjennombrudd.',
    steps:['Senter mottar pasning fra back','Kryss-løp: senter og venstre back bytter','Pasning til den som er fri','Avslutning mot mål'],
    tips:['Kryss: gjennomfør med full fart','Forsvarerne MÅ bestemme seg — skaper alltid en fri','Kombiner med pivot-innspill'],
    equipment:['Handball','Mål'] },

  { id:'hb-o24', sport:'handball', category:'offensivt', name:'Oppsett av angrep fra 7m', duration:15, players:'5–8', difficulty:'middels',
    description:'Laget øver å sette opp angrep effektivt etter tilkjent 7m. Posisjonering og timing.',
    steps:['7m tilkjent','Kassetter setter opp spillere i posisjon','7m-kaster venter på keeper','Øvrige: beredt for retur-angrep','Scenariet: retur-ball → raskt angrep'],
    tips:['Ikke rush 7m-kastet — ta kontroll','Spillerne i posisjon INNEN kastet tas','Retur-angrep: starter straks hvis ball returneres','Ha klar PLAN A og B'],
    equipment:['Handball','Mål'] },

  { id:'hb-o25', sport:'handball', category:'offensivt', name:'Bakbane kombinasjon 3-mann', duration:20, players:'3–9', difficulty:'middels',
    description:'Tre bakbanespillere kombinerer med kryssløp og innspill til pivot.',
    steps:['3 bakbanespillere ved 9m (venstre, senter, høyre)','Sirkuler ballen raskt','Kryss: venstre og senter bytter','Åpner for gjennombrudd senter','Pivot-innspill fra senter'],
    tips:['Bakbanens styrke: bredde og distanse','Cirkuler fort for å flytte forsvaret','Kryss: avgjørende timing','Pivot MÅ alltid være tilgjengelig'],
    equipment:['Handball','Mål'] },

  // ─── DEFENSIVT (20 øvelser) ──────────────────────────────────

  { id:'hb-d01', sport:'handball', category:'defensivt', name:'6-0 forsvar grunnposisjon', duration:20, players:'6–7', difficulty:'middels',
    description:'Seks forsvarere øver grunnposisjon i 6-0: kompakt linje, rotasjon.',
    steps:['6 forsvarere langs 6m-linjen','Ball sirkuleres langs angrepet','Forsvarslinja glider mot ballen','Nærmeste: hopp ut og press angriperen','Andre: fyller inn etter utbrekk'],
    tips:['6-0: kompakt FØR aggressiv','Glide: flytt som én enhet','Utbrekk: maks 1–2 steg fra 6m','Kommuniser: "komme ut!" og "fyller!"'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-d02', sport:'handball', category:'defensivt', name:'5-1 forsvar med spiss', duration:20, players:'6–7', difficulty:'avansert',
    description:'5-1: fem på linjen, én spiss som presser sentermidt.',
    steps:['5 forsvarere på linjen, 1 spiss foran','Spissen presser CM','5-linja dekker kanter','Spissen kanaliserer CM bort fra senter','Bytt spiss etter 5 min'],
    tips:['Spissen: press CM — ikke chase ballen','5-linjen: komprimér mot ballen','5-1 krever god kondisjon — krevende','Kommuniser: "spiss ut!" ved pressing'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-d03', sport:'handball', category:'defensivt', name:'Blokkering av skudd', duration:15, players:'2–8', difficulty:'middels',
    description:'Forsvarere øver timing av blokkeringen: hopp, armer opp.',
    steps:['Angriper med ball 9m fra mål','Forsvarspiller rett foran','Forsvarspiller hopper på skuddsignalet','Armer oppe — blokker skuddet'],
    tips:['Hopp IDET ballen forlater hånden','Armer OPP og fremover','Aldri hopp for tidlig','Feil timing = straffeblokk'],
    equipment:['Handball','Mål'] },

  { id:'hb-d04', sport:'handball', category:'defensivt', name:'Forsvare pivot langs 6m', duration:20, players:'3–6', difficulty:'middels',
    description:'Forsvarspiller dekker pivot langs 6m-linjen.',
    steps:['Pivot beveger seg langs 6m','Forsvarspiller holder posisjon FORAN pivot','Hender oppe — blokkere innspillinjen','Pasning inn forsøkes','Forsvarspilleren forstyrrer mottaket'],
    tips:['Stå FORAN pivoten (mellom ball og pivot)','Aldri full kropp til pivot','Hender oppe blokkerer 30% av linjer','Kommuniser med nabospillere'],
    equipment:['Handball'] },

  { id:'hb-d05', sport:'handball', category:'defensivt', name:'Rotasjon ved utbrekk', duration:20, players:'6–7', difficulty:'avansert',
    description:'Koordinert rotasjon etter at en forsvarspiller bryter ut.',
    steps:['6-0 i posisjon','En forsvarspiller bryter ut','Naboer roterer mot ballen','Ingen åpen sone i 6m-linjen'],
    tips:['Rotasjon MÅ skje SIMULTANT med utbrekket','Nærmeste naboer: ett steg inn','Kommuniser: "jeg er ut!" → "jeg fyller!"','Øv til rotasjonen er automatisk'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-d06', sport:'handball', category:'defensivt', name:'Keeper-forsvar samarbeid', duration:20, players:'4–7', difficulty:'middels',
    description:'Keeper og forsvarspillere koordinerer hvem som tar hva.',
    steps:['Keeper + 2 forsvarere mot 3 angripere','Keeper kommanderer "min" eller "din"','Forsvarspiller kommuniserer med keeper','Situasjoner: innlegg, gjennombrudd, sideskudd'],
    tips:['Keeper er sjefen — alle hører på keeper','Forsvarerne: si fra om du er usikker','"BYT!" = ta mannen og la keeper ha ball','Kommunisér med navn'],
    equipment:['Handball','Mål'] },

  { id:'hb-d07', sport:'handball', category:'defensivt', name:'Høy pressing for gjenvinning', duration:20, players:'6–8', difficulty:'avansert',
    description:'Pressing høyt for rask gjenvinning. Koordinert og aggressivt.',
    steps:['Forsvar presser i motstanderens halvdel','6 forsvarere kompakt 9m fra mål','Press bæreren med 2 spillere','Andre blokkerer pasningslinjer'],
    tips:['Pressing er risikabelt — koordiner alltid','To nærmeste: presser ballen','Fire andre: blokkerer innspill','Trekk tilbake ved mislykket pressing'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-d08', sport:'handball', category:'defensivt', name:'3-2-1 forsvar', duration:25, players:'7', difficulty:'avansert',
    description:'3-2-1: tre foran, to bak, én keeper. Aggressivt og dynamisk.',
    steps:['3 framme, 2 bak, keeper','Framste tre: aggressivt press','Bak to: dekker flanker og pivot','Øv overgangene fra 6-0 til 3-2-1'],
    tips:['3-2-1: kun mot svake oppbyggere','De tre framme: MÅ være lynraske','Bak to: aldri miste pivoten','Enerving og krevende — kondisjon er avgjørende'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-d09', sport:'handball', category:'defensivt', name:'Blocking og lovlig kroppskontakt', duration:15, players:'2–8', difficulty:'middels',
    description:'Forsvarere øver lovlig kroppskontakt: blokkere med kropp, ikke dytte.',
    steps:['Forsvarspiller mot angriper 1v1','Forsvarspiller: bruk overkroppens fremside','Blokkere bevegelsesretning (ikke dytte)','Angriperen løper inn mot 6m'],
    tips:['Lovlig: kropp mot kropp front','Ulovlig: dytte med armer, rive, holde','Hold armene noe ut fra kroppen','Vurder alltid fra kontaktets retning'],
    equipment:['Handball'] },

  { id:'hb-d10', sport:'handball', category:'defensivt', name:'Forsvar ved numerisk underlegenhet', duration:20, players:'5–7', difficulty:'avansert',
    description:'Laget øver å forsvare med én mann utvist. 5v6.',
    steps:['5 forsvarere vs 6 angripere','Tilpasse 5-0 eller 4-1','Kommuniser hvem som tar hvem','Øv å holde kompakt 60 sek'],
    tips:['5 forsvarere MÅ være doblet kompakt','Prioriter midten: stopp gjennombrudd og pivot','Ekstra fokus på keeper ved underlegenhet','Hold disiplin — feil her er fatalt'],
    equipment:['Handball','Mål'] },

  { id:'hb-d11', sport:'handball', category:'defensivt', name:'Mann-markering av pivot', duration:20, players:'3–6', difficulty:'avansert',
    description:'Spesiell mann-markering av pivot. Tett og aggressiv dekking.',
    steps:['Én forsvarspiller mann-markerer pivot','Pivot forsøker å frigjøre seg','Forsvarspilleren holder kontakten','Øv ved inn-pasning og vendinger'],
    tips:['Mann-markering: hold kontakt med hånden','Aldri miste pivoten av syne','Fysisk og krevende — bytt etter 3 min','Koordiner med nabospillere'],
    equipment:['Handball'] },

  { id:'hb-d12', sport:'handball', category:'defensivt', name:'Tidlig press fra 9m', duration:15, players:'4–8', difficulty:'middels',
    description:'Forsvarere bryter ut til 9m-linjen tidlig for å presse bakbanespillere.',
    steps:['To forsvarere bryter ut til 9m','Presser bakbanespillere aggressivt','To bak holder 6m-linjen','Bytt etter 3 min'],
    tips:['Tidlig press fra 9m: best mot langsom oppbygging','Pressen: press BALLEN, ikke mannen','De to bak: hold 6m kompakt','Risikabelt — revolver tilbake om pressen mislykkes'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-d13', sport:'handball', category:'defensivt', name:'Forsvare frispark', duration:15, players:'5–7', difficulty:'middels',
    description:'Forsvarsposisjonering ved frispark. Mur og posisjon.',
    steps:['Forsvar sett opp ved frispark','2–3 spillere i mur','Resten posisjonerer seg','Keeper kommanderer muren','Øv alle frispark-posisjoner'],
    tips:['Muren: 3m fra ballen (regelen)','Hopp som én enhet ved skudd','Keeper: styr muren til riktig posisjon','Alltid en bak muren for korreksjon'],
    equipment:['Handball','Mål'] },

  { id:'hb-d14', sport:'handball', category:'defensivt', name:'Forsvar ved kontring mot deg', duration:20, players:'5–8', difficulty:'middels',
    description:'Forsvar øver å håndtere kontring: race tilbake, blokkere og reorganisere.',
    steps:['Laget i angrepposisjon','Signal: mister ball','Alle sprinter tilbake','Reorganiser til 6-0 i 4 sek'],
    tips:['Sprint tilbake: ingen er unntatt','Nærmeste to: holder ballen nede (delay)','Keeper: kommanderer og motiverer','Reorganisering: fra utsiden og inn'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-d15', sport:'handball', category:'defensivt', name:'6-0 rotasjon øvelse', duration:20, players:'6', difficulty:'middels',
    description:'6-0-linja øver rotasjon ved utbrekk fra begge sider.',
    steps:['Ball sirkuleres venstre kant → senter → høyre kant','Nærmeste: bryter ut ved bakbanespiller','Naboer: fyller systematisk','Øv fra begge sider 5 ganger'],
    tips:['Rotasjon: en enhet — ikke individuell','Tydelig kommunikasjon: "min!" og "din!"','Aldri to tomrom i linjen','Lag automatikken gjennom repetisjon'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-d16', sport:'handball', category:'defensivt', name:'Forsvar av kant-gjennombrudd', duration:20, players:'3–6', difficulty:'middels',
    description:'Forsvar øver å stoppe kant-gjennombrudd.',
    steps:['Kantspiller forsøker gjennombrudd','Forsvarspilleren setter press','Kanaliserer mot baklinjen','Keeper dekker vinkelposisjon'],
    tips:['Styr kanten UT — ikke inn mot senter','Arm og skulder blokkerer inngangen','Keeper: ut på kanten for å redusere vinkel','Kommuniser med nabospilleren'],
    equipment:['Handball','Mål'] },

  { id:'hb-d17', sport:'handball', category:'defensivt', name:'Dobbeldekke pivot', duration:15, players:'4–6', difficulty:'avansert',
    description:'To forsvarere samarbeider om å dekke pivot og avskaffe innspilllinjer.',
    steps:['Pivot i 6m-sonen','To forsvarere: én foran, én bak','Begge aktive mot mottak','Bakbane forsøker innspill'],
    tips:['Fremre forsvarspiller: blokkerer fra forsiden','Bakre: blokkerer fra baksiden','Kommuniser hvem som tar hva','Effektivt men risikabelt: åpner naboposisjoner'],
    equipment:['Handball'] },

  { id:'hb-d18', sport:'handball', category:'defensivt', name:'Forsvar i overtall — 7v6', duration:20, players:'13', difficulty:'middels',
    description:'Forsvar med overtall (7 mot 6) øver å utnytte fordelen og skape raskt angrep.',
    steps:['7 forsvarere vs 6 angripere','Forsvarerne: ekstrem pressing','Gjenvinning → umiddelbar kontring','Mål: skore innen 5 sek etter gjenvinning'],
    tips:['7v6: bruk nummeret ditt — press alle','Gjenvinning er starten på ditt angrep','Keeper: distribuer umiddelbart','Lagspill ikke individuelt'],
    equipment:['Handball','Mål'] },

  { id:'hb-d19', sport:'handball', category:'defensivt', name:'Pressing mot oppbygging', duration:20, players:'6–8', difficulty:'avansert',
    description:'Fullt press mot motstanderens oppbygging fra keeper.',
    steps:['6 forsvarere presser i motstanderens halvdel','Keeper bytter til ekstra spiller','Forsvarerne: press alle motstanderens spillere','Mål: forhindre oppbygging over halvbanen'],
    tips:['Kun effektivt de siste 2 min av kamp','Krevende: MÅ gjenvinne eller score raskt','Keeper til banen: stor risiko','Kommuniser hvem som dekker hvem'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-d20', sport:'handball', category:'defensivt', name:'Individuell forsvarsteknikk', duration:15, players:'2–8', difficulty:'enkel',
    description:'Basisteknikk for forsvarsspill: stilling, steg, og press.',
    steps:['Basisstilling: bøyd, lav, vekt fremover','Sidestep 3m: høyre og venstre ×10','Press: ett skritt frem mot angriperen','Tilbake: glid tilbake til linjen','Øv mot passiv angriper'],
    tips:['Alltid lav stilling — lavere enn angriperen','Sidestep: IKKE kryss beina','Press: én steg frem, ikke mer','Blikket på brystet til angriperen — ikke beina'],
    equipment:['Kjegler'] },

  // ─── HELE LAGET (15 øvelser) ─────────────────────────────────

  { id:'hb-t01', sport:'handball', category:'hele_laget', name:'7v7 taktikkspill', duration:40, players:'14', difficulty:'avansert',
    description:'Full 7v7 med ett taktisk fokus. Trener stopper og demonstrerer.',
    steps:['Fullt 7v7','Fokus: ett tema (f.eks. 6-0 mot 3-3 angrep)','20 min angrep, 20 min forsvar','Fri treningskamp til slutt'],
    tips:['Fokus: ÉTT tema','Stoppene: korte og konkrete','Video etterpå om mulig','La spillerne foreslå løsninger'],
    equipment:['Handball','Mål'] },

  { id:'hb-t02', sport:'handball', category:'hele_laget', name:'Hurtig kontring — hele laget', duration:20, players:'7–10', difficulty:'middels',
    description:'Hele laget øver kontring etter gjenvinning. Fra forsvar til angrep under 5 sek.',
    steps:['Keeper redder','Umiddelbar distribusjon til signalspiller','2–3 løper fremover','Avslutt innen 5 sek'],
    tips:['Keeper: RASKT — ikke hold ballen','Signalspiller alltid klar','Hold bredde','Etter 5 sek: standard angrep'],
    equipment:['Handball','Mål'] },

  { id:'hb-t03', sport:'handball', category:'hele_laget', name:'Sett-stykker — frispark og 7m', duration:20, players:'7', difficulty:'middels',
    description:'Teamtrening på frispark-situasjoner og 7m under press.',
    steps:['5 ulike frispark-oppsett','Keeper kjenner alle oppsettene','Avslutning: 7m under press','Keeper analyserer motstanderens kastere'],
    tips:['Frispark: alltid alternativ kaster','Keeper: kjenn spillernes svake retning','Blokkere: konsekvent'],
    equipment:['Handball','Mål'] },

  { id:'hb-t04', sport:'handball', category:'hele_laget', name:'Overgang forsvar-angrep', duration:25, players:'10–14', difficulty:'avansert',
    description:'Umiddelbar overgang fra defensiv til offensiv etter gjenvinning.',
    steps:['7v7','Forsvar vinner ball → kontre','Maks 3 pasninger til avslutning','Bytt lag etter mål'],
    tips:['Keeper starter overgangen — distribuer raskt','Alltid én fremover alltid','Direkte skudd er ofte bedre enn overpassing','Kontringsmål teller dobbelt'],
    equipment:['Handball','Mål','Kjegler'] },

  { id:'hb-t05', sport:'handball', category:'hele_laget', name:'3-2-1 mot 3-3 angrep', duration:25, players:'12–14', difficulty:'avansert',
    description:'Taktisk duell: 3-2-1 forsvar mot 3-3 angrep.',
    steps:['Angripere: 3-3 formasjon','Forsvarerne: 3-2-1','3 min; pause og diskuter','Bytt til 6-0 mot 2-4 angrep','Evaluering: hva fungerte?'],
    tips:['3-2-1: aggressiv men krevende','Spiss i 3-2-1: alltid press på CM','3-3: bruk pivoten for å bryte 3-2-1','Ha Plan B klar'],
    equipment:['Handball','Mål','Kjegler'] },

  { id:'hb-t06', sport:'handball', category:'hele_laget', name:'Oppvarming håndball-spesifikk', duration:15, players:'alle', difficulty:'enkel',
    description:'Oppvarming med ball: pasning, bevegelse, dynamisk strekk.',
    steps:['2 min lett jogg','Pasning i par under jogg','Dynamiske strekk: skulder, hofter, ankler','Kastkraft: lette kast x10 per arm','Mini-kontring 3v2 × 3'],
    tips:['Skulder: varm opp tidlig — varme skulder er sunne skulder','Lett kasting FØR hardt kasting','Kommuniser fra starten'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-t07', sport:'handball', category:'hele_laget', name:'Kondisjonsspill 4v4 press', duration:25, players:'8', difficulty:'middels',
    description:'Intenst 4v4 der begge lag alltid presser. Utholdenhets- og taktikktrening.',
    steps:['4v4 på halvbane','Mister du ballen: press umiddelbart','Maks 3 touch','3×5 min med 2 min pause'],
    tips:['Kondisjonsmessig intenst','Bytt lag mellom periodene','Teller mål — motivasjon'],
    equipment:['Handball','Kjegler','Mål'] },

  { id:'hb-t08', sport:'handball', category:'hele_laget', name:'Defensiv organisasjonstrening', duration:30, players:'7', difficulty:'avansert',
    description:'Laget øver alle tre forsvarssystemer systematisk.',
    steps:['Øv 6-0 i 8 min','Øv 5-1 i 8 min','Øv 3-2-1 i 8 min','Kombiner: bytt på signal fra trener','Evaluering: when to use what?'],
    tips:['6-0: kompakt og rolig','5-1: aggressiv spiss er nøkkelen','3-2-1: kun mot svake oppbyggere','Trener: bytt raskt mellom systemene'],
    equipment:['Handball','Mål','Kjegler'] },

  { id:'hb-t09', sport:'handball', category:'hele_laget', name:'Simulert kampsituasjon', duration:30, players:'14', difficulty:'avansert',
    description:'Treningskamp med realistiske kampsituasjoner: utvisning, 7m, og siste minutt.',
    steps:['Normal 7v7 i 15 min','Simuler: rødt kort (6v7)','Simuler: 1 min igjen, én scoring foran','Simuler: 7m i siste sekund','Evaluering: hvordan reagerte laget?'],
    tips:['Simulerte situasjoner trener mentalitet','Tren 6v7 systematisk — det skjer alltid','Siste minutt: rolig og disiplinert','Lagleder tar kommandoen ved kritiske situasjoner'],
    equipment:['Handball','Mål'] },

  { id:'hb-t10', sport:'handball', category:'hele_laget', name:'Pasnings-nøyaktighet under bevegelse', duration:20, players:'8–14', difficulty:'middels',
    description:'Laget øver pasningspresisjon mens alle beveger seg.',
    steps:['Alle 7 i bevegelse (jogg)','Pasning til bevegelig mottaker','Mottaker signaliserer med arm','Øv på alle pasningstyper','Avansert: pasning foran løpet'],
    tips:['Passer: sikt foran mottakeren','Mottaker: arm opp = klar for mottak','Hold laget kompakt — ikke for spredt','Kommunisér hvem som sender til hvem'],
    equipment:['Handball'] },

  { id:'hb-t11', sport:'handball', category:'hele_laget', name:'Overtalls- og undertalls-spill', duration:25, players:'12–14', difficulty:'avansert',
    description:'Trener med numerisk overlegenhet og ulempe. 7v6 og 6v7.',
    steps:['7v6: angripere i overtall 5 min','6v7: forsvarerne i undertall 5 min','Bytt roller','Evaluering: hva fungerte best?'],
    tips:['7v6 angrep: bruk den ekstra — press alltid','6v7 forsvar: prioriter midten','6v7: keeper er ekstra viktig','Tren begge situasjonene like mye'],
    equipment:['Handball','Mål','Kjegler'] },

  { id:'hb-t12', sport:'handball', category:'hele_laget', name:'Lagstrategisk møte og demonstrasjon', duration:20, players:'7', difficulty:'middels',
    description:'Trener forklarer taktikk på banen med spillere på plass. Dynamisk taktikktavle.',
    steps:['Spillere i sin formasjon','Trener forklarer oppgave til hver rolle','3 situasjoner demonstreres: angrep, forsvar, overgang','Spillerne gjennomfører mot passive','Øk motstand til 50%'],
    tips:['Banen er tavlen — ikke whiteboardet','Vis — ikke bare fortell','Start sakte og øk farten','La spillerne stille spørsmål'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-t13', sport:'handball', category:'hele_laget', name:'Frekvent bytting og spillerotasjon', duration:20, players:'10–14', difficulty:'middels',
    description:'Trening på effektiv rotasjon og bytte av spillere uten å miste tempo.',
    steps:['7v7 med 3–4 reserver','Bytte skjer hvert 3. min — i løpende spill','Mål: bytte uten avbrudd','Reservene er alltid klare'],
    tips:['Bytte i løpende spill er krevende — øv dette','Spiller ute: gi signal til trener','Bytte: alltid på hjemmesiden av banen','Hold tempoet oppe ved bytte'],
    equipment:['Handball','Mål'] },

  { id:'hb-t14', sport:'handball', category:'hele_laget', name:'Psykisk motstandsdyktighetstrening', duration:20, players:'7–14', difficulty:'avansert',
    description:'Spillerne øver under psykisk press: publikum-lyder, dommerstress, og tidstrykk.',
    steps:['Trener spiller folkemengde-lyder (mobil/høyttaler)','Timer setter ekstreme tidsbegrensninger','Dommerfeil innimellom','Spillerne: hold fokus og disiplin'],
    tips:['Psykisk trening er undervurdert i håndball','Øv å beholde roen ved kontroverser','Lagleder: buffer mellom dommer og spillere','Evaluer: hvem beholdt fokus, hvem mistet det?'],
    equipment:['Handball','Mål','Høyttaler (valgfritt)'] },

  { id:'hb-t15', sport:'handball', category:'hele_laget', name:'Treningskamp med taktisk tema', duration:60, players:'14', difficulty:'avansert',
    description:'Treningskamp der ett taktisk punkt evalueres kontinuerlig.',
    steps:['Normal 7v7','Fokus: ett taktisk tema','Trener stopper maks 5 ganger','Siste 20 min: fritt spill','Video og evaluering etterpå'],
    tips:['Kun ÉTT tema — ikke alt','Stopp og vis: maks 30 sek','La spillerne ta initiativ på banen','Evaluer laget, ikke enkeltpersoner'],
    equipment:['Handball','Mål'] },

  // ─── KEEPER (10 øvelser) ─────────────────────────────────────

  { id:'hb-k01', sport:'handball', category:'keeper', name:'Reaksjonsredning multi-retning', duration:15, players:'2', difficulty:'middels',
    description:'Keeper øver raske bevegelser i alle retninger fra basisstilling.',
    steps:['Basisstilling: litt fremover, knær bøyd','Trener peker raskt i retning','Keeper: ett steg i retningen','Opp, ned, venstre, høyre','Legg til ball etter 5 min'],
    tips:['Tyngdepunkt FREMOVER','Sidestep — ikke kryss beina','Hender foran kroppen','Første steg er avgjørende'],
    equipment:['Handball','Mål'] },

  { id:'hb-k02', sport:'handball', category:'keeper', name:'Hjørneredning — stjerne-teknikk', duration:15, players:'2–4', difficulty:'middels',
    description:'Keeper øver å strekke seg til alle fire hjørner.',
    steps:['Skudd mot lav hjørne ×5 per side','Dykk: push-off med motstående fot','Skudd mot høy hjørne','Strekk med arm, blokker ballen','Doble skudd raskt'],
    tips:['Dykk med beina — ikke bare armer','Lav: push-off nærmeste hjørne, dykk','Høy: begge bein, strekk armen','Øynene på ballen alltid'],
    equipment:['Handball','Mål'] },

  { id:'hb-k03', sport:'handball', category:'keeper', name:'1v1 mot gjennombrudd', duration:20, players:'2–8', difficulty:'middels',
    description:'Keeper øver 1v1 mot gjennombrytende angriper.',
    steps:['Angriper fra 10m mot keeper','Keeper holder til angriper er 6m','Bli "stor": armer ut, bein fra hverandre','Avgjøre angriper til én side','Redde med beina'],
    tips:['Ikke kast deg — vent','Bli stor uten å helle','Armer OPP dekker mer areal','Dykk mot ballen idet angriper setter av'],
    equipment:['Handball','Mål'] },

  { id:'hb-k04', sport:'handball', category:'keeper', name:'Distribusjon etter redning', duration:15, players:'3–6', difficulty:'enkel',
    description:'Keeper øver rask distribusjon til riktig spiller etter redning.',
    steps:['Trener skyter','Keeper redder','To spillere i ulike posisjoner','Keeper velger raskt og kaster'],
    tips:['Stå opp RASKT og se feltet','Kast til frieren — aldri markerte','Underarmskast: trygt og presist','Keeper starter angrepet!'],
    equipment:['Handball','Mål'] },

  { id:'hb-k05', sport:'handball', category:'keeper', name:'Hoppskudd-sekvens', duration:15, players:'2–6', difficulty:'middels',
    description:'Keeper øver mot serie av hoppskudd. Posisjonering og timing.',
    steps:['Tre kastere, én om gangen','Hoppskudd fra 9m','Keeper: juster posisjon for hver','10 sek pause mellom kastere','Avansert: hoppskudd fra alle vinkler'],
    tips:['Hoppskudd: kasteren beveger seg — juster posisjonen','Start i midten, beveg deg mot kanten i løpet','Ikke commit FØR kastet er sluppet','Arms up — stor areal'],
    equipment:['Handball','Mål'] },

  { id:'hb-k06', sport:'handball', category:'keeper', name:'Fotarbeid og posisjonering', duration:15, players:'2', difficulty:'enkel',
    description:'Keeper øver posisjonering i mål: halvmåne og vinkelkutt.',
    steps:['Trener viser kasterposisjon','Keeper: beveg til riktig posisjon (vinkelkutt)','Øv fra alle 6 soner','Avansert: keeper posisjonerer FØR skudd','Keeper: "halvmåne" bevegelse'],
    tips:['Halvmåne: alltid på vinkelens bisektrise','1.5–2m fremover fra mål: gjør deg stor','For nær: taper høyde; For langt: romsitter','Øv uten skudd FØR med skudd'],
    equipment:['Handball','Mål','Kjegler'] },

  { id:'hb-k07', sport:'handball', category:'keeper', name:'Lave og harde skudd', duration:15, players:'2–4', difficulty:'middels',
    description:'Keeper øver spesifikt på lave harde skudd nær stolper og gulv.',
    steps:['Skyttere fra 9m: lave og harde skudd','Keeper: lav posisjon forberedt','Redde med beina (split)','Avansert: raskt opp igjen etter redning'],
    tips:['Split: spre beina snabbt og lavt','Hold rumpa nede — ikke opp','Hender foran — suppler beina','Øv split-stilling uten ball FØR med ball'],
    equipment:['Handball','Mål'] },

  { id:'hb-k08', sport:'handball', category:'keeper', name:'Vinkelskudd fra kanter', duration:15, players:'3–6', difficulty:'middels',
    description:'Keeper øver posisjonering og redning av skudd fra smal vinkel.',
    steps:['Kaster fra kant-posisjon (liten vinkel)','Keeper: posisjonér seg til å kutte vinkelen','Kant skyter','Keeper redder','Begge kanter'],
    tips:['Kantskudd: posisjonér deg nær nærmeste stolpe','Du dekker 60% av mål — kaster reduseres til 40%','Ikke forsøk å dekke bakre stolpe (for langt)','Nær stolpe: stopp nær og blokker'],
    equipment:['Handball','Mål'] },

  { id:'hb-k09', sport:'handball', category:'keeper', name:'Kommunikasjon og kommandogiving', duration:15, players:'3–7', difficulty:'enkel',
    description:'Keeper øver å ta kommandoen og kommunisere med forsvarerne.',
    steps:['Keeper + 2 forsvarere vs angripere','Keeper: kommanderer alle forsvarsbeslutninger','Situasjoner: innlegg, 7m, gjennombrudd','Fokus: høy og klar stemme'],
    tips:['Keeper: du er øynene bak forsvaret','Kommandér tidlig — ikke i siste sekund','Bruk navn: "Ole: din!" ikke bare "din!"','Etter redning: kommandér umiddelbart'],
    equipment:['Handball','Mål'] },

  { id:'hb-k10', sport:'handball', category:'keeper', name:'Psykisk trening for keepere', duration:20, players:'2', difficulty:'middels',
    description:'Keeper øver å håndtere mål, dårlige perioder og prestasjon under press.',
    steps:['Serie: 10 skudd — keeper SKAL slippe noen inn','Fokus: rask recovery etter mål','Visualisering: se deg selv redde neste skudd','Avansert: hele laget ser på','Trener: gi konstruktiv feedback'],
    tips:['Mål er uunngåelig — recovery er nøkkelen','Aldri heng hodet — neste ball er ny sjanse','Visualisering FØR økt: 5 min mental forberedelse','Trener: aldri klandre keeper for lagets feil'],
    equipment:['Handball','Mål'] },

  // ─── FYSISK (10 øvelser) ─────────────────────────────────────

  { id:'hb-f01', sport:'handball', category:'fysisk', name:'Eksplosiv startsprint', duration:20, players:'alle', difficulty:'middels',
    description:'Eksplosive startsteg og sprint 5–10m. Grunnlag for gjennombrudd.',
    steps:['Startposisjon: sidestep-stance (lav)','Sprint 5m ×8','Sprint 10m ×6','Backpedal 3m → sprint 8m ×5','Pause 45 sek mellom rep'],
    tips:['Første steg: push-off fra bakre fot','Knærne bøyd ved start','Armer: pump frem og bak','Reaksjon: se signal, reagér umiddelbart'],
    equipment:['Kjegler'] },

  { id:'hb-f02', sport:'handball', category:'fysisk', name:'Kastkraft med medisinball', duration:20, players:'2–10', difficulty:'middels',
    description:'Kastkraft-trening med medisinball. Skulder, overkropp og kastkraft.',
    steps:['Brystkast til partner ×15','Overhead kast ×12','Sidekast: roter og kast ×10 per side','Etterhånds kast som håndballkast ×10 per arm'],
    tips:['Brystkast: push fra brystet','Etterhånds: fullt kast-mønster','Juster vekt: 2–4 kg','Strekk skulder og nakke etterpå'],
    equipment:['Medisinball (2–4 kg)'] },

  { id:'hb-f03', sport:'handball', category:'fysisk', name:'Sidestep og lateral agilitet', duration:15, players:'alle', difficulty:'enkel',
    description:'Lateral agilitet for forsvarsspillet.',
    steps:['5m sidestep venstre ×10','5m sidestep høyre ×10','Kjegle-touch: 6 kjegler, touch alle ×5','Med armer oppe ×8','Med ball i hånden ×8'],
    tips:['IKKE kryss beina','Knærne bøyd gjennom bevegelsen','Hurtig og lett','Armer oppe simulerer blokkering'],
    equipment:['Kjegler'] },

  { id:'hb-f04', sport:'handball', category:'fysisk', name:'Skulder-styrketrening (prevensjon)', duration:20, players:'alle', difficulty:'middels',
    description:'Skulder-styrketrening for kastere. Prevensjon og kraftutvikling.',
    steps:['Ekstern rotasjon med strikk ×15 per arm','Intern rotasjon med strikk ×15','Front-raises 2–3 kg ×12','Side-raises 2–3 kg ×12','Skulder-press sittende ×10'],
    tips:['Ekstern rotasjon: viktigst for skadeforebygging','Lett vekt','Kontrollert bevegelse ikke fart','Gjør dette ETTER kast-trening'],
    equipment:['Gummistrikk','Lette hantler (1–3 kg)'] },

  { id:'hb-f05', sport:'handball', category:'fysisk', name:'Hoppstyrke og landing', duration:15, players:'alle', difficulty:'middels',
    description:'Hoppstyrke og landing-teknikk. Kritisk for hoppskudd.',
    steps:['Box-jump ×8','Single-leg landing ×8 per bein','Lengdehopp ×8','Kontinuerlig hoppeserier ×6','Dribble + hopp + kast kombinasjon'],
    tips:['Landing: bøyde knær alltid','Single-leg: aktiv muskel, ikke "kræsj"','Hoppskudd: fremover ikke bare opp','Landingsøvelser like viktig som hopp'],
    equipment:['Kasse','Handball'] },

  { id:'hb-f06', sport:'handball', category:'fysisk', name:'Intervall-løp med ball', duration:25, players:'alle', difficulty:'middels',
    description:'Intervall-kondisjonstrening med håndball. Spesifikk for kampsituasjoner.',
    steps:['Løp halvbane med ball i 30 sek, pause 30 sek','8 intervaller','Variere: sprint, jog, sprint, jog','Avansert: pasning + løp i intervallet'],
    tips:['Intervall med ball = spesifikk for håndball','Hold dribbling teknisk korrekt UNDER belastning','Pause: aktiv (saktere jogg, ikke stopp)','Juster tid: 20 sek/40 sek for nybegynnere'],
    equipment:['Handball','Kjegler'] },

  { id:'hb-f07', sport:'handball', category:'fysisk', name:'Core-styrke for kastere', duration:20, players:'alle', difficulty:'enkel',
    description:'Core-trening spesifikt designet for kast-kraft i håndball.',
    steps:['Plank 45 sek ×3','Side-plank 30 sek per side ×2','Russian twists med ball ×20','Pallof press med strikk ×12 per side','Dead bug ×10 per side'],
    tips:['Core er koblingen mellom bein og armer i kastet','Plank: alt aktivt — ikke passivt','Russian twists: rotasjon = kastkraft','Gjør dette 3× per uke'],
    equipment:['Matter','Gummistrikk','Medisinball (valgfritt)'] },

  { id:'hb-f08', sport:'handball', category:'fysisk', name:'Plyometri for angripere', duration:20, players:'alle', difficulty:'middels',
    description:'Eksplosive øvelser for angripere og pivotspillere.',
    steps:['Jump squats ×10','Tuck jumps ×8','Lateral bounds ×10 per side','Depth jump ×8 (hopp ned fra kasse, umiddelbart opp)','Hopp + kast kombinasjon ×8'],
    tips:['Maksimal kraft hvert hopp','Pause 60–90 sek mellom serier','Depth jump: minimalisér kontakttid','Kombiner alltid med kast til slutt'],
    equipment:['Kasse','Handball'] },

  { id:'hb-f09', sport:'handball', category:'fysisk', name:'Aerob grunntrening', duration:30, players:'alle', difficulty:'enkel',
    description:'Aerob kapasitet for håndball-utholdenheten.',
    steps:['30 min jogg 65–70% makspuls','Alternativt: 3×10 min jogg, 1 min gå-pause','Du skal KUNNE snakke','Øk 10% per uke'],
    tips:['Aerob grunnlag støtter alt annet i håndball','Variér underlag','Ikke løp for fort — du trener feil system','Kombiner med ball-øvelser om ønskelig'],
    equipment:['Ingen spesialutstyr'] },

  { id:'hb-f10', sport:'handball', category:'fysisk', name:'Håndball-spesifikt HIIT', duration:25, players:'alle', difficulty:'avansert',
    description:'HIIT-protokoll tilpasset håndball: kast, sprint, forsvar i serie.',
    steps:['30 sek: sprint + kast (5 kast i rad)','15 sek pause','30 sek: defensiv sidestep','15 sek pause','30 sek: burpee + hopp','15 sek pause; 5 runder'],
    tips:['Håndball-HIIT: kombinerer alle elementer','Hold kasteknikk god under belastning','ALLE 30 sek: maksimal innsats','Registrer antall kast per runde for fremgang'],
    equipment:['Handball','Mål','Kjegler'] },
];

// ════════════════════════════════════════════════════════════════
//  KOMBINERT BIBLIOTEK OG HJELPEFUNKSJONER
// ════════════════════════════════════════════════════════════════

export const ALL_DRILLS: Drill[] = [...FOOTBALL_DRILLS, ...HANDBALL_DRILLS];

export function getDrillsBySport(sport: DrillSport): Drill[] {
  return ALL_DRILLS.filter(d => d.sport === sport);
}

export function getDrillsByCategory(sport: DrillSport, category: DrillCategory): Drill[] {
  return ALL_DRILLS.filter(d => d.sport === sport && d.category === category);
}

export function getISOWeek(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
}

/** Henter 4 ukens øvelser basert på ISO-ukenummer (roterer automatisk) */
const VALID_CATEGORIES = ['offensivt','defensivt','hele_laget','keeper','fysisk'];

export function getWeeklyDrills(sport: DrillSport, categoryOrGroup?: DrillCategory | string): Drill[] {
  const cat = (categoryOrGroup && VALID_CATEGORIES.includes(categoryOrGroup))
    ? categoryOrGroup as DrillCategory : undefined;
  const pool = cat ? getDrillsByCategory(sport, cat) : getDrillsBySport(sport);
  if (pool.length === 0) return [];
  const offset = getISOWeek() % pool.length;
  const result: Drill[] = [];
  for (let i = 0; i < Math.min(4, pool.length); i++) {
    result.push(pool[(offset + i) % pool.length]);
  }
  return result;
}

/** Alias for backwards compatibility with SmartCoach.tsx */
export function getDrillsForContext(sport: DrillSport, categoryOrGroup?: DrillCategory | string): Drill[] {
  const cat = (categoryOrGroup && VALID_CATEGORIES.includes(categoryOrGroup))
    ? categoryOrGroup as DrillCategory : undefined;
  return cat ? getDrillsByCategory(sport, cat) : getDrillsBySport(sport);
}

export const CATEGORY_LABELS: Record<DrillCategory, string> = {
  offensivt:    '⚔️ Offensivt',
  defensivt:    '🛡️ Defensivt',
  hele_laget:   '👥 Hele laget',
  keeper:       '🧤 Keepertrening',
  fysisk:       '💪 Fysisk',
};

/** DRILL_LIBRARY alias for SmartCoach.tsx */
export const DRILL_LIBRARY = ALL_DRILLS;

/** Sport type alias (SmartCoach uses Sport, not DrillSport) */
export type Sport = DrillSport;