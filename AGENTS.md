# Kart over 3D-koden

3D-motoren ligger i `src/components/board/three/`. Den leser scenedata;
redigering, lagring og faseklokke ligger utenfor motoren.

| Fil | Ansvar |
| --- | --- |
| `BoardScene.ts` | Offentlig inngang: setter sammen modulene, laster ressurser, fordeler scenedata, flytter objekter, tegner, endrer størrelse og rydder opp. Eksisterende brukere importerer fortsatt herfra. |
| `resourcePool.ts` | Gjenbruk av geometri/materialer, enkle former og linjer, eierskap til GPU-ressurser og frigjøring. |
| `pitchBuilder.ts` | Gress, banestreker, mål, nett og tribuner. |
| `equipment.ts` | Bygger kjegler, ekstra spillere, baller, minimål og treningsutstyr. |
| `figures.ts` | Figurtypen, spillermodeller/reservefigurer, drakter, etiketter, animasjon, frigjøring og bygging av ballen. |
| `hud.ts` | Fasepille og fremdriftslinje i WebGL, med plassering og opprydding. |
| `drawingLayer.ts` | Tegningsplanet, asynkron teksturlasting, mellomlager og tegningenes tekstetiketter. |
| `cameraRig.ts` | Kameratyper, kameravalg, zoom, lagring/gjenoppretting av kamera, følgepunkt, stadiongrenser og `pitchFitDistance`. |
| `assets.ts` | Delt lasting og kloning av spillermodell/himmel, draktmaterialer og justering av løpesyklus. |
| `coordinates.ts` | Banemål, omregning mellom 2D og 3D, skalering, ballbane og avspillingsberegninger. |
| `textures.tsx` | Lager teksturer for gress, tegninger, tekst og fasepille. |
| `drawingCache.ts` | Avgrenset mellomlager for dekodede tegningsteksturer. |
| `cameraTrack.ts` | Registrering og interpolering av kamerabanen til fullskjermopptak. |

`src/components/board/Board3D.tsx` kobler motoren til brukergrensesnittet og
fullskjermopptaket. `src/lib/exportVideo3D.ts` lager videobildene gjennom samme
`BoardScene`. `src/lib/phasePill.ts` tegner den delte fasepillen.

Kontroller: `e2e/board3d.spec.ts` (visning og MP4/WebM-eksport),
`e2e/pitch-depth.spec.ts` (dybde på mobil/PC),
`e2e/fullscreen-recording.spec.ts` (opptak, stopp, avbryt og unike bilder).
Enhetstester finnes ved `assets`, `coordinates`, `drawingCache` og i
`src/lib/exportVideo3D.test.ts`.
