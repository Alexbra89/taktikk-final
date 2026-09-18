# Plan: lokal taktikk-app

Revidert 2026-09-18. Erstatter alle tidligere versjoner av planen.

## 0. Mål

En **lokal** taktikk-app for fotballtrenere. Ingen server, ingen innlogging, all data i nettleseren.

1. **Taktikkbrett** med drag-and-drop (kjernen)
2. **Flere egne taktikker** som faner
3. **Øvelsesbibliotek** (hovedattraksjonen)
4. **Rolleforklaringer** (læringsverktøy for unge trenere)

Kalender og trening beholdes i forenklet form. Alt annet fjernes.

### Avgjørelser tatt før planen ble skrevet

| Spørsmål | Avgjørelse |
|---|---|
| Hva skjer ved formasjonsbytte? | Roller oppdateres i **alle** faser i taktikken. Posisjoner nullstilles **bare i aktiv fase**. |
| Øvelseskategorier | **Nye navn**: `keeper / forsvar / midtbane / angrep / cardio / styrke`. Alle 100 øvelser plasseres på nytt for hånd. |
| Fremmøte uten spillerregister | En **enkel navneliste** (`rosterNames: string[]`) i innstillingene. Ingen kontoer eller profiler. |
| Eksisterende data i Supabase | **Vi starter på nytt.** CSV-backupen i `docs/` beholdes bare som arkiv. Ingen import. |

### Fakta fra koden som planen bygger på

- `phases` lagres i dag **bare** i Supabase (se `partialize` i `useAppStore.ts`). Lokalt ligger bare innstillinger, `moments` og `currentView`.
- `DrillsView`, `RoleExplanations`, `Controls` og `AttendanceView` importeres **ikke** noe sted. De er død kode som må kobles inn igjen (eller slettes).
- Alle 100 øvelser har `ageGroup: 'adult'`. Det finnes ingen barneøvelser.
- Formasjonen er lokal `useState` i `TacticBoard` (`selectedFormation`) og lagres ikke.
- Alle 18 formasjoner har keeper som første slot (`homePlayers[0]`).
- Formasjonene bruker bare 7 roller: `keeper, defender, midfielder, forward, winger, wingback, playmaker`.
- Brettet har ingen bortespillere (`team: 'away'` brukes ikke).
- Angre/gjør om ligger i `useRef` i `TacticBoard` og er ikke knyttet til noen fase eller taktikk.

---

## 1. Datamodell: flere taktikker

### Typer (`src/types/index.ts`)

```ts
export type Sport = 'football5' | 'football7' | 'football9' | 'football';

export interface Player {
  id: string;
  num: number;
  name: string;          // valgfritt visningsnavn, tom streng som standard
  slotIdx: number;       // indeks i formasjonens homePlayers[]
  position: Position;
  notes: string;
}

export interface TacticPhase {
  id: string;
  name: string;
  players: Player[];
  ball: Position;
  drawings: Drawing[];
  stickyNote?: string;
}

export interface Tactic {
  id: string;
  name: string;              // «Høyt press», «Kontring»
  sport: Sport;
  formation: string;         // «4-4-2», må finnes i getFormations(sport)
  phases: TacticPhase[];     // minst én
  activePhaseIdx: number;
  createdAt: string;
}

export type AppView = 'board' | 'drills' | 'calendar' | 'training';

export interface AppState {
  tactics: Tactic[];         // minst én
  activeTacticId: string;
  // globale innstillinger
  ageGroup: 'youth' | 'adult';   // standardfilter i øvelsesbiblioteket
  homeTeamName: string;
  awayTeamName: string;
  awayTeamColor: string;
  rosterNames: string[];         // bare for fremmøte
  // øvrig
  events: CalendarEvent[];
  matchReports: MatchReport[];
  moments: TacticMoment[];
  currentView: AppView;
}
```

