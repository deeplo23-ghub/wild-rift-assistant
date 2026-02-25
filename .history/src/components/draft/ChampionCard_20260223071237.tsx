"use client";

import React from "react";
import { Champion, Role, Tier } from "@/types/champion";
import { cn } from "@/lib/utils";
import { AnalysisOverlay } from "./AnalysisOverlay";
import { ScoredChampion } from "@/types/scoring";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface ChampionCardProps {
  champion: Champion;
  score?: ScoredChampion;
  isUnavailable: boolean;
  onPick: (id: string) => void;
  allies: Champion[];
  enemies: Champion[];
}

const TIER_COLORS = {
  [Tier.SPlus]: "bg-red-500/20 text-red-400 border-red-500/30",
  [Tier.S]: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  [Tier.A]: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  [Tier.B]: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  [Tier.C]: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  [Tier.D]: "bg-zinc-800/20 text-zinc-500 border-zinc-800/30",
};

const getScoreColor = (val: number) => {
  if (val >= 80) return "text-blue-400";
  if (val >= 60) return "text-emerald-400";
  if (val >= 40) return "text-zinc-400";
  return "text-red-400";
};

export const ChampionCard: React.FC<ChampionCardProps> = ({ 
  champion, 
  score, 
  isUnavailable, 
  onPick,
  allies,
  enemies
}) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => !isUnavailable && onPick(champion.id)}
            disabled={isUnavailable}
            className={cn(
              "group relative aspect-square w-full rounded-lg border border-white/10 bg-zinc-900 transition-all active:scale-95",
              isUnavailable ? "opacity-10 grayscale cursor-not-allowed" : "hover:border-blue-500/50 hover:bg-zinc-800"
            )}
          >
            {/* Champion Icon */}
            <img 
              src={champion.iconUrl} 
              alt={champion.name}
              className="h-full w-full object-cover rounded-[7px] transition-transform group-hover:scale-105"
              onError={(e) => (e.currentTarget.src = "https://wr-meta.com/uploads/posts/2023-01/1675024764_1656622041_aatrox_10-min.jpg")}
            />

            {/* Tier Badge (Top Left) */}
            <div className={cn(
              "absolute top-1 left-1 px-1 py-0.5 rounded-md border backdrop-blur-md text-[8px] font-black uppercase leading-none",
              TIER_COLORS[champion.tier]
            )}>
              {champion.tier}
            </div>

            {/* Overlays */}
            {!isUnavailable && (
              <>
                {/* Role Label (Bottom Left) */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded border border-white/5">
                   <span className="text-[7px] font-black uppercase text-zinc-400 tracking-tighter">
                     {champion.roles[0]}
                   </span>
                </div>

                {/* Draft Score (Bottom Right) */}
                {score && (
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded border border-white/5">
                    <span className={cn("text-[9px] font-black", getScoreColor(score.finalScore))}>
                      {Math.round(score.finalScore)}
                    </span>
                  </div>
                )}
              </>
            )}
          </button>
        </TooltipTrigger>
        
        {!isUnavailable && score && (
          <TooltipContent side="right" align="start" className="p-0 border-none bg-transparent shadow-none" sideOffset={12}>
            <AnalysisOverlay 
              scoredChampion={score} 
              champion={champion} 
              allies={allies}
              enemies={enemies}
            />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
