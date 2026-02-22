# DECISIONS.md — Architecture Decision Records

> **Project**: Wild Rift Draft Assistant

---

## ADR-001: Client-Side Scoring Engine
**Date**: 2026-02-22
**Status**: Accepted
**Context**: Draft assistant is used during live draft with ~60s per pick. Server round-trips add latency.
**Decision**: All scoring computation runs client-side in the browser from precomputed data loaded at app start.
**Consequences**: Champion data (~100 champions × full objects) must fit in browser memory. Scoring functions must be pure and fast. Data pipeline is offline-only.

---

## ADR-002: Categorical Counter Matrix
**Date**: 2026-02-22
**Status**: Accepted
**Context**: wr-meta.com provides matchup categories (Extreme/Major/Minor/Even) but not numerical winrate tables.
**Decision**: Normalize categories to [-5, +5] scale. This produces a deterministic sparse counter matrix without premium data.
**Consequences**: Counter granularity is limited to 7 levels. Sufficient for draft analysis purposes.

---

## ADR-003: Algorithmic Synergy Derivation
**Date**: 2026-02-22
**Status**: Accepted
**Context**: No external synergy data exists. Manual curation doesn't scale.
**Decision**: Define tag-pair synergy rules. Compute pairwise synergy as sum of matching tag interaction scores.
**Consequences**: Synergy quality depends on tag accuracy and rule completeness. Rules can be iterated over time.

---

## ADR-004: Monolithic Next.js Architecture
**Date**: 2026-02-22
**Status**: Accepted
**Context**: Personal tool deployed on Vercel. No need for microservices.
**Decision**: Single Next.js app handles frontend, API (tRPC), and scraper scripts.
**Consequences**: Simple deployment. All code colocated. Scraper runs as standalone script, not as API route.

---

## ADR-005: Lean Stack (~40 packages)
**Date**: 2026-02-22
**Status**: Accepted
**Context**: Initial spec listed 100+ libraries with significant overlap.
**Decision**: Trim to non-conflicting minimal set. Document exclusion rationale in STACK.md.
**Consequences**: Faster installs, fewer conflicts, simpler maintenance. Can add packages later if justified.
