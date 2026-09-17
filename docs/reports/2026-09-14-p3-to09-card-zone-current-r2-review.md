# P3-TO-09 Card Zone Current-Lineage r2 Independent Review

- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-TO-09` / `CARD_ZONE_CORE_DIRECT_ACTION`
- TargetCommit: `9718064d54876985b46fdefc99de4477a8b75368`
- Base: `5c557cb9d0177a99c0e017768dee42cccdc6a9ff`
- Prior Review: `cb135814e120d840460262307aa31a93d28df917` / `IMPLEMENTATION_NEEDS_REVISION`
- Review Branch: `codex/r-p3-to09-card-zone-current-r2-review`
- Final Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking finding remains.

The prior review's two P1 findings are closed on the exact repaired target:

1. the current lineage now contains typed `move_all_remaining`, `draw_cards`, and `play_selected_cards` resolution-dataflow primitives plus structural routing for the exact TO09 representatives;
2. the current target now contains fresh scoped regression and browser/WS evidence for both Conversion Magic and Time Alter.

The repair preserves the later accepted Resource Numeric, room revision/CAS, private optional Interaction, Trigger and Lifecycle paths. No representative card/ability identity branch was found in the production runtime diff, and no Add-to-Attack-only router/helper was imported by the TO09 repair.

## Scope Judgment

Fresh inventory on the exact target:

```text
sourceFiles=14
cardZoneAbilities=8
eligible=2
skipped=6

eligible:
- master.irisviel / conversion-magic.preparation
- master.kiritsugu / time-alter.action

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

The six skipped abilities remain excluded for explicit reasons including hidden/private information, cost/payment ownership, trigger ownership, and mixed non-Card-Zone effects. They do not inherit this review's Gate C.

Time Alter's paired `play_selected_cards -> draw_cards` path is accepted only as part of the exact TO09 representative evidence here. This does not replace or pre-accept the separate TO10 Card Action review.

## Gate A Judgment

**PASS for the exact two-consumer Card Zone direct-action slice.**

Fresh reviewer source inspection confirmed:

- `move_all_remaining` is registered as a typed resolution primitive with an actual `movedCount` result;
- `draw_cards` is registered with typed requested/actual count results;
- `play_selected_cards` is registered as a hook-owned primitive and fails closed without the runtime hook;
- compiler/runtime routing is structural and does not branch on Irisviel, Kiritsugu, card ID, or ability ID;
- malformed/non-exact shapes are rejected rather than falling back through the new route;
- the staged diff contains no Add-to-Attack-only route/helper import.

Fresh reviewer checks:

```text
git diff --check 5c557cb..9718064
PASS

production representative identity scan
NO_REPRESENTATIVE_IDENTITY_HITS

Add-to-Attack scope scan
NO_ADD_TO_ATTACK_IMPORT
```

## Gate B Judgment

**PASS.**

Fresh reviewer verification:

```text
npm.cmd run typecheck
PASS
```

Focused TO09/compiler/representative suite:

```text
card-zone-core-direct-action.test.ts
card-action-play.test.ts
resolution-dataflow.test.ts
executable-card-pack.test.ts
complex-skills-regression.test.ts

5 files / 88 tests PASS
```

Fresh current-lineage compatibility suite:

```text
resource-numeric-core-direct-action.test.ts
resource-numeric-room-boundary.test.ts
interaction-private-optional-runtime.test.ts
interaction-room-boundary.test.ts
trigger-resource-runtime.test.ts
lifecycle-source-active-runtime.test.ts

6 files / 31 tests PASS
```

This independently confirms that the repaired Card Zone/paired PLAY path coexists with the already accepted TO08/TO11/TO12/TO13 runtime boundaries.

## Gate C Judgment

**PASS for the exact TO09 representative browser paths.**

Fresh Chromium run on the exact target:

```text
npm.cmd run e2e:fd-remote -- \
  e2e/fd-time-alter-core-primitive.spec.ts \
  e2e/fd-conversion-magic-core-primitive.spec.ts \
  --project=chromium

2/2 PASS
```

Conversion Magic independently proves browser/server dispatch, actual moved-count result binding, authoritative mana projection, reconnect persistence and stale-revision rejection.

Time Alter independently proves browser/server activation, pending-target reconnect, face-down shared effect play, subsequent draw projection and stale-replay rejection.

## Full Root Baseline

Fresh reviewer root run:

```text
npx.cmd vitest run --testTimeout=15000

102 files total
92 passed / 10 failed
623 tests total
603 passed / 20 failed
```

All 20 failures are the inherited local CHM/original-image evidence absence class. No TO09 Card Zone, PLAY primitive, Resource Numeric, Interaction, Trigger, Lifecycle, MatchSession, compiler, projection, or browser/runtime failure is in the failure set.

The accepted TO08 baseline was `591 passed / 20 failed` across `611` tests. The repaired TO09 target adds exactly 12 passing tests and preserves the same inherited 20-failure set.

## Historical Evidence Boundary

Historical Card Zone and PLAY commits were used only as implementation references. This review does not inherit their verdicts. All promotion evidence above was reproduced on the exact current-lineage target `9718064d54876985b46fdefc99de4477a8b75368` in a fresh reviewer worktree.

## Residual Scope

This review does **not** claim:

- TO10 Card Action family acceptance;
- Add-to-Attack, PLAY_SOURCE, ACTIVATE, CLOSE, setup creation, or broader Card Action inheritance;
- migration of the six skipped Card Zone consumers;
- broader hidden/private, trigger-owned, cost/payment, lifecycle, modifier, power, or full-roster Card Zone behavior;
- A-owned global KPI synchronization;
- release readiness.

## A Synchronization Input

Codex A may synchronize the following reviewed facts:

```text
P3-TO-09 status: REVIEW_ACCEPTED
accepted runtime candidate: 9718064d54876985b46fdefc99de4477a8b75368
scoped eligible: 2
scoped migrated: 2
scoped skipped: 6
scoped dual runtime: 0
Gate A: PASS
Gate B: PASS
Gate C: PASS
```

A-owned global counters must be remeasured from the accepted lineage and must not be guessed from this scoped review.

## Final Judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

Accepted downstream runtime candidate:

`9718064d54876985b46fdefc99de4477a8b75368`

The reviewer report commit is evidence only; the runtime baseline remains the exact candidate above.
