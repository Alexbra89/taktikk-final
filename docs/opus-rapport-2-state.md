Vurdering av useAppStore og Supabase-synk

Konklusjonen først: synkroniseringen kan slette data på serveren. Tre ting gjør dette farlig sammen:



Hver push erstatter hele tabellen og sletter alle rader som ikke finnes lokalt.

Feil fra Supabase blir ikke sjekket.

Staten fra serveren lagres ikke lokalt.

Når lasting feiler eller to klienter skriver samtidig, blir data slettet på serveren uten at noen får beskjed. Dette bør fikses før en ren omstrukturering av storen.



1\. State-oversikt

Områder

Område	Felt	Synk mot Supabase	Lagret lokalt (localStorage)

UI/navigasjon	loading, currentView, activePhaseIdx	–	bare currentView

Auth	currentUser	– (Supabase Auth brukes parallelt)	nei, så man logges ut ved reload mens currentView huskes

Innstillinger	sport, ageGroup, homeTeamName, awayTeamName, awayTeamColor, coachEmail, coachPassword, refereePin	team\_settings, skrives direkte uten kø (pushSettings)	ja, alle

Taktikk	phases\[] (spillere, ball, tegninger, notat)	phases via syncQueue	nei

Kalender	events\[] (med treningsnotater og kampnotater)	events via syncQueue	nei

Spillerkontoer	playerAccounts\[]	player\_accounts via syncQueue	nei

Meldinger	coachMessages\[], chatMessages\[]	coach\_messages, chat\_messages via syncQueue	nei

Kamp	matchTimer	–	nei, klokken forsvinner ved reload

Rapporter	matchReports\[]	–	nei, rapportene forsvinner ved reload

Øyeblikk	moments\[]	–	ja

Kort sagt synkes kjernedataene mot serveren, men lagres ikke lokalt. Innstillingene lagres både lokalt og på serveren, og serverens verdi vinner ved lasting. Kamptimer og rapporter finnes bare i minnet.



Duplisert state

Hele spillerobjektet kopieres til hver fase. TacticPhase.players er en full kopi per fase (addPhase på linje 565 kopierer cur.players). Egenskaper som hører til spilleren, og ikke til fasen, blir derfor liggende i N kopier:

name, num og role, pluss secondaryRoles, specialRoles, notes, minutesPlayed og injury.

Bare skadefunksjonene (markPlayerInjured, markPlayerHealed, setPlayerInjury) oppdaterer alle faser. updatePlayerField, setSpecialRole, setSecondaryRoles, addMinutesPlayed og addPlayer oppdaterer bare én fase, så kopiene kommer ut av synk.

player.name mot account.name. Navnet finnes i Player.name (i hver fase) og i PlayerAccount.name.

Koblingen er account.playerId === player.id.

Player.playerAccountId (types:50) blir aldri satt.

PlayerHome:385 og PlayerPortal:204 har i tillegg en reserve som matcher på a.name === p.name. Den knekker i det øyeblikket navnene er ulike, som er nettopp tilfellet den skal håndtere.

Skade er lagret to ganger. injured og injuryReturnDate (eldre felt) finnes ved siden av injury: PlayerInjury (types:41–43).

checkAndHealInjuries (835–846) leser bare de gamle feltene, og bare i én fase.

Kode som setter bare injury blir derfor aldri helbredet automatisk.

isStarter mot isOnField. Begge feltene betyr «på banen», men settes hver for seg:

togglePlayerOnField (902) setter bare isOnField.

setPlayerStarter (798) setter bare isStarter.

applyFormation (584) og suggestSubstitutions (72) leser isOnField.

TacticBoard leser isStarter.

To formasjonsmodeller. applyFormation bruker FormationSlot {x, y} sammen med currentSlotId, mens data/formations bruker homePlayers\[].position.

Tre kilder for innlogging. Supabase Auth (signIn/signUp), klient-sammenligning mot coachEmail/coachPassword (loginCoach), og PIN eller passord fra playerAccounts (loginPlayer). LoginGate:186 registrerer via loginCoach og ikke via signUp.

Småduplikater:

ChatMessage er definert både i storen (26–34) og i types (138–146).

teamSizes på 919 dupliserer getSquadCapacity.

AppState i types (203–213) brukes ikke og er utdatert.

moments finnes både i storen og som lokal state i TacticBoard.

2\. Problemer (prioritert)

Kritisk: kan føre til tap av data

