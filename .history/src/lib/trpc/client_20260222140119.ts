/**
 * tRPC client configuration for client-side usage.
 *
 * Provides React hooks for type-safe API calls via TanStack Query.
 */

import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "./router";

/** tRPC React hooks — use these in components for data fetching */
export const trpc = createTRPCReact<AppRouter>();
