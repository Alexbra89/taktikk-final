import { defineConfig, devices } from '@playwright/test';

// Egen kjøring: utviklingsserveren har PWA slått av og kan ikke teste offline.
export default defineConfig({
  testDir: 'e2e-production',
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  outputDir: 'test-results/offline',
  use: {
    baseURL: 'http://localhost:3101',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'edge-production',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1400, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm start -- --port 3101',
    url: 'http://localhost:3101',
    // En gammel server kan ellers skjule at bygget eller registreringen feiler.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
