"use client";

import React from "react";
import { ScoredChampion } from "@/types/scoring";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ScoreBreakdownProps {
  scoredChampion: ScoredChampion;
  championName: string;
}

const COMPONENT_LABELS: Record<string, string> = {
  base: "Base",
  synergy: "Synergy",
  counter: "Counter",
  composition: "Comp",
  threat: "Survival",
  flexibility: "Flex",
  risk: "Risk",
};

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scoredChampion, championName }) => {
  const { finalScore, breakdown, explanations } = scoredChampion;

  return (
    <div className="flex flex-col bg-zinc-950/95 border border-zinc-800 rounded shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header Stat Area */}
      <div className="p-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
        <h3 className="text-[11px] font-black text-white uppercase tracking-tight truncate">{championName}</h3>
        <span className="text-sm font-black text-blue-400 leading-none">{Math.round(finalScore)}</span>
      </div>

      {/* Metrics Grid */}
      <div className="p-2 grid grid-cols-2 gap-x-3 gap-y-2">
        {Object.entries(breakdown).map(([key, value]) => {
          const isRisk = key === "risk";
          const label = COMPONENT_LABELS[key] || key;
          
          return (
            <div key={key} className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-zinc-500">
                <span>{label}</span>
                <span className={isRisk ? "text-red-500" : "text-zinc-300"}>
                  {isRisk ? "-" : "+"}{Math.round(value)}
                </span>
              </div>
              <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    isRisk ? "bg-red-500/40" : "bg-blue-600"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Structured Insights */}
      <div className="p-2 bg-zinc-950/50">
        <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Strategic Context</div>
        <div className="flex flex-col gap-1">
          {explanations.slice(0, 3).map((exp, i) => (
            <div key={i} className="flex gap-1.5 items-start">
               <div className="w-1 h-1 rounded-full bg-blue-500/50 mt-1 shrink-0" />
               <p className="text-[9px] leading-tight text-zinc-400 font-medium">{exp}</p>
            </div>
          ))}
          {explanations.length === 0 && (
            <p className="text-[9px] text-zinc-700 italic">No significant insights detected.</p>
          )}
        </div>
      </div>
    </div>
  );
};
