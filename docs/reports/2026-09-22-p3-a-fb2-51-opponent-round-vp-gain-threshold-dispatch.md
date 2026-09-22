# P3-A FB2-51 Opponent Round VP Gain Threshold Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-22

## Exact baseline

- Exact synchronized baseline: `47d360646ee83770e3d1f70fc3871280dc984d66` (`P3-A-R105-ATALANTA-S2-MIGRATION-ACCEPTANCE-SYNC`).
- Formal migration accepted: **`153/944`**.
- Formal remaining: **`791`**.
- Current branch-local frozen authoring overlap: **`148/944`**.
- Frozen duplicate authoring ids: `0`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

Atalanta S2 was accepted by a fresh independent reviewer and A-synchronized. Its S Candidate added no production runtime capability beyond consuming already-synchronized FB2-50, so the next task must be selected from a fresh current-baseline migration-credit-first whole-card probe rather than by stale inventory labels.

## Migration-credit-first current-baseline probe

A mechanically enumerated the current authoring against the frozen 944 inventory and then re-overlayed the materially absent, source-grounded/block-free population against the current accepted runtime.

- authored unique ids: `171`;
- frozen material overlap: `148/944`;
- duplicate frozen ids: `0`;
- materially absent frozen ids: `796`;
- source-grounded/block-free materially absent rows mechanically screened: `53`.

No complete remaining card is honestly `S_READY_NOW` on this baseline. The previously low-complexity candidates were explicitly rechecked:

- `servant.darius.skill.sc-darius-3` still needs its formal `servant.darius.skill.sc-darius-4` support definition plus the bounded create/activate/support lifecycle semantics;
- `servant.andersen.skill.sc-andersen-2` remains a reviewed-special transform/defeat-immunity boundary;
- `master.ciel.skill.s1b` already has accepted event-player opponent relation (FB2-31) and the exact controller master-skill definition-return/materialization component (FB2-30), but the authoritative per-round opponent VP-gain crossing fact is absent.

The broader 53-row scan did not expose a smaller complete zero-gap singleton. Ciel S1b is therefore the first one-seam closure target, and the minimum next capability is the exact identity-free per-round opponent VP-gain threshold crossing below.

## First frozen consumer and source evidence

Consumer:

- canonical id: `master.ciel.skill.s1b`;
- owner: `master.ciel` / 希耶尔;
- name: `外典`;
- source ability id: `seventh-scripture-return`;
- frozen printed text: `当一名对手于一回合内获得7点及以上的战果时，令【第七圣典】加入或返回你的技能区。`;
- sole frozen clause: `当一名对手于一回合内获得7点及以上的战果时，令【第七圣典】加入或返回你的技能区`;
- source locator: `src/content/authoring/cards.json / skillCards[15].abilities[0].printedClause`;
- clause SHA-256: `98a4becbbedd9d11ae2b93ea1b192b781a6943fb0ff62e1dbff4bb9697bbb6fc`;
- frozen semantic normalization: trigger `player.victory-points.changed`, conditions `event_player_is_opponent` + `event_round_victory_points_gain_crosses(threshold=7)`, effect `return_card_by_definition` to `master.ciel.skill.s3`.

Locked Reference corroborates only static metadata and the same printed text: master skill / passive, cost `0`, base power `0`, no attributes, no requirement. Reference runtime routing is not authorization.

Already accepted prerequisites:

- FB2-31: exact event-player controller/opponent relation;
- FB2-30 accepted Candidate `491adc1e965b9eb7179fa7bced64371ae27542c1`: exact controller-owned master-skill `return_card_by_definition` component, face-up/inactive in skill zone, including create-if-missing semantics when the target definition is available;
- generic automatic-trigger execution, stable server event ids, processed-event idempotence, and round transition infrastructure.

FB2-30 explicitly did **not** authorize `player.victory-points.changed`, cumulative VP thresholds, or opponent threshold routing. That parent seam remains independent and is the only capability released by FB2-51.

## Exact FB2-51 capability contract

Implement one bounded identity-free whole-ability/condition envelope for the Ciel-S1b-shaped parent route.

The accepted semantic must be limited to:

