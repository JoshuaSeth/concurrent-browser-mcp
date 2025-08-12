import { test, expect } from '@playwright/test';

test('HTTPBin JSON API Test', async ({ page }) => {
  test.setTimeout(30000);

  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  // Action: browser_navigate
  await page.goto('https://httpbin.org/json');
  await page.waitForTimeout(100);

  // Verify page loaded without errors
  const title = await page.title();
  expect(title).toBeTruthy();
});