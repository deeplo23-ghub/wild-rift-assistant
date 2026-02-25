"use client";

import React, { useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { cn } from "@/lib/utils";
import { ChampionIcon } from "./ChampionIcon";
import {
  Shield,
  Zap,
  ShieldAlert,
  Crosshair,
  TrendingUp,
  Timer,
  Move,
  Heart,
  Flame,
  Swords,
  Brain,
  Tags,
  Activity,
  Dna,
  GitCompareArrows
} from "lucide-react";

const STAT_METRICS = [
  { key: "durabilityScore", label: "Toughness", icon: Shield, desc: "Ability to survive sustained damage" },
  { key: "engageScore", label: "Engage", icon: Zap, desc: "Capacity to initiate teamfights" },
  { key: "peelScore", label: "Peel", icon: ShieldAlert, desc: "Ability to protect vulnerable allies" },
  { key: "ccScore", label: "Control", icon: Crosshair, desc: "Lockdown and area control potential" },
  { key: "scalingScore", label: "Scaling", icon: TrendingUp, desc: "Power growth as the game progresses" },
  { key: "earlyGameScore", label: "Early Game", icon: Timer, desc: "Strength in the laning phase" },
  { key: "mobilityScore", label: "Mobility", icon: Move, desc: "Map presence and repositioning" },
  { key: "utilityScore", label: "Utility", icon: Heart, desc: "Healing, shielding, and buffs" },
  { key: "waveclearScore", label: "Waveclear", icon: Flame, desc: "Minion management and siege defense" },
];

const ROLES = [Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support];

export function MatchupAnalysis() {
  const { ally, enemy, allChampions, settings, counterMatrix, scoredChampions } = useDraftStore();

  const getTeamChampions = (team: Record<Role, { championId: string | null }>) => {
    return Object.values(team)
      .map(slot => allChampions.find(c => c.id === slot.championId))
      .filter((c): c is Champion => !!c);
  };

  const allyChamps = getTeamChampions(ally);
  const enemyChamps = getTeamChampions(enemy);

  const calculateAverage = (champs: Champion[], key: string) => {
    if (champs.length === 0) return 0;
    const sum = champs.reduce((acc, c) => {
        if (key === "utilityScore") {
            return acc + (c.healingScore + c.shieldScore) / 2;
        }
        return acc + ((c as any)[key] || 0);
    }, 0);
    return sum / champs.length;
  };

  const calculateDamageMix = (champs: Champion[]) => {
    const totalAD = champs.reduce((acc, c) => acc + c.damageProfile.ad, 0);
    const totalAP = champs.reduce((acc, c) => acc + c.damageProfile.ap, 0);
    const totalTrue = champs.reduce((acc, c) => acc + c.damageProfile.true, 0);
    const total = totalAD + totalAP + totalTrue || 1;
    return {
      ad: (totalAD / total) * 100,
      ap: (totalAP / total) * 100,
      truePct: (totalTrue / total) * 100
    };
  };

  const allyDamage = calculateDamageMix(allyChamps);
  const enemyDamage = calculateDamageMix(enemyChamps);

  const getTopTags = (champs: Champion[]) => {
      const counts: Record<string, number> = {};
      champs.forEach(c => c.tags.forEach(t => counts[t] = (counts[t] || 0) + 1));
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  };

  const getEngineScores = (champs: Champion[]) => {
      const breakdowns = champs.map(c => 
          scoredChampions.find(s => s.championId === c.id)?.breakdown
      ).filter(Boolean);
      
      const factor = breakdowns.length || 1;
      return {
          synergy: breakdowns.reduce((acc, b) => acc + (b?.synergy || 0), 0) / factor,
          counter: breakdowns.reduce((acc, b) => acc + (b?.counter || 0), 0) / factor,
          threat: breakdowns.reduce((acc, b) => acc + (b?.threat || 0), 0) / factor,
          risk: breakdowns.reduce((acc, b) => acc + (b?.risk || 0), 0) / factor,
      };
  };

  const allyEngine = getEngineScores(allyChamps);
  const enemyEngine = getEngineScores(enemyChamps);

  const generateVerdict = () => {
      const earlyDiff = calculateAverage(allyChamps, "earlyGameScore") - calculateAverage(enemyChamps, "earlyGameScore");
      const scalingDiff = calculateAverage(allyChamps, "scalingScore") - calculateAverage(enemyChamps, "scalingScore");
      const ccDiff = calculateAverage(allyChamps, "ccScore") - calculateAverage(enemyChamps, "ccScore");
      
      let lines: string[] = [];

      if (earlyDiff > 0 && scalingDiff > 0) {
          lines.push("The Ally team has drafted a superior composition, boasting both early pressure and better late-game scaling. This is an extremely favorable matchup.");
      } else {
            if (earlyDiff > 1.5) lines.push("The Ally team has a significant early game advantage and must snowball before the Enemy comes online.");
            else if (earlyDiff < -1.5) lines.push("The Enemy team dictates the early pace. Allies must play defensively and look for safe farm.");
            
            if (scalingDiff > 1.5) lines.push("If the game goes late, the Ally composition will severely out-value the enemy.");
            else if (scalingDiff < -1.5) lines.push("The Enemy team is a late-game ticking time bomb. The Ally team must close out objectives quickly.");
      }

      if (ccDiff > 2) lines.push("Allies have superior crowd control, making teamfights highly favorable if chained correctly.");
      else if (ccDiff < -2) lines.push("Enemy lockdown is oppressive; Allies will need Quicksilver Sashes and excellent positioning.");

      if (lines.length === 0) lines.push("This matchup is heavily dependent on execution and individual player skill.");
      
      return lines;
  };

  return (
    <div className={cn(
      "h-full flex flex-col border border-white/5 rounded-xl overflow-hidden shadow-2xl relative",
      settings.disableTransparency ? "bg-zinc-950" : "bg-black/40 backdrop-blur-3xl"
    )}>
        <div className="h-full flex flex-col p-4 overflow-y-auto">

            {/* Team Summaries */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <TeamOverview stats={allyEngine} damage={allyDamage} tags={getTopTags(allyChamps)} color="blue" />
                <TeamOverview stats={enemyEngine} damage={enemyDamage} tags={getTopTags(enemyChamps)} color="red" isEnemy />
            </div>

            {/* Parametrix Rows */}
            <div className="flex flex-col gap-4 flex-1 min-h-0">
                {/* Parametrix Rows */}
                <div className="flex flex-col gap-1.5 bg-black/20 p-4 rounded-lg border border-white/5">
                    <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-cyan-500 tracking-widest border-b border-white/5 pb-2 mb-2">
                        <TrendingUp className="w-3 h-3" /> Core Parametrics (Data Rows)
                    </div>
                    {STAT_METRICS.map(m => {
                        const aVal = calculateAverage(allyChamps, m.key);
                        const eVal = calculateAverage(enemyChamps, m.key);
                        const aWin = aVal > eVal + 0.5;
                        const eWin = eVal > aVal + 0.5;
                        const tie = !aWin && !eWin;
                        
                        const aNumColor = aWin ? "text-blue-400" : tie ? "text-zinc-300" : "text-zinc-600";
                        const eNumColor = eWin ? "text-red-400" : tie ? "text-zinc-300" : "text-zinc-600";
                        const aBarColor = aWin ? "bg-blue-500" : tie ? "bg-blue-500/50" : "bg-blue-500/10";
                        const eBarColor = eWin ? "bg-red-500" : tie ? "bg-red-500/50" : "bg-red-500/10";
                        const iconColor = aWin ? "text-blue-500" : eWin ? "text-red-500" : "text-zinc-500";
                        
                        return (
                            <div key={m.key} className="flex items-center gap-4 group">
                                <span className={cn("w-8 text-right font-black tabular-nums text-sm transition-colors duration-300", aNumColor)}>{aVal.toFixed(1)}</span>
                                <div className="flex-1 h-3 rounded bg-zinc-900 border border-white/5 overflow-hidden flex justify-end">
                                    <div className={cn("h-full transition-all duration-300", aBarColor)} style={{ width: `${(aVal/10)*100}%` }} />
                                </div>
                                
                                <div className="w-40 flex flex-col items-center justify-center relative h-8">
                                    <div className={cn("flex items-center gap-1.5 text-[10px] uppercase font-black transition-colors duration-300 absolute inset-0 justify-center group-hover:opacity-0 pointer-events-none", iconColor)}>
                                        <m.icon className="w-3 h-3" /> {m.label}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <span className="text-[9px] text-zinc-400 font-medium italic text-center leading-tight w-full whitespace-nowrap overflow-hidden text-ellipsis">{m.desc}</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 h-3 rounded bg-zinc-900 border border-white/5 overflow-hidden flex justify-start">
                                    <div className={cn("h-full transition-all duration-300", eBarColor)} style={{ width: `${(eVal/10)*100}%` }} />
                                </div>
                                <span className={cn("w-8 text-left font-black tabular-nums text-sm transition-colors duration-300", eNumColor)}>{eVal.toFixed(1)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4"><VerdictBar generateVerdict={generateVerdict} /></div>
        </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ //
// Reusable Sub-Components
// ------------------------------------------------------------------------------------------------ //

function TeamOverview({ stats, damage, tags, color, isEnemy }: any) {
    const themeColor = color === "blue" ? "text-blue-400" : "text-red-400";
    const bgTheme = color === "blue" ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20";
    
    return (
        <div className={cn(
            "bg-black/20 p-4 rounded-lg border border-white/5 flex flex-col gap-4",
            isEnemy ? "items-end" : "items-start"
        )}>
           <div className="flex w-full gap-4">
              {/* Left/Right content flip based on isEnemy */}
              {isEnemy ? (
                  <>
                      {/* Technical Scores Right */}
                      <div className="flex-1 flex flex-col gap-2 border-l border-white/5 pl-4 justify-center">
                          <EngineRow label="Internal Synergy" value={stats.synergy} color="text-zinc-300" isEnemy />
                          <EngineRow label="Strategic Counter" value={stats.counter} color="text-zinc-300" isEnemy />
                          <EngineRow label="Neutralization" value={stats.threat} color="text-zinc-300" isEnemy />
                          <EngineRow label="Draft Risk" value={stats.risk} color="text-orange-400" isEnemy />
                      </div>
                      
                      {/* Traits & Damage Left */}
                      <div className="flex flex-col items-end gap-3 w-1/2">
                          {/* Tags */}
                          <div className="flex flex-col items-end gap-1.5 w-full">
                              <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-zinc-500 tracking-widest">
                                  <Tags className="w-3 h-3" /> Dominant Traits
                              </div>
                              <div className="flex flex-wrap gap-1.5 justify-end">
                                  {tags.map(([t, count]: any) => (
                                      <div key={t} className={`px-2 py-1 rounded border flex items-center gap-1.5 ${bgTheme}`}>
                                          <span className={`text-[9px] font-black uppercase tracking-tight ${themeColor}`}>{t}</span>
                                          <span className="text-[9px] font-bold text-white px-1 bg-black/40 rounded">x{count}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
              
                          {/* Damage */}
                          <div className="flex flex-col items-end gap-1.5 w-full">
                               <div className="flex gap-2 w-full max-w-[200px]">
                                   <div style={{ width: `${damage.ad}%` }} className="h-1.5 bg-orange-500 rounded-full" />
                                   <div style={{ width: `${damage.ap}%` }} className="h-1.5 bg-sky-500 rounded-full" />
                                   <div style={{ width: `${damage.truePct}%` }} className="h-1.5 bg-white rounded-full" />
                               </div>
                               <div className="flex flex-row-reverse text-[8px] font-bold text-zinc-400 gap-3">
                                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {damage.ad.toFixed(0)}%</span>
                                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> {damage.ap.toFixed(0)}%</span>
                                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-white" /> {damage.truePct.toFixed(0)}%</span>
                               </div>
                          </div>
                      </div>
                  </>
              ) : (
                  <>
                      {/* Traits & Damage Left */}
                      <div className="flex flex-col items-start gap-3 w-1/2">
                          {/* Tags */}
                          <div className="flex flex-col items-start gap-1.5 w-full">
                              <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-zinc-500 tracking-widest">
                                  <Tags className="w-3 h-3" /> Dominant Traits
                              </div>
                              <div className="flex flex-wrap gap-1.5 justify-start">
                                  {tags.map(([t, count]: any) => (
                                      <div key={t} className={`px-2 py-1 rounded border flex items-center gap-1.5 ${bgTheme}`}>
                                          <span className={`text-[9px] font-black uppercase tracking-tight ${themeColor}`}>{t}</span>
                                          <span className="text-[9px] font-bold text-white px-1 bg-black/40 rounded">x{count}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
              
                          {/* Damage */}
                          <div className="flex flex-col items-start gap-1.5 w-full">
                               <div className="flex gap-2 w-full max-w-[200px]">
                                   <div style={{ width: `${damage.ad}%` }} className="h-1.5 bg-orange-500 rounded-full" />
                                   <div style={{ width: `${damage.ap}%` }} className="h-1.5 bg-sky-500 rounded-full" />
                                   <div style={{ width: `${damage.truePct}%` }} className="h-1.5 bg-white rounded-full" />
                               </div>
                               <div className="flex text-[8px] font-bold text-zinc-400 gap-3">
                                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {damage.ad.toFixed(0)}%</span>
                                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> {damage.ap.toFixed(0)}%</span>
                                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-white" /> {damage.truePct.toFixed(0)}%</span>
                               </div>
                          </div>
                      </div>

                      {/* Technical Scores Right */}
                      <div className="flex-1 flex flex-col gap-2 border-l border-white/5 pl-4 justify-center">
                          <EngineRow label="Internal Synergy" value={stats.synergy} color="text-zinc-300" />
                          <EngineRow label="Strategic Counter" value={stats.counter} color="text-zinc-300" />
                          <EngineRow label="Neutralization" value={stats.threat} color="text-zinc-300" />
                          <EngineRow label="Draft Risk" value={stats.risk} color="text-orange-400" />
                      </div>
                  </>
              )}
           </div>
        </div>
    )
}

function EngineRow({ label, value, color, isEnemy }: any) {
    return (
        <div className={cn("flex justify-between items-center w-full", isEnemy && "flex-row-reverse")}>
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                <Dna className="w-3 h-3 text-zinc-600" /> {label}
            </span>
            <span className={cn("font-black tabular-nums text-sm", color)}>{value.toFixed(1)}</span>
        </div>
    )
}

function VerdictBar({ generateVerdict }: { generateVerdict: () => string[] }) {
    const verdicts = generateVerdict();
    return (
        <div className="border border-purple-500/20 rounded-lg bg-black/40 p-4 flex gap-4 relative overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-1">
             <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex flex-col overflow-hidden w-full">
             <span className="text-[9px] uppercase font-black tracking-widest text-purple-400 mb-2">Engine Verdict</span>
             <ul className="flex flex-col gap-1.5 list-disc pl-4 text-[11px] text-zinc-300 font-medium italic marker:text-purple-500/50">
                 {verdicts.map((v, i) => <li key={i}>{v}</li>)}
             </ul>
          </div>
      </div>
    )
}
