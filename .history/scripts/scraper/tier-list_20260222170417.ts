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

const ROLE_MAP: Record<string, string> = {
  "MID": "mid",
  "SOLO": "baron",
  "JUNGLE": "jungle",
  "DUO": "dragon",
  "SUPPORT": "support",
};

const TIER_MAP: Record<string, string> = {
  "sp": "S+",
  "s": "S",
  "a": "A",
  "b": "B",
};

export async function scrapeTierList(logger: Logger): Promise<TierListEntry[]> {
  logger.info("Starting tier list scrape with tab iteration", { url: SCRAPER_CONFIG.tierListUrl });
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    await page.goto(SCRAPER_CONFIG.tierListUrl, {
      waitUntil: "networkidle2",
      timeout: SCRAPER_CONFIG.timeoutMs,
    });
    
    await page.waitForSelector(".wr-tl-card", { timeout: 15000 });
    
    // Find all role filter buttons
    const roleButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.wr-meta-role-item, [class*="role-item"], .wr-meta-tab');
      return [...buttons].map(b => ({
        text: b.textContent?.trim().toUpperCase() || "",
        id: b.id || "",
        selector: b.className ? `.${b.className.split(' ').join('.')}` : ""
      })).filter(b => ["MID", "SOLO", "JUNGLE", "DUO", "ADC", "SUPPORT"].some(r => b.text.includes(r)));
    });

    logger.info("Found role buttons", { count: roleButtons.length, buttons: roleButtons.map(b => b.text) });

    const allEntries: TierListEntry[] = [];

    // Map of role text to our internal role name
    const roleTextMap: Record<string, string> = {
      "MID": "mid",
      "SOLO": "baron",
      "JUNGLE": "jungle",
      "DUO": "dragon",
      "ADC": "dragon",
      "SUPPORT": "support"
    };

    for (const roleBtn of roleButtons) {
      const ourRole = Object.entries(roleTextMap).find(([text]) => roleBtn.text.includes(text))?.[1];
      if (!ourRole) continue;

      logger.info(`Switching to role: ${ourRole} (${roleBtn.text})`);
      
      // Click the button using evaluate to be safer with complex layouts
      await page.evaluate((text) => {
        const btns = document.querySelectorAll('.wr-meta-role-item, [class*="role-item"], .wr-meta-tab');
        const btn = [...btns].find(b => b.textContent?.trim().toUpperCase().includes(text));
        if (btn) (btn as HTMLElement).click();
      }, roleBtn.text);

      await sleep(2000); // Wait for content switch
      
      const roleEntries = await page.evaluate((currentRole, tierMap) => {
        const results: any[] = [];
        // The active slot should have the cards
        const cards = document.querySelectorAll(".wr-tl-card");
        
        for (const card of cards) {
          const link = card.querySelector("a") as HTMLAnchorElement;
          const nameEl = card.querySelector(".top-title");
          const iconEl = card.querySelector(".champion-icon") as HTMLImageElement;
          const statEls = card.querySelectorAll(".wr-tl-ov-i");
          
          // Determine tier from parent container class if possible
          const slot = card.closest(".wr-cn-slot");
          let tier = "B";
          if (slot) {
            const classMatch = slot.className.match(/tier-(\w+)/);
            if (classMatch) tier = tierMap[classMatch[1]] || classMatch[1].toUpperCase();
          }

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