**Fjernes fra typene:** `UserRole`, `SpecialRole`, `PlayerInjury`, `PlayerAccount`, `CoachMessage`, `ChatMessage`, `PlayerReply`, `SubstitutionSuggestion`, `FormationSlot`, og på `Player` feltene `role`, `secondaryRoles`, `specialRoles`, `injured*`, `injury`, `isStarter`, `isOnField`, `minutesPlayed`, `playerReply`, `individualTraining`, `currentSlotId`, `playerAccountId` og `team`. `EventType` blir `'training' | 'match'`. `targetPlayerIds` fjernes fra `TrainingNote` og `MatchNote`. `AppState.sport` flyttes inn på `Tactic`.

**Hvorfor `role` ikke lagres på spilleren:** rollen **utledes** fra `tactic.formation` + `player.slotIdx`. Da kan rolle og formasjon aldri komme ut av synk. Det var nettopp det problemet `opus-rapport-2-state.md` fant med dupliserte felt per fase. Hvis vi lagrer bare `slotIdx`, oppfyller vi alle tre kravene av seg selv:

- Rollen settes fra sloten når spilleren plasseres.
- Rollen endres **ikke** når spilleren dras, fordi `slotIdx` ikke endres.
- Rollen **oppdateres** ved formasjonsbytte, fordi `formation` endres.

### Samme spiller i flere faser

Spillerne i hver fase er egne kopier (egen `position`), men de har **samme `id` og `slotIdx`** i alle fasene i en taktikk. `addPhase` kopierer spillerne fra aktiv fase, slik den gjør i dag. Spilleren i Fase 1 og Fase 2 identifiseres med `id`.

### Store-handlinger (`useAppStore.ts`, skrives helt på nytt)

Taktikk:
- `addTactic(name?)`: ny taktikk med `sport` fra aktiv taktikk (eller `'football'`), `DEFAULT_FORMATION[sport]` og én fase «Fase 1» der spillerne står på formasjonens posisjoner. Den blir aktiv.
- `removeTactic(id)`: fjerner taktikken. Var den aktiv, byttes det til neste (eller forrige hvis den var sist). Den **siste** taktikken kan ikke slettes; knappen er deaktivert.
- `renameTactic(id, name)`
- `setActiveTactic(id)`: bytter bare `activeTacticId`. Fasene, formasjonen, sporten og `activePhaseIdx` ligger på taktikken og blir derfor bevart.
- `duplicateTactic(id)`: ikke påkrevd, men billig. Tas med hvis det er tid.

Fase (virker alltid på **aktiv** taktikk, så UI-et slipper å sende inn indekser):
- `addPhase`, `removePhase(idx)`, `setActivePhaseIdx(i)`, `renamePhase(idx, name)`
- `movePlayer(playerId, pos)`, `moveBall(pos)`, `setPlayerName(playerId, name)`, `setPlayerNum(playerId, num)`
- `addDrawing`, `clearDrawings`, `updateStickyNote`

Formasjon og sport: se seksjon 2 og 3.

Selektorer (i storen eller `src/store/selectors.ts`):
- `useActiveTactic()` og `useActivePhase()`
- `getSlot(tactic, slotIdx) → { role, position, label }`

### Lagring

- `persist` med `storage: createJSONStorage(() => safeStorage)` og **`version: 2`**.
- `partialize` tar med **alt** unntatt flyktig UI-state (timer, `loading`).
- `migrate` fra v1: behold bare `homeTeamName`, `awayTeamName`, `awayTeamColor`, `ageGroup` og `moments`, og bygg én ny standardtaktikk. Det er i tråd med «starte på nytt».
- Hvis `tactics` er tom eller `activeTacticId` peker på en taktikk som ikke finnes, repareres det ved lasting (`onRehydrateStorage`). Et korrupt lager skal aldri gi hvit skjerm.
- `src/lib/safeStorage.ts`: `getItem/setItem/removeItem` pakket i try/catch. `setItem` fanger `QuotaExceededError` og sender et lett varsel («Lagring full – eksporter backup»), i stedet for å kaste feilen.

---

## 2. Automatisk rolle fra formasjon

### Regler

