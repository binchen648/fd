# P3-B04 Runtime Implementation Report

Document Role: AGENT_IMPLEMENTATION_REPORT
Agent: Codex B
Task: P3-B04
Mechanic Batch: CARD_ACTION_SEMANTICS_MINIMAL_PLAY
Branch: codex/b-p3-b04-card-action-play
Status: IMPLEMENTATION_COMPLETE_CANDIDATE

This report is implementation evidence only. Gate promotion still requires independent reviewer approval.

## Inputs Consumed

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-B04` only from `docs/agents/PHASE3-TASK-INDEX.md`
- `docs/reports/2026-09-09-p3-b04-runtime-handoff.md`
- `artifacts/phase3-b04-runtime-handoff.json`
- `docs/rules/FD-Game-Rules-Final.md` scoped to card play semantics: sections 9.4, 9.5, 9.6, and 11.10.

The two P3-B04 handoff files and `docs/agents` files were consumed from the project baseline / A worktree inputs because they are not present in this B04 checkout.

## Scope

Implemented the scoped `CARD_ACTION_SEMANTICS_MINIMAL_PLAY` runtime route for the single eligible representative:

- Kiritsugu `master.kiritsugu.skill.time-alter`
- Ability `time-alter.action`
- Exact effects: `play_selected_cards`, then `draw_cards`
- Exact target: one controller-owned hand card with attack semantics
- Exact play mode: face-down effect play

Still out of scope and still skipped:

- Kayneth `volumen.extra-play`: `separate_contract:play_source_card_response`
- Maiya `military.attach-support-shot`: `out_of_scope:add_to_attack_semantics`
- Maiya `support-shot.append-only`: `out_of_scope:append_only_rule_marker`
- Olga-Marie `astronomical-science.first-loss`: `out_of_scope:activate_semantics`
- Artoria Alter `sc-artoria-alt-2.angra-mainyu-embrace`: `out_of_scope:close_semantics`
- Drake `sc-drake-1.mount-summon`: `not_verified:play_selected_shape_not_exact_match`

No Trigger, Lifecycle, Interaction, Hidden, Battle, KPI, taxonomy, or unrelated card-action contracts were intentionally changed.

## Implementation

- Added exact semantic routing for `CARD_ACTION_SEMANTICS_MINIMAL_PLAY` in `packages/rules/src/ability/interpreter.ts`.
- Added exported `isPlayActionDirectAction()` for focused regression coverage.
- Added route prevalidation in `packages/rules/src/ability/executable-card-pack.ts`, so malformed migrated Time Alter definitions fail closed during executable pack compilation / data-flow validation.
- Added target-availability gating so Time Alter is not offered when the controller has no legal hand attack to play.
- Routed successful execution through the existing data-flow primitives: `play_selected_cards` and `draw_cards`.
- Reused the shared play batch runtime hook for the actual card movement / visibility semantics.
- Added fail-closed behavior for structurally similar but unsupported PLAY graphs, avoiding legacy fallback.

No new typed primitive was required for this slice because `play_selected_cards` and `draw_cards` already exist as data-flow primitives.

## Before / After

Against A corrected automation baseline:

```text
newRuntimeSemanticRouted: 8 -> 8
legacyResolveEffect: 53 -> 53
dualRuntime: 0 -> 0
legacyExecuteAbility: 3 -> 3
pilotAllowlist: 0 -> 0
notClassifiable: 28 -> 28
```

The global KPI remains stable because A's corrected automation already classifies Time Alter's semantic form as `CARD_ACTION_SEMANTICS_MINIMAL:PLAY`. B04's runtime burn-down is tracked by the focused PLAY inventory below.

Focused PLAY inventory:

```text
legacyPlayConsumerCount.before=1
legacyPlayConsumerCount.after=0
newRuntimeSemanticRoutedPlayCount.before=0
newRuntimeSemanticRoutedPlayCount.after=1
dualCompatiblePlayCount.before=1
dualCompatiblePlayCount.after=0
remainingSkippedCardActionCount.after=6
```

B04 did not redefine KPI taxonomy or coverage counting.

## Verification

```text
node docs/audits/fd-card-action-play-inventory.mjs
PASS
eligible=1
skipped=6
legacyPlayConsumerCount.before=1
legacyPlayConsumerCount.after=0
newRuntimeSemanticRoutedPlayCount.before=0
newRuntimeSemanticRoutedPlayCount.after=1
dualCompatiblePlayCount.before=1
dualCompatiblePlayCount.after=0
remainingSkippedCardActionCount.after=6
```

```text
npx vitest run packages/rules/tests/regression/card-action-play.test.ts packages/rules/tests/regression/attack-play-classifier-regression.test.ts packages/rules/tests/executable-card-pack.test.ts packages/rules/tests/regression/resolution-dataflow.test.ts
PASS: 4 files, 54 tests
```

```text
npm run typecheck
PASS
```

```text
npx playwright test -c playwright.config.ts e2e/fd-time-alter-core-primitive.spec.ts --project=chromium
PASS: 1 test
```

```text
npx playwright test -c playwright.config.ts e2e/fd-time-alter-core-primitive.spec.ts --project=chromium --repeat-each=5
PASS: 5 tests
```

```text
npm run content:compile
PASS: 7 masters, 7 servants, 20 events, 0 blocking issues
```

```text
npm run phase3:coverage
PASS
newRuntimeSemanticRouted=8
legacyExecuteAbility=3
legacyResolveEffect=53
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
```

```text
npm run test:ci
PASS: 82 files, 476 tests
```

```text
git diff --check
PASS
```

## Evidence Boundary

`e2e/fd-time-alter-core-primitive.spec.ts` is restored-snapshot browser / WS / reconnect / stale-command candidate evidence. It verifies the production remote command chain from a restored action-phase room through `MatchSession`, server-supplied action, ability activation, pending target selection, data-flow resolution, projection, reconnect consistency, and stale replay rejection.

It does not claim natural create/select/start progression evidence for reaching that action window.
