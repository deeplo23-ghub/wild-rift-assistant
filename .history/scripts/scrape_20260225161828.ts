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
 * Pipeline:
 *   1. Scrape homepage → build complete name→URL mapping
 *   2. Scrape tier list → get roles, tiers, winrates for each champion
 *   3. Fill gaps from homepage (champions not on tier list)
 *   4. Scrape individual champion pages → detailed stats + counter data
 *   5. Merge, deduplicate, write output
 *
 * Output: scripts/scraper/output/raw-data.json (or raw-sample.json for --sample)
 */

import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import { scrapeTierList } from "./scraper/tier-list";
import { scrapeAllChampionPages, type ChampionPageData } from "./scraper/champion-page";
import { createLogger } from "./scraper/logger";
import { SCRAPER_CONFIG, CHAMPION_ROSTER } from "./scraper/config";
import { nameToId, sleep } from "./scraper/utils";
import { updateSyncStatus } from "./scraper/status-utils";

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sample = args.includes("--sample");
const force = args.includes("--force");
const jobIdIdx = args.indexOf("--job-id");
const jobId = jobIdIdx >= 0 ? args[jobIdIdx + 1] : null;
const limitIdx = args.indexOf("--limit");
const limit = sample ? 5 : limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const outputDir = path.join(__dirname, "scraper", "output");
const rawDataPath = path.join(outputDir, "raw-data.json");

