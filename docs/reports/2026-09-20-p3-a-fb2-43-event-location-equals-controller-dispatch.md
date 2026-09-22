# P3-A FB2-43 Event-Location Equals Controller Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Baseline

- Exact formal migration Base: `64b4bb7a8b1379dd858c746e77f503b271950ec1` (R89 Darius s2 migration acceptance synchronization).
- Formal migration accepted: `145/944`.
- Formal remaining: `799`.
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

FB2-43 is identity-free B2 capability work only and earns zero frozen migration credit.

## Migration-credit-first readiness proof

The current `S_READY_NOW` queue is mechanically zero before opening FB2-43:

1. Immediately before FB2-42, the targeted current-baseline whole-card re-probe recorded in `2026-09-20-p3-a-fb2-42-controlled-card-close-forbid-dispatch.md` found no current `S_READY_NOW` at formal `144/944`.
2. FB2-42 added exactly one bounded new semantic: automatic `this_round` controlled-card `operation=forbid`, `rule=card_close`, selected by one structural `has_card_id` constraint.
3. An exact F1 scan at `59f145434695d29bdd17e4cb3adc887e84182377` shows `rule:card_close:forbid` on exactly one frozen identity, `servant.darius.skill.sc-darius-2`.
4. That identity is now independently R-accepted and A-synchronized to formal `145/944`. Its S migration changed consumer authoring/tests/report only and added no production runtime capability.
5. Therefore no previously blocked frozen consumer can become newly executable from the Darius s2 migration itself, and the pre-FB2-42 zero-ready proof remains valid after removing its sole newly unlocked consumer.

Historical `READY_GENERIC_EXTENSION` labels are not treated as current readiness proof.

## Nearest one-seam closure target

A targeted current-baseline probe selects `servant.siegfried.skill.sc-siegfried-2` (`恶龙之血铠`) as the nearest dependency-complete one-seam consumer.

Locked Reference whole-card semantics are:

- active source;
- controller servant true name already revealed;
- controller currently at a battlefield;
- an opponent moves to the controller's current location;
- close the source card;
- true-name-release card metadata / static card metadata remain ordinary servant-skill material.

The current runtime already provides every structural component except one exact event-location relation condition:

1. Reference `true_name_revealed` normalizes to the accepted server-owned `controller_servant_revealed` condition backed by `abilityRuntime.revealedServants`.
2. Reference `event_type_is: player.moved` normalizes to the existing authoritative `after_controller_enters_location` movement event. The core movement path emits that event for the player who moved with exact `playerId` and `locationId` after movement succeeds.
3. `event_player_is_opponent` is accepted by FB2-31.
4. `source_active` is accepted by FB2-32.
5. `at_battlefield`, `close_source_card`, ordinary action-card play, and servant-package reveal metadata are already supported.
6. A temporary whole-card normalization omitting only the missing event-location relation loads with `report=[]` and `mode=automatic`; adding the Reference relation is the sole semantic gap rather than a loader/card-action/lifecycle dependency.
7. Locked Reference contains exact type-only `{ "type": "event_location_equals_controller" }` occurrences only; no payload-specific selector is required for this seam.

The missing semantic is therefore exactly:

```json
{ "type": "event_location_equals_controller" }
```

## Exact implementation scope

Implement one narrow identity-free condition seam only.

1. Loader admits `event_location_equals_controller` only as the exact type-only shape above; any extra field is unsupported.
2. Runtime evaluation is valid only for the authoritative location-bearing movement event `after_controller_enters_location`.
3. The condition is true iff:
   - the event carries a non-empty `locationId`;
   - the ability controller exists and has a non-empty current `locationId`;
   - `event.locationId === controller.locationId` at evaluation time.
4. Missing/malformed event location, wrong event type, stale/nonexistent controller, or missing controller location fails closed to false without mutation.
5. The condition does not itself decide player relationship or battlefield status; callers must compose the already accepted `event_player_is_opponent` and `at_battlefield` conditions when required.
6. Do not add a generic event-field comparison DSL, arbitrary location selectors, identity routing, printed-text parsing, or aliases for unrelated event types.
7. Existing movement event emission/order and existing condition semantics remain unchanged.

## Forbidden scope

- no consumer `data/authoring/**` migration in B2;
- no Siegfried id/name/text/hash/handler routing in production;
- no generic `event_type_is` interpreter;
- no true-name subsystem changes;
- no new movement trigger, movement rule, card-close rule, lifecycle family, target-selection, or interaction work;
- no product/generated pack mutation;
- no merge or retarget;
- no migration credit.

## Required validation

Fresh B2 must prove at minimum:

- exact structural classifier/loader acceptance for type-only `event_location_equals_controller` and rejection of extra-field/wrong-type near forms;
- true for an authoritative `after_controller_enters_location` event whose `locationId` equals the current controller location;
- false for a different event location, wrong event type, missing/empty location, or malformed context;
- composition with accepted `event_player_is_opponent`, `controller_servant_revealed`, `source_active`, and `at_battlefield` closes a synthetic source only when an opponent actually enters the revealed controller's battlefield;
- self movement / opponent moving elsewhere / unrevealed controller / non-battlefield controller / inactive source do not close it;
- ordinary movement event emission remains unchanged;
- production hardcode audit is clean;
- typecheck, focused tests, rules src/core/regression, official CI, content validation, generated determinism, exact Locked Reference verification, client build, `git diff --check`, and final cleanliness all pass;
- formal migration remains `145/944`, remaining `799`.

After fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronizes FB2-43, immediately re-overlay `servant.siegfried.skill.sc-siegfried-2`. Dispatch singleton S only if that exact whole card is then mechanically zero-gap; otherwise do not credit it.
