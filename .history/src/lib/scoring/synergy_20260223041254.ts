/**
 * Synergy score computation — STUB.
 *
 * Will compute pairwise tag-based synergy with locked allies.
 * See: .gsd/ARCHITECTURE.md §4.5
 *
 * TODO: Implement in Phase 3
 */

import type { Champion } from "@/types/champion";
import { SYNERGY_RULES } from "../data/tags";

/**
 * Compute synergy score between a candidate and locked allies.
 *
 * @param champion - The candidate champion
 * @param allies - Currently locked ally champions
 * @returns Score 0–100 (50 = neutral when no allies)
 */
export function computeSynergyScore(
  champion: Champion,
  allies: readonly Champion[]
): number {
  if (allies.length === 0) return 50;

  let totalSynergy = 0;

  for (const ally of allies) {
    if (ally.id === champion.id) continue;
    
    let pairSynergy = 0;
    
    for (const cTag of champion.tags) {
      for (const aTag of ally.tags) {
        for (const rule of SYNERGY_RULES) {
          if (
            (rule.tagA === cTag && rule.tagB === aTag) ||
            (rule.tagA === aTag && rule.tagB === cTag)
          ) {
            pairSynergy += rule.score;
          }
        }
      }
    }
    
    // Cap pairwise synergy [-5, +8]
    pairSynergy = Math.max(-5, Math.min(8, pairSynergy));
    totalSynergy += pairSynergy;
  }

  const maxSynergy = allies.length * 4;
  if (maxSynergy === 0) return 50;
  
  const rawScore = 50 + (totalSynergy / maxSynergy) * 50;
  return Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
}
