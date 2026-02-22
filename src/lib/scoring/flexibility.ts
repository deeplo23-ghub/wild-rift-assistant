/**
 * Flexibility scoring — STUB.
 *
 * Will reward champions with multi-role capability, hybrid damage,
 * and adaptive builds.
 * See: .gsd/ARCHITECTURE.md §4.9
 *
 * TODO: Implement in Phase 3
 */

import type { Champion } from "@/types/champion";

/**
 * Compute flexibility score for a candidate champion.
 *
 * @param champion - The candidate champion
 * @returns Score 0–100
 */
export function computeFlexibilityScore(
  _champion: Champion
): number {
  // TODO: Implement in Phase 3
  // Formula: (roles/5 × 40) + (hybridDamage × 30) + (adaptiveScore × 30)
  return 50;
}
