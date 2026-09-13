# P3-B11 Result Binding Production Bridge Result

- Document Role: RUNTIME_IMPLEMENTATION_RESULT
- Owner: Codex B
- Task: `P3-B11`
- Branch: `codex/b-p3-b11-result-binding-production-bridge-recovery`
- Replacement B10 Runtime Base: `bcb7ed1db310be5a8b04b3e1a223005a21c65102`
- Historical B10 SHA: `9fba6d9` (unavailable; not treated as restored)
- Mechanic Family: `RESULT_BINDING_PRODUCTION_BRIDGE`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Independent Review: `P3-R06` required; no Gate A/B/C promotion is claimed here.

## Scope

This implementation is restricted to the two B11 representatives already named by the handoff:

1. `master.irisviel.skill.conversion-magic` / `conversion-magic.preparation`
   - no-interaction control
   - `move_all_remaining -> discarded_cards.movedCount -> adjust_mana`
2. `servant.kintoki.skill.sc-kintoki-3` / `sc-kintoki-3.golden-eater`
   - staged interaction migration
   - first `move_card -> golden_impact_cards_added_this_resolution`
   - optional second `move_card` with typed 7-mana payment
   - battlefield VP consumes the actual accumulated `movedCount`

A programmatic scan of `data/authoring/**/*.json` for actual binding producers (`resultVar` or `bind`) found exactly these two abilities. No additional result-binding ability was migrated.

Superficially related formula/variable users remain unchanged and out of B11 eligibility because they do not form the producer/consumer result-binding contract:

- `servant.artoria-alt.skill.sc-artoria-alt-1` / `sc-artoria-alt-1.chain-of-wind-king`
- `servant.artoriac.skill.sc-artoriac-2` / `sc-artoriac-2.pay-x-look-x-plus-two`
- `servant.drake.skill.sc-drake-3` / `sc-drake-3.plunder`

No coverage KPI, taxonomy, review-packet classifier, trigger gateway, lifecycle gateway, battle gateway, modifier gateway, or hidden-information runtime file was changed.

## Local Before / After

The following counters are deliberately local to the exact two B11 result-binding producer/consumer abilities. Global Phase 3 classifier/KPI synchronization remains Codex A-owned and was not edited by this task.

```text
legacyResolveEffect (B11 scoped):       1 -> 0
newRuntimeSemanticRouted (B11 scoped):  1 -> 2
dualRuntime (B11 scoped):               0 -> 0
local eligible:                         2 -> 2
local migrated:                         1 -> 2
local skipped:                          1 -> 0
```

Before B11, Conversion Magic was already routed through typed result binding while Golden Eater still consumed its result variable through the legacy effect path. After B11, both scoped representatives use typed result envelopes. There is no success-path or failure-path retry into legacy `resolveEffect` for a graph that is recognized as the B11 structural candidate.

`phase3:coverage` and the A-owned global before/after counters are intentionally unchanged by this B task. They must be synchronized only after independent reviewer judgment.

## Runtime Implementation

### Semantic routing

The Golden Eater production bridge is selected by semantic graph shape only. The predicate requires:

- automatic `phase_action`
- combat phase / `controller_combat_action_window`
- active source
- exactly two private controller-owned `removed_from_game` card targets
- first target count `1..1`
- second target count `0..1` with the 7-mana availability condition
- first and second `move_card` effects both moving to skill
- both moves writing the same result binding
- fixed optional `pay_mana 7` on the second move
- a single battlefield branch
- controller VP equal to the shared moved-count binding multiplied by 2

The runtime predicate and compiler intake contain no Kintoki, Golden Eater, Irisviel, Conversion Magic, card-id, or ability-id equality/exclusion branch. A renamed synthetic graph with the same legal semantic shape is accepted by the focused regression.

A structurally near-matching staged graph that does not satisfy the complete supported semantic contract fails closed as `resolution_failed`; it is not allowed to fall through to legacy effect execution.

### Typed result support

`resolution-dataflow.ts` now provides the minimum infrastructure required by the scoped graph:

- registered typed `move_card` primitive for controller-owned `removed_from_game -> skill`
- `MoveCardResult` with `movedCount` and `movedCardIds`
- same-binding accumulation across staged `move_card` results
- typed fixed optional `pay_mana`
- typed additive/multiplicative value expressions
- typed `controller_at_battlefield` branch condition
- server-only initial binding seeds for validated continuation

The new primitive revalidates selected card existence, ownership, and source zone at execution time. Runtime invariant or payment failures throw typed resolution errors and are translated to `resolution_failed` at the trusted bridge boundary.

### Server-owned staged continuation

Golden Eater remains a two-dispatch interaction:

1. Ability activation opens the first private target decision.
2. First `choose_target` executes typed `move_card` and commits the first card to skill.
3. Only the actual first-stage `movedCount` is retained in the server-owned pending context.
4. The optional second target is staged.
5. Second `choose_target` reconstructs a validated typed binding seed server-side, performs typed `pay_mana`, typed second `move_card`, and binding-driven VP calculation in one dispatch transaction.

No binding value is accepted from the client. Golden Eater declares no variable-cost input, so a client attempt to inject `golden_impact_cards_added_this_resolution` through activation variables is rejected as `invalid_variable` with authoritative state unchanged.

The internal continuation key is not present in the client projection; browser E2E explicitly checks this before and after reconnect.

## Transaction / Rollback Evidence

Focused production regressions prove:

