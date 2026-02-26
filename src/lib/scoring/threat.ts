import { Champion, ChampionTag } from "@/types/champion";

/**
 * Context for threat scoring to avoid redundant enemy evaluation.
 */
export interface ThreatContext {
  burstThreat: number;
  pokeThreat: number;
  diveThreat: number;
  sustainThreat: number;
  splitpushThreat: number;
  totalThreat: number;
}

/**
 * Pre-calculate threat context once per draft state.
 */
export function prepareThreatContext(enemies: readonly Champion[]): ThreatContext {
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

  return { burstThreat, pokeThreat, diveThreat, sustainThreat, splitpushThreat, totalThreat };
}

/**
 * Compute threat mitigation score against enemy team threats.
 *
 * @param champion - The candidate champion
 * @param enemies - Known enemy champions
 * @param context - Optional pre-calculated context
 * @returns Score 0–100
 */
export function computeThreatScore(
  champion: Champion,
  enemies: readonly Champion[],
  context?: ThreatContext
): number {
  if (enemies.length === 0) return 50;

  const ctx = context || prepareThreatContext(enemies);
  if (ctx.totalThreat === 0) return 50;

  const burstMitigation = Math.min(1.0, (champion.durabilityScore + champion.shieldScore + champion.peelScore) / 25);
  const pokeMitigation = Math.min(1.0, (champion.engageScore + champion.mobilityScore + champion.healingScore) / 25);
  const diveMitigation = Math.min(1.0, (champion.peelScore + champion.ccScore + champion.durabilityScore) / 25);
  const sustainMitigation = champion.tags.includes(ChampionTag.Antiheal) ? 1.0 : (champion.tags.includes(ChampionTag.Burst) ? 0.6 : 0);
  const splitpushMitigation = Math.min(1.0, (champion.waveclearScore + champion.mobilityScore + (champion.tags.includes(ChampionTag.Splitpush) ? 5 : 0)) / 25);

  const weightedMitigation = (
    (ctx.burstThreat * burstMitigation) +
    (ctx.pokeThreat * pokeMitigation) +
    (ctx.diveThreat * diveMitigation) +
    (ctx.sustainThreat * sustainMitigation) +
    (ctx.splitpushThreat * splitpushMitigation)
  ) / ctx.totalThreat;

  const rawScore = weightedMitigation * 100;
  return Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
}
