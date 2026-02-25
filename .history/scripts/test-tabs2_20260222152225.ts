import puppeteer from 'puppeteer';
import { SCRAPER_CONFIG } from './scraper/config';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);
  await page.goto("https://wr-meta.com/meta/", {waitUntil: 'networkidle2'});

  const laneTabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.wr-tn-ul li')).map((li, index) => {
      const a = li.querySelector('a');
      return { index, aText: a?.textContent, aClass: a?.className, aHref: a?.href };
    });
  });
  console.log("Lane tabs in .wr-tn-ul li:", laneTabs);

  // Maybe the top tier list tabs are just 'li' items? Let's search broader
  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, li')).filter(el => {
        const text = el.textContent?.trim()?.toLowerCase() || '';
        return ['mid', 'solo', 'jungle', 'duo', 'support'].includes(text);
    }).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent?.trim() })).slice(0, 10);
  });
  console.log("All links matching lane names:", allLinks);

  await browser.close();
})();
