# P3-TO-13 Interaction Runtime r1 Independent Review

- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-TO-13`
- TargetCommit: `3964556699dafc116a67d7f43af9a740d17a0a04`
- Rejected Predecessor: `914934a3854b6128665917459438f6f1c07c0e86`
- Prior Review: `6153bda6ae50e0c091a366d4a3e2f09455b5320e` / `IMPLEMENTATION_NEEDS_REVISION`
- Review Branch: `codex/r-p3-to13-interaction-runtime-r2`
- Final Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking finding remains.

The three P1 findings from the first independent review are closed:

1. a server-owned interaction mutation now requires an authoritative expected revision and rejects a missing revision before dispatch;
2. successful owner-only target settlement no longer exposes selected private candidate identities through shared MatchSession logs/replay;
3. rejected private target dispatch no longer mutates shared logs, replay checkpoints, room version, or other contract-owned boundary state, and no rejected private identity is projected to observers.

The prior P3 evidence-hygiene finding is also closed: the EOF whitespace warning in `interaction-gateway.ts` was removed and fresh `git diff --check` is clean.

No new runtime, compiler, projection, reconnect, transport, or scope blocker was found.

## Prior Finding Closure

### P1 — missing expected revision accepted for interaction mutation

**CLOSED.**

Fresh reviewer probe against the exact repaired candidate sent `choose_target` against the live server-owned interaction with no expected revision.

Observed result:

```text
error = missing_expected_revision: interaction command requires expectedRevision
mutationFree = true

before / after:
revision        4 -> 4
logs           26 -> 26
replay          4 -> 4
replaySnapshots 4 -> 4
roomVersion     3 -> 3
pendingId       interaction-7 -> interaction-7
```

A stale revision was also independently replayed after successful settlement:

```text
error = Stale command revision: expected 4, current 5
mutationFree = true
```

The network protocol requires `expectedRevision` on `client:dispatch_command`, the production client waits for an authoritative match revision before dispatch, and `MatchRoomHub` independently enforces the interaction CAS boundary even for direct/internal callers.

### P1 — successful owner-only selection leaked through shared logs

**CLOSED.**

Fresh reviewer probe settled one legal private candidate and inspected the complete observer projection.

Shared dispatch log:

```json
{
  "type": "dispatch_ok",
  "message": "p1:choose_target",
  "payload": {
    "command": {
      "type": "choose_target",
      "privateSelection": "redacted"
    }
  }
}
```

Independent assertions:

```text
observerLogsContainSelectedId = false
observerReplayContainsSelectedId = false
```

The selected card may later become visible because the game effect itself plays that card face up; that authoritative public state transition is not a disclosure of the private interaction command payload.

### P1 — rejected private selection mutated logs/replay and leaked rejected id

**CLOSED.**

Fresh reviewer probe submitted a private hand card that was outside the authoritative candidate snapshot.

Observed result:

```text
ok = false
rejection.code = illegal_target
mutationFree = true
observerContainsRejectedPrivateId = false
```

The mutation-free comparison covered:

```text
revision
logs
replay
replaySnapshots
roomVersion
pending interaction id
```

All values remained identical before and after rejection.

`MatchSession` returns a failed owner-only interaction dispatch before shared logging/checkpointing, `MatchRoom` does not auto-advance a failed command, and `MatchRoomHub` does not bump room version for a failed dispatch.

## Semantic Routing / Scope Judgment

**PASS for the scoped TO13 representative.**

Accepted representative:

- Drake `servant.drake.skill.sc-drake-1`
- ability `sc-drake-1.mount-summon`
- semantic shape: action-phase active source; exactly one controller-hand private `card_instance` target; cardinality `0..3`; exactly one `base_power_at_most: 3` constraint; one `play_selected_cards` effect

Fresh cumulative static audit from the accepted TO13 base returned:

```text
NO_RUNTIME_IDENTITY_MATCHES
```

No Drake card id, ability id, localized name, or fixture identity is used by the runtime semantic route.

The Interaction Gateway uses a separate structural candidate envelope and exact semantic classifier. Recognized malformed near-matches fail closed at compiler/runtime admission rather than silently dropping to the legacy PendingDecision path.

No broader Interaction-family inheritance is accepted by this review.

## Interaction / Projection / Reconnect Judgment

**PASS.**

Independent evidence covers:

- owner-only authoritative candidate snapshot;
- optional `0..3` target selection;
- server-owned stable interaction identity;
- server-only continuation reference;
- owner receives safe interaction metadata while non-owner receives redacted waiting state;
- candidate snapshot does not expand merely because a later card becomes legal;
- a snapshotted card that is no longer legal is rejected on current-state revalidation;
- duplicate/wrong-owner/corrupt-continuation/terminal-replay cases fail closed;
- aggregate downstream payment failure rolls back without consuming the interaction;
- missing revision and stale revision are rejected before mutation;
- rejected private target preserves ability state, shared logs, replay, replaySnapshots and room version;
- successful private selection redacts its command payload from shared logs/replay;
- serialize/restore and browser reconnect preserve the same interaction id, revision and candidate snapshot;
- successful settlement removes the pending interaction exactly once;
- stale replay after settlement is rejected without resurrecting the interaction.

## Independent Verification

```text
fresh npm.cmd run typecheck
PASS

