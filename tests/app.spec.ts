import { test, expect } from '@playwright/test';

test.describe('Zaliczenie - Pełny cykl CRUD PrismBoard', () => {

  // Generujemy unikalne nazwy, aby testy nie "biły się" ze starymi danymi
  const id = Date.now().toString().slice(-4); 
  const projectName = `PROJEKT_${id}`;
  const storyName = `STORY_${id}`;
  const taskName = `ZADANIE_${id}`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Włączamy tryb testowy i odświeżamy
    await page.evaluate(() => { window.localStorage.setItem('E2E_TEST_MODE', 'true'); });
    await page.reload();
    
    // Czekamy na załadowanie aplikacji
    await expect(page.getByText('PrismBoard').first()).toBeVisible({ timeout: 10000 });
  });

  test('Powinien wykonać pełny cykl: Tworzenie -> Edycja -> Zmiana Statusu -> Usuwanie', async ({ page }) => {
    
    // ==========================================
    // 1. UTWORZENIE (Projekt, Historyjka, Zadanie)
    // ==========================================
    
    // Tworzenie Projektu
    await page.getByPlaceholder('Nazwa projektu').first().fill(projectName);
    await page.getByPlaceholder('Opis projektu').first().fill('Opis E2E');
    await page.getByRole('button', { name: 'Utwórz projekt' }).first().click();
    await expect(page.getByText(projectName).first()).toBeVisible();

    // Edycja Projektu (Zadanie: Edycja projektu)
    await page.locator('div').filter({ hasText: projectName }).getByRole('button', { name: 'Edytuj' }).first().click();
    await page.getByPlaceholder('Nazwa projektu').first().fill(`${projectName}_EDIT`);
    await page.getByRole('button', { name: 'Zapisz edycję' }).first().click();
    await expect(page.getByText(`${projectName}_EDIT`).first()).toBeVisible();

    // Otwarcie Projektu
    await page.locator('div').filter({ hasText: `${projectName}_EDIT` }).getByRole('button', { name: 'Otwórz →' }).first().click();

    // Tworzenie Historyjki
    await page.getByPlaceholder('Nazwa historyjki').first().fill(storyName);
    await page.getByRole('button', { name: 'Dodaj historyjkę' }).first().click();
    await expect(page.getByText(storyName).first()).toBeVisible();

    // Edycja Historyjki (Zadanie: Edycja historyjki)
    await page.locator('div').filter({ hasText: storyName }).getByRole('button', { name: 'Edytuj' }).first().click();
    await page.getByPlaceholder('Nazwa historyjki').first().fill(`${storyName}_EDIT`);
    await page.getByRole('button', { name: 'Zapisz' }).first().click();
    await expect(page.getByText(`${storyName}_EDIT`).first()).toBeVisible();

    // Wejście w Zadania
    await page.locator('div').filter({ hasText: `${storyName}_EDIT` }).getByRole('button', { name: 'Zadania' }).first().click();

    // Tworzenie Zadania
    await page.getByPlaceholder('Nazwa zadania').first().fill(taskName);
    await page.getByRole('button', { name: 'Dodaj Zadanie' }).first().click();
    await expect(page.getByText(taskName).first()).toBeVisible();

    // Edycja Zadania (Zadanie: Edycja zadania)
    await page.locator('div').filter({ hasText: taskName }).getByRole('button', { name: 'Edytuj' }).first().click();
    await page.getByPlaceholder('Nazwa zadania').first().fill(`${taskName}_EDIT`);
    await page.getByRole('button', { name: 'Zapisz edycję' }).first().click();
    await expect(page.getByText(`${taskName}_EDIT`).first()).toBeVisible();

    // ==========================================
    // 2. ZMIANA STATUSU ZADANIA
    // ==========================================
    await page.getByText(`${taskName}_EDIT`).first().click(); 
    await page.getByRole('combobox').first().selectOption({ label: 'Dev E2E (developer)' });
    await expect(page.getByRole('button', { name: 'Zakończ zadanie' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Zakończ zadanie' }).first().click();

    // ==========================================
    // 3. USUNIĘCIE (Zadanie, Historyjka, Projekt)
    // ==========================================
    
    // Akceptujemy wszystkie wyskakujące okienka confirm()
    page.on('dialog', dialog => dialog.accept());

    // Usuwanie Zadania
    await page.locator('div').filter({ hasText: `${taskName}_EDIT` }).getByRole('button', { name: 'Usuń' }).first().click();
    await expect(page.getByText(`${taskName}_EDIT`).first()).not.toBeVisible();

    // Powrót do historyjek i usuwanie historyjki
    await page.getByRole('button', { name: '← Powrót do historyjek' }).first().click();
    await page.locator('div').filter({ hasText: `${storyName}_EDIT` }).getByRole('button', { name: 'Usuń' }).first().click();
    await expect(page.getByText(`${storyName}_EDIT`).first()).not.toBeVisible();

    // Powrót do projektów i usuwanie projektu
    await page.getByRole('button', { name: '← Powrót do projektów' }).first().click();
    await page.locator('div').filter({ hasText: `${projectName}_EDIT` }).getByRole('button', { name: 'Usuń' }).first().click();
    await expect(page.getByText(`${projectName}_EDIT`).first()).not.toBeVisible();
  });
});