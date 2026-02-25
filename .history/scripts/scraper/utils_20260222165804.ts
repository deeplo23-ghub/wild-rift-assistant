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
      console.log(`  ⟳ Retry ${attempt}/${maxRetries} for "${label}" in ${delay}ms: ${String(error)}`);
      await sleep(delay);
    }
  }
  throw new Error("unreachable");
}

/** Convert a champion name to kebab-case ID */
export function nameToId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Parse a percentage string like "48.49%" to a number */
export function parsePercent(text: string): number {
  if (!text) return 0;
  const match = text.match(/([\d.]+)%/);
  if (!match) return 0;
  return parseFloat(match[1]);
}

/** Normalize tier string */
export function normalizeTier(rawTier: string): string {
  if (!rawTier) return "B";
  const tier = rawTier.trim().toUpperCase();
  if (tier === "SP" || tier === "S-PLUS" || tier === "S PLUS") return "S+";
  if (["S", "S+", "A", "B", "C", "D"].includes(tier)) return tier;
  if (tier.endsWith("SP")) return "S+";
  return tier;
}
