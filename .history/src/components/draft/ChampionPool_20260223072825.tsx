"use client";

import React, { useMemo } from "react";
import { useDraftStore, SortMetric } from "@/store/draftStore";
import { Role, Champion, CounterMatrix, Tier } from "@/types/champion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Ban, 
  TrendingUp, 
  Activity, 
  Target, 
  Sparkles,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SYNERGY_RULES } from "@/lib/data/tags";

interface ChampionPoolProps {
  champions: Champion[];
}

const TIER_COLORS: Record<string, string> = {
  "S+": "text-yellow-400 border-yellow-400/50 bg-yellow-400/10",
  "S": "text-orange-400 border-orange-400/50 bg-orange-400/10",
  "A": "text-green-400 border-green-400/50 bg-green-400/10",
  "B": "text-blue-400 border-blue-400/50 bg-blue-400/10",
  "C": "text-zinc-400 border-zinc-400/50 bg-zinc-400/10",
  "D": "text-zinc-500 border-zinc-500/50 bg-zinc-500/10",
};

const TIER_WEIGHTS: Record<string, number> = {
  "S+": 6, "S": 5, "A": 4, "B": 3, "C": 2, "D": 1
};

export function ChampionPool({ champions }: ChampionPoolProps) {
  const { 
    activeRoleFilter, 
    activeSearch, 
    sortBy, 
    setRoleFilter, 
    setSearch, 
    setSortBy,
    scoredChampions,
    counterMatrix,
    autoAction,
    bans,
    ally,
    enemy,
    isBanMode,
    toggleBanMode,
    focusedSide
  } = useDraftStore();

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

  const sortedChampions = useMemo(() => {
    return champions
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(activeSearch.toLowerCase());
        const matchesRole = activeRoleFilter === "all" || c.roles.includes(activeRoleFilter as Role);
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          const scoreA = scoredMap.get(a.id)?.finalScore ?? 0;
          const scoreB = scoredMap.get(b.id)?.finalScore ?? 0;
          return scoreB - scoreA;
        }
        if (sortBy === "winrate") return b.winrate - a.winrate;
        if (sortBy === "pickrate") return b.pickRate - a.pickRate;
        if (sortBy === "banrate") return b.banRate - a.banRate;
        if (sortBy === "tier") return TIER_WEIGHTS[b.tier] - TIER_WEIGHTS[a.tier];
        return 0;
      });
  }, [champions, activeSearch, activeRoleFilter, sortBy, scoredMap]);

  const top3 = sortedChampions.slice(0, 3);
  const others = sortedChampions.slice(3);

  // Helper to find top counters for top 3
  const getTopCounters = (championId: string) => {
    if (!counterMatrix) return [];
    const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(championId) : null;
    if (!matrix) return [];
    
    return Array.from(matrix.entries())
      .map(([id, val]: any) => ({ id, val }))
      .filter((e: any) => e.val > 2)
      .sort((a: any, b: any) => b.val - a.val)
      .slice(0, 4);
  };

  // Helper to find top synergies for top 3
  const getTopSynergies = (champion: Champion) => {
    const results = champions
      .filter(c => c.id !== champion.id)
      .map(c => {
        let score = 0;
        for (const t1 of champion.tags) {
          for (const t2 of c.tags) {
            const rule = SYNERGY_RULES.find(r => (r.tagA === t1 && r.tagB === t2) || (r.tagA === t2 && r.tagB === t1));
            if (rule) score += rule.score;
          }
        }
        return { id: c.id, score };
      })
      .filter(r => r.score > 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    return results;
  };

  return (
    <div className="flex flex-col h-full gap-4 text-white font-sans selection:bg-blue-500/30">
      {/* Search & Filters */}
      <div className="flex flex-col gap-4 bg-zinc-900/50 p-4 border border-white/5 rounded-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search candidates..."
                value={activeSearch}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-black/40 border-white/10 text-sm focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            
            <button 
              onClick={() => toggleBanMode()}
              className={cn(
                "h-10 px-4 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all",
                isBanMode 
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              <Ban className="w-3.5 h-3.5" />
              {isBanMode ? "Ban Mode ON" : "Ban Mode OFF"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-zinc-500">Sort By</span>
            <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/5">
              {(["score", "winrate", "pickrate", "banrate", "tier"] as SortMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSortBy(m)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all",
                    sortBy === m 
                      ? "bg-zinc-700 text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Role Filters */}
        <div className="flex gap-2">
          {(["all", Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all",
                activeRoleFilter === r 
                  ? "bg-blue-600/20 border-blue-500 text-blue-400" 
                  : "bg-black/20 border-white/5 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Recommendations */}
      {top3.length > 0 && !activeSearch && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {top3.map((champion, idx) => {
            const score = scoredMap.get(champion.id);
            const isUnavailable = unavailableIds.has(champion.id);
            const counters = getTopCounters(champion.id);
            const synergies = getTopSynergies(champion);
            
            return (
              <Card 
                key={champion.id}
                onClick={() => !isUnavailable && autoAction(champion.id)}
                className={cn(
                  "relative border transition-all cursor-pointer group overflow-hidden bg-zinc-900 shadow-xl",
                  isUnavailable ? "opacity-40 grayscale pointer-events-none" : "hover:border-blue-500/50 hover:shadow-blue-500/10",
                  idx === 0 ? "border-yellow-500/30 scale-[1.02] z-10" : "border-white/5"
                )}
              >
                <CardContent className="p-4 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex gap-4 items-start">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <img src={champion.iconUrl} alt={champion.name} className="w-full h-full object-cover" />
                      <div className={cn(
                        "absolute inset-x-0 bottom-0 py-0.5 text-center text-[10px] font-black",
                        TIER_COLORS[champion.tier] || "bg-zinc-800 text-zinc-400"
                      )}>
                        {champion.tier}
                      </div>
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold truncate text-white uppercase tracking-tighter">{champion.name}</h3>
                        <div className="flex flex-col items-end">
                           <span className={cn(
                             "text-2xl font-black leading-none",
                             score?.finalScore > 85 ? "text-yellow-400" : score?.finalScore > 75 ? "text-orange-400" : "text-blue-400"
                           )}>
                             {score ? Math.round(score.finalScore) : 0}
                           </span>
                           <span className="text-[8px] font-black text-zinc-500 tracking-widest">DR POWER</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-zinc-500 font-bold uppercase">Win</span>
                          <span className="text-xs font-black">{Math.round(champion.winrate)}%</span>
                        </div>
                        <div className="flex flex-col text-center border-x border-white/5">
                          <span className="text-[8px] text-zinc-500 font-bold uppercase">Pick</span>
                          <span className="text-xs font-black">{Math.round(champion.pickRate)}%</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] text-zinc-500 font-bold uppercase">Ban</span>
                          <span className="text-xs font-black">{Math.round(champion.banRate)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Counters/Synergies */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="flex items-center gap-1 text-[8px] font-black uppercase text-zinc-500">
                        <Target className="w-2 h-2" /> Best Against
                      </span>
                      <div className="flex gap-1.5">
                        {counters.map(c => {
                          const target = champions.find(hc => hc.id === c.id);
                          return (
                            <div key={c.id} title={target?.name} className="w-6 h-6 rounded border border-white/5 overflow-hidden">
                               <img src={target?.iconUrl} className="w-full h-full object-cover grayscale" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="flex items-center gap-1 text-[8px] font-black uppercase text-zinc-500">
                        <Sparkles className="w-2 h-2" /> Synergizes
                      </span>
                      <div className="flex gap-1.5">
                        {synergies.map(s => {
                          const target = champions.find(hc => hc.id === s.id);
                          return (
                            <div key={s.id} title={target?.name} className="w-6 h-6 rounded border border-white/5 overflow-hidden">
                               <img src={target?.iconUrl} className="w-full h-full object-cover grayscale" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Grid */}
      <ScrollArea className="flex-1 bg-black/20 rounded-xl border border-white/5 p-4">
        <div className="grid grid-cols-[repeat(auto-fill,64px)] gap-[5px] justify-center items-start">
          {others.map((champion) => {
            const score = scoredMap.get(champion.id);
            const isUnavailable = unavailableIds.has(champion.id);
            const tierColor = TIER_COLORS[champion.tier]?.split(" ")[0] || "text-zinc-500";
            
            return (
              <button
                key={champion.id}
                disabled={isUnavailable}
                onClick={() => autoAction(champion.id)}
                className={cn(
                  "relative w-16 h-16 transition-all active:scale-95 group",
                  isUnavailable ? "opacity-10 grayscale cursor-not-allowed" : "hover:scale-105"
                )}
              >
                <div className={cn(
                  "w-full h-full border-2 rounded-md overflow-hidden transition-all",
                  isUnavailable ? "border-transparent" : "border-white/10 group-hover:border-blue-500/50"
                )}>
                  <img src={champion.iconUrl} alt={champion.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Micro Score Overlay */}
                {!isUnavailable && score && (
                  <div className="absolute top-0 right-0 px-1 bg-black/80 rounded-bl backdrop-blur-sm border-l border-b border-white/5">
                    <span className={cn("text-[9px] font-black", tierColor)}>
                      {Math.round(score.finalScore)}
                    </span>
                  </div>
                )}

                {/* Rank indicator */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 pointer-events-none">
                   <span className={cn("text-[8px] font-black block text-center", tierColor)}>
                     {champion.tier}
                   </span>
                </div>
                
                {/* Tooltip on hover simulation */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-zinc-900 border border-white/10 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap min-w-[120px]">
                  <p className="text-xs font-bold text-white mb-1">{champion.name}</p>
                  <p className="text-[9px] text-zinc-500 uppercase font-black">Score: {score ? Math.round(score.finalScore) : 'N/A'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
