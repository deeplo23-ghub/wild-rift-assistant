"use client";

import React, { useMemo, memo } from "react";
import { useDraftStore, SortMetric } from "@/store/draftStore";
import { Role, Champion, CounterMatrix } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { 
  Search, 
  X,
  Sparkles,
  Target
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getRoleIcon, getWinrateColor } from "@/lib/utils";
import { SYNERGY_RULES } from "@/lib/data/tags";
import { ChampionIcon } from "./ChampionIcon";
import { getWeights } from "@/lib/scoring/weights";
import { detectStage } from "@/lib/scoring/stage";
import { DraftState } from "@/types/draft";
import { ScoredChampion } from "@/types/scoring";

// ─── Constants & Utils ──────────────────────────────────────────────────────

interface ChampionPoolProps {
  champions: Champion[];
}

interface RecommendationCardProps {
  recChamp: Champion;
  idx: number;
  score: ScoredChampion | undefined;
  isUnavailable: boolean;
  isPicked: boolean;
  isPickedByAlly: boolean;
  topCounters: { id: string; val: number }[];
  topSynergies: { id: string; score: number }[];
  topWeaknesses: { id: string; val: number }[];
  currentWeights: any;
  settings: DraftState["settings"] & { showBreakdown: boolean };
  allChampions: Champion[];
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

export const TIER_COLORS: Record<string, string> = {
  "S+": "text-yellow-400 border-yellow-400/50 bg-yellow-400/10",
  "S": "text-orange-400 border-orange-400/50 bg-orange-400/10",
  "A": "text-emerald-400 border-emerald-400/50 bg-emerald-400/10",
  "B": "text-blue-400 border-blue-400/50 bg-blue-400/10",
  "C": "text-zinc-400 border-zinc-400/50 bg-zinc-400/10",
  "D": "text-zinc-500 border-zinc-500/50 bg-zinc-500/10",
};

const TIER_WEIGHTS: Record<string, number> = {
  "S+": 6, "S": 5, "A": 4, "B": 3, "C": 2, "D": 1
};

const getDamageType = (profile: { ad: number; ap: number; true: number }) => {
  const { ad, ap, true: t } = profile;
  if (t >= 0.1) return { label: "TRUE", style: "bg-white text-black border-transparent shadow-sm antialiased", textStyle: "" };
  if (ad > 0.3 && ap > 0.3) return { 
    label: "HYBRID", 
    style: "bg-gradient-to-br from-orange-950 from-35% to-blue-950 to-65% border border-white/10 shadow-md antialiased", 
    textStyle: "bg-gradient-to-br from-blue-300 via-zinc-100 to-orange-300 bg-clip-text text-transparent font-[900] tracking-tighter" 
  };
  if (ap > 0.6) return { label: "AP", style: "bg-blue-950 text-blue-300 border border-blue-400/30 antialiased", textStyle: "font-black" };
  return { label: "AD", style: "bg-orange-950 text-orange-300 border border-orange-400/30 antialiased", textStyle: "font-black" };
};

export const SCORE_COLORS = (score: number) => {
  if (score >= 90) return "text-yellow-400 font-black";
  if (score >= 87.5) return "text-yellow-400/90 font-black";
  if (score >= 85) return "text-yellow-500 font-black";
  if (score >= 82.5) return "text-amber-300 font-black";
  if (score >= 80) return "text-amber-400 font-black";
  if (score >= 77.5) return "text-lime-400 font-bold";
  if (score >= 75) return "text-lime-500 font-bold";
  if (score >= 72.5) return "text-green-400 font-bold";
  if (score >= 70) return "text-green-500 font-bold";
  if (score >= 67.5) return "text-teal-400 font-bold";
  if (score >= 65) return "text-teal-500 font-bold";
  if (score >= 62.5) return "text-cyan-400 font-bold";
  if (score >= 60) return "text-cyan-500 font-bold";
  if (score >= 57.5) return "text-orange-400 font-bold";
  if (score >= 55) return "text-orange-500 font-bold";
  if (score >= 52.5) return "text-red-400 font-bold";
  if (score >= 50) return "text-red-500 font-black";
  return "text-zinc-500 font-medium";
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

/**
 * Individual Champion Card in the Main Grid.
 * Memoized to prevent re-renders when other champions are hovered or state changes.
 */
const ChampionGridItem = memo(({ 
  champion, 
  score, 
  isUnavailable, 
  isPicked,
  isPickedByAlly,
  isAnyBanned,
  sortBy,
  isBanMode,
  settings,
  onHover,
  onClick
}: {
  champion: Champion;
  score: any;
  isUnavailable: boolean;
  isPicked: boolean;
  isPickedByAlly: boolean;
  isAnyBanned: boolean;
  sortBy: SortMetric;
  isBanMode: boolean;
  settings: any;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) => {
  const finalScore = score ? score.finalScore : 0;
  const tierColor = TIER_COLORS[champion.tier]?.split(" ")[0] || "text-zinc-500";
  
  const displayMetric = sortBy === "winrate" ? `${champion.winrate.toFixed(1)}%`
                      : sortBy === "pickrate" ? `${champion.pickRate.toFixed(1)}%`
                      : sortBy === "banrate" ? `${champion.banRate.toFixed(1)}%`
                      : finalScore;

  const metricColor = (sortBy === "winrate") ? getWinrateColor(champion.winrate)
                   : (sortBy === "pickrate") ? (champion.pickRate >= 15 ? "text-orange-400" : champion.pickRate >= 8 ? "text-blue-400" : "text-zinc-400")
                   : (sortBy === "banrate") ? (champion.banRate >= 20 ? "text-red-400" : champion.banRate >= 10 ? "text-orange-400" : "text-zinc-400")
                   : SCORE_COLORS(finalScore);

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          disabled={isUnavailable}
          onMouseEnter={() => onHover(champion.id)}
          onMouseLeave={() => onHover(null)}
          onClick={(e) => { e.stopPropagation(); onClick(champion.id); }}
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
                  "w-full h-full transform transition-transform text-[0]", 
                  !settings.disableAnimations && "duration-300 group-hover:scale-110",
                  (isUnavailable || isAnyBanned) && "grayscale"
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
                    "px-2 py-0.5 rounded text-[8px] font-black capitalize tracking-widest border shadow-xl",
                    !settings.disableTransparency && "backdrop-blur-md",
                    isPickedByAlly ? "bg-blue-500 text-white border-blue-400/50" : "bg-red-500 text-white border-red-400/50"
                  )}>
                    {isPickedByAlly ? "Ally" : "Enemy"}
                  </div>
                </div>
              )}
            </div>
            
