import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1280, 1400]) {
  test(`hurtigvalget Øvelser åpner biblioteket ved ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    const shortcuts = page.getByRole('group', { name: 'Hurtigvalg' });
    await expect(shortcuts.getByRole('button')).toHaveText([
      'Ny trening', 'Åpne taktikk', 'Øvelser', 'Kalender', 'AI-trener',
    ]);

    // Knappene beholder trykkflaten og kolliderer ikke ved rulling eller linjeskift.
    const layoutFits = await shortcuts.evaluate(group => {
      const buttons = Array.from(group.querySelectorAll('button'));
      const rects = buttons.map(button => button.getBoundingClientRect());
      const groupRect = group.getBoundingClientRect();
      return groupRect.left >= 0 && groupRect.right <= window.innerWidth
        && document.documentElement.scrollWidth <= window.innerWidth
        && buttons.every((button, i) => rects[i].height >= 44 && button.scrollWidth <= button.clientWidth)
        && rects.every((rect, i) => rects.slice(i + 1).every(other =>
          rect.right <= other.left || other.right <= rect.left
          || rect.bottom <= other.top || other.bottom <= rect.top));
    });
    expect(layoutFits, 'snarveiene har plass uten overlapping eller sideveis sideflyt').toBe(true);

    const drills = shortcuts.getByRole('button', { name: 'Øvelser', exact: true });
    await drills.scrollIntoViewIfNeeded();
    await expect(drills).toBeInViewport();
    if (width === 390 || width === 1400) {
      await page.screenshot({ path: `test-results/dashboard-shortcuts-${width}.png` });
    }
    await drills.click();

    await expect(shortcuts).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Legg til egen øvelse', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mine øvelser', exact: true })).toBeVisible();
  });
}
