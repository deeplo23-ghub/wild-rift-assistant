/**
 * Risk penalty computation — STUB.
 *
 * Will detect team-wide vulnerabilities that worsen by adding the candidate.
 * See: .gsd/ARCHITECTURE.md §4.10
 *
 * TODO: Implement in Phase 3
 */

import type { Champion } from "@/types/champion";

/**
 * Compute risk penalty for adding a candidate to the team.
 *
 * @param champion - The candidate champion
 * @param allies - Currently locked ally champions
 * @returns Penalty score 0–100 (0 = no risk, higher = more penalty)
 */
export function computeRiskPenalty(
  _champion: Champion,
  _allies: readonly Champion[]
): number {
  // TODO: Implement in Phase 3
  // Detects: all AD, all AP, no frontline, no engage, no peel,
  //          too scaling, no early pressure, no waveclear
  // Only active when ≥2 allies locked
  return 0;
}
