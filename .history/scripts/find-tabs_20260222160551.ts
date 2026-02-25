import puppeteer from 'puppeteer';

const SCRAPER_CONFIG = {
  tierListUrl: "https://wr-meta.com/meta/",
  timeoutMs: 30000,
  userAgent: "WildRiftDraftAssistant/1.0 (research-tool)",
};

async function findTabs() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);
  
  try {
    await page.goto(SCRAPER_CONFIG.tierListUrl, {
      waitUntil: "networkidle2",
      timeout: SCRAPER_CONFIG.timeoutMs,
    });
    
    // Log out all spans
    const tabs = await page.evaluate(() => {
        const textSet = new Set<string>();
        // Looking at common structures
        const wrTabs = document.querySelectorAll('.wr-md-tab, .tab, .role-tab, [class*="tab"]');
        wrTabs.forEach(t => textSet.add(t.className + " ||| " + t.textContent?.trim()));
        
        // Also let's check the container around the tier list
        const roles = document.querySelectorAll('.wr-cn-fs-role span');
        roles.forEach(r => textSet.add("ROLE_SPAN: " + r.textContent?.trim()));
        
        // Let's get all spans just in case it's custom. We can limit it to visible short spans
        const spans = Array.from(document.querySelectorAll('span')).filter(s => {
          const txt = s.textContent?.trim() || '';
          return txt.length > 2 && txt.length < 15;
        });
        spans.forEach(s => textSet.add("ANY_SPAN: " + s.textContent?.trim()));
        
        return Array.from(textSet);
    });
    
    console.log(tabs.join('\n'));
  } finally {
    await browser.close();
  }
}

findTabs().catch(console.error);
