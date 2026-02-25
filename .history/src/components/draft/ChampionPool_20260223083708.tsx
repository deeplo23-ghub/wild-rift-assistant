"use client";

import React, { useMemo, useState } from "react";
import { useDraftStore, SortMetric } from "@/store/draftStore";
import { Role, Champion, Tier } from "@/types/champion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ArrowUpDown, 
  Ban, 
  Target, 
  Sparkles,
  Info,
  ShieldAlert,
  Sword,
  TrendingDown,
  TrendingUp,
  Zap,
  Activity,
  User,
  Trash2
} from "lucide-react";
import { cn, getRoleIcon } from "@/lib/utils";
import { SYNERGY_RULES } from "@/lib/data/tags";
import { ChampionIcon } from "./ChampionIcon";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export function ChampionPool({ champions }: { champions: Champion[] }) {
  const store = useDraftStore();
  
  const scoredMap = useMemo(() => {
    const map = new Map<string, any>();
    store.scoredChampions.forEach(s => map.set(s.championId, s));
    return map;
  }, [store.scoredChampions]);

  const unavailableIds = useMemo(() => {
    const ids = new Set<string>([...store.bans.ally, ...store.bans.enemy]);
    Object.values(store.ally).forEach(s => s.championId && ids.add(s.championId));
    Object.values(store.enemy).forEach(s => s.championId && ids.add(s.championId));
    return ids;
  }, [store.bans, store.ally, store.enemy]);

  const sortedChampions = useMemo(() => {
    return champions
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(store.activeSearch.toLowerCase());
        const matchesRole = store.activeRoleFilter === "all" || c.roles.includes(store.activeRoleFilter as Role);
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (store.sortBy === "score") {
          const scoreA = scoredMap.get(a.id)?.finalScore ?? 0;
          const scoreB = scoredMap.get(b.id)?.finalScore ?? 0;
          return scoreB - scoreA;
        }
        if (store.sortBy === "winrate") return b.winrate - a.winrate;
        if (store.sortBy === "pickrate") return b.pickRate - a.pickRate;
        if (store.sortBy === "banrate") return b.banRate - a.banRate;
        if (store.sortBy === "tier") return TIER_WEIGHTS[b.tier] - TIER_WEIGHTS[a.tier];
        return 0;
      });
  }, [champions, store.activeSearch, store.activeRoleFilter, store.sortBy, scoredMap]);

  const top3 = sortedChampions.slice(0, 3);
  const others = sortedChampions.slice(3);

  const getTopCounters = (championId: string) => {
    if (!store.counterMatrix) return [];
    const matrix = (store.counterMatrix as any).get ? (store.counterMatrix as any).get(championId) : null;
    if (!matrix) return [];
    
    return Array.from(matrix.entries())
      .map(([id, val]: any) => ({ id, val }))
      .filter((e: any) => e.val > 2)
      .sort((a: any, b: any) => b.val - a.val)
      .slice(0, 5);
  };

  const getTopSynergies = (champion: Champion) => {
    return champions
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
      .slice(0, 5);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 bg-zinc-900/40 p-5 rounded-2xl border border-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center justify-between gap-6">
          <div className="relative flex-1 group">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
             <Input
               placeholder="Search Candidates..."
               value={store.activeSearch}
               onChange={(e) => store.setSearch(e.target.value)}
               className="pl-11 h-11 bg-black/40 border-white/5 text-base focus-visible:ring-blue-500/30 rounded-xl"
             />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-2">Sort By</span>
            <Select value={store.sortBy} onValueChange={(v) => store.setSortBy(v as SortMetric)}>
               <SelectTrigger className="w-[140px] h-11 bg-black/40 border-white/5 rounded-xl capitalize font-bold text-sm">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                 {["score", "winrate", "pickrate", "banrate", "tier"].map(m => (
                   <SelectItem key={m} value={m} className="capitalize font-bold text-xs">{m}</SelectItem>
                 ))}
               </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(["all", Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support] as const).map((r) => (
              <button
                key={r}
                onClick={() => store.setRoleFilter(r)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                  store.activeRoleFilter === r 
                    ? "bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                    : "bg-black/20 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                )}
              >
                {r !== "all" && (
                  <img src={getRoleIcon(r)} alt={r} className="w-3.5 h-3.5 object-contain brightness-200" />
                )}
                {r === "all" ? "All Roles" : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enlarged Recommendations */}
      <AnimatePresence mode="popLayout">
        {top3.length > 0 && !store.activeSearch && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {top3.map((champion, idx) => {
              const score = scoredMap.get(champion.id);
              const isUnavailable = unavailableIds.has(champion.id);
              const counters = getTopCounters(champion.id);
              const synergies = getTopSynergies(champion);
              
              return (
                <motion.div
                  layout
                  key={champion.id}
                  onMouseEnter={() => store.setHoveredChampion(champion.id)}
                  onMouseLeave={() => store.setHoveredChampion(null)}
                  onClick={() => !isUnavailable && store.autoAction(champion.id)}
                  className={cn(
                    "cursor-pointer group relative rounded-2xl border transition-all overflow-hidden bg-zinc-900/80 shadow-2xl backdrop-blur-xl",
                    isUnavailable ? "opacity-30 grayscale pointer-events-none" : "hover:border-blue-500/40 hover:bg-zinc-900",
                    idx === 0 ? "border-yellow-500/20" : "border-white/5"
                  )}
                >
                  {/* Decorative Badge */}
                  {idx === 0 && (
                    <div className="absolute top-0 right-0 p-3 z-10">
                      <Sparkles className="w-5 h-5 text-yellow-500/50 animate-pulse" />
                    </div>
                  )}

                  <div className="p-5 flex flex-col gap-5">
                    <div className="flex gap-4 items-start">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shrink-0 shadow-inner">
                        <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full" />
                        <div className={cn(
                          "absolute inset-x-0 bottom-0 py-0.5 text-center text-[10px] font-black tracking-widest",
                          TIER_COLORS[champion.tier] || "bg-zinc-800 text-zinc-400"
                        )}>
                          {champion.tier}
                        </div>
                      </div>
                      
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold truncate text-white tracking-tighter capitalize">{champion.name}</h3>
                          <div className="text-right">
                             <span className={cn(
                               "text-3xl font-black leading-none tracking-tighter",
                               score?.finalScore > 85 ? "text-yellow-400" : score?.finalScore > 75 ? "text-orange-400" : "text-blue-400"
                             )}>
                               {score ? Math.round(score.finalScore) : 0}
                             </span>
                             <span className="block text-[8px] font-bold text-zinc-500 tracking-widest mt-0.5 uppercase">Draft Score</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase">Winrate</span>
                            <span className="text-xs font-bold text-zinc-200">{Math.round(champion.winrate)}%</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase">Pick</span>
                            <span className="text-xs font-bold text-zinc-200">{Math.round(champion.pickRate)}%</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase">Ban</span>
                            <span className="text-xs font-bold text-zinc-200">{Math.round(champion.banRate)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Full Grid */}
                     {score && (
                       <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-black/20 rounded-xl border border-white/5">
                          {[
                            { label: "Base", val: score.breakdown.base, col: "text-blue-400" },
                            { label: "Synergy", val: score.breakdown.synergy, col: "text-emerald-400" },
                            { label: "Counter", val: score.breakdown.counter, col: "text-orange-400" },
                            { label: "Composition", val: score.breakdown.composition, col: "text-purple-400" },
                            { label: "Threat", val: score.breakdown.threat, col: "text-red-400" },
                            { label: "Flexibility", val: score.breakdown.flexibility, col: "text-cyan-400" },
                            { label: "Risk Penalty", val: score.breakdown.risk, col: "text-pink-400", isPenalty: true }
                          ].map((b, i) => (
                            <div key={i} className="flex justify-between items-center group/item">
                              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider group-hover/item:text-zinc-400 transition-colors">{b.label}</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                    className={cn("h-full opacity-50", b.isPenalty ? "bg-pink-500" : "bg-blue-500")} 
                                    style={{ width: `${Math.min(100, b.val)}%` }} 
                                  />
                                </div>
                                <span className={cn("text-[10px] font-black min-w-[20px] text-right", b.col)}>
                                  {b.isPenalty ? "-" : "+"}{Math.round(b.val)}
                                </span>
                              </div>
                            </div>
                          ))}
                       </div>
                     )}

                    {/* Related Icons */}
                    <div className="flex flex-col gap-3 mt-1">
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">Counters</span>
                         <div className="flex gap-2">
                           {counters.map(c => {
                             const target = champions.find(hc => hc.id === c.id);
                             return (
                               <div key={c.id} className="w-7 h-7 rounded-lg border border-white/5 overflow-hidden">
                                  <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full opacity-40 hover:opacity-100 transition-opacity" grayscale />
                               </div>
                             );
                           })}
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">Synergy</span>
                         <div className="flex gap-2">
                           {synergies.map(s => {
                             const target = champions.find(hc => hc.id === s.id);
                             return (
                               <div key={s.id} className="w-7 h-7 rounded-lg border border-white/5 overflow-hidden">
                                  <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full opacity-40 hover:opacity-100 transition-opacity" grayscale />
                               </div>
                             );
                           })}
                         </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="flex-1 bg-zinc-900/20 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <ScrollArea className="h-full">
          <div className="p-6">
            <motion.div 
               layout
               className="grid grid-cols-[repeat(auto-fill,64px)] gap-[8px] justify-between"
            >
              <AnimatePresence>
                {others.map((champion) => {
                  const score = scoredMap.get(champion.id);
                  const isUnavailable = unavailableIds.has(champion.id);
                  const tierStyle = TIER_COLORS[champion.tier] || "text-zinc-500";
                  
                  return (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={champion.id}
                      disabled={isUnavailable}
                      onMouseEnter={() => store.setHoveredChampion(champion.id)}
                      onMouseLeave={() => store.setHoveredChampion(null)}
                      onClick={() => store.autoAction(champion.id)}
                      className={cn(
                        "relative w-16 h-16 transition-all group",
                        isUnavailable ? "opacity-10 grayscale cursor-not-allowed" : "hover:z-10"
                      )}
                    >
                      <div className={cn(
                        "w-full h-full border rounded-xl overflow-hidden transition-all duration-300 bg-zinc-950",
                        isUnavailable ? "border-transparent" : "border-white/5 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                      )}>
                        <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      
                      {/* Micro Rank indicator */}
                      {!isUnavailable && (
                        <div className="absolute top-0 right-0 p-1">
                           <div className={cn(
                             "w-1.5 h-1.5 rounded-full",
                             champion.tier.startsWith("S") ? "bg-yellow-500 animate-pulse" : "bg-zinc-700"
                           )} />
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl">
                         <span className={cn("text-[9px] font-bold block text-center truncate px-1", tierStyle.split(" ")[0])}>
                           {champion.name}
                         </span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
