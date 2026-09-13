# Phase 3 Full-Roster Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Account for all 943 static Reference skills and one dynamic skill, normalize them into current Phase 3 capabilities, and migrate them through accepted mechanic contracts without interrupting the active B11/R06/A03 runtime sequence.

**Architecture:** A read-only intake pipeline converts a commit-locked Reference checkout into one deterministic canonical inventory and derived capability/decision reports. Source normalization runs in an isolated S lane; A independently verifies its counts, R reviews semantics, and only accepted capability checkpoints can dispatch a separate B2 runtime PR or S migration PR.

**Tech Stack:** TypeScript, `tsx`, Vitest, JSON/JSON Schema-style validation, Git worktrees, existing `@fd/content` authoring, `@fd/rules` MatchSession, Phase 3 coverage tooling.

---

## Execution Constraints

- Base the intake lane on the coordinator-provided exact commit; never use “latest.”
- Keep the active sequence `P3-B11 -> P3-R06 -> P3-A03` unchanged.
- Tasks 1-8 must not edit production runtime, server, or client files.
- Use `apply_patch` for manual edits and one external worktree per PR.
- Reference input is read-only and must be at `b2f9fa15fba07c63530bbf4612b03b8b704755f9` with a clean status.
- Do not commit the Reference checkout or depend on `D:\fd\references\...`.

### Task 1: Install Full-Roster Governance

**Role:** Coordinator documentation

**Files:**
- Create: `docs/agents/PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md`
- Modify: `docs/agents/PHASE3-AGENT-CONTRACT.md`
- Modify: `docs/agents/PHASE3-TASK-INDEX.md`
- Test: `scripts/tests/fd-playtest-v1-docs.test.ts`

**Step 1: Write the failing documentation test**

Assert that the collaboration contract exists, pins the Reference SHA, defines S and conditional B2, prohibits local-path production dependencies, preserves B11/R06/A03, and lists FS00 through FR01.

**Step 2: Run the focused test**

Run: `npx vitest run scripts/tests/fd-playtest-v1-docs.test.ts`

Expected: FAIL because the new contract and task blocks do not exist.

**Step 3: Add the approved contract and task index blocks**

Copy the authority, roles, worktree isolation, one-role-per-PR rule, file leases, checkpoints, and completion criteria from `docs/plans/2026-09-13-phase-3-full-roster-collaboration-design.md`. Add concise task-index entries for `P3-FS00` through `P3-FR01`; agents must read only their assigned block.

**Step 4: Run the focused test and diff check**

Run: `npx vitest run scripts/tests/fd-playtest-v1-docs.test.ts`

Run: `git diff --check`

Expected: PASS.

**Step 5: Commit**

```bash
git add docs/agents scripts/tests/fd-playtest-v1-docs.test.ts
git commit -m "docs: install full-roster collaboration contract"
```

### Task 2: Implement Reference Lock Verification (`P3-FS00`)

**Role:** S

**Files:**
- Create: `scripts/phase3-reference/verify-reference.ts`
- Create: `scripts/phase3-reference/types.ts`
- Create: `scripts/tests/phase3-reference-lock.test.ts`
- Modify: `package.json`

**Step 1: Write failing tests**

Cover valid URL/SHA/clean checkout, wrong SHA, dirty checkout, non-Git directory, missing required files, and output free of absolute local paths.

**Step 2: Run tests to verify failure**

Run: `npx vitest run scripts/tests/phase3-reference-lock.test.ts`

Expected: FAIL because the verifier does not exist.

**Step 3: Implement the verifier**

Expose a typed function:

```ts
export interface VerifiedReference {
  repository: string;
  commit: string;
  requiredFiles: string[];
  inputDigests: Record<string, string>;
}

export function verifyReferenceRoot(root: string): VerifiedReference;
```

Use `git -C <root> config --get remote.origin.url`, `rev-parse HEAD`, and `status --porcelain`. Hash the required files with SHA-256. Do not write to `root`.

Register `phase3:reference:verify` with required `--reference-root` input.

**Step 4: Verify**

Run: `npx vitest run scripts/tests/phase3-reference-lock.test.ts`

Run: `npm run phase3:reference:verify -- --reference-root <clean-reference-checkout>`

Expected: PASS and JSON naming the locked commit and digests.

**Step 5: Commit**

```bash
git add package.json scripts/phase3-reference scripts/tests/phase3-reference-lock.test.ts
git commit -m "build: verify locked phase3 reference input"
```

### Task 3: Define And Generate the Identity Crosswalk (`P3-FS01`)

