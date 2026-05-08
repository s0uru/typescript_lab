import { test, expect } from '@playwright/test';

test.describe('Zaliczenie - Pełny cykl CRUD PrismBoard', () => {

  const id = Date.now().toString().slice(-4); 
  const projectName = `PROJEKT_${id}`;
  const storyName = `STORY_${id}`;
  const taskName = `ZADANIE_${id}`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { window.localStorage.setItem('E2E_TEST_MODE', 'true'); });
    await page.reload();
    await expect(page.locator('h1').filter({ hasText: 'PrismBoard' })).toBeVisible({ timeout: 10000 });
  });

  test('Powinien wykonać pełny cykl: Tworzenie -> Edycja -> Zmiana Statusu -> Usuwanie', async ({ page }) => {
    
    // 1. PROJEKT - Utworzenie
    await page.getByPlaceholder('Nazwa projektu').fill(projectName);
    await page.getByPlaceholder('Opis projektu').fill('Opis E2E');
    await page.getByRole('button', { name: 'Utwórz projekt' }).click();
    await page.getByRole('button', { name: 'Rozumiem' }).click(); // CZYŚCIMY OD RAZU
    await expect(page.getByText(projectName).first()).toBeVisible();

    // Projekt - Edycja
    await page.locator('.group').filter({ hasText: projectName }).getByRole('button', { name: 'Edytuj' }).click();
    await page.locator('.fixed').getByPlaceholder('Nazwa projektu').fill(`${projectName}_EDIT`);
    await page.locator('.fixed').getByRole('button', { name: 'Zapisz', exact: true }).click();
    await page.locator('.group').filter({ hasText: `${projectName}_EDIT` }).getByRole('button', { name: 'Otwórz →' }).click();

    // 2. HISTORYJKA - Utworzenie
    await page.getByPlaceholder('Nazwa historyjki').fill(storyName);
    await page.getByRole('button', { name: 'Dodaj historyjkę' }).click();
    await page.getByRole('button', { name: 'Rozumiem' }).click(); // CZYŚCIMY OD RAZU
    await expect(page.getByText(storyName).first()).toBeVisible();

    await page.locator('.rounded-xl').filter({ hasText: storyName }).getByRole('button', { name: 'Zadania' }).click();

    // 3. ZADANIE - Utworzenie
    await page.getByPlaceholder('Nazwa zadania').fill(taskName);
    await page.getByRole('button', { name: 'Dodaj Zadanie' }).click();
    await page.getByRole('button', { name: 'Rozumiem' }).click(); // CZYŚCIMY OD RAZU
    await expect(page.getByText(taskName).first()).toBeVisible();

    // 4. ZADANIE - Przypisanie i Status
    await page.getByText(taskName).first().click(); 
    await page.locator('.fixed').getByRole('combobox').selectOption({ label: 'Jakub Pietrusiak (developer)' });
    
    // Powiadomienie o przypisaniu idzie do developera, u nas (Admina) może nie być modala.
    // Ale zakończenie zadania już tak:
    await page.getByText(taskName).first().click();
    await page.getByRole('button', { name: 'Oznacz jako ZAKOŃCZONE' }).click();
    await page.getByRole('button', { name: 'Rozumiem' }).click();

    // 5. USUWANIE (od najniższego poziomu)
    // Zadanie
    await page.getByText(taskName).first().click();
    await page.getByRole('button', { name: 'Usuń zadanie' }).click();
    await page.getByRole('button', { name: 'Rozumiem' }).click();
    await expect(page.getByText(taskName).first()).not.toBeVisible();

    // Historyjka
    await page.getByRole('button', { name: '← Powrót do historyjek' }).click();
    await page.locator('.rounded-xl').filter({ hasText: storyName }).getByRole('button', { name: 'Usuń' }).click();
    await page.getByRole('button', { name: 'Rozumiem' }).click();
    await expect(page.getByText(storyName).first()).not.toBeVisible();
    
    // Projekt
    await page.getByRole('button', { name: '← Powrót do projektów' }).click();
    // Szukamy dokładnie naszego projektu z dopiskiem _EDIT
    const targetProject = page.locator('.group').filter({ hasText: `${projectName}_EDIT` });
    await targetProject.getByRole('button', { name: 'Usuń' }).click();
    
    // Jeśli modal się pojawi, zamknij go. Jeśli nie (bo np. adminów jest wielu), asercja i tak sprawdzi wynik.
    if (await page.getByRole('button', { name: 'Rozumiem' }).isVisible()) {
        await page.getByRole('button', { name: 'Rozumiem' }).click();
    }
    
    await expect(page.getByText(`${projectName}_EDIT`).first()).not.toBeVisible();
  });
});