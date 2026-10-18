## Trening: fire rettelser etter oppdeling (18.10.2026)

- Start-knappen sammenligner nå lokale kalenderdatoer fra midnatt. En trening
  i dag kan startes hele dagen, også etter det oppgitte klokkeslettet.
- Den uvirksomme `saving`-tilstanden og «Oppretter …» er fjernet.
  Oppretting og lagring skjer fortsatt med samme synkrone kall.
- Alle 12 fokusvalg vises i den eksisterende listen som brytes over flere linjer.
- Pause/Fortsett har samme `inline-flex`, sentrering og ikonavstand som Avbryt.
  De eksisterende fargene er beholdt.

`e2e/training.spec.ts` bruker dagens dato med styrt klokke i Europe/Oslo,
uten omveien med fremtidig dato. Begge brukerflytene (desktop og mobil
390 × 844) kontrollerer Start for dagens trening etter oppgitt klokkeslett,
alle 12 fokusvalg og at knappene ligger innenfor skjermbredden. Det siste
fokusvalget velges også, med kontroll av lagringen og innhold etter omlasting.

Etterkontrollen fant at fokusvalget «Taktikk» og hovedmenyen har samme navn.
Testvelgerne er derfor avgrenset til fokusfeltet, med kontroll av nøyaktig
12 valg. Testklokken installeres før siden lastes, og nedtellingen kontrolleres
sekund for sekund slik at React rekker å oppdatere mellom stegene. Ingen
eksisterende kontroller er fjernet eller svekket. Mobilbildet er kontrollert
visuelt: alle 12 fokusvalg ligger på tre rader uten å gå utenfor skjermen.

**Kontroller 18.10.2026:**

| Kommando | Resultat |
| --- | --- |
| `npx tsc --noEmit` | Bestått, kode 0; også kjørt etter siste testendring |
| `npx vitest --run` | Bestått, 29 filer / 304 tester, kode 0 (`VITEST_MAX_WORKERS=1`) |
| `npm run build` | Bestått, kode 0 |
| `npm run test:e2e -- --workers=1` | 37/38 bestått, kode 1; begge Trening-tester bestått |
| `npm run test:offline` | Bestått, 3 produksjonstester med nytt bygg, kode 0 |

Første fullkjøring fant for brede fokusvelgere og tidsavbrudd i den
eksisterende 3D-WebM-testen. Deretter ble treningstestene fullført med samlet
klokkeoppsett og kontroll av hvert nedtellingssekund; begge passerer separat
og i siste fullkjøring. Ingen tester er fjernet eller hoppet over.

**Gjenstående avvik utenfor Trening:** Vanlig 3D-WebM-eksport fikk tidsavbrudd
i begge fullkjøringene (`board3d.spec.ts:353`, 90 sekunder på ferdigmelding,
120 sekunder totalt). Samme uendrede test passerte på ny testserver i en
avgrenset kjøring (24,9 sekunder). Dette tilsvarer ustabiliteten som allerede
er beskrevet i etterkontrollen fra 17.10.2026. Kravet om at alle kontroller
skal passere er derfor ikke oppfylt. 3D-koden, testen og tidsgrensene er
beholdt; videre retting må avklares som en egen oppgave fordi denne oppgaven
uttrykkelig bare gjelder de fire funnene i Trening.

Ingen andre funn rettes i denne omgangen. Ingen pakker er installert eller
endret, og ingenting er publisert, deployet, committet eller pushet.
Som tidligere måtte testenes egne, identifiserte serverprosesser stoppes
etter ferdige nettlesertester på Windows for at kommandoene skulle avslutte.
Ingen andre prosesser er stoppet. Browserslist- og terminalfargevarsler
hindret ikke bygg eller tester. Ingen genererte filer inngår i endringene.

Manuell prøve: Åpne appen som vanlig og velg Trening → Ny trening. Opprett
en trening med dagens dato, se at alle 12 fokusvalg vises (også på mobil),
og prøv Start. Start en øvelse og kontroller at Pause/Fortsett og Avbryt har
samme plassering av ikon og tekst.

## Oppgave 10 og 20: Trening – nettlesertester og etterkontroll (17.10.2026)

**Oppgave 10 er gjennomført:** `e2e/training.spec.ts` kjører hele brukerflyten
både på desktop (1400 × 900) og mobil (390 × 844). Testene oppretter trening
med fokus, tid/sted, bibliotekøvelse (søk, kategori og nivå), egen øvelse og
øvelse med advarsel. De åpner treningen via Start og kortet, viser full
øvelsesdetalj/advarsel, skriver notat, endrer navnelista og krysser fremmøte
av og på. De legger til notatpunkt og taktikk, endrer taktikkminutter og
flytter punkter begge veier, med kontroll av rekkefølge og yttergrensene.

Stoppeklokka kontrolleres med nettleserens styrbare klokke: start,
nedtelling, pause uten nedtelling, fortsett, avbryt uten fullføring og ny
start fra opprinnelig tid. Punktet fullføres når klokka når null, og
fullføringen overlever omlasting. «Del økten» kontrolleres mot nøyaktig
tekst, rekkefølge og total tid; bare operativsystemets delingsark på mobil
og utklippstavle på desktop erstattes av testmottakere. Deretter slettes et
punkt. To omlastinger kontrollerer både synlig innhold og lagrede data:
fokus, notater, egne øvelser, navn/fremmøte, taktikk, minutter, rekkefølge,
fullføring og sletting. Nettleserkrasj får testen til å feile.

**Sammenligning før/etter oppdelingen:** Identisk testfil (SHA-256
`92dfe259bfad11237477aaccf8f33018e50618904b21e06ab75541f105b5c422`)
er kjørt mot denne grenen (`677e0db`, med den nye testfilen) og `main`
(`25e59b22c10d1971c6cbc94bcc8f55b3c28f29dc`, før TrainingView ble delt).

| Kjøring | Desktop | Mobil 390 × 844 | Resultat |
| --- | --- | --- | --- |
| `npx playwright test e2e/training.spec.ts --workers=1` på grenen | Bestått | Bestått | 2/2, kode 0 |
| Samme testfil på main, med separat serverport | Bestått | Bestått | 2/2, kode 0 |

Den vanlige worktree-kommandoen fikk «Permission denied» i prosjektets
`.git/worktrees`. Derfor ble main lest gjennom en lokal bare hjelpekopi
med delte Git-objekter, og en løsrevet `git worktree` inni prosjektet.
Begge brukte eksisterende avhengigheter; ingen pakker ble installert.
Main fikk bare den identiske testfilen og en midlertidig Playwright-konfig
med port 3102. `git diff --exit-code` bekreftet urørt sporet main-kode,
og main peker fortsatt på samme commit. Worktree er fjernet etter prøven.
Den bare hjelpekopien ligger igjen ignorert i `node_modules` fordi miljøets
sikkerhetsregler blokkerte sletting; den følger ikke med endringene.
Testene viser lik oppførsel for flytene over; de erstatter ikke prøving
av ekte berøring eller telefonens faktiske delingsark.

TrainingView er delt etter planen i den nye mappen `components/training/`.
Ren flytting: funksjonskropper, JSX, klassenavn, tekster, avhengighetslister
og tidsfrister er kopiert uendret. Komponentene som var lokale i filen, er nå
navngitte eksporter fra egne filer; ellers er ingenting endret. `TrainingView`
har samme navn, props og importsti (`@/components/ui/TrainingView`), så
`page.tsx` er ikke endret. Alle nye filer har en kort ansvarskommentar øverst.

| Fil | Linjer før → etter | Ansvar |
| --- | --- | --- |
| `components/ui/TrainingView.tsx` | 1265 → 167 | Fanene, lista og valget mellom ny trening og valgt trening. |
| `components/training/TrainingOverview.tsx` | Ny → 48 | Nøkkeltallene øverst (med `DAY_MS`/`isoOffset`). |
| `components/training/NewTrainingForm.tsx` | Ny → 368 | Skjemaet for ny trening (med `DRILL_CATEGORIES`). |
| `components/training/TrainingCard.tsx` | Ny → 60 | Kortet i lista. |
| `components/training/Stopwatch.tsx` | Ny → 61 | Stoppeklokka. |
| `components/training/TrainingDetail.tsx` | Ny → 504 | Valgt trening. |
| `components/training/TacticPicker.tsx` | Ny → 54 | Taktikkvelgeren. |
| `components/training/RosterEditor.tsx` | Ny → 46 | Navnelista for fremmøte. |
| `components/training/DrillWarning.tsx` | Ny → 13 | Gul advarselsboks for øvelser. |

**Tilpasninger til forslaget:** `TrainingView.tsx` står igjen i
`components/ui/` i stedet for å flyttes, for å beholde importstien.
`DrillWarning` er ikke delt med DrillsView: boksen der er en annen (`p-4`,
`rounded-panel`, overskriften «Advarsel», større ikon og `text-warn-300`).
DrillDetailModal og SmartCoach har to andre varianter. Å slå dem sammen ville
endret utseendet, så `DrillWarning` ligger bare i Trening. `TrainingDetail`
er fortsatt over 500 linjer; notatlisten med stoppeklokke kan skilles ut i et
neste steg, som planen sier. Oppgave 10 ble gjort som etterkontroll, med
samme tester også mot main før oppdelingen (se over).

**Funn ved ren flytting (de tre første punktene rettet 18.10.2026, se øverst):**

- `TrainingCard`: Start-knappen bruker `new Date(event.date) >= new Date()`.
  Datoen tolkes som midnatt UTC, så en trening i dag får ikke Start-knapp,
  selv om den står under Kommende (lista bruker datotekst).
- `Stopwatch`: Pause/Fortsett-knappen mangler `inline-flex`, i motsetning til
  Avbryt; ikon og tekst kan ligge litt ulikt.
- `NewTrainingForm`: `FOCUS_OPTIONS` har 12 valg, men bare de 8 første vises.
  `saving` settes og nullstilles i samme kall, så «Oppretter …» vises i praksis
  aldri.
- `TrainingDetail` har både lokal `completedDrills` og lagret `completed`;
  den lokale er overflødig. `activeStopwatch === 'custom'` settes aldri.
- `any` i props for `TrainingCard`, `TrainingDetail` og `NewTrainingForm`
  (`Omit<any, 'id'>`) står igjen.
- Kategorilisten (`DRILL_CATEGORIES`) og `DAY_MS` er fortsatt kopier (se
  «Duplisering» og oppgave 14); de er bare flyttet.
- Punkter som opprettes i skjemaene får alltid tid. De har derfor ingen
  synlig «Marker som fullført»-knapp; fullføring skjer når nedtellingen er
  ferdig. Testen følger denne eksisterende oppførselen på begge grenene.

**Kontroller (etterkontroll 17.10.2026).** Oppdelingen ble opprinnelig laget
uten terminaltilgang. Før-kolonnen er siste dokumenterte kjøring fra
oppgave 21–23; sammenligningen mot main med de nye treningstestene står over.
Etter-kolonnen gjelder denne grenen med `e2e/training.spec.ts`.

| Kommando | Før (siste dokumenterte kjøring) | Etter |
| --- | --- | --- |
| `npx tsc --noEmit` | Grønn, kode 0 | Grønn, kode 0 |
| `npx vitest --run` | 29 filer / 304 tester, kode 0 | 29 filer / 304 tester, kode 0 |
| `npm run build` | Grønn, kode 0 | Grønn, kode 0 |
| `npm run test:e2e -- --workers=1` | 36 tester, kode 0 | 38 tester, kode 0 (ny fullkjøring) |
| `npm run test:offline` | 3 tester, kode 0 | 3 tester, kode 0 |

Første typesjekk avsluttet med kode 1 uten feilmelding, og første Vitest-forsøk
stoppet med minnefeil mens nettleserserveren kjørte. Etter at testserveren
var stoppet, gikk typesjekken grønt. Vitest ble kjørt med
`VITEST_MAX_WORKERS=1` og ga 304/304, uten endring i testoppsettet. De tunge
kontrollene kjøres etter hverandre. Browserslist-varselet om gammel database
hindrer ikke bygget; ingen pakker er oppdatert.

