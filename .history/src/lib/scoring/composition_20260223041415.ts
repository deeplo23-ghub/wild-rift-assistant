/**
 * Composition gap detection and scoring — STUB.
 *
 * Will evaluate which compositional elements the team is missing
 * and reward champions that fill those gaps.
 * See: .gsd/ARCHITECTURE.md §4.7
 *
 * TODO: Implement in Phase 3
 */

import { Champion, ChampionTag } from "@/types/champion";

/**
 * Compute composition score based on team gap analysis.
 *
 * @param champion - The candidate champion
 * @param allies - Currently locked ally champions
 * @returns Score 0–100 (50 = neutral when no allies, 75 = no gaps)
 */
export function computeCompositionScore(
  champion: Champion,
  allies: readonly Champion[]
): number {
  if (allies.length === 0) return 50;

  // Evaluate current team
  const counts = {
    ad: 0,
    ap: 0,
    frontline: 0,
    engage: 0,
    peel: 0,
    waveclear: 0,
    cc: 0,
  };

  const evaluateChamp = (c: Champion) => {
    if (c.damageProfile.ad > 0.5) counts.ad++;
    if (c.damageProfile.ap > 0.5) counts.ap++;
    if (c.durabilityScore >= 7) counts.frontline++;
    if (c.engageScore >= 6) counts.engage++;
    if (c.peelScore >= 5) counts.peel++;
    if (c.waveclearScore >= 5) counts.waveclear++;
    if (c.ccScore >= 4) counts.cc++;
  };

  allies.forEach(evaluateChamp);

  // Detect gaps (what is missing to reach the ideal)
  const gaps = {
    ad: counts.ad < 2,
    ap: counts.ap < 1,
    frontline: counts.frontline < 1,
    engage: counts.engage < 1,
    peel: counts.peel < 1,
    waveclear: counts.waveclear < 2,
    cc: counts.cc < 2,
  };

  const totalGaps = Object.values(gaps).filter(Boolean).length;
  
  if (totalGaps === 0) return 75; // No gaps, healthy team

  // Now, evaluate if candidate fills any of the missing gaps
  const cCounts = {
    ad: champion.damageProfile.ad > 0.5,
    ap: champion.damageProfile.ap > 0.5,
    frontline: champion.durabilityScore >= 7,
    engage: champion.engageScore >= 6,
    peel: champion.peelScore >= 5,
    waveclear: champion.waveclearScore >= 5,
    cc: champion.ccScore >= 4,
  };

  let gapsFilled = 0;
  if (gaps.ad && cCounts.ad) gapsFilled++;
  if (gaps.ap && cCounts.ap) gapsFilled++;
  if (gaps.frontline && cCounts.frontline) gapsFilled++;
  if (gaps.engage && cCounts.engage) gapsFilled++;
  if (gaps.peel && cCounts.peel) gapsFilled++;
  if (gaps.waveclear && cCounts.waveclear) gapsFilled++;
  if (gaps.cc && cCounts.cc) gapsFilled++;

  const rawScore = (gapsFilled / totalGaps) * 100;
  return Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
}