K1. En push erstatter hele tabellen og sletter rader som mangler lokalt.



Linjer: 96–99, 123–126, 150–153, 166–169.

Problem: hver push laster opp hele den lokale listen. Deretter slettes alle rader i databasen som ikke finnes lokalt.

Hvorfor det er farlig:

Hvis trener A har to faner eller enheter åpne, sletter den første som pusher alt den andre har laget siden forrige lasting.

En spiller som svarer på en melding (replyToMessage, 1130) pusher hele coachMessages-listen og sletter dermed meldinger treneren har sendt etter at spilleren lastet siden.

Det samme gjelder når en spiller redigerer profilen sin: da pushes hele player\_accounts-listen.

Forslag: gå over til operasjoner per rad. Opprettelse og endring bør bli en upsert av bare de berørte radene. Sletting bør bli en eksplisitt delete().eq('id', …), eller en «tombstone»-rad. Dirty-flagg per tabell erstattes med en kø av {table, op, id}.

K2. Feilet lasting pluss en lokal endring tømmer databasen.



Linjer: 201–209, 225, 1142–1148.

Problem:

supabase-js kaster ikke ved nettverksfeil eller HTTP-feil. Den returnerer { data: null, error }.

Ved timeout eller feil blir derfor phRes.data?.length usann. Da beholdes standarddataene (\[makePhase('Fase 1')], events: \[] og så videre), og initSyncQueue kalles likevel (1147).

Den første lokale endringen fører så til pushPhases(\[Fase 1]), og alle andre faser slettes (99).

Det samme skjer med events, kontoer og meldinger når de markeres som endret.

Tilleggsrisiko: hvis team\_settings mangler, kaster .single() ikke heller, men returnerer en feil.

Forslag: sjekk error på hvert svar. Aktiver synkkøen bare etter en vellykket lasting (et hydrated-flagg). Ved feil: vis offline-modus og ikke push noe.

K3. Feil ved push blir ignorert, og endringen er borte for godt.



Linjer: 95, 122, 149, 165, 181, samt syncQueue 49–50.

Problem: await supabase.from(...).upsert(...) sjekker aldri error. try/catch fanger bare unntak, og slike kommer sjelden. syncQueue setter dirty.x = false uansett resultat.

Siden phases, events og så videre ikke lagres lokalt, finnes endringen etter en feilet push bare i minnet. Den forsvinner ved reload.

Forslag: push-funksjonene må kaste ved error. Køen skal bare fjerne en oppføring når pushen lyktes, og ellers prøve på nytt med økende ventetid (backoff). Kjernedataene bør også legges i partialize eller IndexedDB, slik at usynkede endringer overlever en reload.

K4. syncFromSupabase overskriver lokale endringer som ikke er synket ennå.



Linje: 1146, set(state => ({ ...state, ...data })).

Problem: synkvinduet er 2 sekunder. Kommer en lasting inn i dette vinduet, overskrives lokale endringer med serverens versjon. Etterpå pusher køen serverdataene tilbake, og endringen er borte.

Lasting skjer ofte og fra mange steder:

page.tsx:299

LoginGate:186 (via setTimeout(…, 100))

PlayerHome:372

PlayerHome:377, altså ved hver eneste realtime-hendelse

PlayerHome:426

Forslag: ved lasting slås serverdata sammen med køen. Rader med ventende lokale operasjoner beholdes lokalt. Realtime bør oppdatere enkeltrader i stedet for å laste alle tabeller på nytt.

Høy: race conditions i synken

H1. Laster kan fullføre i feil rekkefølge.



Linjer: 1142–1152 og PlayerHome:376–378.

Problem: én push fra treneren med N rader gir N realtime-hendelser, som gir N samtidige fulle lastinger av 6 tabeller hver. Svarene kan komme i vilkårlig rekkefølge, og den siste som kommer inn vinner, selv om den er eldst.

Forslag: bruk en teller per forespørsel og forkast svar med lavere nummer enn det siste. Debounce realtime-hendelser (cirka 300 ms), eller oppdater enkeltrader.

H2. dirty = false kan slette et flagg som ble satt under en push.



Linjer: syncQueue 46–50.

Problem: state leses én gang ved start. Hvis markPhasesDirty() kalles mens await pushPhasesFn pågår, returnerer scheduleSync tidlig fordi syncTimer fortsatt er satt. Etterpå setter linje 50 flagget tilbake til false. Endringen blir da ikke synket før neste endring, og aldri hvis det ikke kommer flere.

