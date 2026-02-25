/**
 * Tier list page scraper — extracts all champions, roles, tiers, winrates, ban rates.
 * Source: https://wr-meta.com/meta/
 *
 * HTML structure (from RESEARCH.md):
 * - .wr-cn-slot containers: class encodes {role}-line-tier-{tier}
 * - .wr-tl-card: individual champion card
 * - .wr-tl-ov-i: stat overlays (winrate, banrate)
 * - .top-title: champion display name
 * - .champion-icon: champion icon image
 */

import puppeteer from "puppeteer";
import type { Logger } from "./logger";
import { SCRAPER_CONFIG } from "./config";
import { nameToId } from "./utils";

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

// Map wr-meta CSS role slugs → our Role enum
const ROLE_MAP: Record<string, string> = {
  mid: "mid",
  solo: "baron",
  jungle: "jungle",
  duo: "dragon",
  support: "support",
};

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

    // Wait for tier cards
    await page.waitForSelector(".wr-tl-card", { timeout: 15000 });

    const entries: TierListEntry[] = await page.evaluate(
      (roleMap: Record<string, string>, tierMap: Record<string, string>) => {
        const results: any[] = [];
        const slots = document.querySelectorAll(".wr-cn-slot");

        for (const slot of slots) {
          const className = slot.className;
          let role = "";
          let tier = "";

          for (const [wrRole, ourRole] of Object.entries(roleMap)) {
            if (className.includes(`${wrRole}-line-tier-`)) {
              role = ourRole;
              const tierMatch = className.match(
                new RegExp(`${wrRole}-line-tier-(\\w+)`)
              );
              if (tierMatch) tier = tierMap[tierMatch[1]] || tierMatch[1].toUpperCase();
              break;
            }
          }

          if (!role || !tier) continue;

          const cards = slot.querySelectorAll(".wr-tl-card");
          for (const card of cards) {
            const link = card.querySelector("a") as HTMLAnchorElement | null;
            const nameEl = card.querySelector(".top-title");
            const iconEl = card.querySelector(".champion-icon") as HTMLImageElement | null;
            const statEls = card.querySelectorAll(".wr-tl-ov-i");

            if (!link || !nameEl) continue;

            const name = nameEl.textContent?.trim() || "";
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

            results.push({ name, pageUrl, role, tier, winrate, banRate, iconUrl });
          }
        }

        return results;
      },
      ROLE_MAP,
      TIER_MAP
    );

    // Post-process: generate IDs
    const processed = entries.map((e) => ({
      ...e,
      id: nameToId(e.name),
    }));

    logger.info("Tier list scrape complete", {
      total: processed.length,
      roles: [...new Set(processed.map((e) => e.role))],
    });

    return processed;
  } finally {
    await browser.close();
  }
}
