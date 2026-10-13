# FD-SEC-001: Public reconnect credential permits host impersonation

Status: SOURCE_VERIFIED_DRAFT; independent knowledge review pending.
This records historical evidence; it grants no current runtime acceptance.

## Identity

- Failure ID: FD-SEC-001
- Risk: CRITICAL
- Runtime domains: session-authority, server-transport
- Files: `packages/rules/src/match-room.ts`, `apps/server/src/match-server.ts`
- Semantic contracts: IDENTITY_SECURITY, PRIVATE_PROJECTION

## Evidence

- Source task/PR: P3-E08-B11-FINAL-B11-SOCKET-GOLDEN-EATER-REVIEW
- Reviewed exact SHA: 463facb109cc4d19c4fda7af936fb4546fb86091
- Reviewer verdict: FAILED
- Source commit: cf179ca3220a1646c484aa8c660b313e64449488
- Artifact: docs/reviews/phase3/P3-E08-B11-463facb-final-combination-reviewer-b.json
- Raw Git SHA-256: 051f5e95c74e9c78546c391fd60f041d9baef29fbba857ec455a598f8d2395bf
- Input and observed result: A spectator projection exposed the host credential. A real socket authenticated as host and activated Golden Eater: revision 2 -> 3. A duplicate HTTP join returned host credentials and changed host name/version.

Planner read the source and independently hashed its raw Git bytes. Planner
has not rerun the probe or substituted its own technical verdict. Verify the
artifact at the pinned commit, not a moving file path.

## Root Cause

CONFIRMED: credential generation was predictable; projection and duplicate join issued existing identity authority without proof.

## Failed Approach

CONFIRMED: positive component/server tests and trusted-token browser fixtures passed while the real impersonation probe succeeded. Socket lifecycle repair alone did not establish identity security.

## Prevention

- Required invariant: Credentials remain server-private and unpredictable. Existing identities require authenticated reconnect proof. Rejection preserves state, revision, room version, logs and private projections.
- Forbidden pattern: Public credential DTOs, public-identifier-derived secrets, duplicate join adoption of an existing identity.
- Required negative test: Spectator secret extraction, duplicate host join, old deterministic guess, wrong-client credential and raw WS impersonation all reject; valid reconnect still works.
- Test paths: `apps/server/src/match-server.test.ts`, `packages/rules/tests/match-room.test.ts`
- Historical test status: EXISTS; scope is 0f62210a2e007a15e28f945c546ccd00c345942a.
- Relevant command: `npx vitest run apps/server/src/match-server.test.ts packages/rules/tests/match-room.test.ts --maxWorkers=2`
- Current-main coverage: NOT_VERIFIED. Tests exist on the scoped repair candidate; no claim of current-main security acceptance or fresh execution. RB 4d5b76be records scoped closure.

## Applicability

Load for a task changing the listed files, contracts or runtime domains. Match
by task metadata rather than card names alone. Excluded: Evidence-only documentation unrelated to credentials, transport or private projection.
No live runtime edit or heavy test run is authorized by this case. Original
contracts, review scopes and writer reservations govern actual work.
