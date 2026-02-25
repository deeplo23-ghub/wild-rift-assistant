"use client";

import React, { useMemo } from "react";
import { useDraftStore, SortMetric } from "@/store/draftStore";
import { Role, Champion, CounterMatrix, Tier } from "@/types/champion";
import { TeamSide } from "@/types/draft";
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
  Info,
  X
} from "lucide-react";
import { cn, getRoleIcon } from "@/lib/utils";
import { SYNERGY_RULES } from "@/lib/data/tags";
import { ChampionIcon } from "./ChampionIcon";
import { getWeights } from "@/lib/scoring/weights";
import { detectStage } from "@/lib/scoring/stage";

interface ChampionPoolProps {
  champions: Champion[];
}

export const TIER_COLORS: Record<string, string> = {
  "S+": "text-yellow-400 border-yellow-400/50 bg-yellow-400/10",
  "S": "text-orange-400 border-orange-400/50 bg-orange-400/10",
  "A": "text-emerald-400 border-emerald-400/50 bg-emerald-400/10",
  "B": "text-blue-400 border-blue-400/50 bg-blue-400/10",
  "C": "text-zinc-400 border-zinc-400/50 bg-zinc-400/10",
  "D": "text-zinc-500 border-zinc-500/50 bg-zinc-500/10",
};

