# P3-B20 current-main independent Reviewer

Date: 2026-10-23
Exact Base: `49e4ba9d4730c9593af91a7b8a3b9b445367afcb`
Exact Candidate: `e88a50bfb2b041cb1e57987492e6af4b309a0ecc`
Reviewer branch: `codex/r-p3-b20-current-main-20261023`
Verdict: **MIGRATION_ACCEPTED**

## Reviewed scope

Only the three Artoria Caster `sc-artoriac-4/5/6.unique-passive-luck-on-win` consumers were reviewed. Their optional win response is classified by structure, with no ability-ID dispatch. It requires the controller's source card in hand, offers one unique window with three sibling choices, and permits only one resolution. The chosen response atomically moves that source card from hand to removed-from-game, creates one `card.luck` in the controller deck, and shuffles that deck. Decline makes no card change; replay and stale remote commands cannot repeat the reward.

The Candidate now requires both participant and winner provenance for a direct `after_controller_wins_battle` event. Independent state probes showed three responses for the complete provenance event and zero if participant IDs, battle result, winners, or both are missing. A trusted `after_battle_result_determined` root derives child participant IDs from its winner/loser result. The prior synthetic fixtures were updated to supply complete provenance without changing their dynamic winner/loser behavior. Malformed same-family structural fields fail closed; unrelated triggers and B13-B19 behavior remain intact.

## Independent verification

- Fresh separate Reviewer worktree, `npm ci` and `npm run typecheck`: exit 0; `git diff --check`: clean.
- Focused B20, B13-B19, authoring, and complex regression selection: 11 files / 135 tests passed.
- Chromium Gate C: 1/1 passed, including one-of-three settlement, reconnect, and stale replay rejection.
- Full Base `npm run test:ci -- --reporter=dot`: exit 1, 8 failed / 1,515 passed / 114 skipped.
- Full Candidate with the same command after typecheck: exit 1, 8 failed / 1,516 passed / 114 skipped. The eight failures are the same historical Phase-3 provenance Git-path/blob failures. The extra passing test is new B20 coverage. The full suite is **not green**; no new deterministic failure remains.

This is acceptance of the B20 slice only. No A-sync, merge, or migration-credit change was performed.