Forslag: nullstill flagget før pushen (const was = dirty.phases; dirty.phases = false; …). Sett det tilbake til true hvis pushen feiler. Planlegg en ny runde hvis flagget er satt igjen når pushen er ferdig.

H3. Køen kan henge for alltid.



Linjer: syncQueue 43–70.

Problem:

syncTimer = null settes først helt til slutt.

Hvis en push kaster, for eksempel fordi en fremtidig push-funksjon ikke har try/catch, blir timeren aldri nullstilt.

Hvis en fetch henger (supabase-js har ingen timeout som standard), gjelder det samme.

I begge tilfeller returnerer scheduleSync alltid tidlig, og synken er død resten av økten.

Forslag: bruk try/finally rundt hele kjøringen, legg på en egen timeout per push (AbortController, cirka 10–15 s), og skill mellom timer og inFlight.

H4. forceSync og timeren kan kjøre samtidig.



Linjer: syncQueue 87–99.

Problem: clearTimeout stopper ikke en callback som allerede kjører. Da kan begge pushe samtidig, og i kombinasjon med K1 kan de slette hverandres rader. Linje 98 nuller alle flagg, også de som ble satt mens pushen pågikk. forceSync() i addPlayerWithAccount (1072) kalles uten await, så feil forsvinner.

Forslag: bruk én felles funksjon flush() med en mutex eller et delt inFlight-promise som både timeren og forceSync venter på.

H5. Endringer tidligere enn 2 sekunder før lukking går tapt.



Linje: syncQueue 86, der kommentaren sier «før app lukkes».

Problem: det finnes ingen lytter på beforeunload eller visibilitychange. En endring gjort mindre enn 2 sekunder før man lukker fanen, synkes aldri. På mobil er dette vanlig: man bytter app midt i en kamp.

Forslag: kall flush() ved visibilitychange === 'hidden'. Kombinert med lokal lagring av usynkede endringer (K3) går ingenting tapt.

H6. Innstillinger går utenom køen.



Linjer: 535–539, 557–558, 813.

Problem: pushSettings kalles direkte ved hver endring, uten debounce, retry eller feilsjekk. Å skrive lagnavnet tegn for tegn gir én skriving per tegn, og de kan komme frem i feil rekkefølge, slik at den siste som kommer frem vinner.

Forslag: legg innstillingene i samme kø, med debounce.

Høy: sikkerhet (utenfor fokus, men alvorlig)

S1. Passord og PIN-koder ligger i klartekst i databasen og kan leses av alle.



Linjer: 133–134, 206, 220–222, 1165–1167.

Problem:

player\_accounts.password og pin, samt team\_settings.coach\_password og referee\_pin, lagres i klartekst.

De lastes med select('\*') av alle klienter, også spillere, via den offentlige anon-nøkkelen.

Trenerens passord ligger i tillegg i localStorage.

Innloggingen gjøres i nettleseren (500–531), så hvem som helst kan åpne DevTools og logge inn som trener.

Alt ligger også under én og samme id: 'default' uten team\_id, så alle brukere deler én database.

Forslag: fjern passord- og PIN-kolonnene. Bruk bare Supabase Auth, gi tabellene RLS-regler per lag (team\_id), og fjern loginCoach og loginPlayer (klient-sammenligningen).

Middels: persistens og konfliktløsning

M1. Ingen konfliktløsning.



Problem: updated\_at settes fra klientens klokke ved push (93, 120, 147) og leses aldri tilbake. Det finnes ingen versjonering. Regelen er i praksis at den som sist skriver hele tabellen vinner.

Forslag: la serveren sette updated\_at (trigger eller default now()). Sammenlign per rad ved lasting og realtime. For phases holder det trolig å la siste skriving vinne per rad, når K1 er fikset. For coach\_messages.replies trengs mer, se M2.

M2. Svar lagres som en JSON-array inni meldingsraden.



Linjer: 161 og 1130–1136.

Problem: to spillere som svarer på samme melding omtrent samtidig, overskriver hverandres svar.

Forslag: lag en egen tabell, message\_replies, der hvert svar er en rad som bare legges til.

M3. Hele fasen lagres som én JSON-blob.



Linje: 90.

Problem: players, ball og drawings ligger som JSONB i fase-raden. Under et drag markeres fasen som endret hver frame, så alle faser med alle spillere pushes hvert 2. sekund. Hver push gir realtime-hendelser, og hver hendelse gir full lasting hos spillerne.

