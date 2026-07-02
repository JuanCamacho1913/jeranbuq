import { test, expect } from './fixtures/auth.fixture';
import { PrismaClient } from '@barberia-jeranbuq/database';
import AxeBuilder from '@axe-core/playwright';

/**
 * Flow 4: Client cancellation
 * SPEC-E2E-003 — Client Cancellation Flow
 * SPEC-E2E-004 — Axe-core A11y Assertions
 *
 * Seeds a PENDING appointment in beforeEach directly via Prisma.
 * The appointment's startAt must be > 2 hours in the future so the
 * "Cancelar cita" button is shown (CANCEL_HOURS = 2).
 */

let prisma: PrismaClient;

test.beforeAll(async () => {
  const testDbUrl = process.env.DATABASE_URL_TEST;
  if (!testDbUrl) throw new Error('DATABASE_URL_TEST is not set');
  prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.beforeEach(async () => {
  const clientUser = await prisma.user.upsert({
    where: { email: 'test-client@e2e.test' },
    create: {
      email: 'test-client@e2e.test',
      name: 'Test Client',
      role: 'CLIENT',
      phone: '+573001234567',
      onboardingCompletedAt: new Date(),
    },
    update: {},
  });

  const service = await prisma.service.findFirst({ where: { name: 'Corte' } });
  if (!service) throw new Error('Seed service "Corte" not found — run global-setup first');

  // Remove any stale PENDING appointments for this client to avoid duplicates
  await prisma.appointment.deleteMany({
    where: { userId: clientUser.id, status: 'PENDING' },
  });

  // Seed a PENDING appointment 4 hours in the future (well beyond the 2h cancel window)
  const startAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const endAt = new Date(startAt.getTime() + service.durationMin * 60_000);

  await prisma.appointment.create({
    data: {
      userId: clientUser.id,
      serviceId: service.id,
      startAt,
      endAt,
      status: 'PENDING',
    },
  });
});

test('client can cancel a pending appointment', async ({ clientPage: page }) => {
  await page.goto('/mis-citas');

  // Assert the appointments page is visible
  await expect(page.getByRole('heading', { name: /mis citas/i })).toBeVisible();

  // Axe check on /mis-citas
  const a11yResults = await new AxeBuilder({ page }).analyze();
  const violations = a11yResults.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(violations).toHaveLength(0);

  // The "Cancelar cita" button should appear for the PENDING appointment
  // (only shown when cancellable: status PENDING/CONFIRMED AND startAt > 2h away)
  const cancelButton = page.getByRole('button', { name: /cancelar cita/i });
  await expect(cancelButton).toBeVisible();

  // Click cancel — no confirmation dialog in client flow, action fires directly
  await cancelButton.click();

  // Wait for the server action to complete and the page to re-render.
  // The "Cancelar cita" button disappears and the badge changes to "Cancelada".
  await expect(page.getByRole('button', { name: /cancelar cita/i })).toHaveCount(0, {
    timeout: 10_000,
  });

  // The appointment card should now show "Cancelada" status
  await expect(page.getByText('Cancelada')).toBeVisible();
});