const logger = createLogger(dryRun ? "debug" : "info");

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChampionRecord {
  id: string;
  name: string;
  pageUrl: string;
  roles: string[];
  tier: string;
  winrate: number;
  banRate: number;
  iconUrl: string;
}

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

  if (dryRun) {
    logger.info("DRY RUN — skipping all network requests");
    return;
  }

  // ── Step 1: Scan homepage for all champion URLs ─────────────────────────
  if (jobId) await updateSyncStatus(jobId, { progress: 5, message: "Scanning website..." });
  logger.info("── Step 1: Scanning homepage for champion URLs ──");
  const homepageMap = await scanHomepageChampions(logger);
  logger.info("Homepage scan complete", { found: homepageMap.size });

  // ── Step 2: Scrape tier list (all 5 role tabs) ──────────────────────────
  if (jobId) await updateSyncStatus(jobId, { progress: 15, message: "Scraping tier list..." });
  logger.info("── Step 2: Scraping tier list page ──");
  const tierEntries = await scrapeTierList(logger);

  // ── Step 3: Build unified champion roster ──────────────────────────────
  if (jobId) await updateSyncStatus(jobId, { progress: 30, message: "Building champion roster..." });
  logger.info("── Step 3: Building unified champion roster ──");
  const championMap = new Map<string, ChampionRecord>();

  // First: add all tier list entries
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

  logger.info("Champions from tier list", { count: championMap.size });

  // Second: fill missing champions from homepage + roster
  const expected = CHAMPION_ROSTER.map(([name]) => name.toUpperCase());
  const foundNames = new Set([...championMap.values()].map((c) => c.name.toUpperCase()));
  const missingNames = expected.filter((n) => !foundNames.has(n));

  if (missingNames.length > 0) {
    logger.info("Filling missing champions from homepage", {
      missing: missingNames,
      count: missingNames.length,
    });

    for (const missingName of missingNames) {
      // Try to find URL from homepage scan
      const url = homepageMap.get(missingName);
      if (!url) {
        logger.warn(`No URL found for missing champion: ${missingName}`);
        continue;
      }

      const rosterEntry = CHAMPION_ROSTER.find(
        ([n]) => n.toUpperCase() === missingName
      );
      const displayName = rosterEntry ? rosterEntry[0] : missingName;
      const id = nameToId(displayName);

      championMap.set(id, {
        id,
        name: missingName, // Will be corrected from page data
        pageUrl: url.startsWith("http") ? url : `${SCRAPER_CONFIG.baseUrl}${url}`,
        roles: [], // Will be filled from page data
        tier: "B", // Default tier for untiered champions
        winrate: 0,
        banRate: 0,
        iconUrl: "",
      });
    }
  }

  const uniqueChampions = [...championMap.values()];
  logger.info("Unified roster", {
    total: uniqueChampions.length,
    expected: SCRAPER_CONFIG.expectedChampionCount,
    fromTierList: uniqueChampions.filter((c) => c.roles.length > 0).length,
    filledFromHomepage: uniqueChampions.filter((c) => c.roles.length === 0).length,
  });

  // Fail condition: champion count check
  if (limit === Infinity && uniqueChampions.length < SCRAPER_CONFIG.expectedChampionCount) {
    logger.error("FAIL: Champion count below expected", {
      found: uniqueChampions.length,
      expected: SCRAPER_CONFIG.expectedChampionCount,
    });
    logger.error("Pipeline halted.");
    process.exit(1);
  }

  // ── Step 4: Scrape individual champion pages ───────────────────────────
  logger.info("── Step 4: Scraping champion pages ──");

  // Load existing data for incremental sync
  let cachedData: any = null;
  if (!force && fs.existsSync(rawDataPath)) {
    try {
      cachedData = JSON.parse(fs.readFileSync(rawDataPath, "utf-8"));
      logger.info("Loaded previous scrape data for incremental sync");
    } catch (e) {
      logger.warn("Could not parse previous data, performing full scrape");
    }
  }

  const pagesToScrape = uniqueChampions.slice(0, limit).filter(champ => {
    if (force || !cachedData) return true;
    const cached = cachedData.champions.find((c: any) => c.id === champ.id);
    // Only skip if the page was successfully scraped before
    const hasData = cached && cached.isScraped;
    return !hasData;
  });

  const urls = pagesToScrape.map((c) => c.pageUrl);
  logger.info(`Queueing ${urls.length} pages (skipping ${uniqueChampions.length - urls.length} cached)`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let pageData: ChampionPageData[] = [];
  try {
    pageData = await scrapeAllChampionPages(urls, logger, browser, false, jobId);
  } finally {
    await browser.close();
  }

  // Combine new data with cached data
  const pageMap = new Map<string, ChampionPageData>();
  
  // Start with cached data
  if (cachedData) {
    for (const c of cachedData.champions) {
      pageMap.set(c.name.toUpperCase(), {
        name: c.name,
        pageUrl: c.pageUrl,
        winrate: c.winrate,
        pickRate: c.pickRate,
        banRate: c.banRate,
        tier: c.tier,
        roleTags: c.roleTags,
        extremeThreats: c.extremeThreats,
        extremeSynergies: c.extremeSynergies,
        isScraped: c.isScraped || false
      } as any);
    }
  }

  // Overlay new data
  for (const pd of pageData) {
    if (pd.name) pageMap.set(pd.name.toUpperCase(), pd);
  }

  const mergedChampions: any[] = [];
  for (const champ of uniqueChampions) {
    const pd = pageMap.get(champ.name.toUpperCase());

    // For champions filled from homepage, use page data to fill fields
    let roles = champ.roles;
    if (roles.length === 0 && pd?.roleTags) {
      // Infer a default role from role tags
      const tagToRole: Record<string, string> = {
        marksman: "dragon",
        mage: "mid",
        assassin: "mid",
        tank: "baron",
        fighter: "baron",
        support: "support",
      };
      for (const tag of pd.roleTags) {
        const role = tagToRole[tag];
        if (role && !roles.includes(role)) {
          roles = [...roles, role];
        }
      }
      if (roles.length === 0) roles = ["mid"]; // Final fallback
    }

    mergedChampions.push({
      id: champ.id,
      name: pd?.name || champ.name,
      roles,
      winrate: pd?.winrate || champ.winrate,
      pickRate: pd?.pickRate || 0,
      banRate: pd?.banRate || champ.banRate,
      tier: champ.tier,
      roleTags: pd?.roleTags || [],
      iconUrl: champ.iconUrl,
      pageUrl: champ.pageUrl,
      extremeThreats: pd?.extremeThreats || [],
      extremeSynergies: pd?.extremeSynergies || [],
      isScraped: pd?.isScraped || false,
    });
  }

  // Build counter pairs
  const allIds = new Set(mergedChampions.map((c: any) => c.id));
  const counterPairs: { championId: string; threatId: string; category: string }[] = [];
  for (const champ of mergedChampions) {
    for (const threatName of champ.extremeThreats) {
      const threatId = nameToId(threatName);
      if (allIds.has(threatId)) {
        counterPairs.push({
          championId: champ.id,
          threatId,
          category: "extreme",
        });
      }
    }
  }

  // ── Step 6: Duplicate check ────────────────────────────────────────────
  const nameSet = new Set<string>();
  const duplicates: string[] = [];
  for (const c of mergedChampions) {
    const key = c.name.toUpperCase();
    if (nameSet.has(key)) {
      duplicates.push(c.name);
    }
    nameSet.add(key);
  }

  if (duplicates.length > 0) {
    logger.error("FAIL: Duplicate champion names", { duplicates });
    process.exit(1);
  }

  // ── Step 7: Write output ───────────────────────────────────────────────
  if (jobId) await updateSyncStatus(jobId, { progress: 95, message: "Finalizing data..." });
  logger.info("── Step 6: Writing output ──");
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
  printSummary(mergedChampions, counterPairs, pageData.length);
}