**Role:** S

**Files:**
- Create: `scripts/phase3-reference/build-full-roster-inventory.ts`
- Create: `scripts/phase3-reference/inventory-schema.ts`
- Create: `scripts/tests/phase3-full-roster-inventory.test.ts`
- Create: `data/phase3/full-roster-ability-inventory.json`
- Modify: `package.json`

**Step 1: Write failing schema and identity tests**

Assert 943 unique static Reference skill IDs, the known dynamic skill recorded separately, stable owner/card/ability identities, no duplicate canonical IDs, provenance metadata, deterministic ordering, and identical output across two runs.

**Step 2: Run the tests**

Run: `npx vitest run scripts/tests/phase3-full-roster-inventory.test.ts`

Expected: FAIL because no inventory generator exists.

**Step 3: Implement the minimal inventory generator**

Read Reference `legacy-content.json`, `cards.json`, `confirmed-skill-overrides.ts` metadata through structured imports where possible, and `skill-rule-programs.json`. Do not parse TypeScript source with regular expressions when an exported structured value or TypeScript parser is available.

Unmapped identities receive an explicit block; never fabricate a canonical ID from display text alone.

Register `phase3:reference:intake`.

**Step 4: Generate and verify determinism**

Run the generator twice into temporary directories and compare hashes, then generate the checked-in JSON.

Expected: 943 static skills accounted for, no silent drops, deterministic hash.

**Step 5: Commit**

```bash
git add package.json scripts/phase3-reference scripts/tests/phase3-full-roster-inventory.test.ts data/phase3/full-roster-ability-inventory.json
git commit -m "feat: inventory full reference skill roster"
```

### Task 4: Preserve Every Printed Clause (`P3-FS02`)

**Role:** S

**Files:**
- Modify: `scripts/phase3-reference/build-full-roster-inventory.ts`
- Modify: `scripts/phase3-reference/inventory-schema.ts`
- Modify: `scripts/tests/phase3-full-roster-inventory.test.ts`
- Modify: `data/phase3/full-roster-ability-inventory.json`

**Step 1: Add failing clause-loss tests**

Assert every Reference source text is represented by one or more clause records or an explicit `SOURCE_EVIDENCE_REQUIRED` block. Include fixtures for multiple clauses, choice, trigger, lifecycle, and derived-card text.

**Step 2: Run the focused test**

Expected: FAIL for records that currently contain only skill-level text.

**Step 3: Implement clause preservation**

Prefer Reference structured `clauses`; for V2 authoring use `printedClause`. A mechanical splitter may produce `DISCOVERED` clauses but may not promote them to `SOURCE_GROUNDED` without evidence. Record exact source locator and digest.

**Step 4: Regenerate and verify**

Run: `npm run phase3:reference:intake -- --reference-root <root>`

Run: `npx vitest run scripts/tests/phase3-full-roster-inventory.test.ts`

Expected: zero untracked source text and explicit blocks for uncertain decomposition.

**Step 5: Commit**

```bash
git add scripts/phase3-reference scripts/tests/phase3-full-roster-inventory.test.ts data/phase3/full-roster-ability-inventory.json
git commit -m "feat: preserve full-roster skill clauses"
```

### Task 5: Normalize Orthogonal Semantic Axes (`P3-FS03`)

**Role:** S

**Files:**
- Create: `scripts/phase3-reference/normalize-semantic-axes.ts`
- Create: `scripts/tests/phase3-full-roster-semantics.test.ts`
- Modify: `data/phase3/full-roster-ability-inventory.json`
- Generate: `docs/audits/fd-full-roster-semantic-axis-matrix.md`

**Step 1: Write failing taxonomy tests**

Test strict separation of timing, domain trigger, target selection, player interaction, lifecycle, modifier, result binding, and battle semantics. Reuse current taxonomy definitions; do not infer Interaction merely from timing words.

**Step 2: Run the tests**

Run: `npx vitest run scripts/tests/phase3-full-roster-semantics.test.ts`

Expected: FAIL until semantic normalization exists.

**Step 3: Implement source-priority normalization**

Use V2 structured authoring first when source-aligned. Treat Reference handler shape as `observedBehavior`, never as canonical semantics. Ambiguous or conflicting clauses become explicit blocks.

**Step 4: Generate inventory and Markdown view**

Expected: every ability is classified or explicitly blocked; `unclassified = 0`; generated Markdown counts equal JSON counts.

**Step 5: Commit**

