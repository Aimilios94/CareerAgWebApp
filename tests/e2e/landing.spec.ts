import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('page loads with hero section containing headline and subtext', async ({ page }) => {
    // The hero headline uses two lines: "Master Your" and "Career Trajectory"
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText('Master Your');
    await expect(heroHeading).toContainText('Career Trajectory');

    // Subtext paragraph
    const subtext = page.getByText('Stop guessing. Let our advanced AI analyze');
    await expect(subtext).toBeVisible();
  });

  test('desktop navigation links are visible', async ({ page }) => {
    // Desktop nav is hidden on mobile, so set viewport large enough
    await page.setViewportSize({ width: 1280, height: 720 });

    const nav = page.locator('header nav').first();
    await expect(nav.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Demo' })).toBeVisible();
  });

  test('CTA buttons exist in hero section', async ({ page }) => {
    // "Analyze My Profile" is the primary CTA linking to /dashboard
    const analyzeButton = page.getByRole('link', { name: /Analyze My Profile/i });
    await expect(analyzeButton).toBeVisible();

    // "Watch Demo" links to #demo
    const watchDemoButton = page.getByRole('link', { name: /Watch Demo/i });
    await expect(watchDemoButton).toBeVisible();
  });

  test('clicking Features nav link scrolls to features section', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Click the "Features" link in the header nav
    const featuresLink = page.locator('header nav').first().getByRole('link', { name: 'Features' });
    await featuresLink.click();

    // The #features section should be scrolled into view
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();

    // Verify the section heading is visible
    const sectionTitle = featuresSection.getByText('Everything you need to land your dream job');
    await expect(sectionTitle).toBeVisible();
  });

  test('pricing section shows Free and Pro plans', async ({ page }) => {
    const pricingSection = page.locator('#pricing');

    // Scroll to pricing so framer-motion reveal animations trigger
    await pricingSection.scrollIntoViewIfNeeded();

    // Wait for the section heading to be visible (animations may delay it)
    const pricingTitle = pricingSection.getByText('Simple, transparent pricing');
    await expect(pricingTitle).toBeVisible({ timeout: 10000 });

    // Free plan
    const freePlan = pricingSection.getByRole('heading', { name: 'Free' });
    await expect(freePlan).toBeVisible({ timeout: 10000 });

    // Pro plan
    const proPlan = pricingSection.getByRole('heading', { name: 'Pro' });
    await expect(proPlan).toBeVisible({ timeout: 10000 });

    // Check price text
    await expect(pricingSection.getByText('$19')).toBeVisible({ timeout: 10000 });

    // CTA buttons for each plan
    await expect(pricingSection.getByRole('link', { name: 'Get Started Free' })).toBeVisible({ timeout: 10000 });
    await expect(pricingSection.getByRole('link', { name: 'Start Pro Trial' })).toBeVisible({ timeout: 10000 });
  });

  test('header shows Sign In link and Get Started button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Both desktop and mobile navs have "Sign In", so target the first visible one (desktop)
    const signInLink = page.locator('header').getByRole('link', { name: 'Sign In' }).first();
    await expect(signInLink).toBeVisible();

    const getStartedLink = page.locator('header').getByRole('link', { name: 'Get Started' }).first();
    await expect(getStartedLink).toBeVisible();
  });

  test('about section is present with stats', async ({ page }) => {
    const aboutSection = page.locator('#about');
    await aboutSection.scrollIntoViewIfNeeded();

    await expect(aboutSection.getByText("Built by people who've been there")).toBeVisible({ timeout: 10000 });
    await expect(aboutSection.getByText('50K+')).toBeVisible({ timeout: 10000 });
    await expect(aboutSection.getByText('2M+')).toBeVisible({ timeout: 10000 });
    await expect(aboutSection.getByText('98%')).toBeVisible({ timeout: 10000 });
  });

  test('footer contains brand name and copyright', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();

    await expect(footer.getByText('Career Agent')).toBeVisible();
    await expect(footer.getByText('2026 Future Systems Inc')).toBeVisible();
  });
});
