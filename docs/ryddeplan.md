Status: ingen oppgaver gjort ennå. Personvern: appen lagrer kun lokalt, ingen kontoer. Feillogging skal være lokal, ingen ekstern tjeneste.



Jeg har sjekket alle tre punktene mot koden og skrevet om hele planen. Ingen filer er endret. Det var dette oppdraget ba om, og planen står bare i dette svaret.



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

\- `public/sw.js` og `public/workbox-\*.js` lages av `next-pwa` når appen bygges, men står ikke i `.gitignore`. Sjekk med `git ls-files public` om de ligger i git. I så fall bør de tas ut og legges i `.gitignore`.



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

\- \*\*Ingen error boundaries.\*\* Det finnes ingen `src/app/error.tsx` eller `global-error.tsx`. En kodefeil som oppstår mens en visning tegnes, gir hvit skjerm med Next sin engelske standardtekst. Det gjelder også data som har sluppet forbi reparasjonen.

\- \*\*Dynamiske importer uten reserveløsning\*\* (`page.tsx:17–30`). Etter en ny versjon kan en gammel service worker eller fane be om en fil som ikke finnes lenger (`ChunkLoadError`). Da blir skjermen hvit. Risikoen øker med `skipWaiting: true`.

\- \*\*Stille feil.\*\* Hvis kopiering til utklippstavlen feiler i `MatchReport.tsx:228`, får brukeren ingen beskjed.



\*\*Hva som allerede er bra\*\*

\- `safeStorage` varsler brukeren når lagringen er full eller blokkert.

\- `/api/ai` gir feilmeldinger på norsk.

\- `Board3D` fanger opp når WebGL ikke kan starte eller mister forbindelsen (`:106`, `:126`).

\- Data fra lagring og import blir reparert før bruk.



\*\*Logging.\*\* På klienten finnes bare `console.warn` i `safeStorage` og en sjekk som bare kjører under utvikling. På serveren logges bare bruksdata for AI (`route.ts:44`). Krasj som brukerne opplever, oppdager du derfor aldri.



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

2\. \*\*Backup:\*\* `lib/backup.ts` har ingen enhetstest, og import og eksport i Innstillinger er ikke testet ende til ende. Dette er brukernes eneste redning for data.

3\. \*\*Kalender:\*\* opprette, endre og slette hendelser, `NewEventForm` og `AutoGenForm`. Bare «Legg i kalenderen» fra øvelser er dekket.

4\. \*\*Rapporter\*\* og `MatchReport`.

5\. \*\*2D-fullskjerm\*\* (`FullscreenBoard`) med dra.

6\. \*\*Enhetstester for\*\* `getWeeklyDrills` og `isoWeek` (uke 53 og årsskifte), `getFormationSlots` med reserveløsning, og datohjelperne i dashbordet.

7\. \*\*Ekte berøring:\*\* Playwright kjører bare Desktop Edge med mindre vindu. Det finnes ingen `hasTouch`, ingen WebKit (iPhone) og ingen test av langt trykk for å dra.

8\. \*\*Krasj:\*\* test at en error boundary viser en forståelig melding. Dette kan først gjøres når oppgave 1 er ferdig.

9\. Chatpanelet i AI-treneren (`AiCoach`). Selve route-en er testet, panelet er ikke.



\## 6. Next.js 14.2.5



\- \*\*Pakken er berørt:\*\* 14.x får ikke lenger støtte, og varsler fra i år omfatter ifølge gjennomgangen også 14.x. Nye hull vil ikke bli tettet.

\- \*\*Dokumentert eksponering i denne appen er lavere enn «kjent sikkerhetshull» tilsier.\*\* Appen har ingen `middleware`, bruker ikke `next/image`, har ingen Server Actions og bare én API-route med egen validering. Bildeoptimaliseringen (`/\_next/image`) er likevel aktiv som standard. Den kan slås av med `images.unoptimized: true`. Oppgrader uansett.

\- \*\*Mål: siste sikkerhetsrettede 16.x.\*\* Gjennomgangen oppgir 16.4.1, men sjekk tallet mot varselet når oppgraderingen gjøres. Mellomsteget er siste rettede 15.5.x, oppgitt som 15.5.28. Vil du heller ta færre steg, kan du gå direkte til 16.

\- \*\*Felles for 15 og 16:\*\* App Router krever React 19. Sjekk peer-avhengigheter. `lucide-react` 0.400 må trolig oppdateres. `swcMinify` og `images.domains` er utgått.

\- \*\*Ekstra for 16:\*\*

&#x20; - Turbopack er standard. `next-pwa` er en webpack-plugin, så bygg med `next build --webpack` i en overgang. Å bytte ut PWA-oppsettet blir da en egen, senere oppgave.

&#x20; - `next lint` er fjernet. Bruk ESLint 9 med flat config og `eslint-config-next@16`.

&#x20; - Node 20.9 eller nyere kreves.

&#x20; - Sjekk at `npx next dev` i Playwright-oppsettet fortsatt fungerer med PWA-innpakningen.

