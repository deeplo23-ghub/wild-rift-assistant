"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { TeamPanel } from "@/components/draft/TeamPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { MatchupAnalysis } from "@/components/draft/MatchupAnalysis";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RotateCcw,
  Info,
  Settings2,
  BarChart3,
  Ban,
  Database,
} from "lucide-react";
import { SyncProgressNotification } from "@/components/brand/SyncProgressNotification";
import { LogoText } from "@/components/brand/LogoText";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { TeamSide, ALL_ROLES, TeamState } from "@/types/draft";
import { Champion } from "@/types/champion";
import { DraftSettings } from "@/components/draft/TeamPanel";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function SettingRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 group/setting">
      <div className="space-y-0.5 min-w-0">
        <Label className="text-[13px] font-bold text-zinc-200 group-hover/setting:text-white transition-colors cursor-pointer" onClick={onChange}>{label}</Label>
        <p className="text-[10px] text-zinc-500 leading-relaxed">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

export default function DraftPage() {
  const utils = trpc.useUtils();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const {
    data: champions,
    isLoading: loadingChamps,
    error: errorChamps,
  } = trpc.getChampions.useQuery();
  const {
    data: matrix,
    isLoading: loadingMatrix,
    error: errorMatrix,
  } = trpc.getCounterMatrix.useQuery();

  const syncMutation = trpc.syncDatabase.useMutation({
    onSuccess: (data) => {
      if (data.jobId) {
        setActiveJobId(data.jobId);
      }
    },
  });

  const setStaticData = useDraftStore((state) => state.setStaticData);
  const resetDraft = useDraftStore((state) => state.resetDraft);
  const isBanMode = useDraftStore((state) => state.isBanMode);
  const toggleBanMode = useDraftStore((state) => state.toggleBanMode);
  const settings = useDraftStore((state) => state.settings);
  const toggleSetting = useDraftStore((state) => state.toggleSetting);
  const allyPicksCount = useDraftStore(
    (state) => Object.values(state.ally).filter((v) => v.championId).length,
  );
  const enemyPicksCount = useDraftStore(
    (state) => Object.values(state.enemy).filter((v) => v.championId).length,
  );
  const isDraftComplete = allyPicksCount === 5 && enemyPicksCount === 5;
  const [analysisReady, setAnalysisReady] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const allyState = useDraftStore((state) => state.ally);
  const enemyState = useDraftStore((state) => state.enemy);
  const scoredChampions = useDraftStore((state) => state.scoredChampions);

  const powerBiasValue = useMemo(() => {
    const getPickedIds = (team: TeamState) => 
      ALL_ROLES.map(role => team[role].championId).filter(Boolean) as string[];

    const allyIds = getPickedIds(allyState);
    const enemyIds = getPickedIds(enemyState);

    if (allyIds.length === 0 && enemyIds.length === 0) return 0.5;
    
    const getTeamAvg = (ids: string[]) => {
      const scores = ids.map(id => 
        scoredChampions.find(s => s.championId === id)?.finalScore || 0
      );
      return ids.length > 0 ? scores.reduce((a, b) => a + b, 0) / ids.length : 0;
    };

    const allyAvg = getTeamAvg(allyIds);
    const enemyAvg = getTeamAvg(enemyIds);
    
    if (allyAvg === 0 && enemyAvg === 0) return 0.5;
    
    const total = allyAvg + enemyAvg;
    const rawProb = allyAvg / total;
    
    return 0.35 + (rawProb * 0.3);
  }, [allyState, enemyState, scoredChampions]);

  const springBias = useSpring(powerBiasValue, {
    stiffness: 20,
    damping: 15,
    mass: 0.5
  });

  const [currentBias, setCurrentBias] = useState(0.5);
  useEffect(() => {
    return springBias.on("change", (v: number) => setCurrentBias(v));
  }, [springBias]);

  const leftWidth = useTransform(springBias, (v: number) => `${v * 100}%`);
  const rightWidth = useTransform(springBias, (v: number) => `${(1 - v) * 100}%`);

  const [isAnimating, setIsAnimating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeSettingsTab, setActiveSettingsTab] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopHint, setShowTopHint] = useState(false);
  const [showBottomHint, setShowBottomHint] = useState(false);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowTopHint(scrollTop > 10);
    setShowBottomHint(scrollTop + clientHeight < scrollHeight - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener("scroll", checkScroll);
      const observer = new ResizeObserver(checkScroll);
      observer.observe(el);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        observer.disconnect();
      };
    }
  }, [checkScroll, activeSettingsTab]);

  // Mock loading delay before showing analysis panel
  useEffect(() => {
    if (isDraftComplete) {
      setTimeout(() => {
        setAnalysisReady(false);
        setAnalysisProgress(0);
      }, 0);
      
      const totalDuration = 4000;
      const startTime = Date.now();

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const targetProgress = (elapsed / totalDuration) * 100;

        // Realistic hiccup logic (same as page loading)
        const hiccup =
          targetProgress > 20 && targetProgress < 28 ? -6 :
          targetProgress > 48 && targetProgress < 58 ? -10 :
          targetProgress > 78 && targetProgress < 86 ? -5 : 0;

        const calculatedProgress = Math.min(100, Math.max(0, targetProgress + hiccup));
        setAnalysisProgress(prev => Math.max(prev, calculatedProgress));

        if (targetProgress >= 100) {
          clearInterval(interval);
          setAnalysisReady(true);
        }
      }, 16);

      return () => clearInterval(interval);
    } else {
      setTimeout(() => {
        setAnalysisReady(false);
        setAnalysisProgress(0);
      }, 0);
    }
  }, [isDraftComplete]);

  useEffect(() => {
    if (settings.disableIntro) {
      setTimeout(() => {
        setIsAnimating(false);
        setProgress(100);
      }, 0);
      return;
    }

    const totalDuration = 5100; // 0.5s delay + 3.6s logo anim + 1s final stretch
    const startTime = Date.now();

    const timer = setTimeout(() => setIsAnimating(false), totalDuration);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const targetProgress = (elapsed / totalDuration) * 100;

      // Realistic "Hiccup" Logic
      const hiccup =
        targetProgress > 22 && targetProgress < 28
          ? -5
          : targetProgress > 45 && targetProgress < 55
            ? -8
            : targetProgress > 80 && targetProgress < 88
              ? -4
              : 0;

      const calculatedProgress = Math.min(
        100,
        Math.max(0, targetProgress + hiccup),
      );

      setProgress((prev) => Math.max(prev, calculatedProgress));

      if (targetProgress >= 100) clearInterval(interval);
    }, 16);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [settings.disableIntro]);

  useEffect(() => {
    if (champions && matrix) {
      setStaticData(champions, matrix);
    }
  }, [champions, matrix, setStaticData]);
  const { data: currentSyncJob } = trpc.getSyncStatus.useQuery(activeJobId || "", {
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "FAILED") {
        return false;
      }
      return 2000;
    },
  });

  // Prevent flicker: Syncing if mutation is pending OR if we have an active job that isn't finished yet
  const isSyncing = syncMutation.isPending || (!!activeJobId && (!currentSyncJob || currentSyncJob.status === "RUNNING"));

  return (
    <AnimatePresence mode="wait">
      {loadingChamps || loadingMatrix || isAnimating ? (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: "blur(20px)",
          }}
          transition={{
            duration: settings.disableIntro ? 0.2 : 1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-white font-sans overflow-hidden"
        >
          <div className="flex flex-col items-center gap-12 relative">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="w-full h-auto flex flex-col items-center gap-6"
            >
              <LogoText className="h-24 md:h-32 w-auto" delay={0.5} />
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
                <div className="absolute inset-0 bg-white/10 animate-pulse" />

                {/* Active Progress */}
                <motion.div
                  className="absolute top-0 left-0 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
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
                <span className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">
                  LOADING...
                </span>
                <span className="text-[10px] font-mono tabular-nums text-white/80 font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
            </motion.div>

            <div className="absolute inset-0 bg-white/5 blur-[120px] rounded-full -z-10" />
          </div>
        </motion.div>
      ) : errorChamps || errorMatrix || !champions || !matrix ? (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-screen w-full items-center justify-center bg-zinc-950 text-red-500 font-sans p-10 text-center"
        >
          <div className="max-w-md space-y-4">
            <h2 className="text-xl font-bold tracking-tight">
              System Link Failure
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed font-bold">
              Could not establish connection to the cloud data layer. Ensure the
              PostgreSQL database is online and the connection string is valid.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-red-500/20 text-red-500 hover:bg-red-500/10"
            >
              Retry Connection
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.main
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className={cn(
            "h-screen text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col relative",
            settings.disableTransparency
              ? "bg-zinc-950 no-transparency"
              : "bg-mesh-gradient",
            settings.disableAnimations && "no-animations",
            !settings.showTooltips && "no-tooltips",
          )}
          onClick={() => {
            const state = useDraftStore.getState();
            state.setFocusedSlot(state.focusedSide, null);
          }}
        >
          {!settings.disableTransparency && (
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden flex">
              <ParticleBackground splitBias={currentBias} />
              
              {/* Ally Side (Left) - Blue/Cyan Influence */}
              <motion.div 
                className="relative h-full overflow-hidden border-r border-white/5"
                style={{ width: leftWidth }}
              >
                {/* Massive Base Aura - Blue */}
                <div className="absolute top-[-20%] left-[-30%] w-[100vw] h-[100vw] rounded-full bg-blue-600/10 blur-[150px] animate-float opacity-40 shrink-0" />
                <div className="absolute bottom-[20%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/5 blur-[120px] animate-float opacity-30" />
                <div className="absolute top-[10%] left-[15%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/5 blur-[100px] animate-float-slow" />
              </motion.div>

              {/* Enemy Side (Right) - Red/Purple Influence */}
              <motion.div 
                className="relative h-full overflow-hidden"
                style={{ width: rightWidth }}
              >
                {/* Massive Base Aura - Red */}
                <div className="absolute bottom-[-20%] right-[-30%] w-[100vw] h-[100vw] rounded-full bg-red-600/10 blur-[150px] animate-float-reverse opacity-40 shrink-0" />
                <div className="absolute top-[10%] right-[15%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/5 blur-[100px] animate-float-slow" />
                <div className="absolute bottom-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-red-400/5 blur-[90px] animate-float-reverse" />
              </motion.div>

              {/* Subtlest Breathing Center - Shared Boundary */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-zinc-900/10 blur-[140px] animate-breathe" />
            </div>
          )}
          {/* Mini Header */}
          <header
            className={cn(
              "h-14 border-b border-white/5 flex items-center justify-between px-6",
              settings.disableTransparency
                ? "bg-zinc-900"
                : "bg-black/10 backdrop-blur-md",
            )}
          >
            <div className="flex items-center gap-6">
              <LogoText className="h-[24px] w-auto" />

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBanMode();
                }}
                className={cn(
                  "h-8 text-[11px] px-4 gap-2 font-bold transition-all border",
                  isBanMode 
                    ? "bg-red-500/20 text-red-500 border-red-500/60 hover:bg-red-500/30 hover:text-red-500" 
                    : "bg-white/5 text-zinc-300 border-white/10 hover:text-white hover:bg-white/10"
                )}
              >
                <Ban className={cn("w-3 h-3", isBanMode ? "text-red-500" : "text-zinc-400")} />
                Ban Mode
              </Button>
              
              <div className="h-4 w-px bg-white/10" />

              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-6 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] pt-0.5 hover:text-zinc-300 transition-colors outline-none cursor-pointer">
                    <span className="text-zinc-400">v0.5-alpha</span>
                    <div className="flex items-center gap-3">
                      <span>Next.js 16</span>
                      <span className="opacity-20">/</span>
                      <span>tRPC</span>
                      <span className="opacity-20">/</span>
                      <span>Neon DB</span>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className={cn(
                  "border-white/10 text-zinc-100 max-w-sm",
                  settings.disableTransparency ? "bg-zinc-900" : "bg-black/50 backdrop-blur-md"
                )}>
                  <DialogHeader>
                    <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Stack Analysis</DialogTitle>
                    <DialogDescription className="text-[10px] text-zinc-500 uppercase tracking-widest">
                      Runtime Environment & Core Infrastructure
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="p-3 rounded border border-white/5 bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Build Version</span>
                        <span className="text-[10px] font-mono text-zinc-500">v0.5.0-alpha.rc1</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-zinc-500 font-medium">Standard development instance focused on relational scoring logic and state synchronization. Current focus: Performance profiling and matrix optimization.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="group/item">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover/item:text-zinc-300 transition-colors">
                          <span>Framework / Next.js 16</span>
                          <span className="opacity-0 group-hover/item:opacity-100 transition-opacity font-mono text-[8px]">App Router</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 leading-snug mt-1">Edge-optimized application framework utilizing server components for draft state initialization and client-side hydrological hydration.</p>
                      </div>

                      <div className="group/item">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover/item:text-zinc-300 transition-colors">
                          <span>Communication / tRPC</span>
                          <span className="opacity-0 group-hover/item:opacity-100 transition-opacity font-mono text-[8px]">Type-Safe</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 leading-snug mt-1">End-to-end type-safe API communication between the scoring engine and draft manager, eliminating network-level schema drift.</p>
                      </div>

                      <div className="group/item">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover/item:text-zinc-300 transition-colors">
                          <span>Persistence / Neon DB</span>
                          <span className="opacity-0 group-hover/item:opacity-100 transition-opacity font-mono text-[8px]">Postgres</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 leading-snug mt-1">High-performance PostgreSQL instance for relational champion mapping and weighted scoring matrices, optimized for rapid counter-lookups.</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center gap-3">

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
                <DialogContent
                  className={cn(
                    "border-white/10 text-zinc-100 max-w-2xl h-[650px] overflow-hidden flex flex-col",
                    settings.disableTransparency
                      ? "bg-zinc-900"
                      : "bg-black/50 backdrop-blur-md",
                  )}
                >
                  <DialogHeader className="px-1">
                    <DialogTitle className="text-xl font-black tracking-tight">Assistant Settings</DialogTitle>
                    <DialogDescription className="text-zinc-500 text-xs">
                      Advanced system configuration and interface modules.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-hidden flex flex-col relative">
                    <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="flex-1 overflow-hidden flex flex-col">
                      <div className="px-1 mb-4 flex justify-center">
                        <TabsList className="bg-black/20 border border-white/5 p-1 h-8 gap-0.5 w-fit relative">
                          {["all", "drafting", "analysis", "interface"].map((tab) => (
                            <TabsTrigger
                              key={tab}
                              value={tab}
                              className="relative px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest h-6 transition-all z-0 data-[state=active]:!bg-transparent data-[state=active]:text-white text-zinc-500 hover:text-zinc-300 border-none shadow-none ring-0 focus-visible:ring-0"
                            >
                              {activeSettingsTab === tab && (
                                <motion.div
                                  layoutId="settings-tab-indicator"
                                  className="absolute inset-0 bg-white/10 rounded-md -z-10"
                                  transition={{ 
                                    type: "spring", 
                                    bounce: 0.15, 
                                    duration: settings.disableAnimations ? 0 : 0.4 
                                  }}
                                />
                              )}
                              <span className="relative z-10">{tab}</span>
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>

                      <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto pr-4 -mr-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors"
                      >
                        <TabsContent value="all" className="space-y-8 pb-12 outline-none">
                          <DraftingSettings settings={settings} toggleSetting={toggleSetting} />
                          <AnalysisSettings settings={settings} toggleSetting={toggleSetting} />
                          <InterfaceSettings settings={settings} toggleSetting={toggleSetting} />
                        </TabsContent>

                        <TabsContent value="drafting" className="space-y-8 pb-12 outline-none">
                          <DraftingSettings settings={settings} toggleSetting={toggleSetting} />
                        </TabsContent>

                        <TabsContent value="analysis" className="space-y-8 pb-12 outline-none">
                          <AnalysisSettings settings={settings} toggleSetting={toggleSetting} />
                        </TabsContent>

                        <TabsContent value="interface" className="space-y-8 pb-12 outline-none">
                          <InterfaceSettings settings={settings} toggleSetting={toggleSetting} />
                        </TabsContent>
                      </div>
                    </Tabs>
                    
                    {/* Visual Scroll Hints */}
                    <AnimatePresence>
                      {showTopHint && (
                        <motion.div 
                          key="top-scroll-hint"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-[52px] left-0 right-0 h-10 bg-gradient-to-b from-zinc-950/80 to-transparent pointer-events-none z-20" 
                        />
                      )}
                      {showBottomHint && (
                        <motion.div 
                          key="bottom-scroll-hint"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none z-20" 
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  syncMutation.mutate();
                }}
                disabled={isSyncing || process.env.NODE_ENV === "production"}
                className="h-8 text-[11px] border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white px-4 gap-2 font-bold"
                title={process.env.NODE_ENV === "production" ? "Sync is disabled in production to comply with Vercel TOS. Run sync locally." : ""}
              >
                {isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Database className="w-3 h-3" />
                )}
                {isSyncing ? "Syncing..." : process.env.NODE_ENV === "production" ? "Sync Locked" : "Sync DB"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  resetDraft();
                }}
                className="h-8 text-[11px] border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white px-4 gap-2 font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            </div>
          </header>

          {/* Main Studio Layout */}
          <div
            className={cn(
              "flex-1 overflow-hidden grid max-w-[1920px] mx-auto w-full",
              settings.compactMode
                ? "p-3 grid-cols-[300px_1fr_300px] gap-3"
                : "p-6 grid-cols-[340px_1fr_340px] gap-6"
            )}
            onClick={() => {
              const state = useDraftStore.getState();
              state.setFocusedSlot(state.focusedSide, null);
            }}
          >
            <aside className="min-h-0 flex flex-col h-full">
              <TeamPanel side={TeamSide.Ally} />
            </aside>

            <section className="min-h-0 h-full flex flex-col">
              <AnimatePresence mode="wait">
                {isDraftComplete && !analysisReady ? (
                  <motion.div
                    key="analysis-loading"
                    className="flex-1 flex flex-col items-center justify-center gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="flex flex-col items-center gap-6"
                    >
                      <LogoText className="h-16 md:h-20 w-auto" delay={0.2} />
                    </motion.div>

                    {/* Progress bar with hiccups */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="flex flex-col items-center gap-3 w-64"
                    >
                      <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${analysisProgress}%` }}
                          transition={{ ease: "easeOut", duration: 0.1 }}
                        />
                        <motion.div
                          className="absolute top-0 h-full w-8 bg-white/20 blur-sm"
                          animate={{ left: `${analysisProgress}%` }}
                          style={{ transform: "translateX(-100%)" }}
                          transition={{ ease: "easeOut", duration: 0.1 }}
                        />
                      </div>
                      <div className="flex justify-between w-full px-0.5">
                        <span className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase">
                          ANALYZING...
                        </span>
                        <span className="text-[10px] font-mono tabular-nums text-white/80 font-bold">
                          {Math.round(analysisProgress)}%
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : isDraftComplete ? (
                  <motion.div
                    key="analysis-panel"
                    className="flex-1 min-h-0 h-full flex flex-col"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <MatchupAnalysis />
                  </motion.div>
                ) : (
                  <motion.div
                    key="champion-pool"
                    className="flex-1 min-h-0 h-full flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChampionPool champions={champions} />
                  </motion.div>
                )}
              </AnimatePresence>

              <footer
                className={cn(
                  "mt-auto pt-6 pb-2 text-[10px] text-zinc-500/60 font-bold text-center leading-relaxed px-4 max-w-4xl mx-auto"
                )}
              >
                Draft Assistant for Wild Rift isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.
                Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
              </footer>
            </section>

            <aside className="min-h-0 flex flex-col h-full">
              <TeamPanel side={TeamSide.Enemy} />
            </aside>
          </div>

          {/* Sync Progress Notification */}
          <AnimatePresence>
            {activeJobId && (
              <SyncProgressNotification
                jobId={activeJobId}
                onClose={() => setActiveJobId(null)}
                onComplete={() => {
                  utils.getChampions.invalidate();
                  utils.getCounterMatrix.invalidate();
                }}
              />
            )}
          </AnimatePresence>
        </motion.main>
      )}
    </AnimatePresence>
  );
}

function DraftingSettings({ settings, toggleSetting }: { settings: Record<string, boolean>; toggleSetting: (key: keyof DraftSettings) => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex justify-center pb-1 border-b border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Draft Behavior</h3>
        </div>
        <SettingRow label="Auto-Focus Next Slot" desc="Automatically move focus to the next empty slot after picking." checked={settings.autoFocus} onChange={() => toggleSetting("autoFocus")} />
        <SettingRow label="Auto-Focus Ban Slot" desc="Automatically focus the next ban slot after banning." checked={settings.autoBanFocus} onChange={() => toggleSetting("autoBanFocus")} />
        <SettingRow label="Confirm Picks" desc="Require double-click to confirm champion selection." checked={settings.confirmPicks} onChange={() => toggleSetting("confirmPicks")} />
      </div>

      <div className="space-y-3">
        <div className="flex justify-center pb-1 border-b border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Champion Pool</h3>
        </div>
        <SettingRow label="Top 3 Recommendations" desc="Show the top 3 recommended picks above the champion grid." checked={settings.showTopRecommendations} onChange={() => toggleSetting("showTopRecommendations")} />
        <SettingRow label="Synergy Icons" desc="Display teammate synergy indicators on picks." checked={settings.showSynergyIcons} onChange={() => toggleSetting("showSynergyIcons")} />
        <SettingRow label="Counter Icons" desc="Display counter matchup indicators on picks." checked={settings.showCounterIcons} onChange={() => toggleSetting("showCounterIcons")} />
        <SettingRow label="Weakness Icons" desc="Display vulnerability indicators on picks." checked={settings.showWeaknessIcons} onChange={() => toggleSetting("showWeaknessIcons")} />
        <SettingRow label="Dense Grid" desc="Use a tighter grid layout to show more champions at once." checked={settings.gridDensity} onChange={() => toggleSetting("gridDensity")} />
      </div>
    </div>
  );
}

function AnalysisSettings({ settings, toggleSetting }: { settings: Record<string, boolean>; toggleSetting: (key: keyof DraftSettings) => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex justify-center pb-1 border-b border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Scoring & Display</h3>
        </div>
        <SettingRow label="Score Breakdown" desc="Show detailed scoring components on recommended champions." checked={settings.showBreakdown} onChange={() => toggleSetting("showBreakdown")} />
        <SettingRow label="Win Rates" desc="Display champion win rate percentages." checked={settings.showWinRates} onChange={() => toggleSetting("showWinRates")} />
        <SettingRow label="Pick Rates" desc="Display champion pick rate percentages." checked={settings.showPickRates} onChange={() => toggleSetting("showPickRates")} />
        <SettingRow label="Ban Rates" desc="Display champion ban rate percentages." checked={settings.showBanRates} onChange={() => toggleSetting("showBanRates")} />
        <SettingRow label="Tier Badges" desc="Show tier rank badges (S+, S, A, B...) on champion icons." checked={settings.showTierBadges} onChange={() => toggleSetting("showTierBadges")} />
        <SettingRow label="Damage Type Badge" desc="Show AD/AP/Hybrid/True damage type indicators." checked={settings.showDamageType} onChange={() => toggleSetting("showDamageType")} />
        <SettingRow label="Champion Tags" desc="Display gameplay tags (Assassin, Tank, Engage, etc.)." checked={settings.showTags} onChange={() => toggleSetting("showTags")} />
      </div>

      <div className="space-y-3">
        <div className="flex justify-center pb-1 border-b border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Analysis Panel</h3>
        </div>
        <SettingRow label="Win Probability Bar" desc="Show estimated win probability comparison at the top." checked={settings.showWinProbability} onChange={() => toggleSetting("showWinProbability")} />
        <SettingRow label="Damage Distribution" desc="Show team damage type breakdown bar in the header." checked={settings.showDamageDistribution} onChange={() => toggleSetting("showDamageDistribution")} />
        <SettingRow label="Matchup Comparison Bars" desc="Show side-by-side metric comparison bars." checked={settings.showMatchupBars} onChange={() => toggleSetting("showMatchupBars")} />
      </div>
    </div>
  );
}

function InterfaceSettings({ settings, toggleSetting }: { settings: Record<string, boolean>; toggleSetting: (key: keyof DraftSettings) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-center pb-1 border-b border-white/5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Performance & UI</h3>
      </div>
      <SettingRow label="Disable Intro Animation" desc="Skip the splash screen animation on load." checked={settings.disableIntro} onChange={() => toggleSetting("disableIntro")} />
      <SettingRow label="Disable Animations" desc="Turn off all transitions and micro-animations." checked={settings.disableAnimations} onChange={() => toggleSetting("disableAnimations")} />
      <SettingRow label="Disable Transparency" desc="Use solid backgrounds instead of glassmorphism effects." checked={settings.disableTransparency} onChange={() => toggleSetting("disableTransparency")} />
      <SettingRow label="Compact Mode" desc="Reduce padding and spacing throughout the interface." checked={settings.compactMode} onChange={() => toggleSetting("compactMode")} />
      <SettingRow label="Show Tooltips" desc="Display contextual tooltips on hover." checked={settings.showTooltips} onChange={() => toggleSetting("showTooltips")} />
    </div>
  );
}
