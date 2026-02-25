"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role } from "@/types/champion";
import { TeamSide } from "@/types/draft";
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
  const { ally, allChampions, focusedSide, focusedRole, setFocusedSlot, removePick } = useDraftStore();

  const teamChampions = Object.values(ally)
    .map(s => allChampions.find(c => c.id === s.championId))
    .filter((c): c is Champion => !!c);

  const totalDamage = teamChampions.reduce((acc, c) => ({
    ad: acc.ad + c.damageProfile.ad,
    ap: acc.ap + c.damageProfile.ap,
    true: acc.true + c.damageProfile.true,
  }), { ad: 0, ap: 0, true: 0 });

  const count = teamChampions.length || 1;
  const adPerc = Math.round((totalDamage.ad / count) * 100);
  const apPerc = Math.round((totalDamage.ap / count) * 100);

  return (
    <Card className="border-blue-500/20 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
      <CardHeader className="pb-4 bg-blue-500/5">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
          <Users className="w-5 h-5 text-blue-400" />
          Ally Team
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = ally[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const hasChampion = !!champion;
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
                {champion ? (
                  <img 
                    src={champion.iconUrl} 
                    alt={champion.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = "https://wr-meta.com/uploads/posts/2023-01/1675024764_1656622041_aatrox_10-min.jpg")}
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
                  {champion ? champion.name : isFocused ? "Selecting..." : "Empty Slot"}
                </span>
              </div>

              {champion && (
                <div className="flex flex-col items-end shrink-0">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black">
                    {Math.round(champion.winrate)}%
                  </Badge>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">WINRATE</span>
                </div>
              )}
            </button>
          );
        })}

        {/* Composition Summary */}
        <div className="mt-4 p-4 rounded-xl bg-zinc-800/60 border border-white/5 space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Team Composition</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-blue-400">Physical (AD)</span>
              <span className="text-indigo-400">Magic (AP)</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${adPerc}%` }} />
              <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${apPerc}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
