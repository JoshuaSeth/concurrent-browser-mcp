import { test, expect } from '@playwright/test';

test('Example Website Navigation', async ({ page }) => {
  test.setTimeout(30000);

  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  // Action: browser_navigate
  await page.goto('https://example.com');
  await page.waitForTimeout(100);

  // Action: browser_screenshot
  await page.screenshot({ fullPage: true });
  await page.waitForTimeout(100);

  // Action: browser_get_page_info
  await page.waitForTimeout(100);

  // Action: browser_navigate
  await page.goto('https://github.com');
  await page.waitForTimeout(100);

  // Action: browser_click
  await page.click('a[href="/features"]');
  await page.waitForTimeout(100);

  // Action: browser_go_back
  await page.goBack();
  await page.waitForTimeout(100);

  // Verify expected content
  const content = await page.content();
  expect(content).toContain('Example Domain');
  // Verify page loaded without errors
  const title = await page.title();
  expect(title).toBeTruthy();
});