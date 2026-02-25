"use client";

import React from "react";
import { ScoredChampion } from "@/types/scoring";
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
    <div className="flex flex-col bg-gray-900/95 border border-gray-700/30 rounded-lg shadow-sm overflow-hidden backdrop-blur-xl">
      {/* Header Stat Area */}
      <div className="p-4 border-b border-gray-700/30 bg-gray-800/40 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide truncate">{championName}</h3>
        <span className="text-lg font-bold text-blue-400 leading-none">{Math.round(finalScore)}</span>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {Object.entries(breakdown).map(([key, value]) => {
          const isRisk = key === "risk";
          const label = COMPONENT_LABELS[key] || key;
          
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-medium uppercase tracking-wide text-zinc-500">
                <span>{label}</span>
                <span className={cn("font-bold", isRisk ? "text-red-500" : "text-zinc-300")}>
                  {isRisk ? "-" : "+"}{Math.round(value)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-950 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    isRisk ? "bg-red-500/60" : "bg-blue-600"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Separator className="bg-gray-700/30" />

      {/* Structured Insights */}
      <div className="p-4 bg-gray-900/50">
        <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-2">Strategic Analysis</div>
        <div className="flex flex-col gap-2">
          {explanations.slice(0, 3).map((exp, i) => (
            <div key={i} className="flex gap-2 items-start">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 mt-1 shrink-0" />
               <p className="text-xs leading-relaxed text-zinc-400 font-normal">{exp}</p>
            </div>
          ))}
          {explanations.length === 0 && (
            <p className="text-xs text-zinc-700 italic">Analytical data insufficient for insights.</p>
          )}
        </div>
      </div>
    </div>
  );
};
