# P3-B17 Olga First-Loss ACTIVATE TO14 Recertification Handoff

- Date: 2026-09-14
- Owner: Codex A handoff to Codex B
- Task: `P3-B17`
- Base lineage: A03 B16 sync `090b9a85aa7f18b1f8f98ecd01c4ea972cdb7a8e`
- Accepted prerequisites: B13/B14/B15/B16 + TO10 ACTIVATE current-lineage acceptance
- Status: `READY_FOR_RECERTIFICATION`

## Representative

```text
archive: master.olga-marie
card: master.olga-marie.skill.astronomical-science
ability: astronomical-science.first-loss
kind: forced_trigger
trigger: after_controller_first_loses_battle
effect: activate_card_by_id(master.olga-marie.skill.trismegistus-grief)
settlement: stage on authoritative first loss -> consume on formal round_end
```

This row is one of the remaining TO14 direct result-event consumers, but unlike the other remaining rows it is already `NEW_RUNTIME_SEMANTIC_ROUTED` and already has independently accepted ACTIVATE runtime from TO10.

B17 therefore exists to recertify the **current-lineage composition** after the B13 post-scoring battle envelope repair. It must not invent a new runtime primitive merely to create code churn.

## Default Execution Mode

B17 is **evidence-first / runtime-no-change by default**.

The current lineage already contains:

- structural `isActivateCardByIdTrigger` routing;
- authoritative first-loss staging;
- `pendingDelayedActivations` exactly-once guard;
- formal `round_end` consumption;
- typed `activate_card_by_id` result/evidence;
- remote-room/browser projection/reconnect/stale coverage.

Codex B should add only missing focused assertions/evidence needed to prove the TO14 ordering contract on this exact lineage. Production runtime files may be changed only if a fresh test demonstrates a concrete correctness blocker. If such a blocker is found, record it explicitly before repair and keep the repair narrow.

## TO14 Composition Contract

The exact accepted composition to prove is:

1. all supported battlefield base scoring receipts settle;
2. the server derives the first loss from authoritative battle history, never a client claim;
3. a stable `after_controller_first_loses_battle` event carries `battlePhaseResolutionId`, `battleId`, `resultId`, `battleParticipantIds`, `battlefieldId`, and `lossOrdinal=1`;
4. Trigger Gateway stages exactly one delayed activation for the controller and source ability;
5. no card activation occurs during post-scoring result settlement;
6. phase-terminal battle work and cleanup may proceed normally;
7. only formal `round_end` consumes the staged activation;
8. typed `activate_card_by_id` activates exactly one owned/controlled skill-zone Trismegistus card and emits typed activation/effect evidence;
9. reconnect, stale replay, repeated battle-phase entry, or duplicate first-loss observation must not stage or activate a second copy.

The existing frozen-participant rule remains authoritative: if base scoring eliminates Olga on the first lost battle, her same-battle first-loss trigger may still stage before later round-end activation, provided the target remains valid.

## Required Evidence

Fresh B17 evidence must include:

- current-lineage typecheck;
- identity-free ACTIVATE classifier positive and near-miss negatives;
- real `MatchSession` battle path proving scoring receipt/barrier precedes first-loss dispatch;
- first-loss event provenance fields and `lossOrdinal=1`;
- exactly one staged delayed activation even under duplicate/re-entry pressure;
- no immediate activation during battle-result settlement;
- formal `round_end` activates exactly once;
- target missing/wrong zone/ambiguous/wrong controller failures remain atomic;
- scoring-eliminated Olga still stages the same-battle first-loss activation;
- B13/B16 battle-loss compatibility remains green;
- remote-room Chromium Olga scenario proves battle -> round_end activation -> projection -> reconnect -> stale rejection without duplicate card/effect;
- full root baseline comparison against B16 `663 PASS / 20 inherited FAIL`;
- production-diff identity audit if any runtime change occurs.

A small B17-specific regression test or stronger assertions in existing focused tests are allowed if they are needed to expose TO14 ordering explicitly.

## Explicitly Out Of Scope

B17 does not migrate or promote:

- Olga `trismegistus.loss-transform`;
- Olga soul-drag / return-silence behavior;
- broad delayed scheduling semantics;
- Gatou terminal reward;
- Tomoe defeat penalty / unpreventable semantics;
- Artoria Alter optional battle-result triggers;
- Artoria Caster optional Luck-on-win triggers;
- broad Card Action semantics beyond the already accepted exact ACTIVATE route;
- TO15 Modifier/Power runtime;
- TO16 Special subsystem runtime;
- raw coverage KPI/classifier/taxonomy changes by Codex B.

## Reviewer Boundary

A fresh `P3-R11` reviewer must start from the exact frozen B17 candidate SHA and independently answer one question:

> Does the already accepted ACTIVATE route, on the current B13–B16 battle lineage, now satisfy the TO14 first-loss result-consumer contract end to end without hidden ordering, replay, identity-routing, or projection gaps?

Only an R11 acceptance may allow A03 to advance the scoped TO14 direct-consumer overlay from `4/13` to `5/13`.
