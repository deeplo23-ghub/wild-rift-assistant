"use client";

import React, { useMemo } from "react";
import { useDraftStore, SortMetric } from "@/store/draftStore";
import { Role, Champion, CounterMatrix, Tier } from "@/types/champion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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
import { cn, getRoleIcon } from "@/lib/utils";
import { SYNERGY_RULES } from "@/lib/data/tags";
import { ChampionIcon } from "./ChampionIcon";

interface ChampionPoolProps {
  champions: Champion[];
}

const TIER_COLORS: Record<string, string> = {
  "S+": "text-yellow-400 border-yellow-400/50 bg-yellow-400/10",
  "S": "text-orange-400 border-orange-400/50 bg-orange-400/10",
  "A": "text-emerald-400 border-emerald-400/50 bg-emerald-400/10",
  "B": "text-blue-400 border-blue-400/50 bg-blue-400/10",
  "C": "text-zinc-400 border-zinc-400/50 bg-zinc-400/10",
  "D": "text-zinc-500 border-zinc-500/50 bg-zinc-500/10",
};

const SCORE_COLORS = (score: number) => {
  if (score >= 85) return "text-cyan-400";
  if (score >= 70) return "text-sky-400";
  return "text-indigo-300";
};

const TIER_WEIGHTS: Record<string, number> = {
  "S+": 6, "S": 5, "A": 4, "B": 3, "C": 2, "D": 1
};

