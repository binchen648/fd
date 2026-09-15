# P3-R27 FB2-09 Any-Location-Except-Workshop Movement Review

Date: 2026-09-16
Role: R
Status: GATE_A_B_CANDIDATE_ACCEPTED
Candidate: `8c3667fc725520f3aed024a15afdd39cfbda2a0a`
Handoff: `eceb487b6e61eaecf7eb7ff00cef74ecd98eb0e4`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Verdict

ACCEPT the exact FB2-09 candidate as one narrow identity-free Movement contract. The accepted route is limited to active-source action-phase controller movement to one enabled location selected from all legal locations except the Magic Workshop. Broad Movement is not accepted.

## Reviewed implementation boundary

The candidate changes exactly:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/tests/regression/fb2-any-location-except-workshop-movement.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- the B2 result report.

No authoring migration occurs. Exact frozen 12-ID strings occur zero times in runtime ability files.

## Accepted semantic shape

- `phase_action`;
- phase `action`;
- window `controller_action_window`;
- source state `active`;
- exactly one `location` target with cardinality `1..1`;
- target constraints exactly one `any_enabled_location` and one `not_location_kind: workshop`;
- exactly one `move_player` effect to that declared target, controller only;
- no condition, cost, creates, rule modifiers, lifecycle, response opening, visibility payload, or limit.

The classifier is identity-free. Recognizable malformed near-matches fail closed before the legacy effect switch. One-step/reachable-arrow movement is outside the candidate envelope and remains unaffected.

## Typed movement and authoritative side effects

R27 confirms that the accepted route executes `move_player` through Resolution Data-flow rather than the generic legacy effect path. `movedCount` is represented in the result schema and common binding evaluator.

The typed primitive requires a trusted interpreter hook. That hook re-resolves the declared target and current candidate set before mutation, moves only the controller, and reuses existing authoritative movement accounting and event production. Because the Resolution transaction works on a cloned state, movement side effects are committed atomically with the typed resolution.

Independent behavioral checks cover:

- current location excluded;
- Magic Workshop excluded;
- disabled location excluded;
- occupancy limit honored both before activation and at settlement revalidation;
- active movement lock suppresses activation;
- legal movement updates location, movement distance, battlefield counter, movement log, and trusted enter-location event provenance;
- stale target rejection is mutation-free;
- malformed same-family ability fails closed;
- arrow movement is not absorbed.

## Independent validation

- exact candidate SHA pinned: PASS;
- diff check versus handoff: PASS;
- runtime frozen-identity hits: 0;
- authoring diff: 0;
- typecheck: PASS;
- focused Movement + Resolution Data-flow: 2 files / 22 tests PASS;
- all rules regressions: 48 files / 287 tests PASS;
- generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- full CI: 115 files / 700 tests PASS.

## Not promoted

This review does not accept arbitrary/broad `move_player`, forced or third-party movement, deployment, arrow/range movement, movement costs or conditions, multiple movement effects, movement-rule modifiers, generic Target Selection, or any F1 migration.

A must independently recompute the frozen 12 identities before FM02 dispatch.
