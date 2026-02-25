/**
 * tRPC router definition.
 *
 * Defines all API procedures for the Wild Rift Draft Assistant.
 * Currently stub implementations — real queries will be added in Phase 2.
 */

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";
import { Role, Tier, ChampionTag } from "@/types/champion";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  champion: router({
    /** Get all champions with full data */
    getAll: publicProcedure.query(async ({ ctx }) => {
      const rawChampions = await ctx.prisma.champion.findMany({
        orderBy: { name: "asc" },
      });

      return rawChampions.map(c => ({
        id: c.id,
        name: c.name,
        roles: c.roles as Role[],
        winrate: Number(c.winrate),
        pickRate: Number(c.pickRate),
        banRate: Number(c.banRate),
        tier: c.tier as Tier,
        damageProfile: {
          ad: Number(c.damageProfileAd),
          ap: Number(c.damageProfileAp),
          true: Number(c.damageProfileTrue),
        },
        durabilityScore: c.durabilityScore,
        engageScore: c.engageScore,
        peelScore: c.peelScore,
        ccScore: c.ccScore,
        scalingScore: c.scalingScore,
        earlyGameScore: c.earlyGameScore,
        mobilityScore: c.mobilityScore,
        healingScore: c.healingScore,
        shieldScore: c.shieldScore,
        waveclearScore: c.waveclearScore,
        tags: c.tags as ChampionTag[],
        iconUrl: c.iconUrl || "",
      }));
    }),

    /** Get a single champion by ID */
    getById: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "string") throw new Error("Expected string ID");
        return val;
      })
      .query(async ({ ctx, input }) => {
        const c = await ctx.prisma.champion.findUnique({
          where: { id: input },
        });
        if (!c) return null;

        return {
          id: c.id,
          name: c.name,
          roles: c.roles as Role[],
          winrate: Number(c.winrate),
          pickRate: Number(c.pickRate),
          banRate: Number(c.banRate),
          tier: c.tier as Tier,
          damageProfile: {
            ad: Number(c.damageProfileAd),
            ap: Number(c.damageProfileAp),
            true: Number(c.damageProfileTrue),
          },
          durabilityScore: c.durabilityScore,
          engageScore: c.engageScore,
          peelScore: c.peelScore,
          ccScore: c.ccScore,
          scalingScore: c.scalingScore,
          earlyGameScore: c.earlyGameScore,
          mobilityScore: c.mobilityScore,
          healingScore: c.healingScore,
          shieldScore: c.shieldScore,
          waveclearScore: c.waveclearScore,
          tags: c.tags as ChampionTag[],
          iconUrl: c.iconUrl || "",
        };
      }),
  }),

  counter: router({
    /** Get full counter matrix as flat array */
    getMatrix: publicProcedure.query(async ({ ctx }) => {
      const matchups = await ctx.prisma.counterMatchup.findMany();
      return matchups.map((m: any) => ({
        championId: m.championId,
        opponentId: m.opponentId,
        value: m.value
      }));
    }),
  }),

  meta: router({
    /** Get last scrape metadata */
    getLastScraped: publicProcedure.query(async ({ ctx }) => {
      return ctx.prisma.dataMeta.findUnique({
        where: { id: "singleton" },
      });
    }),
  }),
});

export type AppRouter = typeof appRouter;
