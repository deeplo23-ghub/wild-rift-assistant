"use client";

import React from "react";
import { ScoredChampion } from "@/types/scoring";
import { cn } from "@/lib/utils";
import { Swords, Users, ShieldAlert, Cpu } from "lucide-react";

interface ScoreBreakdownProps {
  scoredChampion: ScoredChampion;
  championName: string;
}

const COMPONENT_LABELS: Record<string, string> = {
  base: "Raw Analytics",
  synergy: "Strategic Sync",
  counter: "Threat Response",
  composition: "Comp Optimization",
  threat: "Environmental Survival",
  flexibility: "Flex Protocol",
  risk: "Volatility Index",
};

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scoredChampion, championName }) => {
  const { finalScore, breakdown, explanations, matchUps } = scoredChampion;

  return (
    <div className="flex flex-col bg-gray-950 border border-gray-800 rounded-none shadow-none overflow-hidden font-sans">
      {/* Primary Intelligence Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between rounded-none">
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Combat Entity</span>
            <h3 className="text-sm font-black text-gray-100 uppercase tracking-tight truncate">{championName}</h3>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Draft Score</span>
            <span className={cn(
                "text-2xl font-black leading-none",
                finalScore >= 80 ? "text-emerald-400" : finalScore >= 50 ? "text-amber-400" : "text-red-500"
            )}>
                {Math.round(finalScore)}
            </span>
        </div>
      </div>

      {/* Component Matrix */}
      <div className="p-4 grid grid-cols-2 gap-4 bg-gray-950">
        {Object.entries(breakdown).map(([key, value]) => {
          const isRisk = key === "risk";
          const label = COMPONENT_LABELS[key] || key;
          
          return (
            <div key={key} className="flex flex-col gap-1.5 rounded-none">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-600 tracking-tighter">
                <span>{label}</span>
                <span className={cn("font-black", isRisk ? "text-gray-400" : "text-gray-200")}>
                  {isRisk ? "−" : "+"}{Math.round(value)}
                </span>
              </div>
              <div className="h-1 w-full bg-gray-900 rounded-none overflow-hidden border border-gray-800/40">
                <div 
                  className={cn(
                    "h-full transition-none",
                    isRisk ? "bg-gray-700" : "bg-gray-400"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-[1px] bg-gray-900 mx-4" />

      {/* Strategic Relationship Grid */}
      <div className="p-4 grid grid-cols-1 gap-4 bg-gray-950">
        <div className="space-y-3">
            {/* SYNERGY */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    <Users className="w-3 h-3" />
                    <span>Combat Synergy</span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {matchUps.synergizesWith.length > 0 ? (
                        matchUps.synergizesWith.map(name => (
                            <span key={name} className="px-1.5 py-0.5 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-[10px] font-bold">
                                {name}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-gray-700 italic">No direct synergy detected.</span>
                    )}
                </div>
            </div>

            {/* COUNTERS */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    <Swords className="w-3 h-3" />
                    <span>Direct Neutralization</span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {matchUps.counters.length > 0 ? (
                        matchUps.counters.map(name => (
                            <span key={name} className="px-1.5 py-0.5 bg-amber-950/30 border border-amber-900/40 text-amber-400 text-[10px] font-bold">
                                {name}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-gray-700 italic">No targets prioritized.</span>
                    )}
                </div>
            </div>

            {/* WEAK AGAINST */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Tactical Vulnerabilities</span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {matchUps.weakAgainst.length > 0 ? (
                        matchUps.weakAgainst.map(name => (
                            <span key={name} className="px-1.5 py-0.5 bg-red-950/30 border border-red-900/40 text-red-400 text-[10px] font-bold">
                                {name}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-gray-700 italic">Exposed vectors: None.</span>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Logic Summary */}
      <div className="p-4 bg-gray-900/20 border-t border-gray-900">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">
            <Cpu className="w-3 h-3" />
            <span>Operational Context</span>
        </div>
        <div className="flex flex-col gap-2">
            {explanations.slice(0, 3).map((exp, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <div className="w-1 h-3 bg-gray-800 mt-1 shrink-0" />
                    <p className="text-[11px] leading-tight text-gray-400 font-medium italic">{exp}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
