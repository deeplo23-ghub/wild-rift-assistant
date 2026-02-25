"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChampionIcon } from "./ChampionIcon";
import {
  Shield,
  Zap,
  ShieldAlert,
  Crosshair,
  TrendingUp,
  Timer,
  Move,
  Heart,
  Flame,
  Swords
} from "lucide-react";

const STAT_METRICS = [
  { key: "durabilityScore", label: "Toughness", icon: Shield, color: "bg-zinc-500", allyColor: "bg-blue-500", enemyColor: "bg-red-500" },
  { key: "engageScore", label: "Engage", icon: Zap, color: "bg-yellow-500", allyColor: "bg-blue-500", enemyColor: "bg-red-500" },
  { key: "peelScore", label: "Peel", icon: ShieldAlert, color: "bg-blue-400", allyColor: "bg-blue-500", enemyColor: "bg-red-500" },
  { key: "ccScore", label: "Control", icon: Crosshair, color: "bg-purple-500", allyColor: "bg-blue-500", enemyColor: "bg-red-500" },
  { key: "scalingScore", label: "Scaling", icon: TrendingUp, color: "bg-emerald-500", allyColor: "bg-blue-500", enemyColor: "bg-red-500" },
  { key: "earlyGameScore", label: "Early Pressure", icon: Timer, color: "bg-red-500", allyColor: "bg-blue-500", enemyColor: "bg-red-500" },
  { key: "mobilityScore", label: "Mobility", icon: Move, color: "bg-cyan-500", allyColor: "bg-blue-500", enemyColor: "bg-red-500" },
  { key: "utilityScore", label: "Utility", icon: Heart, color: "bg-pink-500", allyColor: "bg-blue-500", enemyColor: "bg-red-500" },
  { key: "waveclearScore", label: "Waveclear", icon: Flame, color: "bg-orange-500", allyColor: "bg-blue-500", enemyColor: "bg-red-500" },
];

