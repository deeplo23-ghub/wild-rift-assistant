"use client";

import React, { memo, useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide, DraftState } from "@/types/draft";
import { motion } from "framer-motion";
import { 
  Trash2, 
  Sparkles,
  Target,
  X
} from "lucide-react";
import { cn, formatTag, getRoleIcon, getWinrateColor } from "@/lib/utils";
import { SYNERGY_RULES } from "@/lib/data/tags";
import { ChampionIcon } from "./ChampionIcon";
import { TeamTacticalAnalysis } from "./TeamTacticalAnalysis";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { TIER_COLORS, SCORE_COLORS } from "./ChampionPool";

const ROLE_LABELS = {
  [Role.Baron]: "Baron",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid",
  [Role.Dragon]: "Dragon",
  [Role.Support]: "Support",
};

const METRIC_TAG_MAP: Record<string, string[]> = {
  durabilityScore: ["frontline", "tank"],
  burstScore: ["burst", "assassin", "dive"],
  engageScore: ["engage", "dive"],
  rangeScore: ["range", "poke"],
  ccScore: ["cc", "utility"],
  peelScore: ["peel", "utility"],
  scalingScore: ["scaling", "hypercarry"],
  earlyGameScore: ["early", "skirmisher"],
  mobilityScore: ["dive", "assassin"],
  sustainScore: ["skirmisher"],
  healingScore: ["utility"],
  shieldScore: ["utility"],
  teamfightScore: ["aoe", "utility", "cc"],
  objectiveScore: ["hypercarry"],
  waveclearScore: ["waveclear", "aoe"],
};

const getDamageType = (profile: { ad: number; ap: number; true: number }) => {
  const { ad, ap, true: t } = profile;
  if (t >= 0.1) return { 
    label: "TRUE", 
    style: "bg-gradient-to-br from-zinc-200 via-white to-zinc-300 border border-zinc-400/40 shadow-[0_0_6px_rgba(255,255,255,0.15)] antialiased", 
    textStyle: "bg-gradient-to-br from-zinc-800 via-zinc-600 to-zinc-800 bg-clip-text text-transparent font-[900] tracking-tighter" 
  };
  if (ad >= 0.4 && ap >= 0.4) return { 
    label: "HYBRID", 
    style: "bg-gradient-to-r from-orange-900 via-zinc-900 to-blue-900 border border-white/15 shadow-[0_0_6px_rgba(168,85,247,0.15)] antialiased", 
    textStyle: "bg-gradient-to-r from-orange-400 via-purple-300 to-blue-400 bg-clip-text text-transparent font-[900] tracking-tighter" 
  };
  if (ap > ad) return { label: "AP", style: "bg-blue-950 text-blue-300 border border-blue-400/30 antialiased", textStyle: "font-black" };
  return { label: "AD", style: "bg-orange-950 text-orange-300 border border-orange-400/30 antialiased", textStyle: "font-black" };
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

export interface DraftSettings {
    autoFocus: boolean;
    showBreakdown: boolean;
    disableAnimations: boolean;
    disableTransparency: boolean;
    disableIntro: boolean;
}

interface BanSlotProps {
  i: number;
  side: TeamSide;
  champ: Champion | undefined;
  isActiveBanSlot: boolean;
  settings: DraftSettings;
  onBanClick: () => void;
  onRemoveBan: (id: string) => void;
}

const BanSlot = memo(({ i, side, champ, isActiveBanSlot, settings, onBanClick, onRemoveBan }: BanSlotProps) => {
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        if (!champ) onBanClick();
        else onRemoveBan(champ.id);
      }}
      className={cn(
        "flex-1 rounded-md border overflow-hidden relative group transition-all w-full h-full text-left",
        !settings.disableAnimations && "duration-300",
        settings.disableTransparency ? "bg-zinc-900" : "bg-black/15 backdrop-blur-md",
        champ ? "border-white/10" : "border-white/5",
        isActiveBanSlot ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] scale-[1.05] z-10 bg-red-500/10" : "",
        isActiveBanSlot && !settings.disableAnimations && "animate-pulse"
    )}>
        {champ ? (
            <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full opacity-60" grayscale />
        ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
                <Trash2 className={cn("w-4 h-4", isActiveBanSlot ? "text-red-500 opacity-100" : "text-zinc-500")} />
            </div>
        )}
        {champ && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <X className="w-8 h-8 text-red-500 drop-shadow-md opacity-80" strokeWidth={3} />
           </div>
        )}
    </button>
  );
});
BanSlot.displayName = "BanSlot";

