import puppeteer from "puppeteer";
import type { Logger } from "./logger";
import { SCRAPER_CONFIG } from "./config";
import { nameToId, sleep } from "./utils";

export interface TierListEntry {
  id: string;           
  name: string;         
  pageUrl: string;      
  role: string;         
  tier: string;         
  winrate: number;      
  banRate: number;      
  iconUrl: string;      
}

const TIER_MAP: Record<string, string> = {
  "sp": "S+",
  "s": "S",
  "a": "A",
  "b": "B",
};

export async function scrapeTierList(logger: Logger): Promise<TierListEntry[]> {
  logger.info("Starting tier list scrape with tab selector", { url: SCRAPER_CONFIG.tierListUrl });
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    await page.goto(SCRAPER_CONFIG.tierListUrl, {
      waitUntil: "networkidle2",
      timeout: SCRAPER_CONFIG.timeoutMs,
    });
    
    await page.waitForSelector(".tabs-sel span", { timeout: 15000 });
    
    const roleTabs = await page.evaluate(() => {
      const spans = document.querySelectorAll('.tabs-sel span');
      return [...spans].map((s, idx) => ({
        text: s.textContent?.trim().toUpperCase() || "",
        index: idx + 1
      })).filter(s => ["MID", "SOLO", "JUNGLE", "DUO", "ADC", "SUPPORT"].some(r => s.text.includes(r)));
    });

    logger.info("Found role tabs", { count: roleTabs.length, tabs: roleTabs.map(t => t.text) });

    const allEntries: TierListEntry[] = [];
    const roleMap: Record<string, string> = {
      "MID": "mid",
      "SOLO": "baron",
      "JUNGLE": "jungle",
      "DUO": "dragon",
      "ADC": "dragon",
      "SUPPORT": "support"
    };

    for (const tab of roleTabs) {
      const ourRole = Object.entries(roleMap).find(([text]) => tab.text.includes(text))?.[1];
      if (!ourRole) continue;

      logger.info(`Clicking tab ${tab.index}: ${tab.text} (${ourRole})`);
      
      await page.click(`.tabs-sel span:nth-child(${tab.index})`);
      await sleep(3000); // Wait for transition
      
      const roleEntries = await page.evaluate((currentRole, tierMap) => {
        const results: any[] = [];
        // Visible containers only
        const slots = document.querySelectorAll(".wr-cn-slot");
        
        for (const slot of slots) {
          const htmlSlot = slot as HTMLElement;
          if (htmlSlot.offsetHeight === 0 && htmlSlot.offsetWidth === 0) continue;
          
          const cards = slot.querySelectorAll(".wr-tl-card");
          for (const card of cards) {
            const link = card.querySelector("a") as HTMLAnchorElement;
            const nameEl = card.querySelector(".top-title");
            const iconEl = card.querySelector(".champion-icon") as HTMLImageElement;
            const statEls = card.querySelectorAll(".wr-tl-ov-i");
            
            let tier = "B";
            const classMatch = slot.className.match(/tier-(\w+)/);
            if (classMatch) tier = tierMap[classMatch[1]] || classMatch[1].toUpperCase();

            if (!link || !nameEl) continue;
            
            const name = nameEl.textContent?.trim() || "";
            const pageUrl = link.href;
            const iconUrl = iconEl?.src || "";
            
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
            
            results.push({ name, pageUrl, role: currentRole, tier, winrate, banRate, iconUrl });
          }
        }
        return results;
      }, ourRole, TIER_MAP);

      logger.info(`Found ${roleEntries.length} champions for ${ourRole}`);
      allEntries.push(...roleEntries);
    }
    
    const processed = allEntries.map((e: any) => ({
      ...e,
      id: nameToId(e.name),
    })) as TierListEntry[];
    
    logger.info("Tier list scrape complete", {
      totalFound: processed.length,
      roles: [...new Set(processed.map(e => e.role))],
    });
    
    return processed;
    
  } finally {
    await browser.close();
  }
}
