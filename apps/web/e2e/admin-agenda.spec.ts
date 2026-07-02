import { test, expect } from './fixtures/auth.fixture';
import { PrismaClient } from '@barberia-jeranbuq/database';
import AxeBuilder from '@axe-core/playwright';

/**
 * Flow 3: Admin agenda — view agenda and change appointment status
 * SPEC-E2E-003 — Admin Agenda Flow
 * SPEC-E2E-004 — Axe-core A11y Assertions
 *
 * This test seeds a PENDING appointment directly via Prisma so it does not
 * depend on the client booking flow running first.
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
  // Ensure we have a test admin user and a PENDING appointment seeded
  const adminUser = await prisma.user.upsert({
    where: { email: 'test-admin@e2e.test' },
    create: {
      email: 'test-admin@e2e.test',
      name: 'Test Admin',
      role: 'ADMIN',
      phone: '+573001234567',
      onboardingCompletedAt: new Date(),
    },
    update: {},
  });

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

  // Create a PENDING appointment for today in Bogota time
  const todayBogota = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
  }).format(new Date());

  // Start at 10:00 Bogota (UTC-5 → 15:00 UTC)
  const startAt = new Date(`${todayBogota}T15:00:00.000Z`);
  const endAt = new Date(startAt.getTime() + service.durationMin * 60_000);

  // Remove any stale test appointments for this user+service to avoid conflicts
  await prisma.appointment.deleteMany({
    where: {
      userId: clientUser.id,
      serviceId: service.id,
      status: 'PENDING',
    },
  });

  await prisma.appointment.create({
    data: {
      userId: clientUser.id,
      serviceId: service.id,
      startAt,
      endAt,
      status: 'PENDING',
    },
  });

  void adminUser; // used implicitly via the session cookie
});

test('admin can view agenda and confirm a PENDING appointment', async ({ adminPage: page }) => {
  // Navigate to admin agenda page (defaults to today)
  await page.goto('/admin/agenda');

  // Assert the agenda page heading is visible
  await expect(page.getByRole('heading', { name: /agenda/i })).toBeVisible();

  // Axe check on agenda page
  const agendaResults = await new AxeBuilder({ page }).analyze();
  const agendaViolations = agendaResults.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(agendaViolations).toHaveLength(0);

  // The "Confirmar" button should be visible for the PENDING appointment
  const confirmButton = page.getByRole('button', { name: /^confirmar$/i });
  await expect(confirmButton).toBeVisible();

  // Click "Confirmar" to change status to CONFIRMED
  await confirmButton.click();

  // Wait for the page to re-render after the server action
  // The button should disappear (terminal or changed state) and CONFIRMED badge should appear
  await expect(page.getByRole('button', { name: /^confirmar$/i })).toHaveCount(0, {
    timeout: 10_000,
  });

  // The appointment status badge should now show "Confirmada"
  // AppointmentStatusBadge renders the status label; CONFIRMED → "Confirmada"
  await expect(page.getByText('Confirmada')).toBeVisible();
});
