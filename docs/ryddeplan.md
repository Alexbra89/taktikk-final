Status: oppgave 1 (feilhåndtering), oppgave 2 (Next 15.5.28 og React 19), oppgave 4 (trygg appoppdatering og ChunkLoadError) og oppgave 5 (sikkerhetskopi) er ferdige, 17. oktober 2026. Backup-delen av oppgave 11 er også dekket. Personvern: appen lagrer kun lokalt, ingen kontoer. Feillogging er lokal, ingen ekstern tjeneste.

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
  «Vis bevegelse», spillerutseende og AI-tilgangskode blir nå med. Tema og
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
  Innstillinger forklarer at filen også inneholder eventuell AI-tilgangskode.
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

| 1 | `src/components/ui/TrainingView.tsx` | 1265 | Hele Trening-visningen: oversikt, ny trening, treningskort, stoppeklokke, detaljer, taktikkvelger, spillerliste |

| 2 | `src/data/drills/forsvar.ts` | 1194 | Forsvarsøvelser (data), barn og voksne |

| 3 | `src/data/drills/angrep.ts` | 1169 | Angrepsøvelser (data) |

| 4 | `src/data/drills/midtbane.ts` | 1150 | Midtbaneøvelser (data) |

| 5 | `src/components/board/TacticBoard.tsx` | 997 | 2D-brettet: dra, bytte, angre/gjør om, avspilling, eksport, faser, notat, 3D-bryter |

| 6 | `src/data/drills/styrke.ts` | 971 | Styrkeøvelser (data) |

| 7 | `src/store/useAppStore.ts` | 956 | Hele app-tilstanden (Zustand): taktikker, kalender, rapporter, backup, samt reparasjon og migrering av lagrede data |

| 8 | `src/data/drills/cardio.ts` | 798 | Kondisjonsøvelser (data) |

| 9 | `src/components/board/three/BoardScene.ts` | 768 | 3D-motoren (three.js): bane, figurer, utstyr, kamera, HUD og opprydding |

| 10 | `src/data/drills/keeper.ts` | 766 | Keeperøvelser (data) |



Andre filer over ca. 400 linjer: `DrillsView.tsx` (723), `globals.css` (687), `FullscreenBoard.tsx` (518), `tacticTemplates.ts` (432), `DashboardView.tsx` (428) og `formations.ts` (415). `Board3D.tsx` (393) ligger på grensen. `drills.ts.backup` (531) er død kode og skal slettes, ikke deles.



\## 2. Forslag til deling



\*\*BoardScene.ts (768).\*\* Flyttes til egne filer i `components/board/three/`:

\- `resourcePool.ts`: `geo/mat/box/sphere/lines`, sporing av eide materialer og teksturer, og opprydding av dem (`:219–248`, deler av `:756–767`).

\- `pitchBuilder.ts`: `buildPitch`, `goal`, linjene tegnet på canvas og tribunene (`:250–334`).

\- `equipment.ts`: `equipmentGroup` (`:415–456`).

\- `figures.ts`: `Figure`-typen, `figure`, `releaseFigure`, `animateFigure`, `makeBall` (`:41–59`, `:213–217`, `:336–413`, `:717–737`).

\- `hud.ts`: fasepille og fremdriftslinje, `setPhase` og `layoutHud` (`:497–522`).

\- `drawingLayer.ts`: `prepareDrawings`, `setDrawings` og `setDrawingLabels` (`:458–495`).

\- `cameraRig.ts`: `CameraView`, `CameraState`, valg av kamera, zoom, følgepunkt, `updateCamera`, `keepInStadium`, `pitchFitDistance` (`:612–710`). Dette er ren matematikk som kan testes i Vitest.

\- `BoardScene.ts` blir igjen med rundt 200 linjer: konstruktør, `loadAssets`, `setFrame`, `advance`, `render`, `resize` og `dispose`.



\*\*TrainingView.tsx (1265).\*\* Ny mappe `components/training/`:

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

\- `src/data/drills.ts.backup` (531 linjer). Ingen importerer den.

\- `src/components/board/svg/SwapOverlay.tsx` brukes ingen steder.

\- `getDrillsByAgeBand` (`src/data/drills.ts:47`) brukes ikke.

\- Komponenten `SketchPreview` (`SketchPreview.tsx:179`) blir aldri vist. Bare `hasSketch` importeres. Avklar om den skal tas i bruk eller fjernes.

\- Ubrukte CSS-klasser i `globals.css`: `pulse-gold`, `glow-selected`, `swap-bounce`, `glass-fm`, `skeleton`, `drag-mode`, `player-dragging`, `player-grab`, `text-readable`, `transition-smooth`, `input-base`, `scroll-smooth` og `clickable`. I tillegg er det en utkommentert blokk for rullefelt (`:220–237`).



\*\*Byggefiler\*\*

\- `public/sw.js` og `public/workbox-\*.js` lages av `next-pwa` når appen bygges, men står ikke i `.gitignore`. Sjekket i oppgave 2: `public/sw.js` og `public/workbox-4754cb34.js` ligger i git, og `sw.js` endres ved hvert bygg. De bør tas ut og legges i `.gitignore` (oppgave 7).



\*\*Duplisering\*\*

\- Listen over øvelseskategorier finnes 5 steder: `customDrills.ts:4`, `calendar/shared.tsx:9`, `DrillsView.tsx:28`, `TrainingView.tsx:21` og `drills.ts:60`.

