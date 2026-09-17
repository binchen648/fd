# P3-A03 B13 Battle Loss Resource Synchronization

- Document Role: `COVERAGE_SYNC`
- Owner: Codex A
- Task: `P3-A03` consuming accepted `P3-B13 / P3-R07`
- Accepted runtime: `37189b32d4de0da3a8eabdca8edbf674c8852d97`
- Independent review evidence: `f1fa9c12ac43ab96050468f52070fc7ea53fd09d`
- Review verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Reviewed Scope Synchronized

P3-B13 is now recorded as independently accepted for exactly one TO14 direct battle-result consumer:

```text
master.shinji.skill.clown
clown.lose-command-seal
forced_trigger + after_controller_loses_battle
-> typed adjust_command_seals(-1)
```

The accepted runtime also closes the production ordering defect required by this slice: ordinary battle-result continuations now settle only after the phase-wide base-scoring barrier on both MatchSession and core game-loop battle entry paths.

No sibling TO14 consumer inherits migration or Gate status from B13.

## TO14 Scoped Burn-down Fact

Accepted TO14 specification denominator:

```text
battle integration total: 39 abilities / 28 cards
direct post-result / phase-terminal consumers: 13
B13 accepted direct consumers: 1
remaining direct consumers: 12
```

This is a scoped accepted overlay only. It is not substituted into the global raw semantic-axis counters unless the A-owned coverage automation actually classifies the route.

## Fresh A-owned Coverage Measurement

`npm.cmd run phase3:coverage` on the reviewer-accepted B13 lineage produced:

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

Therefore the global raw KPI remains:

```text
new=12
legacyExecute=3
legacyResolve=49
dual=0
```

B13 reviewer acceptance does not justify inventing a synthetic global counter delta. The current reporter does not separately promote this Battle -> Trigger -> Resource bridge into a new raw semantic-route count.

The regenerated coverage artifact differed only by `generatedAt` and shifted source-line metadata. The compiled definition hash and all substantive counts remained unchanged, so that generated artifact drift is intentionally not committed.

## Gate Synchronization

For the exact B13 slice:

```text
Gate A: PASS
Gate B: PASS
Gate C: PASS
scoped accepted direct TO14 consumers: 1 / 13
scoped residual direct consumers: 12 / 13
dual runtime claimed by B13: 0
```

Fresh independent evidence includes:

- typecheck PASS;
- B13/Olga/core focused `65/65 PASS`;
- current-lineage compatibility `16 files / 145/145 PASS`;
- independent two-battlefield adversarial probe proving both scoring receipts exist before the barrier, command seals remain 3 at barrier open, and become 2 only on result-event dispatch;
- stable server-owned `battlePhaseResolutionId / battleId / resultId`;
- re-entry no-duplicate proof and forged frozen-participant rejection;
- fresh Chromium Shinji + Olga `2/2 PASS`;
- full root baseline `644 PASS / 20 inherited FAIL` across `664` tests;
- production-diff audit with no representative identity routing and no supported legacy fallback.

All 20 root failures remain the pre-existing local CHM/original-image evidence absence class.

Compared with accepted TO10 current-lineage baseline `636 PASS / 20 inherited FAIL`, B13 contributes `+8 PASS / +0 new deterministic failures`.

## Ownership / Residual Boundary

B13 acceptance does not promote:

- the other 12 direct TO14 result/phase-terminal consumers;
- the other 26 Battle-integration rows;
- no-eligible-winner policy;
- broad Battle Power or Modifier migration;
- TO15 Modifier/Power runtime;
- Hidden Information, Movement, Special or unrelated subsystems.

The B13 runtime hot-file lane is released after independent R07 acceptance.

## Next Dependency

The next Battle/Resource runtime work must begin with a fresh A-owned narrow handoff from the accepted TO14 contract. It must select an explicit representative from the remaining 12 direct consumers, reserve the conflicting battle/runtime hot files, and require a fresh independent reviewer.

A03 does not automatically authorize broad TO14 migration or TO15 runtime from this synchronization.
