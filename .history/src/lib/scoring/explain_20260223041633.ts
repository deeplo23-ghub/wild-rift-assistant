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
  champion: Champion,
  breakdown: ScoreBreakdown,
  allies: readonly Champion[],
  enemies: readonly Champion[]
): string[] {
  const ex: string[] = [];

  if (breakdown.synergy >= 75) {
    ex.push(`Excellent synergy with ${allies.length} locked allies.`);
  } else if (breakdown.synergy >= 60) {
    ex.push(`Good synergy with ally team.`);
  }

  if (breakdown.counter >= 75) {
    ex.push(`Strong direct counter to known enemy picks.`);
  } else if (breakdown.counter >= 60) {
    ex.push(`Has situational advantages against enemy team.`);
  }

  if (breakdown.composition >= 80) {
    ex.push(`Perfectly addresses gaps in team composition.`);
  } else if (breakdown.composition >= 60) {
    ex.push(`Provides missing compositional elements.`);
  }

  if (breakdown.threat >= 75) {
    ex.push(`Highly effective at mitigating enemy threat vectors.`);
  }

  if (breakdown.risk >= 15) {
    ex.push(`Warning: Amplifies critical vulnerabilities in the drafted composition.`);
  }

  if (ex.length === 0) {
    ex.push(`Solid base statistics and standard fit for the draft.`);
  }

  return ex;
}
