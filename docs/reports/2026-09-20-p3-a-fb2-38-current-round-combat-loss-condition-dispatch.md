# P3-A FB2-38 Current-Round Combat-Loss Absence Condition Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Baseline

- Exact formal migration Base: `4ebbc438f13cb2ea3a9271332ce256f256dc2738`
- Formal migration accepted: `140/944`
- Formal remaining: `804`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

PR #381 / Ibaraki remains pending independent migration review and is not part of this lineage.

## Closure-first overlay

A fresh mechanical loader-readiness probe over the remaining source-grounded `READY_GENERIC_EXTENSION` population found no additional zero-gap consumer beyond the already-pending Ibaraki migration. After accepted token normalization, the nearest dependency-complete consumer without a missing referenced card definition is `servant.darius.skill.sc-darius-1`.

Its source-grounded residual semantics normalize onto already accepted contracts for:

- battle-phase terminal trigger: Reference `combat.ending` -> accepted `after_battle_ended`;
- source-active gating;
- `close_source_card`;
- `while_active / immediate / remain_active` lifecycle;
- below-eight-mana play permission -> accepted `skill_zone_mana_at_least: 0` authoring envelope.

The only remaining runtime gap is the exact structural condition:

```json
{ "type": "player_flag_number_not_current_round", "key": "combatLossRound" }
```

Locked Reference combat core writes `combatLossRound = current round` whenever a participating player is not among the battle winners. The current FD runtime already retains authoritative phase-local `battleResults[]` with per-result `participantBreakdowns` and `winnerPlayerIds`, and emits one authoritative phase-terminal `after_battle_ended` event. Therefore this condition can be evaluated from current battle provenance without adding mutable identity-specific state.

FB2-38 does not migrate any consumer and earns zero migration credit.

## Exact implementation scope

Implement one narrow identity-free condition seam only:

1. Admit exactly `{ type: "player_flag_number_not_current_round", key: "combatLossRound" }`. Wrong key, extra structural fields, non-string/coercible key values, or related generic player-flag shapes remain unsupported.
2. Evaluate it only against authoritative current battle-phase terminal provenance. The containing activation/event must be `after_battle_ended` with a valid current-round `battlePhaseResolutionId`; malformed/non-terminal contexts fail closed.
3. The condition is true exactly when the ability controller did not lose any battle represented by the current terminal phase. A loss means the controller appears in that battle result's `participantBreakdowns` and is absent from that result's `winnerPlayerIds`.
4. Do not infer loss merely because the controller is absent from one battle's winner list; non-participation is not a loss.
5. Loss-effect suppression does not turn an actual loss into a non-loss for this condition. This matches Locked Reference `combatLossRound`, which is written from win/loss outcome rather than loss-effect eligibility.
6. Use existing authoritative `state.battleResults` / terminal provenance. Do not add a new persistent `combatLossRound` player flag or identity-specific runtime ledger.
7. Preserve ties/shared winners: a participant included in `winnerPlayerIds` is not a loser for that battle.

## Forbidden scope

- no canonical consumer identity, consumer name, printed text, F1 hash, Locked Reference hash, or Reference handler routing in production;
- no generic arbitrary player-flag interpreter;
- no `data/authoring/**` consumer migration in B2;
- no pack/generated product mutation;
- no merge/retarget;
- no unrelated trigger/lifecycle/card-action work;
- no migration credit.

## Required validation

Fresh B2 must prove:

- exact classifier accepts only the dispatched condition shape and fail-closes near matches;
- loader compiles the exact synthetic condition automatically and rejects malformed/wrong-key variants;
- authoritative `after_battle_ended` evaluation returns true when controller has no loss in the phase;
- it returns false when controller participated in any phase battle and was not a winner;
- non-participation in another battlefield does not count as loss;
- shared/tied winner membership counts as non-loss;
- `lossEffectSuppressedPlayerIds` does not erase actual non-winner outcome for this condition;
- malformed/non-terminal/stale phase provenance fails closed;
- typecheck, focused tests, rules core+regression, official CI, content validation, generated determinism, exact Locked Reference verify, client build, diff-check, final cleanliness;
- production diff hardcode audit is clean;
- formal migration remains `140/944`, remaining `804`.

After fresh R `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronization, immediately re-overlay `servant.darius.skill.sc-darius-1`; if the whole normalized card is zero-issue as expected, dispatch fresh S migration before unrelated B2 work.
