import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
const CODE = 'testkode-kun-lokalt';
const key = 'taktikk:ai-access-code';
const invalid = 'Tilgangskoden virker ikke lenger. Be treneren som delte appen om en ny lenke.';
const stored = (page: Page) => page.evaluate(key => localStorage.getItem(key), key);
const ai = (page: Page) => page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'AI-trener', exact: true }).click();

test.beforeEach(async ({ page }) => {
  // Ingen test slipper gjennom et ekte AI-kall.
  await page.route('**/api/ai', route => route.fulfill({ json: { answer: 'Et falskt trenerråd.' } }));
});

test('lenke renser adressen, huskes etter omlasting og deles med AI-øvelser uten ny inntasting', async ({ page }) => {
  await page.goto(`/?vis=trening&kode=${CODE}#bane`);
  await expect(page).toHaveURL('/?vis=trening#bane');
  expect(await stored(page)).toBe(CODE);
  await page.reload();
  await ai(page);
  await expect(page.getByLabel('Melding til AI-treneren')).toBeVisible();
  await expect(page.getByLabel('Tilgangskode', { exact: true })).toHaveCount(0);
  await page.getByLabel('Melding til AI-treneren').fill('Hvordan trener vi pasninger?');
  const request = page.waitForRequest('**/api/ai');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  expect((await request).headers()['x-ai-access-code']).toBe(CODE);
  await expect(page.getByText('Et falskt trenerråd.', { exact: true })).toBeVisible();
  // Dokket AI-panel lukkes fra hovedmenyen.
  await ai(page);
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Øvelser', exact: true }).click();
  await page.getByRole('button', { name: 'Foreslå øvelse med AI' }).click();
  await expect(page.getByRole('dialog').getByText('AI-tilgang er aktiv på denne enheten.', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByLabel('Tilgangskode', { exact: false })).toHaveCount(0);
});

test('manuell kode huskes; Innstillinger på mobil viser aktiv tilgang uten glemmeknapp', async ({ page }) => {
  await page.goto('/');
  await ai(page);
  await page.getByLabel('Tilgangskode', { exact: true }).fill(CODE);
  await page.getByRole('button', { name: 'Lagre', exact: true }).click();
  await expect(page.getByLabel('Melding til AI-treneren')).toBeVisible();
  await page.reload();
  expect(await stored(page)).toBe(CODE);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Mer', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Innstillinger/ }).click();
  const access = page.getByRole('region', { name: 'AI-tilgang', exact: true });
  await expect(access.getByText('AI-tilgang er aktiv på denne enheten.', { exact: true })).toBeVisible();
  await access.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/ai-access-mobile.png' });
  await expect(access.getByRole('button', { name: 'Glem tilgangskode' })).toHaveCount(0);
  expect(await stored(page)).toBe(CODE);
  await page.reload();
  await page.setViewportSize({ width: 1400, height: 900 });
  await ai(page);
  await expect(page.getByLabel('Melding til AI-treneren')).toBeVisible();
  await expect(page.getByLabel('Tilgangskode', { exact: true })).toHaveCount(0);
});

test('utgått kode fjernes, norsk beskjed vises, og 429 beholder gyldig kode', async ({ page }) => {
  await page.goto(`/?kode=${CODE}`);
  await ai(page);
  await page.route('**/api/ai', route => route.fulfill({ status: 401, json: { error: 'gammel melding' } }));
  await page.getByLabel('Melding til AI-treneren').fill('Et spørsmål');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'AI-trener', exact: true }).getByRole('alert')).toHaveText(invalid);
  await expect(page.getByLabel('Tilgangskode', { exact: true })).toBeVisible();
  expect(await stored(page)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('taktikk:error-log'))).toBeNull();
  await page.getByLabel('Tilgangskode', { exact: true }).fill('ny-testkode');
  await page.getByRole('button', { name: 'Lagre', exact: true }).click();
  await page.route('**/api/ai', route => route.fulfill({ status: 429, json: {
    error: 'Du har nådd grensen på 30 AI-forespørsler per time fra dette nettet. Vent opptil én time og prøv igjen.',
  } }));
  await page.getByLabel('Melding til AI-treneren').fill('Prøv igjen');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'AI-trener', exact: true }).getByRole('alert')).toContainText('30 AI-forespørsler per time');
  expect(await stored(page)).toBe('ny-testkode');
});
