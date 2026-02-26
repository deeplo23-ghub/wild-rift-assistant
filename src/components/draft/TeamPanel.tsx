"use client";

import React, { memo, useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
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
import { TIER_COLORS, SCORE_COLORS } from "./ChampionPool";

const ROLE_LABELS = {
  [Role.Baron]: "Baron",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid",
  [Role.Dragon]: "Dragon",
  [Role.Support]: "Support",
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
    autoBanFocus: boolean;
    confirmPicks: boolean;
    showBreakdown: boolean;
    showWinRates: boolean;
    showPickRates: boolean;
    showBanRates: boolean;
    showTierBadges: boolean;
    showDamageType: boolean;
    showTags: boolean;
    disableAnimations: boolean;
    disableTransparency: boolean;
    disableIntro: boolean;
    compactMode: boolean;
    showTooltips: boolean;
    showWinProbability: boolean;
    showDamageDistribution: boolean;
    showMatchupBars: boolean;
    showTopRecommendations: boolean;
    showSynergyIcons: boolean;
    showCounterIcons: boolean;
    showWeaknessIcons: boolean;
    gridDensity: boolean;
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
  bd: Record<string, unknown> | null;
  highlightType: "synergy" | "counter" | "weak" | null;
  isStatHighlight: boolean;
  settings: DraftSettings;
  onSlotClick: () => void;
  onHoverChamp: (id: string | null, side?: TeamSide) => void;
  allChampions: Champion[];
  teamChampions: Champion[];
  opposingTeamChampions: Champion[];
  counterMatrix: unknown;
}

const EMPTY_ARRAY: Array<{ id: string; score?: number; val?: number }> = [];

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
  teamChampions,
  opposingTeamChampions,
  counterMatrix
}: PickSlotProps) => {
  const isAlly = side === TeamSide.Ally;

  // Memoize these arrays to avoid re-renders on hover
  const syns = useMemo(() => {
    if (!champion) return EMPTY_ARRAY;
    const draftedTeammateIdSet = new Set(teamChampions.map(c => c.id).filter(id => id !== champion.id));
    if (draftedTeammateIdSet.size === 0) return EMPTY_ARRAY;

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
  }, [champion, teamChampions]);

  const ctrs = useMemo(() => {
    if (!champion || !counterMatrix) return EMPTY_ARRAY;
    
    // Type guard for Map vs Object
    const isMap = (obj: unknown): obj is Map<string, unknown> => obj instanceof Map;
    let matrix: Map<string, number> | Record<string, number> | null = null;
    
    if (isMap(counterMatrix)) {
      matrix = counterMatrix.get(champion.id) as Map<string, number> | undefined || null;
    } else {
      matrix = (counterMatrix as Record<string, Record<string, number>>)[champion.id] || null;
    }
    
    if (!matrix) return EMPTY_ARRAY;
    
    const draftedOppIdSet = new Set(opposingTeamChampions.map(c => c.id));
    if (draftedOppIdSet.size === 0) return EMPTY_ARRAY;
    
    const entries = isMap(matrix) ? Array.from(matrix.entries()) : Object.entries(matrix);
    return entries
      .map(([id, val]) => ({ id, val: val as number }))
      .filter(e => draftedOppIdSet.has(e.id) && e.val > 0)
      .sort((a, b) => b.val - a.val);
  }, [champion, counterMatrix, opposingTeamChampions]);

  const weaks = useMemo(() => {
    if (!champion || !counterMatrix) return EMPTY_ARRAY;
    const draftedOppIdSet = new Set(opposingTeamChampions.map(c => c.id));
    if (draftedOppIdSet.size === 0) return EMPTY_ARRAY;

    const isMap = (obj: unknown): obj is Map<string, unknown> => obj instanceof Map;

    return Array.from(draftedOppIdSet).map(oppId => {
       let matrix: Map<string, number> | Record<string, number> | null = null;
       
       if (isMap(counterMatrix)) {
         matrix = counterMatrix.get(oppId) as Map<string, number> | undefined || null;
       } else {
         matrix = (counterMatrix as Record<string, Record<string, number>>)[oppId] || null;
       }
       
       let val = 0;
       if (matrix) {
         val = isMap(matrix) ? (matrix.get(champion.id) || 0) : (matrix[champion.id] || 0);
       }
       return { id: oppId, val };
    }).filter(e => e.val > 0)
      .sort((a, b) => b.val - a.val);
  }, [champion, counterMatrix, opposingTeamChampions]);

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
                {settings.showTierBadges && (
                  <div className={cn(
                    "absolute top-0 left-0 px-1.5 py-1 bg-black/90 rounded-br-md rounded-tl-sm border-r border-b border-white/10 shadow-sm z-10",
                    TIER_COLORS[champion.tier]?.split(" ")[0] || "text-zinc-500"
                  )}>
                    <span className="text-[10px] font-black block leading-none">{champion.tier}</span>
                  </div>
                )}
                {settings.showDamageType && (
                  <div className={cn(
                    "absolute bottom-0 right-0 px-1.5 py-1 bg-black/90 rounded-tl-md rounded-br-sm border-l border-t border-white/10 shadow-sm z-10 flex items-center justify-center",
                    getDamageType(champion.damageProfile).style
                  )}>
                    <span className={cn("text-[9px] font-black block leading-none", getDamageType(champion.damageProfile).textStyle)}>
                      {getDamageType(champion.damageProfile).label}
                    </span>
                  </div>
                )}
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
                       <span className={cn("font-bold text-xs leading-none", SCORE_COLORS((bd.finalScore as number) || 0))}>{((bd.finalScore as number) || 0).toFixed(1)}</span>
                        {settings.showWinRates && (
                          <span className={cn(
                            "font-bold text-xs leading-none",
                            getWinrateColor(champion.winrate),
                            isAlly ? "ml-auto" : "mr-auto"
                          )}>{champion.winrate.toFixed(1)}%</span>
                        )}
                      </>
                   )}
                </div>
                
                <div className={cn("flex items-center gap-1", !isAlly && "flex-row-reverse")}>
                   {settings.showSynergyIcons && syns.map(s => {
                     const c = allChampions.find(champ => champ.id === s.id);
                     return c ? (
                       <div key={c.id} className="w-5 h-5 rounded border border-emerald-500/50 overflow-hidden">
                         <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full" />
                       </div>
                     ) : null;
                   })}
                   {settings.showSynergyIcons && syns.length > 0 && ((settings.showCounterIcons && ctrs.length > 0) || (settings.showWeaknessIcons && weaks.length > 0)) && <div className="w-px h-2.5 bg-white/10 mx-0.5" />}
                   {settings.showCounterIcons && ctrs.map(c => {
                     const champ = allChampions.find(ch => ch.id === c.id);
                     return champ ? (
                       <div key={champ.id} className="w-5 h-5 rounded border border-red-500/50 overflow-hidden">
                         <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full" />
                       </div>
                     ) : null;
                   })}
                   {settings.showCounterIcons && ctrs.length > 0 && settings.showWeaknessIcons && weaks.length > 0 && <div className="w-px h-2.5 bg-white/10 mx-0.5" />}
                   {settings.showWeaknessIcons && weaks.map(c => {
                     const champ = allChampions.find(ch => ch.id === c.id);
                     return champ ? (
                       <div key={champ.id} className="w-5 h-5 rounded border border-yellow-500/50 overflow-hidden">
                         <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full" />
                       </div>
                     ) : null;
                   })}
                </div>

                {settings.showTags && (
                  <div className={cn("flex flex-wrap gap-1", !isAlly && "flex-row-reverse")}>
                     {champion.tags.map((tag: string) => {
                       return (
                         <span key={tag} className="text-[7px] font-black px-1 py-0.5 rounded bg-white/5 text-zinc-500 border border-white/5">
                           {formatTag(tag)}
                         </span>
                       );
                     })}
                  </div>
                )}
              </>
            ) : isFocused ? (
               <span className={cn("text-lg font-black tracking-tight text-white/40", !settings.disableAnimations && "animate-pulse")}>
                 Selecting {ROLE_LABELS[role]}
               </span>
            ) : (
               <span className="text-xl font-black tracking-tighter text-zinc-500/20">
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
      const bd = scoredChampions.find(s => s.championId === c.id) as Record<string, unknown> | undefined;
      return acc + ((bd?.finalScore as number) || 0);
    }, 0)
  , [teamChampions, scoredChampions]);

  const avgScore = teamChampions.length > 0 ? (totalScore / teamChampions.length) : 0;
  
  const compAdvice = useMemo(() => {
    if (teamChampions.length === 0) return { label: "Build Comp", color: "from-zinc-400 to-zinc-600", detail: "Start picking to see analysis." };
    
    const stats = {
      cc: teamChampions.reduce((acc, c) => acc + c.ccScore, 0) / teamChampions.length,
      durability: teamChampions.reduce((acc, c) => acc + c.durabilityScore, 0) / teamChampions.length,
      waveclear: teamChampions.reduce((acc, c) => acc + c.waveclearScore, 0) / teamChampions.length,
    };

    const ad = teamChampions.reduce((acc, c) => acc + c.damageProfile.ad, 0);
    const ap = teamChampions.reduce((acc, c) => acc + c.damageProfile.ap, 0);
    const totalDmg = ad + ap || 1;

    if (teamChampions.length >= 2) {
      if (stats.durability < 3.8) return { label: "Needs Frontline", color: "from-orange-400 to-red-500", detail: "Composition is too fragile. Consider a tank." };
      if (stats.cc < 4.5) return { label: "Needs CC", color: "from-indigo-400 to-blue-500", detail: "Lacking lockdown. Consider champions with stuns." };
      if (ad / totalDmg > 0.85) return { label: "Needs AP", color: "from-blue-400 to-cyan-500", detail: "Too much Physical damage. Armor-stacking will counter you." };
      if (ap / totalDmg > 0.85) return { label: "Needs AD", color: "from-orange-400 to-amber-600", detail: "Too much Magic damage. MR-stacking will counter you." };
      if (stats.waveclear < 4.5) return { label: "Needs Waveclear", color: "from-purple-400 to-pink-500", detail: "Poor wave management. Defending will be difficult." };
    }

    if (teamChampions.length === 5) return { label: "Comp Complete", color: "from-emerald-400 to-teal-500", detail: "Final composition analysis active." };
    return { label: "Balanced", color: "from-emerald-400 to-teal-500", detail: "Composition metrics are within healthy ranges." };
  }, [teamChampions]);

  // Use compAdvice to avoid unused variable warning or remove it if not used in the JSX
  // If it's indeed unused, we can just comment it out.
  // Actually let's keep it and render it if needed, or simply not define it if it's unused.

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
    if (!hoveredChamp || !hoveredChampionSide || !hoveredChampionId) return null;
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
      const isMap = (obj: unknown): obj is Map<string, unknown> => obj instanceof Map;

      // Does the hovered champ counter this champion?
      let hoveredMatrix: Map<string, number> | Record<string, number> | null = null;
      if (isMap(counterMatrix)) hoveredMatrix = counterMatrix.get(hoveredChampionId) as Map<string, number> | undefined || null;
      else hoveredMatrix = (counterMatrix as unknown as Record<string, Record<string, number>>)[hoveredChampionId] || null;

      if (hoveredMatrix) {
        const counterVal = isMap(hoveredMatrix) ? hoveredMatrix.get(champion.id) : hoveredMatrix[champion.id];
        if (counterVal && counterVal > 2) return "counter";
      }

      // Does this champion counter the hovered champ? (weakness of hovered)
      let champMatrix: Map<string, number> | Record<string, number> | null = null;
      if (isMap(counterMatrix)) champMatrix = counterMatrix.get(champion.id) as Map<string, number> | undefined || null;
      else champMatrix = (counterMatrix as unknown as Record<string, Record<string, number>>)[champion.id] || null;

      if (champMatrix) {
        const weakVal = isMap(champMatrix) ? champMatrix.get(hoveredChampionId) : champMatrix[hoveredChampionId];
        if (weakVal && weakVal > 2) return "weak";
      }
    }
    return null;
  };


  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="space-y-3">
        <div className={cn("flex items-center justify-between gap-2", !isAlly && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", !isAlly && "flex-row-reverse")}>
                <div className={cn("h-6 w-1 rounded-full", isAlly ? "bg-blue-500" : "bg-red-500")} />
                <h2 className="text-xl font-bold tracking-tight text-white">{isAlly ? "Ally Team" : "Enemy Team"}</h2>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-3 px-3 py-1 rounded-lg border border-white/5 transition-all",
                settings.disableTransparency ? "bg-zinc-900" : "bg-black/10 backdrop-blur-md",
                !isAlly && "flex-row-reverse",
                teamChampions.length === 0 ? "opacity-40 grayscale" : "opacity-100 shadow-[0_0_20px_rgba(255,255,255,0.02)]"
              )}
            >
              <div className="flex flex-col items-center min-w-[32px]">
                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Power</span>
                <span className={cn(
                  "text-xs font-black tabular-nums transition-colors",
                  teamChampions.length > 0 ? SCORE_COLORS(avgScore) : "text-zinc-500/40"
                )}>
                  {teamChampions.length > 0 ? avgScore.toFixed(0) : "00"}
                </span>
              </div>
              <div className="w-px h-5 bg-white/5" />
              <div className="flex flex-col items-center min-w-[32px]">
                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Grade</span>
                <span className={cn(
                  "text-[13px] font-black italic select-none transition-colors tracking-tighter",
                  teamChampions.length > 0 ? (TIER_COLORS[grade]?.split(" ")[0] || "text-zinc-300") : "text-zinc-500/20"
                )}>
                  {teamChampions.length > 0 ? grade : "—"}
                </span>
              </div>
            </motion.div>
        </div>
        
        <div className="flex gap-2 h-14">
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
          const bd = (champion ? scoredChampions.find(s => s.championId === champion.id) : null) as Record<string, unknown> | null;
          const highlightType = champion ? getHighlightType(champion) : null;
          const isStatHighlight = hoveredStatMetric && champion && ((champion as unknown as Record<string, unknown>)[hoveredStatMetric] as number) >= 7.0 ? true : false;

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
              teamChampions={teamChampions}
              opposingTeamChampions={opposingTeamChampions}
              counterMatrix={counterMatrix}
            />
          );
        })}
        <TeamTacticalAnalysis side={side} />
      </div>
    </div>
  );
};
