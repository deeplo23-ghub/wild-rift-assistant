# Phase 2 — Plan 1: Scraper Infrastructure + Champion Data Extraction

> **Wave**: 1 of 3
> **Dependencies**: Phase 1 complete (types, schema, Prisma)
> **Scope**: Install scraping deps, build core scraper module, extract champion list + base stats

---

## Context

You are building the data pipeline for a Wild Rift Draft Assistant. This plan creates the scraper module that extracts champion base data (winrate, pickrate, banrate, tier, roles) from wr-meta.com.

Read these files first for context:
- `.gsd/phases/2/RESEARCH.md` — wr-meta.com HTML structure (CSS selectors, page layouts)
- `src/types/champion.ts` — Champion interface (the target data shape)
- `prisma/schema.prisma` — Database models

---

## Tasks

### Task 1: Install scraping dependencies

<task id="2.1.1" depends="">
<action>

Install the scraping packages:
```bash
npm install puppeteer cheerio
npm install -D @types/cheerio
```

Puppeteer is needed because some champion page data is JS-rendered (stat carousels, tab switching). Cheerio will parse HTML where possible.

</action>

<verify>
- `npx tsc --noEmit` passes
- `node -e "require('puppeteer'); require('cheerio'); console.log('OK')"` prints "OK"
</verify>

<done>
- puppeteer and cheerio installed
- TypeScript types available
- Build still passes
</done>
</task>

### Task 2: Create scraper configuration and utilities

<task id="2.1.2" depends="2.1.1">
<action>

Create `scripts/scraper/config.ts`:
```typescript
// Scraper configuration — all tuning knobs in one place

export const SCRAPER_CONFIG = {
  /** Base URL for wr-meta.com */
  baseUrl: "https://wr-meta.com",
  
  /** Tier list page URL */
  tierListUrl: "https://wr-meta.com/meta/",
  
  /** Delay between requests in ms (be polite) */
  requestDelayMs: 1500,
  
  /** Maximum concurrent requests */
  maxConcurrent: 1,
  
  /** Request timeout in ms */
  timeoutMs: 30000,
  
  /** User-Agent header */
  userAgent: "WildRiftDraftAssistant/1.0 (research-tool)",
  
  /** Maximum retries per page */
  maxRetries: 3,
  
  /** Retry delay base (exponential backoff) */
  retryBaseDelayMs: 2000,
  
  /** Log level */
  logLevel: "info" as "debug" | "info" | "warn" | "error",
} as const;
```

