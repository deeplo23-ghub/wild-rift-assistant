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
    <div className="flex flex-col h-full bg-gray-950 border-x border-gray-800 overflow-hidden relative rounded-none">
      {/* Search & Sort Panel */}
      <div className="flex flex-col p-2 bg-gray-900 border-b border-gray-800 shrink-0 gap-2 rounded-none">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Query Roster..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 bg-gray-950 border-gray-800 text-sm focus:ring-0 focus:border-gray-600 rounded-none transition-none"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[120px] h-8 bg-gray-950 border-gray-800 text-sm font-medium rounded-none transition-none">
              <SelectValue placeholder="Metrics" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 rounded-none">
              <SelectItem value="score" className="text-sm rounded-none">Power</SelectItem>
              <SelectItem value="winrate" className="text-sm rounded-none">Stat%</SelectItem>
              <SelectItem value="synergy" className="text-sm rounded-none">Link</SelectItem>
              <SelectItem value="counter" className="text-sm rounded-none">Opposition</SelectItem>
              <SelectItem value="name" className="text-sm rounded-none">Alpha</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 px-1">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-600 uppercase">
            {banModeActive ? `Ban Search` : `Filter: ${focusedRole || "Full"}`}
          </span>
          <div className="flex-1 h-[1px] bg-gray-800" />
        </div>
      </div>

      {/* Roster Grid */}
      <ScrollArea className="flex-1 p-2 custom-scrollbar rounded-none">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
          {filteredChampions.map((champion) => {
            const score = scoredMap.get(champion.id);
            const isUnavailable = unavailableIds.has(champion.id);
            const finalScore = score?.finalScore ?? 0;

            return (
              <button
                key={champion.id}
                disabled={isUnavailable}
                onMouseEnter={() => setHoveredChampionId(champion.id)}
                onMouseLeave={() => setHoveredChampionId(null)}
                onClick={() => autoPickChampion(champion.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-1 transition-none rounded-none",
                  isUnavailable ? "opacity-10 grayscale cursor-not-allowed" : "hover:bg-gray-900"
                )}
              >
                <div className={cn(
                  "relative aspect-square w-full rounded-none border overflow-hidden transition-none",
                  isUnavailable ? "border-gray-900" : (banModeActive ? "border-gray-100/40" : "border-gray-800 group-hover:border-gray-600")
                )}>
                  <img
                    src={champion.iconUrl}
                    alt=""
                    className="w-full h-full object-cover grayscale"
                    loading="lazy"
                  />
                  
                  {/* Score Overlay (Bottom) */}
                  {!isUnavailable && score !== undefined && (
                    <div className="absolute inset-x-0 bottom-0 py-0.5 bg-gray-900/90 text-center border-t border-gray-800">
                      <span className={cn("text-xs font-bold leading-none", finalScore >= 80 ? "text-gray-100" : "text-gray-400")}>
                        {Math.round(finalScore)}
                      </span>
                    </div>
                  )}

                  {/* Tier Overlay (Top) */}
                  <div className="absolute top-0 left-0 px-1 bg-gray-900 border-r border-b border-gray-800">
                    <span className="text-[10px] font-bold text-gray-400">{champion.tier}</span>
                  </div>
                </div>

                {/* Champion Label */}
                <div className="w-full truncate px-1 text-center">
                  <span className="text-sm font-medium text-gray-500 group-hover:text-gray-200 uppercase transition-none truncate">
                    {champion.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Context Intel Overlay */}
      {hoveredChampionData && (
        <div className="absolute bottom-4 right-4 w-[260px] z-[100] pointer-events-none rounded-none border border-gray-800">
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
