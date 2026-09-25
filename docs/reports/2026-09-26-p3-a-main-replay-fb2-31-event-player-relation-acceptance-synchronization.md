# P3-A Current-Main FB2-31 Event-Player Relation Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-26

## Accepted input

- PR: `#454`
- Exact accepted Candidate: `5d120f6a667ba1809e4c63a60018da781780ebda`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/454#issuecomment-5839932242`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Historical authority: PR #375 Candidate `8d68f64aff1b37e4739ebc922ea4d7192714864c`, canonical evidence `https://github.com/binchen648/fd/pull/375#issuecomment-5742361142`

## Accepted capability

Only exact type-only direct `ability.conditions[i]` nodes `event_player_is_controller` / `event_player_is_opponent` over trusted `AbilityEvent.playerId`. Missing/unknown actors fail closed. Evaluation is read-only. Nested logical, target-condition, rule-modifier-condition carriers and trigger widening remain unsupported.

## Accounting

This is zero-credit B infrastructure. `data/authoring/**` delta is empty. Formal/material remains `112/944`, remaining `832`.

## Next task

Exact-50 remains blocked. Dispatch `P3-B-MAIN-REPLAY-FB2-43-EVENT-LOCATION-EQUALS-CONTROLLER` using historical PR #396 accepted Candidate `19ff09ed65e34f241d332250e1cc1370071ecf75` and canonical evidence `https://github.com/binchen648/fd/pull/396#issuecomment-5748914327`. Replay only the exact type-only identity-free location relation seam; no consumer migration, trigger widening, merge, retarget, or credit.