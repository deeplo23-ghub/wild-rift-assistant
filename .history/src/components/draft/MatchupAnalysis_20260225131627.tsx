"use client";

import React, { useMemo, useState } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { cn, formatTag } from "@/lib/utils";
import { TacticalReport, Insight } from "./TacticalReport";
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
  GitCompareArrows,
  Skull,
  Target,
  Users,
  Maximize2,
  RefreshCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const IMPORTANT_METRICS = [
  "durabilityScore",
  "engageScore",
  "ccScore",
  "burstScore",
  "scalingScore",
  "teamfightScore",
  "objectiveScore",
];

const STAT_METRICS = [
  { key: "durabilityScore", label: "Toughness", icon: Shield, desc: "Overall survivability and tankiness" },
  { key: "burstScore", label: "Burst", icon: Skull, desc: "Instant kill potential and pick power" },
  { key: "engageScore", label: "Engage", icon: Zap, desc: "Power to force and initiate teamfights" },
  { key: "rangeScore", label: "Range", icon: Maximize2, desc: "Combat distance and reach advantage" },
  { key: "ccScore", label: "Control", icon: Crosshair, desc: "Hard and soft crowd control density" },
  { key: "peelScore", label: "Peel", icon: ShieldAlert, desc: "Ability to protect and disengage for allies" },
  { key: "scalingScore", label: "Scaling", icon: TrendingUp, desc: "Power growth into the late game stage" },
  { key: "earlyGameScore", label: "Early Game", icon: Timer, desc: "Laning phase pressure and priority" },
  { key: "mobilityScore", label: "Mobility", icon: Move, desc: "Rotational speed and dash frequency" },
  { key: "sustainScore", label: "Sustain", icon: RefreshCcw, desc: "Combat longevity and health recovery" },
  { key: "healingScore", label: "Healing", icon: Heart, desc: "Health restoration and regeneration" },
  { key: "shieldScore", label: "Shielding", icon: Activity, desc: "Damage mitigation via temp health" },
  { key: "teamfightScore", label: "Teamfight", icon: Users, desc: "5v5 effectiveness and synergy" },
  { key: "objectiveScore", label: "Objective", icon: Target, desc: "Damage to monsters and structures" },
  { key: "waveclearScore", label: "Waveclear", icon: Flame, desc: "Minion clearing and siege capability" },
];

const ENGINE_METRICS = [
  { key: "composition", label: "Composition", icon: Dna, desc: "Team structural integrity and role balance" },
  { key: "synergy", label: "Synergy", icon: Zap, desc: "Mechanical and tactical combo potential" },
  { key: "counter", label: "Countering", icon: Crosshair, desc: "Positional and mechanical advantages vs enemy" },
  { key: "threat", label: "Neutralization", icon: ShieldAlert, desc: "Ability to shut down high-priority targets" },
  { key: "base", label: "Meta Power", icon: TrendingUp, desc: "Current meta tier and raw champion strength" },
];

const ROLES = [Role.Baron, Role.Jungle, Role.Mid, Role.Dragon, Role.Support];

