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

# Kart over 2D-brettet

`src/components/board/TacticBoard.tsx` er fortsatt inngangen (samme eksport,
brukt av `src/app/page.tsx`). Den setter sammen delene nedenfor med linja over
banen (formasjon, 2D/3D-bryter, fullskjerm), selve banen og linja under banen
(faser, notatknapp, zoom, angre, tegn, utstyr, eksport og avspilling).

| Fil | Ansvar |
| --- | --- |
| `src/hooks/usePlayerDrag.ts` | Dra og bytte av spillere: langtrykk, terskel, drag-skygge, snapping, bytte, avstand etterpå og valg ved trykk. Bare TacticBoard. |
| `src/hooks/useUndoRedo.ts` | Angre/gjør om for spillerflytt, knappenes dybde og Ctrl+Z / Ctrl+Y. Brettet nullstiller ved bytte av fase/taktikk. |
| `src/hooks/usePhasePlayback.ts` | Faseklokka (30 ms-steg) og mellomposisjoner for spillere og ball. Delt av TacticBoard og FullscreenBoard. |
| `src/hooks/useSvgCoordinates.ts` | Pekerposisjon → banekoordinater, med og uten klemming. Delt av TacticBoard og FullscreenBoard. |
| `src/components/board/PhaseNoteModal.tsx` | Dialogen for notatet til fasen. |
| `src/components/board/Board3DSlot.tsx` | Lat lasting av 3D-visningen med feilskjerm, og `HoldWhileHidden` for det skjulte 2D-brettet under 3D-avspilling. |

`src/components/ui/FullscreenBoard.tsx` er 2D-fullskjermen. Den bruker felles
avspilling og koordinater, men har sin egen, enklere dra-logikk (også for
ballen) og egne autoskjulte kontroller. Utstyr og tegning er felles via
`useBoardItems` og `useDrawingInput`; banen tegnes av `BoardStage`.

Kontroller: `e2e/smoke.spec.ts` (tegning, bytte og angre, PNG, tom bane),
`e2e/fullscreen-recording.spec.ts` (2D-fullskjerm og opptak) og
`e2e/board3d.spec.ts` (2D/3D-bryteren og felles faseklokke).

# Kart over Trening

`src/components/ui/TrainingView.tsx` er fortsatt inngangen (samme eksport og
props, lastet dynamisk av `src/app/page.tsx`). Den har fanene Kommende/Historikk
og velger mellom lista, skjemaet for ny trening og valgt trening. Delene ligger
i `src/components/training/`:

| Fil | Ansvar |
| --- | --- |
| `TrainingOverview.tsx` | Fire nøkkeltall øverst i lista: neste økt, neste 7 dager, siste 4 uker og tema fremover. |
| `NewTrainingForm.tsx` | Skjemaet for ny trening: tittel, dato/tid, sted, fokus, øvelser fra biblioteket (søk, kategori, nivå) og egne øvelser. |
| `TrainingCard.tsx` | Ett kort i lista, med Start-knapp for kommende økter. |
| `TrainingDetail.tsx` | Valgt trening: notat, fremmøte, øvelser/taktikker, rekkefølge, fullført, total tid og deling. |
| `Stopwatch.tsx` | Nedtelling for én øvelse, med pause og avbryt. |
| `TacticPicker.tsx` | Velg taktikk fra brettet og antall minutter. |
| `RosterEditor.tsx` | Redigering av navnelista som fremmøtet krysses av mot. |
| `DrillWarning.tsx` | Gul advarselsboks for øvelser med `warning` (vanlig og kompakt). Bare Trening; DrillsView, DrillDetailModal og SmartCoach har egne, ulike bokser. |

Kontroller: `e2e/training.spec.ts` dekker oppretting, øvelser/advarsel, notat,
fremmøte/navneliste, taktikk, rekkefølge, stoppeklokke, fullført, deling,
sletting og omlasting på desktop og mobil (390 × 844).
`src/lib/backup.test.ts` dekker også lagrede treningsdata.

# Kart over app-tilstanden

`src/store/useAppStore.ts` er fortsatt offentlig inngang med samme `useAppStore`,
`AppStore` og reparasjons-/backup-eksporter. Den setter sammen Zustand-slices
under ett felles `persist`, med uendret nøkkel `taktikkboard-storage`, versjon 2,
migrering, merge, partialize og fanesynkronisering. Ingen komponentimporter er endret.

| Fil i `src/store/` | Ansvar |
| --- | --- |
| `types.ts` | Det uendrede `AppStore`-grensesnittet og intern slice-type. |
| `tacticsSlice.ts` | Taktikker, sport/formasjon, faser, spillere, ball, tegninger og utstyr. |
| `tacticModel.ts` | Rene hjelpere for taktikker, faser, spillerplasser og utstyr. |
| `calendarSlice.ts` | Kalender, trenings-/kampnotater, egne øvelser og fremmøtenavneliste. |
| `reportsSlice.ts` | Kamptid og kamprapporter. |
| `reportText.ts` | Rapporttekst og kategorinavn. |
| `momentsSlice.ts` | Lagrede øyeblikksbilder av en taktikkfase. |
| `backupSlice.ts` | Kontroll, eksport/import av store-data og enhetens eksporttidspunkt. |
| `repair.ts` | Reparasjon av lagrede data og den eksisterende v1-migreringen. |
| `id.ts` | Den eksisterende lokale id-generatoren. |

