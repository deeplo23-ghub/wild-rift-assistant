import { Champion, ChampionTag } from "@/types/champion";

/**
 * Statistics for current allies to avoid redundant counting.
 */
export interface AllyRiskStats {
  adCount: number;
  apCount: number;
  frontlineCount: number;
  engageCount: number;
  peelCount: number;
  waveclearCount: number;
  earlyCount: number;
  scalingCount: number;
}

/**
 * Pre-calculate ally risk statistics.
 */
export function prepareAllyRiskStats(allies: readonly Champion[]): AllyRiskStats {
  const stats = {
    adCount: 0,
    apCount: 0,
    frontlineCount: 0,
    engageCount: 0,
    peelCount: 0,
    waveclearCount: 0,
    earlyCount: 0,
    scalingCount: 0,
  };

  allies.forEach(c => {
    if (c.damageProfile.ad > 0.6) stats.adCount++;
    if (c.damageProfile.ap > 0.6) stats.apCount++;
    if (c.durabilityScore >= 7) stats.frontlineCount++;
    if (c.engageScore >= 6) stats.engageCount++;
    if (c.peelScore >= 5) stats.peelCount++;
    if (c.waveclearScore >= 5) stats.waveclearCount++;
    if (c.tags.includes(ChampionTag.Early)) stats.earlyCount++;
    if (c.tags.includes(ChampionTag.Scaling)) stats.scalingCount++;
  });

  return stats;
}

/**
 * Compute risk penalty for adding a candidate to the team.
 *
 * @param champion - The candidate champion
 * @param allies - Currently locked ally champions
 * @param allyStats - Optional pre-calculated stats
 * @returns Penalty score 0–100 (0 = no risk, higher = more penalty)
 */
export function computeRiskPenalty(
  champion: Champion,
  allies: readonly Champion[],
  allyStats?: AllyRiskStats
): number {
  if (allies.length < 2) return 0; // Only evaluate if 2 or more allies locked

  const stats = allyStats || prepareAllyRiskStats(allies);
  
  // Update stats with candidate
  const adCount = stats.adCount + (champion.damageProfile.ad > 0.6 ? 1 : 0);
  const apCount = stats.apCount + (champion.damageProfile.ap > 0.6 ? 1 : 0);
  const frontlineCount = stats.frontlineCount + (champion.durabilityScore >= 7 ? 1 : 0);
  const engageCount = stats.engageCount + (champion.engageScore >= 6 ? 1 : 0);
  const peelCount = stats.peelCount + (champion.peelScore >= 5 ? 1 : 0);
  const waveclearCount = stats.waveclearCount + (champion.waveclearScore >= 5 ? 1 : 0);
  const earlyCount = stats.earlyCount + (champion.tags.includes(ChampionTag.Early) ? 1 : 0);
  const scalingCount = stats.scalingCount + (champion.tags.includes(ChampionTag.Scaling) ? 1 : 0);

  let penalty = 0;
  const teamSize = allies.length + 1;

  if (adCount === teamSize && teamSize >= 3) penalty += 20; // Full AD
  if (apCount === teamSize && teamSize >= 3) penalty += 20; // Full AP
  if (frontlineCount === 0 && teamSize >= 3) penalty += 15;
  if (engageCount === 0 && teamSize >= 3) penalty += 10;
  if (peelCount === 0 && teamSize >= 3) penalty += 10;
  if (waveclearCount === 0 && teamSize >= 3) penalty += 15;
  if (scalingCount >= 3 && earlyCount === 0) penalty += 10; // Too weak early

  return Math.max(0, Math.min(100, penalty));
}
