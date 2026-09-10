# P3-B05 Runtime Implementation Report

Document Role: AGENT_IMPLEMENTATION_REPORT
Agent: Codex B
Task: P3-B05
Mechanic Batch: CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE
Branch: codex/b-p3-b05-play-source-response
Status: IMPLEMENTATION_COMPLETE_CANDIDATE

This is implementer evidence only. Gate promotion requires independent review.

## Scope

Implemented only Kayneth `volumen.extra-play` as the independent source-card response play contract:

- `response` ability triggered by `controller_combat_action_window`;
- explicit `responseWindow.opens = controller_combat_action_window`;
- fixed `pay_mana(2)`;
- no targets and no creates;
- one `play_source_card(face_up)` effect;
- source card must still be in the controller hand at legal-action projection and server revalidation.

This does not migrate variable payment, pending payment, normal play batches, Time Alter `play_selected_cards`, Drake hidden/power/lifecycle play, ADD_TO_ATTACK, CREATE_AND_ACTIVATE, ACTIVATE, CLOSE, recursive trigger semantics, or roster-wide JSON.

## Implementation

- Added typed `play_source_card` data-flow primitive with `playedCount` result schema.
- Added exact semantic classifier `isPlaySourceCardWithCostResponse()`.
- Routed exact Volumen response play through `executeResolutionEffects()`.
- Added compiler fail-closed validation for exact source-card response play shape.
- Withheld legal response actions when the source card is no longer in hand or controller mana is below 2.
- Fixed response-window cleanup after data-flow execution so `resolve_response` does not shift a stale runtime object after `Object.assign()`.
- Aligned the Phase 3 coverage classifier to the same exact B05 contract: `response`, exact trigger/window, no targets, no creates, single `play_source_card(face_up)`, and fixed `pay_mana(2)`.
- Updated the primitive matrix current-boundary evidence summary to include `e2e/fd-volumen-extra-play-card-action.spec.ts` for Volumen only.

## Before / After

A corrected automation global KPI remains stable because it already classifies Volumen as a semantic route:

```text
newRuntimeSemanticRouted: 8 -> 8
legacyResolveEffect: 53 -> 53
dualRuntime: 0 -> 0
legacyExecuteAbility: 3 -> 3
notClassifiable: 28 -> 28
```

Focused B05 runtime ownership:

```text
legacyPlaySourceResponseConsumerCount.before=1
legacyPlaySourceResponseConsumerCount.after=0
newRuntimeSemanticRoutedPlaySourceResponseCount.before=0
newRuntimeSemanticRoutedPlaySourceResponseCount.after=1
dualCompatiblePlaySourceResponseCount.before=1
dualCompatiblePlaySourceResponseCount.after=0
```

The B04 `CARD_ACTION_SEMANTICS_MINIMAL_PLAY` skipped list still reports Kayneth `volumen.extra-play` as `separate_contract:play_source_card_response`; that is intentional because B05 owns this separate contract.

## Verification

```text
node docs/audits/fd-card-action-play-inventory.mjs
PASS: sourceFiles=14, cardActionSemanticAbilities=7, eligible=1, skipped=6
```

```text
npx vitest run packages/rules/tests/regression/card-action-play-source-response.test.ts packages/rules/tests/regression/card-action-play.test.ts packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/executable-card-pack.test.ts packages/rules/tests/regression/complex-skills-regression.test.ts
PASS: 5 files, 85 tests
```

```text
npm run typecheck
PASS
```

```text
npx playwright test -c playwright.config.ts e2e/fd-volumen-extra-play-card-action.spec.ts --project=chromium
PASS: 1 test
```

```text
npx playwright test -c playwright.config.ts e2e/fd-volumen-extra-play-card-action.spec.ts --project=chromium --repeat-each=5
PASS: 5 tests
```

```text
npm run content:compile
PASS: 7 masters, 7 servants, 20 events, 0 blocking issues
```

```text
npm run phase3:coverage
PASS: blockingIssues=0, newRuntimeSemanticRouted=8, legacyResolveEffect=53, dualRuntime=0, notClassifiable=28
```

```text
npm run test:ci
PASS: 83 files, 491 tests
```

## Evidence Boundary

`e2e/fd-volumen-extra-play-card-action.spec.ts` is restored-snapshot browser / WS / reconnect / stale-command candidate evidence. It verifies a restored combat response window through server-supplied `resolve_response`, expected revision dispatch, mana payment, source card face-up play to `attack_area`, projection, reconnect consistency, and stale replay rejection.

It does not prove natural battle progression into the Volumen response window or broader play-source-card inheritance.
