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
  const [isAnimating, setIsAnimating] = useState(true);
  const [progress, setProgress] = useState(0);

  // Mock loading delay before showing analysis panel
  useEffect(() => {
    if (isDraftComplete) {
      setAnalysisReady(false);
      const timer = setTimeout(() => setAnalysisReady(true), 2500);
      return () => clearTimeout(timer);
    } else {
      setAnalysisReady(false);
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
                    <Logo className="w-20 h-20" loop />
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                        Analyzing Compositions
                      </p>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1 h-1 rounded-full bg-zinc-500"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
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
