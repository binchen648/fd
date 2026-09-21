# P3-A R100 Spartacus s2 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-21

## Formal baseline

- Exact R100 FB2-48 acceptance-sync Base: `ff6aeba3cafa63e1be9002c549a94be9d54da2d5`
- Accepted FB2-48 runtime Candidate: `14c8688c201d4d39a85843470be6b79eec01853d`
- Canonical FB2-48 reviewer evidence: `https://github.com/binchen648/fd/pull/413#issuecomment-5754051359`
- Formal migration accepted: `150/944`
- Formal remaining: `794`
- Branch-local frozen authoring overlap: `145/944`
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1/source-evidence lineage: S `80aaa029ff20448b92afc4fd115080cd3f34a60c` -> A `4961de83468716cc748f16faf9f03212c47a8713` -> accepted R `9d92b036332fc22df07ccb8f26af0bc69c066b34`.

FB2-48 is synchronized identity-free infrastructure and earns zero migration credit. The current exact synchronized runtime is the only baseline for this dispatch.

## Exact migration identity

Migrate exactly one frozen consumer:

- canonical id: `servant.spartacus.skill.sc-spartacus-2`
- owner: `servant.spartacus`
- owner name: `斯巴达克斯`
- class: `Berserker`
- legacy id: `sc_spartacus_2`
- name: `伤兽的咆哮`
- static metadata: typeLabel/attribute `宝具`, cost `3`, basePower `4`, skill-zone mana requirement `8`.

Frozen printed text and sole F1 clause are identical:

`受虐之荣光-战斗阶段：战斗后获得X点战果，X为与你交战的任意一名对手的合计威力的五分之一（向下取整）。`

- source ability id: `wounded-beast-roar-reward`
- source: `src/content/authoring/cards.json / skillCards[24].abilities[0].printedClause`
- SHA-256: `cc5be3d123f96a8199e6c07bdae9161b93829c7b52cab2e838cb2a19b592996e`.

Locked Reference independently confirms exact id/name/text, owner, legacy id, class Berserker, type/attribute `宝具`, cost `3`, basePower `4`, and requirement `8`.

## Mechanical whole-card re-overlay

A freshly reconstructed the complete card against exact synchronized baseline `ff6aeba3cafa63e1be9002c549a94be9d54da2d5`, using the accepted F1 semantics, locked static metadata, the established servant-skill card-play envelope, and accepted FB2-48 vocabulary only:

1. `cardType: servant_skill`, action / `controller_play_card_window`, exact `skill_zone_mana_at_least: 8`, printed cost `3`, basePower `4`, type/attribute `宝具`;
2. sole ability remains `kind: residual` with exact id `wounded-beast-roar-reward`;
3. activation is exactly `after_battle_result_determined` plus `requiresSourceState: active`;
4. exact ordered conditions are `source_active` then `event_location_equals_controller`;
5. targets/cost/creates/ruleModifiers are empty; the sole effect is exact accepted FB2-48 compound token `combat_opponent_power_vp_reward`;
6. lifecycle is exactly `{ duration: "while_active" }`; responseWindow/limit/visibility are empty; execution is automatic;
7. runtime uses only the trusted frozen battle-result root: exactly one opponent from that root is chosen privately/non-cancellably and controller gains exactly `floor(frozenSelectedOpponentPower / 5)` VP; no generic selector, selected-player metric or formula execution is authored.

A temporary four-test whole-card probe was run and deleted. It proved:

- exact F1 hash/static metadata, loader `report=[]`, automatic card mode and compiled FB2-48 classifier acceptance;
- 7 mana rejects skill-zone play; 8 mana accepts and charges exact printed cost 3 (8 -> 5), moves the card to attack area and marks it active/face-up for the current round;
- an active played source at the controller battlefield stages exact owner-only non-cancellable one-opponent choice; selecting frozen opponent power 14 grants exactly +2 VP and exact root replay is idempotent;
- inactive source and controller/root-battlefield mismatch do not trigger.

No additional B2 capability is required. `servant.spartacus.skill.sc-spartacus-2` is mechanically `S_READY_NOW` on this exact baseline.

