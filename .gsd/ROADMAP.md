# ROADMAP.md

> **Current Phase**: 7
> **Milestone**: V1 — Draft Assistant MVP (COMPLETE)

---

## Must-Haves (from SPEC)

- [x] Complete ban/pick draft flow with blind bans and manual picks
- [x] Deterministic scoring engine (0–100) with 7-component breakdown
- [x] Stage-adjusted weights (Early/Mid/Late draft)
- [x] Counter matrix from scraped categorical matchup data
- [x] Algorithmic synergy from champion tag system
- [x] Composition gap detection and scoring
- [x] Threat analysis of enemy team
- [x] Risk penalty detection
- [x] Sub-100ms recalculation (Highly Optimized)
- [x] Score breakdown + explanation text per champion
- [x] Professional three-column analytical UI
- [x] Deployed on Vercel
- [x] Legal compliance (Riot Games TOS)

---

## Phases

### Phase 1: Project Foundation & Data Types
**Status**: ✅ Complete

### Phase 2: Data Pipeline & Scraper
**Status**: ✅ Complete

### Phase 3: Scoring Engine
**Status**: ✅ Complete

### Phase 4: Draft UI & Integration
**Status**: ✅ Complete

### Phase 5: Polish & Deployment
**Status**: ✅ Complete
- [x] Update champion image URLs to jungler.gg pattern
- [x] Implement high-quality icon fallback system
- [x] Comprehensive unit testing for scoring engine
- [x] Vercel deployment infrastructure set up
- [x] Implement legal compliance boilerplates

### Phase 6: Performance Optimization (Re-executed)
**Status**: ✅ Complete
- [x] Optimize scoring engine to O(N) complexity
- [x] Implement granular store selectors in UI
- [x] Memoize champion grid and team slots
- [x] **New**: Implement pre-calculation contexts for Synergy, Composition, Threat, and Risk components to eliminate redundant O(N) tasks inside the O(N) orchestrator loop.

### Phase 7: Production Hardening & Compliance
**Status**: ✅ Complete
- [x] Add statutory Riot Games disclaimers
- [x] Disable background scraping on Vercel (Production Lock)
- [x] Migrate SQLite to Vercel/Neon PostgreSQL
- [x] Transition image assets to official Riot Data Dragon URLs
- [ ] Register for official Riot Games Developer API key (Future enhancement)

---

## Phase Dependency Graph

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6 ──→ Phase 7
Foundation   Data        Engine      UI           Deploy       Optimiz.     Hardening
```

All phases are completed. Version 1.0 is ready for handover.
