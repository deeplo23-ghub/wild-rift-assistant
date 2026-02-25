import puppeteer, { type Browser } from "puppeteer";
import type { Logger } from "./logger";
import { SCRAPER_CONFIG } from "./config";
import { sleep, withRetry } from "./utils";

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
      waitUntil: "domcontentloaded",
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
      const titleMatch = document.title.match(/Wild Rift:\s*(.+?)\s*-/i) || document.title.match(/Wild Rift:\s*(.+)/i);
      result.name = titleMatch ? titleMatch[1].trim() : "";
      
      // --- Counter threats (Extreme tab only - free) ---
      const threatsH3 = [...document.querySelectorAll("h3")]
        .find(h => h.textContent?.includes("Threat"));
      result.extremeThreats = [];
      
      if (threatsH3) {
        const tabsBox = threatsH3.closest(".tabs-box2");
        if (tabsBox) {
          // Get first visible tab (Extreme), sometimes the active tab is `.tabs-b2.visible`
          const firstTab = tabsBox.querySelector(".tabs-b2.visible, .tabs-b2:first-of-type");
          if (firstTab) {
            const champLinks = firstTab.querySelectorAll(".counter-champion a");
            result.extremeThreats = [...champLinks]
              .map(a => {
                  const titleDiv = a.querySelector('.top-title');
                  return titleDiv ? titleDiv.textContent?.trim() : a.textContent?.trim();
              })
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
              .map(a => {
                  const titleDiv = a.querySelector('.top-title');
                  return titleDiv ? titleDiv.textContent?.trim() : a.textContent?.trim();
              })
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
