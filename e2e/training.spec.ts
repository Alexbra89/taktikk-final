import { test, expect, type Page } from '@playwright/test';
import type { CalendarEvent } from '../src/types';

const title = 'Trening med pasninger og keeper';
const libraryDrill = 'Kjeglejakten (forflytning og fallteknikk)';
const warningDrill = 'Boksforsvareren (høye baller og klarering)';
const customDrill = 'Min pasningssirkel';
const warning = 'Øvelsen inneholder hodespill.';

async function openTraining(page: Page) {
  await page.getByRole('navigation', { name: 'Hovedmeny' })
    .getByRole('button', { name: 'Trening', exact: true }).click();
}

// Kortene har foreløpig ingen semantisk rolle. Finn nærmeste kort med
// punktets tittel, sletteknapp og beskrivelse, uten nye test-id-er i produktkoden.
function item(page: Page, name: string) {
  return page.locator('div').filter({ has: page.getByRole('button', { name, exact: true }) })
    .filter({ has: page.getByRole('button', { name: `Slett ${name}`, exact: true }) })
    .filter({ has: page.locator('p') }).last();
}

function itemTitles(page: Page) {
  return page.getByRole('button', { name: /^Slett / }).evaluateAll(buttons =>
    buttons.map(button => button.getAttribute('aria-label')!.replace(/^Slett /, '')));
}

async function savedTraining(page: Page) {
  return page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('taktikkboard-storage')!).state;
    return { events: state.events as CalendarEvent[], rosterNames: state.rosterNames as string[] };
  });
}

