/**
 * Champion domain types for Wild Rift Draft Assistant.
 *
 * All champion data types, enums, and structures used across the application.
 * See: .gsd/ARCHITECTURE.md §4 for scoring relationships.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

/** The 5 static roles in Wild Rift */
export enum Role {
  Baron = "baron",
  Jungle = "jungle",
  Mid = "mid",
  Dragon = "dragon",
  Support = "support",
}

/** Champion tier rankings */
export enum Tier {
  SPlus = "S+",
  S = "S",
  A = "A",
  B = "B",
  C = "C",
  D = "D",
}

/** Champion gameplay tags used for synergy/composition analysis */
export enum ChampionTag {
  Engage = "engage",
  Poke = "poke",
  Dive = "dive",
  Peel = "peel",
  Frontline = "frontline",
  Hypercarry = "hypercarry",
  Burst = "burst",
  Sustain = "sustain",
  Scaling = "scaling",
  Early = "early",
  Splitpush = "splitpush",
  Antiheal = "antiheal",
  CcHeavy = "cc-heavy",
  Waveclear = "waveclear",
  Assassin = "assassin",
  Shield = "shield",
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

/** Damage type distribution for a champion (each value 0–1, should sum to ~1) */
export interface DamageProfile {
  /** Physical damage ratio */
  readonly ad: number;
  /** Magic damage ratio */
  readonly ap: number;
  /** True damage ratio */
  readonly true: number;
}

/**
 * Complete champion data object.
 *
 * All derived scores are 0–10. See ARCHITECTURE.md §5.5 for derivation formulas.
 */
export interface Champion {
  /** Unique identifier (kebab-case, e.g., "lee-sin") */
  readonly id: string;
  /** Display name (e.g., "Lee Sin") */
  readonly name: string;
  /** Roles this champion can play */
  readonly roles: readonly Role[];
  /** Win rate percentage (0–100) */
  readonly winrate: number;
  /** Pick rate percentage (0–100) */
  readonly pickRate: number;
  /** Ban rate percentage (0–100) */
  readonly banRate: number;
  /** Tier classification */
  readonly tier: Tier;
  /** Damage type distribution */
  readonly damageProfile: DamageProfile;
  /** Tankiness/survivability (0–10) */
  readonly durabilityScore: number;
  /** Hard engage capability (0–10) */
  readonly engageScore: number;
  /** Disengage/protect capability (0–10) */
  readonly peelScore: number;
  /** Crowd control strength (0–10) */
  readonly ccScore: number;
  /** Late-game scaling power (0–10) */
  readonly scalingScore: number;
  /** Early game strength (0–10) */
  readonly earlyGameScore: number;
  /** Movement/dash capability (0–10) */
  readonly mobilityScore: number;
  /** Self/ally healing capability (0–10) */
  readonly healingScore: number;
  /** Shield capability (0–10) */
  readonly shieldScore: number;
  /** Minion wave clearing speed (0–10) */
  readonly waveclearScore: number;
  /** Gameplay tags for synergy/composition */
  readonly tags: readonly ChampionTag[];
  /** URL to champion icon */
  readonly iconUrl: string;
}

// ─── Counter Matrix Types ───────────────────────────────────────────────────

/**
 * Counter matrix: championId → opponentId → numerical value (-5 to +5).
 *
 * Positive = advantage for champion, Negative = disadvantage.
 * Derived from categorical matchup labels (Extreme/Major/Minor/Even).
 * See ARCHITECTURE.md §4.6.
 */
export type CounterMatrix = ReadonlyMap<string, ReadonlyMap<string, number>>;

/** Single counter matchup entry */
export interface CounterEntry {
  readonly championId: string;
  readonly opponentId: string;
  /** Range: -5 to +5 */
  readonly value: number;
}

/** Categorical matchup labels from wr-meta.com */
export enum MatchupCategory {
  ExtremeAdvantage = "Extreme Advantage",
  MajorAdvantage = "Major Advantage",
  MinorAdvantage = "Minor Advantage",
  Even = "Even",
  MinorDisadvantage = "Minor Disadvantage",
  MajorDisadvantage = "Major Disadvantage",
  ExtremeDisadvantage = "Extreme Disadvantage",
}

// ─── Tier Score Mapping ─────────────────────────────────────────────────────

/** Maps tier enum to numerical score (0–100). See ARCHITECTURE.md §4.4. */
export const TIER_SCORE_MAP: Readonly<Record<Tier, number>> = {
  [Tier.SPlus]: 100,
  [Tier.S]: 90,
  [Tier.A]: 75,
  [Tier.B]: 60,
  [Tier.C]: 45,
  [Tier.D]: 30,
} as const;
