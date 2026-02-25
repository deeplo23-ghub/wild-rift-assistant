# STATE.md — Project Memory

> **Last Updated**: 2026-02-22
> **Current Phase**: 2 (planned)
> **Session**: 2

## Current Position

- **Phase**: 2 (planned, not yet executed)
- **Plans created**: 3 (1-PLAN.md, 2-PLAN.md, 3-PLAN.md)
- **Status**: Ready for `/execute 2`

## Phase 2 Plans

### Plan 2.1 — Scraper Infrastructure + Champion Data Extraction (5 tasks)
- Install scraping deps (puppeteer, cheerio)
- Create scraper config, logger, utils
- Scrape tier list page (all champions + roles + tiers)
- Scrape individual champion pages (detailed stats + threats)
- Create main scraper orchestrator with dry-run mode

### Plan 2.2 — Normalization + Validation + Counter Matrix (2 tasks)
- Create Zod validation schemas (raw + normalized)
- Create normalization layer (role normalization, damage profiles, attributes, tags, counter matrix)

### Plan 2.3 — Database Seeding + Pipeline Integration (3 tasks)
- Create database seed script with dry-run mode
- Add npm scripts for pipeline commands
- Verify full pipeline end-to-end

## Research Findings (wr-meta.com)

Key selectors discovered:
- Tier list: `.wr-cn-slot` class encodes role+tier, `.wr-tl-card` for champion cards
- Champion stats: `.wr-cn-fs-m` (Win: X%, Pick: X%, Ban: X%)
- Tier: `.wr-tier-ico` alt attribute
- Counters: `.tabs-sel2` tabs ("Extreme [N]", "Major [N]", "Even [N]")
- Counter champs: `.counter-champion > a`
- Premium wall: Only "Extreme" tab is free
- Data update: "Updated: 22 FEB 2026 UTC 00:00"

## Next Steps

1. `/execute 2` — Execute Phase 2 plans

## Key Decisions Made

1. Client-side scoring
2. Counter matrix from categorical scraping
3. Synergy from algorithmic tag system
4. PostgreSQL + monolithic Next.js
5. ~40 package lean stack
6. Prisma 7 with PrismaPg driver adapter
7. **Puppeteer for scraping** (JS-rendered content on wr-meta.com)
8. **Only "Extreme" threats available** (free tier — premium locks Major/Even)
9. **Heuristic attribute derivation** from role tags (no per-champion manual data)
