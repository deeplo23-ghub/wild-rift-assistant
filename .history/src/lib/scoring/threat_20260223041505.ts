/**
 * Threat mitigation scoring — STUB.
 *
 * Will evaluate enemy team's threat profile and score candidate's
 * ability to mitigate those threats.
 * See: .gsd/ARCHITECTURE.md §4.8
 *
 * TODO: Implement in Phase 3
 */

import { Champion, ChampionTag } from "@/types/champion";

/**
 * Compute threat mitigation score against enemy team threats.
 *
 * @param champion - The candidate champion
 * @param enemies - Known enemy champions
 * @returns Score 0–100 (50 = neutral when no enemies known)
 */
export function computeThreatScore(
  champion: Champion,
  enemies: readonly Champion[]
): number {
  if (enemies.length === 0) return 50;

  let burstThreat = 0;
  let pokeThreat = 0;
  let diveThreat = 0;
  let sustainThreat = 0;
  let splitpushThreat = 0;

  enemies.forEach(e => {
    if (e.tags.includes(ChampionTag.Burst)) burstThreat += 1.0;
    if (e.tags.includes(ChampionTag.Poke)) pokeThreat += 1.0;
    diveThreat += (e.engageScore + e.durabilityScore) / 20;
    sustainThreat += e.healingScore / 10;
    if (e.tags.includes(ChampionTag.Splitpush)) splitpushThreat += 1.0;
  });

  const totalThreat = burstThreat + pokeThreat + diveThreat + sustainThreat + splitpushThreat;
  if (totalThreat === 0) return 50;

  const burstMitigation = Math.min(1.0, (champion.durabilityScore + champion.shieldScore + champion.peelScore) / 25);
  const pokeMitigation = Math.min(1.0, (champion.engageScore + champion.mobilityScore + champion.healingScore) / 25);
  const diveMitigation = Math.min(1.0, (champion.peelScore + champion.ccScore + champion.durabilityScore) / 25);
  const sustainMitigation = champion.tags.includes(ChampionTag.Antiheal) ? 1.0 : (champion.tags.includes(ChampionTag.Burst) ? 0.6 : 0);
  const splitpushMitigation = Math.min(1.0, (champion.waveclearScore + champion.mobilityScore + (champion.tags.includes(ChampionTag.Splitpush) ? 5 : 0)) / 25);

  const weightedMitigation = (
    (burstThreat * burstMitigation) +
    (pokeThreat * pokeMitigation) +
    (diveThreat * diveMitigation) +
    (sustainThreat * sustainMitigation) +
    (splitpushThreat * splitpushMitigation)
  ) / totalThreat;

  const rawScore = weightedMitigation * 100;
  return Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
}
