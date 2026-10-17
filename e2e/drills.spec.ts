import { test, expect, type Page } from '@playwright/test';

// Nettlesercachen skal aldri kunne gå utenom de falske AI-svarene.
test.use({ serviceWorkers: 'block' });

const fakeDrill = {
  id: '', name: 'AI pasningslek', description: 'Pasninger i små grupper med mye ballkontakt.',
  ageGroup: 'youth', ageBand: ['8-9'], category: 'midtbane', difficulty: 'enkel', players: '10', duration: 15,
  equipment: ['Baller', 'Kjegler'], why: 'Trener pasninger.', sketch: 'Sone på 12 × 12 m.',
  steps: [{ id: '1', name: 'Spill', description: 'Tre minutter spill og ett minutt pause. Gjenta.' }],
  coachingPoints: ['Se opp', 'Spill rolig', 'Beveg deg'], commonMistakes: [], variations: ['Bruk større område.'], warning: 'Ingen hard kroppskontakt.', aiGenerated: true,
};
const customDrills = (page: Page) => page.evaluate(() =>
  JSON.parse(localStorage.getItem('taktikkboard-storage') ?? '{}').state?.customDrills ?? []);
const storedTactics = (page: Page) => page.evaluate(() => {
  const tactics = JSON.parse(localStorage.getItem('taktikkboard-storage')!).state.tactics;
  // Dagens innlasting fyller inn en tom utstyrsliste når feltet mangler.
  return tactics.map((t: { phases: { items?: unknown[] }[] }) => ({ ...t,
    phases: t.phases.map(p => ({ ...p, items: p.items ?? [] })) }));
});

test.beforeEach(async ({ page }) => {
  // Alle AI-kall fanges lokalt. Ingen test kan nå den virkelige AI-tjenesten.
  await page.route('**/api/ai', route => route.fulfill({ status: 503, json: { error: 'AI er ikke konfigurert på serveren.' } }));
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Øvelser', exact: true }).click();
  await page.getByRole('button', { name: 'Barn', exact: true }).click();
});

