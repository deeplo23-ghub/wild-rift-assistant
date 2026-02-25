import puppeteer from 'puppeteer';
import { SCRAPER_CONFIG } from './scraper/config';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);
  await page.goto("https://wr-meta.com/meta/", {waitUntil: 'networkidle2'});

  const html = await page.evaluate(() => {
    // Return HTML around elements that look like a tab menu
    const menues = document.querySelectorAll('.wr-header, [role="tablist"], nav, .tabs');
    return Array.from(menues).map(el => el.outerHTML.substring(0, 1000));
  });
  console.log("Navigation menus:\n", html.join('\n\n'));

  // Another generic search for role names
  const labels = await page.evaluate(() => {
    const texts = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        if (!el.textContent) return false;
        const t = el.textContent.trim().toLowerCase();
        return t === 'mid' || t === 'solo' || t === 'jungle' || t === 'duo' || t === 'support';
      });
    return texts.map(el => ({ tag: el.tagName, class: el.className })).slice(0, 20);
  });
  console.log("Labels matching lanes:", labels);
  
  await browser.close();
})();
