"use client";

import { trpc } from "@/lib/trpc/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface SyncProgressNotificationProps {
  jobId: string;
  onClose: () => void;
  onComplete: () => void;
}

export const SyncProgressNotification: React.FC<SyncProgressNotificationProps> = ({
  jobId,
  onClose,
  onComplete,
}) => {
  const { data: syncJob } = trpc.getSyncStatus.useQuery(jobId, {
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "FAILED") return false;
      return 1000;
    },
  });

  useEffect(() => {
    if (syncJob?.status === "COMPLETED") {
      onComplete();
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [syncJob?.status, onComplete, onClose]);

  const cancelMutation = trpc.cancelSync.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  if (!syncJob) return null;

  const isActive = syncJob.status === "RUNNING";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.95 }}
      animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
      exit={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
      className="fixed bottom-10 left-1/2 z-[100] w-[400px] bg-zinc-950/20 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-[0_40px_100px_rgba(0,0,0,0.7)] ring-1 ring-white/10 overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 bg-white/5 transition-colors duration-500",
          syncJob.status === "COMPLETED" ? "text-emerald-400" :
          syncJob.status === "FAILED" ? "text-red-400" :
          "text-blue-400"
        )}>
          {syncJob.status === "COMPLETED" ? <CheckCircle2 className="w-6 h-6" /> :
           syncJob.status === "FAILED" ? <AlertCircle className="w-6 h-6" /> :
           <Loader2 className="w-6 h-6 animate-spin" />}
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-zinc-100 font-bold truncate">
              {syncJob.status === "COMPLETED" ? "Sync Complete" :
               syncJob.status === "FAILED" ? (syncJob.message === "Cancelled by user" ? "Sync Cancelled" : "Sync Failed") :
               "Syncing Database"}
            </div>
            <div className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
              {syncJob.message || "Initializing core engine..."}
            </div>
          </div>
          
          <div className="flex items-center shrink-0 gap-3">
            <div className="flex items-baseline">
              <div className="relative h-10 overflow-hidden flex items-center">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={syncJob.progress}
                        initial={{ y: 25, opacity: 0, filter: "blur(4px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        exit={{ y: -25, opacity: 0, filter: "blur(4px)" }}
                        transition={{ 
                          type: "spring",
                          stiffness: 400,
                          damping: 35,
                          opacity: { duration: 0.1 }
                        }}
                        className="text-4xl font-black font-mono tracking-tighter text-white/90 tabular-nums"
                      >
                        {Math.round(syncJob.progress)}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="text-xs font-black text-white/20 ml-0.5 font-mono uppercase tracking-tighter">%</span>
            </div>

            {isActive ? (
              <button 
                onClick={() => cancelMutation.mutate(jobId)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all group"
                title="Cancel Sync"
              >
                <X className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="my-4 w-full h-[3px] bg-white/5 rounded-full overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${syncJob.progress}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "h-full relative z-10",
            syncJob.status === "COMPLETED" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
            syncJob.status === "FAILED" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" :
            "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
          )}
        />
        <motion.div
          animate={{ left: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 z-20"
        />
      </div>


    </motion.div>
  );
};
