# P3-A03 B17 Olga First-Loss ACTIVATE Synchronization

- Document Role: `COVERAGE_SYNC`
- Owner: Codex A
- Task: `P3-A03` consuming accepted `P3-B17 / P3-R11`
- Accepted candidate: `ebd050a0a4e353c8f747a54dfb1d6f51e8068542`
- Independent review evidence: `ad7d2c9514f5545c0d61736059cb58a538091eff`
- Review verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Reviewed Scope Synchronized

P3-B17 is now recorded as independently accepted for exactly one additional TO14 direct result-event consumer:

```text
archive: master.olga-marie
card: master.olga-marie.skill.astronomical-science
ability: astronomical-science.first-loss
forced_trigger + after_controller_first_loses_battle
-> stage exactly one delayed activation after authoritative post-scoring first loss
-> formal round_end only
-> typed activate_card_by_id(master.olga-marie.skill.trismegistus-grief)
```

This is a current-lineage recertification of an already semantic-routed ACTIVATE composition. B17 itself adds no production runtime code; the accepted candidate contains only focused regression evidence plus its result report.

Production routing remains structural and identity-free. No Olga/card/ability identity literal is used by the ACTIVATE classifier, typed resolution path, or post-scoring battle bridge.

No sibling TO14 consumer inherits migration or Gate status from B17.

## TO14 Scoped Burn-down Fact

Accepted TO14 specification denominator:

```text
battle integration total: 39 abilities / 28 cards
direct post-result / phase-terminal consumers: 13
B13 accepted direct consumers: 1
B14 accepted direct consumers: 1
B15 accepted direct consumers: 1
B16 accepted direct consumers: 1
B17 newly accepted direct consumers: 1
accepted direct consumers total: 5
remaining direct consumers: 8
```

This remains a scoped accepted overlay only. It must not be substituted into global raw semantic-axis counters unless A-owned coverage automation actually classifies a new route.

## Fresh A-owned Coverage Measurement

Fresh `npm.cmd run phase3:coverage` on the exact R11-accepted B17 lineage produced:

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

B17 reviewer acceptance does not justify a synthetic raw counter delta. The regenerated `artifacts/phase3-skill-coverage.json` differed from the accepted B16 artifact only by `generatedAt`; source fingerprint, counts, compiled definition identity, and static evidence were unchanged. The timestamp-only drift is intentionally not committed.

## Gate Synchronization

For the exact B17 slice:

```text
Gate A: PASS
Gate B: PASS
Gate C: PASS
scoped accepted direct TO14 consumers: 5 / 13
scoped residual direct consumers: 8 / 13
dual runtime claimed by B17: 0
production runtime files changed by B17: 0
```

Fresh independent R11 evidence includes:

- fresh reviewer worktree from exact candidate `ebd050a0a4e353c8f747a54dfb1d6f51e8068542`;
- typecheck PASS;
- focused/current-lineage compatibility `7 files / 80/80 PASS`;
- B17 first-loss delayed-activation recertification `3/3 PASS`;
- identity-free ACTIVATE classifier positive plus wrong-trigger / extra-target / wrong-effect negatives;
- authoritative scoring receipt barrier before first-loss derivation and dispatch;
- stable `battlePhaseResolutionId`, `battleId`, `resultId`, participant, battlefield and `lossOrdinal=1` provenance;
- stable-event and pending-stage dedupe, with no activation during battle-result settlement;
- formal `round_end` typed activation exactly once;
- missing, ambiguous, wrong-controller, wrong-zone and already-active target paths remain fail-closed/atomic under the accepted ACTIVATE contract;
- scoring-eliminated Olga retains same-battle frozen first-loss eligibility;
- fresh Chromium Olga + Achilles + Eresh `3/3 PASS`, including projection, reconnect persistence, stale-revision rejection, and no duplicate activation/reveal/terminal settlement;
- full root baseline `666 PASS / 20 inherited FAIL` across `686` tests;
- candidate production runtime diff is empty and current production ACTIVATE/battle routing contains no representative identity branch.

All 20 root failures remain the pre-existing local CHM/original-image evidence absence class.

Compared with accepted B16 baseline:

```text
B16: 663 PASS / 20 inherited FAIL / 683 total
B17: 666 PASS / 20 inherited FAIL / 686 total
Delta: +3 PASS / +0 new deterministic failures
```

## Ownership / Residual Boundary

B17 acceptance does not promote:

- Olga `trismegistus.loss-transform`, soul-drag, or return-silence;
- Gatou `seeker.battle-end-reward` / Special directive behavior;
- Tomoe `sc-tomoe-1.penalty-on-defeat` or its unpreventable clause;
- Artoria Alter optional `noble-bloom` result consumers;
- Artoria Caster optional Luck-on-win consumers;
- broad delayed scheduling semantics;
- the other residual TO14 rows;
- broad Battle migration;
- TO15 Modifier/Power runtime;
- TO16 Special subsystem runtime;
- any synthetic coverage KPI or taxonomy/classifier change.

The B17 evidence/review lane is released after independent R11 acceptance.

## Next Dependency

The next TO14 runtime work requires a fresh A-owned narrow handoff selecting one explicit representative from the remaining 8 direct consumers, followed by a new independent reviewer. A03 does not automatically authorize broad TO14, TO15, or TO16 migration from this synchronization.