Første fulle e2e-kjøring ga 37/38: eksisterende test for vanlig 3D-eksport
til WebM ventet over 90 sekunder på ferdigmelding (`board3d.spec.ts:353`).
Begge nye Trening-tester og alle øvrige tester passerte, også WebM-opptak
i fullskjerm. Den samme eksporttesten passerte alene på en ny server
(22 sekunder, kode 0), uten endret produktkode, tidsgrense eller test.
Deretter passerte en ny fullkjøring med nøyaktig samme kommando: 38/38,
kode 0, uten retries. WebM-eksporten tok da 14 sekunder. Kontroll av
3D-fullskjerm ga fortsatt 108/108 unike bilder (negativ kontroll: 55/108).

Ingen produktkode er endret i etterkontrollen: bare `e2e/training.spec.ts`,
denne planen og testkartet i `AGENTS.md`. Eksisterende funn over er beholdt.
Ingen genererte filer eller pakkeendringer inngår, og ingenting er publisert,
deployet, committet eller pushet.

Manuell prøve: Åpne Trening. Se nøkkeltallene og fanene Kommende/Historikk.
Lag en ny trening med fokus, en øvelse fra biblioteket (prøv søk, kategori og
nivå), en egen øvelse og en øvelse med advarsel. Åpne treningen: skriv et notat,
kryss av fremmøte, rediger navnelista, legg til en taktikk og endre minuttene,
flytt punkter opp/ned, start stoppeklokka (pause, avbryt), merk som fullført,
åpne «Vis full detalj» og trykk «Del økten». Slett et punkt og gå tilbake.

## Oppgave 21–23: oppdeling av TacticBoard (17.10.2026) – ferdig, kontrollert

TacticBoard er delt etter planen, og den rene dupliseringen mot
FullscreenBoard (avspilling, mellomposisjoner og koordinater) ligger nå i
delte hooks. Ren flytting: funksjonskroppene er kopiert uendret, med samme
avhengigheter, tidsfrister, terskler og rekkefølge på kallene. Ingen pakker,
tester eller offentlige eksporter er endret; `TacticBoard` og
`FullscreenBoard` har samme navn, props og importsti som før. Alle nye filer
har en kort ansvarskommentar øverst.

| Fil | Linjer før → etter | Ansvar |
| --- | --- | --- |
| `components/board/TacticBoard.tsx` | 998 → 621 | Setter sammen delene; linja over og under banen, banen og dialogene. |
| `components/ui/FullscreenBoard.tsx` | 571 → 501 | Uendret oppførsel; bruker nå felles avspilling og koordinater. |
| `hooks/usePlayerDrag.ts` | Ny → 247 | Dra og bytte av spillere (kun TacticBoard). |
| `hooks/useUndoRedo.ts` | Ny → 84 | Angre/gjør om, dybde og hurtigtaster. |
| `hooks/usePhasePlayback.ts` | Ny → 86 | Faseklokka og `interpolatePlayers`/`interpolateBall` (begge brettene). |
| `hooks/useSvgCoordinates.ts` | Ny → 60 | `toSVGRaw`, `toSVG` og `clampToPitch` (begge brettene). |
| `components/board/PhaseNoteModal.tsx` | Ny → 50 | Notatdialogen for fasen. |
| `components/board/Board3DSlot.tsx` | Ny → 32 | Lat lasting av 3D med feilskjerm, og `HoldWhileHidden`. |

**Tilpasninger til forslaget:** Hookene ligger i `src/hooks/`, som de andre
hookene. Koordinatomregningen var en ordrett lik utregning i begge brettene og
er derfor også samlet (`useSvgCoordinates`), selv om planen ikke nevnte den.
Nullstillingen av angrehistorikk og zoom ved bytte av fase/taktikk står
fortsatt i TacticBoard (via `resetHistory`), fordi den også styrer zoomen.
Stopp av avspilling ved bytte av taktikk/formasjon/sport står også igjen der;
fullskjerm hadde ikke denne regelen og har den fortsatt ikke. Effektene er
fordelt på hookene, så opprydding av tidtakere ved lukking skjer i en annen
rekkefølge, men alle ryddes fortsatt.

**Ikke slått sammen (ville endret oppførsel):** Dra-logikken i
FullscreenBoard er en annen enn i TacticBoard: ingen drag-skygge, ikke bytte,
ikke angre, ingen avstandsjustering, ballen dras med de samme håndtererne som spillerne, sjekk av
`pointerId`, og draget avbrytes ved knip. `usePlayerDrag` brukes derfor bare av
TacticBoard. En felles dra-hook krever et menneskelig valg om hvordan
fullskjerm skal oppføre seg. `FullscreenControls.tsx` (planens forslag for
fullskjerm) er ikke laget i denne omgangen.

**Funn, ikke rettet (ren flytting):**

- `startDrag` har `phase` som unødvendig avhengighet; dette er den kjente
  lint-advarselen, som nå ligger i `usePlayerDrag.ts`.
- `useSvgCoordinates` tar `svgRef` og `usePlayerDrag` tar `gestureRef` som
  argument. Lint kan derfor be om dem som avhengigheter. Det er ikke lagt til i
  `usePlayerDrag`, for at avhengighetslistene skal stå som før. Lint er ikke
  kjørt.
- `useBallDrag` har en tredje kopi av koordinatomregningen, men med en annen
  grense i høyden (45 i stedet for `CLAMP_Y_TOP`/`CLAMP_Y_BOTTOM`). Den er ikke
  slått sammen.
- FullscreenBoard: `getNum(p: any)` og den utdaterte kommentaren om
  `PlayerHome` står igjen (planens oppgave 23); `getNum` faller tilbake til 0,
  så fjerning er ikke helt ren flytting. `setPlaySpeed` brukes ikke; farten er
  alltid 1. Kommentaren sier at kontrollene skjules etter 3 s, men koden bruker
  4000 ms. Fasenavn vises som `ph.name` uten reserven «Fase n» som TacticBoard
  har.

**Kontroller (etterkontroll 17.10.2026).** Oppdelingen ble laget i en økt
uten terminaltilgang. Utgangspunktet er siste dokumenterte kjøring på
`96bdfaa` (se oppgave 17–19 nedenfor); etter-kolonnen er kjørt på koden fra
commit `a90a0ae`.

| Kommando | Før (siste dokumenterte kjøring) | Etter |
| --- | --- | --- |
| `npx tsc --noEmit` | Grønn, kode 0 | Grønn, kode 0 |
| `npx vitest --run` | 29 filer / 304 tester, kode 0 | 29 filer / 304 tester, kode 0 |
| `npm run build` | Grønn, kode 0 | Grønn, kode 0 |
| `npm run test:e2e -- --workers=1` | 36 tester, kode 0 | 36 tester, kode 0 (fullskjerm-3D 108/108 unike, negativ kontroll 55/108) |
| `npm run test:offline` | 3 tester, kode 0 | 3 tester, kode 0 |

**Gjennomgang av `git diff main` linje for linje:** Ingen endret oppførsel
funnet, så ingen kode er rettet. Kontrollert: alle funksjonskropper er
ordrett like; avhengighetslistene er de samme (`toSVGRaw` har nå `[svgRef]`
i stedet for `[]`, men ref-objektet er stabilt; `stopPlayback` er stabil i
effekten som stopper avspilling). Tider (30 ms, 0,025 per steg, 200 ms
avstand, 400 ms sprett, 160 ms skygge, `LONG_PRESS`) og terskler
(`DRAG_THRESH`, 54 for treff) er uendret. Langtrykk på berøring,
`setPointerCapture`, `preventDefault`/`stopPropagation`, valg ved trykk,
bytte med samlet angring, Ctrl+Z/Ctrl+Y (av i 3D, av i tekstfelt) og
nullstilling ved fase-/taktikkbytte virker som før. Fullskjerm brukte vanlige
funksjoner for avspilling; de er nå `useCallback` med `phases`/`playSpeed`
som avhengigheter, og brukes bare fra knappen, så de er like ferske. Alle
hooks kalles før brettenes tidlige `return`. Klemmingen i fullskjerm er
matematisk lik den felles. Det eneste som er annerledes er rekkefølgen
effektene registreres og ryddes i (nevnt over); det påvirker bare når
tidtakere stoppes, ikke hva som skjer. Bygg og tester endret ingen sporede
filer.

Ingen testfiler importerer `TacticBoard`, `FullscreenBoard` eller de flyttede
delene direkte, og testantallet er uendret. Ingen genererte filer inngår, og ingenting er
publisert, deployet, committet eller pushet.

Manuell prøve: Åpne Taktikk i 2D. Dra en spiller (på mobil: hold litt først),
slipp på en annen spiller for å bytte, og prøv Angre/Gjør om (også Ctrl+Z /
Ctrl+Y). Spill av fasene, skriv et notat, tegn, eksporter PNG/video, bytt til
3D og tilbake. Åpne fullskjerm, spill av, dra en spiller og ballen, og ta opp.

## Oppgave 17–19: oppdeling av BoardScene (17.10.2026) – ferdig

Den eksisterende 3D-motoren er beholdt og delt etter planen. Ingen pakker,
tester eller brukere av `BoardScene` er endret. `Board3D.tsx`, vanlig
videoeksport og fullskjermopptak bruker samme klasse og importsti som før.
Alle nye kildefiler har en kort ansvarskommentar øverst.

| Fil i `src/components/board/three/` | Linjer før → etter | Ansvar |
| --- | --- | --- |
| `BoardScene.ts` | 780 → 287 | Setter sammen modulene; beholder konstruktør, lasting, scenedata, bevegelse, tegning, størrelse og oppryddingsrekkefølge. |
| `resourcePool.ts` | Ny → 46 | Geometri, materialer, teksturer, enkle former/linjer og frigjøring av delte ressurser. |
| `pitchBuilder.ts` | Ny → 102 | Gress, banestreker, mål/nett og tribuner. |
| `equipment.ts` | Ny → 57 | Bygging av ekstra spillere og treningsutstyr. |
| `figures.ts` | Ny → 153 | Figurtype, figurer/drakter, frigjøring, animasjon og bygging av ballen. |
| `hud.ts` | Ny → 62 | Fasepille og fremdriftslinje med plassering, tegning og frigjøring. |
| `drawingLayer.ts` | Ny → 88 | Tegningsplan, asynkron teksturlasting, mellomlager og tekstetiketter. |
| `cameraRig.ts` | Ny → 152 | Kameratyper, valg, zoom, tilstand/posering, følgepunkt, grenser og innramming. |

**Tilpasninger til forslaget:** `CameraPose` flyttes sammen med de andre
kameratypene; alle tre eksporteres fortsatt fra `BoardScene.ts`.
`equipment.ts` er en byggfunksjon, mens modulene med egen tilstand er klasser.
`BoardScene` beholder 287 linjer, fremfor anslaget på rundt 200, for å la
samspillet mellom lasting, faseoppdatering, objektbevegelse, kamerabane og
opprydding stå samlet. Ballens bevegelige kontaktskygge blir ved bevegelsen.
Delte ressurser, mellomlagergrenser, shaderkode, kamera-/animasjonsberegninger,
objektrekkefølge i scenen og frigjøringsrekkefølge er beholdt.
Kameramodulen deler den eksisterende midlertidige vektoren med ballbevegelsen.
HUD og kamera beholder referansen til samme `SceneFrame`.

**Ekstra kontroll av ren flytting:** Alle 34 opprinnelige metodekropper er
sammenlignet med TypeScript-parseren etter normalisering av modulhenvisninger
og utvidelse av delegerte kall. De er syntaktisk identiske. TypeScript bekrefter
samme konstruktørsignatur og alle 19 offentlige medlemmer med samme typer og
`readonly`-egenskaper. `pitchFitDistance` gir nøyaktig samme resultat i 144
kombinasjoner av sport, sideforhold, synsfelt og kameraretning. Denne separate
kontrollen erstatter planens foreslåtte nye enhetstest, slik at testfilene og
testantallet er uendret. Midlertidige kontrollskript inngår ikke i leveransen.

| Kommando | Før | Etter |
| --- | --- | --- |
| `npx tsc --noEmit` | Grønn, kode 0 | Grønn, kode 0 |
| `npx vitest --run` | 29 filer / 304 tester, kode 0 | 29 filer / 304 tester, kode 0 |
| `npm run build` | Grønn, kode 0 | Grønn, kode 0 |
| `npm run test:e2e -- --workers=1` | 36 tester, kode 0 | 36 tester, kode 0 |
| `npm run test:offline` | 3 tester, kode 0 | 3 tester, kode 0 |

Førkjøringene ble fullført før kildekoden ble flyttet. Alle fem kontroller er
grønne både før og etter, med samme testantall. Offline-kontrollen bygget også
produksjonsversjonen på nytt i begge kjøringene.

