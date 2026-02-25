---
phase: 6
plan: 1
wave: 1
depends_on: []
files_modified: ["src/lib/scoring/engine.ts", "src/lib/scoring/base.ts", "src/store/draftStore.ts"]
autonomous: true
must_haves:
  truths:
    - "Scoring engine recalculation handles ~100 champions in < 50ms"
    - "Base scores are pre-calculated and cached"
  artifacts:
    - "src/lib/scoring/base.ts utilizes memoization or pre-calculation"
---

# Plan 6.1: Scoring Engine Optimization

<objective>
Optimize the scoring engine to meet the sub-100ms requirement and reduce unnecessary O(N^2) operations.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/lib/scoring/engine.ts
- src/lib/scoring/base.ts
</context>

<tasks>

<task type="auto">
  <name>Pre-calculate Base Scores</name>
  <files>src/lib/scoring/base.ts</files>
  <action>
    Implement a `computeAllBaseScores` function that calculates winrate percentiles and pickrate confidence for all champions once. 
    Modify `computeBaseScore` to be a lookup or accept pre-calculated context to avoid sorting and iterating over 100+ items for every champion in the pool.
    AVOID: Re-sorting `pickRates` inside any loop.
  </action>
  <verify>Check that `computeAllBaseScores` produces a Map and is used by the scoring orchestrator.</verify>
  <done>Base scores are calculated once per data load.</done>
</task>

<task type="auto">
  <name>Optimize Scoring Orchestrator</name>
  <files>src/lib/scoring/engine.ts</files>
  <action>
    Modify `scoreAllChampions` to pre-resolve `allies` and `enemies` and create a `championMap` once per recalculation.
    Pass these resolved lists to `scoreChampion` instead of resolving them inside the loop.
    This changes the complexity from O(N^2) to O(N).
  </action>
  <verify>Performance test: Score all champions in < 50ms.</verify>
  <done>Score calculation is O(N).</done>
</task>

</tasks>

<success_criteria>
- [ ] Base scores are pre-calculated once.
- [ ] Scoring orchestration avoids redundant Map creation.
- [ ] Recalculation time is significantly reduced.
</success_criteria>
