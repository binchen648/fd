# P3-A R77 Helena Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Baseline

- Exact formal migration synchronization Base: `c0f864e5bbd6a1077d4641a78c5783832eded9c2`
- Accepted FB2-36 runtime Candidate: `22731b5be697825bd6bfbc09faea3c333eb629b6`
- Canonical FB2-36 R evidence: `https://github.com/binchen648/fd/pull/382#issuecomment-5745209825`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Project formal migration accepted: `138/944`
- Project formal remaining: `806`
- This lineage authoring-material frozen overlap: `134/944`, duplicates `0`

This dispatch grants no migration credit. If the exact one-card S Candidate is independently accepted as `MIGRATION_ACCEPTED` and A-synchronized, project formal migration accounting becomes `139/944`; S must not pre-credit it.

PR #381 / Ibaraki remains pending independent migration review on a parallel lineage and is intentionally not part of this exact Base.

## Exact migration scope

Dispatch exactly one frozen identity to fresh S:

- `servant.helena.skill.sc-helena-3`

Frozen inventory classification:

- `classification: CONTRACT_MAPPED`
- `mappingStatus: CONTRACT_MAPPED`
- `classificationRoute: READY_GENERIC_EXTENSION`
- `blockedBy: []`

F1 source-grounded evidence:

- source ability: `mana-synchronization`
- source document: `src/content/authoring/cards.json`
- source locator: `skillCards[13].abilities[0].printedClause`
- clause SHA-256: `827a73ca8ea48bda73c2a252c0cda060db3cbb22b9c34cdc529723085e3f5497`
- full printed-text SHA-256: `ff3ff32a20b02a8a8504bcf2ddb2f3062c8a4ca091d6360f9897c60187bfc7a5`
- canonical clause: `魔力同调-行动阶段：与你位于同一地点的对手技能区内的暗置技能无法被使用`

Semantic axes are exactly:

- timing: `ACTION`
- condition: `SOURCE_ACTIVE`
- lifecycle: `duration:this_round`
- modifier: `rule:skill_use:forbid`
- visibility: `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared`
- no trigger/cost/target/effect/interaction/binding/battle axes

Reference handler identity is evidence only and must never become runtime routing.

## Static metadata

Locked Reference / legacy metadata supplies static facts only:

- owner: `servant.helena`
- owner name: `海伦娜·布拉瓦茨基`
- servant class: `Caster`
- legacy ID: `sc_helena_3`
- card name: `金星神·火炎天主`
- typeLabel: `魔术/宝具`
- attributes: exactly `魔术`, `宝具`
- cost: `3`
- basePower: `7`
- requirement: `8`
- full printed text: `【真名解放】\n魔力同调-行动阶段：与你位于同一地点的对手技能区内的暗置技能无法被使用。`

Use the accepted standalone servant-skill play envelope:

- `playTiming: { phase: "action", window: "controller_play_card_window" }`
- one `skill_zone_mana_at_least: 8` play requirement

## Accepted structural normalization

The post-FB2-36 whole-card probe already proved the normalized card loads with `report: []`, automatic mode, selector classification `same_location_opponent_facedown_skill`, and action-phase activation.

The migrated card must preserve exactly one semantic ability:

- id: `mana-synchronization`
- kind: `phase_action`
- printedClause: exact F1 source-grounded clause
- activation: exactly `{ phase: "action", opens: "controller_action_window", requiresSourceState: "active" }`
- conditions: exactly one `{ type: "source_active" }`
- targets/effects/cost/creates: empty
- exactly one rule modifier:
  - operation: `forbid`
  - rule: `skill_use`
  - scope subject: `opponents_at_source_location`
  - scope skillCard zones: exactly `master-skills`, `servant-skills`
  - scope skillCard face: exactly `down`
  - modifier lifecycle: exactly `{ duration: "this_round" }`
- ability lifecycle: exactly `{ duration: "this_round" }`
- visibility: exactly `{ revealsTrueName: true, revealTiming: "on_use_declared", revealScope: "servant_package" }`
- responseWindow/limit: empty
- execution: automatic

Do not preserve the raw Reference-only ability `name` field. Do not add any identity-specific runtime route.

## Authoring / product isolation

Expected minimal migration material:

- create new standalone archive `data/authoring/servants/servant.helena.json` containing exactly this one frozen card;
- add one focused migration test, preferably `packages/rules/tests/helena-consumer-migration.test.ts`;
- add one S result report.

Do not modify `packages/rules/src/**`, any existing servant archive, pack/generated product, `data/phase3/**`, apps, taxonomy/KPI, or any second consumer identity. Do not merge or retarget any PR.

## Required S evidence

Fresh S must prove at minimum:

- exact one F1 identity added and no second frozen identity;
- new archive contains exactly one card and no pre-existing Helena archive was overwritten;
- exact clause/full-text hashes above and exact static metadata;
- whole archive loads with zero authoring issues and automatic mode;
- FB2-36 classifier returns `same_location_opponent_facedown_skill`;
- action activation installs the `this_round` rule through accepted ongoing lifecycle;
- same-location opponent face-down master/servant skill-zone cards are forbidden while the rule is live;
- controller cards, face-up cards, non-skill cards, different-location cards, and cards outside skill zone are not matched;
- source invalidation and round expiry stop enforcement through accepted lifecycle behavior;
- ordinary and trusted effect play eligibility converge on the same accepted runtime path;
- zero production runtime diff and zero consumer identity/name/text/hash/Reference-handler routing;
- no pack/generated drift;
- lineage frozen overlap expected `134/944 -> 135/944`, exactly one addition, zero removals, zero duplicates;
- project formal accounting stays `138/944` until fresh R returns `MIGRATION_ACCEPTED` and A synchronizes it;
- typecheck, focused, rules regression, official CI, content validation, determinism, Locked Reference verify, client build, diff-check, final cleanliness.

Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
