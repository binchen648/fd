# P3-B08 Runtime Baseline Recovery r1

- Document Role: RUNTIME_RECOVERY_IMPLEMENTATION
- Owner: Codex B recovery lane
- Task: `P3-B08`
- Branch: `codex/b-p3-b08-recovery-r1`
- BaseCommit: `bd1d9ac73e42c21fb9078097313df259b2cb5738`
- RepackedFrom: `76dbbd92a17ed1a9c89236a4d3db0cb7aea02cbf`
- Accepted B07 replacement base: `bd1d9ac73e42c21fb9078097313df259b2cb5738` (fresh review evidence `50a62e3fec6565016e261731bacfd599d1941099`)
- Historical accepted B08 object: unavailable in the current local/remote Git object graph
- MechanicFamily: `CARD_ACTION_SEMANTICS_MINIMAL:CLOSE`
- Representative: Artoria Alter `sc-artoria-alt-2.angra-mainyu-embrace`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE_R1`
- GateClaim: `NONE`

## Recovery Boundary

This r1 repacks the recovered B08 CLOSE delta onto the freshly accepted replacement B07 runtime base. It does **not** claim to be the original accepted B08 commit and does not inherit historical independent acceptance. A fresh Codex R review of the exact r1 commit is required before this recovery stack can be used as an accepted downstream baseline.

No coverage KPI, taxonomy classifier, evidence-promotion rule, authoring data, targeted-close behavior, response-window close, broad Lifecycle gateway, or unrelated card-action contract is changed.

## Recovered Contract

The migrated route is selected only by the exact semantic form:

- `kind = residual`
- trigger `on_card_played`
- open timing `immediate`
- condition `source_card_in_zone(field)`
- condition `event_played_card_has_attribute(宝具)`
- no targets, costs, or creates
- exactly one `close_source_card` effect

No card id or ability id participates in route eligibility.

Before mutation, the source card must exist, be controlled by the ability controller, be in `field` or `attack_area`, have a compiled definition, be active, and be face up. Success moves the source to `skill`, restores owner-only visibility, marks it inactive face-up, emits `source_card_closed`, and produces a typed result with `closedCount = 1`.

Malformed data-flow graphs fail closed as `resolution_failed`. Non-matching CLOSE shapes continue on their existing path and do not inherit this slice.

## Modified Files

- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- `packages/rules/tests/regression/card-action-close.test.ts`
- `e2e/fd-artoria-alt-close-card-action.spec.ts`
- this recovery report

## Focused Verification

```text
npx vitest run \
  packages/rules/tests/regression/card-action-close.test.ts \
  packages/rules/tests/regression/card-action-activate.test.ts \
  packages/rules/tests/regression/card-action-add-to-attack.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts \
  packages/rules/tests/regression/complex-skills-regression.test.ts \
  packages/rules/tests/regression/card-zone-core-direct-action.test.ts
PASS: 6 files / 77 tests

npm run typecheck
PASS

npm run e2e:fd-remote -- e2e/fd-artoria-alt-close-card-action.spec.ts
PASS: 1 / 1

git diff --check
PASS
```

The focused suite proves a real MatchSession noble-phantasm play closes the active Artoria Alter source through typed data-flow, emits the close/result events, does not close on a non-noble play, rejects inactive/face-down source state without mutation, and classifies the route by semantic shape rather than identity. It also preserves the accepted replacement B07 ACTIVATE, B06 ADD_TO_ATTACK, Card Zone, generic result-binding, and complex-skill regressions.

The fresh Gate C test restores a real remote room with Artoria Alter's residual source active and the canonical noble phantasm legally playable from `skill`. A browser-side WebSocket dispatches `play_card` with `expectedRevision`; the server processes `on_card_played`, closes the residual source, projects the source back in `skill` and the noble phantasm in `attack_area`, preserves that state after reconnect, and rejects stale replay without repeating the projected CLOSE `effect_resolved` event.

## Full Rules Baseline Comparison

Recovery stack:

```text
npx vitest run packages/rules/tests
41 passed files / 9 failed files
345 passed tests / 19 failed tests
```

The same 19 failures are present on the accepted replacement B07 base. Eighteen are missing historical CHM/image evidence paths (`D:\fd\chm-extract` or local `chm-extract`), and one is the existing generated-content definition-hash mismatch in `golden-card-content-pipeline.test.ts`. B08 r1 adds five passing CLOSE tests and introduces no additional full-suite failure.

## Review Boundary

This commit is a replacement candidate for the lost B08 runtime object, not a reconstruction of its Git identity. It cannot restore historical acceptance by itself. A fresh reviewer must promote the exact r1 target before B10 is repacked onto it. The already accepted B10 r1 semantic delta will then be moved onto the newly accepted B08 replacement base rather than inheriting the obsolete B07/B08 recovery chain.
