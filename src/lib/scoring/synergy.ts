/**
 * Synergy score computation — STUB.
 *
 * Will compute pairwise tag-based synergy with locked allies.
 * See: .gsd/ARCHITECTURE.md §4.5
 *
 * TODO: Implement in Phase 3
 */

import type { Champion } from "@/types/champion";

/**
 * Compute synergy score between a candidate and locked allies.
 *
 * @param champion - The candidate champion
 * @param allies - Currently locked ally champions
 * @returns Score 0–100 (50 = neutral when no allies)
 */
export function computeSynergyScore(
  _champion: Champion,
  _allies: readonly Champion[]
): number {
  // TODO: Implement in Phase 3
  // Uses SYNERGY_RULES from lib/data/tags.ts
  // Pairwise sum of matching tag rules, capped per pair, normalized to 0-100
  return 50;
}
