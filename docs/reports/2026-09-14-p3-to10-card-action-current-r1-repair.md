# P3-TO-10 Card Action Current-Lineage r1 Repair

- Document Role: `IMPLEMENTATION_EVIDENCE`
- Owner: Codex B
- Task: `P3-TO-10` / scoped Card Action review repair
- Base: `a8682306bce4829db2436e4f8b80734834af6de4`
- Rejecting Review: `62c428ac7caf039e60404ad73c39285a71c99019`
- Branch: `codex/b-p3-to10-card-action-current-r1`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Repair Objective

The fresh TO10 current-lineage review found that only the exact Time Alter PLAY contract was present on the accepted cumulative lineage. PLAY_SOURCE, ADD_TO_ATTACK, ACTIVATE, and CLOSE were still claimed by historical inventories/reports but their typed runtime and current-lineage Gate evidence were absent.

This repair restores those four missing narrow contracts onto the exact current lineage while preserving the already accepted TO08 Resource, TO09 Card Zone, TO11 Trigger, TO12 Lifecycle, and TO13 Interaction boundaries.

Historical accepted branches are used only as implementation references; their Gate verdicts are not inherited by this candidate.

## Exact TO10 Scope

Five independent contracts are present after this repair:

1. `PLAY`
   - Kiritsugu `time-alter.action`
   - `play_selected_cards` face-down + `draw_cards(1)`
2. `PLAY_SOURCE_CARD_WITH_COST_RESPONSE`
   - Kayneth `volumen.extra-play`
   - fixed mana cost + face-up `play_source_card`
3. `ADD_TO_ATTACK`
   - Maiya `military.attach-support-shot`
   - `attach_card_to_player_attack`
4. `ACTIVATE`
   - Olga-Marie `astronomical-science.first-loss`
   - authoritative first-loss scheduling + `activate_card_by_id`
5. `CLOSE`
   - Artoria Alter `sc-artoria-alt-2.angra-mainyu-embrace`
   - `close_source_card`

No sibling contract inherits another contract's Gate status.

## Historical Repair References

The following previously accepted runtime candidates were used only as source references for the narrow missing slices:

```text
B05 PLAY_SOURCE: c505c4748251feb9d151f4af52f091162a64a5b6
B06 ADD_TO_ATTACK: f619df5479ed733b76c096410f7ccdc700abd661
B07 ACTIVATE: bd1d9ac73e42c21fb9078097313df259b2cb5738
B08 CLOSE: 5d34befa085fe6426e1d550ad0c5d0a0ca824db6
```

The repair was not produced by wholesale cherry-picking detached lineages. Runtime/test/E2E deltas were merged narrowly against the exact current target so later accepted current-lineage behavior remained intact.

## Runtime Integration

The current typed resolution-dataflow runtime now contains the exact TO10 primitive surface required by the five contracts:

```text
play_selected_cards
play_source_card
attach_card_to_player_attack
activate_card_by_id
close_source_card
```

Compiler/runtime routing is structural and fail-closed. The production diff was searched for the representative identities:

```text
master.kayneth
master.maiya
master.olga-marie
servant.artoria-alt
volumen.extra-play
military.attach-support-shot
astronomical-science.first-loss
angra-mainyu-embrace
time-alter.action
```

Result:

```text
NO_REPRESENTATIVE_IDENTITY_HITS
```

The repair therefore does not route by representative card or ability identity.

## ACTIVATE Current-Lineage Integration

The accepted B07 hardening was preserved while merging into the current lineage:

- first-loss staging is derived from authoritative server battle history;
- first-loss identity/ordinal is required;
- later losses do not re-stage the delayed activation;
- duplicate matching activation targets fail closed instead of silently choosing the first;
- activation-only target cards in `skill` cannot be normally PLAYed;
- Trismegistus is emitted in the generated executable pack with `initialZone: "skill"`.

Because the executable presentation changed, the merged generated executable definition hash was recomputed using the same canonical payload and SHA-256 algorithm used by `assertExecutableCardPack`.

Fresh self-check:

```text
stored=37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333
actual=37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333
```

Both `rules.definitionHash` and `rules.contentIdentity.definitionHash` use the exact verified hash.

## Result-Schema Integration

The generic result-schema regression now preserves the correct source state for each primitive contract:

- PLAY_SOURCE executes with the synthetic source still in controller hand;
- CLOSE adjusts the synthetic source to an active/public field source only for the CLOSE schema case.

This prevents the test fixture from granting one contract the incompatible source state required by another.

## Gate A / Gate B Candidate Evidence

### Typecheck

```text
npm.cmd run typecheck
PASS
```

### Focused five-contract runtime/compiler suite

```text
card-action-play.test.ts
card-action-play-source-response.test.ts
card-action-add-to-attack.test.ts
card-action-activate.test.ts
card-action-close.test.ts
resolution-dataflow.test.ts
executable-card-pack.test.ts
complex-skills-regression.test.ts
```

Fresh result:

```text
8 files / 117 tests PASS
```

Breakdown:

