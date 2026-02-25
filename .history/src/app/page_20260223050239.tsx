import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3">
          <Swords className="h-10 w-10 text-blue-400" />
          <h1 className="text-4xl font-bold tracking-tight">
            Wild Rift Draft Assistant
          </h1>
        </div>

        <p className="max-w-md text-zinc-400">
          Deterministic multi-factor scoring engine for competitive draft analysis.
          Phase 1 foundation complete.
        </p>

        <div className="flex gap-3">
          <Button variant="default" size="lg" disabled>
            Start Draft
          </Button>
          <Button variant="outline" size="lg" disabled>
            View Champions
          </Button>
        </div>

        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-left text-sm text-zinc-500">
          <p className="mb-2 font-semibold text-zinc-300">Architecture Ready</p>
          <ul className="space-y-1">
            <li>✅ TypeScript types (Champion, Draft, Scoring)</li>
            <li>✅ Tag system (16 tags, 22 synergy rules)</li>
            <li>✅ Zustand stores (draft + UI state)</li>
            <li>✅ Prisma schema (Champion, CounterMatchup)</li>
            <li>✅ tRPC scaffold (4 procedures)</li>
            <li>✅ Scoring engine (7 component stubs)</li>
            <li>⬜ Data pipeline (Phase 2)</li>
            <li>⬜ Scoring logic (Phase 3)</li>
            <li>⬜ Draft UI (Phase 4)</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