export function MatchupAnalysis() {
  const { ally, enemy, allChampions, settings } = useDraftStore();

  const getTeamChampions = (team: Record<Role, { championId: string | null }>) => {
    return Object.values(team)
      .map(slot => allChampions.find(c => c.id === slot.championId))
      .filter((c): c is Champion => !!c);
  };

  const allyChamps = getTeamChampions(ally);
  const enemyChamps = getTeamChampions(enemy);

  const calculateAverage = (champs: Champion[], key: string) => {
    if (champs.length === 0) return 0;
    const sum = champs.reduce((acc, c) => {
        if (key === "utilityScore") {
            return acc + (c.healingScore + c.shieldScore) / 2;
        }
        return acc + ((c as any)[key] || 0);
    }, 0);
    return sum / champs.length;
  };

  const calculateDamageMix = (champs: Champion[]) => {
    const totalAD = champs.reduce((acc, c) => acc + c.damageProfile.ad, 0);
    const totalAP = champs.reduce((acc, c) => acc + c.damageProfile.ap, 0);
    const totalTrue = champs.reduce((acc, c) => acc + c.damageProfile.true, 0);
    const total = totalAD + totalAP + totalTrue || 1;
    return {
      ad: (totalAD / total) * 100,
      ap: (totalAP / total) * 100,
      truePct: (totalTrue / total) * 100
    };
  };

  const allyDamage = calculateDamageMix(allyChamps);
  const enemyDamage = calculateDamageMix(enemyChamps);

  return (
    <div className={cn(
      "h-full flex flex-col border border-white/5 rounded-xl overflow-hidden",
      settings.disableTransparency ? "bg-zinc-950" : "bg-black/20 backdrop-blur-xl"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20">
        <div className="flex flex-col items-start gap-1">
            <span className="text-xl font-black text-blue-500 uppercase tracking-tighter">Ally Sync</span>
            <div className="flex -space-x-2">
                {allyChamps.map(c => (
                    <div key={c.id} className="w-8 h-8 rounded-full border border-black overflow-hidden shadow-md">
                        <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full" />
                    </div>
                ))}
            </div>
        </div>
        
        <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">VS</span>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] mt-1">Matchup Analysis</span>
        </div>

        <div className="flex flex-col items-end gap-1">
            <span className="text-xl font-black text-red-500 uppercase tracking-tighter">Enemy Sync</span>
            <div className="flex -space-x-2 flex-row-reverse space-x-reverse">
                {enemyChamps.map(c => (
                    <div key={c.id} className="w-8 h-8 rounded-full border border-black overflow-hidden shadow-md group">
                        <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full grayscale group-hover:grayscale-0 transition-all" />
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Damage Profiles */}
          <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                  <Swords className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Damage Profile Difference</h3>
              </div>
              <div className="flex gap-8 items-center justify-between">
                {/* Ally Damage */}
                <div className="flex-1 space-y-2">
                   <div className="h-4 w-full flex rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div style={{ width: `${allyDamage.ad}%` }} className="bg-orange-500 h-full transition-all" />
                        <div style={{ width: `${allyDamage.ap}%` }} className="bg-blue-500 h-full transition-all" />
                        <div style={{ width: `${allyDamage.truePct}%` }} className="bg-white h-full transition-all" />
                   </div>
                   <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                      <span>AD: {Math.round(allyDamage.ad)}%</span>
                      <span>AP: {Math.round(allyDamage.ap)}%</span>
                      <span>True: {Math.round(allyDamage.truePct)}%</span>
                   </div>
                </div>
                {/* Enemy Damage */}
                <div className="flex-1 space-y-2">
                   <div className="h-4 w-full flex flex-row-reverse rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div style={{ width: `${enemyDamage.ad}%` }} className="bg-orange-500 h-full transition-all" />
                        <div style={{ width: `${enemyDamage.ap}%` }} className="bg-blue-500 h-full transition-all" />
                        <div style={{ width: `${enemyDamage.truePct}%` }} className="bg-white h-full transition-all" />
                   </div>
                   <div className="flex justify-between flex-row-reverse text-[10px] font-bold text-zinc-500">
                      <span>AD: {Math.round(enemyDamage.ad)}%</span>
                      <span>AP: {Math.round(enemyDamage.ap)}%</span>
                      <span>True: {Math.round(enemyDamage.truePct)}%</span>
                   </div>
                </div>
              </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Stat Comparisons */}
          <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Team Parametrics</h3>
              </div>
              {STAT_METRICS.map(metric => {
                  const allyVal = calculateAverage(allyChamps, metric.key);
                  const enemyVal = calculateAverage(enemyChamps, metric.key);
                  const maxVal = 10;
                  
                  const diff = allyVal - enemyVal;
                  const absDiff = Math.abs(diff);
                  const advantage = diff > 0.5 ? "blue" : diff < -0.5 ? "red" : "neutral";

                  return (
                      <div key={metric.key} className="flex items-center gap-4">
                          <div className="flex-1 flex flex-col items-end gap-1">
                              <span className={cn(
                                "text-lg font-black",
                                advantage === "blue" ? "text-blue-400" : "text-zinc-500"
                              )}>{allyVal.toFixed(1)}</span>
                              <div className="w-full flex justify-end">
                                <div className="h-2 rounded-l-full bg-blue-500/20 w-full max-w-[150px] relative overflow-hidden">
                                     <div 
                                        className="absolute right-0 top-0 bottom-0 bg-blue-500 transition-all rounded-l-full" 
                                        style={{ width: `${(allyVal / maxVal) * 100}%` }} 
                                     />
                                </div>
                              </div>
                          </div>
                          
                          <div className="w-28 flex flex-col items-center justify-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border",
                                advantage === "blue" ? "border-blue-500 bg-blue-500/10" :
                                advantage === "red" ? "border-red-500 bg-red-500/10" :
                                "border-white/10 bg-white/5"
                              )}>
                                <metric.icon className={cn(
                                    "w-4 h-4",
                                    advantage === "blue" ? "text-blue-500" :
                                    advantage === "red" ? "text-red-500" :
                                    "text-zinc-500"
                                )} />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">{metric.label}</span>
                          </div>

                          <div className="flex-1 flex flex-col items-start gap-1">
                              <span className={cn(
                                "text-lg font-black",
                                advantage === "red" ? "text-red-400" : "text-zinc-500"
                              )}>{enemyVal.toFixed(1)}</span>
                              <div className="w-full flex justify-start">
                                <div className="h-2 rounded-r-full bg-red-500/20 w-full max-w-[150px] relative overflow-hidden">
                                     <div 
                                        className="absolute left-0 top-0 bottom-0 bg-red-500 transition-all rounded-r-full" 
                                        style={{ width: `${(enemyVal / maxVal) * 100}%` }} 
                                     />
                                </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
}