| Hendelse | Rolle | Posisjon |
|---|---|---|
| Ny taktikk eller ny sport | fra sloten | slotens posisjon, i alle faser |
| Spilleren dras på banen | **uendret** | ny posisjon, bare i aktiv fase |
| Formasjonsbytte | fra ny slot, i **alle faser** | slotens posisjon, **bare i aktiv fase** |
| `addPhase` | uendret | kopiert fra aktiv fase |

`setFormation(name)` på aktiv taktikk:
1. Sjekk at `name` finnes i `getFormations(tactic.sport)`.
2. `tactic.formation = name`. Rollene i alle faser følger med automatisk, fordi de utledes.
3. I aktiv fase: `player.position = slot[player.slotIdx].position` for alle spillere.

Slotene matches på **indeks**. Keeper er alltid `slotIdx 0`, og det er verifisert i alle 18 formasjonene. De andre indeksene følger rekkefølgen i `homePlayers`, som går bakfra og framover. Det gir fornuftige bytter, for eksempel 4-4-2 → 4-3-3: backene blir backer, og ytre midtbane blir kant eller midtbane. Se risiko R3.

### Rolleetikett på spilleren

Formasjonsdataene har ikke venstre og høyre, men sloten har en posisjon. Etiketten utledes derfor fra `role` + slotposisjon i `roleInfo.ts`:

```ts
export function getSlotLabel(role: PlayerRole, pos: Position): string
```

| role | Sentralt | Venstre (y < 180) / høyre (y > 380) |
|---|---|---|
| keeper | KV | – |
| defender | MS (midtstopper) | VB / HB |
| wingback | – | VVB / HVB |
| midfielder | SM (sentral midtbane)¹ | VM / HM |
| playmaker | OM | – |
| winger | – | VK / HK |
| forward | SP | SP |

¹ `DM` når `x < 300` (defensiv midtbane).

Terskelverdiene bestemmes mot 5er-, 7er- og 9er-koordinatene i C5. Venstre er toppen av banen (`y` lav), fordi laget angriper mot høyre.

`RoleBadge.tsx` viser `getSlotLabel(...)` i stedet for `ROLE_SHORT[role]`. Fargen kommer fortsatt fra `getDutyColors(role)` (`roleColors.ts` er uendret). `ROLE_SHORT` i `board/constants.ts` slettes.

### `roleInfo.ts`, forenklet

Vi beholder bare det UI-et trenger:

```ts
export const ROLE_INFO: Record<PlayerRole, { name: string; short: string; family: RoleFamily }>
```

Rollene: Keeper, Stopper, Back, Vingback, Sweeper, Midtbane, Playmaker, Box-to-box, Kantspiller, Spiss, Targetman, Falsk 9er, Trequartista.

- `PlayerRole` beholdes som i dag, slik at `RoleExplanations` kan forklare også roller som ingen formasjon bruker (sweeper, falsk 9er osv.). `defender` vises som «Stopper» eller «Back» ut fra etiketten. `libero` slås sammen med `sweeper`, og `pressforward` slås sammen med `forward`, både i typen og i dataene.
- **Fjernes:** lange beskrivelser, emojis, `getRolesForSport`, `getRolesForYouth`, `ROLE_FAMILY`-strengtabellen og `responsibilities`.
- De **korte** læringstekstene (2–4 punkter per rolle: «Hva gjør du med ball / uten ball») flyttes til en konstant **inne i** `RoleExplanations.tsx`, som er det eneste stedet de vises.

### `RoleExplanations.tsx`

- Knappen «🎓 Roller» i brettets verktøylinje åpner den som modal.
- Den viser rollene i aktiv formasjon først (med etiketter), og deretter «Andre roller».
- Den leser `sport` fra aktiv taktikk, ikke fra global `sport`.

---

## 3. Brettet: layout og sport-velger

