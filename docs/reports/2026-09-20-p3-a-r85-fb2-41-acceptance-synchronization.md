# P3-A R85 FB2-41 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted capability input

- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/392#issuecomment-5747802266`
- Exact A dispatch Base: `5b5d32284efe9c4a6b9f6a169fb268e8cb1aba27`
- Accepted B2 Candidate: `72b2e284f93beb2d6659496b28a90e5719c78c95`
- Prior rejected Candidate: `60d937e3b1a2b2bda4fb0a61cbbbf4d8326d2337`
- PR: `#392`
- Task: `P3-FB2-41-CURRENT-ROUND-COMBAT-WIN-CONDITION`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `72b2e284f93beb2d6659496b28a90e5719c78c95`;
- PR #392 remains OPEN / CLEAN / non-draft, unmerged, with exact dispatch Base branch `codex/a-p3-fb2-41-current-round-combat-win-condition-dispatch` and exact Head Candidate `72b2e284f93beb2d6659496b28a90e5719c78c95`;
- canonical fresh independent R evidence `5747802266` binds exact Base `5b5d32284efe9c4a6b9f6a169fb268e8cb1aba27` and exact revised Candidate `72b2e284f93beb2d6659496b28a90e5719c78c95`, returning `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no blocking finding;
- the prior exact Candidate `60d937e3b1a2b2bda4fb0a61cbbbf4d8326d2337` was independently rejected and was not re-reviewed; the accepted revision is its direct child;
- the accepted revision removes only the invalid exact `participants == winners + losers` requirement, preserves dense/unique/known-player and winner/loser membership/disjointness validation, and adds a real `stepGameLoop` regression for loss-effect suppression;
- accepted capability is the exact identity-free `{ type: "player_flag_number_not_current_round", key: "combatWinRound" }` condition plus server-owned `combatWinRoundByPlayer` ledger populated from authoritative battle-result winner membership;
- shared/tied winners are recorded; losses and non-participation are not; loser-side loss-effect suppression does not invalidate a legitimate winner;
- malformed/stale provenance fails closed before ledger mutation, and round-end evaluation requires authoritative `round_end` context;
- no generic arbitrary player-flag interpreter, Nero identity routing, consumer authoring, product/generated mutation, merge, or retarget is introduced;
- reviewer validation on the exact revised Candidate passed typecheck, focused FB2-41 + FB2-38 2 files / 22 tests, rules 84 files / 516 tests, official CI 161 files / 1132 tests, content validation, generated determinism, exact Locked Reference verification, client production build, `git diff --check`, production identity audit, forbidden scope audit, and narrow-state audit.

## Formal accounting after synchronization

Project formal migration accepted remains **`143/944`**, with **`801`** remaining.

FB2-41 is identity-free runtime capability infrastructure and earns **zero migration credit**. No consumer identity is credited by this synchronization. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

PR #392 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Migration-credit-first requires immediate whole-card re-overlay. FB2-40 supplied exact `source_card_active_round_count`; FB2-41 now supplies the remaining exact `combatWinRound` absence condition previously blocking `servant.nero.skill.sc-nero-1`. Re-probe the complete Nero s1 authoring shape mechanically. Dispatch S only if the whole card now loads with `report=[]`, automatic execution, and no other runtime/interaction/lifecycle gap.
