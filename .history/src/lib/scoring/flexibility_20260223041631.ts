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
  champion: Champion
): number {
  const roleScore = Math.min(1.0, champion.roles.length / 3) * 40;
  
  const minDamage = Math.min(champion.damageProfile.ad, champion.damageProfile.ap);
  const hybridDamageScore = Math.min(1.0, minDamage / 0.3) * 30; // 0.3 means 30% / 70% split is max hybrid
  
  // adaptive score could use flexibility tags if they existed, let's use base stats
  const adaptiveScore = 15; // static for now as no adaptive tags exist
  
  const rawScore = roleScore + hybridDamageScore + adaptiveScore;
  return Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
}
