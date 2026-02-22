/**
 * Draft state types for Wild Rift Draft Assistant.
 *
 * Models the full draft simulation: phases, team slots, bans, and stages.
 * See: .gsd/ARCHITECTURE.md §6 for stage logic.
 */

import { type Role } from "./champion";

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Draft phase: ban or pick */
export enum DraftPhase {
  Ban = "ban",
  Pick = "pick",
}

/**
 * Draft stage determined by total picks.
 * See ARCHITECTURE.md §4.3 for weight adjustments per stage.
 *
 * - Early: 0–2 total picks
 * - Mid: 3–6 total picks
 * - Late: 7–10 total picks
 */
export enum DraftStage {
  Early = "early",
  Mid = "mid",
  Late = "late",
}

/** Team side identifier */
export enum TeamSide {
  Ally = "ally",
  Enemy = "enemy",
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

/** A single role slot in a team (can be empty or filled) */
export interface RoleSlot {
  readonly role: Role;
  readonly championId: string | null;
}

/**
 * Full team state: 5 role slots.
 * Each key maps to a RoleSlot with the champion pick (or null if empty).
 */
export interface TeamState {
  readonly [Role.Baron]: RoleSlot;
  readonly [Role.Jungle]: RoleSlot;
  readonly [Role.Mid]: RoleSlot;
  readonly [Role.Dragon]: RoleSlot;
  readonly [Role.Support]: RoleSlot;
}

/** Ban state for both teams */
export interface BanState {
  /** Champion IDs banned by ally team (max 5) */
  readonly ally: readonly string[];
  /** Champion IDs banned by enemy team (max 5) */
  readonly enemy: readonly string[];
}

/** Complete draft state */
export interface DraftState {
  /** Current draft phase */
  readonly phase: DraftPhase;
  /** Ally team role assignments */
  readonly ally: TeamState;
  /** Enemy team role assignments */
  readonly enemy: TeamState;
  /** Ban lists for both teams */
  readonly bans: BanState;
}

// ─── Utility Types ──────────────────────────────────────────────────────────

/** All 5 roles as a tuple for iteration */
export const ALL_ROLES = [
  Role.Baron,
  Role.Jungle,
  Role.Mid,
  Role.Dragon,
  Role.Support,
] as const;

/**
 * Creates the initial empty team state with all slots unfilled.
 */
export function createEmptyTeamState(): TeamState {
  return {
    [Role.Baron]: { role: Role.Baron, championId: null },
    [Role.Jungle]: { role: Role.Jungle, championId: null },
    [Role.Mid]: { role: Role.Mid, championId: null },
    [Role.Dragon]: { role: Role.Dragon, championId: null },
    [Role.Support]: { role: Role.Support, championId: null },
  };
}

/**
 * Creates the initial empty draft state.
 */
export function createEmptyDraftState(): DraftState {
  return {
    phase: DraftPhase.Ban,
    ally: createEmptyTeamState(),
    enemy: createEmptyTeamState(),
    bans: { ally: [], enemy: [] },
  };
}
