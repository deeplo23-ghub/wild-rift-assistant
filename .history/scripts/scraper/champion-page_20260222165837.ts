import type { Browser, Page } from "puppeteer";
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
    
    // Some stats are in the carousel, wait for it
    await page.waitForSelector(".wr-cn-fs-m", { timeout: 10000 }).catch(() => {});
    
    const data = await page.evaluate(() => {
      const result: any = {
        winrate: 0,
        pickRate: 0,
        banRate: 0,
        tier: "",
        roleTags: [],
        extremeThreats: [],
        extremeSynergies: []
      };
      
      const metrics = document.querySelectorAll(".wr-cn-fs-m");
      for (const m of metrics) {
        const text = m.textContent?.trim() || "";
        if (text.toLowerCase().includes("win:")) {
          const match = text.match(/([\d.]+)%/);
          if (match) result.winrate = parseFloat(match[1]);
        } else if (text.toLowerCase().includes("pick:")) {
          const match = text.match(/([\d.]+)%/);
          if (match) result.pickRate = parseFloat(match[1]);
        } else if (text.toLowerCase().includes("ban:")) {
          const match = text.match(/([\d.]+)%/);
          if (match) result.banRate = parseFloat(match[1]);
        }
      }
      
      const tierIcon = document.querySelector(".wr-tier-ico");
      result.tier = tierIcon?.getAttribute("alt") || "";
      
      const bodyText = document.body.innerText;
      const roleMatch = bodyText.match(/role\s*[-–—]\s*([^.]+)/i);
      if (roleMatch) {
        result.roleTags = roleMatch[1]
          .split("/")
          .map((r: string) => r.trim().toLowerCase())
          .filter(Boolean);
      }
      
      const h1 = document.querySelector("h1");
      if (h1) {
        const nameMatch = h1.textContent?.match(/Wild Rift:\s*(.+?)\s*Build/i);
        result.name = nameMatch ? nameMatch[1].trim() : h1.textContent.replace(/Wild Rift:|Build Guide.*$/gi, "").trim();
      }
      
      const threatsH3 = [...document.querySelectorAll("h3")].find(h => h.textContent?.includes("Threats"));
      if (threatsH3) {
        const tabsBox = threatsH3.closest(".tabs-box2");
        if (tabsBox) {
          const firstTab = tabsBox.querySelector(".tabs-b2.visible, .tabs-b2:first-of-type");
          if (firstTab) {
            const champLinks = firstTab.querySelectorAll(".counter-champion .top-title");
            result.extremeThreats = [...champLinks].map(el => el.textContent?.trim()).filter(Boolean);
          }
        }
      }
      
      const synH3 = [...document.querySelectorAll("h3")].find(h => h.textContent?.includes("Synergies"));
      if (synH3) {
        const tabsBox = synH3.closest(".tabs-box2");
        if (tabsBox) {
          const firstTab = tabsBox.querySelector(".tabs-b3.visible, .tabs-b3:first-of-type");
          if (firstTab) {
            const champLinks = firstTab.querySelectorAll(".counter-champion .top-title");
            result.extremeSynergies = [...champLinks].map(el => el.textContent?.trim()).filter(Boolean);
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

export async function scrapeAllChampionPages(
  browser: Browser,
  urls: string[],
  logger: Logger,
  dryRun: boolean = false
): Promise<ChampionPageData[]> {
  const results: ChampionPageData[] = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    logger.info(`Scraping champion page [${i + 1}/${urls.length}]`, { url });
    
    try {
      const data = await withRetry(
        () => scrapeChampionPage(browser, url, logger),
        url
      );
      results.push(data);
    } catch (err) {
      logger.error(`Failed to scrape ${url} after retries`, { error: String(err) });
    }
    
    if (i < urls.length - 1) {
      await sleep();
    }
  }
  
  return results;
}