content:compile
7 masters, 7 servants, 20 events, 0 blocking issues

focused production/runtime review set
6 files / 44 tests PASS

@fd/server
2 / 2 PASS

independent adversarial probe
PASS
- missing revision rejected / mutation-free
- invalid private target rejected / mutation-free / no observer leak
- successful private target shared log redacted / no observer logs/replay leak
- stale replay rejected / mutation-free

TO13 Playwright stress
5 / 5 PASS

shared Gate C compatibility batch
5 / 5 PASS
- P3-TO-07 harness
- Command Spell resource core
- Golden Flow 2 combat/winner VP
- P3-TO-12 lifecycle source-active flow
- P3-TO-13 private/optional interaction

npm.cmd test
99 files total
89 passed / 10 failed
610 tests total
590 passed / 20 failed
```

All 20 root-suite failures are the inherited local CHM/original-image source-asset absence class. The failure count is unchanged from the TO13 predecessor/accepted upstream baseline class. No TO13 interaction, room boundary, compiler, MatchSession, projection, reconnect, protocol, stale-replay, or E2E regression is in the failure set.

`git diff --check` on the reviewed target: PASS.

## Gate Judgment

### Drake private/optional target representative

- Gate A: **PASS** — semantic admission is identity-independent, malformed claimed shapes fail closed, compiler/content admission is clean, and production interaction mutation requires authoritative revision CAS.
- Gate B: **PASS** — authoritative candidate snapshot/current-state revalidation, optional settlement, corrupt/replay/wrong-owner cases, downstream failure rollback, and rejected production dispatch transaction invariants pass independently, including logs/replay/roomVersion immutability.
- Gate C: **PASS** — real browser/server/WebSocket evidence proves owner-only projection, complete observer privacy, reconnect continuity, stable interaction identity, successful settlement, missing/stale revision rejection, and compatibility with the accepted shared Gate C harness; repeated Chromium runs pass 5/5.

## Residual Scope

This review does **not** claim:

- migration of the other 10 strict-pending abilities;
- migration of all 18 Interaction inventory abilities;
- acceptance of private-look, setup-selection, battle-owned selection, result-binding staged interactions, or other interaction templates by family similarity;
- global KPI/denominator changes before A-owned synchronization;
- elimination of the inherited CHM/original-image local asset failures.

Only the reviewed Drake private/optional hand-play representative is accepted here.

## A Synchronization Input

Codex A may synchronize the following reviewed facts:

```text
P3-TO-13 status: REVIEW_ACCEPTED
accepted runtime candidate: 3964556699dafc116a67d7f43af9a740d17a0a04
scoped Interaction representative migrated: 1
scoped dual runtime: 0
Gate A: PASS
Gate B: PASS
Gate C: PASS
```

A-owned synchronization must keep raw automation counters distinct from reviewed scoped acceptance when the global reporter does not classify this route automatically. No global `new/legacy` counter should be guessed from this report.

No other Interaction row may be counted migrated by family inheritance.

After A synchronization, TO13 releases its runtime hot-file lane and the next task must be selected from the accepted task index/queue rather than inferred from this representative.

## Final Judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

Accepted downstream runtime candidate:

`3964556699dafc116a67d7f43af9a740d17a0a04`

The reviewer report commit is evidence only; the runtime baseline remains the exact candidate above.