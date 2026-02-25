"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { AllyPanel } from "@/components/draft/AllyPanel";
import { EnemyPanel } from "@/components/draft/EnemyPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Cpu, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DraftPage() {
  const { data: champions, isLoading: loadingChamps } = trpc.getChampions.useQuery();
  const { data: matrix, isLoading: loadingMatrix } = trpc.getCounterMatrix.useQuery();
  
  const setStaticData = useDraftStore((state) => state.setStaticData);
  const resetDraft = useDraftStore((state) => state.resetDraft);
  const { banModeActive, toggleBanMode } = useDraftStore();

  useEffect(() => {
    if (champions && matrix) {
      setStaticData(champions, matrix);
    }
  }, [champions, matrix, setStaticData]);

  if (loadingChamps || loadingMatrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-gray-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-gray-800" />
          <p className="text-sm font-bold uppercase tracking-[0.3em]">Neural Link Initializing</p>
        </div>
      </div>
    );
  }

  if (!champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-red-900">
        <p className="text-sm font-bold uppercase tracking-widest">Protocol Failure: Data Link Broken</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 selection:bg-gray-800 overflow-hidden font-sans rounded-none">
      {/* Precision Navigation Header */}
      <header className="h-12 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-6 shrink-0 rounded-none z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Cpu className="w-4 h-4 text-gray-400" />
            <h1 className="text-sm font-black tracking-tighter text-gray-100 uppercase">
              Draft <span className="text-gray-500">Analytics.AI</span>
            </h1>
          </div>
          <div className="h-4 w-[1px] bg-gray-800" />
          <div className="flex gap-6">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">System Online</span>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">v2.0.0-PRO</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleBanMode}
            className={cn(
               "h-8 text-[10px] font-black uppercase tracking-widest gap-2 px-4 transition-all rounded-none border-gray-800",
               banModeActive 
                 ? "bg-gray-100 text-black border-gray-100 hover:bg-white" 
                 : "bg-gray-900 text-gray-500 hover:text-gray-100 hover:border-gray-500"
            )}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {banModeActive ? "Ban Override: On" : "Toggle Ban Mode"}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetDraft}
            className="h-8 text-[10px] text-gray-600 hover:text-gray-100 hover:bg-gray-900 font-black uppercase gap-2 px-3 rounded-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>
      </header>

      {/* Tri-Pane Deployment Grid */}
      <main className="flex-1 overflow-hidden p-2 gap-2 grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr_320px] 2xl:grid-cols-[380px_1fr_380px]">
        {/* Left Flank: Ally Strategic Summary */}
        <section className="hidden lg:flex flex-col min-h-0 overflow-hidden bg-gray-950 border border-gray-900">
          <AllyPanel />
        </section>

        {/* Central Core: Champion Intelligence Hub */}
        <section className="flex flex-col min-w-0 min-h-0 bg-black">
          <ChampionPool champions={champions} />
        </section>

        {/* Right Flank: Enemy Strategic Summary */}
        <section className="hidden md:flex flex-col min-h-0 overflow-hidden bg-gray-950 border border-gray-900">
          <EnemyPanel />
        </section>
      </main>

      {/* Mobile/Auxiliary Information Layer */}
      <div className="lg:hidden h-10 bg-gray-900 border-t border-gray-800 flex items-center justify-around px-4 rounded-none">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Operational Workspace Locked to Desktop</span>
      </div>
    </div>
  );
}
