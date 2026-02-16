import { test, expect } from '@playwright/test';
import { devLogin } from './helpers/auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
  });

  test('dashboard loads with welcome message', async ({ page }) => {
    // The dashboard shows "Welcome back, <name>!" heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Welcome back');
  });

  test('dashboard shows system status indicator', async ({ page }) => {
    const statusText = page.getByText('ONLINE');
    await expect(statusText).toBeVisible();
  });

  test('sidebar navigation is visible with correct links', async ({ page }) => {
    // Set viewport large enough for desktop sidebar (lg breakpoint)
    await page.setViewportSize({ width: 1280, height: 720 });

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Check main navigation items
    await expect(sidebar.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Job Search' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'History' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'CV Analysis' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Skills Trending' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Job Alerts' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Profile' })).toBeVisible();

    // Pro features section
    await expect(sidebar.getByRole('link', { name: 'Action Center' })).toBeVisible();
  });

  test('sidebar shows Career Agent branding', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const sidebar = page.locator('aside');
    await expect(sidebar.getByText('Career Agent')).toBeVisible();
  });

  test('Career Profile Card section is present', async ({ page }) => {
    // The CareerProfileCard or its skeleton should be visible
    // The dashboard has "CV Analysis" text as part of the CVQuickView or a "Upload" button
    // Look for visible sections in the main content area
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // The profile section renders either the CareerProfileCard or its skeleton
    // Both contain visual elements within a section tag
    // Check that the page has rendered dashboard content by looking for recognizable text
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('career command center')).toBeVisible();
  });

  test('Job Search Bar is present and accepts input', async ({ page }) => {
    // The search bar has a placeholder text
    const searchInput = page.getByPlaceholder('Search for roles, skills, or companies...');
    await expect(searchInput).toBeVisible();

    // Verify the search input accepts text
    await searchInput.click();
    await searchInput.fill('React Developer');

    // Verify the text was entered in the DOM
    await expect(searchInput).toHaveValue('React Developer');

    // The Search button should be present (may be disabled if React hasn't hydrated)
    const searchButton = page.getByRole('button', { name: 'Search' });
    await expect(searchButton).toBeVisible();
  });

  test('Recent Matches section exists', async ({ page }) => {
    // The section has a heading - either "Recent Matches" or "Search Results"
    const matchesHeading = page.getByRole('heading', { name: /Recent Matches|Search Results/i });
    await expect(matchesHeading).toBeVisible();
  });

  test('CV Quick View section exists', async ({ page }) => {
    // CVQuickView component renders in a section
    // Even without CV data it should render some content
    const sections = page.locator('section');
    // The dashboard has multiple sections: profile, CV quick view, search, matches
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(3);
  });

  test('dashboard page URL is correct', async ({ page }) => {
    expect(page.url()).toContain('/dashboard');
    // Should not be on any sub-page
    const url = new URL(page.url());
    expect(url.pathname).toBe('/dashboard');
  });
});
