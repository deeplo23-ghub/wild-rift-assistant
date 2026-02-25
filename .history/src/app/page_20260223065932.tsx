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
      <div className="flex h-screen w-full items-center justify-center bg-black text-gray-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">Initializing Strategic Engine</p>
        </div>
      </div>
    );
  }

  if (!champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-red-500">
        <p className="text-sm font-bold uppercase tracking-widest">Protocol Failure: Data Link Broken</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 selection:bg-gray-700 overflow-hidden font-sans rounded-none">
      {/* Monochrome Operating Header */}
      <header className="h-12 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 shrink-0 rounded-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-4 h-4 text-gray-400" />
            <h1 className="text-base font-bold tracking-tight text-gray-100 uppercase">
              Draft <span className="text-gray-500">Assistant</span>
            </h1>
          </div>
          <div className="h-4 w-[1px] bg-gray-800" />
          <span className="text-xs font-medium text-gray-600 uppercase">Mission Console</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleBanMode}
            className={cn(
               "h-8 text-xs font-semibold uppercase tracking-normal gap-2 px-3 transition-colors rounded-none border-gray-700",
               banModeActive 
                 ? "bg-gray-100 text-black border-gray-100 hover:bg-white" 
                 : "bg-gray-900 text-gray-400 hover:text-gray-100"
            )}
          >
            <ShieldAlert className="w-4 h-4" />
            {banModeActive ? "Ban Phase: Active" : "Toggle Ban Mode"}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetDraft}
            className="h-8 text-xs text-gray-500 hover:bg-gray-800 font-semibold uppercase gap-2 px-3 rounded-none"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </header>

      {/* Main Grid: Pure Black Workspace */}
      <main className="flex-1 overflow-hidden p-2 gap-2 grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr_300px] 2xl:grid-cols-[340px_1fr_340px]">
        {/* Ally Section */}
        <section className="hidden lg:flex flex-col min-h-0 overflow-hidden">
          <AllyPanel />
        </section>

        {/* Intelligence Hub */}
        <section className="flex flex-col min-w-0 min-h-0">
          <ChampionPool champions={champions} />
        </section>

        {/* Enemy Section */}
        <section className="hidden md:flex flex-col min-h-0 overflow-hidden">
          <EnemyPanel />
        </section>
      </main>

      {/* Footer Mobile/Tablet */}
      <div className="lg:hidden h-10 bg-gray-900 border-t border-gray-800 flex items-center justify-around px-4 rounded-none">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Tactical Interface Optimized for Desktop</span>
      </div>
    </div>
  );
}
