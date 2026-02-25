/**
 * tRPC router definition.
 *
 * Defines all API procedures for the Wild Rift Draft Assistant.
 * Currently stub implementations — real queries will be added in Phase 2.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";
import { Champion, CounterMatrix, Role, Tier } from "@/types/champion";
import { getJunglerIcon } from "../utils";
import { exec, ChildProcess } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Global map to track active background processes for cancellation
// Note: This works in a single-process environment (like dev mode).
// In production with multiple worker processes, this would need Redis/DB-based tracking or a coordinator.
const activeProcesses = new Map<string, ChildProcess>();

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Mappers to convert Prisma models to Domain types
 */
const mapPrismaChampion = (pc: any): Champion => ({
  id: pc.id,
  name: pc.name,
  roles: pc.roles.split(",") as Role[],
  winrate: pc.winrate,
  pickRate: pc.pickRate,
  banRate: pc.banRate,
  tier: pc.tier as Tier,
  damageProfile: {
    ad: pc.damageProfileAd,
    ap: pc.damageProfileAp,
    true: pc.damageProfileTrue,
  },
  durabilityScore: pc.durabilityScore,
  engageScore: pc.engageScore,
  peelScore: pc.peelScore,
  ccScore: pc.ccScore,
  scalingScore: pc.scalingScore,
  earlyGameScore: pc.earlyGameScore,
  mobilityScore: pc.mobilityScore,
  healingScore: pc.healingScore,
  shieldScore: pc.shieldScore,
  waveclearScore: pc.waveclearScore,
  burstScore: pc.burstScore,
  rangeScore: pc.rangeScore,
  sustainScore: pc.sustainScore,
  teamfightScore: pc.teamfightScore,
  objectiveScore: pc.objectiveScore,
  tags: pc.tags.split(","),
  iconUrl: getJunglerIcon(pc.name),
});

export const appRouter = router({
  /** Start a background database sync */
  syncDatabase: publicProcedure.mutation(async ({ ctx }) => {
    try {
      // 1. Create a job record using Raw SQL since Prisma Client is out of sync
      const jobId = `sync_${Date.now()}`;
      await ctx.prisma.$executeRawUnsafe(`
        INSERT INTO SyncJob (id, status, progress, message, startedAt)
        VALUES ('${jobId}', 'RUNNING', 0, 'Starting synchronization pipeline...', datetime('now'))
      `);

      // 2. Start the process in the background
      const command = `npx tsx scripts/scrape.ts --job-id ${jobId} && npx tsx scripts/seed.ts --job-id ${jobId}`;
      
      exec(command, (error) => {
        if (error) {
          console.error(`Job ${jobId} failed:`, error);
        }
      });

      return {
        success: true,
        jobId: jobId,
      };
    } catch (error: any) {
      const fs = require('fs');
      fs.appendFileSync('sync-error.log', `[${new Date().toISOString()}] SYNC ERROR: ${error.message}\n${error.stack}\n`);
      throw error;
    }
  }),

  /** Get the status of a specific sync job */
  getSyncStatus: publicProcedure
    .input(String)
    .query(async ({ ctx, input }) => {
      const results: any[] = await ctx.prisma.$queryRawUnsafe(`
        SELECT * FROM SyncJob WHERE id = '${input}' LIMIT 1
      `);
      return results[0] || null;
    }),

  getChampions: publicProcedure.query(async ({ ctx }) => {
    const champions: any[] = await ctx.prisma.$queryRawUnsafe(
      "SELECT * FROM Champion ORDER BY name ASC",
    );
    return champions.map(mapPrismaChampion);
  }),

  getCounterMatrix: publicProcedure.query(async ({ ctx }) => {
    const matchups = await ctx.prisma.counterMatchup.findMany();

    // Build nested Map structure for CounterMatrix
    const matrix = new Map<string, Map<string, number>>();

    matchups.forEach(
      (m: { championId: string; opponentId: string; value: number }) => {
        if (!matrix.has(m.championId)) {
          matrix.set(m.championId, new Map());
        }
        matrix.get(m.championId)!.set(m.opponentId, m.value);
      },
    );

    return matrix as CounterMatrix;
  }),

  // Legacy/Scoped routers (keeping for compatibility)
  champion: router({
    getAll: publicProcedure.query(async ({ ctx }) => {
      const champions = await ctx.prisma.champion.findMany({
        orderBy: { name: "asc" },
      });
      return champions.map(mapPrismaChampion);
    }),
  }),

  counter: router({
    getMatrix: publicProcedure.query(async ({ ctx }) => {
      const matchups = await ctx.prisma.counterMatchup.findMany();
      return matchups;
    }),
  }),
});

export type AppRouter = typeof appRouter;
