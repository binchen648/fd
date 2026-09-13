# P3-B08 Runtime Baseline Recovery

- Document Role: RUNTIME_RECOVERY_IMPLEMENTATION
- Owner: Codex B recovery lane
- Task: `P3-B08`
- Branch: `codex/b-p3-b08-recovery`
- BaseCommit: `7981f5b9cdea6cdcf59168b599576740c4ddc6e6`
- Historical accepted B08 object: unavailable in the current local/remote Git object graph
- MechanicFamily: `CARD_ACTION_SEMANTICS_MINIMAL:CLOSE`
- Representative: Artoria Alter `sc-artoria-alt-2.angra-mainyu-embrace`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- GateClaim: `NONE`

## Recovery Boundary

This commit reconstructs the historical B08 CLOSE runtime contract from the surviving task/report evidence. It does **not** claim to be the original accepted B08 commit and does not inherit historical independent acceptance. A fresh Codex R review is required before this recovery stack can be used as an accepted downstream baseline.

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
PASS: 6 files / 73 tests

npm run typecheck
PASS

git diff --check
PASS
```

The focused suite proves a real MatchSession noble-phantasm play closes the active Artoria Alter source through typed data-flow, emits the close/result events, does not close on a non-noble play, rejects inactive/face-down source state without mutation, and classifies the route by semantic shape rather than identity. It also preserves the recovered B07 ACTIVATE, B06 ADD_TO_ATTACK, Card Zone, generic result-binding, and complex-skill regressions.

## Full Rules Baseline Comparison

Recovery stack:

```text
npx vitest run packages/rules/tests
41 passed files / 9 failed files
341 passed tests / 19 failed tests
```

The same 19 failures were already present on the clean pre-recovery baseline and remained unchanged after B07 recovery. Eighteen are missing historical CHM/image evidence paths (`D:\fd\chm-extract` or local `chm-extract`), and one is the existing generated-content definition-hash mismatch in `golden-card-content-pipeline.test.ts`. B08 recovery adds five passing focused tests and introduces no additional full-suite failure.

## Review Boundary

This commit is a replacement candidate for the lost B08 runtime object, not a reconstruction of its Git identity. It cannot restore historical acceptance by itself. The next recovery step is B10 `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL`, including the two independently recorded B10 repair constraints: no card-id routing and fail-closed duplicate provenance handling. After B10 recovery, the reconstructed runtime stack requires fresh independent review before P3-B11 can start from it.
