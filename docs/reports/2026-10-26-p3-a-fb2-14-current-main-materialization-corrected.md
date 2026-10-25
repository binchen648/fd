# P3-A FB2-14 corrected current-main runtime materialization

Role: Codex A
Status: `MATERIALIZED_AND_VERIFIED`
Task: `FB2-14` prerequisite for `FM08`
Exact Base: `162d166f14b584c151e6820e68506ba2d9c24a83`
Historical accepted parent→candidate: `86afe51311ff2b6cd05ea403044e8e226b0cde7d` (R2 correction `3879203870bb05ad9619c03c60c69ed9e1941080`)
Historical Reviewer reference: `62d355513d7fff66c4f3752f891f8ec326cf70f3` (reviewed old candidate only; not used as current-main acceptance)

## Scope correction

Rebuilt from the exact Base using only the historical FB2-14 parent→candidate runtime/test delta, with current-main three-way preservation. Removed candidate-era scope drift: the old Magic Resistance route/classifier, the `cleanupOngoing` `o.cleanup` condition change, and the current FB2-13 Alter Ego `uses` classifier change. Historical reviewer/result artifacts were not carried forward.

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

No FM08 authoring, coverage/generated artifacts, task-index/governance edits, A-sync, credit, or merge was added.

## Verification

- FB2-14 focused: PASS, 10 tests.
- Current dependency combined focused (FM05/06/07 + FB2-02/11/12): PASS, 14 files / 87 tests.
- `npm.cmd run test:ci`: PASS, 120 files / 740 tests.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run content:validate`: PASS; 7 masters, 7 servants, 20 events, 0 blocking issues.
- `npm.cmd run verify:generated-content`: PASS; unchanged hashes: content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `git diff --check`: PASS.

This report is A-owned materialization evidence only. FM08 authoring, acceptance credit, and A synchronization remain separate follow-up gates.
