"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { TeamPanel } from "@/components/draft/TeamPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Loader2, RotateCcw, Info, Settings2, BarChart3, Ban } from "lucide-react";
import { TeamSide } from "@/types/draft";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function DraftPage() {
  const { data: champions, isLoading: loadingChamps, error: errorChamps } = trpc.getChampions.useQuery();
  const { data: matrix, isLoading: loadingMatrix, error: errorMatrix } = trpc.getCounterMatrix.useQuery();
  
  const setStaticData = useDraftStore((state) => state.setStaticData);
  const resetDraft = useDraftStore((state) => state.resetDraft);
  const isBanMode = useDraftStore((state) => state.isBanMode);
  const toggleBanMode = useDraftStore((state) => state.toggleBanMode);
  const settings = useDraftStore((state) => state.settings);
  const toggleSetting = useDraftStore((state) => state.toggleSetting);

  useEffect(() => {
    if (champions && matrix) {
      setStaticData(champions, matrix);
    }
  }, [champions, matrix, setStaticData]);

  if (loadingChamps || loadingMatrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center animate-pulse">
             <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 ml-1">Calibrating Engine...</p>
        </div>
      </div>
    );
  }

  if (errorChamps || errorMatrix || !champions || !matrix) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-red-500 font-sans p-10 text-center">
        <div className="max-w-md space-y-4">
            <h2 className="text-xl font-bold tracking-tight">System Link Failure</h2>
            <p className="text-sm text-zinc-500 leading-relaxed font-bold">Could not establish connection to the data layer. Ensure the local SQLite database is populated and the tRPC server is active.</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="border-red-500/20 text-red-500 hover:bg-red-500/10">Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <main 
      className="min-h-screen bg-transparent text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col"
      onClick={() => {
        useDraftStore.getState().setFocusedSlot(TeamSide.Ally, null);
      }}
    >
      {/* Mini Header */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <h1 className="text-sm font-bold tracking-tight text-white">
              Wild Rift Assistant
            </h1>
          </div>
          
          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-3">
             <div 
               onClick={(e) => e.stopPropagation()}
               className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300",
                isBanMode ? "border-red-500/50 bg-red-500/10" : "border-white/5 bg-white/5"
              )}>
                <Ban className={cn("w-3 h-3", isBanMode ? "text-red-500" : "text-zinc-500")} />
                <Label htmlFor="ban-mode" className="text-[10px] font-bold uppercase tracking-wider cursor-pointer">Ban Mode</Label>
                <Switch 
                  id="ban-mode" 
                  checked={isBanMode} 
                  onCheckedChange={() => toggleBanMode()} 
                  className="scale-75 data-[state=checked]:bg-red-500"
                />
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="w-9 h-9 text-zinc-500 hover:text-white hover:bg-white/5"
                >
                    <Settings2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/40 backdrop-blur-xl border-white/10 text-zinc-100">
                <DialogHeader>
                  <DialogTitle>Assistant Settings</DialogTitle>
                  <DialogDescription className="text-zinc-500">
                    Configure the draft intelligence engine and UI preferences.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Focus Next Slot</Label>
                      <p className="text-[11px] text-zinc-500">Automatically move selection focus after picking.</p>
                    </div>
                    <Switch 
                      checked={settings.autoFocus} 
                      onCheckedChange={() => toggleSetting('autoFocus')} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Score Breakdown</Label>
                      <p className="text-[11px] text-zinc-500">Display numerical values for each scoring component.</p>
                    </div>
                    <Switch 
                      checked={settings.showBreakdown} 
                      onCheckedChange={() => toggleSetting('showBreakdown')} 
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); resetDraft(); }}
                className="h-8 text-[11px] border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white px-4 gap-2 font-bold"
            >
                <RotateCcw className="w-3 h-3" />
                Reset
            </Button>
        </div>
      </header>

      {/* Main Studio Layout */}
      <div 
        className="flex-1 overflow-hidden p-6 grid grid-cols-[340px_1fr_340px] gap-6 max-w-[1920px] mx-auto w-full"
        onClick={() => {
           useDraftStore.getState().setFocusedSlot(TeamSide.Ally, null);
        }}
      >
        <aside className="min-h-0 flex flex-col h-full">
            <TeamPanel side={TeamSide.Ally} />
        </aside>

        <section className="min-h-0 h-full flex flex-col">
            <ChampionPool champions={champions} />
        </section>

        <aside className="min-h-0 flex flex-col h-full">
            <TeamPanel side={TeamSide.Enemy} />
        </aside>
      </div>

      <footer className="h-6 border-t border-white/5 bg-black/40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
              <span>Next.js 16 + tRPC</span>
              <span>PostgreSQL / SQLite Connection</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-600 uppercase flex-row-reverse">
              <span>Developed for Competitive Analysis</span>
              <Info className="w-2.5 h-2.5" />
          </div>
      </footer>
    </main>
  );
}
