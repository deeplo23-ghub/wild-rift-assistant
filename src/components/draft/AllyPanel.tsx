"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trash2, 
  Brain, 
  Sword, 
  Wind, 
  Scale, 
  AlertTriangle,
  Sparkles
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

export const AllyPanel: React.FC = () => {
  const { 
    ally, 
    allChampions, 
    focusedSide, 
    focusedRole, 
    setFocusedSlot, 
    removePick,
    scoredChampions,
    bans,
    hoveredChampionId 
  } = useDraftStore();

  const hoveredChamp = allChampions.find(c => c.id === hoveredChampionId);

  const isSynergistic = (champId: string) => {
    if (!hoveredChamp) return false;
    const teamChamp = allChampions.find(c => c.id === champId);
    if (!teamChamp) return false;

    for (const t1 of hoveredChamp.tags) {
        for (const t2 of teamChamp.tags) {
            const rule = SYNERGY_RULES.find(r => (r.tagA === t1 && r.tagB === t2) || (r.tagA === t2 && r.tagB === t1));
            if (rule && rule.score > 0) return true;
        }
    }
    return false;
  };

  const teamChampions = Object.values(ally)
    .map(s => allChampions.find(c => c.id === s.championId))
    .filter((c): c is Champion => !!c);

  const getBreakdown = (champId: string) => scoredChampions.find(s => s.championId === champId);

  // Composition Metrics (Simplified simulation or real aggregation)
  const avgDurability = teamChampions.reduce((acc, c) => acc + c.durabilityScore, 0) / (teamChampions.length || 1);
  const avgDamage = teamChampions.reduce((acc, c) => acc + (c.damageProfile.ad + c.damageProfile.ap), 0) / (teamChampions.length || 1);
  const avgCC = teamChampions.reduce((acc, c) => acc + c.ccScore, 0) / (teamChampions.length || 1);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Ally Headline & Bans */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-blue-500/80 rounded-full" />
            <h2 className="text-xl font-black capitalize tracking-tighter text-white font-sans">Ally Team</h2>
        </div>
        
        <div className="flex gap-1.5 h-12">
            {[...Array(5)].map((_, i) => {
                const champId = bans.ally[i];
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
                           <div className="absolute inset-x-0 bottom-0 py-0.5 bg-red-500/80 text-[6px] font-black text-center text-white capitalize">Banned</div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      {/* Pick Slots */}
      <div className="flex flex-col gap-1.5">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = ally[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const isFocused = focusedSide === TeamSide.Ally && focusedRole === role;
          const bd = champion ? getBreakdown(champion.id) : null;
          const synergistic = champion ? isSynergistic(champion.id) : false;

          return (
            <div key={role} className="flex flex-col gap-1">
                <button 
                  onClick={() => setFocusedSlot(TeamSide.Ally, role)}
                  className={cn(
                    "relative flex items-center w-full gap-3 p-2 rounded-lg border transition-all duration-300 text-left overflow-hidden",
                    isFocused 
                      ? "border-blue-500/80 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                      : synergistic
                        ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "border-white/5 bg-zinc-900/40 hover:border-blue-500/20"
                  )}
                >
                  {synergistic && (
                      <div className="absolute top-0 right-0 p-1">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                      </div>
                  )}
                  <div className="w-10 h-10 rounded-md bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {champion ? (
                      <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full" />
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
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                       <img src={getRoleIcon(role)} className="w-2.5 h-2.5 object-contain brightness-200 opacity-40 shrink-0" alt={role} />
                       <span className="text-[8px] font-black text-blue-500/80 capitalize tracking-widest leading-none">
                         {ROLE_LABELS[role]}
                       </span>
                    </div>
                    <span className="text-sm font-bold text-zinc-100 truncate">
                      {champion ? champion.name : isFocused ? "Selecting..." : "---"}
                    </span>
                  </div>

                  {champion && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePick(TeamSide.Ally, role); }}
                      className="p-1 px-1.5 rounded bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </button>

                {/* Individual Breakdown (Density Hack) */}
                {champion && bd && (
                    <div className="mx-2 p-2 bg-black/5 border-x border-b border-white/5 rounded-b-lg grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] font-black text-zinc-600 capitalize">Syn</span>
                            <span className="text-[10px] font-bold text-blue-400">{Math.round(bd.breakdown.synergy)}</span>
                        </div>
                        <div className="flex flex-col items-center border-x border-white/5">
                            <span className="text-[7px] font-black text-zinc-600 capitalize">Comp</span>
                            <span className="text-[10px] font-bold text-indigo-400">{Math.round(bd.breakdown.composition)}</span>
                        </div>
                        <div className="flex flex-col items-center border-r border-white/5">
                            <span className="text-[7px] font-black text-zinc-600 capitalize">Flex</span>
                            <span className="text-[10px] font-bold text-emerald-400">{Math.round(bd.breakdown.flexibility)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] font-black text-zinc-600 capitalize">Risk</span>
                            <span className="text-[10px] font-bold text-red-400">-{Math.round(bd.breakdown.risk)}</span>
                        </div>
                    </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Team Intel / Analytics */}
      <Card className="mt-2 border-white/5 bg-zinc-900/80 backdrop-blur-xl overflow-hidden flex-1 shadow-2xl">
        <div className="bg-blue-500/10 p-3 border-b border-blue-500/10">
            <h3 className="flex items-center gap-2 text-[10px] font-black capitalize tracking-widest text-blue-400/80">
                <Brain className="w-3 h-3" /> Team Intelligence
            </h3>
        </div>
        <CardContent className="p-4 space-y-4">
            {/* Composition Bars */}
            <div className="space-y-3">
               <div className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-black capitalize text-zinc-500">
                       <span>Offensive Power</span>
                       <span>{Math.round(avgDamage * 10)}%</span>
                   </div>
                   <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500/80 transition-all duration-1000" style={{ width: `${avgDamage * 10}%` }} />
                   </div>
               </div>
               <div className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-black capitalize text-zinc-500">
                       <span>Sustainability</span>
                       <span>{Math.round(avgDurability * 10)}%</span>
                   </div>
                   <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${avgDurability * 10}%` }} />
                   </div>
               </div>
               <div className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-black capitalize text-zinc-500">
                       <span>Lockdown / CC</span>
                       <span>{Math.round(avgCC * 10)}%</span>
                   </div>
                   <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${avgCC * 10}%` }} />
                   </div>
               </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-black/5 rounded border border-white/5 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <Sword className="w-2.5 h-2.5 text-blue-500/80" />
                        <span className="text-[8px] font-black text-zinc-500 capitalize">Synergy</span>
                    </div>
                    <span className="text-sm font-black text-zinc-100">Exceptional</span>
                </div>
                <div className="p-2 bg-black/5 rounded border border-white/5 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <Scale className="w-2.5 h-2.5 text-zinc-500" />
                        <span className="text-[8px] font-black text-zinc-500 capitalize">Balance</span>
                    </div>
                    <span className="text-sm font-black text-zinc-100">Hybrid</span>
                </div>
                <div className="p-2 bg-black/5 rounded border border-white/5 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-2.5 h-2.5 text-orange-500" />
                        <span className="text-[8px] font-black text-zinc-500 capitalize">Risk Level</span>
                    </div>
                    <span className="text-sm font-black text-zinc-100">Moderate</span>
                </div>
                <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <Wind className="w-2.5 h-2.5 text-blue-300" />
                        <span className="text-[8px] font-black text-zinc-500 capitalize">Scaling</span>
                    </div>
                    <span className="text-sm font-black text-zinc-100">Late Core</span>
                </div>
            </div>

            {/* Warnings / Insights */}
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                <p className="text-[9px] text-red-200/60 leading-relaxed italic">
                    <span className="font-black text-red-500/80 mr-1 capitalize">Warning:</span>
                    Current composition lacks reliable disengage and magic resistance. Vulnerable to dive-heavy burst comps.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
