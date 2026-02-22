/**
 * Draft state store — Zustand.
 *
 * Manages all draft state: picks, bans, phase.
 * Provides derived getters for picked IDs, banned IDs, and current stage.
 *
 * See: .gsd/ARCHITECTURE.md §3.2 for state flow.
 */

import { create } from "zustand";
import { Role } from "@/types/champion";
import {
  DraftPhase,
  DraftStage,
  type TeamState,
  type BanState,
  createEmptyTeamState,
} from "@/types/draft";

// ─── State Shape ────────────────────────────────────────────────────────────

interface DraftStoreState {
  /** Current draft phase (ban or pick) */
  phase: DraftPhase;
  /** Ally team role assignments */
  ally: TeamState;
  /** Enemy team role assignments */
  enemy: TeamState;
  /** Ban lists for both teams */
  bans: BanState;
}

interface DraftStoreActions {
  /** Set a champion pick for an ally role (or null to clear) */
  setAllyPick: (role: Role, championId: string | null) => void;
  /** Set a champion pick for an enemy role (or null to clear) */
  setEnemyPick: (role: Role, championId: string | null) => void;
  /** Add a champion to ally ban list */
  addAllyBan: (championId: string) => void;
  /** Add a champion to enemy ban list */
  addEnemyBan: (championId: string) => void;
  /** Remove a champion from ally ban list */
  removeAllyBan: (championId: string) => void;
  /** Remove a champion from enemy ban list */
  removeEnemyBan: (championId: string) => void;
  /** Switch between ban and pick phases */
  setPhase: (phase: DraftPhase) => void;
  /** Reset entire draft to initial state */
  resetDraft: () => void;
}

export type DraftStore = DraftStoreState & DraftStoreActions;

// ─── Derived Selectors ──────────────────────────────────────────────────────

const ALL_ROLES = [Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support] as const;

/** Extract non-null champion IDs from a team state */
function getPickedIds(team: TeamState): string[] {
  return ALL_ROLES
    .map((role) => team[role].championId)
    .filter((id): id is string => id !== null);
}

/** Compute draft stage from total picks. See ARCHITECTURE.md §4.3. */
function computeStage(allyPicks: number, enemyPicks: number): DraftStage {
  const total = allyPicks + enemyPicks;
  if (total <= 2) return DraftStage.Early;
  if (total <= 6) return DraftStage.Mid;
  return DraftStage.Late;
}

// ─── Store ──────────────────────────────────────────────────────────────────

const initialState: DraftStoreState = {
  phase: DraftPhase.Ban,
  ally: createEmptyTeamState(),
  enemy: createEmptyTeamState(),
  bans: { ally: [], enemy: [] },
};

export const useDraftStore = create<DraftStore>((set) => ({
  ...initialState,

  setAllyPick: (role, championId) =>
    set((state) => ({
      ally: {
        ...state.ally,
        [role]: { role, championId },
      },
    })),

  setEnemyPick: (role, championId) =>
    set((state) => ({
      enemy: {
        ...state.enemy,
        [role]: { role, championId },
      },
    })),

  addAllyBan: (championId) =>
    set((state) => ({
      bans: {
        ...state.bans,
        ally: state.bans.ally.length < 5
          ? [...state.bans.ally, championId]
          : state.bans.ally,
      },
    })),

  addEnemyBan: (championId) =>
    set((state) => ({
      bans: {
        ...state.bans,
        enemy: state.bans.enemy.length < 5
          ? [...state.bans.enemy, championId]
          : state.bans.enemy,
      },
    })),

  removeAllyBan: (championId) =>
    set((state) => ({
      bans: {
        ...state.bans,
        ally: state.bans.ally.filter((id) => id !== championId),
      },
    })),

  removeEnemyBan: (championId) =>
    set((state) => ({
      bans: {
        ...state.bans,
        enemy: state.bans.enemy.filter((id) => id !== championId),
      },
    })),

  setPhase: (phase) => set({ phase }),

  resetDraft: () => set(initialState),
}));

// ─── Selector Hooks ─────────────────────────────────────────────────────────

/** Get all non-null ally champion IDs */
export const selectAllyPickedIds = (state: DraftStore): string[] =>
  getPickedIds(state.ally);

/** Get all non-null enemy champion IDs */
export const selectEnemyPickedIds = (state: DraftStore): string[] =>
  getPickedIds(state.enemy);

/** Get all banned champion IDs (union of both teams) */
export const selectAllBannedIds = (state: DraftStore): string[] => [
  ...state.bans.ally,
  ...state.bans.enemy,
];

/** Get total number of picks (ally + known enemy) */
export const selectTotalPicks = (state: DraftStore): number =>
  getPickedIds(state.ally).length + getPickedIds(state.enemy).length;

/** Get current draft stage based on total picks */
export const selectCurrentStage = (state: DraftStore): DraftStage =>
  computeStage(getPickedIds(state.ally).length, getPickedIds(state.enemy).length);
