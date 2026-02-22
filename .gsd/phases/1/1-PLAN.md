---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Next.js Project Bootstrap

## Objective
Initialize the Next.js project with TypeScript strict mode, Tailwind CSS, and core dependencies. This is the foundation that everything else builds on. No custom code — just framework scaffolding and configuration.

## Context
- .gsd/SPEC.md — Technology constraints
- .gsd/STACK.md — Approved dependency list
- .gsd/ARCHITECTURE.md — Directory structure (§2)

## Tasks

<task type="auto">
  <name>Initialize Next.js project with TypeScript and Tailwind</name>
  <files>
    - package.json (created by npx)
    - tsconfig.json (created by npx)
    - next.config.ts (created by npx)
    - app/layout.tsx (created by npx)
    - app/page.tsx (created by npx)
    - postcss.config.mjs (created by npx)
    - app/globals.css (created by npx)
  </files>
  <action>
    1. Run `npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-npm` in the project root.
       - Use `--src-dir` to keep app code under `src/`.
       - Use `--import-alias "@/*"` for clean imports.
       - Answer "No" to any prompt about experimental features.
    2. Verify the project structure was created correctly.
    3. Enable strict TypeScript by confirming `tsconfig.json` has `"strict": true`.
    4. Do NOT modify any generated files beyond strict TS confirmation.
    5. Do NOT install additional packages yet — that's the next task.
  </action>
  <verify>
    Run `npx next build` — must compile with zero errors.
    Run `npm run dev` briefly and verify it starts on localhost:3000.
  </verify>
  <done>
    - Next.js app created with App Router
    - TypeScript strict mode enabled
    - Tailwind CSS configured
    - ESLint configured
    - Path alias @/* working
    - Dev server starts without errors
  </done>
</task>

<task type="auto">
  <name>Install core V1 dependencies</name>
  <files>
    - package.json (modified)
  </files>
  <action>
    1. Install production dependencies:
       ```
       npm install zustand @tanstack/react-query @trpc/client @trpc/server @trpc/react-query superjson react-hook-form zod @hookform/resolvers prisma @prisma/client class-variance-authority tailwind-merge clsx lucide-react tailwindcss-animate recharts gsap
       ```
    2. Install dev dependencies:
       ```
       npm install -D vitest @testing-library/react prettier
       ```
    3. Do NOT install shadcn/ui yet — it has its own init command (next plan).
    4. Do NOT install scraping packages (puppeteer, cheerio, bottleneck, p-limit) — that's Phase 2.
    5. Verify no peer dependency conflicts in the install output.
  </action>
  <verify>
    Run `npm ls --depth=0` — all packages listed, no ERR or WARN for missing peers.
    Run `npx next build` — still compiles cleanly after install.
  </verify>
  <done>
    - All V1 production dependencies installed
    - All V1 dev dependencies installed
    - No peer dependency conflicts
    - Build still succeeds
  </done>
</task>

## Success Criteria
- [ ] Next.js app boots on localhost:3000
- [ ] TypeScript strict mode enabled
- [ ] Tailwind CSS functional
- [ ] All V1 dependencies installed without conflicts
- [ ] `npx next build` succeeds
