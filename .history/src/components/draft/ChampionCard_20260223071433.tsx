"use client";

import React from "react";
import { Champion, Role, Tier } from "@/types/champion";
import { cn } from "@/lib/utils";
import { AnalysisOverlay } from "./AnalysisOverlay";
import { ScoredChampion } from "@/types/scoring";
import { useDraftStore } from "@/store/draftStore";
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
  [Tier.SPlus]: "bg-red-500/20 text-red-500 border-red-500/30",
  [Tier.S]: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  [Tier.A]: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  [Tier.B]: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  [Tier.C]: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  [Tier.D]: "bg-zinc-800/20 text-zinc-600 border-zinc-800/30",
};

const getScoreColor = (val: number) => {
  if (val >= 75) return "text-blue-500";
  if (val >= 60) return "text-emerald-500";
  if (val >= 40) return "text-zinc-400";
  return "text-red-500";
};

export const ChampionCard: React.FC<ChampionCardProps> = ({ 
  champion, 
  score, 
  isUnavailable, 
  onPick,
  allies,
  enemies
}) => {
  const counterMatrix = useDraftStore(state => state.counterMatrix);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => !isUnavailable && onPick(champion.id)}
            disabled={isUnavailable}
            className={cn(
              "group relative aspect-square w-full rounded-md border transition-all duration-200",
              isUnavailable 
                ? "border-white/[0.03] opacity-20 grayscale cursor-not-allowed" 
                : "border-white/5 bg-zinc-950/40 hover:border-blue-500/50 hover:bg-zinc-900/80 active:scale-95 shadow-xl"
            )}
          >
            {/* Champion Icon */}
            <img 
              src={champion.iconUrl} 
              alt={champion.name}
              className="h-full w-full object-cover rounded-[5px] transition-transform duration-500 group-hover:scale-110"
              onError={(e) => (e.currentTarget.src = "https://wr-meta.com/uploads/posts/2023-01/1675024764_1656622041_aatrox_10-min.jpg")}
            />

            {/* Tier Badge (Top Left) */}
            <div className={cn(
              "absolute top-0.5 left-0.5 px-1 py-0.5 rounded border backdrop-blur-md text-[7px] font-black leading-none",
              TIER_COLORS[champion.tier]
            )}>
              {champion.tier}
            </div>

            {/* Content Overlays */}
            {!isUnavailable && (
              <>
                {/* Role Label (Bottom Left) */}
                <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/60 backdrop-blur-md rounded border border-white/5">
                   <span className="text-[6px] font-black uppercase text-zinc-500 tracking-tighter">
                     {champion.roles[0]}
                   </span>
                </div>

                {/* Draft Score (Bottom Right) */}
                {score && (
                  <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/80 backdrop-blur-md rounded border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                    <span className={cn("text-[8.5px] font-black", getScoreColor(score.finalScore))}>
                      {Math.round(score.finalScore)}
                    </span>
                  </div>
                )}
              </>
            )}
          </button>
        </TooltipTrigger>
        
        {!isUnavailable && score && (
          <TooltipContent side="right" align="start" className="p-0 border-none bg-transparent shadow-none" sideOffset={10}>
            <AnalysisOverlay 
              scoredChampion={score} 
              champion={champion} 
              allies={allies}
              enemies={enemies}
              counterMatrix={counterMatrix}
            />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