```
┌──────────────────────────────────────────────────────────────┐
│ [Høyt press ×] [Kontring ×] [+ Lag taktikk]                  │  TacticTabs
│ [⚽ 11er ▾]  [Formasjon: 4-4-2 ▾]  [🎓 Roller]                │  Controls
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  Bane med spillere                           │  TacticBoard
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ [Fase 1] [Fase 2] [+]                                        │
│ [Tegneverktøy]  [Angre] [Gjør om]  [▶ Spill av]              │
└──────────────────────────────────────────────────────────────┘
```

- **`TacticTabs.tsx`** (ny): fanene rulles horisontalt på mobil. Dobbeltklikk på en fane gir inline nytt navn. × ber om bekreftelse før sletting.
- **`Controls.tsx`** (forenklet, kobles inn): sport-velger, formasjonsvelger og «🎓 Roller». Formasjons-`<select>` flyttes ut av `TacticBoard` og hit.
- **`TacticBoard.tsx`**: leser `useActiveTactic()`/`useActivePhase()`. All benk, alle innbyttere, all skade og `SubRow` fjernes. Anslått −350 linjer av 1162.
- **Angre/gjør om** tømmes når aktiv taktikk eller fase byttes (`useEffect` på `activeTacticId` + `activePhaseIdx`). `UndoEntry` mister `prevIsStarter` og `prevRole` og beholder bare `playerId` + `prevPos`.
- **Spill av** (interpolering mellom faser) er uendret, men leser fasene fra aktiv taktikk.
- **Spillernavn:** brikkene viser nummer + rolleetikett. Et valgfritt navn kan settes med dobbeltklikk eller langt trykk (enkel inline-input). `PlayerEditor` blir ikke erstattet.

### `setSport(sport)` på aktiv taktikk

1. `formation = DEFAULT_FORMATION[sport]` og `n = slots.length` (5/7/9/11).
2. I **alle** faser:
   - fjern spillere med `slotIdx >= n`
   - legg til spillere for manglende `slotIdx < n`, med samme `id` i alle faser og posisjonen til sloten
3. I aktiv fase: alle spillere får slotens posisjon (samme regel som ved formasjonsbytte).
4. Tegninger og ball beholdes.

Fordi dette **fjerner spillere fra alle faser**, spør vi om bekreftelse når det finnes mer enn én fase: «Bytte til 5er fjerner 6 spillere fra 3 faser. Fortsette?»

`FullscreenBoard.tsx` og `SmartCoach.tsx` leser `sport`/`phases` fra aktiv taktikk. `getSquadCapacity` erstattes av `getFormations(sport)[0].homePlayers.length` eller slettes (`maxSubs` er borte).

---

## 4. Øvelsesbiblioteket

### Data (`src/data/drills.ts`)

```ts
export type DrillCategory = 'keeper' | 'forsvar' | 'midtbane' | 'angrep' | 'cardio' | 'styrke';
export const CATEGORY_ORDER: DrillCategory[] = ['keeper','forsvar','midtbane','angrep','cardio','styrke'];
export const CATEGORY_LABELS: Record<DrillCategory, string> = {
  keeper: '🧤 Keeper', forsvar: '🛡️ Forsvar', midtbane: '🎯 Midtbane',
  angrep: '⚔️ Angrep', cardio: '🫀 Cardio', styrke: '💪 Styrke',
};
export type AgeGroup = 'youth' | 'adult';
```

`DrillExercise` beholder alle feltene som kreves: `name, description, steps, tips, equipment, duration, players, difficulty, ageGroup, category`. `sport: DrillSport` fjernes (alt er fotball). `weekNumber` og `getWeeklyDrills` beholdes bare hvis SmartCoach fortsatt bruker dem.

**Ny plassering av de eksisterende 100 (alle voksne):**

| Gammel | Ny |
|---|---|
| `keeper` | `keeper` |
| `defensivt` | `forsvar` (noen pressøvelser → `midtbane`) |
| `offensivt` | `angrep` (rondo og pasning → `midtbane`) |
| `hele_laget` | hovedsakelig `midtbane` (spillformer), enkelte → `forsvar`/`angrep` |
| `fysisk` | `cardio` (løp, intervall) eller `styrke` (kropp, spenst) |

