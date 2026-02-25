"use client";

import React from "react";
import { ScoredChampion } from "@/types/scoring";
import { cn } from "@/lib/utils";

interface ScoreBreakdownProps {
  scoredChampion: ScoredChampion;
  championName: string;
}

const COMPONENT_LABELS: Record<string, string> = {
  base: "Raw Power",
  synergy: "Team Sync",
  counter: "Counter",
  composition: "Comp fit",
  threat: "Survival",
  flexibility: "Flex",
  risk: "Risk",
};

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scoredChampion, championName }) => {
  const { finalScore, breakdown, explanations } = scoredChampion;

  return (
    <div className="flex flex-col bg-gray-950 border border-gray-700 rounded-none shadow-none overflow-hidden font-sans">
      {/* Metrics Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-900 flex items-center justify-between rounded-none">
        <h3 className="text-sm font-bold text-gray-100 uppercase tracking-normal truncate">{championName}</h3>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-500 uppercase leading-none mb-1">Draft Score</span>
            <span className="text-lg font-black text-gray-100 leading-none">{Math.round(finalScore)}</span>
        </div>
      </div>

      {/* Logic Metrics Grid */}
      <div className="p-3 grid grid-cols-2 gap-3 bg-gray-950">
        {Object.entries(breakdown).map(([key, value]) => {
          const isRisk = key === "risk";
          const label = COMPONENT_LABELS[key] || key;
          
          return (
            <div key={key} className="flex flex-col gap-1 rounded-none">
              <div className="flex justify-between items-center text-xs font-semibold uppercase text-gray-500">
                <span>{label}</span>
                <span className={cn("font-bold", isRisk ? "text-gray-400" : "text-gray-100")}>
                  {isRisk ? "-" : "+"}{Math.round(value)}
                </span>
              </div>
              <div className="h-1 w-full bg-gray-900 rounded-none overflow-hidden border border-gray-800/50">
                <div 
                  className={cn(
                    "h-full transition-none",
                    isRisk ? "bg-gray-600" : "bg-gray-400"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-[1px] bg-gray-800 mx-3" />

      {/* Strategic Context Output */}
      <div className="p-3 bg-gray-950 space-y-2">
        <div className="text-xs font-bold text-gray-600 uppercase tracking-tight">Strategic Intelligence</div>
        <div className="flex flex-col gap-1.5">
          {explanations.slice(0, 3).map((exp, i) => (
            <div key={i} className="flex gap-2 items-start group">
               <div className="w-1 h-3 bg-gray-700 mt-0.5 shrink-0" />
               <p className="text-xs leading-snug text-gray-400 font-medium">{exp}</p>
            </div>
          ))}
          {explanations.length === 0 && (
            <p className="text-xs text-gray-700 italic">Analytical trace insufficient for insight generation.</p>
          )}
        </div>
      </div>
    </div>
  );
};
