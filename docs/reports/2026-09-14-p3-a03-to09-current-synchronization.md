# P3-A03 TO-09 Current-Lineage Synchronization

- Document Role: `COVERAGE_SYNC`
- Owner: Codex A
- Task: `P3-A03` consuming accepted `P3-TO-09`
- Accepted runtime: `9718064d54876985b46fdefc99de4477a8b75368`
- Independent review evidence: `def13dd86711ffe9dc9df2b213e621b159479bb8`
- Prior rejecting review: `cb135814e120d840460262307aa31a93d28df917`
- Review verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Reviewed scope synchronized

P3-TO-09 is now recorded as `REVIEW_ACCEPTED` for exactly two `CARD_ZONE_CORE_DIRECT_ACTION` representatives:

1. Irisviel `conversion-magic.preparation` — `move_all_remaining` with actual `movedCount` binding into `adjust_mana`;
2. Kiritsugu `time-alter.action` — paired `play_selected_cards` face-down plus `draw_cards(1)` through the shared effect-play hook.

Fresh inventory on the accepted runtime remains:

```text
sourceFiles=14
cardZoneAbilities=8
eligible=2
skipped=6
legacyCardZoneDirectConsumerCount.before=2
legacyCardZoneDirectConsumerCount.after=0
newRuntimeSemanticRoutedCount.before=0
newRuntimeSemanticRoutedCount.after=2
dualCompatibleCount.before=2
dualCompatibleCount.after=0
remainingSkippedCount.after=6
```

The six skipped Card Zone abilities inherit no Gate status.

## Rejected predecessor separation

The first TO09 current-lineage review `cb135814e120d840460262307aa31a93d28df917` rejected baseline `5c557cb9d0177a99c0e017768dee42cccdc6a9ff` because coverage/inventory still claimed Card Zone migration while the exact production lineage no longer contained the typed Card Zone data-flow runtime or current-lineage Gate evidence.

Only repaired runtime `9718064d54876985b46fdefc99de4477a8b75368` is synchronized as accepted. The rejected predecessor is not promoted retroactively.

## Fresh A-owned coverage measurement

`npm.cmd run phase3:coverage` on the reviewer-accepted lineage produced:

```text
archives=14
cards=46
abilities=92
compiledCards=70
compiledCharacters=14
definitionHash=26167661823b52de598c77a59df4d05440a6bfced7d68cd3e04d11353d72dbaa
blockingIssues=0
newRuntimeSemanticRouted=12
legacyExecuteAbility=3
legacyResolveEffect=49
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
taxonomyWarnings=79
```

The raw global counters remain unchanged from TO08. The two TO09 representatives were already structurally counted by the raw coverage reporter before independent review; reviewer acceptance changes their accepted status rather than creating a synthetic second raw delta.

The generated coverage artifact changed only `generatedAt` plus source-line metadata from the accepted runtime line shifts, so it is intentionally not committed.

## Gate synchronization

For the exact two-consumer TO09 slice:

```text
Gate A: PASS
Gate B: PASS
Gate C: PASS
scoped migrated=2
scoped dual=0
```

Fresh independent evidence on the exact accepted runtime includes:

- typecheck PASS;
- focused TO09/compiler/representative suite `5 files / 88 tests PASS`;
- current-lineage Resource/Interaction/Trigger/Lifecycle compatibility `6 files / 31 tests PASS`;
- Chromium Conversion Magic + Time Alter Gate C `2/2 PASS`;
- full root baseline `603 PASS / 20 inherited FAIL` across `623` tests.

All 20 root failures remain the existing local CHM/original-image evidence absence class.

## Ownership boundary

TO09 acceptance does not pre-accept the broader Card Action family. Time Alter's paired PLAY path is accepted only as the TO09 representative evidence needed for the Card Zone batch; P3-TO-10 must still independently judge the scoped Card Action candidates and their current-lineage evidence.

No Add-to-Attack-only route/helper was imported by the TO09 repair. The six skipped Card Zone rows remain outside this acceptance.

## Next dependency

The next low-risk pending reviewer lane is `P3-TO-10` Card Action current-lineage review for the scoped PLAY, PLAY_SOURCE, ADD_TO_ATTACK, ACTIVATE, and CLOSE candidates.

R should judge the exact reachable current-lineage candidates and their Gate A/B/C evidence first. No broad Card Action rewrite or migration is authorized unless that reviewer identifies a concrete blocker.
