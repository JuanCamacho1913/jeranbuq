import { execSync } from 'child_process';
import { PrismaClient } from '@barberia-jeranbuq/database';

async function globalSetup(): Promise<void> {
  // Override DATABASE_URL with the test database
  if (!process.env.DATABASE_URL_TEST) {
    throw new Error(
      'DATABASE_URL_TEST is not set. Please configure a dedicated test database.\n' +
      'Example: DATABASE_URL_TEST=postgresql://user:pass@localhost:5432/barberia_test'
    );
  }
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

  // Run migrations against the test DB
  execSync('pnpm --filter @barberia-jeranbuq/database db:migrate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  });

  // Seed minimal data for E2E tests
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_TEST } },
  });

  try {
    // Create a Service if none exists
    const existingService = await prisma.service.findFirst({
      where: { name: 'Corte' },
    });
    if (!existingService) {
      await prisma.service.create({
        data: {
          name: 'Corte',
          durationMin: 30,
          price: 25000,
          active: true,
        },
      });
    }

    // Create AdminAvailability for Mon-Sat if none exists
    const days = [1, 2, 3, 4, 5, 6]; // Monday through Saturday
    for (const dayOfWeek of days) {
      await prisma.adminAvailability.upsert({
        where: { dayOfWeek },
        create: {
          dayOfWeek,
          startTime: '08:00',
          endTime: '18:00',
          slotMinutes: 30,
          active: true,
        },
        update: {},
      });
    }

    // Verify dev server is reachable
    await waitForServer('http://localhost:3000');
  } finally {
    await prisma.$disconnect();
  }
}

async function waitForServer(url: string, retries = 3, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      if (attempt === retries) {
        throw new Error(
          `Dev server not reachable at ${url} after ${retries} attempts.\n` +
          'Please start the dev server before running E2E tests:\n' +
          '  pnpm dev'
        );
      }
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export default globalSetup;
