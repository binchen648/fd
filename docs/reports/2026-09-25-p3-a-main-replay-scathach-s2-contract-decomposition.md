# P3-A Current-Main Scathach S2 Contract Decomposition

Role: Codex A
Status: `DECOMPOSITION_COMPLETE`
Date: 2026-09-25

## Exact input

- Base: current-main Astolfo S1 acceptance synchronization `096c5053913843a8a6f87e2fb1bfaf82266ea796`.
- Identity: `servant.scathach.skill.sc-scathach-2`.
- Historical material source: PR #441 Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`.
- Historical review evidence: `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`.
- Reconciliation authority: PR #442 inventory classifies this identity as `CONTRACT_REVALIDATION_REQUIRED` and part of the M50 semantic split.

## Historical card decomposition

Scathach S2 contains two independent structured abilities:

1. `piercing-spear-close`: combat phase action, active source, exactly one same-battlefield opponent, effect `opponent_close_one_non_residual`.
2. `death-omen`: after battle result, active source, controller won combat, effect `gain_victory_points_per_target` over same-battlefield opponents.

The current-main tree after Astolfo/FB2-49 synchronization does not admit `source_active`, `event_player_won_combat`, `target_count_equals`, `gain_victory_points_per_target`, or `opponent_close_one_non_residual` as generic runtime vocabulary. Therefore Scathach S2 is not eligible for direct S replay.

## Capability lineage

- `source_active` / `source_owned`: historical FB2-32. Initial Candidate `c89eac0357b2427aa9682a95f644f3e1442281bc` was rejected; accepted successor is `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49`, reviewer evidence commit `f1da3b4d0976cd80dbe4a3569bb9a216cf7dc441`.
- `event_player_won_combat`: historical FB2-33 accepted Candidate `5ccef0d682ce0673926e349eda1732419fc0792c`, canonical evidence `https://github.com/binchen648/fd/pull/377#issuecomment-5743426456`.
- `target_count_equals` and `gain_victory_points_per_target`: introduced in historical M50-01; initial `12efa4d292a04a5b592b965b44dde67d1ad6b9da` was rejected, accepted successor `f0e5554e3210e721ae98faa29fc5241b410c5b72`, canonical evidence `https://github.com/binchen648/fd/pull/440#issuecomment-5805914781`. Only these generic primitives may be semantically replayed; the 50-skill batch must not be transplanted.
- `opponent_close_one_non_residual`: historical M50-02 exact Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`, canonical evidence `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`. This is distinct from the already synchronized FB2-49 whole-opponent `opponent_close_non_residual_to_one` contract.

## Ordered replay plan

1. Replay/synchronize FB2-32 source-state conditions.
2. Replay/synchronize FB2-33 combat-outcome conditions.
3. Replay/synchronize only the M50-01 generic primitives `target_count_equals` + `gain_victory_points_per_target`.
4. Replay/synchronize only the M50-02 generic `opponent_close_one_non_residual` contract with its exact single-opponent semantics and adversarial negatives.
5. Only then dispatch one-card Scathach S2 migration and recertification.

Each capability step is zero-credit. Formal/material remains `112/944` until the final Scathach consumer receives `MIGRATION_ACCEPTED` plus A synchronization.

## Dispatch

Dispatch `P3-B-MAIN-REPLAY-FB2-32-SOURCE-STATE-CONDITIONS` first. No runtime or consumer change is made by this decomposition commit.