export function ChampionPool({ champions }: ChampionPoolProps) {
  const { 
    activeRoleFilter, 
    activeTierFilter,
    activeSearch, 
    sortBy, 
    setRoleFilter, 
    setTierFilter,
    setSearch, 
    setSortBy,
    setHoveredChampion,
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
        const matchesTier = activeTierFilter === "all" || c.tier === activeTierFilter;
        return matchesSearch && matchesRole && matchesTier;
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
  }, [champions, activeSearch, activeRoleFilter, activeTierFilter, sortBy, scoredMap]);

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
                placeholder="Search Candidates..."
                value={activeSearch}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-black/40 border-white/10 text-sm focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500">Sort By</span>
            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 relative">
              {(["score", "winrate", "pickrate", "banrate", "tier"] as SortMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSortBy(m)}
                  className={cn(
                    "relative px-4 py-1.5 rounded-md text-[11px] font-bold capitalize transition-colors z-0",
                    sortBy === m ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {sortBy === m && (
                    <motion.div
                      layoutId="sort-indicator"
                      className="absolute inset-0 bg-white/10 rounded-md -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Rows */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-500 min-w-max">Role Filter</span>
              <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 flex-wrap">
                {(["all", Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={cn(
                      "relative px-4 py-1.5 rounded-md text-[11px] font-bold capitalize transition-colors flex items-center gap-2 z-0",
                      activeRoleFilter === r ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {activeRoleFilter === r && (
                      <motion.div
                        layoutId="role-indicator"
                        className="absolute inset-0 bg-blue-500/20 rounded-md -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {r !== "all" && (
                      <img src={getRoleIcon(r)} alt={r} className="w-3.5 h-3.5 object-contain brightness-200" />
                    )}
                    <span className="capitalize">{r === "all" ? "All Roles" : r}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-500 min-w-max">Tier Filter</span>
              <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                {(["all", "S+", "S", "A", "B", "C", "D"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTierFilter(t)}
                    className={cn(
                      "relative px-4 py-1.5 rounded-md text-[11px] font-bold uppercase transition-colors z-0",
                      activeTierFilter === t ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {activeTierFilter === t && (
                      <motion.div
                        layoutId="tier-indicator"
                        className="absolute inset-0 bg-white/10 rounded-md -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={t !== "all" ? TIER_COLORS[t]?.split(" ")[0] : ""}>
                      {t === "all" ? "All" : t}
                    </span>
                  </button>
                ))}
              </div>
            </div>
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
            const finalScore = score ? Math.round(score.finalScore) : 0;
            
            return (
              <Card 
                key={champion.id}
                onClick={() => !isUnavailable && autoAction(champion.id)}
                className={cn(
                  "relative border transition-all cursor-pointer group overflow-hidden bg-zinc-900 shadow-xl",
                  isUnavailable ? "opacity-40 grayscale pointer-events-none" : "hover:border-blue-500/50 hover:shadow-blue-500/10",
                  idx === 0 ? "border-cyan-500/30 scale-[1.02] z-10" : "border-white/5"
                )}
              >
                <CardContent className="p-5 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex gap-4 items-start">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-inner">
                      <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full" />
                      <div className={cn(
                        "absolute inset-x-0 bottom-0 py-1 text-center text-[11px] font-bold shadow-t",
                        TIER_COLORS[champion.tier] || "bg-zinc-800 text-zinc-400"
                      )}>
                        {champion.tier}
                      </div>
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 min-w-0">
                           <h3 className="text-lg font-bold truncate text-white tracking-tight">{champion.name}</h3>
                           {activeRoleFilter !== "all" && (
                             <img src={getRoleIcon(activeRoleFilter)} className="w-4 h-4 object-contain brightness-200 opacity-60 shrink-0" alt={activeRoleFilter} />
                           )}
                        </div>
                        <div className="flex flex-col items-end">
                           <span className={cn("text-3xl font-bold leading-none tracking-tighter", SCORE_COLORS(finalScore))}>
                             {finalScore}
                           </span>
                           <span className="text-[10px] font-bold text-zinc-500">Power Score</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-auto">
                        <div className="flex flex-col bg-black/20 rounded p-1.5 border border-white/5">
                          <span className="text-[10px] text-zinc-500 font-medium">Win Rate</span>
                          <span className="text-sm font-bold text-emerald-400">{Math.round(champion.winrate)}%</span>
                        </div>
                        <div className="flex flex-col bg-black/20 rounded p-1.5 border border-white/5">
                          <span className="text-[10px] text-zinc-500 font-medium">Pick Rate</span>
                          <span className="text-sm font-bold text-zinc-300">{Math.round(champion.pickRate)}%</span>
                        </div>
                        <div className="flex flex-col bg-black/20 rounded p-1.5 border border-white/5 items-end">
                          <span className="text-[10px] text-zinc-500 font-medium">Ban Rate</span>
                          <span className="text-sm font-bold text-red-400">{Math.round(champion.banRate)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Counters/Synergies */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <span className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 border-b border-white/5 pb-1">
                        <Target className="w-3 h-3 text-orange-400" /> Counters
                      </span>
                      <div className="flex gap-2">
                        {counters.map(c => {
                          const target = champions.find(hc => hc.id === c.id);
                          return (
                            <div key={c.id} title={target?.name} className="w-7 h-7 rounded border border-white/10 overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-help">
                               <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 border-b border-white/5 pb-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Synergizes
                      </span>
                      <div className="flex gap-2">
                        {synergies.map(s => {
                          const target = champions.find(hc => hc.id === s.id);
                          return (
                            <div key={s.id} title={target?.name} className="w-7 h-7 rounded border border-white/10 overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-help">
                               <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full" />
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
      <ScrollArea className="flex-1 bg-black/20 rounded-xl border border-white/5 p-5 shadow-inner">
        <div className="grid grid-cols-[repeat(auto-fill,72px)] gap-[10px] justify-center items-start">
          {others.map((champion) => {
            const score = scoredMap.get(champion.id);
            const isUnavailable = unavailableIds.has(champion.id);
            const tierColor = TIER_COLORS[champion.tier]?.split(" ")[0] || "text-zinc-500";
            const finalScore = score ? Math.round(score.finalScore) : 0;
            
            return (
              <button
                key={champion.id}
                disabled={isUnavailable}
                onMouseEnter={() => setHoveredChampion(champion.id)}
                onMouseLeave={() => setHoveredChampion(null)}
                onClick={() => autoAction(champion.id)}
                className={cn(
                  "relative w-[72px] h-[72px] transition-all active:scale-95 group rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                  isUnavailable ? "opacity-10 grayscale cursor-not-allowed" : "hover:scale-105 shadow-md hover:shadow-lg"
                )}
              >
                <div className={cn(
                  "w-full h-full border-2 rounded-lg overflow-hidden transition-all",
                  isUnavailable ? "border-transparent" : "border-white/10 group-hover:border-blue-500/50"
                )}>
                  <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full" />
                </div>
                
                {/* Micro Score Overlay */}
                {!isUnavailable && score && (
                  <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-black/90 rounded-bl-md rounded-tr-sm border-l border-b border-white/10 shadow-sm">
                    <span className={cn("text-[10px] font-bold block leading-none pt-0.5", SCORE_COLORS(finalScore))}>
                      {finalScore}
                    </span>
                  </div>
                )}

                {/* Rank indicator */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-0.5 rounded-b-md border-t border-white/5 pointer-events-none">
                   <span className={cn("text-[10px] font-bold block text-center leading-none", tierColor)}>
                     {champion.tier}
                   </span>
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 p-3 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap min-w-[140px]">
                  <p className="text-sm font-bold text-white mb-1 tracking-tight">{champion.name}</p>
                  <p className="text-[11px] text-zinc-400 font-medium">Power Score: <span className={SCORE_COLORS(finalScore)}>{finalScore || 'N/A'}</span></p>
                  <div className="mt-2 text-[10px] flex gap-2">
                     <span className="text-emerald-400 font-medium">WR: {Math.round(champion.winrate)}%</span>
                     <span className="text-zinc-500">|</span>
                     <span className={tierColor}>Tier: {champion.tier}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
