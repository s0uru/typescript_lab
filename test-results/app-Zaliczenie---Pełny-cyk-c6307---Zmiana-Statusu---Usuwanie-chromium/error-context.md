# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Zaliczenie - Pełny cykl CRUD PrismBoard >> Powinien wykonać pełny cykl: Tworzenie -> Edycja -> Zmiana Statusu -> Usuwanie
- Location: tests\app.spec.ts:21:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Zapisz edycję' }).first()
    - locator resolved to <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/30">Zapisz edycję</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-slate-900/60">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-slate-900/60">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    47 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-slate-900/60">…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - generic [ref=e6]:
      - heading "PrismBoard" [level=1] [ref=e7] [cursor=pointer]
      - button "Użytkownicy" [ref=e8]
    - generic [ref=e9]:
      - button "🔔 5" [ref=e10]:
        - text: 🔔
        - generic [ref=e11]: "5"
      - button "☀️" [ref=e12]
      - generic [ref=e13]:
        - paragraph [ref=e14]: Tester E2E
        - button "Wyloguj" [ref=e15]
  - generic [ref=e16]:
    - generic [ref=e18]:
      - heading "Edytuj Projekt" [level=2] [ref=e19]
      - generic [ref=e20]:
        - textbox "Nazwa projektu" [active] [ref=e21]: PROJEKT_7960_EDIT
        - textbox "Opis projektu" [ref=e22]: Opis dla projektu testowego
        - button "Zapisz edycję" [ref=e23]
        - button "Anuluj" [ref=e24]
    - generic [ref=e25]:
      - heading "Twoje Projekty" [level=2] [ref=e26]
      - generic [ref=e27]:
        - generic [ref=e28]:
          - heading "E2E Projekt Testowy" [level=3] [ref=e29]
          - paragraph [ref=e30]: Opis dla projektu testowego
          - generic [ref=e31]:
            - generic [ref=e32]:
              - button "Usuń" [ref=e33]
              - button "Edytuj" [ref=e34]
            - button "Otwórz →" [ref=e35]
        - generic [ref=e36]:
          - heading "Projekt_0282" [level=3] [ref=e37]
          - paragraph
          - generic [ref=e38]:
            - generic [ref=e39]:
              - button "Usuń" [ref=e40]
              - button "Edytuj" [ref=e41]
            - button "Otwórz →" [ref=e42]
        - generic [ref=e43]:
          - heading "PROJEKT_7960" [level=3] [ref=e44]
          - paragraph [ref=e45]: Opis E2E
          - generic [ref=e46]:
            - generic [ref=e47]:
              - button "Usuń" [ref=e48]
              - button "Edytuj" [ref=e49]
            - button "Otwórz →" [ref=e50]
        - generic [ref=e51]:
          - heading "E2E Projekt Testowy" [level=3] [ref=e52]
          - paragraph [ref=e53]: Opis dla projektu testowego
          - generic [ref=e54]:
            - generic [ref=e55]:
              - button "Usuń" [ref=e56]
              - button "Edytuj" [ref=e57]
            - button "Otwórz →" [ref=e58]
  - generic [ref=e60]:
    - heading "Nowy Projekt" [level=3] [ref=e61]
    - paragraph [ref=e62]: "Utworzono projekt: PROJEKT_7960"
    - button "Rozumiem" [ref=e63]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Zaliczenie - Pełny cykl CRUD PrismBoard', () => {
  4  | 
  5  |   // Generujemy unikalne nazwy, aby testy nie "biły się" ze starymi danymi
  6  |   const id = Date.now().toString().slice(-4); 
  7  |   const projectName = `PROJEKT_${id}`;
  8  |   const storyName = `STORY_${id}`;
  9  |   const taskName = `ZADANIE_${id}`;
  10 | 
  11 |   test.beforeEach(async ({ page }) => {
  12 |     await page.goto('/');
  13 |     // Włączamy tryb testowy i odświeżamy
  14 |     await page.evaluate(() => { window.localStorage.setItem('E2E_TEST_MODE', 'true'); });
  15 |     await page.reload();
  16 |     
  17 |     // Czekamy na załadowanie aplikacji
  18 |     await expect(page.getByText('PrismBoard').first()).toBeVisible({ timeout: 10000 });
  19 |   });
  20 | 
  21 |   test('Powinien wykonać pełny cykl: Tworzenie -> Edycja -> Zmiana Statusu -> Usuwanie', async ({ page }) => {
  22 |     
  23 |     // ==========================================
  24 |     // 1. UTWORZENIE (Projekt, Historyjka, Zadanie)
  25 |     // ==========================================
  26 |     
  27 |     // Tworzenie Projektu
  28 |     await page.getByPlaceholder('Nazwa projektu').first().fill(projectName);
  29 |     await page.getByPlaceholder('Opis projektu').first().fill('Opis E2E');
  30 |     await page.getByRole('button', { name: 'Utwórz projekt' }).first().click();
  31 |     await expect(page.getByText(projectName).first()).toBeVisible();
  32 | 
  33 |     // Edycja Projektu (Zadanie: Edycja projektu)
  34 |     await page.locator('div').filter({ hasText: projectName }).getByRole('button', { name: 'Edytuj' }).first().click();
  35 |     await page.getByPlaceholder('Nazwa projektu').first().fill(`${projectName}_EDIT`);
> 36 |     await page.getByRole('button', { name: 'Zapisz edycję' }).first().click();
     |                                                                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  37 |     await expect(page.getByText(`${projectName}_EDIT`).first()).toBeVisible();
  38 | 
  39 |     // Otwarcie Projektu
  40 |     await page.locator('div').filter({ hasText: `${projectName}_EDIT` }).getByRole('button', { name: 'Otwórz →' }).first().click();
  41 | 
  42 |     // Tworzenie Historyjki
  43 |     await page.getByPlaceholder('Nazwa historyjki').first().fill(storyName);
  44 |     await page.getByRole('button', { name: 'Dodaj historyjkę' }).first().click();
  45 |     await expect(page.getByText(storyName).first()).toBeVisible();
  46 | 
  47 |     // Edycja Historyjki (Zadanie: Edycja historyjki)
  48 |     await page.locator('div').filter({ hasText: storyName }).getByRole('button', { name: 'Edytuj' }).first().click();
  49 |     await page.getByPlaceholder('Nazwa historyjki').first().fill(`${storyName}_EDIT`);
  50 |     await page.getByRole('button', { name: 'Zapisz' }).first().click();
  51 |     await expect(page.getByText(`${storyName}_EDIT`).first()).toBeVisible();
  52 | 
  53 |     // Wejście w Zadania
  54 |     await page.locator('div').filter({ hasText: `${storyName}_EDIT` }).getByRole('button', { name: 'Zadania' }).first().click();
  55 | 
  56 |     // Tworzenie Zadania
  57 |     await page.getByPlaceholder('Nazwa zadania').first().fill(taskName);
  58 |     await page.getByRole('button', { name: 'Dodaj Zadanie' }).first().click();
  59 |     await expect(page.getByText(taskName).first()).toBeVisible();
  60 | 
  61 |     // Edycja Zadania (Zadanie: Edycja zadania)
  62 |     await page.locator('div').filter({ hasText: taskName }).getByRole('button', { name: 'Edytuj' }).first().click();
  63 |     await page.getByPlaceholder('Nazwa zadania').first().fill(`${taskName}_EDIT`);
  64 |     await page.getByRole('button', { name: 'Zapisz edycję' }).first().click();
  65 |     await expect(page.getByText(`${taskName}_EDIT`).first()).toBeVisible();
  66 | 
  67 |     // ==========================================
  68 |     // 2. ZMIANA STATUSU ZADANIA
  69 |     // ==========================================
  70 |     await page.getByText(`${taskName}_EDIT`).first().click(); 
  71 |     await page.getByRole('combobox').first().selectOption({ label: 'Dev E2E (developer)' });
  72 |     await expect(page.getByRole('button', { name: 'Zakończ zadanie' }).first()).toBeVisible();
  73 |     await page.getByRole('button', { name: 'Zakończ zadanie' }).first().click();
  74 | 
  75 |     // ==========================================
  76 |     // 3. USUNIĘCIE (Zadanie, Historyjka, Projekt)
  77 |     // ==========================================
  78 |     
  79 |     // Akceptujemy wszystkie wyskakujące okienka confirm()
  80 |     page.on('dialog', dialog => dialog.accept());
  81 | 
  82 |     // Usuwanie Zadania
  83 |     await page.locator('div').filter({ hasText: `${taskName}_EDIT` }).getByRole('button', { name: 'Usuń' }).first().click();
  84 |     await expect(page.getByText(`${taskName}_EDIT`).first()).not.toBeVisible();
  85 | 
  86 |     // Powrót do historyjek i usuwanie historyjki
  87 |     await page.getByRole('button', { name: '← Powrót do historyjek' }).first().click();
  88 |     await page.locator('div').filter({ hasText: `${storyName}_EDIT` }).getByRole('button', { name: 'Usuń' }).first().click();
  89 |     await expect(page.getByText(`${storyName}_EDIT`).first()).not.toBeVisible();
  90 | 
  91 |     // Powrót do projektów i usuwanie projektu
  92 |     await page.getByRole('button', { name: '← Powrót do projektów' }).first().click();
  93 |     await page.locator('div').filter({ hasText: `${projectName}_EDIT` }).getByRole('button', { name: 'Usuń' }).first().click();
  94 |     await expect(page.getByText(`${projectName}_EDIT`).first()).not.toBeVisible();
  95 |   });
  96 | });
```