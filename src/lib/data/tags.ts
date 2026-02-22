/**
 * Champion Tag System — definitions, synergy rules, and counter category mapping.
 *
 * This is the DATA layer for tag-based reasoning. No scoring logic here.
 * Tags drive: synergy computation, composition analysis, and threat detection.
 *
 * See: .gsd/ARCHITECTURE.md §4.5 for synergy rule usage.
 * See: .gsd/ARCHITECTURE.md §4.6 for counter category mapping.
 */

import { ChampionTag, MatchupCategory } from "@/types/champion";

// ─── Tag Definitions ────────────────────────────────────────────────────────

export interface TagDefinition {
  readonly id: ChampionTag;
  readonly label: string;
  readonly description: string;
  /** Tailwind-compatible color class for visual tags */
  readonly color: string;
}

/** Complete tag definitions for UI display and documentation */
export const CHAMPION_TAG_DEFINITIONS: readonly TagDefinition[] = [
  {
    id: ChampionTag.Engage,
    label: "Engage",
    description: "Can initiate teamfights with hard CC or gap closers",
    color: "bg-red-500/80",
  },
  {
    id: ChampionTag.Poke,
    label: "Poke",
    description: "Deals damage from long range before fights begin",
    color: "bg-blue-400/80",
  },
  {
    id: ChampionTag.Dive,
    label: "Dive",
    description: "Can dive onto enemy backline to eliminate carries",
    color: "bg-orange-500/80",
  },
  {
    id: ChampionTag.Peel,
    label: "Peel",
    description: "Protects allies from enemy divers with CC or shields",
    color: "bg-green-400/80",
  },
  {
    id: ChampionTag.Frontline,
    label: "Tank",
    description: "Absorbs damage at the front of the team",
    color: "bg-slate-400/80",
  },
  {
    id: ChampionTag.Hypercarry,
    label: "Hypercarry",
    description: "Scales to extreme damage output in late game",
    color: "bg-yellow-400/80",
  },
  {
    id: ChampionTag.Burst,
    label: "Burst",
    description: "Deals massive damage in a short window",
    color: "bg-purple-500/80",
  },
  {
    id: ChampionTag.Sustain,
    label: "Heal",
    description: "Provides healing to self or allies",
    color: "bg-emerald-400/80",
  },
  {
    id: ChampionTag.Scaling,
    label: "Scaling",
    description: "Grows significantly stronger as the game progresses",
    color: "bg-amber-400/80",
  },
  {
    id: ChampionTag.Early,
    label: "Early",
    description: "Strongest in the early game, aims to snowball",
    color: "bg-rose-400/80",
  },
  {
    id: ChampionTag.Splitpush,
    label: "Splitpush",
    description: "Excels at pushing side lanes and 1v1 dueling",
    color: "bg-teal-400/80",
  },
  {
    id: ChampionTag.Antiheal,
    label: "Anti-heal",
    description: "Has built-in grievous wounds or healing reduction",
    color: "bg-pink-500/80",
  },
  {
    id: ChampionTag.CcHeavy,
    label: "CC Heavy",
    description: "Has multiple crowd control abilities",
    color: "bg-indigo-400/80",
  },
  {
    id: ChampionTag.Waveclear,
    label: "Waveclear",
    description: "Clears minion waves quickly for map pressure",
    color: "bg-cyan-400/80",
  },
  {
    id: ChampionTag.Assassin,
    label: "Assassin",
    description: "Eliminates high-priority targets through stealth or mobility",
    color: "bg-violet-500/80",
  },
  {
    id: ChampionTag.Shield,
    label: "Shield",
    description: "Provides protective shields to self or allies",
    color: "bg-sky-400/80",
  },
] as const;

// ─── Synergy Rules ──────────────────────────────────────────────────────────

/**
 * A deterministic synergy rule between two champion tags.
 * Positive score = good synergy, Negative = anti-synergy.
 * Per-pair scores are summed, then capped at [-5, +8].
 */
export interface SynergyRule {
  readonly tagA: ChampionTag;
  readonly tagB: ChampionTag;
  /** Synergy score contribution. Positive = synergy, negative = anti-synergy. */
  readonly score: number;
  /** Human-readable explanation */
  readonly reason: string;
}

/**
 * All tag-pair synergy rules.
 * Rules are bidirectional: (A, B) == (B, A).
 * See ARCHITECTURE.md §4.5 for detailed justification.
 */
