"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide } from "@/types/draft";
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
  const { enemy, allChampions, focusedSide, focusedRole, setFocusedSlot, removePick } = useDraftStore();

  const teamChampions = Object.values(enemy)
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
    <Card className="border-red-500/20 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
      <CardHeader className="pb-4 bg-red-500/5">
        <CardTitle className="flex items-center justify-end gap-2 text-xl font-bold text-white">
          Enemy Team
          <Crosshair className="w-5 h-5 text-red-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
          const slot = enemy[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const hasChampion = !!champion;
          const isFocused = focusedSide === TeamSide.Enemy && focusedRole === role;

          return (
            <button 
              key={role}
              onClick={() => {
                if (hasChampion) {
                  removePick(TeamSide.Enemy, role);
                }
                setFocusedSlot(TeamSide.Enemy, role);
              }}
              className={`group relative flex flex-row-reverse items-center w-full gap-4 p-3 rounded-xl border transition-all duration-300 text-right ${
                isFocused 
                  ? "border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                  : "border-white/5 bg-zinc-800/40 hover:border-red-500/30"
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
                  <div className={`w-5 h-5 rounded-full border ${isFocused ? "bg-red-500/40 border-red-400 animate-pulse" : "bg-red-500/20 border-red-500/30"}`} />
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1 items-end">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none mb-1 text-right">
                  {ROLE_LABELS[role]}
                </span>
                <span className="text-sm font-semibold text-slate-200 truncate text-right">
                  {champion ? champion.name : isFocused ? "Selecting..." : "Empty Slot"}
                </span>
              </div>

              {champion && (
                <div className="flex flex-col items-start shrink-0">
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 font-black">
                    {Math.round(champion.winrate)}%
                  </Badge>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">WINRATE</span>
                </div>
              )}
            </button>
          );
        })}

        {/* Threat Summary */}
        <div className="mt-4 p-4 rounded-xl bg-zinc-800/60 border border-white/5 space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Damage Profile</h4>
          
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
