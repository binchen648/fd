# K03 Evidence Contract Finalization

Task: `P3-EFP-K03-A-FINALIZATION`. Owner: Codex A Automation/Evidence Owner.
Status: implementation evidence carrier, pending independent exact-carrier review.
Worktree: `D:/fd-validation/k03-evidence-finalization`.
Branch: `codex/a-p3-efp-k03-evidence-finalization`.
Main dependency: `a42b5e1c517141b90f3407773958b0d8afe63264`.
Assembly base: `7124364b1d9909273e8bf1d1baba2f0691fe5801`.
Frozen implementation: `6679730b2fad17873025016771c4febf3e11aea7`.
Implementation commits: `6e2863244fe0b3d66f4553623847179735998e8c`, then `6679730b2fad17873025016771c4febf3e11aea7`.
Authority: dispatch `6284de6aade2b20fd9e313f43e5e66d0a7f9c32d`.
Containing carrier SHA is reported in handoff, without a self-referential fabricated SHA.

## Diagnosis And Bounded Repair

Baseline order was npm ci, typecheck, then the B11 final-binding suite. Setup exited 0; focused exited 1 with 54/55 tests passing. The failing call at test line 178 was `buildSnapshotAtCheckout(root, input.candidateSha)`; the strict guard in `scripts/phase3-e08-b11-coverage-sync.ts:138` correctly rejected `Candidate source drift: packages/rules/src`.

The historical B11 tree is `52e4920a73720851cde4c71216a5aec6fb43f094`; the legitimate reviewed K03 tree is `7e2086aef86ffde917bd6b12e994b2360a2e8a55`. The single call now uses existing `historicalDirectory`, pinned to pre-review `b5e68444f55ea9fc1a86a9eea0ea0bedce3de229`. All 55 original B11 tests and their historical failure, hash, stale-review, source, runtime-drift and unknown-path assertions remain.

The separate K03 regression uses an explicit cloned fixture pinned to RB `9d2854d241bfdb5eefc426b3ec854b802062e4ca`. It checks exact reviewed source/test trees and blobs, packet/review bytes, accepted scope and baseline classification. Its negatives include tampered/unbound references, observed tree/byte drift, a different explicit context, and actual committed fixture loader drift. A differing outer checkout at main, with different runtime/test/scripts/report trees, does not change frozen fixture verification. No persistent test requires future outer HEAD to equal K03.

The first K03 draft at `6e286324` coupled outer HEAD to the reviewed trees. Its successful execution receipt is preserved as superseded. The parent correction at `6679730b` was committed before final validation. No runtime, production preflight, helper, package/workflow/timeout or original frozen evidence was edited.

## Frozen Implementation Execution

Fresh final order at `6679730b`: npm ci -> typecheck -> six focused suites -> one default CI. All exited 0.
Focused: **6 files / 129 tests passed**, including the unchanged B11, readiness/preflight, parity and 21 K03 reward/Stheno controls.
Default `npm run test:ci`: **196 files / 1651 tests passed**, exit 0. No unexplained rerun.

Focused command:
`npx vitest run scripts/tests/phase3-e09-b11-final-binding.test.ts scripts/tests/phase3-efp-k03-evidence-contract.test.ts scripts/tests/phase3-readiness-preflight.test.ts scripts/tests/phase3-contract-parity.test.ts packages/rules/tests/fb2-34-combat-reward-distribution.test.ts packages/rules/tests/stheno-consumer-migration.test.ts --maxWorkers=2`

Full CI started UTC `2026-10-14T00:47:01.996Z` and ended `2026-10-14T00:51:31.156Z`.
Local process scan before CI: `2026-10-14T00:46:55.1755442Z`; no competing FD heavy-test process observed.
After/release measurement: `2026-10-14T00:51:55.8250174Z`; no remaining FD heavy-test process observed. User processes were preserved; none terminated. These are local measurements, not cross-chat exclusivity.

Full CI stdout SHA-256: `edd121115e8671f10c40f0ec460cc3d969dcf84078f873dbbd749fcb378727e2` (41218 bytes).
Full CI stderr SHA-256: `ca00b808b38553da320a270a8ffc9c5765c6e312c659810c7ad3503beaab8ed9` (5912 bytes).
Complete stdout/stderr bytes, hashes, command times, exits and exact source SHAs are embedded in the packet. Baseline reproduction retains complete tool-delivered combined output with explicit provenance; separate original streams are not reconstructed. The original B default-CI exit-1 receipt is copied exactly from the frozen candidate packet, including both raw streams. All historic failed artifacts remain unchanged.

## Current Source And Coverage Evidence

One-time outer source verification at the frozen implementation proves rules-source tree `7e2086aef86ffde917bd6b12e994b2360a2e8a55` and rules-test tree `5c0d26f74648c16fe359fb9235c12c5dacefe08a` equal exact candidate `540abe6c8cadc015fe7ad4030673091405a61063` and RB. Loader blob `bbaf57a4e23b2a038d45745826a987484eb332fd` and FB2-34 test blob `7f91ec3762daec7ce7ed414985e75fbbfa4f9691` and their hashes match. Main is explicitly classified as pre-guard history. This measurement is not a future defaultCI constraint.

Coverage was generated through exported `runPhase3CoverageCli(['--out', absoluteTempPath], worktree)`, never the script CLI entry.
Temporary snapshot: `C:\Users\CHENSH~1\AppData\Local\Temp\fd-k03-current-coverage-d0ECPB\coverage.json`.
SHA-256: `877a31198cbe6c92dcc5b78e7bd70ca6f37a6b0fa5cbcf706949a0adb22524a3`.
Counts: **23 / 144 / 3 / 0 / 111** (new / legacyResolve / legacyExecute / dual / notClassifiable).
Fresh and frozen B11 snapshots differ only in `generatedAt`; counts, source fingerprint, compiled definitions and all other top-level fields match.
Tracked coverage before/after SHA-256: `f058502226911f579c56cd5a9b302833c1731d07c96adce74625631fcff7d1b8`, unchanged.

## Carrier And Handoff

Packet: `artifacts/phase3-efp-k03-evidence-finalization.json`.
Packet SHA-256: `2b06d92336f2875c027a4d4299466e9391099d4e15f17f3e9e36c6b6767c39bd`; 207686 bytes; 15 embedded raw streams verified by length/hash. Original failed-CI receipt was independently compared byte-for-byte in structured form to its frozen source.
Packet also includes protected-object checks, test objects, dispatch reference, local process/disk measurements, superseded receipt and reproducible inline verifier sources.

Only the two assigned tests and the named packet/report are changed. Parent owns independent exact-carrier review, governance/integration and future actual-head checks. No role PR or acceptance is claimed. Promotion/acceptance flags remain false, all credit deltas 0, ledger 111/944. Global Gate C, 93 missing images and long-term stability remain open.
