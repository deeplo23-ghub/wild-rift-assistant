"use client";

import { useDraftStore } from "@/store/draftStore";
import { TeamSide, DraftPhase } from "@/types/draft";
import { Champion } from "@/types/champion";
import { Button } from "@/components/ui/button";
import { X, ShieldAlert, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BanPhaseProps {
  champions: Champion[];
}

export function BanPhase({ champions }: BanPhaseProps) {
  const { bans, removeBan, phase, setPhase, setFocusedSlot, focusedSide } = useDraftStore();

  if (phase !== DraftPhase.Ban) return null;

  const totalBans = bans.ally.length + bans.enemy.length;
  const getChampion = (id: string) => champions.find((c) => c.id === id);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-3xl"
    >
      <div className="relative w-full max-w-5xl">
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-red-500/5 blur-[120px] rounded-full" />
        
        <div className="relative space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20"
            >
              <ShieldAlert className="h-6 w-6" />
            </motion.div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">Security Extraction</h2>
              <p className="text-sm text-zinc-500 font-medium">Decommission target threats before primary operations begin</p>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-2 gap-24">
            {/* Ally Bans */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Ally Denial</span>
                <span className="text-[10px] font-black text-zinc-600">{bans.ally.length}/5</span>
              </div>
              <div className="flex gap-3 h-20">
                {[...Array(5)].map((_, i) => {
                  const id = bans.ally[i];
                  const champ = id ? getChampion(id) : null;
                  return (
                    <div 
                      key={`ally-${i}`}
                      onClick={() => setFocusedSlot(TeamSide.Ally, null)}
                      className={cn(
                        "group relative flex-1 rounded-xl border-2 transition-all cursor-pointer overflow-hidden",
                        champ 
                          ? "border-red-500/40 bg-zinc-900 shadow-lg" 
                          : "border-white/5 bg-white/[0.02] hover:border-blue-500/30"
                      )}
                    >
                      {champ ? (
                        <>
                          <img src={champ.iconUrl} className="h-full w-full object-cover grayscale opacity-40 group-hover:opacity-60 transition-all" alt="" />
                          <div className="absolute inset-0 flex items-center justify-center bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity">
                             <X className="h-5 w-5 text-white" onClick={() => removeBan(TeamSide.Ally, id)} />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 py-0.5 bg-red-500/20 flex justify-center backdrop-blur-sm">
                             <Lock className="w-2 h-2 text-red-400" />
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-[10px] font-black text-white/5 tracking-tighter">{i + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enemy Bans */}
            <div className="space-y-6">
              <div className="flex flex-row-reverse items-center justify-between pb-2 border-b border-red-500/20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Enemy Denial</span>
                <span className="text-[10px] font-black text-zinc-600 font-medium">{bans.enemy.length}/5</span>
              </div>
              <div className="flex flex-row-reverse gap-3 h-20">
                {[...Array(5)].map((_, i) => {
                  const id = bans.enemy[i];
                  const champ = id ? getChampion(id) : null;
                  return (
                    <div 
                      key={`enemy-${i}`}
                      onClick={() => setFocusedSlot(TeamSide.Enemy, null)}
                      className={cn(
                        "group relative flex-1 rounded-xl border-2 transition-all cursor-pointer overflow-hidden",
                        champ 
                          ? "border-red-500/40 bg-zinc-900 shadow-lg" 
                          : "border-white/5 bg-white/[0.02] hover:border-red-500/30"
                      )}
                    >
                      {champ ? (
                        <>
                          <img src={champ.iconUrl} className="h-full w-full object-cover grayscale opacity-40 group-hover:opacity-60 transition-all" alt="" />
                          <div className="absolute inset-0 flex items-center justify-center bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity">
                             <X className="h-5 w-5 text-white" onClick={() => removeBan(TeamSide.Enemy, id)} />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 py-0.5 bg-red-500/20 flex justify-center backdrop-blur-sm">
                             <Lock className="w-2 h-2 text-red-400" />
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-[10px] font-black text-white/5 tracking-tighter">{i + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-8">
            <Button 
              size="lg"
              onClick={() => {
                setPhase(DraftPhase.Pick);
                setFocusedSlot(TeamSide.Ally, "baron" as any);
              }}
              className="h-14 px-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-500/20 gap-3 border-t border-white/10 group transition-all hover:scale-105 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="text-sm font-black uppercase tracking-[0.2em]">Deploy Tactical Unit</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