export const SYNERGY_RULES: readonly SynergyRule[] = [
  // ─── Positive Synergies ─────────────────────────────────────────────
  {
    tagA: ChampionTag.Engage,
    tagB: ChampionTag.Burst,
    score: 3,
    reason: "Engage creates burst window for follow-up damage",
  },
  {
    tagA: ChampionTag.Engage,
    tagB: ChampionTag.Hypercarry,
    score: 3,
    reason: "Engage draws attention away from carry",
  },
  {
    tagA: ChampionTag.Peel,
    tagB: ChampionTag.Hypercarry,
    score: 4,
    reason: "Peel directly enables carry to deal sustained damage safely",
  },
  {
    tagA: ChampionTag.Frontline,
    tagB: ChampionTag.Hypercarry,
    score: 3,
    reason: "Frontline absorbs damage while carry deals damage behind",
  },
  {
    tagA: ChampionTag.Frontline,
    tagB: ChampionTag.Poke,
    score: 2,
    reason: "Frontline creates space for poke siege composition",
  },
  {
    tagA: ChampionTag.CcHeavy,
    tagB: ChampionTag.Burst,
    score: 2,
    reason: "CC chains extend burst damage window",
  },
  {
    tagA: ChampionTag.Dive,
    tagB: ChampionTag.Dive,
    score: 2,
    reason: "Double dive overwhelms enemy backline",
  },
  {
    tagA: ChampionTag.Engage,
    tagB: ChampionTag.Engage,
    score: 1,
    reason: "Multiple engage angles make initiation more reliable",
  },
  {
    tagA: ChampionTag.Poke,
    tagB: ChampionTag.Poke,
    score: 2,
    reason: "Double poke creates dominant siege composition",
  },
  {
    tagA: ChampionTag.Sustain,
    tagB: ChampionTag.Scaling,
    score: 2,
    reason: "Sustain helps team survive to reach scaling power spikes",
  },
  {
    tagA: ChampionTag.Early,
    tagB: ChampionTag.Early,
    score: 2,
    reason: "Full early-game team can snowball before opponent scales",
  },
  {
    tagA: ChampionTag.Peel,
    tagB: ChampionTag.Poke,
    score: 2,
    reason: "Peel protects poke champions maintaining safe range",
  },
  {
    tagA: ChampionTag.Engage,
    tagB: ChampionTag.CcHeavy,
    score: 2,
    reason: "Engage + layered CC creates extended lockdown chains",
  },
  {
    tagA: ChampionTag.Shield,
    tagB: ChampionTag.Hypercarry,
    score: 3,
    reason: "Shields amplify hypercarry survivability during fights",
  },
  {
    tagA: ChampionTag.Engage,
    tagB: ChampionTag.Assassin,
    score: 2,
    reason: "Engage creates chaos for assassin to find targets",
  },
  {
    tagA: ChampionTag.Waveclear,
    tagB: ChampionTag.Scaling,
    score: 1,
    reason: "Waveclear stalls game for scaling champions",
  },
  {
    tagA: ChampionTag.Frontline,
    tagB: ChampionTag.Sustain,
    score: 2,
    reason: "Healing on a frontline champion extends teamfight duration",
  },

  // ─── Negative Synergies (Anti-synergy) ──────────────────────────────
  {
    tagA: ChampionTag.Splitpush,
    tagB: ChampionTag.Engage,
    score: -2,
    reason: "Splitpush wants 1-3-1, engage wants 5v5 teamfights",
  },
  {
    tagA: ChampionTag.Splitpush,
    tagB: ChampionTag.Splitpush,
    score: -1,
    reason: "Double splitpush leaves team too weak in teamfights",
  },
  {
    tagA: ChampionTag.Early,
    tagB: ChampionTag.Scaling,
    score: -1,
    reason: "Tempo mismatch: early wants to close, scaling wants to stall",
  },
  {
    tagA: ChampionTag.Poke,
    tagB: ChampionTag.Engage,
    score: -1,
    reason: "Poke wants to maintain distance, engage closes distance",
  },
  {
    tagA: ChampionTag.Assassin,
    tagB: ChampionTag.Assassin,
    score: -2,
    reason: "Multiple assassins lack frontline and sustained damage",
  },
] as const;

// ─── Counter Category Mapping ───────────────────────────────────────────────

/**
 * Maps categorical matchup labels (from wr-meta.com) to numerical values.
 * Range: -5 to +5.
 * See ARCHITECTURE.md §4.6 and §5.4.
 */
export const COUNTER_CATEGORY_MAP: Readonly<Record<MatchupCategory, number>> = {
  [MatchupCategory.ExtremeAdvantage]: 5,
  [MatchupCategory.MajorAdvantage]: 3,
  [MatchupCategory.MinorAdvantage]: 1,
  [MatchupCategory.Even]: 0,
  [MatchupCategory.MinorDisadvantage]: -1,
  [MatchupCategory.MajorDisadvantage]: -3,
  [MatchupCategory.ExtremeDisadvantage]: -5,
} as const;

/**
 * Maximum synergy score per pair (sum of all matching positive rules, capped).
 */
export const MAX_SYNERGY_PER_PAIR = 8;

/**
 * Minimum synergy score per pair (sum of all matching negative rules, capped).
 */
export const MIN_SYNERGY_PER_PAIR = -5;
