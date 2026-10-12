# B11 Transport Security Repair Dispatch

Published: 2026-10-12. Owner: Codex B / communication runtime owner.
Task: P3-E09-B11-TRANSPORT-SECURITY-REPAIR.
Status: AUTHORIZED_SCOPED_REPAIR_PENDING_WRITER_RESERVATION.
Epoch 09 transition remains pending governance publication on main; main's
published Epoch is 08. This explicit dispatch authorizes the bounded repair
now, not activation of an unpublished mainline epoch or runtime promotion.

## Recorded Failure

Reviewer B commit: cf179ca3220a1646c484aa8c660b313e64449488.
Remote: codex/rb-p3-e08-b11-463facb-review, exact head verified.
Artifact: docs/reviews/phase3/P3-E08-B11-463facb-final-combination-reviewer-b.json.
SHA-256: 051F5E95C74E9C78546C391FD60F041D9BAEF29FBBA857EC455A598F8D2395BF.
Reviewed carrier: 463facb109cc4d19c4fda7af936fb4546fb86091.
Tested implementation: 9a4f4c6ee2723eb7f546341f3c18a1f0a29c3bc1.
Final combination: FAILED, not merely missing administrative evidence.

- P0: public/predictable credentials and duplicate join enable real host
  impersonation and Golden Eater mutation.
- P1: missing end_turn revision bypasses the freshness gate and settles phases.

User's limited risk/adoption approval does not waive either technical defect.
Conversion-only acceptance and A execution completeness remain scoped historical
results. I is unauthorized. G must bind this failure and keep final review
pending rather than certify readiness from the previous approval.

## Baseline And Resource Ownership

Create a separate clean repair worktree/branch from exact reviewed carrier
463facb109cc4d19c4fda7af936fb4546fb86091. Report branch/base/source identities.
Do not replay an entire old branch onto main or reinterpret this as mainline
promotion. Main observation: 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c.

Before source edits, obtain exclusive session-authority/server-transport
reservation from the actual active writer registry/owners; report the record.
This dispatch assigns B responsibility but does not claim that unknown existing
reservations have been released. If a competing writer exists, report one
bounded conflict; do not reset, kill workers or edit their worktrees.

Authorized source/test paths:

- packages/rules/src/match-room.ts
- packages/rules/src/match-room-hub.ts
- packages/rules/src/match-room-protocol.ts
- packages/rules/tests/match-room.test.ts
- packages/rules/tests/match-room-hub.test.ts
- apps/server/src/match-server.ts
- apps/server/src/match-server.test.ts
- apps/client/src/state/match-room-client.ts (protocol compatibility only)
- apps/client/src/state/remote-room-fixture.ts (credential-consumer compatibility only)
- e2e/support/prepare-conversion-magic-room.ts
- e2e/support/prepare-golden-eater-room.ts
- e2e/fd-conversion-magic-core-primitive.spec.ts
- e2e/fd-golden-eater-result-binding.spec.ts
- e2e/fd-remote-sync.spec.ts
- artifacts/phase3-e09-b11-transport-security-repair.json
- docs/reports/2026-10-12-p3-e09-b11-transport-security-repair.md

Inspect real callers first. If another path is genuinely necessary, return its
exact path/reason for one scope extension; do not weaken DTO checks or leave
an insecure compatibility alias to avoid the request. No interpreter, compiler,
resolution semantics, authoring, classifier, workflow or test-timeout edits.

## Implementation Boundaries

P0 first: use cryptographically unpredictable server-generated credentials;
separate private credential storage from public client DTOs. Issue credentials
only through creation/new-identity or authenticated reconnect flows, never
through projections/broadcast or unauthenticated duplicate identity join.
Authenticate WS from private state before granting viewer/seat/host authority.
Cover persisted/legacy predictable credentials explicitly: reject or securely
invalidate unsafe credentials; no public-id-only recovery or silent insecure
fallback. Document effects on existing reconnect sessions. Do not log tokens.
Respect existing browser/shared-package boundaries for cryptographic APIs.

P1 second: require a validated numeric revision for game-state mutation commands,
including dispatch and end_turn, through one authoritative freshness boundary.
Reject missing, wrong-type, invalid and stale values before state mutation.
No global freshness demand for unrelated read-only/connection operations.
Version bumps and accepted-mutation broadcasts occur only after success.
Existing socket replacement/disconnection protection must remain functional.

These are two acceptance boundaries within one transport repair task, not two
role-level stacked PRs. B may use separate implementation commits for clarity,
then freeze one combined candidate and submit one complete packet to RB/RA.

## Required Proof

Convert RB's real HTTP/WS counterexamples into durable regression tests:

- Spectator/other-player HTTP and WS projections/broadcast contain no credentials
  or another viewer's private data.
- Duplicate host/client join without proof cannot retrieve credentials, alter
  client identity/name/role, acquire seats or change room state/version.
- Old deterministic token guesses, forged identities and cross-room credentials
  cannot authenticate; rejected attempts cannot issue Golden Eater mutations.
- Genuine authenticated reconnect, pending-decision recovery and socket
  replacement still work. Authenticated viewers retain distinct private views.
- Direct Hub and raw WS dispatch/end_turn reject missing/invalid/stale revisions.
  Compare GameState, pending, resources, events, logs, revision, room version and
  projections; no side effects from rejected commands. Security errors may be
  returned to the caller without broadcasting an accepted game mutation.
- Valid fresh end_turn and real Conversion/Golden Eater paths still succeed.

Use existing libraries and local ephemeral servers only. Do not test public
deployed services or publish live credentials. Run focused negatives first;
then npm ci -> typecheck -> related regression/server/browser checks -> default
full CI at candidate freeze. Coordinate heavy-test use separately from source
locks; record actual exits/raw receipts/source identities. Do not auto-add
timeouts or change CI concurrency. Preserve prior evidence unchanged.

## Final Handoff And Next Owners

B returns exact implementation/candidate SHA, remote ref, scoped diff, lock
record, tests/receipt hashes and explicit limitations. No acceptance self-claim.
RB reviews fresh authentication, mutation gate and final skill/socket composition
against the new exact source, using adversarial negatives as well as positives.
RA reviews new evidence bindings; A is assigned one final coverage/evidence sync
only when that new frozen source exists, not a runtime repair or repeated sync
for every intermediate reviewer result. Historical carrier 463facb stays frozen.

G continues bounded Epoch governance publication with the actual FAILED state;
this repair does not expand the prior nine-blob prospective adoption.
I waits for fresh independent acceptance, effective governance and a separate
Planner promotion authorization. 111/944, all credit deltas zero, Gate C
NOT_VERIFIED and 93 MISSING_IMAGE remain unchanged.
