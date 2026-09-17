# P3-A03 TO-12 Synchronization

- Date: 2026-09-14
- Role: Codex A synchronization
- Source reviewer evidence commit: `26dc0b2ddcff4d0786f3c08800ef0030c0e606d2`
- Accepted runtime baseline: `da563815415e5f6240a6a0b9f62f6310e2c1146e`
- Accepted source-state policy review: `f7435cca3d884357c7fc2aeb829610421f8e357a`
- Review status: `GATE_A_B_CANDIDATE_ACCEPTED`
- Synchronization status: `COVERAGE_SYNC_CANDIDATE`

## Accepted scoped transition

The independent R2 review accepts exactly one Lifecycle Runtime representative:

- SC3 source-active duration/cleanup representative: **migrated 1**;
- scoped dual runtime: **0**;
- Gate A: **PASS**;
- Gate B: **PASS**;
- Gate C: **PASS**.

This synchronization does not infer migration or Gate acceptance for any other Lifecycle/reset row. The denominator remains **11 explicit lifecycle/reset abilities** and **22 lifecycle policy memberships**.

## Fresh A measurement

`npm.cmd run phase3:coverage` on the accepted runtime produced:

```text
archives=14
cards=46
abilities=92
compiledPack=fd-playtest-v1@1
compiledDefinitionHash=26167661823b52de598c77a59df4d05440a6bfced7d68cd3e04d11353d72dbaa
compiledCards=70
compiledCharacters=14
blockingIssues=0
newRuntimeSemanticRouted=12
legacyExecuteAbility=3
legacyResolveEffect=49
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
taxonomyWarnings=79
```

The raw reporter does not currently classify the accepted SC3 lifecycle route as a new runtime semantic consumer. A03 therefore does not rewrite classifier behavior and does not invent a synthetic global `new/legacy` delta. The scoped reviewed fact (`migrated=1 / dual=0`) is recorded separately from the raw global counters.

## Coverage artifact synchronization

`artifacts/phase3-skill-coverage.json` is regenerated from the accepted runtime because the prior artifact still referenced definition hash `5aa5a186...`.

The synchronized artifact now records:

- definition hash `26167661823b52de598c77a59df4d05440a6bfced7d68cd3e04d11353d72dbaa`;
- `lifecycle:sourceValidity:kind:accepted_source_state_policy = 1`;
- `lifecycle:sourceValidity:owner:card_zone_source_state = 1`;
- `lifecycle:sourceValidity:policyId:fd.card-zone.active-card-source.v1 = 1`;
- unchanged raw runtime counters `12 / 3 / 49 / 0` for new / legacyExecute / legacyResolve / dual.

No taxonomy or classifier code was changed.

## Queue / ownership update

- P3-TO-12: `REVIEW_ACCEPTED`.
- P3-TO-12 releases `interpreter.ts` / related runtime hot-file ownership.
- P3-TO-07 remains `READY_NEXT` and is the next prerequisite lane.
- P3-TO-13 remains `WAIT_TO07`; its TO-12 conflict is cleared.
- Once TO-07 is independently available, TO-13 may become the next exclusive runtime owner according to the queue.

## Guardrails

This synchronization does **not**:

- change runtime source or implementation tests;
- alter the accepted source-state policy;
- change coverage classifier rules;
- promote any non-SC3 Lifecycle/reset row;
- infer a global Gate state for the Lifecycle family.

Final A03 status: `COVERAGE_SYNC_CANDIDATE`.
