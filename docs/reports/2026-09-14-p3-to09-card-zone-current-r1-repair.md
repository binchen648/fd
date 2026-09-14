# P3-TO-09 Card Zone Current-Lineage r1 Repair

- Document Role: `IMPLEMENTATION_EVIDENCE`
- Owner: Codex B
- Task: `P3-TO-09` / `CARD_ZONE_CORE_DIRECT_ACTION`
- Base: `5c557cb9d0177a99c0e017768dee42cccdc6a9ff`
- Rejecting Review Evidence: `cb135814e120d840460262307aa31a93d28df917`
- Branch: `codex/b-p3-to09-card-zone-current-r1`
- Historical Card Zone Reference: `d9caf3c135a90fa836d25a61948778fc20c267e1`
- Historical PLAY Reference: `56376bea590eda20d3c7d9ad359df1cabf4371d1`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Repair Objective

The fresh TO09 review found that the current accepted cumulative lineage still claimed Card Zone semantic migration in inventory/coverage evidence while the exact production target no longer contained the corresponding typed data-flow runtime or current-lineage Gate evidence.

This repair restores only the narrow accepted Card Zone / paired PLAY semantic surface onto the exact current lineage. Historical objects are repair references only; no historical Gate verdict is inherited.

## Scoped Representatives

The current stabilization plan defines exactly two direct-action matches for this slice:

1. Irisviel `conversion-magic.preparation`
   - `move_all_remaining` from controller hand to discard;
   - bind actual `movedCount`;
   - feed the bound count into `adjust_mana`.
2. Kiritsugu `time-alter.action`
   - choose exactly one controller hand attack;
   - `play_selected_cards` face-down through the shared effect play hook;
   - `draw_cards` exactly one card after the play succeeds.

Time Alter's Card Action PLAY contract still requires its own TO10 review. Restoring the typed PLAY primitive here does not promote TO10.

## Runtime Repair

The repair restores typed resolution-dataflow support for:

- `move_all_remaining`;
- `play_selected_cards`;
- `draw_cards`.

It restores structural classifiers and compiler fail-closed validation for the two exact shapes and routes them through `executeResolutionEffects` rather than the legacy per-effect interpreter.

The current-lineage Resource Numeric, Trigger, Lifecycle, private optional Interaction, room revision/CAS and other later accepted paths are preserved.

A production-diff identity scan for:

```text
Irisviel
Kiritsugu
conversion-magic
time-alter
master.irisviel
master.kiritsugu
```

returns:

```text
NO_REPRESENTATIVE_IDENTITY_HITS
```

Eligibility remains semantic/structural rather than card/ability identity based.

## Scope Guard

The B04 historical reference also contained Add-to-Attack helpers because of its old base ancestry. Those helpers were deliberately excluded from this repair.

Fresh staged-diff scan confirms no newly introduced:

- `isAddToAttackRouteCandidate`;
- `isAddToAttackStructuralCandidate`;
- `assertAddToAttackSupportAvailable`;
- Add-to-Attack-only target/cost helpers.

TO09 does not claim B06/TO10 Add-to-Attack acceptance.

## Gate A / B Candidate Evidence

### Typecheck

```text
npm.cmd run typecheck
PASS
```

### Focused typed-runtime / compiler / representative suite

```text
npx.cmd vitest run \
  packages/rules/tests/regression/card-zone-core-direct-action.test.ts \
  packages/rules/tests/regression/card-action-play.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts \
  packages/rules/tests/executable-card-pack.test.ts \
  packages/rules/tests/regression/complex-skills-regression.test.ts
```

Result:

```text
5 files / 88 tests PASS
```

This covers the restored primitive registry, structural routing, malformed-shape fail-closed behavior, actual result binding, shared effect-play integration, mandatory target availability, and existing representative behavior.

### Current-lineage compatibility suite

```text
resource-numeric-core-direct-action.test.ts
resource-numeric-room-boundary.test.ts
interaction-private-optional-runtime.test.ts
interaction-room-boundary.test.ts
trigger-resource-runtime.test.ts
lifecycle-source-active-runtime.test.ts
```

Result:

```text
6 files / 31 tests PASS
```

No accepted TO08 Resource, authoritative room revision, TO13 private interaction, Trigger, or Lifecycle behavior regressed.

## Gate C Candidate Evidence

Fresh Chromium run on this exact repair worktree:

```text
npm.cmd run e2e:fd-remote -- \
  e2e/fd-time-alter-core-primitive.spec.ts \
  e2e/fd-conversion-magic-core-primitive.spec.ts \
  --project=chromium
```

Result:

```text
2/2 PASS
```

Conversion Magic proves browser/server dispatch, authoritative `movedCount` result binding, mana projection, reconnect and stale revision rejection.

Time Alter proves browser/server activation, pending target reconnect, face-down shared effect play, subsequent draw projection and stale replay rejection.

## Full Root Baseline

Fresh run:

```text
npx.cmd vitest run --testTimeout=15000
```

Result:

```text
102 files total
92 passed / 10 failed
623 tests total
603 passed / 20 failed
```

The accepted TO08 current-lineage reviewer baseline was:

```text
100 files total
90 passed / 10 failed
611 tests total
591 passed / 20 failed
```

The repair therefore contributes exactly 2 additional passing test files / 12 passing tests while preserving the same 20 inherited failures.

All 20 failures are the existing local CHM/original-image evidence absence class. No TO09 Card Zone, PLAY primitive, Resource, Interaction, Trigger, Lifecycle, MatchSession, compiler, projection or browser test is in the failure set.

## Files Added / Changed

Runtime/compiler:

- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Regression evidence:

- `packages/rules/tests/regression/card-zone-core-direct-action.test.ts`
- `packages/rules/tests/regression/card-action-play.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- `packages/rules/tests/executable-card-pack.test.ts`

Gate C evidence:

- `e2e/fd-conversion-magic-core-primitive.spec.ts`
- `e2e/fd-time-alter-core-primitive.spec.ts`

No content archive, generated content, client/server production file, coverage artifact, or A-owned synchronization file is changed by this repair.

## Acceptance Boundary

This implementation candidate does not claim:

- TO10 Card Action family acceptance;
- Add-to-Attack, PLAY_SOURCE, ACTIVATE or CLOSE review inheritance;
- migration of the six skipped Card Zone abilities;
- hidden/private, trigger, pending-payment, lifecycle, modifier or broad roster migration;
- A-owned global KPI synchronization;
- release readiness.

## Next Required Step

Freeze the exact repair commit and create a fresh independent TO09 reviewer from that SHA. The reviewer must re-run Gate A/B/C evidence on the repaired current lineage and independently confirm the legacy/new/dual claim before A03 synchronization.

Completion claim:

`IMPLEMENTATION_COMPLETE_CANDIDATE`
