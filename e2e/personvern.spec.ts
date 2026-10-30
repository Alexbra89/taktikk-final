import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const settings = async (page: Page) => {
  const nav = page.getByRole('navigation', { name: 'Hovedmeny' });
  if ((page.viewportSize()?.width ?? 1400) >= 640) await page.getByRole('button', { name: 'Innstillinger', exact: true }).click();
  else {
    await nav.getByRole('button', { name: 'Mer', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Innstillinger/ }).click();
  }
};

for (const viewport of [{ width: 1400, height: 900 }, { width: 390, height: 844 }]) {
  test(`innstillingene viser personvern, kontakt og kilder (${viewport.width}×${viewport.height})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await settings(page);
    const privacy = page.getByRole('region', { name: 'Personvern og vilkår' });
    await expect(privacy.getByRole('heading', { name: 'Personvern og vilkår' })).toBeVisible();
    for (const heading of ['Alt lagres på denne enheten', 'Ingen sporing', 'Vertskap', 'AI-treneren', 'Ansvar', 'Kontakt']) {
      await expect(privacy.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    await expect(privacy.getByRole('link', { name: 'alex_bratland@live.no' })).toHaveAttribute('href', 'mailto:alex_bratland@live.no');
    const credits = page.getByRole('region', { name: 'Kilder og lisenser' });
    await expect(credits).toContainText('Quaternius');
    await expect(credits).toContainText('Poly Haven');
    // Ingen vannrett rulling på mobil.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('AI-treneren ber om å ikke skrive spillernavn', async ({ page }) => {
  await page.route('**/api/ai', route => route.fulfill({ json: { answer: 'Et falskt trenerråd.' } }));
  await page.goto('/?kode=testkode-kun-lokalt');
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('button', { name: 'AI-trener', exact: true }).click();
  await expect(page.getByLabel('Melding til AI-treneren')).toBeVisible();
  await expect(page.getByText(/Ikke skriv navn på spillere\./)).toBeVisible();
});
