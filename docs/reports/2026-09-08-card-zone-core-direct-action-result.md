# CARD_ZONE_CORE_DIRECT_ACTION Result

- Date: 2026-09-08
- Phase: Phase 3 mechanic-family rollout
- Scope: exact direct card-zone semantic matches only
- Claim: `IMPLEMENTATION_COMPLETE_CANDIDATE` for Gate A/B/C; independent reviewer promotion remains pending
- Acceptance: independent reviewer required before any `COMPONENT_VERIFIED`, `SCENARIO_VERIFIED`, or `E2E_VERIFIED` promotion

## Scope

In scope:

- `move_all_remaining`
- exact semantic-form routing for the selected direct phase-action representative
- Result Binding consumption for `conversion-magic.preparation`

Out of scope:

- `PLAY` semantics, including Time Alter `play_selected_cards + draw_cards`
- `ADD_TO_ATTACK`
- `CREATE_AND_ACTIVATE`
- `ACTIVATE`
- `CLOSE`
- trigger-owned draw or card movement
- standalone `draw_cards` direct action
- standalone `move_card` direct action
- battle-result, defeat, hidden/private look, private target, pending payment, cost, lifecycle, modifier, power, scoring, or cleanup-dependent card-zone abilities
- roster-wide JSON or runtime migration

## Inventory

Command:

```powershell
node docs/audits/fd-card-zone-core-direct-action-inventory.mjs
```

Observed output:

```text
CARD_ZONE_CORE_DIRECT_ACTION inventory
sourceFiles=14
cardZoneAbilities=8
eligible=1
skipped=7

Eligible abilities
master.irisviel  master.irisviel.skill.conversion-magic  conversion-magic.preparation  move_all_remaining,adjust_mana
```

Skipped abilities:

```text
servant.artoriac / sc-artoriac-1.return-current-round-attack / move_card / hidden_or_private_information
servant.artoriac / sc-artoriac-2.pay-x-look-x-plus-two / look_at_deck_top,move_card,move_all_remaining / cost_payment
servant.drake / sc-drake-1.draw / draw_cards / trigger_or_non_phase_action
servant.drake / sc-drake-1.mount-summon / play_selected_cards / hidden_or_private_information
servant.ereshkigal / sc-ereshkigal-2.return-to-skill-zone / move_card / trigger_or_non_phase_action
servant.kintoki / sc-kintoki-3.golden-eater / move_card,branch,pay_mana,move_card,branch / mixed_non_card_zone_effect
master.kiritsugu / master.kiritsugu.skill.time-alter / time-alter.action / play_selected_cards,draw_cards / separate_contract:card_action_play_semantics
```

No standalone pure `draw_cards` direct representative exists in current real authoring data. Drake `sc-drake-1.draw` is a forced trigger and was intentionally skipped.

## Routing Change

- `conversion-magic.preparation` no longer relies on ability-id pilot routing.
- The Phase 3 reference pilot allowlist is empty.
- Routing is now selected by the accepted exact semantic form:
  - `move_all_remaining(hand -> discard, resultVar/bind) + adjust_mana(bound moved count)`
- Time Alter `play_selected_cards(controller hand attack target, face_down) + draw_cards(1)` belongs to `CARD_ACTION_SEMANTICS_MINIMAL_PLAY`, not this Card/Zone batch.
- Standalone `draw_cards` direct action and standalone `move_card` direct action are not routed by this slice and remain `NOT_VERIFIED`.
- Gate C inheritance and coverage use the exact accepted semantic shape only.
- Execution uses a broader Card/Zone route-candidate guard for the same two-node `move_all_remaining + adjust_mana(bound moved count)` graph, so corrupted migrated parameters enter data-flow validation and fail closed instead of falling back to legacy `resolveEffect`.

## Gate A Evidence

Implemented candidate evidence:

