"use client";

import { useDraftStore } from "@/store/draftStore";
import { TeamSide, DraftPhase } from "@/types/draft";
import { Champion, Role } from "@/types/champion";
import { Button } from "@/components/ui/button";
import { X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BanPhaseProps {
  champions: Champion[];
}

export function BanPhase({ champions }: BanPhaseProps) {
  const { bans, removeBan, phase, setPhase, setFocusedSlot, settings } = useDraftStore();

  if (phase !== DraftPhase.Ban) return null;

  const totalBans = bans.ally.length + bans.enemy.length;
  // In WR it's usually 10, but let user proceed anytime

  const getChampion = (id: string) => champions.find((c) => c.id === id);

  return (
    <motion.div 
      initial={settings.disableAnimations ? undefined : { opacity: 0, y: -20 }}
      animate={settings.disableAnimations ? undefined : { opacity: 1, y: 0 }}
      exit={settings.disableAnimations ? undefined : { opacity: 0, y: -20 }}
      className="fixed inset-x-0 top-0 z-[60] mt-16 p-6"
    >
      <div className={cn(
        "mx-auto max-w-4xl rounded-2xl border border-red-500/20 p-6 shadow-2xl",
        settings.disableTransparency ? "bg-zinc-900" : "bg-zinc-900/90 backdrop-blur-xl"
      )}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Ban Phase</h2>
              <p className="text-sm text-zinc-400">Select up to 5 champions to ban for each team</p>
            </div>
          </div>
          
          <Button 
            variant="default" 
            onClick={() => {
              setPhase(DraftPhase.Pick);
              setFocusedSlot(TeamSide.Ally, Role.Baron);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-6"
          >
            <CheckCircle2 className="w-4 h-4" />
            Start Picking
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Ally Bans */}
          <div className="space-y-4">
            <h3 className="text-xs font-black capitalize tracking-widest text-blue-500/70 ml-1">Ally Bans</h3>
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => {
                const champId = bans.ally[i];
                const champ = champId ? getChampion(champId) : null;
                
                return (
                  <div 
                    key={`ally-ban-${i}`}
                    onClick={() => setFocusedSlot(TeamSide.Ally, null)}
                    className={cn(
                      "group relative h-16 w-16 rounded-xl border-2 cursor-pointer overflow-hidden transition-all",
                      !settings.disableAnimations && "duration-300",
                      champ 
                        ? "border-red-500/50 bg-red-500/10" 
                        : "border-white/5 bg-white/5 hover:border-blue-500/30"
                    )}
                  >
                    {champ ? (
                      <>
                        <img 
                          src={champ.iconUrl} 
                          alt={champ.name} 
                          className="h-full w-full object-cover opacity-60 grayscale group-hover:opacity-80 transition-opacity"
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBan(TeamSide.Ally, champId);
                          }}
                          className="absolute inset-0 flex items-center justify-center bg-red-950/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-6 w-6 text-white" />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-700">
                        <span className="text-xl font-bold">{i + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enemy Bans */}
          <div className="space-y-4">
            <h3 className="text-xs font-black capitalize tracking-widest text-red-500/70 ml-1">Enemy Bans</h3>
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => {
                const champId = bans.enemy[i];
                const champ = champId ? getChampion(champId) : null;
                
                return (
                  <div 
                    key={`enemy-ban-${i}`}
                    onClick={() => setFocusedSlot(TeamSide.Enemy, null)}
                    className={cn(
                      "group relative h-16 w-16 rounded-xl border-2 cursor-pointer overflow-hidden transition-all",
                      !settings.disableAnimations && "duration-300",
                      champ 
                        ? "border-red-500/50 bg-red-500/10" 
                        : "border-white/5 bg-white/5 hover:border-red-500/30"
                    )}
                  >
                    {champ ? (
                      <>
                        <img 
                          src={champ.iconUrl} 
                          alt={champ.name} 
                          className="h-full w-full object-cover opacity-60 grayscale group-hover:opacity-80 transition-opacity"
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBan(TeamSide.Enemy, champId);
                          }}
                          className="absolute inset-0 flex items-center justify-center bg-red-950/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-6 w-6 text-white" />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-700">
                        <span className="text-xl font-bold">{i + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
