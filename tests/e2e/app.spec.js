import { expect, test } from '@playwright/test';

test('loads the notes workspace shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Plain', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /create new note/i }).first(),
  ).toBeVisible();
});

test('can create, trash, and restore a note', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('button', { name: /create new note/i })
    .first()
    .click();
  await page.getByLabel('Note Title').fill('Release checklist');

  await expect(
    page.getByRole('button', { name: /select note: release checklist/i }),
  ).toBeVisible();

  await page.getByRole('button', { name: /move note to trash/i }).click();
  await page.locator('button[title="View trash"]:visible').click();

  await expect(
    page.getByRole('button', { name: /restore note/i }),
  ).toBeVisible();

  await page.getByRole('button', { name: /restore note/i }).click();
  await page.locator('button[title="View notes"]:visible').click();

  await expect(
    page.getByRole('button', { name: /select note: release checklist/i }),
  ).toBeVisible();
});

test('sidebar note list stays scrollable when many notes exist', async ({
  page,
}) => {
  await page.goto('/');

  const createButton = page
    .getByRole('button', { name: /create new note/i })
    .first();

  for (let index = 0; index < 20; index += 1) {
    await createButton.click();
  }

  const noteButtons = page.getByRole('button', { name: /select note:/i });
  expect(await noteButtons.count()).toBeGreaterThan(10);

  const scrollState = await noteButtons.last().evaluate((node) => {
    let current = node.parentElement;

    while (current) {
      const { overflowY } = window.getComputedStyle(current);
      const canScroll =
        /(auto|scroll)/.test(overflowY) &&
        current.scrollHeight > current.clientHeight;

      if (canScroll) {
        const previousScrollBehavior = current.style.scrollBehavior;
        current.style.scrollBehavior = 'auto';
        current.scrollTop = 0;
        const before = current.scrollTop;
        current.scrollTop = current.scrollHeight;
        const after = current.scrollTop;
        current.style.scrollBehavior = previousScrollBehavior;

        return {
          before,
          after,
          clientHeight: current.clientHeight,
          scrollHeight: current.scrollHeight,
        };
      }

      current = current.parentElement;
    }

    return null;
  });

  expect(scrollState).not.toBeNull();
  expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
  expect(scrollState.after).toBeGreaterThan(scrollState.before);
});

test.describe('mobile workspace', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens and closes the mobile sidebar', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('aside[aria-label="Notes sidebar"]');

    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    await page.getByRole('button', { name: /close menu/i }).click();
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  test('keeps the mobile sidebar open when switching between notes and trash', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .getByRole('button', { name: /create new note/i })
      .first()
      .click();
    await page.getByRole('button', { name: /move note to trash/i }).click();

    const sidebar = page.locator('aside[aria-label="Notes sidebar"]');

    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    await page.locator('button[title="View trash"]:visible').click();
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    await page.locator('button[title="View notes"]:visible').click();
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');
  });
});
