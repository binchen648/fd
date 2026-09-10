# P3-B06 Add To Attack Runtime Implementation Report

Document Role: AGENT_IMPLEMENTATION_REPORT
Agent: Codex B
Task: P3-B06
Mechanic Batch: CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK
Branch: codex/b-p3-b06-add-to-attack
Status: IMPLEMENTATION_COMPLETE_CANDIDATE

This is implementer evidence only. Gate promotion requires independent review.

## Scope

Implemented only Maiya `military.attach-support-shot` as the independent add-to-attack contract:

- `phase_action` ability in `advance` with `controller_action_window`;
- canonical `not(controller_at_battlefield)` condition;
- exactly one `supported_player` target with `not_controller` and count 1..1;
- fixed `pay_mana(2)`;
- no creates;
- one `attach_card_to_player_attack` effect;
- `cardId = master.maiya.deck.support-shot`;
- `returnAtRoundEnd = true`;
- `controllerCannotWinStatus = maiya_cannot_win_battle_this_round`;
- support-shot must still be in the controller skill zone at server revalidation.

This does not migrate support-shot `append_only_rule`, support-shot `suppress`, normal `PLAY`, `PLAY_SOURCE_CARD_WITH_COST_RESPONSE`, `CREATE_AND_ACTIVATE`, `ACTIVATE`, `CLOSE`, variable/pending payment, hidden/private choice, modifier/power calculation, trigger runtime, roster-wide JSON, or broad lifecycle cleanup.

## Implementation

- Added typed `attach_card_to_player_attack` data-flow primitive with `attachedCount` result schema.
- Added exact semantic classifier `isAddToAttackDirectAction()`.
- Routed exact Maiya add-to-attack through `executeResolutionEffects()`.
- Added compiler/runtime fail-closed validation for the exact semantic shape.
- Revalidated support-shot source ownership and `skill` zone before spending mana or opening target selection.
- Kept target selection server-projected and server-revalidated, rejecting self-target and unavailable players.
- Attached support-shot to the chosen non-controller player's `attack_area`, recorded `modeState.supportShotAttachments`, emitted `attack_added`, and created the scoped cannot-win status marker.

The B06 worktree starts from the accepted post-P3-B05 branch. The add-to-attack runtime implementation is already present in that history through the earlier scoped runtime commit; this B06 branch records the task-specific evidence and current verification against the P3-B06 handoff.

## Before / After

Accepted post-P3-B05 global automation KPI remains stable because A's corrected taxonomy already classified the exact ADD_TO_ATTACK semantic route:

```text
newRuntimeSemanticRouted: 8 -> 8
legacyResolveEffect: 53 -> 53
dualRuntime: 0 -> 0
legacyExecuteAbility: 3 -> 3
notClassifiable: 28 -> 28
```

Focused B06 runtime ownership:

```text
legacyAddToAttackConsumerCount.before=1
legacyAddToAttackConsumerCount.after=0
newRuntimeSemanticRoutedAddToAttackCount.before=0
newRuntimeSemanticRoutedAddToAttackCount.after=1
dualCompatibleAddToAttackCount.before=1
dualCompatibleAddToAttackCount.after=0
remainingSkippedCardActionCount.after=6
```

Skipped card-action abilities remain skipped:

```text
master.kayneth volumen.extra-play out_of_scope:play_semantics
master.kiritsugu time-alter.action out_of_scope:play_semantics
master.maiya support-shot.append-only out_of_scope:append_only_rule_marker
master.olga-marie astronomical-science.first-loss out_of_scope:activate_semantics
servant.artoria-alt sc-artoria-alt-2.angra-mainyu-embrace out_of_scope:close_semantics
servant.drake sc-drake-1.mount-summon out_of_scope:play_semantics
```

## Verification

```text
node docs/audits/fd-card-action-add-to-attack-inventory.mjs
PASS: sourceFiles=14, cardActionSemanticAbilities=7, eligible=1, skipped=6
```

```text
npm run typecheck
PASS
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
npx vitest run packages/rules/tests/regression/card-action-add-to-attack.test.ts packages/rules/tests/executable-card-pack.test.ts
PASS: 2 files, 33 tests
```

```text
npx playwright test -c playwright.config.ts e2e/fd-add-to-attack-card-action.spec.ts --project=chromium --repeat-each=5
PASS: 5 tests
```

```text
npm run test:ci
PASS: 83 files, 491 tests
```

## Evidence Boundary

`e2e/fd-add-to-attack-card-action.spec.ts` is restored-snapshot browser / WS / reconnect / stale-command candidate evidence. It verifies a restored advance-phase room through server-supplied activation and target selection, expected revision dispatch, mana payment, pending target reconnect, support-shot attachment projection, post-settlement reconnect consistency, and stale target replay rejection.

It does not prove natural create/select/start progression into this action window, support-shot suppress behavior, append-only passive ownership, or general card-action inheritance.
