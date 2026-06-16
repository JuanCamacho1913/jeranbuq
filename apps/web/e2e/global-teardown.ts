import { PrismaClient } from '@barberia-jeranbuq/database';

async function globalTeardown(): Promise<void> {
  if (!process.env.DATABASE_URL_TEST) {
    console.warn('DATABASE_URL_TEST not set — skipping teardown');
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_TEST } },
  });

  try {
    // Truncate in FK-safe order (leaf tables first, CASCADE handles FK constraints)
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE appointments, time_blocks, sessions, accounts, verification_tokens, users, services, admin_availability CASCADE'
    );
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;
