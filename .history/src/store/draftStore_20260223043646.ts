import { create } from "zustand";
import {
  DraftPhase,
  DraftState,
  TeamSide,
  createEmptyDraftState,
} from "@/types/draft";
import { Role } from "@/types/champion";

interface DraftStore extends DraftState {
  // Actions
  setPhase: (phase: DraftPhase) => void;
  addBan: (side: TeamSide, championId: string) => void;
  removeBan: (side: TeamSide, championId: string) => void;
  pickChampion: (side: TeamSide, role: Role, championId: string) => void;
  removePick: (side: TeamSide, role: Role) => void;
  resetDraft: () => void;

  // UI Selection State
  activeSlot: { side: TeamSide; role: Role } | null;
  setActiveSlot: (side: TeamSide, role: Role) => void;
  clearActiveSlot: () => void;
}

export const useDraftStore = create<DraftStore>((set) => ({
  ...createEmptyDraftState(),
  
  activeSlot: null,
  setActiveSlot: (side, role) => set({ activeSlot: { side, role } }),
  clearActiveSlot: () => set({ activeSlot: null }),

  setPhase: (phase) => set({ phase }),

  addBan: (side, championId) =>
    set((state) => {
      const bans = state.bans[side];
      if (bans.length >= 5 || bans.includes(championId)) return state;
      return {
        bans: {
          ...state.bans,
          [side]: [...bans, championId],
        },
      };
    }),

  removeBan: (side, championId) =>
    set((state) => ({
      bans: {
        ...state.bans,
        [side]: state.bans[side].filter((id) => id !== championId),
      },
    })),

  pickChampion: (side, role, championId) =>
    set((state) => ({
      [side]: {
        ...state[side],
        [role]: { ...state[side][role], championId },
      },
    })),

  removePick: (side, role) =>
    set((state) => ({
      [side]: {
        ...state[side],
        [role]: { ...state[side][role], championId: null },
      },
    })),

  resetDraft: () => set(createEmptyDraftState()),
}));
