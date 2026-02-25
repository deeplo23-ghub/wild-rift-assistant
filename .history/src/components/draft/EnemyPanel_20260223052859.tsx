"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role } from "@/types/champion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair } from "lucide-react";

const ROLE_LABELS = {
  [Role.Baron]: "Baron Lane",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid Lane",
  [Role.Dragon]: "Dragon Lane",
  [Role.Support]: "Support",
};

export const EnemyPanel: React.FC = () => {
  const enemy = useDraftStore((state) => state.enemy);

  return (
    <Card className="border-red-500/20 bg-zinc-900/50 backdrop-blur-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-end gap-2 text-xl font-bold text-white">
          Enemy Team
          <Crosshair className="w-5 h-5 text-red-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = enemy[role];
          const hasChampion = slot.championId !== null;

          return (
            <div 
              key={role}
              className="group relative flex flex-row-reverse items-center gap-4 p-3 rounded-xl border border-white/5 bg-zinc-800/40 transition-all duration-300 hover:border-red-500/30"
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-700/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {hasChampion ? (
                  <img 
                    src={`/champions/${slot.championId}.png`} 
                    alt={slot.championId!}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = "/placeholder-champion.png")}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 animate-pulse" />
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1 items-end">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none mb-1 text-right">
                  {ROLE_LABELS[role]}
                </span>
                <span className="text-sm font-semibold text-slate-200 truncate text-right">
                  {hasChampion ? slot.championId!.replace(/-/g, ' ') : "Selecting..."}
                </span>
              </div>

              {hasChampion && (
                <div className="flex flex-col items-start shrink-0">
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 font-black">
                    84.5
                  </Badge>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">THREAT</span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
