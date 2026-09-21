# Plan: fem nye funksjoner på taktikkbrettet

Skrevet 2026-09-21, basert på kodebasen ved commit `e19aebd`.
Planen er skrevet for å tas frem igjen ved starten av hver bolk.

**Status: godkjent 2026-09-21.**

### Beslutninger

| Spørsmål | Avgjørelse |
|---|---|
| Spillerbaner: lagres eller utledes? | **Utledes fra fasene.** Ingen `path` på `Player`. |
| Videoformat | **WebM er primærformat**, MP4 når nettleseren melder støtte. **GIF bare hvis brukeren eksplisitt ber om det.** |
| Bolk 4 | **Splittes** i 4a (uttrekk av `BoardStage`) og 4b (innspilling), med hver sin commit. |
| Rekkefølge | **0 → 1 → 2 → 3 → 5 → 4a → 4b** |
| Testing | Alle bolker testes, og brukeren bekrefter, før neste bolk startes. |

---

## 0. Funn i koden som planen bygger på

Disse faktaene styrer flere av valgene under. De bør verifiseres på nytt hvis
det går lang tid før en bolk startes.

| Funn | Konsekvens |
|---|---|
| **Det finnes to `DrawingCanvas`.** [BoardElements.tsx:105](src/components/board/BoardElements.tsx#L105) er den som brukes. [DrawingCanvas.tsx](src/components/board/DrawingCanvas.tsx) har allerede `type`-støtte (`arrow`, `line`, `circle`, `movement`) men importeres **ikke noe sted** — den er død kode. | Bolk 1 må rydde dette først, ellers gjøres jobben to ganger. |
| **FullscreenBoard tegner tegningene sitt eget sted** ([FullscreenBoard.tsx:339](src/components/ui/FullscreenBoard.tsx#L339)), med `(d: any)`. | Tredje kopi. Må samles i én komponent. |
| **FullscreenBoard har sin egen avspillingsløkke**, en nesten ordrett kopi av den i TacticBoard ([TacticBoard.tsx:246](src/components/board/TacticBoard.tsx#L246) mot [FullscreenBoard.tsx:79](src/components/ui/FullscreenBoard.tsx#L79)). | Bolk 5 må endre to steder, eller trekke ut en felles hook. |
| **`repairTactic` slipper `drawings` gjennom urørt** (`Array.isArray(ph.drawings) ? ph.drawings : []`, [useAppStore.ts:169](src/store/useAppStore.ts#L169)). | Nye felter på `Drawing` overlever lagring og backup **uten migrering**. Men: en korrupt tegning valideres heller aldri. |
| **Farger og fonter settes med CSS-variabler** (`rgb(var(--k-ink))`, `fontFamily="var(--font-sans)"`) i PlayerChip, NameLabel og FootballPitch. | Kritisk for bolk 2 og 4: variabler løses **ikke** i en frittstående serialisert SVG. Se risiko der. |
| **Angre/gjør om dekker bare spillerflytting** (`UndoEntry = { playerId, prevPos }`). Tegninger kan bare slettes samlet med viskelæret. | Bolk 1 gjør dette mer merkbart — sju verktøy, og «slett alt» som eneste angring. |
| **Verktøylinja under banen er allerede full** og har `overflow-x-auto` ([TacticBoard.tsx:713](src/components/board/TacticBoard.tsx#L713)). | Sju tegneverktøy, fem farger og eksportknapper får ikke plass på mobil uten omorganisering. |
| **Zoom er en CSS-transform på en wrapper**, ikke en `viewBox`-endring. | Bra: eksport kan bruke SVG-en direkte uten å bry seg om zoomnivå. |
| `TacticBoard.tsx` er **867 linjer**. | Alt som legges til bør legges i nye filer, ikke i denne. |

---

## Bolk 0 — Rydd sammen tegne-rendringen

**Mål:** én `DrawingCanvas`, brukt av både vanlig brett og fullskjerm. Ingen
funksjonsendring.

### Utgangspunkt

De tre kopiene tegner ikke likt:

| | Hovedbrett (BoardElements) | Fullskjerm (inline) | DrawingCanvas.tsx (død) |
|---|---|---|---|
| Strekens opasitet | 0.85 | 1 | 1 |
| Pilspiss | 14 px, alltid | 12 px, alltid | **ingen** på frihånd |
| Reservefarge | – | `#EDEDEF` | – |

Hovedbrettet er fasiten, fordi det er der brukeren tegner. Å ta DrawingCanvas.tsx
i bruk som den er, ville fjernet pilspissen fra alle eksisterende streker.

### Endringer

- [src/components/board/DrawingCanvas.tsx](src/components/board/DrawingCanvas.tsx) — tegninger uten `type` rendres nøyaktig som hovedbrettet gjør i dag. De typede grenene (`arrow`, `line`, `circle`, `movement`) står urørt til bolk 1; ingen lagrede tegninger har `type` ennå.
- [src/components/board/BoardElements.tsx](src/components/board/BoardElements.tsx) — `DrawingCanvas` og `ArrowHead` fjernes, `Ball` blir igjen
- [src/components/board/TacticBoard.tsx](src/components/board/TacticBoard.tsx) — importerer fra `./DrawingCanvas`
- [src/components/ui/FullscreenBoard.tsx](src/components/ui/FullscreenBoard.tsx) — den innebygde løkka byttes med `<DrawingCanvas>`

### Synlig konsekvens

Bare i fullskjerm: streken får opasitet 0.85, og pilspissen går fra 12 til 14 px —
samme som på vanlig brett.

### Risiko: **lav**

---

## Bolk 1 — Flere tegneverktøy

**Mål:** frihånd (finnes), rett pil, buet pil, stiplet linje, sirkel, rektangel,
tekst-merkelapp.

### Datamodell

`Drawing` i [types/index.ts](src/types/index.ts) utvides:

```
type DrawingType = 'freehand' | 'arrow' | 'curve' | 'dashed' | 'circle' | 'rect' | 'text'

Drawing {
  id, pts, color          // som i dag
  type?: DrawingType      // valgfri — manglende type = 'freehand' (bakoverkompatibelt)
  text?: string           // kun for 'text'
}
```

`type` er **valgfri**. Gamle tegninger uten feltet rendres som frihånd, akkurat
som `DrawingCanvas.tsx` allerede gjør. Ingen store-migrering (`version: 2` kan
stå), fordi `repairTactic` slipper tegninger gjennom urørt.

Punktkonvensjon per type — bestemmes nå, dokumenteres i koden:

- `freehand`: alle punkter
- `arrow`, `dashed`: `pts[0]` er start, `pts[siste]` er slutt (kun to lagres)
- `curve`: tre punkter — start, kontrollpunkt, slutt (kvadratisk Bézier)
- `circle`: `pts[0]` er senter, `pts[1]` et punkt på radien
- `rect`: `pts[0]` og `pts[1]` er motsatte hjørner
- `text`: `pts[0]` er ankerpunkt, `text` er innholdet

### Filer som endres

- [src/types/index.ts](src/types/index.ts) — `Drawing`, `DrawingType`
- [src/components/board/BoardElements.tsx](src/components/board/BoardElements.tsx) — fjern `DrawingCanvas` herfra, behold `Ball`
- [src/components/board/DrawingCanvas.tsx](src/components/board/DrawingCanvas.tsx) — gjøres til eneste implementasjon, utvides med `curve`, `rect` og `text`, og typene skrives skikkelig (vekk med `as any`)
- [src/components/board/TacticBoard.tsx](src/components/board/TacticBoard.tsx) — `drawMode: boolean` blir `activeTool: DrawingType | null`; `onSvgPtrDown/Move/Up` må bygge riktig punktsett per verktøy; importen av `DrawingCanvas` byttes
- [src/components/ui/FullscreenBoard.tsx](src/components/ui/FullscreenBoard.tsx) — den innebygde tegne-renderingen byttes ut med `<DrawingCanvas>`
- [src/store/useAppStore.ts](src/store/useAppStore.ts) — `removeDrawing(id)` og `undoLastDrawing()`; valider `drawings` i `repairTactic`

### Nye filer

- `src/components/board/drawTools.ts` — verktøydefinisjoner (ikon, navn, minimum antall punkter) og `buildDrawing(tool, pts, color, text?)`
- `src/components/board/DrawToolbar.tsx` — verktøy- og fargevalg, trukket ut av TacticBoard
- `src/components/board/TextLabelModal.tsx` — liten inndialog for tekst-merkelapp (gjenbruker `Modal`)

### Påvirker eksisterende

- Viskelæret (`clearDrawings`) er uendret, men bør suppleres med angring av siste strek.
- Tegnemodus blokkerer drag av spiller og ball i dag (`if (isPlaying||drawMode) return`) — den logikken må følge `activeTool !== null`.
- Tekstverktøyet er det eneste som krever tastatur. Det bryter mønsteret «peker inn, peker ut» og må håndteres eksplisitt, for eksempel med modal ved pointer-up.
- Backup-filer fra før får nye felter ved neste eksport. `parseBackup` er ikke berørt.

### Risiko: **middels**

Mest fordi pointer-håndtererne i TacticBoard allerede deles mellom zoom, drag,
langtrykk og tegning. Verktøybryteren treffer den floken.

### Må testes

- Gammel lagret tegning (frihånd uten `type`) rendres fortsatt — test med eksisterende localStorage, ikke bare tom app
- Alle sju verktøy på mus **og** touch
- Tegning mens brettet er zoomet inn og panorert (koordinatene går via `toSVG`, som tar høyde for transformen — men verifiser)
- Verktøylinja på mobil (iPhone-bredde): får alt plass, eller ruller det bort?
- Eksport og import av backup med hver av de nye typene

---

## Bolk 2 — Eksporter PNG

**Mål:** last ned aktiv fase som bilde.

### Datamodell

Ingen endring.

### Filer som endres

- [src/components/board/TacticBoard.tsx](src/components/board/TacticBoard.tsx) — knapp (hører hjemme i BoardPanel, ikke i den fulle verktøylinja)
- [src/components/board/BoardPanel.tsx](src/components/board/BoardPanel.tsx) — «Last ned bilde», eventuelt valg av oppløsning
- [src/lib/backup.ts](src/lib/backup.ts) — `downloadJson` generaliseres til `downloadBlob`, eller får stå i fred og suppleres

### Nye filer

- `src/lib/exportImage.ts` — `svgToPngBlob(svg: SVGSVGElement, scale: number): Promise<Blob>`

### Den harde biten

Brettet bruker CSS-variabler for **alle** farger og fonter. En serialisert SVG
lastet inn i et `<img>` har ikke tilgang til dokumentets `:root`, så alt blir
svart eller gjennomsiktig. Løsningen:

1. `cloneNode(true)` på SVG-en
2. Les faktiske verdier av `--k-*`-variablene med `getComputedStyle(document.documentElement)`
3. Injiser et `<style>:root{--k-ink:…;--k-pitch:…;}</style>` i klonen
4. Sett `xmlns` og eksplisitt `width`/`height` (viewBox alene holder ikke i Firefox)
5. `XMLSerializer` → `Blob` → `URL.createObjectURL` → `<img>` → `canvas` (2–3× skala) → `toBlob('image/png')`

Fonter: `var(--font-sans)` peker på en Next-font som er lastet i dokumentet, men
ikke i det isolerte SVG-bildet. Enten aksepterer vi fallback til systemfont i
PNG-en, eller så settes eksplisitte fallback-familier i `<style>`.
**Anbefaling: aksepter fallback i første versjon**, og noter det.

### Påvirker eksisterende

Lite. Leser DOM-en, skriver ingenting. Krever at `svgRef` er tilgjengelig der
knappen bor — enklest å løse med en callback fra TacticBoard ned i BoardPanel.

### Risiko: **lav–middels**

Kjent problem med kjent løsning. Nettleserforskjeller er den eneste reelle
usikkerheten.

### Må testes

- Chrome, Firefox og **Safari på iOS** (nedlasting via `<a download>` er historisk skjørt der — fallback: åpne i ny fane)
- Kveldsmodus og dagslysmodus gir riktige farger
- Med zoom aktiv: bildet skal vise hele banen, ikke det zoomede utsnittet
- Alle tegnetyper fra bolk 1 kommer med
- `feDropShadow`-filteret under ballen overlever

---

## Bolk 3 — Spillerbaner

**Mål:** vis hvor spilleren kommer fra og skal, som stiplede linjer eller piler.
Kan slås av og på.

### Datamodell

**Avgjort: ingen endring.** Banene *utledes* av fasene — for spiller `id` er
forrige posisjon `phases[i-1].players.find(p => p.id === id).position`, og neste
ligger i `phases[i+1]`. Spiller-id-ene er stabile på tvers av faser (se
`syncPlayers` i store-en).

Alternativet — å lagre `path` på `Player` — er forkastet: det måtte holdes i synk
ved formasjonsbytte, faseslettinger og drag, og ville duplisere informasjon som
allerede ligger i fasene.

Av/på-bryteren: lokal `useState` i første omgang. Skal den huskes mellom økter,
må den inn i store-en **og** i `partialize` **og** i `repairPersisted` — tre
steder. Vurder det som et lite tillegg hvis brukeren vil ha det.

### Filer som endres

- [src/components/board/TacticBoard.tsx](src/components/board/TacticBoard.tsx) — bryter og rendring
- [src/components/ui/FullscreenBoard.tsx](src/components/ui/FullscreenBoard.tsx) — samme
- [src/components/board/BoardPanel.tsx](src/components/board/BoardPanel.tsx) — naturlig sted for bryteren

### Nye filer

- `src/components/board/PlayerTrails.tsx` — tar `phases` og `activePhaseIdx`, tegner inn- og utbaner
- eventuelt `src/lib/trails.ts` hvis utregningen blir mer enn noen få linjer

### Påvirker eksisterende

- Rent visuelt lag, ingen interaksjon. Må tegnes **under** spillerbrikkene i SVG-rekkefølgen, og ikke fange pekerhendelser (`pointerEvents: none`).
- Bør skjules under avspilling — da vises bevegelsen allerede.
- Visuelt sammenfall med den stiplede linjen fra bolk 1: bruk samme uttrykk, men lavere opasitet, så brukeren skjønner at banene er avledet og ikke tegnet.

### Risiko: **lav**

Største risiko er rot på skjermen når 11 spillere alle har inn- og utbane.
Vurder å vise bane bare for valgt spiller som standard, med «vis alle» som valg.

### Må testes

- Første og siste fase (ingen forrige, ingen neste)
- Taktikk med bare én fase
- Etter formasjonsbytte (posisjoner nullstilles kun i aktiv fase — banene blir da lange og rare, og det er korrekt)
- Etter at en fase er slettet

---

## Bolk 4 — Eksporter GIF/MP4

**Mål:** spill inn avspillingen av fasene som animert fil.

Dette er den tyngste bolken, og den eneste med reelle avhengigheter.

### Avhengigheter

- **Krever bolk 2.** Rammene lages med samme SVG→canvas-rør. Gjøres bolk 2 først, er halve jobben gjort.
- **Bør komme etter bolk 5.** Faselengde og easing bestemmer hvor mange rammer som skal genereres og hvordan de fordeles. Gjøres 4 før 5, skrives eksportøren om i 5.

### Datamodell

Ingen endring utover det bolk 5 innfører.

### Nye filer

- `src/components/board/BoardStage.tsx` — **ren, presentasjonell** SVG-komponent som tar `{ players, ball, drawings, tactic }` og tegner brettet. Ingen hendelser, ingen store-kall.
- `src/lib/exportAnimation.ts` — ramme-løkke og innspilling
- eventuelt `src/components/ui/ExportAnimationModal.tsx` — fremdrift, avbryt, valg av format

### Filer som endres

- [src/components/board/TacticBoard.tsx](src/components/board/TacticBoard.tsx) — bruker `BoardStage` i stedet for egen SVG-innmat
- [src/components/ui/FullscreenBoard.tsx](src/components/ui/FullscreenBoard.tsx) — samme
- [src/lib/exportImage.ts](src/lib/exportImage.ts) — gjenbrukes for enkeltrammer

### Format (avgjort)

| Format | Rolle | Hvordan | Ulempe |
|---|---|---|---|
| **WebM** | **Primærformat** | `canvas.captureStream()` og `MediaRecorder` | Ikke MP4. Safari støtter det dårlig. |
| **MP4** | Brukes når nettleseren melder støtte | `MediaRecorder` med `video/mp4;codecs=avc1`, sjekket med `MediaRecorder.isTypeSupported` | Kun nyere Chrome og Safari. |
| **GIF** | **Bare hvis brukeren eksplisitt ber om det** | `gifenc` eller `gif.js` | Ny avhengighet, web worker, større bundle, treffer next-pwa sin precache. |

Formatvalget skjer ved kjøretid: `isTypeSupported` avgjør om MP4 er tilgjengelig,
ellers WebM. Er ingen av dem støttet (eldre Safari), får brukeren en tydelig
melding i stedet for en tom fil. GIF bygges ikke i 4b; det blir en egen,
senere oppgave hvis brukeren ber om det.

### Den harde biten

SVG-til-bilde-konvertering er **asynkron per ramme** (bildet må dekodes). Man kan
derfor ikke bare kalle `captureStream()` på det levende brettet og håpe. Rammene
må genereres i en egen løkke: for hvert tidspunkt `t` regnes interpolerte
posisjoner ut, `BoardStage` rendres til markup, konverteres til bilde, tegnes på
et canvas, og først da går løkka videre. Innspillingen drives av dette canvaset.

Det er nettopp derfor `BoardStage` må trekkes ut først. **Bolken deles i to (avgjort):**

- **4a:** trekk ut `BoardStage`, la TacticBoard og FullscreenBoard bruke den. Ingen ny funksjonalitet. Testes for seg.
- **4b:** selve eksporten.

4a er en ren refaktorering av det mest brukte skjermbildet i appen. Den fortjener
en egen commit og en egen testrunde.

### Påvirker eksisterende

4a rører hjertet av appen. Alt fra drag til zoom til snapping tegnes i den SVG-en.

### Risiko: **høy**

Den eneste bolken jeg ville satt av dobbelt så lang tid til som anslaget tilsier.

### Må testes

- 4a: **hele** brettet på nytt — drag, bytte, snapping, zoom, tegning, avspilling, fullskjerm
- 4b: taktikk med 2 faser og med 6 faser; avbryt midtveis; minnebruk ved lang animasjon
- Filstørrelse på en typisk animasjon
- Mobil: innspilling på en telefon er tregt og kan gå tom for minne — vurder å begrense oppløsningen der

---

## Bolk 5 — Egendefinert animasjon

**Mål:** varighet per fase, myk start og stopp (easing), loop-modus.

### Datamodell

```
TacticPhase {
  …
  durationMs?: number        // valgfri, faller tilbake på taktikkens standard
}

Tactic {
  …
  playback?: {
    defaultDurationMs: number
    easing: 'linear' | 'easeInOut'
    loop: boolean
  }
}
```

Begge er valgfrie, så gamle data virker. Men her **må** `repairTactic` utvides —
i motsetning til `drawings` valideres `phases` felt for felt, og et nytt felt
uten en linje i `repairTactic` blir **kastet ved neste innlasting**. Det er den
klassiske fellen i denne kodebasen, og grunnen til at bolk 5 må røre store-en
mens bolk 1 slipper.

### Filer som endres

- [src/types/index.ts](src/types/index.ts)
- [src/store/useAppStore.ts](src/store/useAppStore.ts) — `repairTactic` (kritisk), `createPhase`, nye actions `setPhaseDuration` og `setPlaybackSettings`
- [src/components/board/TacticBoard.tsx](src/components/board/TacticBoard.tsx) — avspillingsløkka skrives om
- [src/components/ui/FullscreenBoard.tsx](src/components/ui/FullscreenBoard.tsx) — samme løkke
- [src/components/board/BoardPanel.tsx](src/components/board/BoardPanel.tsx) — dagens fartsknapper ([BoardPanel.tsx:114](src/components/board/BoardPanel.tsx#L114)) utvides med varighet, easing og loop

### Nye filer

- `src/lib/playback.ts` — easing-funksjoner og `phaseAt(elapsed, phases)`
- `src/hooks/usePhasePlayback.ts` — **anbefalt**: én hook som begge brettene bruker, i stedet for to kopier av løkka

### Påvirker eksisterende

- Dagens løkke er `setInterval(…, 30)` med `t += 0.025 * playSpeed` — faste steg uavhengig av faktisk tid. Den bør bli `requestAnimationFrame` med tidsstempler. Det endrer følelsen av avspillingen litt, også for brukere som aldri rører de nye innstillingene.
- `playSpeed` finnes allerede som lokal state sendt ned i BoardPanel. Enten beholdes den som multiplikator oppå varighetene, eller så erstattes den. **Anbefaling: behold den** — «dobbel fart» er en annen handling enn «denne fasen varer tre sekunder».
- Loop sammen med `useEffect`-en i FullscreenBoard som synker `activeIdx` til store-en ([FullscreenBoard.tsx:108](src/components/ui/FullscreenBoard.tsx#L108)) må sjekkes: en evig løkke som skriver til store-en ved hvert fasebytte er greit i seg selv, men verifiser at det ikke utløser lagring til localStorage i ring.

### Risiko: **middels**

Datamodellen er lav risiko. Omskrivingen av løkka to steder er det som koster.

### Må testes

- Gammel taktikk uten `durationMs` spiller av som før
- **Last inn siden på nytt etter å ha satt varighet** — dette er testen som avslører om `repairTactic` ble glemt
- Loop av og på; stopp midt i loop; bytte fase mens loop går
- Eksport og import av backup med varigheter
- Fullskjerm og vanlig brett oppfører seg likt

---

## Rekkefølge-analyse

### Avhengigheter

```
Bolk 1  (tegneverktøy)    -- uavhengig
Bolk 2  (PNG)             -- uavhengig, men bør komme etter 1 så eksporten dekker alt
Bolk 3  (spillerbaner)    -- helt uavhengig
Bolk 5  (animasjon)       -- uavhengig
Bolk 4  (GIF/MP4)         -- KREVER 2 (rammerendring), BØR komme etter 5 (timing),
                             og forutsetter 4a (uttrekk av BoardStage)
```

Bare bolk 4 har harde avhengigheter. De fire andre kan tas i nesten hvilken som
helst rekkefølge.

### Rekkefølge (godkjent)

**0 → 1 → 2 → 3 → 5 → 4a → 4b**

- **Bolk 0 (ny, liten):** samle de tre tegne-rendringene til én komponent. Ti minutter, og det sparer arbeid i bolk 1 og gjør bolk 4a mindre.
- **4 sist**, fordi den bygger på to andre bolker.
- **5 før 4**, ellers skrives eksportøren om.

### Bør noe slås sammen eller splittes?

| Forslag | Hvorfor |
|---|---|
| **Splitt bolk 4** i 4a (uttrekk av `BoardStage`) og 4b (eksport) | 4a er en refaktorering av appens kjerne uten ny funksjonalitet. Den må testes for seg, ellers vet man ikke om en feil kom fra refaktoreringen eller fra eksporten. |
| **Skill ut bolk 0** fra bolk 1 | Én commit som bare rydder, uten funksjonsendring, er lett å rulle tilbake hvis noe ryker. |
| **Slå sammen 3 og 5? Nei.** | De ser beslektede ut (begge handler om bevegelse), men rører helt ulike deler: 3 er rendring, 5 er datamodell og løkke. |
| **Ta uttrekket av `usePhasePlayback` i bolk 5** | Bolk 5 må uansett endre løkka to steder. Trekk den ut der, så slipper 4b å forholde seg til to varianter. |

---

## Samlet risiko

### Hva kan gå i stykker

1. **Tapte felter ved innlasting.** `repairTactic` hvitlister felt for felt på `Player` og `TacticPhase`. Nye felter som ikke står der forsvinner stille ved neste sidelast — ikke ved testing i samme økt. Gjelder bolk 5 (`durationMs`), og bolk 1 hvis det legges felter på `Player`. **Test alltid med en full sidelast.**
2. **Pointer-logikken i TacticBoard.** Zoom, drag, langtrykk og tegning deler de samme håndtererne og kommuniserer via refs. Bolk 1 endrer dem. Symptomet ved feil er at drag slutter å virke etter en panorering — det har skjedd før (se kommentaren ved `gestureRef`, [TacticBoard.tsx:172](src/components/board/TacticBoard.tsx#L172)).
3. **Dobbeltimplementasjon.** TacticBoard og FullscreenBoard har hver sin avspilling og hver sin tegne-rendring. Alle fem bolkene treffer minst én av dem. Glemmes fullskjerm, ser det ut som funksjonen ikke virker på mobil.
4. **CSS-variabler i eksport** (bolk 2 og 4). Nevnt over.
5. **localStorage-kvote.** Mange faser ganger mange tegninger, særlig tekst, vokser raskt. `safeStorage` fanger feilen, men brukeren mister lagring uten å skjønne hvorfor. Verdt en sjekk etter bolk 1.
6. **Service worker.** `public/sw.js` genereres av next-pwa ved bygg og skal rulles tilbake før commit, som i den vanlige arbeidsflyten. Bolk 4 kan dessuten dra inn en worker-basert avhengighet — da må precache-listen sjekkes.
7. **Verktøylinja på mobil.** Fem bolker legger knapper på et brett der linja allerede ruller sidelengs. Vurder en omorganisering — for eksempel at tegneverktøyene får sin egen rad som vises bare i tegnemodus.

### Avvik fra opprinnelig bestilling (alle godkjent)

- **Spillerbaner utledes, lagres ikke.** Se bolk 3.
- **WebM/MP4 fremfor GIF.** GIF bare på eksplisitt forespørsel.
- **Bolk 4 deles i to commits.**
- **Bolk 0 er lagt inn foran bolk 1.**

### Per commit (uendret arbeidsflyt)

`npx tsc --noEmit` og `npm run build`, rull tilbake `public/sw.js`, vis diff og
vent på klarsignal.

---

## Anbefalt start: bolk 1 (med bolk 0 foran)

**Hvorfor bolk 1:**

1. **Den gir mest per time.** Sju tegneverktøy er det en trener merker først på et taktikkbrett. De fire andre er støttefunksjoner rundt noe som allerede virker.
2. **Halve jobben er gjort.** `DrawingCanvas.tsx` har allerede `arrow`, `line`, `circle` og `movement` implementert — den er bare aldri koblet inn.
3. **Ingen datamodell-risiko.** `drawings` slipper gjennom `repairTactic` urørt, så nye felter overlever lagring uten migrering. Bolk 5 har ikke den luksusen.
4. **Den rydder for de andre.** Bolk 0 og 1 samler tre kopier av tegne-rendringen til én. Bolk 2 og 4 skal eksportere nettopp den rendringen.
5. **Den kan testes uten å stole på noe.** Tegn, last inn siden på nytt, se at streken er der. Ingen nettleserforskjeller, ingen ytelsesfeller.

**Hvorfor ikke bolk 2 først:** PNG-eksport før tegneverktøyene betyr at eksporten
må testes på nytt etter bolk 1 uansett. Rekkefølgen 1 → 2 sparer en testrunde.

**Hvorfor ikke bolk 3 først:** den er lavest risiko av alle, og et godt valg hvis
målet er en rask seier. Men den endrer ingenting brukeren kan *gjøre* — den viser
bare noe som allerede ligger i dataene.
