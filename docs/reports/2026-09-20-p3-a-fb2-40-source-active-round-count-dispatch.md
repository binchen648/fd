# P3-A FB2-40 Source-Card Active-Round Count Metric Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Baseline

- Exact formal migration Base: `e6441d15f5f735b78b8d56eee442b213ff7c981e` (R83 Amakusa migration acceptance synchronization).
- Formal migration accepted: `143/944`.
- Formal remaining: `801`.
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

FB2-40 is B2 capability work only and earns zero frozen migration credit.

## Migration-credit-first readiness proof

No `S_READY_NOW` remains before opening FB2-40:

1. Immediately before FB2-39, A mechanically proved the ready queue zero at formal `142/944` after Darius and historical Ibaraki were credited.
2. FB2-39 added only the exact identity-free authoritative `game_start` + `source_owned` + player `add_status` seam for `controller` or exact `turn_order_next_player`.
3. A fresh semantic-matrix search on the synchronized baseline finds only `master.amakusa.skill.s1` in the source-grounded roster with the exact `game.started` + `ADD_STATUS` family admitted by FB2-39.
4. That exact identity has now received fresh R `MIGRATION_ACCEPTED` and A synchronization to `143/944`.
5. The Amakusa S migration changed only its standalone authoring archive, focused tests, and result report; it added no production runtime capability and therefore cannot make any unrelated frozen identity newly executable.
6. Known low-gap stale `READY_GENERIC_EXTENSION` rows remain blocked: Akasha s1 still needs copies plus `until_condition_met`; Darius s2 still needs its two unsupported modifier contracts; Nero s1 still needs `source_card_active_round_count` plus the separately unsupported `combatWinRound` absence condition.

Therefore the ready queue is again mechanically zero and one narrow zero-credit runtime seam is permitted.

## Nearest dependency-complete closure target

Select `servant.nero.skill.sc-nero-1` (`邀至心荡神驰的黄金剧场`) as the next closure target.

Locked Reference contains two residual abilities. Current accepted contracts already cover its ordinary action play envelope, true-name visibility metadata, source-active gating, battle outcome condition, controller VP adjustment, round-end trigger, source-card closing, and `while_active / remain_active` lifecycle. The two remaining gaps are independent and must not be combined into one broad B2:

1. win reward amount metric `source_card_active_round_count`;
2. exact round-end absence condition `{ type: "player_flag_number_not_current_round", key: "combatWinRound" }`.

FB2-40 dispatches only the first gap. The second remains explicitly unsupported after this Candidate and will require its own future scheduler cycle if the ready queue is still zero.

Reference search confirms `source_card_active_round_count` occurs exactly once in the locked `src/content/authoring/cards.json`, on Nero s1. The implementation must nevertheless be identity-free and structural.

## Exact capability

Admit one bounded server-owned formula metric named exactly `source_card_active_round_count`.

Required semantics:

1. The metric is valid only as a formula variable resolved against the current source card instance.
2. Resolve from authoritative ability-runtime card state; do not add a second mutable counter or consumer-specific ledger.
3. A currently active source with `playedRound = R0` evaluated in round `R` returns exactly `R - R0 + 1`.
4. Same-round activation therefore returns `1`; each later round increments by one while the same source remains active.
5. Missing source instance/card state, inactive or face-down source, non-integer/invalid `playedRound`, `playedRound < 1`, or future `playedRound > current round` must fail closed rather than coerce or guess.
6. Do not broaden arbitrary runtime-property access, dynamic path traversal, or generic named metrics.
7. Existing server metrics and controlled AST rules remain unchanged.

The loader may whitelist exactly this metric variable in the same controlled server-metric boundary used by current formula variables. Runtime evaluation must remain identity-free: no Nero id/name/text/hash/Reference handler routing in production.

## Forbidden scope

- no `combatWinRound` support in FB2-40;
- no generic player-flag state/interpreter;
- no new event trigger or battle-history ledger;
- no consumer authoring migration;
- no pack/generated product mutation;
- no canonical consumer identity/name/printed text/F1 hash/Reference hash in production routing;
- no merge or retarget;
- no migration credit.

## Required validation

Fresh B2 must prove at minimum:

- loader accepts exact `source_card_active_round_count` as a controlled server formula variable and rejects near-name/arbitrary variables;
- same-round active source evaluates to `1`;
- later rounds evaluate `currentRound - playedRound + 1` exactly;
- missing/inactive/face-down/corrupt/future source state fails closed without mutation;
- existing formula metrics still behave unchanged;
- production hardcode audit contains no Nero / Golden Theater / consumer hashes / Reference-handler routing;
- typecheck, focused tests, rules core+regression, official CI, content validation, generated determinism, exact Locked Reference verification, client build, `git diff --check`, and final cleanliness pass;
- formal migration remains `143/944`, remaining `801`.

After fresh independent R acceptance and A synchronization, immediately re-overlay Nero s1. Because `combatWinRound` remains intentionally unsupported, do not credit or migrate Nero unless a subsequent exact seam closes that final gap and a whole-card probe is zero-issue.
