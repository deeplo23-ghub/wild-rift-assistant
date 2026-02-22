# Phase 2 — Plan 3: Database Seeding + Pipeline Integration

> **Wave**: 3 of 3
> **Dependencies**: Plan 2.1 (scraper) + Plan 2.2 (normalization)
> **Scope**: Seed script, full pipeline integration, dry-run validation, error reporting

---

## Context

You have:
1. `raw-data.json`
2. `src/lib/data/normalize.ts` (returns `NormalizedData`)
3. `prisma/schema.prisma`

This plan creates the database seeding script following idempotency constraints.

---

## Tasks

### Task 1: Create Seed Script

<task id="2.3.1">
<action>
Create `scripts/seed.ts` combining validation, normalizing, and inserting:

**Seeding constraints**:
- `prisma.champion.upsert`: Iterate over champions and upsert by slug ID. Never `deleteMany` champions to avoid losing foreign relations (if any are added later).
- **Counter Matrix**: `prisma.$transaction([ prisma.counterMatchup.deleteMany(), ...prisma.counterMatchup.createMany(...) ])` OR `deleteMany` explicitly before `createMany` (safer for N×N matrix).
- `prisma.dataMeta.upsert`: Store `lastScrapedAt`, `championCount`, `version` keyed by `id: "singleton"`.
- Support `--dry-run` to validate JSON and Normalization logic without doing Prisma mutations.
- Output summary counts including validation anomalies (e.g. champion count < 50 warning).
</action>
</task>

### Task 2: Create NPM Scripts

<task id="2.3.2">
<action>
Add pipeline convenience scripts:

```json
{
  "scrape": "tsx scripts/scrape.ts",
  "scrape:dry": "tsx scripts/scrape.ts --dry-run",
  "seed": "tsx scripts/seed.ts",
  "seed:dry": "tsx scripts/seed.ts --dry-run",
  "pipeline": "npm run scrape && npm run seed"
}
```
</action>
</task>

### Task 3: Verify the full workflow

<task id="2.3.3">
<action>
Execute:
1. `npm run scrape -- --limit 5`
2. `npm run seed:dry`
3. Inspect `raw-data.json` and `normalized-data.json`.
4. Ensure cross-layer decoupling remains intact.
</action>
</task>

---

## Success Criteria

1. ✅ Upserts used by slug ID, preventing destructive recreations of Champion records.
2. ✅ Counter matchups completely replaced relationally.
3. ✅ DataMeta tracks scrape completion time.
4. ✅ Pipeline structure clearly defined: `scrape → JSON → normalize → Zod → Persist`. No direct script sharing.
