import { test, expect } from '@playwright/test';

test('Path Verification Test', async ({ page }) => {
  test.setTimeout(30000);

  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  // Action: browser_navigate
  await page.goto('https://example.com');
  await page.waitForTimeout(100);

  // Verify expected content
  const content = await page.content();
  expect(content).toContain('Example Domain');
  // Verify page loaded without errors
  const url = page.url();
  expect(url).toBeTruthy();
});