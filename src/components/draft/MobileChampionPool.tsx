"use client";

import React, { useMemo, useState } from "react";
import { useDraftStore, SortMetric } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { motion } from "framer-motion";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn, getWinrateColor } from "@/lib/utils";
import { ChampionIcon } from "./ChampionIcon";
import { TIER_COLORS, SCORE_COLORS } from "./ChampionPool";

interface MobileChampionPoolProps {
  onPick: (id: string) => void;
}

export const MobileChampionPool: React.FC<MobileChampionPoolProps> = ({ onPick }) => {
  const allChampions = useDraftStore(state => state.allChampions);
  const activeRoleFilter = useDraftStore(state => state.activeRoleFilter);
  const activeTierFilter = useDraftStore(state => state.activeTierFilter);
  const activeSearch = useDraftStore(state => state.activeSearch);
  const sortBy = useDraftStore(state => state.sortBy);
  const scoredChampions = useDraftStore(state => state.scoredChampions);
  const bans = useDraftStore(state => state.bans);
  const ally = useDraftStore(state => state.ally);
  const enemy = useDraftStore(state => state.enemy);
  const focusedSide = useDraftStore(state => state.focusedSide);
  const settings = useDraftStore(state => state.settings);
  const counterMatrix = useDraftStore(state => state.counterMatrix);

  const setRoleFilter = useDraftStore(state => state.setRoleFilter);
  const setSearch = useDraftStore(state => state.setSearch);

  const pickedIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(ally).forEach(s => s.championId && ids.add(s.championId));
    Object.values(enemy).forEach(s => s.championId && ids.add(s.championId));
    bans.ally.forEach(id => ids.add(id));
    bans.enemy.forEach(id => ids.add(id));
    return ids;
  }, [ally, enemy, bans]);

  const scoredMap = useMemo(() => {
    const map = new Map<string, any>();
    scoredChampions.forEach(s => map.set(s.championId, s));
    return map;
  }, [scoredChampions]);

  const sortedChampions = useMemo(() => {
    const searchLower = activeSearch.trim().toLowerCase();
    return allChampions
      .filter((c) => {
        const matchesSearch = searchLower === "" || c.name.toLowerCase().includes(searchLower);
        const matchesRole = activeRoleFilter === "all" || c.roles.includes(activeRoleFilter as Role);
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const isAPicked = pickedIds.has(a.id);
        const isBPicked = pickedIds.has(b.id);
        if (isAPicked && !isBPicked) return 1;
        if (!isAPicked && isBPicked) return -1;

        const scoreA = scoredMap.get(a.id)?.finalScore ?? 0;
        const scoreB = scoredMap.get(b.id)?.finalScore ?? 0;
        return scoreB - scoreA;
      });
  }, [allChampions, activeSearch, activeRoleFilter, pickedIds, scoredMap]);

  // Helper for Top 4 stats
  const getTopStats = (champion: Champion) => {
    const score = scoredMap.get(champion.id);
    if (!score) return null;
    return {
      syn: score.breakdown.synergy,
      ctr: score.breakdown.counter,
      weak: score.breakdown.risk // Use risk as proxy for weakness here for simplicity
    };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search & Role Filter Dropdown */}
      <div className="flex gap-2 mb-4 shrink-0">
        <div className="flex-1 h-10 bg-white/5 border border-white/10 rounded-lg px-3 flex items-center relative gap-2">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search..."
            value={activeSearch}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[12px] font-bold text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        
        <div className="relative group/role">
          <div className="w-24 h-10 bg-white/5 border border-white/10 rounded-lg px-3 flex items-center justify-between">
            <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
              {activeRoleFilter === "all" ? "ROLE" : activeRoleFilter}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </div>
          {/* Mock Role Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-32 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover/role:opacity-100 group-hover/role:pointer-events-auto transition-all z-50 overflow-hidden">
             {["all", Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r as Role | "all")}
                  className={cn(
                    "w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 flex items-center justify-between",
                    activeRoleFilter === r ? "text-blue-400" : "text-zinc-400"
                  )}
                >
                  {r}
                  {activeRoleFilter === r && <Check className="w-3 h-3" />}
                </button>
             ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-20">
        <div className="grid grid-cols-4 gap-2">
          {sortedChampions.map((champ, idx) => {
            const isPicked = pickedIds.has(champ.id);
            const score = scoredMap.get(champ.id);
            const finalScore = score?.finalScore || 0;
            const topStats = idx < 4 ? getTopStats(champ) : null;
            
            // Border for top 4
            const borderStyle = idx === 0 ? "border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                               : idx === 1 ? "border-zinc-300/50 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                               : idx === 2 ? "border-orange-400/50 shadow-[0_0_10px_rgba(251,146,60,0.1)]"
                               : idx === 3 ? "border-orange-500/30 shadow-[0_0_8px_rgba(251,146,60,0.05)]"
                               : "border-white/5";

            return (
              <button
                key={champ.id}
                onClick={() => !isPicked && onPick(champ.id)}
                className={cn(
                  "flex flex-col group transition-all active:scale-95",
                  isPicked ? "opacity-30 grayscale cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <div className={cn(
                  "aspect-square rounded-lg overflow-hidden border transition-all relative",
                  borderStyle,
                  !isPicked && "group-hover:border-blue-500/50"
                )}>
                  <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full" />
                  
                  {/* Score badge for all */}
                   <div className={cn(
                    "absolute bottom-0 right-0 px-1 py-0.5 bg-black/80 rounded-tl-md z-10",
                    SCORE_COLORS(finalScore)
                  )}>
                    <span className="text-[8px] font-black block leading-none">{finalScore.toFixed(0)}</span>
                  </div>
                </div>

                <div className="mt-1 flex flex-col items-center">
                  <span className="text-[8px] font-bold text-zinc-400 truncate w-full text-center capitalize">
                    {champ.name.toLowerCase()}
                  </span>
                  
                  {topStats && !isPicked && (
                    <div className="flex flex-col items-center gap-0 mt-1">
                      <span className={cn("text-[7px] font-bold", getWinrateColor(champ.winrate))}>
                        {champ.winrate.toFixed(0)}%
                      </span>
                      <div className="flex flex-col items-center opacity-60">
                        <span className="text-[6px] text-emerald-400 font-bold">S: {topStats.syn.toFixed(0)}</span>
                        <span className="text-[6px] text-orange-400 font-bold">C: {topStats.ctr.toFixed(0)}</span>
                        <span className="text-[6px] text-yellow-400 font-bold">W: {topStats.weak.toFixed(0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
