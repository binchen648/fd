# Phase 3 Global Remaining-Skill Rollout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fail-closed, reproducible global readiness queue for the remaining 793 frozen identities and use it to dispatch only singleton consumers or one bounded shared capability at a time.

**Architecture:** Codex A adds a machine-readable accepted-evidence registry and a readiness compiler that joins the locked 944-identity inventory, current canonical authoring, accepted migration/capability evidence, task-local probe decisions, and active reservations. The compiler never infers acceptance from broad taxonomy or implementation presence. It emits one state per frozen identity, a ranked bounded queue, FM09 metadata, and hard failures for stale evidence, duplicate credit, unknown semantics, or bulk-dispatch attempts.

**Tech Stack:** TypeScript, `tsx`, Vitest, existing Phase 3 inventory JSON, authoring JSON, Git SHA/fingerprint evidence.

---

### Task 1: Define the global readiness schema

**Files:**
- Create: `scripts/phase3-global-readiness.ts`
- Create: `scripts/tests/phase3-global-readiness.test.ts`

**Step 1: Write failing schema tests**

Cover all queue states:

```ts
type GlobalReadinessState =
  | 'MIGRATED_CONFIRMED'
  | 'S_READY_NOW'
  | 'ONE_SHARED_GAP'
  | 'TRANSITIVE_DEPENDENCY'
  | 'MULTI_GAP'
  | 'SOURCE_EVIDENCE_REQUIRED'
  | 'RULE_DECISION_REQUIRED'
  | 'SPECIAL_HANDLER_REVIEW'
  | 'COMPLETE_CARD_PROBE_REQUIRED'
  | 'ACTIVE_TASK_RESERVED';
```

Assert exactly 944 unique rows, one state per identity, deterministic ordering, explicit reason codes, exact evidence SHAs, and no silent default state.

**Step 2: Run the test and verify it fails**

Run: `npx vitest run scripts/tests/phase3-global-readiness.test.ts`
Expected: FAIL because the readiness compiler does not exist.

**Step 3: Implement only schema parsing and stable serialization**

Export typed input/output interfaces, `compileGlobalReadiness(...)`, and stable sort/hash helpers. Unknown state/reason/evidence forms must throw.

**Step 4: Run the test and verify it passes**

Run: `npx vitest run scripts/tests/phase3-global-readiness.test.ts`
Expected: PASS for schema fixtures.

**Step 5: Commit**

```powershell
git add scripts/phase3-global-readiness.ts scripts/tests/phase3-global-readiness.test.ts
git commit -m "test(phase3): define global readiness schema"
```

### Task 2: Reproduce the 151/944 material baseline

**Files:**
- Modify: `scripts/phase3-global-readiness.ts`
- Modify: `scripts/tests/phase3-global-readiness.test.ts`

**Step 1: Add negative-first inventory tests**

Fixtures must reject duplicate frozen IDs, unknown authored IDs, duplicate authored frozen IDs, missing dynamic identity, denominator drift, and declared formal/material count mismatch.

**Step 2: Implement canonical authoring collection**

Read only `data/authoring/masters/**/*.json` and `data/authoring/servants/**/*.json`; intersect card IDs with `data/phase3/full-roster-ability-inventory.json`. Do not count generated product files or arbitrary nested display IDs.

**Step 3: Verify the real baseline**

Run: `npm run phase3:global-readiness -- --validate-only`
Expected at the frozen baseline: `944 total / 151 migrated / 793 remaining / drift 0`.

**Step 4: Commit**

```powershell
git add scripts/phase3-global-readiness.ts scripts/tests/phase3-global-readiness.test.ts
git commit -m "feat(phase3): compute frozen authoring baseline"
```

### Task 3: Add exact accepted-evidence registries

**Files:**
- Create: `data/phase3/accepted-migration-evidence.json`
- Create: `data/phase3/accepted-capability-evidence.json`
- Modify: `scripts/phase3-global-readiness.ts`
- Modify: `scripts/tests/phase3-global-readiness.test.ts`

