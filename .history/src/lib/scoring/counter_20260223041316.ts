/**
 * Counter score computation — STUB.
 *
 * Will compute direct + indirect counter advantages against known enemies.
 * See: .gsd/ARCHITECTURE.md §4.6
 *
 * TODO: Implement in Phase 3
 */

import type { Champion, CounterMatrix } from "@/types/champion";
import { ALL_ROLES, type TeamState } from "@/types/draft";

/**
 * Compute counter score against known enemy champions.
 *
 * @param champion - The candidate champion
 * @param counterMatrix - Precomputed counter matrix (championId → opponentId → value)
 * @param enemyTeam - Known enemy team configuration
 * @returns Score 0–100 (50 = neutral when no enemies known)
 */
export function computeCounterScore(
  champion: Champion,
  counterMatrix: CounterMatrix,
  enemyTeam: TeamState
): number {
  let knownEnemies = 0;
  for (const r of ALL_ROLES) {
    if (enemyTeam[r].championId) knownEnemies++;
  }
  
  if (knownEnemies === 0) return 50;

  let directCounter = 0;
  let indirectCounter = 0;
  const maxCounterRange = 15; // From architecture specs

  const candidateMap = counterMatrix.get(champion.id);

  for (const role of ALL_ROLES) {
    const enemyChampionId = enemyTeam[role].championId;
    if (enemyChampionId) {
      const matchVal = candidateMap?.get(enemyChampionId) ?? 0;

      // If champion is commonly played in this role, treat as direct counter
      if (champion.roles.includes(role)) {
        directCounter += matchVal;
      } else {
        // Indirect counters get half weight
        indirectCounter += matchVal * 0.5;
      }
    }
  }

  // Normalized from [-15, +15] to [0, 100]
  const rawScore = ((directCounter + indirectCounter + maxCounterRange) / (2 * maxCounterRange)) * 100;
  return Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
}
