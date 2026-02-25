"use client";

import React, { useState, useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter } from "lucide-react";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChampionPoolProps {
  champions: Champion[];
}

type SortOption = "score" | "winrate" | "name" | "synergy" | "counter";

export const ChampionPool: React.FC<ChampionPoolProps> = ({ champions }) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  
  const autoPickChampion = useDraftStore((state) => state.autoPickChampion);
  const scoredChampions = useDraftStore((state) => state.scoredChampions);
  const bans = useDraftStore((state) => state.bans);
  const ally = useDraftStore((state) => state.ally);
  const enemy = useDraftStore((state) => state.enemy);
  const { banModeActive, focusedRole } = useDraftStore();

  const [hoveredChampionId, setHoveredChampionId] = useState<string | null>(null);

  const scoredMap = useMemo(() => {
    const map = new Map<string, any>();
    scoredChampions.forEach(s => map.set(s.championId, s));
    return map;
  }, [scoredChampions]);

  const unavailableIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(ally).forEach(s => s.championId && ids.add(s.championId));
    Object.values(enemy).forEach(s => s.championId && ids.add(s.championId));
    if (!banModeActive) {
       bans.ally.forEach(id => ids.add(id));
       bans.enemy.forEach(id => ids.add(id));
    }
    return ids;
  }, [bans, ally, enemy, banModeActive]);

  const filteredChampions = useMemo(() => {
    return champions
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchesRole = banModeActive || !focusedRole || c.roles.includes(focusedRole);
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          const scoreA = scoredMap.get(a.id)?.finalScore ?? 0;
          const scoreB = scoredMap.get(b.id)?.finalScore ?? 0;
          return scoreB - scoreA;
        } else if (sortBy === "winrate") {
          return b.winrate - a.winrate;
        } else if (sortBy === "synergy") {
          const scoreA = scoredMap.get(a.id)?.breakdown.synergy ?? 0;
          const scoreB = scoredMap.get(b.id)?.breakdown.synergy ?? 0;
          return scoreB - scoreA;
        } else if (sortBy === "counter") {
          const scoreA = scoredMap.get(a.id)?.breakdown.counter ?? 0;
          const scoreB = scoredMap.get(b.id)?.breakdown.counter ?? 0;
          return scoreB - scoreA;
        } else {
          return a.name.localeCompare(b.name);
        }
      });
  }, [champions, search, focusedRole, scoredMap, sortBy, banModeActive]);

  const hoveredChampionData = useMemo(() => {
    if (!hoveredChampionId) return null;
    const champion = champions.find(c => c.id === hoveredChampionId);
    const score = scoredMap.get(hoveredChampionId);
    if (!champion || !score) return null;
    return { champion, score };
  }, [hoveredChampionId, champions, scoredMap]);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-x border-gray-700/30 overflow-hidden relative rounded-xl shadow-sm">
      {/* Control Header */}
      <div className="flex flex-col gap-4 p-4 bg-gray-800/50 border-b border-gray-700/30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search roster..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10 bg-gray-950 border-gray-700/50 text-sm focus-visible:ring-blue-500/30 rounded-md"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-10 bg-gray-950 border-gray-700/50 text-sm font-medium rounded-md">
              <SelectValue placeholder="Sort Engine" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="score" className="text-sm">Power Score</SelectItem>
              <SelectItem value="winrate" className="text-sm">Match Winrate</SelectItem>
              <SelectItem value="synergy" className="text-sm">Ally Synergy</SelectItem>
              <SelectItem value="counter" className="text-sm">Enemy Counter</SelectItem>
              <SelectItem value="name" className="text-sm">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Current Filter Indicator */}
        <div className="flex items-center gap-2 px-1">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            {banModeActive ? `Banning for ${useDraftStore.getState().focusedSide}` : `Filter: ${focusedRole || "Full Roster"}`}
          </span>
          {(focusedRole || banModeActive) && (
            <div className={cn("h-1 flex-1 rounded-full", banModeActive ? "bg-red-500/20" : "bg-blue-500/10")} />
          )}
        </div>
      </div>

      {/* Grid Container */}
      <ScrollArea className="flex-1 p-4 custom-scrollbar">
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
          {filteredChampions.map((champion) => {
            const score = scoredMap.get(champion.id);
            const isUnavailable = unavailableIds.has(champion.id);
            const finalScore = score?.finalScore ?? 0;

            const tierColor = {
              "S": "border-amber-500/50 bg-amber-500/5",
              "A": "border-blue-500/50 bg-blue-500/5",
              "B": "border-emerald-500/50 bg-emerald-500/5",
              "C": "border-zinc-700 bg-zinc-800/50",
            }[champion.tier as string] || "border-zinc-800 bg-zinc-900/50";

            const scoreColor = 
              finalScore >= 80 ? "text-emerald-400" :
              finalScore >= 50 ? "text-amber-400" :
              "text-red-400";

            return (
              <button
                key={champion.id}
                disabled={isUnavailable}
                onMouseEnter={() => setHoveredChampionId(champion.id)}
                onMouseLeave={() => setHoveredChampionId(null)}
                onClick={() => autoPickChampion(champion.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 transition-all duration-200",
                  isUnavailable ? "opacity-10 grayscale cursor-not-allowed" : "hover:scale-105 active:scale-95"
                )}
              >
                {/* Compact Card Content */}
                <div className={cn(
                  "relative aspect-square w-full rounded-lg border overflow-hidden transition-all shadow-sm",
                  isUnavailable ? "border-zinc-900" : (banModeActive ? "border-red-500/40 group-hover:border-red-500/80" : tierColor)
                )}>
                  <img
                    src={champion.iconUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Score Tag (Bottom Right) */}
                  {!isUnavailable && score !== undefined && (
                    <div className="absolute right-1 bottom-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/5">
                      <span className={cn("text-xs font-bold tracking-tighter", scoreColor)}>
                        {Math.round(finalScore)}
                      </span>
                    </div>
                  )}

                  {/* Tier Indicator (Top Left) */}
                  <div className="absolute top-1 left-1 px-1 rounded-md bg-black/60 border border-white/5">
                    <span className="text-[10px] font-bold text-white/80">{champion.tier}</span>
                  </div>
                </div>

                {/* Name & Roles */}
                <div className="flex flex-col items-center gap-0 w-full min-w-0">
                  <span className="text-sm font-medium text-zinc-400 truncate w-full text-center group-hover:text-zinc-200 uppercase transition-colors leading-tight">
                    {champion.name}
                  </span>
                  <div className="flex gap-1 justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                    {champion.roles.map(r => (
                      <span key={r} className="text-[10px] font-normal text-zinc-600 group-hover:text-zinc-400 uppercase">
                        {r[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Absolute Positioning for Score Breakdown */}
      {hoveredChampionData && (
        <div className="absolute bottom-6 right-6 w-[300px] z-[100] pointer-events-none fade-in animate-in zoom-in-95 duration-200">
          <div className="pointer-events-auto">
            <ScoreBreakdown 
              scoredChampion={hoveredChampionData.score} 
              championName={hoveredChampionData.champion.name} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
