# P3-FB2-09 Any-Location-Except-Workshop Movement Result

Date: 2026-09-16
Role: B2
Status: IMPLEMENTATION_CANDIDATE
Base handoff: `eceb487b6e61eaecf7eb7ff00cef74ecd98eb0e4`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Implemented narrow contract

This candidate implements only the identity-free phase-action Movement shape dispatched by A:

- action phase / controller action window / active source;
- exactly one location target with count `1..1`;
- exact target constraints `any_enabled_location` + `not_location_kind: workshop`;
- exactly one controller `move_player` effect referencing that target;
- no conditions, cost, creates, rule modifiers, lifecycle, response opening, visibility payload, or limit.

Recognizable near-matches fail closed before legacy movement. One-step arrow/reachable movement remains outside this classifier.

## Typed Resolution Data-flow

`move_player` is now represented as a typed Resolution Data-flow primitive rather than using the generic legacy effect switch for this accepted route. The result envelope exposes `movedCount` through the common binding schema/evaluator.

The primitive can only perform authoritative movement through a trusted runtime hook. The hook:

- resolves the declared target from server-owned authoring;
- re-computes the current legal destination set;
- rejects stale/illegal destinations before mutation;
- moves only the ability controller;
- reuses existing movement distance and battlefield counters;
- preserves the existing movement log payload/provenance;
- produces the trusted `after_controller_enters_location` event.

The Resolution engine runs on a cloned transaction state, so hook side effects remain atomic with the typed resolution.

## Behavioral boundaries proven

Focused tests prove:

1. identity-free exact classifier acceptance;
2. current location and Magic Workshop are excluded;
3. disabled locations and occupancy restrictions are honored;
4. active movement locks hide the action;
5. legal settlement moves exactly the controller and preserves movement counters/log/event provenance;
6. a stale occupancy change is revalidated and rejected mutation-free;
7. malformed same-family candidates fail closed before legacy mutation;
8. `reachable_along_arrows` one-step movement is not absorbed;
9. the new `move_player.movedCount` result schema field is consumable by the shared data-flow evaluator.

## Validation

- `npm.cmd run typecheck`: PASS.
- Focused Movement + Resolution Data-flow: 2 files / 22 tests PASS.
- All rules regressions: 48 files / 287 tests PASS.
- Full `npm.cmd run test:ci`: 115 files / 700 tests PASS.
- Generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- `git diff --check`: PASS.
- Exact 12 frozen F1 identity strings in runtime files: 0.
- Authoring migration diff: 0.

## Changed implementation scope

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- `packages/rules/tests/regression/fb2-any-location-except-workshop-movement.test.ts`

No F1 authoring is migrated by B2.

## Not promoted

This candidate does not accept broad Movement, arbitrary `move_player`, forced/third-party movement, deployment, arrow/range movement, movement costs/conditions, multi-effect movement, movement-rule modifiers, or generic target selection. FM02 remains blocked on independent R27 acceptance and fresh A reconciliation.
