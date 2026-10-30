# Taktikkboard

Gratis app for fotballtrenere: taktikkbrett i 2D og 3D, treningsplanlegging,
kalender, kamprapporter, øvelsesbibliotek med animerte øvelser og en AI-trener.
Appen virker uten nett, har ingen innlogging og lagrer alt lokalt i nettleseren.

Bygget med Next.js 16, React 19, Zustand og three.js. Ligger på Vercel.

## Kom i gang

Krever Node 24 (se `engines` i `package.json`).

```bash
npm ci
npm run dev        # http://localhost:3000
```

AI-treneren trenger tre miljøvariabler på serveren. Kopier `.env.example` til
`.env.local` og fyll inn (på Vercel: Settings → Environment Variables).
Delingslenker med tilgangskode er forklart i `docs/ai-tilgang-og-ikoner.md`.

## Kontroller

| Kommando | Hva |
| --- | --- |
| `npm run lint` | ESLint |
| `npm test` | Enhetstester (Vitest) |
| `npm run build` | Bygger appen og service workeren for bruk uten nett |
| `npm run test:e2e` | Nettlesertester (Playwright). De tunge 3D-testene tar lang tid. |
| `npm run test:offline` | Bygger og tester appen uten nett |

Lint, enhetstester og bygging kjører automatisk på hver pull request
(`.github/workflows/ci.yml`). Dependabot sender ukentlige pakkeoppdateringer.

## Dokumentasjon

- `AGENTS.md`: kart over koden (3D, 2D-brettet, Trening, app-tilstanden og animerte øvelser).
- `docs/3d-visning.md`: hvordan 3D-visningen brukes.
- `docs/ai-tilgang-og-ikoner.md`: AI-tilgang, delingslenker og appikon.
- `docs/animasjon-plan.md`: hvilke øvelser som er animert, og hvorfor.
- `docs/kilder-og-lisenser.md`: opphav og lisens for modeller, bilder og skrifter.
- `docs/arkiv/`: ferdige planer og arbeidsnotater, ikke gjeldende.

Personvern, ansvar og kilder vises også i appen under Innstillinger.