for (const viewport of [
  { name: 'desktop', width: 1400, height: 900 },
  { name: 'mobil', width: 390, height: 844 },
]) {
  test.describe(viewport.name, () => {
    test.use({ viewport, serviceWorkers: 'block', timezoneId: 'Europe/Oslo' });

    test('Trening: opprett, gjennomfør, del og behold etter omlasting', async ({ page }) => {
      test.setTimeout(120_000);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      // Styrt lokal dato, så testen også tåler midnatt og omlasting.
      await page.clock.install({ time: new Date('2026-10-18T20:00:00+02:00') });
      await page.goto('/');
      const nav = page.getByRole('navigation', { name: 'Hovedmeny' });
      if (viewport.name === 'mobil') {
        await nav.getByRole('button', { name: 'Mer', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: /Innstillinger/ }).click();
      } else {
        await page.getByRole('button', { name: 'Innstillinger', exact: true }).click();
      }
      await page.getByRole('region', { name: 'Aldersgruppe', exact: true })
        .getByRole('button', { name: 'Barn lettere', exact: true }).click();
      await openTraining(page);
      await page.getByRole('button', { name: 'Ny trening', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Opprett trening', exact: true })).toBeDisabled();
      await page.getByPlaceholder('F.eks. Teknikktrening, 4-3-3 trening...').fill(title);
      await expect(page.locator('input[type="date"]')).toHaveValue('2026-10-18');
      await page.locator('input[type="time"]').fill('18:30');
      await page.getByPlaceholder('Stadion / hall').fill('Testbanen');
      const focusOptions = [
        'Pasningsspill', 'Pressing', 'Forsvarsstilling', 'Avslutning', 'Kontrapress',
        'Innlegg', 'Dødball', 'Keepertrening', 'Kondisjon', 'Styrke', 'Taktikk', 'Individuell teknikk',
      ];
      const focusArea = page.getByText('Fokusområder (valgfritt)', { exact: true }).locator('..');
      await expect(focusArea.getByRole('button')).toHaveText(focusOptions);
      for (const focus of focusOptions) {
        const button = focusArea.getByRole('button', { name: focus, exact: true });
        await expect(button).toBeVisible();
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport();
        const bounds = await button.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
      }
      await page.screenshot({ path: test.info().outputPath('fokusvalg.png') });
      await focusArea.getByRole('button', { name: 'Pasningsspill', exact: true }).click();
      await focusArea.getByRole('button', { name: 'Individuell teknikk', exact: true }).click();
      await page.getByPlaceholder('Mål for økten, beskjeder til spillerne...').fill('Ta med egen ball.');

      await page.getByRole('button', { name: 'Velg øvelser', exact: true }).click();
      await page.getByRole('button', { name: 'Keeper', exact: true }).click();
      await page.getByRole('button', { name: 'Enkel', exact: true }).click();
      await page.getByPlaceholder('Søk etter øvelse …').fill('Kjeglejakten');
      await expect(page.getByText('1 øvelser', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: new RegExp(libraryDrill.split(' (')[0]) }).click();

      await page.getByRole('button', { name: /Legg til flere/ }).click();
      await page.getByRole('button', { name: 'Forsvar', exact: true }).click();
      await page.getByRole('button', { name: 'Avansert', exact: true }).click();
      await page.getByPlaceholder('Søk etter øvelse …').fill('Boksforsvareren');
      await expect(page.getByText('1 øvelser', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Boksforsvareren/ }).click();
      await expect(page.getByText(warning, { exact: false })).toBeVisible();

      await page.getByRole('button', { name: 'Legg til egen øvelse', exact: true }).click();
      await page.getByRole('button', { name: 'Legg til øvelse', exact: true }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'Fyll inn øvelsesnavn' })).toBeVisible();
      await page.getByPlaceholder('Øvelsesnavn *').fill(customDrill);
      await page.getByPlaceholder('Beskrivelse (valgfritt)').fill('Spill ballen rundt sirkelen.');
      await page.getByRole('spinbutton').fill('1');
      await page.getByRole('button', { name: 'Legg til øvelse', exact: true }).click();
      await page.getByRole('button', { name: 'Opprett trening', exact: true }).click();
      await expect(page.getByText(title, { exact: true })).toBeVisible();

      // Dagens trening skal ha Start, også etter at tidspunktet er passert.
      await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Start', exact: true }).click();
      await expect(page.getByText('Testbanen', { exact: true })).toBeVisible();
      await expect(page.getByText('18:30', { exact: true })).toBeVisible();
      const generalNote = page.getByPlaceholder('Mål for økten, beskjeder til spillerne...');
      await expect(generalNote).toHaveValue(/Fokus: Pasningsspill, Individuell teknikk/);
      await expect(generalNote).toHaveValue(/Ta med egen ball\./);
      await expect(generalNote).toHaveValue(/Advarsel: Øvelsen inneholder hodespill\./);
      expect((await savedTraining(page)).events[0].trainingNotes.every(note => note.focus.includes('Pasningsspill'))).toBe(true);
      expect((await savedTraining(page)).events[0].trainingNotes.every(note => note.focus.includes('Individuell teknikk'))).toBe(true);
      await expect(item(page, warningDrill).getByText(warning, { exact: false })).toBeVisible();
      await item(page, warningDrill).getByRole('button', { name: 'Vis full detalj', exact: true }).click();
      await expect(page.getByRole('dialog').getByRole('heading', { name: warningDrill, exact: true })).toBeVisible();
      await expect(page.getByRole('dialog').getByText(warning, { exact: false })).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: 'Lukk', exact: true }).click();
      await generalNote.fill('Husk drikke og korte pauser.');

      await page.getByRole('button', { name: 'Fremmøte (0/0)', exact: true }).click();
      await page.getByRole('button', { name: 'Rediger navneliste', exact: true }).click();
      await page.getByPlaceholder('Ola\nKari\nPer').fill('Ola\nKari\nPer');
      await page.getByRole('button', { name: 'Lagre navneliste', exact: true }).click();
      await page.getByRole('button', { name: 'Ola', exact: true }).click();
      await page.getByRole('button', { name: 'Kari', exact: true }).click();
      await page.getByRole('button', { name: 'Kari', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Fremmøte (1/3)', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Rediger navneliste', exact: true }).click();
      await page.getByPlaceholder('Ola\nKari\nPer').fill('Ola\nKari\nAda');
      await page.getByRole('button', { name: 'Lagre navneliste', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Per', exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Ada', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Fremmøte (2/3)', exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'Legg til', exact: true }).click();
      await page.getByPlaceholder('Tittel', { exact: true }).fill('Felles beskjed');
      await page.getByPlaceholder('Beskrivelse...', { exact: true }).fill('Samling ved benken.');
      await page.getByRole('button', { name: 'Lagre', exact: true }).click();
      await page.getByRole('button', { name: 'Legg til taktikk', exact: true }).click();
      await page.getByRole('option', { name: /Taktikk 1/ }).click();
      await page.getByRole('spinbutton', { name: /Varighet/ }).fill('7');
      // Det finnes også en knapp som åpner notatskjemaet med samme tekst.
      const picker = page.getByRole('listbox', { name: 'Taktikker' }).locator('..');
      await picker.getByRole('button', { name: 'Legg til', exact: true }).click();
      await page.getByRole('spinbutton', { name: 'Minutter for Taktikk 1', exact: true }).fill('8');
      const originalOrder = [libraryDrill, warningDrill, customDrill, 'Felles beskjed', 'Taktikk 1'];
      expect(await itemTitles(page)).toEqual(originalOrder);
      await expect(page.getByRole('button', { name: `Flytt ${libraryDrill} opp`, exact: true })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Flytt Taktikk 1 ned', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: 'Flytt Taktikk 1 opp', exact: true }).click();
      expect(await itemTitles(page)).toEqual([libraryDrill, warningDrill, customDrill, 'Taktikk 1', 'Felles beskjed']);
      await page.getByRole('button', { name: 'Flytt Taktikk 1 ned', exact: true }).click();
      expect(await itemTitles(page)).toEqual(originalOrder);
      await page.getByRole('button', { name: 'Flytt Taktikk 1 opp', exact: true }).click();

      const planned = await savedTraining(page);
      await page.reload();
      await openTraining(page);
      await page.getByText(title, { exact: true }).click();
      expect(await savedTraining(page)).toEqual(planned);
      await expect(item(page, 'Felles beskjed').getByText('Samling ved benken.', { exact: true })).toBeVisible();
      expect(await itemTitles(page)).toEqual([libraryDrill, warningDrill, customDrill, 'Taktikk 1', 'Felles beskjed']);

      // Kontroller nedtelling og pause med nettleserens klokke, uten minuttlange ventetider.
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
      await item(page, customDrill).getByRole('button', { name: 'Start øvelse (1 min)', exact: true }).click();
      await expect(page.getByText('1:00', { exact: true })).toBeVisible();
      await page.clock.runFor(2000);
      await expect(page.getByText('0:58', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await page.clock.runFor(5000);
      await expect(page.getByText('0:58', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Fortsett', exact: true }).click();
      await page.clock.runFor(1000);
      await expect(page.getByText('0:57', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
      await expect(page.getByText('Pågående øvelse', { exact: true })).toHaveCount(0);
      await expect(item(page, customDrill).getByText('Fullført', { exact: true })).toHaveCount(0);
      await item(page, customDrill).getByRole('button', { name: 'Start øvelse (1 min)', exact: true }).click();
      await expect(page.getByText('1:00', { exact: true })).toBeVisible();
      // Punkter med tid fullføres når klokka når null; de har ingen egen fullfør-knapp.
      // La React vise hvert sekund før neste steg, slik at effektene rekker å oppdateres.
      for (let seconds = 59; seconds > 0; seconds--) {
        await page.clock.runFor(1000);
        await expect(page.getByText(`0:${String(seconds).padStart(2, '0')}`, { exact: true })).toBeVisible();
      }
      await page.clock.runFor(1000);
      await expect(item(page, customDrill).getByText('Fullført', { exact: true })).toBeVisible();
      await expect(page.getByText('Pågående øvelse', { exact: true })).toHaveCount(0);
      await page.clock.resume();

      // Bare grensen mot operativsystemets delingsark/utklippstavle erstattes.
      // Resten av flyten, inkludert selve delingsteksten, kjøres i appen.
      const shared: string[] = [];
      await page.exposeFunction('captureTrainingShare', (text: string) => shared.push(text));
      await page.evaluate(mobile => {
        const capture = (window as unknown as { captureTrainingShare: (text: string) => Promise<void> }).captureTrainingShare;
        Object.defineProperty(navigator, 'share', { configurable: true,
          value: mobile ? ({ text }: { text: string }) => capture(text) : undefined });
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: capture } });
      }, viewport.name === 'mobil');
      await page.getByRole('button', { name: 'Del økten', exact: true }).click();
      await expect.poll(() => shared.length).toBe(1);
      expect(shared[0].split('\n')).toEqual([
        'Treningsøkt 18. okt. – 39 min',
        `1. ${libraryDrill} (10 min)`, `2. ${warningDrill} (15 min)`,
        `3. ${customDrill} (1 min)`, '4. Taktikk 1 (8 min)', '5. Felles beskjed (5 min)',
      ]);
      if (viewport.name === 'desktop') await expect(page.getByRole('status')).toHaveText('Kopiert – lim inn i en melding.');
      await page.getByRole('button', { name: 'Slett Felles beskjed', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Felles beskjed', exact: true })).toHaveCount(0);
      await expect(page.getByText('Total tid', { exact: false })).toHaveText('Total tid 34 min');

      const beforeReload = await savedTraining(page);
      expect(beforeReload.rosterNames).toEqual(['Ola', 'Kari', 'Ada']);
      expect(beforeReload.events[0]).toMatchObject({ title, date: '2026-10-18', time: '18:30',
        location: 'Testbanen', teamNote: 'Husk drikke og korte pauser.', attendance: ['Ola', 'Ada'] });
      await page.reload();
      await openTraining(page);
      await page.getByText(title, { exact: true }).click();
      expect(await savedTraining(page)).toEqual(beforeReload);
      await expect(generalNote).toHaveValue('Husk drikke og korte pauser.');
      await expect(page.getByText('Testbanen', { exact: true })).toBeVisible();
      await expect(page.getByText('18:30', { exact: true })).toBeVisible();
      await expect(item(page, warningDrill).getByText(warning, { exact: false })).toBeVisible();
      await expect(item(page, customDrill).getByText('Spill ballen rundt sirkelen.', { exact: true })).toBeVisible();
      await expect(item(page, customDrill).getByText('Fullført', { exact: true })).toBeVisible();
      await expect(item(page, customDrill).getByRole('button', { name: /Start øvelse/ })).toHaveCount(0);
      await expect(page.getByRole('spinbutton', { name: 'Minutter for Taktikk 1', exact: true })).toHaveValue('8');
      expect(await itemTitles(page)).toEqual([libraryDrill, warningDrill, customDrill, 'Taktikk 1']);
      await expect(page.getByText('Total tid', { exact: false })).toHaveText('Total tid 34 min');
      await page.getByRole('button', { name: 'Fremmøte (2/3)', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Ada', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Per', exact: true })).toHaveCount(0);
      // Avkryssingene overlevde: ett nytt trykk fjerner bare Ola.
      await page.getByRole('button', { name: 'Ola', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Fremmøte (1/3)', exact: true })).toBeVisible();
      expect((await savedTraining(page)).events[0].attendance).toEqual(['Ada']);
      expect(errors, 'Ingen krasj i brukerflyten').toEqual([]);
    });
  });
}
