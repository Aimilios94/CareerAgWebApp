import { type Page } from '@playwright/test';

/**
 * Performs dev bypass login by directly setting the dev_bypass cookie
 * and navigating to the dashboard. The middleware checks for this cookie
 * and allows access without real Supabase authentication.
 */
export async function devLogin(page: Page) {
  // Set the dev_bypass cookie that the middleware checks
  await page.context().addCookies([
    {
      name: 'dev_bypass',
      value: 'true',
      domain: 'localhost',
      path: '/',
    },
  ]);

  // Navigate directly to the dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
}
