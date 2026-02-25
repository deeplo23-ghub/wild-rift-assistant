"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { TeamPanel } from "@/components/draft/TeamPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, ShieldCheck, Cpu } from "lucide-react";
import { TeamSide } from "@/types/draft";

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
      <div className="flex h-screen w-full items-center justify-center bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <Cpu className="h-12 w-12 text-blue-500 animate-pulse" />
             <div className="absolute inset-0 h-12 w-12 border-2 border-blue-500/20 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-1">
             <p className="text-sm font-black uppercase tracking-[0.3em] text-white">Initializing Engine</p>
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Loading Neural Matrix</p>
          </div>
        </div>
      </div>
    );
  }

  if (!champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050505] text-red-500">
        <p>Deployment Error: Connectivity issue with scoring core.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-[#050505] text-zinc-100 selection:bg-blue-500/30 overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div className="absolute -top-[10%] left-[-5%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      {/* High-Level Command Header */}
      <header className="relative z-[100] flex h-14 shrink-0 items-center justify-between px-6 border-b border-white/[0.03] bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-black shadow-xl">
               <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-white">
              Draft <span className="text-blue-500">Assistant</span>
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
             <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Intelligence Layer v1.2</span>
             <div className="h-3 w-[1px] bg-white/5" />
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest leading-none">Scoring Core Online</span>
             </div>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetDraft}
            className="h-8 text-zinc-500 hover:text-white hover:bg-white/5 gap-2 px-3 text-[9px] uppercase font-black tracking-widest"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Data
          </Button>
        </div>
      </header>

      {/* Main Tactical Grid */}
      <main className="relative z-10 flex-1 flex min-h-0">
        {/* Left: Ally Intelligence */}
        <aside className="w-[300px] border-r border-white/[0.03] bg-black/20 p-4 min-h-0">
           <TeamPanel side={TeamSide.Ally} />
        </aside>

        {/* Center: Champion Pool Extraction */}
        <section className="flex-1 min-w-0 bg-white/[0.01]">
           <ChampionPool champions={champions} />
        </section>

        {/* Right: Enemy Intelligence */}
        <aside className="w-[300px] border-l border-white/[0.03] bg-black/20 p-4 min-h-0">
           <TeamPanel side={TeamSide.Enemy} />
        </aside>
      </main>

      {/* Footer System Status */}
      <footer className="h-8 shrink-0 border-t border-white/[0.03] bg-black/60 flex items-center px-6 justify-between">
         <div className="flex gap-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Sync: Real-time</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Source: WR-Meta</span>
         </div>
         <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700">© 2026 Advanced Tactical Systems</span>
      </footer>
    </div>
  );
}
