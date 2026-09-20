# P3-A R81 Darius CLOSE Review Conflict

- Role: Codex A
- Status: `ACCEPTANCE_CONTESTED_BLOCKED`
- Candidate: `776ee46f5612481176a853dba099b489328b3236`
- PR: `#388`
- Frozen identity: `servant.darius.skill.sc-darius-1`
- Scope: review-outcome synchronization and runtime-gap dispatch only

## Conflicting Evidence

The earlier A record `docs/reports/2026-09-20-p3-a-r81-darius-migration-acceptance-synchronization.md` cites an independent `MIGRATION_ACCEPTED` decision for this exact Candidate and records `141/944`. That record is retained as historical evidence.

The user has now supplied a separate independent R `FAILED` finding for the same Candidate. At `data/authoring/servants/servant.darius.json`, the residual is `after_battle_ended + close_source_card`. The exact typed CLOSE matcher in `packages/rules/src/ability/interpreter.ts` accepts only `on_card_played`; Darius consequently uses the legacy `close_source_card` handler in `packages/rules/src/ability/extended-effects.ts`. The reviewer observed, after real `MatchSession.resolveBattlePhase`, that the source moved to skill and became inactive but retained public visibility and emitted no `source_card_closed` event. The candidate test asserted zone and active state only. Text, hashes, static metadata, focused 17/17, typecheck, and content validation passing do not close this semantic mismatch.

This new R finding is user-supplied and has no stable canonical review URL in this record. It is sufficient to stop treating the prior acceptance as uncontested, but A does not adjudicate which R decision supersedes the other. A must not independently relabel the prior verdict as false or claim a fresh Gate result.

## Accounting Hold

```text
previously recorded formal count: 141/944, remaining 803
uncontested pre-Darius count:    140/944, remaining 804
Darius credit:                  CONTESTED_HOLD (+1 not usable for new dispatch)
FB2-39 capability credit:       0
```

Do not merge or retarget PR #388, credit Darius in downstream burndown, or dispatch another S consumer based on this contested `+1`. The historical acceptance record is not deleted; the next independent R decision must explicitly bind its exact Base/Candidate and explain the CLOSE-path evidence before formal reconciliation.

## Runtime Semantic Gap

`RUNTIME_SEMANTIC_GAP`: the accepted typed CLOSE contract does not cover a combat-end residual source-close shape. Legacy handling misses the typed visibility and event-audit semantics. Route this to B2 as `P3-FB2-39-TRIGGERED-RESIDUAL-CLOSE` using a shared semantic shape, not an identity-specific Darius patch.

Sequence: B2 implementation candidate -> R capability review -> A capability sync -> S Darius recertification on the accepted runtime -> fresh R migration review -> A migration-credit reconciliation. B2 runtime work is allowed here because the current S migration is blocked by this concrete shared semantic gap; unrelated zero-credit runtime work remains deferred.
