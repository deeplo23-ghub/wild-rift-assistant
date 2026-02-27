"use client";

import React, { useMemo, useState } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { cn } from "@/lib/utils";
import { ChampionIcon } from "./ChampionIcon";
import { 
  Shield, 
  Zap, 
  ShieldAlert, 
  Skull, 
  Target, 
  TrendingUp,
  BarChart3,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOBILE_STAT_METRICS = [
  { key: "durabilityScore", label: "Toughness", icon: Shield },
  { key: "burstScore", label: "Burst", icon: Skull },
  { key: "engageScore", label: "Engage", icon: Zap },
  { key: "ccScore", label: "Control", icon: Target },
  { key: "scalingScore", label: "Scaling", icon: TrendingUp },
];

export const MobileMatchupAnalysis: React.FC = () => {
  const ally = useDraftStore((state) => state.ally);
  const enemy = useDraftStore((state) => state.enemy);
  const allChampions = useDraftStore((state) => state.allChampions);
  const scoredChampions = useDraftStore((state) => state.scoredChampions);
  
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  const allyChamps = useMemo(() => 
    Object.values(ally).map(s => allChampions.find(c => c.id === s.championId)).filter((c): c is Champion => !!c)
  , [ally, allChampions]);

  const enemyChamps = useMemo(() => 
    Object.values(enemy).map(s => allChampions.find(c => c.id === s.championId)).filter((c): c is Champion => !!c)
  , [enemy, allChampions]);

  const calculateAverage = (champs: Champion[], key: string) => {
    if (champs.length === 0) return 0;
    const sum = champs.reduce((acc, c) => acc + ((c as any)[key] || 0), 0);
    return sum / champs.length;
  };

  const getTeamGrade = (champs: Champion[]) => {
      const scores = champs.map(c => scoredChampions.find(s => s.championId === c.id)?.finalScore || 0);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      if (avg >= 75) return "S+";
      if (avg >= 68) return "S";
      if (avg >= 60) return "A";
      if (avg >= 52) return "B";
      if (avg >= 44) return "C";
      return "D";
  };

  const allyGrade = getTeamGrade(allyChamps);
  const enemyGrade = getTeamGrade(enemyChamps);

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 overflow-y-auto h-full no-scrollbar">
      {/* Grade Comparison */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-center gap-2 flex-1 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ally Grade</span>
          <span className="text-4xl font-black text-white">{allyGrade}</span>
        </div>
        <div className="flex flex-col items-center gap-2 flex-1 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Enemy Grade</span>
          <span className="text-4xl font-black text-white">{enemyGrade}</span>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="flex flex-col gap-3 bg-white/5 border border-white/5 rounded-2xl p-4">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 text-center">Tactical Comparison</h3>
        
        {MOBILE_STAT_METRICS.map(m => {
          const aVal = calculateAverage(allyChamps, m.key);
          const eVal = calculateAverage(enemyChamps, m.key);
          const max = 10;
          
          return (
            <div key={m.key} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-blue-400">{aVal.toFixed(1)}</span>
                <div className="flex items-center gap-1.5">
                  <m.icon className="w-3 h-3 text-zinc-500" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{m.label}</span>
                </div>
                <span className="text-[10px] font-black text-red-500">{eVal.toFixed(1)}</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full flex overflow-hidden border border-white/5">
                <div className="h-full bg-blue-500/80" style={{ width: `${(aVal/max)*100}%` }} />
                <div className="flex-1" />
                <div className="h-full bg-red-600/80" style={{ width: `${(eVal/max)*100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Damage Distribution (Team Mix) */}
      <div className="flex flex-col gap-3">
         <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Team Composition</span>
         </div>
         <div className="grid grid-cols-2 gap-3">
            {/* Ally Damage */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex flex-col gap-2">
               <span className="text-[8px] font-black text-blue-400/60 uppercase">Ally Damage Mix</span>
               <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-white/5">
                  <div className="h-full bg-orange-500" style={{ width: '40%' }} />
                  <div className="h-full bg-blue-500" style={{ width: '50%' }} />
                  <div className="h-full bg-zinc-400" style={{ width: '10%' }} />
               </div>
            </div>
            {/* Enemy Damage */}
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex flex-col gap-2">
               <span className="text-[8px] font-black text-red-500/60 uppercase">Enemy Damage Mix</span>
               <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-white/5">
                  <div className="h-full bg-orange-500" style={{ width: '60%' }} />
                  <div className="h-full bg-blue-500" style={{ width: '30%' }} />
                  <div className="h-full bg-zinc-400" style={{ width: '10%' }} />
               </div>
            </div>
         </div>
      </div>

      {/* Footer Text */}
      <div className="mt-8 text-center">
        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
          AI-generated analysis based on current champion synergy and counter data
        </p>
      </div>
    </div>
  );
};
