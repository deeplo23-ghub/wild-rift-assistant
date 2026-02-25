/**
 * Scoring engine types for Wild Rift Draft Assistant.
 *
 * Defines score breakdown structures, weight configs, and scored champion output.
 * See: .gsd/ARCHITECTURE.md §4.1–§4.10 for formula specifications.
 */

import { type DraftStage } from "./draft";

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Score component identifiers */
export enum ScoreComponent {
  Base = "base",
  Synergy = "synergy",
  Counter = "counter",
  Composition = "composition",
  Threat = "threat",
  Flexibility = "flexibility",
  Risk = "risk",
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

/**
 * Breakdown of all 7 scoring components.
 * Each value is 0–100 (except risk which is applied as penalty).
 */
export interface ScoreBreakdown {
  /** Base stat score: winrate percentile + tier + pick rate confidence */
  readonly base: number;
  /** Synergy with locked allies */
  readonly synergy: number;
  /** Counter advantage against known enemies */
  readonly counter: number;
  /** How well the champion fills compositional gaps */
  readonly composition: number;
  /** Ability to mitigate enemy team threats */
  readonly threat: number;
  /** Multi-role capability, hybrid damage, build versatility */
  readonly flexibility: number;
  /** Team vulnerability worsening penalty */
  readonly risk: number;
}

/**
 * Weight configuration for score aggregation.
 * Each value is 0–1. Positive weights sum to ≤ 1.0.
 * See ARCHITECTURE.md §4.2 for base values and §4.3 for stage adjustments.
 */
export interface WeightConfig {
  readonly base: number;
  readonly synergy: number;
  readonly counter: number;
  readonly composition: number;
  readonly threat: number;
  readonly flexibility: number;
  /** Risk weight is applied as subtraction */
  readonly risk: number;
}

/**
 * Stage-specific weight modifiers (additive to base weights).
 * See ARCHITECTURE.md §4.3.
 */
export type StageWeights = Readonly<Record<DraftStage, WeightConfig>>;

/**
 * Complete scored champion output.
 * Produced by the scoring engine for each candidate champion.
 */
export interface ScoredChampion {
  /** Champion ID */
  readonly championId: string;
  /** Final aggregated score (0–100) */
  readonly finalScore: number;
  /** Per-component score breakdown */
  readonly breakdown: ScoreBreakdown;
  /** Human-readable explanation strings */
  readonly explanations: readonly string[];
  /** Match-up data for specific section display */
  readonly matchUps: {
    readonly counters: readonly string[];
    readonly synergizesWith: readonly string[];
    readonly weakAgainst: readonly string[];
  };
}

// ─── Composition Analysis Types ─────────────────────────────────────────────

/** Compositional elements that a team should have */
export enum CompositionElement {
  AdDamage = "ad-damage",
  ApDamage = "ap-damage",
  Frontline = "frontline",
  Engage = "engage",
  Peel = "peel",
  Waveclear = "waveclear",
  CrowdControl = "cc",
  Antiheal = "antiheal",
}

/** Analysis result for team composition gaps */
export interface CompositionAnalysis {
  /** Elements present in the team */
  readonly present: readonly CompositionElement[];
  /** Elements missing from the team */
  readonly missing: readonly CompositionElement[];
  /** Total gap count */
  readonly totalGaps: number;
}

// ─── Threat Analysis Types ──────────────────────────────────────────────────

/** Enemy team threat categories */
export enum ThreatCategory {
  Burst = "burst",
  Poke = "poke",
  Dive = "dive",
  Sustain = "sustain",
  Splitpush = "splitpush",
}

/** Threat profile for an enemy team */
export interface ThreatProfile {
  /** Threat level per category (0–10) */
  readonly [ThreatCategory.Burst]: number;
  readonly [ThreatCategory.Poke]: number;
  readonly [ThreatCategory.Dive]: number;
  readonly [ThreatCategory.Sustain]: number;
  readonly [ThreatCategory.Splitpush]: number;
}
