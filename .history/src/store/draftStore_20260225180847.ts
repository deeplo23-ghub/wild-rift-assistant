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
  hoveredChampionSide: TeamSide | null;
  hoveredStatMetric: string | null;

  // UI State
  isBanMode: boolean;
  activeRoleFilter: Role | "all";
  activeTierFilter: string | "all";
  activeSearch: string;
  sortBy: SortMetric;
  settings: {
    // Draft Behavior
    autoFocus: boolean;
    autoBanFocus: boolean;
    confirmPicks: boolean;

    // Scoring & Display
    showBreakdown: boolean;
    showWinRates: boolean;
    showPickRates: boolean;
    showBanRates: boolean;
    showTierBadges: boolean;
    showDamageType: boolean;
    showTags: boolean;

    // UI / Visual
    disableAnimations: boolean;
    disableTransparency: boolean;
    disableIntro: boolean;
    compactMode: boolean;
    showTooltips: boolean;

    // Analysis Panel
    showWinProbability: boolean;
    showDamageDistribution: boolean;
    showMatchupBars: boolean;

    // Champion Pool
    showTopRecommendations: boolean;
    showSynergyIcons: boolean;
    showCounterIcons: boolean;
    showWeaknessIcons: boolean;
    gridDensity: boolean;
  };

  // Actions
  toggleSetting: (key: keyof DraftStore['settings']) => void;
  setPhase: (phase: DraftPhase) => void;
  setStaticData: (champions: Champion[], matrix: CounterMatrix) => void;
  setFocusedSlot: (side: TeamSide, role: Role | null) => void;
  setHoveredChampion: (id: string | null, side?: TeamSide) => void;
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
  
  const scored = scoreAllChampions(state.allChampions, state, state.focusedSide, state.counterMatrix);
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
      hoveredChampionSide: null,
      hoveredStatMetric: null,
      
      isBanMode: false,
      activeRoleFilter: "all",
      activeTierFilter: "all",
      activeSearch: "",
      sortBy: "score",
      settings: {
        // Draft Behavior
        autoFocus: true,
        autoBanFocus: true,
        confirmPicks: false,

        // Scoring & Display
        showBreakdown: true,
        showWinRates: true,
        showPickRates: true,
        showBanRates: true,
        showTierBadges: true,
        showDamageType: true,
        showTags: true,

        // UI / Visual
        disableAnimations: false,
        disableTransparency: false,
        disableIntro: false,
        compactMode: false,
        showTooltips: true,

        // Analysis Panel
        showWinProbability: true,
        showDamageDistribution: true,
        showMatchupBars: true,

        // Champion Pool
        showTopRecommendations: true,
        showSynergyIcons: true,
        showCounterIcons: true,
        showWeaknessIcons: true,
        gridDensity: false,
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

      setHoveredChampion: (id, side) => set({ hoveredChampionId: id, hoveredChampionSide: side ?? null }),
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
          set({ activeSearch: "", hoveredChampionId: null });
        } else if (state.focusedRole) {
          state.pickChampion(state.focusedSide, state.focusedRole, championId);
          
          if (state.settings.autoFocus) {
            const nextState = get();
            const roles = [Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support];
            const currentIndex = roles.indexOf(state.focusedRole);
            
            let nextRole: Role | null = null;
            for (let i = 1; i <= 5; i++) {
              const check = roles[(currentIndex + i) % 5];
              if (!nextState[state.focusedSide][check].championId) {
                nextRole = check;
                break;
              }
            }
            
            set({ focusedRole: nextRole, activeRoleFilter: nextRole || "all", activeSearch: "", hoveredChampionId: null });
          } else {
            set({ activeSearch: "", hoveredChampionId: null });
          }
        }
      },

      resetDraft: () => {
        set((state) => {
          const newState = {
            ...state,
            ...createEmptyDraftState(),
            focusedSide: TeamSide.Ally,
            focusedRole: null,
            isBanMode: false,
            activeRoleFilter: "all" as const,
            activeTierFilter: "all",
            activeSearch: "",
          };
          return {
            ...newState,
            ...refreshDraftScores(newState as DraftStore)
          };
        });
      },
    }),
    {
      name: "draft-assistant-settings",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