`board3d.spec.ts`, `pitch-depth.spec.ts`, MP4-/WebM-videoeksport og
fullskjermopptak (inkludert stopp/avbryt) er grønne før og etter.
Fullskjermtesten med treg tegning ga 108/108 unike baneutsnitt i begge
kjøringene; den negative kontrollen ga 55/108 og ble avvist som forventet.
På Windows ble bare testenes identifiserte Next-servere stoppet etter at
testtilfellene var ferdige, slik at Playwright kunne avslutte. Alle fire
nettleserkommandoer før/etter avsluttet med kode 0. Varsler om Browserslist og
terminalfarger hindret ikke kontrollene.

Manuell prøve: Åpne appen lokalt som før, velg Taktikk → 3D og prøv kameravalg,
rotasjon og zoom. Eksporter MP4/WebM og prøv fullskjermopptak med stopp og
avbryt. Bytt tilbake til 2D og kontroller at taktikken er bevart.

Et kort filkart for feilsøking er lagt til i [AGENTS.md](../AGENTS.md).
Ingen feil er rettet som del av oppdelingen. Ingen nye pakker eller endringer
i låsefiler, og ingen genererte filer inngår. Ingenting er publisert,
deployet, committet eller pushet.

## Oppgave 7: PWA-byggefiler ut av Git (17.10.2026) – delvis, venter på terminal

- `.gitignore` har nå en egen next-pwa-blokk for `public/sw.js`,
  `public/workbox-*.js`, `public/worker-*.js`, `public/fallback-*.js` og
  tilhørende `.map`-filer. Dette er filene `next-pwa` (med `dest: 'public'`)
  kan lage. Ingen annen fil er endret.
- Git-indeksen er lest direkte: av genererte filer er bare `public/sw.js` og
  `public/workbox-4754cb34.js` sporet. `.next`, `test-results`,
  `playwright-report`, `blob-report`, `coverage`, `out`, `build`,
  `node_modules`, `.vercel`, `next-env.d.ts` og `*.tsbuildinfo` er ikke sporet.
- Vercel kjører `next build`, og `next-pwa` lager service workeren i
  `public/` under det bygget. Filene trenger derfor ikke ligge i Git.
  `e2e-production/update.spec.ts` leser `public/sw.js` først etter at
  offline-oppsettet har bygget appen.

**Ikke gjort i denne økten (ingen terminaltilgang):**

| Steg | Status |
| --- | --- |
| `git rm --cached public/sw.js public/workbox-4754cb34.js` | Ikke kjørt – filene er fortsatt sporet (`.gitignore` virker ikke på filer som allerede er sporet) |
| `npx tsc --noEmit` | Ikke kjørt |
| `npx vitest --run` | Ikke kjørt |
| `npm run build` (lager `sw.js` og `workbox-*.js`) | Ikke kjørt |
| `npm run test:e2e -- --workers=1` | Ikke kjørt |
| `npm run test:offline` | Ikke kjørt |

Når `git rm --cached` er kjørt, skal `git status` vise de to filene som
slettet fra Git, mens de fortsatt finnes i `public/`. Etter `npm run build`
skal `git status` ikke vise endringer i `public/`. Ingen pakker er
installert, og ingenting er publisert, deployet, committet eller pushet.

## Oppgave 6a, rettelse: jevnt 3D-opptak fra fullskjerm (17.10.2026)

Problemet: 3D-opptak fra fullskjerm hakket på PC. En ekte video fra
brukerens PC (1920 × 1200, H.264, 30 fps, 8,3 s) hadde 249 bilder, men bare
136 unike: 96 bilder var gjentatt, så reell bildetakt var ca. 15 fps, og
starten frøs to ganger i ca. 0,25 s. Årsaken var sanntidsopptaket: hvert
videobilde måtte tegnes i full størrelse mens klokka gikk.

- **Opptaket tar nå opp kamerabanen, ikke bildene.** Mens brukeren ser på
  og flytter kameraet, noteres kameraets posisjon, mål, retning, projeksjon,
  zoom og kameravalg per tidspunkt (`components/board/three/cameraTrack.ts`).
  Det er lett, også på en treg PC. Det levende bildet tegnes av opptaket
  selv; den vanlige tegnesløyfen står i mellomtiden.
- **Videoen lages etterpå** med samme motor som vanlig 3D-eksport
  (`exportVideo3D`, eksakte tidsstempler, ikke sanntid), når brukeren
  trykker «Stopp opptak» eller avspillingen er ferdig. Hvert videobilde får
  kameraet fra banen på sitt eksakte tidspunkt; mellom to avlesninger glir
  kameraet jevnt (posisjon lineært, retning med slerp). Kontrollraden viser
  «Lager video … 45 %» med «Avbryt». Stopp gir bare den delen som er sett.
- **Forvarming før klokka starter** («Gjør klar …»): modeller og himmel,
  tegningene til de første fasene i både video- og visningsscenen,
  shaderne i videoscenen (ett prøvebilde) og koderen (`warmEncoder` koder
  ett svart bilde). Det levende bildet venter aldri på en tegning.
- **Beholdt:** samme utsnitt, kameravinkel, fasepille og fremdriftsstripe,
  MP4 med H.264 nivå 5.1-støtte, sideforhold som skjermen, 1920 piksler på
  lengste side. Avbryt (også under «Lager video») gir ingen fil og setter
  kamera og kameravalg tilbake. Vanlig 3D-eksport bruker samme løkke som før
  uten kamerabane. 2D-opptak, 2D-data, lagring og pakker er uendret.
- Sanntidsmodusen (`realtime`, `shouldStop`, `onElapsed`) i `exportVideo3D`
  er fjernet; den erstattes av `frameCount`. Testen for den gamle modusen
  er byttet ut med en strengere test (under). Testen for tidlig stopp
  bruker nå `frameCount`.

Tester som er lagt til:

- `src/lib/exportVideo3D.test.ts`: fullskjerm-3D der det levende bildet
  bare rekker ca. 14 bilder/s (70 ms per bilde) og hvert videobilde tar
  250 ms å tegne, mens kameraet roterer hele tiden. Krever 141 bilder med
  eksakte 30 fps-tidsstempler og minst 95 % unike scenebilder (FNV-hash av
  det sentrale utsnittet: 25–75 % av bredden og høyden, uten overlegg).
  I tillegg tester for glidning mellom avlesninger, kameravalg, endepunkter,
  tidlig stopp og avbryt.
- `e2e/fullscreen-recording.spec.ts`: ny test med kunstig treg WebGL (hver
  `clear` venter 30 ms) i 3D-fullskjerm med «Følg ballen» og kamerarotasjon
  under opptak. MP4-filens tidsskala og bildelengde må gi 30 fps og 141
  bilder; alle bildene dekodes med `VideoDecoder`, og minst 95 % av bildene
  i bevegelsesdelen må ha unik hash i samme baneutsnitt, uten fasepille og
  fremdriftsstripe. Den eksisterende 3D-testen venter nå
  opptil 45 s på at forvarmingen blir ferdig.
- Begge tester har en negativ kontroll som gjentar annethvert scenebilde,
  mens overleggene fortsatt endres. Enhetstesten flytter kameradataene inn
  i baneutsnittet; nettlesertesten kopierer dekodede bildepiksler før hashing,
  men beholder den aktuelle fasepillen og fremdriftsstripen. Det samme
  95 %-kravet må da feile, mens den gamle helbildehashingen fortsatt passerer.
- **Feilen er også fremprovosert i den ordinære testen:** midlertidig tvunget
  gjentakelse ga 71/141 unike scenebilder (50,35 %), og
  `npx vitest --run src/lib/exportVideo3D.test.ts -t 'slow drawing'`
  avsluttet med kode 1 på kravet om minst 95 %. Mutasjonen er fjernet;
  den permanente negative kontrollen er beholdt.

| | Før (brukerens PC) | Etter (automatisert kontroll i Edge) |
| --- | --- | --- |
| Bildetakt i filen | 30 fps, men reelt ca. 15 | 30 fps, 141 bilder i filen |
| Unike bilder | 136 av 249 (55 %, hele bildet) | 108 av 108 baneutsnitt i bevegelsesdelen (100 %) |
| Kunstig gjentakelse | Ikke målt | 55 av 108 baneutsnitt (50,93 %), avvist av samme 95 %-krav |
| Frys i starten | 2 × ca. 0,25 s | Etterrendering testet; opplevd flyt på brukerens PC må fortsatt prøves |
| Ventetid | Ingen etter Stopp | «Lager video …» etter opptaket |

**Etterkontroll 17.10.2026:** Alle fem kommandoer er kjørt og avsluttet med kode 0.

| Kommando | Resultat |
| --- | --- |
| `npx tsc --noEmit` | Grønn, ingen typefeil |
| `npx vitest --run` | Grønn, 29 filer / 304 tester, inkludert negativ kontroll |
| `npm run build` | Grønn; offline-kontrollen bygget også på nytt |
| `npm run test:e2e -- --workers=1` | Grønn, alle 36 tester |
| `npm run test:offline` | Grønn, alle 3 produksjonstester |

Etter at den kunstige gjentakelsen i nettlesertesten ble utvidet fra bare
baneutsnittet til hele bildet utenom HUD-områdene, ble den berørte testen
kjørt på nytt med `npm run test:e2e -- --workers=1 e2e/fullscreen-recording.spec.ts -g 'unique frames'`:
grønn, kode 0, 108/108 unike baneutsnitt; negativ kontroll 55/108.
Kravene til 95 %, 30 fps, antall bilder, stopp og avbryt er beholdt.
Ingen feil i appkoden ble funnet i disse kjøringene.

Som i tidligere økter måtte de identifiserte testserverne på Windows stoppes
etter at alle testene var ferdige, før Playwright avsluttet. Varsler om
Browserslist, webpack-cache og terminalfarger hindret ikke kontrollene.
Ingen pakker er installert eller endret. Genererte endringer i `public/sw.js`
og Workbox er tilbakeført og inngår ikke i leveransen. Ingenting er publisert,
deployet, committet eller pushet.

Manuell kontroll på PC: Åpne Taktikk → 3D → fullskjerm og trykk «Ta opp».
Etter «Gjør klar …» går opptaket som før; flytt og zoom kameraet. Etter
siste fase (eller «Stopp opptak») vises «Lager video … %». Filen skal spille
jevnt hele veien, også i første sekund. Prøv også «Avbryt» under
«Lager video»: ingen fil, og kameraet står som før opptaket.

## Oppgave 6a: opptak fra fullskjerm i 2D og 3D (17.10.2026)

- «Ta opp» finnes i fullskjermens kontrollrad i både 2D og 3D, også på
  mobil. Hele taktikken tas opp fra første til siste fase. Én fase alene
  kan også tas opp når taktikken bare har én fase; egen fasevelger for
  opptaksomfang er ikke lagt til.
- Under opptak vises fast rød prikk, tid, «Stopp opptak» (last ned det som
  er tatt opp) og «Avbryt» (ingen fil). Kontrollene holder seg tilgjengelige
  og opptaksdelen følger med når kontrollraden rulles sidelengs.
- Samme motorer og formatvalg som før: `useVideoExport.exportVideo` i 2D,
  `exportVideo3D` med eksisterende WebCodecs/kvalitet/muksing i 3D. Ingen
  nye pakker, CDN-er eller endring i lagring eller dataformat.
- Bildet beholder fullskjermens sideforhold, med 1920 piksler på lengste
  side og partallsmål for koderen. 2D beholder utsnitt, panorering, zoom
  og klipping ved banens kant. 3D kopierer det levende kameraets posisjon,
  retning og projeksjon for hvert videobilde. Alle kameravalg, valgt spiller,
  zoom, rotasjon og panorering kan brukes under 3D-opptaket.
- Kontrollrad, opptaksindikator, knapper og andre HTML-overlegg tegnes aldri
  i videoen. Fasepillen gjenbruker dagens kompakte video-pille fra 3D,
  nå via `lib/phasePill.ts`, også i fullskjermopptak av 2D.
- Avspillingen forhåndsvises uten å skrive til valgt fase, spillerposisjoner
  eller lagring. Avbryt gjenoppretter også kameraet i 3D; 2D beholder zoom
  og utsnitt. Vanlig videoeksport utenfor fullskjerm beholder sine mål,
  tempo og formatvalg. Å lukke fullskjerm eller legge appen i bakgrunnen
  avbryter opptaket og frigjør ressurser.
