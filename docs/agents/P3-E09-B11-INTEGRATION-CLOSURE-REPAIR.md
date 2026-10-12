# B11 Integration Closure Repair

Date: 2026-10-12. Owner: Planner. Epoch: FD-P3-2026-09-23-09.
State: I_FROZEN_A_CONTRACT_REPAIR_AUTHORIZED. No new macro plan or Epoch.
This supplements ab3540aa; it does not replace historical acceptance.

## Exact Checkpoint

- Main: 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce.
- Frozen I HEAD: 9dbeef07d6bf8a9b956d2291e768b5369f09803b.
- I synchronization: 275eea1bfc8dde2b4c06df933403039c9eabb967.
- Integration candidate: a09fe2d62ad7be07fdfaa9edfef2ab2803a0e2da.
- Integration RA: d12271770d84b615109377ad970b915df246cf19.
- G carrier: eaa7435b1b60f89c3df870116007bb7bc0a197c0.
- Rejected path: docs/reviews/phase3/P3-E09-B11-a09fe2d-integration-contract-reviewer-a.json.

Inspection of the complete assembly-to-HEAD delta found ten paths: the six
previously authorized integration paths, three G paths, and this RA artifact.
The validator admits the three G references but lacks a reference type for the
new independent integration review. This is a tooling contract composition gap,
not evidence of a new runtime defect. Existing policy preflight PASS does not
override failed evidence preflight. No PR or remote required checks exist yet.

## A: One Complete Contract Continuation

Task: P3-E09-B11-INTEGRATION-CLOSURE-REPAIR. Owner: Codex A.
Start a separate clean worktree from the frozen I HEAD above; retain its ancestry.
I remains frozen. Acquire a verifiable scoped tooling reservation before writing.
Do not reset existing work or alter runtime, client, server, authoring, workflow,
timeout, concurrency, governance policy, historical reviews or coverage KPI.

Authorized write paths are exactly the six integration paths from ab3540aa:

- scripts/phase3-preflight.ts
- scripts/tests/phase3-e09-b11-final-binding.test.ts
- scripts/tests/phase3-readiness-preflight.test.ts
- scripts/fixtures/phase3-e09-b11-integration-binding.json
- artifacts/phase3-e09-b11-integration-evidence-binding.json
- docs/reports/2026-10-12-p3-e09-b11-integration-evidence-binding.md

Implement explicit typed immutable integration-review references, not another
hard-coded candidate filename or a docs/reviews directory whitelist. Each ref
must bind exact commit/path/hash, schema, task, Epoch, reviewed candidate,
accepted scope, verdict and bound packet. Verify Git ancestry, exact artifact
bytes at the source and assembled HEAD, and reject dirty providers, duplicates,
unsupported schemas/scopes, forged PASS, candidate mismatch and unknown files.
The reference is a technical RA proof, not an invented GitHub identity.

Preserve the existing d122717 artifact as historical accepted evidence; a new
review of the changed validator must independently bind the new candidate.
Permit only explicitly bound historical/current review artifacts with verified
scope. Never reinterpret a historical PASS as acceptance of the new code.

Model temporal inputs separately: producer evidence is frozen before review;
immutable RA references arrive after candidate freeze; G references arrive after
RA. Validate these external refs without requiring the candidate packet to embed
its future reviewer SHA or its own future hash. Future proofs remain pending
until actually present. Existing original technical and main-control bindings
remain mandatory. Unknown integration deltas must still fail closed.

Test the entire composition, not only the pre-review candidate: candidate ->
independent RA artifact -> three G outputs -> synchronization -> actual final
HEAD. Include the real rejected artifact as a regression and a differently named
next-candidate review as a positive using verified explicit refs. Cover tampered
hash/blob, stale candidate/main, missing review, unrelated review, runtime drift,
duplicate references and extra unauthorized files as negatives. Synthetic proof
fixtures are test-only and never publish fabricated GitHub attestations.

Run focused tests, typecheck and one default CI on the completed implementation;
retain raw receipts and historical failures. Reuse accepted browser/runtime
evidence only through checked source equivalence. Freeze one new carrier and
submit one complete packet to Reviewer A. No role-level PR and no C01 work.

## RA, G And I: Close The Actual Assembly

Reviewer A independently reviews the new exact candidate and closure negatives.
RA may add one immutable JSON review under docs/reviews/phase3/ for this task;
its exact path/commit/hash/scope must be returned and validated through the new
reference contract. This does not authorize arbitrary review-directory files.
Preserve old reviews. Do not grant runtime or promotion acceptance on A's behalf.

G retains the three previously authorized outputs. Bind the new candidate and
new RA exact proof, preserve old evidence as provenance, and publish an actual
GitHub attestation for this new binding. The old eaa7435 attestation is not
automatically valid for a changed reviewedCandidateSha. No policy weakening.

I assembles the actual new A/RA/G lineage with exact main preserved. Pass the
explicit reviewed references as inputs rather than editing validators. Before
creating the single promotion PR, run both integration evidence preflight and
ancestry/policy preflight on this actual post-RA/post-G HEAD. Verify every added
path and source object, not merely the first formerly rejected path. Return the
commands, exit codes, tested HEAD and immutable refs in one handoff. If blocked,
return the complete remaining blocker set; do not request one-file exceptions.

Actual-head GitHub required checks and human approval still precede merge. I's
existing PR-creation authority remains conditional; no immediate merge authority.
G and RA can prepare in parallel, but finalize in candidate -> RA -> G order.
No repeat A sync is required merely to copy each G field into producer evidence.

## Boundaries

All credit deltas remain zero; accounting remains 111/944. Gate C, long-term
stability and 93 MISSING_IMAGE remain unverified or blocked as previously recorded.
This authorizes a complete bounded tooling repair, not a technical PASS or a
guarantee that future remote checks cannot reveal another independent issue.
Next sync: new RA verdict plus real G binding and actual final-assembly preflights.
