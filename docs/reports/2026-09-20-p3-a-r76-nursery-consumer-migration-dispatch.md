# P3-A R76 Nursery Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Baseline

- Exact accepted-capability synchronization Base: `7bec7b8bf24150602f3c0b04edf53130de19c72e`
- Accepted FB2-36 runtime Candidate: `22731b5be697825bd6bfbc09faea3c333eb629b6`
- Canonical FB2-36 R evidence: `https://github.com/binchen648/fd/pull/382#issuecomment-5745209825`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Project formal migration accepted: `137/944`
- Project formal remaining: `807`
- This lineage authoring-material frozen overlap: `133/944`, duplicates `0`

This dispatch grants no migration credit. If the exact one-card S Candidate is independently accepted as `MIGRATION_ACCEPTED` and A-synchronized, project formal migration accounting becomes `138/944`; S must not pre-credit it.

PR #381 / Ibaraki remains pending independent migration review on a parallel lineage and is intentionally not part of this exact Base.

## Exact homogeneous migration family

Dispatch exactly one frozen identity to fresh S:

- `servant.nursery.skill.sc-nursery-2`

F1 frozen inventory classification:

- `classification: CONTRACT_MAPPED`
- `mappingStatus: CONTRACT_MAPPED`
- `classificationRoute: READY_GENERIC_EXTENSION`
- `blockedBy: []`

F1 source-grounded clause:

- source ability: `memory-playground`
- source document: `src/content/authoring/cards.json`
- source locator: `skillCards[14].abilities[0].printedClause`
- SHA-256: `7858494efa94ff36bd0479163dfccaeac2c1208209cdc7ad90208d0f12a7c721`
- canonical clause: `记忆的游乐场-与你位于同一地点，不位于攻击区，且具有“【真名解放】”文字效果的牌无法被使用`

F1 semantic axes are exactly:

- condition: `SOURCE_ACTIVE`
- lifecycle: `duration:while_active`
- modifier: `rule:skill_use:forbid`
- visibility: `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared`
- no timing/trigger/cost/target/effect/interaction/binding/battle axes

F1 is authoritative for canonical identity and semantic clause. Locked Reference shared handler `core.structured-skill` is evidence only and must not become runtime routing.

## Static metadata

Locked Reference / legacy metadata supplies static card facts only:

- owner: `servant.nursery`
- owner name: `童谣`
- servant class: `Caster`
- legacy ID: `sc_nursery_2`
- card name: `无名森林`
- typeLabel: `特殊/宝具`
- attributes: exactly `特殊`, `宝具`
- cost: `3`
- basePower: `5`
- requirement: `8`
- full printed text begins with `【真名解放】` followed by the F1 source-grounded clause above

Use the accepted standalone servant-skill play envelope:

- `playTiming: { phase: "action", window: "controller_play_card_window" }`
- one `skill_zone_mana_at_least: 8` play requirement

The raw Reference object omits this current play envelope; do not invent another timing route.

## Accepted structural normalization

The post-FB2-36 whole-card probe already proved the normalized card loads with `report: []`, automatic mode, selector classification `same_location_true_name_off_attack`, and static while-active classification true.

The migrated card must preserve exactly one semantic ability:

- id: `memory-playground`
- kind: `passive`
- printedClause: exact F1 source-grounded clause
- activation: empty
- conditions: exactly one `{ type: "source_active" }`
- targets/effects/cost/creates: empty
- exactly one rule modifier:
  - operation: `forbid`
  - rule: `skill_use`
  - scope subject: `players_at_source_location`
  - scope skillCard: exactly `{ notInAttack: true, trueNameRelease: true }`
  - modifier lifecycle: exactly `{ duration: "while_active" }`
- ability lifecycle: exactly `{ duration: "while_active" }`
- visibility: exactly `{ revealsTrueName: true, revealTiming: "on_use_declared", revealScope: "servant_package" }`
- responseWindow/limit: empty
- execution: automatic

Do not add a second true-name-release ability merely by analogy to another consumer. Nursery's frozen source carries true-name visibility on `memory-playground` itself, and the accepted FB2-36 structural marker reads compiled visibility rather than printed text.

## Authoring / product isolation

Expected minimal migration material:

- create new standalone archive `data/authoring/servants/servant.nursery.json` containing exactly this one frozen card;
- add one focused migration test, preferably `packages/rules/tests/nursery-consumer-migration.test.ts`;
- add one S result report.

Do not modify:

- `packages/rules/src/**`
- any existing servant archive
- `data/packs/**`
- `data/generated/**`
- `data/phase3/**`
- `apps/**`
- taxonomy/KPI
- any other consumer identity

Do not merge or retarget any PR.

## Required S evidence

Fresh S must prove at minimum:

- exact one F1 identity added and no second frozen identity;
- the new archive contains exactly one card and no pre-existing Nursery archive was overwritten;
- exact F1 source-grounded clause hash `7858494efa94ff36bd0479163dfccaeac2c1208209cdc7ad90208d0f12a7c721`;
- exact owner/class/card-face/legacy metadata from Locked Reference;
- whole real archive loads with zero authoring issues and automatic mode;
- exact FB2-36 selector classifier returns `same_location_true_name_off_attack` and static while-active classifier returns true;
- with an active source, same-location skill cards carrying structural true-name visibility and outside `attack_area` are forbidden through authoritative play eligibility;
- same-location cards without structural true-name visibility remain playable;
- true-name skill cards already in `attack_area` are not matched by this forbid selector;
- different-location cards are not matched;
- inactive/face-down/left-active source fails closed and stops enforcing the static rule;
- ordinary and trusted effect-play eligibility continue to converge on the accepted runtime path without any consumer-specific routing;
- no identity/name/text/hash/Reference-handler branches in production runtime and zero `packages/rules/src/**` diff;
- no pack/generated product drift;
- lineage frozen authoring overlap expected `133/944 -> 134/944`, exactly one addition, zero removal, zero duplicate;
- project formal accounting stays `137/944` until fresh independent R returns `MIGRATION_ACCEPTED` and A synchronizes it;
- typecheck, focused test, rules regression, official CI, content validation, generated determinism, Locked Reference verify, client build, `git diff --check`, final cleanliness.

Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
