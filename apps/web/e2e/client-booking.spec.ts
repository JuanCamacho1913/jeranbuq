import { test, expect } from './fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';

/**
 * Flow 2: Client booking wizard (end-to-end)
 * SPEC-E2E-003 — Client Booking Flow
 * SPEC-E2E-004 — Axe-core A11y Assertions
 *
 * Prerequisites (global-setup seeds):
 * - 1 active Service "Corte" (30 min, $25.000)
 * - AdminAvailability for Mon-Sat 08:00-18:00, slotMinutes: 30
 * - /api/test/session sets phone + onboardingCompletedAt so onboarding is skipped
 */
test('client can book an appointment end-to-end', async ({ clientPage: page }) => {
  // ── Service catalog ────────────────────────────────────────────────────────
  await page.goto('/inicio');

  // If onboarding page is shown (phone not yet set), fill it and continue
  if (page.url().includes('/onboarding')) {
    await page.getByRole('textbox').fill('+573001234567');
    await page.getByRole('button', { name: /guardar|continuar|siguiente/i }).click();
    await page.waitForURL(/\/inicio/);
  }

  await expect(page.getByRole('heading', { name: /nuestros servicios/i })).toBeVisible();

  // Axe check on service catalog
  const catalogResults = await new AxeBuilder({ page }).analyze();
  const catalogViolations = catalogResults.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(catalogViolations).toHaveLength(0);

  // Click the first "Agendar" link to go to the booking wizard
  await page.getByRole('link', { name: /agendar/i }).first().click();
  await page.waitForURL(/\/agendar\//);

  // ── Step 1: Date selection ─────────────────────────────────────────────────
  await expect(page.getByRole('heading', { name: /agendar cita/i })).toBeVisible();
  await expect(page.getByText(/seleccioná una fecha/i)).toBeVisible();

  // Axe check on date step
  const dateStepResults = await new AxeBuilder({ page }).analyze();
  const dateStepViolations = dateStepResults.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(dateStepViolations).toHaveLength(0);

  // Calendar day buttons have aria-label set to the full Spanish date string.
  // Find the first enabled (non-disabled) day button in the calendar grid.
  // Exclude navigation buttons (Semana anterior / Siguiente semana) by checking aria-label
  // that contains a day-of-week name (lunes, martes, …, domingo).
  // Use a locator that matches day buttons with a full Spanish date aria-label
  const calendarDayButtons = page.locator('button[aria-label]:not([disabled])').filter({
    hasText: /^\d{1,2}$/,
  });
  const firstCalendarDay = calendarDayButtons.first();
  await firstCalendarDay.click();

  // ── Step 2: Slot selection ─────────────────────────────────────────────────
  await expect(page.getByText(/seleccioná un horario/i)).toBeVisible();

  // Wait for the slot loading skeleton to disappear
  await page.waitForFunction(() => {
    const skeletons = document.querySelectorAll('.animate-pulse');
    return skeletons.length === 0;
  });

  // Axe check on slot step
  const slotStepResults = await new AxeBuilder({ page }).analyze();
  const slotStepViolations = slotStepResults.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(slotStepViolations).toHaveLength(0);

  // Slot buttons have aria-label like "08:00 a. m." and are not disabled when available.
  // The aria-label includes the time and optionally " — no disponible" for unavailable ones.
  const availableSlotButton = page
    .locator('button[aria-label]:not([disabled])')
    .filter({ hasNotText: /no disponible/ })
    .filter({ hasText: /a\.\s*m\.|p\.\s*m\./i })
    .first();
  await availableSlotButton.click();

  // ── Step 3: Confirm booking ────────────────────────────────────────────────
  await expect(page.getByText(/resumen de tu cita/i)).toBeVisible();

  // Axe check on confirm step
  const confirmStepResults = await new AxeBuilder({ page }).analyze();
  const confirmStepViolations = confirmStepResults.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(confirmStepViolations).toHaveLength(0);

  // Click the confirm button
  await page.getByRole('button', { name: /confirmar cita/i }).click();

  // On success the flow redirects to /mis-citas
  await page.waitForURL(/\/mis-citas/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /mis citas/i })).toBeVisible();
});
