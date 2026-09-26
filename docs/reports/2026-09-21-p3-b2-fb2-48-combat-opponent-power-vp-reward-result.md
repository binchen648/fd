# P3-B2 FB2-48 Combat-Opponent Power VP Reward Result

Role: Codex B2
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-21

## Exact dispatch input

- Task: `P3-FB2-48-COMBAT-OPPONENT-POWER-VP-REWARD`
- Exact A dispatch Base: `8177482148c5133ff02b6f0851c5f4402ec414a6`
- A dispatch branch: `codex/a-p3-fb2-48-combat-opponent-power-vp-reward-dispatch`
- B2 branch: `codex/b2-p3-fb2-48-combat-opponent-power-vp-reward`
- A dispatch report: `docs/reports/2026-09-21-p3-a-fb2-48-combat-opponent-power-vp-reward-dispatch.md`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal project migration remains **`150/944`**, with **`794`** remaining. FB2-48 earns zero migration credit.

## Implemented bounded semantic

FB2-48 adds exactly one identity-free whole-ability envelope for the frozen post-battle opponent-power reward transaction:

1. exact residual/automatic source, active only while the source card remains an authoritative active source;
2. exact trigger `after_battle_result_determined` on the authoritative post-scoring root event;
3. exact type-only normalized conditions `source_active` + `event_location_equals_controller`, with the latter interpreted only inside the dedicated FB2-48 trusted-root helper rather than widening the accepted FB2-43 movement condition;
4. exact dedicated compound effect token `combat_opponent_power_vp_reward`, with no effect payload and no generic formula authoring;
5. controller must be an exact participant at the root battlefield and still be located at that battlefield when the root triggers;
6. candidate ids are exactly all other ids in the frozen root participant list;
7. exact root participant powers are frozen server-side at result dispatch and copied into a private, non-cancellable `1..1` owner decision;
8. after exact choice, only the ability controller gains `Math.floor(frozenSelectedOpponentPower / 5)` VP;
9. zero reward is legal, the interaction is consumed, and exact root replay is idempotent;
10. multiple exact sources triggered by one root are serialized through a server-owned queue instead of overwriting the current pending decision.

No generic player selector, generic combat-opponent scope, generic selected-player metric, generic arithmetic/floor-divide engine or generic battle-result reward router is exposed.

## Dedicated fail-closed gateway

`packages/rules/src/ability/combat-opponent-power-vp-reward.ts` owns both admission and root provenance validation.

The whole-ability classifier admits only:

- exact `residual` kind;
- exact activation `{ trigger: "after_battle_result_determined", requiresSourceState: "active" }`;
- exact ordered conditions `[source_active, event_location_equals_controller]`;
- exact empty targets/cost/creates/ruleModifiers;
- exactly one type-only effect `{ type: "combat_opponent_power_vp_reward" }`;
- exact `while_active` lifecycle;
- exact empty limit/visibility;
- normal automatic execution and the compiled default response-window normalization only.

The candidate detector additionally recognizes the historical Reference spellings `choose_players`, `event_combat_opponents`, `selected_player_event_combat_power` and `floor_divide` solely so near-match authoring is routed to `combatOpponentPowerVpReward.gateway` and rejected. Those spellings are not registered as generic executable semantics.

Adversarial focused coverage rejects wrong kind, trigger, source-state, conditions, lifecycle, effect payload, extra effect and the historical generic multi-node shape.

## Frozen root provenance and unavoidable producer extension

A mechanically demonstrated implementation blocker before widening scope: the two authoritative post-scoring root producers carried exact participant ids but did not carry participant powers. Ability-only code would therefore have had to recompute power from mutable post-battle state, violating the dispatch contract.

The minimum producer extension is therefore exactly one additive field in each existing root producer:

- `packages/rules/src/core/game-loop.ts`: `battleParticipantPowers` is copied from the already-authoritative `result.participantBreakdowns[].effectivePower`;
- `packages/rules/src/match-session.ts`: the same field is copied from `battle.participantBreakdowns[].effectivePower` for the exact participant ids already emitted by that producer.

No winner calculation, battle settlement, VP scoring, participant derivation or phase progression changes.

`TrustedBattleResultSnapshot` is extended with an optional frozen `battleParticipantPowers` map. Existing FB2-47 fields and semantics remain unchanged; FB2-48 additionally requires an exact power-map equality match between root event and immutable first-seen snapshot.

The trusted helper rejects malformed/forged roots including wrong phase/result identity, unknown/non-battlefield location, invalid battle ordinal, missing/duplicate/unknown participants, controller absence, controller location mismatch, malformed or negative/non-safe powers, invalid/disjointness-breaking winner/loser facts, and any contradiction with the immutable root snapshot.

