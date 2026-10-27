# Plan for animerte øvelser

Alle 153 øvelsene i biblioteket er gått gjennom og sortert i to lister.

- **Egnet:** oppsettet og forløpet står tydelig i øvelsesteksten, og kan vises
  med spillere, ball, kjegler og mål uten å finne på regler, avstander eller
  pasningsmønstre.
- **Ikke egnet:** styrke, bevegelse eller kondisjon uten ball, balanse og
  uttøyning, fritt spill der forløpet ikke er beskrevet, eller noe brettet ikke
  kan vise (vegg, rop, strikk). Også øvelser der ballen ikke kan ende hos en
  spiller, fordi valideringen krever det.

**Totalt: 46 egnet og 107 ikke egnet.** 34 er animert (merket «animert»). Fem er hoppet over (merket «hoppet over», med grunnen).

Animasjonene ligger i `src/data/drillAnimations/` (én fil per kategori) og
kontrolleres av `src/features/drill-animation/validate.test.ts`. Testen
`plan.test.ts` i samme mappe sjekker at hver øvelse står nøyaktig én gang her.

## Hva animasjonene kan vise

- Spillere som glir, føring, vending, og ballen som synlig pasning (langs
  bakken), sentring (bue), skudd (sent og raskt, lav bue), høy ball (høyt over
  figurene), avbøyning og takling (ballen bytter eier straks).
- Keeper som slenger seg (`dive`): drakten tippes i 2D, figuren legger seg på
  siden i 3D. Fallet går langs mållinjen, så i 3D synes det best fra
  «Ovenfra» eller med kameraet dreid; fra «Oversikt» går det rett innover i bildet.
- Fanget ball (`held`): ballen ligger inntil drakten i 2D og i brysthøyde i 3D.
  Boksing (`punch`): ballen slås høyt og langt ut, bare i siste fase.
- Ikke mulig: hender og armer som griper eller bokser, å gå ned på ett kne.
  Spillermodellen har bare stå/jogge/sprinte.
- Tempo ved 1×: 1,3 s bevegelse og 0,15 s pause per fase.
- Draktnummeret står på bryst og rygg i 3D; over hodet står bare rollen (A, F, K …).
- En ekstra ball kan være utstyr som flytter seg fra fase til fase (`moveItems`), når to
  baller er i spill samtidig. Den glir i rett linje, uten bue.

### Runde 1, rettet etter gjennomgang

- Ballskjoldet, Katt og mus, Rekkevidde og skyv, Reaksjon på kort hold, Felt-duellen,
  Reaksjon via avbøyning, Feltkommando, Straffespark: slenging, fanging, høy ball,
  boksing og avbøyning der teksten beskriver det.
- 1 mot 1 – nærduell og blokk: skuddet kommer raskere og fra litt lenger unna.
- Kjeglefangeren: forsvareren spiller ballen før utrykningen (ikke føring).
- Tålmodigheten og Rask hjemjobb: taklingen er en egen, tydelig ballbevegelse.
- Dobbeltmuren: de tre ventende spillerne er fjernet (ingen rolle i teksten).
- 1 mot 1 kanalforsvar: de to ventende beholdes (parene bytter på, og uten dem
  får ikke 2D-utsnittet plass langs sidelinjen).
- Firerlinjen: ingen sentring, takling eller keeper står i teksten, så ingen er lagt til.

### Runde 2

- Animert: Fire hjørner, Pasningsfirkant, Pasningsslalåm, Tredjemannsløp,
  Skyting på mål – stafett, Spill til feilvendt spiss, Føre på løpende rekke i
  sikk-sakk, Jaktstafett med ball, Prepp'n 4 – Soneforsvar og Pendelløp med ball.
- Der flere par eller lag jobber samtidig med hver sin ball, vises ett
  (Pasningsslalåm, Skytestafett, Jaktstafett). I Fire hjørner vises ballen i
  kombinasjonen; teksten sier ikke hvor den andre ballen er.
- Spill til feilvendt spiss: teksten gir valget «legge igjen eller vinkle ut på
  kant»; animasjonen viser kanten, siden kanten må utfordre kjegla og slå innlegg.
- Hoppet over: Dortmund-firkanten, Føring i sikk sakk, 1 mot 1 – vende, drible
  og skyte, og Avslutningskonkurranse (grunnen står ved hver øvelse).

### Runde 2, rettet etter gjennomgang

