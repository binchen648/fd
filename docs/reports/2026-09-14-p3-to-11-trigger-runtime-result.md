# P3-TO-11 Trigger Runtime Result

- Date: 2026-09-14
- Task: P3-TO-11
- Owner lane: Codex B runtime
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Base: `427d3e2cdec2e55411559fbf6339ae6948851262`
- Branch: `codex/b-p3-to11-trigger-runtime`
- Accepted dependency: P3-TO-03 Trigger Gateway `SPEC_ACCEPTED`

## Scope

P3-TO-11 was limited to the first gateway-backed deployment/location Resource Numeric trigger slice, with a target of 1-2 representatives and no broad Trigger-family migration.

Representatives inspected:

1. `master.shinji.skill.drain-command#drain-command.enter-miyama`
   - event: `after_controller_enters_location`
   - policy: forced
   - effect owner: Resource Numeric `adjust_mana`
   - external dependency: none
   - result: **MIGRATED**
2. `servant.ereshkigal.skill.sc-ereshkigal-2#sc-ereshkigal-2.gain-mana-on-deploy`
   - event: `after_player_deployed_to_battlefield`
   - policy: forced
   - effect owner: Resource Numeric `adjust_mana`
   - external dependency: Battle/source battlefield identity
   - result: **SKIPPED — `SOURCE_BATTLEFIELD_ANCHOR_REQUIRED`**

Local slice result: **eligible=2 / migrated=1 / skipped=1**. No other strict trigger row is promoted by inheritance.

## Implementation

### Trusted location payload and semantic metadata

- Added authored `activation.eventLocationId = "miyama_town"` to the Shinji location trigger.
- Loader accepts `eventLocationId` only for reviewed location-bearing trigger types and records unsupported admission for invalid trigger/location combinations.
- Trigger discovery checks event location semantically through `triggerEventScopeMatches`; card/ability identity is not used for eligibility.

### Production event producers

- Normal action movement now emits trusted `after_controller_enters_location` only after a successful move.
- Ability-owned `move_player` already emits the same trusted event after a successful movement and now shares the same location predicate consumer behavior.
- Added `processAbilitySystemEvent`, which allocates event identity from the authoritative runtime sequence inside the cloned transaction rather than from client/business-field concatenation.
- MatchSession deployment event now carries `locationId`, satisfying the accepted Trigger Gateway minimum location identity envelope without claiming Ereshkigal runtime support.

### Typed resource settlement

A trigger is routed through Resolution Data-flow only when its semantic shape is all of:

- `forced_trigger`;
- `after_controller_enters_location`;
- explicit fixed `eventLocationId`;
- no conditions, targets, costs, creates, modifiers, lifecycle, response window, or limit;
- exactly one `adjust_mana` effect for the controller;
- integer amount.

The supported shape uses the existing typed `adjust_mana` primitive, including mana cap and mana-gain-block policy. A recognized location-resource trigger candidate that does not match the exact supported semantic shape fails with `resolution_failed`; there is no legacy effect fallback for that claimed slice.

## Fail-Closed / Authority Checks

- Runtime semantic routing contains no `master.shinji`, `drain-command.enter-miyama`, `servant.ereshkigal`, or `sc-ereshkigal-2.gain-mana-on-deploy` identity branch: **PASS (0 runtime hits)**.
- Missing or wrong event destination does not schedule Shinji: PASS.
- Duplicate delivery with the same trusted event ID performs no second mutation and no revision increment: PASS.
- Malformed recognized trigger-resource shape fails atomically; before/after serialized state is equal: PASS.
- Invalid `eventLocationId` placement is reported unsupported at loader admission: PASS.
- Mana cap and mana-gain-block behavior come from the typed Resource Numeric primitive: PASS.
- Failed/illegal normal movement emits no enter-location event because the producer is gated on `movement.moved`: PASS via core movement/game-loop regression.
- No client command accepts event payload, processed state, candidate set, or continuation state: unchanged.

## Generated Product Pack

The formal content compiler was run after the authoring change.

Generated product content now contains:

- `eventLocationId: "miyama_town"` for `drain-command.enter-miyama`;
- regenerated deterministic definition hash `8e9cf402f9f918693de5a19afc85ed582a9e236a547cb38818249d1f601fbc0e`.

Only `data/generated/fd-playtest-v1.content-library.json` changed among generated outputs. Golden compiled-content determinism/hash regression passes after regeneration.

## Verification

- `npm.cmd run typecheck`: **PASS**.
- Final focused suite:
  - `resolution-dataflow.test.ts`
  - `game-loop-action.test.ts`
  - `resource-numeric-core-direct-action.test.ts`
  - `trigger-resource-runtime.test.ts`
  - `complex-skills-regression.test.ts`
  - `match-session.test.ts`
  - result: **6 files / 91 tests PASS**.
- Golden compiled-content pipeline: **2/2 PASS**.
- Final root `npm.cmd test`:
  - **95 files total**
  - **85 passed / 10 failed**
  - **582 tests total**
  - **562 passed / 20 failed**
  - all 20 failures are inherited local CHM/original-image asset absence checks; the previous generated-content definition-hash mismatch is resolved.
- `git diff --check`: **PASS**.

## Residual Blocker

`sc-ereshkigal-2.gain-mana-on-deploy` is intentionally not routed by this slice. `CardInstance` and current `abilityRuntime.cardState` do not contain an authoritative source-battlefield anchor for the persistent Netherworld Protection card. Treating the controller's current location as the source card's battlefield would invent Battle/Lifecycle semantics. The row remains blocked as `SOURCE_BATTLEFIELD_ANCHOR_REQUIRED` until its external owner contract/runtime provides that identity.

## Gate / Review Judgment

This task claims only an implementation candidate for independent review.

- Gate A: **not self-promoted**.
- Gate B: **not self-promoted**.
- Gate C: **not claimed**; this slice does not change client projection or reconnect interaction state, and the queue requires C only if projection/reconnect changes.
- Global Trigger denominator/KPI: unchanged by this task.
- A-owned coverage/taxonomy artifacts: not regenerated or edited.

A fresh independent reviewer must pin the exact candidate commit, re-run the semantic-routing, fail-closed, movement-producer, idempotency, generated-content, and inherited-baseline checks, and return the Gate judgment.
