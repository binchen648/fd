# FD-RESTORE-004: Legal nested response and choice cannot restore

Status: SOURCE_VERIFIED_DRAFT; independent knowledge review pending.
This records historical evidence; it grants no current runtime acceptance.

## Identity

- Failure ID: FD-RESTORE-004
- Risk: HIGH
- Runtime domains: ability-runtime, persistence
- Files: `packages/rules/src/ability/interpreter.ts`, `packages/rules/src/match-session.ts`, `data/authoring/servants/servant.stheno.json`
- Semantic contracts: AUTHENTICATED_CONTINUATION, NESTED_INTERACTION_RESTORE

## Evidence

- Source task/PR: P3-S-OWNER-STHENO-COMPLETE-MIGRATION / PR475
- Reviewed exact SHA: fe4653d1013110555881585db3a447880dd463d3
- Reviewer verdict: FAILED (technical only)
- Source commit: 7e65291a4fa10170e249bc492617ef337caf7f8a
- Artifact: docs/reviews/2026-10-10-pr-475-review.md
- Raw Git SHA-256: 8c67cfe179e02ece25b6581ee2a23ed776ebf4e95eeaa2a93b2e8d59dc1d7cf6
- Input and observed result: Actual Stheno sc3 opens an ordinary opponent on-card-played response while Divine Core waits. serialize/restore rejects the valid response pause and later generic-choice pause; ordinary completed continuation restores.

Planner read the source and independently hashed its raw Git bytes. Planner
has not rerun the probe or substituted its own technical verdict. Verify the
artifact at the pinned commit, not a moving file path.

## Root Cause

CONFIRMED in reviewer source/probe: interpreter requires a waiting transaction to own its canonical pending interaction, excluding legal nested responses/choices.

## Failed Approach

CONFIRMED: ordinary completion and root round progression round-trips passed but omitted durable nested pause points. The defect is inherited runtime exposure, not a new authoring-runtime delta.

## Prevention

- Required invariant: Every legal authenticated pending pause must round-trip; unrelated/orphan continuations must still reject.
- Forbidden pattern: Requiring the outer waiting transaction to be the currently nested interaction owner without representing the authenticated relationship.
- Required negative test: Round-trip at each real response/choice pause; separately reject orphan, unrelated, forged or mismatched parent continuations.
- Test paths: `packages/rules/tests/stheno-consumer-migration.test.ts`, `packages/rules/tests/match-session.test.ts`, `docs/reviews/probes/review-475-independent.mjs`
- Historical test status: MISSING; scope is fe4653d1013110555881585db3a447880dd463d3.
- Relevant command: `npx vitest run packages/rules/tests/stheno-consumer-migration.test.ts packages/rules/tests/match-session.test.ts --maxWorkers=2`
- Current-main coverage: NOT_VERIFIED. At reviewed SHA existing completion tests pass and independent actual-consumer probe exposes failure. Current-main inclusion and later repair are NOT_VERIFIED; do not transplant an old stack.

## Applicability

Load for a task changing the listed files, contracts or runtime domains. Match
by task metadata rather than card names alone. Excluded: Abilities without nested/persistent pending work and pure report changes.
No live runtime edit or heavy test run is authorized by this case. Original
contracts, review scopes and writer reservations govern actual work.
