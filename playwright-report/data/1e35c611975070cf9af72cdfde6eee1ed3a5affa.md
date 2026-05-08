# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Zaliczenie - Pełny cykl CRUD PrismBoard >> Powinien wykonać pełny cykl: Tworzenie -> Edycja -> Zmiana Statusu -> Usuwanie
- Location: tests\app.spec.ts:21:3

# Error details

```
Error: locator.fill: Error: strict mode violation: getByPlaceholder('Nazwa projektu') resolved to 2 elements:
    1) <input value="" placeholder="Nazwa projektu" class="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 ring-blue-500 outline-none transition-all dark:text-white"/> aka locator('form').filter({ hasText: 'Utwórz projekt' }).getByPlaceholder('Nazwa projektu')
    2) <input required="" value="PROJEKT_4493" placeholder="Nazwa projektu" class="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 ring-blue-500 outline-none transition-all dark:text-white"/> aka locator('form').filter({ hasText: 'Opis E2EAnulujZapisz' }).getByPlaceholder('Nazwa projektu')

Call log:
  - waiting for getByPlaceholder('Nazwa projektu')

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
        - generic [ref=e14]:
          - paragraph [ref=e15]: Tester E2E
          - text: admin
        - button "Wyloguj" [ref=e16]
  - generic [ref=e17]:
    - generic [ref=e19]:
      - heading "Nowy Projekt" [level=2] [ref=e20]
      - generic [ref=e21]:
        - textbox "Nazwa projektu" [ref=e22]
        - textbox "Opis projektu" [ref=e23]
        - button "Utwórz projekt" [ref=e24]
    - generic [ref=e25]:
      - heading "Twoje Projekty" [level=2] [ref=e26]
      - generic [ref=e27]:
        - generic [ref=e28]:
          - heading "ddd" [level=3] [ref=e29]
          - paragraph [ref=e30]: d
          - generic [ref=e31]:
            - button "Edytuj" [ref=e32]
            - button "Usuń" [ref=e33]
            - button "Otwórz →" [ref=e34]
        - generic [ref=e35]:
          - heading "PROJEKT_4493" [level=3] [ref=e36]
          - paragraph [ref=e37]: Opis E2E
          - generic [ref=e38]:
            - button "Edytuj" [active] [ref=e39]
            - button "Usuń" [ref=e40]
            - button "Otwórz →" [ref=e41]
  - generic [ref=e43]:
    - heading "Edytuj Projekt" [level=3] [ref=e44]
    - generic [ref=e45]:
      - textbox "Nazwa projektu" [ref=e46]: PROJEKT_4493
      - textbox "Opis projektu" [ref=e47]: Opis E2E
      - generic [ref=e48]:
        - button "Anuluj" [ref=e49]
        - button "Zapisz" [ref=e50]
  - generic [ref=e52]:
    - generic [ref=e53]: high Priority
    - heading "Nowy Projekt" [level=3] [ref=e54]
    - paragraph [ref=e55]: "Utworzono projekt: PROJEKT_4493"
    - button "Rozumiem" [ref=e56]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Zaliczenie - Pełny cykl CRUD PrismBoard', () => {
  4   | 
  5   |   // Generujemy unikalne nazwy, aby testy nie "biły się" ze starymi danymi
  6   |   const id = Date.now().toString().slice(-4); 
  7   |   const projectName = `PROJEKT_${id}`;
  8   |   const storyName = `STORY_${id}`;
  9   |   const taskName = `ZADANIE_${id}`;
  10  | 
  11  |   test.beforeEach(async ({ page }) => {
  12  |     await page.goto('/');
  13  |     // Włączamy tryb testowy i odświeżamy
  14  |     await page.evaluate(() => { window.localStorage.setItem('E2E_TEST_MODE', 'true'); });
  15  |     await page.reload();
  16  |     
  17  |     // Czekamy na załadowanie aplikacji (szukamy nagłówka na górze)
  18  |     await expect(page.locator('h1').filter({ hasText: 'PrismBoard' })).toBeVisible({ timeout: 10000 });
  19  |   });
  20  | 
  21  |   test('Powinien wykonać pełny cykl: Tworzenie -> Edycja -> Zmiana Statusu -> Usuwanie', async ({ page }) => {
  22  |     
  23  |     // ==========================================
  24  |     // 1. UTWORZENIE (Projekt, Historyjka, Zadanie)
  25  |     // ==========================================
  26  |     
  27  |     // Tworzenie Projektu
  28  |     await page.getByPlaceholder('Nazwa projektu').fill(projectName);
  29  |     await page.getByPlaceholder('Opis projektu').fill('Opis E2E');
  30  |     await page.getByRole('button', { name: 'Utwórz projekt' }).click();
  31  |     await expect(page.getByText(projectName).first()).toBeVisible();
  32  | 
  33  |     // Edycja Projektu
  34  |     await page.locator('.group').filter({ hasText: projectName }).getByRole('button', { name: 'Edytuj' }).click();
> 35  |     await page.getByPlaceholder('Nazwa projektu').fill(`${projectName}_EDIT`);
      |                                                   ^ Error: locator.fill: Error: strict mode violation: getByPlaceholder('Nazwa projektu') resolved to 2 elements:
  36  |     await page.getByRole('button', { name: 'Zapisz', exact: true }).click();
  37  |     await expect(page.getByText(`${projectName}_EDIT`).first()).toBeVisible();
  38  | 
  39  |     // Otwarcie Projektu
  40  |     await page.locator('.group').filter({ hasText: `${projectName}_EDIT` }).getByRole('button', { name: 'Otwórz →' }).click();
  41  | 
  42  |     // Tworzenie Historyjki
  43  |     await page.getByPlaceholder('Nazwa historyjki').fill(storyName);
  44  |     await page.getByRole('button', { name: 'Dodaj historyjkę' }).click();
  45  |     await expect(page.getByText(storyName).first()).toBeVisible();
  46  | 
  47  |     // Edycja Historyjki
  48  |     await page.locator('.rounded-xl').filter({ hasText: storyName }).getByRole('button', { name: 'Edytuj' }).click();
  49  |     await page.getByPlaceholder('Nazwa historyjki').fill(`${storyName}_EDIT`);
  50  |     await page.getByRole('button', { name: 'Zapisz', exact: true }).click();
  51  |     await expect(page.getByText(`${storyName}_EDIT`).first()).toBeVisible();
  52  | 
  53  |     // Wejście w Zadania
  54  |     await page.locator('.rounded-xl').filter({ hasText: `${storyName}_EDIT` }).getByRole('button', { name: 'Zadania' }).click();
  55  | 
  56  |     // Tworzenie Zadania
  57  |     await page.getByPlaceholder('Nazwa zadania').fill(taskName);
  58  |     await page.getByRole('button', { name: 'Dodaj Zadanie' }).click();
  59  |     await expect(page.getByText(taskName).first()).toBeVisible();
  60  | 
  61  |     // Edycja Zadania (wymaga kliknięcia w zadanie, by otworzyć modal szczegółów)
  62  |     await page.getByText(taskName).first().click();
  63  |     await page.getByRole('button', { name: 'Edytuj zadanie' }).click();
  64  |     // Modal edycji zadania jest teraz otwarty
  65  |     await page.getByPlaceholder('Nazwa zadania').fill(`${taskName}_EDIT`);
  66  |     await page.getByRole('button', { name: 'Zapisz', exact: true }).click();
  67  |     await expect(page.getByText(`${taskName}_EDIT`).first()).toBeVisible();
  68  | 
  69  | 
  70  |     // ==========================================
  71  |     // 2. ZMIANA STATUSU ZADANIA
  72  |     // ==========================================
  73  |     
  74  |     // Otwieramy zadanie ponownie
  75  |     await page.getByText(`${taskName}_EDIT`).first().click(); 
  76  |     // Przypisanie użytkownika automatycznie przenosi do kolumny DOING i zamyka modal
  77  |     await page.getByRole('combobox').selectOption({ label: 'Dev E2E (developer)' });
  78  |     
  79  |     // Modal po przypisaniu sam się zamknął. Otwieramy je jeszcze raz żeby kliknąć "Zakończ"
  80  |     await page.getByText(`${taskName}_EDIT`).first().click();
  81  |     await expect(page.getByRole('button', { name: 'Oznacz jako ZAKOŃCZONE' })).toBeVisible();
  82  |     await page.getByRole('button', { name: 'Oznacz jako ZAKOŃCZONE' }).click();
  83  | 
  84  | 
  85  |     // ==========================================
  86  |     // 3. USUNIĘCIE (Zadanie, Historyjka, Projekt)
  87  |     // ==========================================
  88  |     
  89  |     // Zadanie po zakończeniu zamknęło modal. Otwieramy by je usunąć
  90  |     await page.getByText(`${taskName}_EDIT`).first().click();
  91  |     await page.getByRole('button', { name: 'Usuń zadanie' }).click();
  92  |     // Sprawdzamy czy zniknęło
  93  |     await expect(page.getByText(`${taskName}_EDIT`).first()).not.toBeVisible();
  94  | 
  95  |     // Powrót do historyjek i usuwanie historyjki
  96  |     await page.getByRole('button', { name: '← Powrót do historyjek' }).click();
  97  |     await page.locator('.rounded-xl').filter({ hasText: `${storyName}_EDIT` }).getByRole('button', { name: 'Usuń' }).click();
  98  |     await expect(page.getByText(`${storyName}_EDIT`).first()).not.toBeVisible();
  99  | 
  100 |     // Powrót do projektów i usuwanie projektu
  101 |     await page.getByRole('button', { name: '← Powrót do projektów' }).click();
  102 |     await page.locator('.group').filter({ hasText: `${projectName}_EDIT` }).getByRole('button', { name: 'Usuń' }).click();
  103 |     await expect(page.getByText(`${projectName}_EDIT`).first()).not.toBeVisible();
  104 |   });
  105 | });
```