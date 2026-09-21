# P3-A FB2-48 Combat-Opponent Power VP Reward Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-21

## Formal baseline

- Exact synchronized baseline: `419f100f3aad602947eb839ab5187c7e1ed3d550` (`P3-A-R99-NOBUNAGA-S3-MIGRATION-ACCEPTANCE-SYNC`).
- Formal migration accepted: **`150/944`**.
- Formal remaining: **`794`**.
- Branch-local frozen authoring overlap: **`145/944`**.
- Frozen duplicate authoring ids: `0`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

R99 synchronized exact fresh R `MIGRATION_ACCEPTED` for Nobunaga s3. The current runtime lane is therefore closed through FB2-47 plus the accepted Nobunaga consumer; old accepted PRs remaining OPEN do not authorize duplicate work or migration credit.

## Migration-credit-first re-probe

A freshly re-probed the exact R99 baseline instead of trusting stale `READY_GENERIC_EXTENSION` labels.

The immediately previous current-baseline ready queue was already mechanically zero before FB2-46. Since then the only newly accepted runtime seams were FB2-46 and FB2-47:

1. FB2-46's bounded battle-loss VP -> winner reward transaction is consumed by Nobunaga s3, now migrated and accepted;
2. FB2-47's bounded controller-defeated -> controller VP reward seam has only Nobunaga s3 and Ozymandias s2 as frozen `player.defeated` consumers; Nobunaga is migrated, while a fresh whole-card reconstruction of Ozymandias s2 still has independent unsupported source-power, opponent-mana-loss, same-location multi-player mana and source-close semantics;
3. therefore no additional frozen singleton became `S_READY_NOW` merely from FB2-46/47.

A then rescanned the current unmaterialized, source-grounded, block-free population and rejected stale low-complexity labels by complete-card inspection. In particular:

- Arcueid s3 still spans basic-attack cost/power modifiers, exact skill-use prohibition and round-end VP loss;
- Sion s13 still spans VP payment plus playable discard-card selection and paid discard play;
- Darius s3 requires create-and-activate plus a missing formal `sc-darius-4` support definition whose own frozen semantics cannot be smuggled into this task;
- Atalanta s2 includes selected-attack temporary copying/activation semantics not represented by its sparse inventory effect axis;
- Medusa NP combines movement with battlefield advantage reallocation;
- Drake s2 is already canonical authoring and therefore does not create new frozen migration credit.

The defensible current `S_READY_NOW` queue remains **zero**. A may therefore release the next narrow identity-free B2 seam.

## Selected frozen blocker

The nearest complete-card closure target is:

- id: `servant.spartacus.skill.sc-spartacus-2`
- owner: `servant.spartacus`
- owner name: `斯巴达克斯`
- name: `伤兽的咆哮`
- printed text: `受虐之荣光-战斗阶段：战斗后获得X点战果，X为与你交战的任意一名对手的合计威力的五分之一（向下取整）。`
- static Reference metadata: Berserker, type/attribute `宝具`, cost `3`, basePower `4`, historical/final skill-zone requirement `8`.
- F1 clause source: `src/content/authoring/cards.json / skillCards[24].abilities[0].printedClause`, SHA-256 `cc5be3d123f96a8199e6c07bdae9161b93829c7b52cab2e838cb2a19b592996e`.

