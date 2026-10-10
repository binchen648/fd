# C01 Live Collection And Trial Contract

Published: 2026-10-10. Epoch: FD-P3-2026-09-23-08.
Planner scope: automation only; no new Epoch or promotion authority.

## Registered Input

Preview candidate: 2ab7bda1d044f7ca04c79e36e107a4627aa4b4ca.
Implementation: 13f8b5c6f9493daa8bb84f4415e8930a78bdd5ea.
Base: bbbeabbd92e6db49fe04a457db9a2c3f0c80a1c9.
User supplied Reviewer verdict: PASS, READ_ONLY_PREVIEW_ONLY, 47/47 tests.
No immutable review commit/hash was supplied in this handoff. Record that
publication gap; do not invent a GitHub attestation or machine acceptance.
This contract does not accept the candidate's broader dispatch capabilities.

## C01-COLLECT-01: Codex A

State: AUTHORIZED_IMPLEMENTATION_AFTER_PATH_RESERVATION.
Read the agent contract, this file, the pinned preview source and applicable
C01 handoff only. Use a clean isolated worktree and identify its exact base.
No whole historical branch merge. Declare source/test paths before editing.
Reserve the C01 automation domain; do not compete with A's B11 tooling files.

Implement a read-only collector that feeds the existing preview evaluator.
Only explicitly registered tasks, worktrees and worker metadata may be read.
Do not scan all conversations, read private storage or resume desktop threads.

Required facts and provenance:

- Queue: explicit Planner-approved commit/path/blob and task/epoch/role/base.
  A snapshot cannot authorize itself. Missing pinned authorization blocks.
- Git: resolve real objects, ancestry, observed HEAD/main and dirty state in
  the registered checkout. Report unavailable Git facts; do not trust labels.
- Reviews: read exact commit/path bytes, recompute digest and match candidate,
  task, role, scope and verdict to pinned independent evidence. Chat PASS alone
  is not PASS_EXACT_BOUND. Hash integrity alone is not signer authentication.
- Worker: owning supported transport supplies current idle/direct-input facts;
  unknown/busy status blocks. No generic registry boolean proves live status.
- Locks/delivery: use an explicitly selected authoritative local store. Missing
  store, conflicting owner or uncertain delivery blocks. Preview never creates
  a writer lease and never changes accepted state.
- Freshness: report collection time, source versions, partial failures and
  consistency. Unstable observations block rather than mixing versions.

Output: versioned sanitized facts, per-source verification results, blockers
and preview result. Always dispatchAuthorized=false and acceptanceGranted=false.
Keep local paths, IDs and raw conversation content out of committed artifacts.
No transport send, task execution, registry mutation, runtime/KPI/authoring or
promotion-policy edits. Do not add aliases or waive unavailable observations.

Tests: stale/dirty checkout, missing or tampered review, scope/identity mismatch,
unbound authorization, main change during collection, unknown worker/lock,
partial collection failure, positive real temporary Git input and purity.
Run existing 47 tests plus collector tests and targeted typecheck. Report
mock tests separately from real-source tests. Freeze exact candidate for RA.

## C01-COLLECT-RA: Reviewer A

Read-only review of collector source authenticity, refusal behavior, sanitized
outputs and exact execution evidence. Verify real Git/review source negatives,
not just matching fabricated snapshots. Publish immutable exact-SHA evidence.
PASS here accepts collection/preview only, not sending or promotion.

## C01-TRIAL-01: Contract Only, Not Dispatch Authorization

State: BLOCKED_PENDING_COLLECTOR_REVIEW_AND_EXPLICIT_PLANNER_SEND_AUTHORIZATION.
Transport: dedicated CLI worker only. Existing desktop chats remain disabled.
One explicitly registered idle worker, one task, one dispatch ID, one controller.
First task is a read-only audit of a bounded supplied artifact with structured
ACK/result, not a game implementation, acceptance decision or engineering edit.
Use a disposable read-only workspace; no secrets or production write access.

Before sending, Planner must bind exact task/worker/base, accepted collector,
review evidence, paths/domains and stop conditions. Sending requires fresh
preflight, not an earlier PREVIEW_READY label. Record reservation durably
before transport write and acquire the selected domain atomically with an
exclusive store transaction. Test two contenders and process restart first.
Prefer existing local transactional APIs; unknown ownership blocks.

Bind ACK/result to thread, turn, dispatch ID and task-packet digest. Transport
acceptance, completion and task success are distinct states. Uncertain delivery
stays reserved; reconcile without resend. Lease expiry alone cannot prove a
worker stopped or permit duplicate delivery. Interrupt known incomplete work
and close the owned transport; no background monitor or automatic retries.

## Owners And Continuation

A implements the collector; RA independently reviews. Planner then defines
the exact trial packet and durable reservation scope before authorizing it.
No actual worker is started by publishing this contract. B and I have no work
in this stage. C01 remains separate from B11 CI/source-binding reconciliation.
All credit deltas remain zero; Gate C and Release blockers are unchanged.
