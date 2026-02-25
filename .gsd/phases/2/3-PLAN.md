# Phase 2 — Plan 3: Database Seeding + Pipeline Integration

> **Wave**: 3 of 3
> **Dependencies**: Plan 2.1 (scraper) + Plan 2.2 (normalization)
> **Scope**: Seed script, full pipeline integration, dry-run validation, error reporting

---

## Context

You have:
1. A working scraper (`scripts/scrape.ts`) that produces `raw-data.json`
2. A normalization layer (`src/lib/data/normalize.ts`) that transforms raw → normalized
3. Prisma schema with Champion, CounterMatchup, DataMeta models

This plan wires them together into a complete, reproducible pipeline.

Read these files first:
- `prisma/schema.prisma` — Database models
- `src/lib/data/normalize.ts` — Normalization function
- `src/lib/data/validation.ts` — Zod schemas
- `scripts/scrape.ts` — Scraper entry point

---

## Tasks

### Task 1: Create the database seed script

<task id="2.3.1" depends="">
<action>

Create `scripts/seed.ts`:

This script takes normalized data and inserts it into the database using Prisma.
It supports both:
- **Live mode**: Reads `raw-data.json`, normalizes, and writes to DB
- **Dry-run mode**: Validates data without touching DB

```typescript
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

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizeRawData } from "../src/lib/data/normalize";
import { RawDataSchema } from "../src/lib/data/validation";
import { createLogger } from "./scraper/logger";

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
  
  const adapter = new PrismaPg({ connectionString });
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
    tierCounts[c.tier] = (tierCounts[c.tier] || 0) + 1;
  }
  logger.info("Tier distribution:", tierCounts);
  logger.info("═══════════════════════════════════════════");
}

main().catch((error) => {
  logger.error("Seed script failed", { error: String(error) });
  process.exit(1);
});
```

</action>

<verify>
- `npx tsc --noEmit` passes
- `npx tsx scripts/seed.ts --dry-run` completes without errors (if raw-data.json exists)
- Output shows: champion count, counter count, role distribution, tier distribution
- `normalized-data.json` is written alongside `raw-data.json`
</verify>

<done>
- `scripts/seed.ts` with full seeding pipeline
- Reads raw-data.json → validates → normalizes → seeds DB
- Dry-run mode validates without DB writes
- Custom input file support
- Error reporting with non-fatal validation error collection
- Summary with role and tier distribution
- Writes `normalized-data.json` for debugging
</done>
</task>

### Task 2: Add npm scripts for pipeline commands

<task id="2.3.2" depends="2.3.1">
<action>

Update `package.json` to add pipeline convenience scripts:

```json
{
  "scripts": {
    "scrape": "tsx scripts/scrape.ts",
    "scrape:dry": "tsx scripts/scrape.ts --dry-run",
    "scrape:test": "tsx scripts/scrape.ts --limit 5",
    "seed": "tsx scripts/seed.ts",
    "seed:dry": "tsx scripts/seed.ts --dry-run",
    "pipeline": "tsx scripts/scrape.ts && tsx scripts/seed.ts --dry-run",
    "pipeline:full": "tsx scripts/scrape.ts && tsx scripts/seed.ts"
  }
}
```

Also install `tsx` as a dev dependency:
```bash
npm install -D tsx
```

</action>

<verify>
- `npm run scrape:dry` works
- `npm run seed:dry` works (after scraping at least once)
</verify>

<done>
- npm scripts: scrape, scrape:dry, scrape:test, seed, seed:dry, pipeline, pipeline:full
- tsx installed for running TypeScript scripts directly
</done>
</task>

### Task 3: Verify full pipeline end-to-end

<task id="2.3.3" depends="2.3.2">
<action>

Run the complete pipeline to verify everything works:

1. `npm run scrape:test` — scrape 5 champions only (fast)
2. `npm run seed:dry` — validate normalized data without DB
3. Inspect `scripts/scraper/output/raw-data.json` — should have 5 champions
4. Inspect `scripts/scraper/output/normalized-data.json` — should have normalized champions with:
   - Valid roles (baron/jungle/mid/dragon/support)
   - Damage profiles summing to ~1.0
   - Attribute scores in 0-10 range
   - Tags derived from role tags
5. `npx next build` — full build still passes

Fix any issues found during verification.

</action>

<verify>
- `npm run scrape:test` exits 0
- `npm run seed:dry` exits 0 and prints summary
- `raw-data.json` has valid structure
- `normalized-data.json` has valid structure
- `npx next build` passes
- Git commit: all Phase 2 files committed
</verify>

<done>
- Full pipeline verified end-to-end
- Raw data → Normalization → Validation → DB-ready output
- Build passes with all new code
- Phase 2 committed
</done>
</task>

---

## Success Criteria

1. ✅ `scripts/seed.ts` seeds database from raw-data.json
2. ✅ `--dry-run` validates without touching DB
3. ✅ npm scripts work: `scrape`, `scrape:dry`, `scrape:test`, `seed`, `seed:dry`, `pipeline`
4. ✅ Full pipeline tested with `--limit 5` + `--dry-run`
5. ✅ `normalized-data.json` output with valid champion data
6. ✅ Summary reporter shows role + tier distribution
7. ✅ Build passes (`npx next build`)
8. ✅ All Phase 2 files committed to git
