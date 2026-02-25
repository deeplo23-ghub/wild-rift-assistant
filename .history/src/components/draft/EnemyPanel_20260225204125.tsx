"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crosshair, 
  Trash2, 
  Flame, 
  Target, 
  Zap, 
  Waves, 
  Skull, 
  Eye, 
  Activity,
  ShieldAlert
} from "lucide-react";
import { cn, getRoleIcon } from "@/lib/utils";
import { ChampionIcon } from "./ChampionIcon";

const ROLE_LABELS = {
  [Role.Baron]: "Baron",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid",
  [Role.Dragon]: "Dragon",
  [Role.Support]: "Support",
};

export const EnemyPanel: React.FC = () => {
  const { 
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

  const isCountered = (champId: string) => {
    if (!hoveredChampionId || !counterMatrix) return false;
    const matrix = (counterMatrix as any).get ? (counterMatrix as any).get(hoveredChampionId) : null;
    if (!matrix) return false;
    const val = matrix.get ? matrix.get(champId) : matrix[champId];
    return val > 2;
  };

  const teamChampions = Object.values(enemy)
    .map(s => allChampions.find(c => c.id === s.championId))
    .filter((c): c is Champion => !!c);

  const getBreakdown = (champId: string) => scoredChampions.find(s => s.championId === champId);

  // Damage Profile Calculations
  const totalAD = teamChampions.reduce((acc, c) => acc + c.damageProfile.ad, 0);
  const totalAP = teamChampions.reduce((acc, c) => acc + c.damageProfile.ap, 0);
  const totalTrue = teamChampions.reduce((acc, c) => acc + c.damageProfile.true, 0);
  const totalDamageSum = totalAD + totalAP + totalTrue || 1;

  const adPercent = (totalAD / totalDamageSum) * 100;
  const apPercent = (totalAP / totalDamageSum) * 100;
  const truePercent = (totalTrue / totalDamageSum) * 100;

  // Threat Metrics
  const avgBurstable = teamChampions.reduce((acc, c) => acc + c.durabilityScore, 0) / (teamChampions.length || 1);
  const avgScaling = teamChampions.reduce((acc, c) => acc + c.scalingScore, 0) / (teamChampions.length || 1);
  const avgThreat = teamChampions.reduce((acc, c) => acc + (c.engageScore + c.ccScore), 0) / (teamChampions.length || 1);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Enemy Headline & Bans */}
      <div className="space-y-3">
        <div className="flex items-center justify-end gap-2">
            <h2 className="text-xl font-black capitalize tracking-tighter text-white font-sans">Enemy Team</h2>
            <div className="h-6 w-1 bg-red-500/80 rounded-full" />
        </div>
        
        <div className="flex flex-row-reverse gap-1.5 h-12">
            {[...Array(5)].map((_, i) => {
                const champId = bans.enemy[i];
                const champ = allChampions.find(c => c.id === champId);
                return (
                    <div key={i} className="flex-1 rounded border border-white/5 bg-black/10 overflow-hidden relative group">
                        {champ ? (
                            <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full opacity-40" grayscale />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10">
                                <Trash2 className="w-3 h-3 text-white" />
                            </div>
                        )}
                        {champ && (
                           <div className="absolute inset-x-0 bottom-0 py-0.5 bg-zinc-700 text-[6px] font-black text-center text-white capitalize italic">Discarded</div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      {/* Pick Slots */}
      <div className="flex flex-col gap-1.5">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = enemy[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const isFocused = focusedSide === TeamSide.Enemy && focusedRole === role;
          const bd = champion ? getBreakdown(champion.id) : null;
          const countered = champion ? isCountered(champion.id) : false;

          return (
            <div key={role} className="flex flex-col gap-1">
                <button 
                  onClick={() => setFocusedSlot(TeamSide.Enemy, role)}
                  className={cn(
                    "relative flex flex-row-reverse items-center w-full gap-3 p-2 rounded-lg border transition-all duration-300 text-right overflow-hidden",
                    isFocused 
                      ? "border-red-500/80 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                      : countered
                        ? "border-orange-500/50 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                        : "border-white/5 bg-zinc-900/40 hover:border-red-500/20"
                  )}
                >
                  {countered && (
                      <div className="absolute top-0 left-0 p-1">
                          <Target className="w-2.5 h-2.5 text-orange-500 animate-pulse" />
                      </div>
                  )}
                  <div className="w-10 h-10 rounded-md bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {champion ? (
                      <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full grayscale group-hover:grayscale-0 transition-all" />
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
                  
                  <div className="flex flex-col flex-1 min-w-0 items-end">
                    <div className="flex flex-row-reverse items-center gap-1.5 mb-0.5">
                       <img src={getRoleIcon(role)} className="w-2.5 h-2.5 object-contain brightness-200 opacity-40 shrink-0" alt={role} />
                       <span className="text-[8px] font-black text-red-500/80 capitalize tracking-widest leading-none">
                         {ROLE_LABELS[role]}
                       </span>
                    </div>
                    <span className="text-sm font-bold text-zinc-100 truncate">
                      {champion ? champion.name : isFocused ? "Selecting..." : "---"}
                    </span>
                  </div>

                  {champion && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePick(TeamSide.Enemy, role); }}
                      className="p-1 px-1.5 rounded bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </button>

                {/* Individual Breakdown */}
                {champion && bd && (
                    <div className="mx-2 p-2 bg-black/5 border-x border-b border-white/5 rounded-b-lg grid grid-cols-4 gap-2">
                         <div className="flex flex-col items-center">
                            <span className="text-[7px] font-black text-zinc-600 capitalize">Thr</span>
                            <span className="text-[10px] font-bold text-red-400">{Math.round(bd.breakdown.threat)}</span>
                        </div>
                        <div className="flex flex-col items-center border-x border-white/5">
                            <span className="text-[7px] font-black text-zinc-600 capitalize">Ctr</span>
                            <span className="text-[10px] font-bold text-orange-400">{Math.round(bd.breakdown.counter)}</span>
                        </div>
                        <div className="flex flex-col items-center border-r border-white/5">
                            <span className="text-[7px] font-black text-zinc-600 capitalize">Base</span>
                            <span className="text-[10px] font-bold text-zinc-400">{Math.round(bd.breakdown.base)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] font-black text-zinc-600 capitalize">Flex</span>
                            <span className="text-[10px] font-bold text-emerald-400">{Math.round(bd.breakdown.flexibility)}</span>
                        </div>
                    </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Threat Intel / Analytics */}
      <Card className="mt-2 border-white/5 bg-zinc-900/80 backdrop-blur-xl overflow-hidden flex-1 shadow-2xl">
        <div className="bg-red-500/10 p-3 border-b border-red-500/10 text-right">
            <h3 className="flex items-center justify-end gap-2 text-[10px] font-black capitalize tracking-widest text-red-400/80">
                Threat Analysis <ShieldAlert className="w-3 h-3" />
            </h3>
        </div>
        <CardContent className="p-4 space-y-4">
            {/* Composition Bars */}
            <div className="space-y-3">
               <div className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-black capitalize text-zinc-500 flex-row-reverse">
                       <div className="flex gap-2 flex-row-reverse">
                           <span className="text-orange-500">AD {Math.round(adPercent)}%</span>
                           <span className="text-blue-400">AP {Math.round(apPercent)}%</span>
                           {truePercent > 5 && <span className="text-yellow-500">True {Math.round(truePercent)}%</span>}
                       </div>
                       <span>Damage Profile</span>
                   </div>
                   <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex flex-row-reverse">
                       <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${adPercent}%` }} />
                       <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${apPercent}%` }} />
                       <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${truePercent}%` }} />
                   </div>
               </div>
               <div className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-black capitalize text-zinc-500">
                       <span>Target Scalability</span>
                       <span>{Math.round(avgScaling * 10)}%</span>
                   </div>
                   <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${avgScaling * 10}%` }} />
                   </div>
               </div>
               <div className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-black capitalize text-zinc-500">
                       <span>Effective Health</span>
                       <span>{Math.round(avgBurstable * 10)}%</span>
                   </div>
                   <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-zinc-700 transition-all duration-1000" style={{ width: `${avgBurstable * 10}%` }} />
                   </div>
               </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-black/5 rounded border border-white/5 flex flex-col gap-1 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[8px] font-black text-zinc-500 capitalize">Volatility</span>
                        <Zap className="w-2.5 h-2.5 text-red-500/80" />
                    </div>
                    <span className="text-sm font-black text-zinc-100">High</span>
                </div>
                <div className="p-2 bg-black/5 rounded border border-white/5 flex flex-col gap-1 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[8px] font-black text-zinc-500 capitalize">Control</span>
                        <Waves className="w-2.5 h-2.5 text-blue-500/80" />
                    </div>
                    <span className="text-sm font-black text-zinc-100">Balanced</span>
                </div>
                <div className="p-2 bg-black/5 rounded border border-white/5 flex flex-col gap-1 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[8px] font-black text-zinc-500 capitalize">Win Condition</span>
                        <Target className="w-2.5 h-2.5 text-yellow-500" />
                    </div>
                    <span className="text-sm font-black text-zinc-100">Objectives</span>
                </div>
                <div className="p-2 bg-black/5 rounded border border-white/5 flex flex-col gap-1 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[8px] font-black text-zinc-500 capitalize">Threat Level</span>
                        <Skull className="w-2.5 h-2.5 text-zinc-500" />
                    </div>
                    <span className="text-sm font-black text-zinc-100 font-mono italic underline decoration-red-950 decoration-4">S-Tier</span>
                </div>
            </div>
            
            <div className="p-3 bg-zinc-800/40 border border-white/5 rounded-lg flex items-center gap-3">
                <Eye className="w-4 h-4 text-zinc-400 shrink-0" />
                <p className="text-[9px] text-zinc-400 leading-tight">
                    Engine detects a heavy AD-centric early game focus. Target armor items and prioritize Baron lane stability.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
