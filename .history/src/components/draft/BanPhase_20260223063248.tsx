"use client";

import React from "react";
import { useDraftStore } from "@/store/draftStore";
import { TeamSide, DraftPhase } from "@/types/draft";
import { Champion } from "@/types/champion";
import { Button } from "@/components/ui/button";
import { X, Lock, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

interface BanPhaseProps {
  champions: Champion[];
}

export function BanPhase({ champions }: BanPhaseProps) {
  const { bans, removeBan, phase, setPhase, setFocusedSlot } = useDraftStore();

  if (phase !== DraftPhase.Ban) return null;

  const getChampion = (id: string) => champions.find((c) => c.id === id);

  const teamSides = [
    { side: TeamSide.Ally, label: "Ally Bans", color: "text-blue-500", border: "border-blue-500/20" },
    { side: TeamSide.Enemy, label: "Enemy Bans", color: "text-red-500", border: "border-red-500/20" }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldX className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">Target Decommissioning</h2>
          </div>
          <span className="text-[10px] font-bold text-zinc-600">Phase: Banning</span>
        </div>

        <div className="p-6 space-y-8">
          {teamSides.map(({ side, label, color, border }) => (
            <div key={side} className="space-y-3">
              <div className={cn("flex items-center justify-between text-[10px] font-black uppercase tracking-widest pb-1 border-b", border)}>
                <span className={color}>{label}</span>
                <span className="text-zinc-600">{bans[side].length}/5</span>
              </div>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => {
                  const id = bans[side][i];
                  const champ = id ? getChampion(id) : null;
                  return (
                    <div 
                      key={`${side}-${i}`}
                      className={cn(
                        "relative flex-1 aspect-square rounded border transition-colors overflow-hidden bg-zinc-950",
                        champ ? "border-red-500/30" : "border-zinc-800"
                      )}
                    >
                      {champ ? (
                        <>
                          <img src={champ.iconUrl} className="h-full w-full object-cover grayscale opacity-20" alt="" />
                          <button 
                            onClick={() => removeBan(side, id)}
                            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                          <div className="absolute top-1 right-1">
                            <Lock className="w-2.5 h-2.5 text-red-500/50" />
                          </div>
                        </>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-[10px] font-black text-zinc-800">{i + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-4">
            <Button 
              size="sm"
              onClick={() => {
                setPhase(DraftPhase.Pick);
                setFocusedSlot(TeamSide.Ally, "baron" as any);
              }}
              className="px-8 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-[10px] font-black uppercase tracking-widest h-9"
            >
              Finalize Phase
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