```text
resolution-dataflow: 15
PLAY: 4
PLAY_SOURCE: 6
ADD_TO_ATTACK: 11
ACTIVATE: 8
CLOSE: 5
executable-card-pack: 31
complex-skills: 37
```

### Current-lineage compatibility suite

```text
resource-numeric-core-direct-action.test.ts
resource-numeric-room-boundary.test.ts
card-zone-core-direct-action.test.ts
interaction-private-optional-runtime.test.ts
interaction-room-boundary.test.ts
trigger-resource-runtime.test.ts
lifecycle-source-active-runtime.test.ts
```

Fresh result:

```text
7 files / 35 tests PASS
```

No accepted Resource, Card Zone, Interaction, Trigger, Lifecycle, or room-CAS behavior regressed.

## Gate C Candidate Evidence

Fresh Chromium run on the exact repair worktree:

```text
fd-time-alter-core-primitive.spec.ts
fd-volumen-extra-play-card-action.spec.ts
fd-add-to-attack-card-action.spec.ts
fd-olga-activate-card-action.spec.ts
fd-artoria-alt-close-card-action.spec.ts
```

Result:

```text
5/5 PASS
```

The five browser/server paths independently exercise:

- Time Alter target reconnect, face-down effect play, draw projection, stale rejection;
- Volumen response source play, reconnect, projection, stale rejection;
- Maiya target selection, attachment projection, reconnect, stale rejection;
- Olga authoritative battle-history first loss, delayed round-end activation, reconnect, stale rejection;
- Artoria Alter noble-play source close, projection, reconnect, stale rejection.

## Fresh Inventories

### PLAY

```text
eligible=1
skipped=6
legacyPlayConsumerCount.before=1
legacyPlayConsumerCount.after=0
newRuntimeSemanticRoutedPlayCount.before=0
newRuntimeSemanticRoutedPlayCount.after=1
dualCompatiblePlayCount.before=1
dualCompatiblePlayCount.after=0
```

### ADD_TO_ATTACK

```text
eligible=1
skipped=6
legacyAddToAttackConsumerCount.before=1
legacyAddToAttackConsumerCount.after=0
newRuntimeSemanticRoutedAddToAttackCount.before=0
newRuntimeSemanticRoutedAddToAttackCount.after=1
dualCompatibleAddToAttackCount.before=1
dualCompatibleAddToAttackCount.after=0
```

### ACTIVATE

```text
eligible=1
skipped=6
legacyActivateConsumerCount.before=1
legacyActivateConsumerCount.after=0
newRuntimeSemanticRoutedActivateCount.before=0
newRuntimeSemanticRoutedActivateCount.after=1
dualCompatibleActivateCount.before=1
dualCompatibleActivateCount.after=0
```

### CLOSE

```text
eligible=1
skipped=6
legacyCloseConsumerCount.before=1
legacyCloseConsumerCount.after=0
newRuntimeSemanticRoutedCloseCount.before=0
newRuntimeSemanticRoutedCloseCount.after=1
dualCompatibleCloseCount.before=1
dualCompatibleCloseCount.after=0
```

PLAY_SOURCE remains the separate exact B05 contract and is covered by its current-lineage regression + Chromium proof in this repair.

## Full Root Baseline

Fresh root run:

```text
npx.cmd vitest run --testTimeout=15000

106 files total
96 passed / 10 failed
656 tests total
636 passed / 20 failed
```

The immediately preceding accepted TO09 baseline was:

```text
102 files total
92 passed / 10 failed
623 tests total
603 passed / 20 failed
```

The TO10 repair therefore contributes exactly four additional passing test files and 33 additional passing tests while preserving the same inherited 20-failure set.

All 20 failures remain the existing local CHM/original-image evidence absence class. No Card Action, Card Zone, Resource, Interaction, Trigger, Lifecycle, MatchSession, compiler, projection, or browser/runtime failure is in the set.

## Files Added / Changed

Production/runtime integration includes:

- `data/generated/fd-playtest-v1.content-library.json`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/match-session.ts`

Regression evidence includes the four restored Card Action contract tests plus updates to shared compiler/data-flow/complex-skill evidence.

Gate C evidence includes the four restored Card Action E2Es; the existing Time Alter E2E remains the PLAY representative.

No A-owned global coverage synchronization is claimed by this implementation candidate.

## Acceptance Boundary

This repair does **not** claim:

- migration of skipped/non-exact Card Action shapes;
- inheritance between PLAY, PLAY_SOURCE, ADD_TO_ATTACK, ACTIVATE, and CLOSE;
- broad hidden/private, power, lifecycle, payment, trigger, setup, modifier, or roster-wide Card Action migration;
- A-owned global KPI changes;
- release readiness.

## Next Required Step

Freeze the exact implementation commit and create a fresh independent TO10 reviewer from that SHA. The reviewer must independently reproduce the five-contract Gate A/B/C evidence, verify the executable hash, inspect the prior B05/B06/B07/B08 blocker closures on the current lineage, and only then promote TO10.

Completion claim:

`IMPLEMENTATION_COMPLETE_CANDIDATE`