Forslag: gjør som i K1 og push bare de endrede fasene. Vurder på sikt å flytte spillerne ut i en egen tabell, se D1.

M4. Ingenting fungerer offline eller er klart ved oppstart.



Problem: fordi kjernedata ikke lagres lokalt, er appen tom til lastingen er ferdig. Effekten ensureStarters i TacticBoard kan da kjøre på standardfasen før dataene er på plass.

Forslag: lagre kjernedataene lokalt og eksponer et hydrated-flagg som komponentene venter på.

M5. Kamptimer og rapporter forsvinner ved reload.



Linjer: 878 og 928, som ikke er med i partialize.

Problem: en løpende kampklokke nullstilles ved reload. Treneren mister spilletid for alle spillere midt i kampen.

Forslag: legg matchTimer i partialize. startedAt er allerede et tidsstempel, så klokken regnes riktig ut igjen. matchReports bør synkes mot serveren eller i det minste lagres lokalt.

Middels: konsekvenser av duplisert state

D1. Spilleridentitet er lagret per fase. Se punkt 1 under «Duplisert state».



Forslag: skill ut squad: Record<playerId, PlayerProfile>, med name, num, role, skade og spesialroller, og PlayerAccount knyttet med playerId. Fasen lagrer da bare { playerId, position, isStarter, slotId }.

Dette løser samtidig navnet (player.name mot account.name), skade i flere faser, og at addPlayer bare treffer én fase.

D2. addPlayerWithAccount kan etterlate en spiller uten konto.



Linjer: 1061–1070.

Problem: spilleren legges til før kontoen. Feiler addPlayerAccount, blir spilleren stående uten konto. Spilleren legges også bare til i aktiv fase.

Forslag: gjør begge i én set(), og legg spilleren i squad (D1).

D3. Skade finnes i to modeller.



Linjer: 821–846.

Forslag: fjern injured og injuryReturnDate. Utled injured som !!injury. La checkAndHealInjuries lese injury.expectedReturn og gjelde alle faser, eller squad.

D4. isStarter og isOnField er to felt for samme ting.



Forslag: behold ett av dem. Er det behov for skillet «startet kampen» mot «er på banen nå», bør det dokumenteres, og da må togglePlayerOnField og setPlayerStarter ha tydelige, separate betydninger.

Lav

L1. 635: markPhasesDirty() kalles inne i set-oppdateringsfunksjonen. Det er en bieffekt i en funksjon som skal være ren, og den kan kjøre to ganger i StrictMode (ufarlig i dag).

L2. Mange as any og any i mappingen mellom rader og typer (90, 211, pushChatMessagesFn: any\[]). Generer typer med supabase gen types og samle mappingen i mappers.ts.

L3. registerSyncCallbacks kalles inne i store-funksjonen, og initSyncQueue(() => get()) kalles ved hver lasting. Det fungerer, men syncQueue kan heller få useAppStore.getState direkte etter en splitt, uten at det gir sirkulær import.

L4. tickTimer: () => {} (891) gjør ingenting.

L5. Kolonnen sort\_order har lekket inn i domenetypen TacticPhase (types:68).

Anbefalt rekkefølge

Rekkefølgen bygger på del 1 og 2 over.



Lappe det verste først (en liten endring, rett i dagens filer).

Sjekk error ved lasting og push (K2, K3).

Aktiver synkkøen bare etter vellykket lasting (K2).

Bruk try/finally og timeout i køen (H3).

Nullstill flagget før push i stedet for etter (H2).

Flush ved visibilitychange (H5).

Stopp sletting av hele tabeller (K1). Operasjoner per rad og eksplisitt sletting. Dette er den største risikoreduksjonen.

Splitt storen i slices (settings, phases, events, accounts, messages, match) og flytt push\*, load\* og mapperne ut i store/sync/. Dette er ren flytting og kan gjøres trygt etter steg 2.

Spillermodellen (D1). Innfør squad og faser som bare refererer til spillere. Dette er den største endringen og krever en migrering av eksisterende JSONB-data.

Sikkerhet (S1). Kan gjøres uavhengig av resten, men før appen tas i bruk utenfor testmiljø.

Prosjektet har fortsatt ingen tester. Før steg 1 og 2 anbefaler jeg enhetstester for syncQueue med mock av supabase: timeout, feilet upsert, endring mens en push pågår, og forceSync samtidig med timeren. Det er her regresjoner er både mest sannsynlige og minst synlige.

