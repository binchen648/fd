# P3-A R82 FB2-39 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted capability input

- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/389#issuecomment-5747497720`
- Exact A dispatch Base: `9a0968f064565556818c043c12b38d4cfa69d837`
- Accepted B2 Candidate: `3ca21ec1c20cc7d6689b3fef6c28f982bb4ff93c`
- PR: `#389`
- Task: `P3-FB2-39-GAME-START-PLAYER-STATUS-ASSIGNMENT`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `3ca21ec1c20cc7d6689b3fef6c28f982bb4ff93c`;
- PR #389 remains OPEN / CLEAN / non-draft, unmerged, with exact dispatch Base branch `codex/a-p3-fb2-39-game-start-status-assignment-dispatch` and exact Head Candidate `3ca21ec1c20cc7d6689b3fef6c28f982bb4ff93c`;
- canonical fresh independent R evidence `5747497720` binds exact Base `9a0968f064565556818c043c12b38d4cfa69d837` and exact Candidate `3ca21ec1c20cc7d6689b3fef6c28f982bb4ff93c`, returning `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no implementation defect against the recovered contract;
- Base-to-Candidate scope is exactly the FB2-39 result report, the new identity-free game-start player-status assignment module, interpreter/loader/types/export wiring, and focused FB2-39 tests; there is no consumer authoring, generated/product pack, or client mutation;
- accepted capability is the exact automatic authoritative `game_start` + exact type-only `source_owned` envelope with one or more exact `add_status` effects targeting only literal `controller` or exact `{ scope: "turn_order_next_player" }`;
- `turn_order_next_player` resolves from authoritative player seats, wraps once, skips inactive/eliminated players, never returns the controller, and fails closed on invalid/ambiguous topology;
- opaque status keys are server-owned in `AbilityRuntime.playerStatusKeysByPlayer`, deduplicated per player, and do not mutate `PlayerState.status`;
- malformed/widened/nested status-assignment shapes fail closed and existing game-start handlers retain their prior routes;
- production hardcode audit is clean for Amakusa / `教则` / consumer hashes / locked Reference hash / red-team or god-servant identity routing;
- reviewer validation on the exact Candidate passed typecheck, focused FB2-39 plus three existing game-start files (4 files / 31 tests), rules core+regression (82 files / 494 tests), official CI (158 files / 1112 tests), content validation, generated determinism, exact Locked Reference verification, client production build, and `git diff --check`;
- Candidate and Locked Reference tracked worktrees are clean at the exact reviewed heads.

## Formal accounting after synchronization

Project formal migration accepted remains **`142/944`**, with **`802`** remaining.

FB2-39 is identity-free runtime capability infrastructure and earns **zero migration credit**. No consumer identity is credited by this synchronization. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

PR #389 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Migration-closure-first requires immediate re-overlay of exactly `master.amakusa.skill.s1` (`教则`). The FB2-39 dispatch identified it as the nearest one-seam, no-missing-material closure target. If the normalized whole card is zero-issue on this synchronized capability baseline, dispatch a fresh singleton S migration immediately before any unrelated B2/runtime work.