- ~~Sanntidsmodusen i den eksisterende 3D-motoren beholder 30 bilder/s og
  videoens avspillingstid også når telefonen tegner tregt: bildet holdes
  mens neste bilde lages.~~ Erstattet: 3D tar nå opp kamerabanen og lager
  videoen etterpå, se rettelsen øverst.
- `e2e/fullscreen-recording.spec.ts` bruker liggende mobilstørrelse og
  berøring, og tester avbryt uten nedlasting, fullføring, tidlig stopp,
  dekoding, varighet, sideforhold, bevart 2D-zoom/utsnitt og uendrede
  lagrede taktikker i både 2D/3D og MP4/WebM. 3D-testen bytter kameravalg,
  zoomer og roterer under opptak. Enhetstestene dekker dimensjoner,
  koderens faktiske bildestørrelse, stopp og langsom sanntidstegning.
- Rettet etter review: 3D-fullskjerm prøver også H.264 nivå 5.1 (Baseline
  og Main) før WebM. Dermed kan 16:10- og 4:3-opptak beholde MP4 ved
  1920 piksler på lengste side når nettleseren støtter dette. Vanlig
  3D-eksport har uendret kodekvalg. Regresjonstester dekker 1920 × 1200,
  1920 × 1440 og 1440 × 1920 med begge profiler, samt WebM-reserven.

Alle sluttkontroller er grønne:

| Kommando | Resultat for oppgave 6a |
| --- | --- |
| `npx tsc --noEmit` | Grønn, ingen typefeil |
| `npx vitest --run` | Grønn, 29 filer / 301 tester |
| `npm run build` | Grønn; siste kode er også bygget på nytt av offline-kontrollen |
| `npm run test:e2e -- --workers=1` | Grønn, alle 35 tester |
| `npm run test:offline` | Grønn, alle 3 produksjonstester |

Opptaksfilene i begge formater er åpnet av nettleserens videospiller i
testene. Liggende mobil gir 1920 × 888; fire faser varer omtrent 4,7 sekunder
ved normal fart. Skjermbilder av opptaksindikatoren i 2D/3D er kontrollert.
Underveis ble testens forventede zoom avrundet riktig, videoleseren fikk
eksplisitt filtype og et element i dokumentet, og testen vekker den vanlige
autoskjulte kontrollraden før neste opptak. Avbryt-testen ble utvidet til
å bytte kamera og spiller først; dette avdekket og rettet synkingen av
kameramenyen ved gjenoppretting. Ingen eksisterende tester er fjernet.

Alle fem kommandoer er kjørt på nytt etter rettelsen i kodekvalget. Som ved tidligere
kontroller måtte testserverne på Windows stoppes etter ferdige tester for at
Playwright skulle avslutte; begge testkommandoene avsluttet med kode 0.
Varsler om Browserslist, webpack-cache og terminalfarger hindret ikke
kontrollene. Ingen pakker eller låsefiler er
endret. Genererte endringer i `public/sw.js` og Workbox er tilbakeført og
inngår ikke i leveransen. Ingenting er publisert, committet eller pushet.

Mobilkontroll: Åpne denne versjonen av appen, velg Taktikk og legg telefonen
liggende. Åpne fullskjerm i 2D, zoom inn og trykk «Ta opp». Prøv «Avbryt»
først: ingen fil skal lastes ned, og banen skal være uendret. Ta opp igjen
og la alle fasene bli ferdige; spill av filen. Gjenta i 3D med «Følg ballen»
eller «Spillerperspektiv», og flytt/zoom kameraet under opptak. Prøv også
«Stopp opptak». Videoen skal følge utsnittet, ha fasepille og ingen knapper.
Hold samme skjermretning gjennom opptaket; sideforholdet velges ved start.
3D krever nettleserens eksisterende støtte for WebCodecs i en sikker
kontekst (HTTPS eller localhost). Støtte på en fysisk iPhone/Android må
fortsatt kontrolleres på selve telefonen. Ingenting er publisert her.
Prøv også 3D-opptak på en iPad (4:3) eller en PC/Mac med 16:10-skjerm:
videoen skal beholde skjermens sideforhold og bli MP4 når nettleseren
støtter H.264 på denne størrelsen. Fysisk enhetskontroll gjenstår.


Status: appikon og enklere, fortsatt beskyttet AI-tilgang er lagt til 17. oktober 2026. Oppgave 1 (feilhåndtering), oppgave 2 (Next 15.5.28 og React 19), oppgave 4 (trygg appoppdatering og ChunkLoadError), oppgave 5 (sikkerhetskopi), oppgave 6 (rydding med lav risiko, inkludert AI-rydding) og oppgave 6a (fullskjermopptak) er ferdige. Backup-delen av oppgave 11 er også dekket. Personvern: appen lagrer kun lokalt, ingen kontoer. Feillogging er lokal, ingen ekstern tjeneste.

## Appikon og AI-tilgang (17.10.2026)

- Oransje ikon med hvit bane, tegnet fra sidemenyens eksisterende SVG.
  PNG 192/512, eget maskable 512 med trygg marg, apple-touch-icon 180 og
  favicon 16/32/48. Manifest og metadata bruker nye filnavn; byggingen
  oppdaterer service workerens innholdshasher automatisk.
- Koden huskes på enheten og deles mellom begge AI-funksjonene og
  Innstillinger. `?kode=…` lagres og fjernes med `history.replaceState`
  tidlig i dokumentet. Tilgangsstatus finnes i Innstillinger, også på mobil.
  «Glem tilgangskode» er fjernet i oppgave 6. Koden kontrolleres først ved AI-bruk.
- Ved HTTP 401 fjernes koden, med norsk beskjed om å be treneren om ny
  lenke. HTTP 429 viser norsk forklaring uten å glemme gyldig kode.
- `/api/ai` har minnebasert grense på 30 forespørsler per rullerende time
  per IP/prosess, før tilgangskontroll og AI-kall. Egen ventetid i HTTP-header.
  Vercel-instanser deler ikke telleren, og omstart nullstiller den.
- Tilgangskoden er nå **utelatt fra sikkerhetskopier**, som endrer det
  tidligere valget i oppgave 5. Eldre kopier kan leses, men deres kode
  ignoreres. Enhetens kode beholdes ved import. Koden skjules også hvis
  den tilfeldigvis ligner et teknisk navn i feilloggen. Servernøkkel og
  miljøvariabler er uendret. Ingen ny lagringsnøkkel, pakke eller database.
- [Kort bruksveiledning](ai-tilgang-og-ikoner.md) forklarer delingslenke,
  bytte av kode i Vercel, begrensningen ved minnetelleren og ikontest på telefon.

Alle sluttkontroller er grønne, uten ekte AI-kall:

| Kommando | Resultat |
| --- | --- |
| `npx tsc --noEmit` | Grønn, ingen typefeil |
| `npx vitest --run` | Grønn, 29 filer / 290 tester |
| `npm run build` | Grønn; også bygget på nytt av offline-kontrollen |
| `npm run test:e2e -- --workers=1` | Grønn, alle 31 tester |
| `npm run test:offline` | Grønn, alle 3 produksjonstester |

Testene dekker lagret og manuelt skrevet kode, lenke og renset adresse,
omlasting, deling mellom AI-funksjonene, tilgangsstatus på mobil, feil/byttet kode,
fartsgrense uten AI-kall, bevarte data og kode utenfor sikkerhetskopi og
feillogg. Produksjonstesten bekrefter nye ikonfiler i forhåndslageret og
uten nett, samt at delingskoden ikke ligger i cachen. De eksisterende
testene for offline og trygg oppdatering er beholdt. Ikon og mobilvisning
er også kontrollert visuelt.

Første e2e-kjøring fant én for bred testvelger som traff både AI-meldingen
og Next sitt skjulte varselfelt. Velgeren er avgrenset til AI-panelet;
hele serien er deretter kjørt grønn. Som tidligere måtte bare de kjente
testserverne stoppes etter ferdige tester for at Playwright skulle avslutte
på Windows. Sluttkjøringene avsluttet med kode 0. Varsler om Browserslist,
webpack-cache og terminalfarger hindret ikke kontrollene.

Ingen pakker eller låsefiler er endret, og ingenting er publisert,
committet eller pushet. Genererte endringer i `public/sw.js` og Workbox
er tatt ut av leveransen; ikoncache bygges fra kildefilene ved neste bygg.

## Oppgave 6: rydding med lav risiko (17.10.2026)

- Søkt etter filnavn, importstier og symboler i kildekode, tester,
  konfigurasjon og øvrige prosjektfiler før sletting. Ingen brukere av
  `src/data/drills.ts.backup`, `SwapOverlay` eller `getDrillsByAgeBand`.
- Fjernet den ubrukte komponenten `SketchPreview`, parseren, typene og
  tegnehjelperne. Bare `hasSketch` brukes av `DrillsView`; funksjonen og
  importstien er beholdt uendret.
- Fjernet `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg` og
  `window.svg`. Bare den genererte `public/sw.js` refererte til dem som
  forhåndslagrede filer. Appikonet `icon.svg` brukes i manifestet og beholdes.
- AI-delen er nå fullført etter at ikon- og tilgangsendringene kom med.
  Fjernet «Glem tilgangskode» i Innstillinger, men beholdt linjen
  «AI-tilgang er aktiv på denne enheten» og automatisk sletting av feil
  kode ved HTTP 401 i `AiCoach` og `AiDrillModal`. Fartsgrensemeldingen
  bygger nå tallet fra `AI_RATE_LIMIT`, samme konstant som begrenser kallene.
  Det tidligere avviksnotatet gjaldt prosjektversjonen før AI-endringene.
- Oppgave 6a om opptak fra fullskjerm står rett etter denne oppgaven i
  oppgavelisten og er også ferdig, før oppdelingen av store filer.
  Ingen store filer er delt opp.

Alle fem kontroller er kjørt på nytt etter fullføring av AI-delen og passerer:

| Kommando | Resultat for oppgave 6 |
| --- | --- |
| `npx tsc --noEmit` | Grønn, ingen typefeil |
| `npx vitest --run` | Grønn, 29 filer / 290 tester |
| `npm run build` | Grønn |
| `npm run test:e2e -- --workers=1` | Grønn, 31 tester |
| `npm run test:offline` | Grønn, 3 produksjonstester med nytt bygg |

Som tidligere måtte bare testenes egne, identifiserte serverprosesser
stoppes etter ferdige nettlesertester på Windows. Begge kommandoene
avsluttet deretter med kode 0. Varsler om gammel Browserslist-database og
webpack-cache hindret ikke bygg eller tester. Ingen tester er fjernet,
hoppet over eller svekket. Ingen pakker, låsefiler, lagring eller brukerdata
er endret. Ingenting er publisert, deployet, committet eller pushet.
Den genererte `public/sw.js` er tilbakeført og inngår ikke i leveransen.

Manuell kontroll: åpne appen som vanlig og prøv Øvelser, bane-ikonet ved
øvelser med skissetekst, 2D, 3D, fullskjerm og videoeksport. Appen skal virke
som før. I Innstillinger skal aktiv AI-tilgang fortsatt vises, uten
«Glem tilgangskode». Feil kode skal fortsatt slettes automatisk ved AI-bruk.

## Oppgave 5: sikkerhetskopi (17.10.2026)

- Ny `src/lib/backup.test.ts` tester bygging, lesing, beskrivelse, filnavn og
  nedlasting. Eksport → JSON-fil → import sammenlignes mot hele datasettet,
  både med 4 og 50 taktikker: alle fire fotballtyper, tom bane, flere faser,
  spillere, alle tegneverktøy, alle utstyrstyper, notater, egne øvelser med
  AI-merking, treningsinnhold og fremmøte, kalender, kamprapporter,
  lagrede øyeblikk og innstillinger.
- Historisk versjon 1 er fortsatt lesbar uten utstyr, temafarger, egne
  øvelser eller nye innstillingsfelt. En fast eksempelkopi ligger i
  `src/lib/__fixtures__/backup-v1.json`. Versjon 0, som den gamle leseren
  også godtok, kontrolleres separat; den påstås ikke å ha vært utgitt.
  Manglende nye felter får standardverdier. Eksisterende innhold beholdes.
- Import bruker fortsatt de eksisterende reparasjonsfunksjonene, men
  kontrollerer nå først at ingen verdier eller listeelementer blir borte.
  En delvis skadet fil avvises helt før lagring, også ved skader inne i
  faser, tegninger, utstyr, treninger, øvelser og rapporter. Reparasjon ved
  vanlig oppstart er fortsatt tolerant. Utgåtte tekniske hjelpefelter
  filtreres som før, og duplikate id-er får fortsatt unike id-er.
