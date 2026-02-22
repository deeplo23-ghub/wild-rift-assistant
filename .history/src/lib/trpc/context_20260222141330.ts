/**
 * tRPC context factory.
 *
 * Creates the context object available to all tRPC procedures.
 * Provides Prisma client with PostgreSQL driver adapter (Prisma 7).
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prevent multiple Prisma Client instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // In build/dev without DB, create a client that will fail gracefully at query time
    // This allows the app to build even without a database connection
    const adapter = new PrismaPg({ connectionString: "postgresql://placeholder:placeholder@localhost:5432/placeholder" });
    return new PrismaClient({ adapter });
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function createContext() {
  return { prisma };
}

export type Context = ReturnType<typeof createContext>;
