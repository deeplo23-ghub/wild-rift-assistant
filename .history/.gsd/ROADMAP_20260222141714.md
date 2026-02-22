# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: V1 — Draft Assistant MVP

---

## Must-Haves (from SPEC)

- [ ] Complete ban/pick draft flow with blind bans and manual picks
- [ ] Deterministic scoring engine (0–100) with 7-component breakdown
- [ ] Stage-adjusted weights (Early/Mid/Late draft)
- [ ] Counter matrix from scraped categorical matchup data
- [ ] Algorithmic synergy from champion tag system
- [ ] Composition gap detection and scoring
- [ ] Threat analysis of enemy team
- [ ] Risk penalty detection
- [ ] Sub-100ms recalculation
- [ ] Score breakdown + explanation text per champion
- [ ] Professional three-column analytical UI
- [ ] Deployed on Vercel

---

## Phases

### Phase 1: Project Foundation & Data Types
**Status**: ✅ Complete
**Objective**: Set up Next.js project, Prisma schema, TypeScript types, and the champion tag system. Establish the data model that everything else builds on.

**Deliverables**:
- Next.js app with App Router, TypeScript strict, Tailwind, shadcn/ui
- Prisma schema for champions, counter matrix, tag definitions
- TypeScript type definitions for Champion, Draft, Scoring
- Tag system definition (engage, poke, dive, peel, frontline, etc.)
- tRPC scaffolding
- Zustand store skeleton
- ESLint + Prettier config

**Requirements**: Foundation for all other phases.

---

### Phase 2: Data Pipeline & Scraper
**Status**: ⬜ Not Started
**Objective**: Build the scraping pipeline that populates the database with champion data, counter matrices, and derived attributes.

**Deliverables**:
- Puppeteer + Cheerio scraper for wr-meta.com
- Raw data extraction: winrate, pickrate, banrate, tier, matchup categories
- Counter matrix normalization (categorical → [-5, +5])
- Attribute derivation engine (durability, engage, peel, etc.)
- Synergy rule definition (tag pair → score)
- Database seeding script
- Data validation checks

**Requirements**: Phase 1 (types, schema, tags)

---

### Phase 3: Scoring Engine
**Status**: ⬜ Not Started
**Objective**: Implement the complete deterministic scoring engine as pure functions with full breakdown and explanation generation.

**Deliverables**:
- Base score computation
- Synergy score computation
- Counter score computation
- Composition gap detection & scoring
- Threat mitigation scoring
- Flexibility scoring
- Risk penalty computation
- Stage detection & weight adjustment
- Final score aggregation (0–100)
- Explanation text generator
- Memoization layer
- Unit tests for every component

**Requirements**: Phase 2 (champion data, matrices)

---

### Phase 4: Draft UI & Integration
**Status**: ⬜ Not Started
**Objective**: Build the full draft simulation UI with three-column layout, connect to scoring engine, and implement all interactive flows.

**Deliverables**:
- Three-column layout (ally / pool / enemy)
- Ally panel: 5 role slots, score summary, composition summary, weakness detection
- Enemy panel: 5 role slots, threat analysis, damage profile, risk warnings
- Champion pool: searchable grid, role filter, sort by score/synergy/counter/winrate
- Visual tags on champion cards
- Ban phase toggle with blind ban flow
- Score breakdown panel per champion
- Real-time recalculation on every input change
- Draft state management (Zustand)
- tRPC data loading (TanStack Query)
- GSAP micro-animations
- Responsive design

**Requirements**: Phase 3 (scoring engine functional)

---

### Phase 5: Polish, Testing & Deployment
**Status**: ⬜ Not Started
**Objective**: Performance optimization, comprehensive testing, UI polish, and Vercel deployment.

**Deliverables**:
- Performance profiling (< 100ms recalculation verified)
- Memoization optimization
- Edge case handling (empty teams, partial info, all bans)
- Vitest unit tests for scoring engine
- React Testing Library tests for components
- Playwright E2E test for full draft flow
- Vercel deployment configuration
- Production environment variables
- Final UI polish and visual refinement

**Requirements**: Phase 4 (full UI functional)

---

## Phase Dependency Graph

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
Foundation   Data        Engine      UI           Deploy
```

All phases are strictly sequential. Each depends on the prior phase's deliverables.
