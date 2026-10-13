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
- Exact historical test paths: `packages/rules/tests/regression/p3-owner-stheno-complete-migration.test.ts`, `packages/rules/tests/match-session.test.ts`; reviewer probe `docs/reviews/probes/review-475-independent.mjs` is at review source commit 7e65291a, not the runtime candidate.
- Historical test status: MISSING; scope is fe4653d1013110555881585db3a447880dd463d3.
- Historical applicable command (NOT RUN by K01): `npx vitest run packages/rules/tests/regression/p3-owner-stheno-complete-migration.test.ts packages/rules/tests/match-session.test.ts --maxWorkers=2`
- Current-main coverage: NOT_VERIFIED. At reviewed SHA existing completion tests pass and independent actual-consumer probe exposes failure. Current-main inclusion and later repair are NOT_VERIFIED; do not transplant an old stack.

## Applicability

Load for a task changing the listed files, contracts or runtime domains. Match
by task metadata rather than card names alone. Excluded: Abilities without nested/persistent pending work and pure report changes.
No live runtime edit or heavy test run is authorized by this case. Original
contracts, review scopes and writer reservations govern actual work.

## K01 Exact-Source Correction

The candidate's owner test contains an ordinary COMPLETED serialize/restore
assertion, not assertions at both nested pause points. The independent probe
expects the two restore failures and proves completion can restore; this is
defect evidence, not an enforcing CI test for legal pending restoration.
The inherited waiting-transaction condition is present in the exact reviewed
interpreter. Source inspection corroborates the review's bounded cause; no
fresh execution or broader corruption acceptance is claimed.
At observed main 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce the historical owner
test path is absent and the archive inspected contains sc1/sc2, not the reviewed
sc3 consumer. The interpreter has no named pendingBattleCloseDrawPlayTransaction
field in that snapshot. A later similarly named Stheno test cannot substitute
for the missing consumer/contract. Current applicability must be decided before
porting an old-stack regression. K01-SOURCE-AUDIT.json binds inspected objects.