test('egen øvelse: validering, oppretting, redigering, omlasting og bekreftet sletting', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const before = await storedTactics(page);
  await page.getByRole('button', { name: 'Legg til egen øvelse', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Lagre øvelse', exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await customDrills(page)).toHaveLength(0);
  await dialog.getByLabel('Navn', { exact: true }).fill('Min balløvelse');
  await dialog.getByLabel('Beskrivelse', { exact: true }).fill('Spill pasninger to og to.');
  await dialog.getByLabel('Antall spillere', { exact: true }).fill('10');
  await dialog.getByLabel('Skisse / oppsett', { exact: false }).fill('To kjegler med 5 meters avstand.');
  await dialog.getByLabel('Slik gjøres det', { exact: false }).fill('Spill i tre minutter.\nTa en kort pause.');
  await dialog.getByLabel('Utstyr', { exact: false }).fill('Baller\nKjegler');
  await dialog.getByRole('button', { name: 'Lagre øvelse', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Min balløvelse', exact: true })).toBeVisible();
  await expect(page.getByText('Min øvelse', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rediger min øvelse' }).click();
  await page.getByRole('dialog').getByLabel('Navn', { exact: true }).fill('Min redigerte balløvelse');
  await page.getByRole('button', { name: 'Lagre øvelse', exact: true }).click();
  await page.getByRole('button', { name: 'Tilbake', exact: true }).click();
  await page.reload();
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'Øvelser', exact: true }).click();
  await page.getByRole('button', { name: 'Barn', exact: true }).click();
  await page.getByRole('button', { name: 'Mine øvelser', exact: true }).click();
  await expect(page.getByText('Min redigerte balløvelse', { exact: true })).toBeVisible();
  await page.getByText('Min redigerte balløvelse', { exact: true }).click();
  await page.getByRole('button', { name: 'Legg i kalenderen', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Dato', { exact: false }).fill('2026-10-20');
  await page.getByRole('dialog').getByRole('button', { name: 'Legg til', exact: true }).click();
  await page.getByRole('button', { name: 'Slett min øvelse' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Avbryt' }).click();
  expect(await customDrills(page)).toHaveLength(1);
  await page.getByRole('button', { name: 'Slett min øvelse' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Slett øvelse', exact: true }).click();
  expect(await customDrills(page)).toHaveLength(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('taktikkboard-storage')!).state.events[0].title))
    .toBe('Min redigerte balløvelse');
  const after = await storedTactics(page);
  expect(after).toEqual(before);
  expect(errors).toEqual([]);
});

test('AI-forslag: bruker eksisterende oppsett og lagrer først etter gjennomlesing og redigering', async ({ page }) => {
  let request: Record<string, any> = {};
  await page.route('**/api/ai', route => {
    request = route.request().postDataJSON();
    expect(route.request().headers()['x-ai-access-code']).toBe('test-kode');
    return route.fulfill({ json: { drill: fakeDrill } });
  });
  await page.evaluate(() => localStorage.setItem('taktikk:ai-access-code', 'test-kode'));
  await page.getByRole('button', { name: 'Foreslå øvelse med AI' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Tilgangskode', { exact: false })).toHaveValue('test-kode');
  await dialog.getByLabel('Hva ønsker du?').fill('Pasningsøvelse for 10 spillere, 9 år, 15 min');
  await dialog.getByRole('button', { name: 'Hent AI-forslag' }).click();
  await expect(dialog.getByRole('heading', { name: fakeDrill.name })).toBeVisible();
  await expect(dialog.getByText('AI-forslag – ikke kvalitetssjekket', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/Kilde:/)).toHaveCount(0);
  expect(request.mode).toBe('SUGGEST_DRILL');
  expect(request.appContext).toMatchObject({ ageGroup: 'youth', ageBand: '8-9' });
  expect(await customDrills(page)).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Lagre som min øvelse' }).click();
  await expect(page.getByRole('dialog').getByLabel('Navn', { exact: true })).toHaveValue(fakeDrill.name);
  expect(await customDrills(page)).toHaveLength(0);
  await page.getByRole('dialog').getByLabel('Navn', { exact: true }).fill('Min tilpassede AI-øvelse');
  await page.getByRole('button', { name: 'Lagre øvelse', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Min tilpassede AI-øvelse' })).toBeVisible();
  await expect(page.getByText('AI-forslag – ikke kvalitetssjekket', { exact: true })).toBeVisible();
  expect((await customDrills(page))[0].aiGenerated).toBe(true);
});

test('AI-variant sender valgt øvelse; avbryt beholder biblioteket', async ({ page }) => {
  let baseId = '';
  await page.route('**/api/ai', route => {
    const body = route.request().postDataJSON();
    baseId = body.appContext.baseDrillId;
    expect(body.question).toContain('færre spillere');
    return route.fulfill({ json: { drill: fakeDrill } });
  });
  await page.getByRole('heading', { level: 3 }).first().click();
  await expect(page.getByRole('button', { name: 'Rediger min øvelse' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Slett min øvelse' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Foreslå variant med AI' }).click();
  await page.getByRole('dialog').getByRole('combobox', { name: 'Alder', exact: true }).selectOption('8-9');
  await page.getByLabel('Tilgangskode', { exact: false }).fill('test-kode');
  await page.getByRole('button', { name: 'Færre spillere', exact: true }).click();
  await page.getByRole('button', { name: 'Hent AI-forslag' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: fakeDrill.name })).toBeVisible();
  expect(baseId).toBeTruthy();
  await page.getByRole('button', { name: 'Lagre som min øvelse' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Avbryt' }).click();
  expect(await customDrills(page)).toHaveLength(0);
});

test('AI-feil er forståelige og lagrer ingenting', async ({ page }) => {
  await page.getByRole('button', { name: 'Foreslå øvelse med AI' }).click();
  await page.getByLabel('Tilgangskode', { exact: false }).fill('test-kode');
  await page.getByLabel('Hva ønsker du?').fill('En øvelse for barn');
  await page.getByRole('button', { name: 'Hent AI-forslag' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('AI er ikke konfigurert');
  await page.route('**/api/ai', route => route.fulfill({ json: { drill: {} } }));
  await page.getByRole('button', { name: 'Hent AI-forslag' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('ufullstendig');
  await page.route('**/api/ai', route => route.abort());
  await page.getByRole('button', { name: 'Hent AI-forslag' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Fikk ikke kontakt');
  await page.route('**/api/ai', route => route.fulfill({ status: 401, json: { error: 'AI-tilgang mangler eller er feil.' } }));
  await page.getByRole('button', { name: 'Hent AI-forslag' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('AI-tilgang mangler');
  await expect(page.getByLabel('Tilgangskode', { exact: false })).toHaveValue('');
  await page.getByLabel('Tilgangskode', { exact: false }).fill('test-kode');
  await page.clock.install();
  await page.route('**/api/ai', () => { /* falsk tjeneste som aldri svarer */ });
  const sent = page.waitForRequest('**/api/ai');
  await page.getByRole('button', { name: 'Hent AI-forslag' }).click();
  await sent;
  await page.clock.runFor(50_001);
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('AI brukte for lang tid');
  expect(await customDrills(page)).toHaveLength(0);
});

test('skjema og lagreknapp er tilgjengelige på mobil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Legg til egen øvelse', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lagre øvelse', exact: true })).toBeInViewport();
  expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/drill-editor-mobile.png' });
});