```bash
git add scripts/phase3-reference scripts/tests/phase3-full-roster-semantics.test.ts data/phase3 docs/audits/fd-full-roster-semantic-axis-matrix.md
git commit -m "feat: normalize full-roster semantic axes"
```

### Task 6: Build Capability Mapping (`P3-FS04`)

**Role:** S

**Files:**
- Create: `scripts/phase3-reference/map-phase3-capabilities.ts`
- Create: `scripts/tests/phase3-full-roster-capabilities.test.ts`
- Create: `data/phase3/full-roster-capability-catalog.json`
- Generate: `docs/audits/fd-full-roster-capability-catalog.md`
- Modify: `data/phase3/full-roster-ability-inventory.json`

**Step 1: Write failing mapping tests**

Assert every normalized ability maps to one or more named capabilities or an explicit block. Test independent action contracts, invalidating axes, current route classification, Reference route classification, and acceptance-contract inheritance.

**Step 2: Run tests and observe failure**

Run: `npx vitest run scripts/tests/phase3-full-roster-capabilities.test.ts`

**Step 3: Implement the catalog**

Seed mappings from current Phase 3 mechanic and semantic-axis inventories. Keep `PLAY`, `ADD_TO_ATTACK`, `CREATE_AND_ACTIVATE`, `ACTIVATE`, and `CLOSE` separate. Do not create a capability merely because multiple Reference handlers share a name.

**Step 4: Regenerate and verify**

Expected: zero silent fallback, complete eligible/skipped lists, and current route values limited to `legacy|new|dual|none`.

**Step 5: Commit**

```bash
git add scripts/phase3-reference scripts/tests/phase3-full-roster-capabilities.test.ts data/phase3 docs/audits/fd-full-roster-capability-catalog.md
git commit -m "feat: map full roster to phase3 capabilities"
```

### Task 7: Generate Rule Decision And Runtime Requests (`P3-FS05`)

**Role:** S

**Files:**
- Create: `scripts/phase3-reference/build-decision-packets.ts`
- Create: `scripts/tests/phase3-decision-packets.test.ts`
- Create: `data/phase3/full-roster-rule-decisions.json`
- Create: `data/phase3/full-roster-runtime-capability-requests.json`
- Generate: `docs/reports/phase3-full-roster-rule-decisions.md`
- Generate: `docs/reports/phase3-full-roster-runtime-capability-requests.md`

**Step 1: Write failing packet tests**

Require affected IDs, exact source references, ambiguity or capability gap, options for rule decisions, recommendation, Reference behavior marked non-authoritative, and runtime impact. Reject technical implementation questions in user decision packets.

**Step 2: Run tests**

Expected: FAIL until packet generation exists.

**Step 3: Implement deterministic packet generation**

Group identical semantic disputes so the user decides once for all affected cards. Emit separate runtime requests for clear semantics lacking a current capability.

**Step 4: Verify**

Expected: every blocked inventory ID appears in exactly one appropriate packet or names an accepted external dependency.

**Step 5: Commit**

```bash
git add scripts/phase3-reference scripts/tests/phase3-decision-packets.test.ts data/phase3 docs/reports/phase3-full-roster-*.md
git commit -m "feat: generate full-roster decision packets"
```

### Task 8: Independently Audit Intake (`P3-FA01` And `P3-FR01`)

**Role:** A first, then R

**Files:**
- Create: `scripts/phase3-reference/audit-full-roster.ts`
- Create: `scripts/tests/phase3-full-roster-audit.test.ts`
- Create: `docs/reports/YYYY-MM-DD-phase3-full-roster-automation-audit.md`
- Create: `docs/reports/YYYY-MM-DD-phase3-full-roster-independent-review.md`

**Step 1: A writes independent recomputation tests**

Re-read raw Reference inputs instead of trusting generated totals. Compare skill IDs, ability IDs, clauses, source coverage, category totals, blocked IDs, and catalog membership.

**Step 2: A runs the audit**

Expected: either exact agreement or `AUTOMATION_CLASSIFICATION_GAP` with IDs. A does not repair semantic/runtime behavior.

**Step 3: R reviews a stratified sample**

Sample every mechanic wave, all rule decisions, all proposed special handlers, all source-priority conflicts, and a random reproducible set of ordinary records. Compare against canonical rules and original sources.

**Step 4: Record checkpoint judgment**

Allowed results: `F0_ACCEPTED`, `F1_ACCEPTED`, `INTAKE_NEEDS_REVISION`. No runtime Gate is promoted.

**Step 5: Commit each role separately**

A and R use separate branches and PRs. R does not modify generator or inventory files.

