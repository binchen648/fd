# P3-FB2-05 Fixed Controller Set-Mana Result

Date: 2026-09-16
Role: B2
Status: IMPLEMENTATION_COMPLETE_CANDIDATE

## Baseline

- A handoff: `40444c1c6354f302712d87cc4f774c825b1ae099`.
- Runtime baseline before handoff: `8a3ce9fe318333cc9b1c0c0ea2f45d51ec588cf5`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Request: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`.

## Implementation

- Added typed Resolution Data-flow primitive `set_mana`.
- Added `SetManaResult` with `playerId`, `targetAmount`, `actualDelta`, `before`, and `after`.
- Registered `set_mana` in result schemas, primitive registry, raw normalization/coercion, data-flow result-field evaluation, and exhaustive test producers.
- `set_mana` accepts a controller target and a fixed safe-integer literal amount at the typed node boundary. Binding/expression amounts are rejected during normalization.
- Runtime exact-set semantics require `0 <= targetAmount <= authoritative mana cap`. Invalid/over-cap targets fail closed; values are never clamped.
- `manaGainBlocked` is deliberately ignored because exact assignment is not a gain operation.
- Non-zero actual delta emits the existing typed `mana_adjusted` event; setting to the current value is a typed no-op with no resource event.
- Transaction ownership remains in `executeResolution`; a later failure rolls back a prior exact set and emitted-event buffer.
- Added identity-free `isFixedControllerManaSetComponent` in `interpreter.ts`; it is not connected to any runtime parent route.
- No Trigger Gateway, game-start route, condition route, authoring migration, or KPI/taxonomy promotion was added.

## Test-wiring discoveries

Two focused failures were legitimate typed-primitive integration gaps rather than semantic defects:

1. The seeded-state fixture used by the new focused test does not initialize `abilityRuntime`, so the focused test now initializes a local synthetic runtime before testing mana caps/gain-block behavior. Production initialization was not changed.
2. The existing Resolution Data-flow regression enumerates every public `resultSchemas` entry and proves every exposed numeric field can be consumed by downstream binding evaluators. Adding `set_mana` therefore required both a synthetic `producerFor('set_mana')` and runtime `evaluateValue` support for `targetAmount`, `actualDelta`, `before`, and `after`. This is part of the typed primitive contract and keeps the exhaustive invariant green.

No implementation shortcut or route expansion was used to bypass either test.

## Evidence

- `npm.cmd run typecheck`: PASS.
- Focused typed/component compatibility: 5 files / 35 tests PASS.
  - Resolution Data-flow infrastructure 15/15.
  - FB2-05 set-mana 6/6.
  - FB2-04 command-seal component 4/4.
  - FB2-03 fixed Mana/VP component 5/5.
  - FB2-01 fixed Mana payment 5/5.
- All rules regressions: 44 files / 262 tests PASS.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Full root `npm.cmd run test:ci`: 111 files / 675 tests PASS.
- `git diff --check`: PASS.
- Production identity/text audit: NONE.
- Forbidden-file audit: no MatchSession, client/server, `data/phase3`, or `data/authoring` changes.

## Accepted-candidate boundary

This candidate supplies only the independent numeric primitive/component required by the five F1 `set_mana` rows. Those five rows remain blocked by their later parent semantics (Trigger/Condition/Lifecycle/Modifier/Special as recorded by A). The candidate does not make any of them runtime-routable by itself and does not claim migration readiness.

## Files

Production:
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/interpreter.ts`

Tests:
- `packages/rules/tests/regression/fb2-fixed-controller-set-mana.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
