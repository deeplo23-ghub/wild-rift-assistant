# JOURNAL.md — Development Journal

> **Project**: Wild Rift Draft Assistant

---

## 2026-02-22 — Project Initialization

**Session 1**: Initialized GSD project structure.

- Completed deep questioning phase covering data sources, deployment, stack, and scope
- Finalized SPEC.md with all requirements
- Designed complete scoring engine with mathematical formulas
- Defined data normalization pipeline
- Documented stage logic (Early/Mid/Late draft)
- Created 5-phase V1 roadmap
- Trimmed stack from 100+ to ~40 non-conflicting packages

---

## 2026-02-23 — Logic Implementation

**Session 2**: Complete Phase 3 Scoring Engine and begin Phase 4 UI Integration setup.

- Completed 100% of Phase 3 logic (Base, Synergy, Composition, Threat, Counter, Flexibility, Risk).
- Wrote testing scenarios mapping strict deterministic engine evaluations.
- Achieved >80% test coverage using Vitest.
- Set up initial Zustand state definitions for Phase 4.

---

## 2026-02-26 — Production & Performance

**Session 3**: Final Hardening and Performance Re-execution.

- **Neon Migration**: Successfully transitioned from local SQLite to Neon PostgreSQL (Singapore).
- **Compliance**: Integrated Riot Games Fan Content disclaimers and transitioned assets to Data Dragon CDN.
- **Advanced Optimization**: Re-executed Phase 6 to push performance limits.
    - Implemented `SYNERGY_MAP` for O(1) tag-pair lookups.
    - Introduced `CompositionContext`, `ThreatContext`, and `AllyRiskStats` to pre-calculate team-wide metadata once per recalculation.
    - Result: Scoring engine now performs significantly fewer operations per candidate, ensuring instant feedback even with 150+ champions.
- **Production Lock**: Safeguarded against unintended scraping on Vercel.

**Key insight**: The jump from O(Rules) to O(1) in synergy and eliminating the O(Allies) loop in composition/threat significantly improves battery life on mobile devices by reducing CPU cycles during draft interactions.

**Status**: V1 Complete. Ready for GitHub push.
