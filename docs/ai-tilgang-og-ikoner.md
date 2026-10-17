# AI-tilgang og appikon

## Lag en delingslenke

Legg `?kode=DIN_KODE` til appens adresse, for eksempel
`https://din-app.vercel.app/?kode=DIN_KODE`. Bruk verdien i **AI_ACCESS_CODE**
på Vercel. Har adressen allerede et spørsmålstegn, bruk `&kode=DIN_KODE`.
Velg helst en lang, tilfeldig kode med bokstaver og tall. Spesialtegn må
URL-kodes, for eksempel `+` som `%2B` og `&` som `%26`.

Mottakeren åpner lenken én gang. Koden huskes på enheten og fjernes fra
adresselinjen med `history.replaceState` før appen og feilloggen starter.
Manuell inntasting i AI-treneren eller AI-øvelsesforslag huskes også.
Innstillinger → AI-tilgang viser om tilgang er aktiv på enheten.
Koden kontrolleres først ved bruk av AI; oppstart gjør ingen AI-kall.

Privat nettlesing og slettede nettleserdata kan kreve ny lenke. Ved blokkert
lagring gjelder koden bare i den åpne økten. En avvist kode fjernes med
beskjeden «Tilgangskoden virker ikke lenger. Be treneren som delte appen om
en ny lenke.»

## Bytt kode i Vercel

1. Åpne prosjektet → **Settings → Environment Variables**.
2. Endre **AI_ACCESS_CODE** for **Production**, og eventuelt **Preview**.
   Behold **OPENROUTER_API_KEY** og **AI_MODEL** som før. Ingen av disse
   skal ha `NEXT_PUBLIC_` foran navnet.
3. Lagre og velg **Redeploy**. Verdien gjelder først i en ny publisering,
   slik [Vercel forklarer](https://vercel.com/docs/environment-variables/managing-environment-variables).
4. Del en ny lenke med den nye koden. Gamle publiseringsadresser kan fortsatt
   bruke sitt gamle oppsett; fjern eller begrens dem hvis de også må stenges.

Ingen Vercel-innstillinger er endret og ingenting er publisert i denne oppgaven.

## Beskyttelse og begrensninger

- Servernøkkelen og tilgangskontrollen er beholdt. Koden sendes i en header
  og utelates fra appens feillogg, serverens brukslogg og nye sikkerhetskopier.
  Koder i eldre kopier ignoreres ved import; enhetens kode beholdes.
  Eldre, nedlastede filer med kode må erstattes eller slettes manuelt.
- Maks 30 forespørsler i en rullerende time per IP **per serverprosess**,
  også feil kode og ugyldige forespørsler når serveren er konfigurert.
  Nummer 31 får HTTP 429, norsk forklaring og ventetid i `Retry-After`.
  Den kontakter ikke AI, og gyldig kode beholdes. Flere på samme nett deler
  grensen. Ingen automatisk gjentakelse av AI-kall.
- På Vercel har hver instans egen teller; omstart eller ny publisering
  nullstiller den. Grensen er derfor ingen garantert samlet kostnadsgrense.
  Behold også forbruksgrensen hos OpenRouter. Ingen database eller ekstern
  tjeneste er lagt til. Bare IP-hash og tidsstempler lagres i minnet, med
  et tak på 10 000 aktive IP-er; nye avvises ved fullt minne.
- IP kommer fra `x-forwarded-for`, som
  [Vercel overskriver](https://vercel.com/docs/headers/request-headers).
  På annen hosting må en betrodd proxy overskrive denne headeren.
  Manglende/ugyldig IP deler én grense.
- Lenken er en hemmelighet. Første åpning når vertstjenesten;
  `replaceState` kan ikke slette vertens/proxyens eventuelle nettverkslogg
  eller meldingen der lenken ble delt. Appen sender ingen referrer og den
  nye service workeren lagrer ikke lenker med `kode` i cachen.

## Ikon og kontroll på telefon

`public/icon.svg` bruker banelinjene fra sidemenyens `BrandMark`.
`node scripts/generate-icons.mjs` lager PNG 192/512, maskable 512 med
ugjennomsiktig bakgrunn og trygg marg, iPhone 180 og favicon 16/32/48.
Det bruker `sharp`, som allerede er installert. Ingen nye pakker.

Manifest og ikonkoblinger bruker nye filnavn med `pitch-v2`. Byggingen
oppdaterer innholdshashene i service workerens forhåndslager. Den genererte
`public/sw.js` inngår ikke i leveransen. Velg «Oppdater» når appen varsler
om en ny versjon, og legg appen til på hjemskjermen for å se ikonet.
Hvis telefonen beholder det gamle ikonet, fjern bare snarveien og legg den
til på nytt. Ta sikkerhetskopi før eventuell avinstallering eller sletting
av appdata.
