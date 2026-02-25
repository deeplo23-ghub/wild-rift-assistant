"use client";

import React, { useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { cn, formatTag } from "@/lib/utils";
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
  AlertTriangle
} from "lucide-react";

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

  const generateAnalysis = () => {
    const analysis: { strengths: string[], weaknesses: string[], winConditions: string[] } = {
      strengths: [],
      weaknesses: [],
      winConditions: []
    };

    if (allyChamps.length < 5 || enemyChamps.length < 5) {
      return null;
    }

    // --- Metric Calculation ---
    const getAvg = (team: Champion[], k: string) => calculateAverage(team, k);
    
    const ally = {
      early: getAvg(allyChamps, "earlyGameScore"),
      scaling: getAvg(allyChamps, "scalingScore"),
      cc: getAvg(allyChamps, "ccScore"),
      burst: getAvg(allyChamps, "burstScore"),
      durability: getAvg(allyChamps, "durabilityScore"),
      engage: getAvg(allyChamps, "engageScore"),
      peel: getAvg(allyChamps, "peelScore"),
      range: getAvg(allyChamps, "rangeScore"),
      sustain: getAvg(allyChamps, "sustainScore"),
      teamfight: getAvg(allyChamps, "teamfightScore"),
      objective: getAvg(allyChamps, "objectiveScore"),
      waveclear: getAvg(allyChamps, "waveclearScore"),
      mobility: getAvg(allyChamps, "mobilityScore"),
    };

    const enemy = {
      early: getAvg(enemyChamps, "earlyGameScore"),
      scaling: getAvg(enemyChamps, "scalingScore"),
      cc: getAvg(enemyChamps, "ccScore"),
      burst: getAvg(enemyChamps, "burstScore"),
      durability: getAvg(enemyChamps, "durabilityScore"),
      engage: getAvg(enemyChamps, "engageScore"),
      peel: getAvg(enemyChamps, "peelScore"),
      range: getAvg(enemyChamps, "rangeScore"),
      sustain: getAvg(enemyChamps, "sustainScore"),
      teamfight: getAvg(enemyChamps, "teamfightScore"),
      objective: getAvg(enemyChamps, "objectiveScore"),
      waveclear: getAvg(enemyChamps, "waveclearScore"),
      mobility: getAvg(enemyChamps, "mobilityScore"),
    };

    // --- 1. Strategic Identity & Win Conditions ---
    const earlyDiff = ally.early - enemy.early;
    const scalingDiff = ally.scaling - enemy.scaling;

    if (earlyDiff > 1.2) {
      analysis.strengths.push("High Tempo: Superior early-game pressure allows for active lane priority and early snowballing.");
      analysis.winConditions.push("Aggressive Snowball: Secure first blood and Rift Herald to break towers before the 10-minute mark.");
    } else if (earlyDiff < -1.2) {
      analysis.weaknesses.push("Laning Vulnerability: Opponent has massive lane priority. Ally lanes are at risk of being shoved in and dove.");
      analysis.winConditions.push("Containment Path: Concede non-essential outer towers to secure safe farm and reach mid-game spikes.");
    }

    if (scalingDiff > 1.2) {
      analysis.strengths.push("Late-Game Superiority: Team composition out-values the enemy significantly as the game progresses.");
      analysis.winConditions.push("Stall & Scale: Prioritize objective trading over risky 5v5s until core items are completed.");
    } else if (scalingDiff < -1.2) {
      analysis.weaknesses.push("Outscaled: The enemy draft has a much higher power ceiling. The game becomes much harder after 18 minutes.");
      analysis.winConditions.push("Forced Conclusion: Must end the game through Baron or a clean soul push before enemy hypercarries reach 4 items.");
    }

    // --- 2. Combat Tactics (Burst vs Sustain / Engage vs Peel) ---
    const burstVsDurability = ally.burst - enemy.durability;
    if (burstVsDurability > 1.5) {
      analysis.strengths.push("Pick Potential: High burst against low durability. Can delete priority targets before teamfights even start.");
    }

    const engageVsPeel = ally.engage - enemy.peel;
    if (engageVsPeel > 1.5) {
      analysis.strengths.push("Forced Initiation: Excellent initiation tools can reliably bypass enemy defenses and force favorable fights.");
    } else if (engageVsPeel < -1.5) {
      analysis.weaknesses.push("Engage Blocked: Enemy team has high peel/disengage. Blindly diving will likely result in a counter-collapse.");
      analysis.winConditions.push("Wait for Mistakes: Instead of forcing, wait for enemy mispositioning or use objectives to draw them out.");
    }

    // --- 3. Damage Balance ---
    if (allyDamage.ad > 80) {
      analysis.weaknesses.push("Single Damage Source (AD): Enemy can stack Armor (Thornmail/Frozen Heart) to negate most of your damage.");
    } else if (allyDamage.ap > 80) {
      analysis.weaknesses.push("Single Damage Source (AP): Enemy will build Mercury Treads and Force of Nature to drastically reduce your impact.");
    }

    // --- 4. Special Utility ---
    if (ally.waveclear - enemy.waveclear < -2) {
      analysis.weaknesses.push("Siege Vulnerability: Poor waveclear makes it extremely difficult to defend towers against enemy pushes.");
    }
    
    if (ally.objective > 7.5 && enemy.objective < 6) {
      analysis.winConditions.push("Objective Blitz: Can burn Baron/Elder significantly faster than the enemy; use this to force them into bad positions.");
    }

    if (ally.cc > 7.5) {
      analysis.strengths.push("CC Lockdown: Exceptional crowd control allows for long 'womb-combo' chains that can win fights instantly.");
    }

    // Default if empty
    if (analysis.strengths.length === 0 && analysis.weaknesses.length === 0) {
      analysis.strengths.push("Value Neutral Composition: This draft relies on execution and mechanical skill rather than strategic synergy.");
    }

    return analysis;
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
            <div className="flex flex-col gap-2 flex-1 min-h-0">
                <div className="flex flex-col gap-1 bg-black/20 p-2.5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-1.5 text-[8px] uppercase font-black text-cyan-500 tracking-widest border-b border-white/5 pb-1.5 mb-1.5 opacity-70">
                        <TrendingUp className="w-2.5 h-2.5" /> Direct Engine Parametrics
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
                             <div key={m.key} className="flex items-center gap-3 group h-6">
                                 <span className={cn("w-6 text-right font-black tabular-nums text-[11px] transition-colors duration-300", aNumColor)}>{aVal.toFixed(1)}</span>
                                 <div className="flex-1 h-2 rounded-full bg-zinc-900/50 border border-white/5 overflow-hidden flex justify-end">
                                     <div className={cn("h-full transition-all duration-300", aBarColor)} style={{ width: `${(aVal/10)*100}%` }} />
                                 </div>
                                 
                                 <div className="w-24 flex flex-col items-center justify-center relative h-6">
                                     <div className={cn("flex items-center gap-1 text-[8px] uppercase font-bold transition-colors duration-300 absolute inset-0 justify-center group-hover:opacity-0 pointer-events-none", iconColor)}>
                                         <m.icon className="w-2.5 h-2.5" /> {m.label}
                                     </div>
                                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                         <span className="text-[8px] text-zinc-400 font-medium italic text-center w-full whitespace-nowrap overflow-hidden text-ellipsis">{m.desc}</span>
                                     </div>
                                 </div>
                                 
                                 <div className="flex-1 h-2 rounded-full bg-zinc-900/50 border border-white/5 overflow-hidden flex justify-start">
                                     <div className={cn("h-full transition-all duration-300", eBarColor)} style={{ width: `${(eVal/10)*100}%` }} />
                                 </div>
                                 <span className={cn("w-6 text-left font-black tabular-nums text-[11px] transition-colors duration-300", eNumColor)}>{eVal.toFixed(1)}</span>
                             </div>
                         );
                     })}
                </div>
            </div>

            <div className="mt-4"><VerdictBar analysis={generateAnalysis()} /></div>
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
                                          <span className={`text-[9px] font-black tracking-tight ${themeColor}`}>{formatTag(t)}</span>
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

