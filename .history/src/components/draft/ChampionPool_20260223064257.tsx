"use client";

import React, { useState, useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ChevronDown, Filter } from "lucide-react";
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
    // Duplicates are allowed in blind ban, but regular picks are unique
    Object.values(ally).forEach(s => s.championId && ids.add(s.championId));
    Object.values(enemy).forEach(s => s.championId && ids.add(s.championId));
    // During Ban Mode, we don't grayscale bans because duplicates are allowed
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
        // Use focusedRole from store if it exists, otherwise show all
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
    <div className="flex flex-col h-full bg-zinc-950 border-x border-zinc-900 overflow-hidden relative">
      {/* Control Header */}
      <div className="flex flex-col gap-2 p-3 bg-zinc-900/20 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <Input
              placeholder="Filter champions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 bg-zinc-950 border-zinc-800 text-[11px] focus-visible:ring-blue-500/30"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[110px] h-8 bg-zinc-950 border-zinc-800 text-[10px] font-black uppercase tracking-tighter">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="score" className="text-[10px] font-bold">Sort: Score</SelectItem>
              <SelectItem value="winrate" className="text-[10px] font-bold">Sort: Winrate</SelectItem>
              <SelectItem value="synergy" className="text-[10px] font-bold">Sort: Synergy</SelectItem>
              <SelectItem value="counter" className="text-[10px] font-bold">Sort: Counter</SelectItem>
              <SelectItem value="name" className="text-[10px] font-bold">Sort: Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Current Filter Indicator */}
        <div className="flex items-center gap-2 px-1">
          <Filter className="w-3 h-3 text-zinc-500" />
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
            {banModeActive ? `Banning for ${useDraftStore.getState().focusedSide}` : `Filtering: ${focusedRole || "All Roles"}`}
          </span>
          {(focusedRole || banModeActive) && (
            <div className={cn("h-1 flex-1 rounded-full", banModeActive ? "bg-red-500/40" : "bg-blue-500/20")} />
          )}
        </div>
      </div>

      {/* Grid Container */}
      <ScrollArea className="flex-1 px-2 custom-scrollbar">
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-1.5 py-3">
          {filteredChampions.map((champion) => {
            const score = scoredMap.get(champion.id);
            const isUnavailable = unavailableIds.has(champion.id);
            const finalScore = score?.finalScore ?? 0;

            const tierColor = {
              "S": "border-amber-500/50 bg-amber-500/5 shadow-[inset_0_1px_10px_-4px_rgba(245,158,11,0.2)]",
              "A": "border-blue-500/50 bg-blue-500/5 shadow-[inset_0_1px_10px_-4px_rgba(59,130,246,0.2)]",
              "B": "border-emerald-500/50 bg-emerald-500/5 shadow-[inset_0_1px_10px_-4px_rgba(16,185,129,0.2)]",
              "C": "border-zinc-700 bg-zinc-900/50",
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
                  "group relative flex flex-col p-1 rounded transition-all duration-200",
                  isUnavailable ? "opacity-10 grayscale cursor-not-allowed" : "hover:bg-zinc-900/80 active:scale-95"
                )}
              >
                {/* Compact Card Content */}
                <div className={cn(
                  "relative aspect-square w-full rounded border overflow-hidden transition-all",
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
                    <div className="absolute right-0.5 bottom-0.5 px-1 py-0 rounded-sm bg-black/80 backdrop-blur-sm border border-white/5">
                      <span className={cn("text-[9px] font-black tracking-tighter", scoreColor)}>
                        {Math.round(finalScore)}
                      </span>
                    </div>
                  )}

                  {/* Tier Indicator (Top Left) */}
                  <div className="absolute top-0.5 left-0.5 px-0.5 rounded-[1px] bg-black/60 border border-white/5">
                    <span className="text-[7px] font-black text-white/80">{champion.tier}</span>
                  </div>
                </div>

                {/* Name & Roles */}
                <div className="flex flex-col items-center gap-0 w-full min-w-0 mt-0.5">
                  <span className="text-[8px] font-bold text-zinc-500 truncate w-full text-center group-hover:text-zinc-200 uppercase transition-colors leading-tight">
                    {champion.name}
                  </span>
                  <div className="flex gap-0.5 justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                    {champion.roles.map(r => (
                      <span key={r} className="text-[5px] font-black text-zinc-600 group-hover:text-zinc-400 uppercase">
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
      
      {/* Absolute Positioning for Score Breakdown to avoid layout shifts */}
      {hoveredChampionData && (
        <div className="absolute bottom-4 right-4 w-[280px] z-[100] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
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
