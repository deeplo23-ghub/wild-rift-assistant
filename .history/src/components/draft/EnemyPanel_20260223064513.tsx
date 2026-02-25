"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide, ALL_ROLES } from "@/types/draft";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair, AlertTriangle, X, Lock } from "lucide-react";

const ROLE_LABELS = {
  [Role.Baron]: "Baron",
  [Role.Jungle]: "Jungle",
  [Role.Mid]: "Mid",
  [Role.Dragon]: "Dragon",
  [Role.Support]: "Support",
};

export const EnemyPanel: React.FC = () => {
  const { enemy, bans, removeBan, allChampions, focusedSide, focusedRole, setFocusedSlot, removePick, banModeActive } = useDraftStore();

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

  const missingRoles = ALL_ROLES.filter(r => !enemy[r].championId);

  return (
    <Card className="h-full border-gray-700/30 bg-gray-800/50 flex flex-col overflow-hidden rounded-xl shadow-sm">
      <CardHeader className="p-4 border-b border-gray-700/30 bg-gray-900/40 shrink-0">
        <CardTitle className="flex flex-row-reverse items-center justify-between text-lg font-semibold tracking-wide text-zinc-300">
          <div className="flex items-center gap-2">
            Enemy Team
            <Crosshair className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-sm font-medium text-zinc-500">{teamChampions.length}/5</span>
        </CardTitle>
      </CardHeader>

      {/* Ban Slots */}
      <div 
        onClick={() => setFocusedSlot(TeamSide.Enemy, null)}
        className={cn(
          "p-2 border-b transition-all cursor-pointer",
          banModeActive && focusedSide === TeamSide.Enemy 
            ? "bg-red-500/10 border-red-500/20" 
            : "border-gray-700/30 bg-gray-900/20"
        )}
      >
        <div className="flex flex-row-reverse gap-2 h-10">
          {[...Array(5)].map((_, i) => {
            const id = bans.enemy[i];
            const champ = allChampions.find(c => c.id === id);
            return (
              <div 
                key={i} 
                className={cn(
                  "flex-1 rounded-md bg-gray-950 border transition-all overflow-hidden relative group",
                  champ ? "border-zinc-700" : "border-gray-800/50"
                )}
              >
                {champ ? (
                   <>
                     <img src={champ.iconUrl} className="w-full h-full object-cover grayscale opacity-30" alt="" />
                     <button 
                       onClick={(e) => { e.stopPropagation(); removeBan(TeamSide.Enemy, i); }}
                       className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <X className="w-4 h-4 text-white" />
                     </button>
                     <div className="absolute top-1 left-1">
                        <Lock className="w-3 h-3 text-red-500/40" />
                     </div>
                   </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-800">{i + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <CardContent className="p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1">
        {ALL_ROLES.map((role) => {
          const slot = enemy[role];
          const champion = allChampions.find(c => c.id === slot.championId);
          const isFocused = focusedSide === TeamSide.Enemy && focusedRole === role;

          return (
            <button 
              key={role}
              onClick={() => {
                if (champion) removePick(TeamSide.Enemy, role);
                setFocusedSlot(TeamSide.Enemy, role);
              }}
              className={cn(
                "group flex flex-row-reverse items-center gap-3 p-2 rounded-lg border transition-all text-right",
                isFocused 
                  ? "border-red-500/50 bg-red-500/10" 
                  : "border-transparent hover:bg-gray-800/80"
              )}
            >
              <div className="relative w-12 h-12 rounded-md bg-gray-900 border border-gray-700 overflow-hidden shrink-0">
                {champion ? (
                  <img src={champion.iconUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full opacity-20">
                    <span className="text-sm font-bold text-zinc-400">{role[0]}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1 items-end">
                <div className="flex flex-row-reverse items-center justify-between w-full gap-1">
                  <span className="text-xs font-normal text-zinc-500 uppercase tracking-wide">
                    {ROLE_LABELS[role]}
                  </span>
                  {!champion && isFocused && (
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-semibold border-red-500/50 text-red-500 uppercase bg-red-500/5 animate-pulse rounded-md">
                      Selecting
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium truncate",
                  champion ? "text-zinc-100" : "text-zinc-600 italic"
                )}>
                  {champion ? champion.name : "Available"}
                </span>
              </div>

              {champion && (
                <div className="flex flex-row-reverse items-center gap-2 shrink-0 pl-1">
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-semibold text-red-400 leading-none">
                      {Math.round(champion.winrate)}%
                    </span>
                    <span className="text-[10px] text-zinc-600 font-medium uppercase mt-0.5 text-left">Winrate</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </CardContent>

      {/* Analytics Footer */}
      <div className="mt-auto p-4 border-t border-gray-700/30 bg-gray-900/40 gap-4 flex flex-col shrink-0">
        {/* Missing Roles Warning */}
        {missingRoles.length > 0 && (
          <div className="flex items-center flex-row-reverse gap-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-500/80">
              Missing: {missingRoles.join(", ")}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-row-reverse items-center justify-between text-xs font-normal uppercase tracking-wide text-zinc-500">
            <span>Threat Profile</span>
            <div className="flex flex-row-reverse gap-3">
              <span className="text-blue-500">{adPerc}% AD</span>
              <span className="text-indigo-400">{apPerc}% AP</span>
            </div>
          </div>
          <div className="h-2 w-full bg-gray-950 rounded-full overflow-hidden flex flex-row-reverse">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${adPerc}%` }} />
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${apPerc}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
};
