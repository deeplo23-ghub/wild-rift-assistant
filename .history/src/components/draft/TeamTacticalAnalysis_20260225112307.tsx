"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Champion, Role } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { TacticalReport, Insight } from "./TacticalReport";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamTacticalAnalysisProps {
  side: TeamSide;
}

export function TeamTacticalAnalysis({ side }: TeamTacticalAnalysisProps) {
  const { ally, enemy, allChampions, scoredChampions } = useDraftStore();
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

  const generateTeamInsights = (): Insight[] => {
    const insights: Insight[] = [];
    if (teamChamps.length === 0) return [];

    const stats = {
      cc: calculateAverage(teamChamps, "ccScore"),
      durability: calculateAverage(teamChamps, "durabilityScore"),
      mobility: calculateAverage(teamChamps, "mobilityScore"),
      sustain: calculateAverage(teamChamps, "sustainScore"),
      burst: calculateAverage(teamChamps, "burstScore"),
      utility: teamChamps.reduce((acc, c) => acc + (c.healingScore + c.shieldScore) / 2, 0) / teamChamps.length,
      waveclear: calculateAverage(teamChamps, "waveclearScore"),
    };

    const breakdowns = teamChamps.map(c => 
      scoredChampions.find(s => s.championId === c.id)?.breakdown
    ).filter(Boolean);
    const avgSynergy = (breakdowns.reduce((acc, b) => acc + (b?.synergy || 0), 0) / (breakdowns.length || 1));
    const avgRisk = (breakdowns.reduce((acc, b) => acc + (b?.risk || 0), 0) / (breakdowns.length || 1));

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
        "mt-4 p-3 rounded-lg border border-white/5 relative overflow-hidden bg-black/20",
        isAlly ? "border-blue-500/10" : "border-red-500/10"
    )}>
      <div className="flex items-center gap-2 text-[8px] uppercase font-black text-zinc-500 tracking-[0.2em] mb-3 opacity-60">
        <Brain className="w-3 h-3" /> Composition Analysis
      </div>
      <TacticalReport 
        insights={insights} 
        emptyText="Add champions to analyze internal synergy." 
      />
    </div>
  );
}