\- `DAY\_MS` finnes 4 steder, sammen med egne datohjelpere: `tasks.ts`, `DashboardView.tsx`, `TrainingView.tsx` og `appContext.ts`.

\- Id-er lages på to måter: `useAppStore.ts:17` og `AutoGenForm.tsx:69`.

\- Logikk for dra og avspilling er kopiert mellom `TacticBoard` og `FullscreenBoard`.

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

1\. \*\*Trening-visningen\*\* har ingen tester: ny trening, legge til øvelser, stoppeklokke, fremmøte og spillerliste. Det er den største filen, så den bør ha tester før den deles.

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

6\. \*\*Slett død kode:\*\* `drills.ts.backup`, `SwapOverlay.tsx` og `getDrillsByAgeBand`. Avklar `SketchPreview`. \*Test:\* build og Vitest. \*Risiko: lav.\*

7\. \*\*Ta byggefilene for PWA ut av git\*\* og legg dem i `.gitignore`. \*Risiko: lav.\*

8\. \*\*Fjern ubrukt CSS\*\* og den utkommenterte rullefelt-blokken. \*Test:\* e2e og en rask visuell sjekk av begge temaene. \*Risiko: lav.\*

9\. \*\*Gi beskjed når kopiering feiler\*\* i `MatchReport`. \*Risiko: lav.\*

10\. \*\*E2E for Trening:\*\* ny trening, legge til øvelse, stoppeklokke og fremmøte. \*Risiko: ingen.\*

11\. \*\*E2E for Kalender.\*\* Backup-eksport og -import i Innstillinger er ferdig i oppgave 5. \*Risiko: ingen.\*

12\. \*\*Enhetstester\*\* for `getWeeklyDrills`/`isoWeek`, `getFormationSlots` og datohjelperne. \*Risiko: ingen.\*

13\. \*\*Playwright-prosjekt med berøring\*\* (`hasTouch`, telefonstørrelse) for noen røyktester, og eventuelt WebKit. \*Risiko: lav.\*

14\. \*\*Felles konstanter:\*\* én liste over kategorier, `lib/dates.ts` og `lib/id.ts`. \*Risiko: lav.\*

15\. \*\*Skill ut `store/repair.ts`\*\* fra `useAppStore`. Testene flyttes med. \*Risiko: lav.\*

16\. \*\*Skill ut `store/tacticModel.ts`, `reportText.ts` og `types.ts`.\*\* \*Risiko: lav–middels.\*

17\. \*\*BoardScene trinn 1:\*\* `resourcePool.ts`, `pitchBuilder.ts` og `equipment.ts`. \*Test:\* `board3d` og `pitch-depth`. \*Risiko: lav–middels.\*

18\. \*\*BoardScene trinn 2:\*\* `figures.ts`, `hud.ts` og `drawingLayer.ts`. \*Test:\* som trinn 1, pluss videoeksport. \*Risiko: middels.\*

19\. \*\*BoardScene trinn 3:\*\* `cameraRig.ts`, med enhetstest for `pitchFitDistance`. \*Risiko: middels.\*

20\. \*\*Del opp TrainingView\*\* som beskrevet i del 2. Krever oppgave 10. \*Risiko: middels.\*

21\. \*\*TacticBoard:\*\* skill ut `PhaseNoteModal` og `useUndoRedo`. \*Test:\* `smoke`. \*Risiko: lav–middels.\*

22\. \*\*TacticBoard:\*\* lag `usePhasePlayback`, og bruk den også i FullscreenBoard. \*Risiko: middels.\*

23\. \*\*TacticBoard:\*\* lag `usePlayerDrag`, og bruk den også i FullscreenBoard. Rydd `getNum` og den gamle kommentaren. \*Risiko: middels–høy.\* Gjøres etter oppgave 13.

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



Oppgave 5 er gjennomført: sikkerhetskopiering er tydelig øverst i Innstillinger, hele innholdet kontrolleres ved import, og feil i filen skal la eksisterende data stå urørt. Eldre kopier, alle datatyper og store samlinger har egne tester. Fremgangsmåte for manuell kontroll og kontrollresultater står øverst i dokumentet, sammen med de tidligere etterkontrollene.



Hva som er nytt:

\- Sikkerhetsoppdateringen er flyttet nesten helt frem i køen (oppgave 2 og 3). Målet er nå en nyere versjon som fortsatt får sikkerhetsrettelser. Den gamle versjonen appen bruker i dag får ikke lenger rettelser.

\- Telling av tester er rettet. Appen har flere tester enn jeg skrev sist, blant annet for 3D og øvelser. Sikkerhetskopi er nå dekket. Det som mangler er særlig egne visningstester for Trening, Kalender og Rapporter.

\- Alle store filer har nå forslag til hvordan de kan deles, også øvelsene, formasjonene, malene og stilarket. De som bare inneholder data har lav prioritet.



Hvordan bruke planen: Ta én oppgave om gangen fra toppen av listen. Hver oppgave er liten og kan prøves alene før den neste.



Dette må et menneske bestemme:

\- Om dere går i to steg eller ett steg til den nyeste versjonen. Sjekk de nøyaktige versjonsnumrene på Next.js sin side samme dag som oppdateringen gjøres. Jeg kunne ikke åpne den siden selv.

\- Om feil fra brukerne skal sendes til en ekstern tjeneste. Det handler om personvern. Uten det får dere ikke vite når appen krasjer hos noen.

\- Om den ubrukte forhåndsvisningen av øvelsesskisser skal tas i bruk eller slettes.