### Task 9: Dispatch The First Accepted Migration (`P3-FM01`)

**Role:** S

**Start Gate:** F1 accepted, matching current contract independently accepted, no runtime changes required.

**Files:**
- Modify: selected files under `data/authoring/`
- Create/Modify: focused content compilation tests
- Create: `docs/reports/YYYY-MM-DD-p3-fm01-<capability>-migration.md`

**Step 1: Select one `READY_EXISTING_CONTRACT` capability**

Prefer a low-risk direct-action family already accepted by the current mainline. Record 10-40 exact eligible ability IDs and skipped reasons.

**Step 2: Write failing canonical authoring tests**

Assert source preservation, exact semantic shape, successful compilation, and no card/ability-ID routing.

**Step 3: Migrate only the selected abilities**

Consume existing contracts without changing runtime or metric definitions.

**Step 4: Run focused and content verification**

Run focused tests, `npm run content:validate`, `npm run verify:generated-content`, and `git diff --check`.

**Step 5: Submit for A/R**

A reports before/after `legacy/new/dual`; R judges migration conformance. S claims `MIGRATION_CANDIDATE` only.

### Task 10: Add A Missing Capability (`P3-FB2-01`)

**Role:** B2

**Start Gate:** Active runtime lane closed; request accepted; semantics confirmed; hot files unreserved; exact accepted baseline pinned; task index status `READY`.

**Files:**
- Modify: only files explicitly listed in the accepted capability request
- Create/Modify: focused Gate A tests
- Create/Modify: one to three representative Gate B tests
- Create/Modify: Gate C test only when the pattern requires it
- Create: `docs/reports/YYYY-MM-DD-p3-fb2-01-<capability>-result.md`

**Step 1: Write failing contract and fail-closed tests**

Cover positive semantic shape, invalidating axes, malformed inputs, unavailable targets/resources, rollback, and ID independence.

**Step 2: Implement the smallest generic capability**

Use current typed results, transaction ownership, and MatchSession production route. Do not copy Reference handlers.

**Step 3: Prove representative production reachability**

Route canonical authoring through compiler, MatchSession, event/projection, and reconnect/stale behavior where applicable.

**Step 4: Run verification**

Run focused tests, `npm run typecheck`, relevant server/client tests, and `git diff --check`.

**Step 5: Submit for A/R**

B2 claims `IMPLEMENTATION_COMPLETE_CANDIDATE`; A calculates burn-down; R alone accepts or rejects Gate evidence.

### Task 11: Repeat Capability Factory By Wave

**Roles:** S, A, B/B2, R in separate PRs

For each capability:

1. S freezes eligible/skipped IDs and canonical source evidence.
2. A verifies membership and baseline counts.
3. B/B2 implements a missing contract only after its start gate.
4. R accepts the runtime contract.
5. S migrates the matching authoring batch.
6. A records burn-down.
7. R accepts or rejects the migration.

Do not start a dependent wave runtime before its gateway is accepted. S may continue preparing later-wave inventories in parallel.

### Task 12: Full-Roster Closure Audit (`F5`)

**Roles:** A then R

**Files:**
- Create: `docs/reports/YYYY-MM-DD-phase3-full-roster-closure-audit.md`
- Generate: final machine-readable closure evidence under `data/phase3/`

**Step 1: A recomputes all closure metrics**

Require 943/943 static skills, 1/1 dynamic skill, zero missing/duplicate IDs, zero unclassified abilities, zero untracked clauses, zero unexplained dual routes, zero undeclared special handlers, zero shared-runtime card-ID checks, and zero silent fallbacks.

**Step 2: Validate acceptance inheritance**

Every migrated ability names an accepted contract. Every invalidating semantic axis has its own representative evidence.

**Step 3: R performs independent closure review**

R checks canonical conformance, production ownership, special-handler exceptions, Gate evidence, and current mainline integration.

**Step 4: Publish judgment**

Only R may declare full-roster Phase 3 accepted. This does not independently declare Phase 4, Golden Flow, Battle Winner, or release readiness complete.

## Verification Matrix

Run after every intake change:

```powershell
npx vitest run scripts/tests/phase3-*.test.ts
npm run phase3:reference:verify -- --reference-root <root>
npm run phase3:reference:intake -- --reference-root <root>
git diff --check
```

Run before each migration/runtime PR:

```powershell
npm run typecheck
npm test
npm run content:validate
npm run verify:generated-content
git diff --check
```

Add client/server/Playwright verification only when the capability changes or inherits a production interaction pattern that requires Gate C.

