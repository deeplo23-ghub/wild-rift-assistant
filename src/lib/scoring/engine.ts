/**
 * Scoring Engine Orchestrator.
 *
 * This is the main entry point for champion scoring.
 * It calls all 7 scoring components, applies stage-adjusted weights,
 * and produces the final ScoredChampion output.
 *
 * Performance: Optimized to O(N) by pre-calculating team context once per recalculation.
 */

import type { Champion, CounterMatrix } from "@/types/champion";
import type { DraftState, TeamState } from "@/types/draft";
import { TeamSide } from "@/types/draft";
import type { ScoredChampion, ScoreBreakdown } from "./types";

import { computeBaseScoreFast, prepareBaseScoreContext, BaseScoreContext } from "./base";
import { computeSynergyScore } from "./synergy";
import { computeCounterScore } from "./counter";
import { computeCompositionScore, prepareCompositionContext, CompositionContext } from "./composition";
import { computeThreatScore, prepareThreatContext, ThreatContext } from "./threat";
import { computeFlexibilityScore } from "./flexibility";
import { computeRiskPenalty, prepareAllyRiskStats, AllyRiskStats } from "./risk";
import { generateExplanations } from "./explain";
import { getWeights } from "./weights";
import { detectStage } from "./stage";
import { Role } from "@/types/champion";

// ─── Helpers ────────────────────────────────────────────────────────────────

const ALL_ROLES = [Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support] as const;

/** Extract Champion objects for filled slots using a pre-provided map for O(1) lookups */
function getTeamChampions(
  teamState: Record<Role, { championId: string | null }>,
  championMap: Map<string, Champion>
): Champion[] {
  return ALL_ROLES
    .map((role) => teamState[role].championId)
    .filter((id): id is string => id !== null)
    .map((id) => championMap.get(id))
    .filter((c): c is Champion => c !== undefined);
}

/** Clamp a value between min and max */
function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Main Scoring Function ──────────────────────────────────────────────────

/**
 * Score a single candidate champion in the context of the current draft.
 *
 * @param champion - Candidate champion to score
 * @param opposingTeamState - Structural TeamState object array for counter calculation
 * @param allies - Resolved ally champions
 * @param enemies - Resolved enemy champions
 * @param allChampionsCount - Total number of champions
 * @param counterMatrix - Precomputed counter matrix
 * @param baseContext - Precomputed base score context
 * @param compContext - Precomputed composition context
 * @param threatContext - Precomputed threat context
 * @param riskStats - Precomputed risk stats
 * @param weights - Stage-adjusted weights
 * @returns ScoredChampion with final score, breakdown, and explanations
 */
export function scoreChampion(
  champion: Champion,
  opposingTeamState: TeamState,
  allies: Champion[],
  enemies: Champion[],
  allChampionsCount: number,
  counterMatrix: CounterMatrix,
  baseContext: BaseScoreContext,
  compContext: CompositionContext,
  threatContext: ThreatContext,
  riskStats: AllyRiskStats,
  weights: ReturnType<typeof getWeights>
): ScoredChampion {
  // Compute all 7 scoring components (0–100 each)
  const breakdown: ScoreBreakdown = {
    base: computeBaseScoreFast(champion, allChampionsCount, baseContext),
    synergy: computeSynergyScore(champion, allies),
    counter: computeCounterScore(champion, counterMatrix, opposingTeamState),
    composition: computeCompositionScore(champion, allies, compContext),
    threat: computeThreatScore(champion, enemies, threatContext),
    flexibility: computeFlexibilityScore(champion),
    risk: computeRiskPenalty(champion, allies, riskStats),
  };

  // Aggregate: weighted sum with risk as subtraction
  const rawScore =
    weights.base * breakdown.base +
    weights.synergy * breakdown.synergy +
    weights.counter * breakdown.counter +
    weights.composition * breakdown.composition +
    weights.threat * breakdown.threat +
    weights.flexibility * breakdown.flexibility -
    weights.risk * breakdown.risk;

  const finalScore = clamp(0, 100, Math.round(rawScore * 100) / 100);

  // Generate explanations
  const explanations = generateExplanations(champion, breakdown, allies, enemies);

  return {
    championId: champion.id,
    finalScore,
    breakdown,
    explanations,
  };
}

/**
 * Score all candidates in the champion pool.
 *
 * Optimized to O(N) complexity for ~150 champions.
 *
 * @param allChampions - All champion data
 * @param draftState - Current draft state
 * @param counterMatrix - Precomputed counter matrix
 * @returns Array of ScoredChampions, sorted by finalScore descending
 */
export function scoreAllChampions(
  allChampions: readonly Champion[],
  draftState: DraftState,
  focusedSide: TeamSide,
  counterMatrix: CounterMatrix
): ScoredChampion[] {
  if (allChampions.length === 0) return [];

  // 1. Pre-calculate lookup Map (O(N))
  const championMap = new Map(allChampions.map((c) => [c.id, c]));

  // 2. Resolve team champions ONCE (O(Roles)) depending on focused side
  const isAllyTurn = focusedSide !== TeamSide.Enemy;
  const teamStateFor = isAllyTurn ? draftState.ally : draftState.enemy;
  const teamStateAgainst = isAllyTurn ? draftState.enemy : draftState.ally;

  const allies = getTeamChampions(teamStateFor, championMap);
  const enemies = getTeamChampions(teamStateAgainst, championMap);

  // 3. Detect stage and weights ONCE
  const totalPicks = allies.length + enemies.length;
  const stage = detectStage(totalPicks);
  const weights = getWeights(stage);

  // 4. Prepare contexts ONCE (O(N log N) or O(N))
  const baseContext = prepareBaseScoreContext(allChampions);
  const compContext = prepareCompositionContext(allies);
  const threatContext = prepareThreatContext(enemies);
  const riskStats = prepareAllyRiskStats(allies);
  
  const allCount = allChampions.length;

  // 5. Score ALL champions (O(N))
  const scored = allChampions.map((c) => 
    scoreChampion(
      c, 
      teamStateAgainst, 
      allies, 
      enemies, 
      allCount, 
      counterMatrix, 
      baseContext,
      compContext,
      threatContext,
      riskStats,
      weights
    )
  );

  // 6. Sort by final score descending (O(N log N))
  scored.sort((a, b) => b.finalScore - a.finalScore);

  return scored;
}
