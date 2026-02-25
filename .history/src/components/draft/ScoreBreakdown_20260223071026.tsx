"use client";

import React from "react";
import { ScoredChampion } from "@/types/scoring";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Info, Sparkles, TrendingUp, ShieldAlert, Target, Zap, Activity, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreBreakdownProps {
  scoredChampion: ScoredChampion;
  championName: string;
}

const COMPONENT_ICONS = {
  base: TrendingUp,
  synergy: Sparkles,
  counter: Target,
  composition: Zap,
  threat: ShieldAlert,
  flexibility: Activity,
  risk: Waves,
};

const COMPONENT_LABELS = {
  base: "Base Meta",
  synergy: "Team Synergy",
  counter: "Counter Power",
  composition: "Comp Fit",
  threat: "Survival",
  flexibility: "Flex Tier",
  risk: "Risk Factors",
};

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scoredChampion, championName }) => {
  const { finalScore, breakdown, explanations } = scoredChampion;

  return (
    <div className="flex flex-col h-full bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Header Stat */}
      <div className="p-5 pb-4 bg-gradient-to-br from-blue-500/10 to-transparent">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Engine Analysis</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/20">
             <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
             <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Live</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-bold text-white tracking-tight">{championName}</h3>
          <div className="text-right">
            <span className="text-2xl font-black text-white leading-none tracking-tighter">{Math.round(finalScore)}</span>
            <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Score</span>
          </div>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* Components */}
      <div className="p-5 flex-1 overflow-hidden flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3.5">
          {Object.entries(breakdown).map(([key, value]) => {
            const Icon = COMPONENT_ICONS[key as keyof typeof COMPONENT_ICONS];
            const isRisk = key === "risk";
            
            return (
              <div key={key} className="group flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-3 h-3 transition-colors", isRisk ? "text-red-500" : "text-zinc-500 group-hover:text-blue-400")} />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.1em]">
                      {COMPONENT_LABELS[key as keyof typeof COMPONENT_LABELS]}
                    </span>
                  </div>
                  <span className={cn("text-[10px] font-black shrink-0", isRisk ? "text-red-400" : "text-blue-400")}>
                    {isRisk ? "-" : "+"}{Math.round(value)}
                  </span>
                </div>
                <div className="relative h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      isRisk ? "bg-red-500/50" : "bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    )}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="flex-1 flex flex-col min-h-0 bg-white/[0.03] rounded-xl border border-white/[0.05] p-3">
          <div className="flex items-center gap-2 mb-3">
             <Info className="w-3 h-3 text-zinc-500" />
             <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em]">Strategic Insight</span>
          </div>
          <ScrollArea className="flex-1 pr-2">
            <div className="flex flex-col gap-2.5">
              {explanations.map((exp, i) => (
                <p key={i} className="text-[11px] leading-relaxed text-zinc-400 font-medium">
                  {exp}
                </p>
              ))}
              {explanations.length === 0 && (
                <p className="text-[10px] text-zinc-600 italic">Computing strategic benefits...</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
