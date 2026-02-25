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
  if (score >= 95) return "text-purple-400";
  if (score >= 90) return "text-pink-400";
  if (score >= 85) return "text-rose-400";
  if (score >= 80) return "text-cyan-400";
  if (score >= 75) return "text-sky-400";
  if (score >= 70) return "text-blue-400";
  if (score >= 65) return "text-indigo-400";
  if (score >= 60) return "text-emerald-400";
  if (score >= 55) return "text-teal-400";
  if (score >= 50) return "text-lime-400";
  if (score >= 45) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  if (score >= 35) return "text-amber-400";
  return "text-zinc-500";
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
      .sort((a: any, b: any) => {
        const aDrafted = (Object.values(ally).some(s => s.championId === a.id) || Object.values(enemy).some(s => s.championId === a.id)) ? 1 : 0;
        const bDrafted = (Object.values(ally).some(s => s.championId === b.id) || Object.values(enemy).some(s => s.championId === b.id)) ? 1 : 0;
        if (aDrafted !== bDrafted) return bDrafted - aDrafted;
        return b.val - a.val;
      })
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
      .sort((a, b) => {
        const aDrafted = (Object.values(ally).some(s => s.championId === a.id) || Object.values(enemy).some(s => s.championId === a.id)) ? 1 : 0;
        const bDrafted = (Object.values(ally).some(s => s.championId === b.id) || Object.values(enemy).some(s => s.championId === b.id)) ? 1 : 0;
        if (aDrafted !== bDrafted) return bDrafted - aDrafted;
        return b.score - a.score;
      })
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
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
              <Input
                placeholder="Search..."
                value={activeSearch}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-6 bg-black/40 border-white/10 text-[10px] focus:ring-1 focus:ring-blue-500/50"
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
                    title={r === "all" ? "All Roles" : r}
                    className={cn(
                      "relative px-4 py-1.5 rounded-md text-[11px] font-bold capitalize transition-colors flex items-center justify-center min-w-[36px] z-0",
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
                    {r !== "all" ? (
                      <img src={getRoleIcon(r)} alt={r} className="w-4 h-4 object-contain brightness-200" />
                    ) : (
                      <span>All</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-500 min-w-max">Tier Filter</span>
              <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                {(["all", "S+", "S", "A", "B", "C", "D"] as const).map((t) => {
                  const hasTier = t === "all" || champions.some(c => c.tier === t);
                  return (
                    <button
                      key={t}
                      disabled={!hasTier}
                      onClick={() => setTierFilter(t)}
                      className={cn(
                        "relative px-4 py-1.5 rounded-md text-[11px] font-bold uppercase transition-colors z-0",
                        !hasTier ? "opacity-30 cursor-not-allowed" : activeTierFilter === t ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {activeTierFilter === t && (
                        <motion.div
                          layoutId="tier-indicator"
                          className="absolute inset-0 bg-white/10 rounded-md -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className={t !== "all" && hasTier ? TIER_COLORS[t]?.split(" ")[0] : ""}>
                        {t === "all" ? "All" : t}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
        </div>
      </div>

      {/* Top 3 Recommendations */}
      {top3.length > 0 && !activeSearch && !isBanMode && (
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
                <CardContent className="p-[5px] flex flex-col gap-1">
                  {/* Header & Score Details */}
                  <div className="flex gap-[5px] items-start">
                    <div className="relative w-[76px] h-[76px] rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-inner group-hover:border-blue-500/50 transition-colors">
                      <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full" />
                      
                      {/* Top Left Tier Badge (Micro) */}
                      <div className={cn(
                        "absolute top-0 left-0 px-1 py-[1px] rounded-br-[4px] border-r border-b border-white/10 shadow-sm transition-colors",
                         "bg-black/90", TIER_COLORS[champion.tier] || "text-zinc-400"
                      )}>
                        <span className="text-[9px] font-extrabold block leading-none">{champion.tier}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0 pr-1">
                      <div className="flex justify-between items-center mb-0.5 border-b border-white/5 pb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                           <h3 className="text-sm font-bold truncate text-white tracking-tight leading-none">{champion.name}</h3>
                           {activeRoleFilter !== "all" && (
                             <img src={getRoleIcon(activeRoleFilter)} className="w-[10px] h-[10px] object-contain brightness-200 opacity-60 shrink-0" alt={activeRoleFilter} />
                           )}
                        </div>
                        <span className={cn("text-base font-extrabold leading-none tracking-tighter", SCORE_COLORS(finalScore))}>
                          {finalScore}
                        </span>
                      </div>
                      
                      {score && (
                        <div className="flex flex-col gap-[3px] text-[9px] mt-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest leading-none">Base Pwr</span>
                            <span className="font-bold text-zinc-300 leading-none">{Math.round(score.breakdown.base)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest leading-none">Synergy</span>
                            <span className="font-bold text-emerald-400 leading-none">+{Math.round(score.breakdown.synergy)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest leading-none">Balance</span>
                            <span className="font-bold text-blue-400 leading-none">+{Math.round(score.breakdown.composition)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WR PR BR Row */}
                  <div className="grid grid-cols-3 gap-1 bg-black/20 rounded border border-white/5 py-1 px-0.5 mt-[2px]">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-[3px]">Win Rate</span>
                      <span className="text-[10px] font-bold text-emerald-400 leading-none">{champion.winrate.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-x border-white/5">
                      <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-[3px]">Pick Rate</span>
                      <span className="text-[10px] font-bold text-zinc-300 leading-none">{champion.pickRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-[3px]">Ban Rate</span>
                      <span className="text-[10px] font-bold text-red-400 leading-none">{champion.banRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Counters / Synergies */}
                  <div className="grid grid-cols-2 gap-2 mt-[2px] px-1 pb-0.5">
                    <div className="flex flex-col">
                       <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mb-1 leading-none">
                        Counters
                      </span>
                      <div className="flex gap-[3px]">
                        {counters.slice(0, 3).map(c => {
                          const target = champions.find(hc => hc.id === c.id);
                          const isDrafted = Object.values(ally).some(s => s.championId === c.id) || Object.values(enemy).some(s => s.championId === c.id);
                          return (
                            <div key={c.id} title={target?.name} className={cn(
                              "w-[22px] h-[22px] rounded border overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-help",
                              isDrafted ? "border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "border-white/10"
                            )}>
                               <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mb-1 leading-none">
                        Synergizes
                      </span>
                      <div className="flex gap-[3px] justify-end">
                        {synergies.slice(0, 3).map(s => {
                          const target = champions.find(hc => hc.id === s.id);
                          const isDrafted = Object.values(ally).some(s => s.championId === s.id) || Object.values(enemy).some(s => s.championId === s.id);
                          return (
                            <div key={s.id} title={target?.name} className={cn(
                              "w-[22px] h-[22px] rounded border overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-help",
                              isDrafted ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "border-white/10"
                            )}>
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
                
                {/* Micro Tier Overlay */}
                <div className={cn(
                  "absolute top-0 left-0 px-1.5 py-0.5 bg-black/90 rounded-br-md rounded-tl-sm border-r border-b border-white/10 shadow-sm z-10",
                  tierColor
                )}>
                  <span className="text-[9px] font-extrabold block leading-none pt-0.5">{champion.tier}</span>
                </div>

                {/* Micro Score Overlay */}
                {!isUnavailable && score && (
                  <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/90 rounded-tl-md rounded-br-sm border-l border-t border-white/10 shadow-sm z-10">
                    <span className={cn("text-[9px] font-bold block leading-none pb-0.5", SCORE_COLORS(finalScore))}>
                      {finalScore}
                    </span>
                  </div>
                )}
                
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
