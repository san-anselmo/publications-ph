import { test, expect } from '@playwright/test';

test.describe('San Anselmo Publications E2E Tests', () => {
  test('should load catalog and verify page elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window._initCompleted === true);
    await expect(page).toHaveTitle(/San Anselmo Publications/);

    const title = page.locator('.page-title');
    await expect(title).toBeVisible();

    const grid = page.locator('#catalogGrid');
    await expect(grid).toBeVisible();
  });

  test('should allow searching for a book', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window._initCompleted === true);

    await page.waitForSelector('#catalogGrid .book-card');
    const searchInput = page.locator('#searchInput');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Santelmo');

    const bookCard = page.locator('#catalogGrid .book-card').first();
    await expect(bookCard).toBeVisible();
  });

  test('should open details modal on book click', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window._initCompleted === true);

    await page.waitForSelector('#catalogGrid .book-card');
    const firstCard = page.locator('#catalogGrid .book-card').first();
    await firstCard.click();

    const modal = page.locator('#detailModal');
    await expect(modal).toBeVisible();

    const closeBtn = page.locator('#detailModalCloseBtn');
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('should toggle dark mode and accessibility options in settings panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window._initCompleted === true);

    const toggleBtn = page.locator('#settingsToggleBtn');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    const settingsPanel = page.locator('#settingsPanel');
    await expect(settingsPanel).toBeVisible();

    const themeBtn = page.locator('#panelThemeToggleBtn');
    await expect(themeBtn).toBeVisible();

    // Toggle theme
    const body = page.locator('body');
    const wasDark = await body.evaluate(el => el.classList.contains('dark'));
    await themeBtn.click();
    if (wasDark) {
      await expect(body).not.toHaveClass(/dark/);
    } else {
      await expect(body).toHaveClass(/dark/);
    }

    // Open accessibility accordion
    const accordionBtn = page.locator('#a11yAccordionTrigger');
    await expect(accordionBtn).toBeVisible();
    await accordionBtn.click();

    // Toggle font style
    const serifBtn = page.locator('[data-a11y-font="serif"]');
    await serifBtn.click();
    await expect(body).toHaveClass(/a11y-font-serif/);

    const defaultFontBtn = page.locator('[data-a11y-font="default"]');
    await defaultFontBtn.click();
    await expect(body).not.toHaveClass(/a11y-font-serif/);

    // Escape closes panel
    await page.keyboard.press('Escape');
    await expect(settingsPanel).not.toBeVisible();
  });

  test('should verify inline bookshelf expand/collapse toggle and see-all button states', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window._initCompleted === true);

    // Wait for the shelves to render
    await page.waitForSelector('.shelf-section');

    const shelfSections = page.locator('.shelf-section');
    const count = await shelfSections.count();
    expect(count).toBeGreaterThan(0);

    let foundLargeShelf = false;
    for (let i = 0; i < count; i++) {
      const section = shelfSections.nth(i);
      const dataCountAttr = await section.getAttribute('data-count');
      const dataCount = parseInt(dataCountAttr || '0', 10);

      // On desktop, columns = 6, so a large shelf has data-count > 6
      if (dataCount > 6) {
        foundLargeShelf = true;

        const shelfRow = section.locator('.shelf-row-books');
        const seeAllBtn = section.locator('.shelf-see-all');
        const cards = shelfRow.locator('.book-card');

        // Initially collapsed: see-all button shows "SEE ALL"
        await expect(seeAllBtn).toBeVisible();
        await expect(seeAllBtn).toHaveAttribute('aria-expanded', 'false');
        await expect(seeAllBtn).toContainText('SEE ALL');

        // The 6th card (index 5) should have the overlay
        const targetCard = cards.nth(5);
        const overlay = targetCard.locator('.shelf-more-overlay');
        await expect(overlay).toBeVisible();

        const expectedNum = `+${dataCount - 6}`;
        await expect(overlay.locator('.more-num')).toContainText(expectedNum);
        await expect(overlay.locator('.more-lbl')).toContainText('more titles');

        // Height should be restricted (collapsed)
        const collapsedHeight = await shelfRow.evaluate(el => el.getBoundingClientRect().height);
        expect(collapsedHeight).toBeLessThanOrEqual(360); // 350px max-height + borders/padding

        // Clicking the overlay triggers expansion
        await overlay.click();

        // Expanded state checks
        await expect(seeAllBtn).toHaveAttribute('aria-expanded', 'true');
        await expect(seeAllBtn).toContainText('SHOW LESS');
        await expect(shelfRow).toHaveClass(/expanded/);

        // Overlay should be removed
        await expect(overlay).not.toBeVisible();

        // Height should be larger now since more books are appended in grid
        const expandedHeight = await shelfRow.evaluate(el => el.getBoundingClientRect().height);
        expect(expandedHeight).toBeGreaterThan(collapsedHeight);

        // Click see-all button again to collapse
        await seeAllBtn.click();

        // Collapsed state checks again
        await expect(seeAllBtn).toHaveAttribute('aria-expanded', 'false');
        await expect(seeAllBtn).toContainText('SEE ALL');
        await expect(shelfRow).not.toHaveClass(/expanded/);

        // Overlay should be restored
        await expect(overlay).toBeVisible();
        await expect(overlay.locator('.more-num')).toContainText(expectedNum);
        break;
      }
    }
    expect(foundLargeShelf).toBe(true);
  });
});

