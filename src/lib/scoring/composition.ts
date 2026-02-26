import { Champion } from "@/types/champion";

/**
 * Context for composition scoring to avoid redundant team evaluation.
 */
export interface CompositionContext {
  counts: {
    ad: number;
    ap: number;
    frontline: number;
    engage: number;
    peel: number;
    waveclear: number;
    cc: number;
  };
  gaps: {
    ad: boolean;
    ap: boolean;
    frontline: boolean;
    engage: boolean;
    peel: boolean;
    waveclear: boolean;
    cc: boolean;
  };
  totalGaps: number;
}

/**
 * Pre-calculate composition context once per draft state.
 */
export function prepareCompositionContext(allies: readonly Champion[]): CompositionContext {
  const counts = {
    ad: 0,
    ap: 0,
    frontline: 0,
    engage: 0,
    peel: 0,
    waveclear: 0,
    cc: 0,
  };

  allies.forEach((c) => {
    if (c.damageProfile.ad > 0.5) counts.ad++;
    if (c.damageProfile.ap > 0.5) counts.ap++;
    if (c.durabilityScore >= 7) counts.frontline++;
    if (c.engageScore >= 6) counts.engage++;
    if (c.peelScore >= 5) counts.peel++;
    if (c.waveclearScore >= 5) counts.waveclear++;
    if (c.ccScore >= 4) counts.cc++;
  });

  const gaps = {
    ad: counts.ad < 1, // At least one AD source
    ap: counts.ap < 1, // At least one AP source
    frontline: counts.frontline < 1,
    engage: counts.engage < 1,
    peel: counts.peel < 1,
    waveclear: counts.waveclear < 2,
    cc: counts.cc < 2,
  };

  const totalGaps = Object.values(gaps).filter(Boolean).length;

  return { counts, gaps, totalGaps };
}

/**
 * Compute composition score based on team gap analysis.
 *
 * @param champion - The candidate champion
 * @param allies - Currently locked ally champions
 * @param context - Optional pre-calculated context
 * @returns Score 0–100
 */
export function computeCompositionScore(
  champion: Champion,
  allies: readonly Champion[],
  context?: CompositionContext
): number {
  if (allies.length === 0) return 50;

  const ctx = context || prepareCompositionContext(allies);
  
  if (ctx.totalGaps === 0) return 75; // No gaps, healthy team

  // Evaluate if candidate fills any of the missing gaps
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
  if (ctx.gaps.ad && cCounts.ad) gapsFilled++;
  if (ctx.gaps.ap && cCounts.ap) gapsFilled++;
  if (ctx.gaps.frontline && cCounts.frontline) gapsFilled++;
  if (ctx.gaps.engage && cCounts.engage) gapsFilled++;
  if (ctx.gaps.peel && cCounts.peel) gapsFilled++;
  if (ctx.gaps.waveclear && cCounts.waveclear) gapsFilled++;
  if (ctx.gaps.cc && cCounts.cc) gapsFilled++;

  const rawScore = (gapsFilled / ctx.totalGaps) * 100;
  return Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
}
