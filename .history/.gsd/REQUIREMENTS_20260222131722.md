# REQUIREMENTS.md — Traceable Requirements

> **Project**: Wild Rift Draft Assistant
> **Derived from**: SPEC.md

---

## Requirements Matrix

| ID | Requirement | Source | Phase | Status |
|----|-------------|--------|-------|--------|
| REQ-01 | Next.js App Router project with TypeScript strict, Tailwind, shadcn/ui | SPEC: Constraints | 1 | Pending |
| REQ-02 | Prisma schema for champions, counter matrix, tags | SPEC: Goal 4 | 1 | Pending |
| REQ-03 | TypeScript type definitions for Champion, Draft, Scoring domains | SPEC: Constraints | 1 | Pending |
| REQ-04 | Champion tag system with 13+ categories (engage, poke, dive, etc.) | SPEC: Goal 4 | 1 | Pending |
| REQ-05 | tRPC router with champion data endpoints | SPEC: Constraints | 1 | Pending |
| REQ-06 | Zustand store for draft state management | SPEC: Goal 1 | 1 | Pending |
| REQ-07 | Puppeteer scraper for wr-meta.com champion data | SPEC: Goal 4 | 2 | Pending |
| REQ-08 | Counter matrix: categorical → numerical [-5,+5] normalization | SPEC: Goal 4 | 2 | Pending |
| REQ-09 | Attribute derivation: durability, engage, peel, cc, scaling, etc. (0–10) | SPEC: Goal 4 | 2 | Pending |
| REQ-10 | Tag-pair synergy rules producing deterministic synergy scores | SPEC: Goal 2 | 2 | Pending |
| REQ-11 | Database seeding from scraped + derived data | SPEC: Goal 4 | 2 | Pending |
| REQ-12 | Base score: WinratePercentile(50%) + TierScore(30%) + PickRateConfidence(20%) | SPEC: Goal 2 | 3 | Pending |
| REQ-13 | Synergy score: pairwise tag-based synergy with locked allies | SPEC: Goal 2 | 3 | Pending |
| REQ-14 | Counter score: direct + indirect counter evaluation | SPEC: Goal 2 | 3 | Pending |
| REQ-15 | Composition score: gap detection and fill reward | SPEC: Goal 2 | 3 | Pending |
| REQ-16 | Threat mitigation score: enemy threat profile evaluation | SPEC: Goal 2 | 3 | Pending |
| REQ-17 | Flexibility score: multi-role + hybrid damage + adaptive builds | SPEC: Goal 2 | 3 | Pending |
| REQ-18 | Risk penalty: team vulnerability detection | SPEC: Goal 2 | 3 | Pending |
| REQ-19 | Stage detection (Early/Mid/Late) with weight adjustment | SPEC: Goal 2 | 3 | Pending |
| REQ-20 | Final score aggregation 0–100 with 7-component breakdown | SPEC: Goal 2 | 3 | Pending |
| REQ-21 | Explanation text generator per recommendation | SPEC: Goal 2 | 3 | Pending |
| REQ-22 | Sub-100ms full recalculation across all champions | SPEC: Goal 3 | 3 | Pending |
| REQ-23 | Three-column layout: ally panel, champion pool, enemy panel | SPEC: Goal 5 | 4 | Pending |
| REQ-24 | Ally panel: 5 role slots, score summary, composition, weaknesses | SPEC: Goal 5 | 4 | Pending |
| REQ-25 | Enemy panel: 5 role slots, threat analysis, damage profile, risks | SPEC: Goal 5 | 4 | Pending |
| REQ-26 | Champion pool: search, role filter, multi-sort, visual tags | SPEC: Goal 5 | 4 | Pending |
| REQ-27 | Ban phase: toggle, blind bans (5 per team), duplicate allowed | SPEC: Goal 1 | 4 | Pending |
| REQ-28 | Score breakdown visualization per champion | SPEC: Goal 5 | 4 | Pending |
| REQ-29 | Real-time recalculation on every input change | SPEC: Goal 3 | 4 | Pending |
| REQ-30 | Vercel deployment with production PostgreSQL | SPEC: Constraints | 5 | Pending |
| REQ-31 | Vitest unit tests for all scoring components | SPEC: Success | 5 | Pending |
| REQ-32 | Playwright E2E test for full draft flow | SPEC: Success | 5 | Pending |
| REQ-33 | All scores deterministic (zero randomness) | SPEC: Constraints | 3 | Pending |
| REQ-34 | Enemy picks manually revealed with immediate rescore | SPEC: Goal 1 | 4 | Pending |
| REQ-35 | Partial enemy knowledge supported (unknown = neutral) | SPEC: Goal 1 | 4 | Pending |
