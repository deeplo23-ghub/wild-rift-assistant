// Utility functions for the scraper

import { SCRAPER_CONFIG } from "./config";

/** Sleep for the configured delay between requests */
export function sleep(ms: number = SCRAPER_CONFIG.requestDelayMs): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Retry a function with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries: number = SCRAPER_CONFIG.maxRetries
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = SCRAPER_CONFIG.retryBaseDelayMs * Math.pow(2, attempt - 1);
      console.log(`  ⟳ Retry ${attempt}/${maxRetries} for "${label}" in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error("unreachable");
}

/** Extract numeric ID from a champion URL like "/6-lee-sin.html" */
export function extractChampionId(url: string): string {
  const match = url.match(/\/(\d+-[\w-]+)\.html/);
  if (!match) throw new Error(`Invalid champion URL: ${url}`);
  return match[1]; // e.g., "6-lee-sin"
}

/** Convert a champion name to kebab-case ID */
export function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Parse a percentage string like "48.49%" to a number */
export function parsePercent(text: string): number {
  const match = text.match(/([\d.]+)%/);
  if (!match) return 0;
  return parseFloat(match[1]);
}

/** Normalize tier string (handle S+ vs Sp vs S-Plus) */
export function normalizeTier(rawTier: string): string {
  const tier = rawTier.trim().toUpperCase();
  if (tier === "SP" || tier === "S-PLUS" || tier === "S PLUS") return "S+";
  if (["S", "S+", "A", "B", "C", "D"].includes(tier)) return tier;
  // If tier is from CSS class like "tier-sp" → "S+"
  if (tier.endsWith("SP")) return "S+";
  return tier;
}
