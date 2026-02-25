# Phase 3: Scoring Engine

> **Objective**: Implement the complete deterministic scoring engine as pure functions, computing scores for every champion based on the draft state (picks/bans) and stage modifiers. No UI integration, focusing only on the algorithmic core.

## Overview
The scoring engine evaluates champions based on 7 components, aggregates them using stage-adjusted weights, and generates human-readable explanations. The output must be deterministic and fully covered by unit tests.

## Step 1: Core Scoring Types & Scaffolding
- Define exactly what the scoring functions receive (`DraftState`, `ChampionData` including matrices).
- Define the return type: `ScoredChampion` containing the `finalScore` [0-100], individual component scores, and explanation strings.
- Define `Stage` types (`EARLY`, `MID`, `LATE`).

## Step 2: Weight Configuration & Stage Detection
- Implement `getDraftStage(totalPicks)` to return `EARLY`, `MID`, or `LATE`.
- Create the weight configuration matrix mapping the base weights and stage modifiers to calculate effective weights dynamically.
- Implement weight normalization to ensure weights continually sum correctly after clamping to `[min, max]`.

## Step 3: Impelement Component Scoring Functions
Implement pure functions for each of the 7 scoring vectors.
1. **BaseScore**: Calculate using `WinratePercentile`, `TierScore`, and `PickRateConfidence`.
2. **SynergyScore (tag-rule engine)**: Define tag combination rules (e.g., `engage` + `burst` = +3) and aggregate pairwise synergies among ally picks.
3. **CounterScore (matrix aggregation)**: Direct role-matched counters + 0.5x indirect counters against known enemies. Normalize to [-5, +5] range from categorical matrix data.
4. **CompositionScore**: Check `Compositional Elements` (AD, AP, Frontline, Engage, Peel, etc.) against ideal counts. Reward champions that fill detected gaps.
5. **ThreatScore**: Evaluate enemy team threat profile (Burst, Poke, Dive...) and score champion's mitigation ability.
6. **FlexibilityScore**: Reward multi-role capabilities, hybrid damage profiles, and build versatility.
7. **RiskPenalty**: Punish specific draft faults (e.g., All AD, No Frontline, Too Scaling) if champion worsens them when ≥2 allies are locked.

## Step 4: Final Aggregation Formula
- Build the `calculateFinalScore` function that computes all 7 components.
- Multiply each component score by its stage-adjusted weight.
- Arithmetically combine them and apply the risk penalty subtractively.
- Clamp the final result strictly to `[0, 100]`.

## Step 5: Explanation Generator
- Hook into the component calculation results to generate human-readable text.
- Identify the highest positive contributor (e.g., "Excellent synergy with team's engage").
- Identify the largest negative contributor or risk (e.g., "Team lacks AD damage").
- Output the top positive and negative reasons for debugging and UI consumption.

## Step 6: Testing & Dev Environment
- Set up Vitest if not already initialized.
- **Unit Tests**:
  - Deterministic score check (same input = same output).
  - Stage weight transitions (Early vs Late behavior).
  - Counter aggregation mathematics.
  - Synergy rule applications.
- **Dev Script**: Create `test-scoring.ts` (dev-only script) to run a mock draft scenario in terminal using the seeded DB, verifying the scoring engine outputs realistic numbers and explanations.

## Constraints Reminder
- No UI work.
- pure functions only, no caching setup yet.
- Zero database schema changes.
- Ensure ≥ 80% coverage on new `src/lib/scoring` files.
