# P3-A03 B15 Battle-Terminal Card Zone Synchronization

- Document Role: `COVERAGE_SYNC`
- Owner: Codex A
- Task: `P3-A03` consuming accepted `P3-B15 / P3-R09`
- Accepted runtime: `26be105af227306e5a7154ca0d7cdccac34d72bf`
- Independent review evidence: `2eb04b8495f988e8d2d78d63a580658ce6b3494d`
- Review verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Reviewed Scope Synchronized

P3-B15 is now recorded as independently accepted for exactly one additional TO14 direct phase-terminal consumer:

```text
servant.ereshkigal.skill.sc-ereshkigal-2
sc-ereshkigal-2.return-to-skill-zone
forced_trigger + after_battle_ended
+ SOURCE_ACTIVE source card
-> typed move_source_card(source -> controller skill)
```

The accepted runtime provides one stable phase-terminal `after_battle_ended` event per battle phase, only after all battlefield scoring and ordinary post-result work have settled, and before cleanup.

The source-card move is implemented as a reusable typed Card Zone primitive. Production routing does not branch on Ereshkigal, card ID, or ability ID.

No sibling TO14 consumer inherits migration or Gate status from B15.

## TO14 Scoped Burn-down Fact

Accepted TO14 specification denominator:

```text
battle integration total: 39 abilities / 28 cards
direct post-result / phase-terminal consumers: 13
B13 accepted direct consumers: 1
B14 accepted direct consumers: 1
B15 newly accepted direct consumers: 1
accepted direct consumers total: 3
remaining direct consumers: 10
```

This remains a scoped accepted overlay. It is not substituted into the global raw semantic-axis counters unless the A-owned coverage automation actually classifies the route.

## Fresh A-owned Coverage Measurement

`npm.cmd run phase3:coverage` on the reviewer-accepted B15 lineage produced:

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

B15 reviewer acceptance does not justify inventing a synthetic global counter delta. The current reporter does not separately promote this accepted Battle terminal -> Trigger -> typed Card Zone bridge into a new raw semantic-route count.

The regenerated coverage artifact differed only by `generatedAt` and shifted source-line metadata. The source fingerprint, compiled definition hash, substantive counts and classification totals were unchanged, so the generated artifact drift is intentionally not committed.

## Gate Synchronization

For the exact B15 slice:

```text
Gate A: PASS
Gate B: PASS
Gate C: PASS
scoped accepted direct TO14 consumers: 3 / 13
scoped residual direct consumers: 10 / 13
dual runtime claimed by B15: 0
```

Fresh independent evidence includes:

- typecheck PASS;
- focused/current-lineage compatibility `8 files / 112/112 PASS`;
- independent adversarial probe proving renamed exact-shape classification, near-miss rejection, stable terminal event ID, all four terminal blockers, stable replay dedupe, wrong-controller atomic rejection and off-board atomic rejection;
- stable server-owned terminal event ID `${battlePhaseResolutionId}:after_battle_ended` carrying battle/result/scoring receipt provenance;
- both authoritative battle paths settle base scoring and ordinary post-result work before terminal dispatch, then continue to cleanup;
- fresh Chromium Ereshkigal terminal Card Zone scenario `1/1 PASS`, including two battlefield result dispatches before terminal dispatch, `attack_area -> skill`, owner projection, reconnect, stale-revision rejection and no duplicate move;
- full root baseline `655 PASS / 20 inherited FAIL` across `675` tests;
- production-diff audit with no representative identity routing, exact supported semantics routed through typed `executeResolutionEffects()`, and malformed same-family shapes rejected before legacy fallback.

All 20 root failures remain the pre-existing local CHM/original-image evidence absence class.

Compared with accepted B14 baseline `648 PASS / 20 inherited FAIL`, B15 contributes `+7 PASS / +0 new deterministic failures`.

## Ownership / Residual Boundary

B15 acceptance does not promote:

- the other 10 direct TO14 result/phase-terminal consumers;
- Gatou `seeker.battle-end-reward`;
- Tomoe `penalty-on-defeat` or its "cannot be prevented" clause;
- Achilles reveal-related battle result behavior;
- Olga transformation behavior;
- optional battle-result interaction;
- broad Battle Power or Modifier migration;
- TO15 Modifier/Power runtime;
- unrelated Hidden Information, Movement or Special subsystem behavior.

The B15 runtime hot-file lane is released after independent R09 acceptance.

## Next Dependency

The next Battle/Resource/Card-Zone runtime work must begin with another fresh A-owned narrow handoff from the accepted TO14 contract, selecting an explicit representative from the remaining 10 direct consumers and requiring a fresh independent reviewer.

A03 does not automatically authorize broad TO14 migration or TO15 runtime from this synchronization.
