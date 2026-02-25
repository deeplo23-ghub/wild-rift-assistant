"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Trash2, 
  Brain, 
  Sword, 
  Shield, 
  Zap, 
  Wind, 
  Crosshair, 
  Scale, 
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Target,
  Skull,
  Waves,
  Eye,
  Activity,
  X
} from "lucide-react";
import { cn, formatTag, getRoleIcon, getWinrateColor } from "@/lib/utils";
import { SYNERGY_RULES } from "@/lib/data/tags";
import { ChampionIcon } from "./ChampionIcon";
import { TeamAnalysis } from "./TeamAnalysis";
import { TeamTacticalAnalysis } from "./TeamTacticalAnalysis";
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
  if (t >= 0.1) return { label: "TRUE", style: "bg-white text-black border-transparent shadow-sm antialiased", textStyle: "" };
  if (ad > 0.3 && ap > 0.3) return { 
    label: "HYBRID", 
    style: "bg-gradient-to-br from-orange-950 from-35% to-blue-950 to-65% border border-white/10 shadow-md antialiased", 
    textStyle: "bg-gradient-to-br from-blue-300 via-zinc-100 to-orange-300 bg-clip-text text-transparent font-[900] tracking-tighter" 
  };
  if (ap > 0.6) return { label: "AP", style: "bg-blue-950 text-blue-300 border border-blue-400/30 antialiased", textStyle: "font-black" };
  return { label: "AD", style: "bg-orange-950 text-orange-300 border border-orange-400/30 antialiased", textStyle: "font-black" };
};

