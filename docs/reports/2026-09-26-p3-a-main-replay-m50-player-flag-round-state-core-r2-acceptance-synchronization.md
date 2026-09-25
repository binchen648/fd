# P3-A Current-Main M50 Player-Flag Round-State Core R2 Acceptance Synchronization

Role: Codex A
Status: `ACCEPTANCE_SYNCHRONIZED`
Date: 2026-09-26

## Exact accepted input

- PR: #453
- Base: `c5ac8e9f90874a5bbebedf7f28fd80ca2db0d048`
- Candidate: `31bf148c173d04fd0332ad3d8e0442fbcb85984a`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical evidence: https://github.com/binchen648/fd/pull/453#issuecomment-5839633506

## Accepted capability boundary

The current-main lineage now accepts the bounded player-flag round-state core beyond #452: direct player-flag conditions, direct controller set/clear/add mutations, exact current-round value and exact this-round lifecycle, bounded round-state expiration, and bounded MatchSession restore/reference validation. The accepted #452 finite scalar contract is preserved.

The fresh R independently verified 11 files / 157 tests, predecessor 7/7, R2 6/6, MatchSession 30/30, typecheck PASS, phase3 coverage PASS with blockingIssues=0, and Base-to-Candidate diff check PASS.

## Accounting / next action

This B capability is zero-credit. Formal/material remains 112/944, remaining 832. No authoring is synchronized by this A step. Non-tail F4 remains exact-50 only: A must re-run readiness plus provenance/semantic dependency checks on the accepted runtime and continue compatible zero-credit capability replay until exactly 50 identities can be frozen.
