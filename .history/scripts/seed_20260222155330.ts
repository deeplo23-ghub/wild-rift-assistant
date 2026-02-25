#!/usr/bin/env tsx
/**
 * Database Seed Script
 *
 * Usage:
 *   npx tsx scripts/seed.ts                        # Seed from raw-data.json
 *   npx tsx scripts/seed.ts --dry-run               # Validate only, no DB writes
 *   npx tsx scripts/seed.ts --input path/to/data.json # Custom input file
 *
 * Prerequisite: Run `npx tsx scripts/scrape.ts` first to generate raw-data.json
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { normalizeRawData } from "../src/lib/data/normalize";
import { RawDataSchema } from "../src/lib/data/validation";
import { createLogger } from "./scraper/logger";
import { prisma } from "../src/lib/trpc/context";

// Parse CLI arguments
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
  
  // Step 1: Read raw data
  if (!fs.existsSync(inputPath)) {
    logger.error("Raw data file not found", { path: inputPath });
    logger.error("Run `npx tsx scripts/scrape.ts` first");
    process.exit(1);
  }
  
  const rawJson = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  
  // Step 2: Validate raw data with Zod
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
  
  // Step 3: Normalize
  logger.info("--- Normalizing data ---");
  const normalized = normalizeRawData(rawResult.data);
  
  logger.info("Normalization complete", {
    champions: normalized.champions.length,
    counters: normalized.counters.length,
    validationErrors: normalized.meta.validationErrors.length,
  });
  
  if (normalized.meta.validationErrors.length > 0) {
    logger.warn("Validation errors (non-fatal):");
    for (const err of normalized.meta.validationErrors.slice(0, 10)) {
      logger.warn(`  → ${err}`);
    }
    if (normalized.meta.validationErrors.length > 10) {
      logger.warn(`  ... and ${normalized.meta.validationErrors.length - 10} more`);
    }
  }
  
  // Step 4: Write normalized data to file (for debugging)
  const normalizedPath = path.join(
    path.dirname(inputPath),
    "normalized-data.json"
  );
  fs.writeFileSync(normalizedPath, JSON.stringify(normalized, null, 2));
  logger.info("Normalized data written", { path: normalizedPath });
  
  // Step 5: Seed database (unless dry-run)
  if (dryRun) {
    logger.info("--- DRY RUN: Skipping database writes ---");
    printSummary(normalized);
    return;
  }
  
  logger.info("--- Seeding database ---");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error("DATABASE_URL not set. Cannot seed database.");
    logger.info("Set DATABASE_URL in .env or use --dry-run to validate without DB.");
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    // Clear existing data
    logger.info("Clearing existing data...");
    await prisma.counterMatchup.deleteMany();
    await prisma.champion.deleteMany();
    await prisma.dataMeta.deleteMany();
    
    // Insert champions
    logger.info("Inserting champions...", { count: normalized.champions.length });
    for (const champ of normalized.champions) {
      await prisma.champion.create({
        data: {
          id: champ.id,
          name: champ.name,
          roles: champ.roles,
          winrate: champ.winrate,
          pickRate: champ.pickRate,
          banRate: champ.banRate,
          tier: champ.tier,
          damageProfileAd: champ.damageProfileAd,
          damageProfileAp: champ.damageProfileAp,
          damageProfileTrue: champ.damageProfileTrue,
          durabilityScore: champ.durabilityScore,
          engageScore: champ.engageScore,
          peelScore: champ.peelScore,
          ccScore: champ.ccScore,
          scalingScore: champ.scalingScore,
          earlyGameScore: champ.earlyGameScore,
          mobilityScore: champ.mobilityScore,
          healingScore: champ.healingScore,
          shieldScore: champ.shieldScore,
          waveclearScore: champ.waveclearScore,
          tags: champ.tags,
          iconUrl: champ.iconUrl,
        },
      });
    }
    
    // Insert counter matchups
    logger.info("Inserting counter matchups...", { count: normalized.counters.length });
    for (const counter of normalized.counters) {
      await prisma.counterMatchup.create({
        data: {
          championId: counter.championId,
          opponentId: counter.opponentId,
          value: counter.value,
        },
      });
    }
    
    // Insert metadata
    await prisma.dataMeta.create({
      data: {
        id: "singleton",
        lastScrapedAt: new Date(normalized.meta.scrapedAt),
        championCount: normalized.meta.championCount,
        version: normalized.meta.version,
      },
    });
    
    logger.info("Database seeded successfully!");
    
    // Verify
    const champCount = await prisma.champion.count();
    const counterCount = await prisma.counterMatchup.count();
    logger.info("Verification", { champions: champCount, counters: counterCount });
    
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
  
  printSummary(normalized);
}

function printSummary(data: ReturnType<typeof normalizeRawData>) {
  logger.info("═══════════════════════════════════════════");
  logger.info("PIPELINE SUMMARY");
  logger.info("═══════════════════════════════════════════");
  logger.info(`Champions:        ${data.champions.length}`);
  logger.info(`Counter matchups: ${data.counters.length}`);
  logger.info(`Validation errors: ${data.meta.validationErrors.length}`);
  logger.info(`Scraped at:       ${data.meta.scrapedAt}`);
  
  // Role distribution
  const roleCounts: Record<string, number> = {};
  for (const c of data.champions) {
    for (const r of c.roles) {
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }
  }
  logger.info("Role distribution:", roleCounts);
  
  // Tier distribution
  const tierCounts: Record<string, number> = {};
  for (const c of data.champions) {
    if (c.tier) {
        tierCounts[c.tier] = (tierCounts[c.tier] || 0) + 1;
    }
  }
  logger.info("Tier distribution:", tierCounts);
  logger.info("═══════════════════════════════════════════");
}

main().catch((error) => {
  logger.error("Seed script failed", { error: String(error) });
  process.exit(1);
});
