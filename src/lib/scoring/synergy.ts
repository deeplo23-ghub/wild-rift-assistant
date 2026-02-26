import type { Champion } from "@/types/champion";
import { SYNERGY_RULES } from "../data/tags";

/**
 * Pre-indexed synergy rules for O(1) lookup.
 * key: "tagA,tagB" (alphabetically sorted)
 */
const SYNERGY_MAP = new Map<string, number>();

SYNERGY_RULES.forEach(rule => {
  const key = [rule.tagA, rule.tagB].sort().join(",");
  SYNERGY_MAP.set(key, rule.score);
});

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
        // Optimized O(1) key lookup
        const key = cTag < aTag ? `${cTag},${aTag}` : `${aTag},${cTag}`;
        pairSynergy += SYNERGY_MAP.get(key) ?? 0;
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
