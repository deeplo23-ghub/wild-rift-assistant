/**
 * Scraper configuration — all tuning knobs in one place.
 */
export const SCRAPER_CONFIG = {
  baseUrl: "https://wr-meta.com",
  tierListUrl: "https://wr-meta.com/meta/",
  requestDelayMs: 1500,
  maxConcurrent: 1,
  timeoutMs: 30000,
  userAgent: "WildRiftDraftAssistant/1.0 (research-tool)",
  maxRetries: 3,
  retryBaseDelayMs: 2000,
  expectedChampionCount: 135,
} as const;
