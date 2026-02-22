/**
 * Counter score computation — STUB.
 *
 * Will compute direct + indirect counter advantages against known enemies.
 * See: .gsd/ARCHITECTURE.md §4.6
 *
 * TODO: Implement in Phase 3
 */

import type { Champion, CounterMatrix } from "@/types/champion";

/**
 * Compute counter score against known enemy champions.
 *
 * @param champion - The candidate champion
 * @param enemies - Known enemy champions
 * @param counterMatrix - Precomputed counter matrix (championId → opponentId → value)
 * @returns Score 0–100 (50 = neutral when no enemies known)
 */
export function computeCounterScore(
  _champion: Champion,
  _enemies: readonly Champion[],
  _counterMatrix: CounterMatrix
): number {
  // TODO: Implement in Phase 3
  // directCounter = counterMatrix[c][enemy_same_role]
  // indirectCounter = Σ counterMatrix[c][enemy_i] × 0.5 (non-role-matched)
  // Normalized from [-15, +15] to [0, 100]
  return 50;
}
