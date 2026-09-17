# P3-A03 TO-10 Current-Lineage Synchronization

- Document Role: `COVERAGE_SYNC`
- Owner: Codex A
- Task: `P3-A03` consuming accepted `P3-TO-10`
- Accepted runtime: `2a3710fa5d2c91f601378e9b7d5979353f4b1951`
- Independent review evidence: `9ad0d4e44028cf50c047b60390af992d94e543a0`
- Prior rejecting review: `62c428ac7caf039e60404ad73c39285a71c99019`
- Review verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Reviewed scope synchronized

P3-TO-10 is now recorded as `REVIEW_ACCEPTED` for exactly five independent Card Action contracts on the repaired current lineage:

1. `PLAY` — Kiritsugu `time-alter.action`;
2. `PLAY_SOURCE_CARD_WITH_COST_RESPONSE` — Kayneth `volumen.extra-play`;
3. `ADD_TO_ATTACK` — Maiya `military.attach-support-shot`;
4. `ACTIVATE` — Olga-Marie `astronomical-science.first-loss`;
5. `CLOSE` — Artoria Alter `sc-artoria-alt-2.angra-mainyu-embrace`.

These are five separate accepted contracts. Acceptance does not flow from one Card Action shape into another.

## Rejected predecessor separation

The first current-lineage TO10 review at `62c428ac7caf039e60404ad73c39285a71c99019` rejected baseline `a8682306bce4829db2436e4f8b80734834af6de4` because only the exact PLAY route was present while PLAY_SOURCE, ADD_TO_ATTACK, ACTIVATE, and CLOSE typed runtime/evidence were absent from the exact current lineage.

Only repaired runtime `2a3710fa5d2c91f601378e9b7d5979353f4b1951` is synchronized as accepted. Detached historical B05/B06/B07/B08 acceptance was used as repair reference only and is not retroactively treated as current-lineage evidence.

## Scoped inventory facts

Fresh A/reviewer inventory reproduction remains:

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

PLAY_SOURCE remains the separate exact Volumen response-play contract and is covered by its accepted current-lineage regression/browser evidence.

The six skipped Card Action rows inherit no Gate status.

## Fresh A-owned coverage measurement

`npm.cmd run phase3:coverage` on the reviewer-accepted lineage produced:

```text
archives=14
cards=46
abilities=92
compiledCards=70
compiledCharacters=14
definitionHash=37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333
blockingIssues=0
newRuntimeSemanticRouted=12
legacyExecuteAbility=3
legacyResolveEffect=49
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
taxonomyWarnings=79
```

The raw global semantic/legacy/dual counters remain unchanged from TO09. These five exact Card Action candidates were already represented by the raw structural reporter before current-lineage independent promotion, so A03 does not invent a second global delta.

Unlike TO09, the generated coverage artifact has one meaningful compiled-evidence change in addition to timestamp/source-line metadata: the executable definition hash changed from `261676...` to the verified current-lineage hash `37551fd5...`. Therefore the regenerated coverage artifact is committed in this synchronization.

## Gate synchronization

For the exact TO10 five-contract slice:

```text
Gate A: PASS
Gate B: PASS
Gate C: PASS
scoped accepted contracts=5
scoped dual=0
```

Fresh independent evidence on the exact accepted runtime includes:

- typecheck PASS;
- five-contract focused/compiler/data-flow suite `8 files / 117 tests PASS`;
- accepted current-lineage Resource/Card Zone/Interaction/Trigger/Lifecycle compatibility `7 files / 35 tests PASS`;
- fresh Chromium five-contract group `5/5 PASS` after one documented non-reproducing Time Alter wait timeout;
- Time Alter isolated reviewer retries `2/2 PASS`;
- full root baseline `636 PASS / 20 inherited FAIL` across `656` tests;
- executable hash independently recomputed and matched stored/runtime identity fields;
- production-diff identity audit found no representative card/ability routing branch.

All 20 root failures remain the existing local CHM/original-image evidence absence class.

## Ownership and acceptance boundary

TO10 acceptance does not migrate the six skipped/non-exact Card Action shapes and does not grant broader family inheritance.

TO08 Resource, TO09 Card Zone, TO11 Trigger, TO12 Lifecycle, and TO13 Interaction accepted boundaries remain green under the TO10 compatibility run.

No broad hidden/private, payment, battle, modifier/power, setup, or special-subsystem runtime migration is implied by this synchronization.

## Next dependency

The low-risk TO08/TO09/TO10 current-lineage review chain is now synchronized through independent acceptance.

TO14 Battle/Resource and TO15 Modifier/Power already have accepted specification/design lanes only; any runtime implementation from those specs still requires a fresh, narrow B-owned task with an explicit representative and exclusive hot-file ownership. TO16 remains planning/special-isolation scope.

No automatic broad Card Action continuation is authorized from this synchronization.
