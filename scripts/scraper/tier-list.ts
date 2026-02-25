/**
 * Tier list page scraper — extracts all champions across all 5 role tabs.
 * Source: https://wr-meta.com/meta/
 *
 * Page structure:
 * - .tabs-sel container with 5 <span> children:
 *   [0] Mid, [1] Solo, [2] Jungle, [3] Adc/Duo, [4] Support
 * - Active tab gets class "current"
 * - Each tab loads champions lazily into .wr-cn-slot containers
 * - Slot class: {role}-line-tier-{tier} (sp/s/a/b)
 * - Champion card: .wr-tl-card inside slot
 */

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

// Tab index → our role name
const TAB_ROLES = ["mid", "baron", "jungle", "dragon", "support"] as const;

// CSS role prefix used in slot classes for each tab
const CSS_ROLE_PREFIX = ["mid", "solo", "jungle", "duo", "support"] as const;

// Map CSS tier suffix → tier string
const TIER_MAP: Record<string, string> = {
  sp: "S+",
  s: "S",
  a: "A",
  b: "B",
};

export async function scrapeTierList(logger: Logger): Promise<TierListEntry[]> {
  logger.info("Starting tier list scrape", { url: SCRAPER_CONFIG.tierListUrl });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(SCRAPER_CONFIG.userAgent);

  try {
    await page.goto(SCRAPER_CONFIG.tierListUrl, {
      waitUntil: "networkidle2",
      timeout: SCRAPER_CONFIG.timeoutMs,
    });

    await page.waitForSelector(".wr-tl-hero", { timeout: 15000 });

    const allEntries: TierListEntry[] = [];

    // Iterate through all 5 role tabs
    for (let tabIdx = 0; tabIdx < 5; tabIdx++) {
      const role = TAB_ROLES[tabIdx];
      const cssPrefix = CSS_ROLE_PREFIX[tabIdx];

      logger.info(`Clicking tab [${tabIdx}]: ${role} (css: ${cssPrefix})`);

      // Click the tab
      await page.evaluate((idx: number) => {
        const tabsSel = document.querySelector(".tabs-sel");
        if (!tabsSel) return;
        const spans = tabsSel.querySelectorAll("span");
        if (spans[idx]) {
          (spans[idx] as HTMLElement).click();
        }
      }, tabIdx);

      // Wait for content to load
      await sleep(2500);

      // Extract champions from this tab
      const entries = await page.evaluate(
        (prefix: string, ourRole: string, tierMap: Record<string, string>) => {
          const results: any[] = [];

          // Find all slots for this role
          const allSlots = document.querySelectorAll(`[class*="${prefix}-line-tier-"]`);

          for (const slot of allSlots) {
            const className = slot.className;
            const tierMatch = className.match(new RegExp(`${prefix}-line-tier-(\\w+)`));
            if (!tierMatch) continue;

            const tier = tierMap[tierMatch[1]] || tierMatch[1].toUpperCase();

            const cards = slot.querySelectorAll(".wr-tl-hero");
            for (const card of cards) {
              const link = card.querySelector("a.wr-tl-link") as HTMLAnchorElement | null;
              const nameEl = card.querySelector(".nm");
              const iconEl = card.querySelector(
                "img"
              ) as HTMLImageElement | null;
              const statEls = card.querySelectorAll(".st");

              if (!link || !nameEl) continue;

              const name = nameEl.textContent?.trim() || "";
              if (!name) continue;

              const pageUrl = link.href;
              const iconUrl = iconEl?.src || "";

              let winrate = 0,
                banRate = 0;
              if (statEls.length >= 1) {
                const m = (statEls[0].textContent || "").match(/([\d.]+)%/);
                if (m) winrate = parseFloat(m[1]);
              }
              if (statEls.length >= 2) {
                const m = (statEls[1].textContent || "").match(/([\d.]+)%/);
                if (m) banRate = parseFloat(m[1]);
              }

              results.push({
                name,
                pageUrl,
                role: ourRole,
                tier,
                winrate,
                banRate,
                iconUrl,
              });
            }
          }

          return results;
        },
        cssPrefix,
        role,
        TIER_MAP
      );

      // Apply nameToId
      const processed = entries.map((e: any) => ({
        ...e,
        id: nameToId(e.name),
      }));

      logger.info(`  → ${role}: ${processed.length} champions`, {
        tiers: Object.fromEntries(
          Object.entries(
            processed.reduce((acc: any, e: any) => {
              acc[e.tier] = (acc[e.tier] || 0) + 1;
              return acc;
            }, {})
          )
        ),
      });

      allEntries.push(...processed);
    }

    logger.info("Tier list scrape complete", {
      total: allEntries.length,
      roles: [...new Set(allEntries.map((e) => e.role))],
      uniqueChampions: new Set(allEntries.map((e) => e.id)).size,
    });

    return allEntries;
  } finally {
    await browser.close();
  }
}
