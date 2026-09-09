# RESOURCE_NUMERIC_CORE Result Report

- Date: 2026-09-09
- Task: P3-B01 RESOURCE_NUMERIC_CORE
- Claim: IMPLEMENTATION_COMPLETE_CANDIDATE
- Independent Review: Required before any RESOURCE_NUMERIC_CORE, Gate A, Gate B, Gate C, or Phase 3 PASS claim.

## Scope

Implemented the low-risk direct-action Resource/Numeric slice only:

- typed `adjust_mana`
- typed `pay_mana`
- typed `adjust_command_seals`
- typed `adjust_victory_points`
- compiler fail-closed validation for strict direct resource action semantic form
- semantic-form routing for strict direct resource action abilities
- real `MatchSession.dispatchPlayerAction` representative tests for command spell mana/seal, Tomoe VP, and corrupted direct-resource fail-closed behavior
- browser/WS/reconnect/stale Gate C candidate for command spell direct resource routing

No card JSON, canonical rules, trigger engine, interaction subsystem, lifecycle subsystem, battle runtime, or full result-binding subsystem was rewritten.

## Resource Consumer Inventory

Command:

```powershell
node docs/audits/fd-resource-numeric-core-direct-action-inventory.mjs
npx playwright test -c playwright.config.ts fd-command-spell-resource-core --project=chromium
```

Current source result:

```text
sourceFiles=14
resourceNumericAbilities=17
eligible=3
migrated=3
blocked=8
special=6
skipped=14
```

Eligible / migrated:

```text
master.gatou       master.gatou.command-spell      command-spell.gain-mana              adjust_mana,adjust_command_seals
master.olga-marie master.olga-marie.command-spell command-spell.gain-mana              adjust_mana,adjust_command_seals
servant.tomoe     servant.tomoe.skill.sc-tomoe-1  sc-tomoe-1.independent-action        adjust_victory_points
```

The current fresh script reports 17 resource abilities, not the historical 18. This report uses the current authoring/inventory output as source fact.

## Primitive Contracts

`adjust_mana`:

- target: controller only in this slice
- amount: safe integer literal or validated numeric binding
- gain respects mana cap and mana-gain block
- loss clamps at zero
- result: `requestedAmount`, `actualAmount`, `before`, `after`, `playerId`

`pay_mana`:

- target: controller only
- amount: nonnegative safe integer
- insufficient mana fails closed
- result: `requestedAmount`, `actualAmount`, `before`, `after`, `playerId`

`adjust_command_seals`:

- target: controller only
- amount: safe integer
- underflow fails closed, not clamp-success
- result: `requestedAmount`, `actualAmount`, `before`, `after`, `playerId`, optional `directive`

`adjust_victory_points`:

- target: controller only in this slice
- amount: safe integer or validated numeric binding
- VP clamps at zero per canonical VP rule
- result: `amount`, `before`, `after`, `playerId`

Resource events expose `sourceAbilityId`, `controllerId`, `resource`, `delta`, `before`, `after`, `resultId`, and `revision`.

## Legacy Burn-down

```text
legacyResourceConsumerCount.before=3
legacyResourceConsumerCount.after=0
legacyResourceConsumerCount.delta=-3

newRuntimeSemanticRoutedCount.before=0
newRuntimeSemanticRoutedCount.after=3
newRuntimeSemanticRoutedCount.delta=+3

dualCompatibleCount.before=NOT_CLASSIFIABLE
dualCompatibleCount.after=0

remainingSkippedCount.after=14
```

`dualCompatibleCount.before` is not statically classifiable from current source without relying on historical report claims.

## Blocking Gateways

Retained legacy/skipped abilities are blocked by:

- `TRIGGER_GATEWAY`
- `BATTLE_RESULT`
- `INTERACTION_GATEWAY`
- `MOVEMENT`
- `RESULT_BINDING`
- `SPECIAL_SUBSYSTEM`
- `LIFECYCLE`

## Tests Run

```powershell
npm run typecheck
npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/resource-numeric-core-direct-action.test.ts packages/rules/tests/executable-card-pack.test.ts
npm run test:ci
npm run content:validate
node docs/audits/fd-resource-numeric-core-direct-action-inventory.mjs
```

Results:

- typecheck: PASS
- focused vitest: PASS, 3 files / 37 tests
- test:ci: PASS, 79 files / 453 tests
- content validate: PASS, 7 masters / 7 servants / 20 events / 0 blocking issues
- inventory: PASS, 17 resource abilities / 3 eligible / 14 skipped
- command spell Gate C candidate: PASS, 1 Chromium test

## Negative Evidence

Covered:

- invalid amount
- unsupported resource target
- unknown resource primitive does not classify into Resource Core
- mixed non-resource effect does not classify into Resource Core
- command seal underflow fails closed
- insufficient mana payment fails closed
- bad numeric expression fails closed
- later runtime failure rolls back prior resource mutations
- compiler rejects malformed direct resource authoring before runtime
- corrupted migrated direct-resource definitions return `resolution_failed` through `MatchSession.dispatchPlayerAction` without throwing or mutating resource state

## Gate C Status

Implementer Gate C candidate evidence exists in `e2e/fd-command-spell-resource-core.spec.ts` for command spell direct resource routing: real remote room create/select/start, browser-driven phase progression, real ability activation, WebSocket `expectedRevision`, server projection resource envelopes, reconnect consistency, and stale replay rejection. Independent review is still required before any Gate C or Phase 3 promotion.

## Known Retained Legacy

- trigger-owned resource effects
- battle result / defeat / win-loss resource effects
- movement/resource hybrids
- card-zone/result-binding resource hybrids
- optional/pending payment beyond primitive component tests
- special subsystem command-spell directives

## Hot Runtime Files Touched

YES:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts`

## Areas Not Verified

- independent Gate C promotion review
- independent reviewer promotion
- full Resource/Numeric family
- trigger, battle, hidden, interaction, lifecycle, modifier, and special subsystem migration
