# B11 Final Evidence Contract Repair Authorization

Published: 2026-10-12. Owner: Codex A / evidence and automation.
Task: P3-E09-B11-FINAL-EVIDENCE-CONTRACT-REPAIR.
Status: AUTHORIZED_SCOPED_IMPLEMENTATION.
Epoch 09 publication on main remains a separate governance requirement.

## Exact Inputs

- Diagnostic carrier: 8f24b2d037743c08023431388ae115c8c68792e3.
- Runtime candidate: 0f62210a2e007a15e28f945c546ccd00c345942a.
- Recorded combination tested SHA: 88dcd441a17584b4a2a6d1ba78e588ac6a818ed1.
- RB review: 4d5b76be9d5459cc0c40e50fae8513bc59cd5d21.
- RB artifact: docs/reviews/phase3/P3-E09-B11-TRANSPORT-SECURITY-REPAIR-0f62210-reviewer-b.json.
- RB artifact SHA-256: 6FE0EAD378E31149B3271E137FDB99ACAC161F2894E3FAD21FC0A14986E96DB4.
- Observed main: 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c.

Start from the current clean A diagnostic branch at 8f24b2d, preserving its
candidate/review ancestry. Record actual branch/worktree/base. Diagnose any
new drift before editing; no full old-branch replay onto main is authorized.

## One Scoped Path Authorization

Planner assigns the following tooling/evidence paths to this A task; no other
Planner task may begin overlapping edits. Check for actual conflicting changes
before writing and report a concrete conflict without resetting another owner.

Existing source/test paths:

- scripts/tests/phase3-contract-parity.test.ts
- scripts/phase3-contract-parity.ts
- scripts/tests/phase3-e08-b11-coverage-sync.test.ts
- scripts/phase3-e08-b11-coverage-sync.ts
- scripts/tests/phase3-readiness-preflight.test.ts
- scripts/phase3-preflight.ts
- scripts/tests/phase3-e06-post-merge-recount.test.ts

Additional current-input/test/output paths, if needed for the bounded contract:

- scripts/fixtures/phase3-e09-b11-final-binding.json
- scripts/tests/phase3-e09-b11-final-binding.test.ts
- artifacts/phase3-e09-b11-final-evidence-binding.json
- artifacts/phase3-e09-b11-final-coverage.json
- docs/reports/2026-10-12-p3-e09-b11-final-evidence-binding.md

This explicitly permits test-contract changes resolving the four diagnosed
historical/current binding failures, including a distinct current input schema
within the authorized tooling. It does not authorize runtime, client/server,
authoring, taxonomy/KPI, package scripts, workflow or timeout/concurrency edits.
Keep all historical artifacts and the diagnostic packet immutable; append new
current evidence in the authorized outputs instead of rewriting historical PASS.

## Required Contract

Historical validation must bind the actual historical Git snapshot and its
complete provider/adapter/schema closure. Verify pinned SHA, objects, artifact
hashes and lineage. If execution needs a detached checkout, record its exact
source and deterministic preparation; safely clean up only task-owned checked
paths. Avoid creating a new checkout for every test or parallelizing heavy runs.
Do not silently check out a different source and report current readiness PASS.

Current validation must independently bind the current candidate/source objects,
applicable transport authorization, scoped RB review and actual executed receipts.
The historical continuation allowlist stays historical. Verify later transport
deltas against their own exact scope, including e247a9a2 and 2806e25c inputs;
verify the actual room-ID repair authority rather than assuming the branch is
authorized. If that proof is missing, record a bounded unresolved authority
finding; no generated allowlist or test fixture can manufacture authorization.

Historical recount must reproduce its immutable source rather than depend on
the moving workspace. Current coverage is separately generated from current
source using unchanged classifier/KPI semantics, with real counts and hashes.
Source scan positions can change; compare canonical definitions and applicable
fingerprints without discarding actual routing differences.

Retain drift rejection in current mode, unknown-path/schema-key rejection,
hash/ancestry/source equivalence validation and scope-limited review binding.
Negative tests must reject missing/forged authorizations, tampered receipts,
stale sources/reviews, unexpected deltas and attempts to use a historical PASS
as current technical acceptance. Do not skip tests, hardcode PASS, broaden old
whitelists, remove ancestry assertions or change required checks to green.
Receipt content validation and readiness prerequisites are distinct: preserved
failures must be accepted as authentic records, never as successful execution.

## Implementation And Verification

Implement all four repairs in one scoped pass, using the existing structured
parsers/helpers. Prefer a small shared snapshot mechanism only if it removes
real duplication; request no new abstraction merely for this authorization.

Run focused historical/current positives and adversarial negatives, then
typecheck, content validation, generated determinism, diff-check and one default
full CI on the completed implementation source. Save complete stdout/stderr,
exit/time/hash and tested SHA in the final packet. Prepare npm ci -> typecheck
before CI in a fresh checkout. Coordinate any actual simultaneous heavy test
owner; user previously confirmed none, so do not wait for nonexistent owners.

Only evidence/tooling source may change. Existing successful browser/transport
receipts may be reused with verified runtime/client/server/e2e source equivalence
and correct scope. No browser rerun solely because the evidence carrier changes.
If equivalence fails or tests reveal a real source risk, return that finding and
its minimum validation need rather than attributing old execution to new code.

If default CI reveals an unrelated failure, preserve it and report its exact
cause; do not expand timeout repairs. A completed scoped implementation can
remain BLOCKED on external authority without another round of improvised edits.

## One Final Handoff

Freeze and push one final carrier. Return implementation SHA, carrier SHA,
remote ref/clean state, scoped diff, current coverage, applicable authorization
refs/hashes, RB binding and new raw validation receipts. Keep credit delta zero.
Reviewer A reviews the exact new carrier, all four test-contract changes and
current/historical source separation. RB's existing runtime verdict applies
only through demonstrated source equivalence; A does not author a new RB PASS.

After RA acceptance, G binds final governance and unresolved disposition inputs;
Planner separately decides I authorization. No role-level stacked PR, immediate
promotion, Gate C or Release acceptance is authorized. 93 MISSING_IMAGE remains
an independent Release blocker. Ledger remains 111/944.
