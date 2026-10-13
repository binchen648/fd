# B11 Tooling And Combination Diagnostics

- Epoch: FD-P3-2026-09-23-08
- Owner: Codex A, Automation / Coverage / Evidence
- Claimed acceptance: AUTOMATION_BASELINE_CANDIDATE, independent review pending
- Readiness: BLOCKED_NO_WAIVER. No runtime/Gate/promotion acceptance granted.
- Implementation: `d7805bda96d0322fd461bd7bf50755e272dbbca1`
- Tested runtime/socket/coverage combination: `9eaa0e0c417486adf7b0449e3d32fb90b7d362f9`
- Observed main: `9a1689d2ec5b56b67d1483d2593b4ab809d6c15c`
- Fixture producer: `9a7122176dcc82827c27d2cf593c59633737eafe`
- Evidence carrier is the commit containing this report; obtain it with Git, not a self-referential embedded SHA.

## Actual Results

Preflight inspects exact Git blobs, full diffs (including deleted and renamed
paths), scope ceilings, dependencies and execution bindings. It returned exit 1:
three review dependencies and three check receipts remain pending. No unauthorized
path was observed. Fresh tests do not manufacture missing reviewed receipts.

Parity returned exit 1 after executing ten fixtures in an isolated shared Git
clone detached at the combination SHA. Runtime exports and executable compiler
were called, not replaced with declared expected values. Four positive/identity
fixtures are eligible and compile; four malformed fixtures are ineligible and
rejected; two outside-scope fixtures are ineligible but compile. Identity changes
alter both card and ability IDs while keeping canonical references consistent.

There are zero observed expectation disagreements, but expectations remain
unreviewed. Inventory lacks a comparable B11 API. Coverage supplies its real raw
classification, not exact family eligibility: all ten rows classify as new-runtime
consumers, including malformed/outside graphs. This is not evidence that the graphs
are executable. Thirty required comparable observations are NOT_EVALUATED.
Conversion exposes exact eligibility but not a structural routeCandidate API.
No runtime defect was established by these observations; no runtime was modified.

## Evidence Bindings

| Artifact | SHA-256 |
| --- | --- |
| artifacts/phase3-e08-b11-tooling-preflight.json | 5490742375C8D98488C5E6B2CDF1C762A3918DF3D129A62F9C798D1745893A06 |
| artifacts/phase3-e08-b11-tooling-parity.json | 10B4EB681ACBAA131C80ECA6E4DEE491EC523BB06875361CD2BF4FA42B75EFBB |
| artifacts/phase3-e08-b11-tooling-coverage.json | 876A7E0D20FDF92D9ECCF9E3EEB50347AC748032F78E7F8B026B0D99FDD505DC |

Machine command records, prior failures and limitations are in
`artifacts/phase3-e08-b11-tooling-handoff.json`.
Contract publication `e65503e...` is locally available and digest-bound, but the
observed remote Planner HEAD `45eb5b3...` does not contain it. Its remote publication
must be supplied before a remote reviewer can reproduce all bindings.

## Verification

- Automation focused: 10/10; final parity-focused rerun: 5/5.
- Default full CI at implementation SHA: 188 files / 1439 tests PASS, 54.24 seconds.
- B11 focused: 29/29. Root Vitest excludes server tests; separate server workspace: 11/11.
- Chromium repeat-each=5: 10/10. These are trusted fixture browser chains, not natural seven-seat room setup evidence.
- Typecheck, content validation (0 blocking), generated-content determinism and diff-check: PASS.
- Fresh coverage: 127 archives / 169 cards / 281 abilities; new=23, legacyResolve=144, legacyExecute=3, dual=0, notClassifiable=111.
- Missing CLI input: direct Node process exit 2 for both tools; PowerShell command wrapper surfaced exit 1.

The initial tar/Unicode failure and subsequent Windows ESM loader failure are
retained in machine evidence. Both were tooling defects, fixed without reducing
assertions. Full CI also passed before the final explicit NOT_EVALUATED fields.

Tests outside parity ran on tooling checkouts whose packages/apps/data/e2e and
coverage classifier are unchanged from the combination; they are not claimed
as detached exact-combination execution receipts. Parity itself checks source
Git objects and executes the detached candidate. Installed dependencies are
provided by local node_modules with matching package source; dependency binaries
and cross-platform Linux execution have not been independently attested.

## Review Handoff

Changes are tooling scripts, tests, package commands, fixture schemas/inputs and
evidence only. No runtime, authoring, taxonomy, workflow or promotion policy change.
No reviewReady flag change. Main, migration and denominator deltas are all zero.
Unrelated legacy owners remain intact. Global Gate C and the historical 93 missing
image Release blockers are not cleared by this task.

Reviewer A should review the automation and fixture premise independently.
Next: bind accepted expectations and exact task/check receipts; assign the
inventory/coverage comparable classification API gaps to their owners. Runtime
API changes, if needed, belong to B. Do not replace missing observations with a
waiver or treat passing tests as readiness acceptance.
