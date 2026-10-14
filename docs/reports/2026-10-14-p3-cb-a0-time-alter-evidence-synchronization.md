# Time Alter A0 Evidence Synchronization

Task: `P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR`
Epoch: `FD-P3-2026-09-23-09`
Final state: `READY_FOR_REVIEW_A`
Implementation: `ACCEPTED_FOR_EVIDENCE_SYNC`
Classification: `REVIEWER_ACCEPTED_CANDIDATE`
Main: unchanged. Promotion: not ready.

## Exact Binding

- Observed main/base: `a42b5e1c517141b90f3407773958b0d8afe63264`.
- Reviewed candidate: `3ec55814b8aca84416fca46dfaf7032a7f115094`.
- Tested implementation/direct candidate parent: `8fba9c457de11f849353b5ad84c6165bfa4493b8`.
- Reviewer B commit: `fb487f1397b02663bac1ab065864aa484830c390`, direct parent is reviewed candidate.
- Reviewer identity: `Codex Reviewer B`; verdict PASS. No GitHub identity/thread is asserted.
- Reviewer artifact: `docs/reviews/phase3/P3-CB-A0-TIME-ALTER-3ec55814-reviewer-b.json`.
- Reviewer artifact SHA-256: `54cab8cde8ef835a12afb78e803f3082a249831ba1146849da73b5b5f798e26a`.
- Scope: only `master.kiritsugu.skill.s2` mapped to `master.kiritsugu.skill.time-alter#time-alter.action`; ruled hand-target legality repair and scoped production/browser chain.

Main is an ancestor of candidate; candidate is not an ancestor of observed main. Sync branch starts from the immutable RB review commit, preserving candidate -> RB -> A lineage. Candidate is not promoted.

## Rule And Execution Evidence

The user ruling is bound at `a1328bead4d653991f7b52817686e24e882d50b4`, path `docs/rules/2026-10-14-time-alter-user-ruling.md`, blob `5865aa653f614da29361b777569cb8a0f44d0c2f`. It distinguishes activation of the Master source from playing a separate hand target. Origin Bullet is allowed when otherwise legal; skill cards gain no face-down exception. Controller, owner, zone, play restrictions and normal legality remain enforced.

The original implementation packet is bound at candidate, path `artifacts/phase3-cb-a0-time-alter-play-legality-repair.json`, SHA-256 `0411d702b35a8f253712cc52f3dfa97d32b7cb7971d7551a686ad68f0b5e977a`.

A parsed RB evidence and checked exact candidate, implementation, verdict, reviewer, full identity scope and direct Git parent. A independently verified all 16 embedded command receipts, 32 base64 raw-stream hashes/byte counts and five implementation source blobs. Tested implementation to candidate changes only the original artifact/report. Failed attempts remain in the original packet.

Recorded implementation results: focused 8 files / 216 tests PASS; browser-freeze 5/5 PASS; typecheck, metadata-mode content validation and generated determinism PASS. RB separately ran three scoped files / 26 tests PASS. Browser evidence was inspected by RB, not rerun by RB or A. Setup uses real public server/session progression before browser commands; this is not an all-browser startup claim.

A did not rerun runtime, browser or full CI. This synchronization records accepted scoped evidence and adds no Gate or whole-identity migration acceptance.

## Coverage Ledger Update

Only one consumer's review state is overlaid; the global historical coverage artifact and accepted-111 ledger are unchanged.

| Metric | Main before | Candidate after | Delta |
| --- | --- | --- | --- |
| new semantic routes | 23 | 23 | 0 |
| legacy resolveEffect | 144 | 144 | 0 |
| legacy executeAbility | 3 | 3 | 0 |
| dual | 0 | 0 | 0 |
| notClassifiable | 111 | 111 | 0 |
| authoring abilities | 281 | 281 | 0 |

A called existing `buildCoverageFromArchives` and `classifyAbilityForCoverage` APIs for baseline and candidate source. Authoring and classifier Git diffs are empty. The authoring source fingerprint is `45159c58666046414b1f0b4a66d58b97a27feb6da27e6e6333e7a6fdfbbe3d3a` on both inputs. Time Alter remains `NEW_RUNTIME_SEMANTIC_ROUTED`, contract `CARD_ACTION_SEMANTICS_MINIMAL:PLAY`. These counts measure ability routing, not frozen migration credit or all gameplay legality.

Consumer state: reviewer accepted candidate; implementation accepted for evidence sync; not promoted on main; whole-identity migration acceptance not granted. Frozen accounting remains 111/944, remaining 833; main coverage, migration and denominator delta all zero.

## Historical B11 CI Debt

This is recorded separately from the accepted scoped Time Alter behavior:

- Final default CI at `8fba9c457de11f849353b5ad84c6165bfa4493b8`: exit 1; 195/196 files and 1642/1643 tests passed.
- Failed test: `scripts/tests/phase3-e09-b11-final-binding.test.ts`, recomputes current coverage separately without rewriting historical artifact/classifier.
- Error: `Candidate source drift: packages/rules/src`, from `scripts/phase3-e08-b11-coverage-sync.ts:138`.
- Historical B11 binding rejects newer Time Alter source; this is an evidence-contract failure, not a Time Alter legality assertion failure.
- It does not negate scoped RB PASS or block this A evidence sync. It still prevents green default CI and promotion readiness.
- No old artifacts, ancestry/hash assertions or test expectations are weakened. A separate scoped disposition is required to repair that historical binding debt.

Earlier browser failures, the initial CI's additional test failures and the late preflight process deviation remain preserved. Later passes are not represented as acceptance on earlier failing SHAs.

## Outputs And Handoff

Evidence packet: `artifacts/phase3-cb-a0-time-alter-evidence-sync.json`
SHA-256: `3CC0CA0DF635EF117E3E52CA1EB7D59AAF6AABF8913F8DE430723333F45E50D1`

Coverage ledger overlay: `artifacts/phase3-cb-a0-time-alter-coverage-ledger-sync.json`
SHA-256: `A46583D5BD44D7F6E87295CF0E9DF7F48DB67FD32F6C03B82E66D3F095B6C483`

Only these two outputs and this report are added. Runtime, authoring, production tests, historical artifacts, taxonomy and KPI are unchanged. Retained legacy includes magus-killer.setup replacement and unrelated consumers; scoped typed PLAY rejection is review-bound as no-fallback.

Next owner: Reviewer A for exact synchronization review. Governance, Integration and any CI-debt repair remain separate. No PR created. No runtime write lock or implementation permission is granted.

Fresh A integrity validation passed: parsed exact RB fields, actual Git parent/ancestry and candidate non-membership in observed main, source/rule hashes, 16 receipts/32 stream digests, one-row overlay, zero deltas and report hash references. Four in-memory negative probes (wrong candidate SHA, FAIL verdict, wrong reviewer, wrong ability scope) were independently rejected. Coverage API recalculation and staged diff-check passed. These are evidence checks, not new gameplay tests or Reviewer A acceptance.

Global Gate C, Phase 3, Release, whole-roster completion and long-term stability remain unverified. The 93 missing-image Release blockers remain; metadata-mode content validation PASS does not waive them.

Final state: `READY_FOR_REVIEW_A`. Promotion: `NOT_READY`. Credit change: `0`.