function VerdictBar({ analysis }: { analysis: any }) {
    if (!analysis) {
        return (
            <div className="border border-white/5 rounded-lg bg-black/20 p-4 flex flex-col items-center justify-center gap-2 opacity-30 italic text-[10px] text-zinc-500">
                <Brain className="w-5 h-5 mb-1" />
                Draft 10 champions to generate full strategic analysis
            </div>
        );
    }

    const allInsights = [
        ...analysis.winConditions.map((v: string) => ({ type: "win", text: v })),
        ...analysis.weaknesses.map((v: string) => ({ type: "risk", text: v })),
        ...analysis.strengths.map((v: string) => ({ type: "strength", text: v })),
    ];

    return (
        <div className="border border-white/5 rounded-lg bg-black/20 p-4 relative overflow-hidden flex flex-col gap-3 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <ul className="flex flex-col gap-3.5">
                {allInsights.map((insight, i) => {
                    const configMap = {
                        win: { dot: "bg-cyan-500", marker: "border-cyan-500/30" },
                        risk: { dot: "bg-red-500", marker: "border-red-500/30" },
                        strength: { dot: "bg-emerald-500", marker: "border-emerald-500/20" },
                    };
                    const config = configMap[insight.type as keyof typeof configMap];

                    return (
                        <li key={i} className="flex gap-4 group">
                            <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]", config?.dot || "bg-zinc-500")} />
                            <div className={cn("flex flex-col border-l pl-4", config?.marker || "border-zinc-500/20")}>
                                <span className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                                    {insight.text}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>
      </div>
    );
}