- 1 mot 1 – nærduell og blokk: keeperen rykker ut mens angriperen fører, og går i blokk ca. 5 m ut.
- Rask hjemjobb: taklingen er en sklitakling (forsvareren går i bakken).
- Føring i sikk sakk med avslutning og 1 mot 1 – vende, drible og skyte er animert med
  den andre ballen som utstyr som følger spilleren. Løypa i sikk-sakk-øvelsen er tolket:
  to kjeglerekker inn mot én kjegle i midten, med målet i enden.
- Avslutningskonkurranse er fortsatt hoppet over: den trenger 8 faser. Grensen kan heves
  hvis vi vil (hele øvelsen holder seg da fortsatt under 12 sekunder).

## Egnet (46)

### Keeper (12)

- `keeper-y-02` Ballskjoldet – trener triller ballen fra 8 m, keeperen rykker frem og griper. **(animert)**
- `keeper-y-03` Katt og mus i feltet – servitør, angriper og keeper har faste plasser i skissen; innlegget fanges. **(animert)**
- `keeper-y-06` Grep og fall – to og to – fast rekkefølge med fire skudd fra én skytter (må samles i maks seks faser). *(hoppet over: fire skudd og tre returer er åtte ballbevegelser, mer enn seks faser)*
- `keeper-y-08` Rekkevidde og skyv – trener kaster fra 5–6 m mot sidene, keeperen skyver fra. **(animert)**
- `keeper-a-01` 1 mot 1 – nærduell og blokk – angriperen fører fra 20 m; teksten beskriver valgene keeperen har. **(animert)**
- `keeper-a-02` Reaksjon på kort hold – to dukker 11 m ut, skytter 16 m ut som skyter mellom dem. **(animert)**
- `keeper-a-03` Skift av akse og skyv – fast rekkefølge: rull, forflytning, skudd mot lange hjørne (to baller). *(hoppet over: den første ballen ender ikke hos noen før skuddet med den andre ballen)*
- `keeper-a-05` Parade og redd – to trenere på hver sin side skyter etter hverandre (to baller). *(hoppet over: andre skudd kommer med en ny ball, og brettet har én ball)*
- `keeper-a-07` Felt-duellen – innlegg mot 5-meteren med en forsvarer og en angriper foran keeperen. **(animert)**
- `keeper-a-08` Reaksjon via avbøyning – skudd fra 16 m mot en medspiller 8–10 m ut som avbøyer. **(animert)**
- `keeper-a-09` Feltkommando etter løp – kjeglerekke, innlegg fra siden og duell i 5-meteren i fast rekkefølge. **(animert)**
- `keeper-a-10` Straffespark – les og reager – skytter på 11-meteren og keeper på linja. **(animert)**

### Forsvar (17)

- `forsvar-y-02` Kjeglefangeren – sone 10×10 m med to kjegler; forsvareren leder angriperen bort fra dem. **(animert)**
- `forsvar-y-04` Tålmodigheten – korridor 12×5 m; forsvareren rykker frem og stopper 1–2 m foran. **(animert)**
- `forsvar-y-05` Murbyggerne – angriper 10 m foran småmålet, forsvareren rykker ut og blokkerer. **(animert)**
- `forsvar-y-06` Rask hjemjobb – angriper 20 m ute, forsvarer 3 m bak som løper hjem. **(animert)**
- `forsvar-y-07` Dobbeltmuren – bane 12×12 m; én presser, én sikrer 3–4 m bak. **(animert)**
- `forsvar-y-08` 2 mot 2 kompakt – forsvarerne flytter seg sidelengs når ballen spilles på tvers. **(animert)**
- `forsvar-y-09` Bryteren – pasningslegger 12–15 m unna, forsvareren kommer foran og bryter. **(animert)**
- `forsvar-y-13` Taklingsmesteren – to løper side om side før en støttakling. **(animert)**
- `forsvar-a-01` 1 mot 1 kanalforsvar – korridor 15×8 m; forsvareren styrer mot sidelinjen. **(animert)**
- `forsvar-a-03` Firerlinjen som enhet – fire forsvarere forskyver seg når ballen spilles fra side til side. **(animert)**
- `forsvar-a-07` Stopperduell og støttepasning – oppspill fra 20 m til feilvendt spiss med stopper bak.
- `forsvar-a-08` Backspill: stenge innlegg – back rykker ut mot kantspiller 25 m fra mål.
- `forsvar-a-10` Dødballforsvar – fast oppstilling med soneforsvarere og mannsmarkører ved hjørnespark.
- `forsvar-a-12` Dobbelt press på kanten – back foran ballfører, egen kant 5–8 m bak og innenfor.
- `forsvar-a-13` Takling og blokkering under høy belastning – kjeglerekke, skuddblokk og 1 mot 1 i fast rekkefølge.
- `forsvar-a-14` Offsidefelle og linjekontroll – firerlinja hever eller faller av på signal.
- `forsvar-a-15` Forsvar mot lange innkast – innkast 25–30 m fra mål med fast plassering i feltet.

