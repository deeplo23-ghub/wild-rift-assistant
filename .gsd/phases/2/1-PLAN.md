# Phase 2 — Plan 1: Scraper Infrastructure + Champion Data Extraction

> **Wave**: 1 of 3
> **Dependencies**: Phase 1 complete (types, schema, Prisma)
> **Scope**: Install scraping deps, build core scraper module, extract champion list + base stats

---

## Context

You are building the data pipeline for a Wild Rift Draft Assistant. This plan creates the scraper module that extracts champion base data (winrate, pickrate, banrate, tier, roles) from wr-meta.com.

Read these files first for context:
- `.gsd/phases/2/RESEARCH.md` — wr-meta.com HTML structure (CSS selectors, page layouts)
- `src/types/champion.ts` — Champion interface (the target data shape)
- `prisma/schema.prisma` — Database models

---

## Tasks

### Task 1: Install scraping dependencies

<task id="2.1.1" depends="">
<action>
Install the scraping packages:
```bash
npm install puppeteer cheerio
npm install -D @types/cheerio
```
</action>
<verify>
- `npx tsc --noEmit` passes
</verify>
<done>
- puppeteer and cheerio installed
</done>
</task>

### Task 2: Create scraper configuration and utilities

<task id="2.1.2" depends="2.1.1">
<action>

Create `scripts/scraper/config.ts`:
```typescript
export const SCRAPER_CONFIG = {
  baseUrl: "https://wr-meta.com",
  tierListUrl: "https://wr-meta.com/meta/",
  requestDelayMs: 500, // Base delay (plus jitter)
  maxConcurrent: 1,
  timeoutMs: 30000,
  userAgent: "WildRiftDraftAssistant/1.0 (research-tool)",
  maxRetries: 3,
  retryBaseDelayMs: 2000,
  logLevel: "info" as "debug" | "info" | "warn" | "error",
} as const;
```

Create `scripts/scraper/logger.ts` for structured logging.

Create `scripts/scraper/utils.ts` focusing on deterministic IDs and jitter:
```typescript
import { SCRAPER_CONFIG } from "./config";

/** Sleep for the configured delay with random jitter (500-1000ms) */
export function sleep(baseMs: number = SCRAPER_CONFIG.requestDelayMs): Promise<void> {
  const jitter = Math.random() * 500;
  return new Promise(resolve => setTimeout(resolve, baseMs + jitter));
}

export async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  // exponential backoff
}

/** Deterministic slug generation (lowercase, alphanumeric only) */
export function generateSlug(nameOrUrl: string): string {
  // Try to extract from URL first: /6-lee-sin.html -> lee-sin
  const urlMatch = nameOrUrl.match(/\/(\d+-[\w-]+)\.html/);
  let base = urlMatch ? urlMatch[1].replace(/^\d+-/, "") : nameOrUrl;
  
  return base
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "") // ALPHANUMERIC ONLY
}
```
</action>
<verify>
- Compiles
- `generateSlug` is deterministic
</verify>
</task>

### Task 3: Scrape tier list page

<task id="2.1.3" depends="2.1.2">
<action>

Create `scripts/scraper/tier-list.ts`:
Scrape `wr-meta.com/meta/` to get the champion roster.
- Use Puppeteer.
- Assign deterministic `id` via `generateSlug(pageUrl)`.
- Extract name, role, tier, winrate, banRate.
- Never merge by raw display name later, use this `id`.

</action>
</task>

### Task 4: Scrape individual champion pages

<task id="2.1.4" depends="2.1.3">
<action>

Create `scripts/scraper/champion-page.ts`:
- Use `page.evaluate` with CSS selectors.
- Extract `extremeThreats` (by their URLs to get proper deterministic IDs).
- Single champion failure MUST NOT abort the whole scrape (use try/catch per url, return `null` if failed, filter out nulls).
- Extract role structurally using `.wr-cn-fs-role > span`, avoiding body text regexes. Add a `roleConfidence: boolean` flag.

</action>
</task>

### Task 5: Main Orchestrator

<task id="2.1.5" depends="2.1.4">
<action>

Create `scripts/scrape.ts` main entry point.
- Support flags: `--limit`, `--dry-run`, `--headless=false` (for debugging).
- Merge Data: Match by deterministic `id` (slug), NOT raw display name.
- Write strict Raw JSON to `scripts/scraper/output/raw-data.json`.
- Strict decoupling: This layer ONLY outputs raw JSON. No Zod validation or normalization here.

</action>
</task>

---

## Success Criteria

1. ✅ `generateSlug` is purely deterministic (alphanumeric).
2. ✅ Scraping includes jitter (500-1000ms delay).
3. ✅ One failure doesn't abort the full scrape.
4. ✅ Role extraction prefers structural selectors (`.wr-cn-fs-role`) and includes `roleConfidence`.
5. ✅ Merging occurs strictly by slug ID, not display name.
6. ✅ CLI flags supported (`--limit`, `--dry-run`, `--headless`).
