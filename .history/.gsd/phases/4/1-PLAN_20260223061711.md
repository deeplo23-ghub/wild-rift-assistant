# Phase 4 Plan — Draft UI & Integration

> **Objective**: Build the full draft simulation UI with a three-column layout, connect to the scoring engine, and implement all interactive flows.

## 4.1 State Management & API Layer

- [x] **Zustand Store (`src/store/draftStore.ts`)**: Implement the draft state, including ally/enemy picks, blind bans, phase tracking, and candidate selection.
- [x] **tRPC Connectivity (`src/server/api/...` or similar route)**: Expose endpoints to fetch the precomputed champion pool and counter matrices into the client application on load.

## 4.2 Three-Column Layout Shell

- [x] **Main Page (`src/app/page.tsx`)**: Establish the core three-column responsive layout (Ally, Pool, Enemy).
- [x] **Ally Panel (`src/components/draft/AllyPanel.tsx`)**: 5 Role slots, composition summary, weakness detection.
- [x] **Enemy Panel (`src/components/draft/EnemyPanel.tsx`)**: 5 Role slots, threat analysis, risk warnings.

## 4.3 Champion Pool & Interactivity

- [x] **Champion Pool (`src/components/draft/ChampionPool.tsx`)**: Searchable grid, role filter, sort by (Score/Synergy/Counter/Winrate).
- [x] **Visuals (`src/components/draft/ChampionCard.tsx`)**: Display icons, roles, and visual tags.
- [x] **Draft Flow**: Handle selecting a champion from the pool and locking it into a specific role slot for either the ally or enemy team.

## 4.4 Engine Integration & Breakdown

- [x] **Real-time Recalculation**: Hook up the Phase 3 scoring engine (`scoreAllChampions`) to run client-side whenever the draft state changes.
- [x] **Score Breakdown (`src/components/draft/ScoreBreakdown.tsx`)**: Detailed breakdown panel explaining *why* a candidate scores high/low.

## 4.5 Polish & Animations

- [x] **Ban Phase Overlay (`src/components/draft/BanPhase.tsx`)**: Toggleable flow for recording blind bans.
- [x] **GSAP / Framer Motion**: Add micro-animations for interactions (e.g., locking a champion).
- [x] **Tailwind Polish**: Ensure high-end typography, glassmorphism aesthetics, and modern dark-mode palettes.
