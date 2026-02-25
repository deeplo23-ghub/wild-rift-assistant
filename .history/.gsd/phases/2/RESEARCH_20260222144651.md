# Phase 2 Research: wr-meta.com Data Structure

> Researched: 2026-02-22

## Site Structure

### Homepage (`wr-meta.com`)
- Champion links: `a[href*=".html"]` with pattern `/{id}-{slug}.html`
  - Example: `/6-lee-sin.html`, `/42-alistar.html`
  - ~120+ champions total

### Tier List Page (`/meta/`)
- Champions grouped by `.wr-cn-slot` containers
- Class encodes role + tier: `{role}-line-tier-{tier}` (sp, s, a, b)
- Each champion card: `.wr-tl-card`
  - Link: `a[href]` → champion page
  - Win rate: `.wr-tl-ov-i` first span (trophy icon + percentage)
  - Ban rate: `.wr-tl-ov-i` second span (ban icon + percentage)
  - Name: `.top-title`
- Role slots: mid, solo, jungle, duo, support (5 roles mapped to our 5)

### Champion Page (`/{id}-{slug}.html`)

#### Meta Stats Section
- Container: `.wr-cn-fs` (carousel of data slides)
- Role: `.wr-cn-fs-role > span` (e.g., "JUNGLE")
- Tier: `.wr-tier-ico` `alt` attribute (e.g., "A", "S+")
- Metrics: `.wr-cn-fs-m` elements:
  - "Win: 48.49%"
  - "Pick: 20.36%"
  - "Ban: 9.96%"
  - "Trend: ↑ 1"
- Confidence: `.wr-badge` (e.g., "Confidence High")
- Rank filter: `.wr-cn-fs-bucket-select` (Diamond+, Master+, etc.)
- Updated date: `.wr-cn-fs-src` "Updated: 22 FEB 2026 UTC 00:00"

#### Champion Info
- Roles from body: "role – Assassin / Fighter"
- Stats in table: base stats (Damage, Toughness, Utility, Difficulty icons)
- Champion icon: `.champion-icon` img src

#### Counter/Threats Section
- Container: `.tabs-box2`
- Section header: `h3` "Threats" and `h3` "Synergies"
- **Tab selector**: `.tabs-sel2` with labels: "Extreme [5]", "Major [4]", "Even [16]"
- **Tab content**: `.tabs-b2` (threats) / `.tabs-b3` (synergies)
- Champion elements: `.counter-champion > a[href]`
- **PREMIUM WALL**: Only first tab ("Extreme") is free; Major/Even are premium-locked

#### Counter Category Mapping (Threats tabs → our MatchupCategory)
- "Extreme" tab → ExtremeDisadvantage (these champions counter YOU)
- "Major" tab → MajorDisadvantage (premium-locked)
- "Even" tab → Even (premium-locked)
- NOTE: No "Minor" tab observed. Extreme threats = strongest counters.

#### Synergies tabs
- Similar tab structure under `.tabs-b3` 
- "Extreme", "Major", possibly more tabs

## Scraping Strategy

### Approach: Two-Pass + Hybrid
1. **Pass 1 — Tier list page** (`/meta/`): Scrape ALL champions + roles + tiers + winrate/banrate
   - **No JS needed** — data is server-rendered in HTML
   - Use HTTP fetch + Cheerio (no Puppeteer needed for this page)
   
2. **Pass 2 — Individual champion pages**: Scrape detailed stats + counter relationships
   - Stats: win rate, pick rate, ban rate from `.wr-cn-fs-m` elements
   - Counter threats: Scrape "Extreme" tab (free) from `.tabs-b2.visible`
   - Synergies: Scrape from `.tabs-b3` sections
   - **JS may be needed** for some elements (tabs, carousel)

### Puppeteer vs Cheerio Decision
- Tier list page: **Cheerio** (server-rendered HTML)
- Champion page stats: **Cheerio may work** (HTML elements present in source)
- Champion page counters: **Puppeteer may be needed** (tab switching)
- **Recommendation**: Start with Cheerio, fall back to Puppeteer if needed

### Rate Limiting
- Polite delay: 1-2s between requests
- ~120 champion pages = ~2-4 minutes total scrape time

## Data Availability Assessment

| Data | Available Free? | Source |
|------|----------------|--------|
| Champion list + names | ✅ Yes | Homepage/Tier list |
| Roles | ✅ Yes | Tier list page |
| Winrate | ✅ Yes | Champion page |
| Pick rate | ✅ Yes | Champion page |
| Ban rate | ✅ Yes | Champion page |
| Tier | ✅ Yes | Tier list + champion page |
| Icon URL | ✅ Yes | Champion page |
| Extreme counters | ✅ Yes | Champion page (first tab) |
| Major counters | ⚠️ Premium | Champion page (locked tab) |
| Even matchups | ⚠️ Premium | Champion page (locked tab) |
| Synergies (extreme) | ✅ Yes | Champion page (first tab) |
| Damage type (AD/AP) | ⚠️ Not scraped | Must derive from roles/tags |
| Durability/engage/etc | ❌ Not on site | Must derive algorithmically |

## Risks

1. **Premium content**: Major/Even counter tabs are locked. Only Extreme available.
   - **Mitigation**: Use Extreme data (strongest signal) + infer Even from absence
2. **JS-rendered content**: Some stats may need Puppeteer
   - **Mitigation**: Test with Cheerio first, Puppeteer fallback
3. **Anti-scraping**: Cloudflare/rate limiting possible
   - **Mitigation**: Polite delays, User-Agent header
4. **Data changes**: Site structure may change
   - **Mitigation**: Strict Zod validation, fail-fast on unexpected structure
