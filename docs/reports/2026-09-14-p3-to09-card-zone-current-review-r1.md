# P3-TO-09 Card Zone Current-Lineage Independent Review

- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-TO-09` / `CARD_ZONE_CORE_DIRECT_ACTION`
- TargetCommit: `5c557cb9d0177a99c0e017768dee42cccdc6a9ff`
- Runtime Parent Accepted By TO08: `81dfe1b2d7651adc10e4bc03a13c6df15ccee3ef`
- Historical Detached Card Zone Candidate: `d9caf3c135a90fa836d25a61948778fc20c267e1`
- Review Branch: `codex/r-p3-to09-card-zone-current-review-r1`
- Final Status: `IMPLEMENTATION_NEEDS_REVISION`

## Findings

### [P1] Current lineage claims Card Zone semantic migration but the production data-flow runtime is absent

The current A03/TO08 lineage still reports `CARD_ZONE_CORE_DIRECT_ACTION:MOVE_ALL_REMAINING_PLUS_ADJUST_MANA` as a semantic route and the Card Zone inventory reports two eligible consumers with legacy `2 -> 0`, new-runtime `0 -> 2`, dual `2 -> 0`.

That claim is not backed by the exact reviewed runtime target.

Fresh inspection of `packages/rules/src/ability/resolution-dataflow.ts` on `5c557cb` shows no typed Card Zone primitives for:

- `move_all_remaining`;
- `play_selected_cards`;
- `draw_cards`.

Fresh inspection of `packages/rules/src/ability/interpreter.ts` shows `executeEffects` routing only Resource Numeric direct/trigger semantics into `executeResolutionEffects` before falling through to the legacy per-effect interpreter. There is no current-lineage Card Zone semantic router. The remaining `play_selected_cards` and `move_all_remaining` implementations are the legacy interpreter cases.

Therefore the two TO09 representatives are not currently proven as migrated production data-flow consumers on this lineage:

- Irisviel `conversion-magic.preparation`;
- Kiritsugu `time-alter.action`.

The green legacy behavior regressions do not promote this batch: they prove the cards still function, not that the accepted typed Card Zone runtime exists.

**Required repair:** reintroduce the narrow Card Zone direct-action typed runtime onto the exact current lineage without reverting later TO08/TO11/TO12/TO13 or room-CAS work. The repair must be semantic/structural, fail closed, and must not depend on ability/card identity.

### [P1] Current target does not contain the Card Zone Gate A / Gate C evidence cited by the candidate report

The exact current target does not contain any of the following files:

```text
packages/rules/tests/regression/phase-3a-core-primitives.test.ts
packages/rules/tests/regression/card-zone-core-direct-action.test.ts
e2e/fd-time-alter-core-primitive.spec.ts
e2e/fd-conversion-magic-core-primitive.spec.ts
```

The historical Card Zone candidate `d9caf3c` contains the Conversion Magic regression/E2E and typed runtime, while the historical B04 PLAY lineage contains the Time Alter E2E. Neither historical branch may be inherited as current-lineage acceptance.

Because TO09 is explicitly a **current-lineage independent review**, missing current target evidence is blocking. A later repair must restore current-lineage representative regression and browser/WS evidence, then receive a fresh independent review.

## Fresh Reviewer Verification

### Inventory

```text
CARD_ZONE_CORE_DIRECT_ACTION inventory
sourceFiles=14
cardZoneAbilities=8
eligible=2
skipped=6

eligible:
- conversion-magic.preparation
- time-alter.action

pilotAbilityIdRoutes.before=2
pilotAbilityIdRoutes.after=0
legacyCardZoneDirectConsumerCount.before=2
legacyCardZoneDirectConsumerCount.after=0
newRuntimeSemanticRoutedCount.before=0
newRuntimeSemanticRoutedCount.after=2
dualCompatibleCount.before=2
dualCompatibleCount.after=0
remainingSkippedCount.after=6
```

These are inventory/automation claims only; this review found that the runtime side of those claims is not present on the exact target.

### Typecheck

```text
npm.cmd run typecheck
PASS
```

### Existing data-flow baseline

```text
npx.cmd vitest run packages/rules/tests/regression/phase-3a-core-primitives.test.ts packages/rules/tests/regression/resolution-dataflow.test.ts
```

The current tree does not contain `phase-3a-core-primitives.test.ts`; the existing `resolution-dataflow.test.ts` executed and passed:

```text
1 file / 13 tests PASS
```

This generic data-flow green result does not include Card Zone primitive coverage.

### Legacy representative behavior

```text
npx.cmd vitest run packages/rules/tests/regression/complex-skills-regression.test.ts
PASS: 1 file / 37 tests
```

The suite contains Time Alter and Conversion Magic behavior checks, but the reviewed source route shows those effects remain under the legacy interpreter on this target. This is compatibility evidence only, not TO09 migration evidence.

## Automation / Runtime Drift

`artifacts/phase3-skill-coverage.json` on the exact target reports:

```text
CARD_ZONE_CORE_DIRECT_ACTION:MOVE_ALL_REMAINING_PLUS_ADJUST_MANA = 1
newRuntimeConsumers.after = 12
legacyExecuteAbilityConsumers.after = 3
legacyResolveEffectConsumers.after = 49
dualRuntimeConsumers.after = 0
```

At the same time the runtime data-flow registry lacks the Card Zone primitive family and the semantic router lacks Card Zone selection. TO09 therefore exposes an automation/runtime evidence drift that must be resolved by the implementation repair and later A-owned synchronization.

## Historical Evidence Boundary

Historical object `d9caf3c135a90fa836d25a61948778fc20c267e1` contains the original Card Zone stabilization work and is an ancestor of the B04/B05/B06/recovery runtime line, but it is **not** an ancestor of the reviewed current-lineage target `5c557cb`.

Historical objects may be used as repair reference only. They are not current Gate evidence and must not be counted as accepted for TO09.

## Gate Judgment

- Gate A: **FAIL / NOT PROMOTED** — current typed Card Zone primitive/router and scoped regression evidence are absent.
- Gate B: **FAIL / NOT PROMOTED** — representative behavior remains available only through legacy compatibility tests on this lineage.
- Gate C: **FAIL / NOT PROMOTED** — both cited current-lineage representative E2E specs are absent from the exact target.

## Final Judgment

`IMPLEMENTATION_NEEDS_REVISION`

Do not synchronize P3-TO-09 as accepted and do not promote the two Card Zone direct-action consumers from this review.

A repair should start from the exact current lineage, port only the narrow Card Zone runtime/evidence required for the two representatives, preserve later accepted runtime boundaries, and then receive a fresh independent reviewer from the exact repaired SHA.
