# Phase 2 — Plan 2: Normalization + Validation + Counter Matrix

> **Wave**: 2 of 3
> **Dependencies**: Plan 2.1 complete (raw scraped data in `raw-data.json`)
> **Scope**: Normalize raw data into application types, build counter matrix, validate with Zod

---

## Context

You have raw scraped data in `raw-data.json`. This plan creates the strict normalization and validation layer.
Constraint Checklist: No coupling to scraper. Validate N×N matrix symmetry. Non-fatal champion count validation.

---

## Tasks

### Task 1: Create Validation Schemas

<task id="2.2.1">
<action>
Create `src/lib/data/validation.ts`:

- Define strict Zod schemas for both Raw and Normalized shapes.
- `RawChampionSchema` includes `roleConfidence: z.boolean().optional()`.
- `roles` on Normalized Champion can be derived and missing roles should not throw an error (default to empty array or infer).
- **CHAMPION COUNT**: Remove `.min(50)` on `RawDataSchema.champions`. Instead, export an application-level validate function that logs a warning if count < 50, but continues.
</action>
</task>

### Task 2: Create Normalization Layer

<task id="2.2.2">
<action>
Create `src/lib/data/normalize.ts`:

- Handle `ROLE_NORMALIZE` (e.g. duo -> dragon).
- **Damage Profile**: Derive heuristically from tags since raw doesn't have it.
- **Attributes**: Derive 0-10 base attributes heuristically.
- **Tags**: Assign tags.

**COUNTER MATRIX HARDENING**:
1. Take all `championIds` from parsed champions (N ids).
2. Initialize an N×N matrix for all pairs explicitly `[c1][c2] = 0`.
3. Map scraped Extreme threats:
   - For a given threat `t` against champion `c`, the value from `c`'s perspective is `-5`.
   - Update matrix: `matrix[c][t] = -5` AND `matrix[t][c] = +5` explicitly (symmetry).
4. Iterate Matrix to build final `NormalizedCounter[]`. Every pair `(A, B)` gets exported.
5. **Diagonal**: Force `matrix[c][c] = 0`.
6. **Matrix Integrity Check**: Traverse array to ensure `matrix[a][b] === -matrix[b][a]`. If mismatched, throw/log error.
</action>
</task>

---

## Success Criteria

1. ✅ Roles structured normalization (no regex matching in body). Missing roles default gracefully.
2. ✅ N×N Matrix filled completely, ensuring all pairs exist.
3. ✅ Matrix symmetry statically verified (`val(A, B) == -val(B, A)`). Diagonal is always 0.
4. ✅ Champion count anomaly (<50) logs a warning but continues (no Zod hard-fail).
5. ✅ Strict decoupled boundary: reads JSON, outputs JSON-compatible validated type.
