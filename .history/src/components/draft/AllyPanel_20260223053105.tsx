"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role } from "@/types/champion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const ROLE_LABELS = {
  [Role.Baron]: "Baron Lane",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid Lane",
  [Role.Dragon]: "Dragon Lane",
  [Role.Support]: "Support",
};

export const AllyPanel: React.FC = () => {
  const ally = useDraftStore((state) => state.ally);
  const { focusedSide, focusedRole, setFocusedSlot, removePick } = useDraftStore();

  return (
    <Card className="border-blue-500/20 bg-zinc-900/50 backdrop-blur-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
          <Users className="w-5 h-5 text-blue-400" />
          Ally Team
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = ally[role];
          const hasChampion = slot.championId !== null;
          const isFocused = focusedSide === TeamSide.Ally && focusedRole === role;

          return (
            <button 
              key={role}
              onClick={() => {
                if (hasChampion) {
                  removePick(TeamSide.Ally, role);
                }
                setFocusedSlot(TeamSide.Ally, role);
              }}
              className={`group relative flex items-center w-full gap-4 p-3 rounded-xl border transition-all duration-300 text-left ${
                isFocused 
                  ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                  : "border-white/5 bg-zinc-800/40 hover:border-blue-500/30"
              }`}
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
                  <div className={`w-5 h-5 rounded-full border ${isFocused ? "bg-blue-500/40 border-blue-400 animate-pulse" : "bg-blue-500/20 border-blue-500/30"}`} />
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">
                  {ROLE_LABELS[role]}
                </span>
                <span className="text-sm font-semibold text-slate-200 truncate">
                  {hasChampion ? slot.championId!.replace(/-/g, ' ') : isFocused ? "Selecting..." : "Empty Slot"}
                </span>
              </div>

              {hasChampion && (
                <div className="flex flex-col items-end shrink-0">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black">
                    84.5
                  </Badge>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">POWER</span>
                </div>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};
