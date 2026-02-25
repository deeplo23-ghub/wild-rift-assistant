#!/usr/bin/env tsx
/**
 * Wild Rift Draft Assistant — Data Scraper
 *
 * Usage:
 *   npx tsx scripts/scrape.ts              # Full scrape
 *   npx tsx scripts/scrape.ts --dry-run    # Dry run (no network requests)
 *   npx tsx scripts/scrape.ts --limit 5    # Scrape only 5 champions
 *   npx tsx scripts/scrape.ts --output raw # Output raw JSON to stdout
 */

import { scrapeTierList } from "./scraper/tier-list";
import { scrapeAllChampionPages } from "./scraper/champion-page";
import { createLogger } from "./scraper/logger";
import { SCRAPER_CONFIG } from "./scraper/config";
import * as fs from "fs";
import * as path from "path";

// Parse CLI arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

const logger = createLogger(dryRun ? "debug" : SCRAPER_CONFIG.logLevel);

async function main() {
  logger.info("=== Wild Rift Draft Assistant Scraper ===");
  logger.info("Config", {
    dryRun,
    limit: limit === Infinity ? "all" : limit,
    baseUrl: SCRAPER_CONFIG.baseUrl,
  });
  
  // Step 1: Scrape tier list
  logger.info("--- Step 1: Scraping tier list ---");
  const tierEntries = dryRun ? [] : await scrapeTierList(logger);
  logger.info("Tier list result", { entries: tierEntries.length });
  
  if (!dryRun && tierEntries.length === 0) {
    logger.error("No entries found in tier list. Stopping.");
    process.exit(1);
  }

  // Step 2: Get unique champion page URLs
  const uniqueUrls = [...new Set(tierEntries.map(e => e.pageUrl))];
  const urls = uniqueUrls.slice(0, limit);
  logger.info("--- Step 2: Scraping champion pages ---", {
    unique: uniqueUrls.length,
    toScrape: urls.length,
  });
  
  // Step 3: Scrape individual champion pages
  const championPageData = await scrapeAllChampionPages(urls, logger, dryRun);
  
  // Step 4: Merge tier list data with champion page data
  logger.info("--- Step 3: Merging data ---");
  const merged = mergeTierListAndPages(tierEntries, championPageData);
  
  // Step 5: Write output
  const outputDir = path.join(__dirname, "scraper", "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, "raw-data.json");
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  logger.info("Raw data written", { path: outputPath, champions: merged.champions.length });
  
  // Summary
  logger.info("=== Scrape Complete ===");
  logger.info("Summary", {
    champions: merged.champions.length,
    counterPairs: merged.counterPairs.length,
    scrapeDate: merged.meta.scrapedAt,
  });
}

interface MergedData {
  meta: {
    scrapedAt: string;
    championCount: number;
    version: string;
  };
  champions: MergedChampion[];
  counterPairs: CounterPair[];
}

interface MergedChampion {
  id: string;
  name: string;
  roles: string[];
  winrate: number;
  pickRate: number;
  banRate: number;
  tier: string;
  roleTags: string[];
  iconUrl: string;
  pageUrl: string;
}

interface CounterPair {
  championId: string;
  threatId: string;
  category: "extreme";
}

function mergeTierListAndPages(
  tierEntries: any[],
  pageData: any[]
): MergedData {
  const championMap = new Map<string, MergedChampion>();
  const pageMap = new Map<string, any>();
  
  for (const pd of pageData) {
    if (pd.name) pageMap.set(pd.name.toUpperCase(), pd);
  }
  
  for (const entry of tierEntries) {
    const existing = championMap.get(entry.id);
    if (existing) {
      if (!existing.roles.includes(entry.role)) {
        existing.roles.push(entry.role);
      }
      if (entry.winrate > existing.winrate) {
        existing.winrate = entry.winrate;
        existing.banRate = entry.banRate;
        existing.tier = entry.tier;
      }
    } else {
      const pageInfo = pageMap.get(entry.name.toUpperCase());
      championMap.set(entry.id, {
        id: entry.id,
        name: entry.name,
        roles: [entry.role],
        winrate: pageInfo?.winrate || entry.winrate,
        pickRate: pageInfo?.pickRate || 0,
        banRate: pageInfo?.banRate || entry.banRate,
        tier: entry.tier,
        roleTags: pageInfo?.roleTags || [],
        iconUrl: entry.iconUrl,
        pageUrl: entry.pageUrl,
      });
    }
  }
  
  const counterPairs: CounterPair[] = [];
  for (const pd of pageData) {
    if (!pd.name) continue;
    const champId = [...championMap.values()].find(
      c => c.name.toUpperCase() === pd.name.toUpperCase()
    )?.id;
    
    if (!champId) continue;
    
    for (const threatName of pd.extremeThreats) {
      const threatId = [...championMap.values()].find(
        c => c.name.toUpperCase() === threatName.toUpperCase()
      )?.id;
      if (threatId) {
        counterPairs.push({ championId: champId, threatId, category: "extreme" });
      }
    }
  }
  
  return {
    meta: {
      scrapedAt: new Date().toISOString(),
      championCount: championMap.size,
      version: "1.0.0",
    },
    champions: [...championMap.values()],
    counterPairs,
  };
}

main().catch((error) => {
  console.error("Scraper failed", error);
  process.exit(1);
});