export const SCORE_COLORS = (score: number) => {
  // 80 - 100: Yellow/Gold range
  if (score >= 90) return "text-yellow-400 font-black";
  if (score >= 87.5) return "text-yellow-400/90 font-black";
  if (score >= 85) return "text-yellow-500 font-black";
  if (score >= 82.5) return "text-amber-300 font-black";
  if (score >= 80) return "text-amber-400 font-black";

  // 70 - 77.5: Green range
  if (score >= 77.5) return "text-lime-400 font-bold";
  if (score >= 75) return "text-lime-500 font-bold";
  if (score >= 72.5) return "text-green-400 font-bold";
  if (score >= 70) return "text-green-500 font-bold";

  // 60 - 67.5: Transition range (Teal/Cyan)
  if (score >= 67.5) return "text-teal-400 font-bold";
  if (score >= 65) return "text-teal-500 font-bold";
  if (score >= 62.5) return "text-cyan-400 font-bold";
  if (score >= 60) return "text-cyan-500 font-bold";

  // 50 - 57.5: Red/Orange range
  if (score >= 57.5) return "text-orange-400 font-bold";
  if (score >= 55) return "text-orange-500 font-bold";
  if (score >= 52.5) return "text-red-400 font-bold";
  if (score >= 50) return "text-red-500 font-black";

  return "text-zinc-500 font-medium";
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
    focusedSide,
    focusedRole,
    settings
  } = useDraftStore();

  const scoredMap = useMemo(() => {
    const map = new Map<string, any>();
    scoredChampions.forEach(s => map.set(s.championId, s));
    return map;
  }, [scoredChampions]);

  const allyBans = useMemo(() => new Set<string>(bans.ally), [bans.ally]);
  const enemyBans = useMemo(() => new Set<string>(bans.enemy), [bans.enemy]);
  const combinedBans = useMemo(() => new Set<string>([...bans.ally, ...bans.enemy]), [bans.ally, bans.enemy]);

  const pickedByAlly = useMemo(() => {
    const ids = new Set<string>();
    Object.values(ally).forEach(s => s.championId && ids.add(s.championId));
    return ids;
  }, [ally]);

  const pickedByEnemy = useMemo(() => {
    const ids = new Set<string>();
    Object.values(enemy).forEach(s => s.championId && ids.add(s.championId));
    return ids;
  }, [enemy]);

  const pickedIds = useMemo(() => {
    return new Set<string>([...pickedByAlly, ...pickedByEnemy]);
  }, [pickedByAlly, pickedByEnemy]);

  const currentWeights = useMemo(() => {
    const totalPicks = pickedIds.size;
    const stage = detectStage(totalPicks);
    return getWeights(stage);
  }, [pickedIds]);

  const unavailableIds = useMemo(() => {
    return new Set<string>([...combinedBans, ...pickedIds]);
  }, [combinedBans, pickedIds]);

  const sortedChampions = useMemo(() => {
    return champions
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(activeSearch.toLowerCase());
        const matchesRole = activeRoleFilter === "all" || c.roles.includes(activeRoleFilter as Role);
        const matchesTier = activeTierFilter === "all" || c.tier === activeTierFilter;
        return matchesSearch && matchesRole && matchesTier;
      })
      .sort((a, b) => {
        // Only picked champions should be pushed to the bottom.
        // Bannes champions should stay in their rank but appear grayed out.
        const isAPicked = pickedIds.has(a.id);
        const isBPicked = pickedIds.has(b.id);

        if (isAPicked && !isBPicked) return 1;
        if (!isAPicked && isBPicked) return -1;

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

  const isTop3Visible = !activeSearch && !isBanMode && focusedRole !== null;
  const availableSorted = sortedChampions.filter(c => !unavailableIds.has(c.id));
  const top3 = isTop3Visible ? availableSorted.slice(0, 3) : [];
  const others = sortedChampions.filter(c => !top3.some(t => t.id === c.id));

  const getTopCounters = (championId: string) => {
    if (!counterMatrix) return [];
    const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(championId) : null;
    if (!matrix) return [];
    
    const targetTeam = focusedSide === TeamSide.Ally ? enemy : ally;
    const draftedOpponents = Object.values(targetTeam)
      .map(s => s.championId)
      .filter((id): id is string => !!id);

    if (draftedOpponents.length === 0) return [];
    
    return Array.from(matrix.entries())
      .map(([id, val]: any) => ({ id, val }))
      .filter((e: any) => draftedOpponents.includes(e.id) && e.val > 0)
      .sort((a: any, b: any) => b.val - a.val)
      .slice(0, 4);
  };

  // Helper to find top synergies for top 3
  const getTopSynergies = (champion: Champion) => {
    const targetTeam = focusedSide === TeamSide.Ally ? ally : enemy;
    const draftedTeammates = Object.values(targetTeam)
      .map(s => s.championId)
      .filter((id): id is string => !!id && id !== champion.id);

    if (draftedTeammates.length === 0) return [];

    return champions
      .filter((c: Champion) => draftedTeammates.includes(c.id))
      .map((c: Champion) => {
        let score = 0;
        for (const t1 of champion.tags) {
          for (const t2 of c.tags) {
            const rule = SYNERGY_RULES.find(r => (r.tagA === t1 && r.tagB === t2) || (r.tagA === t2 && r.tagB === t1));
            if (rule) score += rule.score;
          }
        }
        return { id: c.id, score };
      })
      .filter((r: { id: string; score: number }) => r.score > 0)
      .sort((a: { id: string; score: number }, b: { id: string; score: number }) => b.score - a.score)
      .slice(0, 4);
  const getTopWeaknesses = (championId: string) => {
    if (!counterMatrix) return [];
    
    const targetTeam = focusedSide === TeamSide.Ally ? enemy : ally;
    const draftedOpponents = Object.values(targetTeam)
      .map(s => s.championId)
      .filter((id): id is string => !!id);

    if (draftedOpponents.length === 0) return [];

    return draftedOpponents.map(oppId => {
       const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(oppId) : null;
       let val = 0;
       if (matrix && (matrix as any).has(championId)) {
          val = (matrix as any).get(championId);
       }
       return { id: oppId, val };
    }).filter(e => e.val > 0)
      .sort((a, b) => b.val - a.val)
      .slice(0, 4);
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-4 text-white font-sans selection:bg-blue-500/30">
      {/* Search & Filters */}
      <div className="flex flex-col gap-4 bg-black/40 p-4 border border-white/5 rounded-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
              <Input
                placeholder="Search..."
                value={activeSearch}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="pl-8 h-[38.5px] py-0 leading-[38.5px] bg-black/40 border-white/10 text-[10px] focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500">Sort By</span>
            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 relative">
              {(["score", "winrate", "pickrate", "banrate", "tier"] as SortMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={(e) => { e.stopPropagation(); setSortBy(m); }}
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
                    onClick={(e) => { e.stopPropagation(); setRoleFilter(r); }}
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
                      onClick={(e) => { e.stopPropagation(); setTierFilter(t); }}
                      className={cn(
                        "relative px-4 py-1.5 rounded-md text-[11px] font-bold capitalize transition-colors z-0",
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
            const finalScore = score ? score.finalScore : 0;
            const isPickedByAlly = pickedByAlly.has(champion.id);
            const isPickedByEnemy = pickedByEnemy.has(champion.id);
            const isPicked = isPickedByAlly || isPickedByEnemy;
            
            return (
              <Card 
                key={champion.id}
                onClick={(e) => { e.stopPropagation(); !isUnavailable && autoAction(champion.id); }}
                className={cn(
                  "relative border transition-all cursor-pointer group overflow-hidden bg-black/40 backdrop-blur-md shadow-xl p-0 gap-0",
                  isUnavailable && !isPicked ? "opacity-40 grayscale pointer-events-none" : "hover:border-blue-500/50 hover:shadow-blue-500/10",
                  idx === 0 ? "border-gold-shimmer z-10 shadow-[0_0_20px_rgba(234,179,8,0.2)]" : "border-white/5"
                )}
              >
                <CardContent className="p-[15px] flex flex-col gap-2">
                  {/* Header & Score Details */}
                  <div className="flex gap-[10px] items-start">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="relative w-[76px] h-[76px] rounded-lg overflow-hidden border border-white/10 shadow-inner group-hover:border-blue-500/50 transition-colors">
                        <ChampionIcon 
                          name={champion.name} 
                          url={champion.iconUrl} 
                          className={cn(
                            "w-full h-full transform transition-transform duration-300 group-hover:scale-110",
                            isUnavailable && "grayscale"
                          )} 
                        />
                        {isPicked && (
                          <div className={cn(
                            "absolute inset-0 flex items-center justify-center",
                            isPickedByAlly ? "bg-blue-500/10" : "bg-red-500/10"
                          )}>
                            <div className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black capitalize tracking-widest border shadow-xl backdrop-blur-md",
                              isPickedByAlly ? "bg-blue-500 text-white border-blue-400/50" : "bg-red-500 text-white border-red-400/50"
                            )}>
                              {isPickedByAlly ? "Ally" : "Enemy"}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Tier Badge Below Icon */}
                      <div className={cn(
                        "px-2 py-[2px] rounded-full border border-white/10 shadow-sm transition-all backdrop-blur-md flex items-center justify-center min-w-[32px] overflow-hidden relative",
                        champion.tier === "S+" ? "border-yellow-400/50 shadow-[0_0_10px_rgba(234,179,8,0.3)] bg-yellow-400/10" : "bg-white/5"
                      )}>
                        {champion.tier === "S+" && (
                           <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-50" />
                        )}
                        <span className={cn(
                          "text-[10px] font-black block leading-none relative z-10",
                          TIER_COLORS[champion.tier]?.split(" ")[0] || "text-zinc-400",
                          champion.tier === "S+" && "animate-sparkle"
                        )}>
                          {champion.tier}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0 pr-1">
                      <div className="flex justify-between items-center mb-0.5 border-b border-white/5 pb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                           <h3 className="text-sm font-bold truncate text-white tracking-tight leading-none capitalize">{champion.name.toLowerCase()}</h3>
                           {activeRoleFilter !== "all" && (
                             <img src={getRoleIcon(activeRoleFilter)} className="w-[10px] h-[10px] object-contain brightness-200 opacity-60 shrink-0" alt={activeRoleFilter} />
                           )}
                        </div>
                        <span className={cn("text-base font-extrabold leading-none tracking-tighter", SCORE_COLORS(finalScore))}>
                          {finalScore.toFixed(1)}
                        </span>
                      </div>
                      
                      {score && settings.showBreakdown && (
                        <div className="flex flex-col gap-[3px] text-[9px] mt-0.5">
                          {[
                            { label: "Base", val: score.breakdown.base, w: currentWeights.base, color: "text-zinc-300" },
                            { label: "Synergy", val: score.breakdown.synergy, w: currentWeights.synergy, color: "text-emerald-400" },
                            { label: "Counter", val: score.breakdown.counter, w: currentWeights.counter, color: "text-emerald-500" },
                            { label: "Balance", val: score.breakdown.composition, w: currentWeights.composition, color: "text-blue-400" },
                            { label: "Threat", val: score.breakdown.threat, w: currentWeights.threat, color: "text-orange-400" },
                            { label: "Flex", val: score.breakdown.flexibility, w: currentWeights.flexibility, color: "text-purple-400" },
                            { label: "Risk", val: score.breakdown.risk, w: -currentWeights.risk, color: "text-red-500" },
                          ].map((item) => {
                            const contribution = item.val * (item.label === "Risk" ? -item.w : item.w);
                            return (
                              <div key={item.label} className="flex justify-between items-center group/calc">
                                <div className="flex items-center gap-1">
                                   <span className="text-[7px] text-zinc-500 capitalize font-black tracking-widest leading-none">{item.label}</span>
                                   <span className="text-[6px] text-zinc-600 font-bold opacity-0 group-hover/calc:opacity-100 transition-opacity">
                                     ({Math.round(Math.abs(item.w) * 100)}%)
                                   </span>
                                </div>
                                <div className="flex items-center gap-1">
                                   <span className="text-[7px] text-zinc-600 italic leading-none">{Math.round(item.val)}</span>
                                   <span className={cn("font-bold leading-none", item.color)}>
                                     {contribution >= 0 ? "+" : ""}{contribution.toFixed(1)}
                                   </span>
                                </div>
                              </div>
                            );
                          })}
                          <div className="h-px bg-white/10 my-0.5" />
                          <div className="flex justify-between items-center">
                            <span className="text-[7px] text-zinc-400 capitalize font-black tracking-widest leading-none">Sub-Total</span>
                            <span className={cn("font-black text-xs leading-none", SCORE_COLORS(finalScore))}>{finalScore}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WR PR BR Row */}
                  <div className="grid grid-cols-3 gap-1 bg-black/20 rounded border border-white/5 py-1 px-0.5 mt-[2px]">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[7px] text-zinc-500 capitalize font-black tracking-widest leading-none mb-[3px]">Win Rate</span>
                      <span className="text-[10px] font-bold text-emerald-400 leading-none">{champion.winrate.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-x border-white/5">
                      <span className="text-[7px] text-zinc-500 capitalize font-black tracking-widest leading-none mb-[3px]">Pick Rate</span>
                      <span className="text-[10px] font-bold text-zinc-300 leading-none">{champion.pickRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[7px] text-zinc-500 capitalize font-black tracking-widest leading-none mb-[3px]">Ban Rate</span>
                      <span className="text-[10px] font-bold text-red-400 leading-none">{champion.banRate.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Consolidated Linkable Champions & Traits */}
                  <div className="flex flex-col gap-2 mt-[2px] px-1 pb-0.5">
                    {/* Icons Line */}
                    <div className="flex flex-wrap gap-1">
                      {synergies.slice(0, 3).map(s => {
                        const target = champions.find(hc => hc.id === s.id);
                        return (
                          <div key={s.id} title={`Synergy: ${target?.name}`} className="w-5 h-5 rounded border border-emerald-500/50 shadow-[0_0_5px_rgba(16,185,129,0.2)] overflow-hidden">
                            <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full" />
                          </div>
                        );
                      })}
                      {counters.slice(0, 3).map(c => {
                        const target = champions.find(hc => hc.id === c.id);
                        return (
                          <div key={c.id} title={`Counter: ${target?.name}`} className="w-5 h-5 rounded border border-purple-500/50 shadow-[0_0_5px_rgba(168,85,247,0.2)] overflow-hidden">
                            <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full" />
                          </div>
                        );
                      })}
                      {getTopWeaknesses(champion.id).slice(0, 3).map(w => {
                        const target = champions.find(hc => hc.id === w.id);
                        return (
                          <div key={w.id} title={`Weakness: ${target?.name}`} className="w-5 h-5 rounded border border-red-500/50 shadow-[0_0_5px_rgba(239,68,68,0.2)] overflow-hidden">
                            <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full" />
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Tags Line */}
                    <div className="flex flex-wrap gap-1">
                      {champion.tags.map(tag => (
                        <span key={tag} className="text-[7px] font-black capitalize px-1 py-0.5 rounded bg-white/5 text-zinc-500 border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Grid */}
      <ScrollArea className="flex-1 h-full min-h-0 bg-black/20 rounded-xl border border-white/5 p-5 shadow-inner">
        <div className="grid grid-cols-10 gap-2 justify-center items-start">
          {others.map((champion) => {
            const score = scoredMap.get(champion.id);
            const isPickedByAlly = pickedByAlly.has(champion.id);
            const isPickedByEnemy = pickedByEnemy.has(champion.id);
            const isPicked = isPickedByAlly || isPickedByEnemy;
            const isBannedBySelf = focusedSide === TeamSide.Ally ? allyBans.has(champion.id) : enemyBans.has(champion.id);
            
            // In ban mode, you can ban anything except what's already picked or already banned by YOUR team.
            // In pick mode, you can't pick anything that's picked or banned by ANYONE.
            const isUnavailable = isBanMode 
              ? (isPicked || isBannedBySelf)
              : (isPicked || combinedBans.has(champion.id));

            const isAnyBanned = combinedBans.has(champion.id);
            const tierColor = TIER_COLORS[champion.tier]?.split(" ")[0] || "text-zinc-500";
            const finalScore = score ? score.finalScore : 0;
            
            const displayMetric = sortBy === "winrate" ? `${champion.winrate.toFixed(1)}%`
                                : sortBy === "pickrate" ? `${champion.pickRate.toFixed(1)}%`
                                : sortBy === "banrate" ? `${champion.banRate.toFixed(1)}%`
                                : finalScore;

            const metricColor = (sortBy === "winrate") ? (champion.winrate >= 52 ? "text-emerald-400" : champion.winrate >= 50 ? "text-blue-400" : "text-zinc-400")
                             : (sortBy === "pickrate") ? (champion.pickRate >= 15 ? "text-orange-400" : champion.pickRate >= 8 ? "text-blue-400" : "text-zinc-400")
                             : (sortBy === "banrate") ? (champion.banRate >= 20 ? "text-red-400" : champion.banRate >= 10 ? "text-orange-400" : "text-zinc-400")
                             : SCORE_COLORS(finalScore);
            
            return (
              <button
                key={champion.id}
                disabled={isUnavailable}
                onMouseEnter={() => setHoveredChampion(champion.id)}
                onMouseLeave={() => setHoveredChampion(null)}
                onClick={(e) => { e.stopPropagation(); autoAction(champion.id); }}
                className={cn(
                  "relative flex flex-col items-center gap-1 w-full transition-all active:scale-95 group rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                  isUnavailable && !isPicked ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                )}>
                <div className="relative w-full aspect-square shadow-md group-hover:shadow-lg rounded-lg">
                  <div className={cn(
                    "w-full h-full border-2 rounded-lg overflow-hidden transition-all relative",
                    isUnavailable && !isPicked ? "border-transparent" : "border-white/10 group-hover:border-blue-500/50"
                  )}>
                    <ChampionIcon 
                      name={champion.name} 
                      url={champion.iconUrl} 
                      className={cn(
                        "w-full h-full transform transition-transform duration-300 group-hover:scale-110", 
                        (isUnavailable || isAnyBanned) && "grayscale", 
                        isAnyBanned && "opacity-50"
                      )} 
                    />
                    {isAnyBanned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                        <X className="w-10 h-10 text-red-500 drop-shadow-md opacity-80" strokeWidth={3} />
                      </div>
                    )}
                    {isPicked && (
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center",
                        isPickedByAlly ? "bg-blue-500/10" : "bg-red-500/10"
                      )}>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black capitalize tracking-widest border shadow-xl backdrop-blur-md",
                          isPickedByAlly ? "bg-blue-500 text-white border-blue-400/50" : "bg-red-500 text-white border-red-400/50"
                        )}>
                          {isPickedByAlly ? "Ally" : "Enemy"}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Micro Tier Overlay */}
                  <div className={cn(
                    "absolute top-0 left-0 px-1.5 py-0.5 bg-black/90 rounded-br-md rounded-tl-sm border-r border-b border-white/10 shadow-sm z-10",
                    tierColor
                  )}>
                    <span className="text-[9px] font-extrabold block leading-none pt-0.5">{champion.tier}</span>
                  </div>

                  {/* Micro Metric Overlay */}
                  {!isBanMode && !isUnavailable && (
                    <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/90 rounded-tl-md rounded-br-sm border-l border-t border-white/10 shadow-sm z-10">
                      <span className={cn("text-[9px] font-bold block leading-none pb-0.5", metricColor)}>
                        {typeof displayMetric === 'number' ? displayMetric.toFixed(1) : displayMetric}
                      </span>
                    </div>
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap min-w-[140px]">
                    <p className="text-sm font-bold text-white mb-1 tracking-tight capitalize">{champion.name.toLowerCase()}</p>
                    <p className="text-[11px] text-zinc-400 font-medium">Power Score: <span className={SCORE_COLORS(finalScore)}>{finalScore.toFixed(1)}</span></p>
                    <div className="mt-2 text-[10px] flex gap-2">
                       <span className="text-emerald-400 font-medium">WR: {Math.round(champion.winrate)}%</span>
                       <span className="text-zinc-500">|</span>
                       <span className={tierColor}>Tier: {champion.tier}</span>
                    </div>
                  </div>
                </div>

                <span style={{ fontFamily: '"Space Grotesk", "Space Grotesk Fallback", sans-serif' }} className="text-[11px] leading-[17px] font-[700] text-zinc-500 group-hover:text-zinc-300 transition-colors capitalize truncate w-full text-center mt-1">
                  {champion.name.toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
