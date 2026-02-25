import puppeteer from "puppeteer";
import type { Logger } from "./logger";
import { SCRAPER_CONFIG } from "./config";
import { nameToId } from "./utils";

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
