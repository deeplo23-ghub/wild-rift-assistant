/**
 * UI state store — Zustand.
 *
 * Manages transient UI state: search, filters, sort, selected champion.
 * Separated from draft state for clean concerns.
 */

import { create } from "zustand";
import { type Role } from "@/types/champion";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SortOption = "score" | "synergy" | "counter" | "winrate";

interface UIStoreState {
  /** Champion pool search query */
  searchQuery: string;
  /** Role filter (null = show all) */
  roleFilter: Role | null;
  /** Sort order for champion pool */
  sortBy: SortOption;
  /** Currently selected champion for detail view */
  selectedChampionId: string | null;
}

interface UIStoreActions {
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: Role | null) => void;
  setSortBy: (sort: SortOption) => void;
  setSelectedChampion: (id: string | null) => void;
}

export type UIStore = UIStoreState & UIStoreActions;

// ─── Store ──────────────────────────────────────────────────────────────────

export const useUIStore = create<UIStore>((set) => ({
  searchQuery: "",
  roleFilter: null,
  sortBy: "score",
  selectedChampionId: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setSelectedChampion: (id) => set({ selectedChampionId: id }),
}));