- first target is committed before the second pending decision;
- declining the optional second target preserves the first actual moved count and awards only 2 VP at a battlefield;
- selecting the second target with sufficient mana pays exactly 7, moves the second card, and awards 4 VP from the actual total moved count;
- a server-side race that reduces mana after the optional target is staged reaches typed `pay_mana`, returns `resolution_failed`, and preserves the complete already-committed first stage while rolling back every second-dispatch change;
- on second-dispatch rejection, mana, second-card zone, VP, emitted events, pending decision, and revision remain unchanged;
- malformed supported-shape graphs fail closed without legacy retry.

Conversion Magic remains the no-interaction control and continues to award mana from the actual `move_all_remaining.movedCount` result rather than a guessed target count.

## Compiler Fail-Closed Evidence

The executable-pack suite now includes scoped Golden Eater negatives for:

- missing target reference;
- mismatched first/second staged binding;
- unsupported optional payment amount.

Existing resolution-dataflow tests continue to cover unknown/future bindings, invalid result fields, wrong expression types, duplicate bindings, unsafe branch bindings, and transaction rollback.

## Verification

### Typecheck

```text
npm run typecheck
PASS
```

### Focused Vitest

```text
npx vitest run \
  packages/rules/tests/executable-card-pack.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts \
  packages/rules/tests/regression/production-resolution-bridge.test.ts \
  packages/rules/tests/regression/card-zone-core-direct-action.test.ts \
  packages/rules/tests/regression/complex-skills-regression.test.ts

PASS: 5 files / 90 tests
```

Golden Eater's existing Kintoki behavior regression was also run independently:

```text
npx vitest run packages/rules/tests/kintoki-authoring.test.ts -t "resolves Golden Eater"
PASS: 1 selected test
```

The unrelated source-image assertion in the full Kintoki file remains dependent on the absent local CHM tree and is not changed by B11.

### Scoped browser / WebSocket evidence

```text
npx playwright test \
  e2e/fd-golden-eater-result-binding.spec.ts \
  e2e/fd-conversion-magic-core-primitive.spec.ts \
  --project=chromium --repeat-each=5

PASS: 15 / 15
```

The repeated browser evidence covers:

- Conversion Magic actual `movedCount`, projection, reconnect, and stale-revision rejection five times;
- Golden Eater complete two-stage browser flow, server projection, reload/reconnect while the second target is pending, typed `mana_paid`, binding-driven VP, and stale replay rejection five times;
- Golden Eater insufficient second-stage payment / dispatch-local rollback five times.

### Full rules baseline comparison

```text
npx vitest run packages/rules/tests
113 suites total
95 passed / 18 failed suites
382 tests total
363 passed / 19 failed tests
```

The failure count remains the inherited rules baseline. B11 adds passing tests and introduces no new full-rules failure. The inherited set is the same class reproduced on the replacement B10 baseline: unavailable historical CHM/image evidence plus the pre-existing generated-content definition-hash mismatch.

### `test:ci`

```text
npm run test:ci
85 files total
81 passed / 4 failed files
503 tests total
498 passed / 5 failed tests
```

All five failures are outside the B11 runtime slice:

1. `packages/content/src/__tests__/fd-playtest-events.test.ts`
   - missing local `chm-extract` reviewed event image.
2. `packages/content/src/__tests__/playtest-pack-loader.test.ts`
   - 93 blocking `MISSING_IMAGE` entries because the local CHM image tree is absent.
3. `packages/rules/tests/regression/golden-card-content-pipeline.test.ts`
   - pre-existing versioned generated-content definition-hash mismatch (`2c6b15...` expected vs `d2e6a8...` freshly compiled).
4. `packages/pipeline/tests/validators/sample-manifest-coverage.test.ts` (two tests)
   - historical hardcoded `D:\\fd\\data\\manifests\\sample-cards.json` is absent.

No B11 focused, compiler, transaction, MatchSession, room, or E2E test failed in `test:ci`.

### Diff hygiene

```text
git diff --check
PASS
```

Runtime diff inspection found no scoped card/ability id routing and no coverage/KPI/taxonomy file change.

## E2E Environment Isolation Note

The newly created B11 worktree initially inherited a root `node_modules` junction from an earlier recovery worktree. Its workspace `@fd/rules` junction resolved to `E:\Codex\FD\fd-b07-recovery\packages\rules`, causing Playwright/server processes to execute stale runtime code while Vitest imported the B11 source tree directly.

The B11 worktree junction was removed locally and `npm ci --ignore-scripts` was run so workspace package links resolve to `E:\Codex\FD\fd-b11\packages\rules`. No tracked dependency manifest was changed. Playwright Chromium was installed locally because the machine did not yet contain the required browser binary. These are environment preparations, not repository/runtime changes.

## Files Changed By B11

Runtime:

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`

Focused tests / E2E:

- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/kintoki-authoring.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- `packages/rules/tests/regression/production-resolution-bridge.test.ts`
- `e2e/fd-golden-eater-result-binding.spec.ts`
- `e2e/support/build-golden-eater-snapshot.ts`

Report:

- `docs/reports/2026-09-12-p3-b11-result-binding-production-bridge-result.md`

## Handoff

B11 is an `IMPLEMENTATION_COMPLETE_CANDIDATE` only.

Independent `P3-R06` must review the exact implementation commit before any Gate A/B/C status is promoted. Global KPI/classifier synchronization remains Codex A-owned after reviewer judgment. No additional result-binding ability, mechanic family, or migration phase is authorized by this result.
