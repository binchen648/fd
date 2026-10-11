# B11 Recorded Validation Dispatch

Published: 2026-10-11. Epoch: FD-P3-2026-09-23-08.
Task: P3-E08-B11-RECORDED-VALIDATION.
Owner: Codex A, EXECUTION_AND_EVIDENCE_ONLY.
State: AUTHORIZED_PENDING_ACKNOWLEDGED_HEAVY_TEST_WINDOW.

## State Registration

Current carrier: c8b9786ca4d7cde7240783147c735367d59d2425.
Test source: 9a4f4c6ee2723eb7f546341f3c18a1f0a29c3bc1.
Historical frozen carrier: 525451986f372a2e8e24afbc675fb6f40526f416.
Missing old complete stdout/stderr and quiet acknowledgements cannot be
reconstructed. Keep PARTIAL/MISSING; do not request another binding-only loop.
Planner observed restored space: C=169136504832, D=30225371136 free bytes.
This observation is not a guarantee of future capacity or owner availability.

## Owners And Start Condition

Planner/user coordinates the heavy-test window with active same-host test
owners (A, B, RA, RB, and any other known FD CI/browser worker). Read-only
work may continue; do not interrupt legal implementation. Record acknowledger,
time, window expiry and commitment not to start heavy tests. Unknown owners
or an unacknowledged active tester mean WAITING_FOR_WINDOW, not permission.
The current chat does not claim to have sent messages or obtained consent.

Suggested message to each active test owner:
"Reserve the next B11 validation window for A. Please confirm that you will
not start full CI, browser suites or other heavy FD tests until A releases
the window. Read-only work and nonconflicting implementation can continue.
Reply with your role, active test state and acknowledgement; do not stop
existing work abruptly. If already testing, give completion state first."

A records these actual acknowledgements locally and rechecks processes/disk
before and during execution. Never kill another worker. A minimum 10 GiB D
headroom applies before heavy runs; stop if workspace/temp writes fail.

## Exact Receipt Paths And Authorization

Local raw records: D:/fd-validation/b11-recorded-validation/receipts/<run-id>/.
Create a new unique run-id without overwriting previous runs. Keep temp/npm
cache/browser cache on D with process-only environment variables as specified
by 415d1fef. Record variables, os.tmpdir(), versions and checkout SHA.
No runtime, tooling, workflow, assertions, timeout or dependency changes.

Each command records command/arguments/cwd, start/end, actual child exit or
signal, stdout and stderr as separate unmodified byte files, byte lengths and
SHA-256. Stream outputs to disk while running, not only a summary afterward.
Do not pipe through Select-String or truncate logs. If capture is incomplete
mark the run incomplete. Record execution SHA and 23 source/config objects
before and after; keep dirty/generated observations explicit.

Authorized committed output paths:
- artifacts/phase3-e08-b11-environment-reverification-receipts.json
- docs/reports/2026-10-11-p3-e08-b11-environment-reverification-receipts.md
- artifacts/phase3-e08-b11-final-combination-evidence.json
- docs/reports/2026-10-10-p3-e08-b11-final-combination-evidence.md

The receipts JSON may include raw stdout/stderr with their byte hashes when
safe. Private paths/acknowledgements remain local with explicit sanitized
publication and access instructions for reviewers. Do not claim sanitized
bytes have the raw digest; distinguish them. A digest without reviewable
underlying logs is not a complete review packet. No script changes are
authorized; use an existing safe command runner or bounded local wrapper.

## Execute Once As A Complete Batch

Use the exact clean 9a4f4c6 checkout. Confirm source equivalence to c8b9786.
Run npm ci, typecheck, focused evidence and historical/current producer checks,
then default test:ci twice sequentially. Follow with content validation,
generated determinism, component, server, browser repeat-each=5 and source
assets as previously declared. Preserve all exits, including expected
source-assets failure. Stop for new environmental/code failure or contention;
no retries until green. Retained authorization preflight failure is recorded
as such, not repaired or waived in this execution task.

Return one evidence-only descendant of c8b9786 with all fresh receipts and
old PARTIAL/MISSING history preserved. State A_EXECUTION_EVIDENCE_COMPLETE
when A's batch/binding is complete, even if external governance remains
BLOCKED. Do not make final RA/RB acceptance a prerequisite for declaring
A's own capture complete; collect their final verdicts later in one sync.

## Parallel External Disposition

Planner/G own seven original-authority gaps and two runtime overlaps: inspect
exact prior authority, or explicitly decide prospective adoption with review;
do not retroactively fabricate approval. This dispatch is not that adoption.
RA owns 33 path-scope decisions; RB owns final combination semantics. Both
may read source now, but heavy reviews use a later reserved window. They must
not force A to rerun tests merely to publish each verdict separately.

No I promotion, C01 dispatch or new B runtime implementation. Credit delta=0,
ledger 111/944, 93 missing images retained, Gate C/Release not granted.
Next sync: real window confirmations or one complete fresh receipt packet.