Dette gjøres **for hånd, øvelse for øvelse**, i en egen commit. Etterpå kontrollerer vi at hver kategori har minst 5 voksenøvelser. Mangler `styrke` innhold, skriver vi nye øvelser.

**Nye barneøvelser:** minst **6 per kategori (≈36)**, skrevet for 6–12 år. Lekpregede øvelser, korte steg, mange ballberøringer. `styrke` for barn betyr kroppskontroll og koordinasjon (ingen vekter). Samme detaljnivå som voksenøvelsene.

**Sortering:** `getDrills(ageGroup)` returnerer øvelsene sortert på `CATEGORY_ORDER` og deretter `difficulty` (enkel → avansert). Rekkefølgen i kildefilen spiller dermed ingen rolle.

Slettes: `ALL_DRILLS`/`FOOTBALL_DRILLS`-lagene, `getDrillsBySport`, `toDrillSport`, `DRILL_LIBRARY`-aliaset (hvis SmartCoach kan bruke `getDrills`), og den doble `Drill`-typen i `types/index.ts`. Typen hører hjemme i `drills.ts`.

### UI (`DrillsView.tsx`, kobles inn som egen fane)

```
[🧒 Barn] [👨 Voksne]                    [Søk…]
🧤 Keeper (6)       ▸ kort  kort  kort
🛡️ Forsvar (8)      ▸ kort  kort  …
…
```

- Aldersbryteren øverst er alltid synlig. Valget lagres i `ageGroup`.
- Seksjonene vises i `CATEGORY_ORDER`, med chips for å hoppe til en kategori.
- Kortet viser navn, varighet, antall spillere og vanskelighetsgrad. Klikk åpner `DrillDetailModal` (gjenbrukes), som viser beskrivelse, steg, tips og utstyr.
- «Legg til i trening» (dagens `addEvent` i DrillsView) beholdes.
- `DrillLibraryModal.tsx` slettes. `TrainingView` bruker `DrillDetailModal` direkte, som i dag.

---

## 5. Kalender, trening og øvrige visninger

**Navigasjon:** `Sidebar.tsx` slettes. `page.tsx` får en enkel fanerad øverst (desktop) eller bunnlinje (mobil): **Brett · Øvelser · Kalender · Trening**. Dashboard-visningen fjernes. Det finnes ingen `LoginGate` og ingen `currentUser`.

**`CalendarView.tsx`:** opprett, rediger og slett beholdes. Fjernes: alle `isCoach`-sjekker og grener for spillere, `injury`/`return`-hendelser (🩹 ✅), `lineupLockedAt` og `targetPlayerIds`-velgerne. Kampnotater og treningsnotater beholdes.

**`TrainingView.tsx`:** stoppeklokke, notater og fremmøte beholdes. Fremmøte bruker `rosterNames` med avkrysning per økt (`attendance: string[]` på `CalendarEvent`). Navnelisten redigeres i et lite felt i TrainingView («Rediger navneliste»). `AttendanceView.tsx` er ubrukt og slettes.

**`SmartCoach.tsx`:** `SubsTab` og `ManualSwap` slettes (innbyttere). `TimerTab` beholdes uten `togglePlayerOnField`/`addMinutesPlayed`. `DrillsTab` bruker `getDrills(ageGroup)`.

**`MatchReport.tsx`:** uendret, men `matchReports` persisteres nå. Før forsvant rapportene ved reload.

**`layout.tsx`:** uten `NotificationProvider`.

**PWA:** `next-pwa` beholdes, fordi offline er nyttig for en lokal app, og `public/sw.js` genereres av bygget. `public/sw.ts` (push) slettes. `@supabase/*` fjernes fra `package.json`.

---

## 6. Filer: endelig liste

### Slettes

