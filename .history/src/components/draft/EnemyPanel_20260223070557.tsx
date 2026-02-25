"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { Role, Champion } from "@/types/champion";
import { TeamSide, ALL_ROLES } from "@/types/draft";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { X, Lock, AlertTriangle, Shield, Sword, Zap, Crosshair } from "lucide-react";

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

  // --- Analytics Calculation (Mirrored) ---
  const teamMetrics = teamChampions.reduce((acc, c) => ({
    ad: acc.ad + c.damageProfile.ad,
    ap: acc.ap + c.damageProfile.ap,
    durability: acc.durability + c.durabilityScore,
    engage: acc.engage + c.engageScore,
    cc: acc.cc + c.ccScore,
  }), { ad: 0, ap: 0, durability: 0, engage: 0, cc: 0 });

  const count = teamChampions.length || 1;
  const avg = (val: number) => Math.min(10, val / count);
  
  const analytics = {
    adMix: Math.round((teamMetrics.ad / (teamMetrics.ad + teamMetrics.ap || 1)) * 100),
    apMix: Math.round((teamMetrics.ap / (teamMetrics.ad + teamMetrics.ap || 1)) * 100),
    durability: avg(teamMetrics.durability),
    engage: avg(teamMetrics.engage),
    cc: avg(teamMetrics.cc),
    threat: teamChampions.length > 0 ? 6.2 : 0, // Mocked threat level
  };

  const missingRoles = ALL_ROLES.filter(r => !enemy[r].championId);

  return (
    <Card className="h-full border-none bg-transparent flex flex-col overflow-hidden rounded-none shadow-none">
      {/* Horizontal Ban Matrix (Mirrored) */}
      <div 
        onClick={() => setFocusedSlot(TeamSide.Enemy, null)}
        className={cn(
          "p-2 border-b border-gray-900 transition-colors cursor-pointer rounded-none",
          banModeActive && focusedSide === TeamSide.Enemy 
            ? "bg-gray-900" 
            : "bg-black"
        )}
      >
        <div className="flex flex-row-reverse gap-1 h-12">
          {[...Array(5)].map((_, i) => {
            const id = bans.enemy[i];
            const champ = allChampions.find(c => c.id === id);
            return (
              <div 
                key={i} 
                className={cn(
                  "flex-1 rounded-none bg-black border transition-all overflow-hidden relative group",
                  champ ? "border-gray-600" : "border-gray-900"
                )}
              >
                {champ ? (
                   <>
                     <img src={champ.iconUrl} className="w-full h-full object-cover opacity-50" alt="" />
                     <button 
                       onClick={(e) => { e.stopPropagation(); removeBan(TeamSide.Enemy, i); }}
                       className="absolute inset-0 flex items-center justify-center bg-gray-900/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-none"
                     >
                       <X className="w-4 h-4 text-gray-100" />
                     </button>
                     <div className="absolute top-1 left-1">
                        <Lock className="w-2 h-2 text-gray-500" />
                     </div>
                   </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-[10px] font-black text-gray-800">{i + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <CardContent className="p-2 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar flex-1 bg-black">
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
                "group flex flex-row-reverse items-center gap-3 p-2 border rounded-none transition-all text-right",
                isFocused 
                  ? "border-gray-100 bg-gray-900" 
                  : "border-gray-900 hover:border-gray-700 hover:bg-gray-950"
              )}
            >
              <div className="relative w-11 h-11 rounded-none bg-black border border-gray-800 overflow-hidden shrink-0">
                {champion ? (
                  <img src={champion.iconUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full opacity-20">
                    <span className="text-[10px] font-black text-gray-600">{role[0]}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1 items-end">
                <div className="flex flex-row-reverse items-center justify-between w-full gap-1">
                   <div className="flex flex-row-reverse items-center gap-2">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                        {ROLE_LABELS[role]}
                    </span>
                   </div>
                  {!champion && isFocused && (
                    <span className="animate-pulse text-[9px] font-black text-gray-100 bg-gray-700 px-1">
                      LISTENING
                    </span>
                  )}
                </div>
                <div className="flex flex-row-reverse items-center justify-between w-full">
                    <span className={cn(
                        "text-sm font-black truncate",
                        champion ? "text-gray-100" : "text-gray-800 italic"
                    )}>
                        {champion ? champion.name : "Unassigned"}
                    </span>
                    {champion && (
                        <span className="text-[10px] font-black text-gray-500 uppercase">
                           T{champion.tier}
                        </span>
                    )}
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>

      {/* DETAILED ENEMY STRATEGIC ANALYTICS FOOTER */}
      <div className="mt-auto p-4 border-t border-gray-900 bg-gray-950 flex flex-col gap-5 shrink-0 rounded-none">
        
        {/* COMPOSITION CHARTS */}
        <div className="grid grid-cols-2 gap-4">
            {/* Threat Weight */}
            <div className="space-y-1.5">
                <div className="flex flex-row-reverse justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest text-right">
                    <span>THREAT WEIGHT</span>
                    <span className="text-gray-300">{analytics.threat}/10</span>
                </div>
                <div className="h-1.5 w-full bg-black border border-gray-900">
                    <div className="h-full bg-red-950/40 border-r border-red-500" style={{ width: `${analytics.threat * 10}%` }} />
                </div>
            </div>

            {/* Damage Mix */}
            <div className="space-y-1.5">
                <div className="flex flex-row-reverse justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest text-right">
                    <span>AD/AP MIX</span>
                    <span className="text-gray-300">{analytics.adMix}% / {analytics.apMix}%</span>
                </div>
                <div className="h-1.5 w-full bg-black border border-gray-900 flex flex-row-reverse">
                    <div className="h-full bg-gray-100" style={{ width: `${analytics.adMix}%` }} />
                    <div className="h-full bg-gray-600" style={{ width: `${analytics.apMix}%` }} />
                </div>
            </div>
        </div>

        {/* RADAR ANALYTICS (Enemy Profile) */}
        <div className="space-y-3">
            {[
                { icon: Shield, label: "Resistance", val: analytics.durability },
                { icon: Sword, label: "Lethality", val: analytics.engage },
                { icon: Crosshair, label: "Precision/CC", val: analytics.cc },
            ].map(m => (
                <div key={m.label} className="flex flex-row-reverse items-center gap-3">
                    <m.icon className="w-3.5 h-3.5 text-gray-600" />
                    <div className="flex-1 space-y-1">
                        <div className="flex flex-row-reverse justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest text-right">
                            <span>{m.label}</span>
                            <span>{m.val.toFixed(1)}</span>
                        </div>
                        <div className="h-0.5 w-full bg-gray-900 flex flex-row-reverse">
                            <div className="h-full bg-gray-500" style={{ width: `${m.val * 10}%` }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* DATA Voids */}
        {missingRoles.length > 0 && (
          <div className="flex flex-row-reverse items-start gap-2 p-2 border border-gray-900/50 bg-black">
            <AlertTriangle className="w-3.5 h-3.5 text-gray-700 mt-0.5" />
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-gray-700 uppercase text-right">Threat Intel Missing</span>
                <span className="text-[9px] font-medium text-gray-800 uppercase italic text-right">
                    Void nodes: {missingRoles.map(r => r[0]).join(", ")}
                </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
