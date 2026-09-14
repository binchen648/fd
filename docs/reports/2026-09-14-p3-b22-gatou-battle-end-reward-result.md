# P3-B22 Gatou Battle-End Mobile-Player Reward Result

- Date: 2026-09-14
- Owner: Codex B
- Task: `P3-B22`
- Branch: `codex/b-p3-b22-gatou-battle-end-reward-r1`
- Base / exact A-owned B22 handoff: `ac2d0a8af05eb6461c45a564f623b03807cb9a34`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Scope

B22 migrates exactly the structural Gatou `seeker.battle-end-reward` family: one forced `after_battle_ended` trigger with exactly one `record_master_directive(directive=gatou_battle_end_mobile_players_reward)` effect.

Production routing does not inspect Gatou, card, ability, or player identity. The directive literal is the narrow semantic operation key. Renamed representative card/ability IDs still classify when the exact semantic shape is preserved; malformed same-family shapes fail closed before generic legacy directive fallback.

## Runtime implementation

The accepted B15 terminal event now carries one narrow frozen `battleOutcomes[{ battlefieldId, winnerPlayerIds }]` snapshot, populated by both production battle paths. This preserves authoritative battlefield/winner provenance after scoring without broadening phase-terminal semantics.

The B22 settlement path:

- requires the controller to belong to the frozen phase-terminal participant set;
- derives successful current-round movement from authoritative `movement` log records, including effect movement recorded through the shared movement runtime;
- excludes controller movement, deployment/non-movement, prior-round movement, moved-away players, and duplicate movement records;
- counts each qualifying other player once only when that player is still at the controller's current location and moved into that location this round;
- selects the VP branch when the controller is in the frozen winner set for the battle at the controller's current location, including shared winners; otherwise selects mana;
- settles through existing typed numeric-resource resolution so authoritative cap/floor rules determine actual delta;
- emits `battle_end_mobile_players_reward_settled` evidence with resource branch, requested/actual delta, before/after, qualifying player IDs, battlefield, and terminal battle-phase identity;
- emits a deterministic typed zero-qualifier settlement without fabricating resource gain;
- rejects malformed exact-family candidates atomically before legacy directive fallback.

## Focused proof

Fresh B22 focused proof:

```text
8 / 8 PASS
```

Fresh B13-B22 current-lineage compatibility:

```text
13 test files / 117 tests PASS
```

The focused matrix covers movement provenance and deduplication, deployment/prior-round/moved-away exclusions, participant eligibility after scoring elimination, win/non-win branches, mana cap actual delta, shared winner behavior, zero-qualifier no-op, stable terminal replay, malformed fail-closed behavior, and the accepted B13-B21 battle-result lineage.

## Gate C

The earlier ordered browser run exposed reconnect/WebSocket command-send races in inherited B18 and the new B22 case rather than a deterministic production semantic failure. Test-only reliability hardening now sends the authoritative command only after the reconnect socket reaches `open`, waits briefly for transport delivery, and closes the socket deterministically. Production runtime semantics were not changed for this hardening.

Fresh B18/B22 Chromium after hardening:

```text
2 / 2 PASS
```

Fresh full B13-B22 Chromium compatibility after hardening:

```text
10 / 10 PASS
```

The B22 browser proof covers production phase-terminal settlement, persisted VP reward across reconnect, stale-revision rejection, and exactly-once reward behavior.

## Full-root baseline

Fresh root Vitest result:

```text
Test files: 107 PASS / 10 FAIL / 117 total
Tests:      701 PASS / 20 FAIL / 721 total
```

All 20 failures remain the inherited CHM/original-image evidence absence class. Relative to accepted B21 (`693 PASS / 20 inherited FAIL / 713 total`), B22 adds `+8 PASS / +0 new deterministic failures`.

## Production diff audit

- production routing contains no Gatou/card/ability/player identity literal;
- the only Gatou-named production literal is the required semantic directive key `gatou_battle_end_mobile_players_reward`;
- frozen terminal provenance is limited to battlefield/winner facts required by this exact consumer;
- no A-owned coverage KPI/taxonomy change;
- no generic `record_master_directive` or TO16 Special protocol promotion;
- no `seeker.meditation`, Gatou command-spell directive, Olga transform, broad TO14, or TO15 Modifier/Power promotion;
- `git diff --check`: PASS before candidate freeze.

## Compatibility test reliability

The branch preserves the pre-existing Artoria Caster reconnect hardening that was already present in this worktree at B22 continuation time. B18 Noble Bloom and B22 now use the same explicit WebSocket open/send/close discipline for reconnect-sensitive command delivery. These changes are confined to E2E reliability and do not alter production semantics.

## R16 handoff

Freeze the exact candidate commit from this branch. P3-R16 must start in a fresh reviewer worktree at that exact SHA, implement no fixes, and independently verify the semantic/directive boundary, movement and winner provenance, terminal ordering and frozen participant eligibility, typed Resource actual-delta/cap behavior, zero-qualifier no-op, malformed fail-closed and stable-replay exactly-once behavior, B13-B21 compatibility, fresh Chromium Gate C, full-root inherited-failure baseline, and representative identity independence before A03 may advance the TO14 overlay from `11/13` to `12/13`.
