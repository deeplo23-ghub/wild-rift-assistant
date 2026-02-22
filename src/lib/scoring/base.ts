/**
 * Base score computation — STUB.
 *
 * Will compute: 0.50 × WinratePercentile + 0.30 × TierScore + 0.20 × PickRateConfidence
 * See: .gsd/ARCHITECTURE.md §4.4
 *
 * TODO: Implement in Phase 3
 */

import type { Champion } from "@/types/champion";

/**
 * Compute base score for a champion based on meta statistics.
 *
 * @param champion - The candidate champion
 * @param allChampions - All champions (for percentile calculation)
 * @returns Score 0–100
 */
export function computeBaseScore(
  _champion: Champion,
  _allChampions: readonly Champion[]
): number {
  // TODO: Implement in Phase 3
  // Formula: 0.50 × WinratePercentile + 0.30 × TierScore + 0.20 × PickRateConfidence
  return 50;
}
