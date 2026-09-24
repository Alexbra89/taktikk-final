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
  },
  projects: [
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1400, height: 900 } } },
  ],
  // Egen port, så testene ikke kolliderer med en vanlig «npm run dev» på 3000.
  webServer: {
    command: 'npx next dev -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