\- \*\*Risiko:\*\* middels. React 19 og byggeverktøyet er de største endringene. Dagens 22 e2e-kjøringer gir god dekning for brett og 3D.



\---



\## Prioritert oppgaveliste



Hver oppgave er tenkt som én gren som testes alene. Rekkefølgen er etter nytte og risiko.



1\. \*\*Error boundary.\*\* Lag `app/error.tsx` og `global-error.tsx` med norsk melding og knappene «Last inn på nytt» og «Eksporter backup». Feilen skrives til `console.error`. \*Test:\* en visning som kaster feil med vilje viser meldingen. \*Risiko: lav.\*

2\. \*\*Sikkerhet: oppgrader til Next 15.5.x (siste rettede) og React 19.\*\* Kjør `npm audit` før og etter. Fjern `swcMinify` og vurder `images.unoptimized`. \*Test:\* `npm run build`, Vitest og alle e2e. \*Risiko: middels.\*

3\. \*\*Next 16.x (siste rettede).\*\* Bygg med `--webpack`, flytt linting til ESLint 9 og sjekk Node-versjonen. \*Test:\* som i oppgave 2, pluss at service workeren registreres i produksjonsbygget. \*Risiko: middels.\*

4\. \*\*Håndter `ChunkLoadError`.\*\* Ved feil i en dynamisk import: vis «Ny versjon – last inn på nytt». \*Test:\* e2e som blokkerer én JavaScript-fil. \*Risiko: lav.\*

5\. \*\*Enhetstester for `lib/backup.ts`\*\* (bygg, les, beskriv, ødelagt fil). \*Risiko: ingen.\*

6\. \*\*Slett død kode:\*\* `drills.ts.backup`, `SwapOverlay.tsx` og `getDrillsByAgeBand`. Avklar `SketchPreview`. \*Test:\* build og Vitest. \*Risiko: lav.\*

7\. \*\*Ta byggefilene for PWA ut av git\*\* og legg dem i `.gitignore`. \*Risiko: lav.\*

8\. \*\*Fjern ubrukt CSS\*\* og den utkommenterte rullefelt-blokken. \*Test:\* e2e og en rask visuell sjekk av begge temaene. \*Risiko: lav.\*

9\. \*\*Gi beskjed når kopiering feiler\*\* i `MatchReport`. \*Risiko: lav.\*

10\. \*\*E2E for Trening:\*\* ny trening, legge til øvelse, stoppeklokke og fremmøte. \*Risiko: ingen.\*

11\. \*\*E2E for Kalender, og for backup-eksport og -import i Innstillinger.\*\* \*Risiko: ingen.\*

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

27\. \*\*Erstatt `next-pwa`\*\* med for eksempel Serwist eller en egen service worker, slik at `--webpack` ikke trengs lenger. \*Risiko: middels.\* Bare når det trengs.

28\. \*\*Øvelsesfilene etter aldersgruppe:\*\* én gren per kategori, seks små oppgaver. \*Risiko: lav, lav prioritet.\*

29\. \*\*`formations.ts` etter spillformat.\*\* \*Risiko: lav, lav prioritet.\*

30\. \*\*`tacticTemplates.ts` etter spillformat.\*\* \*Risiko: lav, lav prioritet.\*

31\. \*\*`globals.css` i tema, grunnstil, animasjoner og 3D.\*\* \*Risiko: lav, lav prioritet.\*

32\. \*\*Arkiver gamle dokumenter\*\* i `docs/`. \*Risiko: ingen.\*



\## Kort fortalt



Jeg har rettet opp ryddeplanen etter tilbakemeldingene. Ingen filer i appen er endret, for dette var bare en kartlegging. Planen står i dette svaret.



Hva som er nytt:

\- Sikkerhetsoppdateringen er flyttet nesten helt frem i køen (oppgave 2 og 3). Målet er nå en nyere versjon som fortsatt får sikkerhetsrettelser. Den gamle versjonen appen bruker i dag får ikke lenger rettelser.

\- Telling av tester er rettet. Appen har flere tester enn jeg skrev sist, blant annet for 3D og øvelser. Det som mangler er særlig tester for Trening, Kalender, Rapporter og sikkerhetskopi.

\- Alle store filer har nå forslag til hvordan de kan deles, også øvelsene, formasjonene, malene og stilarket. De som bare inneholder data har lav prioritet.



Hvordan bruke planen: Ta én oppgave om gangen fra toppen av listen. Hver oppgave er liten og kan prøves alene før den neste.



Dette må et menneske bestemme:

\- Om dere går i to steg eller ett steg til den nyeste versjonen. Sjekk de nøyaktige versjonsnumrene på Next.js sin side samme dag som oppdateringen gjøres. Jeg kunne ikke åpne den siden selv.

\- Om feil fra brukerne skal sendes til en ekstern tjeneste. Det handler om personvern. Uten det får dere ikke vite når appen krasjer hos noen.

\- Om den ubrukte forhåndsvisningen av øvelsesskisser skal tas i bruk eller slettes.