1. automatic/forced passive trigger on authoritative `player.victory-points.changed` only;
2. event carries a stable server-generated id, exact affected `playerId`, `resource='victory_points'`, safe-integer `delta`, and exact `before` / `after` values consistent with the authoritative state transition;
3. `event_player_is_opponent` remains the accepted FB2-31 relation and excludes the ability controller;
4. condition `event_round_victory_points_gain_crosses` admits literal threshold `7` only for this bounded family;
5. maintain a server-owned round-scoped positive-gain ledger by affected player. Only actual positive VP delta contributes; VP loss, zero change, controller gain, malformed/unattributable events, or another round do not contribute;
6. fire exactly when that affected opponent's cumulative positive VP gain changes from `<7` to `>=7` in the current round. Direct `+7` and split gains such as `3 + 4` qualify; a later positive gain after crossing does not fire again;
7. reset the threshold ledger exactly on authoritative round advance;
8. the accepted parent route may execute only the already accepted exact FB2-30 `return_card_by_definition` component; no unrelated effects, targets, costs, creates, modifiers, response windows, or lifecycle behavior are admitted;
9. repeated/duplicate root event ids remain idempotent and cannot double-count or re-trigger;
10. malformed, forged, contradictory, stale-round, missing-player, non-VP, non-safe-integer, or state-inconsistent event provenance must fail closed before ledger/effect mutation.

The implementation may add a narrow server-owned runtime ledger and a dedicated identity-free classifier/helper. It must not expose a generic resource-threshold engine.

## Forbidden widening

FB2-51 must not:

- author `master.ciel.skill.s1b` or `master.ciel.skill.s3`;
- branch on Ciel, S1b, S3, card names, printed Chinese text, clause hashes, or owner identity in production runtime;
- expose arbitrary resource thresholds, arbitrary threshold literals, arbitrary cumulative metrics, generic event counters, or client-authored VP-change events;
- infer gain by scanning current VP without exact event provenance;
- count losses toward gain or allow a post-threshold event to retrigger;
- broaden FB2-30 definition-return semantics;
- modify product packs/generated product/client production/full-roster KPI definitions;
- merge or retarget any stacked PR;
- claim migration credit.

## Authorized B2 scope

B2 may touch only the minimum rules-engine/compiler/runtime surface required for this exact identity-free parent route, focused FB2-51 tests, and one B2 result report. Expected scope may include:

- one dedicated helper/classifier module for the exact whole-ability / threshold condition;
- `packages/rules/src/ability/types.ts` only if a narrow round-scoped VP-gain ledger field is required;
- `packages/rules/src/ability/loader.ts` only to reserve/admit/reject the exact vocabulary/envelope;
- `packages/rules/src/ability/interpreter.ts` only for authoritative event validation, round ledger maintenance, trigger gating, and exact execution integration;
- `packages/rules/src/index.ts` only for focused test exports;
- `packages/rules/tests/fb2-51-opponent-round-vp-gain-threshold.test.ts`;
- `docs/reports/2026-09-22-p3-b2-fb2-51-opponent-round-vp-gain-threshold-result.md`.

Do not widen scope unless an exact compile/runtime blocker is mechanically demonstrated.

## Required focused evidence

At minimum prove:

- raw + compiled exact whole-ability admission and malformed/near-match rejection;
- direct opponent `+7` crosses once;
- split opponent gains `3 + 4` cross exactly on the second event;
- `+6` does not cross;
- additional gain after crossing does not retrigger;
- controller gain, zero delta, VP loss, non-VP event, unknown player, mismatched `before/after/delta`, and stale/malformed provenance reject or do not qualify without state corruption as appropriate;
- round advance resets the positive-gain ledger and permits a fresh crossing in the next round;
- duplicate event id is idempotent and does not double-count;
- exact FB2-30 effect path creates the missing target physical card when a valid target definition exists, and returns the same physical card when one exists outside the skill zone;
- duplicate target/wrong target owner/type still fail closed through FB2-30;
- FB2-30 and FB2-31 focused compatibility remains green;
- typecheck, affected focused tests, official CI/content/reference/client/coverage gates required by the current repo contract, and `git diff --check`.

## Accounting

FB2-51 is identity-free capability infrastructure and earns **zero migration credit**. During B2 implementation/review and A synchronization:

- material overlap remains **`148/944`**;
- formal migration remains **`153/944`**;
- formal remaining remains **`791`**.

After exact fresh R acceptance and A synchronization, A must freshly reconstruct the complete `master.ciel.skill.s1b`. Dispatch singleton S only if the whole card is then mechanically zero-gap, including target-definition availability and all normal master-skill registration/play-state requirements; do not assume readiness merely from this dispatch.