import puppeteer from 'puppeteer';
import { SCRAPER_CONFIG } from './scraper/config';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);
  await page.goto("https://wr-meta.com/meta/", {waitUntil: 'networkidle2'});
  
  const tabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.wr-meta-tabs a, .wr-meta-tabs div, .wr-tn .wr-tn-in div, .wr-tn-in span, [class*="role"]')).map(el => ({
      class: el.className,
      text: el.textContent,
    })).slice(0, 50);
  });
  console.log("Found tabs:", JSON.stringify(tabs, null, 2));

  // Let's also look for clicks that load the slots
  const slots = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.wr-cn-slot')).map(s => s.className);
  });
  console.log("Found slots:", slots);
  
  await browser.close();
})();