- Rettet tap av tomme lag-/motstandernavn, øvelsesstegenes id-er og eksplisitt
  rotasjon 0. Gamle notater med tittelen «✅ Fremmøte» bevares nå med hele
  teksten, også etter ny innlasting, og finnes i den eldre eksempelkopien.
  Valgfrie fasefelt bevares også når de ikke finnes i originalen.
  «Vis bevegelse» og spillerutseende blir med. AI-tilgangskoden er senere
  tatt ut av sikkerhetskopien, se oppdateringen om AI-tilgang øverst. Tema og
  lagnavn oppdateres straks i Innstillinger etter import.
- Ingen ny lagringsnøkkel eller versjonsendring: Zustand-lageret er fortsatt
  versjon 2 og sikkerhetskopien versjon 1. Nye innstillingsfelt er valgfrie;
  gamle kopier fungerer, og gamle lesere kan ignorere tilleggene. Kamptid er
  flyktig og nullstilles ved import. «Sist eksportert» gjelder enheten og
  beholdes ved import. Feilloggen ligger fortsatt utenfor kopien og røres ikke.
- «Sikkerhetskopi» er øverst i Innstillinger, også på mobil. Knappene heter
  «Eksporter sikkerhetskopi» og «Importer». Før erstatning vises
  «Dette erstatter dataene på denne enheten», oversikt over innhold og
  knappene «Erstatt alt» / «Avbryt». Norsk feil forklarer tom/skadet fil,
  feil filtype og nyere versjon, og sier at eksisterende data er urørt.
- «Sist eksportert: dato» / «Sist eksportert: aldri» vises under knappene.
  En rolig tekst minner om eksport etter mer enn 30 dager eller ved aldri
  eksportert, uten popup eller blokkering. Oversikten bruker samme grense.
  Innstillinger forklarer nå at filen ikke inneholder AI-tilgangskoden.
- `e2e/backup.spec.ts` kontrollerer ekte nedlastet fil, åpning av filvelgeren,
  avbryt, bekreftet import, bevart innhold etter omlasting, tema og øvrige
  innstillinger, feil uten noen endring i lokal lagring, eldre kopi og mobil.
  Den eksisterende feilloggtesten i `e2e/errors.spec.ts` bruker de nye
  synlige navnene; alle kontrollene av feillogg og sikkerhetskopi er beholdt.

Manuell kontroll: Åpne appen og velg Innstillinger (på mobil: Mer →
Innstillinger). Eksporter en sikkerhetskopi og sjekk at datoen oppdateres.
Endre lagnavn eller en taktikk, velg Importer og den lagrede filen. Avbryt
først og sjekk at endringen står. Importer igjen og velg Erstatt alt;
originaldataene skal komme tilbake, også etter omlasting. Kontroller
treninger, egne øvelser, kalender, rapporter og tema. Prøv også en tom fil,
feil filtype eller en skadet kopi: det skal komme norsk feil uten at data
forsvinner. Bruk gjerne en egen nettleserprofil til prøven og behold originalkopien.

Alle kontrollene er kjørt på nytt etter siste rettelse:

| Kommando | Resultat for oppgave 5 |
| --- | --- |
| `npx tsc --noEmit` | Grønn, ingen typefeil |
| `npx vitest --run` | Grønn, 26 filer / 276 tester |
| `npm run build` | Grønn; siste kode er også bygget på nytt av offline-kontrollen |
| `npm run test:e2e -- --workers=1` | Grønn, 28 tester |
| `npm run test:offline` | Grønn, begge produksjonstestene |

Underveis ble testvelgerne tilpasset de tydeligere navnene i Innstillinger.
Sluttkontrollen avdekket også tapet av gamle fremmøtenotater; alle fem
kontrollene ovenfor ble gjentatt etter rettelsen. Ingen tester er hoppet
over eller fjernet. Mobilvisningen er kontrollert med skjermbilde.

Som i de tidligere oppgavene måtte bare de kjente testserverprosessene
stoppes etter ferdige nettlesertester på Windows, slik at Playwright
kunne avslutte. Sluttkjøringene avsluttet med kode 0. Varsler om gammel
Browserslist-database og webpack-cache hindret ikke bygg eller tester.
Ingen pakker eller låsefiler er endret, og ingenting er publisert,
committet eller pushet. Den genererte endringen i `public/sw.js` er
tilbakeført og inngår ikke i leveransen.

## Oppgave 4: trygg appoppdatering (17.10.2026)

- `skipWaiting: false` lar en ny service worker vente. Dette er tryggere for
  åpne faner: gammel kode beholder sin worker frem til brukeren velger å oppdatere.
  «Ny versjon er klar» vises diskret nederst, med «Oppdater» og lukkeknapp.
  Etter lukking kommer meldingen tilbake ved neste sidebytte.
- «Oppdater» sender `{ type: 'SKIP_WAITING' }` til den ventende workeren og
  laster siden på nytt først når den har overtatt. En annen åpen fane får
  melding, men lastes aldri om automatisk. En worker som allerede venter
  når siden åpnes, oppdages også. Første installasjon viser ingen melding.
- `ChunkLoadError` og nettlesernes dynamiske importfeil viser
  «Appen er oppdatert – last inn på nytt» i delens feilskjerm, appens
  feilskjerm og den globale feilskjermen. «Last inn på nytt» laster hele siden.
  Feilene føres i den eksisterende lokale feilloggen; filadresser skjules.
- Ingen feil utløser automatisk omlasting (altså null, innenfor grensen på
  maks én per økt). Dermed blir ingen tegning eller videoeksport avbrutt,
  og gjentatte feil kan ikke starte en omlastingsløkke. Ingen ny øktnøkkel,
  endring i brukerdata, lagring, backup eller pakker.
- Forhåndslager, offline-regler og `reloadOnOnline: false` er beholdt.
  `public/sw.js` genereres ved bygging, men endringen i byggefilen følger
  ikke med denne oppgaven.
- Nye enhetstester dekker første installasjon, eksisterende ventende worker,
  ny installasjon, SKIP_WAITING, overtakelse fra andre faner, opprydding,
  offline-sjekk, feilgjenkjenning, feilskjerm, logg og manuell reload.
  E2E blokkerer en modul og kontrollerer både feilmelding og fungerende reload.
  Produksjonstesten endrer script-bytes i den ekte genererte workeren for å
  simulere en ny versjon og gjenoppretter filen i `finally`. Den kontrollerer
  venting, melding, lukking/sidebytte, en nyåpnet fane, dokumentidentitet,
  bevart søk frem til klikk, ny aktiv worker etter klikk og offline etterpå.
  Den opprinnelige produksjonstesten for offline/tilbakekobling er beholdt.

Manuell kontroll: kjør `npm run build` og `npm start`, og åpne
http://localhost:3000 i to faner. Når en ny versjon er
tilgjengelig, skal du kunne fortsette å jobbe, lukke meldingen og se den
igjen etter sidebytte. Trykk «Oppdater» når du er ferdig med pågående arbeid;
bare denne fanen skal lastes om. Slå deretter av nettet og prøv Taktikk.

| Kommando | Resultat for oppgave 4 |
| --- | --- |
| `npx tsc --noEmit` | Grønn, også etter de siste testendringene |
| `npx vitest --run` | Grønn, 25 filer / 258 tester |
| `npm run build` | Grønn |
| `npm run test:e2e -- --workers=1` | Grønn, 25 tester |
| `npm run test:offline` | Grønn, 2 produksjonstester med nytt bygg |

Underveis måtte produksjonstestens rekkefølge tilpasses den eksisterende
fanesynkroniseringen: åpning/omlasting av en ekstra fane velger Oversikt i
begge faner, uten å laste den første siden på nytt. Testen åpner derfor
ekstrafanen før søket og måler dokumentidentitet uavhengig av visningen.
Ingen kontroll er fjernet. Som ved forrige etterkontroll måtte bare den
kjente testserverprosessen stoppes direkte etter ferdige tester på Windows;
begge Playwright-kommandoene avsluttet deretter med kode 0. Bygget varslet
om gammel Browserslist-database og webpack-cache, uten å hindre kontrollene.
Ingen pakker er installert, og ingenting er publisert, committet eller pushet.

## Etterkontroll av Next 15 og offline (17.10.2026)

To feil ble funnet og rettet:

- `npm run build` feilet med `EACCES` ved nedlasting av Schibsted Grotesk,
  Instrument Serif og IBM Plex Mono fra Google Fonts. De samme Latin-filene
  ligger nå i `src/app/fonts/` og brukes via `next/font/local`. Filene er
  gjenfunnet uendret i prosjektets tidligere produksjonscache og kontrollert
  mot innholdshash og innebygde skriftnavn/stiler. Lisens og opphav følger med.
  Ingen ny pakke eller nedlasting trengs for byggingen.
- Første produksjonstest stoppet mens den ventet på aktiv service worker.
  `next-pwa` hadde lagt `/_next/app-build-manifest.json` i forhåndslageret,
  men Next 15 svarte 404 på den interne filen. Dermed feilet hele
  installasjonen. `buildExcludes` i `next.config.mjs` utelater nå bare dette
  manifestet; appens JavaScript, CSS og skrifter forhåndslagres fortsatt.

`npm run test:offline` kjører nå `playwright.offline.config.ts` og
`e2e-production/offline.spec.ts`. Oppsettet bygger appen og kjører
`npm start -- --port 3101`; det gjenbruker aldri en eksisterende server.
De vanlige e2e-testene bruker fortsatt utviklingsserveren på port 3100.
Kjør testkommandoene etter hverandre, siden de bruker samme `.next`-mappe.

Produksjonstesten bruker en tom nettleserkontekst i Edge. Den venter på
aktiv service worker og ferdig lagret startside, slår av nettet med
`context.setOffline(true)`, laster siden på nytt og bekrefter at svaret kommer
fra service workeren. HTTP-cachen er slått av med pass-through-routing;
ingen svar forfalskes. En HEAD-forespørsel utenfor offline-lageret må feile,
og `navigator.onLine` må være `false`.

Forsiden, selve 2D-banen med spillere og øvelseslisten kontrolleres uten nett.
Taktikk og Øvelser åpnes for første gang etter at nettet er slått av, slik
at testen også dekker de dynamiske modulene. Når nettet slås på igjen,
kontrolleres den ekte `online`-hendelsen, uendret dokumentidentitet,
ingen dokumentnavigasjon og at søket i Øvelser fortsatt står der etter
tre sekunder. `reloadOnOnline: false` er beholdt og bekreftet i nettleseren.

Under utviklingen av testen ble en ekstra CDP-nettverkskobling fjernet:
den fikk Edge til å vise `navigator.onLine === true` etter offline-omlasting,
selv om nettverkskall feilet. Playwrights vanlige routing slår av HTTP-cachen
uten denne konflikten. Ingen kontroll ble fjernet eller svekket.

| Kommando | Resultat |
| --- | --- |
| `npx tsc --noEmit` | Grønn, ingen typefeil |
| `npx vitest --run` | Grønn, 24 filer / 240 tester |
| `npm run build` | Grønn etter at skriftene ble lagret lokalt |
| `npm run test:e2e -- --workers=1` | Grønn, alle 24 tester |
| `npm run test:offline` | Grønn, 1 produksjonstest, inkludert tilbakekobling uten reload |

Miljømerknad: Denne Windows-sandboxen hindret Playwrights automatiske
prosessopprydding. Etter at testene var ferdige, ble bare testserverens
kjente prosess stoppet direkte; deretter avsluttet testkommandoene med
riktig resultat. Byggene varslet også om gammel Browserslist-database og
webpack-cache som ikke kunne lagres. Det hindret ikke bygg eller tester.

Ingen eksisterende tester er hoppet over, slettet eller svekket. Ingen nye
pakker, ingen endringer i låsefilen eller PWA-biblioteket, ingen
`npm audit fix`, commit, push eller publisering. `public/sw.js` er regenerert
av produksjonsbygget; å ta byggefilene ut av git er fortsatt oppgave 7.

For manuell kontroll: kjør `npm run build` og `npm start`, åpne
http://localhost:3000, vent på aktiv service worker i DevTools → Application,
slå av nettet og last siden på nytt. Prøv Oversikt, Taktikk og Øvelser,
skriv et søk og slå på nettet igjen. Visningen og søket skal bli stående.



