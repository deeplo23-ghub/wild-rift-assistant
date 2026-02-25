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
  let connectionString = process.env.DATABASE_URL || "";

  // Handle Prisma+Neon connection strings dynamically just for the string
  if (connectionString.startsWith("prisma+postgres://")) {
    try {
      const url = new URL(connectionString);
      const apiKey = url.searchParams.get("api_key") || "";
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString("utf-8"));
        if (decoded.databaseUrl) {
          connectionString = decoded.databaseUrl;
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString || undefined
      }
    }
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function createContext() {
  return { prisma };
}

export type Context = ReturnType<typeof createContext>;
