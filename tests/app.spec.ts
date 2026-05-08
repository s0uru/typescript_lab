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
    
    // Czekamy na załadowanie aplikacji (szukamy nagłówka na górze)
    await expect(page.locator('h1').filter({ hasText: 'PrismBoard' })).toBeVisible({ timeout: 10000 });
  });

  test('Powinien wykonać pełny cykl: Tworzenie -> Edycja -> Zmiana Statusu -> Usuwanie', async ({ page }) => {
    
    // ==========================================
    // 1. UTWORZENIE (Projekt, Historyjka, Zadanie)
    // ==========================================
    
    // Tworzenie Projektu
    await page.getByPlaceholder('Nazwa projektu').fill(projectName);
    await page.getByPlaceholder('Opis projektu').fill('Opis E2E');
    await page.getByRole('button', { name: 'Utwórz projekt' }).click();
    await expect(page.getByText(projectName).first()).toBeVisible();

    // Edycja Projektu
    await page.locator('.group').filter({ hasText: projectName }).getByRole('button', { name: 'Edytuj' }).click();
    await page.getByPlaceholder('Nazwa projektu').fill(`${projectName}_EDIT`);
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();
    await expect(page.getByText(`${projectName}_EDIT`).first()).toBeVisible();

    // Otwarcie Projektu
    await page.locator('.group').filter({ hasText: `${projectName}_EDIT` }).getByRole('button', { name: 'Otwórz →' }).click();

    // Tworzenie Historyjki
    await page.getByPlaceholder('Nazwa historyjki').fill(storyName);
    await page.getByRole('button', { name: 'Dodaj historyjkę' }).click();
    await expect(page.getByText(storyName).first()).toBeVisible();

    // Edycja Historyjki
    await page.locator('.rounded-xl').filter({ hasText: storyName }).getByRole('button', { name: 'Edytuj' }).click();
    await page.getByPlaceholder('Nazwa historyjki').fill(`${storyName}_EDIT`);
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();
    await expect(page.getByText(`${storyName}_EDIT`).first()).toBeVisible();

    // Wejście w Zadania
    await page.locator('.rounded-xl').filter({ hasText: `${storyName}_EDIT` }).getByRole('button', { name: 'Zadania' }).click();

    // Tworzenie Zadania
    await page.getByPlaceholder('Nazwa zadania').fill(taskName);
    await page.getByRole('button', { name: 'Dodaj Zadanie' }).click();
    await expect(page.getByText(taskName).first()).toBeVisible();

    // Edycja Zadania (wymaga kliknięcia w zadanie, by otworzyć modal szczegółów)
    await page.getByText(taskName).first().click();
    await page.getByRole('button', { name: 'Edytuj zadanie' }).click();
    // Modal edycji zadania jest teraz otwarty
    await page.getByPlaceholder('Nazwa zadania').fill(`${taskName}_EDIT`);
    await page.getByRole('button', { name: 'Zapisz', exact: true }).click();
    await expect(page.getByText(`${taskName}_EDIT`).first()).toBeVisible();


    // ==========================================
    // 2. ZMIANA STATUSU ZADANIA
    // ==========================================
    
    // Otwieramy zadanie ponownie
    await page.getByText(`${taskName}_EDIT`).first().click(); 
    // Przypisanie użytkownika automatycznie przenosi do kolumny DOING i zamyka modal
    await page.getByRole('combobox').selectOption({ label: 'Dev E2E (developer)' });
    
    // Modal po przypisaniu sam się zamknął. Otwieramy je jeszcze raz żeby kliknąć "Zakończ"
    await page.getByText(`${taskName}_EDIT`).first().click();
    await expect(page.getByRole('button', { name: 'Oznacz jako ZAKOŃCZONE' })).toBeVisible();
    await page.getByRole('button', { name: 'Oznacz jako ZAKOŃCZONE' }).click();


    // ==========================================
    // 3. USUNIĘCIE (Zadanie, Historyjka, Projekt)
    // ==========================================
    
    // Zadanie po zakończeniu zamknęło modal. Otwieramy by je usunąć
    await page.getByText(`${taskName}_EDIT`).first().click();
    await page.getByRole('button', { name: 'Usuń zadanie' }).click();
    // Sprawdzamy czy zniknęło
    await expect(page.getByText(`${taskName}_EDIT`).first()).not.toBeVisible();

    // Powrót do historyjek i usuwanie historyjki
    await page.getByRole('button', { name: '← Powrót do historyjek' }).click();
    await page.locator('.rounded-xl').filter({ hasText: `${storyName}_EDIT` }).getByRole('button', { name: 'Usuń' }).click();
    await expect(page.getByText(`${storyName}_EDIT`).first()).not.toBeVisible();

    // Powrót do projektów i usuwanie projektu
    await page.getByRole('button', { name: '← Powrót do projektów' }).click();
    await page.locator('.group').filter({ hasText: `${projectName}_EDIT` }).getByRole('button', { name: 'Usuń' }).click();
    await expect(page.getByText(`${projectName}_EDIT`).first()).not.toBeVisible();
  });
});