/**
 * Explanation text generator — STUB.
 *
 * Will produce human-readable explanations for why a champion
 * was scored the way it was.
 *
 * TODO: Implement in Phase 3
 */

import type { Champion } from "@/types/champion";
import type { ScoreBreakdown } from "./types";

/**
 * Generate human-readable explanation strings for a champion's score.
 *
 * @param champion - The scored champion
 * @param breakdown - The score breakdown
 * @param allies - Current ally team
 * @param enemies - Known enemy team
 * @returns Array of explanation strings (no vague language)
 */
export function generateExplanations(
  _champion: Champion,
  _breakdown: ScoreBreakdown,
  _allies: readonly Champion[],
  _enemies: readonly Champion[]
): string[] {
  // TODO: Implement in Phase 3
  // Must explain: why this champion fits, what weakness it fixes,
  // what threat it counters. No vague language allowed.
  return [];
}
