# P3-A FB2-39 Game-Start Player-Status Assignment Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Baseline

- Exact runtime lineage Base: `e523e10dd795c032a6b0e70627b7276213784604` (R81 Darius migration acceptance synchronization).
- Current formal migration accepted: `142/944`.
- Formal remaining: `802`.
- Formal accounting reconciliation includes historical Ibaraki acceptance synchronization `51f8af150f10a249ba471aaa65d7d7b49cabc98e`; this historical credit is accounting-only for the present runtime lineage and must not be duplicated.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.

## Migration-credit-first readiness proof

The ready queue is mechanically zero before opening FB2-39:

1. The fresh mechanical loader-readiness probe recorded in `2026-09-20-p3-a-fb2-38-current-round-combat-loss-condition-dispatch.md` found no zero-gap consumer beyond the then-pending Ibaraki migration; the nearest dependency-complete consumer was `servant.darius.skill.sc-darius-1` and its only gap was the exact current-round combat-loss absence condition.
2. FB2-38 admitted only `{ type: "player_flag_number_not_current_round", key: "combatLossRound" }` from authoritative battle-terminal provenance. Locked Reference contains this condition family on only three cards: Albion with `albionFlameDisasterRound`, Darius s1 with `combatLossRound`, and Nero s1 with `combatWinRound`. Therefore FB2-38 could newly unlock Darius s1 only; the sibling keys remained unsupported by contract.
3. Darius s1 was migrated and formally accepted. That S migration changed consumer authoring/tests only and added no runtime capability.
4. Historical Ibaraki was then independently accepted and credited. Its migration likewise added no runtime capability.
5. Fresh spot probes after 142/944 confirm known stale `READY_GENERIC_EXTENSION` rows remain blocked: Akasha s1 still needs copies plus `until_condition_met`; Nero s1 still needs `source_card_active_round_count` plus the different `combatWinRound` key; Darius s2 still needs unsupported `card_power:add` and `card_close:forbid` modifier rules.

No current `S_READY_NOW` remains, so the frozen scheduler permits one narrow zero-credit B2 seam.

## Nearest closure target

Select exactly `master.amakusa.skill.s1` (`教则`) as the next closure target.

Locked Reference whole-card semantics are structurally small:

- game-start automatic/passive trigger (`game.started`, normalized to the current authoritative `game_start` event);
- exact `source_owned` gating;
- add one persistent status to the controller;
- add two persistent status keys to the next non-eliminated player in circular turn order;
- no player choice, no cost, no card movement, no modifier, no hidden information, no delayed lifecycle, no referenced-card dependency.

Current FD runtime already has:

- authoritative `game_start` dispatch from `MatchSession` after ability-runtime initialization;
- exact `source_owned` condition support;
- stable player seat/order data;
- existing generic status-like runtime storage precedents, but no accepted typed player-status assignment route and no `turn_order_next_player` target relation.

The remaining gap is therefore one identity-free game-start player-status assignment seam.

## Exact implementation scope

Implement only the narrow structural contract required to make this whole card executable without consumer identity routing:

1. Admit an automatic game-start ability only when it uses the current authoritative `game_start` activation and exact type-only `source_owned` gating.
2. Admit only `add_status` player effects whose status is a non-empty opaque string and whose target is either:
   - `controller`; or
   - exact `{ scope: "turn_order_next_player" }`.
3. `turn_order_next_player` resolves from authoritative player seat/turn order, starting after the controller and wrapping once, choosing the first existing active/non-eliminated player other than the controller. Missing/ambiguous/only-self topology fails closed.
4. Store player status keys in server-owned generic runtime state, deduplicated per player. Do not encode Amakusa, red-team, god-servant, printed text, hashes, or card ids in production routing.
5. Status assignment is idempotent for repeated identical keys and is observable to later generic status queries/extensions; do not mutate `PlayerState.status` (`active`/`eliminated`).
6. Do not add status removal, arbitrary status targeting, status history semantics, scheduled status changes, generic `event_type_is`, or a broad relationship engine in this B2.
7. Preserve existing `game_start` exact handlers and current runtime initialization order.

FB2-39 does not migrate `master.amakusa.skill.s1` and earns zero migration credit.

## Forbidden scope

- no canonical consumer identity/name/printed text/F1 hash/Reference hash/handler routing in production;
- no `data/authoring/**` consumer migration in B2;
- no product/generated pack mutation;
- no generic arbitrary player-target DSL;
- no unrelated Amakusa vassal/ascension rules;
- no merge or retarget;
- no migration credit.

## Required validation

Fresh B2 must prove at minimum:

- exact identity-free classifier/loader acceptance for the dispatched game-start/source-owned/status-assignment envelope;
- malformed or widened forms fail closed: wrong trigger, missing/extra condition shape, empty/non-string status, unsupported target scope, extra target fields, unrelated effects;
- authoritative `game_start` execution assigns a controller status;
- circular next-player resolution uses seat/turn order and skips eliminated players;
- wrap-around works and a topology with no valid other player fails closed;
- multiple status keys to the same next player are preserved and duplicate assignments are idempotent;
- status data is server-owned and does not mutate elimination/active player status;
- existing game-start handlers remain unaffected;
- production hardcode audit is clean;
- typecheck, focused tests, rules core+regression, official CI, content validation, generated determinism, exact Locked Reference verification, client build, `git diff --check`, and final cleanliness all pass;
- formal migration remains `142/944`, remaining `802`.

After fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronizes FB2-39, immediately re-overlay `master.amakusa.skill.s1`; if the whole normalized card is zero-issue, dispatch singleton S migration before any unrelated B2 work.
