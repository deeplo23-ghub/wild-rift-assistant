# SPEC.md — Project Specification

> **Status**: `FINALIZED`
> **Created**: 2026-02-22
> **Project**: Wild Rift Draft Assistant

## Vision

A deterministic, explainable, production-grade Wild Rift draft assistant that simulates competitive draft environments and computes dynamic champion recommendations through a multi-factor scoring engine. Every score is traceable, every weight is explicit, and every recommendation includes a full breakdown. This is a competitive coach assistant, not a toy recommender.

## Goals

1. **Draft Simulation Engine** — Faithful simulation of Wild Rift's ban/pick draft flow with blind bans, manual picks, sequential enemy revelation, and 5-role static team layout.
2. **Deterministic Scoring Engine** — Multi-factor scoring (0–100) with 7 components: Base Stats, Synergy, Counter, Composition Fit, Threat Mitigation, Flexibility, and Risk Penalty. All scores traceable, all weights explicit.
3. **Real-Time Recalculation** — Sub-100ms recalculation on every input change during live draft usage. No server round-trips during scoring.
4. **Data Pipeline** — Automated scraping from wr-meta.com for winrates, tiers, matchup categories. Algorithmic derivation of all granular champion attributes. No manual per-champion data entry.
5. **Professional Analytical UI** — Three-column layout with ally panel, champion pool, and enemy panel. Score breakdowns, composition analysis, threat detection, and weakness identification.

## Non-Goals (Out of Scope)

- Machine learning or AI-based recommendations
- Premium/paid data source integration
- Real-time game integration or Riot API access
- Multi-user collaboration or social features
- Mobile-native app (responsive web is sufficient)
- Automated draft (all picks are manual)
- Pick order enforcement or turn-based simulation
- Voice integration or streaming overlays
- Historical draft tracking or analytics (V1)
- Authentication or user accounts (V1)

## Users

**Primary**: Solo player (the developer) using the tool during live Wild Rift ranked drafts to make informed champion selections based on ally/enemy team composition, counter matchups, and compositional gaps.

**Usage Context**: During live draft phase (~60 seconds per pick). Tool must be immediately responsive. Champions are selected manually. Enemy picks are revealed as they become known.

## Constraints

### Technical
- **Framework**: Next.js (App Router) + TypeScript (strict mode)
- **Database**: PostgreSQL (production), SQLite (local dev)
- **Deployment**: Vercel
- **Scoring latency**: < 100ms full recalculation
- **No server computation during draft**: All scoring runs client-side from precomputed data
- **Deterministic**: Zero randomness in any scoring path

### Data
- **Source**: wr-meta.com (free tier only)
- **Counter data**: Categorical labels (Extreme/Major/Minor/Even) → normalized to [-5, +5]
- **Synergy data**: Algorithmically derived from champion tag combinations
- **Granular stats**: Derived from base stats, role tags, and ability type classifications
- **No manual per-champion scoring tables**

### Scope
- V1: Draft simulation + scoring engine + analytical UI
- V2: Radar charts, heatmaps, draft export, draft grading
- V3: Auth, CI/CD, Docker, observability

## Success Criteria

- [ ] Complete ban/pick draft flow functional with blind bans and manual picks
- [ ] Scoring engine produces deterministic 0–100 scores with full 7-component breakdown
- [ ] All scoring weights are explicit and stage-adjusted
- [ ] Champion recommendations update in < 100ms on any input change
- [ ] Counter matrix populated from scraped categorical matchup data
- [ ] Synergy matrix computed algorithmically from tag system
- [ ] Composition analysis detects gaps (no frontline, all AD, etc.)
- [ ] Threat analysis evaluates enemy team profile and recommends mitigation
- [ ] UI displays score breakdown, composition summary, and threat warnings
- [ ] Deployed and functional on Vercel
- [ ] Every recommendation includes human-readable explanation text
