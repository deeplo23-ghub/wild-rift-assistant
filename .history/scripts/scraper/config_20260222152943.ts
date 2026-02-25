// Scraper configuration — all tuning knobs in one place

export const SCRAPER_CONFIG = {
  /** Base URL for wr-meta.com */
  baseUrl: "https://wr-meta.com",
  
  /** Tier list page URL */
  tierListUrl: "https://wr-meta.com/meta/",
  
  /** Delay between requests in ms (be polite) */
  requestDelayMs: 500,
  
  /** Maximum concurrent requests */
  maxConcurrent: 1,
  
  /** Request timeout in ms */
  timeoutMs: 30000,
  
  /** User-Agent header */
  userAgent: "WildRiftDraftAssistant/1.0 (research-tool)",
  
  /** Maximum retries per page */
  maxRetries: 3,
  
  /** Retry delay base (exponential backoff) */
  retryBaseDelayMs: 2000,
  
  /** Log level */
  logLevel: "info" as "debug" | "info" | "warn" | "error",
} as const;
