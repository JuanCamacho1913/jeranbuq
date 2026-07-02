import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Flow 1: Unauthenticated redirect
 * SPEC-E2E-003 — Unauthenticated Redirect
 * SPEC-E2E-004 — Axe-core A11y Assertions
 */
test('unauthenticated user is redirected to /login', async ({ page }) => {
  await page.goto('/inicio');

  // Assert redirect to login page
  await expect(page).toHaveURL(/\/login/);

  // Assert the login page heading is visible
  await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();

  // Axe-core a11y check on the login page after redirect
  const results = await new AxeBuilder({ page }).analyze();
  const criticalOrSerious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(criticalOrSerious).toHaveLength(0);
});
