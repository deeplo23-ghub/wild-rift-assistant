/**
 * Tier list page scraper — extracts all champions, roles, tiers, winrates, ban rates.
 * Source: https://wr-meta.com/meta/
 *
 * The page has 5 role tabs (mid, solo/baron, jungle, duo/dragon, support).
 * Each tab shows champions for that role grouped by tier (S+, S, A, B).
 * We must click each tab to scrape all champions across all roles.
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

    await page.waitForSelector(".wr-tl-card", { timeout: 15000 });

    // First, find all role filter tabs/buttons
    // The role tabs use icon classes like "mid-lineicon-", "solo-lineicon-", etc.
    const roleTabSelectors = await page.evaluate(() => {
      // Look for role filter buttons
      const tabs = document.querySelectorAll('[class*="meta-tabs"] a, .meta-tabs a, [class*="role-tab"], [class*="meta-role"]');
      if (tabs.length > 0) {
        return [...tabs].map((t, i) => ({
          index: i,
          text: t.textContent?.trim() || "",
          class: t.className.substring(0, 100),
        }));
      }

      // Alternative: look for role icon links
      const roleIcons = document.querySelectorAll('[class*="lineicon-"]');
      return [...roleIcons].map((el, i) => ({
        index: i,
        text: el.className,
        class: el.parentElement?.className?.substring(0, 100) || "",
      }));
    });

    logger.info("Role tabs found", { count: roleTabSelectors.length });

    // Try a different approach: look for the tabs container
    const tabStructure = await page.evaluate(() => {
      // wr-meta.com uses a specific tab structure for roles
      const result: any = {};

      // Look for all role sections - the page might have all roles loaded as hidden sections
      const allSlots = document.querySelectorAll('.wr-cn-slot');
      const rolesFound = new Set<string>();
      for (const slot of allSlots) {
        const cn = slot.className;
        for (const role of ['mid', 'solo', 'jungle', 'duo', 'support']) {
          if (cn.includes(`${role}-line-tier-`)) {
            rolesFound.add(role);
          }
        }
      }
      result.rolesInDOM = [...rolesFound];
      result.totalSlots = allSlots.length;

      // Check for tab buttons
      const metaTabs = document.querySelectorAll('.meta-tabs-item, [class*="meta-tab"]');
      result.tabButtons = [...metaTabs].map(t => ({
        text: t.textContent?.trim()?.substring(0, 30),
        class: t.className.substring(0, 80),
      }));

      // Check for a generic tab container
      const allButtons = document.querySelectorAll('button, a');
      const roleButtons = [...allButtons].filter(b => {
        const text = b.textContent?.trim()?.toLowerCase() || '';
        return ['mid', 'solo', 'baron', 'jungle', 'duo', 'adc', 'support'].includes(text);
      });
      result.roleButtons = roleButtons.map(b => ({
        tag: b.tagName,
        text: b.textContent?.trim(),
        class: b.className.substring(0, 80),
      }));

      return result;
    });

    logger.info("DOM analysis", tabStructure);

    // Extract champions from all currently visible slots
    const allEntries = await extractVisibleChampions(page);
    logger.info(`Extracted ${allEntries.length} entries from visible DOM`);

    // If we only got one role, we need to click on other role tabs
    const rolesGot = [...new Set(allEntries.map(e => e.role))];
    logger.info("Roles extracted so far", { roles: rolesGot, count: rolesGot.length });

    if (rolesGot.length < 5) {
      logger.info("Not all roles visible — trying to click role tabs...");

      // The wr-meta.com tier list uses role icons as tab filters
      // Let's try clicking each role icon
      const roleClasses = ['mid-lineicon-', 'solo-lineicon-', 'jungle-lineicon-', 'duo-lineicon-', 'support-lineicon-'];

      for (const roleClass of roleClasses) {
        const wrMetaRole = roleClass.split('-')[0]; // 'mid', 'solo', etc.
        const ourRole = ROLE_MAP[wrMetaRole];

        if (rolesGot.includes(ourRole)) continue; // Already have this role

        logger.info(`Clicking role tab: ${wrMetaRole}`);

        // Try to find and click the role filter
        const clicked = await page.evaluate((rc) => {
          // Look for the role icon
          const icon = document.querySelector(`[class*="${rc}"]`);
          if (icon) {
            const clickTarget = icon.closest('a') || icon.closest('button') || icon.parentElement;
            if (clickTarget && typeof (clickTarget as any).click === 'function') {
              (clickTarget as any).click();
              return true;
            }
          }

          // Try meta-tabs
          const tabs = document.querySelectorAll('.meta-tabs a, .meta-tabs-item, [class*="role-filter"]');
          for (const tab of tabs) {
            if (tab.className.includes(rc) || tab.querySelector(`[class*="${rc}"]`)) {
              (tab as any).click();
              return true;
            }
          }

          return false;
        }, roleClass);

        if (clicked) {
          await sleep(2000); // Wait for content to update
          await page.waitForSelector(".wr-tl-card", { timeout: 5000 }).catch(() => {});

          const newEntries = await extractVisibleChampions(page);
          const newRoles = [...new Set(newEntries.map(e => e.role))];
          logger.info(`After click: ${newEntries.length} entries, roles: ${newRoles}`);

          // Add new entries (avoid duplicates)
          const existingIds = new Set(allEntries.map(e => `${e.id}-${e.role}`));
          for (const entry of newEntries) {
            if (!existingIds.has(`${entry.id}-${entry.role}`)) {
              allEntries.push(entry);
              existingIds.add(`${entry.id}-${entry.role}`);
            }
          }
        } else {
          logger.warn(`Could not click role tab: ${wrMetaRole}`);
        }
      }
    }

    // If we still don't have all roles, try to get all hidden DOM elements
    if ([...new Set(allEntries.map(e => e.role))].length < 5) {
      logger.info("Attempting to extract ALL role slots from DOM (including hidden)...");

      const hiddenEntries = await page.evaluate(
        (roleMap: Record<string, string>, tierMap: Record<string, string>) => {
          const results: any[] = [];
          const slots = document.querySelectorAll("[class*='-line-tier-']");

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

            const cards = slot.querySelectorAll(".wr-tl-card, .bild-img-champions3");
            for (const card of cards) {
              const link = card.querySelector("a") as HTMLAnchorElement | null;
              const nameEl = card.querySelector(".top-title");
              const iconEl = card.querySelector(".champion-icon, img") as HTMLImageElement | null;
              const statEls = card.querySelectorAll(".wr-tl-ov-i");

              if (!link || !nameEl) continue;

              const name = nameEl.textContent?.trim() || "";
              const pageUrl = link.href;
              const iconUrl = iconEl?.src || "";

              let winrate = 0, banRate = 0;
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

      // Add hidden entries that aren't already present
      const existingIds = new Set(allEntries.map(e => `${e.id}-${e.role}`));
      for (const entry of hiddenEntries) {
        const id = nameToId(entry.name);
        const key = `${id}-${entry.role}`;
        if (!existingIds.has(key)) {
          allEntries.push({ ...entry, id });
          existingIds.add(key);
        }
      }

      logger.info("After hidden extraction", {
        total: allEntries.length,
        roles: [...new Set(allEntries.map(e => e.role))],
      });
    }

    // Post-process: ensure IDs
    const processed = allEntries.map((e) => ({
      ...e,
      id: e.id || nameToId(e.name),
    }));

    logger.info("Tier list scrape complete", {
      total: processed.length,
      roles: [...new Set(processed.map((e) => e.role))],
      uniqueChampions: new Set(processed.map(e => e.id)).size,
    });

    return processed;
  } finally {
    await browser.close();
  }
}

async function extractVisibleChampions(page: any): Promise<TierListEntry[]> {
  const entries: TierListEntry[] = await page.evaluate(
    (roleMap: Record<string, string>, tierMap: Record<string, string>) => {
      const results: any[] = [];
      const slots = document.querySelectorAll(".wr-cn-slot");

      for (const slot of slots) {
        const className = slot.className;
        let role = "";
        let tier = "";

        // Only process visible slots
        const style = window.getComputedStyle(slot);
        if (style.display === "none" || style.visibility === "hidden") continue;

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

          let winrate = 0, banRate = 0;
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

  return entries.map(e => ({ ...e, id: nameToId(e.name) }));
}