interface PickSlotProps {
  role: Role;
  side: TeamSide;
  champion: Champion | undefined;
  isFocused: boolean;
  bd: any; // ScoredChampion | null
  highlightType: "synergy" | "counter" | "weak" | null;
  isStatHighlight: any;
  settings: DraftSettings;
  onSlotClick: () => void;
  onHoverChamp: (id: string | null, side?: TeamSide) => void;
  allChampions: Champion[];
  syns: { id: string; score: number }[];
  ctrs: { id: string; val: number }[];
  weaks: { id: string; val: number }[];
}

const PickSlot = memo(({ 
  role, 
  side, 
  champion, 
  isFocused, 
  bd, 
  highlightType, 
  isStatHighlight, 
  settings, 
  onSlotClick,
  onHoverChamp,
  allChampions,
  syns,
  ctrs,
  weaks
}: PickSlotProps) => {
  const isAlly = side === TeamSide.Ally;

  return (
    <div className="flex flex-col gap-1">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onSlotClick();
          }}
          onMouseEnter={() => champion && onHoverChamp(champion.id, side)}
          onMouseLeave={() => onHoverChamp(null)}
          className={cn(
            "relative flex items-center w-full gap-3 p-2 rounded-lg border transition-all text-left",
            !settings.disableAnimations && "duration-300",
            !isAlly && "flex-row-reverse text-right",
            isFocused 
              ? "border-transparent"
              : isStatHighlight
                ? isAlly
                  ? "border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-blue-500/10 scale-[1.02] z-10"
                  : "border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-red-500/10 scale-[1.02] z-10"
                : highlightType === "synergy"
                  ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : highlightType === "counter"
                    ? "border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                    : highlightType === "weak"
                      ? "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                  : "border-white/5 hover:border-zinc-500/20 shadow-sm"
          )}
        >
          {isFocused && (
             <motion.div
               layoutId={`focus-indicator-${side}`}
               className={cn("absolute inset-0 rounded-lg pointer-events-none border", isAlly ? "bg-blue-500/10 border-blue-500/50" : "bg-red-500/10 border-red-500/50")}
               transition={{ type: "spring", bounce: 0.2, duration: settings.disableAnimations ? 0 : 0.6 }}
             />
          )}
          {highlightType && (
              <div className={cn("absolute top-0 p-1", isAlly ? "right-0" : "left-0")}>
                  {highlightType === "synergy" ? (
                    <Sparkles className={cn("w-2.5 h-2.5 text-emerald-500", !settings.disableAnimations && "animate-pulse")} />
                  ) : highlightType === "counter" ? (
                    <Target className={cn("w-2.5 h-2.5 text-orange-500", !settings.disableAnimations && "animate-pulse")} />
                  ) : (
                    <Target className={cn("w-2.5 h-2.5 text-yellow-500", !settings.disableAnimations && "animate-pulse")} />
                  )}
              </div>
          )}
          <div className={cn(
            "w-[76px] h-[76px] rounded-md border border-white/5 flex items-center justify-center overflow-hidden shrink-0 relative",
            settings.disableTransparency ? "bg-zinc-900" : "bg-black/15 backdrop-blur-md"
          )}>
            {champion ? (
              <>
                <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full" />
                <div className={cn(
                  "absolute top-0 left-0 px-1.5 py-1 bg-black/90 rounded-br-md rounded-tl-sm border-r border-b border-white/10 shadow-sm z-10",
                  TIER_COLORS[champion.tier]?.split(" ")[0] || "text-zinc-500"
                )}>
                  <span className="text-[10px] font-black block leading-none">{champion.tier}</span>
                </div>
                <div className={cn(
                  "absolute bottom-0 right-0 px-1.5 py-1 bg-black/90 rounded-tl-md rounded-br-sm border-l border-t border-white/10 shadow-sm z-10 flex items-center justify-center",
                  getDamageType(champion.damageProfile).style
                )}>
                  <span className={cn("text-[9px] font-black block leading-none", getDamageType(champion.damageProfile).textStyle)}>
                    {getDamageType(champion.damageProfile).label}
                  </span>
                </div>
              </>
            ) : (
              <img 
                src={getRoleIcon(role)} 
                alt={role} 
                className={cn(
                  "w-10 h-10 object-contain opacity-20",
                   isFocused && "opacity-60 brightness-200",
                   isFocused && !settings.disableAnimations && "animate-pulse"
                )} 
              />
            )}
          </div>
          
          <div className={cn("flex flex-col flex-1 min-w-0 justify-center gap-1.5 py-1", !isAlly && "items-end text-right")}>
            {champion ? (
              <>
                <div className={cn("flex items-center gap-2 w-full", !isAlly && "flex-row-reverse")}>
                   <img src={getRoleIcon(role)} className="w-3.5 h-3.5 object-contain brightness-200 opacity-80 shrink-0" alt={role} />
                   <span className="text-sm font-bold text-zinc-100 truncate leading-none capitalize">{champion.name.toLowerCase()}</span>
                   {bd && (
                     <>
                       <span className={cn("font-bold text-xs leading-none", SCORE_COLORS(bd.finalScore))}>{bd.finalScore.toFixed(1)}</span>
                       <span className={cn(
                         "font-bold text-xs leading-none",
                         getWinrateColor(champion.winrate),
                         isAlly ? "ml-auto" : "mr-auto"
                       )}>{champion.winrate.toFixed(1)}%</span>
                     </>
                   )}
                </div>
                
                <div className={cn("flex items-center gap-1", !isAlly && "flex-row-reverse")}>
                   {syns.map((s: any) => {
                     const c = allChampions.find((champ: any) => champ.id === s.id);
                     return c ? (
                       <div key={c.id} className="w-5 h-5 rounded border border-emerald-500/50 overflow-hidden">
                         <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full" />
                       </div>
                     ) : null;
                   })}
                   {syns.length > 0 && (ctrs.length > 0 || weaks.length > 0) && <div className="w-px h-2.5 bg-white/10 mx-0.5" />}
                   {ctrs.map((c: any) => {
                     const champ = allChampions.find((ch: any) => ch.id === c.id);
                     return champ ? (
                       <div key={champ.id} className="w-5 h-5 rounded border border-red-500/50 overflow-hidden">
                         <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full" />
                       </div>
                     ) : null;
                   })}
                   {ctrs.length > 0 && weaks.length > 0 && <div className="w-px h-2.5 bg-white/10 mx-0.5" />}
                   {weaks.map((c: any) => {
                     const champ = allChampions.find((ch: any) => ch.id === c.id);
                     return champ ? (
                       <div key={champ.id} className="w-5 h-5 rounded border border-yellow-500/50 overflow-hidden">
                         <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full" />
                       </div>
                     ) : null;
                   })}
                </div>

                <div className={cn("flex flex-wrap gap-1", !isAlly && "flex-row-reverse")}>
                   {champion.tags.map((tag: string) => {
                     return (
                       <span key={tag} className="text-[7px] font-black px-1 py-0.5 rounded bg-white/5 text-zinc-500 border border-white/5">
                         {formatTag(tag)}
                       </span>
                     );
                   })}
                </div>
              </>
            ) : isFocused ? (
               <span className={cn("text-sm font-bold truncate text-white", !settings.disableAnimations && "animate-pulse")}>
                 Selecting {ROLE_LABELS[role]}...
               </span>
            ) : (
               <span className="text-sm font-bold truncate text-zinc-500/50">
                 {ROLE_LABELS[role]}
               </span>
            )}
          </div>
        </button>
    </div>
  );
});
PickSlot.displayName = "PickSlot";


