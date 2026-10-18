# Next.js 16 – oppgradering og gjenstående verifisering

Status 18. oktober 2026: kodeendringene er klargjort, men oppgraderingen er
**ikke ferdig verifisert**. Miljøet tillater ikke pakkeinstallasjon, og npm sitt
register er blokkert med `EACCES`, også for oppdatering av bare låsefilen.
`node_modules` og `package-lock.json` inneholder derfor fortsatt Next 15.5.28,
ESLint 8.57.1 og eslint-config-next 15.5.28. Ikke behandle dette som et ferdig
Next 16-bygg eller bruk `npm ci` før låsefilen er oppdatert.

## Pakker og kommandoer

- `next` og `eslint-config-next`: 16.4.2 i package.json.
- `react` og `react-dom`: låst til 19.3.1, samme versjon som allerede var installert.
- React-typene: låst til 19.3.0, samme versjon som allerede var installert.
- `eslint`: 9.39-serien, som støtter flat config og Next 16.
- `next-pwa`: fjernet fra package.json. Ingen ny PWA-avhengighet er lagt til.
- Node.js: minst 20.9.0, angitt i `engines`.
- `npm test` kjører én full testomgang og avslutter.
- `npm run lint` bruker ESLint direkte og `eslint.config.mjs`.
- `npm run build` bruker Next sin standardbygger (Turbopack i Next 16), og
  genererer deretter service workeren. Ingen Webpack-plugin eller fallback.

## Gjennomgåtte brudd i Next 15 og 16

Appen har én klientbasert side og en vanlig POST-handler for AI. Ingen
synkrone Next-kall til cookies, headers eller draftMode, ingen dynamiske
params/searchParams, middleware, PPR, revalidateTag, next/image eller eldre
React DOM-API-er ble funnet. Det er derfor ingen middleware å døpe om til
proxy. Request.headers i AI-handleren er det vanlige Request-API-et og skal
fortsatt leses synkront. Den fjernede `eslint`-innstillingen i next.config er
tatt bort. Tailwind-konfigurasjonen bruker nå ESM-eksport som resten av
prosjektet; dette fjerner en modulformat-advarsel i Turbopack. Alle
stilverdier, øvelsestekster og lagringsformat er beholdt.
Nettlesertesten for lastefeil godtar også Turbopack sin feilmelding;
appens eksisterende feilhåndtering støttet allerede begge variantene.

## Offline og mobilinstallasjon

Det eksisterende manifestet, installasjonsikonene og Apple-metadataene er
beholdt. Next støtter manifestet direkte. ServiceWorkerRegister registrerer
`/sw.js` med nettleserens innebygde API bare i produksjon.

`scripts/generate-sw.mjs` kjøres etter et vellykket bygg og lager
`public/sw.js` fra `scripts/service-worker.js`. Den leser filene i
`.next/static` direkte, så også dynamiske appmoduler og lokale skrifter blir
forhåndslagret, uavhengig av Webpack/Turbopack. Kildekart, Next sine interne
manifester, gamle Workbox-filer, `models` og `noprecache` tas ikke med.
Hele forhåndslageret må kunne lastes før en ny worker godtas.

Startsiden og appmodulene bruker samme bygg frem til brukeren velger
«Oppdater». En ny worker venter som før. Verken nett som kommer tilbake eller
oppdatering i en annen fane utløser automatisk omlasting. Forrige komplette
bygg beholdes for åpne faner; eldre egne bygg ryddes ved aktivering. Gamle
Workbox-lagre beholdes under overgangen for eksisterende faner.

3D-modellene lagres først ved bruk, med maksimalt fire filer og 30 dagers
levetid. Tidligere modeller i next-pwa sitt `3d-models`-lager kan også brukes
innenfor levetiden. Endrede modeller må fortsatt få nytt filnavn.
Delingslenker med `kode`, API-kall, andre domener og forespørsler med Range
går utenom offline-lageret. Service workeren serveres uten HTTP-mellomlagring.

## Fullføring når et miljø med npm-tilgang er tilgjengelig

En utvikler må bruke npm til å oppdatere avhengighetene og låsefilen fra
package.json, kontrollere nyeste stabile React-typer i registeret, og kjøre:

```sh
npm test
npm run build
npm run lint
npm run test:offline -- --workers=1
npm run test:e2e -- --workers=1
```

Produksjonstestene bygger selv før de starter serveren. Kjør produksjonstestene
og utviklingstestene etter hverandre: Next 15 som er installert her deler
`.next` mellom utvikling og bygg. Nettlesertestene bruker installert Edge,
og utviklingstestene ber uttrykkelig om Turbopack.

Det lokale bygget kan fullføres med Next 15, men skriver en lint-feil fordi
Next 15 sin innebygde linting ikke støtter det nye oppsettet. `npm run lint`
stopper med de gamle installerte pakkene. Dette kan ikke godkjennes som en
grønn Next 16-kontroll. Alle kontroller må gjentas med de nye pakkene.

### Resultater fra dette miljøet

| Kontroll | Resultat |
| --- | --- |
| `npm test` | 33 testfiler, 335 tester bestått. |
| `npm run build` | Avsluttet med kode 0, inkludert typesjekk og generering av worker, men brukte installert Next 15.5.28 og skrev lint-feilen nevnt over. |
| `npm run lint` | Stopper: installert ESLint 8/config-next 15 kan ikke laste Next 16-oppsettet. |
| E2E med Turbopack og én worker | 37 av 38 besto først. Den siste forventet Webpack sin ordlyd; etter tilpasning besto alle tre feiltestene ved ny kjøring. Alle 38 scenarioene er dermed kontrollert. |
| Produksjon/offline med én worker | 5 av 5 bestått: overgang fra eldre registrering, installasjonsikoner/delingskode, offline appmoduler, 3D-modeller og ventende oppdatering/flere faner. |
| `git diff --check` | Bestått. |

Miljøet hang når Playwright skulle avslutte sin egen Windows-server. Den
siste produksjonskjøringen brukte derfor samme tester med separat startet
server og en midlertidig konfigurasjon under ignorerte `test-results`.
Da avsluttet testkjøringen normalt med kode 0. Ingen produktkode eller
testforventninger ble endret for denne omgåelsen. Testserverne er stoppet.

## Sjekkliste på en ekte mobil

1. Åpne en testutgave over HTTPS med nett. La første innlasting fullføre.
2. Installer fra Chrome på Android eller «Legg til på Hjem-skjermen» i Safari
   på iPhone. Kontroller ikon og at appen åpnes uten nettleserens adresselinje.
3. Slå på flymodus, lukk appen og åpne den igjen fra ikonet. Åpne Taktikk og
   Øvelser, flytt en spiller, lagre og åpne appen igjen.
4. Åpne 3D én gang med nett. Kontroller deretter at den tidligere brukte
   modellen kan lastes i flymodus. AI krever fortsatt nett.
5. Slå nettet på igjen mens en tegning er åpen. Siden skal ikke lastes om.
6. Test overgang fra en allerede installert gammel utgave: ny versjon skal
   vente på «Oppdater», og lagrede taktikker/treninger skal være beholdt.

## Offisielle kilder

- [Oppgraderingsguide for Next 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Oppgraderingsguide for Next 15](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Next: ESLint og flat config](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Next: manifest og egen service worker](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Next-versjon fra npm-registeret](https://registry.npmjs.org/next/latest)
- [React-versjon fra npm-registeret](https://registry.npmjs.org/react/latest)
