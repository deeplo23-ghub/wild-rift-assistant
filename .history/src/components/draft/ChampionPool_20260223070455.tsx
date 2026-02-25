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
    <div className="flex flex-col h-full bg-black border-x border-gray-900 overflow-hidden relative rounded-none">
      {/* Search & Sort Panel */}
      <div className="flex flex-col p-2 bg-gray-950 border-b border-gray-900 shrink-0 gap-2 rounded-none shadow-xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
            <Input
              placeholder="Query Intelligence Network..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 bg-black border-gray-800 text-sm font-medium focus:ring-0 focus:border-gray-500 rounded-none transition-none placeholder:text-gray-800"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9 bg-black border-gray-800 text-[10px] font-black uppercase tracking-widest rounded-none transition-none text-gray-400">
              <SelectValue placeholder="Metrics" />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-gray-800 rounded-none">
              <SelectItem value="score" className="text-[10px] font-black uppercase rounded-none">Draft Score</SelectItem>
              <SelectItem value="winrate" className="text-[10px] font-black uppercase rounded-none">Meta Winrate</SelectItem>
              <SelectItem value="synergy" className="text-[10px] font-black uppercase rounded-none">Sync Score</SelectItem>
              <SelectItem value="counter" className="text-[10px] font-black uppercase rounded-none">Counter Potential</SelectItem>
              <SelectItem value="name" className="text-[10px] font-black uppercase rounded-none">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 px-1">
          <Filter className="w-4 h-4 text-gray-700" />
          <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
            {banModeActive ? `Strategic Denial Search` : `Filtering: ${focusedRole || "Full Deployment"}`}
          </span>
          <div className="flex-1 h-[1px] bg-gray-900" />
        </div>
      </div>

      {/* Roster Grid */}
      <ScrollArea className="flex-1 p-2 custom-scrollbar rounded-none">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
          {filteredChampions.map((champion) => {
            const score = scoredMap.get(champion.id);
            const isUnavailable = unavailableIds.has(champion.id);
            const finalScore = score?.finalScore ?? 0;

            const scoreColor = 
              finalScore >= 80 ? "text-emerald-400" :
              finalScore >= 50 ? "text-amber-400" :
              "text-red-500";

            const tierColor = {
              "S": "bg-yellow-500 text-black",
              "A": "bg-purple-600 text-white",
              "B": "bg-blue-600 text-white",
              "C": "bg-gray-600 text-white",
            }[champion.tier as string] || "bg-gray-700 text-white";

            return (
              <button
                key={champion.id}
                disabled={isUnavailable}
                onMouseEnter={() => setHoveredChampionId(champion.id)}
                onMouseLeave={() => setHoveredChampionId(null)}
                onClick={() => autoPickChampion(champion.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-1 transition-none rounded-none overflow-hidden",
                  isUnavailable ? "opacity-10 grayscale cursor-not-allowed" : "hover:bg-gray-900/50"
                )}
              >
                <div className={cn(
                  "relative aspect-square w-full rounded-none border overflow-hidden transition-none",
                  isUnavailable ? "border-transparent" : (banModeActive ? "border-red-900/50" : "border-gray-800 focus:border-gray-100")
                )}>
                  <img
                    src={champion.iconUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Tier Badge (Top Left) */}
                  <div className={cn("absolute top-0 left-0 px-1.5 py-0.5 text-[10px] font-black leading-none uppercase", tierColor)}>
                    {champion.tier}
                  </div>

                  {/* Draft Score (Bottom Right) */}
                  {!isUnavailable && score !== undefined && (
                    <div className="absolute right-0 bottom-0 px-1.5 py-1 bg-black/90 border-l border-t border-gray-800">
                      <span className={cn("text-[11px] font-black leading-none", scoreColor)}>
                        {Math.round(finalScore)}
                      </span>
                    </div>
                  )}

                  {/* Role Indicator (Bottom Left) */}
                  <div className="absolute bottom-0 left-0 px-1 py-0.5 bg-black/60 text-[8px] font-black text-gray-300 uppercase tracking-tighter">
                    {champion.roles[0]}
                  </div>
                </div>

                {/* Tactical Label */}
                <div className="w-full truncate px-1 text-center">
                   <p className="text-[10px] font-black text-gray-600 group-hover:text-gray-200 uppercase truncate">
                    {champion.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Contextual Intelligence Overlay */}
      {hoveredChampionData && (
        <div className="absolute bottom-6 right-6 w-[320px] z-[100] pointer-events-none rounded-none border border-gray-800 bg-gray-950 shadow-2xl">
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
