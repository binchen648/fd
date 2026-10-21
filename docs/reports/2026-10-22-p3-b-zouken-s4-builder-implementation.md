# P3-B Zouken S4 builder implementation

- Date: 2026-10-22
- Lane: Builder (GPT-5.6 Luna)
- Base: f87e8a01fc96e21dbd3f8dc3c1cc8fe7458fbc10
- Worktree: E:\Codex\FD\binchen648_fd\zouken-s4-builder
- Scope: exactly `master.zouken.skill.s4` / 间桐脏砚 S4
- Decision: implement the source-specific S4 target-runtime contract; leave the other five Zouken skills source-only

## Canonical provenance

The active authoring record is `data/authoring/masters/master.zouken.json`,
skill S4. Its normalized printed text is bound to the development source
`E:\Codex\FD\Fate_Domination-开发版\data_masters.js`, locator `line=19; record=m_zouken`,
SHA-256 `C596AF5730846EF9092375F18C4200B84F032028DC2E8F5483377D8DDCC22825`.
The shared development art is
`E:\Codex\FD\Fate_Domination-开发版\images\masters\间桐脏砚.png`, SHA-256
`4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9`.
The legacy snapshot is recorded with SHA-256
`BFF4C268CA3F292E3F32FD2A3B51C7520E3D8C475C703BDB854A43B48318BF2A`.
The three normalized S4 clause hashes are respectively
`dea05b1024efdc4802497595a372ed1a2290fb5268c35fe6330fd96f7e1b9305`,
`3326dc0bdd2db20f88c2652a09ebfb25691c0b4beabf0a2dd86f3f53d76cee98`, and
`1a648249487df828988dd2ecfa5dbbbbaf632d1a84ac55302eaa31428863e1fc`.
The cross-repository audit remains provenance evidence only; no old runtime
implementation was copied or treated as semantic authorization.

## Fail-closed target contract

The interpreter accepts only the exact source card ID
`master.zouken.skill.s4`, the three exact ability IDs, the recorded printed
clauses, and their fixed trigger/effect/target shapes. A different card,
ability ID, trigger, cost, target shape, or widened amount is rejected.

* Round end: on the exact `round_end` event, authoritative
  `manaGainedThisRound` is read for the current round. Less than three means
  two VP are removed, clamped at zero. A source-bound round ledger makes the
  operation idempotent and is restore-validated.
* Battle end: the exact `after_battle_ended` envelope must contain canonical
  phase, battle IDs, result IDs, participant IDs, and outcome cardinality.
  Each event winner set must exactly equal the corresponding authoritative
  `state.battleResults[ordinal - 1].winnerPlayerIds` set, and the event phase
  participant set must exactly equal the union of authoritative per-battle
  participant sets. Battle history supplies losers; a deterministic seat-first loser is chosen.
  If the controller is at `recon`, or there is no other participant, the
  fallback grants three mana. Otherwise the selected loser supplies up to
  three. Recipient cap is applied first and only the actual gain is deducted,
  producing one atomic settlement event. No loser or malformed provenance
  fails closed. A source-bound phase ledger prevents replay duplication.
* Combat movement: only the exact combat action ability with seven mana cost,
  one `any_enabled_location` destination, and the existing location legality
  checks can activate. Payment and move are executed in one resolution
  transaction, with payment recorded before the move effect; insufficient
  mana is not exposed as a legal action.

The new runtime ledgers and settlement event fields are included in restore
validation. Existing transaction cloning provides rollback if any part of a
settlement fails.

## Verification

Focused S4 regression: 7/7 passed. It covers exact loader/semantic shape,
round threshold and replay, battle loser transfer and replay, no-participant
fallback, recipient cap atomicity, movement payment/event order, and the
insufficient-mana boundary. Combined S4/S1/owner regression: 13/13 passed.
Match-session and battle-terminal regressions with a 30-second per-test
timeout: 45/45 passed. Playtest content validation reports 8 masters, 7
servants, 20 events, and 0 blocking issues. TypeScript project build passed,
and `git diff --check` is required before commit.

Frozen inventory statuses and the three other Zouken source-only boundaries
are unchanged. No Candidate, A-sync, credit, PR, or unrelated owner change is
included in this Builder commit.
