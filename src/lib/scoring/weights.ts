/**
 * Weight configuration and stage adjustment.
 *
 * Defines BASE_WEIGHTS, STAGE_MODIFIERS, and getWeights() function.
 * This is fully implemented because weights are configuration, not scoring logic.
 *
 * See: .gsd/ARCHITECTURE.md §4.2 (base weights) and §4.3 (stage modifiers).
 *
 * Constraint: No single weight may exceed 0.35 after stage adjustment.
 */

import { DraftStage } from "@/types/draft";
import type { WeightConfig, StageWeights } from "./types";

// ─── Constants ──────────────────────────────────────────────────────────────

/** Base weights for score aggregation. Sum of positive weights = 0.95. */
export const BASE_WEIGHTS: WeightConfig = {
  base: 0.20,
  synergy: 0.20,
  counter: 0.20,
  composition: 0.20,
  threat: 0.10,
  flexibility: 0.05,
  risk: 0.05,
} as const;

/** Weight limits — no single weight may exceed max or go below min. */
export const WEIGHT_LIMITS: Readonly<Record<keyof WeightConfig, { min: number; max: number }>> = {
  base: { min: 0.10, max: 0.35 },
  synergy: { min: 0.10, max: 0.35 },
  counter: { min: 0.10, max: 0.35 },
  composition: { min: 0.10, max: 0.35 },
  threat: { min: 0.05, max: 0.25 },
  flexibility: { min: 0.00, max: 0.15 },
  risk: { min: 0.00, max: 0.15 },
} as const;

/**
 * Stage modifiers (additive to base weights).
 * See ARCHITECTURE.md §4.3 for justification.
 */
export const STAGE_MODIFIERS: StageWeights = {
  [DraftStage.Early]: {
    base: 0.00,
    synergy: 0.00,
    counter: -0.10,
    composition: 0.00,
    threat: 0.00,
    flexibility: 0.10,
    risk: -0.02,
  },
  [DraftStage.Mid]: {
    base: 0.00,
    synergy: 0.00,
    counter: 0.00,
    composition: 0.00,
    threat: 0.00,
    flexibility: 0.00,
    risk: 0.00,
  },
  [DraftStage.Late]: {
    base: 0.00,
    synergy: 0.00,
    counter: 0.15,
    composition: 0.10,
    threat: 0.00,
    flexibility: -0.05,
    risk: 0.05,
  },
} as const;

// ─── Weight Computation ─────────────────────────────────────────────────────

const WEIGHT_KEYS: readonly (keyof WeightConfig)[] = [
  "base", "synergy", "counter", "composition", "threat", "flexibility", "risk",
] as const;

/**
 * Compute stage-adjusted weights.
 *
 * 1. Add stage modifier to base weight
 * 2. Clamp each to [min, max]
 * 3. Re-normalize positive weights so they sum to ≤ 1.0
 *
 * @param stage - Current draft stage
 * @returns Adjusted weight configuration
 */
export function getWeights(stage: DraftStage): WeightConfig {
  const modifier = STAGE_MODIFIERS[stage];

  // Step 1 & 2: Apply modifiers and clamp
  const raw: Record<string, number> = {};
  for (const key of WEIGHT_KEYS) {
    const adjusted = BASE_WEIGHTS[key] + modifier[key];
    const limits = WEIGHT_LIMITS[key];
    raw[key] = Math.max(limits.min, Math.min(limits.max, adjusted));
  }

  // Step 3: Re-normalize positive weights to sum ≤ 1.0
  const positiveKeys = WEIGHT_KEYS.filter((k) => k !== "risk");
  const positiveSum = positiveKeys.reduce((sum, k) => sum + raw[k], 0);

  if (positiveSum > 1.0) {
    const scale = 1.0 / positiveSum;
    for (const key of positiveKeys) {
      raw[key] *= scale;
    }
  }

  return raw as unknown as WeightConfig;
}
