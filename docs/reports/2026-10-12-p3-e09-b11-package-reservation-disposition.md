# Epoch 09 Package Reservation Disposition

Date: 2026-10-12. Codex G / Promotion Governance Owner.
Identity: github:binchen648.

## Mainline Governance Publication

User explicitly authorized review and merge of PR #558 in this conversation.
Fresh audit: exact HEAD ac2663c526535923f510358f12b2926db16dddf6,
six authorized governance paths, attestation hashes and source Epoch 09 matched;
latest required build/test/policy PASS. Earlier policy failure remains history.
Audit: https://github.com/binchen648/fd/pull/558#issuecomment-6121282458.
PR is MERGED; merge and observed remote main:
1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce.
Epoch 09 document and current task-index pointer verified on main.
Pre-publication baseline/pending fields remain immutable snapshots, completed
by actual PR/merge provenance. Six-file drift is CONTROL_ONLY_DRIFT.
This does not merge B11 runtime or authorize I. Merge does not release runtime
writer reservations. Main's package.json remains the old baseline blob
4feec879e2ae5ef0547634e5a62b89b8d1794d88; the candidate package changes are not on main.

## Historical Evidence Finding

ORIGINAL_WRITER_RESERVATION_PROOF_NOT_ESTABLISHED.
The inspected immutable authorities assign A package/tooling tasks and require
writer coordination, but do not supply actual exclusive package writer consent
for the edit interval. RA row 17 records this missing evidence. Final RA
technical REVIEW_ACCEPTED does not reconstruct historical reservation proof.
No absent chat acknowledgement, owner identity or lease time is fabricated.

## Exact Prospective Proposal

Status: PROPOSED_NOT_EFFECTIVE. No adoption authority issued by G.

1. 9eaa0e0c417486adf7b0449e3d32fb90b7d362f9 ->
   9a7122176dcc82827c27d2cf593c59633737eafe: package.json only.
   Add phase3:preflight = tsx scripts/phase3-preflight.ts and
   phase3:contract-parity = tsx scripts/phase3-contract-parity.ts.
2. 11c1985dc4c72151bbf16298292bf4b7fa29fcab ->
   f4cdad92f129d26a75aac207ecedc991d40a653c: package.json only.
   Append --maxWorkers=2 to existing test:ci command, preserving every
   existing exclude and all other command behavior.

Final eligible package blob: 0f311821628a0a60cb37d752a259e6d688f7a6e9.
Final SHA-256: 6FFED5CF04F2F5FD13538E7EF86E5C59D2F50B5DB2401C9424264E50204A1658.
Exact original before/after blobs/hashes and full script values are in JSON.
Structured JSON comparison verifies these are the only three key changes,
with dependencies, workspaces and other scripts intact. Final package blob
matches historical/current frozen runtime/tested/evidence carriers.
Other files in the introducing commits, underlying tooling implementations,
later changes and whole branches are expressly excluded from this adoption.

Proposed decision: prospectively admit only that exact existing package delta
for later promotion consideration and explicitly accept the missing historical
reservation risk. Preserve the missing historical proof as missing.
Planner/user must approve exact scope in immutable authority and publish any
required control/ownership transition before this proposal is effective.
No new Epoch, future writer lock, overall acceptance, policy exemption or I
authorization is implied. Eventual promotion HEAD needs its own Node 20 checks;
governance PR checks are not a substitute.

No package/runtime edit, A test rerun or per-review sync is needed to decide
this proposal. Existing accepted technical evidence remains scoped.
All three credit deltas 0; ledger 111/944; Gate C NOT_VERIFIED;
93 missing images remain Release blockers. No Phase 3/Release completion.
Next: Planner/user exact proposal disposition or actual historical proof.
