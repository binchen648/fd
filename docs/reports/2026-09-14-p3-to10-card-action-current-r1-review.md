# P3-TO-10 Card Action Current-Lineage Independent Review r1 Repair

- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-TO-10` / scoped Card Action review
- TargetCommit: `2a3710fa5d2c91f601378e9b7d5979353f4b1951`
- TargetBranch: `codex/b-p3-to10-card-action-current-r1`
- ReviewBranch: `codex/r-p3-to10-card-action-current-r1-review`
- Prior Rejecting Review: `62c428ac7caf039e60404ad73c39285a71c99019`
- Current-Lineage Base Before Repair: `a8682306bce4829db2436e4f8b80734834af6de4`
- Final Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Scope

This fresh review evaluates the five independent TO10 Card Action contracts on the exact repaired current-lineage target:

1. `PLAY` — Kiritsugu `time-alter.action`;
2. `PLAY_SOURCE_CARD_WITH_COST_RESPONSE` — Kayneth `volumen.extra-play`;
3. `ADD_TO_ATTACK` — Maiya `military.attach-support-shot`;
4. `ACTIVATE` — Olga-Marie `astronomical-science.first-loss`;
5. `CLOSE` — Artoria Alter `sc-artoria-alt-2.angra-mainyu-embrace`.

No contract inherits Gate status from another contract or from the detached historical B05/B06/B07/B08 branches.

## Prior P1 Blocker Closure

The previous fresh review at `62c428a` rejected the exact then-current lineage because four of five scoped Card Action contracts were absent from the typed runtime and their current-lineage Gate B/C evidence files were missing.

Fresh source inspection on `2a3710f` confirms that the repair now contains typed runtime support for all five required primitive surfaces:

```text
play_selected_cards
play_source_card
attach_card_to_player_attack
activate_card_by_id
close_source_card
```

The previously absent current-lineage evidence files now also exist:

```text
packages/rules/tests/regression/card-action-play-source-response.test.ts
e2e/fd-volumen-extra-play-card-action.spec.ts

packages/rules/tests/regression/card-action-add-to-attack.test.ts
e2e/fd-add-to-attack-card-action.spec.ts

packages/rules/tests/regression/card-action-activate.test.ts
e2e/fd-olga-activate-card-action.spec.ts

