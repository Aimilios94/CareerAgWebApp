import { test, expect } from '@playwright/test';
import { devLogin } from './helpers/auth';

test.describe('Dashboard Pages Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
    // Ensure desktop sidebar is visible
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('can navigate to CV Analysis page via sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'CV Analysis' }).click();

    await page.waitForURL('**/dashboard/cv-analysis', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard/cv-analysis');

    // Page should not show a crash or error
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('can navigate to Job Search page via sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'Job Search' }).click();

    await page.waitForURL('**/dashboard/jobs', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard/jobs');

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('can navigate to Skills Trending page via sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'Skills Trending' }).click();

    await page.waitForURL('**/dashboard/trending', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard/trending');

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('can navigate to Job Alerts page via sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'Job Alerts' }).click();

    await page.waitForURL('**/dashboard/alerts', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard/alerts');

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('can navigate to Profile page via sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'Profile' }).click();

    await page.waitForURL('**/dashboard/profile', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard/profile');

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('can navigate to Action Center (Pro) page via sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'Action Center' }).click();

    await page.waitForURL('**/dashboard/pro', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard/pro');

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('can navigate to History page via sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'History' }).click();

    await page.waitForURL('**/dashboard/history', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard/history');

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('can navigate back to Dashboard from a sub-page', async ({ page }) => {
    // First navigate away from dashboard
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'Job Search' }).click();
    await page.waitForURL('**/dashboard/jobs', { timeout: 15000 });

    // Then navigate back to Dashboard
    await sidebar.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 15000 });

    // Verify we are on the main dashboard
    const heading = page.locator('h1');
    await expect(heading).toContainText('Welcome back');
  });

  test('active sidebar link is highlighted on correct page', async ({ page }) => {
    // Navigate to Job Search
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'Job Search' }).click();
    await page.waitForURL('**/dashboard/jobs', { timeout: 15000 });

    // The Job Search link should have the active styling class
    const jobSearchLink = sidebar.getByRole('link', { name: 'Job Search' });
    await expect(jobSearchLink).toHaveClass(/text-white/);
  });
});
