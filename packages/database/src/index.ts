import { PrismaClient } from "../generated/prisma";

// Prevent multiple PrismaClient instances during HMR in development.
// In production a single instance is created and reused across requests.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export everything from the generated Prisma client (types, enums, etc.)
export * from "../generated/prisma";
