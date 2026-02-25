"use client";

import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Champion, Role, ChampionTag } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { ScoredChampion } from "@/types/scoring";
import { 
  Info, 
  Shield, 
  Zap, 
  Crosshair, 
  ArrowUpRight, 
  Timer, 
  Move, 
  Heart, 
  Flame, 
  Swords,
  AlertCircle,
  TrendingUp,
  Target,
  BarChart3,
  Dna,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChampionIcon } from "./ChampionIcon";

interface TeamAnalysisProps {
  side: TeamSide;
  teamChampions: Champion[];
  opposingTeamChampions: Champion[];
  scoredChampions: ScoredChampion[];
  allChampions: Champion[];
  grade: string;
  totalScore: number;
}

export function TeamAnalysis({ 
  side, 
  teamChampions, 
  opposingTeamChampions,
  scoredChampions,
  allChampions, 
  grade,
  totalScore
}: TeamAnalysisProps) {
  const isAlly = side === TeamSide.Ally;
  const count = teamChampions.length;
  const factor = count || 1;

  // 1. Core Averages
  const avgDurability = teamChampions.reduce((acc, c) => acc + c.durabilityScore, 0) / factor;
  const avgEngage = teamChampions.reduce((acc, c) => acc + c.engageScore, 0) / factor;
  const avgPeel = teamChampions.reduce((acc, c) => acc + c.peelScore, 0) / factor;
  const avgCC = teamChampions.reduce((acc, c) => acc + c.ccScore, 0) / factor;
  const avgScaling = teamChampions.reduce((acc, c) => acc + c.scalingScore, 0) / factor;
  const avgEarly = teamChampions.reduce((acc, c) => acc + c.earlyGameScore, 0) / factor;
  const avgMobility = teamChampions.reduce((acc, c) => acc + c.mobilityScore, 0) / factor;
  const avgUtility = teamChampions.reduce((acc, c) => acc + (c.healingScore + c.shieldScore) / 2, 0) / factor;
  const avgWaveclear = teamChampions.reduce((acc, c) => acc + c.waveclearScore, 0) / factor;

  // 2. Damage Balance
  const totalAD = teamChampions.reduce((acc, c) => acc + c.damageProfile.ad, 0);
  const totalAP = teamChampions.reduce((acc, c) => acc + c.damageProfile.ap, 0);
  const totalTrue = teamChampions.reduce((acc, c) => acc + c.damageProfile.true, 0);
  const totalDamageRatio = totalAD + totalAP + totalTrue || 1;
  
  const adPct = (totalAD / totalDamageRatio) * 100;
  const apPct = (totalAP / totalDamageRatio) * 100;
  const truePct = (totalTrue / totalDamageRatio) * 100;

  // 3. Archetype Analysis
  const tagCounts: Record<string, number> = {};
  teamChampions.forEach(c => {
    c.tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  
  const dominantTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // 4. Scoring Engine Details (Aggregated)
  const teamBreakdowns = teamChampions.map(c => 
    scoredChampions.find(s => s.championId === c.id)?.breakdown
  ).filter(Boolean);

  const avgSynergy = teamBreakdowns.reduce((acc, b) => acc + (b?.synergy || 0), 0) / factor;
  const avgCounter = teamBreakdowns.reduce((acc, b) => acc + (b?.counter || 0), 0) / factor;
  const avgThreat = teamBreakdowns.reduce((acc, b) => acc + (b?.threat || 0), 0) / factor;
  const avgComp = teamBreakdowns.reduce((acc, b) => acc + (b?.composition || 0), 0) / factor;
  const avgRisk = teamBreakdowns.reduce((acc, b) => acc + (b?.risk || 0), 0) / factor;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={cn(
          "w-5 h-5 flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors shrink-0",
          !isAlly && "order-first"
        )}>
          <Info className="w-3 h-3 text-zinc-400" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-zinc-950 border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("px-4 py-1.5 rounded-full text-2xl font-black shadow-lg", 
              grade.startsWith("S") ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50" :
              grade === "A" ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/50" :
              grade === "B" ? "bg-blue-500/20 text-blue-500 border border-blue-500/50" :
              "bg-zinc-500/20 text-zinc-400 border border-zinc-500/50"
            )}>
              {grade}
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase italic">
                {isAlly ? "Ally" : "Enemy"} Composition Analysis
              </DialogTitle>
              <p className="text-zinc-500 text-sm font-medium tracking-wide">
                Comprehensive tactical breakdown of team potential
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {/* STATS SECTION */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
              <BarChart3 className="w-3 h-3" /> Gameplay Parameters
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <StatRow label="Toughness" value={avgDurability} icon={<Shield className="w-4 h-4 text-zinc-400" />} color="bg-zinc-500" description="Ability to survive sustained damage" />
              <StatRow label="Engage" value={avgEngage} icon={<Zap className="w-4 h-4 text-yellow-400" />} color="bg-yellow-500" description="Capacity to initiate teamfights" />
              <StatRow label="Peel" value={avgPeel} icon={<ShieldAlert className="w-4 h-4 text-blue-400" />} color="bg-blue-400" description="Ability to protect vulnerable allies" />
              <StatRow label="Crowd Control" value={avgCC} icon={<Crosshair className="w-4 h-4 text-purple-400" />} color="bg-purple-500" description="Lockdown and area control potential" />
              <StatRow label="Late Scaling" value={avgScaling} icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} color="bg-emerald-500" description="Power growth as the game progresses" />
              <StatRow label="Early Pressure" value={avgEarly} icon={<Timer className="w-4 h-4 text-red-400" />} color="bg-red-500" description="Strength in the laning phase" />
              <StatRow label="Mobility" value={avgMobility} icon={<Move className="w-4 h-4 text-cyan-400" />} color="bg-cyan-500" description="Map presence and repositioning" />
              <StatRow label="Team Utility" value={avgUtility} icon={<Heart className="w-4 h-4 text-pink-400" />} color="bg-pink-500" description="Healing, shielding, and buffs" />
              <StatRow label="Waveclear" value={avgWaveclear} icon={<Flame className="w-4 h-4 text-orange-400" />} color="bg-orange-500" description="Minion management and siege defense" />
            </div>
          </div>

          <div className="space-y-8">
            {/* DAMAGE BALANCE */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                <Swords className="w-3 h-3" /> Damage Profile
              </h3>
              <div className="h-6 w-full flex rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div style={{ width: `${adPct}%` }} className="bg-orange-500 h-full transition-all" title={`AD: ${Math.round(adPct)}%`} />
                <div style={{ width: `${apPct}%` }} className="bg-blue-500 h-full transition-all" title={`AP: ${Math.round(apPct)}%`} />
                <div style={{ width: `${truePct}%` }} className="bg-white h-full transition-all" title={`True: ${Math.round(truePct)}%`} />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-zinc-100">Physical: {Math.round(adPct)}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-zinc-100">Magic: {Math.round(apPct)}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-right">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <span className="text-zinc-100">True: {Math.round(truePct)}%</span>
                </div>
              </div>
            </div>

            {/* ENGINE PERFORMANCE */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                <Dna className="w-3 h-3" /> Technical Engine Scores
              </h3>
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
                 <EngineRow label="Internal Synergy" value={avgSynergy} description="How well picks coordinate together" />
                 <EngineRow label="Strategic Counter" value={avgCounter} description="Advantage vs enemy composition" />
                 <EngineRow label="Neutralization" value={avgThreat} description="Ability to shut down enemy carries" />
                 <EngineRow label="Draft Risk" value={avgRisk} description="Anti-synergy or role redundancies" isRisk />
              </div>
            </div>

            {/* DOMINANT TRAITS */}
            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                <SparklesIcon className="w-3 h-3" /> Dominant Traits
              </h3>
              <div className="flex flex-wrap gap-2">
                {dominantTags.map(([tag, freq]) => (
                  <div key={tag} className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-blue-400">{tag}</span>
                    <div className="h-3 w-px bg-blue-500/20" />
                    <span className="text-[10px] font-bold text-white">x{freq}</span>
                  </div>
                ))}
                {count === 0 && <span className="text-zinc-600 text-[10px] italic">No champions selected</span>}
              </div>
            </div>
          </div>
        </div>

        {/* TEAM RECAP */}
        <div className="mt-8 pt-8 border-t border-white/5">
           <div className="flex items-center justify-between gap-4">
              <div className="flex -space-x-3 overflow-hidden p-1">
                 {teamChampions.map((c) => (
                    <div key={c.id} className="w-10 h-10 rounded-full border-2 border-zinc-950 overflow-hidden bg-zinc-900 shadow-xl">
                       <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full" />
                    </div>
                 ))}
                 {[...Array(5 - count)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 border-dashed bg-zinc-950/50 flex items-center justify-center">
                       <div className="w-4 h-1 bg-white/5 rounded-full" />
                    </div>
                 ))}
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Total Composition Power</div>
                 <div className="text-3xl font-black text-white">{Math.round(totalScore)}<span className="text-zinc-600">/500</span></div>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatRow({ label, value, icon, color, description }: { label: string, value: number, icon: React.ReactNode, color: string, description: string }) {
  return (
    <div className="group cursor-default">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
           {icon}
           <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-tight">{label}</span>
        </div>
        <span className="text-[11px] font-black text-white">{value.toFixed(1)}<span className="text-zinc-600">/10</span></span>
      </div>
      <Progress value={value * 10} className="h-1 bg-white/5" />
      <div className="max-h-0 overflow-hidden group-hover:max-h-10 transition-all duration-300">
         <p className="text-[9px] text-zinc-500 mt-1.5 italic font-medium">{description}</p>
      </div>
    </div>
  );
}

function EngineRow({ label, value, description, isRisk }: { label: string, value: number, description: string, isRisk?: boolean }) {
  const scoreColor = isRisk 
    ? (value > 40 ? "text-red-400" : value > 20 ? "text-orange-400" : "text-emerald-400")
    : (value > 70 ? "text-emerald-400" : value > 50 ? "text-blue-400" : "text-zinc-400");

  return (
    <div className="flex items-center justify-between group">
      <div>
        <div className="text-[10px] font-black uppercase text-zinc-200 tracking-tight">{label}</div>
        <div className="text-[9px] text-zinc-500 italic">{description}</div>
      </div>
      <div className={cn("text-sm font-black italic", scoreColor)}>
        {Math.round(value)}
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707" />
      <path d="M12 8l1.5 2.5L16 12l-2.5 1.5L12 16l-1.5-2.5L8 12l2.5-1.5L12 8z" fill="currentColor" />
    </svg>
  );
}
