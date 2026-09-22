# P3-A R84 FB2-40 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted capability input

- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/391#issuecomment-5747670710`
- Exact A dispatch Base: `0b666871a99a76ab9fb804e5c817f02a9f583727`
- Accepted B2 Candidate: `0f344ad5edf3bced8f8e4fced4098346a9eb98cb`
- PR: `#391`
- Task: `P3-FB2-40-SOURCE-ACTIVE-ROUND-COUNT`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `0f344ad5edf3bced8f8e4fced4098346a9eb98cb`;
- PR #391 remains OPEN / CLEAN / non-draft, unmerged, with exact dispatch Base branch `codex/a-p3-fb2-40-source-active-round-count-dispatch` and exact Head Candidate `0f344ad5edf3bced8f8e4fced4098346a9eb98cb`;
- canonical fresh independent R evidence `5747670710` binds exact Base `0b666871a99a76ab9fb804e5c817f02a9f583727` and exact Candidate `0f344ad5edf3bced8f8e4fced4098346a9eb98cb`, returning `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no blocking finding;
- Base-to-Candidate scope is exactly the FB2-40 result report, loader metric allowlist, interpreter metric evaluation, and focused FB2-40 tests;
- accepted capability is the exact controlled formula metric `source_card_active_round_count` derived from authoritative source-card `playedRound` as `currentRound - playedRound + 1`;
- evaluation requires an existing physical source in active board zone (`field` or `attack_area`), active and face-up runtime state, and safe positive non-future `playedRound`; malformed or missing provenance fails closed;
- no second active-round ledger, generic property traversal, Nero/Golden Theater identity routing, `combatWinRound`, consumer authoring, product/generated mutation, merge, or retarget is introduced;
- reviewer validation on the exact Candidate passed typecheck, focused FB2-40 1 file / 5 tests, rules 83 files / 499 tests, official CI 160 files / 1122 tests, content validation, generated determinism, exact Locked Reference verification, client production build, `git diff --check`, production hardcode audit, and scope audit;
- reviewer and Candidate worktrees were clean at exact reviewed heads.

## Formal accounting after synchronization

Project formal migration accepted remains **`143/944`**, with **`801`** remaining.

FB2-40 is identity-free runtime capability infrastructure and earns **zero migration credit**. No consumer identity is credited by this synchronization. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

PR #391 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Migration-credit-first requires an immediate targeted whole-card re-overlay. Locked Reference contains `source_card_active_round_count` only on `servant.nero.skill.sc-nero-1`; FB2-40 therefore cannot newly unlock another consumer. Nero s1 still has the separate exact `player_flag_number_not_current_round` / `combatWinRound` round-end gap, so it is not yet `S_READY_NOW`. Reconfirm no other zero-gap consumer exists before opening the narrowest next zero-credit seam.
