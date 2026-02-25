"use client";

import React, { useState, useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, Filter } from "lucide-react";

interface ChampionPoolProps {
  champions: Champion[];
}

export const ChampionPool: React.FC<ChampionPoolProps> = ({ champions }) => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  
  const pickChampion = useDraftStore((state) => state.pickChampion);
  const phase = useDraftStore((state) => state.phase);
  const scoredChampions = useDraftStore((state) => state.scoredChampions);
  const bans = useDraftStore((state) => state.bans);
  const ally = useDraftStore((state) => state.ally);
  const enemy = useDraftStore((state) => state.enemy);

  const side = phase.toLowerCase().includes("ally") ? "ally" : "enemy";

  const scoredMap = useMemo(() => {
    const map = new Map<string, number>();
    scoredChampions.forEach(s => map.set(s.championId, s.finalScore));
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
        const scoreA = scoredMap.get(a.id) ?? 0;
        const scoreB = scoredMap.get(b.id) ?? 0;
        // If one is unavailable, it should still be at the bottom but we sort mainly by score
        return scoreB - scoreA;
      });
  }, [champions, search, roleFilter, scoredMap]);

  return (
    <Card className="flex flex-col border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search champions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-zinc-800/50 border-white/10 focus-visible:ring-blue-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 px-1 py-1 bg-zinc-800/50 rounded-lg border border-white/5">
            {(["all", ...Object.values(Role)] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                  roleFilter === r
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ScrollArea className="h-[600px] px-6 pb-6">
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filteredChampions.map((champion) => {
            const score = scoredMap.get(champion.id);
            const isUnavailable = unavailableIds.has(champion.id);

            return (
              <button
                key={champion.id}
                disabled={isUnavailable}
                onClick={() => pickChampion(side as any, Role.Baron, champion.id)} // TODO: Smart role detection
                className={`group relative flex flex-col items-center gap-2 p-1.5 rounded-xl transition-all duration-300 active:scale-95 ${
                  isUnavailable ? "opacity-20 grayscale cursor-not-allowed" : "hover:bg-white/5"
                }`}
              >
                <div className="relative aspect-square w-full rounded-xl border border-white/10 overflow-hidden group-hover:border-blue-500/50 transition-colors">
                  <img
                    src={champion.iconUrl}
                    alt={champion.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => (e.currentTarget.src = "/placeholder-champion.png")}
                  />
                  
                  {/* Tier Badge Overlay */}
                  <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/60 backdrop-blur-sm flex justify-center">
                    <span className="text-[9px] font-black text-white">{champion.tier}</span>
                  </div>
                  
                  {/* Score Tag */}
                  {!isUnavailable && score !== undefined && (
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-blue-600/90 rounded-md flex items-center gap-0.5 text-[10px] font-black text-white shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="w-2.5 h-2.5" />
                      {Math.round(score)}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 truncate w-full group-hover:text-white transition-colors">
                  {champion.name}
                </span>
              </button>
            );
          })}
        </div>
        {filteredChampions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[200px] text-slate-500">
            <Filter className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">No champions match your criteria</p>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
