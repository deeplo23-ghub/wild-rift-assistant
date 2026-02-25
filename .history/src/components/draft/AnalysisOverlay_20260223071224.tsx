"use client";

import React from "react";
import { ScoredChampion, ScoreComponent } from "@/types/scoring";
import { Champion, Role } from "@/types/champion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, Sparkles, Target, Zap, 
  ShieldAlert, Activity, Waves, Info 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisOverlayProps {
  scoredChampion: ScoredChampion;
  champion: Champion;
  allies: Champion[];
  enemies: Champion[];
}

const COMPONENT_META = {
  [ScoreComponent.Base]: { label: "Base Meta", icon: TrendingUp, color: "text-blue-400" },
  [ScoreComponent.Synergy]: { label: "Synergy", icon: Sparkles, color: "text-purple-400" },
  [ScoreComponent.Counter]: { label: "Counter", icon: Target, color: "text-red-400" },
  [ScoreComponent.Composition]: { label: "Comp Fit", icon: Zap, color: "text-amber-400" },
  [ScoreComponent.Threat]: { label: "Survival", icon: ShieldAlert, color: "text-emerald-400" },
  [ScoreComponent.Flexibility]: { label: "Flex Tier", icon: Activity, color: "text-cyan-400" },
  [ScoreComponent.Risk]: { label: "Risk", icon: Waves, color: "text-orange-400" },
};

export const AnalysisOverlay: React.FC<AnalysisOverlayProps> = ({ 
  scoredChampion, 
  champion,
  allies,
  enemies
}) => {
  const { finalScore, breakdown, explanations } = scoredChampion;

  return (
    <div className="w-80 flex flex-col bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden pointer-events-none">
      {/* Header */}
      <div className="p-4 bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Deep Analysis</span>
          <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-400 font-bold">
            Score: {Math.round(finalScore)}
          </Badge>
        </div>
        <h3 className="text-lg font-bold text-white">{champion.name}</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 gap-2.5">
          {Object.entries(breakdown).map(([key, value]) => {
            const meta = COMPONENT_META[key as ScoreComponent];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-3 h-3", meta.color)} />
                    <span className="text-[9px] font-black uppercase text-zinc-400">{meta.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-white">{Math.round(value)}</span>
                </div>
                <Progress value={value} className="h-1 bg-zinc-900" indicatorClassName={cn("bg-current", meta.color.replace('text-', 'bg-'))} />
              </div>
            );
          })}
        </div>

        <Separator className="bg-white/5" />

        {/* Insights Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-3 h-3 text-zinc-500" />
            <span className="text-[9px] font-black uppercase text-zinc-500">Insights</span>
          </div>
          <div className="flex flex-col gap-2">
            {explanations.slice(0, 3).map((exp, i) => (
              <p key={i} className="text-[11px] text-zinc-400 leading-relaxed pl-2 border-l border-white/5">
                {exp}
              </p>
            ))}
          </div>
        </div>

        {/* Relationship Context */}
        {enemies.length > 0 && (
          <div className="pt-2 border-t border-white/5">
             <span className="text-[9px] font-black uppercase text-zinc-500 block mb-2">Matchup Context</span>
             <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-zinc-400">
                {/* Logic for specific counters/weaknesses would go here */}
                {enemies.map(e => (
                  <span key={e.id} className="px-1.5 py-0.5 bg-white/5 rounded">Vs {e.name}</span>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
