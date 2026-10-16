# 3D-visning av taktikktavla

Åpne **Taktikk → 3D**. Tavla starter fortsatt i 2D. Rediger spillere, utstyr,
tegninger og faser der, og bytt til 3D for visning og avspilling. Begge visningene
bruker samme avspillingsknapp, fasevalg og klokke. Dagens start/stopp-oppførsel
er beholdt: stopp går til fasens start, og spill av starter sekvensen fra første
fase. Bytte mellom 2D og 3D stopper eller starter ikke avspillingen.

## Kamera

- Mus: dra for å rotere, høyreklikk og dra (eller Shift + dra) for å flytte
  kameraet sidelengs og langs banen, rull for å zoome.
- Berøring: én finger roterer, to fingre flytter kameraet og klyper for å zoome.
- Flyttingen går langs bakken. Punktet kameraet ser på holdes innenfor
  banen pluss 10 m (omtrent til tribunene).
- Velg Oversikt, Ovenfra, Følg ballen eller Spillerperspektiv.
- Spiller 1 er merket Keeper i spillervelgeren.
- Drar eller zoomer du selv i Følg ballen eller Spillerperspektiv, beholdes din
  vinkel, og kameraet fortsetter å følge. Velg vinkelen på nytt for standardvinkelen.
- Pluss/minus zoomer; tilbakestill går til oversiktsbildet. I Spillerperspektiv
  starter kameraet i spillerens øyne, og minus går bakover til en vinkel over skulderen.
- Videoen bruker samme vinkel, også en vinkel du har dratt deg til selv.

3D bruker eksisterende draktfarger, nummer og valgfrie navn. Sirkelstilen bruker
lagets signalfarge på figurene. Temaendringer oppdaterer også tegninger og utstyr.
Ballens høyde finnes ikke i datamodellen. Bakkebanen er alltid den samme som i 2D.
Korte pasninger ruller; fra omtrent 15 m løftes ballen i en bue som lander der
2D sier (`ballArcHeight` i `three/coordinates.ts`).

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

Spillerne vises forstørret (`figureScale` = 1,2 × (1,3 + 0,6 × banelengde / 105 m):
omtrent 1,83× på 5er, 1,97× på 7er, 2,04× på 9er og 2,28× på 11er), og mål og minimål
forstørres med samme faktor, så forholdet mellom mål og spiller er riktig.
Banelinjene er i ekte mål. Målåpningen står alltid på mållinjen.
Ligger ballen i 2D på eller bak mållinjen inne i målboksen, vises den inne i
nettet, like dypt inn som i 2D-boksen (`ballToWorld`). Ellers er ballen nøyaktig
der 2D har den. På 2D-brettet kan ballen dras på langs til `CLAMP_X` (som
spillere og fullskjerm), altså over mållinjen og inn i målboksen.

Disse målene lagres ikke på taktikken. Eventuelle klubbspesifikke banemål må
avklares før visningsstandardene endres.

## Video

**Eksporter 3D-video** bruker den valgte kameravinkelen og avspillingsfarten.
Minst to faser trengs. Hele sekvensen eksporteres, med kort innledning og avslutning.
Eksporten endrer ikke tavlas fase eller plasseringer. Fremdrift vises, og Avbryt
stopper uten å laste ned en halvferdig fil. Bytte tilbake til 2D avbryter også eksporten.

WebCodecs koder ett bilde om gangen med egne tidsstempler, 30 bilder/s.
H.264/MP4 foretrekkes, med VP9/VP8/WebM som reserve. 1920 × 1080 foretrekkes;
1280 × 720 brukes på mobil, eller dersom koderen ikke støtter full HD. Nettlesere uten WebCodecs
får en forklaring. Eksporten bruker ikke MediaRecorder eller sanntidsopptak.
En treg maskin bruker mer tid på å lage filen; antall bilder og videotempo beholdes.
Videobildene leses direkte fra WebGL til ett gjenbrukt bildebuffer før koding.
Dette unngår nye full-HD-kopier for hvert bilde og ustabil canvas-overføring.

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
- Mobil bruker redusert pikseloppløsning, myke kontaktskygger i stedet for
  skyggekart, og maksimalt 30 oppdateringer/s. Berøringsenheter beholder denne
  tilpasningen også i liggende format.
- `public/models/spiller.glb` lastes én gang og klones med `SkeletonUtils`.
  Spillerne deler geometri og draktmaterialer, men har hvert sitt skjelett og
  animasjonsmiks. Stillestående, jogging og sprint blandes ut fra faktisk fart,
  med myk overgang til og fra stillestående. Jogg og sprint går i samme stegtakt,
  på samme fot (`strideOffset`), så beina ikke stivner når de blandes.
  Figurene snur seg i bevegelsesretningen. Keeperen har egen draktfarge.
  Motspillere og ekstra spillere fra utstyret har samme størrelse som lagets spillere.
- `public/models/himmel.hdr` gir himmel og miljølys via HDRLoader (det nye
  navnet på RGBELoader i three r186) og PMREM.
  Begge filene har 15 sekunders lastetidsgrense. Manglende eller ødelagte filer
  gir en liten melding og reservefigurer/vanlig lys. Åpne 3D på nytt for å prøve igjen.
- Gresset lages i kode med klippestriper, fargevariasjon og nærstruktur.
  Kjegler, nett, stiger, hekker, dukker og baller lages også i kode.
- Tegnefarger og pilhoder gjenbruker 2D-tegneren. Tekst vender mot kameraet.
  Fasenavn og notat tegnes inne i videobildet, slik at de også følger eksporten.
- Bare de siste tre tegnelagene beholdes på mobil (seks på PC). Videoen laster
  tegnelag etter behov, så lange sekvenser ikke forhåndslaster alle fasene i minnet.
- Grenen legger til pakkene `three` og `@types/three`. MP4- og WebM-beholdere
  skrives lokalt i `videoMux.ts`, uten egne pakker.

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
I dette miljøet mangler også fontvariabelen `--font-mono`, slik at den eksisterende
2D-eksporten til PNG stopper. 2D-koden er beholdt urørt.

## Prøv selv

1. Åpne prosjektets lokale forhåndsvisning og velg **Taktikk**.
2. Lag minst to faser i 2D, med forskjellige tegninger, tekst, navn og fasenotater.
   Ta med alle tegneverktøyene og litt utstyr. Flytt noen spillere og ballen.
3. Velg **3D**, prøv kameraene og spill av. Sjekk draktfarger, nummer, navn,
   løperetning og at tegninger og notater følger riktig fase.
4. Prøv en smal skjerm og liggende telefon. Avspillingsknappen skal være synlig;
   de øvrige kontrollene kan nås ved å rulle når høyden er liten.
5. Eksporter en 3D-video og åpne den nedlastede filen. Sjekk også at de siste
   sekundene spiller, og at tekst, utstyr og notater er med. Prøv **Avbryt**.
6. Bytt tilbake til 2D og bekreft at innholdet og redigeringen er som før.

Mobilens faktiske bildeflyt og videostøtte bør prøves på en vanlig telefon;
en nettlesertest med mobilstørrelse måler ikke telefonens grafikkytelse.
