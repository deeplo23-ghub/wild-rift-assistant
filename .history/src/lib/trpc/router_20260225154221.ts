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
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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
    // 1. Create a job record
    const job = await (ctx.prisma as any).syncJob.create({
      data: {
        status: "RUNNING",
        progress: 0,
        message: "Starting synchronization pipeline...",
      },
    });

    // 2. Start the process in the background (fire and forget)
    // We pass the job ID so the script can update its own progress
    const command = `npm run pipeline:full -- --job-id ${job.id}`;
    
    // We use standard exec without await to keep it in background
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Job ${job.id} failed:`, error);
        // We don't need to update the DB here if the scripts handle their own errors,
        // but this catches early launch failures.
      }
    });

    return {
      success: true,
      jobId: job.id,
    };
  }),

  /** Get the status of a specific sync job or the latest one */
  getSyncStatus: publicProcedure
    .input(String)
    .query(async ({ ctx, input }) => {
      const job = await (ctx.prisma as any).syncJob.findUnique({
        where: { id: input },
      });
      return job;
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
