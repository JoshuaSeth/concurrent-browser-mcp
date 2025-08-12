import { test, expect } from '@playwright/test';

test('Wikipedia Search Test', async ({ page }) => {
  test.setTimeout(30000);

  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  // Action: browser_navigate
  await page.goto('https://www.wikipedia.org');
  await page.waitForTimeout(100);

  // Action: browser_fill
  await page.fill('#searchInput', 'Playwright');
  await page.waitForTimeout(100);

  // Action: browser_click
  await page.click('button[type="submit"]');
  await page.waitForTimeout(100);

  // Verify expected content
  const content = await page.content();
  expect(content).toContain('Playwright');
  // Verify page loaded without errors
  const title = await page.title();
  expect(title).toBeTruthy();
});