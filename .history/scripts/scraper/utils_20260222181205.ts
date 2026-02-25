/**
 * Scraper utility functions.
 */
import { SCRAPER_CONFIG } from "./config";

export function sleep(ms: number = SCRAPER_CONFIG.requestDelayMs): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

/** Convert a champion display name to a kebab-case ID */
export function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&amp;/g, "and")
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
