# P3-A FB2-41 Current-Round Combat-Win Absence Condition Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Baseline

- Exact formal/runtime lineage Base: `0aa115cf06d9dc652af61b4484ab230baa239318` (R84 FB2-40 acceptance synchronization).
- Formal migration accepted: `143/944`.
- Formal remaining: `801`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.

FB2-41 is zero-credit identity-free runtime capability work only.

## Migration-credit-first readiness proof

No `S_READY_NOW` consumer exists before opening FB2-41:

1. Immediately before FB2-40, the mechanically proven `S_READY_NOW` queue was zero at formal `143/944`.
2. FB2-40 added exactly one new runtime capability: controlled formula metric `source_card_active_round_count`.
3. Exact Locked Reference search shows that metric occurs on only one frozen card: `servant.nero.skill.sc-nero-1`.
4. Nero s1 still contains a separate unsupported exact condition `{ "type": "player_flag_number_not_current_round", "key": "combatWinRound" }` on its round-end close clause.
5. FB2-40 did not add any trigger, condition, card action, lifecycle, or consumer authoring capability. Therefore it cannot have unlocked any other whole-card consumer.

Hence the current ready queue remains zero and one narrow B2 seam is authorized.

## Nearest closure target

Select exactly `servant.nero.skill.sc-nero-1` as the intended next closure target.

Locked Reference semantics are:

- while the source remains active, each combat win awards VP equal to the source card's active-round count;
- if the controller did not win any combat during the current round, the source closes at round end;
- Reference writes `combatWinRound = current round` for every player included in a battle's winner set, including shared/tied winners;
- the round-end clause tests that `combatWinRound` is not the current round.

FB2-40 now supplies the active-round-count metric. The only remaining exact structural gap for this card is current-round combat-win absence.

## Exact implementation scope

Implement only the identity-free structural contract required by the exact condition:

1. Admit exactly `{ type: "player_flag_number_not_current_round", key: "combatWinRound" }`. Wrong key, extra fields, non-string/coercible key values, and other generic player-flag shapes remain unsupported.
2. Record last combat-win round only from trusted authoritative `after_battle_result_determined` events emitted by the server battle pipeline. Validate current battle-phase provenance before recording; malformed/stale/non-current events fail closed and must not mutate the ledger.
3. A winner is any controller/player listed in the authoritative winner set for that battle result. Shared/tied winners count as wins. Non-participation and losing do not create a win record.
4. Keep only a narrow server-owned `last combat win round by player` ledger (or mechanically equivalent identity-free state) sufficient for this condition. Do not expose or implement a generic arbitrary player-flag interpreter.
5. Evaluate the condition only at authoritative `round_end` for the current round. It is true exactly when the controller's recorded last combat-win round is not the current round.
6. The condition must remain true for a player who did not participate in combat or only lost; false for any player who won at least one battle in the round, including a shared/tied win.
7. Preserve transactionality: malformed recording events or malformed condition shapes must fail closed without partial state mutation.
8. Do not add `combatLossRound`, arbitrary key access, generic history queries, Nero identity routing, VP reward logic, source-card closing logic, or new consumer authoring in this B2.

## Forbidden scope

- no canonical consumer identity/name/printed text/F1 hash/Reference hash routing in production;
- no generic player-flag interpreter or arbitrary key/value history storage;
- no `data/authoring/**` consumer migration;
- no product/generated pack mutation;
- no merge or retarget;
- no migration credit;
- no unrelated metric, trigger, lifecycle, card-close, or VP reward work.

## Required validation

Fresh B2 must prove at minimum:

- loader accepts only the exact `combatWinRound` condition shape and rejects wrong key/extra fields/near matches;
- trusted current-round battle result winner recording works from authoritative server event provenance;
- malformed/stale battle-result events do not mutate the win-round ledger;
- shared/tied winners are recorded as current-round winners;
- losses and non-participation do not create a win record;
- at authoritative round end the condition is false after any current-round win and true after no current-round win;
- prior-round wins do not suppress the current round-end condition;
- no generic flag lookup and no consumer identity hardcode exists in production diff;
- typecheck, focused tests, rules core+regression, official CI, content validation, generated determinism, exact Locked Reference verification, client build, `git diff --check`, and final cleanliness all pass;
- formal migration remains `143/944`, remaining `801`.

After fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronizes FB2-41, immediately re-overlay `servant.nero.skill.sc-nero-1`; if the normalized whole card is zero-issue, dispatch singleton S migration before any unrelated B2/runtime work.
