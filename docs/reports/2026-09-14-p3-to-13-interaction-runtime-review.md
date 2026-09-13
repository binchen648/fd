# P3-TO-13 Interaction Runtime Independent Review

- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-TO-13`
- TargetCommit: `914934a3854b6128665917459438f6f1c07c0e86`
- Base: `0a392558407dbfba0631bd426be41e77ced5c48a`
- Review Branch: `codex/r-p3-to13-interaction-runtime-review`
- Final Status: `IMPLEMENTATION_NEEDS_REVISION`

## Findings

### [P1] Missing `expectedRevision` is accepted for an interaction mutation

The accepted P3-TO-05 contract requires a missing interaction revision to be rejected as `missing_expected_revision`, with no mutation (`docs/plans/2026-09-13-p3-to-05-interaction-template-contract.md:161`).

The reviewed transport still declares `client:dispatch_command.expectedRevision` optional (`packages/rules/src/match-room-protocol.ts:8`), and `MatchRoomHub.assertExpectedRevision` explicitly returns when the value is absent (`packages/rules/src/match-room-hub.ts:137`).

Fresh reviewer probe against the exact TO13 candidate:

```text
pending interaction revision = 4
choose_target sent with no expectedRevision
threw = false
result.ok = true
revision after = 5
```

The command settled successfully. This violates the accepted Interaction Gateway CAS contract and permits a stale/unversioned client to mutate a private pending interaction.

**Required repair:** an interaction mutation must require an authoritative expected revision at the transport/handler boundary. Missing revision must fail closed without mutation. The repair must add a negative server/room test and a real protocol/E2E negative case.

### [P1] Owner-only selected candidate identity leaks to non-owner projections through shared logs

P3-TO-05 requires private candidate data to be projected only to the owner (`...interaction-template-contract.md:31`). TO13 correctly redacts the pending target window itself, but `MatchSession.dispatchPlayerAction` records the raw command payload (`packages/rules/src/match-session.ts:495-499`) and every client projection receives the shared log tail (`packages/rules/src/match-session.ts:824`).

Fresh reviewer probe after a successful private selection:

```text
selected = p1-private-preparation
observerProjectionContainsSelectedId = true
```

The observer received:

```text
dispatch_ok
command.type = choose_target
command.selectedIds = ["p1-private-preparation"]
```

This bypasses the owner-only interaction projection and exposes the private candidate instance identity after settlement.

**Required repair:** shared/non-owner logs must not contain owner-only interaction candidate identities, rejected candidates, continuation state, or equivalent private choice payload. Add an observer projection regression that inspects the complete projected JSON, including logs/replay, after successful settlement.

### [P1] Rejected interaction dispatch mutates logs/replay and leaks the rejected private identity

P3-TO-05 requires a rejected/invalid interaction dispatch to preserve state **including logs and revision** (`...interaction-template-contract.md:161,195`).

Fresh reviewer probe used a valid expected revision but selected a high-power hand card outside the authoritative candidate snapshot:

```text
result.ok = false
rejection.code = illegal_target
revision: 4 -> 4
pending interaction id: interaction-7 -> interaction-7
logs: 26 -> 28
replay checkpoints: 4 -> 5
observer projection contains rejected private id = true
```

The observer-visible `dispatch_rejected` log contained:

```text
selectedIds = ["p1-private-luck"]
```

So the underlying ability state rollback works, but the enclosing production `MatchSession` still mutates logs/replay and leaks the rejected private target. This fails both the transaction and projection portions of the accepted gateway contract.

**Required repair:** failed interaction mutation must not append authoritative/shared dispatch logs or replay checkpoints. If server diagnostics are desired, they must be separated from the contract-owned projected/logged match state and must not expose owner-only candidate identities.

### [P3] Candidate evidence claims `git diff --check` PASS while the reviewed target contains an EOF whitespace warning

Fresh reviewer check:

```text
packages/rules/src/ability/interaction-gateway.ts:45: new blank line at EOF.
```

This is not a runtime blocker, but the implementation report states `git diff --check -> PASS`. Repair should remove the whitespace and keep evidence statements exact.

## What Passed

The core semantic route itself is structurally scoped and identity-independent:

```text
NO_RUNTIME_IDENTITY_MATCHES
```

No Drake card id, ability id, localized name, or fixture identity was found in the new runtime routing diff.

Fresh reviewer verification:

```text
npm.cmd run typecheck
PASS

focused review set:
5 files / 41 tests PASS

- interaction-private-optional-runtime.test.ts
- executable-card-pack.test.ts
- ability-interaction-projection.test.ts
- match-room.test.ts
- match-room-hub.test.ts

Playwright TO13 happy-path E2E:
1/1 PASS
```

The candidate therefore has a functioning happy path, stable server interaction identity, snapshot/current-state target revalidation, reconnect restoration, compiler near-match rejection, and no runtime identity routing. The blocking problems are production-boundary contract gaps not covered by the candidate tests.

The reviewer did not rerun the full root suite after the three P1 findings made acceptance impossible. The implementation report records `587 passed / 20 failed`, with the same 20 inherited source-asset failures as the accepted TO12 baseline; this review does not dispute that baseline claim, but it is not sufficient to override the interaction contract failures above.

## Gate Judgment

For the scoped Drake private/optional target representative:

- Gate A: **FAIL** — missing revision is accepted at the room/protocol boundary, contrary to the accepted gateway admission contract.
- Gate B: **FAIL** — invalid target rollback preserves ability revision/state but mutates production logs/replay, violating the rejected-dispatch transaction contract.
- Gate C: **FAIL** — non-owner production projection leaks private selected/rejected target identities through shared logs despite the target window itself being redacted.

No Gate A/B/C promotion is accepted for TO13 at this commit.

## Required Repair Packet

Create a fresh repair branch/worktree from exact candidate `914934a3854b6128665917459438f6f1c07c0e86`. Do not edit this reviewer worktree.

The minimum repair must prove all of the following:

1. `choose_target` against an interaction with missing expected revision is rejected with a stable missing-revision error and no state/log/replay/revision mutation.
2. stale expected revision remains rejected before dispatch and mutation-free.
3. successful owner-only selection does not expose selected candidate ids to another player's complete projection, including logs and replay.
4. rejected owner-only selection does not expose submitted ids to another player's complete projection.
5. rejected interaction mutation leaves logs and replay checkpoint counts unchanged.
6. accepted owner projection still exposes the intended safe interaction metadata, while `continuationRef` remains server-only.
7. reconnect restores the same interaction id/revision/candidate snapshot.
8. semantic routing remains identity-independent and malformed claimed shapes remain fail-closed.
9. existing TO07/TO12 Gate C compatibility flows remain green.
10. `git diff --check` is clean.

After repair, create a **new fresh independent reviewer worktree** from the repaired exact SHA. Do not amend this review into acceptance.

## Final Judgment

`IMPLEMENTATION_NEEDS_REVISION`

Rejected candidate for Gate promotion:

`914934a3854b6128665917459438f6f1c07c0e86`

The reviewer report commit is evidence only and must not be used as an accepted runtime baseline.