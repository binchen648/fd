# B11 Observation API Dispatch

Published: 2026-10-09. Control Epoch: FD-P3-2026-09-23-08.
Main observed after fetch: 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c.
This is a scoped dispatch, not a new Epoch, runtime acceptance or promotion.

## Accepted Planning Input

- Gap plan: abdd8e4eb735240d72a416ede743e84c58ebcd40.
- Reviewer A commit: 58551e0db9d7c7c1cd1d9672e62d10f9bc6e585d.
- Review: docs/reviews/phase3/P3-E08-B11-gap-plan-reviewer-a.json.
- Review SHA-256: E46504CA49774D668E7FC6BFDD20FCC9E581B984C691CFC39AE49D187EA5A44A.
- Accepted scope: FOUR_FILE_GAP_DECOMPOSITION_PLAN_DELTA_ONLY.
- Remote review publication: PENDING; local review object is available.

The plan covers 34 missing observation fields across 10 fixtures and two
consumers. It does not establish 34 skill defects. Three API tasks account
for B=4 and A=30. No compiler repair is authorized. Intervening parity changes
outside the reviewed four-file delta remain unaccepted.

Readiness remains FAIL_NO_WAIVER; reviewReady remains false. All credit and
denominator deltas remain zero. Gate C and 93 MISSING_IMAGE are unchanged.

## Shared Startup And Binding

Read PHASE3-AGENT-CONTRACT.md, this task's subsection, the minimum tooling
contract, and the exact gap-plan group; do not reread the whole task index.
Use a separate clean worktree. Before writing, record full implementation
base SHA, source delta, branch, exact paths and current domain owner. Main is
an integration anchor, not permission to import an entire tooling branch.
Do not claim 9eaa0e0 is an accepted runtime/tooling combination.

Existing B11 owners retain their reservations. The B task below authorizes
only the existing B11 Runtime Owner, not a second writer. If another owner
holds an overlapping file, preparation is read-only until release/handoff.
Freeze candidates before review; do not mutate prior artifacts or fixtures.
Every resulting review must bind the fresh candidate and actual test SHA.

## P3-E08-B11-OBS-01-B

Owner: Codex B / existing B11 Runtime Owner.
State: AUTHORIZED_SCOPED_IMPLEMENTATION_SUBJECT_TO_WRITER_CHECK.
Goal: B11_CONVERSION_STRUCTURAL_CLASSIFICATION_API (4 observations).

Expose the existing Conversion Magic structural ownership classifier through
a read-only typed API. Structural ownership and exact eligibility are separate.
Reuse the existing helper without changing its logic or dispatch call sites.
Allowed delta: helper export or minimal diagnostic facade, and focused tests
for this API. Record the helper's exact path/symbol before editing; unknown
helper ownership is a stop condition, not permission to invent a new route.

Must not change dispatch semantics, primitives, fallback, compiler behavior,
authoring, socket lifecycle, coverage or taxonomy. No new consumer or card-ID
routing. If exposure requires changing ownership semantics, stop and hand the
contract gap to Planner; this task does not authorize that repair.

Verify all four Conversion fixtures, identity variation, outside-scope and
owned malformed input. Prove the facade has no state mutation and leaves
existing routing unchanged. Reviewer B reviews the fresh API candidate.
Implementation can proceed alongside fixture review, but expected values
are not accepted until Reviewer B establishes their meaning independently.

## P3-E08-B11-OBS-02-A

Owner: Codex A. State: PREPARE_NOW_IMPLEMENT_AFTER_FIXTURE_REVIEW_PASS.
Goal: B11_INVENTORY_OBSERVATION_API (20 observations).

Provide executable inventory.routeCandidate and inventory.exactEligible
observations for the 10 fixtures. Preserve normalized authoring inputs and
reasons for excluded/invalid shapes. Do not substitute runtime/coverage output
or an unrelated Card Zone CLI. Shared low-level parsing is permitted only
when provenance and the independent inventory decision remain observable.

Allowed: narrowly named scripts/API adapters and automation tests, plus
their evidence. No production runtime, authoring, generated registry, KPI,
taxonomy or governance edits. Declare exact paths before implementation.
Reviewer A reviews tooling; Reviewer B owns semantic fixture expectations.

## P3-E08-B11-OBS-03-A

Owner: Codex A. State: PREPARE_NOW_IMPLEMENT_AFTER_FIXTURE_REVIEW_PASS.
Goal: B11_COVERAGE_DIAGNOSTIC_EXACT_ELIGIBILITY (10 observations).

Expose a diagnostic-only exactEligible observation beside unchanged raw
coverage classification. NEW_RUNTIME is not a synonym for eligibility.
Do not copy another owner's observation, change counters or relabel taxonomy.
Show unchanged raw classifications/counters for identical inputs and provide
positive, malformed, outside-scope and identity-variation diagnostics.

Allowed: coverage diagnostic adapter/export and automation tests/evidence.
No runtime, authoring, registry, KPI, taxonomy or policy edits. A serializes
OBS-02 and OBS-03 when their tooling files overlap; no second writer.
Reviewer A reviews the fresh tooling candidate after semantic premise review.

## P3-E08-B11-OBS-RB-FIXTURE

Owner: Reviewer B. State: READY_READ_ONLY.
Review only fixture meanings and execution premise, not readiness/promotion.
Inputs from the exact accepted plan:

- Tested candidate: 9eaa0e0c417486adf7b0449e3d32fb90b7d362f9.
- Fixture commit: b5ef0626c5f373658c7b0ef0208f5cfda91f1a6e.
- Fixture path: scripts/fixtures/phase3-b11-parity-fixtures.json.
- Fixture SHA-256: 0757970801F81178069CA7DF4423985180130C220D486871FFAFE137C0929A46.
- Adapter commit: 9695d7107645f9972ebef7ab6c78a4ef14b015da.
- Premise SHA-256: FA537BA6646A9FBE14DE7511BC51423F1F910281A41BB5EDBA0CBECAEB446530.
- Required review schema: fd-p3-parity-expectation-review-v1.

Read relevant canonical rules and the two consumers' authoring. Independently
judge positive, malformed, outside-scope, identity and binding expectations.
Bind candidateSha, reviewedFixtureCommit, premiseSha256, reviewer and verdict.
Tool agreement alone is not proof. Do not implement a fix while reviewing.
Changed fixture/adapter premise requires a new digest and fresh review.

## Continuation And Handoff

1. Reviewer A publishes the existing exact review ref without rewriting it.
2. B implements OBS-01 with writer check; RB reviews fixture premise in parallel.
3. A prepares OBS-02/03 now; implements only after fixture premise PASS.
4. Freeze APIs and adapters; generate fresh execution receipts from the exact
   combined candidate. Re-review changed execution premises and owner deltas.
5. A binds current runtime/socket review dependencies and execution evidence,
   reruns preflight/parity and reports each observation's actual evaluation.
6. RA reviews tooling/evidence; RB reviews API and relevant runtime combination.

Each handoff includes task, branch, base/candidate, paths, lock ownership,
commands/tested SHA, receipts/hashes, dependencies and remaining blockers.
Missing required data stays NOT_EVALUATED and readiness FAIL. No alias,
waiver, inherited PASS, role-level promotion PR or automatic promotion.
Codex I waits for a separately authorized, fully accepted single final PR.

Next sync: remote exact review publication, B API candidate, or RB fixture
verdict, whichever first changes a dependency. This document is dispatch
authorization for workers to consume, not evidence that chats received it.
