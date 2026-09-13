# Phase 3 CI Baseline Repair Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore a reproducible green Linux clean-checkout CI baseline without excluding failing tests, weakening source evidence, or changing card-rule execution behavior.

**Architecture:** Treat `P3-CI01` as an umbrella with separate A, B, and R branches. A fixes repository-root/path portability and records the baseline; B owns the narrow content-compilation determinism and source-asset policy because it affects the compiled definition hash; R independently verifies that the resulting CI is green and behavior-neutral.

**Tech Stack:** GitHub Actions, Node.js, TypeScript, Vitest, npm workspaces.

---

## Locked Failure Baseline

- Repository: `binchen648/fd`
- Main failure run: `34118927469`
- Documentation PR failure run: `34758467784`
- PR head at diagnosis: `fa81bf148df83653195d4d73673356fbdb0d77b9`
- Result: 5 failed files, 9 failed tests, 72 passed files, 429 passed tests
- Build workflow: PASS

Observed failure families:

1. `packages/pipeline/tests/runners/export-smoke-scenarios.test.ts`: four host-path separator and label failures caused by Windows defaults on Linux.
2. `packages/pipeline/tests/validators/sample-manifest-coverage.test.ts`: two failures caused by the hard-coded `D:\fd\data\manifests\sample-cards.json`; the file is tracked and is not missing.
3. `packages/content/src/__tests__/fd-playtest-events.test.ts` and `playtest-pack-loader.test.ts`: source images are intentionally absent from a clean checkout because `chm-extract/` is ignored.
4. `packages/rules/tests/regression/golden-card-content-pipeline.test.ts`: clean-checkout compilation produces a different definition hash because source metadata selection currently depends on local file existence.

## Non-Negotiable Constraints

- Do not add new `test:ci` exclusions, delete assertions, mark failures as unconditional skips, or suppress nonzero exits.
- Do not commit `chm-extract/`, fabricated placeholder images, credentials, local provider configuration, or generated staging directories.
- Do not replace paths with another absolute developer-machine path.
- Do not change ability resolution, primitive behavior, semantic routing, MatchSession game behavior, or Phase 3 KPI definitions.
- A must stop at `CONTENT_COMPILATION_DETERMINISM_GAP` rather than modify the definition-hash/source-selection contract.
- B must not bundle mechanic/runtime changes with the content-determinism repair.
- A, B, and R use separate branches, worktrees, commits, and PRs.

### Task 1: P3-CI01-A Record And Reproduce The Baseline

**Role:** Codex A

**Files:**
- Create: `docs/reports/<YYYY-MM-DD>-p3-ci01-baseline.md`
- Modify only when needed for reproduction: none

**Step 1: Create a clean external worktree**

Branch from the exact accepted target commit, not from a dirty local checkout. Record `BaseCommit`, OS, Node, npm, and the two locked Actions run IDs.

**Step 2: Install from the lockfile**

Run:

```powershell
npm ci
```

Expected: PASS without changing `package-lock.json`.

**Step 3: Reproduce the suite**

Run:

```powershell
npm run typecheck
npm run test:ci
```

Expected before repair: the same four failure families. Record exact differences; do not repair compiler/hash behavior in this task.

**Step 4: Commit the baseline report**

```powershell
git add docs/reports/<YYYY-MM-DD>-p3-ci01-baseline.md
git commit -m "docs: record ci baseline failures"
```

### Task 2: P3-CI01-A Make Tooling Paths Host-Portable

**Role:** Codex A

**Files:**
- Create: `scripts/project-paths.ts`
- Create: `scripts/tests/project-paths.test.ts`
- Modify: `scripts/export-smoke-scenarios.ts`
- Modify: `packages/pipeline/tests/runners/export-smoke-scenarios.test.ts`
- Modify: `packages/pipeline/tests/validators/sample-manifest-coverage.test.ts`

**Step 1: Write failing repository-path tests**

Assert that repository defaults are derived from the checkout location, use the host separator, and contain no drive-letter assumption. Assert that generated labels are identical for equivalent Windows and POSIX path spellings.

**Step 2: Verify the focused failures**

Run:

```powershell
npx vitest run scripts/tests/project-paths.test.ts packages/pipeline/tests/runners/export-smoke-scenarios.test.ts packages/pipeline/tests/validators/sample-manifest-coverage.test.ts
```

Expected: FAIL on hard-coded `D:\fd`, mixed separators, and path-derived labels.

**Step 3: Implement the minimum path helper**

Derive the repository root from `import.meta.url` and build native paths with `node:path`. Normalize both `\\` and `/` before extracting a filename for a stable label. Do not rewrite arbitrary paths with string replacement when `path.resolve`, `path.relative`, or a URL conversion is applicable.

Use the tracked manifest through the repository root:

```ts
const SAMPLE_MANIFEST_PATH = resolve(repositoryRoot, 'data', 'manifests', 'sample-cards.json');
```

Tests must use temporary roots or native `resolve(...)` expectations, not literal `D:\fd` snapshots.

**Step 4: Run focused tests and typecheck**

```powershell
npx vitest run scripts/tests/project-paths.test.ts packages/pipeline/tests/runners/export-smoke-scenarios.test.ts packages/pipeline/tests/validators/sample-manifest-coverage.test.ts
npm run typecheck
git diff --check
```

Expected: PASS. No files under `packages/rules/src/ability/**` or `packages/rules/src/match-session.ts` change.

**Step 5: Commit the A-owned repair**