Kartleggingen nedenfor beskriver den opprinnelige ryddeplanen. Etterkontrollen ovenfor dokumenterer rettelsene og testene som nå er gjennomført i prosjektet.



\## Rettet



1\. \*\*Next.js-rådet er oppdatert.\*\* 14.2.35 er ikke lenger målet. Planen har nå konkrete, støttede versjoner (16.x er sluttmålet, med 15.5.x som et mulig mellomsteg), og oppgraderingen er flyttet fra oppgave 28 til oppgave 2–3. Jeg skiller også mellom at pakken er berørt og hva som faktisk er utsatt i akkurat denne appen. Jeg har ingen nettilgang her, så jeg har ikke kunnet åpne varslene. Versjonsnumrene 15.5.28 og 16.4.1 kommer fra gjennomgangen og må sjekkes mot Next.js-varselet samme dag som oppgraderingen gjøres.

2\. \*\*Testtallene er rettet.\*\* Det finnes 22 Vitest-filer og 4 Playwright-filer med 20 `test()`-kall. Det blir 22 kjøringer, fordi to av testene lages i løkker: `e2e/pitch-depth.spec.ts:11` (mobil og desktop) og `e2e/board3d.spec.ts:317` (mp4 og webm). Det som allerede er dekket står nå i planen, og testoppgavene er justert til hullene som faktisk finnes.

3\. \*\*Alle filer over ca. 400 linjer har nå delingsforslag\*\*, også de seks øvelsesfilene, `formations.ts`, `tacticTemplates.ts` og `globals.css`. Datafilene har fortsatt lav prioritet.

4\. \*(Valgfritt, tatt med)\* Oppgraderingen til Next 16 er ikke lenger koblet til å bytte ut `next-pwa`. Man kan bygge med `--webpack` i en overgangsperiode.



\## Avvist



Ingen funn er avvist.



\---



\# Ryddeplan for Taktikkboard (revidert)



\## 1. De 10 største kildefilene (antall linjer, uten tester)



| # | Fil | Linjer | Hva den gjør |

|---|---|---|---|

| 1 | `src/components/ui/TrainingView.tsx` | 1265 → 167 | Trening er delt opp i `components/training/`; se oppgave 20 øverst og filkartet i AGENTS.md |

| 2 | `src/data/drills/forsvar.ts` | 1194 | Forsvarsøvelser (data), barn og voksne |

| 3 | `src/data/drills/angrep.ts` | 1169 | Angrepsøvelser (data) |

| 4 | `src/data/drills/midtbane.ts` | 1150 | Midtbaneøvelser (data) |

| 5 | `src/components/board/TacticBoard.tsx` | 998 → 621 | 2D-brettet er delt opp; se oppgave 21–23 øverst og filkartet i AGENTS.md |

| 6 | `src/data/drills/styrke.ts` | 971 | Styrkeøvelser (data) |

| 7 | `src/store/useAppStore.ts` | 956 | Hele app-tilstanden (Zustand): taktikker, kalender, rapporter, backup, samt reparasjon og migrering av lagrede data |

| 8 | `src/data/drills/cardio.ts` | 798 | Kondisjonsøvelser (data) |

| 9 | `src/components/board/three/BoardScene.ts` | 780 → 287 | 3D-motoren er delt opp; se oppgave 17–19 øverst og filkartet i AGENTS.md |

| 10 | `src/data/drills/keeper.ts` | 766 | Keeperøvelser (data) |



Andre filer over ca. 400 linjer: `DrillsView.tsx` (723), `globals.css` (687), `FullscreenBoard.tsx` (518; 571 → 501 etter oppgave 21–23), `tacticTemplates.ts` (432), `DashboardView.tsx` (428) og `formations.ts` (415). `Board3D.tsx` (393) ligger på grensen. `drills.ts.backup` (531) er død kode og skal slettes, ikke deles.



\## 2. Forslag til deling



**BoardScene.ts (780 før → 287 etter, oppdeling gjennomført 17.10.2026).** Opprinnelig forslag følger; linjehenvisningene nedenfor gjelder den eldre filen på 768 linjer. Faktisk oppdeling og kontroller står i oppgave 17–19 øverst. Flyttet til egne filer i `components/board/three/`:

\- `resourcePool.ts`: `geo/mat/box/sphere/lines`, sporing av eide materialer og teksturer, og opprydding av dem (`:219–248`, deler av `:756–767`).

\- `pitchBuilder.ts`: `buildPitch`, `goal`, linjene tegnet på canvas og tribunene (`:250–334`).

\- `equipment.ts`: `equipmentGroup` (`:415–456`).

\- `figures.ts`: `Figure`-typen, `figure`, `releaseFigure`, `animateFigure`, `makeBall` (`:41–59`, `:213–217`, `:336–413`, `:717–737`).

\- `hud.ts`: fasepille og fremdriftslinje, `setPhase` og `layoutHud` (`:497–522`).

\- `drawingLayer.ts`: `prepareDrawings`, `setDrawings` og `setDrawingLabels` (`:458–495`).

\- `cameraRig.ts`: `CameraView`, `CameraState`, valg av kamera, zoom, følgepunkt, `updateCamera`, `keepInStadium`, `pitchFitDistance` (`:612–710`). Dette er ren matematikk som kan testes i Vitest.

\- `BoardScene.ts` blir igjen med rundt 200 linjer: konstruktør, `loadAssets`, `setFrame`, `advance`, `render`, `resize` og `dispose`.



\*\*TrainingView.tsx (1265 før → 167 etter, oppdeling gjennomført 17.10.2026).\*\* Opprinnelig forslag følger; faktisk oppdeling står i oppgave 20 øverst. Ny mappe `components/training/`:

\- `TrainingOverview.tsx` (`:50–84`)

\- `TrainingView.tsx` (`:85–227`): listen og valgt trening

\- `NewTrainingForm.tsx` (`:228–582`)

\- `TrainingCard.tsx` (`:583–638`)

\- `Stopwatch.tsx` (`:639–695`)

\- `TrainingDetail.tsx` (`:696–1179`). Denne er fortsatt rundt 480 linjer, så notatlisten med stoppeklokke (rundt `:1100–1165`) bør skilles ut i et neste steg.

\- `TacticPicker.tsx` (`:1180–1227`) og `RosterEditor.tsx` (`:1228–1265`)



\*\*TacticBoard.tsx (997).\*\*

\- `PhaseNoteModal.tsx` (`:95–135`)

\- `hooks/useUndoRedo.ts` (`:87–94`, `:238–261`)

\- `hooks/usePhasePlayback.ts` (`:275–342`)

\- `hooks/usePlayerDrag.ts` (`:343–590`)

\- `Board3DSlot.tsx` (`:44–57`)



`usePhasePlayback` og `usePlayerDrag` skal også brukes av `FullscreenBoard.tsx`, som i dag har sine egne kopier av den logikken.



\*\*useAppStore.ts (956).\*\*

\- `store/repair.ts`: alle `repair\*`-funksjoner, `migrateV1` og hjelpefunksjonene (`:149–450`). Dette er rene funksjoner som allerede har tester.

\- `store/tacticModel.ts`: `createPhase`, `createTactic`, `syncPlayers`, `patch\*`, `freeSpot` og `patchItemForward` (`:57–148`, `:271–322`).

\- `store/reportText.ts` (`:20–44`)

\- `store/types.ts`: `AppStore` (`:451–559`)



`STORE\_KEY` og persist-oppsettet skal ikke røres, ellers kan brukere miste data. Oppdeling i Zustand-«slices» kan vurderes senere.



\*\*DrillsView.tsx (723).\*\* Ny mappe `components/drills/`:

\- `drillMeta.ts`: kategorier, aldersbånd, vanskelighetsgrad, farger og ikoner (`:25–73`)

\- `DrillParts.tsx` (`:82–114`)

\- `DrillRow.tsx` (`:115–176`)

\- `ScheduleDrill.tsx`: legge øvelser i kalenderen og ukeplan (`:196–325`)

\- `DrillDetail.tsx` (`:338–569`). Vurder å slå den sammen med `DrillDetailModal.tsx`, som Trening-visningen bruker.



\*\*FullscreenBoard.tsx (518).\*\* Bruk hookene fra TacticBoard-delingen, og skill ut `FullscreenControls.tsx` (kontrollene som skjuler seg selv). Fjern `getNum(p: any)` (`:42`) og den utdaterte kommentaren om `PlayerHome` (`:25`).



\*\*DashboardView.tsx (428).\*\*

\- `dashboard/dates.ts` (`:52–75`): kan testes

\- Ett kort per fil: `NextTrainingTile`, `NextMatchTile`, `ActiveTacticTile`, `WeekTile`, `TasksTile`, `WeeklyDrillsTile` og `AiTile` (`:190–428`)



\*\*Board3D.tsx (393).\*\* Valgfritt: `useFullscreen3D.ts` (fullskjerm og skjermretning) og `use3DExport.ts` (`:245–300`).



\*\*De seks øvelsesfilene.\*\* Del dem etter aldersgruppe, slik at de stemmer én til én med `docs/ovelser/\*-barn.md` og `\*-voksne.md`. Eksempel: `drills/forsvar/barn.ts` (`FORSVAR\_YOUTH`, `:4–597`), `drills/forsvar/voksne.ts` (`FORSVAR\_ADULT`, `:598–1194`), og en `drills/forsvar/index.ts` som eksporterer begge, slik at `src/data/drills.ts` ikke trenger endring. Gjør det samme for angrep (`:571`), midtbane (`:566`), styrke (`:471`), cardio (`:394`) og keeper (`:337`). Da blir det 12 filer på 330–600 linjer. Sjekken av antall og id-er i `drills.ts:91–104` vil oppdage om noe forsvinner.



\*\*formations.ts (415).\*\* Ny mappe `data/formations/`:

\- `index.ts`: `VW/VH`, `Formation`, `getFormations`, `DEFAULT\_FORMATION`, `getFormationSlots` og `getFormationDescription` (`:1–8`, `:57–66`, `:387–415`). Importstien `@/data/formations` beholdes.

\- `positions.ts`: den felles `POS` (`:9–56`)

\- `football11.ts` (`:67–207`), `football5.ts` (`:208–258`), `football7.ts` (`:259–302`) og `football9.ts` (`:303–386`)



\*\*tacticTemplates.ts (432).\*\* Ny mappe `data/tacticTemplates/`:

\- `helpers.ts` (`:41–55`)

\- `football11.ts` (`:62–284`), `football9.ts` (`:285–329`), `football7.ts` (`:330–366`) og `football5.ts` (`:367–375`)

\- `build.ts`: `buildTemplatePhases` (`:376–432`)

\- `index.ts`: typene og den samlede `TACTIC\_TEMPLATES`



\*\*globals.css (687).\*\* Ny mappe `src/styles/`:

\- `theme.css`: temaene mørk og lys (`:5–113`)

\- `base.css`: reset, safe-area, berøring, scroll og fokus (`:114–250`, `:421–479`)

\- `animations.css` (`:253–405`)

\- `board3d.css` (`:480–687`)



`globals.css` beholder bare `@tailwind`. De nye filene importeres fra `layout.tsx`, ikke med `@import`, så man slipper å legge til `postcss-import`.



\## 3. Død kode, duplisering og gamle filer



\*\*Død kode\*\*

\- `src/data/drills.ts.backup` (531 linjer) er slettet i oppgave 6. Ingen importerte den.

\- `src/components/board/svg/SwapOverlay.tsx` er slettet i oppgave 6. Ingen brukte den.

\- `getDrillsByAgeBand` og den tilhørende typeimporten er fjernet i oppgave 6. Ingen brukte funksjonen.

\- Komponenten `SketchPreview` og den tilhørende parseren er fjernet i oppgave 6 etter kontroll av alle referanser. `hasSketch` beholdes uendret for bane-ikonet i øvelseslista.

\- Ubrukte CSS-klasser i `globals.css`: `pulse-gold`, `glow-selected`, `swap-bounce`, `glass-fm`, `skeleton`, `drag-mode`, `player-dragging`, `player-grab`, `text-readable`, `transition-smooth`, `input-base`, `scroll-smooth` og `clickable`. I tillegg er det en utkommentert blokk for rullefelt (`:220–237`).



\*\*Byggefiler\*\*