packages/rules/tests/regression/card-action-close.test.ts
e2e/fd-artoria-alt-close-card-action.spec.ts
```

Therefore both P1 blockers from the rejecting review are closed on the exact repaired current lineage.

## Structural / Fail-Closed Review

The production diff from `a868230` to `2a3710f` was searched for representative card/ability identities across the changed rules runtime and MatchSession source.

Result:

```text
NO_REPRESENTATIVE_IDENTITY_HITS_IN_PRODUCTION_DIFF
```

The restored contracts are routed by semantic/structural form rather than representative identities.

The focused regression set also demonstrates the expected fail-closed boundaries:

### PLAY_SOURCE

Fresh test assertions cover:

- source card must still be in hand;
- fixed mana must still be available at dispatch;
- shared card-play forbids are revalidated;
- stale/invalid response actions do not commit payment;
- classifier accepts only the exact source-card response play shape without ability IDs.

### ADD_TO_ATTACK

Fresh test assertions cover:

- no legacy fallback when the migrated graph is corrupted;
- canonical battlefield condition is required;
- no action is offered when no legal non-controller player target remains;
- an invalidated target is rejected;
- exact semantic shape classification is identity-free.

### ACTIVATE

Fresh test assertions cover:

- delayed activation occurs only on formal round end;
- malformed first-loss events do not stage;
- duplicate delayed activation is suppressed;
- ambiguous activation targets fail closed;
- wrong-controller activation targets fail closed;
- first-loss staging is derived once from authoritative MatchSession battle history.

Fresh source inspection also confirms server-owned first-loss history and `lossOrdinal: 1` emission in MatchSession, plus activation-only play rejection for the delayed target.

### CLOSE

Fresh test assertions cover:

- active source closes through typed data-flow after a real Noble Phantasm play;
- non-Noble visible controller-owned play does not close the source;
- exact semantic form classification does not depend on card/ability IDs.

The runtime additionally revalidates CLOSE source state before execution.

## Gate A / Gate B

### Typecheck

Fresh reviewer run:

```text
npm.cmd run typecheck
PASS
```

### Five-contract focused suite

Fresh reviewer run:

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

Result:

```text
8 files / 117 tests PASS
```

### Current-lineage compatibility suite

Fresh reviewer run:

```text
resource-numeric-core-direct-action.test.ts
resource-numeric-room-boundary.test.ts
card-zone-core-direct-action.test.ts
interaction-private-optional-runtime.test.ts
interaction-room-boundary.test.ts
trigger-resource-runtime.test.ts
lifecycle-source-active-runtime.test.ts
```

Result:

```text
7 files / 35 tests PASS
```

This independently verifies that the TO10 repair does not regress the accepted current-lineage Resource, Card Zone, Interaction, Trigger, Lifecycle, or room-CAS boundaries.

## Gate C

The fresh reviewer ran all five browser/server representatives in Chromium.

The first combined run produced:

```text
ADD_TO_ATTACK PASS
CLOSE PASS
ACTIVATE PASS
TIME ALTER one 10-second pending-decision wait timeout
PLAY_SOURCE PASS
```

The timeout did not reproduce. The reviewer then ran Time Alter twice in isolation:

```text
retry 1: PASS
retry 2: PASS
```

The reviewer then reran the complete five-spec group:

```text
5/5 PASS
```

The accepted Gate C evidence is the successful fresh rerun after the non-reproducing timeout. The one transient wait timeout is recorded here rather than hidden; it did not expose a deterministic runtime, projection, reconnect, stale-revision, or contract failure.

The successful five-spec group covers:

- Time Alter target/reconnect, face-down effect play, draw, stale rejection;
- Volumen source-card response play, reconnect, projection, stale rejection;
- Maiya target selection, add-to-attack projection, reconnect, stale rejection;
- Olga authoritative first-loss battle history, round-end activation, reconnect, stale rejection;
- Artoria Alter Noble Phantasm CLOSE, projection, reconnect, stale rejection.

## Executable Pack Identity

The reviewer independently recomputed the executable definition hash using the same canonical payload structure used by `assertExecutableCardPack`.

Result:

```text
stored=37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333
actual=37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333
identity=37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333
```

The executable body and both stored identity fields are consistent.

## Fresh Inventory Reproduction

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

PLAY_SOURCE remains the separate exact Volumen response-play contract; its current-lineage regression and Chromium proof are present and passed in this review.

## Full Root Baseline

Fresh reviewer run:

```text
npx.cmd vitest run --testTimeout=15000

106 files total
96 passed / 10 failed
656 tests total
636 passed / 20 failed
```

This exactly reproduces the implementation-side baseline. The 20 failures are the pre-existing local CHM/original-image evidence absence class. No Card Action, Card Zone, Resource, Interaction, Trigger, Lifecycle, MatchSession, compiler, projection, or typed resolution-dataflow failure appears in the failing set.

Compared with the accepted TO09 baseline (`603 PASS / 20 inherited FAIL`), the current TO10 candidate contributes the restored passing Card Action evidence while preserving the inherited failure count.

## Diff Hygiene

```text
git diff a8682306bce4829db2436e4f8b80734834af6de4..2a3710fa5d2c91f601378e9b7d5979353f4b1951 --check
PASS
```

The fresh reviewer worktree was clean before this review report was authored.

## Gate Judgment

- `PLAY`: **PASS**
- `PLAY_SOURCE_CARD_WITH_COST_RESPONSE`: **PASS**
- `ADD_TO_ATTACK`: **PASS**
- `ACTIVATE`: **PASS**
- `CLOSE`: **PASS**
- Gate A: **PASS**
- Gate B: **PASS**
- Gate C: **PASS**, with one documented non-reproducing Time Alter wait timeout followed by two isolated passes and a fresh full-group 5/5 pass
- TO10 aggregate: **ACCEPTED candidate evidence**

## Acceptance Boundary

This review accepts only the exact five scoped TO10 contracts on target `2a3710f`.

It does not claim:

- migration of the six skipped/non-exact Card Action shapes;
- inheritance across Card Action contract families;
- broad roster-wide Card Action completion;
- A-owned global KPI synchronization;
- release readiness.

## Final Judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

Accepted TO10 runtime target:

`2a3710fa5d2c91f601378e9b7d5979353f4b1951`

A03 may now synchronize this accepted TO10 candidate onto the current Phase 3 lineage and recompute A-owned coverage from the synchronized state.
