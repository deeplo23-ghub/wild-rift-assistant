---
phase: 6
plan: 2
wave: 2
depends_on: ["6.1"]
files_modified: ["src/components/draft/ChampionPool.tsx", "src/components/draft/ChampionCard.tsx"]
autonomous: true
must_haves:
  truths:
    - "Hovering champions in the pool does not re-render the entire pool"
    - "Tooltips are rendered efficiently without blocking the main thread"
  artifacts:
    - "ChampionPool.tsx uses granular selectors"
---

# Plan 6.2: Store & UI Optimization

<objective>
Optimize React rendering and store subscriptions to prevent expensive full-pool re-renders on hover and state updates.
</objective>

<context>
Load for context:
- src/components/draft/ChampionPool.tsx
- src/store/draftStore.ts
</context>

<tasks>

<task type="auto">
  <name>Implement Granular Selectors in ChampionPool</name>
  <files>src/components/draft/ChampionPool.tsx</files>
  <action>
    Replace the monolithic `useDraftStore()` call with individual `useDraftStore(state => state.field)` calls or use a stable selector.
    Ensure that `hoveredChampionId` changes DO NOT trigger a re-render of the `ChampionPool` container unless necessary for highlighting.
    If highlighting is needed, use a separate component for the Highlight overlay that subscribes to the hover state.
  </action>
  <verify>React Profiler shows only targeted components re-rendering on hover.</verify>
  <done>Hover state changes are isolated.</done>
</task>

<task type="auto">
  <name>Memoize Champion Components</name>
  <files>src/components/draft/ChampionPool.tsx</files>
  <action>
    Extract the main grid item into a memoized `ChampionPoolItem` component.
    Use `React.memo` with a custom comparison if needed.
    Optimize the `Tooltip` usage to prevent instant heavy rendering.
  </action>
  <verify>Grid re-renders are minimal after initial load.</verify>
  <done>Individual champion icons are memoized.</done>
</task>

</tasks>

<success_criteria>
- [ ] Profiler confirms minimal re-renders on hover.
- [ ] Hover lag is eliminated.
- [ ] Selectors are optimized.
</success_criteria>
