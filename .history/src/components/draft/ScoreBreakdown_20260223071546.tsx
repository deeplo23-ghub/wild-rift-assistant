"use client";

import React from "react";
import { ScoredChampion } from "@/types/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Sparkles, TrendingUp, ShieldAlert, Target, Zap, Waves, Activity } from "lucide-react";

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
  base: "Base Strength",
  synergy: "Ally Synergy",
  counter: "Enemy Counter",
  composition: "Team Comp",
  threat: "Threat Mitigation",
  flexibility: "Flexibility",
  risk: "Risk Factors",
};

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scoredChampion, championName }) => {
  const { finalScore, breakdown, explanations } = scoredChampion;

  return (
    <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-500 uppercase tracking-widest leading-none mb-1">
              Engine Breakdown
            </span>
            <span className="text-xl font-bold text-white">{championName}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black text-blue-400 leading-none">{Math.round(finalScore)}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">DRAFT POWER</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Component Scores */}
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(breakdown).map(([key, value]) => {
            const Icon = COMPONENT_ICONS[key as keyof typeof COMPONENT_ICONS];
            const isPenalty = key === "risk";
            
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3 h-3 ${isPenalty ? "text-red-500" : "text-slate-400"}`} />
                    <span className={isPenalty ? "text-red-500" : "text-slate-400"}>
                      {COMPONENT_LABELS[key as keyof typeof COMPONENT_LABELS]}
                    </span>
                  </div>
                  <span className={isPenalty ? "text-red-400" : "text-blue-400"}>
                    {isPenalty ? "-" : ""}{Math.round(value)}
                  </span>
                </div>
                <Progress 
                  value={value} 
                  className={`h-1 bg-zinc-800 ${isPenalty ? "text-red-500" : "text-blue-500"}`} 
                />
              </div>
            );
          })}
        </div>

        {/* Explanations */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-300 uppercase tracking-widest">
            <Info className="w-3.5 h-3.5" />
            Strategic Insights
          </div>
          <ScrollArea className="flex-1 pr-4">
            <div className="flex flex-col gap-2">
              {explanations.map((exp, i) => (
                <div 
                  key={i}
                  className="p-3 text-xs leading-relaxed text-slate-400 bg-white/5 rounded-lg border border-white/5"
                >
                  {exp}
                </div>
              ))}
              {explanations.length === 0 && (
                <p className="text-xs text-slate-600 italic">No specific insights available for this selection.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
