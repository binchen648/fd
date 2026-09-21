# P3-A R98 Nobunaga s3 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-21

## Formal baseline

- Exact R98 FB2-47 acceptance-sync Base: `2da84659aeebc0a4043076425dac187e9af019bf`
- Accepted FB2-47 runtime Candidate: `79e8c89202acef86b522aba4695d8b97961c71fd`
- Canonical FB2-47 reviewer evidence: `https://github.com/binchen648/fd/pull/411#issuecomment-5753617134`
- Formal migration accepted: `149/944`
- Formal remaining: `795`
- Branch-local frozen authoring overlap: `144/944`
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1/source-evidence lineage: `6b09b635178822aa3f1e6bd6cd1c69672b09e8de`

FB2-47 is synchronized identity-free infrastructure and earns zero migration credit. The R98 acceptance-sync differs from the exact independently accepted runtime Candidate only by Task Index / synchronization documentation, so the runtime whole-card re-overlay below uses the exact reviewed runtime semantics.

## Exact migration identity

Migrate exactly one frozen consumer:

- canonical id: `servant.nobunaga.skill.sc-nobunaga-3`
- owner: `servant.nobunaga`
- owner name: `织田信长`
- class: `Archer`
- legacy id: `sc_nobunaga_3`
- name: `尾张的大傻瓜`
- static metadata: cost `0`, basePower `7`, typeLabel `力量`, attributes `力量`, historical Reference requirement `0`; canonical final-rule skill-zone mana requirement is `8`.

Frozen full printed text SHA-256 is `25ad641852b74800c2e2f77531d24e8b254b8b68d3221653488147fb38342d3c`:

`被动：当你被【败北】时，获得3点战果。\n无前之谋-若你输掉战斗，失去2点战果。若你因此效果失去了战果，所有你战斗中的胜者获得2点战果。`

Frozen F1 clauses are:

1. `fool-defeat-reward`: `被动：当你被【败北】时，获得3点战果`, source `src/content/authoring/cards.json / skillCards[7].abilities[0].printedClause`, SHA-256 `6a43f81f9660f303c7bc3501dd12fb3d35140dab198f7d680ba213f28e7fa890`;
2. `reckless-strategy`: `无前之谋-若你输掉战斗，失去2点战果。若你因此效果失去了战果，所有你战斗中的胜者获得2点战果`, source `src/content/authoring/cards.json / skillCards[7].abilities[1].printedClause`, SHA-256 `ec51cf410c7eed80b2e6a4645a18096f294fdad6ff606f569ebfe2c380b0bd02`.

Locked Reference independently confirms exact id/name/text, owner `servant.nobunaga`, legacy id `sc_nobunaga_3`, class `Archer`, cost `0`, basePower `7`, historical requirement `0`, typeLabel `力量`, and attributes `力量`. Historical requirement `0` remains evidence metadata only; Final Rules 9.4 and current accepted standalone servant-skill precedent require `skill_zone_mana_at_least: 8`.

## Mechanical whole-card re-overlay

A reconstructed the complete card in memory against exact synchronized baseline `2da84659aeebc0a4043076425dac187e9af019bf` using only accepted F1 semantics, Final Rules 9.4 and accepted identity-free runtime vocabulary:

1. standard servant-skill action/controller-play-card envelope, `cardType: servant_skill`, exact `skill_zone_mana_at_least: 8` requirement, printed cost `0`, basePower `7`, `力量` type/attribute;
2. `fool-defeat-reward` normalized to the exact accepted FB2-47 whole-ability envelope: `forced_trigger`, `after_controller_defeated`, exactly one `event_player_is_controller` condition, no targets/cost/creates/modifiers, one fixed controller `adjust_victory_points +3`, empty lifecycle/response/limit/visibility, automatic execution;
3. `reckless-strategy` normalized to the exact accepted FB2-46 whole-ability envelope: `forced_trigger`, `after_controller_loses_battle`, exactly one `event_player_is_controller` condition, no targets/cost/creates/modifiers, one `battle_loss_vp_then_reward_winners` effect with `lossAmount=2` and `winnerRewardAmount=2`, empty lifecycle/response/limit/visibility, automatic execution;
4. FB2-47 server ordering is part of the whole-card contract: actual defeated fact settles before the same controller's battle-loss trigger, so starting from `0 VP` resolves `+3`, then `-2`, then pays `+2` to each winner because actual loss was positive;
5. no identity-specific runtime routing, no generic `player.defeated` authoring, no runtime Chinese parsing and no new trigger/effect family.

