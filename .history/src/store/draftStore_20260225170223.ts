import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  hoveredStatMetric: string | null;

  // UI State
  isBanMode: boolean;
  activeRoleFilter: Role | "all";
  activeTierFilter: string | "all";
  activeSearch: string;
  sortBy: SortMetric;
  settings: {
    autoFocus: boolean;
    showBreakdown: boolean;
    disableAnimations: boolean;
    disableTransparency: boolean;
    disableIntro: boolean;
  };

  // Actions
  toggleSetting: (key: keyof DraftStore['settings']) => void;
  setPhase: (phase: DraftPhase) => void;
  setStaticData: (champions: Champion[], matrix: CounterMatrix) => void;
  setFocusedSlot: (side: TeamSide, role: Role | null) => void;
  setHoveredChampion: (id: string | null) => void;
  toggleBanMode: (active?: boolean, side?: TeamSide) => void;
  setRoleFilter: (role: Role | "all") => void;
  setTierFilter: (tier: string | "all") => void;
  setSearch: (query: string) => void;
  setSortBy: (metric: SortMetric) => void;
  setHoveredStatMetric: (metric: string | null) => void;
  
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

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      ...createEmptyDraftState(),
      allChampions: [],
      counterMatrix: null,
      scoredChampions: [],
      focusedSide: TeamSide.Ally,
      focusedRole: null,
      hoveredChampionId: null,
      hoveredStatMetric: null,
      
      isBanMode: false,
      activeRoleFilter: "all",
      activeTierFilter: "all",
      activeSearch: "",
      sortBy: "score",
      settings: {
        autoFocus: true,
        showBreakdown: true,
        disableAnimations: false,
        disableTransparency: false,
        disableIntro: false,
      },

      toggleSetting: (key) => set((state) => ({
        settings: {
          ...state.settings,
          [key]: !state.settings[key]
        }
      })),

      setPhase: (phase) => set({ phase }),

      setStaticData: (champions, matrix) => {
        set({ allChampions: champions, counterMatrix: matrix });
        set(refreshDraftScores(get() as DraftStore));
      },

      setFocusedSlot: (side, role) => {
        set({ 
          focusedSide: side, 
          focusedRole: role, 
          isBanMode: role !== null ? false : get().isBanMode,
          activeRoleFilter: role || "all", // Auto-filter on slot click
          sortBy: role !== null ? "score" : get().sortBy
        });
      },

      setHoveredChampion: (id) => set({ hoveredChampionId: id }),
      setHoveredStatMetric: (metric) => set({ hoveredStatMetric: metric }),

      toggleBanMode: (active, side) => {
        const isMode = active !== undefined ? active : !get().isBanMode;
        set({ 
          isBanMode: isMode,
          focusedSide: side ?? get().focusedSide,
          focusedRole: null,
          activeRoleFilter: "all",
          sortBy: isMode ? "banrate" : get().sortBy === "banrate" ? "score" : get().sortBy
        });
      },

      setRoleFilter: (role) => set({ activeRoleFilter: role }),
      setTierFilter: (tier) => set({ activeTierFilter: tier }),
      setSearch: (query) => set({ activeSearch: query }),
      setSortBy: (metric) => set({ sortBy: metric }),

      addBan: (side, championId) => {
        set((state) => {
          const bans = state.bans[side];
          if (bans.length >= 5 || bans.includes(championId)) return state;
          
          const nextBans = {
            ...state.bans,
            [side]: [...bans, championId],
          };
          
          const nextState = { bans: nextBans };
          const withScores = { ...state, ...nextState };
          
          let nextSide = side;
          const totalBans = nextBans.ally.length + nextBans.enemy.length;
          
          if (totalBans >= 10) {
            return { 
              ...nextState, 
              isBanMode: false, 
              focusedRole: null,
              ...refreshDraftScores(withScores as DraftStore) 
            };
          }
          
          if (nextBans.ally.length < 5) {
            nextSide = TeamSide.Ally;
          } else if (nextBans.enemy.length < 5) {
            nextSide = TeamSide.Enemy;
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
          const nextState = {
            bans: {
              ...state.bans,
              [side]: state.bans[side].filter((id) => id !== championId),
            },
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
          
          if (state.settings.autoFocus) {
            const roles = [Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support];
            const currentIndex = roles.indexOf(state.focusedRole);
            
            let nextRole = state.focusedRole;
            for (let i = 1; i <= 5; i++) {
              const check = roles[(currentIndex + i) % 5];
              if (!state[state.focusedSide][check].championId) {
                nextRole = check;
                break;
              }
            }
            
            set({ focusedRole: nextRole, activeRoleFilter: nextRole });
          }
        }
      },

      resetDraft: () => {
        set({
          ...createEmptyDraftState(),
          scoredChampions: [],
          focusedSide: TeamSide.Ally,
          focusedRole: null,
          isBanMode: false,
          activeRoleFilter: "all",
          activeTierFilter: "all",
          activeSearch: "",
        });
      },
    }),
    {
      name: "draft-assistant-settings",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
