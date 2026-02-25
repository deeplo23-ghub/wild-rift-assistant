"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { TeamSide } from "@/types/draft";
import { Role } from "@/types/champion";
import { cn, getRoleIcon } from "@/lib/utils";
import { useTeamLogic } from "@/hooks/useTeamLogic";
import { ChampionIcon } from "./ChampionIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShieldCheck, Sword, Activity, Target, Sparkles as SparklesIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ROLE_LABELS: Record<Role, string> = {
  [Role.Baron]: "Baron",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid",
  [Role.Dragon]: "Duo",
  [Role.Support]: "Support"
};

interface TeamPanelProps {
  side: TeamSide;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ side }) => {
  const { slots, metrics } = useTeamLogic(side);
  const store = useDraftStore();
  const isAlly = side === TeamSide.Ally;

  const hoveredChamp = store.allChampions.find(c => c.id === store.hoveredChampionId);

  const getHighlightType = (champId: string | null) => {
    if (!champId || !hoveredChamp) return null;
    const teamChamp = store.allChampions.find(c => c.id === champId);
    if (!teamChamp) return null;

    // Check synergy (Ally side)
    if (isAlly) {
        for (const t1 of hoveredChamp.tags) {
            for (const t2 of teamChamp.tags) {
                const rule = SYNERGY_RULES.find(r => (r.tagA === t1 && r.tagB === t2) || (r.tagA === t2 && r.tagB === t1));
                if (rule && rule.score > 0) return "synergy";
            }
        }
    }

    // Check counter (Enemy side)
    if (!isAlly && store.counterMatrix) {
        const matrix = (store.counterMatrix as any).get ? (store.counterMatrix as any).get(hoveredChamp.id) : null;
        if (matrix) {
            const val = matrix.get ? matrix.get(champId) : matrix[champId];
            if (val > 2) return "counter";
        }
    }

    return null;
  };

  return (
    <div className={cn(
      "flex flex-col gap-6 h-full p-6",
      isAlly ? "bg-zinc-950/20 border-r border-white/5" : "bg-zinc-950/20 border-l border-white/5"
    )}>
      {/* Headline & Bans */}
      <div className={cn("flex flex-col gap-4", !isAlly && "items-end")}>
        <div className={cn("flex items-center gap-3", !isAlly && "flex-row-reverse")}>
            <div className={cn("h-7 w-1 rounded-full", isAlly ? "bg-blue-500" : "bg-red-500")} />
            <h2 className="text-2xl font-bold tracking-tighter text-white">
              {isAlly ? "Ally Team" : "Enemy Team"}
            </h2>
        </div>
        
        <div className={cn("flex gap-2", !isAlly && "flex-row-reverse")}>
            {Array.from({ length: 5 }).map((_, i) => {
                const banId = store.bans[side][i];
                const champ = store.allChampions.find(c => c.id === banId);
                const isFocused = store.isBanMode && store.focusedSide === side && store.bans[side].length === i;

                return (
                    <TooltipProvider key={i} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => store.toggleBanMode(true) || store.setFocusedSlot(side, null)}
                            className={cn(
                              "w-11 h-11 rounded-xl border transition-all cursor-pointer flex items-center justify-center overflow-hidden",
                              isFocused ? (isAlly ? "border-blue-500 bg-blue-500/10 animate-pulse" : "border-red-500 bg-red-500/10 animate-pulse") : "border-white/5 bg-zinc-900/40 hover:border-white/10"
                            )}
                          >
                            {champ ? (
                              <div className="relative w-full h-full group">
                                <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full opacity-30 grayscale" />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); store.removeBan(side, champ.id); }}
                                  className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                >
                                  <Trash2 className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-700 font-bold tracking-widest">{i + 1}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-zinc-900 border-white/10 text-zinc-300 font-bold text-xs">
                          {champ ? `Banned: ${champ.name}` : "Empty Ban Slot"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
      </div>

      {/* Picks */}
      <div className="flex flex-col gap-3">
        {slots.map(({ role, championId }) => {
          const champion = store.allChampions.find(c => c.id === championId);
          const isFocused = !store.isBanMode && store.focusedSide === side && store.focusedRole === role;
          const highlight = getHighlightType(championId);
          
          return (
            <Card 
              key={role}
              onClick={() => store.setFocusedSlot(side, role)}
              className={cn(
                "cursor-pointer transition-all duration-300 border bg-zinc-900/30 hover:bg-zinc-900/50 group overflow-hidden rounded-xl",
                isFocused 
                  ? (isAlly ? "border-blue-500/50 ring-1 ring-blue-500/20" : "border-red-500/50 ring-1 ring-red-500/20")
                  : highlight === "synergy"
                    ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                    : highlight === "counter"
                      ? "border-orange-500/40 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.05)]"
                      : "border-white/5"
              )}
            >
              <CardContent className={cn("p-2.5 flex items-center gap-4", !isAlly && "flex-row-reverse")}>
                <div className="relative w-11 h-11 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                  {champion ? (
                    <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full" />
                  ) : (
                    <img 
                      src={getRoleIcon(role)} 
                      alt={role} 
                      className={cn(
                        "w-5 h-5 object-contain opacity-20 transition-all",
                        isFocused && (isAlly ? "opacity-60 brightness-200" : "opacity-60 brightness-150")
                      )} 
                    />
                  )}
                </div>

                <div className={cn("flex flex-col flex-1 min-w-0", !isAlly && "items-end")}>
                  <div className={cn("flex items-center gap-2 mb-0.5", !isAlly && "flex-row-reverse")}>
                    <span className={cn(
                      "text-[10px] font-bold tracking-tight",
                      isAlly ? "text-blue-500" : "text-red-500"
                    )}>
                      {ROLE_LABELS[role]}
                    </span>
                    {champion?.tier && (
                      <Badge variant="outline" className="text-[9px] h-3.5 px-1.5 border-white/10 text-zinc-500 bg-white/5 font-black uppercase">
                        {champion.tier}
                      </Badge>
                    )}
                  </div>
                  <h4 className={cn(
                    "text-sm font-bold truncate transition-colors capitalize",
                    champion ? "text-zinc-100" : "text-zinc-600"
                  )}>
                    {champion ? champion.name : isFocused ? "Selecting..." : "Available Slot"}
                  </h4>
                </div>

                {champion && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); store.removePick(side, role); }}
                     className="p-2 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics */}
      <div className="mt-auto pt-8 border-t border-white/5 flex flex-col gap-6">
        <div className={cn("flex justify-between items-end px-1", !isAlly && "flex-row-reverse")}>
          <div className={cn("flex flex-col", !isAlly && "items-end")}>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1.5 font-sans">
              {isAlly ? "Team Assessment" : "Threat Assessment"}
            </span>
            <h3 className="text-2xl font-bold tracking-tighter text-white capitalize">
              {metrics?.composition || "Evaluation Pending"}
            </h3>
          </div>
          {metrics && (
            <div className={cn("text-right", isAlly ? "text-right" : "text-left")}>
              <span className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Win Probability</span>
              <span className={cn("text-2xl font-black leading-none italic tracking-tighter", isAlly ? "text-blue-500" : "text-red-500")}>
                {Math.round(metrics.avgWinrate)}%
              </span>
            </div>
          )}
        </div>

        {metrics && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Sword, label: "Engage", val: metrics.totals.engage, col: isAlly ? "bg-blue-500" : "bg-red-500" },
              { icon: ShieldCheck, label: "Tank", val: metrics.totals.durability, col: isAlly ? "bg-blue-500" : "bg-red-500" },
              { icon: Activity, label: "Crowd", val: metrics.totals.cc, col: isAlly ? "bg-blue-500" : "bg-red-500" }
            ].map((m, i) => (
              <div key={i} className="bg-zinc-900/60 rounded-xl p-3 border border-white/5 flex flex-col items-center shadow-lg">
                <m.icon className="w-3.5 h-3.5 text-zinc-500 mb-2" />
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-1.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (m.val / 40) * 100)}%` }}
                    className={cn("h-full", m.col)} 
                  />
                </div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{m.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