```powershell
git add scripts/project-paths.ts scripts/tests/project-paths.test.ts scripts/export-smoke-scenarios.ts packages/pipeline/tests/runners/export-smoke-scenarios.test.ts packages/pipeline/tests/validators/sample-manifest-coverage.test.ts
git commit -m "fix: make ci tooling paths portable"
```

**Step 6: Handoff the remaining compiler defect**

Report `CONTENT_COMPILATION_DETERMINISM_GAP` with the expected and received hashes and the existence-dependent code path in `imagesForArchive`. A stops; it does not edit the loader contract.

### Task 3: P3-CI01-B Remove Environment-Dependent Content Compilation

**Role:** Codex B

**Start Gate:** Task 2 is committed; B has an explicit lease on the files below; no unrelated content-compiler task owns them.

**Files:**
- Modify: `packages/content/src/playtest-pack-loader.ts`
- Modify: `packages/content/src/__tests__/playtest-pack-loader.test.ts`
- Modify: `packages/content/src/__tests__/fd-playtest-events.test.ts`
- Modify: `packages/rules/tests/regression/golden-card-content-pipeline.test.ts`
- Modify only if deterministic regeneration is proven: `data/generated/fd-playtest-v1.content-library.json`
- Modify: `package.json`

**Step 1: Write failing environment-independence tests**

Compile the same authored pack against two temporary workspace roots: one with source assets and one without them. Assert identical compiled semantic content and identical definition hashes. Assert that relative authored source paths are preserved without consulting file existence.

**Step 2: Introduce an explicit source-asset validation policy**

Use an explicit mode such as:

```ts
type SourceAssetValidation = 'required' | 'metadata_only';
```

`required` must retain the existing blocking `MISSING_IMAGE` behavior. `metadata_only` may be used by clean-checkout CI, but must emit an explicit nonblocking audit result indicating that source binaries were not verified. It must not claim image verification succeeded.

Source metadata compilation must consume declared relative paths deterministically. Optional filesystem availability may affect evidence validation, never compiled card semantics or the definition hash. If an archive has no trustworthy declared source path, fail closed with a structured source-evidence block rather than infer meaning from a handler.

**Step 3: Separate clean-checkout and source-asset assertions**

The normal CI suite must verify source metadata shape, relative-path policy, and deterministic compilation. Add a dedicated command such as `test:source-assets` that runs strict existence checks when `FD_SOURCE_ASSET_ROOT` is provided and fails clearly when the configured root is invalid.

Do not silently skip strict verification while claiming it passed. The standard CI report must state that binary source assets were unavailable.

**Step 4: Verify the hash intentionally**

Run the canonical compiler twice in clean checkouts and compare byte-for-byte output. Regenerate `data/generated/fd-playtest-v1.content-library.json` only if both runs agree and the diff contains no unintended mechanic or ability change.

```powershell
npm run content:compile
npm run verify:generated-content
git diff -- data/generated/fd-playtest-v1.content-library.json
```

Expected: deterministic hash. Any ability/effect/lifecycle difference is a blocker and must be reviewed separately.

**Step 5: Run focused and full verification**

```powershell
npx vitest run packages/content/src/__tests__/playtest-pack-loader.test.ts packages/content/src/__tests__/fd-playtest-events.test.ts packages/rules/tests/regression/golden-card-content-pipeline.test.ts
npm run typecheck
npm run test:ci
git diff --check
```

Expected: all test files pass on a clean checkout; strict source-asset verification remains available and fail-closed when requested.

**Step 6: Commit separately**

```powershell
git add packages/content/src/playtest-pack-loader.ts packages/content/src/__tests__/playtest-pack-loader.test.ts packages/content/src/__tests__/fd-playtest-events.test.ts packages/rules/tests/regression/golden-card-content-pipeline.test.ts data/generated/fd-playtest-v1.content-library.json package.json
git commit -m "fix: make content compilation environment independent"
```

### Task 4: P3-CI01-A Integrate And Prove GitHub CI

**Role:** Codex A

**Files:**
- Modify only if required: `.github/workflows/test.yml`
- Create: `docs/reports/<YYYY-MM-DD>-p3-ci01-verification.md`

**Step 1: Integrate accepted A and B commits**

Use exact SHAs. Do not squash away role ownership in the evidence record.

**Step 2: Run the complete local contract**

```powershell
npm ci
npm run typecheck
npm run test:ci
npm run verify:generated-content
git diff --check
```

Expected: PASS and a clean worktree.

**Step 3: Push and observe GitHub Actions**

The GitHub `Build` and `Test` workflows must both pass in a clean Ubuntu checkout. A local Windows pass is insufficient.

Do not change workflow excludes to obtain green status. The Node 20 deprecation warning is nonblocking; handle it only in a separate dependency-maintenance change unless Node 24 compatibility is explicitly tested here.

**Step 4: Commit the verification report**

Record exact commits, commands, test counts, workflow URLs, asset-validation mode, generated hash, and remaining nonblocking warnings.

### Task 5: P3-CI01-R Independent Acceptance

**Role:** Codex R

R reviews from a fresh worktree and does not implement fixes. Verify the original nine failures no longer reproduce, inspect all test exclusions for drift, check that no runtime/card semantics changed, run the full clean-checkout suite, and verify strict source-asset mode still fails closed when assets are unavailable.

Allowed verdicts:

- `CI_BASELINE_ACCEPTED`
- `CI_REPAIR_NEEDS_REVISION`

After acceptance, merge the standalone CI PR first, rebase or merge that exact commit into the Phase 3 documentation PR, and rerun its checks. CI repair does not promote Gate A/B/C or any Phase 3 mechanic status.
