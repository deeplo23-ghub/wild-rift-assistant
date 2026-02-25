"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
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
  Activity
} from "lucide-react";
import { cn, getRoleIcon } from "@/lib/utils";
import { SYNERGY_RULES } from "@/lib/data/tags";
import { ChampionIcon } from "./ChampionIcon";

const ROLE_LABELS = {
  [Role.Baron]: "Baron",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid",
  [Role.Dragon]: "Dragon",
  [Role.Support]: "Support",
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
    counterMatrix
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
      .sort((a: any, b: any) => b.val - a.val)
      .slice(0, 4);
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
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
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
  if (avgScore >= 85) grade = "S+";
  else if (avgScore >= 75) grade = "S";
  else if (avgScore >= 65) grade = "A";
  else if (avgScore >= 55) grade = "B";
  else if (avgScore >= 45) grade = "C";


  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Headline & Bans */}
      <div className="space-y-3">
        <div className={cn("flex items-center gap-2", !isAlly && "flex-row-reverse")}>
            <div className={cn("h-6 w-1 rounded-full", isAlly ? "bg-blue-500" : "bg-red-500")} />
            <h2 className="text-xl font-bold tracking-tight text-white">{isAlly ? "Ally Team" : "Enemy Team"}</h2>
            {teamChampions.length > 0 && (
               <div className={cn("flex items-center gap-2 border border-white/10 bg-black/40 rounded px-2 py-0.5 shadow-inner scale-90 origin-left", isAlly ? "ml-auto" : "mr-auto flex-row-reverse origin-right")}>
                  <span className={cn(
                    "text-lg font-black text-transparent bg-clip-text bg-gradient-to-r",
                    grade === "S+" || grade === "S" ? "from-yellow-400 to-orange-400" :
                    grade === "A" ? "from-emerald-400 to-emerald-600" :
                    grade === "B" ? "from-blue-400 to-blue-600" :
                    "from-zinc-400 to-zinc-600"
                  )}>{grade}</span>
                  <div className="w-px h-4 bg-white/10"></div>
                  <div className={cn("flex items-baseline gap-1", !isAlly && "flex-row-reverse")}>
                      <span className="text-sm font-bold tracking-tight text-white">{Math.round(totalScore)}</span>
                      <span className="text-[10px] text-zinc-500">/500</span>
                  </div>
                  <div className="w-px h-4 bg-white/10"></div>
                  <div className={cn("flex items-baseline gap-1", !isAlly && "flex-row-reverse")}>
                      <span className="text-xs font-bold tracking-tight text-cyan-400">{Math.round(avgScore)}</span>
                      <span className="text-[8px] text-zinc-500 uppercase">Avg</span>
                  </div>
               </div>
            )}
        </div>
        
        <div className={cn("flex gap-2 h-14", !isAlly && "flex-row-reverse")}>
            {[...Array(5)].map((_, i) => {
                const champId = teamBans[i];
                const champ = allChampions.find(c => c.id === champId);
                const isBanStoreMode = useDraftStore.getState().isBanMode;
                const isActiveBanSlot = isBanStoreMode && focusedSide === side && i === teamBans.length;
                return (
                    <button key={i} 
                      onClick={(e) => {
                          e.stopPropagation();
                          if (isBanStoreMode && i === teamBans.length) {
                             useDraftStore.getState().toggleBanMode(true); // ensure it's on
                          }
                      }}
                      className={cn(
                        "flex-1 rounded-md border overflow-hidden relative group transition-all duration-300 w-full h-full text-left",
                        champ ? "border-white/10 bg-black/40" : "border-white/5 bg-zinc-900/50",
                        isActiveBanSlot ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] scale-[1.05] z-10 animate-pulse bg-red-500/10" : ""
                    )}>
                        {champ ? (
                            <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full opacity-60" grayscale />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                <Trash2 className={cn("w-4 h-4", isActiveBanSlot ? "text-red-500 opacity-100" : "text-zinc-500")} />
                            </div>
                        )}
                        {champ && (
                           <div className={cn(
                             "absolute inset-x-0 bottom-0 py-0.5 text-[7px] font-bold text-center text-white italic",
                             isAlly ? "bg-red-500/80" : "bg-zinc-700/80"
                           )}>
                             {isAlly ? "Banned" : "Discarded"}
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

          return (
            <div key={role} className="flex flex-col gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setFocusedSlot(side, role); }}
                  className={cn(
                    "relative flex items-center w-full gap-3 p-2 rounded-lg border transition-all duration-300 text-left overflow-hidden",
                    !isAlly && "flex-row-reverse text-right",
                    isFocused 
                      ? cn(borderColor, bgColor, shadowColor)
                      : highlighted
                        ? isAlly 
                          ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                          : "border-orange-500/50 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                        : "border-white/5 bg-zinc-900/40 hover:border-zinc-500/20"
                  )}
                >
                  {highlighted && (
                      <div className={cn("absolute top-0 p-1", isAlly ? "right-0" : "left-0")}>
                          {isAlly ? (
                            <Sparkles className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                          ) : (
                            <Target className="w-2.5 h-2.5 text-orange-500 animate-pulse" />
                          )}
                      </div>
                  )}
                  <div className="w-10 h-10 rounded-md bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {champion ? (
                      <ChampionIcon 
                        name={champion.name} 
                        url={champion.iconUrl} 
                        className={cn("w-full h-full", !isAlly && "grayscale group-hover:grayscale-0 transition-all")} 
                      />
                    ) : (
                      <img 
                        src={getRoleIcon(role)} 
                        alt={role} 
                        className={cn(
                          "w-6 h-6 object-contain opacity-20",
                          isFocused && "opacity-60 animate-pulse brightness-200"
                        )} 
                      />
                    )}
                  </div>
                  
                  <div className={cn("flex flex-col flex-1 min-w-0", !isAlly && "items-end")}>
                    <div className={cn("flex items-center gap-1.5 mb-0.5", !isAlly && "flex-row-reverse")}>
                       <img src={getRoleIcon(role)} className="w-2.5 h-2.5 object-contain brightness-200 opacity-40 shrink-0" alt={role} />
                       <span className={cn("text-[8px] font-bold uppercase tracking-widest leading-none", labelColor)}>
                         {ROLE_LABELS[role]}
                       </span>
                    </div>
                    {champion ? (
                      <div className={cn("flex flex-col", !isAlly && "items-end")}>
                        <span className="text-sm font-bold text-zinc-100 truncate leading-none mb-1">{champion.name}</span>
                        {bd && (
                          <div className={cn("flex gap-2 min-w-0 text-[10px] font-bold mb-1", !isAlly && "flex-row-reverse")}>
                            <span className="text-emerald-400">{champion.winrate.toFixed(1)}% WR</span>
                            <span className="text-cyan-400">Score: {Math.round(bd.finalScore)}</span>
                          </div>
                        )}
                        <div className={cn("flex gap-2", !isAlly && "flex-row-reverse")}>
                             {isAlly ? (
                                <>
                                  <div className={cn("flex items-center gap-1", !isAlly && "flex-row-reverse")}>
                                      <span className="text-[7px] font-bold text-emerald-500 uppercase">Syn:</span>
                                      <div className={cn("flex gap-0.5", !isAlly && "flex-row-reverse")}>
                                          {getTopSynergies(champion).slice(0, 4).map(s => {
                                              const c = allChampions.find(champ => champ.id === s.id);
                                              return c ? <ChampionIcon key={c.id} name={c.name} url={c.iconUrl} className="w-3.5 h-3.5 rounded border border-white/10" /> : null;
                                          })}
                                      </div>
                                  </div>
                                  <div className={cn("flex items-center gap-1", !isAlly && "flex-row-reverse")}>
                                      <span className="text-[7px] font-bold text-orange-500 uppercase">Ctr:</span>
                                      <div className={cn("flex gap-0.5", !isAlly && "flex-row-reverse")}>
                                          {getTopCounters(champion.id).slice(0, 4).map(c => {
                                              const champ = allChampions.find(ch => ch.id === c.id);
                                              return champ ? <ChampionIcon key={champ.id} name={champ.name} url={champ.iconUrl} className="w-3.5 h-3.5 rounded border border-white/10" /> : null;
                                          })}
                                      </div>
                                  </div>
                                </>
                             ) : (
                                <>
                                  <div className={cn("flex items-center gap-1", !isAlly && "flex-row-reverse")}>
                                      <span className="text-[7px] font-bold text-orange-500 uppercase">Ctr:</span>
                                      <div className={cn("flex gap-0.5", !isAlly && "flex-row-reverse")}>
                                          {getTopCounters(champion.id).slice(0, 4).map(c => {
                                              const champ = allChampions.find(ch => ch.id === c.id);
                                              return champ ? <ChampionIcon key={champ.id} name={champ.name} url={champ.iconUrl} className="w-3.5 h-3.5 rounded border border-white/10" /> : null;
                                          })}
                                      </div>
                                  </div>
                                  <div className={cn("flex items-center gap-1", !isAlly && "flex-row-reverse")}>
                                      <span className="text-[7px] font-bold text-emerald-500 uppercase">Syn:</span>
                                      <div className={cn("flex gap-0.5", !isAlly && "flex-row-reverse")}>
                                          {getTopSynergies(champion).slice(0, 4).map(s => {
                                              const c = allChampions.find(champ => champ.id === s.id);
                                              return c ? <ChampionIcon key={c.id} name={c.name} url={c.iconUrl} className="w-3.5 h-3.5 rounded border border-white/10" /> : null;
                                          })}
                                      </div>
                                  </div>
                                </>
                             )}
                        </div>
                      </div>
                    ) : (
                       <span className={cn("text-sm font-bold truncate", isFocused ? "text-white animate-pulse" : "text-zinc-500")}>
                         {isFocused ? "Selecting..." : "---"}
                       </span>
                    )}
                  </div>

                  {champion && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePick(side, role); }}
                      className="p-1 px-1.5 rounded bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </button>
            </div>
          );
        })}
      </div>

      {/* Team Intelligence Card */}
      <Card className="mt-2 border-white/5 bg-zinc-900/80 backdrop-blur-xl overflow-hidden flex-1 shadow-2xl flex flex-col">
        <div className={cn("p-3 border-b border-white/10 flex justify-between items-center", bgColor, !isAlly && "flex-row-reverse")}>
            <h3 className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", labelColor)}>
                {isAlly ? <Brain className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                {isAlly ? "Team Intelligence" : "Threat Analysis"}
            </h3>
        </div>
        <CardContent className="p-4 space-y-4 font-sans">
            {/* Composition Bars */}
            <div className="space-y-3">
               <div className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-bold uppercase text-zinc-500">
                       <span>{isAlly ? "Offensive Power" : "Offensive Pressure"}</span>
                       <span>{Math.round((isAlly ? avgDamage * 10 : avgThreat * 5))}%</span>
                   </div>
                   <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div 
                        className={cn("h-full transition-all duration-1000", isAlly ? "bg-blue-500" : "bg-red-600")} 
                        style={{ width: `${(isAlly ? avgDamage * 10 : avgThreat * 5)}%` }} 
                       />
                   </div>
               </div>
               <div className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-bold uppercase text-zinc-500">
                       <span>{isAlly ? "Sustainability" : "Target Scalability"}</span>
                       <span>{Math.round((isAlly ? avgDurability * 10 : avgScaling * 10))}%</span>
                   </div>
                   <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div 
                        className={cn("h-full transition-all duration-1000", isAlly ? "bg-indigo-500" : "bg-orange-600")} 
                        style={{ width: `${(isAlly ? avgDurability * 10 : avgScaling * 10)}%` }} 
                       />
                   </div>
               </div>
               <div className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-bold uppercase text-zinc-500">
                       <span>{isAlly ? "Lockdown / CC" : "Effective Health"}</span>
                       <span>{Math.round((isAlly ? avgCC * 10 : avgBurstable * 10))}%</span>
                   </div>
                   <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div 
                        className={cn("h-full transition-all duration-1000", isAlly ? "bg-emerald-500" : "bg-zinc-700")} 
                        style={{ width: `${(isAlly ? avgCC * 10 : avgBurstable * 10)}%` }} 
                       />
                   </div>
               </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 gap-2">
                {isAlly ? (
                  <>
                    <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <Sword className="w-2.5 h-2.5 text-blue-500" />
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Synergy</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-100">Exceptional</span>
                    </div>
                    <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <Scale className="w-2.5 h-2.5 text-zinc-500" />
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Balance</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-100">Hybrid</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-1 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Volatility</span>
                            <Zap className="w-2.5 h-2.5 text-red-500" />
                        </div>
                        <span className="text-sm font-bold text-zinc-100">High</span>
                    </div>
                    <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-1 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Control</span>
                            <Waves className="w-2.5 h-2.5 text-blue-500" />
                        </div>
                        <span className="text-sm font-bold text-zinc-100">Balanced</span>
                    </div>
                  </>
                )}
                
                {isAlly ? (
                  <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-2.5 h-2.5 text-orange-500" />
                          <span className="text-[8px] font-bold text-zinc-500 uppercase">Risk Level</span>
                      </div>
                      <span className="text-sm font-bold text-zinc-100">Moderate</span>
                  </div>
                ) : (
                  <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-1 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[8px] font-bold text-zinc-500 uppercase">Win Condition</span>
                          <Target className="w-2.5 h-2.5 text-yellow-500" />
                      </div>
                      <span className="text-sm font-bold text-zinc-100">Objectives</span>
                  </div>
                )}

                {isAlly ? (
                  <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                          <Wind className="w-2.5 h-2.5 text-blue-300" />
                          <span className="text-[8px] font-bold text-zinc-500 uppercase">Scaling</span>
                      </div>
                      <span className="text-sm font-bold text-zinc-100">Late Core</span>
                  </div>
                ) : (
                  <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-1 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[8px] font-bold text-zinc-500 uppercase">Threat Level</span>
                          <Skull className="w-2.5 h-2.5 text-zinc-500" />
                      </div>
                      <span className="text-sm font-bold text-zinc-100 italic">S-Tier</span>
                  </div>
                )}
            </div>

            {/* Insight Box */}
            <div className={cn("p-3 rounded-lg flex items-center gap-3 border", isAlly ? "bg-red-500/5 border-red-500/10" : "bg-zinc-800/40 border-white/5")}>
                {isAlly ? null : <Eye className="w-4 h-4 text-zinc-400 shrink-0" />}
                <p className={cn("text-[9px] leading-relaxed italic", isAlly ? "text-red-200/60" : "text-zinc-400")}>
                    {isAlly ? (
                      <>
                        <span className="font-bold text-red-500 mr-1 uppercase">Warning:</span>
                        Current composition lacks reliable disengage and magic resistance. Vulnerable to dive-heavy burst comps.
                      </>
                    ) : (
                      "Engine detects a heavy AD-centric early game focus. Target armor items and prioritize Baron lane stability."
                    )}
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