### Midtbane (7)

- `midtbane-y-04` Fire hjørner – A til B, støttepasning tilbake, vending og pasning til C (to baller). **(animert)**
- `midtbane-y-05` Pasningsfirkant – pass og følg – pasning til neste kjegle og løp etter ballen. **(animert)**
- `midtbane-y-06` Dortmund-firkanten – fast rekkefølge mellom A, B og C med løp bak markøren. *(hoppet over: markørene står i to rekker, men det står ikke hvor B sin markør er, som B løper bak)*
- `midtbane-y-11` Pasningsslalåm – to og to – pasninger frem og tilbake gjennom en slalåmløype. **(animert)**
- `midtbane-y-14` Pasning til mål – tre hjørner – 1 til 2, 2 til 3, avslutning, alle følger pasningen. **(animert)**
- `midtbane-a-10` Vendespill – ut av press – A til B, B vender bort fra presset og spiller til C. **(animert)**
- `midtbane-a-14` Tredjemannsløp – fast kombinasjon: A til B, B legger av til C. **(animert)**

### Angrep (5)

- `angrep-y-01` Føring i sikk sakk med avslutning – kjeglerekke, rundt kjegla og avslutning (to baller samtidig). **(animert)**
- `angrep-y-10` 1 mot 1 – vende, drible og skyte – pasning til midtspiller som vender rundt kjegla og avslutter. **(animert)**
- `angrep-y-13` Avslutningskonkurranse – tre og tre – tre kjegler med fast rekkefølge: føring og skudd, veggspill, innlegg. *(hoppet over: fast rekkefølge med sju ballhendelser – føring og skudd, pasning, legg igjen, skudd, ut av feltet og vente, innlegg, avslutning – trenger 8 faser; grensen er 6)*
- `angrep-y-15` Skyting på mål – stafett – føring til en kjegle og skudd på mål. **(animert)**
- `angrep-a-09` Spill til feilvendt spiss – oppspill, legg igjen til kant, innlegg og duell i boksen. **(animert)**

### Cardio (5)

- `cardio-y-02` Vendingsstafett – blå og rød kjegle 10 m fra hverandre, føring, vendinger og sentring. **(animert)**
- `cardio-y-03` Føre på løpende rekke i sikk-sakk – to rekker, føring gjennom sikk-sakk over til den andre siden. **(animert)**
- `cardio-y-09` Jaktstafett med ball – én fører rundt sløyfen, siste i rekka jager. **(animert)**
- `cardio-a-02` Prepp'n 4 – Soneforsvar – trener spiller mot en kjegle, én presser og resten skyver mot ballsiden. **(animert)**
- `cardio-a-10` Pendelløp med ball – føring mellom to kjegler 15–20 m fra hverandre. **(animert)**

### Styrke (0)

Ingen.

## Ikke egnet (107)

### Keeper (6)

- `keeper-y-01` Kjeglejakten – forflytning uten ball etter fargen treneren roper.
- `keeper-y-04` Reaksjonsspeilet – mest fri speiling uten ball; forløpet er ikke fast.
- `keeper-y-05` Presisjonsoppspill – kastet går gjennom en port uten mottaker, så ballen ender ikke hos en spiller.
- `keeper-y-07` Alene mot veggen – egentrening mot vegg, som ikke kan vises på banen.
- `keeper-a-04` Presset igangsetting – keeperen velger fritt blant fem måter å starte angrepet på.
- `keeper-a-06` Vinkeljageren – tre angripere spiller fritt seg imellom før skudd.

### Forsvar (13)

