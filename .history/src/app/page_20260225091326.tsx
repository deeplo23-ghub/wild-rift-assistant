"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { TeamPanel } from "@/components/draft/TeamPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Loader2, RotateCcw, Info, Settings2, BarChart3, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isAnimating, setIsAnimating] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = settings.disableIntro ? 500 : 5100;
    const startTime = Date.now();
    
    const timer = setTimeout(() => setIsAnimating(false), totalDuration);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let targetProgress = (elapsed / totalDuration) * 100;

      // Realistic "Hiccup" Logic
      // Stalls randomly or slows down at typical "heavy" percentages
      const hiccup = 
        (targetProgress > 22 && targetProgress < 28) ? -5 : 
        (targetProgress > 45 && targetProgress < 55) ? -8 : 
        (targetProgress > 80 && targetProgress < 88) ? -4 : 0;

      const calculatedProgress = Math.min(100, Math.max(0, targetProgress + hiccup));
      
      setProgress(prev => {
        // Only move forward (don't let hiccups move bar backwards)
        // and add a bit of smoothing/jitter
        return Math.max(prev, calculatedProgress);
      });
      
      if (targetProgress >= 100) clearInterval(interval);
    }, 16);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (champions && matrix) {
      setStaticData(champions, matrix);
    }
  }, [champions, matrix, setStaticData]);

  return (
    <AnimatePresence mode="wait">
      {(loadingChamps || loadingMatrix || isAnimating) ? (
        <motion.div 
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.05,
            filter: "blur(20px)",
          }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-white font-sans overflow-hidden"
        >
          <div className="flex flex-col items-center gap-12 relative">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="w-80 h-auto"
            >
            <Logo className="w-full h-full" delay={0.5} />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="flex flex-col items-center gap-4 w-64"
            >
              {/* Progress Bar Container */}
              <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden relative">
                {/* Glow/Pulse background */}
                <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                
                {/* Active Progress */}
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.1 }}
                />

                {/* Lead Edge Glow */}
                <motion.div 
                  className="absolute top-0 h-full w-8 bg-white/20 blur-sm"
                  animate={{ left: `${progress}%` }}
                  style={{ transform: "translateX(-100%)" }}
                  transition={{ ease: "easeOut", duration: 0.1 }}
                />
              </div>

              {/* Percentage & Status */}
              <div className="flex justify-between w-full px-0.5">
                <span className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">LOADING...</span>
                <span className="text-[10px] font-mono tabular-nums text-white/80 font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
            </motion.div>

            <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full -z-10" />
          </div>
        </motion.div>
      ) : (errorChamps || errorMatrix || !champions || !matrix) ? (
        <motion.div 
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-screen w-full items-center justify-center bg-zinc-950 text-red-500 font-sans p-10 text-center"
        >
          <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold tracking-tight">System Link Failure</h2>
              <p className="text-sm text-zinc-500 leading-relaxed font-bold">Could not establish connection to the data layer. Ensure the local SQLite database is populated and the tRPC server is active.</p>
              <Button variant="outline" onClick={() => window.location.reload()} className="border-red-500/20 text-red-500 hover:bg-red-500/10">Retry Connection</Button>
          </div>
        </motion.div>
      ) : (
        <motion.main 
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut"
          }}
          className={cn(
            "h-screen text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col",
            settings.disableTransparency ? "bg-zinc-950 no-transparency" : "bg-transparent",
            settings.disableAnimations && "no-animations"
          )}
          onClick={() => {
            const state = useDraftStore.getState();
            state.setFocusedSlot(state.focusedSide, null);
          }}
        >
      {/* Mini Header */}
      <header className={cn(
        "h-14 border-b border-white/5 flex items-center justify-between px-6",
        settings.disableTransparency ? "bg-zinc-900" : "bg-black/10 backdrop-blur-md"
      )}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-8" />
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
                <Label htmlFor="ban-mode" className="text-[10px] font-bold capitalize tracking-wider cursor-pointer">Ban Mode</Label>
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
              <DialogContent className={cn(
                "border-white/10 text-zinc-100",
                settings.disableTransparency ? "bg-zinc-900" : "bg-black/20 backdrop-blur-xl"
              )}>
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
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="space-y-0.5">
                      <Label>Disable Intro Animation</Label>
                      <p className="text-[11px] text-zinc-500">Skip the splash screen animation when loading.</p>
                    </div>
                    <Switch 
                      checked={settings.disableIntro} 
                      onCheckedChange={() => toggleSetting('disableIntro')} 
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="space-y-0.5">
                      <Label>Disable Animations</Label>
                      <p className="text-[11px] text-zinc-500">Turn off all visual transitions and micro-animations.</p>
                    </div>
                    <Switch 
                      checked={settings.disableAnimations} 
                      onCheckedChange={() => toggleSetting('disableAnimations')} 
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="space-y-0.5">
                      <Label>Disable Transparency</Label>
                      <p className="text-[11px] text-zinc-500">Use solid backgrounds instead of glassmorphism.</p>
                    </div>
                    <Switch 
                      checked={settings.disableTransparency} 
                      onCheckedChange={() => toggleSetting('disableTransparency')} 
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
           const state = useDraftStore.getState();
           state.setFocusedSlot(state.focusedSide, null);
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

      <footer className={cn(
        "h-6 border-t border-white/5 px-6 flex items-center justify-between",
        settings.disableTransparency ? "bg-zinc-900" : "bg-black/20"
      )}>
          <div className="flex items-center gap-4 text-[8px] font-bold text-zinc-600 capitalize tracking-widest">
              <span>Next.js 16 + tRPC</span>
              <span>PostgreSQL / SQLite Connection</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-600 capitalize flex-row-reverse">
              <span>Developed for Competitive Analysis</span>
              <Info className="w-2.5 h-2.5" />
          </div>
      </footer>
    </motion.main>
    )}
    </AnimatePresence>
  );
}
