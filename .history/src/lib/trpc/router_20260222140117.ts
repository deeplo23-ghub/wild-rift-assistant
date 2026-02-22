/**
 * tRPC router definition.
 *
 * Defines all API procedures for the Wild Rift Draft Assistant.
 * Currently stub implementations — real queries will be added in Phase 2.
 */

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  champion: router({
    /** Get all champions with full data */
    getAll: publicProcedure.query(async ({ ctx }) => {
      return ctx.prisma.champion.findMany({
        orderBy: { name: "asc" },
      });
    }),

    /** Get a single champion by ID */
    getById: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "string") throw new Error("Expected string ID");
        return val;
      })
      .query(async ({ ctx, input }) => {
        return ctx.prisma.champion.findUnique({
          where: { id: input },
        });
      }),
  }),

  counter: router({
    /** Get full counter matrix as flat array */
    getMatrix: publicProcedure.query(async ({ ctx }) => {
      return ctx.prisma.counterMatchup.findMany();
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
