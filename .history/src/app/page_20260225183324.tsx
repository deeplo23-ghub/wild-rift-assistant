"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDraftStore } from "@/store/draftStore";
import { TeamPanel } from "@/components/draft/TeamPanel";
import { ChampionPool } from "@/components/draft/ChampionPool";
import { MatchupAnalysis } from "@/components/draft/MatchupAnalysis";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
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
  const [isAnimating, setIsAnimating] = useState(true);
  const [progress, setProgress] = useState(0);

  // Mock loading delay before showing analysis panel
  useEffect(() => {
    if (isDraftComplete) {
      setAnalysisReady(false);
      setAnalysisProgress(0);
      const totalDuration = 4000;
      const startTime = Date.now();

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        let targetProgress = (elapsed / totalDuration) * 100;

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
      setAnalysisReady(false);
      setAnalysisProgress(0);
    }
  }, [isDraftComplete]);

  useEffect(() => {
    if (settings.disableIntro) {
      setIsAnimating(false);
      setProgress(100);
      return;
    }

    const totalDuration = 5100; // 0.5s delay + 3.6s logo anim + 1s final stretch
    const startTime = Date.now();

    const timer = setTimeout(() => setIsAnimating(false), totalDuration);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let targetProgress = (elapsed / totalDuration) * 100;

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
              className="w-80 h-auto flex flex-col items-center gap-6"
            >
              <Logo className="w-full h-auto" delay={0.5} color="original" />
              <LogoText className="w-64 h-auto" delay={1.5} />
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
              Could not establish connection to the data layer. Ensure the local
              SQLite database is populated and the tRPC server is active.
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
            "h-screen text-zinc-300 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col",
            settings.disableTransparency
              ? "bg-zinc-950 no-transparency"
              : "bg-transparent",
            settings.disableAnimations && "no-animations",
            !settings.showTooltips && "no-tooltips",
          )}
          onClick={() => {
            const state = useDraftStore.getState();
            state.setFocusedSlot(state.focusedSide, null);
          }}
        >
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
              <div className="flex items-center gap-3">
                <Logo className="w-12 h-8" loop />
                <LogoText className="w-40 h-5" loop />
              </div>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-3">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBanMode();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-1.5 rounded-full overflow-hidden transition-all duration-300 border focus:outline-none",
                    isBanMode
                      ? "border-red-500/40 bg-red-900/20 text-red-500 shadow-[0_0_15px_rgba(255,0,0,0.15)] hover:bg-red-900/30 hover:border-red-500/60"
                      : "border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 hover:border-white/10"
                  )}
                >
                  {isBanMode && (
                    <motion.div
                      layoutId="banModeGlow"
                      className="absolute inset-0 bg-red-500/10 blur-md pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                  <div className="relative flex items-center gap-2.5 z-10 w-full">
                    <motion.div
                      animate={{ rotate: isBanMode ? 90 : 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <Ban className={cn("w-3.5 h-3.5", isBanMode ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-zinc-500")} />
                    </motion.div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] mt-[1px]">
                      Ban Mode
                    </span>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-500 ml-1",
                      isBanMode ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]" : "bg-zinc-600"
                    )} />
                  </div>
                </motion.button>
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
                <DialogContent
                  className={cn(
                    "border-white/10 text-zinc-100 max-w-lg max-h-[85vh] overflow-hidden flex flex-col",
                    settings.disableTransparency
                      ? "bg-zinc-900"
                      : "bg-zinc-950/95 backdrop-blur-xl",
                  )}
                >
                  <DialogHeader>
                    <DialogTitle className="text-lg font-black tracking-tight">Assistant Settings</DialogTitle>
                    <DialogDescription className="text-zinc-500 text-xs">
                      Fine-tune every aspect of the draft assistant to your liking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-6 py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                    
                    {/* ─── Draft Behavior ─── */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-400">Draft Behavior</h3>
                      </div>
                      <SettingRow label="Auto-Focus Next Slot" desc="Automatically move focus to the next empty slot after picking." checked={settings.autoFocus} onChange={() => toggleSetting("autoFocus")} />
                      <SettingRow label="Auto-Focus Ban Slot" desc="Automatically focus the next ban slot after banning." checked={settings.autoBanFocus} onChange={() => toggleSetting("autoBanFocus")} />
                      <SettingRow label="Confirm Picks" desc="Require double-click to confirm champion selection." checked={settings.confirmPicks} onChange={() => toggleSetting("confirmPicks")} />
                    </div>

                    {/* ─── Scoring & Display ─── */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Scoring & Display</h3>
                      </div>
                      <SettingRow label="Score Breakdown" desc="Show detailed scoring components on recommended champions." checked={settings.showBreakdown} onChange={() => toggleSetting("showBreakdown")} />
                      <SettingRow label="Win Rates" desc="Display champion win rate percentages." checked={settings.showWinRates} onChange={() => toggleSetting("showWinRates")} />
                      <SettingRow label="Pick Rates" desc="Display champion pick rate percentages." checked={settings.showPickRates} onChange={() => toggleSetting("showPickRates")} />
                      <SettingRow label="Ban Rates" desc="Display champion ban rate percentages." checked={settings.showBanRates} onChange={() => toggleSetting("showBanRates")} />
                      <SettingRow label="Tier Badges" desc="Show tier rank badges (S+, S, A, B...) on champion icons." checked={settings.showTierBadges} onChange={() => toggleSetting("showTierBadges")} />
                      <SettingRow label="Damage Type Badge" desc="Show AD/AP/Hybrid/True damage type indicators." checked={settings.showDamageType} onChange={() => toggleSetting("showDamageType")} />
                      <SettingRow label="Champion Tags" desc="Display gameplay tags (Assassin, Tank, Engage, etc.)." checked={settings.showTags} onChange={() => toggleSetting("showTags")} />
                    </div>

                    {/* ─── Champion Pool ─── */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                        <Database className="w-3.5 h-3.5 text-purple-400" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-purple-400">Champion Pool</h3>
                      </div>
                      <SettingRow label="Top 3 Recommendations" desc="Show the top 3 recommended picks above the champion grid." checked={settings.showTopRecommendations} onChange={() => toggleSetting("showTopRecommendations")} />
                      <SettingRow label="Synergy Icons" desc="Display teammate synergy indicators on picks." checked={settings.showSynergyIcons} onChange={() => toggleSetting("showSynergyIcons")} />
                      <SettingRow label="Counter Icons" desc="Display counter matchup indicators on picks." checked={settings.showCounterIcons} onChange={() => toggleSetting("showCounterIcons")} />
                      <SettingRow label="Weakness Icons" desc="Display vulnerability indicators on picks." checked={settings.showWeaknessIcons} onChange={() => toggleSetting("showWeaknessIcons")} />
                      <SettingRow label="Dense Grid" desc="Use a tighter grid layout to show more champions at once." checked={settings.gridDensity} onChange={() => toggleSetting("gridDensity")} />
                    </div>

                    {/* ─── Analysis Panel ─── */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                        <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-orange-400">Analysis Panel</h3>
                      </div>
                      <SettingRow label="Win Probability Bar" desc="Show estimated win probability comparison at the top." checked={settings.showWinProbability} onChange={() => toggleSetting("showWinProbability")} />
                      <SettingRow label="Damage Distribution" desc="Show team damage type breakdown bar in the header." checked={settings.showDamageDistribution} onChange={() => toggleSetting("showDamageDistribution")} />
                      <SettingRow label="Matchup Comparison Bars" desc="Show side-by-side metric comparison bars." checked={settings.showMatchupBars} onChange={() => toggleSetting("showMatchupBars")} />
                    </div>

                    {/* ─── Performance & Accessibility ─── */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                        <Settings2 className="w-3.5 h-3.5 text-red-400" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-red-400">Performance & Accessibility</h3>
                      </div>
                      <SettingRow label="Disable Intro Animation" desc="Skip the splash screen animation on load." checked={settings.disableIntro} onChange={() => toggleSetting("disableIntro")} />
                      <SettingRow label="Disable Animations" desc="Turn off all transitions and micro-animations." checked={settings.disableAnimations} onChange={() => toggleSetting("disableAnimations")} />
                      <SettingRow label="Disable Transparency" desc="Use solid backgrounds instead of glassmorphism effects." checked={settings.disableTransparency} onChange={() => toggleSetting("disableTransparency")} />
                      <SettingRow label="Compact Mode" desc="Reduce padding and spacing throughout the interface." checked={settings.compactMode} onChange={() => toggleSetting("compactMode")} />
                      <SettingRow label="Show Tooltips" desc="Display contextual tooltips on hover." checked={settings.showTooltips} onChange={() => toggleSetting("showTooltips")} />
                    </div>

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
                disabled={isSyncing}
                className="h-8 text-[11px] border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white px-4 gap-2 font-bold"
              >
                {isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Database className="w-3 h-3" />
                )}
                {isSyncing ? "Syncing..." : "Sync DB"}
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
                      <Logo className="w-48 h-auto" delay={0.2} color="original" />
                      <div className="mt-1">
                        <style dangerouslySetInnerHTML={{ __html: `
                          .loading-text-svg .lt-path {
                            fill: transparent;
                            stroke: #C89B3C;
                            stroke-width: 0.8;
                            stroke-dashoffset: 500;
                            stroke-dasharray: 500;
                            animation: lt-draw 2.5s cubic-bezier(0.47, 0, 0.745, 0.715) 0.8s forwards;
                          }
                          @keyframes lt-draw {
                            to {
                              stroke-dashoffset: 0;
                              fill: rgb(200, 155, 60);
                            }
                          }
                        `}} />
                        <svg className="loading-text-svg w-[180px] h-[20px] opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 13.85 443.35 45.35">
                          <g>
                            <path className="lt-path" d="M0 49.20L0 14.20L6.05 14.20L6.05 43.75L22.45 43.75L22.45 49.20L0 49.20Z" />
                            <path className="lt-path" style={{animationDelay:'0.85s'}} d="M39 49.90Q35.30 49.90 32.38 48.38Q29.45 46.85 27.78 44.03Q26.10 41.20 26.10 37.25L26.10 36.45Q26.10 32.50 27.78 29.65Q29.45 26.80 32.38 25.30Q35.30 23.80 39 23.80Q42.70 23.80 45.60 25.30Q48.50 26.80 50.18 29.65Q51.85 32.50 51.85 36.45L51.85 37.25Q51.85 41.20 50.18 44.03Q48.50 46.85 45.60 48.38Q42.70 49.90 39 49.90M39 44.80Q42.15 44.80 44.15 42.78Q46.15 40.75 46.15 37.10L46.15 36.60Q46.15 32.95 44.15 30.93Q42.15 28.90 39 28.90Q35.85 28.90 33.85 30.93Q31.85 32.95 31.85 36.60L31.85 37.10Q31.85 40.75 33.85 42.78Q35.85 44.80 39 44.80Z" />
                            <path className="lt-path" style={{animationDelay:'0.9s'}} d="M65.60 49.90Q63.00 49.90 60.90 48.98Q58.80 48.05 57.58 46.30Q56.35 44.55 56.35 42Q56.35 39.50 57.58 37.80Q58.80 36.10 60.95 35.23Q63.10 34.35 65.85 34.35L73 34.35L73 32.85Q73 30.90 71.80 29.68Q70.60 28.45 68.05 28.45Q65.55 28.45 64.28 29.63Q63.00 30.80 62.60 32.65L57.30 30.90Q57.90 28.95 59.23 27.35Q60.55 25.75 62.75 24.78Q64.95 23.80 68.15 23.80Q73 23.80 75.78 26.23Q78.55 28.65 78.55 33.25L78.55 42.95Q78.55 44.45 79.95 44.45L82.05 44.45L82.05 49.20L78 49.20Q76.20 49.20 75.05 48.30Q73.90 47.40 73.90 45.85L73.90 45.75L73.05 45.75Q72.75 46.45 72 47.45Q71.25 48.45 69.73 49.18Q68.20 49.90 65.60 49.90M66.55 45.20Q69.40 45.20 71.20 43.58Q73 41.95 73 39.20L73 38.70L66.20 38.70Q64.35 38.70 63.20 39.50Q62.05 40.30 62.05 41.85Q62.05 43.35 63.25 44.28Q64.45 45.20 66.55 45.20Z" />
                            <path className="lt-path" style={{animationDelay:'0.95s'}} d="M96.35 49.90Q93.35 49.90 90.75 48.43Q88.15 46.95 86.60 44.10Q85.05 41.25 85.05 37.25L85.05 36.45Q85.05 32.45 86.60 29.60Q88.15 26.75 90.73 25.28Q93.30 23.80 96.35 23.80Q98.65 23.80 100.25 24.35Q101.85 24.90 102.83 25.75Q103.80 26.60 104.35 27.60L105.20 27.60L105.20 14.20L110.90 14.20L110.90 49.20L105.30 49.20L105.30 45.95L104.45 45.95Q103.55 47.45 101.70 48.68Q99.85 49.90 96.35 49.90M98.05 44.90Q101.15 44.90 103.20 42.88Q105.25 40.85 105.25 37.10L105.25 36.60Q105.25 32.80 103.23 30.80Q101.20 28.80 98.05 28.80Q94.95 28.80 92.88 30.80Q90.80 32.80 90.80 36.60L90.80 37.10Q90.80 40.85 92.88 42.88Q94.95 44.90 98.05 44.90Z" />
                            <path className="lt-path" style={{animationDelay:'1s'}} d="M118.20 49.20L118.20 24.50L123.95 24.50L123.95 49.20L118.20 49.20M121.05 21.35Q119.50 21.35 118.38 20.33Q117.25 19.30 117.25 17.60Q117.25 15.90 118.38 14.88Q119.50 13.85 121.05 13.85Q122.70 13.85 123.78 14.88Q124.85 15.90 124.85 17.60Q124.85 19.30 123.78 20.33Q122.70 21.35 121.05 21.35Z" />
                            <path className="lt-path" style={{animationDelay:'1.05s'}} d="M131.25 49.20L131.25 24.50L136.90 24.50L136.90 27.95L137.75 27.95Q138.40 26.55 140.10 25.30Q141.80 24.05 145.25 24.05Q148.10 24.05 150.30 25.35Q152.50 26.65 153.73 28.95Q154.95 31.25 154.95 34.40L154.95 49.20L149.20 49.20L149.20 34.85Q149.20 31.85 147.73 30.38Q146.25 28.90 143.55 28.90Q140.50 28.90 138.75 30.93Q137 32.95 137 36.70L137 49.20L131.25 49.20Z" />
                            <path className="lt-path" style={{animationDelay:'1.1s'}} d="M160.80 36.95L160.80 36.20Q160.80 32.30 162.35 29.53Q163.90 26.75 166.50 25.28Q169.10 23.80 172.20 23.80Q175.70 23.80 177.53 25.05Q179.35 26.30 180.20 27.75L181.05 27.75L181.05 24.50L186.65 24.50L186.65 53.90Q186.65 56.35 185.25 57.78Q183.85 59.20 181.45 59.20L164.85 59.20L164.85 54.20L179.50 54.20Q180.95 54.20 180.95 52.70L180.95 45.55L180.10 45.55Q179.55 46.40 178.60 47.28Q177.65 48.15 176.10 48.75Q174.55 49.35 172.20 49.35Q169.10 49.35 166.50 47.88Q163.90 46.40 162.35 43.63Q160.80 40.85 160.80 36.95M173.80 44.30Q176.90 44.30 178.95 42.33Q181.00 40.35 181.00 36.80L181.00 36.30Q181.00 32.70 178.98 30.75Q176.95 28.80 173.80 28.80Q170.70 28.80 168.63 30.75Q166.55 32.70 166.55 36.30L166.55 36.80Q166.55 40.35 168.63 42.33Q170.70 44.30 173.80 44.30Z" />
                            <path className="lt-path" style={{animationDelay:'1.2s'}} d="M203.45 49.20L213.05 14.20L223.50 14.20L233.10 49.20L226.90 49.20L224.80 41.20L211.75 41.20L209.65 49.20L203.45 49.20M213.15 35.70L223.40 35.70L218.70 17.95L217.85 17.95L213.15 35.70Z" />
                            <path className="lt-path" style={{animationDelay:'1.25s'}} d="M237.75 49.20L237.75 24.50L243.40 24.50L243.40 27.95L244.25 27.95Q244.90 26.55 246.60 25.30Q248.30 24.05 251.75 24.05Q254.60 24.05 256.80 25.35Q259 26.65 260.23 28.95Q261.45 31.25 261.45 34.40L261.45 49.20L255.70 49.20L255.70 34.85Q255.70 31.85 254.23 30.38Q252.75 28.90 250.05 28.90Q247.00 28.90 245.25 30.93Q243.50 32.95 243.50 36.70L243.50 49.20L237.75 49.20Z" />
                            <path className="lt-path" style={{animationDelay:'1.3s'}} d="M276.15 49.90Q273.55 49.90 271.45 48.98Q269.35 48.05 268.13 46.30Q266.90 44.55 266.90 42Q266.90 39.50 268.13 37.80Q269.35 36.10 271.50 35.23Q273.65 34.35 276.40 34.35L283.55 34.35L283.55 32.85Q283.55 30.90 282.35 29.68Q281.15 28.45 278.60 28.45Q276.10 28.45 274.83 29.63Q273.55 30.80 273.15 32.65L267.85 30.90Q268.45 28.95 269.78 27.35Q271.10 25.75 273.30 24.78Q275.50 23.80 278.70 23.80Q283.55 23.80 286.33 26.23Q289.10 28.65 289.10 33.25L289.10 42.95Q289.10 44.45 290.50 44.45L292.60 44.45L292.60 49.20L288.55 49.20Q286.75 49.20 285.60 48.30Q284.45 47.40 284.45 45.85L284.45 45.75L283.60 45.75Q283.30 46.45 282.55 47.45Q281.80 48.45 280.28 49.18Q278.75 49.90 276.15 49.90M277.10 45.20Q279.95 45.20 281.75 43.58Q283.55 41.95 283.55 39.20L283.55 38.70L276.75 38.70Q274.90 38.70 273.75 39.50Q272.60 40.30 272.60 41.85Q272.60 43.35 273.80 44.28Q275 45.20 277.10 45.20Z" />
                            <path className="lt-path" style={{animationDelay:'1.35s'}} d="M297.35 49.20L297.35 14.20L303.10 14.20L303.10 49.20L297.35 49.20Z" />
                            <path className="lt-path" style={{animationDelay:'1.4s'}} d="M313.15 59.20L313.15 54.20L326.80 54.20Q328.20 54.20 328.20 52.70L328.20 45.80L327.35 45.80Q326.95 46.70 326.05 47.58Q325.15 48.45 323.65 49.03Q322.15 49.60 319.85 49.60Q317.00 49.60 314.80 48.33Q312.60 47.05 311.40 44.73Q310.20 42.40 310.20 39.30L310.20 24.50L315.90 24.50L315.90 38.85Q315.90 41.85 317.38 43.30Q318.85 44.75 321.55 44.75Q324.60 44.75 326.38 42.75Q328.15 40.75 328.15 37L328.15 24.50L333.85 24.50L333.85 53.90Q333.85 56.35 332.45 57.78Q331.05 59.20 328.65 59.20L313.15 59.20Z" />
                            <path className="lt-path" style={{animationDelay:'1.45s'}} d="M351.35 49.90Q346.55 49.90 343.45 47.80Q340.35 45.70 339.70 41.65L345.00 40.30Q345.35 42.20 346.25 43.30Q347.15 44.40 348.48 44.85Q349.80 45.30 351.35 45.30Q353.70 45.30 354.88 44.45Q356.05 43.60 356.05 42.30Q356.05 40.95 354.93 40.30Q353.80 39.65 351.50 39.20L349.95 38.95Q347.40 38.45 345.30 37.58Q343.20 36.70 341.93 35.18Q340.65 33.65 340.65 31.30Q340.65 27.70 343.33 25.75Q346.00 23.80 350.35 23.80Q354.50 23.80 357.20 25.65Q359.90 27.50 360.70 30.60L355.40 32.20Q355.00 30.10 353.65 29.23Q352.30 28.35 350.35 28.35Q348.35 28.35 347.28 29.05Q346.20 29.75 346.20 31.05Q346.20 32.35 347.30 33Q348.40 33.65 350.25 33.95L351.80 34.25Q354.55 34.75 356.78 35.55Q359.00 36.35 360.30 37.85Q361.60 39.35 361.60 41.90Q361.60 45.75 358.83 47.83Q356.05 49.90 351.35 49.90Z" />
                            <path className="lt-path" style={{animationDelay:'1.5s'}} d="M367.40 49.20L367.40 24.50L373.15 24.50L373.15 49.20L367.40 49.20M370.25 21.35Q368.70 21.35 367.58 20.33Q366.45 19.30 366.45 17.60Q366.45 15.90 367.58 14.88Q368.70 13.85 370.25 13.85Q371.90 13.85 372.98 14.88Q374.05 15.90 374.05 17.60Q374.05 19.30 372.98 20.33Q371.90 21.35 370.25 21.35Z" />
                            <path className="lt-path" style={{animationDelay:'1.55s'}} d="M390.65 49.90Q385.85 49.90 382.75 47.80Q379.65 45.70 379.00 41.65L384.30 40.30Q384.65 42.20 385.55 43.30Q386.45 44.40 387.78 44.85Q389.10 45.30 390.65 45.30Q393.00 45.30 394.18 44.45Q395.35 43.60 395.35 42.30Q395.35 40.95 394.23 40.30Q393.10 39.65 390.80 39.20L389.25 38.95Q386.70 38.45 384.60 37.58Q382.50 36.70 381.23 35.18Q379.95 33.65 379.95 31.30Q379.95 27.70 382.63 25.75Q385.30 23.80 389.65 23.80Q393.80 23.80 396.50 25.65Q399.20 27.50 400.00 30.60L394.70 32.20Q394.30 30.10 392.95 29.23Q391.60 28.35 389.65 28.35Q387.65 28.35 386.58 29.05Q385.50 29.75 385.50 31.05Q385.50 32.35 386.60 33Q387.70 33.65 389.55 33.95L391.10 34.25Q393.85 34.75 396.08 35.55Q398.30 36.35 399.60 37.85Q400.90 39.35 400.90 41.90Q400.90 45.75 398.13 47.83Q395.35 49.90 390.65 49.90Z" />
                            <path className="lt-path" style={{animationDelay:'1.6s'}} d="M410.25 49.90Q408.35 49.90 407.08 48.65Q405.80 47.40 405.80 45.45Q405.80 43.55 407.08 42.30Q408.35 41.05 410.25 41.05Q412.15 41.05 413.40 42.30Q414.65 43.55 414.65 45.50Q414.65 47.45 413.40 48.68Q412.15 49.90 410.25 49.90Z" />
                            <path className="lt-path" style={{animationDelay:'1.63s'}} d="M424.60 49.90Q422.70 49.90 421.43 48.65Q420.15 47.40 420.15 45.45Q420.15 43.55 421.43 42.30Q422.70 41.05 424.60 41.05Q426.50 41.05 427.75 42.30Q429.00 43.55 429.00 45.50Q429.00 47.45 427.75 48.68Q426.50 49.90 424.60 49.90Z" />
                            <path className="lt-path" style={{animationDelay:'1.66s'}} d="M438.95 49.90Q437.05 49.90 435.78 48.65Q434.50 47.40 434.50 45.45Q434.50 43.55 435.78 42.30Q437.05 41.05 438.95 41.05Q440.85 41.05 442.10 42.30Q443.35 43.55 443.35 45.50Q443.35 47.45 442.10 48.68Q440.85 49.90 438.95 49.90Z" />
                          </g>
                        </svg>
                      </div>
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
            </section>

            <aside className="min-h-0 flex flex-col h-full">
              <TeamPanel side={TeamSide.Enemy} />
            </aside>
          </div>

          <footer
            className={cn(
              "h-6 border-t border-white/5 px-6 flex items-center justify-between",
              settings.disableTransparency ? "bg-zinc-900" : "bg-black/20",
            )}
          >
            <div className="flex items-center gap-4 text-[8px] font-bold text-zinc-600 capitalize tracking-widest">
              <span>Next.js 16 + tRPC</span>
              <span>PostgreSQL / SQLite Connection</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-600 capitalize flex-row-reverse">
              <span>Developed for Competitive Analysis</span>
              <Info className="w-2.5 h-2.5" />
            </div>
          </footer>

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
