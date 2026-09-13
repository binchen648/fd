# P3-TO-13 Interaction Runtime R1 Repair

- Date: 2026-09-14
- Task: `P3-TO-13`
- Repair base: `914934a3854b6128665917459438f6f1c07c0e86`
- Blocking review evidence: `6153bda6ae50e0c091a366d4a3e2f09455b5320e`
- Branch: `codex/b-p3-to13-interaction-runtime-r1`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Gate promotion: **not claimed**; a new fresh independent review is required

## Repair scope

This repair addresses only the three P1 blockers and one evidence hygiene finding from the first independent TO13 review. The scoped runtime representative remains the same single Drake private/optional hand-play interaction. No additional interaction ability is migrated and no global coverage/KPI artifact is changed.

## P1-1: revision CAS is required at the production interaction boundary

The room protocol now requires `expectedRevision` for `client:dispatch_command`. The remote client does not send a command until it has an authoritative match revision.

`MatchRoomHub.dispatchCommand` independently verifies whether the current authoritative command is a `choose_target` against a server-owned pending interaction. For that mutation, an absent revision is rejected before dispatch with:

`missing_expected_revision: interaction command requires expectedRevision`

A mismatched revision remains rejected by the existing stale-revision guard. Both failures occur before `MatchRoom.dispatchClientCommand`, so ability state, match logs, replay checkpoints, room version and interaction identity remain unchanged.

Legacy non-interaction direct hub calls retain their prior optional revision parameter for internal compatibility; the network protocol requires the field for all dispatch commands, while the authoritative interaction handler enforces the accepted TO05 interaction requirement independently.

## P1-2: owner-only selection payload no longer enters shared logs

Before dispatch, `MatchSession.dispatchPlayerAction` identifies a `choose_target` mutation against an owner-only server interaction.

For a successful private interaction settlement, the shared match log records only:

```json
{
  "type": "choose_target",
  "privateSelection": "redacted"
}
```

It does not record the decision id, selected ids, candidate count, continuation reference, or other owner-only selection payload.

The resolved card may subsequently become public because the game effect itself plays the card face up; that public game-state transition is distinct from leaking the private command payload. Observer logs and replay metadata do not contain the private selected id.

## P1-3: rejected private interaction dispatch is mutation-free at MatchSession / room boundary

If `dispatchAbilityCommand` rejects an owner-only interaction mutation, `MatchSession` now returns the rejection immediately without:

- assigning persistent session rejection state;
- appending a shared `dispatch_rejected` log;
- consuming directives;
- appending replay/checkpoint state.

`MatchRoom.dispatchClientCommand` only runs the post-command auto-advance path when the dispatch succeeded.

`MatchRoomHub` only increments room version for successful dispatches.

Therefore an invalid private target preserves:

- ability revision;
- pending interaction id and candidate snapshot;
- match logs;
- replay entries and replay snapshots;
- room transport version;
- observer projection privacy.

## Evidence hygiene

The extra EOF blank line in `packages/rules/src/ability/interaction-gateway.ts` was removed. Fresh `git diff --check` is clean.

## Added production-boundary regression

`packages/rules/tests/regression/interaction-room-boundary.test.ts` exercises the actual `MatchRoomHub -> MatchRoom -> MatchSession -> ability runtime` production path.

It proves:

1. missing expected revision is rejected before mutation;
2. stale revision is rejected before mutation;
3. missing/stale rejection preserves revision/log/replay/replaySnapshot/roomVersion/pending identity;
4. an invalid owner-only target returns `illegal_target` while preserving the same boundary counters;
5. the rejected private card id is absent from the observer's complete room projection;
6. successful private selection uses a redacted shared command log;
7. shared replay metadata does not contain the selected private id.

## Strengthened real WebSocket / browser proof

`e2e/fd-private-optional-interaction.spec.ts` now performs, before the successful settlement:

- a deliberately malformed interaction command with no expected revision;
- a valid-revision command containing a private but illegal high-power target.

The test checks that both preserve revision/log/replay/pending interaction, and that the observer projection never receives the rejected private card id. It then reconnects, verifies the same server interaction identity and snapshot, settles successfully, verifies shared observer logs/replay do not contain the private command selection, and finally proves stale replay rejection.

## Verification

### Static / compile

- `npm.cmd run typecheck` -> PASS
- `npm.cmd run content:compile` -> `7 masters, 7 servants, 20 events, 0 blocking issues`
- `git diff --check` -> PASS
- repair runtime identity audit -> `NO_NEW_RUNTIME_IDENTITY_MATCHES`

### Production-boundary focused tests

Focused rules set after repair:

- `interaction-room-boundary.test.ts`
- `interaction-private-optional-runtime.test.ts`
- `executable-card-pack.test.ts`
- `ability-interaction-projection.test.ts`
- `match-room.test.ts`
- `match-room-hub.test.ts`

Result: **6 files / 45 tests PASS**.

The final R1 candidate also adds a direct `MatchRoomHub` boundary regression covering the same missing-revision / rejected-private-selection / redacted-success path independently from the dedicated interaction-room-boundary suite.

Server WebSocket package:

- `apps/server/src/match-server.test.ts`
- **2 / 2 PASS**

### TO13 Gate C stress

`e2e/fd-private-optional-interaction.spec.ts --repeat-each=5`:

- **5 / 5 PASS**

This includes the new missing-revision and invalid-private-target negative paths on every repeat.

### Shared Gate C compatibility

One batch containing:

- accepted P3-TO-07 room harness contract;
- Command Spell resource core;
- Golden Flow 2 combat/winner VP;
- P3-TO-12 source-active lifecycle;
- repaired P3-TO-13 private/optional interaction.

Result: **5 / 5 PASS**.

### Root full suite

`npm.cmd test`:

- test files: **89 passed / 10 failed (99 total)**
- tests: **591 passed / 20 failed (611 total)**

All 20 failures remain the inherited local CHM/original-image source-asset absence class already present in the accepted TO12 baseline and TO13 v0. The final R1 candidate adds four passing production-boundary/room-level tests over the original TO13 candidate; no new failure class appears.

## Required next step

Freeze an exact R1 candidate commit and create a **new fresh reviewer worktree** from that SHA. The new reviewer must re-run the three previously failing adversarial probes rather than inheriting this repair report, then independently judge Gate A/B/C for the same one-ability representative only.

No A03 burn-down or queue promotion is permitted before that fresh review accepts the repaired exact SHA.
