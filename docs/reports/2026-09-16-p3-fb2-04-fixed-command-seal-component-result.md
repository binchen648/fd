# P3-FB2-04 Fixed Controller Command-Seal Component Result

Date: 2026-09-16
Role: B2
Status: IMPLEMENTATION_COMPLETE_CANDIDATE

## Baseline

- A handoff: `61162f0cfc25014a0a6f0bde73802ff5d00d662f`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Request: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`.

## Implementation

- Added identity-free `isFixedControllerCommandSealAdjustmentComponent` in `packages/rules/src/ability/interpreter.ts`.
- Exact component shape: `adjust_command_seals`, implicit/explicit controller, non-zero safe-integer literal amount, optional non-empty string `directive`.
- Reused the component inside the accepted B13 battle-loss resource classifier.
- Reused the component for the command-seal branch of `RESOURCE_NUMERIC_CORE_DIRECT_ACTION` while intentionally preserving the pre-existing Mana/VP parent-classifier behavior and its frozen malformed-definition rejection path.
- Kept the existing Resolution Data-flow `adjust_command_seals` primitive as the only mutation/event owner. No duplicate primitive was added.
- Added focused regression `packages/rules/tests/regression/fb2-fixed-controller-command-seal-component.test.ts`.

## Compatibility correction during focused validation

The first focused run showed that routing every direct Resource Numeric effect through the stricter FB2-03/FB2-04 component predicates changed an existing malformed-Mana definition from the accepted `resolution_failed` path to an earlier `unsupported` path. That widening/tightening was not part of FB2-04, so the implementation was corrected: only the command-seal branch uses the new component in the direct-action parent; Mana/VP keep their existing accepted classifier behavior. The final focused suite preserves the original rejection contract.

## Evidence

- `npm.cmd run typecheck`: PASS.
- Focused compatibility: 6 files / 33 tests PASS.
  - FB2-04 component 4/4.
  - B13 battle-loss Resource Numeric 8/8.
  - Resource Numeric direct action 4/4.
  - FB2-03 component 5/5.
  - FB2-02 deployment reward 7/7.
  - FB2-01 fixed Mana cost 5/5.
- Rules regression: 43 files / 256 tests PASS.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Full `npm.cmd run test:ci`: 110 files / 669 tests PASS.
- `git diff --check`: PASS.
- Production identity/text audit: no card/master/servant/location/printed-text routing.
- Forbidden-file audit: no MatchSession, Resolution Data-flow, client/server, F1 evidence, authoring roster, or A KPI/taxonomy changes.

## Proven semantics

- Fixed positive and negative controller command-seal deltas classify by semantic shape, not identity.
- Existing `directive` metadata such as `spend_command_spell` and battle-loss directives remains compatible.
- Typed `command_seals_adjusted` events report requested/actual delta and before/after values from the existing primitive.
- A later underflow in the same resolution aborts atomically without mutating the input state or leaking events.
- Zero, fractional, variable/expression, third-party, all-opponent-style extra semantic fields, restore-all-style fields, and unrelated resource effects fail the component classifier.
- A matching component under an unsupported parent ability remains unroutable.

## Non-promotion

This candidate does not accept command-seal payment, all-opponent adjustment, same-battlefield-opponent adjustment, restore-all, generic Target Selection, Trigger Gateway, broad Resource Numeric, migration, or later-wave semantics.