## Private decision integrity

FB2-48 reuses the existing generic server-owned `PendingDecision` transport but adds one dedicated metadata kind, `combat_opponent_power_vp_reward_v1`.

The metadata freezes:

- source instance / ability identity;
- exact trigger event / phase / battle / result / battlefield ids;
- exact ordered participant ids;
- exact participant power map;
- exact ordered opponent ids;
- literal divisor `5`;
- exact non-cancellable owner-only player `1..1` constraints;
- exact creation revision and continuation reference.

Settlement revalidates all of those fields against the queue head, current pending decision and immutable root snapshot before any mutation. Outsider, empty or duplicate choices and stale/forged revision, continuation, trigger/result identity or power-map edits fail closed and mutation-free.

## Focused runtime evidence

`packages/rules/tests/fb2-48-combat-opponent-power-vp-reward.test.ts` was added first as a red regression. Before production support, all **8/8** initial tests failed because the compound effect was unmapped and the helper/runtime did not exist.

Final focused suite is **10/10 PASS**, proving:

- exact raw + compiled classifier admission;
- adversarial gateway rejection including historical generic vocabulary;
- exact owner-only, non-cancellable opponent `1..1` choice;
- different selected frozen powers produce exact `floor(power / 5)` rewards;
- post-trigger board/location mutation cannot alter the bound reward;
- malformed roots fail before staging;
- outsider/empty/duplicate selection and forged pending provenance reject mutation-free;
- zero reward consumes cleanly and exact root replay does not restage/reward;
- the real `stepGameLoop` post-scoring producer carries and freezes participant powers;
- multiple exact sources on one root serialize into distinct decisions instead of overwriting each other.

## Compatibility and validation

Final working-tree validation:

- `npm.cmd run typecheck` — PASS.
- FB2-43 + FB2-46 + FB2-47 + FB2-48 + real game-loop cleanup + battle-loss regressions + MatchSession — PASS, **8 files / 93 tests**.
- interaction projection + same-battlefield private-hand interaction + private optional interaction + room boundary + FB2-48 — PASS, **5 files / 33 tests**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **175 files / 1261 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- exact Locked Reference verification — PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm.cmd run build --workspace @fd/client` — PASS; only the pre-existing Vite `node:crypto` browser-externalization and chunk-size warnings are emitted.
- `npm.cmd run phase3:coverage` — PASS: **126 archives / 168 cards / 280 abilities / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `dualRuntime=0`.
- generated `artifacts/phase3-skill-coverage.json` was restored byte-for-byte from exact Base after coverage validation; Base/restored Git blob is `ba7e18ad69e8b62e9ac0dfd2f94065ac3ce4850e`.
- `git diff --check` — PASS.
- production identity audit over `packages/rules/src/**` — PASS: no `spartacus`, `servant.spartacus`, Chinese identity/name routing or other consumer identity literal.
- historical generic spellings appear only in the dedicated candidate/rejection detector; none is exposed as executable generic vocabulary.

## Candidate scope

The intended Candidate contains exactly these nine paths:

- `packages/rules/src/ability/combat-opponent-power-vp-reward.ts` — dedicated classifier/trusted-root helper;
- `packages/rules/src/ability/interpreter.ts` — exact trigger staging, queueing and exact settlement;
- `packages/rules/src/ability/loader.ts` — dedicated effect reservation + fail-closed whole-ability gateway;
- `packages/rules/src/ability/types.ts` — narrow frozen-root powers and pending-interaction metadata;
- `packages/rules/src/core/game-loop.ts` — one-field authoritative power snapshot on the existing root producer;
- `packages/rules/src/match-session.ts` — one-field authoritative power snapshot on the existing product root producer;
- `packages/rules/src/index.ts` — focused helper/test export;
- `packages/rules/tests/fb2-48-combat-opponent-power-vp-reward.test.ts` — focused fail-closed/runtime regression;
- this result report.

There is no `data/authoring/**`, `data/packs/**`, generated product, client production, Task Index, full-roster inventory/catalog/KPI or coverage-artifact Candidate delta. No Spartacus consumer authoring is added.

## Accounting / next gate

FB2-48 is zero-credit infrastructure. Formal project migration remains **`150/944`**, with **`794`** remaining.

This is only a B2 implementation Candidate. Fresh independent R must review the exact Base/Candidate pair before any capability acceptance synchronization. After exact fresh R acceptance and A synchronization, the coordinator must freshly reconstruct complete `servant.spartacus.skill.sc-spartacus-2`; singleton S is permitted only if the whole card is then mechanically zero-gap.
