"use client";

import React, { useState, useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Champion, Role } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Sparkles } from "lucide-react";
import { ChampionCard } from "./ChampionCard";
import { cn } from "@/lib/utils";

interface ChampionPoolProps {
  champions: Champion[];
}

export const ChampionPool: React.FC<ChampionPoolProps> = ({ champions }) => {
  const { 
    focusedRole, 
    focusedSide, 
    autoPickChampion, 
    scoredChampions,
    ally,
    enemy,
    bans,
    allChampions
  } = useDraftStore();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  // Sync role filter with focused role if one exists
  const activeRole = roleFilter === "all" ? (focusedRole || "all") : roleFilter;

  const unavailableIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(ally).forEach(s => s.championId && ids.add(s.championId));
    Object.values(enemy).forEach(s => s.championId && ids.add(s.championId));
    bans.ally.forEach(id => ids.add(id));
    bans.enemy.forEach(id => ids.add(id));
    return ids;
  }, [ally, enemy, bans]);

  const filteredChampions = useMemo(() => {
    return champions
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchesRole = activeRole === "all" || c.roles.includes(activeRole as Role);
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const scoreA = scoredChampions.find(s => s.championId === a.id)?.finalScore || 0;
        const scoreB = scoredChampions.find(s => s.championId === b.id)?.finalScore || 0;
        return scoreB - scoreA;
      });
  }, [champions, search, activeRole, scoredChampions]);

  const teamAllies = useMemo(() => 
    Object.values(ally).map(s => allChampions.find(c => c.id === s.championId)).filter((c): c is Champion => !!c)
  , [ally, allChampions]);

  const teamEnemies = useMemo(() => 
    Object.values(enemy).map(s => allChampions.find(c => c.id === s.championId)).filter((c): c is Champion => !!c)
  , [enemy, allChampions]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4 p-6 border-b border-white/[0.03] bg-black/20">
        <div className="relative group flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 transition-colors group-focus-within:text-blue-500" />
          <Input
            placeholder="Quick search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 bg-white/[0.03] border-white/[0.05] focus-visible:ring-blue-500/30 text-xs font-medium placeholder:text-zinc-700"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-lg border border-white/5">
          {(["all", ...Object.values(Role)] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
                activeRole === r
                  ? "bg-white/5 text-white shadow-sm"
                  : "text-zinc-600 hover:text-white"
              )}
            >
              {r === "all" ? "Pool" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 py-6">
          {filteredChampions.map((champion) => {
            const score = scoredChampions.find(s => s.championId === champion.id);
            return (
              <ChampionCard
                key={champion.id}
                champion={champion}
                score={score}
                isUnavailable={unavailableIds.has(champion.id)}
                onPick={autoPickChampion}
                allies={teamAllies}
                enemies={teamEnemies}
              />
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="px-6 py-3 border-t border-white/[0.03] bg-black/40 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-500/50" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
               Draft Engine Scoring Active
            </span>
         </div>
         <span className="text-[10px] font-black text-zinc-500">
            {filteredChampions.length} Available
         </span>
      </div>
    </div>
  );
};
