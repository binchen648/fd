# P3-A FB2-14 current-main runtime materialization

Role: Codex A
Status: `MATERIALIZED_AND_VERIFIED`
Task: `FB2-14` prerequisite for `FM08`
Exact Base: `162d166f14b584c151e6820e68506ba2d9c24a83`
Accepted Candidate: `3879203870bb05ad9619c03c60c69ed9e1941080` (R2; original candidate `86afe51311ff2b6cd05ea403044e8e226b0cde7d`)
Accepted Reviewer: `62d355513d7fff66c4f3752f891f8ec326cf70f3`
Historical A-sync reference: `d52941c86cb06e69fa76c14bb1936a733748753f`

## Scope

Materialized only the accepted FB2-14 typed persistent RuleOverride runtime and its focused regression test on the exact current-main base. Three-way reconciliation retained the current-main FB2-02, FB2-11, and FB2-12 strict classifier guards; candidate-era broadening of those existing semantics was not carried forward. No FM08 authoring, coverage/generated artifacts, task-index/governance edits, credit, or A-sync was added.

Exact materialized files (14 runtime sources + 1 regression test):

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/core/combat-resolver.ts`
- `packages/rules/src/core/effect-resolver.ts`
- `packages/rules/src/core/movement.ts`
- `packages/rules/src/core/rule-overrides.ts`
- `packages/rules/src/core/situation-engine.ts`
- `packages/rules/src/index.ts`
- `packages/rules/src/match-session.ts`
- `packages/rules/src/phases/advance-phase.ts`
- `packages/rules/src/phases/preparation-phase.ts`
- `packages/rules/src/schema/game.ts`
- `packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`

## Verification

- `npm.cmd ci --offline --ignore-scripts`: PASS; 0 vulnerabilities.
- `npm.cmd run typecheck`: PASS.
- FB2-14 focused: PASS, 10 tests.
- Combined FB2-14 + FM05/06/07 + FB2-02/11/12 dependency focused set: PASS, 14 files / 87 tests.
- `npm.cmd run test:ci`: PASS, 120 files / 740 tests.
- `npm.cmd run content:validate`: PASS; 7 masters, 7 servants, 20 events, 0 blocking issues.
- `npm.cmd run verify:generated-content`: PASS; content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `git diff --check`: PASS.

The unfiltered `npm.cmd exec vitest run packages/rules/tests` aggregate was also exercised; 81 files / 595 tests passed, with 18 environment/evidence failures from unavailable `chm-extract` HTML paths outside this runtime delta. The CI command above excludes those external-evidence suites and is fully green.

## Acceptance boundary

This is A-owned dependency materialization evidence only. It does not perform A-sync, migration credit, FM08 authoring, or merge. The existing accepted overlap remains unchanged until a fresh FM08 authoring review and A synchronization.
