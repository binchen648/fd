# P3-B2 FB2-43 Event-Location Equals Controller Result

Role: Codex B2
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-20

## Exact dispatch input

- A dispatch Base: `c9a59bbec0d637d3a23682777faa4f05b6d7c1ed`
- A synchronization parent: `64b4bb7a8b1379dd858c746e77f503b271950ec1`
- Task: `P3-FB2-43-EVENT-LOCATION-EQUALS-CONTROLLER`
- Branch: `codex/b2-p3-fb2-43-event-location-equals-controller`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal migration before/after this B2: **`145/944`**, remaining **`799`**.

FB2-43 is identity-free runtime capability infrastructure and earns **zero migration credit**.

## Implemented capability

FB2-43 adds exactly one bounded event-location relation condition:

```json
{ "type": "event_location_equals_controller" }
```

The loader admits only that exact type-only condition shape under an ability `conditions` list. Any extra field or near-shape is rejected as unsupported.

At runtime the condition is meaningful only for the authoritative `after_controller_enters_location` movement event. It returns true exactly when the event carries a non-empty `locationId`, the ability controller still exists with a non-empty current `locationId`, and those two ids are equal at evaluation time. Wrong event types, absent/malformed event location, stale/nonexistent controller, or missing controller location return false without mutation.

Player relationship, servant-reveal state, source lifecycle and battlefield classification remain independent existing conditions. The new condition does not infer any of them.

The pre-existing `after_controller_*` trigger collector normally rejects events whose `playerId` differs from the ability controller before condition evaluation. FB2-43 therefore adds one narrow opt-in needed by the frozen composition: only an `after_controller_enters_location` ability that already contains the accepted existing `event_player_is_opponent` relation condition may reach condition evaluation for an opponent movement event. Other `after_controller_*` event types retain the previous controller-only filter even if they contain an opponent relation condition.

No generic event-field comparison DSL, arbitrary location selector, identity routing, printed-text parsing, alias, consumer authoring, or movement-emission rewrite is added.

## Scope / identity audit

Candidate implementation scope is limited to:

- `packages/rules/src/ability/event-location-equals-controller.ts` — exact shape classifier and read-only runtime predicate;
- `packages/rules/src/ability/loader.ts` — admit only the exact type-only condition under ability conditions;
- `packages/rules/src/ability/interpreter.ts` — evaluate the condition and narrowly admit opponent movement events when the existing opponent-relation condition explicitly opts in;
- `packages/rules/src/index.ts` — public export for mechanical tests;
- `packages/rules/tests/fb2-43-event-location-equals-controller.test.ts` — focused classifier/loader/runtime/composition/movement coverage;
- this result report.

No `data/authoring/**`, pack/generated content, content-package production, client production, card identity, or consumer migration file is changed. Production additions contain no Siegfried identity/name/skill-id token, Frozen F1 hash, or Locked Reference hash. `event_location_equals_controller` and `after_controller_enters_location` are identity-free capability/event vocabulary only.

Branch-local frozen-roster accounting remains:

- frozen identities: `944`;
- frozen overlap: **`140/944`**;
- frozen duplicate ids: `0`.

Therefore FB2-43 adds **zero** frozen identity credit. Formal project migration remains **`145/944`**, remaining **`799`**.

## Focused behavioral evidence

The FB2-43 focused suite proves:

- the exact type-only classifier accepts and widened/near shapes reject;
- loader acceptance is limited to the exact condition shape under `conditions`;
- equality is true only for the movement event with non-empty event/controller locations that match at evaluation time;
- different locations, wrong event type, missing/empty/malformed event location and missing controller location fail closed;
- the location condition by itself does not bypass the existing controller-event scope;
- the existing `event_player_is_opponent` relation can opt an opponent movement event into evaluation;
- that opponent opt-in does not widen unrelated `after_controller_*` trigger types;
- the real movement producer still emits the expected movement event and the composed synthetic ability closes its source only when an opponent enters the revealed controller battlefield;
- self movement, opponent movement elsewhere, unrevealed controller servant, non-battlefield controller location and inactive source all remain negative.

## Validation

The existing worktree/node_modules were reused; no dependency reinstall was needed.

Validation on the final Candidate working tree:

- `npm.cmd run typecheck` — PASS.
- FB2-43 focused — PASS, **1 file / 10 tests**.
- rules `src/__tests__ + core + regression + focused` from repository-root Vitest — PASS, **83 files / 504 tests**.
- `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **165 files / 1163 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run phase3:reference:verify -- --reference-root E:\Codex\FD\fd-reference` — PASS at exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm.cmd run build --workspace @fd/client` — PASS; only the existing Vite browser-externalization/chunk-size warnings.
- `npm.cmd run phase3:coverage` — PASS, `blockingIssues=0`.
- `git diff --check` — PASS.
- production identity/hardcode audit — CLEAN.
- forbidden authoring/generated/product/client scope audit — CLEAN.
- frozen overlap remains `140/944`, duplicates `0`.

## Fresh reviewer handoff

The exact committed Candidate must receive a fresh independent read-only R review against exact Base `c9a59bbec0d637d3a23682777faa4f05b6d7c1ed`.

Formal accepted verdict for this B2 is `IMPLEMENTATION_ACCEPTED_CANDIDATE`; revision verdict is `IMPLEMENTATION_NEEDS_REVISION`.

Do not merge or retarget. Do not credit any frozen identity. On fresh R acceptance, A synchronizes FB2-43 with zero migration credit and then mechanically re-overlays the complete nearest blocked whole card from the current formal baseline. Only a mechanically zero-gap whole card may then be dispatched as singleton S.
