"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Champion, Role } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { TacticalReport, Insight } from "./TacticalReport";
import { Brain, ShieldAlert, Sparkles, Sword, Scale, AlertTriangle, Wind, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamTacticalAnalysisProps {
  side: TeamSide;
}

export function TeamTacticalAnalysis({ side }: TeamTacticalAnalysisProps) {
  const { ally, enemy, allChampions, scoredChampions, settings } = useDraftStore();
  const isAlly = side === TeamSide.Ally;
  const team = isAlly ? ally : enemy;

  const teamChamps = Object.values(team)
    .map(slot => allChampions.find(c => c.id === slot.championId))
    .filter((c): c is Champion => !!c);

  const calculateAverage = (champs: Champion[], key: string) => {
    if (champs.length === 0) return 0;
    const sum = champs.reduce((acc, c) => ((c as any)[key] || 0) + acc, 0);
    return sum / champs.length;
  };

  const stats = {
    cc: calculateAverage(teamChamps, "ccScore"),
    durability: calculateAverage(teamChamps, "durabilityScore"),
    mobility: calculateAverage(teamChamps, "mobilityScore"),
    sustain: calculateAverage(teamChamps, "sustainScore"),
    burst: calculateAverage(teamChamps, "burstScore"),
    utility: teamChamps.reduce((acc, c) => acc + (c.healingScore + c.shieldScore) / 2, 0) / (teamChamps.length || 1),
    waveclear: calculateAverage(teamChamps, "waveclearScore"),
    early: calculateAverage(teamChamps, "earlyGameScore"),
    scaling: calculateAverage(teamChamps, "scalingScore"),
  };

  const breakdowns = teamChamps.map(c => 
    scoredChampions.find(s => s.championId === c.id)?.breakdown
  ).filter(Boolean);
  
  const factor = breakdowns.length || 1;
  const avgSynergy = breakdowns.reduce((acc, b) => acc + (b?.synergy || 0), 0) / factor;
  const avgRisk = breakdowns.reduce((acc, b) => acc + (b?.risk || 0), 0) / factor;
  const avgThreat = breakdowns.reduce((acc, b) => acc + (b?.threat || 0), 0) / factor;
  const avgComp = breakdowns.reduce((acc, b) => acc + (b?.composition || 0), 0) / factor;

  // Dynamic Label Mappings
  const getSynergyLabel = (val: number) => {
    if (val >= 75) return "Exceptional";
    if (val >= 55) return "Strong";
    if (val >= 35) return "Moderate";
    return "Disconnected";
  };

  const getBalanceLabel = () => {
    if (teamChamps.length === 0) return "---";
    const totalAD = teamChamps.reduce((acc, c) => acc + c.damageProfile.ad, 0);
    const totalAP = teamChamps.reduce((acc, c) => acc + c.damageProfile.ap, 0);
    const total = totalAD + totalAP || 1;
    const skew = Math.abs(totalAD / total - 0.5);
    if (skew < 0.1) return "Perfect";
    if (skew < 0.25) return "Hybrid";
    return "Skewed";
  };

  const getRiskLabel = (val: number) => {
    if (val < 15) return "Stable";
    if (val < 35) return "Moderate";
    return "High Variance";
  };

  const getScalingLabel = (val: number) => {
    if (val >= 7.5) return "Late Core";
    if (val >= 5.5) return "Balanced";
    return "Early Focus";
  };

  const getWinCondition = () => {
    if (teamChamps.length === 0) return "---";
    const tags: Record<string, number> = {};
    teamChamps.forEach(c => c.tags.forEach(t => tags[t] = (tags[t] || 0) + 1));
    const sorted = Object.entries(tags).sort((a,b) => b[1] - a[1]);
    if (sorted[0]?.[0] === "teamfight") return "5v5 Combat";
    if (sorted[0]?.[0] === "poke") return "Siege / Poke";
    if (sorted[0]?.[0] === "assassin") return "Pick / Skirmish";
    return "Objectives";
  };

  const generateTeamInsights = (): Insight[] => {
    const insights: Insight[] = [];
    if (teamChamps.length === 0) return [];

    // Absolute Strengths
    if (stats.cc > 6.5) insights.push({ type: "strength", text: "Lockdown Density: High crowd control potential for picks and teamfights." });
    if (stats.durability > 6.5) insights.push({ type: "strength", text: "Strong Frontline: Composition has significant beefiness to soak damage." });
    if (stats.mobility > 6.5) insights.push({ type: "strength", text: "Map Mobility: High agency to rotate and collapse on objectives." });
    if (stats.sustain > 6.0) insights.push({ type: "strength", text: "High Attrition: Excellent recovery allows for extended skirmishing." });
    if (avgSynergy > 70) insights.push({ type: "strength", text: "High Synergy: Picks have exceptional innate coordination." });

    // Absolute Weaknesses
    if (stats.durability < 3.5 && teamChamps.length >= 3) insights.push({ type: "risk", text: "Fragile Comp: Highly vulnerable to burst and dive; lacks a frontline." });
    if (stats.waveclear < 4.5 && teamChamps.length >= 3) insights.push({ type: "risk", text: "Poor Waveclear: Defending towers and clearing sieges will be difficult." });
    if (avgRisk > 40) insights.push({ type: "risk", text: "Draft Dissonance: High internal anti-synergy or role overlap." });

    // Damage Skew
    const totalAD = teamChamps.reduce((acc, c) => acc + c.damageProfile.ad, 0);
    const totalAP = teamChamps.reduce((acc, c) => acc + c.damageProfile.ap, 0);
    const total = totalAD + totalAP || 1;
    if (totalAD / total > 0.85) insights.push({ type: "risk", text: "Mono-Physical: Extreme AD skew makes armor stacking very effective." });
    if (totalAP / total > 0.85) insights.push({ type: "risk", text: "Mono-Magic: Extreme AP skew makes MR stacking very effective." });

    return insights;
  };

  const insights = generateTeamInsights();

  return (
    <div className={cn(
        "p-4 rounded-xl border border-white/5 relative overflow-hidden flex flex-col gap-4",
        settings.disableTransparency ? "bg-zinc-900" : "bg-black/20 backdrop-blur-md",
        isAlly ? "border-blue-500/10 shadow-[inner_0_0_20px_rgba(59,130,246,0.02)]" : "border-red-500/10 shadow-[inner_0_0_20px_rgba(239,68,68,0.02)]"
    )}>
      {/* Dashboard Headline */}
      <h3 className={cn(
        "flex items-center gap-2 text-[10px] font-black capitalize tracking-[0.2em] mb-1",
        isAlly ? "text-blue-400" : "text-red-400"
      )}>
        <Brain className="w-3 h-3" /> {isAlly ? "Team Intelligence" : "Threat Analysis"}
      </h3>

      {/* Composition Bars */}
      <div className="space-y-3">
        <DashBar label={isAlly ? "Offensive Power" : "Offensive Pressure"} value={isAlly ? stats.burst * 10 : avgThreat} color={isAlly ? "bg-blue-500" : "bg-red-500"} />
        <DashBar label={isAlly ? "Sustainability" : "Target Scalability"} value={isAlly ? stats.durability * 10 : stats.scaling * 10} color={isAlly ? "bg-indigo-500" : "bg-orange-600"} />
        <DashBar label={isAlly ? "Lockdown / CC" : "Effective Health"} value={isAlly ? stats.cc * 10 : stats.durability * 10} color={isAlly ? "bg-emerald-500" : "bg-zinc-700"} />
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 gap-2">
        <DashMetric 
          label={isAlly ? "Synergy" : "Volatility"} 
          value={isAlly ? getSynergyLabel(avgSynergy) : getRiskLabel(avgRisk)} 
          icon={isAlly ? <Brain className="w-2.5 h-2.5 text-blue-500" /> : <ShieldAlert className="w-2.5 h-2.5 text-red-500" />} 
          active={teamChamps.length > 0}
        />
        <DashMetric 
          label={isAlly ? "Balance" : "Control"} 
          value={isAlly ? getBalanceLabel() : (stats.cc >= 6 ? "High" : stats.cc >= 4 ? "Balanced" : "Low")} 
          icon={isAlly ? <Brain className="w-2.5 h-2.5 text-zinc-500" /> : <Brain className="w-2.5 h-2.5 text-blue-500" />} 
          active={teamChamps.length > 0}
        />
        <DashMetric 
          label={isAlly ? "Risk Level" : "Win Condition"} 
          value={isAlly ? getRiskLabel(avgRisk) : getWinCondition()} 
          icon={isAlly ? <Brain className="w-2.5 h-2.5 text-orange-500" /> : <Brain className="w-2.5 h-2.5 text-yellow-500" />} 
          active={teamChamps.length > 0}
        />
        <DashMetric 
          label={isAlly ? "Scaling" : "Threat Level"} 
          value={isAlly ? getScalingLabel(stats.scaling) : (avgComp >= 70 ? "Critical" : avgComp >= 50 ? "High" : "Normal")} 
          icon={isAlly ? <Brain className="w-2.5 h-2.5 text-blue-300" /> : <Brain className="w-2.5 h-2.5 text-zinc-500" />} 
          active={teamChamps.length > 0}
        />
      </div>

      {/* Insights */}
      <TacticalReport 
        insights={insights} 
        emptyText="Add champions to analyze internal synergy." 
        className="mt-2"
      />
    </div>
  );
}

function DashBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[8px] font-black capitalize text-zinc-500 tracking-wider">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(Math.max(0, Math.min(100, value)))}%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.02]">
        <div 
          className={cn("h-full transition-all duration-1000 ease-out", color)} 
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }} 
        />
      </div>
    </div>
  );
}

function DashMetric({ label, value, icon, active }: { label: string; value: string; icon: React.ReactNode; active: boolean }) {
  return (
    <div className="p-2.5 bg-black/20 rounded-lg border border-white/5 flex flex-col gap-1 transition-all hover:bg-black/30">
      <div className="flex items-center gap-1.5 opacity-50">
        {icon}
        <span className="text-[8px] font-black text-zinc-500 capitalize tracking-widest leading-none">{label}</span>
      </div>
      <span className={cn(
        "text-[13px] font-black transition-colors duration-500",
        active ? "text-zinc-100" : "text-zinc-700"
      )}>
        {active ? value : "---"}
      </span>
    </div>
  );
}