| Fil | Commit |
|---|---|
| `src/components/player-portal/` (PlayerHome, PlayerPortal, PlayerProfile, RefereeView) | C1 |
| `src/components/board/PitchView.tsx` | C1 |
| `src/components/ui/LoginGate.tsx` | C1 |
| `src/components/ui/ChatPanel.tsx` | C1 |
| `src/components/ui/CoachMessages.tsx` | C1 |
| `src/components/ui/StatsView.tsx` | C1 |
| `src/components/ui/PlayerManager.tsx` | C1 |
| `src/components/NotificationProvider.tsx` | C1 |
| `public/sw.ts` | C1 |
| `src/store/syncQueue.ts` | C2 |
| `src/lib/supabase.ts` | C2 |
| `src/lib/auth.ts` | C2 |
| `src/lib/injuries.ts` | C2 |
| `src/components/ui/InjuryReturnBanner.tsx` | C2 |
| `src/components/ui/PlayerEditor.tsx` | C3 |
| `src/components/ui/Sidebar.tsx` | C3 |
| `src/components/board/panels/SubRow.tsx` | C3 |
| `src/components/ui/AttendanceView.tsx` | C3 |
| `src/components/board/svg/LoanBadge.tsx`, `ConditionDot.tsx` (hvis de bare brukes av benk/skade) | C3 |
| `src/components/ui/DrillLibraryModal.tsx` | C7 |

### Beholdes (ryddet)

| Fil | Endring |
|---|---|
| `src/app/page.tsx` | ny layout, 4 faner, ingen innlogging |
| `src/app/layout.tsx` | uten NotificationProvider |
| `src/components/board/TacticBoard.tsx` | aktiv taktikk, ingen benk eller skade |
| `src/components/board/svg/*` | `RoleBadge` bruker `getSlotLabel` |
| `src/components/board/pitches/FootballPitch.tsx` | uendret |
| `src/components/board/BoardElements.tsx`, `DrawingCanvas.tsx`, `constants.ts` | `ROLE_SHORT` bort |
| `src/components/calendar/CalendarView.tsx` | forenklet |
| `src/components/ui/DrillsView.tsx` | alder + kategorisortering, kobles inn |
| `src/components/ui/DrillDetailModal.tsx` | uendret, ev. småjusteringer |
| `src/components/ui/TrainingView.tsx` | forenklet, fremmøte fra `rosterNames` |
| `src/components/ui/SmartCoach.tsx` | uten innbyttere |
| `src/components/ui/MatchReport.tsx` | uendret |
| `src/components/ui/FullscreenBoard.tsx` | leser aktiv taktikk |
| `src/components/ui/RoleExplanations.tsx` | modal fra brettet, korte læringstekster |
| `src/components/ui/Controls.tsx` | sport- og formasjonsvelger, Roller-knapp |
| `src/data/drills.ts` | nye kategorier, barneøvelser |
| `src/data/formations.ts` | **uendret data**. `getSquadCapacity` og `makePhase` flyttes eller skrives om i storen. |
| `src/data/roleInfo.ts` | forenklet, `getSlotLabel` |
| `src/hooks/useViewport.ts`, `src/lib/geometry.ts`, `src/lib/roleColors.ts` | uendret |
| `src/types/index.ts` | ny modell |
| `src/store/useAppStore.ts` | skrevet på nytt, ~350 linjer i stedet for 1217 |

### Nye

| Fil | Innhold |
|---|---|
| `src/components/ui/TacticTabs.tsx` | taktikkfaner |
| `src/lib/safeStorage.ts` | localStorage med try/catch og varsel ved full lagring |
| `src/lib/backup.ts` | `exportBackup()` laster ned `taktikk-backup-YYYY-MM-DD.json`. `importBackup(file)` validerer `version` og form, viser forhåndsvisning («3 taktikker, 12 hendelser») og **erstatter** state etter bekreftelse. |

---

## 7. Commits

Hver commit skal bygge (`next build`) og fungere manuelt før neste. Rekkefølgen fjerner avhengigheter fra ytterkanten og innover, slik at vi aldri sletter noe som fortsatt importeres.