interface TeamPanelProps {
  side: TeamSide;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ side }) => {
  const { 
    ally, 
    enemy,
    allChampions, 
    focusedSide, 
    focusedRole, 
    setFocusedSlot, 
    removePick,
    scoredChampions,
    bans,
    hoveredChampionId,
    setHoveredChampion,
    counterMatrix,
    settings,
    hoveredStatMetric
  } = useDraftStore();

  const isAlly = side === TeamSide.Ally;
  const teamData = isAlly ? ally : enemy;
  const teamBans = isAlly ? bans.ally : bans.enemy;
  const themeColor = isAlly ? "blue" : "red";
  const labelColor = isAlly ? "text-blue-500" : "text-red-500";
  const borderColor = isAlly ? "border-blue-500" : "border-red-500";
  const bgColor = isAlly ? "bg-blue-500/10" : "bg-red-500/10";
  const shadowColor = isAlly ? "shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "shadow-[0_0_15px_rgba(239,68,68,0.1)]";

  const hoveredChamp = allChampions.find(c => c.id === hoveredChampionId);

  const isSynergisticOrCounter = (champId: string) => {
    if (!hoveredChamp) return false;
    
    if (isAlly) {
      // Check synergy
      for (const t1 of hoveredChamp.tags) {
        for (const t2 of (allChampions.find(c => c.id === champId)?.tags || [])) {
          const rule = SYNERGY_RULES.find(r => (r.tagA === t1 && r.tagB === t2) || (r.tagA === t2 && r.tagB === t1));
          if (rule && rule.score > 0) return true;
        }
      }
    } else {
      // Check counter
      if (!counterMatrix) return false;
      const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(hoveredChampionId) : null;
      if (!matrix) return false;
      const val = matrix.get ? matrix.get(champId) : matrix[champId];
      return val > 2;
    }
    return false;
  };

  const teamChampions = Object.values(teamData)
    .map(s => allChampions.find(c => c.id === s.championId))
    .filter((c): c is Champion => !!c);

  const opposingTeamChampions = Object.values(!isAlly ? ally : enemy)
    .map(s => allChampions.find(c => c.id === s.championId))
    .filter((c): c is Champion => !!c);

  const getBreakdown = (champId: string) => scoredChampions.find(s => s.championId === champId);

  const getTopCounters = (championId: string) => {
    if (!counterMatrix) return [];
    const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(championId) : null;
    if (!matrix) return [];
    
    // For a picked champion, "counters" means enemies they counter.
    // So if isAlly, target enemies. If !isAlly, target allies.
    const targetTeam = isAlly ? enemy : ally;
    const draftedOpponents = Object.values(targetTeam)
      .map(s => s.championId)
      .filter((id): id is string => !!id);

    if (draftedOpponents.length === 0) return [];

    return Array.from(matrix.entries())
      .map(([id, val]: any) => ({ id, val }))
      .filter((e: any) => draftedOpponents.includes(e.id) && e.val > 0)
      .sort((a: any, b: any) => b.val - a.val);
  };

  const getTopSynergies = (champion: Champion) => {
    // Synergies are with teammates.
    const targetTeam = isAlly ? ally : enemy;
    const draftedTeammates = Object.values(targetTeam)
      .map(s => s.championId)
      .filter((id): id is string => !!id && id !== champion.id);

    if (draftedTeammates.length === 0) return [];

    return allChampions
      .filter(c => draftedTeammates.includes(c.id))
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
    const targetTeam = isAlly ? enemy : ally;
    const draftedOpponents = Object.values(targetTeam)
      .map(s => s.championId)
      .filter((id): id is string => !!id);

    if (draftedOpponents.length === 0) return [];

    return draftedOpponents.map(oppId => {
       const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(oppId) : null;
       let val = 0;
       if (matrix && matrix.has(championId)) {
          val = matrix.get(championId);
       }
       return { id: oppId, val };
    }).filter(e => e.val > 0)
      .sort((a, b) => b.val - a.val);
  };

  // Metrics
  const avgDurability = teamChampions.reduce((acc, c) => acc + c.durabilityScore, 0) / (teamChampions.length || 1);
  const avgBurstable = teamChampions.reduce((acc, c) => acc + c.durabilityScore, 0) / (teamChampions.length || 1);
  const avgDamage = teamChampions.reduce((acc, c) => acc + (c.damageProfile.ad + c.damageProfile.ap), 0) / (teamChampions.length || 1);
  const avgCC = teamChampions.reduce((acc, c) => acc + c.ccScore, 0) / (teamChampions.length || 1);
  const avgThreat = teamChampions.reduce((acc, c) => acc + (c.engageScore + c.ccScore), 0) / (teamChampions.length || 1);
  const avgScaling = teamChampions.reduce((acc, c) => acc + c.scalingScore, 0) / (teamChampions.length || 1);

  const totalScore = teamChampions.reduce((acc, c) => acc + (getBreakdown(c.id)?.finalScore || 0), 0);
  const avgScore = teamChampions.length > 0 ? (totalScore / teamChampions.length) : 0;
  
  let grade = "D";
  if (avgScore >= 75) grade = "S+";
  else if (avgScore >= 68) grade = "S";
  else if (avgScore >= 60) grade = "A";
  else if (avgScore >= 52) grade = "B";
  else if (avgScore >= 44) grade = "C";


  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Headline & Bans */}
      <div className="space-y-3">
        <div className={cn("flex items-center gap-2", !isAlly && "flex-row-reverse")}>
            <div className={cn("h-6 w-1 rounded-full", isAlly ? "bg-blue-500" : "bg-red-500")} />
            <div className={cn("flex items-center gap-2", !isAlly && "flex-row-reverse")}>
                <h2 className="text-xl font-bold tracking-tight text-white">{isAlly ? "Ally Team" : "Enemy Team"}</h2>
                <TeamAnalysis 
                  side={side}
                  teamChampions={teamChampions}
                  opposingTeamChampions={opposingTeamChampions}
                  scoredChampions={scoredChampions}
                  allChampions={allChampions}
                  grade={grade}
                  totalScore={totalScore}
                />
            </div>
            <div className={cn(
              "flex items-center gap-2 border border-white/10 rounded px-2 py-0.5 shadow-inner scale-90 origin-left", 
              isAlly ? "ml-auto" : "mr-auto origin-right",
              settings.disableTransparency ? "bg-zinc-900" : "bg-black/15"
            )}>
               <span className={cn(
                 "text-lg font-black text-transparent bg-clip-text bg-gradient-to-r",
                 grade === "S+" || grade === "S" ? "from-yellow-400 to-orange-400" :
                 grade === "A" ? "from-emerald-400 to-emerald-600" :
                 grade === "B" ? "from-blue-400 to-blue-600" :
                 "from-zinc-400 to-zinc-600"
               )}>{grade}</span>
               <div className="w-px h-4 bg-white/10"></div>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <div className="flex items-baseline gap-1 cursor-help">
                            <span className="text-sm font-bold tracking-tight text-white">{totalScore.toFixed(1)}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent 
                        side="top" 
                        hideArrow={true}
                        className="px-2.5 py-1.5 bg-zinc-950/95 border border-white/10 rounded-lg text-[9.5px] font-bold text-zinc-100 whitespace-nowrap shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 translate-y-[-4px]"
                    >
                        TOTAL COMPOSITION POWER
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-950/95 border-r border-b border-white/10 rotate-45" />
                    </TooltipContent>
                </Tooltip>
                
                <div className="w-px h-4 bg-white/10"></div>

                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <div className="flex items-baseline gap-1 cursor-help">
                            <span className={cn("text-xs font-bold tracking-tight transition-colors", SCORE_COLORS(avgScore))}>
                                {avgScore.toFixed(1)}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent 
                        side="top" 
                        hideArrow={true}
                        className="px-2.5 py-1.5 bg-zinc-950/95 border border-white/10 rounded-lg text-[9.5px] font-bold text-zinc-100 whitespace-nowrap shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 translate-y-[-4px]"
                    >
                        AVERAGE POWER
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-950/95 border-r border-b border-white/10 rotate-45" />
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
        
        <div className="flex gap-2 h-14">
            {[...Array(5)].map((_, i) => {
                const champId = teamBans[i];
                const champ = allChampions.find(c => c.id === champId);
                const isBanStoreMode = useDraftStore.getState().isBanMode;
                const isActiveBanSlot = isBanStoreMode && focusedSide === side && i === teamBans.length;
                return (
                    <button key={i} 
                      onClick={(e) => {
                          e.stopPropagation();
                          if (!champ) {
                             useDraftStore.getState().toggleBanMode(true, side);
                          } else {
                             useDraftStore.getState().removeBan(side, champ.id);
                          }
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
            })}
        </div>
      </div>

      {/* Pick Slots */}
      <div className="flex flex-col gap-1.5">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = teamData[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const isFocused = focusedSide === side && focusedRole === role;
          const bd = champion ? getBreakdown(champion.id) : null;
          const highlighted = champion ? isSynergisticOrCounter(champion.id) : false;
          
          // Check if champion is a "pillar" for the hovered stat
          const isStatHighlight = hoveredStatMetric && champion && (champion as any)[hoveredStatMetric] >= 7.0;

          return (
            <div key={role} className="flex flex-col gap-1">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (champion) {
                      useDraftStore.getState().removePick(side, role);
                    } else {
                      setFocusedSlot(side, role); 
                    }
                  }}
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
                        : highlighted
                          ? isAlly 
                            ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            : "border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                          : "border-white/5 hover:border-zinc-500/20"
                  )}
                >
                  {isFocused && (
                     <motion.div
                       layoutId={`focus-indicator-${side}`}
                       className={cn("absolute inset-0 rounded-lg pointer-events-none border", isAlly ? "bg-blue-500/10 border-blue-500/50" : "bg-red-500/10 border-red-500/50")}
                       transition={{ type: "spring", bounce: 0.2, duration: settings.disableAnimations ? 0 : 0.6 }}
                     />
                  )}
                  {highlighted && (
                      <div className={cn("absolute top-0 p-1", isAlly ? "right-0" : "left-0")}>
                          {isAlly ? (
                            <Sparkles className={cn("w-2.5 h-2.5 text-emerald-500", !settings.disableAnimations && "animate-pulse")} />
                          ) : (
                            <Target className={cn("w-2.5 h-2.5 text-orange-500", !settings.disableAnimations && "animate-pulse")} />
                          )}
                      </div>
                  )}
                  <div className={cn(
                    "w-[76px] h-[76px] rounded-md border border-white/5 flex items-center justify-center overflow-hidden shrink-0 relative",
                    settings.disableTransparency ? "bg-zinc-900" : "bg-black/15 backdrop-blur-md"
                  )}>
                    {champion ? (
                      <>
                        <ChampionIcon 
                          name={champion.name} 
                          url={champion.iconUrl} 
                          className="w-full h-full" 
                        />
                        <div className={cn(
                          "absolute top-0 left-0 px-1 py-0.5 bg-black/90 rounded-br-md rounded-tl-sm border-r border-b border-white/10 shadow-sm z-10",
                          TIER_COLORS[champion.tier]?.split(" ")[0] || "text-zinc-500"
                        )}>
                          <span className="text-[8px] font-extrabold block leading-none">{champion.tier}</span>
                        </div>
                        {/* Damage Type Badge */}
                        <div className={cn(
                          "absolute bottom-0 right-0 px-1 py-0.5 bg-black/90 rounded-tl-md rounded-br-sm border-l border-t border-white/10 shadow-sm z-10 flex items-center justify-center",
                          getDamageType(champion.damageProfile).style
                        )}>
                          <span className={cn("text-[7px] font-black block leading-none", getDamageType(champion.damageProfile).textStyle)}>
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
                        {/* Line 1: Icon, Champ Name, Score, WR */}
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
                        
                        <div className={cn("flex items-center gap-2", !isAlly && "flex-row-reverse")}>
                           {(() => {
                             const syns = getTopSynergies(champion);
                             const ctrs = getTopCounters(champion.id);
                             const weaks = getTopWeaknesses(champion.id);
                             
                             return (
                               <>
                                 {syns.map(s => {
                                   const c = allChampions.find(champ => champ.id === s.id);
                                   return c ? (
                                     <div 
                                       key={c.id} 
                                       title={`Synergy: ${c.name}`} 
                                       className="w-5 h-5 rounded border border-emerald-500/50 shadow-[0_0_5px_rgba(16,185,129,0.2)] overflow-hidden cursor-help"
                                       onMouseEnter={() => setHoveredChampion(c.id)}
                                       onMouseLeave={() => setHoveredChampion(null)}
                                     >
                                       <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full" />
                                     </div>
                                   ) : null;
                                 })}
                                 
                                 {syns.length > 0 && (ctrs.length > 0 || weaks.length > 0) && (
                                   <div className="w-px h-2.5 bg-white/10 mx-0.5 self-center" />
                                 )}

                                 {ctrs.map(c => {
                                   const champ = allChampions.find(ch => ch.id === c.id);
                                   return champ ? (
                                     <div 
                                       key={champ.id} 
                                       title={`Counter: ${champ.name}`} 
                                       className="w-5 h-5 rounded border border-red-500/50 shadow-[0_0_5px_rgba(239,68,68,0.2)] overflow-hidden cursor-help"
                                       onMouseEnter={() => setHoveredChampion(champ.id)}
                                       onMouseLeave={() => setHoveredChampion(null)}
                                     >
                                       <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full" />
                                     </div>
                                   ) : null;
                                 })}

                                 {ctrs.length > 0 && weaks.length > 0 && (
                                   <div className="w-px h-2.5 bg-white/10 mx-0.5 self-center" />
                                 )}

                                 {weaks.map(c => {
                                   const champ = allChampions.find(ch => ch.id === c.id);
                                   return champ ? (
                                     <div 
                                       key={champ.id} 
                                       title={`Weakness: ${champ.name}`} 
                                       className="w-5 h-5 rounded border border-yellow-500/50 shadow-[0_0_5px_rgba(234,179,8,0.2)] overflow-hidden cursor-help"
                                       onMouseEnter={() => setHoveredChampion(champ.id)}
                                       onMouseLeave={() => setHoveredChampion(null)}
                                     >
                                       <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full" />
                                     </div>
                                   ) : null;
                                 })}
                               </>
                             );
                           })()}
                        </div>

                        {/* Line 3: Champion Traits */}
                        <div className={cn("flex flex-wrap gap-1", !isAlly && "flex-row-reverse")}>
                           {champion.tags.map(tag => {
                             const isTagHighlighted = hoveredStatMetric && METRIC_TAG_MAP[hoveredStatMetric]?.includes(tag);
                             return (
                               <span 
                                 key={tag} 
                                 className={cn(
                                   "text-[7px] font-black px-1 py-0.5 rounded transition-all duration-300",
                                   isTagHighlighted 
                                     ? isAlly 
                                       ? "bg-blue-500/20 text-blue-300 border border-blue-400/50 shadow-[0_0_8px_rgba(59,130,246,0.4)]" 
                                       : "bg-red-500/20 text-red-300 border border-red-400/50 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                     : "bg-white/5 text-zinc-500 border border-white/5"
                                 )}
                               >
                                 {formatTag(tag)}
                               </span>
                             );
                           })}
                        </div>
                      </>
                    ) : isFocused ? (
                       <span className={cn("text-sm font-bold truncate text-white", !settings.disableAnimations && "animate-pulse")}>
                         Selecting...
                       </span>
                    ) : null}
                  </div>
                </button>
            </div>
          );
        })}
        <TeamTacticalAnalysis side={side} />
      </div>

    </div>
  );
};