            <div className={cn(
              "absolute top-0 left-0 px-1.5 py-0.5 bg-black/90 rounded-br-md rounded-tl-sm border-r border-b border-white/10 shadow-sm z-10",
              tierColor
            )}>
              <span className="text-[9px] font-extrabold block leading-none pt-0.5">{champion.tier}</span>
            </div>

            <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/90 rounded-tl-md rounded-br-sm border-l border-t border-white/10 shadow-sm z-10">
              <span className={cn("text-[9px] font-bold block leading-none pb-0.5", 
                 isBanMode ? (champion.banRate >= 20 ? "text-red-400" : champion.banRate >= 10 ? "text-orange-400" : "text-zinc-400") : metricColor
              )}>
                {isBanMode ? `${champion.banRate.toFixed(1)}%` : (typeof displayMetric === 'number' ? displayMetric.toFixed(1) : displayMetric)}
              </span>
            </div>
          </div>

          <span style={{ fontFamily: '"Space Grotesk", "Space Grotesk Fallback", sans-serif' }} className="text-[11px] leading-[17px] font-[700] text-zinc-500 group-hover:text-zinc-300 transition-colors capitalize truncate w-full text-center mt-1">
            {champion.name.toLowerCase()}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        sideOffset={8}
        hideArrow
        className={cn(
          "p-3 border border-white/10 rounded-lg shadow-2xl z-50 pointer-events-none whitespace-nowrap min-w-[140px] flex flex-col items-center",
          settings.disableTransparency ? "bg-zinc-800" : "bg-black/50 backdrop-blur-xl",
          "text-zinc-100"
        )}
      >
        <p className="text-sm font-bold text-white mb-1 tracking-tight capitalize text-center">{champion.name.toLowerCase()}</p>
        <p className="text-[11px] text-zinc-400 font-medium text-center">Power Score: <span className={SCORE_COLORS(finalScore)}>{finalScore.toFixed(1)}</span></p>
        <div className="mt-2 text-[10px] flex items-center justify-center gap-2 w-full">
           <span className={cn("font-medium", getWinrateColor(champion.winrate))}>WR: {Math.round(champion.winrate)}%</span>
           <span className="text-zinc-500">|</span>
           <span className={tierColor}>Tier: {champion.tier}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

ChampionGridItem.displayName = "ChampionGridItem";

/**
 * Top Recommendation Card.
 */
const RecommendationCard = memo(({ 
  recChamp, 
  idx, 
  score, 
  isUnavailable, 
  isPicked, 
  isPickedByAlly, 
  topCounters, 
  topSynergies, 
  topWeaknesses, 
  currentWeights, 
  settings, 
  allChampions,
  onHover, 
  onClick 
}: RecommendationCardProps) => {
  const finalScore = score ? score.finalScore : 0;

  return (
    <Card 
      onClick={(e) => { e.stopPropagation(); !isUnavailable && onClick(recChamp.id); }}
      onMouseEnter={() => onHover(recChamp.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "relative border transition-all cursor-pointer group overflow-hidden p-0 gap-0",
        !settings.disableAnimations && "duration-300",
        settings.disableTransparency ? "bg-zinc-900" : "bg-black/15 backdrop-blur-md",
        isUnavailable && !isPicked ? "opacity-40 grayscale pointer-events-none" : "hover:border-blue-500/50 hover:shadow-blue-500/10",
        idx === 0 ? "border-gold-shimmer z-10 shadow-[0_0_20px_rgba(234,179,8,0.2)]" : "border-white/5"
      )}
    >
      <CardContent className="p-[15px] flex flex-col gap-2">
        <div className="flex gap-[10px] items-start">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="relative w-[76px] h-[76px] rounded-lg overflow-hidden border border-white/10 shadow-inner group-hover:border-blue-500/50 transition-colors">
              <ChampionIcon 
                name={recChamp.name} 
                url={recChamp.iconUrl} 
                className={cn(
                  "w-full h-full transform transition-transform",
                  !settings.disableAnimations && "duration-300 group-hover:scale-110",
                  isUnavailable && "grayscale"
                )} 
              />
              <div className={cn(
                "absolute bottom-0 right-0 px-1 py-0.5 bg-black/90 rounded-tl-md border-l border-t border-white/10 shadow-sm z-10 flex items-center justify-center",
                getDamageType(recChamp.damageProfile).style
              )}>
                <span className={cn("text-[7px] font-black block leading-none", getDamageType(recChamp.damageProfile).textStyle)}>
                  {getDamageType(recChamp.damageProfile).label}
                </span>
              </div>
              {isPicked && (
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  isPickedByAlly ? "bg-blue-500/10" : "bg-red-500/10"
                )}>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black capitalize tracking-widest border shadow-xl",
                    !settings.disableTransparency && "backdrop-blur-md",
                    isPickedByAlly ? "bg-blue-500 text-white border-blue-400/50" : "bg-red-500 text-white border-red-400/50"
                  )}>
                    {isPickedByAlly ? "Ally" : "Enemy"}
                  </div>
                </div>
              )}
            </div>
            
            <div className={cn(
              "px-2 py-[2px] rounded-full border border-white/10 shadow-sm transition-all flex items-center justify-center min-w-[32px] overflow-hidden relative",
              !settings.disableTransparency && "backdrop-blur-md",
              recChamp.tier === "S+" ? "border-yellow-400/50 shadow-[0_0_10px_rgba(234,179,8,0.3)] bg-yellow-400/10" : "bg-white/5"
            )}>
              {recChamp.tier === "S+" && !settings.disableAnimations && (
                 <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-50" />
              )}
              <span className={cn(
                "text-[10px] font-black block leading-none relative z-10",
                TIER_COLORS[recChamp.tier]?.split(" ")[0] || "text-zinc-400",
                recChamp.tier === "S+" && !settings.disableAnimations && "animate-sparkle"
              )}>
                {recChamp.tier}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col flex-1 min-w-0 pr-1">
            <div className="flex justify-between items-center mb-0.5 border-b border-white/5 pb-0.5">
              <h3 className="text-sm font-bold truncate text-white tracking-tight leading-none capitalize">{recChamp.name.toLowerCase()}</h3>
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
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "grid grid-cols-3 gap-1 rounded border border-white/5 py-1 px-0.5 mt-[2px]",
          settings.disableTransparency ? "bg-zinc-800" : "bg-black/10"
        )}>
          <div className="flex flex-col items-center justify-center">
            <span className="text-[7px] text-zinc-500 capitalize font-black tracking-widest leading-none mb-[3px]">Win Rate</span>
            <span className={cn("text-[10px] font-bold leading-none", getWinrateColor(recChamp.winrate))}>{recChamp.winrate.toFixed(1)}%</span>
          </div>
          <div className="flex flex-col items-center justify-center border-x border-white/5">
            <span className="text-[7px] text-zinc-500 capitalize font-black tracking-widest leading-none mb-[3px]">Pick Rate</span>
            <span className="text-[10px] font-bold text-zinc-300 leading-none">{recChamp.pickRate.toFixed(1)}%</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-[7px] text-zinc-500 capitalize font-black tracking-widest leading-none mb-[3px]">Ban Rate</span>
            <span className="text-[10px] font-bold text-red-400 leading-none">{recChamp.banRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-[2px] px-1 pb-0.5">
          <div className="h-px bg-white/5 w-full my-0.5" />
          <div className="flex flex-wrap gap-1">
            {topSynergies.map((s: any) => {
              const target = allChampions.find((hc: any) => hc.id === s.id);
              return (
                <div key={s.id} title={`Synergy: ${target?.name}`} className="w-5 h-5 rounded border border-emerald-500/50 shadow-[0_0_5px_rgba(16,185,129,0.2)] overflow-hidden">
                  <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full" />
                </div>
              );
            })}
            {topCounters.map((c: any) => {
              const target = allChampions.find((hc: any) => hc.id === c.id);
              return (
                <div key={c.id} title={`Counter: ${target?.name}`} className="w-5 h-5 rounded border border-red-500/50 shadow-[0_0_5px_rgba(239,68,68,0.2)] overflow-hidden">
                  <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full" />
                </div>
              );
            })}
            {topWeaknesses.map((w: any) => {
              const target = allChampions.find((hc: any) => hc.id === w.id);
              return (
                <div key={w.id} title={`Weakness: ${target?.name}`} className="w-5 h-5 rounded border border-yellow-500/50 shadow-[0_0_5px_rgba(234,179,8,0.2)] overflow-hidden">
                  <ChampionIcon name={target?.name || ""} url={target?.iconUrl || ""} className="w-full h-full" />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

RecommendationCard.displayName = "RecommendationCard";

// ─── Main Component ─────────────────────────────────────────────────────────

export function ChampionPool({ champions }: ChampionPoolProps) {
  // Use granular selectors to avoid re-renders on every store change
  const activeRoleFilter = useDraftStore(state => state.activeRoleFilter);
  const activeTierFilter = useDraftStore(state => state.activeTierFilter);
  const activeSearch = useDraftStore(state => state.activeSearch);
  const sortBy = useDraftStore(state => state.sortBy);
  const scoredChampions = useDraftStore(state => state.scoredChampions);
  const bans = useDraftStore(state => state.bans);
  const ally = useDraftStore(state => state.ally);
  const enemy = useDraftStore(state => state.enemy);
  const isBanMode = useDraftStore(state => state.isBanMode);
  const focusedSide = useDraftStore(state => state.focusedSide);
  const focusedRole = useDraftStore(state => state.focusedRole);
  const settings = useDraftStore(state => state.settings);
  const counterMatrix = useDraftStore(state => state.counterMatrix);

  // Actions
  const setRoleFilter = useDraftStore(state => state.setRoleFilter);
  const setTierFilter = useDraftStore(state => state.setTierFilter);
  const setSearch = useDraftStore(state => state.setSearch);
  const setSortBy = useDraftStore(state => state.setSortBy);
  const setHoveredChampion = useDraftStore(state => state.setHoveredChampion);
  const autoAction = useDraftStore(state => state.autoAction);

  // Memoized derived data
  const scoredMap = useMemo(() => {
    const map = new Map<string, any>();
    scoredChampions.forEach(s => map.set(s.championId, s));
    return map;
  }, [scoredChampions]);

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
  }, [champions, activeSearch, activeRoleFilter, activeTierFilter, sortBy, scoredMap, pickedIds]);

  const isTop3Visible = !activeSearch && !isBanMode && focusedRole !== null;
  const availableSorted = useMemo(() => sortedChampions.filter(c => !unavailableIds.has(c.id)), [sortedChampions, unavailableIds]);
  const top3 = isTop3Visible ? availableSorted.slice(0, 3) : [];
  const others = useMemo(() => sortedChampions.filter(c => !top3.some(t => t.id === c.id)), [sortedChampions, top3]);

  // Helper functions for Top 3
  const getTopCounters = (championId: string) => {
    if (!counterMatrix) return [];
    const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(championId) : (counterMatrix as any)[championId];
    if (!matrix) return [];
    
    const targetTeam = focusedSide === TeamSide.Ally ? enemy : ally;
    const draftedOpponents = Object.values(targetTeam)
      .map(s => s.championId)
      .filter((id): id is string => !!id);

    if (draftedOpponents.length === 0) return [];
    
    const entries = matrix.entries ? Array.from(matrix.entries()) : Object.entries(matrix);
    return entries
      .map(([id, val]: any) => ({ id, val }))
      .filter((e: any) => draftedOpponents.includes(e.id) && e.val > 0)
      .sort((a: any, b: any) => b.val - a.val);
  };

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
      .sort((a: { id: string; score: number }, b: { id: string; score: number }) => b.score - a.score);
  };

  const getTopWeaknesses = (championId: string): { id: string; val: number }[] => {
    if (!counterMatrix) return [];
    const targetTeam = focusedSide === TeamSide.Ally ? enemy : ally;
    const draftedOpponents = Object.values(targetTeam)
      .map(s => s.championId)
      .filter((id): id is string => !!id);

    if (draftedOpponents.length === 0) return [];

    return draftedOpponents.map(oppId => {
       const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(oppId) : (counterMatrix as any)[oppId];
       let val = 0;
       if (matrix) {
          if (matrix.get) val = matrix.get(championId) || 0;
          else val = matrix[championId] || 0;
       }
       return { id: oppId, val };
    }).filter(e => e.val > 0)
      .sort((a, b) => b.val - a.val);
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-4 text-white font-sans selection:bg-blue-500/30">
      {/* Search & Filters */}
      <div className={cn(
        "flex flex-col gap-4 p-4 border border-white/5 rounded-xl",
        settings.disableTransparency ? "bg-zinc-900" : "bg-black/15 backdrop-blur-md"
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
              <Input
                placeholder="Search..."
                value={activeSearch}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "pl-8 h-[38.5px] py-0 leading-[38.5px] border-white/10 text-[10px] focus:ring-1 focus:ring-blue-500/50",
                  settings.disableTransparency ? "bg-zinc-800" : "bg-black/40"
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500">Sort By</span>
            <div className="flex p-1 bg-black/20 rounded-lg border border-white/5 relative">
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
                      transition={{ type: "spring", bounce: 0.2, duration: settings.disableAnimations ? 0 : 0.6 }}
                    />
                  )}
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-500 min-w-max">Role Filter</span>
              <div className="flex p-1 bg-black/20 rounded-lg border border-white/5 flex-wrap">
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
                        transition={{ type: "spring", bounce: 0.2, duration: settings.disableAnimations ? 0 : 0.6 }}
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
              <div className="flex p-1 bg-black/20 rounded-lg border border-white/5">
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
                          transition={{ type: "spring", bounce: 0.2, duration: settings.disableAnimations ? 0 : 0.6 }}
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
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {top3.map((recChamp, idx) => (
            <RecommendationCard 
              key={recChamp.id}
              recChamp={recChamp}
              idx={idx}
              score={scoredMap.get(recChamp.id)}
              isUnavailable={unavailableIds.has(recChamp.id)}
              isPicked={pickedIds.has(recChamp.id)}
              isPickedByAlly={pickedByAlly.has(recChamp.id)}
              topCounters={getTopCounters(recChamp.id)}
              topSynergies={getTopSynergies(recChamp)}
              topWeaknesses={getTopWeaknesses(recChamp.id)}
              currentWeights={currentWeights}
              settings={settings}
              allChampions={champions}
              onHover={setHoveredChampion}
              onClick={autoAction}
            />
          ))}
        </div>
      )}

      {/* Main Grid */}
      <ScrollArea className={cn(
        "flex-1 h-full min-h-0 rounded-xl border border-white/5 p-5 shadow-inner",
        settings.disableTransparency ? "bg-zinc-900" : "bg-black/5"
      )}>
        <div className="grid grid-cols-10 gap-2 justify-center items-start">
          {others.map((champion) => (
            <ChampionGridItem 
              key={champion.id}
              champion={champion}
              score={scoredMap.get(champion.id)}
              isUnavailable={pickedIds.has(champion.id) || combinedBans.has(champion.id)}
              isPicked={pickedIds.has(champion.id)}
              isPickedByAlly={pickedByAlly.has(champion.id)}
              isAnyBanned={combinedBans.has(champion.id)}
              sortBy={sortBy}
              isBanMode={isBanMode}
              settings={settings}
              onHover={setHoveredChampion}
              onClick={autoAction}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
