# P3-A #452 Scalar Controller Player-Flag Acceptance Synchronization

Role: Codex A
Status: ACCEPTANCE_SYNCHRONIZED
Date: 2026-09-26

## Exact accepted input

- PR: #452
- Candidate: $cand
- canonical fresh-R evidence: $evidence
- verdict: IMPLEMENTATION_ACCEPTED_CANDIDATE
- same-attempt 403 relay is now published as the canonical GitHub evidence; no second review was requested.

## Synchronization

The accepted current-main capability is intentionally narrow: direct ability effects of exact set_player_flag shape, controller target only, nonempty key, and explicit boolean/string/finite-number value. Runtime state and MatchSession restore validation are bounded to that scalar controller contract.

No consumer authoring, current-round AST/lifecycle, arbitrary targets, clear/add-number operations, player-flag conditions, or broad historical M50 player-flag subsystem is synchronized here.

## Exact-50 state

The accepted runtime rescans the historical 153-identity replay pool at 22 ready / 131 blocked, up from 14 / 139 before this capability. This is readiness evidence only. It neither migrates those identities nor proves their final source/provenance and semantic dependency closure.

Because a non-tail F4 batch must contain exactly 50 identities, exact-50 composition remains blocked. The next capability task is P3-B-MAIN-REPLAY-M50-PLAYER-FLAG-ROUND-STATE-CORE-R2, limited to the additional bounded player-flag conditions/current-round/clear/add-number semantics not already accepted by #452. Historical accepted #440/#441 material is semantic provenance; PR #451 is not formal lineage because it descends from the non-canonical planning branch.

## Accounting

Zero migration credit. Formal/material remains 112/944; remaining 832.
