/**
 * Threat mitigation scoring — STUB.
 *
 * Will evaluate enemy team's threat profile and score candidate's
 * ability to mitigate those threats.
 * See: .gsd/ARCHITECTURE.md §4.8
 *
 * TODO: Implement in Phase 3
 */

import type { Champion } from "@/types/champion";

/**
 * Compute threat mitigation score against enemy team threats.
 *
 * @param champion - The candidate champion
 * @param enemies - Known enemy champions
 * @returns Score 0–100 (50 = neutral when no enemies known)
 */
export function computeThreatScore(
  _champion: Champion,
  _enemies: readonly Champion[]
): number {
  // TODO: Implement in Phase 3
  // Threat categories: Burst, Poke, Dive, Sustain, Splitpush
  // Score = Σ(mitigation × threatLevel) / Σ(threatLevel) × normalized
  return 50;
}
