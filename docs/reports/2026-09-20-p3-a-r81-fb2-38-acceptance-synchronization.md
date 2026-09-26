# P3-A R81 FB2-38 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted capability input

- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/387#issuecomment-5746633189`
- Exact A dispatch Base: `aed88b889f0cbedcd029438f442d2d15ce4858bd`
- Accepted B2 Candidate: `886313bea6d70f5b271aceeb5787dfe475c4b635`
- PR: `#387`
- Task: `P3-FB2-38-CURRENT-ROUND-COMBAT-LOSS-CONDITION`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `886313bea6d70f5b271aceeb5787dfe475c4b635`;
- PR #387 remains OPEN / MERGEABLE / non-draft with exact Base `aed88b889f0cbedcd029438f442d2d15ce4858bd` and exact Head `886313bea6d70f5b271aceeb5787dfe475c4b635`;
- canonical fresh independent R evidence `5746633189` binds that exact Base/Candidate pair and returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no blocking findings;
- all earlier review comments bind historical Candidates only and remain terminal revision evidence; they do not reopen or duplicate review of the accepted Candidate;
- accepted runtime scope remains the exact identity-free condition `{ type: player_flag_number_not_current_round, key: combatLossRound }` over authoritative current battle-phase `after_battle_ended` terminal provenance;
- malformed, stale, non-terminal, sparse, unknown-roster, invalid battlefield, closed-battlefield, empty represented outcome, invalid ordinal-sequence, and outside-battle provenance fail closed;
- no persistent generic player-flag ledger/interpreter, consumer authoring, pack/generated mutation, identity routing, merge, or retarget is introduced;
- reviewer validation at the exact Candidate passed typecheck, focused 12/12, rules core+regression 83 files / 506 tests, official CI 156 files / 1099 tests, content validation, generated determinism, exact Locked Reference verification, client build, diff-check, and production hardcode audit;
- Candidate and Locked Reference worktrees were clean at the exact reviewed heads.

## Formal accounting after synchronization

Project formal migration accepted remains **`140/944`**, with **`804`** remaining.

FB2-38 is runtime capability infrastructure and earns **zero migration credit**. No consumer identity is credited by this synchronization. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

PR #387 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Migration-closure-first requires immediate re-overlay of `servant.darius.skill.sc-darius-1`. The FB2-38 dispatch identified it as the nearest no-missing-material one-seam target. If the normalized whole card is zero-issue on this synchronized capability baseline, dispatch fresh S migration immediately before any unrelated B2 work.
