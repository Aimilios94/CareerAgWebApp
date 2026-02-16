import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login page loads at /login with correct heading', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.getByRole('heading', { name: 'Welcome Back' });
    await expect(heading).toBeVisible();

    const subtext = page.getByText('Sign in to access your career command center');
    await expect(subtext).toBeVisible();
  });

  test('login form has email and password fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');

    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Sign In button
    const submitButton = page.getByRole('button', { name: 'Sign In' });
    await expect(submitButton).toBeVisible();
  });

  test('login page has Google OAuth button', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const googleButton = page.getByRole('button', { name: /Google/i });
    await expect(googleButton).toBeVisible();
  });

  test('login page has forgot password link', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const forgotLink = page.getByRole('link', { name: /Forgot password/i });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });

  test('login page has sign up link', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const signUpLink = page.getByRole('link', { name: /Sign up/i });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute('href', '/signup');
  });

  test('signup page loads at /signup with correct heading', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.getByRole('heading', { name: 'Create Account' });
    await expect(heading).toBeVisible();

    const subtext = page.getByText('Start your journey with Career Agent');
    await expect(subtext).toBeVisible();
  });

  test('signup form has all required fields', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm')).toBeVisible();

    // Terms checkbox
    const termsCheckbox = page.locator('#terms');
    await expect(termsCheckbox).toBeVisible();

    // Create Account button
    const submitButton = page.getByRole('button', { name: 'Create Account' });
    await expect(submitButton).toBeVisible();
  });

  test('forgot password page loads at /forgot-password', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.getByRole('heading', { name: 'Reset Password' });
    await expect(heading).toBeVisible();

    const subtext = page.getByText('Enter your email to receive reset instructions');
    await expect(subtext).toBeVisible();

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible();
  });

  test('dev bypass: setting dev_bypass cookie grants access to dashboard', async ({ page }) => {
    // The login form's dev bypass sets document.cookie = 'dev_bypass=true'
    // which the middleware checks. We test this mechanism directly.
    await page.context().addCookies([
      {
        name: 'dev_bypass',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to dashboard - should NOT redirect to login
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify we are on the dashboard, not redirected to login
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/login');
  });

  test('unauthenticated users are redirected from /dashboard to /login', async ({ page }) => {
    // Clear any existing cookies to ensure no dev_bypass
    await page.context().clearCookies();

    await page.goto('/dashboard');

    // Should be redirected to login with redirect param
    await page.waitForURL('**/login**', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });
});