- `forsvar-y-01` Skyggen min – sidelengs bevegelse uten ball.
- `forsvar-y-03` Nappe haler – fri lek der alle har ball.
- `forsvar-y-10` Boksforsvareren – klareringen går ut mot siden og ender ikke hos en spiller.
- `forsvar-y-11` Pressfella i hjørnet – fritt pressespill uten fast forløp.
- `forsvar-y-12` Bølgeforsvar – kontinuerlige frie angrep i bølger.
- `forsvar-y-14` Nekt pasningen – fritt pasningsspill rundt en firkant.
- `forsvar-y-15` Linjeforsvar 4 mot 4 – spilløvelse uten fast forløp.
- `forsvar-a-02` 2 mot 2 soneforsvar – forsvarerne veksler fritt mellom press og sikring.
- `forsvar-a-04` Lav blokk og boksforsvar – frie angrep med innlegg og mange spillere.
- `forsvar-a-05` Høyt press og gjenvinning – fritt pressespill 4 mot 4 med jokere.
- `forsvar-a-06` Restforsvar under kontring – hvordan de tre angriperne angriper, er ikke beskrevet.
- `forsvar-a-09` Defensiv omstilling – spill på halv bane uten fast forløp.
- `forsvar-a-11` Midtbaneankeret – fritt spill foran stopperne.

### Midtbane (23)

- `midtbane-y-01` Sjef over ballen – fri føring der alle har ball.
- `midtbane-y-02` Portene – fri føring gjennom tilfeldig plasserte porter.
- `midtbane-y-03` Vendingsskole – treneren viser vendingene; føringen er fri.
- `midtbane-y-07` Rondo 4 mot 1 – fritt pasningsspill.
- `midtbane-y-08` Rondo 3 mot 1 – fritt pasningsspill.
- `midtbane-y-09` 2 mot 2 med joker – fritt spill.
- `midtbane-y-10` 3 mot 3 pluss joker – fritt spill, og banen er ikke beskrevet.
- `midtbane-y-12` Tre mot to – fritt spill fra ende til ende.
- `midtbane-y-13` Fangeleken – fri lek med mange baller.
- `midtbane-y-15` Lag den lengste rekka – fritt pasningsspill uten mål.
- `midtbane-a-01` Bearbeiding mot front-trio – stort spill uten fast forløp.
- `midtbane-a-02` 2 mot 2 pluss joker – fritt spill med flere valg.
- `midtbane-a-03` Spill til 9'er og overgangsforsvar – mange spillere og fritt overgangsspill.
- `midtbane-a-04` 5 mot 5 mot to mål – spilløvelse.
- `midtbane-a-05` Napoli – fritt spill mellom to firkanter og en sone.
- `midtbane-a-06` Rondo 5 mot 2 – fritt pasningsspill.
- `midtbane-a-07` Rondo 4 mot 2 med overgang – fritt pasningsspill.
- `midtbane-a-08` 3 mot 3 pluss 3 joker – fritt posisjonsspill.
- `midtbane-a-09` 1 mot 1 med kraft – fri duell om ballen.
- `midtbane-a-11` Fire mot fire pluss to – spilløvelse.
- `midtbane-a-12` Pressing-trigger – 6 mot 6 der presset avhenger av signaler i spillet.
- `midtbane-a-13` Bytt spillet – 5 mot 5 med jokere, fritt spill.
- `midtbane-a-15` 6 mot 6 pluss keepere – spilløvelse.

### Angrep (25)

- `angrep-y-02` 2 mot 1 – mot ett mål – hvordan angriperne spiller seg forbi, er ikke beskrevet.
- `angrep-y-03` 3 mot 2 mot ett mål – fritt angrep.
- `angrep-y-04` Champions League – turnering med frie småkamper.
- `angrep-y-05` 4 mot 4 med vegger – fritt spill.
- `angrep-y-06` 2 mot 1 – Waves – frie angrep i bølger.
- `angrep-y-07` 2 mot 1 i boks – fritt angrep mot én forsvarer.
- `angrep-y-08` 1 mot 1 fra siden mot mål – fri duell.
- `angrep-y-09` 2 mot 2 fra siden mot mål – fritt spill.
- `angrep-y-11` 3 mot 2 mot ett mål (16-meteren) – fritt angrep.
- `angrep-y-12` 2 mot 2 – komme til avslutning – fritt spill mot stort mål og småmål.
- `angrep-y-14` Fire mål – fritt spill.
- `angrep-a-01` Fire mot fire i firkant med spill opp mot mål – kamp om ballen og fritt spill.
- `angrep-a-02` Mellomrom og treergrupper – treergruppene angriper fritt.
- `angrep-a-03` Stor sone og gul sone – 8 mot 8 til 10 mot 10.
- `angrep-a-04` Fire mot fire og små mål – fritt spill før 1 mot 1.
- `angrep-a-05` Fire mot fire og to porter – fritt spill.
- `angrep-a-06` 3 mot 3 i firkant og 3 mot 2 pluss keeper – fritt spill.
- `angrep-a-07` Soneinndeling med småmål – mange soner og spillere, fritt spill.
- `angrep-a-08` Blått lag mot rødt – tre småmål – fritt spill.
- `angrep-a-10` 3 mot 3 i boksen med innlegg – fritt spill.
- `angrep-a-11` Overtall fra sidekorridor og løp i boks – mange spillere og valgfrie løsninger.
- `angrep-a-12` Stoppere bak mål og oppspill – fritt spill etter oppspillet.
- `angrep-a-13` Overtall på tilrop – treneren roper tall; spillet er fritt.
- `angrep-a-14` 11 mot 11 – frispill fra første tredjedel – full kamp.
- `angrep-a-15` Angrep mot forsvar – innlegg og 2 mot 1 – fritt spill.

