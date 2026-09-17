# P3-FB2-03 Fixed Controller Mana/VP Adjustment Component Result

- Date: 2026-09-16
- Role: B2
- Status: IMPLEMENTATION_COMPLETE_CANDIDATE
- BaseCommit: `0f60d2d62448f1f8c1c98cbc441b1bead0c47cef`
- F1Evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- RuntimeRequest: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`

## Implementation

Added identity-free `isFixedControllerResourceAdjustmentComponent` in `packages/rules/src/ability/interpreter.ts`.

Accepted effect component:

- `adjust_mana` or `adjust_victory_points`;
- controller player, implicit or explicit;
- fixed safe-integer literal amount;
- no extra semantic fields beyond `type`, `player`, `amount`.

No new execution route was added. The component is reused by:

- the already accepted TO-11 location-entry Resource Numeric parent;
- the already accepted FB2-02 deployment Resource Numeric parent.

FB2-02 retains its additional positive-amount and deployment provenance restrictions. TO-11 retains its exact trigger/location parent restrictions. An unsupported parent with a matching resource effect remains outside both routes and the direct-action route.

## F1 alignment

A handoff froze 59 F1 identities whose complete Resource Numeric contribution is fixed positive-magnitude controller gain/loss Mana/VP. Source gain/loss maps mechanically to signed runtime adjustment. This implementation provides the reusable component for those 59 identities but does not migrate any authoring and does not claim their parent routes are accepted.

Explicit exclusions remain command seals, payment, set, transfer, swap, linked/third-party resource semantics, variable/expression source magnitude, and non-controller target semantics.

## Typed resource behavior

No Resolution Data-flow primitive was changed or duplicated. Focused proof confirms existing authoritative behavior remains:

- Mana gain honors cap and reports requested vs actual delta;
- Mana gain-block produces typed no-op with no resource event;
- Mana loss floors at zero and reports actual negative delta;
- VP loss floors at zero and reports actual negative delta;
- original source state is not mutated by direct Resolution execution before commit.

## Validation

- typecheck: PASS
- focused FB2-03 + TO-11 + FB2-02 + FB2-01: `4 files / 26 tests PASS`
- all rules regression: `42 files / 252 tests PASS`
- deterministic generated content: PASS
  - content library `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- full root CI: `109 files / 665 tests PASS`
- `git diff --check`: PASS

## Scope audit

Production added-line audit: zero matches for `master.`, `servant.`, named F1 members, location IDs, printed-text parsing, or direct definition-id equality routing.

No changes to MatchSession, Resolution Data-flow primitives, client/server projection, F1 artifacts, roster authoring, or A-owned KPI/taxonomy.

No browser Gate C is required because no projection, pending interaction, reconnect, stale-command, or client protocol surface changed.

## Non-promotion

This candidate does not promote broad `GENERIC_RESOURCE_NUMERIC`, generic parent routing, Trigger Gateway, Condition, Power, Battle, Card Zone, Interaction, Lifecycle, command-seal resource semantics, set/transfer/swap, variable resource expressions, or any F1 migration.

Independent P3-R20 review is required.