Create `scripts/scraper/logger.ts`:
```typescript
// Simple structured logger for scraper pipeline

type LogLevel = "debug" | "info" | "warn" | "error";
const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export function createLogger(minLevel: LogLevel = "info") {
  const threshold = LEVELS[minLevel];
  
  function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (LEVELS[level] < threshold) return;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase().padEnd(5)}]`;
    const suffix = data ? ` ${JSON.stringify(data)}` : "";
    console.log(`${prefix} ${message}${suffix}`);
  }
  
  return {
    debug: (msg: string, data?: Record<string, unknown>) => log("debug", msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log("info", msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log("warn", msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log("error", msg, data),
  };
}

export type Logger = ReturnType<typeof createLogger>;
```

Create `scripts/scraper/utils.ts`:
```typescript
// Utility functions for the scraper

import { SCRAPER_CONFIG } from "./config";

/** Sleep for the configured delay between requests */
export function sleep(ms: number = SCRAPER_CONFIG.requestDelayMs): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Retry a function with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries: number = SCRAPER_CONFIG.maxRetries
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = SCRAPER_CONFIG.retryBaseDelayMs * Math.pow(2, attempt - 1);
      console.log(`  ⟳ Retry ${attempt}/${maxRetries} for "${label}" in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error("unreachable");
}

/** Extract numeric ID from a champion URL like "/6-lee-sin.html" */
export function extractChampionId(url: string): string {
  const match = url.match(/\/(\d+-[\w-]+)\.html/);
  if (!match) throw new Error(`Invalid champion URL: ${url}`);
  return match[1]; // e.g., "6-lee-sin"
}

/** Convert a champion name to kebab-case ID */
export function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Parse a percentage string like "48.49%" to a number */
export function parsePercent(text: string): number {
  const match = text.match(/([\d.]+)%/);
  if (!match) return 0;
  return parseFloat(match[1]);
}

/** Normalize tier string (handle S+ vs Sp vs S-Plus) */
export function normalizeTier(rawTier: string): string {
  const tier = rawTier.trim().toUpperCase();
  if (tier === "SP" || tier === "S-PLUS" || tier === "S PLUS") return "S+";
  if (["S", "S+", "A", "B", "C", "D"].includes(tier)) return tier;
  // If tier is from CSS class like "tier-sp" → "S+"
  if (tier.endsWith("SP")) return "S+";
  return tier;
}
```

</action>

<verify>
- All 3 files compile: `npx tsc --noEmit --project tsconfig.json` (may need tsconfig for scripts/)
- No import errors
</verify>

<done>
- `scripts/scraper/config.ts` with all configuration constants
- `scripts/scraper/logger.ts` with structured logging
- `scripts/scraper/utils.ts` with sleep, retry, parsing utilities
</done>
</task>

### Task 3: Scrape tier list page (all champions + roles + tiers)

<task id="2.1.3" depends="2.1.2">
<action>

Create `scripts/scraper/tier-list.ts`:

This module scrapes `wr-meta.com/meta/` to get the champion roster with roles and tiers.

HTML structure from RESEARCH.md:
- Champion cards: `.wr-tl-card` inside `.wr-cn-slot` containers
- Slot class encodes role + tier: `{role}-line-tier-{tier}` (sp, s, a, b)
- Card link: `a[href]` → champion page URL
- Card name: `.top-title`
- Win rate: `.wr-tl-ov-i` first span (trophy icon)
- Ban rate: `.wr-tl-ov-i` second span (ban icon)

Since this page **requires JavaScript** to render the tier cards, use **Puppeteer**:

```typescript
import puppeteer from "puppeteer";
import type { Logger } from "./logger";
import { SCRAPER_CONFIG } from "./config";
import { sleep, nameToId, parsePercent, normalizeTier } from "./utils";

interface TierListEntry {
  id: string;           // kebab-case (from name)
  name: string;         // display name
  pageUrl: string;      // full URL to champion page
  role: string;         // baron, jungle, mid, dragon, support
  tier: string;         // S+, S, A, B, C, D
  winrate: number;      // 0-100
  banRate: number;      // 0-100
  iconUrl: string;      // champion icon
}

// Map wr-meta role slugs to our Role enum values
const ROLE_MAP: Record<string, string> = {
  "mid": "mid",
  "solo": "baron",
  "jungle": "jungle",
  "duo": "dragon",
  "support": "support",
};

// Map CSS tier suffix to tier string
const TIER_MAP: Record<string, string> = {
  "sp": "S+",
  "s": "S",
  "a": "A",
  "b": "B",
};

export async function scrapeTierList(logger: Logger): Promise<TierListEntry[]> {
  logger.info("Starting tier list scrape", { url: SCRAPER_CONFIG.tierListUrl });
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);
  
  try {
    await page.goto(SCRAPER_CONFIG.tierListUrl, {
      waitUntil: "networkidle2",
      timeout: SCRAPER_CONFIG.timeoutMs,
    });
    
    // Wait for tier cards to load
    await page.waitForSelector(".wr-tl-card", { timeout: 10000 });
    
    // Extract all champion data from the tier list
    const entries = await page.evaluate((roleMap, tierMap) => {
      const results: any[] = [];
      const slots = document.querySelectorAll(".wr-cn-slot");
      
      for (const slot of slots) {
        // Parse role and tier from slot class
        // Class format: "meta-col-in wr-cn-slot {role}-line-tier-{tier}"
        const className = slot.className;
        let role = "";
        let tier = "";
        
        for (const [wrRole, ourRole] of Object.entries(roleMap)) {
          if (className.includes(`${wrRole}-line-tier-`)) {
            role = ourRole;
            const tierMatch = className.match(new RegExp(`${wrRole}-line-tier-(\\w+)`));
            if (tierMatch) tier = tierMap[tierMatch[1]] || tierMatch[1].toUpperCase();
            break;
          }
        }
        
        if (!role || !tier) continue;
        
        const cards = slot.querySelectorAll(".wr-tl-card");
        for (const card of cards) {
          const link = card.querySelector("a");
          const nameEl = card.querySelector(".top-title");
          const iconEl = card.querySelector(".champion-icon");
          const statEls = card.querySelectorAll(".wr-tl-ov-i");
          
          if (!link || !nameEl) continue;
          
          const name = nameEl.textContent?.trim() || "";
          const pageUrl = link.href;
          const iconUrl = (iconEl as HTMLImageElement)?.src || "";
          
          // First stat = winrate, second = ban rate
          let winrate = 0, banRate = 0;
          if (statEls.length >= 1) {
            const wrText = statEls[0].textContent || "";
            const wrMatch = wrText.match(/([\d.]+)%/);
            if (wrMatch) winrate = parseFloat(wrMatch[1]);
          }
          if (statEls.length >= 2) {
            const brText = statEls[1].textContent || "";
            const brMatch = brText.match(/([\d.]+)%/);
            if (brMatch) banRate = parseFloat(brMatch[1]);
          }
          
          results.push({ name, pageUrl, role, tier, winrate, banRate, iconUrl });
        }
      }
      
      return results;
    }, ROLE_MAP, TIER_MAP);
    
    // Post-process: generate IDs, deduplicate by name+role
    const processed = entries.map((e: any) => ({
      ...e,
      id: nameToId(e.name),
    })) as TierListEntry[];
    
    logger.info("Tier list scrape complete", {
      total: processed.length,
      roles: [...new Set(processed.map(e => e.role))],
    });
    
    return processed;
    
  } finally {
    await browser.close();
  }
}
```

Note: A champion may appear multiple times (once per role). That's correct — we need the primary role data. We'll merge/deduplicate later.

</action>

<verify>
- File compiles with `npx tsc --noEmit`
- Can test manually by adding a temporary `main()` call:
  ```
  npx tsx scripts/scraper/tier-list.ts
  ```
  Should output 30-50+ entries
</verify>

<done>
- `scripts/scraper/tier-list.ts` scrapes tier list page
- Extracts: name, role, tier, winrate, banRate, iconUrl, pageUrl
- Uses Puppeteer for JS-rendered content
- Polite scraping with configured User-Agent
</done>
</task>

### Task 4: Scrape individual champion pages (detailed stats)

<task id="2.1.4" depends="2.1.3">
<action>

Create `scripts/scraper/champion-page.ts`:

This module scrapes individual champion pages for detailed stats (win rate, pick rate, ban rate) and counter/threat data.

HTML structure from RESEARCH.md:
- Stats: `.wr-cn-fs-m` elements with "Win: 48.49%", "Pick: 20.36%", "Ban: 9.96%"
- Tier: `.wr-tier-ico` alt attribute
- Role descriptor: body text "role – Assassin / Fighter"
- Counter threats: `.tabs-box2 > .tabs-sel2` category tabs ("Extreme [N]", "Major [N]")
- Counter champions: `.counter-champion > a[href]` within `.tabs-b2.visible`
- Synergies: Under synergies h3, same structure with `.tabs-b3`

```typescript
import puppeteer, { type Browser, type Page } from "puppeteer";
import type { Logger } from "./logger";
import { SCRAPER_CONFIG } from "./config";
import { sleep, parsePercent, nameToId, withRetry } from "./utils";

export interface ChampionPageData {
  pageUrl: string;
  name: string;
  // Detailed stats (may override tier list data)
  winrate: number;
  pickRate: number;
  banRate: number;
  tier: string;
  // Role tags from description (e.g., ["assassin", "fighter"]) 
  roleTags: string[];
  // Counter relationships (from free "Extreme" tab only)
  extremeThreats: string[];   // Champions that hard-counter this champion
  extremeSynergies: string[]; // Champions with extreme synergy
}

export async function scrapeChampionPage(
  browser: Browser,
  url: string,
  logger: Logger
): Promise<ChampionPageData> {
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);
  
  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: SCRAPER_CONFIG.timeoutMs,
    });
    
    const data = await page.evaluate(() => {
      const result: any = {};
      
      // --- Stats from .wr-cn-fs-m elements ---
      const metrics = document.querySelectorAll(".wr-cn-fs-m");
      for (const m of metrics) {
        const text = m.textContent?.trim() || "";
        if (text.startsWith("Win:")) {
          const match = text.match(/([\d.]+)%/);
          if (match) result.winrate = parseFloat(match[1]);
        } else if (text.startsWith("Pick:")) {
          const match = text.match(/([\d.]+)%/);
          if (match) result.pickRate = parseFloat(match[1]);
        } else if (text.startsWith("Ban:")) {
          const match = text.match(/([\d.]+)%/);
          if (match) result.banRate = parseFloat(match[1]);
        }
      }
      
      // --- Tier from .wr-tier-ico ---
      const tierIcon = document.querySelector(".wr-tier-ico");
      result.tier = tierIcon?.getAttribute("alt") || "";
      
      // --- Role tags from body text ---
      const bodyText = document.body.innerText;
      const roleMatch = bodyText.match(/role\s*[-–—]\s*([^.]+)/i);
      if (roleMatch) {
        result.roleTags = roleMatch[1]
          .split("/")
          .map((r: string) => r.trim().toLowerCase())
          .filter(Boolean);
      } else {
        result.roleTags = [];
      }
      
      // --- Name from title ---
      const titleMatch = document.title.match(/Wild Rift:\s*(.+?)\s*-/);
      result.name = titleMatch ? titleMatch[1].trim() : "";
      
      // --- Counter threats (Extreme tab only - free) ---
      const threatsH3 = [...document.querySelectorAll("h3")]
        .find(h => h.textContent?.includes("Threat"));
      result.extremeThreats = [];
      
      if (threatsH3) {
        const tabsBox = threatsH3.closest(".tabs-box2");
        if (tabsBox) {
          // Get first visible tab (Extreme)
          const firstTab = tabsBox.querySelector(".tabs-b2.visible, .tabs-b2:first-of-type");
          if (firstTab) {
            const champLinks = firstTab.querySelectorAll(".counter-champion a");
            result.extremeThreats = [...champLinks]
              .map(a => a.textContent?.trim())
              .filter(Boolean);
          }
        }
      }
      
      // --- Synergies (Extreme tab only - free) ---
      const synH3 = [...document.querySelectorAll("h3")]
        .find(h => h.textContent?.includes("Synerg"));
      result.extremeSynergies = [];
      
      if (synH3) {
        const tabsBox = synH3.closest(".tabs-box2");
        if (tabsBox) {
          const firstTab = tabsBox.querySelector(".tabs-b3.visible, .tabs-b3:first-of-type");
          if (firstTab) {
            const champLinks = firstTab.querySelectorAll(".counter-champion a");
            result.extremeSynergies = [...champLinks]
              .map(a => a.textContent?.trim())
              .filter(Boolean);
          }
        }
      }
      
      return result;
    });
    
    return {
      pageUrl: url,
      name: data.name || "",
      winrate: data.winrate || 0,
      pickRate: data.pickRate || 0,
      banRate: data.banRate || 0,
      tier: data.tier || "",
      roleTags: data.roleTags || [],
      extremeThreats: data.extremeThreats || [],
      extremeSynergies: data.extremeSynergies || [],
    };
    
  } finally {
    await page.close();
  }
}

/**
 * Scrape multiple champion pages with polite delays.
 * Reuses a single browser instance.
 */
export async function scrapeAllChampionPages(
  urls: string[],
  logger: Logger,
  dryRun: boolean = false
): Promise<ChampionPageData[]> {
  if (dryRun) {
    logger.info("DRY RUN: Would scrape champion pages", { count: urls.length });
    return [];
  }
  
  logger.info("Starting champion page scrape", { count: urls.length });
  
  const browser = await puppeteer.launch({ headless: true });
  const results: ChampionPageData[] = [];
  
  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      logger.info(`Scraping [${i + 1}/${urls.length}]`, { url });
      
      const data = await withRetry(
        () => scrapeChampionPage(browser, url, logger),
        url
      );
      
      results.push(data);
      
      // Polite delay between requests
      if (i < urls.length - 1) {
        await sleep();
      }
    }
    
    logger.info("Champion page scrape complete", {
      total: results.length,
      withThreats: results.filter(r => r.extremeThreats.length > 0).length,
    });
    
    return results;
    
  } finally {
    await browser.close();
  }
}
```

</action>

<verify>
- File compiles: `npx tsc --noEmit`
- Test with 2-3 pages manually:
  ```
  npx tsx -e "
    const { scrapeAllChampionPages } = require('./scripts/scraper/champion-page');
    const { createLogger } = require('./scripts/scraper/logger');
    const logger = createLogger('debug');
    scrapeAllChampionPages(['https://wr-meta.com/6-lee-sin.html'], logger).then(console.log);
  "
  ```
  Should return champion data with winrate, threats, etc.
</verify>

<done>
- `scripts/scraper/champion-page.ts` scrapes individual champion pages
- Extracts: winrate, pickRate, banRate, tier, roleTags, extremeThreats, extremeSynergies
- Uses shared Puppeteer browser for efficiency
- Polite delays between requests
- Retry with exponential backoff
- Dry-run mode support
</done>
</task>

### Task 5: Create main scraper orchestrator with dry-run mode

<task id="2.1.5" depends="2.1.4">
<action>

Create `scripts/scrape.ts` — the main entry point:

```typescript
#!/usr/bin/env tsx
/**
 * Wild Rift Draft Assistant — Data Scraper
 *
 * Usage:
 *   npx tsx scripts/scrape.ts              # Full scrape
 *   npx tsx scripts/scrape.ts --dry-run    # Dry run (no network requests)
 *   npx tsx scripts/scrape.ts --limit 5    # Scrape only 5 champions
 *   npx tsx scripts/scrape.ts --output raw # Output raw JSON to stdout
 *
 * Output: Writes raw scraped data to scripts/scraper/output/raw-data.json
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
const outputRaw = args.includes("--output");

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
  fs.mkdirSync(outputDir, { recursive: true });
  
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
  // Build champion map: id → merged data  
  const championMap = new Map<string, MergedChampion>();
  const pageMap = new Map<string, any>();
  
  // Index page data by name
  for (const pd of pageData) {
    if (pd.name) pageMap.set(pd.name.toUpperCase(), pd);
  }
  
  // Process tier entries (may have multiple roles per champion)
  for (const entry of tierEntries) {
    const existing = championMap.get(entry.id);
    if (existing) {
      // Add role if not already present
      if (!existing.roles.includes(entry.role)) {
        existing.roles.push(entry.role);
      }
      // Keep better winrate
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
  
  // Build counter pairs from page data
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
  logger.error("Scraper failed", { error: String(error) });
  process.exit(1);
});
```

Also create a `tsconfig.scripts.json` to allow running scripts with tsx:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist-scripts",
    "noEmit": false,
    "esModuleInterop": true
  },
  "include": ["scripts/**/*.ts"]
}
```

</action>

<verify>
- `npx tsx scripts/scrape.ts --dry-run` completes without errors
- `npx tsx scripts/scrape.ts --limit 3` scrapes 3 champions and outputs `scripts/scraper/output/raw-data.json`
- JSON file contains: meta, champions array, counterPairs array
</verify>

<done>
- `scripts/scrape.ts` is the main entry point
- Supports `--dry-run`, `--limit N`, `--output` flags
- Orchestrates: tier list scrape → champion page scrape → merge → write JSON
- Outputs `raw-data.json` with merged raw data
- Error handling with structured logging
</done>
</task>

---

## Success Criteria

1. ✅ `scripts/scraper/config.ts`, `logger.ts`, `utils.ts` exist and compile
2. ✅ `scripts/scraper/tier-list.ts` extracts all champions from tier list page
3. ✅ `scripts/scraper/champion-page.ts` extracts stats + threats from champion pages
4. ✅ `scripts/scrape.ts` runs end-to-end with `--dry-run` and `--limit N`
5. ✅ `scripts/scraper/output/raw-data.json` contains valid champion data
6. ✅ Build passes (`npx tsc --noEmit`)
