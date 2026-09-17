# RESOURCE_NUMERIC_CORE_DIRECT_ACTION Result Report

- Date: 2026-09-08
- Phase: Phase 3 / RESOURCE_NUMERIC_CORE_DIRECT_ACTION
- Claim: IMPLEMENTATION_COMPLETE_CANDIDATE
- Independent Review: Required before COMPONENT_VERIFIED / SCENARIO_VERIFIED / E2E_VERIFIED promotion.
- Superseded: Current repository fact is recorded in `docs/reports/2026-09-09-resource-numeric-core-result.md`. This 2026-09-08 report must not be used as Gate C evidence for the current checkout.

## Scope

Migrated only the approved direct-action resource numeric representatives:

- `master.gatou.command-spell` / `command-spell.gain-mana`
- `master.olga-marie.command-spell` / `command-spell.gain-mana`
- `servant.tomoe.skill.sc-tomoe-1` / `sc-tomoe-1.independent-action`

No roster JSON was changed.

Out of scope and intentionally skipped:

- trigger-owned resource effects
- battle-result, battle-winner, defeat, or battle-loss resource effects
- hidden choice, private target, or private look flows
- pending payment / optional resource branch flows
- card movement / card-zone / result-binding flows
- lifecycle / modifier / power-dependent resource effects

## Authoring Inventory

Command:

```powershell
node docs/audits/fd-resource-numeric-core-direct-action-inventory.mjs
```

Result:

```text
sourceFiles=14
resourceNumericAbilities=17
eligible=3
skipped=14
```

Eligible abilities:

```text
master.gatou        master.gatou.command-spell        command-spell.gain-mana              adjust_mana,adjust_command_seals
master.olga-marie  master.olga-marie.command-spell   command-spell.gain-mana              adjust_mana,adjust_command_seals
servant.tomoe      servant.tomoe.skill.sc-tomoe-1    sc-tomoe-1.independent-action        adjust_victory_points
```

Skipped abilities and reasons:

```text
master.gatou        command-spell.power-victory                    out_of_scope:mixed_non_resource_effect
master.gatou        command-spell.free-move                        out_of_scope:mixed_non_resource_effect
master.irisviel     conversion-magic.preparation                   out_of_scope:mixed_non_resource_effect
master.olga-marie   command-spell.power-victory                    out_of_scope:mixed_non_resource_effect
master.olga-marie   command-spell.free-move                        out_of_scope:mixed_non_resource_effect
master.shinji       drain-command.enter-miyama                     out_of_scope:forced_trigger
master.shinji       clown.lose-command-seal                        out_of_scope:forced_trigger
servant.artoria-alt sc-artoria-alt-3.noble-bloom                   out_of_scope:optional_trigger
servant.artoria-alt sc-artoria-alt-3.noble-bloom-extra-vp          out_of_scope:optional_trigger
servant.artoriac    sc-artoriac-4.recon-gain-vp-and-move           out_of_scope:mixed_non_resource_effect
servant.artoriac    sc-artoriac-6.gain-vp-if-not-sole-winner       out_of_scope:forced_trigger
servant.drake       sc-drake-3.plunder                             out_of_scope:battle_result_or_defeat_dependency
servant.ereshkigal  sc-ereshkigal-2.gain-mana-on-deploy            out_of_scope:forced_trigger
servant.kintoki     sc-kintoki-3.golden-eater                      out_of_scope:pending_payment_or_cost
servant.tomoe       sc-tomoe-1.penalty-on-defeat                   out_of_scope:forced_trigger
```

## Metrics

| Metric | Before | After |
|---|---:|---:|
| Direct-action legacy resource consumers | 3 | 0 |
| New-runtime semantic-routed direct resource consumers | 0 | 3 |
| Dual-compatible migrated consumers | 1 | 0 |
| Remaining skipped resource abilities | 14 | 14 |

## Routing

`command-spell.gain-mana` no longer needs ability-id pilot routing. The runtime route is:

```text
MatchSession.dispatchPlayerAction
-> dispatchAbilityCommand
-> executeAbility
-> executeEffects
-> shouldUseResolutionDataFlow(ability metadata + executable semantic form)
-> executeResolutionEffects
-> typed resource primitives
```

Direct resource semantic routing requires:

- `kind === "phase_action"`
- no targets
- no ability costs
- no creates
- all effects are direct resource primitives from this batch

`time-alter.action` remains the only Phase 3 reference vertical pilot allowlist entry. `conversion-magic.preparation` remains outside this batch because it is Card/Zone + Result Binding.

## Event Envelope

Direct mana, command-seal, and VP mutation events carry:

```text
sourceAbilityId
controllerId
resource
delta
before
after
resultId
revision
```

This includes `mana_adjusted`, `mana_paid`, `command_seals_adjusted`, and `victory_points_adjusted`.

## Gate A Evidence

Implemented tests cover:

- primitive registration
- positive mana/VP/seal deltas
- negative mana/VP deltas with clamp behavior
- command seal underflow fail-closed
- invalid controller player
- invalid result field
- unknown primitive
- bad numeric expression
- insufficient mana for `pay_mana`
- rollback after later runtime failure
- reviewer event envelope fields

Test file:

- `packages/rules/tests/regression/resolution-dataflow.test.ts`

## Gate B Evidence

Implemented tests cover real compiled content through `MatchSession.dispatchPlayerAction`:

- `command-spell.gain-mana` mutates mana +4 and command seals -1, emits reviewer envelopes, and records the command-spell directive.
- `sc-tomoe-1.independent-action` mutates VP +3 from an active source and emits reviewer envelope.
- Both paths produce typed `effect_resolved` payloads, distinguishing the data-flow runtime from legacy `resolveEffect`.
- Reintroducing command-spell ability-id routing is guarded by a negative routing assertion.

Test file:

- `packages/rules/tests/regression/resource-numeric-core-direct-action.test.ts`

## Gate C Evidence

Current checkout status is superseded by `docs/reports/2026-09-09-resource-numeric-core-result.md`: Resource/Numeric command-spell Gate C candidate evidence now exists in `e2e/fd-command-spell-resource-core.spec.ts`, pending independent review.

## Tests Run

```powershell
npm run typecheck
```

Result: PASS.

```powershell
npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/resource-numeric-core-direct-action.test.ts
```

Result: Superseded current focused suite passes with Resource/Numeric direct-action regression included.

```powershell
npm run test:ci
```

Result: Superseded by 2026-09-09 verification record.

Resource/Numeric Gate C browser test: NOT RUN / NOT PRESENT in current checkout.

```powershell
npm run content:validate
```

Result: PASS, 7 masters / 7 servants / 20 events / 0 blocking issues.

```powershell
node docs/audits/fd-resource-numeric-core-direct-action-inventory.mjs
```

Result: Superseded current inventory reports 17 resource numeric abilities, 3 eligible, 14 skipped.

## Known Legacy Paths Retained

- `resolveEffect` remains for non-migrated resource abilities and all non-resource families.
- `conversion-magic.preparation` and `time-alter.action` remain transitional evidence for Card/Zone and Card Action work, not direct resource batch acceptance.
- Battle-result, trigger, movement, hidden-choice, pending-payment, lifecycle, modifier, and power resource hybrids remain intentionally skipped.

## Not Verified

- Full roster migration.
- Trigger-owned resource effects.
- Battle-result VP/resource effects.
- Variable or optional payment flows beyond component coverage.
- Independent reviewer promotion.
- Release Gate.
