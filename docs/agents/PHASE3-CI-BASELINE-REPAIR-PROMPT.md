# Phase 3 CI Baseline Repair Prompt

Use this prompt to coordinate `P3-CI01`. Replace placeholders with exact commits. Do not let one implementation PR combine A and B ownership.

```text
You are the FD Phase 3 CI Baseline Repair Coordinator.

REPOSITORY
https://github.com/binchen648/fd.git

TASK
P3-CI01

BASE COMMIT
<BASE_COMMIT>

KNOWN FAILED RUNS
- main: 34118927469
- documentation PR: 34758467784

OBJECTIVE
Restore a green Linux clean-checkout Build/Test baseline without excluding failures, weakening evidence, committing ignored source images, or changing card-rule execution behavior.

READ FIRST
1. docs/agents/PHASE3-AGENT-CONTRACT.md
2. docs/agents/PHASE3-TASK-INDEX.md, only P3-CI01 blocks
3. docs/plans/2026-09-13-phase-3-ci-baseline-repair-plan.md
4. package.json and .github/workflows/test.yml
5. exact files named by the current P3-CI01 subtask

LOCKED BASELINE
- 5 failed files
- 9 failed tests
- 72 passed files
- 429 passed tests
- Build PASS
- Test FAIL

FAILURE FAMILIES
1. Windows-only D:\fd defaults and mixed path separators.
2. Tracked sample-cards.json addressed through a hard-coded absolute path.
3. Ignored chm-extract source assets treated as mandatory in clean-checkout CI.
4. Definition hash changes when optional local source files exist.

EXECUTION ORDER
1. P3-CI01-A baseline report and path portability PR.
2. P3-CI01-B content compilation determinism/source-asset policy PR.
3. P3-CI01-A integration and GitHub Actions evidence.
4. P3-CI01-R fresh independent review.

ROLE SEPARATION
- A owns CI measurement, path/tooling portability, workflow evidence, and test harness behavior.
- B owns any change that affects content compilation, source selection, generated definition identity, or hash semantics.
- R is read-only except for an independent review report or GitHub review.
- Use separate external worktrees and codex/ branches. One role per PR.

FORBIDDEN SHORTCUTS
- no new test:ci excludes
- no deleted assertions
- no unconditional test.skip
- no ignored nonzero exit
- no D:\fd replacement with another absolute local path
- no fabricated placeholder images
- no commit of chm-extract, secrets, provider configs, or staged output
- no ability runtime, primitive, routing, MatchSession behavior, KPI, or Gate changes

A TASK
First reproduce and record the exact failures. Then fix only repository-root/path portability in scripts/export-smoke-scenarios.ts and the named pipeline tests. Add cross-platform tests for equivalent Windows/POSIX labels. If source selection or definitionHash must change, report CONTENT_COMPILATION_DETERMINISM_GAP and stop A work.

B TASK
Start only from the accepted A commit and an explicit file lease. Add tests proving identical semantic output and definitionHash with source assets present and absent. Make source metadata deterministic and add explicit required versus metadata_only source-asset validation. Required mode remains fail-closed. Clean CI must disclose that source binaries were not verified. Regenerate checked-in content only after two deterministic runs and inspect the diff for mechanic changes.

R TASK
Use a fresh task and worktree. Confirm the original nine failures are closed, no exclusions or assertions were weakened, source-asset strict mode remains fail-closed, generated output is deterministic, and no game behavior changed.

REQUIRED COMMANDS
npm ci
npm run typecheck
npm run test:ci
npm run verify:generated-content
git diff --check

REMOTE ACCEPTANCE
Both GitHub Build and Test workflows must pass on Ubuntu. A Windows-only local pass is not acceptance.

ALLOWED FINAL VERDICT
CI_BASELINE_ACCEPTED or CI_REPAIR_NEEDS_REVISION.

Do not merge the Phase 3 documentation PR until the standalone CI repair is accepted and its exact commit has been integrated and rechecked.
```
