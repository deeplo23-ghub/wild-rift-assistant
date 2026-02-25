#!/usr/bin/env tsx
/**
 * Wild Rift Draft Assistant — Data Scraper
 *
 * Usage:
 *   npx tsx scripts/scrape.ts              # Full scrape (all champions)
 *   npx tsx scripts/scrape.ts --dry-run    # Dry run (no network)
 *   npx tsx scripts/scrape.ts --limit 5    # Scrape only N champion pages
 *   npx tsx scripts/scrape.ts --sample     # Alias for --limit 5 (sample mode)
 *
 * Output: scripts/scraper/output/raw-data.json
 */

import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import { scrapeTierList, type TierListEntry } from "./scraper/tier-list";
import { scrapeAllChampionPages, type ChampionPageData } from "./scraper/champion-page";
import { createLogger } from "./scraper/logger";
import { SCRAPER_CONFIG } from "./scraper/config";
import { nameToId } from "./scraper/utils";

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sample = args.includes("--sample");
const limitIdx = args.indexOf("--limit");
const limit = sample ? 5 : limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const outputDir = path.join(__dirname, "scraper", "output");

const logger = createLogger(dryRun ? "debug" : "info");

// ─── Main Pipeline ──────────────────────────────────────────────────────────

async function main() {
  logger.info("═══════════════════════════════════════════════");
  logger.info("  Wild Rift Draft Assistant — Scraper Pipeline ");
  logger.info("═══════════════════════════════════════════════");
  logger.info("Config", {
    dryRun,
    limit: limit === Infinity ? "ALL" : limit,
    expected: SCRAPER_CONFIG.expectedChampionCount,
  });

  // ── Step 1: Scrape tier list ────────────────────────────────────────────
  logger.info("── Step 1: Scraping tier list page ──");
  const tierEntries = dryRun ? [] : await scrapeTierList(logger);

  if (dryRun) {
    logger.info("DRY RUN — skipping all network requests");
    return;
  }

  // ── Step 2: Deduplicate into unique champions ──────────────────────────
  logger.info("── Step 2: Building unique champion roster ──");
  const championMap = new Map<string, {
    id: string;
    name: string;
    pageUrl: string;
    roles: string[];
    tier: string;
    winrate: number;
    banRate: number;
    iconUrl: string;
  }>();

  for (const entry of tierEntries) {
    const existing = championMap.get(entry.id);
    if (existing) {
      // Add role if not present
      if (!existing.roles.includes(entry.role)) {
        existing.roles.push(entry.role);
      }
      // Keep better winrate data
      if (entry.winrate > existing.winrate) {
        existing.winrate = entry.winrate;
        existing.banRate = entry.banRate;
        existing.tier = entry.tier;
      }
    } else {
      championMap.set(entry.id, {
        id: entry.id,
        name: entry.name,
        pageUrl: entry.pageUrl,
        roles: [entry.role],
        tier: entry.tier,
        winrate: entry.winrate,
        banRate: entry.banRate,
        iconUrl: entry.iconUrl,
      });
    }
  }

  const uniqueChampions = [...championMap.values()];
  logger.info("Unique champions from tier list", {
    unique: uniqueChampions.length,
    expected: SCRAPER_CONFIG.expectedChampionCount,
    tierEntries: tierEntries.length,
  });

  // Fail condition: champion count check (if full scrape)
  if (limit === Infinity) {
    if (uniqueChampions.length < SCRAPER_CONFIG.expectedChampionCount) {
      logger.error("FAIL: Champion count below expected", {
        found: uniqueChampions.length,
        expected: SCRAPER_CONFIG.expectedChampionCount,
      });
      logger.error("Pipeline halted. Check tier list page structure.");
      process.exit(1);
    }
  }

  // ── Step 3: Scrape individual champion pages ───────────────────────────
  logger.info("── Step 3: Scraping champion pages ──");
  const pagesToScrape = uniqueChampions.slice(0, limit);
  const urls = pagesToScrape.map((c) => c.pageUrl);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let pageData: ChampionPageData[] = [];
  try {
    pageData = await scrapeAllChampionPages(urls, logger, browser);
  } finally {
    await browser.close();
  }

  // ── Step 4: Merge tier list + page data ────────────────────────────────
  logger.info("── Step 4: Merging data ──");
  const pageMap = new Map<string, ChampionPageData>();
  for (const pd of pageData) {
    if (pd.name) pageMap.set(pd.name.toUpperCase(), pd);
  }

  // Build merged champion records
  const mergedChampions: any[] = [];
  for (const champ of uniqueChampions) {
    const pd = pageMap.get(champ.name.toUpperCase());
    mergedChampions.push({
      id: champ.id,
      name: champ.name,
      roles: champ.roles,
      winrate: pd?.winrate || champ.winrate,
      pickRate: pd?.pickRate || 0,
      banRate: pd?.banRate || champ.banRate,
      tier: champ.tier,
      roleTags: pd?.roleTags || [],
      iconUrl: champ.iconUrl,
      pageUrl: champ.pageUrl,
      extremeThreats: pd?.extremeThreats || [],
      extremeSynergies: pd?.extremeSynergies || [],
    });
  }

  // Build counter pairs
  const counterPairs: { championId: string; threatId: string; category: string }[] = [];
  for (const champ of mergedChampions) {
    for (const threatName of champ.extremeThreats) {
      const threatId = nameToId(threatName);
      // Verify the threat champion exists in our roster
      if (championMap.has(threatId)) {
        counterPairs.push({
          championId: champ.id,
          threatId,
          category: "extreme",
        });
      }
    }
  }

  // ── Step 5: Check for duplicates ───────────────────────────────────────
  const nameSet = new Set<string>();
  const duplicates: string[] = [];
  for (const c of mergedChampions) {
    if (nameSet.has(c.name.toUpperCase())) {
      duplicates.push(c.name);
    }
    nameSet.add(c.name.toUpperCase());
  }

  if (duplicates.length > 0) {
    logger.error("FAIL: Duplicate champion names detected", { duplicates });
    process.exit(1);
  }

  // ── Step 6: Write output ───────────────────────────────────────────────
  logger.info("── Step 5: Writing output ──");
  fs.mkdirSync(outputDir, { recursive: true });

  const output = {
    meta: {
      scrapedAt: new Date().toISOString(),
      championCount: mergedChampions.length,
      version: "1.0.0",
      pagesScraped: pageData.length,
    },
    champions: mergedChampions,
    counterPairs,
  };

  const filename = sample || limit < Infinity ? "raw-sample.json" : "raw-data.json";
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  logger.info("Output written", { path: outputPath });

  // ── Summary ────────────────────────────────────────────────────────────
  logger.info("═══════════════════════════════════════════════");
  logger.info("  SCRAPE COMPLETE");
  logger.info("═══════════════════════════════════════════════");
  logger.info(`Champions:    ${mergedChampions.length}`);
  logger.info(`Pages scraped: ${pageData.length}`);
  logger.info(`Counter pairs: ${counterPairs.length}`);

  const roleCounts: Record<string, number> = {};
  for (const c of mergedChampions) {
    for (const r of c.roles) {
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }
  }
  logger.info("Roles:", roleCounts);

  const tierCounts: Record<string, number> = {};
  for (const c of mergedChampions) {
    tierCounts[c.tier] = (tierCounts[c.tier] || 0) + 1;
  }
  logger.info("Tiers:", tierCounts);

  // Warn on missing fields
  const missing = {
    noWinrate: mergedChampions.filter((c) => !c.winrate).length,
    noRoles: mergedChampions.filter((c) => !c.roles.length).length,
    noTier: mergedChampions.filter((c) => !c.tier).length,
    noName: mergedChampions.filter((c) => !c.name).length,
    noRoleTags: mergedChampions.filter((c) => !c.roleTags.length).length,
  };
  if (Object.values(missing).some((v) => v > 0)) {
    logger.warn("Missing fields:", missing);
  }
  logger.info("═══════════════════════════════════════════════");
}

main().catch((err) => {
  logger.error("SCRAPER FAILED", { error: String(err), stack: (err as Error).stack });
  process.exit(1);
});
