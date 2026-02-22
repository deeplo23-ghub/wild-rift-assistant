/**
 * Composition gap detection and scoring — STUB.
 *
 * Will evaluate which compositional elements the team is missing
 * and reward champions that fill those gaps.
 * See: .gsd/ARCHITECTURE.md §4.7
 *
 * TODO: Implement in Phase 3
 */

import type { Champion } from "@/types/champion";

/**
 * Compute composition score based on team gap analysis.
 *
 * @param champion - The candidate champion
 * @param allies - Currently locked ally champions
 * @returns Score 0–100 (50 = neutral when no allies, 75 = no gaps)
 */
export function computeCompositionScore(
  _champion: Champion,
  _allies: readonly Champion[]
): number {
  // TODO: Implement in Phase 3
  // Detect missing: AD, AP, frontline, engage, peel, waveclear, CC, antiheal
  // Score = gapsFilled / totalGaps × 100
  return 50;
}
