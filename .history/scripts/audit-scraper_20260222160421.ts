import puppeteer from 'puppeteer';

const SCRAPER_CONFIG = {
  tierListUrl: "https://wr-meta.com/meta/",
  timeoutMs: 30000,
  userAgent: "WildRiftDraftAssistant/1.0 (research-tool)",
};

async function auditScraper() {
  console.log("Starting scraper audit...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);
  
  try {
    await page.goto(SCRAPER_CONFIG.tierListUrl, {
      waitUntil: "networkidle2",
      timeout: SCRAPER_CONFIG.timeoutMs,
    });
    
    // Wait for tier cards to load initially
    await page.waitForSelector(".wr-tl-card", { timeout: 10000 });
    
    console.log("Page loaded. Existing champions before clicking tabs:");
    const initialChampions = await extractChampions(page);
    console.log(`Found ${initialChampions.length} champions initially.`);
    
    // Click through all role tabs
    const roleLabels = ['mid', 'solo', 'jungle', 'duo', 'support', 'baron', 'dragon', 'adc', 'bot']; // added variations just in case
    
    const allFoundChampions = new Map(); // name -> Set of roles
    
    for (const role of roleLabels) {
      console.log(`Clicking role tab: ${role}`);
      const clicked = await page.evaluate((r) => {
        const spans = Array.from(document.querySelectorAll('span'));
        const target = spans.find(span => span.textContent?.trim().toLowerCase() === r);
        if (target) {
           target.click();
           if (target.parentElement && target.parentElement.tagName !== 'A') {
              target.parentElement.click();
           }
           return true;
        }
        return false;
      }, role);
      
      if (clicked) {
        // Wait for React/Vue to render the cards for the new tab
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const champs = await extractChampions(page);
        console.log(`[Tab: ${role}] Found ${champs.length} champions.`);
        
        for (const champ of champs) {
           if (!allFoundChampions.has(champ.name)) {
               allFoundChampions.set(champ.name, new Set());
           }
           allFoundChampions.get(champ.name).add(champ.role);
        }
      } else {
        console.log(`[Tab: ${role}] Not found on page.`);
      }
    }
    
    console.log("\n--- Audit Results ---");
    console.log(`Total unique champions detected: ${allFoundChampions.size}`);
    
    const dragonChampions = [];
    const names = [];
    for (const [name, roles] of allFoundChampions.entries()) {
        names.push(name);
        const rolesArr = Array.from(roles);
        if (rolesArr.includes('duo') || rolesArr.includes('dragon') || rolesArr.includes('adc') || rolesArr.includes('bot')) {
            dragonChampions.push(name);
        }
    }
    
    console.log("All Champion Names:");
    console.log(names.sort().join(', '));
    
    console.log(`\nDragon/Duo role detection: ${dragonChampions.length} champions`);
    console.log(dragonChampions.join(', '));
    
  } finally {
    await browser.close();
  }
}

async function extractChampions(page: any) {
    return await page.evaluate(() => {
      const results: any[] = [];
      const slots = document.querySelectorAll(".wr-cn-slot");
      
      for (const slot of slots) {
        const className = slot.className;
        // Let's just extract the raw role from the class: e.g. "mid-line-tier-s" -> "mid"
        const classParts = className.split(' ');
        let rawRole = "";
        for (const cls of classParts) {
            if (cls.includes('-line-tier-')) {
                rawRole = cls.split('-line-tier-')[0];
                break;
            }
        }
        
        const cards = slot.querySelectorAll(".wr-tl-card");
        for (const card of cards) {
          const nameEl = card.querySelector(".top-title");
          if (nameEl) {
            results.push({
                name: nameEl.textContent?.trim() || "",
                role: rawRole
            });
          }
        }
      }
      return results;
    });
}

auditScraper().catch(console.error);
