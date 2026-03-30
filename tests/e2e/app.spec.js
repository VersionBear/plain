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
});