| # | Innhold | Test før commit |
|---|---|---|
| **C1** | **Fjern spiller-, dommer- og meldingsflatene.** Slett player-portal, PitchView, LoginGate, ChatPanel, CoachMessages, StatsView, PlayerManager, NotificationProvider og sw.ts. `page.tsx`: fjern visningene. Brukeren er alltid trener (`currentUser` hardkodes midlertidig). | Appen åpner rett på brettet. Kalender og trening virker. |
| **C2** | **Fjern Supabase og skader.** Slett syncQueue, supabase, auth, injuries og InjuryReturnBanner. Storen mister `push*`, `syncFromSupabase`, `signIn/Up/Out`, `login*`, alle skadehandlinger og `coachEmail/Password/refereePin`. Fjern `@supabase/*` fra package.json. `EventType` blir `'training' \| 'match'`, og 🩹/✅ forsvinner fra kalenderen. `safeStorage.ts` inn, og `partialize` tar midlertidig med `phases` og `events`. | Ingen nettverkskall i devtools. Reload beholder faser og hendelser. |
| **C3** | **Fjern innbyttere, benk og spillerregister.** Slett SubRow, Sidebar, PlayerEditor og AttendanceView. Fjern benkelogikk i TacticBoard, `SubsTab`/`ManualSwap` i SmartCoach, `playerAccounts`, `coachMessages`, `chatMessages`, `isStarter/isOnField/specialRoles/secondaryRoles/minutesPlayed`, `getSubstitutionSuggestions` og `reorderBenchPlayers`. Legg til `rosterNames` og fremmøte i TrainingView. Midlertidig navigasjon i `page.tsx`. | Dra spillere, tegn, faser og avspilling virker. Fremmøte kan krysses av. |
| **C4** | **Ny taktikkmodell.** Nye typer (`Tactic`, `Player.slotIdx`). Storen skrives om rundt `tactics[]` + `activeTacticId`, med `persist` v2, `migrate` og rehydreringsreparasjon. TacticBoard, FullscreenBoard og SmartCoach leser via `useActiveTactic`/`useActivePhase`. Ennå ingen fane-UI, bare én taktikk. | Tom localStorage gir én taktikk. Gammel v1-localStorage migreres uten krasj. |
| **C5** | **Formasjon og roller.** `setFormation` og `setSport` i storen, etter reglene i seksjon 2 og 3. `roleInfo.ts` forenkles og får `getSlotLabel`. `RoleBadge` viser etikett. `ROLE_SHORT` slettes. Formasjonen flyttes fra `useState` i TacticBoard til taktikken. | 4-4-2 → dra VB → fortsatt VB. → 4-3-3 gir nye roller i alle faser og nye posisjoner bare i aktiv. 11er → 5er gir 5 spillere i alle faser. |
| **C6** | **Brett-UI: faner og kontroller.** `TacticTabs.tsx`, `Controls.tsx` koblet inn (sport, formasjon, 🎓 Roller), `RoleExplanations` som modal. Angre/gjør om nullstilles ved bytte. Endelig `page.tsx`-layout med fanene Brett · Øvelser · Kalender · Trening. | Lag 3 taktikker med ulik sport → bytt mellom dem → alt er bevart. Slett aktiv → bytter til neste. Den siste kan ikke slettes. Mobilbredde. |
| **C7** | **Øvelsesbiblioteket.** Nye kategorier, alle 100 plassert på nytt, ~36 barneøvelser, `getDrills(ageGroup)` sortert. `DrillsView` med Barn/Voksne og seksjoner. `DrillLibraryModal` slettes. Kan deles i C7a (data) og C7b (UI) hvis diffen blir stor. | Hver kategori har innhold i begge aldersgrupper. Detaljmodalen viser alle feltene. |
| **C8** | **Backup og opprydding.** `backup.ts` + Eksporter/Importer i innstillingsmenyen. Fjern død kode: ubrukte eksporter i formations/roleInfo/drills, ubrukte svg-komponenter og `framer-motion` hvis bare RoleExplanations bruker den. `next lint` + `next build` rene. | Eksporter → tøm localStorage → importer → identisk state. |

