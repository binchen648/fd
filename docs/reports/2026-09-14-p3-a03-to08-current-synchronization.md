# P3-A03 TO-08 Current-Lineage Synchronization

- Document Role: `COVERAGE_SYNC`
- Owner: Codex A
- Task: `P3-A03` consuming accepted `P3-TO-08`
- Accepted runtime: `81dfe1b2d7651adc10e4bc03a13c6df15ccee3ef`
- Independent review evidence: `5d8497ff255b83123525b5425cf7ec37d391f3bf`
- Review verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Reviewed scope synchronized

P3-TO-08 is now recorded as `REVIEW_ACCEPTED` for exactly three `RESOURCE_NUMERIC_CORE_DIRECT_ACTION` consumers:

1. Gatou command spell gain mana / command-seal spend;
2. Olga-Marie command spell gain mana / command-seal spend;
3. Tomoe Independent Action victory-point adjustment.

The fresh direct-action inventory remains:

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

The other 14 Resource Numeric abilities are not promoted by family inheritance.

## Fresh A-owned coverage measurement

`npm.cmd run phase3:coverage` on the reviewer-accepted current lineage produced:

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

The raw global counters do not change from the preceding TO13 synchronization. TO08's three direct consumers were already structurally counted by the raw reporter before independent review; the R judgment changes their **accepted status**, not the raw route count. No synthetic `+3` is applied to global `newRuntimeSemanticRouted`.

The generated artifact differed only in `generatedAt` and source-line metadata caused by already accepted runtime line shifts. It is therefore not committed by this synchronization.

## Gate synchronization

For the exact three-consumer Resource slice:

```text
Gate A: PASS
Gate B: PASS
Gate C: PASS
scoped migrated=3
scoped dual=0
```

Gate C is current-lineage evidence, not inherited from detached historical branch `b1a1dc8...`. The accepted runtime independently proves browser/WS production dispatch, reconnect, missing-revision rejection, stale-revision rejection, and no duplicate resource mutation.

The global room-dispatch CAS repair also preserves the already accepted TO13 interaction behavior; it does not reopen or broaden TO13 acceptance.

## Rejected predecessor separation

The first current-lineage TO08 review `8f3e834caa70a2f4b6c4df7ba9faa23ffd34b73c` rejected the then-integrated baseline because Resource `activate_ability` could mutate without `expectedRevision`.

Only repaired runtime `81dfe1b2...` is synchronized as accepted. The rejected predecessor is not promoted retroactively.

## Next dependency

The next low-risk pending review lane is `P3-TO-09` Card Zone current-lineage independent review.

This synchronization does not authorize a Card Zone runtime rewrite. R should first judge the reachable/current integrated Card Zone candidate and request a repair only for a concrete blocker.
