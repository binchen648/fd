# B11 Tooling Review Fix

- Epoch: FD-P3-2026-09-23-08
- Claimed status: AUTOMATION_BASELINE_CANDIDATE, independent Reviewer A pending
- Reviewed failure carrier: `961ac01aa1cb22dfa30212332bd4af4d5a80c035`
- Implementation/test SHA: `050839956f3795cde76b48eddaebe6708e470ab4`
- Execution adapter SHA: `9695d7107645f9972ebef7ab6c78a4ef14b015da`
- Fixture SHA: `b5ef0626c5f373658c7b0ef0208f5cfda91f1a6e`
- Tested combination: `9eaa0e0c417486adf7b0449e3d32fb90b7d362f9`
- Final carrier: the commit containing this report, obtained from Git.

## Two Blockers

The Conversion Magic family exemption was removed from both expectation
validation and comparison. All runtime routeCandidate observations are required.
No applicability waiver was added. Four missing Conversion observations now
produce four additional readiness issues, even if every other observation agrees.
Fixture expectations still need Reviewer B; none were granted acceptance by A.

The execution input now binds a complete controller/worker/common Git source
closure at one immutable SHA, with per-file SHA-256. Local normalized content
must match its bound Git blob. Actual worker/helper execution uses those verified
Git bytes in the isolated candidate clone, not local worker files. The worker
checks the closure and returns the exact binding, which the controller validates.
The input, premise hash and output receipt all preserve the adapter identity.
Package-lock and tsconfig objects must match the tested candidate. The installed
tsx loader digest is checked before and after execution and saved in the receipt.
Installed dependency binaries remain a disclosed local dependency provider;
this task does not claim an independently attested npm installation.

## Fresh Verification

- Focused automation: 12/12 PASS; new missing-observation and drift probes included.
- Default `npm run test:ci` at implementation SHA: 188 files / 1441 tests PASS,
  exit 0, 54.94 seconds. No timeout or assertion changes.
- `npm run typecheck`: PASS. Complete tooling delta diff-check: PASS.
- Real parity executed ten fixtures twice, exit 1 both times, byte-identical JSON.
- Result: 34 required observations NOT_EVALUATED, one expectation review pending.
  No observed disagreement was converted into a PASS. Readiness remains FAIL.

Input SHA-256:
`170BA66A80A37EB47F5EEE868281D468F2770625C8581375D66FE235B6AEB673`

New parity artifact: `artifacts/phase3-e08-b11-tooling-parity-review-fix.json`

Artifact SHA-256:
`3882243E538B542D62772A932130EC8231186DE619A9E460B6447B211AF694EA`

Machine handoff: `artifacts/phase3-e08-b11-tooling-review-fix-handoff.json`.
Historical carrier artifacts/reports remain unchanged, including their failure
history and then-observed Planner remote state. The user supplied the later
Reviewer confirmation that the Planner contract is now remotely published;
this repair does not inherit the earlier unconfirmed publication blocker.

## Boundaries And Next Owner

No packages/apps/data/runtime/fallback/KPI/taxonomy/policy changes. All unrelated
legacy paths remain intact. Main coverage, migration and denominator deltas are
zero. reviewReady and promotion state unchanged. Global Gate C, 93 historical
image blockers, remote required checks and promotion are not verified here.

Return the exact evidence carrier to Reviewer A for tooling review. Reviewer B
owns fixture rule expectations. Missing comparable APIs remain explicit owner
gaps; do not use this repair or green CI as readiness/promotion acceptance.
