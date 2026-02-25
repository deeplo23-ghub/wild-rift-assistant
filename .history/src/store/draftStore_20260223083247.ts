import { create } from "zustand";
import {
  DraftPhase,
  DraftState,
  TeamSide,
  createEmptyDraftState,
} from "@/types/draft";
import { Role, Champion, CounterMatrix } from "@/types/champion";
import { ScoredChampion } from "@/types/scoring";
import { scoreAllChampions } from "@/lib/scoring/engine";

export type SortMetric = "score" | "winrate" | "pickrate" | "banrate" | "tier";

interface DraftStore extends DraftState {
  // Data for scoring
  allChampions: Champion[];
  counterMatrix: CounterMatrix | null;
  scoredChampions: ScoredChampion[];

  // Focused slot for interactive picking
  focusedSide: TeamSide;
  focusedRole: Role | null;
  hoveredChampionId: string | null;

  // UI State
  isBanMode: boolean;
  activeRoleFilter: Role | "all";
  activeSearch: string;
  sortBy: SortMetric;

  // Actions
  setPhase: (phase: DraftPhase) => void;
  setStaticData: (champions: Champion[], matrix: CounterMatrix) => void;
  setFocusedSlot: (side: TeamSide, role: Role | null) => void;
  setHoveredChampion: (id: string | null) => void;
  toggleBanMode: (active?: boolean) => void;
  setRoleFilter: (role: Role | "all") => void;
  setSearch: (query: string) => void;
  setSortBy: (metric: SortMetric) => void;
  
  // Operations
  addBan: (side: TeamSide, championId: string) => void;
  removeBan: (side: TeamSide, championId: string) => void;
  pickChampion: (side: TeamSide, role: Role, championId: string) => void;
  removePick: (side: TeamSide, role: Role) => void;
  autoAction: (championId: string) => void; // Handles either pick or ban based on mode
  resetDraft: () => void;
}

/** Helper to refresh scores within the store action */
function refreshDraftScores(state: DraftStore): Partial<DraftStore> {
  if (!state.allChampions.length || !state.counterMatrix) {
    return { scoredChampions: [] };
  }
  
  const scored = scoreAllChampions(state.allChampions, state, state.counterMatrix);
  return { scoredChampions: scored };
}

export const useDraftStore = create<DraftStore>((set, get) => ({
  ...createEmptyDraftState(),
  allChampions: [],
  counterMatrix: null,
  scoredChampions: [],
  focusedSide: TeamSide.Ally,
  focusedRole: Role.Baron,
  hoveredChampionId: null,
  
  isBanMode: false,
  activeRoleFilter: "all",
  activeSearch: "",
  sortBy: "score",

  setPhase: (phase) => set({ phase }),

  setStaticData: (champions, matrix) => {
    set({ allChampions: champions, counterMatrix: matrix });
    set(refreshDraftScores(get() as DraftStore));
  },

  setFocusedSlot: (side, role) => {
    set({ 
      focusedSide: side, 
      focusedRole: role, 
      isBanMode: false,
      activeRoleFilter: role || "all" 
    });
  },

  setHoveredChampion: (id) => set({ hoveredChampionId: id }),

  toggleBanMode: (active) => {
    const isMode = active !== undefined ? active : !get().isBanMode;
    set({ 
      isBanMode: isMode,
      activeRoleFilter: "all"
    });
  },

  setRoleFilter: (role) => set({ activeRoleFilter: role }),
  setSearch: (query) => set({ activeSearch: query }),
  setSortBy: (metric) => set({ sortBy: metric }),

  addBan: (side, championId) => {
    set((state) => {
      const bans = state.bans[side];
      if (bans.length >= 5) {
        // Current team full, check other team
        const otherSide = side === TeamSide.Ally ? TeamSide.Enemy : TeamSide.Ally;
        if (state.bans[otherSide].length < 5) {
           return state; // Should have advanced focus anyway
        }
        return state;
      }
      
      const nextBans = {
        ...state.bans,
        [side]: [...bans, championId],
      };
      
      const nextState = { bans: nextBans };
      const withScores = { ...state, ...nextState };
      const totalBans = nextBans.ally.length + nextBans.enemy.length;
      
      if (totalBans >= 10) {
        return { 
          ...nextState, 
          isBanMode: false, 
          focusedSide: TeamSide.Ally,
          focusedRole: Role.Baron,
          ...refreshDraftScores(withScores as DraftStore) 
        };
      }
      
      // Auto-advance to next empty ban slot
      // Let's alternate if possible
      const otherSide = side === TeamSide.Ally ? TeamSide.Enemy : TeamSide.Ally;
      let nextSide = side;
      
      if (nextBans[side].length > nextBans[otherSide].length && nextBans[otherSide].length < 5) {
        nextSide = otherSide;
      } else if (nextBans[side].length >= 5) {
        nextSide = otherSide;
      }

      return { 
        ...nextState, 
        focusedSide: nextSide,
        ...refreshDraftScores(withScores as DraftStore) 
      };
    });
  },

  removeBan: (side, championId) =>
    set((state) => {
      const bans = state.bans[side];
      const index = bans.indexOf(championId);
      if (index === -1) return state;
      
      const nextAllyBans = side === TeamSide.Ally 
        ? bans.filter((_, i) => i !== index)
        : state.bans.ally;
      const nextEnemyBans = side === TeamSide.Enemy
        ? bans.filter((_, i) => i !== index)
        : state.bans.enemy;

      const nextState = {
        bans: {
          ally: nextAllyBans,
          enemy: nextEnemyBans
        }
      };
      return { ...nextState, ...refreshDraftScores({ ...state, ...nextState } as DraftStore) };
    }),

  pickChampion: (side, role, championId) =>
    set((state) => {
      const nextState = {
        [side]: {
          ...state[side],
          [role]: { ...state[side][role], championId },
        },
      };
      return { ...nextState, ...refreshDraftScores({ ...state, ...nextState } as DraftStore) };
    }),

  removePick: (side, role) =>
    set((state) => {
      const nextState = {
        [side]: {
          ...state[side],
          [role]: { ...state[side][role], championId: null },
        },
      };
      return { ...nextState, ...refreshDraftScores({ ...state, ...nextState } as DraftStore) };
    }),

  autoAction: (championId) => {
    const state = get();
    if (state.isBanMode) {
      state.addBan(state.focusedSide, championId);
    } else if (state.focusedRole) {
      state.pickChampion(state.focusedSide, state.focusedRole, championId);
      // No auto-advance per requirement: "no auto-switching to next slot"
    }
  },

  resetDraft: () => {
    set({
      ...createEmptyDraftState(),
      scoredChampions: [],
      focusedSide: TeamSide.Ally,
      focusedRole: Role.Baron,
      isBanMode: false,
      activeRoleFilter: "all",
      activeSearch: "",
    });
  },
}));