interface TeamPanelProps {
  side: TeamSide;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ side }) => {
  const isAlly = side === TeamSide.Ally;

  // Use focused selectors
  const teamData = useDraftStore(state => isAlly ? state.ally : state.enemy);
  const opposingTeamData = useDraftStore(state => isAlly ? state.enemy : state.ally);
  const teamBans = useDraftStore(state => isAlly ? state.bans.ally : state.bans.enemy);
  const allChampions = useDraftStore(state => state.allChampions);
  const scoredChampions = useDraftStore(state => state.scoredChampions);
  const focusedSide = useDraftStore(state => state.focusedSide);
  const focusedRole = useDraftStore(state => state.focusedRole);
  const settings = useDraftStore(state => state.settings);
  const counterMatrix = useDraftStore(state => state.counterMatrix);
  const hoveredChampionId = useDraftStore(state => state.hoveredChampionId);
  const hoveredChampionSide = useDraftStore(state => state.hoveredChampionSide);
  const hoveredStatMetric = useDraftStore(state => state.hoveredStatMetric);
  const isBanMode = useDraftStore(state => state.isBanMode);

  // Actions
  const setFocusedSlot = useDraftStore(state => state.setFocusedSlot);
  const removePick = useDraftStore(state => state.removePick);
  const setHoveredChampion = useDraftStore(state => state.setHoveredChampion);
  const toggleBanMode = useDraftStore(state => state.toggleBanMode);
  const removeBan = useDraftStore(state => state.removeBan);

  // Memoized lists
  const teamChampions = useMemo(() => 
    Object.values(teamData)
      .map(s => allChampions.find(c => c.id === s.championId))
      .filter((c): c is Champion => !!c)
  , [teamData, allChampions]);

  const opposingTeamChampions = useMemo(() => 
    Object.values(opposingTeamData)
      .map(s => allChampions.find(c => c.id === s.championId))
      .filter((c): c is Champion => !!c)
  , [opposingTeamData, allChampions]);

  const hoveredChamp = useMemo(() => 
    hoveredChampionId ? allChampions.find(c => c.id === hoveredChampionId) : null
  , [hoveredChampionId, allChampions]);

  // Scoring Grade
  const totalScore = useMemo(() => 
    teamChampions.reduce((acc, c) => {
      const bd = scoredChampions.find(s => s.championId === c.id);
      return acc + (bd?.finalScore || 0);
    }, 0)
  , [teamChampions, scoredChampions]);

  const avgScore = teamChampions.length > 0 ? (totalScore / teamChampions.length) : 0;
  
  const grade = useMemo(() => {
    if (avgScore >= 75) return "S+";
    if (avgScore >= 68) return "S";
    if (avgScore >= 60) return "A";
    if (avgScore >= 52) return "B";
    if (avgScore >= 44) return "C";
    return "D";
  }, [avgScore]);

  // Helpers
  const getHighlightType = (champion: Champion): "synergy" | "counter" | "weak" | null => {
    if (!hoveredChamp || !hoveredChampionSide) return null;
    // Don't highlight the hovered champion itself
    if (champion.id === hoveredChampionId) return null;
    
    // Is THIS panel's champion on the same side as the hovered champion?
    const isSameSideAsHovered = side === hoveredChampionSide;
    
    if (isSameSideAsHovered) {
      // Same team as hovered: check synergy
      for (const t1 of hoveredChamp.tags) {
        for (const t2 of champion.tags) {
          const rule = SYNERGY_RULES.find(r => (r.tagA === t1 && r.tagB === t2) || (r.tagA === t2 && r.tagB === t1));
          if (rule && rule.score > 0) return "synergy";
        }
      }
    } else {
      // Opposite team from hovered: check counter and weak
      if (!counterMatrix) return null;
      // Does the hovered champ counter this champion?
      const hoveredMatrix = (counterMatrix as any).get ? (counterMatrix as any).get(hoveredChampionId) : (counterMatrix as any)[hoveredChampionId as any];
      if (hoveredMatrix) {
        const counterVal = hoveredMatrix.get ? hoveredMatrix.get(champion.id) : hoveredMatrix[champion.id];
        if (counterVal > 2) return "counter";
      }
      // Does this champion counter the hovered champ? (weakness of hovered)
      const champMatrix = (counterMatrix as any).get ? (counterMatrix as any).get(champion.id) : (counterMatrix as any)[champion.id];
      if (champMatrix) {
        const weakVal = champMatrix.get ? champMatrix.get(hoveredChampionId) : champMatrix[hoveredChampionId as any];
        if (weakVal > 2) return "weak";
      }
    }
    return null;
  };

  const getTopCounters = (championId: string) => {
    if (!counterMatrix) return [];
    const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(championId) : (counterMatrix as any)[championId];
    if (!matrix) return [];
    const draftedOppIdSet = new Set(opposingTeamChampions.map(c => c.id));
    
    if (draftedOppIdSet.size === 0) return [];
    const entries = matrix.entries ? Array.from(matrix.entries()) : Object.entries(matrix);
    return entries
      .map(([id, val]: any) => ({ id, val }))
      .filter((e: any) => draftedOppIdSet.has(e.id) && e.val > 0)
      .sort((a: any, b: any) => b.val - a.val);
  };

  const getTopSynergies = (champion: Champion) => {
    const draftedTeammateIdSet = new Set(teamChampions.map(c => c.id).filter(id => id !== champion.id));
    if (draftedTeammateIdSet.size === 0) return [];

    return teamChampions
      .filter(c => draftedTeammateIdSet.has(c.id))
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
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
  };

  const getTopWeaknesses = (championId: string) => {
    if (!counterMatrix) return [];
    const draftedOppIdSet = new Set(opposingTeamChampions.map(c => c.id));
    if (draftedOppIdSet.size === 0) return [];

    return Array.from(draftedOppIdSet).map(oppId => {
       const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(oppId) : (counterMatrix as any)[oppId];
       let val = 0;
       if (matrix) {
         val = matrix.get ? (matrix.get(championId) || 0) : (matrix[championId] || 0);
       }
       return { id: oppId, val };
    }).filter(e => e.val > 0)
      .sort((a, b) => b.val - a.val);
  };

  // Computed stats for redesigned header
  const avgWinRate = useMemo(() => {
    if (teamChampions.length === 0) return 0;
    return teamChampions.reduce((acc, c) => acc + c.winrate, 0) / teamChampions.length;
  }, [teamChampions]);

  const damageDistribution = useMemo(() => {
    if (teamChampions.length === 0) return { ad: 0, ap: 0, tr: 0 };
    const totalAD = teamChampions.reduce((acc, c) => acc + c.damageProfile.ad, 0);
    const totalAP = teamChampions.reduce((acc, c) => acc + c.damageProfile.ap, 0);
    const totalTR = teamChampions.reduce((acc, c) => acc + c.damageProfile.true, 0);
    const total = totalAD + totalAP + totalTR || 1;
    return { ad: totalAD / total, ap: totalAP / total, tr: totalTR / total };
  }, [teamChampions]);

  const GRADE_CONFIG: Record<string, { gradient: string; glow: string; border: string }> = {
    "S+": { gradient: "from-amber-300 via-yellow-400 to-orange-400", glow: "shadow-[0_0_20px_rgba(251,191,36,0.4)]", border: "border-yellow-500/40" },
    "S": { gradient: "from-yellow-400 to-orange-400", glow: "shadow-[0_0_15px_rgba(251,191,36,0.3)]", border: "border-yellow-500/30" },
    "A": { gradient: "from-emerald-400 to-teal-500", glow: "shadow-[0_0_12px_rgba(52,211,153,0.25)]", border: "border-emerald-500/30" },
    "B": { gradient: "from-sky-400 to-blue-500", glow: "shadow-[0_0_10px_rgba(56,189,248,0.2)]", border: "border-blue-500/25" },
    "C": { gradient: "from-zinc-400 to-zinc-500", glow: "", border: "border-zinc-500/20" },
    "D": { gradient: "from-zinc-500 to-zinc-600", glow: "", border: "border-zinc-600/20" },
  };
  const gc = GRADE_CONFIG[grade] || GRADE_CONFIG["D"];

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="space-y-3">
        {/* ─── Team Name Row ─── */}
        <div className={cn("flex items-center gap-2", !isAlly && "flex-row-reverse")}>
          <div className={cn("h-5 w-1 rounded-full", isAlly ? "bg-blue-500" : "bg-red-500")} />
          <h2 className="text-sm font-black tracking-wider uppercase text-white/90">{isAlly ? "Ally Team" : "Enemy Team"}</h2>
        </div>

        {/* ─── Stats Card ─── */}
        <div className={cn(
          "relative rounded-xl border overflow-hidden",
          settings.disableTransparency ? "bg-zinc-900" : "bg-black/20 backdrop-blur-sm",
          isAlly ? "border-blue-500/10" : "border-red-500/10"
        )}>
          {/* Subtle gradient overlay */}
          <div className={cn(
            "absolute inset-0 opacity-[0.03] pointer-events-none",
            isAlly ? "bg-gradient-to-br from-blue-500 to-transparent" : "bg-gradient-to-bl from-red-500 to-transparent"
          )} />

          <div className="relative p-3 space-y-3">
            {/* Top Row: Grade + Score + Win Rate */}
            <div className={cn("flex items-center gap-3", !isAlly && "flex-row-reverse")}>
              {/* Grade Badge */}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center border cursor-help transition-all",
                    gc.border, gc.glow,
                    settings.disableTransparency ? "bg-zinc-800" : "bg-black/40"
                  )}>
                    <span className={cn(
                      "text-lg font-black bg-gradient-to-br bg-clip-text text-transparent leading-none",
                      gc.gradient
                    )}>{grade}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" hideArrow className="px-2.5 py-1.5 bg-zinc-950/95 border border-white/10 rounded-lg text-[9.5px] font-bold text-zinc-100 shadow-2xl backdrop-blur-md">
                  DRAFT GRADE
                </TooltipContent>
              </Tooltip>

              {/* Score + WR */}
              <div className={cn("flex flex-col flex-1 min-w-0", !isAlly && "items-end")}>
                <div className={cn("flex items-baseline gap-2", !isAlly && "flex-row-reverse")}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <span className="text-2xl font-black text-white tracking-tight tabular-nums cursor-help leading-none">
                        {totalScore.toFixed(0)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" hideArrow className="px-2.5 py-1.5 bg-zinc-950/95 border border-white/10 rounded-lg text-[9.5px] font-bold text-zinc-100 shadow-2xl backdrop-blur-md">
                      TOTAL COMPOSITION POWER
                    </TooltipContent>
                  </Tooltip>
                  {teamChampions.length > 0 && (
                    <span className={cn(
                      "text-xs font-bold tabular-nums",
                      avgWinRate >= 52 ? "text-emerald-400" : avgWinRate >= 50 ? "text-zinc-300" : "text-red-400"
                    )}>
                      {avgWinRate.toFixed(1)}% <span className="text-zinc-600 text-[9px]">WR</span>
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                  {teamChampions.length}/5 picked
                </span>
              </div>
            </div>

            {/* Damage Distribution Bar */}
            {teamChampions.length > 0 && (
              <div className="space-y-1.5">
                <div className={cn("flex items-center justify-between text-[9px] font-bold uppercase tracking-wider", !isAlly && "flex-row-reverse")}>
                  <span className="text-orange-400/80">AD {Math.round(damageDistribution.ad * 100)}%</span>
                  {damageDistribution.tr > 0.05 && (
                    <span className="text-zinc-300/60">TRUE {Math.round(damageDistribution.tr * 100)}%</span>
                  )}
                  <span className="text-sky-400/80">AP {Math.round(damageDistribution.ap * 100)}%</span>
                </div>
                <div key={`dmg-${teamChampions.map(c => c.id).join('-')}`} className="h-1.5 rounded-full overflow-hidden bg-white/5 flex">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-l-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${damageDistribution.ad * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  {damageDistribution.tr > 0.01 && (
                    <motion.div 
                      className="h-full bg-gradient-to-r from-zinc-300 to-zinc-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${damageDistribution.tr * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    />
                  )}
                  <motion.div 
                    className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-r-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${damageDistribution.ap * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Bans Row ─── */}
        <div className="flex gap-1.5 h-12">
            {[...Array(5)].map((_, i) => (
              <BanSlot 
                key={i}
                i={i}
                side={side}
                champ={allChampions.find(c => c.id === teamBans[i])}
                isActiveBanSlot={isBanMode && focusedSide === side && i === teamBans.length}
                settings={settings}
                onBanClick={() => toggleBanMode(true, side)}
                onRemoveBan={(id: string) => removeBan(side, id)}
              />
            ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = teamData[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const isFocused = focusedSide === side && focusedRole === role;
          const bd = champion ? scoredChampions.find(s => s.championId === champion.id) : null;
          const highlightType = champion ? getHighlightType(champion) : null;
          const isStatHighlight = hoveredStatMetric && champion && (champion as any)[hoveredStatMetric] >= 7.0;

          return (
            <PickSlot 
              key={role}
              role={role}
              side={side}
              champion={champion}
              isFocused={isFocused}
              bd={bd}
              highlightType={highlightType}
              isStatHighlight={isStatHighlight}
              settings={settings}
              onSlotClick={() => champion ? removePick(side, role) : setFocusedSlot(side, role)}
              onHoverChamp={setHoveredChampion}
              allChampions={allChampions}
              syns={champion ? getTopSynergies(champion) : []}
              ctrs={champion ? getTopCounters(champion.id) : []}
              weaks={champion ? getTopWeaknesses(champion.id) : []}
            />
          );
        })}
        <TeamTacticalAnalysis side={side} />
      </div>
    </div>
  );
};
