# P3-B22 Handoff — Gatou Battle-End Mobile-Player Reward

- Date: 2026-09-14
- Owner: Codex A
- Base: `899bba6b5c9552dffe788b6b32ae472480eb8d1f`
- B22 implementation branch: `codex/b-p3-b22-gatou-battle-end-reward-r1`
- Reviewer task: `P3-R16`

## Why this consumer is next

After B21/R15 synchronization, the TO14 direct-consumer overlay is `11/13`. Only Gatou `seeker.battle-end-reward` and Olga `trismegistus.loss-transform` remain. Gatou is selected first because B15 already owns the stable `after_battle_ended` terminal event, while Olga still requires an explicit Special state-machine/lifecycle contract.

## Exact semantic

Canonical authoring is one `forced_trigger` on `after_battle_ended` with one `record_master_directive` effect whose directive is `gatou_battle_end_mobile_players_reward`. The printed clause is authoritative for this narrow directive:

> 战斗阶段结束时，每有一名位于你所在地地点且以移动进入该地点的其他玩家，你获得1点魔力。若你获胜，改为获得1点战果。

The implementation must consume existing authoritative state rather than parse this Chinese text at runtime.

## Provenance contract

- Use the accepted B15 terminal event only after prior post-scoring work is terminal.
- Fresh implementation proof may add only a narrow frozen `battleOutcomes[{battlefieldId,winnerPlayerIds}]` snapshot to the B15 terminal event if current state no longer retains scored battle results; this provenance addition belongs in `ability/battle-terminal.ts` and must not broaden terminal semantics.
- Current-round successful `movement` log entries are the authoritative proof that another player entered a location by movement. Initial deployment/placement is not a movement log and never qualifies.
- At settlement, a qualifying player must still be at the controller's current location and have moved into that same location during the current round. Count player IDs, not movement records.
- Winning is determined from the authoritative battle result for the controller's current location in this battle phase. Membership in `winnerPlayerIds` is sufficient, including shared/tied winners.
- If winning, reward is +1 VP per qualifying player instead of mana. Otherwise reward is +1 mana per qualifying player.

## Required proof

1. Renamed card/ability IDs still classify; unrelated directive values and malformed shapes do not.
2. Terminal ordering occurs after all scoring/result work and does not trigger per battlefield.
3. Controller/frozen-participant eligibility survives same-battle scoring elimination but unrelated controllers do not receive the trigger.
4. Movement provenance excludes deployment, stale prior-round movement, controller movement, moved-away players, and duplicate movement records.
5. Win branch and non-win branch use the correct typed resource and actual delta; mana cap behavior is authoritative.
6. Zero qualifiers is a deterministic no-op.
7. Stable terminal replay/reconnect/stale commands do not reward twice.
8. Malformed same-family shapes fail closed before legacy directive fallback and reject atomically.
9. B13-B21 focused/current-lineage and Chromium compatibility remain green.
10. Full-root failures are compared with the accepted B21 inherited baseline; only new deterministic failures block B22.

## Scope exclusions

Do not migrate `seeker.meditation`, Gatou command-spell directives, generic directive protocol, Olga loss-transform, broad TO14, TO15 Modifier/Power, TO16 Special, or authoring/KPI/taxonomy changes.

## Reviewer launch

P3-R16 starts in a fresh reviewer worktree at the exact frozen B22 candidate SHA, reviews read-only, implements no fixes, and independently verifies movement/winner provenance, terminal ordering, typed resource evidence, fail-closed/exactly-once behavior, Chromium Gate C, full-root baseline, and identity independence.
