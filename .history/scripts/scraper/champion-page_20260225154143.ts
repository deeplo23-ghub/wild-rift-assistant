/**
 * Individual champion page scraper — extracts detailed stats + counter relationships.
 * Source: https://wr-meta.com/{id}-{slug}.html
 *
 * HTML structure (from RESEARCH.md):
 * - .wr-cn-fs-m: stat metrics ("Win: 48.49%", "Pick: 20.36%", "Ban: 9.96%")
 * - .wr-tier-ico: tier icon (alt attribute = "A", "S+", etc.)
 * - body text: "role – Assassin / Fighter"
 * - .tabs-box2: counter section
 * - .tabs-b2.visible: active threat tab (Extreme, free)
 * - .tabs-b3.visible: active synergy tab
 * - .counter-champion a: champion links in counter lists
 */

import type { Browser } from "puppeteer";
import type { Logger } from "./logger";
import { SCRAPER_CONFIG } from "./config";
import { sleep, withRetry } from "./utils";

export interface ChampionPageData {
  pageUrl: string;
  name: string;
  winrate: number;
  pickRate: number;
  banRate: number;
  tier: string;
  roleTags: string[];
  extremeThreats: string[];
  extremeSynergies: string[];
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

      // --- Stats ---
      const metrics = document.querySelectorAll(".wr-cn-fs-m");
      for (const m of metrics) {
        const text = m.textContent?.trim() || "";
        const pct = text.match(/([\d.]+)%/);
        if (!pct) continue;
        if (text.startsWith("Win")) result.winrate = parseFloat(pct[1]);
        else if (text.startsWith("Pick")) result.pickRate = parseFloat(pct[1]);
        else if (text.startsWith("Ban")) result.banRate = parseFloat(pct[1]);
      }

      // --- Tier ---
      const tierIcon = document.querySelector(".wr-tier-ico");
      result.tier = tierIcon?.getAttribute("alt") || "";

      // --- Role tags from body text (e.g. "role – Assassin / Fighter") ---
      const bodyText = document.body.innerText;
      const roleMatch = bodyText.match(/role\s*[-–—]\s*([^.]+)/i);
      result.roleTags = roleMatch
        ? roleMatch[1]
            .split("/")
            .map((r: string) => r.trim().toLowerCase())
            .filter(Boolean)
        : [];

      // --- Name from title ---
      const titleMatch = document.title.match(/Wild Rift:\s*(.+?)\s*-/);
      result.name = titleMatch ? titleMatch[1].trim() : "";

      // --- Extreme threats (free tab) ---
      result.extremeThreats = [];
      const threatsH3 = [...document.querySelectorAll("h3")].find(
        (h) => h.textContent?.includes("Threat")
      );
      if (threatsH3) {
        const tabsBox = threatsH3.closest(".tabs-box2");
        if (tabsBox) {
          const firstTab = tabsBox.querySelector(
            ".tabs-b2.visible, .tabs-b2:first-of-type"
          );
          if (firstTab) {
            result.extremeThreats = [
              ...firstTab.querySelectorAll(".counter-champion a"),
            ]
              .map((a) => a.textContent?.trim())
              .filter(Boolean);
          }
        }
      }

      // --- Extreme synergies (free tab) ---
      result.extremeSynergies = [];
      const synH3 = [...document.querySelectorAll("h3")].find(
        (h) => h.textContent?.includes("Synerg")
      );
      if (synH3) {
        const tabsBox = synH3.closest(".tabs-box2");
        if (tabsBox) {
          const firstTab = tabsBox.querySelector(
            ".tabs-b3.visible, .tabs-b3:first-of-type"
          );
          if (firstTab) {
            result.extremeSynergies = [
              ...firstTab.querySelectorAll(".counter-champion a"),
            ]
              .map((a) => a.textContent?.trim())
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

import { updateSyncStatus } from "./status-utils";

/**
 * Scrape multiple champion pages sequentially with polite delays.
 */
export async function scrapeAllChampionPages(
  urls: string[],
  logger: Logger,
  browser: Browser,
  dryRun: boolean = false,
  jobId: string | null = null
): Promise<ChampionPageData[]> {
  if (dryRun) {
    logger.info("DRY RUN: Would scrape champion pages", { count: urls.length });
    return [];
  }

  logger.info("Starting champion page scrape", { count: urls.length });
  const results: ChampionPageData[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    // Update progress in DB (40% to 90% range)
    if (jobId) {
      const progress = Math.floor(40 + (i / urls.length) * 50);
      await updateSyncStatus(jobId, {
        progress,
        message: `Scraping champion data [${i + 1}/${urls.length}]...`
      });
    }

    logger.info(`Scraping [${i + 1}/${urls.length}] ${url.split("/").pop()}`);

    const data = await withRetry(
      () => scrapeChampionPage(browser, url, logger),
      url
    );

    results.push(data);

    if (i < urls.length - 1) {
      await sleep();
    }
  }

  logger.info("Champion page scrape complete", {
    total: results.length,
    withThreats: results.filter((r) => r.extremeThreats.length > 0).length,
    withSynergies: results.filter((r) => r.extremeSynergies.length > 0).length,
  });

  return results;
}
