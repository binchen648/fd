# P3-A03 Burn-Down Sync — Accepted P3-B05 R2

- Document Role: COVERAGE_SYNC
- Owner: Codex A
- Task: `P3-A03`
- Branch: `codex/a-p3-a03-b05-sync`
- Parent A Sync: `17a0306119ad02c7392526fc4eed427eace1c5da`
- Accepted Runtime Target: `c505c4748251feb9d151f4af52f091162a64a5b6`
- R05 Evidence: `47cc524d802fdac0432ef6e95aa180122a0f8161`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Judgment Consumed

P3-R05 independently accepted the repaired P3-B05 `CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE` candidate after the first review found and B repaired a shared card-play-forbid bypass. The accepted representative is:

- `master.kayneth.deck.volumen-hydrargyrum#volumen.extra-play`

R05 accepted the exact semantic contract only: fixed response cost, source-in-hand and mana revalidation, shared play-forbid inheritance, semantic routing without identity branches, and scoped browser/reconnect/stale-command evidence. No inheritance is granted to other Card Action families.

## A-Owned Raw Coverage Relationship

The corrected A automation baseline already counted Volumen as a semantic new-runtime route before R05 promotion. Parent raw counts remain:

```text
newRuntimeSemanticRouted=12
legacyExecuteAbility=3
legacyResolveEffect=49
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
```

The accepted B11 overlay remains the only global overlay not already represented in that raw classifier baseline:

```text
newRuntimeSemanticRouted=13
legacyExecuteAbility=3
legacyResolveEffect=48
dualRuntime=0
```

B05 acceptance therefore changes acceptance status, not global aggregate counters. Applying another `new +1 / legacy -1` would double-count Volumen.

## Accepted B05 Local Burn-Down

R05 accepts the scoped response-play transition:

```text
legacyPlaySourceResponseConsumerCount:             1 -> 0
newRuntimeSemanticRoutedPlaySourceResponseCount:   0 -> 1
dualCompatiblePlaySourceResponseCount:             1 -> 0
eligible / migrated / skipped:                     1 / 1 / 0
```

The B04 PLAY inventory may continue to list Volumen as `separate_contract:play_source_card_response`; that is not a remaining B05 migration gap. It is the intentional boundary between B04 normal PLAY and the independently accepted B05 response-play contract.

## Candidate History

Superseded / rejected:

- historical mixed-role B05 branch head `5f6b3fb`;
- clean B05 r1 `d03cde2f24b569222b3bd39b57f60dee610c7aa5`;
- first R05 review `b2e8db355266bfa9ff988d0a46f3c07b1af29c44` returned `IMPLEMENTATION_NEEDS_REVISION` after reproducing a shared card-play-forbid bypass.

Accepted replacement:

- B05 r2 `c505c4748251feb9d151f4af52f091162a64a5b6`;
- fresh R05 r2 evidence `47cc524d802fdac0432ef6e95aa180122a0f8161`;
- independent adversarial probes confirmed both post-window play-forbid insertion and post-window mana reduction reject with zero state commit.

## Accepted / Rejected / Pending

Accepted:

- exact Volumen fixed-cost response-play semantic route;
- local B05 burn-down `legacy 1->0`, `new 0->1`, `dual 1->0`;
- shared play legality inheritance and stale server revalidation.

Rejected/superseded:

- B05 r1 because it bypassed shared card-play forbids.

Pending:

- ADD_TO_ATTACK, CREATE_AND_ACTIVATE, ACTIVATE, CLOSE, and other Card Action contracts remain independent;
- full-roster migration and Phase 3/release completion remain open;
- unrelated missing-image evidence, historical absolute-path tests, and generated hash mismatch remain baseline issues.

## Dependency Changes

With R05 acceptance recorded, P3-B05 no longer owns the Card Action hot files. P3-B06 can now take the runtime hot-file reservation under its existing `READY_AFTER_P3_R04_OR_COORDINATOR` condition.

Next runtime task:

- `P3-B06` — `CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK`.

B06 must not inherit normal PLAY counters or the B05 response-play contract beyond shared helpers explicitly required by its own task.

## Ownership Boundary

This sync changes only A-owned evidence/report artifacts. It does not edit runtime, implementation tests, classifier rules, or reviewer judgments.

## Completion Claim

`COVERAGE_SYNC_CANDIDATE`
