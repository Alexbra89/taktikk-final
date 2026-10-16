# 3D-visning av taktikktavla

Åpne **Taktikk → 3D**. Tavla starter fortsatt i 2D. Rediger spillere, utstyr,
tegninger og faser der, og bytt til 3D for visning og avspilling. Begge visningene
bruker samme avspillingsknapp, fasevalg og klokke. Dagens start/stopp-oppførsel
er beholdt: stopp går til fasens start, og spill av starter sekvensen fra første
fase. Bytte mellom 2D og 3D stopper eller starter ikke avspillingen.

## Kamera

- Dra for å rotere. Rull eller klyp for å zoome.
- Velg Oversikt, Ovenfra, Følg ballen eller Spillerperspektiv.
- Spiller 1 er merket Keeper i spillervelgeren.
- Manuell kamerabevegelse slipper følgekameraet. Velg vinkelen på nytt for å følge igjen.
- Pluss/minus zoomer; tilbakestill går til oversiktsbildet.

3D bruker eksisterende draktfarger, nummer og valgfrie navn. Sirkelstilen bruker
lagets signalfarge på figurene. Temaendringer oppdaterer også tegninger og utstyr.
Ballens høyde eller type pasning finnes ikke i datamodellen. Den ruller derfor
langs den samme banen som i 2D; det legges ikke til oppdiktede luftpasninger.

## Banevalg

2D-koordinatene er uendret. Banens ramme (32,32)–(848,528) omregnes til meter
i 3D. Midtpunktet blir (0,0,0); x følger banens lengde, z følger bredden, y er høyde.
Spillformene bruker faste visningsmål, siden småbaner kan ha flere tillatte mål:

| Spillform | Bane | Mål |
|---|---|---|
| 11er | 105 × 68 m | 7,32 × 2,44 m |
| 9er | 70 × 50 m | 5 × 2 m |
| 7er | 60 × 40 m | 5 × 2 m |
| 5er | 40 × 30 m | 3 × 2 m |

Disse målene lagres ikke på taktikken. Eventuelle klubbspesifikke banemål må
avklares før visningsstandardene endres.

## Video

**Eksporter 3D-video** bruker den valgte kameravinkelen og avspillingsfarten.
Minst to faser trengs. Hele sekvensen eksporteres, med kort innledning og avslutning.
Eksporten endrer ikke tavlas fase eller plasseringer. Fremdrift vises, og Avbryt
stopper uten å laste ned en halvferdig fil. Bytte tilbake til 2D avbryter også eksporten.

WebCodecs koder ett bilde om gangen med egne tidsstempler, 30 bilder/s.
H.264/MP4 foretrekkes, med VP9/VP8/WebM som reserve. 1920 × 1080 foretrekkes;
1280 × 720 brukes dersom koderen ikke støtter full HD. Nettlesere uten WebCodecs
får en forklaring. Eksporten bruker ikke MediaRecorder eller sanntidsopptak.
En treg maskin bruker mer tid på å lage filen; antall bilder og videotempo beholdes.

Eksportens interpolasjon gjenbruker `frameAt` og `interpolateItems` fra dagens
eksport. Den følger det nominelle tempoet på 1200 ms per faseovergang ved 1×.
Dagens 2D-avspilling bruker 30 ms-timersteg; ved 1,5× og 3× kan avrunding til hele
timersteg gi noen millisekunders forskjell. Denne eksisterende klokken er ikke endret.

## Avgrensning og teknikk

- Ingen endringer i `src/types`, `src/store`, `BoardStage`, `DrawingCanvas`
  eller 2D-funksjonene `getDisplayPlayers` / `getDisplayBall`.
- `Board3D` lastes med `next/dynamic`, `ssr: false`, først når 3D åpnes.
- `BoardScene` mottar ferdig beregnede posisjoner fra TacticBoard; ingen egen store.
- Tegninger rasteriseres fra eksisterende `DrawingCanvas` til et flatt banelag.
- Three-geometrier/materialer gjenbrukes; renderer, kontroller og teksturer ryddes opp.
- Mobil bruker redusert pikseloppløsning, ingen skygger og maksimalt 30 oppdateringer/s.
- Ingen nye pakker. MP4- og WebM-beholdere skrives lokalt i `videoMux.ts`.

## Kontroller

- `npm test -- --run`: koordinater, faseinterpolasjon, rotasjon, fart,
  tidsstempler, formatreserve, avbrudd og eksisterende tester.
- `npx tsc --noEmit --incremental false`: typesjekk.
- `npm run lint`: kodekontroll.
- `npm run test:e2e -- --workers=1`: ekte Edge; 2D-redigering/angre/PNG,
  visningsbytte, kamera, mobil, MP4/WebM, avbrudd, oppløsning, varighet,
  videodekoding og synlig bildeinnhold.

Prosjektet har allerede `node_modules`; ingen installasjon er nødvendig her.
Appens eksisterende Google Fonts-oppsett trenger nettverk ved et rent
produksjonsbygg. I et nettverkssperret miljø kan utviklingsvisningen bruke
reservefont, mens produksjonsbygget stopper på fonthentingen.