\- `public/sw.js` og `public/workbox-\*.js` lages av `next-pwa` når appen bygges, men står ikke i `.gitignore`. Sjekket i oppgave 2: `public/sw.js` og `public/workbox-4754cb34.js` ligger i git, og `sw.js` endres ved hvert bygg. De bør tas ut og legges i `.gitignore` (oppgave 7).



\*\*Duplisering\*\*

\- Listen over øvelseskategorier finnes 5 steder: `customDrills.ts:4`, `calendar/shared.tsx:9`, `DrillsView.tsx:28`, `training/NewTrainingForm.tsx:15` (før: `TrainingView.tsx:21`) og `drills.ts:60`.

\- `DAY\_MS` finnes 4 steder, sammen med egne datohjelpere: `tasks.ts`, `DashboardView.tsx`, `training/TrainingOverview.tsx` (før: `TrainingView.tsx`) og `appContext.ts`.

\- Id-er lages på to måter: `useAppStore.ts:17` og `AutoGenForm.tsx:69`.

\- Logikk for dra og avspilling er kopiert mellom `TacticBoard` og `FullscreenBoard`. Avspilling og koordinater er samlet i oppgave 21–23; dra er fortsatt ulikt og står hver for seg.

\- Detaljvisningen for øvelser finnes to steder: inni `DrillsView` og i `DrillDetailModal`.



\*\*Gamle dokumenter\*\*

\- `docs/opus-rapport-2-state.md` og `docs/plan-\*.md` kan være utdatert. Flytt dem til `docs/arkiv/` eller merk hvilken status de har.



\## 4. Feilhåndtering



\*\*Hva som mangler\*\*

\- ~~\*\*Ingen error boundaries.\*\*~~ \*\*Løst i oppgave 1.\*\* Hver hoveddel, 3D-visningen og dialogene har nå sin egen feilskjerm (`components/layout/ErrorBoundary.tsx`), i tillegg til `src/app/error.tsx` og `global-error.tsx`.

\- \*\*Dynamiske importer uten reserveløsning\*\* (`page.tsx:17–30`). Etter en ny versjon kan en gammel service worker eller fane be om en fil som ikke finnes lenger (`ChunkLoadError`). Løst i oppgave 4: egen norsk feilskjerm med reload-knapp og lokal logging. `skipWaiting` er nå `false`, og en oppdateringsmelding lar brukeren velge tidspunkt.

\- \*\*Stille feil.\*\* Hvis kopiering til utklippstavlen feiler i `MatchReport.tsx:228`, får brukeren ingen beskjed.



\*\*Hva som allerede er bra\*\*

\- `safeStorage` varsler brukeren når lagringen er full eller blokkert.

\- `/api/ai` gir feilmeldinger på norsk.

\- `Board3D` fanger opp når WebGL ikke kan starte eller mister forbindelsen (`:106`, `:126`).

\- Data fra lagring og import blir reparert før bruk.



\*\*Logging.\*\* ~~Krasj som brukerne opplever, oppdager du aldri.~~ \*\*Løst i oppgave 1, lokalt:\*\* `lib/errorLog.ts` lagrer de siste 30 feilene på enheten (også `window.onerror` og `unhandledrejection`). Brukeren kan kopiere rapporten under Innstillinger → Feilrapport og sende den selv. Ingenting sendes automatisk.



\## 5. Testdekning



\*\*Dette er allerede dekket\*\*

\- 2D: tegning, bytte og angre, PNG-eksport, tom bane og omlasting (`smoke`).

\- 3D: kun visning, kamera, felles faseklokke, mobilstørrelser, fullskjerm, rotasjon av telefonen, alt utstyr, modeller som mangler, gjenbruk av modellen, og videoeksport i mp4 og webm (`board3d`).

\- Dybdefeil på banen på mobil og desktop (`pitch-depth`).

\- Egne øvelser og AI-flyten, med feilmeldinger og skjema på mobil (`drills`).

\- Enhetstester for reparasjon og migrering i store, fanesynk, AI-kontekst, forespørsel og route, video, lagring, maler, 3D-koordinater og assets.

\- `emptyPitchRender` og `useVideoExport` tester at komponentene tegnes.



\*\*Dette mangler\*\*

1\. ✅ **Trening er dekket i oppgave 10:** `e2e/training.spec.ts` tester hele brukerflyten på desktop og mobil, inkludert lagring etter omlasting. Identisk fil er grønn både før oppdelingen (main) og etter; se etterkontrollen øverst.

2\. ✅ \*\*Backup er dekket i oppgave 5:\*\* `lib/backup.test.ts` og `e2e/backup.spec.ts` tester hele eksport/import, eldre kopier, skadde filer, alle datatyper, 50 taktikker og mobil. Se etterkontrollen øverst.

3\. \*\*Kalender:\*\* opprette, endre og slette hendelser, `NewEventForm` og `AutoGenForm`. Bare «Legg i kalenderen» fra øvelser er dekket.

4\. \*\*Rapporter\*\* og `MatchReport`.

5\. \*\*2D-fullskjerm\*\* (`FullscreenBoard`) med dra.

6\. \*\*Enhetstester for\*\* `getWeeklyDrills` og `isoWeek` (uke 53 og årsskifte), `getFormationSlots` med reserveløsning, og datohjelperne i dashbordet.

7\. \*\*Ekte berøring:\*\* Playwright kjører bare Desktop Edge med mindre vindu. Det finnes ingen `hasTouch`, ingen WebKit (iPhone) og ingen test av langt trykk for å dra.

8\. ~~\*\*Krasj:\*\* test at en error boundary viser en forståelig melding.~~ \*\*Dekket i oppgave 1\*\* (`ErrorBoundary.test.ts`, `errorLog.test.ts` og `e2e/errors.spec.ts`).

9\. Chatpanelet i AI-treneren (`AiCoach`). Selve route-en er testet, panelet er ikke.



\## 6. Next.js 15.5.28 (oppgradert fra 14.2.5 i oppgave 2)



