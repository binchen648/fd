# P3-TO-13 Interaction Runtime Result

- Date: 2026-09-14
- Task: `P3-TO-13`
- Owner lane: runtime hot-file owner
- Base: `0a392558407dbfba0631bd426be41e77ced5c48a`
- Prerequisites: P3-TO-05 `SPEC_ACCEPTED`; P3-TO-07 `REVIEW_ACCEPTED`; P3-TO-12 runtime lane released
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Runtime acceptance: **not claimed**; independent review is still required before any Gate A/B/C promotion or A03 burn-down synchronization

## Scoped representative

The first Interaction Runtime slice migrates exactly one strict-pending ability:

- Drake / `servant.drake.skill.sc-drake-1`
- ability: `sc-drake-1.mount-summon`
- semantic: action-phase, active source, exactly one private controller-hand `card_instance` target, cardinality `0..3`, one `base_power_at_most: 3` constraint, and one `play_selected_cards` effect

The route is classified by semantic structure only. Runtime routing contains no Drake card id, Drake ability id, localized name, or definition-id allowlist.

## Implementation

Added `packages/rules/src/ability/interaction-gateway.ts` with two separate checks:

1. a narrow structural candidate envelope used to claim malformed near-matches and fail closed;
2. an exact semantic classifier for the accepted private/optional hand-play representative.

For the accepted representative, the server now creates an interaction-backed pending record containing:

- stable server-generated interaction id;
- owner player id;
- source card instance id and ability id;
- `template: target`;
- `visibility: owner_only`;
- `cancelPolicy: forbidden`;
- authoritative candidate snapshot;
- target constraints (`card`, `0..3`, distinct);
- creation revision;
- server-only continuation reference.

The existing public command shape remains compatible with `choose_target`; however, the server-owned interaction metadata is authoritative. `continuationRef` is never projected to the client.

Settlement validates both candidate snapshot membership and current authoritative legality. A card that was not in the original snapshot cannot become selectable later merely because current state changes; a snapshotted card that moved or became illegal is rejected.

The continuation path was corrected so a validated server selection executes the remaining effect exactly once instead of recursively reopening the interaction.

## Projection / recovery

Owner projection receives safe interaction metadata and the snapshotted candidate ids. Non-owners receive only the existing redacted waiting state and no private candidate ids/count payload beyond what is already public through the match state.

`MatchSession` serialization/restoration preserves the same interaction id, source identity, creation revision, candidate snapshot and server continuation metadata. Reconnect therefore restores the same pending interaction rather than recreating one.

## Fail-closed evidence

Focused regression coverage proves rejection without state mutation for:

- wrong owner;
- duplicate target ids;
- a target not present in the server snapshot;
- a snapshotted target no longer legal in current state;
- corrupt continuation metadata;
- corrupt creation revision;
- terminal/replayed interaction id;
- malformed structural near-match at compiler admission;
- aggregate downstream payment failure.

Recognized malformed gateway candidates return a failure and do not fall back to legacy pending-target resolution.

## Scoped routing counters

These counters are scoped to the single TO13 representative only and are not A-owned global coverage metrics:

- scoped eligible abilities: `1`
- legacy strict-pending route: `1 -> 0`
- new Interaction Gateway route: `0 -> 1`
- dual runtime route: `0`
- skipped in scoped representative set: `0`

No global taxonomy, KPI classifier, coverage artifact, or authoring definition was changed by TO13.

## Verification

### Static / compile

- `npm.cmd run typecheck` -> PASS
- `npm.cmd run content:compile` -> `7 masters, 7 servants, 20 events, 0 blocking issues`
- `git diff --check` -> PASS
- runtime identity audit over the TO13 implementation diff -> `NO_NEW_RUNTIME_IDENTITY_MATCHES`

### Focused Interaction / compiler

- `packages/rules/tests/regression/interaction-private-optional-runtime.test.ts`
- `packages/rules/tests/executable-card-pack.test.ts`

Result: **32 / 32 PASS**.

### Wider runtime regression

The focused MatchSession/projection/complex set completed with:

- **7 files passed**
- **87 tests passed**
- 38 unrelated tests skipped by the selected filters

Drake legacy behavior checks for payment, optional zero selection and selected-card play also pass after the continuation fix. The archive evidence assertion remains part of the inherited local source-asset absence class described below.

### Gate C candidate evidence

TO13 consumes the independently accepted P3-TO-07 room harness rather than duplicating stale/reconnect infrastructure.

`e2e/fd-private-optional-interaction.spec.ts --repeat-each=5`:

- **5 / 5 PASS**

The E2E proves:

- owner-only candidate projection;
- non-owner redaction at the same authoritative revision;
- reload/reconnect returns the same pending interaction;
- server interaction identity survives reconnect;
- successful settlement removes the pending interaction and plays selected cards;
- replay with stale expected revision is rejected without changing the authoritative revision.

Compatibility batch with accepted Gate C flows:

- Command Spell resource core
- Golden Flow 2 combat/winner VP
- TO12 lifecycle source-active flow
- TO13 private optional interaction
- shared P3-TO-07 harness contract

Result: **5 / 5 PASS**.

### Root full suite

`npm.cmd test`:

- test files: **88 passed / 10 failed (98 total)**
- tests: **587 passed / 20 failed (607 total)**

All 20 failures are the inherited local `chm-extract` / original-image source-asset absence class. The accepted TO12 review baseline already records the same **20 inherited failures** (`576 passed / 20 failed`). No TO13 interaction, compiler, MatchSession, projection, reconnect, stale-replay, generated-content-hash, or runtime behavior test is in the failure set.

## Files changed

Runtime / compiler / projection:

- `packages/rules/src/ability/interaction-gateway.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/match-session.ts`

Tests / E2E:

- `packages/rules/tests/regression/interaction-private-optional-runtime.test.ts`
- `packages/rules/tests/executable-card-pack.test.ts`
- `e2e/support/build-private-optional-interaction-snapshot.ts`
- `e2e/fd-private-optional-interaction.spec.ts`

## Required next step

Freeze the exact TO13 candidate commit and run a fresh independent reviewer from that SHA. The reviewer must independently verify Gate A/B/C for this **one representative only**. Acceptance must not be inherited by the other 10 strict-pending abilities or the broader 18-ability Interaction inventory.

Only after independent acceptance may P3-A03 synchronize accepted burn-down/queue evidence.