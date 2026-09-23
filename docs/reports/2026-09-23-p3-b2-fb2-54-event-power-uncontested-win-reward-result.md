# P3-B2 FB2-54 Event Power / Uncontested Win Reward Result

Role: B2
Task: `P3-FB2-54-EVENT-POWER-UNCONTESTED-WIN-REWARD`
BaseCommit: `febbdfcfcfea295d4e6bb005369b03e9d80307a6`
ReferenceCommit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
MechanicFamily: bounded authoritative entry source-power accumulation + trusted uncontested controller-win VP reward
AffectedAbilities: `[]`
RuntimeBehaviorChanged: true
MigrationCredit: `0`

## Result

Implemented only the identity-free FB2-54 family dispatched and clarified by A. Production code contains no Mechaeli/servant identity, Chinese printed text, clause hash, or Reference-handler routing.

The family has exactly two accepted whole-ability shapes.

### Opponent entry -> source +2 combat power

The exact forced trigger may consume only one of the two existing authoritative location-entry roots:

- `after_controller_enters_location` for ordinary server movement; or
- `after_player_deployed_to_battlefield` for advance-phase deployment.

The exact ordered conditions are `source_active`, `event_player_is_opponent`, `event_location_equals_controller`; the sole effect is literal `source_card_combat_power_bonus: 2`.

Authoritative entry provenance is transaction-local. Ordinary effect/dataflow/Ruler-seal movement records the exact already-applied player/location fact inside the current rules transaction; real `MatchSession.dispatchDeployPlayer` uses the same trusted entry producer after authoritative deployment changes `player.locationId`. Public `processAbilityEvent` clears that transient provenance, so a caller cannot manufacture a qualifying entry event by supplying matching strings.

Each distinct trusted qualifying root installs one source-bound serialized `card.currentPower +2` ongoing modifier. Bonuses stack additively, processed-event ids remain idempotent, and the exact physical source must remain active/face-up in an active area. Inactive/face-down/invalid-zone source state immediately removes the contribution through existing source-bound liveness. Persisted FB2-54 modifier structure is revalidated before use; malformed policy/source/modifier/value state fails closed rather than widening card power.

### Uncontested controller win -> +4 VP

The exact forced trigger is `after_controller_wins_battle`, with ordered conditions `source_active`, `event_location_equals_controller`, and literal `event_battle_opponent_count_equals: 0`; the sole effect is existing authoritative `adjust_victory_points(controller,+4)`.

The condition does not inspect current mutable co-location. It requires the derived win event to exact-match a server-owned `trustedBattleResultSnapshots` root: battle phase id, battle id, result id, battlefield, participant list, participant power snapshot, winners and losers all match; participant ids are unique and known; controller is the derived event player, frozen participant and trusted winner. Zero opponents means the frozen participant list contains only controller. Contested, forged, stale, unknown-participant, wrong-battlefield, wrong-result and mismatched-derived events remain mutation-free. Successful +4 settlement uses the existing authoritative VP transition path and therefore emits normal trusted VP-change provenance for downstream consumers.

### Fail-closed / compatibility boundary

`source_card_combat_power_bonus` and `event_battle_opponent_count_equals` are reserved vocabulary. Literal amount/count, slot, trigger, condition order, extra keys, extra effects and the entire parent envelope are checked by loader/compiler and runtime admission. Wrong-position or near-match reserved vocabulary compiles unsupported rather than falling through legacy handling.

Existing FB2-43 remains movement-only outside the exact FB2-54 parent. FB2-31 event-player relation, FB2-33 combat-outcome facts, FB2-43 location relation and FB2-51 authoritative VP provenance continue to pass unchanged. No generic counter, metric, player flag, generic combat-power API, arbitrary opponent-count condition, consumer authoring, schema-wide battle protocol, product/generated/client content, merge/retarget, or migration credit was introduced.

## Validation evidence

- `FD_TOOLCHAIN_OK`.
- Final affected compatibility bundle (FB2-54 + FB2-31 + FB2-33 + FB2-43 + FB2-51): **5 files / 51 tests PASS**.
- FB2-54 focused contract/runtime proof: **14/14 PASS**, including real `MatchSession` deployment producer, ordinary movement, stacked/idempotent +2, source invalidation, malformed persisted ongoing state, trusted solo-battle +4, contested/forged/stale/mismatched/unknown-participant no-reward, and downstream VP provenance.
- Typecheck: PASS after final implementation.
- Established stable official Phase-3 full gate `npm run test:ci -- --maxWorkers=2`: **187 files / 1407 tests PASS**; the historical 11-round MatchSession smoke passed at about `2162 ms`.
- Unbounded parallel `npm run test:ci` was also exercised and is **not reported as PASS**: it timed out only the pre-existing 11-round MatchSession smoke at its fixed 5000 ms wall-clock threshold while all other Candidate tests passed. A clean pre-FB2 Reviewer baseline reproduced the same single test/signature at about `6078 ms`; isolated Candidate smoke runs passed around `2.34 s`. No timeout, skip/delete, test body, worker default, or repository configuration was changed to hide this inherited parallel-suite timing fragility. This follows existing Phase-3 precedent while retaining the stable `--maxWorkers=2` gate.
- `npm run content:validate`: PASS (`7` masters / `7` servants / `20` events / `0` blocking issues).
- `npm run verify:generated-content`: PASS; generated content hashes unchanged (`fd-playtest-v1.content-library.json` `b38f475ddba68450d678f38da04d336d5d905c315527f08c474496fd09076f0c`).
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Client production build: PASS; only existing Vite browser-externalization / chunk-size warnings.
- `npm run phase3:coverage`: PASS (`128` archives / `174` cards / `287` abilities / `78` compiled cards / `14` compiled characters / `blockingIssues=0` / `dualRuntime=0`); generated coverage artifact restored byte-for-byte from exact Base.
- `npm run phase3:automation-audit`: PASS (`promotionFindings=20`); generated audit artifact restored byte-for-byte from exact Base.
- Product/generated/pack/client/consumer-authoring/phase3-inventory diff from exact Base: empty.
- Production identity/text routing probe for `mechaeli`, `servant.mechaeli`, `钢铁天空魔女`, and `player.entered-location`: no hits.
- `git diff --check`: PASS.

## Accounting / next action

FB2-54 is zero-credit capability infrastructure. Formal migration remains **`156/944`**, with **`788`** remaining; material authoring overlap remains **`151/944`**.

After exact fresh independent R `IMPLEMENTATION_ACCEPTED_CANDIDATE` plus A synchronization, A must freshly reconstruct the complete frozen `servant.mechaeli.skill.sc-mechaeli-2` against that synchronized runtime. Dispatch singleton S only if the whole card is then mechanically zero-gap; otherwise dispatch only the minimum residual identity-free seam.