### Cardio (15)

- `cardio-y-01` Kontroll på egen ball – fri lek der alle har ball.
- `cardio-y-04` Dribling gjennom boksen – kjeglene er tilfeldig plassert.
- `cardio-y-05` UEFA PlayMakers – Vaiana – fri fangelek.
- `cardio-y-06` UEFA PlayMakers – Innsiden ut – fangelek uten ball.
- `cardio-y-07` Stiv heks med ball – fri fangelek.
- `cardio-y-08` Fire mål – kontinuerlig småspill – fritt spill.
- `cardio-y-10` Kjeglekamp – fritt spill mellom to lag.
- `cardio-a-01` Prepp'n 2 – Retningsforandringer – løp uten ball.
- `cardio-a-03` Prepp'n 6 – 1 mot 1 inne i sirkelen – fri duell.
- `cardio-a-04` Prepp'n 7 – 1 mot 1 mot mål – fri duell.
- `cardio-a-05` Prepp'n 9 – 1 mot 1 mot dødlinje – fri duell.
- `cardio-a-06` Prepp'n 18 – 1 mot 1 i prioriterte rom – fri duell.
- `cardio-a-07` 4 mot 4 med to porter – fritt spill.
- `cardio-a-08` 5 mot 5 mot to mål – spilløvelse.
- `cardio-a-09` 3 mot 3 – kontinuerlig spill – fritt spill.

### Styrke (25)

- `styrke-y-01` Ett bens stående tåhev – styrke og balanse uten ball.
- `styrke-y-02` Ett bens stående rotasjon – balanse uten ball.
- `styrke-y-03` Ett bens stående beinsving på ustabilt underlag – balanse uten ball.
- `styrke-y-04` Hopp med kontrollert ett beins landing – hopp uten ball.
- `styrke-y-05` Utfall – sideveis – styrke uten ball.
- `styrke-y-06` Utfall – fremover – styrke uten ball.
- `styrke-y-07` Froskehopp – hopp uten ball.
- `styrke-y-08` Krabbegange og dyreløyper – bevegelse uten ball.
- `styrke-y-09` Hinderløype med hopp og balanse – løype uten ball.
- `styrke-y-10` Balansekamp – balanse i par uten ball.
- `styrke-y-11` Trillebår-stafett – styrke i par uten ball.
- `styrke-y-12` Utfall – bakover – styrke uten ball.
- `styrke-a-01` Utfall – fremover – styrke uten ball.
- `styrke-a-02` Utfall – sideveis med kontakt – styrke i par uten ball.
- `styrke-a-03` Kombinasjon av retningsforandringer – bevegelse uten ball.
- `styrke-a-04` Push up-stilling i planke – styrke uten ball.
- `styrke-a-05` Stående et beins utfall med minibands – styrke med strikk.
- `styrke-a-06` Stående et beins utfall med minibands – økt fart – styrke med strikk.
- `styrke-a-07` En arms skyv i strikk – armene over hodet – styrke med strikk.
- `styrke-a-08` En arms skyv i strikk – armene ut til siden – styrke med strikk.
- `styrke-a-09` Spensthopp – kryss – hopp uten ball.
- `styrke-a-10` Ett beins balanse med kontakt – balanse i par uten ball.
- `styrke-a-11` Kroppsvekt-krets – styrkestasjoner uten ball.
- `styrke-a-12` Nordic hamstring – styrke i par uten ball.
- `styrke-a-13` Sideplanke med beinløft – styrke uten ball.