A temporary read-only four-test whole-card probe was run and removed afterward. It returned:

- loader `report=[]`, card mode automatic, both compiled exact classifiers accepted;
- exact frozen full-text and both clause SHA-256 values matched;
- Final Rules 9.4 boundary: skill-zone play at `7` mana was rejected, at `8` mana succeeded, printed cost `0` charged no mana, and the source became active in attack area;
- synthetic authoritative p1-loss/p2-win root with p1 starting at `0 VP` and p2 at `1 VP` settled final VP `p1=1`, `p2=3`, with runtime evidence ordered `fool-defeat-reward +3` -> `reckless-strategy -2` -> winner `+2`;
- an authoritative root with no actual loser paid neither clause;
- exact root replay was idempotent.

No additional B2 capability is required. `servant.nobunaga.skill.sc-nobunaga-3` is mechanically `S_READY_NOW` on this exact synchronized baseline.

## Frozen accounting contract

A mechanically enumerated all top-level `data/authoring/**/cards[]` ids against the authoritative frozen inventory:

- frozen denominator: `943 static + 1 dynamic = 944`, all unique;
- current authoring unique ids: `167`;
- Base frozen overlap: exactly `144/944`;
- duplicate frozen authoring ids: `0`;
- target currently present: `false`;
- adding only `servant.nobunaga.skill.sc-nobunaga-3` yields exactly `145/944`;
- simulated frozen removals: `0`;
- product/generated search contains no Nobunaga s3 registration.

The S Candidate must therefore be exactly **`145/944`**, exact +1 Nobunaga s3, zero removals, zero duplicate frozen ids, and no second frozen identity. This branch-local material overlap is evidence only and is not formal migration credit.

A also searched current migration/coverage tests for a stale absolute `144/944` or exact `144` frozen-overlap assertion. None exists, so no historical compatibility edit is authorized or required for this dispatch.

## S scope

Fresh S is authorized only to:

1. create `data/authoring/servants/servant.nobunaga.json` containing exactly one frozen card, `servant.nobunaga.skill.sc-nobunaga-3`; no Nobunaga s1/s2 or any other frozen identity may be added;
2. encode the complete card only through the accepted normalization above, preserving exact F1 and Locked Reference evidence, including `aliases/legacyId: sc_nobunaga_3`, Archer owner metadata, exact printed text/hashes, exact cost/power/type/attribute, canonical `skill_zone_mana_at_least: 8`, exact FB2-47 defeat reward and exact FB2-46 battle-loss/winner transaction;
3. add focused `packages/rules/tests/nobunaga-s3-consumer-migration.test.ts` coverage proving exact F1/static metadata, loader `report=[]`, both exact classifiers, Final Rules 9.4 7/8-mana boundary and zero printed cost, real/authoritative defeat-before-loss ordering, no false payout for non-loss/suppression, forged contradictory provenance fail-closed, replay idempotence, product/generated non-registration, and exact frozen accounting;
4. add `docs/reports/2026-09-21-p3-s-r98-nobunaga-s3-consumer-migration-result.md`.

Forbidden:

- any production runtime source edit;
- any second Nobunaga or other frozen identity;
- any Nobunaga/name/skill-id runtime routing;
- any generic `player.defeated`, arbitrary event-name authoring, generic defeat subsystem, generic VP transaction or event-winner selector;
- any widening of FB2-46/FB2-47 provenance, ordering or settlement semantics;
- product pack/generated registration;
- merge or retarget;
- formal migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

## Required gates

S must prove, at minimum:

- Base `144/944` -> Candidate exactly `145/944`, exact +1 Nobunaga s3, zero removals, zero duplicates;
- production runtime/product/generated diff empty;
- `npm run typecheck`;
- focused Nobunaga s3 + FB2-47 + FB2-46 + relevant battle-loss/Presence suppression compatibility coverage;
- official `npm run test:ci -- --maxWorkers=2`;
- `npm run content:validate`;
- `npm run verify:generated-content`;
- exact Locked Reference verification;
- client production build;
- `npm run phase3:coverage` with generated artifact restored if it is validation output;
- `git diff --check`, identity/scope audit, and final clean worktree after commit.

Formal project migration remains **`149/944`**, with **`795`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

Task-local S requirement for this dispatched task only: **S 完成 recertification 并提交 Exact Base/Candidate**。This was not a standing S rule and must not be inherited by later S tasks unless their own current formal task explicitly requires it.
