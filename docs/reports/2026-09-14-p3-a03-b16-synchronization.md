# P3-A03 B16 Battle-Loss Servant Reveal Synchronization

- Document Role: `COVERAGE_SYNC`
- Owner: Codex A
- Task: `P3-A03` consuming accepted `P3-B16 / P3-R10`
- Accepted runtime: `3f36eb39235d4e836304b2512b7f6a478287fd97`
- Independent review evidence: `6ef31cb039272290726d6475fd95ff2f453ada64`
- Review verdict: `ACCEPTED`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Reviewed Scope Synchronized

P3-B16 is now recorded as independently accepted for exactly one additional TO14 direct post-result consumer:

```text
servant.achilles.skill.sc-achilles-1
sc-achilles-1.achilles-heel
forced_trigger + after_controller_loses_battle
+ reveal_information(scope=servant_package, subject=controller.servant)
-> typed reveal_servant_package
```

The accepted runtime reuses the already accepted B13 post-scoring loss-event pipeline and the existing authoritative `abilityRuntime.revealedServants` truth source. First reveal emits typed `servant_package_revealed` evidence; repeated reveal is idempotent and produces no duplicate event.

Production routing is identity-free. No Achilles/card/ability identity is used as a routing condition.

No sibling TO14 consumer inherits migration or Gate status from B16.

## TO14 Scoped Burn-down Fact

Accepted TO14 specification denominator:

```text
battle integration total: 39 abilities / 28 cards
direct post-result / phase-terminal consumers: 13
B13 accepted direct consumers: 1
B14 accepted direct consumers: 1
B15 accepted direct consumers: 1
B16 newly accepted direct consumers: 1
accepted direct consumers total: 4
remaining direct consumers: 9
```

This is a scoped accepted overlay only. It is not substituted into the global raw semantic-axis counters unless A-owned coverage automation actually classifies the route.

## Fresh A-owned Coverage Measurement

`npm.cmd run phase3:coverage` on the reviewer-accepted B16 lineage produced:

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

B16 reviewer acceptance does not justify a synthetic global counter delta. The current reporter does not separately classify this accepted Battle Result -> Trigger -> typed Visibility bridge as a new raw semantic-route count.

The compiled content identity is also unchanged because B16 is runtime/compiler plumbing over existing authoring content rather than a content-definition change.

Unlike B15, the regenerated coverage artifact now contains substantive generic static-runtime evidence introduced by B16 (`servant_package_revealed` and `servant_package` occurrences in the typed/interpreter route), in addition to expected timestamp/source-line movement. The artifact is therefore retained in this synchronization even though the raw KPI and compiled definition hash do not change.

## Gate Synchronization

For the exact B16 slice:

```text
Gate A: PASS
Gate B: PASS
Gate C: PASS
scoped accepted direct TO14 consumers: 4 / 13
scoped residual direct consumers: 9 / 13
dual runtime claimed by B16: 0
```

Fresh independent R10 evidence includes:

- fresh reviewer worktree from exact candidate `3f36eb39235d4e836304b2512b7f6a478287fd97`;
- typecheck PASS;
- focused/current-lineage compatibility `10 files / 91/91 PASS`;
- reviewer-only adversarial probe proving renamed exact-shape classification, malformed-scope rejection, first reveal `applied + 1 event`, second reveal `no_op + 0 event`, and wrong-controller atomic rejection;
- typed `reveal_servant_package` uses the existing authoritative revealed-servant state and exposes `revealedCount` through normal result binding;
- B13 post-scoring barrier remains authoritative; a scoring-eliminated loser retains frozen-participant eligibility for the same-battle reveal;
- B15 terminal work remains after ordinary result/loss settlement;
- fresh Chromium Achilles + Eresh `2/2 PASS`, including public projection after reveal, reconnect persistence, stale-revision rejection, and no duplicate reveal;
- full root baseline `663 PASS / 20 inherited FAIL` across `683` tests;
- production-diff audit with no representative identity routing and no runtime implementation edits by the reviewer.

All 20 root failures remain the pre-existing local CHM/original-image evidence absence class.

Compared with accepted B15 baseline `655 PASS / 20 inherited FAIL`, B16 contributes `+8 PASS / +0 new deterministic failures`.

## Ownership / Residual Boundary

B16 acceptance does not promote:

- the other 9 direct TO14 result/phase-terminal consumers;
- Gatou `seeker.battle-end-reward` / Special directive behavior;
- Tomoe `penalty-on-defeat` or its unpreventable clause;
- Olga loss transformation;
- Artoria Alter optional battle-result triggers;
- Artoria Caster optional Luck-on-win triggers;
- declaration reveal via `on_use_declared`;
- arbitrary reveal scopes/subjects or broad Hidden Information behavior;
- broad Battle / Modifier / Power migration;
- TO15 Modifier/Power runtime;
- TO16 Special subsystem runtime.

The B16 runtime hot-file lane is released after independent R10 acceptance.

## Next Dependency

The next TO14 runtime work requires another fresh A-owned narrow handoff selecting one explicit representative from the remaining 9 direct consumers, followed by a new independent reviewer.

A03 does not automatically authorize broad TO14 migration, TO15 runtime, or TO16 runtime from this synchronization.