## Frozen accounting contract

Mechanical Base enumeration of top-level `data/authoring/**/cards[]` against the authoritative frozen inventory gives:

- frozen denominator: `943 static + 1 dynamic = 944`;
- current authoring unique ids: `168`;
- Base frozen overlap: exactly `145/944`;
- duplicate frozen ids: `0`;
- target current count: `0`;
- adding only Spartacus s2 yields exactly `146/944`;
- zero frozen removals and zero duplicate frozen ids;
- target is absent from `data/packs/fd-playtest-v1/pack.json` and `data/generated/fd-playtest-v1.content-library.json`.

The S Candidate must therefore be exactly **`146/944`**, exact +1 Spartacus s2, zero frozen removals, zero duplicate frozen ids, and no second frozen identity. Material overlap is evidence only and is not formal migration credit.

## Historical-test compatibility authorization

A mechanically found one stale historical repository-wide snapshot in `packages/rules/tests/nobunaga-s3-consumer-migration.test.ts`: `expect(overlap).toHaveLength(145)`.

That assertion was correct for the historical Nobunaga Candidate but is not a stable invariant for later accepted migrations. The authorized Spartacus exact +1 necessarily makes repository overlap `146/944`; leaving the old absolute count unchanged makes required full CI mathematically incompatible with the authorized migration.

S is therefore additionally authorized to modify **only** that Nobunaga test's accounting block, and only to remove the historical absolute repository-wide overlap count while preserving stable Nobunaga invariants:

- frozen denominator remains `944`;
- duplicate frozen authoring ids remain `[]`;
- `servant.nobunaga.skill.sc-nobunaga-3` remains authored exactly once.

No Nobunaga production data, semantics, runtime behavior or other Nobunaga test assertion may change. The new Spartacus focused test is responsible for proving the current exact `145/944 -> 146/944` accounting.

## S scope

Fresh S is authorized only to:

1. create `data/authoring/servants/servant.spartacus.json` containing exactly one frozen card, `servant.spartacus.skill.sc-spartacus-2`; do not add Spartacus s1/s3 or any other frozen identity;
2. encode the complete card only through the exact normalization above, preserving F1/source lineage and locked static metadata;
3. add `packages/rules/tests/spartacus-s2-consumer-migration.test.ts` proving exact F1/static metadata, loader/classifier, real 7/8 mana play boundary and cost 3, active-source lifecycle, authoritative frozen opponent choice/reward, negative provenance/source/location cases, idempotence, product/generated non-registration, and exact frozen accounting `146/944`;
4. apply only the compatibility edit above to `packages/rules/tests/nobunaga-s3-consumer-migration.test.ts`;
5. add `docs/reports/2026-09-21-p3-s-r100-spartacus-s2-consumer-migration-result.md`.

Forbidden:

- any production runtime source edit;
- any second frozen identity;
- identity/name/Chinese runtime routing;
- generic `choose_players`, generic `event_combat_opponents`, generic selected-player power metrics, generic `floor_divide`, or generic formula/selector widening;
- product pack/generated registration;
- any Nobunaga semantic or production change;
- merge or retarget;
- formal migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes it.

## Required gates

S must prove, at minimum:

- Base `145/944` -> Candidate exactly `146/944`, exact +1 Spartacus s2, zero removals, zero duplicates;
- production runtime/product/generated diff empty;
- typecheck;
- focused Spartacus s2 + FB2-48 + Nobunaga compatibility and relevant battle/interaction suites;
- official `npm run test:ci -- --maxWorkers=2`;
- content validation;
- generated-content determinism;
- exact Locked Reference verification;
- client build;
- Phase 3 coverage with generated artifact restored if changed;
- `git diff --check`, exact identity/scope audit and final clean worktree after commit.

Formal project migration remains **`150/944`**, with **`794`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

Task-local S requirement for this dispatched task only: **S 完成 recertification 并提交 Exact Base/Candidate**。This was not a standing S rule and must not be inherited by later S tasks unless their own current formal task explicitly requires it.
