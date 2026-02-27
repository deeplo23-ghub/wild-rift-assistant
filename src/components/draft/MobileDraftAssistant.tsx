"use client";

import React, { useState, useMemo } from "react";
import { useDraftStore } from "@/store/draftStore";
import { TeamSide, ALL_ROLES } from "@/types/draft";
import { Role, Champion } from "@/types/champion";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings2, 
  RotateCcw, 
  Database, 
  Loader2, 
  Ban, 
  BarChart3,
  X,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoText } from "@/components/brand/LogoText";
import { Button } from "@/components/ui/button";
import { MobileRoleCard } from "./MobileRoleCard";
import { MobileChampionPool } from "./MobileChampionPool";
import { MobileMatchupAnalysis } from "./MobileMatchupAnalysis";
import { SCORE_COLORS } from "./ChampionPool";

export const MobileDraftAssistant: React.FC = () => {
  const {
    allChampions,
    ally: allyState,
    enemy: enemyState,
    bans,
    isBanMode,
    focusedSide,
    focusedRole,
    settings,
    scoredChampions,
    toggleBanMode,
    resetDraft,
    setFocusedSlot,
    removePick,
    autoAction,
  } = useDraftStore();

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showChampPool, setShowChampPool] = useState(false);

  const allyPicks = useMemo(() => 
    ALL_ROLES.map(r => allChampions.find(c => c.id === allyState[r].championId)).filter(Boolean) as Champion[]
  , [allyState, allChampions]);

  const enemyPicks = useMemo(() => 
    ALL_ROLES.map(r => allChampions.find(c => c.id === enemyState[r].championId)).filter(Boolean) as Champion[]
  , [enemyState, allChampions]);

  const allyTotalScore = useMemo(() => 
    allyPicks.reduce((acc, c) => acc + (scoredChampions.find(s => s.championId === c.id)?.finalScore || 0), 0)
  , [allyPicks, scoredChampions]);

  const allyAvgScore = allyPicks.length > 0 ? allyTotalScore / allyPicks.length : 0;

  const isDraftComplete = allyPicks.length === 5 && enemyPicks.length === 5;

  const getTeamGrade = (avg: number) => {
    if (avg >= 75) return "S+";
    if (avg >= 68) return "S";
    if (avg >= 60) return "A";
    if (avg >= 52) return "B";
    if (avg >= 44) return "C";
    return "D";
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-300 font-sans overflow-hidden">
      {/* Mobile Header */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-black/20 backdrop-blur-md shrink-0">
        <LogoText className="h-5 w-auto" />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); toggleBanMode(); }}
            className={cn("w-8 h-8", isBanMode ? "text-red-500 bg-red-500/10" : "text-zinc-400")}
          >
            <Ban className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); resetDraft(); }}
            className="w-8 h-8 text-zinc-400"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-zinc-400"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Live Stats Bar */}
      <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Total Power</span>
            <div className="flex items-baseline gap-1.5">
               <span className={cn("text-lg font-black leading-none", SCORE_COLORS(allyAvgScore))}>
                 {allyAvgScore.toFixed(0)}
               </span>
               <span className={cn("text-xs font-black italic opacity-60", SCORE_COLORS(allyAvgScore))}>
                 {getTeamGrade(allyAvgScore)}
               </span>
            </div>
          </div>
          <div className="w-px h-6 bg-white/5" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Damage Dist</span>
            <div className="flex items-center gap-1 h-3 w-24 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                <div className="h-full bg-orange-500" style={{ width: '60%' }} />
                <div className="h-full bg-blue-500" style={{ width: '30%' }} />
                <div className="h-full bg-zinc-400" style={{ width: '10%' }} />
            </div>
          </div>
        </div>

        {isDraftComplete && (
          <Button
            onClick={() => setShowAnalysis(true)}
            variant="outline"
            size="sm"
            className="h-8 text-[10px] font-black uppercase tracking-widest border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
          >
            <BarChart3 className="w-3 h-3 mr-2" />
            Analysis
          </Button>
        )}
      </div>

      {/* Main Content: Role Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ALL_ROLES.map((role) => (
          <MobileRoleCard
            key={role}
            role={role}
            allyChamp={allChampions.find(c => c.id === allyState[role].championId)}
            enemyChamp={allChampions.find(c => c.id === enemyState[role].championId)}
            isAllyFocused={focusedSide === TeamSide.Ally && focusedRole === role}
            isEnemyFocused={focusedSide === TeamSide.Enemy && focusedRole === role}
            allyFinalScore={scoredChampions.find(s => s.championId === allyState[role].championId)?.finalScore}
            enemyFinalScore={scoredChampions.find(s => s.championId === enemyState[role].championId)?.finalScore}
            onAllyClick={() => {
              const champ = allyState[role].championId;
              if (champ) removePick(TeamSide.Ally, role);
              else {
                setFocusedSlot(TeamSide.Ally, role);
                setShowChampPool(true);
              }
            }}
            onEnemyClick={() => {
              const champ = enemyState[role].championId;
              if (champ) removePick(TeamSide.Enemy, role);
              else {
                setFocusedSlot(TeamSide.Enemy, role);
                setShowChampPool(true);
              }
            }}
            allChampions={allChampions}
            teamChampions={allyPicks}
            opposingTeamChampions={enemyPicks}
            counterMatrix={null} // To be passed properly
          />
        ))}
        {/* Placeholder for legal text at the bottom of scroll */}
        <div className="pt-8 pb-4 opacity-20 text-[8px] text-center font-bold">
          © 2026 DRAWR ASSISTANT // RIOT GAMES COMPLIANT
        </div>
      </div>

      {/* Ban Phase (Static bottom or overlay?) - Let's do a simple bar for now */}
      <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/10 flex items-center justify-between shrink-0">
         <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {bans.ally.map((id) => (
               <div key={id} className="w-8 h-8 rounded border border-white/10 overflow-hidden grayscale opacity-50 relative">
                  <img src={allChampions.find(c => c.id === id)?.iconUrl} alt="ban" className="w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-500 opacity-80" />
                  </div>
               </div>
            ))}
            {bans.ally.length < 5 && isBanMode && focusedSide === TeamSide.Ally && (
              <div 
                onClick={() => setShowChampPool(true)}
                className="w-8 h-8 rounded border border-red-500/50 bg-red-500/10 flex items-center justify-center animate-pulse"
              >
                <Ban className="w-3 h-3 text-red-500" />
              </div>
            )}
         </div>
         <div className="w-px h-8 bg-white/5 mx-2" />
         <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 flex-row-reverse">
            {bans.enemy.map((id) => (
               <div key={id} className="w-8 h-8 rounded border border-white/10 overflow-hidden grayscale opacity-50 relative">
                  <img src={allChampions.find(c => c.id === id)?.iconUrl} alt="ban" className="w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-500 opacity-80" />
                  </div>
               </div>
            ))}
            {bans.enemy.length < 5 && isBanMode && focusedSide === TeamSide.Enemy && (
              <div 
                onClick={() => setShowChampPool(true)}
                className="w-8 h-8 rounded border border-red-500/50 bg-red-500/10 flex items-center justify-center animate-pulse"
              >
                <Ban className="w-3 h-3 text-red-500" />
              </div>
            )}
         </div>
      </div>

      {/* Overlay Panels (Champ Pool & Analysis) */}
      <AnimatePresence>
        {showChampPool && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xl flex flex-col"
          >
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Champion Pool
              </span>
              <Button variant="ghost" size="icon" onClick={() => setShowChampPool(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col p-4">
               {/* Filter/Search is now inside MobileChampionPool */}
               <MobileChampionPool 
                  onPick={(id) => {
                    autoAction(id);
                    setShowChampPool(false);
                  }} 
               />
            </div>
          </motion.div>
        )}

        {showAnalysis && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col"
          >
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Matchup Analysis
              </span>
              <Button variant="ghost" size="icon" onClick={() => setShowAnalysis(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
               <MobileMatchupAnalysis />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
