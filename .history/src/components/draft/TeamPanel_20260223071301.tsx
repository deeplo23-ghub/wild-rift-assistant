"use client";

import React, { useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { X, ShieldAlert, Swords, Zap, Activity } from "lucide-react";
import { analyzeTeam } from "@/lib/scoring/analytics";
import { Progress } from "@/components/ui/progress";

interface TeamPanelProps {
  side: TeamSide;
}

const ROLES = [Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support];

export const TeamPanel: React.FC<TeamPanelProps> = ({ side }) => {
  const { 
    [side]: teamPicks, 
    bans, 
    allChampions, 
    focusedSide, 
    focusedRole, 
    setFocusedSlot, 
    removePick,
    removeBan
  } = useDraftStore();

  const teamChampions = useMemo(() => 
    ROLES.map(r => allChampions.find(c => c.id === teamPicks[r].championId)).filter((c): c is Champion => !!c)
  , [teamPicks, allChampions]);

  const analytics = useMemo(() => analyzeTeam(teamChampions), [teamChampions]);

  const isEnemy = side === TeamSide.Enemy;
  const accentColor = isEnemy ? "text-red-500" : "text-blue-500";
  const accentBorder = isEnemy ? "border-red-500/30" : "border-blue-500/30";
  const accentBg = isEnemy ? "bg-red-500/10" : "bg-blue-500/10";

  return (
    <div className="flex flex-col h-full gap-4 py-2">
      {/* Ban Slots (Top) - Blind Mode Style */}
      <div className={cn("grid grid-cols-5 gap-2 px-1", isEnemy && "flex-row-reverse")}>
        {[...Array(5)].map((_, i) => {
          const banId = bans[side][i];
          const banChamp = allChampions.find(c => c.id === banId);
          const isFocused = focusedSide === side && focusedRole === null;

          return (
            <button
              key={`ban-${i}`}
              onClick={() => setFocusedSlot(side, null)}
              className={cn(
                "relative aspect-square rounded-md border transition-all overflow-hidden",
                banChamp ? "border-red-900/50 bg-zinc-900" : "border-white/5 bg-white/[0.02] hover:border-white/10",
                isFocused && !banChamp && "border-red-500/50 bg-red-500/5"
              )}
            >
              {banChamp ? (
                <>
                  <img src={banChamp.iconUrl} className="h-full w-full object-cover grayscale opacity-40" alt="" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-500/50" onClick={(e) => { e.stopPropagation(); removeBan(side, banChamp.id); }} />
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShieldAlert className="w-3 h-3 text-white/5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Role slots */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {ROLES.map((role) => {
          const slot = teamPicks[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const isFocused = focusedSide === side && focusedRole === role;

          return (
            <button
              key={role}
              onClick={() => {
                if (champion) removePick(side, role);
                setFocusedSlot(side, role);
              }}
              className={cn(
                "relative flex items-center w-full gap-3 p-2.5 rounded-xl border transition-all duration-200",
                isFocused 
                  ? cn("shadow-lg", accentBorder, accentBg) 
                  : "border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
              )}
            >
              {/* Champion Mini Icon */}
              <div className="relative h-10 w-10 shrink-0 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden">
                {champion ? (
                  <img src={champion.iconUrl} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className={cn("w-3 h-3 rounded-full border-2", isFocused ? accentColor.replace('text', 'border') : "border-zinc-800")} />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{role}</span>
                <span className={cn("text-xs font-bold truncate", champion ? "text-white" : "text-zinc-600")}>
                  {champion ? champion.name : isFocused ? "Selecting..." : "Available"}
                </span>
              </div>

              {champion && (
                <div className="text-right pr-1">
                  <div className={cn("text-[10px] font-black leading-none", accentColor)}>
                    {Math.round(champion.winrate)}%
                  </div>
                  <div className="text-[7px] font-bold text-zinc-600 uppercase">WR</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Team Analytics */}
      <div className="mt-auto p-4 space-y-4 rounded-2xl bg-white/[0.02] border border-white/[0.03]">
        {/* Power Meter */}
        <div className="space-y-1.5">
           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-400">
              <span>Overall Draft Power</span>
              <span className={accentColor}>{Math.round(analytics.overallPower)}</span>
           </div>
           <Progress value={analytics.overallPower} className="h-1 bg-zinc-900" indicatorClassName={cn("bg-current", accentColor.replace('text', 'bg'))} />
        </div>

        {/* Damage Blend */}
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <span className="text-[8px] font-black uppercase text-zinc-500">AD Ratio</span>
              <div className="text-xs font-bold text-blue-400">{Math.round(analytics.damageProfile.ad * 100)}%</div>
           </div>
           <div className="space-y-1 text-right">
              <span className="text-[8px] font-black uppercase text-zinc-500">AP Ratio</span>
              <div className="text-xs font-bold text-purple-400">{Math.round(analytics.damageProfile.ap * 100)}%</div>
           </div>
        </div>

        {/* Gaps / Advice */}
        {analytics.composition.gaps.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-[9px] font-black uppercase text-zinc-500 flex items-center gap-1.5">
               <ShieldAlert className="w-3 h-3" /> Vulnerabilities
            </span>
            <div className="flex flex-wrap gap-1">
              {analytics.composition.gaps.map(gap => (
                <span key={gap} className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[8px] font-bold uppercase border border-red-500/10">
                  {gap}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
