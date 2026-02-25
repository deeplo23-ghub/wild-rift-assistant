"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { AllyPanel } from "@/components/draft/AllyPanel";
import { EnemyPanel } from "@/components/draft/EnemyPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { BanPhase } from "@/components/draft/BanPhase";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function DraftPage() {
  const { data: champions, isLoading: loadingChamps } = trpc.getChampions.useQuery();
  const { data: matrix, isLoading: loadingMatrix } = trpc.getCounterMatrix.useQuery();
  
  const setStaticData = useDraftStore((state) => state.setStaticData);
  const resetDraft = useDraftStore((state) => state.resetDraft);

  useEffect(() => {
    if (champions && matrix) {
      setStaticData(champions, matrix);
    }
  }, [champions, matrix, setStaticData]);

  if (loadingChamps || loadingMatrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Initializing Draft Engine...</p>
        </div>
      </div>
    );
  }

  if (!champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-red-500">
        <p>Failed to load draft data. Check backend connection.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-zinc-100 selection:bg-blue-500/30 overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Modern Header */}
      <header className="sticky top-0 z-[100] w-full border-b border-white/[0.03] bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <div className="h-3 w-3 rounded-full bg-white/20 blur-[1px]" />
              </div>
              <h1 className="text-sm font-bold uppercase tracking-[0.1em] text-white">
                Wild <span className="text-blue-500">Rift</span> Assistant
              </h1>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Draft Engine v1.0</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetDraft}
            className="h-8 text-zinc-400 hover:text-white hover:bg-white/5 gap-2 px-3 text-[10px] uppercase font-bold tracking-widest"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Session
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 mx-auto max-w-[1800px] px-6 py-6 h-[calc(100vh-56px)] overflow-hidden">
        <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-[340px_1fr_340px]">
          {/* Left: Ally Section */}
          <aside className="flex flex-col gap-6 min-h-0">
            <AllyPanel />
          </aside>

          {/* Center: Intelligence Center */}
          <section className="relative flex flex-col min-w-0 min-h-0">
            <div className="h-full rounded-2xl border border-white/[0.03] bg-white/[0.01] shadow-2xl overflow-hidden">
              <ChampionPool champions={champions} />
            </div>
          </section>

          {/* Right: Enemy Section */}
          <aside className="flex flex-col gap-6 min-h-0">
            <EnemyPanel />
          </aside>
        </div>
      </div>

      <AnimatePresence>
        <BanPhase champions={champions} />
      </AnimatePresence>
    </div>
  );
}