// ─── Homepage Scanner ────────────────────────────────────────────────────────

async function scanHomepageChampions(
  logger: Logger
): Promise<Map<string, string>> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);

  try {
    await page.goto(SCRAPER_CONFIG.baseUrl, {
      waitUntil: "networkidle2",
      timeout: SCRAPER_CONFIG.timeoutMs,
    });

    const champMap: Record<string, string> = await page.evaluate(() => {
      const map: Record<string, string> = {};
      const links = document.querySelectorAll("a[href]");
      for (const link of links) {
        const href = link.getAttribute("href") || "";
        if (
          href.match(/\/\d+-[\w-]+\.html/) &&
          !href.includes("item") &&
          !href.includes("rune") &&
          !href.includes("build")
        ) {
          const name = (link.textContent || "").trim().toUpperCase();
          if (name && name.length > 1 && name.length < 30) {
            if (!map[name]) map[name] = href;
          }
        }
      }
      return map;
    });

    const result = new Map<string, string>();
    for (const [name, href] of Object.entries(champMap)) {
      result.set(name, href.startsWith("http") ? href : `${SCRAPER_CONFIG.baseUrl}${href}`);
    }

    return result;
  } finally {
    await browser.close();
  }
}

// ─── Summary Printer ─────────────────────────────────────────────────────────

function printSummary(
  champions: any[],
  counterPairs: any[],
  pagesScraped: number
) {
  logger.info("═══════════════════════════════════════════════");
  logger.info("  SCRAPE COMPLETE");
  logger.info("═══════════════════════════════════════════════");
  logger.info(`Champions:     ${champions.length}`);
  logger.info(`Pages scraped: ${pagesScraped}`);
  logger.info(`Counter pairs: ${counterPairs.length}`);

  const roleCounts: Record<string, number> = {};
  for (const c of champions) {
    for (const r of c.roles) {
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }
  }
  logger.info("Roles:", roleCounts);

  const tierCounts: Record<string, number> = {};
  for (const c of champions) {
    tierCounts[c.tier] = (tierCounts[c.tier] || 0) + 1;
  }
  logger.info("Tiers:", tierCounts);

  const missing = {
    noWinrate: champions.filter((c) => !c.winrate).length,
    noRoles: champions.filter((c) => !c.roles.length).length,
    noTier: champions.filter((c) => !c.tier).length,
    noRoleTags: champions.filter((c) => !c.roleTags.length).length,
  };
  if (Object.values(missing).some((v) => v > 0)) {
    logger.warn("Missing fields:", missing);
  }
  logger.info("═══════════════════════════════════════════════");
}

type Logger = ReturnType<typeof createLogger>;

main().catch(async (err) => {
  logger.error("SCRAPER FAILED", { error: String(err), stack: (err as Error).stack });
  if (jobId) {
    await updateSyncStatus(jobId, {
      status: "FAILED",
      message: "Scraping failed: " + (err.message || String(err))
    });
  }
  process.exit(1);
});
