"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Sparkles, X } from "lucide-react";
import { cn, getRoleIcon, getWinrateColor } from "@/lib/utils";
import { ChampionIcon } from "./ChampionIcon";
import { SCORE_COLORS, TIER_COLORS } from "./ChampionPool";

interface MobilePickedChampionProps {
  champion: Champion;
  side: TeamSide;
  finalScore?: number;
  syns: Array<{ id: string; score: number }>;
  ctrs: Array<{ id: string; val: number }>;
  weaks: Array<{ id: string; val: number }>;
  allChampions: Champion[];
}

const MobilePickedChampion: React.FC<MobilePickedChampionProps> = ({
  champion,
  side,
  finalScore,
  syns,
  ctrs,
  weaks,
  allChampions,
}) => {
  const isAlly = side === TeamSide.Ally;

  const renderIconGroup = (
    label: string,
    items: Array<{ id: string }>,
    borderColor: string,
    Icon: any,
    iconColor: string
  ) => {
    if (items.length === 0) return null;

    const displayItems = items.slice(0, 2);
    const remaining = items.length - 2;

    return (
      <div className={cn("flex items-center", isAlly ? "flex-row" : "flex-row-reverse")}>
        <div className="flex -space-x-1.5 px-0.5">
          {displayItems.map((item, idx) => {
            const champ = allChampions.find((c) => c.id === item.id);
            if (!champ) return null;
            return (
              <div
                key={item.id}
                className={cn(
                  "w-4 h-4 rounded-full border border-white/20 overflow-hidden relative",
                  borderColor
                )}
                style={{ zIndex: 10 - idx }}
              >
                <ChampionIcon name={champ.name} url={champ.iconUrl} className="w-full h-full" />
              </div>
            );
          })}
          {remaining > 0 && (
            <div className="w-4 h-4 rounded-full border border-white/20 bg-zinc-800 flex items-center justify-center z-0">
              <span className="text-[6px] font-black text-white">+{remaining}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex items-center gap-2", isAlly ? "flex-row" : "flex-row-reverse")}>
      <div className="relative w-10 h-10 rounded-md overflow-hidden border border-white/10 shrink-0">
        <ChampionIcon name={champion.name} url={champion.iconUrl} className="w-full h-full" />
        <div className={cn(
          "absolute top-0 left-0 px-0.5 py-0.5 bg-black/80 rounded-br-sm border-r border-b border-white/10 z-10",
          TIER_COLORS[champion.tier]?.split(" ")[0] || "text-zinc-500"
        )}>
          <span className="text-[7px] font-black block leading-none">{champion.tier}</span>
        </div>
      </div>

      <div className={cn("flex flex-col flex-1 min-w-0", isAlly ? "items-start" : "items-end")}>
        <div className={cn("flex items-center gap-1.5 w-full", isAlly ? "flex-row" : "flex-row-reverse")}>
          <span className="text-[11px] font-bold text-zinc-100 truncate flex-1">{champion.name}</span>
          <div className="flex flex-col items-center">
            {finalScore !== undefined && (
              <span className={cn("text-[10px] font-black leading-none", SCORE_COLORS(finalScore))}>
                {finalScore.toFixed(0)}
              </span>
            )}
            <span className={cn("text-[8px] font-bold leading-none mt-0.5", getWinrateColor(champion.winrate))}>
              {champion.winrate.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={cn("flex items-center gap-1 mt-1", isAlly ? "flex-row" : "flex-row-reverse")}>
          {renderIconGroup("Syn", syns, "border-emerald-500/50", Sparkles, "text-emerald-500")}
          {renderIconGroup("Ctr", ctrs, "border-orange-500/50", Target, "text-orange-500")}
          {renderIconGroup("Weak", weaks, "border-yellow-500/50", Target, "text-yellow-500")}
        </div>
      </div>
    </div>
  );
};

interface MobileRoleCardProps {
  role: Role;
  allyChamp?: Champion;
  enemyChamp?: Champion;
  isAllyFocused: boolean;
  isEnemyFocused: boolean;
  allyFinalScore?: number;
  enemyFinalScore?: number;
  onAllyClick: () => void;
  onEnemyClick: () => void;
  allChampions: Champion[];
  teamChampions: Champion[];
  opposingTeamChampions: Champion[];
  counterMatrix: any;
}

export const MobileRoleCard: React.FC<MobileRoleCardProps> = ({
  role,
  allyChamp,
  enemyChamp,
  isAllyFocused,
  isEnemyFocused,
  allyFinalScore,
  enemyFinalScore,
  onAllyClick,
  onEnemyClick,
  allChampions,
  teamChampions,
  opposingTeamChampions,
  counterMatrix,
}) => {
  // Memoized stats calculation (logic same as desktop PickSlot but optimized for mobile)
  const getStats = (champ?: Champion, myTeam?: Champion[], oppTeam?: Champion[]) => {
    if (!champ) return { syns: [], ctrs: [], weaks: [] };
    
    // Simplistic version for mobile card preview
    // In actual use, we'd pass these from the store or parent
    return {
      syns: [], // To be populated properly
      ctrs: [],
      weaks: [],
    };
  };

  return (
    <div className="relative flex items-stretch gap-2 h-16 w-full">
      {/* Ally Slot */}
      <button
        onClick={onAllyClick}
        className={cn(
          "flex-1 rounded-xl border p-2 transition-all flex items-center justify-start overflow-hidden relative bg-black/20 backdrop-blur-md",
          isAllyFocused ? "border-blue-500/50 bg-blue-500/10" : "border-white/5"
        )}
      >
        {allyChamp ? (
          <MobilePickedChampion 
            champion={allyChamp} 
            side={TeamSide.Ally} 
            finalScore={allyFinalScore}
            syns={[]} // Pass proper stats here
            ctrs={[]}
            weaks={[]}
            allChampions={allChampions}
          />
        ) : (
          <div className="flex items-center gap-3 w-full opacity-30">
            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center">
              <img src={getRoleIcon(role)} alt={role} className="w-5 h-5 object-contain brightness-200" />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {isAllyFocused ? "PICKING..." : "EMPTY"}
            </span>
          </div>
        )}
        {isAllyFocused && (
          <motion.div
            layoutId="mobile-focus-ally"
            className="absolute inset-0 border border-blue-500/50 rounded-xl pointer-events-none"
            initial={false}
          />
        )}
      </button>

      {/* Role Icon (Center) */}
      <div className="flex flex-col items-center justify-center shrink-0 w-8">
        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
           <img src={getRoleIcon(role)} alt={role} className="w-3.5 h-3.5 object-contain opacity-40 brightness-200" />
        </div>
      </div>

      {/* Enemy Slot */}
      <button
        onClick={onEnemyClick}
        className={cn(
          "flex-1 rounded-xl border p-2 transition-all flex items-center justify-end overflow-hidden relative bg-black/20 backdrop-blur-md",
          isEnemyFocused ? "border-red-500/50 bg-red-500/10" : "border-white/5"
        )}
      >
        {enemyChamp ? (
          <MobilePickedChampion 
            champion={enemyChamp} 
            side={TeamSide.Enemy} 
            finalScore={enemyFinalScore}
            syns={[]}
            ctrs={[]}
            weaks={[]}
            allChampions={allChampions}
          />
        ) : (
          <div className="flex items-center gap-3 w-full justify-end opacity-30">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
               {isEnemyFocused ? "PICKING..." : "EMPTY"}
            </span>
            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center">
              <img src={getRoleIcon(role)} alt={role} className="w-5 h-5 object-contain brightness-200" />
            </div>
          </div>
        )}
        {isEnemyFocused && (
          <motion.div
            layoutId="mobile-focus-enemy"
            className="absolute inset-0 border border-red-500/50 rounded-xl pointer-events-none"
            initial={false}
          />
        )}
      </button>
    </div>
  );
};
