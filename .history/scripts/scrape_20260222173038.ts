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
  
  let uniqueChampions = [...championMap.values()];
  logger.info("Ranked champions found", { count: uniqueChampions.length });
  
  // If we have less than 135, supplement from homepage
  if (!sampleMode && uniqueChampions.length < SCRAPER_CONFIG.targetChampionCount) {
    logger.info(`Supplementing with unranked champions to reach ${SCRAPER_CONFIG.targetChampionCount}`);
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
      await page.goto(SCRAPER_CONFIG.baseUrl, { waitUntil: "networkidle2" });
      const homepageLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*=".html"]');
        return [...links].map(a => {
           const href = (a as HTMLAnchorElement).href;
           const text = a.textContent?.trim() || "";
           return { href, text };
        }).filter(l => /\/\d+-[\w-]+\.html/.test(l.href));
      });

      for (const link of homepageLinks) {
        if (uniqueChampions.length >= SCRAPER_CONFIG.targetChampionCount) break;
        
        // Clean name (remove "Wild Rift" etc if present)
        const name = link.text.replace(/Build Guide|Wild Rift/gi, "").trim();
        if (!name) continue;

        if (!uniqueChampions.some(c => c.name.toUpperCase() === name.toUpperCase())) {
          uniqueChampions.push({
            id: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            name: name,
            pageUrl: link.href,
            role: "unknown",
            tier: "B",
            winrate: 50.0,
            banRate: 0.1,
            iconUrl: ""
          });
        }
      }
    } finally {
      await browser.close();
    }
  }

  logger.info("Final champion set ready", { count: uniqueChampions.length });

  if (!sampleMode && uniqueChampions.length !== SCRAPER_CONFIG.targetChampionCount) {
    logger.error(`Champion count mismatch! Found ${uniqueChampions.length}, expected ${SCRAPER_CONFIG.targetChampionCount}`);
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
    const champions = pageResults.map(pr => {
      const tierData = uniqueChampions.find(c => c.pageUrl === pr.pageUrl);
      const roles = tierEntries.filter(te => te.pageUrl === pr.pageUrl).map(te => te.role);
      
      return {
        id: tierData?.id || "unknown",
        name: pr.name || tierData?.name || "Unknown",
        roles: roles.length > 0 ? roles : (pr.roleTags.length > 0 ? pr.roleTags : ["unknown"]),
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
    });

    const merged = {
      meta: {
        scrapedAt: new Date().toISOString(),
        championCount: champions.length,
        version: "1.0.0"
      },
      champions
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