\- \*\*Nå:\*\* Next 15.5.28, React og React DOM 19.3.1, `sharp` 0.35.5. 15.5.28 er rettelsen for 15.5 i [varselet fra 14. oktober 2026](https://nextjs.org/blog/nextjs-security-update-october-14-2026) (sjekket mot varselet 17.10.2026). Varselet gjelder `use cache` med typede tabeller (kritisk), bildeoptimalisering med SVG, CVE-2026-96889 (kritisk, krever `sharp` 0.35.5 eller nyere), og DoS via Server Actions (høy).

\- \*\*Eksponering i denne appen:\*\* ingen `middleware`, ingen `next/image`, ingen Server Actions, ingen `use cache` og bare én API-route (POST, med egen validering). Bildeoptimaliseringen er nå slått av med `images.unoptimized: true`, så `/\_next/image` svarer 404.

\- \*\*`lucide-react` 0.400, `framer-motion` 11, `zustand` 4 og `next-pwa` 5.6\*\* godtar alle React 19 og Next 15, og trengte ingen endring. Appen bruker ikke `@react-three`, bare ren `three`.

\- \*\*Service workeren ble ikke registrert (gjaldt også før oppgraderingen), rettet i oppgave 2.\*\* `next-pwa` 5.6 legger registreringen i `main.js`, men App Router-sider laster bare `main-app.js`. Det gjaldt både i 14.2.5 og i 15.5.28, så appen virket i praksis ikke uten nett. Nå kjører `components/layout/ServiceWorkerRegister.tsx` (fra `layout.tsx`) `next-pwa` sitt eget skript `next-pwa/register` i produksjon. Skriptet registrerer `/sw.js` og legger startsiden i cachen ved første installasjon. `reloadOnOnline: false` er satt, så siden ikke lastes på nytt midt i en tegning eller video-eksport når nettet kommer tilbake. Ingen ny pakke og ikke noe bibliotekbytte. Oppgave 4 har nå satt `skipWaiting: false`, lagt til melding og brukerutløst oppdatering, samt egen håndtering av `ChunkLoadError` (se etterkontrollen øverst).

\- \*\*`npm audit` etter oppgave 2:\*\* 25 funn (0 kritiske, 21 høye, 3 moderate og 1 lav). Før var det 29 (1 kritisk, 25 høye, 2 moderate og 1 lav). Ingen av funnene gjelder kode som kjører i nettleseren eller i API-routen. Alle er byggeverktøy:

&#x20; - `next` (moderat): en gammel PostCSS som følger med Next og bare brukes under bygging. Rettes først i Next 16 (oppgave 3).

&#x20; - `next-pwa` → `workbox-webpack-plugin`/`workbox-build`/`rollup-plugin-terser`/`serialize-javascript`, og `globby`/`fast-glob`: rettes bare ved å bytte ut `next-pwa` (oppgave 27).

&#x20; - `tailwindcss` 3 → `chokidar`/`micromatch`/`braces`: krever Tailwind 4 (egen, større oppgave).

&#x20; - `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob`: følger med ESLint-oppsettet (oppgave 3).

&#x20; - Ti indirekte pakker kan rettes uten å endre `package.json`, med `npm audit fix` uten `--force`: `@babel/core`, `@babel/plugin-transform-modules-systemjs`, `baseline-browser-mapping`, `brace-expansion`, `browserslist`, `fast-uri`, `lodash`, `picomatch`, `postcss-selector-parser` og `source-map-js`. Det er ikke gjort i oppgave 2, fordi bare Next, React og typene skulle endres.

\- \*\*Ekstra for 16:\*\*

&#x20; - Turbopack er standard. `next-pwa` er en webpack-plugin, så bygg med `next build --webpack` i en overgang. Å bytte ut PWA-oppsettet blir da en egen, senere oppgave.

&#x20; - `next lint` er fjernet. Bruk ESLint 9 med flat config og `eslint-config-next@16`.

&#x20; - Node 20.9 eller nyere kreves. Maskinen der oppgave 2 ble testet, har Node 24.18.

&#x20; - Sjekk at `npx next dev` i Playwright-oppsettet fortsatt fungerer med PWA-innpakningen.

\- \*\*Risiko for 16:\*\* middels. React 19 er allerede på plass, så byggeverktøyet (Turbopack og webpack) og ESLint 9 er de største endringene. Dagens 24 e2e-kjøringer gir god dekning for brett og 3D.



\---



\## Prioritert oppgaveliste



Hver oppgave er tenkt som én gren som testes alene. Rekkefølgen er etter nytte og risiko.



1\. ✅ \*\*FERDIG (17.10.2026): Error boundary og lokal feillogg.\*\* Endret etter ønske: knappene er «Prøv igjen» og «Gå til forsiden» (ikke «Last inn på nytt» og «Eksporter backup»), og feilen lagres i en lokal feillogg i stedet for bare `console.error`.
   - Feilskjerm «Noe gikk galt i denne delen» rundt Oversikt, Taktikk (2D), 3D, Trening, Kalender, Øvelser, Rapporter, Innstillinger, AI-treneren, Smart Coach, kamprapporten og 2D-fullskjerm, pluss `app/error.tsx` og `app/global-error.tsx`. Resten av appen virker videre.
   - 3D: uten WebGL 2 (som Three krever) monteres ikke 3D-visningen; feilskjermen foreslår «Bytt til 2D». Feil inne i 3D gir det samme.
   - Feillogg (`lib/errorLog.ts`, nøkkel `taktikk:error-log`): maks 30, med tidspunkt, appversjon, del, melding, kort stack og nettleser/enhet. Bare kjente tekniske feilmeldinger (fra nettleseren, React og Next) lagres; all annen meldingstekst skjules. Egenskapsnavn fra kjøringen («reading 'Ola'») byttes ut med «…». I stacken fjernes adresser, mappestier, tekst i anførselstegn og e-post. Ligger utenfor storen, og er derfor ikke med i backupen.
   - Innstillinger → Feilrapport: «Kopier feilrapport» (lesbar tekst) og «Tøm logg».
   - Data, lagring, 2D og 3D er ikke endret, bare pakket inn.
   - \*Test:\* `src/lib/errorLog.test.ts`, `src/components/layout/ErrorBoundary.test.ts`, `e2e/errors.spec.ts`.
   - Gjenstår: feil som 3D selv viser i sin egen melding (f.eks. «mistet forbindelsen til grafikkortet»), kommer ikke i loggen, fordi 3D-koden ikke skulle endres. Lastefeil etter ny versjon (`ChunkLoadError`) er nå løst i oppgave 4 med egen melding og «Last inn på nytt».

2\. ✅ \*\*FERDIG (17.10.2026): Next 15.5.28 og React 19.\*\* Se del 6 for bakgrunn og `npm audit`.
   - Pakker: `next` 15.5.28 (låst), `react`/`react-dom` ^19.3.1, `@types/react`/`@types/react-dom` ^19.3.0 og `eslint-config-next` ^15.5.28. Ingen nye pakker. `sharp` 0.35.5 følger med Next.
   - `next.config.mjs`: `swcMinify` (fjernet i 15) og `images.domains` (utgått) er tatt bort. `images.unoptimized: true` slår av `/\_next/image`, som appen ikke bruker.
   - Kode: bare typer for React 19. `useRef` må ha en startverdi (`Board3D.tsx`), og refs som sendes til hookene, kan være `null` (`useImageExport`, `useDrawingInput`, `useBallDrag` og `useBoardZoom`). Ingen endret oppførsel.
   - Guiden til 15 er sjekket: ingen `cookies`/`headers`/`params`/`searchParams`, ingen `useFormState` og ingen GET-route. Den eneste routen (`/api/ai`, POST) er allerede `force-dynamic` og sender `no-store`. Bygget bruker webpack (standard i 15), så `next-pwa` virker som før.
   - \*Test:\* `npx tsc --noEmit`, Vitest (24 filer, 240 tester), `npm run build` og alle 24 e2e-kjøringer med `--workers=1`. Alt er grønt. `npm run lint` virker og gir én advarsel i `TacticBoard.tsx:494`, i kode som ikke er endret. Produksjonsbygget er også prøvd i Edge: alle visninger og 3D vises uten konsollfeil, og `/api/ai` svarer som før.
   - Underveis: `pitch-depth (mobile)` feilet én gang fordi WebGL ikke startet, mens maskinen var tom for minne. Den gikk grønt 3 av 3 ganger alene og i en ny full kjøring.
   - Funnet underveis og rettet etter review: service workeren ble ikke registrert, verken før eller etter oppgraderingen (se del 6). `ServiceWorkerRegister.tsx` kjører nå registreringen fra `next-pwa`, og `reloadOnOnline` er slått av. Etterkontrollen fant også et internt manifest som svarte 404 og hindret installasjonen; dette er rettet med `buildExcludes`. Produksjonsbruk uten nett og tilbakekobling uten reload er nå dekket og grønt med `npm run test:offline` (se etterkontrollen øverst). Vanlig `test:e2e` kjører fortsatt i utviklingsmodus, der PWA er av.

3\. \*\*Next 16.x (siste rettede).\*\* Bygg med `--webpack`, flytt linting til ESLint 9 og sjekk Node-versjonen. \*Test:\* som i oppgave 2. Sjekk at service workeren fortsatt registreres i produksjonsbygget og at appen kan lastes uten nett (se del 6). \*Risiko: middels.\*

4\. ✅ \*\*FERDIG (17.10.2026): Trygg appoppdatering og `ChunkLoadError`.\*\* Ny service worker venter på «Oppdater», melding kan lukkes og kommer tilbake ved sidebytte. Dynamiske lastefeil viser «Appen er oppdatert – last inn på nytt» og logges lokalt. Ingen automatisk reload. Enhetstester, e2e med blokkert modul og produksjonstest av ny worker/offline; se egen etterkontroll øverst.

5\. ✅ \*\*FERDIG (17.10.2026): Tester og trygg import for `lib/backup.ts`.\*\* Hele eksport/import, eldre format, feil uten endring av data, feillogg utenfor kopien, 50 taktikker, alle innstillinger, tydelige knapper/bekreftelse og rolig 30-dagerspåminnelse. Se egen etterkontroll øverst.

6\. ✅ **FERDIG (17.10.2026): Rydding med lav risiko, inkludert AI-rydding.** Fjernet ubrukt reservefil, `SwapOverlay`, `getDrillsByAgeBand`, fem gamle SVG-er og de ubrukte delene av `SketchPreview`. `hasSketch` og alle brukte filer beholdes. AI-delen er også fullført: «Glem tilgangskode» er fjernet, tilgangsstatus og automatisk sletting ved HTTP 401 er beholdt, og fartsgrensemeldingen bruker `AI_RATE_LIMIT`. Se etterkontrollen øverst. **Risiko: lav.**

6a. ✅ **FERDIG (17.10.2026): Opptak fra fullskjerm i 2D og 3D.** En opptaksknapp inne i fullskjermvisningen bruker visningen brukeren ser (kameravinkel, zoom og kameravalg i 3D, samme utsnitt i 2D), med samme kvalitet og formater som dagens videoeksport. Samme eksportmotorer, opptaksindikator, stopp/avbryt og mobiltester i MP4/WebM. Se etterkontrollen øverst. Begrunnelse for plassering: berører samme filer som skal deles opp, så opptaksfunksjonen er bygget før oppdelingen.

7\. 🟡 **DELVIS (17.10.2026): Ta byggefilene for PWA ut av git** og legg dem i `.gitignore`. `.gitignore` er oppdatert; `git rm --cached` og kontrollkommandoene gjenstår, se øverst. \*Risiko: lav.\*

8\. \*\*Fjern ubrukt CSS\*\* og den utkommenterte rullefelt-blokken. \*Test:\* e2e og en rask visuell sjekk av begge temaene. \*Risiko: lav.\*

9\. \*\*Gi beskjed når kopiering feiler\*\* i `MatchReport`. \*Risiko: lav.\*

10\. ✅ **FERDIG (17.10.2026): E2E for Trening.** To komplette brukerflyter på desktop og mobil (390 × 844), med øvelser/advarsel, notat, fremmøte/navneliste, taktikk, rekkefølge, stoppeklokke, fullført, deling, sletting og omlasting. Samme testfil gir 2/2 på grenen og main. Se øverst. **Risiko: ingen.**

11\. \*\*E2E for Kalender.\*\* Backup-eksport og -import i Innstillinger er ferdig i oppgave 5. \*Risiko: ingen.\*

12\. \*\*Enhetstester\*\* for `getWeeklyDrills`/`isoWeek`, `getFormationSlots` og datohjelperne. \*Risiko: ingen.\*

13\. \*\*Playwright-prosjekt med berøring\*\* (`hasTouch`, telefonstørrelse) for noen røyktester, og eventuelt WebKit. \*Risiko: lav.\*

14\. \*\*Felles konstanter:\*\* én liste over kategorier, `lib/dates.ts` og `lib/id.ts`. \*Risiko: lav.\*

15\. \*\*Skill ut `store/repair.ts`\*\* fra `useAppStore`. Testene flyttes med. \*Risiko: lav.\*

16\. \*\*Skill ut `store/tacticModel.ts`, `reportText.ts` og `types.ts`.\*\* \*Risiko: lav–middels.\*

17. **Gjennomført 17.10.2026: BoardScene trinn 1.** `resourcePool.ts`, `pitchBuilder.ts` og `equipment.ts`. Kontroller og linjetall før/etter står øverst.

18. **Gjennomført 17.10.2026: BoardScene trinn 2.** `figures.ts`, `hud.ts` og `drawingLayer.ts`. Kontroller og linjetall før/etter står øverst.

19. **Gjennomført 17.10.2026: BoardScene trinn 3.** `cameraRig.ts`; `pitchFitDistance` er sammenlignet direkte før/etter i 144 tilfeller, uten å endre testantallet. Kontroller og begrunnelse står øverst.

20\. ✅ **FERDIG, etterkontrollert 17.10.2026: Del opp TrainingView** som beskrevet i del 2. Oppgave 10 er nå gjort og gir samme 2/2-resultat på grenen og main. Typesjekk, 304 enhetstester, bygg, 38 e2e-tester og 3 offline-tester er grønne; første WebM-tidsavbrudd og omkjøringen er dokumentert øverst. Ingen produktkode rettet. **Risiko: middels.**

21\. **Kode ferdig 17.10.2026, kontroller gjenstår: TacticBoard trinn 1.** `PhaseNoteModal`, `useUndoRedo` og `Board3DSlot`. Se øverst.

22\. **Kode ferdig 17.10.2026, kontroller gjenstår: TacticBoard trinn 2.** `usePhasePlayback`, også brukt i FullscreenBoard, og felles `useSvgCoordinates`. Se øverst.

23\. 🟡 **DELVIS (17.10.2026): TacticBoard trinn 3.** `usePlayerDrag` er laget for TacticBoard. Den brukes ikke i FullscreenBoard, fordi dra-logikken der er en annen og en sammenslåing ville endret oppførsel. `getNum` og den gamle kommentaren står igjen. Krever en beslutning om hvordan dra skal virke i fullskjerm, og bør gjøres etter oppgave 13. \*Risiko: middels–høy.\*

24\. \*\*Del opp DrillsView\*\*, og vurder å slå den sammen med `DrillDetailModal`. \*Test:\* `drills`. \*Risiko: lav–middels.\*

25\. \*\*Del opp DashboardView\*\* i kort og `dates.ts`. \*Risiko: lav.\*

26\. \*(Valgfritt)\* \*\*Board3D:\*\* `useFullscreen3D` og `use3DExport`. \*Risiko: middels.\*

27\. \*\*Erstatt `next-pwa`\*\* med for eksempel Serwist eller en egen service worker, slik at `--webpack` ikke trengs lenger. \*Risiko: middels.\* Bare når det trengs. Dette retter også de fleste gjenstående funnene i `npm audit`, og `ServiceWorkerRegister.tsx` kan da erstattes av registreringen i det nye oppsettet (del 6).

28\. \*\*Øvelsesfilene etter aldersgruppe:\*\* én gren per kategori, seks små oppgaver. \*Risiko: lav, lav prioritet.\*

29\. \*\*`formations.ts` etter spillformat.\*\* \*Risiko: lav, lav prioritet.\*

30\. \*\*`tacticTemplates.ts` etter spillformat.\*\* \*Risiko: lav, lav prioritet.\*

31\. \*\*`globals.css` i tema, grunnstil, animasjoner og 3D.\*\* \*Risiko: lav, lav prioritet.\*

32\. \*\*Arkiver gamle dokumenter\*\* i `docs/`. \*Risiko: ingen.\*



\## Kort fortalt



Oppgave 6a er gjennomført: Fullskjerm i både 2D og 3D har «Ta opp», tid, stopp og avbryt. Videoen beholder utsnittet og følger kameraet i 3D, uten knapper i bildet. Lagrede taktikker endres ikke. Fremgangsmåte for mobilkontroll og resultater står øverst. Oppgave 5 om sikkerhetskopi og de tidligere etterkontrollene er beholdt nedenfor den nye oppdateringen.

Ryddedelen av oppgave 6 er gjennomført: bekreftet ubrukt kode og gamle bildefiler er fjernet. Funksjonen som viser bane-ikonet i øvelseslista er beholdt. Opptak fra fullskjerm i 2D og 3D er fullført som oppgave 6a før oppdelingen av store filer. AI-delen er også fullført: glemmeknappen i Innstillinger er fjernet, tilgangsstatus og automatisk sletting ved feil kode er beholdt, og tallet i fartsgrensemeldingen følger den faktiske grensen.



Hva som er nytt:

\- Sikkerhetsoppdateringen er flyttet nesten helt frem i køen (oppgave 2 og 3). Målet er nå en nyere versjon som fortsatt får sikkerhetsrettelser. Den gamle versjonen appen bruker i dag får ikke lenger rettelser.

\- Telling av tester er rettet. Appen har flere tester enn jeg skrev sist, blant annet for 3D og øvelser. Sikkerhetskopi og Trening er nå dekket. Det som mangler er særlig egne visningstester for Kalender og Rapporter.

\- Alle store filer har nå forslag til hvordan de kan deles, også øvelsene, formasjonene, malene og stilarket. De som bare inneholder data har lav prioritet.



Hvordan bruke planen: Ta én oppgave om gangen fra toppen av listen. Hver oppgave er liten og kan prøves alene før den neste.



Dette må et menneske bestemme:

\- Om dere går i to steg eller ett steg til den nyeste versjonen. Sjekk de nøyaktige versjonsnumrene på Next.js sin side samme dag som oppdateringen gjøres. Jeg kunne ikke åpne den siden selv.

\- Om feil fra brukerne skal sendes til en ekstern tjeneste. Det handler om personvern. Uten det får dere ikke vite når appen krasjer hos noen.

\- Opptak fra fullskjerm er ferdig i oppgave 6a før oppdeling av store filer. Manuell kontroll på fysiske iPhone-/Android-enheter, iPad og PC/Mac med 16:10-skjerm gjenstår; se fremgangsmåten øverst.

