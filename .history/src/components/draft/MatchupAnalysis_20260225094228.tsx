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
  Crosshair,
  TrendingUp,
  Timer,
  Move,
  Heart,
  Flame,
  Swords,
  Brain,
  AlertTriangle,
  Tags,
  Activity,
  Award
} from "lucide-react";

const STAT_METRICS = [
  { key: "durabilityScore", label: "Toughness", icon: Shield },
  { key: "engageScore", label: "Engage", icon: Zap },
  { key: "peelScore", label: "Peel", icon: ShieldAlert },
  { key: "ccScore", label: "Control", icon: Crosshair },
  { key: "scalingScore", label: "Scaling", icon: TrendingUp },
  { key: "earlyGameScore", label: "Early Game", icon: Timer },
  { key: "mobilityScore", label: "Mobility", icon: Move },
  { key: "utilityScore", label: "Utility", icon: Heart },
  { key: "waveclearScore", label: "Waveclear", icon: Flame },
];

export function MatchupAnalysis() {
  const { ally, enemy, allChampions, settings } = useDraftStore();
  const [activeDesign, setActiveDesign] = useState(1);

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

  const getTeamStats = (champs: Champion[]) => {
      return STAT_METRICS.map(m => ({
          ...m,
          value: calculateAverage(champs, m.key)
      })).sort((a, b) => b.value - a.value);
  };

  const allyStats = useMemo(() => getTeamStats(allyChamps), [allyChamps]);
  const enemyStats = useMemo(() => getTeamStats(enemyChamps), [enemyChamps]);

  // Find Strengths and Weaknesses
  const allyStrengths = allyStats.slice(0, 3);
  const allyWeaknesses = allyStats.slice(-3).reverse();
  const enemyStrengths = enemyStats.slice(0, 3);
  const enemyWeaknesses = enemyStats.slice(-3).reverse();

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

  const generateVerdict = () => {
      const earlyDiff = calculateAverage(allyChamps, "earlyGameScore") - calculateAverage(enemyChamps, "earlyGameScore");
      const scalingDiff = calculateAverage(allyChamps, "scalingScore") - calculateAverage(enemyChamps, "scalingScore");
      const ccDiff = calculateAverage(allyChamps, "ccScore") - calculateAverage(enemyChamps, "ccScore");
      
      let text = "This matchup is heavily dependent on execution. ";
      
      if (earlyDiff > 1.5) text += "The Ally team has a significant early game advantage and must snowball before the Enemy comes online. ";
      else if (earlyDiff < -1.5) text += "The Enemy team dictates the early pace. Allies must play defensively and look for safe farm. ";
      
      if (scalingDiff > 1.5) text += "If the game goes late, the Ally composition will severely out-value the enemy. ";
      else if (scalingDiff < -1.5) text += "The Enemy team is a late-game ticking time bomb. The Ally team must close out objectives quickly. ";

      if (ccDiff > 2) text += "Allies have superior crowd control, making teamfights highly favorable if chained correctly.";
      else if (ccDiff < -2) text += "Enemy lockdown is oppressive; Allies will need Quicksilver Sashes and excellent positioning.";

      if (earlyDiff > 0 && scalingDiff > 0) text = "The Ally team has drafted a superior composition, boasting both early pressure and better late-game scaling. This is an extremely favorable matchup.";
      
      return text;
  };

  const props = {
      allyChamps, enemyChamps, allyStats, enemyStats, allyStrengths, enemyStrengths,
      allyWeaknesses, enemyWeaknesses, allyDamage, enemyDamage, getTopTags,
      generateVerdict, settings, calculateAverage
  };

  return (
    <div className={cn(
      "h-full flex flex-col border border-white/5 rounded-xl overflow-hidden shadow-2xl relative",
      settings.disableTransparency ? "bg-zinc-950" : "bg-black/40 backdrop-blur-3xl"
    )}>
      {/* UI Switcher (Temporary A/B Testing) */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1 bg-black/80 rounded-full border border-white/10 backdrop-blur-md shadow-2xl">
           <span className="text-[8px] font-black uppercase text-zinc-500 pl-2 tracking-widest">A/B Test UI:</span>
           {[1, 2, 3, 4, 5].map(d => (
               <button 
                  key={d} 
                  onClick={() => setActiveDesign(d)}
                  className={cn(
                      "w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center transition-all",
                      activeDesign === d ? "bg-white text-black scale-110 shadow-[0_0_10px_white]" : "text-zinc-400 border border-white/5 hover:text-white hover:bg-white/10"
                  )}
               >{d}</button>
           ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden mt-6">
        {activeDesign === 1 && <Design1 {...props} />}
        {activeDesign === 2 && <Design2 {...props} />}
        {activeDesign === 3 && <Design3 {...props} />}
        {activeDesign === 4 && <Design4 {...props} />}
        {activeDesign === 5 && <Design5 {...props} />}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ //
// DESIGN 1: Classic Tug of War (Current Highly Dense Dashboard)
// ------------------------------------------------------------------------------------------------ //
function Design1({ allyChamps, enemyChamps, allyDamage, enemyDamage, allyStrengths, enemyStrengths, allyWeaknesses, enemyWeaknesses, getTopTags, generateVerdict, calculateAverage }: any) {
    return (
        <div className="h-full flex flex-col">
            <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-black/20 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest shrink-0 w-16">Ally</span>
                    <div className="flex -space-x-1.5">
                        {allyChamps.map((c: any) => (
                            <div key={c.id} className="w-6 h-6 rounded-md border border-white/10 overflow-hidden shadow-md">
                                <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full" />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-[0.3em] text-zinc-500 bg-white/5 px-4 py-1 rounded-full">
                    <Activity className="w-3 h-3 text-pink-500" />
                    Tactical Analysis (v1)
                </div>

                <div className="flex items-center gap-3 flex-row-reverse">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest shrink-0 w-16 text-right">Enemy</span>
                    <div className="flex -space-x-1.5 flex-row-reverse space-x-reverse">
                        {enemyChamps.map((c: any) => (
                            <div key={c.id} className="w-6 h-6 rounded-md border border-white/10 overflow-hidden shadow-md">
                                <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full grayscale hover:grayscale-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_260px_1fr] lg:grid-cols-[1fr_320px_1fr] divide-x divide-white/5">
                <div className="flex flex-col p-4 gap-6 bg-gradient-to-br from-blue-500/5 to-transparent overflow-hidden">
                    <TeamSpecificStats title="Ally Profile" color="blue" damage={allyDamage} tags={getTopTags(allyChamps)} strengths={allyStrengths} weaknesses={allyWeaknesses} />
                </div>

                <div className="flex flex-col justify-center p-4 gap-3 bg-black/20 shrink-0 relative">
                    <h3 className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Parametrix Compare</h3>
                    <div className="flex flex-col gap-2.5">
                        {STAT_METRICS.map(metric => {
                            const allyVal = calculateAverage(allyChamps, metric.key);
                            const enemyVal = calculateAverage(enemyChamps, metric.key);
                            const winner = allyVal > enemyVal + 0.5 ? "ally" : enemyVal > allyVal + 0.5 ? "enemy" : "tie";

                            return (
                                <div key={metric.key} className="flex items-center gap-2 group">
                                    <span className={cn("w-6 text-right text-[11px] font-black", winner === "ally" ? "text-blue-400" : "text-zinc-600")}>{allyVal.toFixed(1)}</span>
                                    <div className="flex-1 h-3 rounded bg-zinc-900 border border-white/5 overflow-hidden flex relative">
                                        <div className="h-full bg-blue-600 rounded-r-md transition-all absolute right-1/2" style={{ width: `${(allyVal / 10) * 50}%` }} />
                                        <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-700 z-10" />
                                        <div className="h-full bg-red-600 rounded-l-md transition-all absolute left-1/2" style={{ width: `${(enemyVal / 10) * 50}%` }} />
                                    </div>
                                    <div className="w-16 flex justify-center items-center relative">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 group-hover:opacity-0 transition-opacity absolute flex items-center justify-center text-center">{metric.label}</span>
                                        <metric.icon className="w-3.5 h-3.5 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity absolute" />
                                    </div>
                                    <div className="flex-1 h-3 rounded bg-zinc-900 border border-white/5 overflow-hidden flex relative transform scale-x-[-1]">
                                        <div className="h-full bg-red-600 rounded-r-md transition-all absolute right-1/2" style={{ width: `${(enemyVal / 10) * 50}%` }} />
                                        <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-700 z-10" />
                                        <div className="h-full bg-blue-600 rounded-l-md transition-all absolute left-1/2" style={{ width: `${(allyVal / 10) * 50}%` }} />
                                    </div>
                                    <span className={cn("w-6 text-left text-[11px] font-black", winner === "enemy" ? "text-red-400" : "text-zinc-600")}>{enemyVal.toFixed(1)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col p-4 gap-6 bg-gradient-to-bl from-red-500/5 to-transparent overflow-hidden">
                    <TeamSpecificStats title="Enemy Profile" color="red" damage={enemyDamage} tags={getTopTags(enemyChamps)} strengths={enemyStrengths} weaknesses={enemyWeaknesses} isEnemy />
                </div>
            </div>
            <VerdictBar generateVerdict={generateVerdict} />
        </div>
    );
}

// ------------------------------------------------------------------------------------------------ //
// DESIGN 2: Split Columns (Side by Side full length)
// ------------------------------------------------------------------------------------------------ //
function Design2({ allyChamps, enemyChamps, allyDamage, enemyDamage, allyStrengths, enemyStrengths, allyWeaknesses, enemyWeaknesses, getTopTags, generateVerdict, calculateAverage }: any) {
    return (
        <div className="h-full flex flex-col">
            <div className="h-10 flex items-center justify-center px-4 border-b border-white/5 bg-black/20 shrink-0">
                <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-[0.3em] text-zinc-500 bg-white/5 px-4 py-1 rounded-full">
                    Tactical Analysis (v2 - Split Columns)
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-white/5">
                <div className="flex flex-col p-4 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-xl font-black text-blue-500 uppercase tracking-widest shrink-0">Ally</span>
                        <div className="flex -space-x-2">
                            {allyChamps.map((c: any) => (
                                <div key={c.id} className="w-8 h-8 rounded-md border border-white/10 overflow-hidden shadow-md">
                                    <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <TeamSpecificStats title={false} color="blue" damage={allyDamage} tags={getTopTags(allyChamps)} strengths={allyStrengths} weaknesses={allyWeaknesses} />
                    
                    <div className="mt-6 flex flex-col gap-3">
                        <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Analytics Core</h3>
                        {STAT_METRICS.map(m => {
                            const val = calculateAverage(allyChamps, m.key);
                            return (
                                <div key={m.key} className="flex flex-col gap-1 w-full">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-300 uppercase">
                                        <span className="flex items-center gap-1"><m.icon className="w-3 h-3 text-blue-500" /> {m.label}</span>
                                        <span className="text-blue-400 tabular-nums">{val.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 rounded bg-zinc-900 border border-white/5 overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${(val/10)*100}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col p-4 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6 justify-end">
                        <div className="flex -space-x-2 flex-row-reverse space-x-reverse">
                            {enemyChamps.map((c: any) => (
                                <div key={c.id} className="w-8 h-8 rounded-md border border-white/10 overflow-hidden shadow-md">
                                    <ChampionIcon name={c.name} url={c.iconUrl} className="w-full h-full grayscale hover:grayscale-0" />
                                </div>
                            ))}
                        </div>
                        <span className="text-xl font-black text-red-500 uppercase tracking-widest shrink-0">Enemy</span>
                    </div>

                    <TeamSpecificStats title={false} color="red" damage={enemyDamage} tags={getTopTags(enemyChamps)} strengths={enemyStrengths} weaknesses={enemyWeaknesses} isEnemy />

                    <div className="mt-6 flex flex-col gap-3 items-end">
                        <h3 className="text-[10px] font-black uppercase text-red-400 tracking-widest">Analytics Core</h3>
                        {STAT_METRICS.map(m => {
                            const val = calculateAverage(enemyChamps, m.key);
                            return (
                                <div key={m.key} className="flex flex-col gap-1 w-full items-end">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-300 uppercase w-full flex-row-reverse">
                                        <span className="flex items-center gap-1 flex-row-reverse"><m.icon className="w-3 h-3 text-red-500" /> {m.label}</span>
                                        <span className="text-red-400 tabular-nums">{val.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full rounded bg-zinc-900 border border-white/5 overflow-hidden flex justify-end">
                                        <div className="h-full bg-red-500" style={{ width: `${(val/10)*100}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <VerdictBar generateVerdict={generateVerdict} />
        </div>
    );
}

// ------------------------------------------------------------------------------------------------ //
// DESIGN 3: Stat Grid (3x3 Cards in Center)
// ------------------------------------------------------------------------------------------------ //
function Design3({ allyChamps, enemyChamps, allyDamage, enemyDamage, allyStrengths, enemyStrengths, allyWeaknesses, enemyWeaknesses, getTopTags, generateVerdict, calculateAverage }: any) {
    return (
        <div className="h-full flex flex-col p-4 overflow-y-auto">
            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                <div className="flex-1 flex flex-col gap-4 pr-6 border-r border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            {allyChamps.map((c: any) => (
                                <ChampionIcon key={c.id} name={c.name} url={c.iconUrl} className="w-6 h-6 rounded border border-white/10" />
                            ))}
                        </div>
                        <span className="text-xl font-black text-blue-500 uppercase tracking-widest">Ally</span>
                    </div>
                    <TeamSpecificStatsCompact color="blue" damage={allyDamage} strengths={allyStrengths} weaknesses={allyWeaknesses} />
                </div>
                
                <div className="flex-1 flex flex-col gap-4 pl-6 items-end">
                    <div className="flex items-center gap-3 flex-row-reverse">
                        <div className="flex gap-1 flex-row-reverse">
                            {enemyChamps.map((c: any) => (
                                <ChampionIcon key={c.id} name={c.name} url={c.iconUrl} className="w-6 h-6 rounded border border-white/10 grayscale hover:grayscale-0" />
                            ))}
                        </div>
                        <span className="text-xl font-black text-red-500 uppercase tracking-widest">Enemy</span>
                    </div>
                    <TeamSpecificStatsCompact color="red" damage={enemyDamage} strengths={enemyStrengths} weaknesses={enemyWeaknesses} isEnemy />
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <h3 className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Tactical Grid</h3>
                <div className="grid grid-cols-3 gap-4">
                    {STAT_METRICS.map(m => {
                        const aVal = calculateAverage(allyChamps, m.key);
                        const eVal = calculateAverage(enemyChamps, m.key);
                        return (
                            <div key={m.key} className="bg-black/20 border border-white/5 rounded-lg p-3 flex flex-col gap-2">
                                <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-black text-zinc-300">
                                    <m.icon className="w-3 h-3 text-zinc-500" /> {m.label}
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-black">
                                    <span className="text-blue-400">{aVal.toFixed(1)}</span>
                                    <span className="text-red-400">{eVal.toFixed(1)}</span>
                                </div>
                                <div className="h-1.5 flex rounded bg-zinc-900 overflow-hidden divide-x divide-black">
                                    <div className="bg-blue-500" style={{ width: `${(aVal / (aVal + eVal)) * 100}%` }} />
                                    <div className="bg-red-500 flex-1" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-4"><VerdictBar generateVerdict={generateVerdict} /></div>
        </div>
    );
}

// ------------------------------------------------------------------------------------------------ //
// DESIGN 4: Horizontal Rows (Data Table)
// ------------------------------------------------------------------------------------------------ //
function Design4({ allyChamps, enemyChamps, allyDamage, enemyDamage, allyStrengths, enemyStrengths, allyWeaknesses, enemyWeaknesses, getTopTags, generateVerdict, calculateAverage }: any) {
    return (
        <div className="h-full flex flex-col p-4 overflow-y-auto">
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 mb-4">
                <div className="flex gap-2">
                    {allyChamps.map((c: any) => <ChampionIcon key={c.id} name={c.name} url={c.iconUrl} className="w-8 h-8 rounded shadow-md border border-blue-500/30" />)}
                </div>
                <span className="text-[10px] font-black text-zinc-500 tracking-[0.3em] uppercase">Matchup Profile</span>
                <div className="flex gap-2">
                    {enemyChamps.map((c: any) => <ChampionIcon key={c.id} name={c.name} url={c.iconUrl} className="w-8 h-8 rounded shadow-md border border-red-500/30 grayscale" />)}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/20 p-3 rounded-lg border border-white/5"><TeamSpecificStatsCompact color="blue" damage={allyDamage} strengths={allyStrengths} weaknesses={allyWeaknesses} /></div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5"><TeamSpecificStatsCompact color="red" damage={enemyDamage} strengths={enemyStrengths} weaknesses={enemyWeaknesses} isEnemy /></div>
            </div>

            <div className="flex flex-col gap-1 flex-1">
                {STAT_METRICS.map(m => {
                    const aVal = calculateAverage(allyChamps, m.key);
                    const eVal = calculateAverage(enemyChamps, m.key);
                    return (
                        <div key={m.key} className="flex items-center gap-4 bg-black/20 px-4 py-2 rounded border border-transparent hover:border-white/5 transition-all">
                            <span className="w-8 text-right font-black text-blue-400 tabular-nums text-sm">{aVal.toFixed(1)}</span>
                            <div className="flex-1 h-3 rounded bg-zinc-900 border border-white/5 overflow-hidden flex justify-end">
                                <div className="bg-blue-500 h-full" style={{ width: `${(aVal/10)*100}%` }} />
                            </div>
                            
                            <div className="w-24 flex items-center justify-center gap-1 text-[10px] uppercase font-black text-zinc-400">
                                <m.icon className="w-3 h-3" /> {m.label}
                            </div>
                            
                            <div className="flex-1 h-3 rounded bg-zinc-900 border border-white/5 overflow-hidden flex justify-start">
                                <div className="bg-red-500 h-full" style={{ width: `${(eVal/10)*100}%` }} />
                            </div>
                            <span className="w-8 text-left font-black text-red-400 tabular-nums text-sm">{eVal.toFixed(1)}</span>
                        </div>
                    );
                })}
            </div>
            <div className="mt-4"><VerdictBar generateVerdict={generateVerdict} /></div>
        </div>
    );
}

// ------------------------------------------------------------------------------------------------ //
// DESIGN 5: Minimalist Terminal
// ------------------------------------------------------------------------------------------------ //
function Design5({ allyChamps, enemyChamps, allyDamage, enemyDamage, allyStrengths, enemyStrengths, allyWeaknesses, enemyWeaknesses, getTopTags, generateVerdict, calculateAverage }: any) {
    return (
        <div className="h-full flex flex-col p-6 font-mono text-zinc-300 overflow-y-auto">
            <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100 mb-6 border-b border-white/10 pb-4">
                > MATCHUP_ANALYSIS_TERMINAL
            </h2>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-6 mb-6">
                <div>
                    <h3 className="text-blue-400 font-black mb-2 flex items-center gap-2">> ALLY_ENTITIES</h3>
                    <div className="flex gap-2">
                        {allyChamps.map((c: any) => <span key={c.id} className="text-[10px] uppercase bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded">{c.name}</span>)}
                    </div>
                    <div className="mt-4 text-[10px]">
                        DMG: {allyDamage.ad.toFixed(0)} PHYSICAL / {allyDamage.ap.toFixed(0)} MAGIC / {allyDamage.truePct.toFixed(0)} TRUE
                    </div>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-right">
                    <h3 className="text-red-400 font-black mb-2 flex items-center justify-end gap-2">ENEMY_ENTITIES <</h3>
                    <div className="flex gap-2 justify-end">
                        {enemyChamps.map((c: any) => <span key={c.id} className="text-[10px] uppercase bg-red-500/10 text-red-300 px-2 py-0.5 rounded">{c.name}</span>)}
                    </div>
                    <div className="mt-4 text-[10px]">
                        DMG: {enemyDamage.ad.toFixed(0)} PHYSICAL / {enemyDamage.ap.toFixed(0)} MAGIC / {enemyDamage.truePct.toFixed(0)} TRUE
                    </div>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-6">
                 <div>
                    <h3 className="text-emerald-400 text-[10px] tracking-widest font-bold mb-2">> ALLY_ADVANTAGES</h3>
                    {allyStrengths.map((s:any) => <div key={s.key} className="text-xs">{s.label}: {s.value.toFixed(1)}</div>)}
                 </div>
                 <div className="text-right">
                    <h3 className="text-emerald-400 text-[10px] tracking-widest font-bold mb-2">ENEMY_ADVANTAGES <</h3>
                    {enemyStrengths.map((s:any) => <div key={s.key} className="text-xs">{s.label}: {s.value.toFixed(1)}</div>)}
                 </div>
            </div>

            <div className="flex-1 bg-black/30 border border-white/10 p-4 rounded font-mono">
                <div className="grid grid-cols-3 text-[10px] font-bold text-zinc-500 mb-2 border-b border-white/5 pb-2">
                    <span>ALLY_OUTPUT</span>
                    <span className="text-center">METRIC_ID</span>
                    <span className="text-right">ENEMY_OUTPUT</span>
                </div>
                <div className="flex flex-col gap-2 cursor-default">
                    {STAT_METRICS.map(m => {
                        const aVal = calculateAverage(allyChamps, m.key);
                        const eVal = calculateAverage(enemyChamps, m.key);
                        const aWin = aVal > eVal;
                        return (
                            <div key={m.key} className="grid grid-cols-3 hover:bg-white/5 px-2 py-1 rounded">
                                <span className={cn("text-xs", aWin ? "text-blue-400 font-bold" : "text-zinc-600")}>[{aVal.toFixed(2)}]</span>
                                <span className="text-xs text-center text-zinc-300 uppercase tracking-widest">{m.label}</span>
                                <span className={cn("text-xs text-right", !aWin ? "text-red-400 font-bold" : "text-zinc-600")}>[{eVal.toFixed(2)}]</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-4 border border-purple-500/30 bg-purple-500/5 p-4 rounded text-xs leading-relaxed text-purple-300">
                <span className="font-bold">> SYSTEM_VERDICT: </span> {generateVerdict()}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------------------------------------ //
// Reusable Sub-Components
// ------------------------------------------------------------------------------------------------ //

function VerdictBar({ generateVerdict }: { generateVerdict: () => string }) {
    return (
        <div className="h-20 shrink-0 border-t border-white/5 bg-black/40 px-6 flex items-center gap-4 text-sm leading-relaxed text-zinc-300 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
             <Brain className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col overflow-hidden">
             <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 mb-0.5">Engine Verdict</span>
             <p className="font-medium italic truncate group-hover:whitespace-normal group-hover:absolute group-hover:inset-0 group-hover:z-10 group-hover:bg-zinc-950 group-hover:p-4 group-hover:border-t group-hover:border-purple-500/50 group-hover:text-sm transition-all duration-300 flex items-center">{generateVerdict()}</p>
          </div>
      </div>
    )
}

function TeamSpecificStats({ title, color, damage, tags, strengths, weaknesses, isEnemy }: any) {
    const themeColor = color === "blue" ? "text-blue-400" : "text-red-400";
    const bgTheme = color === "blue" ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20";
    const flexDir = isEnemy ? "items-end text-right" : "items-start text-left";

    return (
        <div className={`flex flex-col h-full gap-4 ${flexDir}`}>
            {title && <h2 className={`text-lg font-black uppercase tracking-tighter ${themeColor}`}>{title}</h2>}

            <div className={`flex flex-col gap-2 w-full ${isEnemy ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-zinc-500 tracking-widest">
                    <Tags className="w-3 h-3" /> Dominant Traits
                </div>
                <div className={`flex flex-wrap gap-1.5 ${isEnemy ? "justify-end" : "justify-start"}`}>
                    {tags.map(([t, count]: any) => (
                        <div key={t} className={`px-2 py-1 rounded border flex items-center gap-1.5 ${bgTheme}`}>
                            <span className={`text-[9px] font-black uppercase tracking-tight ${themeColor}`}>{t}</span>
                            <span className="text-[9px] font-bold text-white px-1 bg-black/40 rounded">x{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`flex flex-col gap-2 w-full mt-2 ${isEnemy ? "items-end" : "items-start"}`}>
               <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-zinc-500 tracking-widest">
                    <Swords className="w-3 h-3" /> Damage Matrix
               </div>
               <div className="flex gap-2 w-full max-w-[200px]">
                   <div style={{ width: `${damage.ad}%` }} className="h-1.5 bg-orange-500 rounded-full" title={`AD: ${damage.ad.toFixed(1)}%`} />
                   <div style={{ width: `${damage.ap}%` }} className="h-1.5 bg-sky-500 rounded-full" title={`AP: ${damage.ap.toFixed(1)}%`} />
                   <div style={{ width: `${damage.truePct}%` }} className="h-1.5 bg-white rounded-full" title={`True: ${damage.truePct.toFixed(1)}%`} />
               </div>
               <div className={`flex text-[8px] font-bold text-zinc-400 gap-3 ${isEnemy ? "flex-row-reverse" : "flex-row"}`}>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {damage.ad.toFixed(0)}%</span>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> {damage.ap.toFixed(0)}%</span>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-white" /> {damage.truePct.toFixed(0)}%</span>
               </div>
            </div>

            <div className="flex flex-col gap-4 w-full mt-4 bg-black/20 p-3 rounded-lg border border-white/5 flex-1 min-h-0">
                <div className="flex-1 space-y-2">
                    <div className={`flex items-center gap-1.5 text-[9px] uppercase font-black text-emerald-500 tracking-widest ${isEnemy ? "flex-row-reverse" : ""}`}>
                        <Award className="w-3 h-3" /> Key Advantages
                    </div>
                    <div className="space-y-1.5 w-full">
                        {strengths.map((s: any) => (
                            <div key={s.key} className={`flex justify-between items-center text-[10px] font-bold ${isEnemy ? "flex-row-reverse" : ""}`}>
                                <span className="text-zinc-300">{s.label}</span>
                                <span className="text-emerald-400 font-black tabular-nums">{s.value.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-px bg-white/5 w-full" />
                <div className="flex-1 space-y-2">
                    <div className={`flex items-center gap-1.5 text-[9px] uppercase font-black text-orange-500 tracking-widest ${isEnemy ? "flex-row-reverse" : ""}`}>
                        <AlertTriangle className="w-3 h-3" /> Exploitable Flaws
                    </div>
                    <div className="space-y-1.5 w-full">
                        {weaknesses.map((w: any) => (
                            <div key={w.key} className={`flex justify-between items-center text-[10px] font-bold ${isEnemy ? "flex-row-reverse" : ""}`}>
                                <span className="text-zinc-400">{w.label}</span>
                                <span className="text-orange-400 font-black tabular-nums">{w.value.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeamSpecificStatsCompact({ color, damage, strengths, weaknesses, isEnemy }: any) {
    return (
        <div className={`flex flex-col gap-4 w-full ${isEnemy ? "items-end" : "items-start"}`}>
           <div className={`flex flex-col gap-2 w-full mt-2 ${isEnemy ? "items-end" : "items-start"}`}>
               <div className="flex gap-2 w-full max-w-full">
                   <div style={{ width: `${damage.ad}%` }} className="h-1.5 bg-orange-500 rounded-full" />
                   <div style={{ width: `${damage.ap}%` }} className="h-1.5 bg-sky-500 rounded-full" />
                   <div style={{ width: `${damage.truePct}%` }} className="h-1.5 bg-white rounded-full" />
               </div>
               <div className={`flex text-[8px] font-bold text-zinc-400 gap-3 ${isEnemy ? "flex-row-reverse" : "flex-row"}`}>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {damage.ad.toFixed(0)}%</span>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> {damage.ap.toFixed(0)}%</span>
                   <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-white" /> {damage.truePct.toFixed(0)}%</span>
               </div>
           </div>
           
           <div className="flex w-full gap-4">
              <div className="flex-1 border-t border-emerald-500/20 pt-2">
                 <div className={`text-[8px] text-emerald-500 font-black uppercase mb-1 ${isEnemy?"text-right":""}`}>Strengths</div>
                 {strengths.slice(0, 2).map((s:any) => <div key={s.key} className={`text-[9px] text-zinc-300 font-bold ${isEnemy?"text-right":""}`}>{s.label} ({s.value.toFixed(1)})</div>)}
              </div>
              <div className="flex-1 border-t border-orange-500/20 pt-2">
                 <div className={`text-[8px] text-orange-500 font-black uppercase mb-1 ${isEnemy?"text-right":""}`}>Flaws</div>
                 <div className={`text-[9px] text-zinc-300 font-bold ${isEnemy?"text-right":""}`}>{weaknesses[0].label}</div>
                 <div className={`text-[9px] text-zinc-300 font-bold ${isEnemy?"text-right":""}`}>{weaknesses[1].label}</div>
              </div>
           </div>
        </div>
    )
}
