# P3-R16 Independent Review — B22 Gatou Battle-End Reward

- Date: 2026-09-14
- Reviewer task: `P3-R16`
- Candidate task: `P3-B22`
- Candidate SHA: `134c61e3f0acd6fd5e28bcbb9557cbb45244ed93`
- Candidate base: `ac2d0a8af05eb6461c45a564f623b03807cb9a34`
- Reviewer branch: `codex/r-p3-b22-gatou-battle-end-reward-r1-review`
- Candidate PR: `#40`
- Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking findings.

Non-blocking test-infrastructure observation: fresh full-root execution in the reviewer worktree produced `700 PASS / 21 FAIL / 721 total`. Twenty failures are the inherited CHM/original-image evidence absence class. The additional failure is the existing `MatchSession` eleven-round smoke test exceeding its 5-second Vitest timeout only under full-suite parallel load. The same test passed three consecutive isolated reviewer runs in approximately `2.07s`, `2.07s`, and `2.13s`; the implementation lane had independently reproduced the same isolated 3/3 result. The candidate's pre-submit full-root run had already reached `701 PASS / 20 inherited FAIL`. This is therefore classified as load-sensitive test infrastructure rather than a new deterministic B22 production regression.

## Independent semantic-family judgment

ACCEPTED.

The production classifier is structural and identity-free. It accepts only the exact family:

- `forced_trigger`;
- `after_battle_ended`;
- exactly one `record_master_directive` effect whose semantic directive is `gatou_battle_end_mobile_players_reward`;
- no activation phase/window/source-state requirement;
- no conditions, targets, cost, creates, lifecycle, meaningful response-window customization, or limit;
- no unexpected effect keys beyond the accepted directive metadata.

The ability/card ID is not part of classification. Focused tests confirm renamed IDs still classify while wrong directives, wrong triggers, and extra conditions do not. Same-family malformed shapes fail closed atomically instead of entering legacy fallback.

The directive literal is the semantic route marker and is the only Gatou-specific-looking production literal found by the identity audit; no master/card/ability identity branch is used.

## Phase-terminal / post-scoring / participant judgment

ACCEPTED.

B22 consumes the authoritative `after_battle_ended` phase-terminal event after the post-scoring barrier. The event carries frozen battle-phase identity, battle/result/scoring receipt provenance, participant IDs, and battle outcomes. The trigger is rejected for a controller outside the frozen participant set.

Production-path focused proof records `battle_post_scoring_barrier_open` before `battle_terminal_event_dispatched`, and the fresh Chromium room proof observes the settled reward only after authoritative battle resolution/scoring. Re-entry of the same stable terminal event does not settle twice.

## Movement provenance judgment

ACCEPTED.

The reward counts each qualifying *other* player at most once and requires all of the following at settlement:

- the player is currently at the controller's current location;
- the player has an authoritative movement record entering that location during the current round;
- the record represents movement rather than deployment/placement;
- stale prior-round records and players who moved away do not qualify.

The focused suite covers duplicate movement records, stale movement, deployment-only colocations, controller self-exclusion, and moved-away players.

A separate reviewer-side no-repository-change runtime probe exercised a real authored `move_player` effect. It moved `p2` from `shinto` to `miyama_town`, emitted authoritative movement provenance with `movementKind: 'effect'` and `roundNumber: 1`, then dispatched the Gatou terminal event. B22 correctly identified `p2` as the sole qualifying player and changed `p1` mana from `4` to `5`. This independently verifies that authored effect movement participates in the same provenance contract as normal movement.

## Reward branch / resource judgment

ACCEPTED.

For every qualifying other player, B22 awards one unit of a single resource:

- if the controller is among the winners at the controller's current battlefield, the branch is victory points;
- otherwise the branch is mana.

Shared winners are handled correctly. The settlement event records requested delta, actual delta, before/after values, qualifying player IDs, phase-resolution identity, battlefield, resource, and branch. Mana cap behavior records actual rather than fabricated gain. Focused evidence verifies `11 -> 12` mana for a requested `+2` reward and reports `delta: 1`.

## Exactly-once / reconnect / stale judgment

ACCEPTED.

The B22 event route is stable-id deduplicated. Reprocessing the same terminal event leaves state unchanged. Fresh remote-room Chromium proof preserves the settled Gatou VP result across reconnect and rejects a stale revision replay without applying the reward again.

The reconnect test transport was also hardened in the candidate tests to wait for WebSocket `open` before sending and to close only after the send window, without changing production runtime behavior. Fresh ordered B13-B22 Chromium passed all ten cases.

## Gate evidence

- exact reviewer candidate SHA: `134c61e3f0acd6fd5e28bcbb9557cbb45244ed93`
- reviewer worktree started clean and remained production-clean
- `npm ci`: PASS
- `npm run typecheck`: PASS
- focused/current-lineage compatibility: `13 files / 117 tests PASS`
- B22 focused suite: `8 / 8 PASS`
- fresh ordered Chromium B13-B22: `10 / 10 PASS`
- reviewer full root: `700 PASS / 21 FAIL / 721 total`
- inherited evidence failures: `20`
- extra full-suite-only timeout: `1`, independently isolated `3 / 3 PASS` at approximately `2.07-2.13s`
- candidate pre-submit full root: `701 PASS / 20 inherited FAIL / 721 total`
- `git diff --check`: PASS
- production identity audit: PASS
- authored effect-movement reviewer probe: PASS (`p2` effect move -> Gatou `+1 mana`)

Relative to the accepted B21 baseline (`693 PASS / 20 inherited FAIL / 713 total`), B22 contributes `+8` passing tests and no new deterministic production failure.

## Gate A/B/C judgment

`GATE_A_B_CANDIDATE_ACCEPTED`.

B22 is acceptable for A-owned evidence synchronization. R16 does not itself rewrite taxonomy, coverage KPI, TO14 totals, broad Battle integration, or unrelated runtime families.

## A03 synchronization input

A03 may synchronize B22 using:

- accepted candidate: `134c61e3f0acd6fd5e28bcbb9557cbb45244ed93`;
- semantic family: forced phase-terminal `after_battle_ended` -> count authoritative current-round movement entrants colocated with controller -> `+1` resource per unique other player, using VP when the controller won at that battlefield and mana otherwise;
- accepted evidence: exact identity-free classification, frozen participant boundary, phase-wide post-scoring ordering, normal/effect movement provenance, stale/deployment/moved-away exclusion, per-player dedupe, shared-winner branch, typed actual-delta settlement, mana cap, stable replay exactly-once, reconnect preservation, stale-revision rejection, and atomic malformed-shape fail-closed behavior;
- compatibility: B13-B21/current-lineage green;
- final Chromium: `10 / 10 PASS`;
- full-root deterministic delta: `+8 PASS / +0 new deterministic failures` relative to accepted B21, with the same 20 inherited evidence failures.

After synchronization, the scoped TO14 accepted-direct-consumer overlay may advance from `11 / 13` to `12 / 13`. The sole remaining direct consumer is Olga `trismegistus.loss-transform`; it does not inherit B22 acceptance.
