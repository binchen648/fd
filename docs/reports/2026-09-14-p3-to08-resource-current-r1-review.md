# P3-TO-08 Resource Numeric Current-Lineage r1 Independent Review

- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-TO-08` / `RESOURCE_NUMERIC_CORE_DIRECT_ACTION`
- TargetCommit: `81dfe1b2d7651adc10e4bc03a13c6df15ccee3ef`
- Integrated Base: `b63376ca0ebc3fc005405a385e6f1b438b6295c1`
- Prior Review: `8f3e834caa70a2f4b6c4df7ba9faa23ffd34b73c` / `IMPLEMENTATION_NEEDS_REVISION`
- Historical detached Gate C hardening: `b1a1dc8eb7c90616d4bf4ecd7d02fae04a78c43e`
- Review Branch: `codex/r-p3-to08-resource-current-r1-review`
- Final Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking finding remains.

The P1 from the first current-lineage review is closed. The authoritative `MatchRoomHub.dispatchCommand` boundary now requires an expected revision before any dispatched ability command can reach `MatchRoom`, `MatchSession`, or the ability runtime. This applies to the Resource representative as well as the already accepted TO13 interaction path.

The diagnostic text for a missing revision still says `interaction command requires expectedRevision`. That wording is broader runtime cleanup debt only: the stable rejection token is `missing_expected_revision`, the command is rejected at the authoritative boundary, and no state/log/replay/room-version mutation occurs. It is not a Gate blocker.

## Prior P1 Closure — Missing Revision Resource Mutation

Fresh independent probe against the exact target used the production Hub/Room/Session/runtime path with Gatou `command-spell.gain-mana`.

Before dispatch:

```text
revision=2
mana=8
commandSpells=3
logs=30
replay=2
replaySnapshots=2
roomVersion=3
```

Missing `expectedRevision`:

```text
error=missing_expected_revision: interaction command requires expectedRevision
```

State after rejection remained exactly:

```text
revision=2
mana=8
commandSpells=3
logs=30
replay=2
replaySnapshots=2
roomVersion=3
```

Stale revision `1` was also rejected and preserved the same complete snapshot.

The same command with the current authoritative revision `2` then succeeded:

```text
result.ok=true
revision=3
mana=12
commandSpells=2
logs=33
replay=3
replaySnapshots=3
roomVersion=4
```

This independently closes the first review's authoritative CAS bypass.

## Gate A Judgment

**PASS for the exact direct Resource Numeric slice.**

The accepted scope remains exactly the three A05-reviewed direct consumers:

1. Gatou command spell `command-spell.gain-mana` — typed mana adjustment plus command-seal spend;
2. Olga-Marie command spell `command-spell.gain-mana` — same direct semantic form;
3. Tomoe `sc-tomoe-1.independent-action` — typed victory-point adjustment.

The inventory remains:

```text
resourceNumericAbilities=17
eligible=3
migrated=3
blocked=8
special=6
skipped=14
legacyResourceConsumerCount.before=3
legacyResourceConsumerCount.after=0
newRuntimeSemanticRoutedCount.after=3
dualCompatibleCount.after=0
remainingSkippedCount.after=14
```

Runtime routing is semantic/structural rather than based on Gatou, Olga-Marie, Tomoe, card ID, or ability ID. The canonical `command-spell.gain-mana` literal in `defaultCommandSpellCard` is content construction, not an eligibility branch.

Compiler/data-flow validation remains fail-closed for malformed direct-resource shapes, invalid numeric expressions, unsupported targets, and unsupported mixed semantics.

No skipped Resource consumer or external Trigger/Battle/Interaction/Movement/Result-Binding/Lifecycle/Special dependency inherits this acceptance.

## Gate B Judgment

**PASS.**

Fresh reviewer verification:

```text
npm.cmd run typecheck
PASS

focused:
- resolution-dataflow.test.ts
- resource-numeric-core-direct-action.test.ts
- resource-numeric-room-boundary.test.ts
- interaction-room-boundary.test.ts
- executable-card-pack.test.ts
5 files / 47 tests PASS

npm.cmd test --workspace @fd/server -- --run
1 file / 2 tests PASS
```

The focused evidence covers the three direct consumers, typed resource envelopes, command-seal underflow/failure behavior, malformed/corrupt resource definitions, transaction rollback, the restored room revision boundary, and regression compatibility with TO13's accepted interaction boundary.

## Gate C Judgment

**PASS for the command-spell Resource representative.**

Fresh Chromium evidence on the exact target:

```text
fd-command-spell-resource-core.spec.ts --repeat-each=5
5/5 PASS
```

The browser/WS flow proves the production command-spell mutation, authoritative projection, reconnect persistence, raw missing-revision rejection, stale-revision rejection, and no duplicate resource mutation after either rejected replay.

TO13 compatibility was independently rerun after the global dispatch-CAS repair:

```text
fd-private-optional-interaction.spec.ts
1/1 PASS
```

The historical detached `b1a1dc8` branch is not used as inherited acceptance. Current Gate C acceptance is based only on the exact current-lineage target `81dfe1b2...` and the fresh reviewer evidence above.

## Root Baseline

Fresh root suite:

```text
100 files total
90 passed / 10 failed
611 tests total
591 passed / 20 failed
```

All 20 failures are the inherited local CHM/original-image source-asset absence class. No Resource Numeric, room revision, TO13 interaction, MatchSession, compiler, or E2E failure is in the set.

`git diff --check` on the reviewed target: PASS.

## Residual Scope

This review does **not** claim:

- migration or Gate inheritance for the 14 skipped Resource Numeric consumers;
- Trigger-owned, Battle-owned, Interaction-owned, Movement, Result Binding, Lifecycle, Modifier, or Special resource behavior;
- acceptance of detached historical branches as current runtime ancestry;
- global KPI changes beyond A-owned synchronization;
- release readiness.

Only the exact three direct Resource Numeric consumers are accepted as migrated in this slice, with `dual=0`.

## A Synchronization Input

Codex A may synchronize the following reviewed facts:

```text
P3-TO-08 status: REVIEW_ACCEPTED
accepted runtime candidate: 81dfe1b2d7651adc10e4bc03a13c6df15ccee3ef
scoped eligible: 3
scoped migrated: 3
scoped skipped: 14
scoped dual runtime: 0
Gate A: PASS
Gate B: PASS
Gate C: PASS
```

A-owned global coverage counters must be remeasured from the accepted lineage; they must not be guessed from this scoped review.

## Final Judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

Accepted downstream runtime candidate:

`81dfe1b2d7651adc10e4bc03a13c6df15ccee3ef`

The reviewer report commit is evidence only; the runtime baseline remains the exact candidate above.
