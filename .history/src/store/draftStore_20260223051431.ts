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

interface DraftStore extends DraftState {
  // Data for scoring
  allChampions: Champion[];
  counterMatrix: CounterMatrix | null;
  scoredChampions: ScoredChampion[];

  // Selection state
  activeSide: TeamSide;
  activeRole: Role | null;
  isBan: boolean;

  // Actions
  setPhase: (phase: DraftPhase) => void;
  setActiveSlot: (side: TeamSide, role: Role | null, isBan?: boolean) => void;
  setStaticData: (champions: Champion[], matrix: CounterMatrix) => void;
  addBan: (side: TeamSide, championId: string) => void;
  removeBan: (side: TeamSide, championId: string) => void;
  pickChampion: (side: TeamSide, role: Role, championId: string) => void;
  removePick: (side: TeamSide, role: Role) => void;
  resetDraft: () => void;
}

/** Helper to refresh scores within the store action */
function refreshDraftScores(state: DraftStore): Partial<DraftStore> {
  if (!state.allChampions.length || !state.counterMatrix) {
    return {};
  }
  
  const scored = scoreAllChampions(state.allChampions, state, state.counterMatrix);
  return { scoredChampions: scored };
}

export const useDraftStore = create<DraftStore>((set, get) => ({
  ...createEmptyDraftState(),
  allChampions: [],
  counterMatrix: null,
  scoredChampions: [],
  activeSide: TeamSide.Ally,
  activeRole: Role.Baron,
  isBan: false,

  setPhase: (phase) => set({ phase }),

  setActiveSlot: (side, role, isBan = false) => set({ activeSide: side, activeRole: role, isBan }),

  setStaticData: (champions, matrix) => {
    set({ allChampions: champions, counterMatrix: matrix });
    set(refreshDraftScores(get() as DraftStore));
  },

  addBan: (side, championId) => {
    set((state) => {
      const bans = state.bans[side];
      if (bans.length >= 5 || bans.includes(championId)) return state;
      const nextState = {
        bans: {
          ...state.bans,
          [side]: [...bans, championId],
        },
      };
      return { ...nextState, ...refreshDraftScores({ ...state, ...nextState } as DraftStore) };
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

  resetDraft: () => {
    set(createEmptyDraftState());
    set({ scoredChampions: [] });
  },
}));