export function MatchupAnalysis() {
  const { ally, enemy, allChampions, settings, counterMatrix, scoredChampions, setHoveredStatMetric } = useDraftStore();
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

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

  const getGradeInfo = (champs: Champion[]) => {
      const breakdowns = champs.map(c => 
          scoredChampions.find(s => s.championId === c.id)
      ).filter(Boolean);
      
      const total = breakdowns.reduce((acc, b) => acc + (b?.finalScore || 0), 0);
      const avg = champs.length > 0 ? total / champs.length : 0;
      
      let grade = "D";
      if (avg >= 75) grade = "S+";
      else if (avg >= 68) grade = "S";
      else if (avg >= 60) grade = "A";
      else if (avg >= 52) grade = "B";
      else if (avg >= 44) grade = "C";
      
      return { total, avg, grade };
  };

  const allyGrade = getGradeInfo(allyChamps);
  const enemyGrade = getGradeInfo(enemyChamps);

  const getGradingTable = (champs: Champion[]) => {
      const breakdowns = champs.map(c => 
          scoredChampions.find(s => s.championId === c.id)?.breakdown
      ).filter(Boolean);
      
      const factor = breakdowns.length || 1;
      const getAvg = (k: string) => breakdowns.reduce((acc, b) => acc + ((b as any)?.[k] || 0), 0) / factor;

      return {
          composition: getAvg("composition"),
          synergy: getAvg("synergy"),
          counter: getAvg("counter"),
          threat: getAvg("threat"),
          base: getAvg("base"),
          risk: getAvg("risk"),
      };
  };

  const allyGrading = getGradingTable(allyChamps);
  const enemyGrading = getGradingTable(enemyChamps);

  const generateMatchupAnalysis = () => {
    const insights: Insight[] = [];

    if (allyChamps.length === 0 || enemyChamps.length === 0) {
      return [];
    }

    const getAvg = (team: Champion[], k: string) => calculateAverage(team, k);
    
    const allyStats = {
      early: getAvg(allyChamps, "earlyGameScore"),
      scaling: getAvg(allyChamps, "scalingScore"),
      engage: getAvg(allyChamps, "engageScore"),
      peel: getAvg(allyChamps, "peelScore"),
      range: getAvg(allyChamps, "rangeScore"),
      objective: getAvg(allyChamps, "objectiveScore"),
      waveclear: getAvg(allyChamps, "waveclearScore"),
    };

    const enemyStats = {
      early: getAvg(enemyChamps, "earlyGameScore"),
      scaling: getAvg(enemyChamps, "scalingScore"),
      engage: getAvg(enemyChamps, "engageScore"),
      peel: getAvg(enemyChamps, "peelScore"),
      range: getAvg(enemyChamps, "rangeScore"),
      objective: getAvg(enemyChamps, "objectiveScore"),
      waveclear: getAvg(enemyChamps, "waveclearScore"),
    };

    // 1. Strategic Pressure
    const earlyDiff = allyStats.early - enemyStats.early;
    if (earlyDiff > 0.8) {
      insights.push({ type: "win", text: "Early Advantage: You out-pressure them early. Force lane priority and Rift Herald." });
    } else if (earlyDiff < -0.8) {
      insights.push({ type: "risk", text: "Tempo Risk: Enemy has superior early presence. Play safe and defensively during laning phase." });
    }

    const scalingDiff = allyStats.scaling - enemyStats.scaling;
    if (scalingDiff > 0.8) {
      insights.push({ type: "win", text: "Late Game Scaler: You out-scale the enemy. Focus on stalling and objective trading." });
    } else if (scalingDiff < -0.8) {
      insights.push({ type: "risk", text: "Outscaled: Enemy power ceiling is much higher. Must find mid-game closures." });
    }

    // 2. Tactical Engagement
    const rangeDiff = allyStats.range - enemyStats.range;
    if (rangeDiff > 1.0) {
      insights.push({ type: "strength", text: "Range Superiority: You can poke them down from distance before they can engage." });
    } else if (rangeDiff < -1.0) {
      insights.push({ type: "risk", text: "Out-Ranged: You'll be chipped down; look for hard engage or flank opportunities." });
    }

    const engageVsPeel = allyStats.engage - enemyStats.peel;
    if (engageVsPeel > 1.2) {
      insights.push({ type: "win", text: "Free Initiation: Your engage tools outclass their peel. Force fights on your terms." });
    } else if (engageVsPeel < -1.2) {
      insights.push({ type: "risk", text: "Engage Blocked: Enemy has high disengage. Avoid blind dives; they will counter-collapse." });
    }

    // 3. Objectives
    const objDiff = allyStats.objective - enemyStats.objective;
    if (objDiff > 1.5) {
      insights.push({ type: "win", text: "Objective Burn: You melt neutral objectives much faster. Use Baron as pressure bait." });
    }

    const wvDiff = allyStats.waveclear - enemyStats.waveclear;
    if (wvDiff < -1.5) {
      insights.push({ type: "risk", text: "Siege Risk: They have better waveclear. Defending against their pushes will be difficult." });
    }

    return insights;
  };

  return (
    <div className={cn(
      "h-full flex flex-col border border-white/5 rounded-xl overflow-hidden shadow-2xl relative",
      settings.disableTransparency ? "bg-zinc-950" : "bg-black/40 backdrop-blur-3xl"
    )}>
        <div className="h-full flex flex-col p-4 overflow-hidden">

            {/* Team Summaries */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <TeamOverview 
                  grade={allyGrade} 
                  damage={allyDamage} 
                  grading={allyGrading} 
                  color="blue" 
                  isSuperior={allyGrade.total > enemyGrade.total + 0.1}
                />
                <TeamOverview 
                  grade={enemyGrade} 
                  damage={enemyDamage} 
                  grading={enemyGrading} 
                  color="red" 
                  isEnemy 
                  isSuperior={enemyGrade.total > allyGrade.total + 0.1}
                />
            </div>

            {/* Scrollable Section */}
            <div className="flex-1 min-h-0 relative group/scroll overflow-hidden">
                <div className="h-full overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-2 pb-8">
                    
                    {/* Efficiency Grading - engine components 0-100 */}
                    <div className="flex flex-col gap-1.5 bg-black/20 p-2.5 rounded-lg border border-white/5">
                        <div className="flex items-center justify-center text-[10px] font-black text-white/40 tracking-widest border-b border-white/5 pb-1.5 mb-1.5">
                            EFFICIENCY GRADING
                        </div>
                        {ENGINE_METRICS.map(m => {
                            const aVal = (allyGrading as any)[m.key];
                            const eVal = (enemyGrading as any)[m.key];
                            const aWin = aVal > eVal;
                            const eWin = eVal > aVal;
                            
                            const aNumColor = aWin ? "text-blue-400" : "text-white/40";
                            const eNumColor = eWin ? "text-red-400" : "text-white/40";
                            const aBarColor = aWin ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.2)]" : "bg-blue-500/10";
                            const eBarColor = eWin ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]" : "bg-red-500/10";
                            
                            return (
                                  <div key={m.key} className="flex items-center gap-3 group h-8 px-1.5 hover:bg-white/[0.03] rounded transition-colors duration-200">
                                     <span className={cn("w-7 text-right font-bold tabular-nums text-[13px] transition-colors duration-300", aNumColor)}>{aVal.toFixed(0)}</span>
                                     <div className="flex-1 h-1.5 rounded-full bg-zinc-900/50 border border-white/5 overflow-hidden flex justify-end">
                                         <div className={cn("h-full transition-all duration-500", aBarColor)} style={{ width: `${aVal}%` }} />
                                     </div>
                                     <div className="w-24 flex flex-col items-center justify-center relative h-8 shrink-0">
                                         <div 
                                             className="flex items-center gap-1.5 text-[9px] font-black tracking-wider uppercase transition-colors duration-300 justify-center text-zinc-500 cursor-help group-hover:text-zinc-200"
                                             onMouseEnter={() => setHoveredStatMetric(m.key)}
                                             onMouseLeave={() => setHoveredStatMetric(null)}
                                         >
                                             <m.icon className="w-3.5 h-3.5 opacity-80" /> {m.label}
                                         </div>
                                         
                                         {/* Custom Styled Tooltip */}
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 bg-zinc-950/95 border border-white/10 rounded-lg text-[9.5px] font-medium text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl backdrop-blur-md translate-y-1 group-hover:translate-y-0 text-center">
                                             {m.desc}
                                             <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-950/95" />
                                         </div>
                                     </div>
                                     <div className="flex-1 h-1.5 rounded-full bg-zinc-900/50 border border-white/5 overflow-hidden flex justify-start">
                                         <div className={cn("h-full transition-all duration-500", eBarColor)} style={{ width: `${eVal}%` }} />
                                     </div>
                                     <span className={cn("w-7 text-left font-bold tabular-nums text-[13px] transition-colors duration-300", eNumColor)}>{eVal.toFixed(0)}</span>
                                 </div>
                             );
                        })}
                    </div>

                    {/* Tactical Parameters - 0-10 stats */}
                    <div className="flex flex-col gap-1 bg-black/20 p-2.5 rounded-lg border border-white/5">
                        <div className="flex items-center justify-center text-[10px] font-black text-white/40 tracking-widest border-b border-white/5 pb-1.5 mb-1.5">
                            TACTICAL PARAMETERS
                        </div>
                        {STAT_METRICS.filter(m => isStatsExpanded || IMPORTANT_METRICS.includes(m.key)).map(m => {
                            const aVal = calculateAverage(allyChamps, m.key);
                            const eVal = calculateAverage(enemyChamps, m.key);
                            const aWin = aWinCheck(aVal, eVal);
                            const eWin = eWinCheck(aVal, eVal);
                            
                            const aNumColor = aWin ? "text-blue-400" : "text-white/40";
                            const eNumColor = eWin ? "text-red-400" : "text-white/40";
                            const aBarColor = aWin ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.2)]" : "bg-blue-500/10";
                            const eBarColor = eWin ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]" : "bg-red-500/10";
                            
                            return (
                                  <div 
                                    key={m.key} 
                                    className="flex items-center gap-3 group h-8 px-1.5 hover:bg-white/[0.03] rounded transition-colors duration-200 cursor-help"
                                    onMouseEnter={() => setHoveredStatMetric(m.key)}
                                    onMouseLeave={() => setHoveredStatMetric(null)}
                                  >
                                     <span className={cn("w-7 text-right font-bold tabular-nums text-[13px] transition-colors duration-300", aNumColor)}>{aVal.toFixed(1)}</span>
                                     <div className="flex-1 h-1.5 rounded-full bg-zinc-900/50 border border-white/5 overflow-hidden flex justify-end">
                                         <div className={cn("h-full transition-all duration-500", aBarColor)} style={{ width: `${(aVal/10)*100}%` }} />
                                     </div>
                                     
                                     <div className="w-24 flex flex-col items-center justify-center relative h-8">
                                         <div className="flex items-center gap-1.5 text-[9px] font-black tracking-wider uppercase transition-colors duration-300 justify-center text-zinc-500 group-hover:text-zinc-200">
                                             <m.icon className="w-3.5 h-3.5 opacity-80" /> {m.label}
                                         </div>
                                         
                                         {/* Tooltip */}
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 bg-zinc-950/95 border border-white/10 rounded-lg text-[9.5px] font-medium text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl backdrop-blur-md translate-y-1 group-hover:translate-y-0 text-center">
                                             {m.desc}
                                             <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-950/95" />
                                         </div>
                                     </div>
                                     
                                     <div className="flex-1 h-1.5 rounded-full bg-zinc-900/50 border border-white/5 overflow-hidden flex justify-start">
                                         <div className={cn("h-full transition-all duration-300", eBarColor)} style={{ width: `${(eVal/10)*100}%` }} />
                                     </div>
                                     <span className={cn("w-7 text-left font-bold tabular-nums text-[13px] transition-colors duration-300", eNumColor)}>{eVal.toFixed(1)}</span>
                                 </div>
                             );
                        })}

                        <div className="flex justify-center mt-2">
                            <button 
                                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                                className="flex items-center gap-1.5 py-1 px-3 text-[9px] font-black text-zinc-500 hover:text-white transition-all tracking-widest hover:bg-white/5 rounded-md"
                            >
                                {isStatsExpanded ? (
                                    <><ChevronUp className="w-3 h-3" /> Collapse</>
                                ) : (
                                    <><ChevronDown className="w-3 h-3" /> Expand</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                {/* Scroll Fade Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
            </div>

            <div className="mt-1.5">
              <div className="border border-white/5 rounded-lg bg-black/20 p-4 relative overflow-hidden flex flex-col gap-3 shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                  <TacticalReport 
                    insights={generateMatchupAnalysis()} 
                    emptyText="Pick both teams to generate matchup analysis."
                  />
              </div>
            </div>
        </div>
    </div>
  );
}

const aWinCheck = (a: number, e: number) => a >= e + 0.1;
const eWinCheck = (a: number, e: number) => e >= a + 0.1;

// ------------------------------------------------------------------------------------------------ //
// Reusable Sub-Components
// ------------------------------------------------------------------------------------------------ //

function TeamOverview({ grade, damage, grading, color, isEnemy, isSuperior }: any) {
    const { settings } = useDraftStore();
    const themeColor = color === "blue" ? "text-blue-500" : "text-red-500";
    
    // Grade styling
    const isS = grade.grade.startsWith("S");
    const gradeColor = isS ? "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]" :
                       grade.grade === "A" ? "border-emerald-500/50" :
                       grade.grade === "B" ? "border-blue-500/50" :
                       "border-white/10";
    
    return (
        <div className={cn(
            "bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-3 shadow-xl relative overflow-hidden",
            isEnemy ? "items-end" : "items-start"
        )}>
            {/* Subtle Gradient Accent */}
            <div className={cn(
                "absolute top-0 w-full h-0.5 opacity-40",
                color === "blue" ? "bg-blue-500" : "bg-red-500",
                isEnemy ? "right-0" : "left-0"
            )} />

            {/* Modular Scorecard System - Isolated Components */}
            <div className={cn(
                "flex items-center gap-2 w-full", 
                isEnemy ? "flex-row-reverse" : "flex-row"
            )}>
                 {/* Module 1: Rating Badge */}
                 <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl border shadow-2xl shrink-0 transition-all duration-500 overflow-hidden relative group/grade",
                    isS ? "border-gold-shimmer" : gradeColor,
                    settings.disableTransparency ? "bg-zinc-900" : "bg-black/40 backdrop-blur-xl"
                 )}>
                    <span className={cn(
                      "text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br",
                      isS ? "from-yellow-400 via-orange-400 to-yellow-600" :
                      grade.grade === "A" ? "from-emerald-400 to-emerald-600" :
                      grade.grade === "B" ? "from-blue-400 to-blue-600" :
                      "from-zinc-400 to-zinc-600"
                    )}>{grade.grade}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-zinc-950/95 border border-white/10 rounded-lg text-[9.5px] font-bold text-zinc-100 whitespace-nowrap opacity-0 group-hover/grade:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl backdrop-blur-md translate-y-1 group-hover/grade:translate-y-0 text-center">
                        COMPOSITION GRADE
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-950/95" />
                    </div>
                 </div>
                 
                 {/* Module 2: Average Power */}
                 <div className={cn(
                    "flex flex-col items-center justify-center px-3 h-12 rounded-xl border border-white/5 shadow-2xl grow min-w-[60px] relative group/avg",
                    settings.disableTransparency ? "bg-zinc-900" : "bg-black/25 backdrop-blur-md"
                 )}>
                    <span className={cn(
                        "text-lg font-black tabular-nums tracking-tighter leading-none", 
                        grade.avg >= 60 ? "text-emerald-400" : grade.avg >= 50 ? "text-blue-400" : "text-zinc-400"
                    )}>
                        {grade.avg.toFixed(1)}
                    </span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-zinc-950/95 border border-white/10 rounded-lg text-[9.5px] font-bold text-zinc-100 whitespace-nowrap opacity-0 group-hover/avg:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl backdrop-blur-md translate-y-1 group-hover/avg:translate-y-0 text-center">
                        AVERAGE POWER
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-950/95" />
                    </div>
                 </div>

                 {/* Module 3: Total Power */}
                 <div className={cn(
                    "flex items-center justify-center px-4 h-12 rounded-xl border border-white/10 shadow-2xl shrink-0 relative group/total",
                    settings.disableTransparency ? "bg-zinc-900" : "bg-white/[0.03] backdrop-blur-2xl"
                 )}>
                    <span className={cn(
                        "text-2xl font-black tabular-nums tracking-tighter drop-shadow-xl",
                        isSuperior ? (color === "blue" ? "text-blue-400" : "text-red-400") : "text-white"
                    )}>
                        {grade.total.toFixed(0)}
                    </span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-zinc-950/95 border border-white/10 rounded-lg text-[9.5px] font-bold text-zinc-100 whitespace-nowrap opacity-0 group-hover/total:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl backdrop-blur-md translate-y-1 group-hover/total:translate-y-0 text-center">
                        TOTAL MECHANICAL POWER
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-950/95" />
                    </div>
                 </div>
            </div>

            {/* Part 3: Full Width Damage Mix with Overlaid Badges */}
            <div className="w-full mt-auto relative">
                {/* Centered Labels Above Bars */}
                <div className="flex w-full mb-1.5 items-end">
                    <div style={{ width: `${damage.ad}%` }} className="flex justify-center shrink-0 overflow-visible relative group/ad">
                        {damage.ad >= 10 && (
                            <div className="flex items-center gap-1.5 leading-none cursor-help">
                                <span className="text-[12px] font-black text-orange-400 tracking-wider">AD</span>
                                <span className="text-[12px] font-black text-white tabular-nums">
                                    {damage.ad.toFixed(0)}%
                                </span>
                            </div>
                        )}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950/95 border border-white/10 rounded-lg text-[9px] font-bold text-orange-400 whitespace-nowrap opacity-0 group-hover/ad:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl translate-y-1 group-hover/ad:translate-y-0">
                            PHYSICAL DAMAGE
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-950/95" />
                        </div>
                    </div>
                    <div style={{ width: `${damage.ap}%` }} className="flex justify-center shrink-0 overflow-visible relative group/ap">
                        {damage.ap >= 10 && (
                            <div className="flex items-center gap-1.5 leading-none cursor-help">
                                <span className="text-[12px] font-black text-sky-400 tracking-wider">AP</span>
                                <span className="text-[12px] font-black text-white tabular-nums">
                                    {damage.ap.toFixed(0)}%
                                </span>
                            </div>
                        )}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950/95 border border-white/10 rounded-lg text-[9px] font-bold text-sky-400 whitespace-nowrap opacity-0 group-hover/ap:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl translate-y-1 group-hover/ap:translate-y-0">
                            MAGIC DAMAGE
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-950/95" />
                        </div>
                    </div>
                    <div style={{ width: `${damage.truePct}%` }} className="flex justify-center shrink-0 overflow-visible relative group/true">
                        {damage.truePct >= 10 && (
                            <div className="flex items-center gap-1.5 leading-none cursor-help">
                                <span className="text-[12px] font-black text-white/70 tracking-wider">TRUE</span>
                                <span className="text-[12px] font-black text-white tabular-nums">
                                    {damage.truePct.toFixed(0)}%
                                </span>
                            </div>
                        )}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-950/95 border border-white/10 rounded-lg text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover/true:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl translate-y-1 group-hover/true:translate-y-0">
                            TRUE DAMAGE
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-950/95" />
                        </div>
                    </div>
                </div>

                <div className="w-full h-2 rounded-full overflow-hidden bg-black/40 flex shadow-inner border border-white/5">
                    <div style={{ width: `${damage.ad}%` }} className="bg-orange-500 h-full relative group transition-all duration-500">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100" />
                    </div>
                    <div style={{ width: `${damage.ap}%` }} className="bg-sky-500 h-full relative group transition-all duration-500">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100" />
                    </div>
                    <div style={{ width: `${damage.truePct}%` }} className="bg-white h-full relative group transition-all duration-500">
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function EngineRow({ label, value, color, isEnemy }: any) {
    return (
        <div className={cn("flex flex-col gap-0.5", isEnemy && "items-end")}>
            <div className="flex items-center gap-1 opacity-50">
                <Dna className="w-2.5 h-2.5 text-zinc-500" />
                <span className="text-[8px] font-black text-zinc-400 tracking-wider font-sans">{label}</span>
            </div>
            <span className={cn("font-black tabular-nums text-base leading-none", color)}>{value.toFixed(1)}</span>
        </div>
    )
}

