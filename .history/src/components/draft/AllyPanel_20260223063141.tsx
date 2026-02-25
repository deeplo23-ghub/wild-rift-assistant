"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide, ALL_ROLES } from "@/types/draft";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle } from "lucide-react";

const ROLE_LABELS = {
  [Role.Baron]: "Baron",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid",
  [Role.Dragon]: "Dragon",
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

  const missingRoles = ALL_ROLES.filter(r => !ally[r].championId);

  return (
    <Card className="h-full border-zinc-800 bg-zinc-950/50 flex flex-col overflow-hidden">
      <CardHeader className="p-3 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
        <CardTitle className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-400">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            Ally Team
          </div>
          <span className="text-[10px] text-zinc-600">{teamChampions.length}/5</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
        {ALL_ROLES.map((role) => {
          const slot = ally[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const isFocused = focusedSide === TeamSide.Ally && focusedRole === role;

          return (
            <button 
              key={role}
              onClick={() => {
                if (champion) removePick(TeamSide.Ally, role);
                setFocusedSlot(TeamSide.Ally, role);
              }}
              className={cn(
                "group flex items-center gap-2 p-1.5 rounded-md border transition-all text-left",
                isFocused 
                  ? "border-blue-500/50 bg-blue-500/10" 
                  : "border-transparent hover:bg-zinc-900"
              )}
            >
              <div className="relative w-9 h-9 rounded-md bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                {champion ? (
                  <img src={champion.iconUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full opacity-20">
                    <span className="text-[10px] font-bold text-zinc-400">{role[0]}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter truncate">
                    {ROLE_LABELS[role]}
                  </span>
                  {!champion && isFocused && (
                    <Badge variant="outline" className="h-3 px-1 text-[7px] font-black border-blue-500/50 text-blue-500 uppercase bg-blue-500/5 animate-pulse">
                      Selecting
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-bold truncate leading-tight",
                  champion ? "text-zinc-100" : "text-zinc-700 italic"
                )}>
                  {champion ? champion.name : "Available"}
                </span>
              </div>

              {champion && (
                <div className="flex items-center gap-2 shrink-0 pr-1">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-blue-400 leading-none">
                      {Math.round(champion.winrate)}%
                    </span>
                    <span className="text-[7px] text-zinc-600 font-bold uppercase mt-0.5">WR</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </CardContent>

      {/* Analytics Footer */}
      <div className="mt-auto p-3 border-t border-zinc-800 bg-zinc-900/20 space-y-3 shrink-0">
        {/* Missing Roles Warning */}
        {missingRoles.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/5 border border-amber-500/10">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-wider">
              Missing: {missingRoles.map(r => r[0]).join(", ")}
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500">
            <span>Damage Ratio</span>
            <div className="flex gap-2">
              <span className="text-blue-500">{adPerc}% AD</span>
              <span className="text-indigo-400">{apPerc}% AP</span>
            </div>
          </div>
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${adPerc}%` }} />
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${apPerc}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
};