`src/lib/backup.ts` beholder sikkerhetskopiens konvolutt, format og versjon 1.
Eksisterende tester i `useAppStore.test.ts`, `tabSync.test.ts`, `selectors.test.ts`
og `src/lib/backup.test.ts` er beholdt. `storageCompatibility.test.ts` bruker
`src/lib/__fixtures__/backup-v1.json` og faste SHA-256-resultater registrert før
oppdelingen: lokal lagringsversjon 0/1/2 og sikkerhetskopiversjon 0/1, inkludert
ekte innlasting, ny lagring, import og ny eksport. Nettleserkontroller:
`e2e/backup.spec.ts`, den fulle e2e-pakken og `npm run test:offline`.

# Kart over animerte øvelser

En animasjon er en vanlig `Tactic` med faser, pluss én kort tekst per fase og
valgfri markering («MÅL!»). Den ligger fast i appen, lagres aldri i storen og
endrer verken lagringsformat, backup eller 3D-scenen. All kode ligger i
`src/features/drill-animation/`; DrillsView har bare knappen «Se animert».

| Fil | Ansvar |
| --- | --- |
| `types.ts` | `DrillAnimation`, `DrillAnimationPhase` (med valgfri `kick`: pasning/sentring/skudd/høy ball/boksing/avbøyning/takling, `turn`: vending, `dive`: spillere som slenger seg, `held`: ballen i hendene) og rollelista (`CastMember`). |
| `define.ts` | Bygger animasjonen fra meter (som i øvelsesteksten) til brettets 880 × 560. |
| `validate.ts` | Reglene: innenfor banen, ingen spillere oppå hverandre (heller ikke underveis mellom fasene), ballen hos en spiller (eller i mål eller bokset ut i siste fase), en pasning/sentring/skudd går til en annen spiller eller i mål, den som slenger seg står i rollelista, en fanget ball er hos en spiller, 3–6 faser, tekst på hver fase, øvelsen finnes. `holderOf` (ballholderen). |
| `playback.ts` | Øvelsenes egen klokke (`performance.now()`, ikke brettets 30 ms-steg): 1,3 s bevegelse og 0,15 s pause per fase ved 1×, teksten byttes når fasen starter. `sample` lar 3D lese klokka i hvert bilde. |
| `motion.ts` | Alt på banen i en overgang, felles for 2D, 3D og begge videoene (`createMotionSampler`; `drillMotion` gir en kopi): spillerne glir, ballen følger ballholderen (rundt spilleren i en vending), og ved pasning/sentring/skudd reiser den synlig med bue i 3D (høy ball og boksing over figurene, skudd sent og raskt). En keeper som slenger seg tippes over på siden (`pose`); en fanget ball ligger i brysthøyde. |
| `framing.ts` | Fast utsnitt for hele øvelsen: `bounds` (3D-kameraet) og `fitCrop` (2D, contain i både bredde og høyde, drakter i fast skjermstørrelse). |
| `DrillPitch.tsx` | 2D-banen: `BoardStage` klippet til utsnittet, drakter/ball/kjegler krympet rundt eget midtpunkt, stiplet ballspor. Brukes på skjermen og i 2D-videoen. |
| `DrillAnimationViewer.tsx` | Visningen: `DrillPitch` (2D), `Board3DSlot` (3D, med `liveFrame` og `timeline`), 2D-opptak via `useVideoExport` (`source`), tekst under banen, fullskjerm, «reduser bevegelse». |
| `DrillAnimationControls.tsx` | Spill/pause, forrige/neste, faseprikker og fart. |
| `DrillAnimationButton.tsx` | «Se animert»; laster visningen først ved trykk. |
| `feedback.ts` | `FEEDBACK_EMAIL` og mailto-lenken «Ser noe feil ut?». |

Delt kode har bare fått valgfrie tillegg som taktikkbrettet ikke sender:
`Board3D` (`liveFrame`, `timeline`), `exportVideo3D` (`durationMs`),
`useVideoExport` (`source`, og tiden som andre argument til `onFrame`),
`StagePlayer.pose` (`BoardStage`, lest av `BoardScene`/`figures` i 3D) og
`BoardScene`s `numberOnKit` (satt av `Board3D` når `playerRoles` finnes: nummeret
bare på drakten, rollen over hodet).

Animasjonene ligger i `src/data/drillAnimations/`, én fil per kategori, koblet
via `drillId`. Sorteringen av alle øvelser står i `docs/animasjon-plan.md`.
Kontroller: `validate.test.ts` (alle animasjoner og hver regel), `motion.test.ts`
(ballen reiser synlig, føring, slenging/fanget ball/boksing, innholdet i Vendingsstafett og Murbyggerne),
`framing.test.ts` (utsnitt og tempo), `plan.test.ts` (planen dekker alle
øvelser) og `e2e/drill-animation.spec.ts` (skjermbilder i `_skjermbilder/`,
utenfor Git).
