/**
 * Risk penalty computation — STUB.
 *
 * Will detect team-wide vulnerabilities that worsen by adding the candidate.
 * See: .gsd/ARCHITECTURE.md §4.10
 *
 * TODO: Implement in Phase 3
 */

import { Champion, ChampionTag } from "@/types/champion";

/**
 * Compute risk penalty for adding a candidate to the team.
 *
 * @param champion - The candidate champion
 * @param allies - Currently locked ally champions
 * @returns Penalty score 0–100 (0 = no risk, higher = more penalty)
 */
export function computeRiskPenalty(
  champion: Champion,
  allies: readonly Champion[]
): number {
  if (allies.length < 2) return 0; // Only evaluate if 2 or more allies locked

  // Combine champion to see the new state
  const team = [...allies, champion];

  let adCount = 0;
  let apCount = 0;
  let frontlineCount = 0;
  let engageCount = 0;
  let peelCount = 0;
  let waveclearCount = 0;
  let earlyCount = 0;
  let scalingCount = 0;

  team.forEach(c => {
    if (c.damageProfile.ad > 0.6) adCount++;
    if (c.damageProfile.ap > 0.6) apCount++;
    if (c.durabilityScore >= 7) frontlineCount++;
    if (c.engageScore >= 6) engageCount++;
    if (c.peelScore >= 5) peelCount++;
    if (c.waveclearScore >= 5) waveclearCount++;
    if (c.tags.includes(ChampionTag.Early)) earlyCount++;
    if (c.tags.includes(ChampionTag.Scaling)) scalingCount++;
  });

  let penalty = 0;
  const teamSize = team.length;

  if (adCount === teamSize && teamSize >= 3) penalty += 20; // Full AD
  if (apCount === teamSize && teamSize >= 3) penalty += 20; // Full AP
  if (frontlineCount === 0 && teamSize >= 3) penalty += 15;
  if (engageCount === 0 && teamSize >= 3) penalty += 10;
  if (peelCount === 0 && teamSize >= 3) penalty += 10;
  if (waveclearCount === 0 && teamSize >= 3) penalty += 15;
  if (scalingCount >= 3 && earlyCount === 0) penalty += 10; // Too weak early

  return Math.max(0, Math.min(100, penalty));
}
