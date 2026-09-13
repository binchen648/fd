# P3-B05 Clean Repack r1

- Document Role: RUNTIME_IMPLEMENTATION_RESULT
- Owner: Codex B
- Task: `P3-B05`
- Mechanic Family: `CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE`
- Accepted B04 Base: `56376bea590eda20d3c7d9ad359df1cabf4371d1`
- Historical B05 Implementation: `f0c8a51`
- Historical Branch Tip: `5f6b3fb`
- Branch: `codex/b-p3-b05-play-source-response-r1`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Repack Scope

The reachable historical B05 implementation contained the scoped runtime/tests/E2E, but its implementation commit also regenerated `artifacts/phase3-skill-coverage.json`, and the later branch-tip commit mixed coordinator task-index/handoff files into the same branch history.

This r1 candidate starts from the independently accepted clean B04 runtime target and replays only the B05-owned source-card response-play implementation/evidence. It excludes:

- `artifacts/phase3-skill-coverage.json`;
- `docs/agents/PHASE3-TASK-INDEX.md`;
- B05 handoff artifact/report alignment commit `5f6b3fb`.

No B05 runtime semantic change was made relative to historical implementation commit `f0c8a51`.

## Scoped Contract

Only Kayneth `volumen.extra-play` is migrated by this task:

- response ability at `controller_combat_action_window`;
- fixed `pay_mana(2)`;
- no targets and no creates;
- exactly one `play_source_card(face_up)` effect;
- source card must remain in the controller hand;
- legal response must be withheld when mana is below 2 or source is no longer in hand;
- exact eligible execution routes through typed data-flow and must not retry legacy `resolveEffect`.

## Retained B05 Files

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- `packages/rules/tests/regression/card-action-play-source-response.test.ts`
- `e2e/fd-volumen-extra-play-card-action.spec.ts`
- scoped B05 result / implementation reports
- this repack report

Hash comparison confirms every replayed historical B05 file is byte-identical to its content at `f0c8a51`.

## Fresh Verification

```text
npm.cmd run typecheck
PASS

npx.cmd vitest run \
  packages/rules/tests/regression/card-action-play-source-response.test.ts \
  packages/rules/tests/regression/card-action-play.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts \
  packages/rules/tests/executable-card-pack.test.ts \
  packages/rules/tests/regression/complex-skills-regression.test.ts
PASS: 5 files / 85 tests

node docs/audits/fd-card-action-play-inventory.mjs
PASS: PLAY inventory remains 1 eligible / 6 skipped and still assigns Volumen to the separate response-play contract.

npx.cmd playwright test -c playwright.config.ts \
  e2e/fd-volumen-extra-play-card-action.spec.ts \
  --project=chromium
PASS: 1 / 1

git diff --check
PASS
```

## Local Burn-Down Claim

```text
legacyPlaySourceResponseConsumerCount:            1 -> 0
newRuntimeSemanticRoutedPlaySourceResponseCount:  0 -> 1
dualCompatiblePlaySourceResponseCount:            1 -> 0
```

Global classifier/KPI synchronization is not modified by this B task.

## Handoff

This remains `IMPLEMENTATION_COMPLETE_CANDIDATE`. P3-R05 must independently review the exact r1 target before any Gate status or downstream acceptance is promoted.
