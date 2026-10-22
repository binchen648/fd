# P3 Current-main Evidence Rebind — Independent Review

Date: 2026-10-23 (Asia/Hong_Kong)  
Role: independent Reviewer  
Candidate: `d360ea02de21965a6f1ebca98c0ea8562235d2d8`  
Candidate parent / reviewed main: `a42b5e1c517141b90f3407773958b0d8afe63264`  
Verdict: **REVIEW_RECONCILIATION_REQUIRED**

## Exact scope and repository state

The Reviewer branch `codex/r-current-main-evidence-rebind-20261023` was clean before this report. Its HEAD was the exact Builder candidate; `HEAD^` and local `origin/main` were both `a42b5e1c517141b90f3407773958b0d8afe63264`. The Builder commit adds only `docs/reports/2026-10-23-p3-current-main-evidence-rebind.md`; `git diff --check HEAD^ HEAD` passed. No Candidate or runtime file was changed by this review.

## Findings

1. **Correction required — blocked count.** The Builder report says `72 SOURCE_GROUNDED` and `871 BLOCKED`. The frozen `data/phase3/full-roster-ability-inventory.json` `semanticSummary` says `sourceGroundedCount: 72`, `blockedCount: 872`, `totalIdentityCount: 944`, `unclassifiedCount: 0`. The Builder's two counts sum to 943, leaving one identity unaccounted for. Correct the report to **872 BLOCKED** before relying on it as a complete inventory reconciliation. This is a reporting error, not new credit or skill acceptance.
2. **E04 stale binding confirmed.** `artifacts/phase3-e04-current-main-accepted-111-execution-matrix.json` embeds `mainSha: 0e943a94e8bdab6335e34818278ecc90760015f0`, whereas reviewed main is `a42b5e1c...`. The artifact records 111 accepted identities, `EVIDENCE_BINDING_GAP: 111`, 87 missing generated registry IDs, and 35 unexpected material IDs. The Builder correctly treats these as historical matrix findings and requests fresh current-main reconciliation. Its Gate-C pending count is supported by the accompanying `docs/reports/2026-09-27-p3-e04-a111-current-main-execution-reattestation.md`; it is not a newly executed Gate-C result.
3. **Owner refs remain outside main ancestry.** Exactly 27 fetched `refs/remotes/origin/codex/*owner-complete*` branch tips were checked with `git merge-base --is-ancestor <ref> origin/main`; all 27 returned non-ancestor. This establishes that those exact refs have not merged into current main. It does not by itself prove that no equivalent content was independently copied; phrase any closure claim with that limitation or provide a path/blob comparison.
4. **EFP chronology is accurate.** `origin/main` is PR #560 merge commit `a42b5e1c`. `docs/reports/2026-10-13-p3-efp-integration-preflight.md` preserves the historical `PROMOTION_BLOCKED_GOVERNANCE` status; `docs/reports/2026-10-13-p3-efp-i01-governance-inputs.md` subsequently records `GOVERNANCE_INPUT_COMPLETE`. Neither grants skill acceptance, migration credit, or a current-main E04 matrix rebind. The Builder report distinguishes these states correctly.

## Disposition

The Builder report is directionally correct but needs the blocked-count correction and a precise statement about what the 27 branch-tip checks prove. Do not treat this review as skill acceptance, migration/coverage credit, Gate-C verification, approval of a new Candidate, or authorization for another dispatch. Keep `REVIEW_RECONCILIATION_REQUIRED` until an exact-current-main inventory and E04 evidence reconciliation is reviewed.

This review used read-only Git and artifact inspection for the Candidate. No previously security-blocked command was rerun.
