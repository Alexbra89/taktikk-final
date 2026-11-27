import { defineConfig, devices } from '@playwright/test';

// Røyktester i en ekte nettleser: det som ikke kan testes i Node (Vitest),
// som angre etter bytte – logikken bor i TacticBoard-komponenten.
//
// Edge brukes fordi den finnes på alle Windows-maskiner og ikke må lastes
// ned. Uten Edge: kjør «npx playwright install chromium» og fjern channel.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    acceptDownloads: true,
    // Nettverksavskjæring må også virke når en lokal produksjonsserver gjenbrukes.
    // Service worker og bruk uten nett testes i playwright.offline.config.ts.
    serviceWorkers: 'block',
  },
  // På GitHub Actions (CI) og med PW_BROWSER=chromium brukes Chromium, som
  // installeres med «npx playwright install chromium». Lokalt: Edge.
  projects: process.env.CI || process.env.PW_BROWSER === 'chromium'
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } } }]
    : [{ name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1400, height: 900 } } }],
  // Egen port, så testene ikke kolliderer med en vanlig «npm run dev» på 3000.
  webServer: {
    command: 'node node_modules/next/dist/bin/next dev --turbopack -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
