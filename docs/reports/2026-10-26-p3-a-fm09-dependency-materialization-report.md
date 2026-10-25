# P3-A FM09 dependency materialization report

Role: Codex A (materialization only)
Task: `P3-FM09`
Exact Base: `1afe10ff9c1c1a65a0c2b68c56c5607cb0c1c447`
Candidate: `1a1c7afd1a5fe152f9913846336d957c7d615455`
Historical accepted inputs: FB2-15 `23a666913a3050ad55d781e3f5b3a1518add4c3e`, FB2-16 `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`, FB2-23 `1cfd6000f5627a282e2549d23e5a176ba983384f`

## Scope

Materialized only the three zero-credit runtime/test dependency gates in the required order: FB2-15 game-start skill provisioning, FB2-16 identity-free required-additional play, and FB2-23 Ryougi same-battlefield private-hand inspection with optional return. FM09 authoring, coverage/task-index/governance/generated-task artifacts, identity routing, and unrelated runtime were excluded. The generated content artifact is included only because the exact executable classifier deterministically changes Maiya's required-additional card classification.

## Exact files

- `data/generated/fd-playtest-v1.content-library.json` (deterministic classifier output only)
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/game-start-skill-provisioning.ts` (new)
- `packages/rules/src/ability/interaction-gateway.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/required-additional-play.ts` (new)
- `packages/rules/src/ability/types.ts`
- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/regression/fb2-game-start-skill-provisioning.test.ts` (new)
- `packages/rules/tests/regression/fb2-required-additional-play.test.ts` (new)
- `packages/rules/tests/regression/fb2-same-battlefield-private-hand-return-interaction.test.ts` (new)

## Verification

- Dependency focused + combined: PASS, 4 files / 65 tests.
- Existing batch focused: PASS as included by the dependency regression run; no unrelated test deltas were added.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS (`7 masters, 7 servants, 20 events, 0 blocking issues`).
- `npm run verify:generated-content`: PASS after deterministic generated artifact refresh.
- `git diff --cached --check`: PASS.
- Full `npm run test:ci -- --maxWorkers=2`: PASS, 123/123 files and 774/774 tests; golden-card pipeline 2/2 PASS with the refreshed generated definition hash.

No FM09 source authoring, credit/accounting, A-sync, merge, or retarget was performed.
