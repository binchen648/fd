# P3-FB2-02 Deployment Resource Reward Result

- Date: 2026-09-16
- Role: B2
- Status: IMPLEMENTATION_COMPLETE_CANDIDATE
- BaseCommit: `078d36b52fb066c64cdbbab98391273d2e06be8f`
- F1Evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- RuntimeRequest: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`
- ReferenceCommit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Implemented scope

Implemented one identity-free deployment Resource Numeric sub-contract in `packages/rules/src/ability/interpreter.ts`.

Accepted shape:

- `forced_trigger`;
- trigger exactly `after_player_deployed_to_battlefield`;
- non-empty `activation.eventLocationId`;
- no phase/manual opens/source-state requirement;
- no condition, target, cost, create, lifecycle, modifier, limit, or response window open;
- exactly one or two effects;
- effects limited to controller `adjust_mana` / `adjust_victory_points`;
- every amount is a fixed positive safe integer;
- effect objects contain no hidden semantic fields beyond `type`, optional `player`, and `amount`;
- trusted event `playerId` must equal the source controller for this exact sub-contract;
- trusted event `locationId` must match `activation.eventLocationId`.

The implementation reuses the existing typed Resolution Data-flow transaction. No new resource primitive was added.

## Controller provenance fix

The generic event collector previously scoped `after_controller_*` events by controller but `after_player_deployed_to_battlefield` is intentionally broader because Ereshkigal has an existing "any player deploys here" behavior.

FB2-02 therefore does **not** globally narrow deployment events. It adds the controller check only when the ability structurally matches the new deployment-resource candidate with an explicit `eventLocationId`.

Result:

- the new own-deployment reward cannot fire on another player's deployment;
- Ereshkigal's existing any-player deployment behavior remains unchanged.

## Fail-closed behavior

Recognized deployment-resource candidates that do not satisfy the exact semantic are rejected before legacy fallback.

Rejected shapes include:

- missing deployment location;
- different trigger;
- zero, negative, fractional, or expression amount;
- third resource effect;
- command-seal adjustment;
- movement/non-resource effect;
- target-bearing shape.

`processAbilityEvent` already executes in a cloned event transaction, and Resolution Data-flow executes resource effects in its own cloned working state. A malformed recognized sibling therefore leaks no partial resource/event mutation.

## Focused proof

New regression:

- `packages/rules/tests/regression/fb2-deployment-resource-reward.test.ts`

It proves:

1. identity-free classification;
2. one-resource typed mana reward;
3. two-resource typed mana + VP reward;
4. controller provenance;
5. location provenance;
6. ordinary movement does not satisfy deployment semantics;
7. stable event replay exactly once;
8. malformed sibling atomic fail-closed behavior;
9. Ereshkigal any-player deployment compatibility.

Focused compatibility command:

`vitest run fb2-deployment-resource-reward + trigger-resource-runtime + complex-skills-regression + fb2-fixed-controller-mana-cost`

Result: `4 files / 58 tests PASS`.

## Validation

- `npm.cmd run typecheck` — PASS.
- all rules regression — `41 files / 247 tests PASS`.
- `npm.cmd run verify:generated-content` — PASS.
  - content library: `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- first standard `npm.cmd run test:ci` attempt: `659 PASS / 1 timeout` on the pre-existing eleven-round MatchSession 5-second smoke.
- immediate MatchSession file rerun: `26/26 PASS`; eleven-round smoke completed in ~1.4s.
- second unchanged standard `npm.cmd run test:ci`: `108 files / 660 tests PASS`.
- `git diff --check` — PASS.

The first CI timeout is the same load-sensitive smoke previously observed in review lanes; the unchanged rerun is fully green and no deterministic production regression was identified.

## Scope audit

Production added-line audit found zero matches for:

- affected F1 character names;
- `master.` / `servant.` identity routing;
- `magic_workshop` hard-code;
- printed-text parsing;
- direct definition-id equality routing.

No changes to:

- `packages/rules/src/match-session.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts`;
- client/server projection or interaction protocols;
- F1 inventory/catalog/source evidence;
- A-owned coverage taxonomy/KPI;
- roster authoring/migration files.

No new browser Gate C is required because projection, reconnect, stale-command, and pending-interaction surfaces are unchanged.

## Non-promotion

This candidate does not accept or promote:

- all `GENERIC_RESOURCE_NUMERIC`;
- generic Trigger Gateway;
- ordinary movement entry rewards;
- battle rewards;
- command-seal resource changes;
- resource transfer/set/swap;
- negative or variable resource adjustment;
- target-dependent resource effects;
- Cost/Payment beyond already accepted FB2-01;
- any F1 migration.

Independent P3-R19 review is required before acceptance.