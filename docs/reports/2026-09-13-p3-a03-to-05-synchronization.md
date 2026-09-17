# P3-A03 TO-05 Synchronization

- Document Role: REVIEW_OUTCOME_SYNC
- Owner: Codex A
- Source Task: `P3-A03`
- Specification Task: `P3-TO-05`
- Final Spec Branch: `codex/b-p3-to-05-interaction-template-contract-v2`
- Final Spec Commit: `8e3588c`
- Taxonomy Baseline Commit: `146213f`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Reviewer Outcome: `SPEC_ACCEPTED` on 2026-09-13, supplied by the user after independent review.
- Gate Promotion: none; TO-05 is a specification-only task.

## Accepted Scope

The accepted Interaction Template contract separates target selection, response, branch choice, yes/no, amount selection, and ordering from trigger timing, lifecycle, hidden-information policy, and effect execution.

The corrected denominator is:

```text
explicitInteractionAbilities=18
strictPendingInteractionAbilities=11
```

The old `20/11` kickoff handoff is historical and must not be used as current evidence.

## Coverage Synchronization

Fresh A automation reports:

```text
newRuntimeSemanticRouted=12
legacyResolveEffect=49
legacyExecuteAbility=3
dualRuntime=0
notClassifiable=28
strictDomainTriggerAbilities=37
explicitInteractionAbilities=18
strictPendingInteractionAbilities=11
```

TO-05 changed specification and taxonomy only. It did not migrate a runtime consumer, so no legacy burn-down or Gate transition is attributed to it.

## Retained Boundaries

- All 18 interaction abilities remain subject to later runtime qualification; specification acceptance is not runtime acceptance.
- Only 11 abilities are strict target-based PendingInteraction candidates.
- Trigger, lifecycle, modifier, power, battle result, and hidden-information runtime remain separate gateways.
- Global retained paths remain `legacyResolveEffect=49`, `legacyExecuteAbility=3`, and `dualRuntime=0` in this A checkout.
- Golden Eater remains an automation classification gap until a separately authorized A classifier task consumes its production route.
- The broad throughput plan and taxonomy-remediation report still contain the historical `20` interaction denominator. They are outside P3-A03's allowed paths and remain an `AUTOMATION_EVIDENCE_GAP`; the generated matrix, accepted TO-05 specification, and this sync use `18/11`.

## Next Authorized Work

`P3-TO-03 Domain Event Trigger Gateway` is ready for Codex B in the specification lane only. Runtime authorization remains `NONE`.

Companion artifacts:

```text
artifacts/phase3-a03-to-05-synchronization.json
artifacts/phase3-to-03-trigger-gateway-handoff.json
```
