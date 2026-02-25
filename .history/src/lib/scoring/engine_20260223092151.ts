/**
 * Scoring Engine Orchestrator.
 *
 * This is the main entry point for champion scoring.
 * It calls all 7 scoring components, applies stage-adjusted weights,
 * and produces the final ScoredChampion output.
 *
 * See: .gsd/ARCHITECTURE.md §4.1 for the aggregation formula:
 *
 * FinalScore(c) = clamp(0, 100,
 *     w_base × S_base(c)
 *   + w_syn  × S_synergy(c)
 *   + w_ctr  × S_counter(c)
 *   + w_comp × S_composition(c)
 *   + w_thr  × S_threat(c)
 *   + w_flex × S_flexibility(c)
 *   - w_risk × S_risk(c)
 * )
 */

import type { Champion, CounterMatrix } from "@/types/champion";
import type { DraftState } from "@/types/draft";
import type { ScoredChampion, ScoreBreakdown } from "./types";

import { computeBaseScore } from "./base";
import { computeSynergyScore } from "./synergy";
import { computeCounterScore } from "./counter";
import { computeCompositionScore } from "./composition";
import { computeThreatScore } from "./threat";
import { computeFlexibilityScore } from "./flexibility";
import { computeRiskPenalty } from "./risk";
import { generateExplanations } from "./explain";
import { getWeights } from "./weights";
import { detectStage } from "./stage";
import { Role } from "@/types/champion";

// ─── Helpers ────────────────────────────────────────────────────────────────

const ALL_ROLES = [Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support] as const;

/** Extract Champion objects for filled ally slots */
function getAllyChampions(
  draftState: DraftState,
  allChampions: readonly Champion[]
): Champion[] {
  const championMap = new Map(allChampions.map((c) => [c.id, c]));
  return ALL_ROLES
    .map((role) => draftState.ally[role].championId)
    .filter((id): id is string => id !== null)
    .map((id) => championMap.get(id))
    .filter((c): c is Champion => c !== undefined);
}

/** Extract Champion objects for filled enemy slots */
function getEnemyChampions(
  draftState: DraftState,
  allChampions: readonly Champion[]
): Champion[] {
  const championMap = new Map(allChampions.map((c) => [c.id, c]));
  return ALL_ROLES
    .map((role) => draftState.enemy[role].championId)
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
 * This is the core function called for every champion in the pool.
 * It must be fast (< 0.5ms per champion).
 *
 * @param champion - Candidate champion to score
 * @param draftState - Current draft state (picks, bans, phase)
 * @param allChampions - All champion data (for percentile calculations)
 * @param counterMatrix - Precomputed counter matrix
 * @returns ScoredChampion with final score, breakdown, and explanations
 */
export function scoreChampion(
  champion: Champion,
  draftState: DraftState,
  allChampions: readonly Champion[],
  counterMatrix: CounterMatrix
): ScoredChampion {
  // Resolve team champions
  const allies = getAllyChampions(draftState, allChampions);
  const enemies = getEnemyChampions(draftState, allChampions);

  // Detect stage and get stage-adjusted weights
  const totalPicks = allies.length + enemies.length;
  const stage = detectStage(totalPicks);
  const weights = getWeights(stage);

  // Compute all 7 scoring components (0–100 each)
  const breakdown: ScoreBreakdown = {
    base: computeBaseScore(champion, allChampions),
    synergy: computeSynergyScore(champion, allies),
    counter: computeCounterScore(champion, counterMatrix, draftState.enemy),
    composition: computeCompositionScore(champion, allies),
    threat: computeThreatScore(champion, enemies),
    flexibility: computeFlexibilityScore(champion),
    risk: computeRiskPenalty(champion, allies),
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
 * Filters out banned and already-picked champions, then scores the rest.
 * Must complete in < 50ms for ~100 champions.
 *
 * @param allChampions - All champion data
 * @param draftState - Current draft state
 * @param counterMatrix - Precomputed counter matrix
 * @returns Array of ScoredChampions, sorted by finalScore descending
 */
export function scoreAllChampions(
  allChampions: readonly Champion[],
  draftState: DraftState,
  counterMatrix: CounterMatrix
): ScoredChampion[] {
  // Collect all unavailable champion IDs
  const unavailableIds = new Set<string>([
    ...draftState.bans.ally,
    ...draftState.bans.enemy,
    ...getAllyChampions(draftState, allChampions).map((c) => c.id),
    ...getEnemyChampions(draftState, allChampions).map((c) => c.id),
  ]);

  // Score ALL champions so drafted champions still get a score
  const scored = allChampions
    .map((c) => scoreChampion(c, draftState, allChampions, counterMatrix));

  // Sort by final score descending
  scored.sort((a, b) => b.finalScore - a.finalScore);

  return scored;
}
