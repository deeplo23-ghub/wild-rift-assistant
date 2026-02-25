/**
 * Base score computation — STUB.
 *
 * Will compute: 0.50 × WinratePercentile + 0.30 × TierScore + 0.20 × PickRateConfidence
 * See: .gsd/ARCHITECTURE.md §4.4
 *
 * TODO: Implement in Phase 3
 */

import { Champion, TIER_SCORE_MAP } from "@/types/champion";

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
  if (allChampions.length === 0) return 50;

  // Winrate Percentile
  let rank = 0;
  for (const c of allChampions) {
    if (c.winrate <= champion.winrate) rank++;
  }
  const winratePercentile = (rank / allChampions.length) * 100;

  // Tier Score
  const tierScore = TIER_SCORE_MAP[champion.tier] ?? 50;

  // Pick Rate Confidence
  const pickRates = allChampions.map(c => c.pickRate).sort((a, b) => a - b);
  const mid = Math.floor(pickRates.length / 2);
  const medianPR = pickRates.length % 2 !== 0 ? pickRates[mid] : (pickRates[mid - 1] + pickRates[mid]) / 2;
  const safeMedianPR = medianPR > 0 ? medianPR : 1;
  const pickRateConfidence = Math.min(1.0, champion.pickRate / safeMedianPR) * 100;

  const raw = 0.50 * winratePercentile + 0.30 * tierScore + 0.20 * pickRateConfidence;
  return Math.max(0, Math.min(100, raw));
}
