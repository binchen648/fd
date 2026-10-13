# FD-REV-002: Optional end-turn revision bypasses mutation gate

Status: SOURCE_VERIFIED_DRAFT; independent knowledge review pending.
This records historical evidence; it grants no current runtime acceptance.

## Identity

- Failure ID: FD-REV-002
- Risk: HIGH
- Runtime domains: session-authority, server-transport
- Files: `packages/rules/src/match-room-hub.ts`, `packages/rules/src/match-room-protocol.ts`, `apps/server/src/match-server.ts`
- Semantic contracts: MUTATION_REVISION_GATE, ATOMIC_REJECTION

## Evidence

- Source task/PR: P3-E08-B11-FINAL-B11-SOCKET-GOLDEN-EATER-REVIEW
- Reviewed exact SHA: 463facb109cc4d19c4fda7af936fb4546fb86091
- Reviewer verdict: FAILED
- Source commit: cf179ca3220a1646c484aa8c660b313e64449488
- Artifact: docs/reviews/phase3/P3-E08-B11-463facb-final-combination-reviewer-b.json
- Raw Git SHA-256: 051f5e95c74e9c78546c391fd60f041d9baef29fbba857ec455a598f8d2395bf
- Input and observed result: A real WS client:end_turn without expectedRevision was accepted: battle -> round_end, revision 2 -> 8, room version 2 -> 3, logs 19 -> 39.

Planner read the source and independently hashed its raw Git bytes. Planner
has not rerun the probe or substituted its own technical verdict. Verify the
artifact at the pinned commit, not a moving file path.

## Root Cause

CONFIRMED: protocol revision was optional and Hub assertExpectedRevision returned successfully for missing input when required=false.

## Failed Approach

CONFIRMED: existing stale-command positive/negative coverage did not cover omission on end_turn. Valid-revision browser paths did not expose this bypass.

## Prevention

- Required invariant: Every scoped mutation entry point requires a finite safe integer matching current revision before any state change; rejection is atomic.
- Forbidden pattern: Optional revision on mutation commands or separate permissive end-turn gate.
- Required negative test: Missing, null, string, negative, fractional, oversized and stale revisions reject for dispatch and end_turn via direct Hub and real WS; state/pending/logs/revision/version/broadcast remain unchanged.
- Test paths: `apps/server/src/match-server.test.ts`, `packages/rules/tests/match-room-hub.test.ts`
- Historical test status: EXISTS; scope is 0f62210a2e007a15e28f945c546ccd00c345942a.
- Relevant command: `npx vitest run apps/server/src/match-server.test.ts packages/rules/tests/match-room-hub.test.ts --maxWorkers=2`
- Current-main coverage: NOT_VERIFIED. Specified negatives are present at the repair SHA. Do not duplicate or edit this live lane; main integration remains separate.

## Applicability

Load for a task changing the listed files, contracts or runtime domains. Match
by task metadata rather than card names alone. Excluded: Read-only queries that cannot mutate match or room state.
No live runtime edit or heavy test run is authorized by this case. Original
contracts, review scopes and writer reservations govern actual work.

## K01 Scope And Test Trace

The failed review's /blockingFindings/1 binds an actual raw WS omission on
source-equivalent 9a4f4c6 under carrier463facb1. Observed deltas are exactly
revision2->8, roomVersion2->3 and logs19->39; positive component tests did not
close this independent negative. Required numeric input domains below are a
regression obligation, not claims that every form was exercised by that probe.
At 0f62210 the server named test covers undefined/null/string/negative/fractional/
oversized/stale for both commands; the Hub named test additionally covers NaN
and Infinity. Each checks atomic rejection and a valid-revision control.
Follow-up RB4d5b76be grants scoped repair closure only; its full CI remains
exit1. At observed main the server test includes stale rejection but lacks the
new combined missing/invalid/end_turn negative. Current execution conformance
remains NOT_VERIFIED. Exact paths, selectors and blobs are bound in the audit.
