"use client";

import React, { useState, useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, Filter } from "lucide-react";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { gsap } from "gsap";

interface ChampionPoolProps {
  champions: Champion[];
}

export const ChampionPool: React.FC<ChampionPoolProps> = ({ champions }) => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  
  const autoPickChampion = useDraftStore((state) => state.autoPickChampion);
  const phase = useDraftStore((state) => state.phase);
  const scoredChampions = useDraftStore((state) => state.scoredChampions);
  const bans = useDraftStore((state) => state.bans);
  const ally = useDraftStore((state) => state.ally);
  const enemy = useDraftStore((state) => state.enemy);

  const [hoveredChampionId, setHoveredChampionId] = useState<string | null>(null);

  React.useEffect(() => {
    gsap.fromTo(
      ".champion-card",
      { opacity: 0, scale: 0.8, y: 20 },
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        duration: 0.4, 
        stagger: 0.02, 
        ease: "back.out(1.7)",
        clearProps: "all"
      }
    );
  }, [roleFilter, search]);

  const scoredMap = useMemo(() => {
    const map = new Map<string, any>();
    scoredChampions.forEach(s => map.set(s.championId, s));
    return map;
  }, [scoredChampions]);

  const unavailableIds = useMemo(() => {
    const ids = new Set<string>([...bans.ally, ...bans.enemy]);
    Object.values(ally).forEach(s => s.championId && ids.add(s.championId));
    Object.values(enemy).forEach(s => s.championId && ids.add(s.championId));
    return ids;
  }, [bans, ally, enemy]);

  const filteredChampions = useMemo(() => {
    return champions
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || c.roles.includes(roleFilter);
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const scoreA = scoredMap.get(a.id)?.finalScore ?? 0;
        const scoreB = scoredMap.get(b.id)?.finalScore ?? 0;
        return scoreB - scoreA;
      });
  }, [champions, search, roleFilter, scoredMap]);

  const hoveredChampionData = useMemo(() => {
    if (!hoveredChampionId) return null;
    const champion = champions.find(c => c.id === hoveredChampionId);
    const score = scoredMap.get(hoveredChampionId);
    if (!champion || !score) return null;
    return { champion, score };
  }, [hoveredChampionId, champions, scoredMap]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search & Tabs Header */}
      <div className="flex flex-col gap-4 p-6 pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 transition-colors group-focus-within:text-blue-500" />
            <Input
              placeholder="Search champions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 bg-white/[0.03] border-white/[0.05] focus-visible:ring-blue-500/30 text-xs font-medium placeholder:text-zinc-600"
            />
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-lg border border-white/[0.05]">
              {(["all", ...Object.values(Role)] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                    roleFilter === r
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  {r === "all" ? "All" : r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="champion-grid grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 py-4">
          {filteredChampions.map((champion) => {
            const score = scoredMap.get(champion.id);
            const isUnavailable = unavailableIds.has(champion.id);

            return (
              <button
                key={champion.id}
                disabled={isUnavailable}
                onMouseEnter={() => setHoveredChampionId(champion.id)}
                onMouseLeave={() => setHoveredChampionId(null)}
                onClick={() => autoPickChampion(champion.id)}
                className={cn(
                  "champion-card group relative flex flex-col items-center gap-2 p-1.5 rounded-xl transition-all duration-300",
                  isUnavailable ? "opacity-10 grayscale pointer-events-none" : "hover:bg-white/[0.05]"
                )}
              >
                <div className="relative aspect-square w-full rounded-xl border border-white/[0.05] overflow-hidden transition-all group-hover:border-blue-500/50 group-hover:scale-105 group-active:scale-95">
                  <img
                    src={champion.iconUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700"
                    onError={(e) => (e.currentTarget.src = "https://wr-meta.com/uploads/posts/2023-01/1675024764_1656622041_aatrox_10-min.jpg")}
                  />
                  
                  {/* Tier Indicator */}
                  <div className="absolute top-1 left-1 h-4 w-4 rounded-md bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/5">
                    <span className="text-[8px] font-black text-white">{champion.tier}</span>
                  </div>
                  
                  {/* Score Tag */}
                  {!isUnavailable && score !== undefined && (
                    <div className="absolute inset-x-0 bottom-0 p-1">
                      <div className="px-1.5 py-0.5 bg-blue-600/90 rounded-md flex items-center justify-center gap-1 text-[9px] font-black text-white shadow-lg backdrop-blur-md">
                        {Math.round(score.finalScore)}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-zinc-500 truncate w-full group-hover:text-white transition-colors text-center px-1">
                  {champion.name}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Floating Score Breakdown */}
      {hoveredChampionData && (
        <div className="absolute bottom-6 right-6 w-80 h-96 z-50 pointer-events-none">
          <div className="pointer-events-auto h-full">
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
