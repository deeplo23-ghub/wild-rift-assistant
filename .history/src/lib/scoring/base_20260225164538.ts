import { Champion, TIER_SCORE_MAP } from "@/types/champion";

/**
 * Context for base score calculation to avoid redundant computations.
 */
export interface BaseScoreContext {
  medianPickRate: number;
  winrateRanks: Map<string, number>;
}

/**
 * Pre-calculate context for base scores (O(N log N))
 */
export function prepareBaseScoreContext(allChampions: readonly Champion[]): BaseScoreContext {
  if (allChampions.length === 0) return { medianPickRate: 1, winrateRanks: new Map() };

  // Median Pick Rate (O(N log N))
  const pickRates = allChampions.map(c => c.pickRate).sort((a, b) => a - b);
  const mid = Math.floor(pickRates.length / 2);
  const medianPR = pickRates.length % 2 !== 0 
    ? pickRates[mid] 
    : (pickRates[mid - 1] + pickRates[mid]) / 2;
  const safeMedianPR = medianPR > 0 ? medianPR : 1;

  // Winrate Ranks with tie handling to match original O(N^2) logic (O(N log N))
  const sortedByWinrate = [...allChampions].sort((a, b) => a.winrate - b.winrate);
  const winrateRanks = new Map<string, number>();
  
  for (let i = 0; i < sortedByWinrate.length; i++) {
    const c = sortedByWinrate[i];
    let lastIndexWithSameWinrate = i;
    while (
      lastIndexWithSameWinrate + 1 < sortedByWinrate.length && 
      sortedByWinrate[lastIndexWithSameWinrate + 1].winrate === c.winrate
    ) {
      lastIndexWithSameWinrate++;
    }
    const rank = lastIndexWithSameWinrate + 1;
    for (let j = i; j <= lastIndexWithSameWinrate; j++) {
      winrateRanks.set(sortedByWinrate[j].id, rank);
    }
    i = lastIndexWithSameWinrate;
  }

  return {
    medianPickRate: safeMedianPR,
    winrateRanks
  };
}

/**
 * Compute base score for a champion based on meta statistics.
 *
 * @param champion - The candidate champion
 * @param allChampions - All champions (for percentile calculation)
 * @returns Score 0–100
 */
export function computeBaseScore(
  champion: Champion,
  allChampions: readonly Champion[]
): number {
  // Legacy version for compatibility, though discouraged for bulk use
  const context = prepareBaseScoreContext(allChampions);
  return computeBaseScoreFast(champion, allChampions.length, context);
}

/**
 * Fast version of base score calculation using pre-computed context.
 */
export function computeBaseScoreFast(
  champion: Champion,
  allChampionsCount: number,
  context: BaseScoreContext
): number {
  if (allChampionsCount === 0) return 50;

  const rank = context.winrateRanks.get(champion.id) ?? 0;
  const winratePercentile = (rank / allChampionsCount) * 100;
  const tierScore = TIER_SCORE_MAP[champion.tier] ?? 50;
  const pickRateConfidence = Math.min(1.0, champion.pickRate / context.medianPickRate) * 100;

  const raw = 0.50 * winratePercentile + 0.30 * tierScore + 0.20 * pickRateConfidence;
  return Math.max(0, Math.min(100, raw));
}