---

## 8. Risiko

| # | Risiko | Konsekvens | Tiltak |
|---|---|---|---|
| R1 | **Data i Supabase blir borte for appen.** Taktikker og hendelser har bare ligget på serveren. | Treneren ser en tom app etter C2/C4. | Bevisst valg («starte på nytt»). Kontroller at CSV-backupen i `docs/` er komplett **før C2**. |
| R2 | **Alt ligger i én nettlesers localStorage.** Tømt nettleserdata, annen enhet eller privat modus betyr at alt er borte. Grensen er ~5 MB. | Tap av alle taktikker. | `backup.ts` (C8). `safeStorage` varsler ved full lagring. Vurder en påminnelse om eksport hvis det ikke er tatt backup på 30 dager. Tegninger er punktlister og kan bli store: vurder å runde av koordinater. |
| R3 | **Slot-matching på indeks gir rare roller** ved bytte mellom formasjoner med ulik linjefordeling (4-4-2 → 3-5-2: høyre back blir vingback). | Treneren opplever at «feil» spiller får en rolle. | Akseptabelt: rollen følger sloten, ikke personen. Alternativet, å matche på nærmeste posisjon, kan legges til senere uten å endre modellen. Manuell test av alle bytter innen samme sport i C5. |
| R4 | **Sportbytte fjerner spillere fra alle faser.** | Posisjoner i Fase 2+ går tapt. | Bekreftelsesdialog når det finnes >1 fase. Mindre sannsynlig ved ny taktikk per sport. |
| R5 | **Store omskrivinger av `useAppStore` (1217 linjer) og `TacticBoard` (1162 linjer)** kan gi regresjoner i dra-og-slipp, snapping og avspilling. | Kjernen slutter å virke. | C1–C3 fjerner kode uten å endre modellen, og C4 bytter modellen uten ny UI. Dra-og-slipp testes etter hver commit. Behold `DRAG_THRESH`, `SNAP_R` og clamp-logikken urørt. |
| R6 | **Angre/gjør om lekker mellom taktikker** (ref-stack med `playerId`). | Angre flytter en spiller i feil taktikk. | Nullstill stackene ved bytte av taktikk eller fase (C6). |
| R7 | **Kjent bug i dag:** `addPhase` gjør `football7` om til `football` før `makePhase`. | Feil formasjon i nye faser for 7er. | Forsvinner, fordi `addPhase` i ny modell kopierer spillere og aldri bygger fra formasjonen. |
| R8 | **Omfanget i C7.** Å plassere 100 øvelser på nytt og skrive ~36 barneøvelser er mye innhold, og kvaliteten avgjør hovedattraksjonen. | Tynne eller feilplasserte øvelser. | Egen commit (ev. C7a/C7b). Tabell over antall per kategori × alder i PR-beskrivelsen. Gjennomgås av trener før merge. |
| R9 | **Service worker cacher gammel bundle** (next-pwa, `NetworkFirst`/`StaleWhileRevalidate`). | Brukere ser gammel innloggingsskjerm etter deploy. | `skipWaiting` + `clientsClaim` er allerede på. Verifiser med hard reload etter C1. |
| R10 | **Ødelagt importfil.** | Hvis vi erstatter state med søppel, går alle data tapt. | Valider før vi erstatter, vis forhåndsvisning og ta automatisk eksport av nåværende state før import. |

---

## 9. Åpne punkter (ikke blokkerende)

- `duplicateTactic`: med eller ikke (billig, foreslås i C6).
- Skal `moments` (lagrede øyeblikk) knyttes til en taktikk? I dag inneholder de en fase-snapshot uten taktikk-ID. Forslag: legg til `tacticId` i C4. Er brukstilfellet tvilsomt, slettes funksjonen.
- Endelige terskelverdier for venstre/sentralt/høyre i `getSlotLabel` settes i C5 mot 5er-, 7er- og 9er-koordinatene.
