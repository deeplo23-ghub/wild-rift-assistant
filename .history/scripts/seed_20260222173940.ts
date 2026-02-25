#!/usr/bin/env tsx
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizeChampion } from "../src/lib/data/normalize";
import { RawDataSchema, NormalizedChampionSchema } from "../src/lib/data/validation";
import { createLogger } from "./scraper/logger";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sampleMode = args.includes("--sample");
const fileName = sampleMode ? "raw-sample.json" : "raw-data.json";
const inputPath = path.join(__dirname, "scraper", "output", fileName);

const logger = createLogger("info");

async function main() {
  logger.info("=== Wild Rift Draft Assistant Seeder ===\n");
  
  if (!fs.existsSync(inputPath)) {
    logger.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const rawJson = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const rawParse = RawDataSchema.safeParse(rawJson);
  
  if (!rawParse.success) {
    logger.error("Raw data validation failed", { errors: rawParse.error.issues });
    process.exit(1);
  }

  const { champions } = rawParse.data;
  logger.info(`Validated ${champions.length} raw champions`);

  const normalized = champions.map(c => normalizeChampion(c));
  
  if (!sampleMode && normalized.length !== 135) {
     logger.error(`Champion count mismatch! Expected 135, got ${normalized.length}`);
     if (!args.includes("--force")) process.exit(1);
  }

  for (const nc of normalized) {
    const res = NormalizedChampionSchema.safeParse(nc);
    if (!res.success) {
      logger.error(`Validation failed for ${nc.name}`, { errors: res.error.issues });
      process.exit(1);
    }
  }

  logger.info("All champions passed normalization and validation");

  if (dryRun) {
    logger.info("DRY RUN: No database changes made.");
    return;
  }

  let dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.includes("prisma+postgres://")) {
    try {
      const b64 = dbUrl.split("api_key=")[1];
      const json = JSON.parse(Buffer.from(b64, "base64").toString());
      dbUrl = json.databaseUrl;
      logger.info("Using extracted native DB URL");
    } catch (e) {}
  }

  const adapter = new PrismaPg({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.counterMatchup.deleteMany();
    await prisma.champion.deleteMany();
    await prisma.dataMeta.deleteMany();

    logger.info("Cleared existing records");

    for (const nc of normalized) {
      await prisma.champion.create({ data: nc });
      // Small pause to be gentle on local dev server
      await new Promise(r => setTimeout(r, 100));
    }
    logger.info(`Seeded ${normalized.length} champions`);

    let counterCount = 0;
    for (const raw of champions) {
      for (const threatName of raw.extremeThreats) {
        const threatId = normalized.find(n => n.name.toUpperCase() === threatName.toUpperCase())?.id;
        if (threatId) {
          await prisma.counterMatchup.create({
            data: {
              championId: raw.id,
              opponentId: threatId,
              value: -5
            }
          });
          await new Promise(r => setTimeout(r, 100));
          counterCount++;
        }
      }
    }
    logger.info(`Seeded ${counterCount} counter matchups`);

    await prisma.dataMeta.create({
      data: {
        id: "singleton",
        lastScrapedAt: new Date(),
        championCount: normalized.length,
        version: "1.0.0"
      }
    });

    logger.info("DataMeta updated. Seed complete!");
    
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  logger.error("Seed script fatal error", { error: String(err) });
  process.exit(1);
});
