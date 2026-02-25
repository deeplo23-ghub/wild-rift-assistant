/**
 * tRPC context factory.
 *
 * Creates the context object available to all tRPC procedures.
 * Provides Prisma client with PostgreSQL driver adapter (Prisma 7).
 */

import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma Client instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function createContext() {
  return { prisma };
}

export type Context = ReturnType<typeof createContext>;
