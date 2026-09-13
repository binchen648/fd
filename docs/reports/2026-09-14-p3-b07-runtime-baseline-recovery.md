# P3-B07 Runtime Baseline Recovery

- Document Role: RUNTIME_RECOVERY_IMPLEMENTATION
- Owner: Codex B recovery lane
- Task: `P3-B07`
- Branch: `codex/b-p3-b07-recovery`
- BaseCommit: `bcc5d73e6064d750cc6b16e66ebb3dca00b69518`
- Historical accepted B07 object: unavailable in the current local/remote Git object graph
- MechanicFamily: `CARD_ACTION_SEMANTICS_MINIMAL:ACTIVATE`
- Representative: Olga-Marie `astronomical-science.first-loss`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- GateClaim: `NONE`

## Recovery Boundary

This commit reconstructs the historical B07 ACTIVATE runtime contract from the surviving task/report evidence. It does **not** claim to be the original accepted B07 commit and does not inherit its independent acceptance. A fresh Codex R review is required before this recovery commit can be used as an accepted downstream baseline.

No coverage KPI, taxonomy classifier, evidence-promotion rule, card authoring, broad Trigger gateway, broad Lifecycle gateway, or unrelated card-action contract is changed.

## Recovered Contract

The executable route is selected only by semantic shape:

- `kind = forced_trigger`
- trigger `after_controller_first_loses_battle`
- no conditions, targets, costs, or creates
- exactly one `activate_card_by_id(definitionId)` effect

No card id or ability id participates in route eligibility.

On the first-loss event, the runtime records a server-owned delayed activation for the current round instead of activating immediately. The formal `round_end` hook consumes that record. The target must already exist, belong to the controller, remain in `skill`, and not already be active. Success moves it to `field`, makes it public and active face-up, emits `card_activated`, and returns a typed result with `activatedCount = 1`.

Malformed semantic shapes, a missing target, a target outside `skill`, an already-active target, or a changed delayed semantic contract fail closed. `processAbilityEvent` and `advanceAbilityPhase` retain clone/commit transaction behavior, so a failing round-end dispatch does not partially commit the phase, revision, events, or delayed queue mutation.

`MatchSession.resolveBattlePhase()` already calls `advanceAbilityPhase(state, 'round_end', round)` on the production round path, so the recovered delayed activation uses the existing server-owned round-end transition rather than a test-only scheduler.

## Modified Files

- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/tests/regression/card-action-activate.test.ts`
- `packages/rules/tests/regression/complex-skills-regression.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- this recovery report

## Focused Verification

```text
npm run typecheck
PASS

npx vitest run \
  packages/rules/tests/regression/card-action-activate.test.ts \
  packages/rules/tests/regression/complex-skills-regression.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts \
  packages/rules/tests/regression/card-action-add-to-attack.test.ts \
  packages/rules/tests/regression/card-zone-core-direct-action.test.ts
PASS: 5 files / 68 tests
```

The focused suite proves delayed first-loss staging, formal round-end activation, `activatedCount` result-schema integration, duplicate staging suppression, invalid-zone transactional failure, semantic classifier id-independence, and preservation of the preceding B06/Card Zone regression slices.

## Full Rules Baseline Comparison

Recovery checkout:

```text
npx vitest run packages/rules/tests
40 passed files / 9 failed files
336 passed tests / 19 failed tests
```

Detached clean base `bcc5d73e6064d750cc6b16e66ebb3dca00b69518`, using the same installed dependencies:

```text
npx vitest run packages/rules/tests
39 passed files / 9 failed files
332 passed tests / 19 failed tests
```

The same 19 pre-existing failures occur on the clean base. Eighteen are missing historical CHM/image evidence paths (`D:\fd\chm-extract` or local `chm-extract`), and one is the existing generated-content definition-hash mismatch in `golden-card-content-pipeline.test.ts`. B07 recovery introduces no additional full-suite failure.

## Review Boundary

This recovery commit may be reviewed as a replacement candidate for the lost B07 runtime object. It must not be described as the historical accepted commit, and it does not by itself restore the lost B08/B10 accepted stack or authorize P3-B11. The next reconstruction step is B08 CLOSE from this candidate, followed by B10 setup create-to-skill and fresh independent acceptance of the recovered stack.