**Step 1: Test fail-closed evidence rules**

Reject entries without exact Candidate SHA, exact identity/capability ID, terminal R verdict, stable review URL or explicitly recorded coordinator verdict source, and A synchronization commit. Reject the same identity credited twice.

**Step 2: Seed the registries from synchronized A evidence**

Record only already synchronized facts. Darius s1 must appear once with `creditState: INCLUDED_CONFIRMED`; its reconciliation has `creditDelta: 0`. Do not infer acceptance from open PR state or implementation tests.

**Step 3: Join evidence to authoring**

An authored frozen identity without accepted migration evidence is not `MIGRATED_CONFIRMED`; report `ACCEPTANCE_EVIDENCE_MISSING`. Accepted evidence without matching authoring is a blocking drift.

**Step 4: Verify**

Run: `npx vitest run scripts/tests/phase3-global-readiness.test.ts`
Expected: PASS, including duplicate-credit negatives.

**Step 5: Commit**

```powershell
git add data/phase3/accepted-*-evidence.json scripts/phase3-global-readiness.ts scripts/tests/phase3-global-readiness.test.ts
git commit -m "feat(phase3): bind global queue to accepted evidence"
```

### Task 4: Compile the coarse remaining queue

**Files:**
- Create: `data/phase3/global-readiness-decisions.json`
- Modify: `scripts/phase3-global-readiness.ts`
- Modify: `scripts/tests/phase3-global-readiness.test.ts`

**Step 1: Add classification tests**

Verify the default mapping for missing identities:

- unresolved semantic source -> `SOURCE_EVIDENCE_REQUIRED`;
- historical generic-extension row without a current complete-card probe -> `COMPLETE_CARD_PROBE_REQUIRED`;
- historical special row -> `SPECIAL_HANDLER_REVIEW`;
- active exact task -> `ACTIVE_TASK_RESERVED`.

No historical `READY_GENERIC_EXTENSION` row may become `S_READY_NOW` automatically.

**Step 2: Add stale-decision protection**

Each manual decision must bind identity, source hash, runtime/evidence fingerprint, exact baseline SHA, reason codes, and dependency IDs. Fingerprint mismatch invalidates the decision instead of preserving its old priority.

**Step 3: Verify current coarse counts**

Before fresh probes and excluding active reservations, the raw missing population must reconcile to the observed `738 source-evidence / 50 probe-required / 5 special-handler` starting split. Astolfo s1 must be reserved while FB2-49 is active.

**Step 4: Commit**

```powershell
git add data/phase3/global-readiness-decisions.json scripts/phase3-global-readiness.ts scripts/tests/phase3-global-readiness.test.ts
git commit -m "feat(phase3): compile fail-closed remaining queue"
```

### Task 5: Add complete-card probe packets and ranking

**Files:**
- Create: `docs/reports/phase3-global-readiness-probe-template.md`
- Modify: `scripts/phase3-global-readiness.ts`
- Modify: `scripts/tests/phase3-global-readiness.test.ts`

**Step 1: Test promotion boundaries**

`S_READY_NOW` requires a current complete-card probe with empty loader/compiler reports, accepted exact contracts for every semantic node, registered transitive definitions, positive path, canonical negatives, fail-closed malformed path, and no active reservation. Missing any field keeps the row out of `S_READY_NOW`.

**Step 2: Implement ranking**

Rank in this order: `S_READY_NOW`; then `ONE_SHARED_GAP` by bounded closure yield; then lower hidden-information/interaction risk; then lower lifecycle/battle-ordering risk. Ties sort by canonical ID. Do not rank FM09 membership itself.

**Step 3: Add closure-yield integrity tests**

Yield counts only identities whose other complete-card dependencies are already accepted. Broad capability labels and partial cards do not count.

**Step 4: Commit**

