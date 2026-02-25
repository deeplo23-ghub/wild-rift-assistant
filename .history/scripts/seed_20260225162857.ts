#!/usr/bin/env tsx
/**
 * Database Seed Script
 *
 * Usage:
 *   npx tsx scripts/seed.ts                    # Seed from raw-data.json
 *   npx tsx scripts/seed.ts --dry-run           # Validate only, no DB writes
 *   npx tsx scripts/seed.ts --input ./path.json # Custom input file
 *
 * Prerequisite: Run `npx tsx scripts/scrape.ts` first to generate raw-data.json.
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { normalizeChampion } from "../src/lib/data/normalize";
import { RawDataSchema, NormalizedChampionSchema } from "../src/lib/data/validation";
import { createLogger } from "./scraper/logger";
import { SCRAPER_CONFIG } from "./scraper/config";
import { updateSyncStatus } from "./scraper/status-utils";

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const inputIdx = args.indexOf("--input");
const inputPath = inputIdx >= 0
  ? args[inputIdx + 1]
  : path.join(__dirname, "scraper", "output", "raw-data.json");

const jobIdIdx = args.indexOf("--job-id");
const jobId = jobIdIdx >= 0 ? args[jobIdIdx + 1] : null;

const logger = createLogger("info");

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  logger.info("═══════════════════════════════════════════════");
  logger.info("  Wild Rift Draft Assistant — Database Seeder  ");
  logger.info("═══════════════════════════════════════════════");
  logger.info("Config", { dryRun, inputPath });

  // ── Step 1: Read raw data ──────────────────────────────────────────────
  if (!fs.existsSync(inputPath)) {
    logger.error("Raw data file not found", { path: inputPath });
    logger.error("Run `npx tsx scripts/scrape.ts` first");
    process.exit(1);
  }

  const rawJson = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  // ── Step 2: Validate raw data ──────────────────────────────────────────
  logger.info("── Step 1: Validating raw data ──");
  const rawResult = RawDataSchema.safeParse(rawJson);

  if (!rawResult.success) {
    logger.error("Raw data validation FAILED:");
    for (const issue of rawResult.error.issues.slice(0, 20)) {
      logger.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  logger.info("Raw data valid ✓", {
    champions: rawResult.data.champions.length,
  });

  if (jobId) await updateSyncStatus(jobId, { progress: 96, message: "Normalization..." });

  // ── Step 3: Normalize ──────────────────────────────────────────────────
  logger.info("── Step 2: Normalizing data ──");
  const validationErrors: string[] = [];
  const normalizedChampions: any[] = [];

  for (let i = 0; i < rawResult.data.champions.length; i++) {
    const raw = rawResult.data.champions[i];
    if (jobId) {
      const progress = 96 + (i / rawResult.data.champions.length) * 1;
      await updateSyncStatus(jobId, {
        progress: parseFloat(progress.toFixed(2)),
        message: `Normalizing ${raw.name}...`
      });
    }
    try {
      const normalized = normalizeChampion(raw);

      // Validate with Zod
      const result = NormalizedChampionSchema.safeParse(normalized);
      if (!result.success) {
        validationErrors.push(
          `${raw.id}: ${result.error.issues.map((i) => i.message).join(", ")}`
        );
        continue;
      }

      normalizedChampions.push(result.data);
    } catch (err) {
      validationErrors.push(`${raw.id}: ${String(err)}`);
    }
  }

  logger.info("Normalization complete", {
    normalized: normalizedChampions.length,
    errors: validationErrors.length,
  });

  if (validationErrors.length > 0) {
    logger.warn("Validation errors (non-fatal):");
    for (const err of validationErrors.slice(0, 15)) {
      logger.warn(`  → ${err}`);
    }
    if (validationErrors.length > 15) {
      logger.warn(`  ... and ${validationErrors.length - 15} more`);
    }
  }

  // ── Step 4: Build counter matchups ─────────────────────────────────────
  logger.info("── Step 3: Building counter matchups ──");
  const validIds = new Set(normalizedChampions.map((c: any) => c.id));
  const counterMatchups: { championId: string; opponentId: string; value: number }[] = [];

  // counterPairs might not exist in all input files
  const rawCounterPairs = (rawJson as any).counterPairs || [];
  for (const pair of rawCounterPairs) {
    if (!pair.championId || !pair.threatId) continue;
    if (!validIds.has(pair.championId) || !validIds.has(pair.threatId)) continue;

    // Champion is threatened by threat → champion has DISADVANTAGE
    counterMatchups.push({
      championId: pair.championId,
      opponentId: pair.threatId,
      value: -5, // Extreme threat = max disadvantage
    });
    // Threat has ADVANTAGE over champion
    counterMatchups.push({
      championId: pair.threatId,
      opponentId: pair.championId,
      value: 5, // Extreme advantage
    });
  }

  // Deduplicate by key (keep strongest value)
  const counterMap = new Map<string, number>();
  for (const cm of counterMatchups) {
    const key = `${cm.championId}:${cm.opponentId}`;
    const existing = counterMap.get(key);
    if (existing === undefined || Math.abs(cm.value) > Math.abs(existing)) {
      counterMap.set(key, cm.value);
    }
  }

  const finalCounters = [...counterMap.entries()].map(([key, value]) => {
    const [championId, opponentId] = key.split(":");
    return { championId, opponentId, value };
  });

  logger.info("Counter matchups", { total: finalCounters.length });

  // ── Step 5: Write normalized data ──────────────────────────────────────
  const normalizedOutput = {
    meta: {
      scrapedAt: rawJson.meta?.scrapedAt || new Date().toISOString(),
      championCount: normalizedChampions.length,
      version: rawJson.meta?.version || "1.0.0",
      validationErrors,
    },
    champions: normalizedChampions,
    counters: finalCounters,
  };

  const normalizedPath = path.join(
    path.dirname(inputPath),
    "normalized-data.json"
  );
  fs.writeFileSync(normalizedPath, JSON.stringify(normalizedOutput, null, 2));
  logger.info("Normalized data written", { path: normalizedPath });

  // ── Step 6: Validation checks ──────────────────────────────────────────
  logger.info("── Step 4: Running validation checks ──");

  let allValid = true;

  // Check unique names
  const names = new Set<string>();
  for (const c of normalizedChampions) {
    if (names.has(c.name)) {
      logger.error(`DUPLICATE name: ${c.name}`);
      allValid = false;
    }
    names.add(c.name);
  }

  // Check required fields
  for (const c of normalizedChampions) {
    if (!c.id) { logger.error(`Missing id for ${c.name}`); allValid = false; }
    if (!c.roles.length) { logger.error(`Empty roles for ${c.name}`); allValid = false; }
    if (!c.tier) { logger.error(`Missing tier for ${c.name}`); allValid = false; }
    if (typeof c.winrate !== "number") { logger.error(`Bad winrate for ${c.name}`); allValid = false; }
    if (typeof c.pickRate !== "number") { logger.error(`Bad pickRate for ${c.name}`); allValid = false; }
    if (typeof c.banRate !== "number") { logger.error(`Bad banRate for ${c.name}`); allValid = false; }

    // Damage profile sum check
    const dmgSum = c.damageProfileAd + c.damageProfileAp + c.damageProfileTrue;
    if (dmgSum < 0.98 || dmgSum > 1.02) {
      logger.error(`Damage profile sum = ${dmgSum.toFixed(3)} for ${c.name}`);
      allValid = false;
    }

    if (!c.tags.length) { logger.error(`Empty tags for ${c.name}`); allValid = false; }
  }

  if (!allValid) {
    logger.error("VALIDATION FAILED — see errors above");
    process.exit(1);
  }
  logger.info("All validation checks passed ✓");

  // ── Step 7: Seed database (unless dry-run) ─────────────────────────────
  if (dryRun) {
    logger.info("── DRY RUN: Skipping database writes ──");
    printSummary(normalizedChampions, finalCounters);
    return;
  }

  const prisma = new PrismaClient();

  try {
    if (jobId) await updateSyncStatus(jobId, { progress: 97, message: "Clearing existing data..." });
    logger.info("Clearing existing data...");
    await prisma.counterMatchup.deleteMany();
    await prisma.champion.deleteMany();
    await (prisma as any).dataMeta.deleteMany();

    if (jobId) await updateSyncStatus(jobId, { progress: 98, message: "Updating database..." });
    logger.info(`Inserting ${normalizedChampions.length} champions...`);
    for (let i = 0; i < normalizedChampions.length; i++) {
      const champ = normalizedChampions[i];
      if (jobId) {
        const progress = 98 + (i / normalizedChampions.length) * 1;
        await updateSyncStatus(jobId, {
          progress: parseFloat(progress.toFixed(2)),
          message: `Saving ${champ.name} to core...`
        });
      }
      await prisma.champion.create({
        data: {
          id: champ.id,
          name: champ.name,
          roles: champ.roles.join(","),
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
          burstScore: champ.burstScore,
          rangeScore: champ.rangeScore,
          sustainScore: champ.sustainScore,
          teamfightScore: champ.teamfightScore,
          objectiveScore: champ.objectiveScore,
          tags: champ.tags.join(","),
          iconUrl: champ.iconUrl,
        } as any,
      });
    }

    logger.info(`Inserting ${finalCounters.length} counter matchups...`);
    for (const counter of finalCounters) {
      await prisma.counterMatchup.create({
        data: {
          championId: counter.championId,
          opponentId: counter.opponentId,
          value: counter.value,
        },
      });
    }

    await prisma.dataMeta.create({
      data: {
        id: "singleton",
        lastScrapedAt: new Date(),
        championCount: normalizedChampions.length,
        version: "1.0.0",
      },
    });

    if (jobId) {
      await updateSyncStatus(jobId, { 
        status: "COMPLETED", 
        progress: 100, 
        message: "Database synchronized successfully!" 
      });
    }
    logger.info("Database seeded successfully! ✓");

    const dbChampions = await prisma.champion.count();
    const dbCounters = await prisma.counterMatchup.count();
    logger.info("DB verification", { champions: dbChampions, counters: dbCounters });
  } finally {
    await prisma.$disconnect();
  }

  printSummary(normalizedChampions, finalCounters);
}

function printSummary(champions: any[], counters: any[]) {
  logger.info("═══════════════════════════════════════════════");
  logger.info("  PIPELINE SUMMARY");
  logger.info("═══════════════════════════════════════════════");
  logger.info(`Champions:         ${champions.length}`);
  logger.info(`Counter matchups:  ${counters.length}`);

  const roleCounts: Record<string, number> = {};
  for (const c of champions) {
    for (const r of c.roles) {
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }
  }
  logger.info("Role distribution:", roleCounts);

  const tierCounts: Record<string, number> = {};
  for (const c of champions) {
    tierCounts[c.tier] = (tierCounts[c.tier] || 0) + 1;
  }
  logger.info("Tier distribution:", tierCounts);
  logger.info("═══════════════════════════════════════════════");
}

main().catch(async (err) => {
  logger.error("SEED FAILED", { error: String(err), stack: (err as Error).stack });
  if (jobId) {
    await updateSyncStatus(jobId, { 
      status: "FAILED", 
      message: "Seeding failed: " + (err.message || String(err)) 
    });
  }
  process.exit(1);
});
