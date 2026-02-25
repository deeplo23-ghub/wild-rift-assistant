"use client";

import React from "react";
import { ScoredChampion, ScoreComponent } from "@/types/scoring";
import { Champion, CounterMatrix } from "@/types/champion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, Sparkles, Target, Zap, 
  ShieldAlert, Activity, Waves, Info,
  ChevronRight, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisOverlayProps {
  scoredChampion: ScoredChampion;
  champion: Champion;
  allies: Champion[];
  enemies: Champion[];
  counterMatrix: CounterMatrix | null;
}

const COMPONENT_META = {
  [ScoreComponent.Base]: { label: "Base Meta", icon: TrendingUp, color: "text-blue-400" },
  [ScoreComponent.Synergy]: { label: "Synergy", icon: Sparkles, color: "text-purple-400" },
  [ScoreComponent.Counter]: { label: "Counter", icon: Target, color: "text-red-400" },
  [ScoreComponent.Composition]: { label: "Comp Fit", icon: Zap, color: "text-amber-400" },
  [ScoreComponent.Threat]: { label: "Survival", icon: ShieldAlert, color: "text-emerald-400" },
  [ScoreComponent.Flexibility]: { label: "Flex Tier", icon: Activity, color: "text-cyan-400" },
  [ScoreComponent.Risk]: { label: "Risk Penalty", icon: Waves, color: "text-orange-400" },
};

export const AnalysisOverlay: React.FC<AnalysisOverlayProps> = ({ 
  scoredChampion, 
  champion,
  allies,
  enemies,
  counterMatrix
}) => {
  const { finalScore, breakdown, explanations } = scoredChampion;

  const relevantMatchups = enemies.map(enemy => {
    const value = counterMatrix?.get(champion.id)?.get(enemy.id) || 0;
    return { name: enemy.name, value };
  });

  const counters = relevantMatchups.filter(m => m.value > 0);
  const weakAgainst = relevantMatchups.filter(m => m.value < 0);

  return (
    <div className="w-80 flex flex-col bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-none">
      {/* Header */}
      <div className="p-4 bg-white/[0.03] border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] animate-pulse">Neural Insight</span>
          <div className="flex items-center gap-2">
             <div className="h-1 w-8 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-[loading_2s_infinite]" />
             </div>
             <span className="text-[9px] font-bold text-blue-500 uppercase">Live</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
           <h3 className="text-xl font-bold text-white tracking-tight">{champion.name}</h3>
           <div className="text-right">
              <span className="text-sm font-black text-blue-400">{Math.round(finalScore)}</span>
              <span className="block text-[7px] font-bold text-zinc-600 uppercase">Score</span>
           </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Breakdown Grid */}
        <div className="space-y-3">
          {Object.entries(breakdown).map(([key, value]) => {
            const meta = COMPONENT_META[key as ScoreComponent];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-3 h-3", meta.color)} />
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-sans">{meta.label}</span>
                  </div>
                  <span className="text-[10px] font-black text-white/90">{Math.round(value)}</span>
                </div>
                <Progress 
                  value={value} 
                  className="h-1 bg-zinc-900/50" 
                  indicatorClassName={cn("bg-current shadow-[0_0_8px_rgba(0,0,0,0.5)]", meta.color.replace('text-', 'bg-'))} 
                />
              </div>
            );
          })}
        </div>

        <Separator className="bg-white/5" />

        {/* Counter/Synergy Context */}
        <div className="space-y-4">
           {counters.length > 0 && (
             <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-emerald-500/70 tracking-widest flex items-center gap-1.5">
                   <Target className="w-3 h-3" /> Superior Against
                </span>
                <div className="flex flex-wrap gap-1.5">
                   {counters.map(m => (
                     <Badge key={m.name} variant="outline" className="text-[9px] border-emerald-500/20 bg-emerald-500/5 text-emerald-400 py-0 px-2 font-bold lowercase">
                       {m.name}
                     </Badge>
                   ))}
                </div>
             </div>
           )}

           {weakAgainst.length > 0 && (
             <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-red-500/70 tracking-widest flex items-center gap-1.5">
                   <AlertTriangle className="w-3 h-3" /> Targeted By
                </span>
                <div className="flex flex-wrap gap-1.5">
                   {weakAgainst.map(m => (
                     <Badge key={m.name} variant="outline" className="text-[9px] border-red-500/20 bg-red-500/5 text-red-400 py-0 px-2 font-bold lowercase">
                       {m.name}
                     </Badge>
                   ))}
                </div>
             </div>
           )}
        </div>

        {/* Explanation Feed */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 space-y-3">
          <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest flex items-center gap-1.5">
             <Info className="w-3 h-3" /> Strategic Intel
          </span>
          <div className="space-y-2">
            {explanations.slice(0, 3).map((exp, i) => (
              <div key={i} className="flex gap-2">
                 <ChevronRight className="w-2.5 h-2.5 text-blue-500 shrink-0 mt-0.5" />
                 <p className="text-[11px] text-zinc-400 leading-snug font-medium">
                    {exp}
                 </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
