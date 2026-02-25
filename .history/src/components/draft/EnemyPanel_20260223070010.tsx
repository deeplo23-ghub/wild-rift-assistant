"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide, ALL_ROLES } from "@/types/draft";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { X, Lock, AlertTriangle } from "lucide-react";

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
    <Card className="h-full border-gray-700 bg-gray-900 flex flex-col overflow-hidden rounded-none shadow-none">
      {/* Ban Interface - Top Horizontal (Mirrored) */}
      <div 
        onClick={() => setFocusedSlot(TeamSide.Enemy, null)}
        className={cn(
          "p-2 border-b transition-colors cursor-pointer rounded-none",
          banModeActive && focusedSide === TeamSide.Enemy 
            ? "bg-gray-800 border-gray-600" 
            : "border-gray-800 bg-gray-950/20"
        )}
      >
        <div className="flex flex-row-reverse gap-1 h-10">
          {[...Array(5)].map((_, i) => {
            const id = bans.enemy[i];
            const champ = allChampions.find(c => c.id === id);
            return (
              <div 
                key={i} 
                className={cn(
                  "flex-1 rounded-none bg-gray-950 border transition-all overflow-hidden relative group",
                  champ ? "border-gray-600" : "border-gray-800"
                )}
              >
                {champ ? (
                   <>
                     <img src={champ.iconUrl} className="w-full h-full object-cover opacity-50" alt="" />
                     <button 
                       onClick={(e) => { e.stopPropagation(); removeBan(TeamSide.Enemy, i); }}
                       className="absolute inset-0 flex items-center justify-center bg-gray-900/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-none"
                     >
                       <X className="w-4 h-4 text-gray-100" />
                     </button>
                     <div className="absolute top-1 left-1">
                        <Lock className="w-2.5 h-2.5 text-gray-600" />
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

      <CardContent className="p-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1 rounded-none">
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
                "group flex flex-row-reverse items-center gap-2 p-1 border rounded-none transition-colors text-right",
                isFocused 
                  ? "border-gray-100 bg-gray-800" 
                  : "border-transparent hover:bg-gray-800/50"
              )}
            >
              <div className="relative w-12 h-12 rounded-none bg-gray-950 border border-gray-800 overflow-hidden shrink-0">
                {champion ? (
                  <img src={champion.iconUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full opacity-10">
                    <span className="text-sm font-semibold text-gray-400">{role[0]}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1 items-end">
                <div className="flex flex-row-reverse items-center justify-between w-full gap-1">
                  <div className="flex flex-row-reverse items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                        {ROLE_LABELS[role]}
                    </span>
                  </div>
                  {!champion && isFocused && (
                    <span className="text-[10px] font-bold text-gray-100 uppercase bg-gray-700 px-1">
                      SELECT
                    </span>
                  )}
                </div>
                <div className="flex flex-row-reverse items-center gap-2">
                    <span className={cn(
                        "text-sm font-bold truncate",
                        champion ? "text-gray-100" : "text-gray-700 italic"
                    )}>
                        {champion ? champion.name : "-"}
                    </span>
                    {champion && (
                        <span className="text-[10px] font-black text-gray-500 uppercase">
                            Tier {champion.tier}
                        </span>
                    )}
                </div>

                {/* AD/AP Mix Bar (Mirrored) */}
                {champion && (
                    <div className="h-1 w-full flex flex-row-reverse bg-gray-950 mt-1">
                        <div className="h-full bg-gray-400" style={{ width: `${champion.damageProfile.ad * 10}%` }} />
                        <div className="h-full bg-gray-600" style={{ width: `${champion.damageProfile.ap * 10}%` }} />
                    </div>
                )}
              </div>

              {champion && (
                <div className="flex flex-col items-start">
                    <span className="text-sm font-bold text-gray-100">
                        {Math.round(champion.winrate)}%
                    </span>
                </div>
              )}
            </button>
          );
        })}
      </CardContent>

      {/* Analytics Footer */}
      <div className="mt-auto p-3 border-t border-gray-800 bg-gray-950/40 flex flex-col gap-3 shrink-0 rounded-none">
        {missingRoles.length > 0 && (
          <div className="flex flex-row-reverse items-center gap-2 px-2 py-1 border border-gray-800 bg-gray-900/50">
            <AlertTriangle className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase text-right tracking-tight">
              Incomplete: {missingRoles.map(r => r[0]).join(",")}
            </span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex flex-row-reverse items-center justify-between text-xs font-semibold text-gray-500 uppercase">
             <span>AD/AP Mix</span>
             <div className="flex flex-row-reverse gap-4">
                <span className="text-gray-300">{adPerc}% AD</span>
                <span className="text-gray-500">{apPerc}% AP</span>
             </div>
          </div>
          <div className="h-1.5 w-full bg-gray-950 border border-gray-800 flex flex-row-reverse rounded-none">
            <div className="h-full bg-gray-400" style={{ width: `${adPerc}%` }} />
            <div className="h-full bg-gray-600" style={{ width: `${apPerc}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
};
