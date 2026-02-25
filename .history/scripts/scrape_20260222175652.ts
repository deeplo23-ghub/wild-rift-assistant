#!/usr/bin/env tsx
import { scrapeTierList } from "./scraper/tier-list";
import { scrapeAllChampionPages } from "./scraper/champion-page";
import { createLogger } from "./scraper/logger";
import { SCRAPER_CONFIG } from "./scraper/config";
import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sampleMode = args.includes("--sample");
const limit = sampleMode ? 5 : Infinity;

const logger = createLogger(dryRun ? "debug" : SCRAPER_CONFIG.logLevel);

async function main() {
  logger.info("=== Wild Rift Draft Assistant Scraper ===");
  
  // Step 1: Scrape tier list
  const tierEntries = await scrapeTierList(logger);
  
  // Deduplicate by name and prioritize first occurrence (main role)
  const championMap = new Map();
  for (const entry of tierEntries) {
    if (!championMap.has(entry.name)) {
      championMap.set(entry.name, entry);
    }
  }
  
  const uniqueChampions = [...championMap.values()];
  logger.info("Unique champions identified", { count: uniqueChampions.length });
  
  if (!sampleMode && uniqueChampions.length !== SCRAPER_CONFIG.targetChampionCount) {
    logger.error(`Champion count discrepancy! Found ${uniqueChampions.length}, expected ${SCRAPER_CONFIG.targetChampionCount}`);
    if (!args.includes("--force")) {
       logger.error("Stopping. Use --force to continue anyway.");
       process.exit(1);
    }
  }

  const toScrape = uniqueChampions.slice(0, limit);
  logger.info(`Starting page scrape for ${toScrape.length} champions`);

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const pageResults = await scrapeAllChampionPages(browser, toScrape.map(c => c.pageUrl), logger);
    
    // Merge data
    const merged = {
      meta: {
        scrapedAt: new Date().toISOString(),
        championCount: pageResults.length,
        version: "1.0.0"
      },
      champions: pageResults.map(pr => {
        const tierData = championMap.get(pr.name) || championMap.get(pr.name.toUpperCase());
        return {
          id: tierData?.id || "unknown",
          name: pr.name,
          roles: tierEntries.filter(te => te.name === pr.name).map(te => te.role),
          winrate: pr.winrate || tierData?.winrate || 0,
          pickRate: pr.pickRate || 0,
          banRate: pr.banRate || tierData?.banRate || 0,
          tier: pr.tier || tierData?.tier || "B",
          roleTags: pr.roleTags,
          iconUrl: tierData?.iconUrl || "",
          pageUrl: pr.pageUrl,
          extremeThreats: pr.extremeThreats,
          extremeSynergies: pr.extremeSynergies
        };
      })
    };

    const outputDir = path.join(__dirname, "scraper", "output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const fileName = sampleMode ? "raw-sample.json" : "raw-data.json";
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
    
    logger.info(`Scrape complete. Data saved to ${outputPath}`);
    
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  logger.error("Scraper fatal error", { error: String(err) });
  process.exit(1);
});