- primitive registry includes `move_all_remaining`; standalone `move_card`, `draw_cards`, and `play_selected_cards` remain out of scope for this slice;
- exact semantic classifier accepts the Conversion Magic shape without checking card or ability IDs;
- route-candidate validation sends classifier-mismatch corruptions of the migrated graph into data-flow fail-closed handling instead of legacy fallback;
- classifier rejects Time Alter play semantics, trigger-owned draw, private/hidden target play, raw move to `attack_area`, `activate_card_by_id`, `close_source_card`, unbound `move_all_remaining + adjust_mana`, standalone direct `draw_cards`, and standalone direct `move_card`;
- invalid result-field compiler validation remains fail-closed;
- existing data-flow transaction rollback covers later-node failure.

Command:

```powershell
npx vitest run packages/rules/tests/regression/card-zone-core-direct-action.test.ts packages/rules/tests/regression/resolution-dataflow.test.ts
```

Result: current focused test count is recorded by the validation run for this checkout.

## Gate B Evidence

Implemented candidate evidence:

- Irisviel `conversion-magic.preparation` compiles from canonical authoring JSON through the executable pack and runs in `MatchSession.dispatchPlayerAction`.
- Conversion Magic moves all controller hand cards to discard, binds actual moved count, and applies mana from that count.
- Corrupted migrated Conversion Magic graph returns `resolution_failed` through `MatchSession.dispatchPlayerAction` without moving cards, changing mana, or falling back to legacy `resolveEffect`.
- Time Alter is intentionally excluded from Card/Zone routing and remains owned by the separate PLAY semantic contract.

## Gate C Evidence

Current checkout status, 2026-09-09: `IMPLEMENTED_UNVERIFIED`; implementer Gate C candidate evidence exists and independent reviewer promotion is pending.

Implemented candidate command:

```powershell
npx playwright test -c playwright.config.ts e2e/fd-conversion-magic-core-primitive.spec.ts --project=chromium
npx playwright test -c playwright.config.ts e2e/fd-conversion-magic-core-primitive.spec.ts --project=chromium --repeat-each=5
```

The candidate path covers:

- browser activation in the advance phase;
- WebSocket `expectedRevision`;
- server-authoritative CAS: raw hub and WebSocket mutation commands missing `expectedRevision` are rejected with `missing_expected_revision` before phase, revision, or logs can change;
- remote socket lifecycle hardening for overlapping same-client reconnects, with server regression coverage for old socket close races;
- client-side mutation guard: remote dispatch/end-turn is not sent without a numeric current match revision;
- server projection of hand-to-discard movement;
- mana gain from actual moved count: the fixture leaves two real hand cards plus one non-hand decoy, and final mana increases by 2, not by any expected/assumed count;
- reconnect consistency;
- stale replay rejection.

## Metrics

```text
pilotAbilityIdRoutes.before=1
pilotAbilityIdRoutes.after=0
legacyCardZoneDirectConsumerCount.before=1
legacyCardZoneDirectConsumerCount.after=0
newRuntimeSemanticRoutedCount.before=0
newRuntimeSemanticRoutedCount.after=1
dualCompatibleCount.before=1
dualCompatibleCount.after=0
remainingSkippedCount.after=7
```

## Gate C Non-Inheritance

Skipped abilities cannot inherit this batch's Gate C if they introduce any of:

- trigger timing;
- battle-result, battle winner, battle loss, defeat, scoring, or cleanup dependency;
- hidden/private choice, private look, or private target;
- pending payment or variable cost;
- raw move to `attack_area` or `field`;
- standalone direct `draw_cards` or standalone direct `move_card`;
- `ADD_TO_ATTACK`, `CREATE_AND_ACTIVATE`, `ACTIVATE`, or `CLOSE`;
- lifecycle, source-close, modifier, or power interaction.

## Known Legacy Paths Retained

- legacy `resolveEffect` remains for non-exact card-zone effects;
- trigger-owned Drake draw and Ereshkigal return-to-skill remain out of scope;
- hidden/private Artoria Caster look/move effects remain out of scope;
- Kintoki Golden Eater remains governed by the Result Binding Golden Card contract, not this direct card-zone batch;
- Card Action semantics are not promoted by this slice.