The frozen source ability is a residual `while_active` ability on authoritative `combat.resolved` at the controller battlefield. It chooses exactly one player from that resolved combat's opponents and awards the controller `floor(selected opponent's frozen combat power / 5)` VP.

Already accepted components on the exact baseline include source-active/lifecycle handling, authoritative battle-result production, `event_location_equals_controller` (FB2-43), ordinary pending-decision infrastructure, and controller VP adjustment. The missing semantic is the atomic relationship between the resolved battle snapshot, opponent selection, frozen participant power and the derived reward.

## Exact FB2-48 semantic envelope

Implement exactly one identity-free whole-ability contract for the Spartacus-shaped transaction:

1. source ability is residual/automatic and live only while the source remains active;
2. trigger is the authoritative exact resolved-battle root fact, not arbitrary client or string-named events;
3. controller must have participated at the event battlefield and the event battlefield must equal the controller's authoritative location for this trigger;
4. candidate players are exactly the other participants of that same frozen resolved battle; no current-location scan, no unrelated active-player scan, and no generic `CHOOSE_ONE_PLAYER` exposure;
5. server creates exactly one non-cancellable `1..1` player decision for those frozen candidates;
6. the decision binds exact root provenance plus the frozen participant id/power snapshot at trigger time. It must never recompute selected power from current cards/state after the battle;
7. after valid selection, reward only the ability controller by exactly `Math.floor(frozenSelectedPower / 5)` VP; zero reward is legal and does not become a generic conditional branch;
8. exact replay/duplicate root processing remains once-only through existing event idempotence;
9. stale, forged or contradictory pending-interaction metadata must fail closed and mutation-free.

The Reference-only vocabulary `event_combat_opponents`, `selected_player_event_combat_power`, and `floor_divide` is not generic authorization. The exact combination `selected_player_event_combat_power + floor_divide` occurs only in Spartacus s2 in the locked Reference; `event_combat_opponents` also appears independently in Arcueid s1a, but FB2-48 must not make that broader selector generally executable.

## Fail-closed boundary

FB2-48 must reject near-matches including, at minimum:

- wrong ability kind/lifecycle/trigger/source-state envelope;
- arbitrary event names or client-supplied battle facts;
- missing, duplicate or contradictory participant ids/powers;
- controller absent from the frozen battle;
- event battlefield not equal to the controller battlefield at trigger time;
- candidate scopes other than the exact resolved-combat opponents;
- zero/optional/multi-player selection, cancelable selection, extra targets/effects/cost/creates/modifiers;
- current/recomputed combat power instead of the bound frozen power snapshot;
- divisor other than literal `5`, non-floor arithmetic, variable divisor, arbitrary formula composition;
- reward target other than controller or resource other than VP;
- extra post-selection effects;
- malformed/stale/forged interaction revision, continuation, source identity, ability identity, trigger/result identity, participant list or power map.

Do not expose generic player selection, generic battle-opponent selectors, generic selected-player metrics, generic formula/floor-divide authoring, generic battle-result reward routing, or identity/name/Chinese-text routing.

## Authorized B2 scope

B2 may modify only what is necessary for this bounded transaction. Expected scope is:

- one dedicated identity-free helper/classifier module, preferably `packages/rules/src/ability/combat-opponent-power-vp-reward.ts`;
- `packages/rules/src/ability/types.ts` only for the narrow server-owned pending interaction metadata required to freeze exact battle provenance/powers;
- `packages/rules/src/ability/loader.ts` only to reserve/reject the exact FB2-48 vocabulary/whole-ability envelope;
- `packages/rules/src/ability/interpreter.ts` only for exact trigger staging and exact pending-decision settlement integration;
- `packages/rules/src/index.ts` only if the dedicated classifier/helper needs public test export;
- focused `packages/rules/tests/fb2-48-combat-opponent-power-vp-reward.test.ts`;
- `docs/reports/2026-09-21-p3-b2-fb2-48-combat-opponent-power-vp-reward-result.md`.

B2 must not edit `data/authoring/**`, `data/packs/**`, generated product, client production, full-roster inventory/catalog/KPI definitions, Spartacus identity files, or unrelated battle/resource/interaction semantics. `match-session.ts`, `executable-card-pack.ts`, and `resolution-dataflow.ts` are not authorized unless an exact unavoidable compile/runtime blocker is first mechanically demonstrated; do not widen scope pre-emptively.

`interpreter.ts` is an exclusive hot file; this dispatch is the only current runtime lane and B2 must keep its work serialized on the exact Base below.

## Required verification

At minimum B2 must prove:

- exact raw and compiled whole-ability classification plus adversarial near-match rejection;
- trusted real battle root with controller + one/multiple opponents produces exact frozen candidate ids/powers;
- selection of different opponents uses each selected opponent's frozen effective battle power and awards exact floor(power/5);
- post-trigger mutation of card/power/current location cannot change the bound reward;
- controller/nonparticipant/outsider/duplicate selection rejection;
- wrong battlefield, malformed root provenance and contradictory participant-power snapshot fail closed;
- stale/forged pending metadata/revision/continuation/trigger identity fails closed and mutation-free;
- exact replay does not restage/reward twice;
- zero reward works without mutation outside decision cleanup;
- existing FB2-43, FB2-46, FB2-47, private-interaction and battle regression compatibility remains green;
- typecheck, official CI, content validation, generated determinism, exact Locked Reference verification, client build, Phase-3 coverage (restoring generated artifacts), identity/scope audit and `git diff --check` all pass.

## Accounting

FB2-48 is capability infrastructure and earns **zero migration credit**. Formal project migration remains **`150/944`**, with **`794`** remaining throughout B2 implementation/review.

After exact fresh independent R accepts FB2-48 and A synchronizes that acceptance, freshly reconstruct the complete `servant.spartacus.skill.sc-spartacus-2`. Dispatch singleton S only if the whole card is mechanically zero-gap on that synchronized runtime.
