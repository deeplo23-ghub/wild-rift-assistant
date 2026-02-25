#!/usr/bin/env tsx
/**
 * Database Seed Script
 *
 * Usage:
 *   npx tsx scripts/seed.ts                        # Seed from raw-data.json
 *   npx tsx scripts/seed.ts --dry-run               # Validate only, no DB writes
 *   npx tsx scripts/seed.ts --input path/to/data.json # Custom input file
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;
import { normalizeRawData } from "../src/lib/data/normalize";
import { RawDataSchema } from "../src/lib/data/validation";
import { createLogger } from "./scraper/logger";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const inputIdx = args.indexOf("--input");
const inputPath = inputIdx >= 0
  ? args[inputIdx + 1]
  : path.join(__dirname, "scraper", "output", "raw-data.json");

const logger = createLogger("info");

async function main() {
  logger.info("=== Wild Rift Draft Assistant — Database Seeder ===");
  logger.info("Config", { dryRun, inputPath });
  
  if (!fs.existsSync(inputPath)) {
    logger.error("Raw data file not found", { path: inputPath });
    process.exit(1);
  }
  
  const rawJson = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  
  logger.info("--- Validating raw data ---");
  const rawResult = RawDataSchema.safeParse(rawJson);
  
  if (!rawResult.success) {
    logger.error("Raw data validation failed", {
      errors: rawResult.error.issues.map(i => `${i.path.join(".")}: ${i.message}`),
    });
    process.exit(1);
  }
  
  logger.info("Raw data valid", {
    champions: rawResult.data.champions.length,
    counterPairs: rawResult.data.counterPairs.length,
  });
  
  logger.info("--- Normalizing data ---");
  const normalized = normalizeRawData(rawResult.data);
  
  logger.info("Normalization complete", {
    champions: normalized.champions.length,
    counters: normalized.counters.length,
    validationErrors: normalized.meta.validationErrors.length,
  });
  
  if (normalized.meta.validationErrors.length > 0) {
    logger.warn("Validation errors (non-fatal):");
    for (const err of normalized.meta.validationErrors.slice(0, 5)) {
      logger.warn(`  → ${err}`);
    }
  }
  
  const normalizedPath = path.join(path.dirname(inputPath), "normalized-data.json");
  fs.writeFileSync(normalizedPath, JSON.stringify(normalized, null, 2));
  logger.info("Normalized data written", { path: normalizedPath });
  
  if (dryRun) {
    logger.info("--- DRY RUN: Skipping database writes ---");
    printSummary(normalized);
    return;
  }
  
  logger.info("--- Seeding database ---");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error("DATABASE_URL not set.");
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    logger.info("Clearing existing data...");
    await prisma.counterMatchup.deleteMany();
    await prisma.champion.deleteMany();
    await prisma.dataMeta.deleteMany();
    
    logger.info("Inserting champions...");
    for (const champ of normalized.champions) {
      await prisma.champion.create({ data: champ });
    }
    
    logger.info("Inserting counter matchups...");
    for (const counter of normalized.counters) {
      await prisma.counterMatchup.create({ data: counter });
    }
    
    await prisma.dataMeta.create({
      data: {
        id: "singleton",
        lastScrapedAt: new Date(normalized.meta.scrapedAt),
        championCount: normalized.meta.championCount,
        version: normalized.meta.version,
      },
    });
    
    logger.info("Database seeded successfully!");
    
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
  
  printSummary(normalized);
}

function printSummary(data: any) {
  logger.info("═══════════════════════════════════════════");
  logger.info("PIPELINE SUMMARY");
  logger.info("═══════════════════════════════════════════");
  logger.info(`Champions:        ${data.champions.length}`);
  logger.info(`Counter matchups: ${data.counters.length}`);
  logger.info(`Scraped at:       ${data.meta.scrapedAt}`);
  logger.info("═══════════════════════════════════════════");
}

main().catch((error) => {
  logger.error("Seed script failed", { error: String(error) });
  process.exit(1);
});
