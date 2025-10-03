import { test, expect } from '@playwright/test';
import fs from 'fs/promises';

async function goto(page) {
  await page.goto('/receiving.html', { waitUntil: 'domcontentloaded' });
  // Wait for SW so offline test is meaningful
  await page.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready);
}

test('Save → Edit → Export → Offline', async ({ page, context }) => {
  await goto(page);

  // Save (Date auto-fills in app)
  await page.fill('#po', 'PO777');
  await page.fill('#qty', '5');
  const before = await page.locator('#countBadge').textContent();
  await page.click('#saveBtn');
  await expect(page.locator('#countBadge')).not.toHaveText(before || '');
  await expect(page.locator('#table tbody tr').first()).toContainText('PO777');

  // Edit
  await page.locator('#table tbody tr').first().getByRole('button', { name: 'Edit' }).click();
  await page.fill('#qty', '9');
  await page.click('#saveBtn');
  await expect(page.locator('#table tbody tr').first()).toContainText('9');

  // Export CSV
  const d1 = page.waitForEvent('download');
  await page.click('#csvBtn');
  const csv = await d1;
  const csvText = await fs.readFile(await csv.path() as string, 'utf8');
  expect(csvText.split(/\r?\n/)[0]).toBe('ID,Date,PO,Part,Heat,Qty,ReceivedBy,Notes');
  expect(csvText).toContain('PO777');

  // Export JSON
  const d2 = page.waitForEvent('download');
  await page.click('#jsonBtn');
  const json = await d2;
  const arr = JSON.parse(await fs.readFile(await json.path() as string, 'utf8'));
  expect(Array.isArray(arr)).toBeTruthy();
  expect(arr[0]).toHaveProperty('po');

  // Offline (served from SW cache)
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Receiving Reports/i);
  await expect(page.locator('table#table')).toBeVisible();
  await context.setOffline(false);
});

test('Validation highlights required fields', async ({ page }) => {
  await goto(page);
  await page.click('#saveBtn');
  await expect(page.locator('#date.err')).toBeVisible();
  await expect(page.locator('#po.err')).toBeVisible();
  await expect(page.locator('#qty.err')).toBeVisible();
});

// OPTIONAL CI: FILE: /.github/workflows/test.yml
// Creates a PR check that runs the tests.
# name: Playwright Tests
# on:
#   push: { branches: [ main, feature/** ] }
#   pull_request: { branches: [ main ] }
# jobs:
#   e2e:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-node@v4
#         with: { node-version: '20' }
#       - run: npm ci || npm i
#       - run: npx playwright install --with-deps
#       - run: npm test
#       - if: always()
#         uses: actions/upload-artifact@v4
#         with: { name: playwright-report, path: playwright-report }