```powershell
git add docs/reports/phase3-global-readiness-probe-template.md scripts/phase3-global-readiness.ts scripts/tests/phase3-global-readiness.test.ts
git commit -m "feat(phase3): rank bounded migration candidates"
```

### Task 6: Enforce FM09 and batch-size guards

**Files:**
- Modify: `scripts/phase3-global-readiness.ts`
- Modify: `scripts/tests/phase3-global-readiness.test.ts`

**Step 1: Add FM09 fixture tests**

Assert 11 target identities, exactly two currently present, and nine currently missing. FM09 membership is metadata and cannot alter ranking.

**Step 2: Add dispatch guard tests**

Reject:

- a dispatch containing all nine remaining FM09 targets;
- a generic “complete FM09” task;
- Fujino s3 bundled with missing Fujino s2;
- Ryougi s2 inheriting Ryougi s3's accepted interaction;
- more than one frozen identity unless an explicit same-owner/inseparable-contract exception is independently documented.

**Step 3: Verify**

Run: `npx vitest run scripts/tests/phase3-global-readiness.test.ts`
Expected: all batch and inherited-acceptance negatives PASS.

**Step 4: Commit**

```powershell
git add scripts/phase3-global-readiness.ts scripts/tests/phase3-global-readiness.test.ts
git commit -m "test(phase3): prevent FM09 bulk migration"
```

### Task 7: Publish the reproducible queue command

**Files:**
- Modify: `package.json`
- Create: `artifacts/phase3-global-readiness.json`
- Create: `docs/reports/YYYY-MM-DD-p3-a-global-readiness-refresh.md`
- Modify: `docs/agents/PHASE3-TASK-INDEX.md`

**Step 1: Add the command**

Add:

```json
"phase3:global-readiness": "tsx scripts/phase3-global-readiness.ts"
```

**Step 2: Generate fresh evidence**

Run: `npm run phase3:global-readiness`
Expected: one deterministic row per frozen identity, no count drift, no duplicate credit, and an explicit ranked top candidate list.

**Step 3: Run the A automation gates**

```powershell
npx vitest run scripts/tests/phase3-global-readiness.test.ts scripts/tests/phase3-full-roster-audit.test.ts scripts/tests/phase3-coverage.test.ts
npm run phase3:coverage
npm run phase3:automation-audit
npm run typecheck
git diff --check
```

Do not hide unrelated baseline failures; record exact scope and command output.

**Step 4: Update governance**

The task index records the queue refresh only. It may dispatch the first exact next task only if the current FB2-49 -> R -> A -> Astolfo chain is closed and the selected row satisfies all dispatch gates.

**Step 5: Commit**

```powershell
git add package.json scripts data/phase3 docs artifacts/phase3-global-readiness.json
git commit -m "feat(phase3): publish global remaining-skill queue"
```

### Task 8: Operate the queue without bulk migration

**Files:**
- Modify per cycle: `data/phase3/accepted-*-evidence.json`
- Modify per cycle: `data/phase3/global-readiness-decisions.json`
- Regenerate per cycle: `artifacts/phase3-global-readiness.json`
- Add per cycle: one A dispatch or synchronization report

**Step 1: Finish the reserved active chain**

Complete FB2-49 independent R review, A synchronization, Astolfo s1 singleton S migration, independent R review, and A credit synchronization.

**Step 2: Refresh before selecting work**

Run `npm run phase3:global-readiness`. Never inherit the prior cycle's top candidate without a current fingerprint.

**Step 3: Dispatch by queue state**

- If `S_READY_NOW` is non-empty, dispatch one singleton S task; up to three disjoint singleton tasks may run concurrently.
- Otherwise dispatch one `ONE_SHARED_GAP` B2 task with one identity-free capability and one representative.
- Keep source normalization and special-handler review in separate non-runtime tasks.

**Step 4: Stop after each bounded dispatch**

Do not start the next runtime capability until the exact Candidate has independent R judgment and A synchronization. Do not start an FM09 batch at any point.
