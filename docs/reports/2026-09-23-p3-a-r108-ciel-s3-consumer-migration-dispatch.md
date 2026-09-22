# P3-A R108 Ciel S3 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-23

## Formal baseline

- Exact R107 FB2-52 acceptance-sync Base: `27cf92467c35b1652ba490746857f0dd3de47ee2`.
- Accepted FB2-52 runtime Candidate: `59d930f9e5a0202e0d1b3d9358e0d35ca3a0d029`.
- Canonical Reviewer evidence: `https://github.com/binchen648/fd/pull/428#issuecomment-5784412049`.
- Formal migration accepted: `153/944`.
- Formal remaining: `791`.
- Branch-local frozen overlap: `148/944`.
- Frozen duplicate authoring ids: `0`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

FB2-52 is synchronized identity-free capability infrastructure and earns zero migration credit. PR #428 remains OPEN, unmerged and unretargeted.

## Exact migration identity

Migrate exactly one frozen consumer:

- canonical id: `master.ciel.skill.s3`;
- owner: `master.ciel` / 希耶尔;
- legacy id: `s3`;
- name: `第七圣典`;
- card type: `master_skill`;
- static metadata: typeLabel `力量`, attribute `力量`, cost `3`, basePower `7`;
- canonical skill-zone play threshold: `8` mana under final rules 9.4;
- initial placement: `outside_game`, because the card is materialized/returned by the accepted S1b definition-return route rather than being present initially.

Frozen printed text:

`<每局游戏限一次>\n粉碎灵魂-战斗阶段：你的交战对手若未控制【幸运】，其下回合无法从局势牌获得魔力和威力加成。`

Frozen F1 sole semantic clause:

`粉碎灵魂-战斗阶段：你的交战对手若未控制【幸运】，其下回合无法从局势牌获得魔力和威力加成。`

- source ability id: `seventh-scripture-soul-crush`;
- source locator: `src/content/authoring/cards.json / skillCards[39].abilities[0].printedClause`;
- clause SHA-256: `4e20d56d0540c3ae75b21f62b8277b79ba27aeeeeb7b503b91c384c318f3de19`;
- full printed-text SHA-256: `76813acfde86242d21158d290668d0fc575b476d7aac289ec438ae302898517b`.

Locked Reference independently confirms exact identity/name/text, owner, legacy id, cost `3`, basePower `7`, type/attribute `力量`, legacy minimum-mana metadata `3`, and the source-grounded soul-crush structure. The final-rules skill-zone threshold `8` remains authoritative over the legacy requirement metadata.

## Mechanical whole-card reconstruction

A reconstructed the complete card in memory against exact synchronized baseline `27cf92467c35b1652ba490746857f0dd3de47ee2` using only accepted generic card-play infrastructure plus FB2-52:

1. loader `report=[]` on the real `master.ciel` archive identity;
2. `initialPlacement=outside_game` is admitted by the accepted outside-game master-skill support path;
3. standard master-skill play requires `skill_zone_mana_at_least: 8`; 7 mana rejects, 8 mana accepts and charges printed cost `3` (`8 -> 5`);
4. the current explicit-v1 card classifier intentionally routes `master_skill` to active `field`; the combat resolver's authored legacy-combat-card path includes active field cards with positive basePower + attributes, so the printed 7 Power remains in authoritative battle power;
5. `<每局游戏限一次>` is represented by the existing automatic `when_play_requirements_checked` limiter with `limit={type:'per_game',uses:1,scope:'this_card'}`; after one play the same physical card cannot be played again even if later returned to skill;
6. sole semantic phase action is `seventh-scripture-soul-crush`, Combat / `controller_combat_action_window`, exact ordered conditions `source_active` then `at_battlefield`;
7. sole effect is the exact accepted FB2-52 compound `suppress_next_round_situation_benefits`, targeting same-battlefield opponents lacking an active face-up `card.cardluck` attack, with literal `roundOffset=1` and exact benefits `situation_mana_gain` + `situation_power_bonus`;
8. real dispatch activation marks only qualifying opponents for the next round; no Ciel/name/text runtime routing is involved.

The reconstruction probe proved:

- FB2-52 compiled whole-envelope classifier acceptance;
- 7/8 mana boundary and exact cost 3;
- legal play, active source, and legal combat activation;
- exact next-round marker `{p2: currentRound + 1}` for a qualifying opponent;
- second play of the same physical card is rejected by the existing per-game limiter;
- no additional runtime semantic blocker remains.

Therefore `master.ciel.skill.s3` is mechanically `S_READY_NOW` on this exact baseline.

## Frozen accounting contract

Mechanical Base enumeration of `data/authoring/**/cards[]` against the frozen inventory gives:

- frozen denominator: `943 static + 1 dynamic = 944`;
- current authoring unique ids: `171`;
- Base frozen overlap: exactly `148/944`;
- duplicate frozen ids: `0`;
- target current count: `0`.

The S Candidate must therefore be exactly `149/944`, exact +1 `master.ciel.skill.s3`, zero frozen removals, zero duplicate frozen ids, and no second frozen identity. Material overlap is evidence only and does not become formal migration credit until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes it.

## Historical-test compatibility authorization

Exactly one stale repository-wide absolute snapshot remains at this baseline:

- `packages/rules/tests/atalanta-s2-consumer-migration.test.ts` asserts `expect(overlap).toHaveLength(148)`.

The authorized Ciel s3 exact +1 necessarily makes repository overlap `149/944`. S may modify only that Atalanta accounting block, only to remove the stale absolute repository-wide overlap count while preserving these stable invariants:

- frozen denominator remains `944`;
- duplicate frozen authoring ids remain `[]`;
- `servant.atalanta.skill.sc-atalanta-2` remains authored exactly once.

No Atalanta production data, runtime behavior, semantic assertion, or other test may change.

## Historical Ciel-s2 test compatibility authorization

Focused S validation exposed one additional historical snapshot in `packages/rules/tests/regression/fb2-ciel-s2-support-definition.test.ts`: the recovery-era assertion `expect(raw.cards).toHaveLength(2)` encoded the then-current mixed rules-only archive population rather than an invariant of the accepted Ciel s2 definition. The authorized s3 append makes that archive length `3` without changing s1a or s2 semantics.

S is therefore additionally authorized to modify only that one Ciel-s2 test assertion, replacing the absolute archive-length snapshot with stable preservation checks that `master.ciel.skill.s1a` and `master.ciel.skill.s2` are each still present exactly once. No other Ciel-s2 assertion, runtime behavior, production data, or accepted semantic may change.
## S scope

Fresh S is authorized only to:

1. append exactly one new card `master.ciel.skill.s3` to the existing `data/authoring/masters/master.ciel.json`, preserving accepted s1a and s2 semantics unchanged;
2. encode static metadata, outside-game placement, canonical 8-mana skill-zone requirement, per-game play limiter, and exact FB2-52 compound ability described above;
3. add `packages/rules/tests/ciel-s3-consumer-migration.test.ts` proving exact source hashes/static metadata, loader/classifier acceptance, 7/8 mana + cost 3, authoritative 7 Power battle inclusion, qualifier/Luck behavior, exact next-round situation suppression, per-game replay rejection, rules-only registration isolation, and frozen accounting `148 -> 149`;
4. apply only the Atalanta stale-count compatibility edit above;
5. add `docs/reports/2026-09-23-p3-s-r108-ciel-s3-consumer-migration-result.md`.

Forbidden:

- any production runtime/compiler source edit;
- any second frozen identity, including `master.ciel.skill.s1b` in this S Candidate;
- Ciel/name/skill-id runtime routing or runtime Chinese parsing;
- generic flag/rule/target/round-offset widening;
- any manifest registration change or generated playable master/ordinary-card/deck/character surface change; the only authorized generated change is the deterministic rules-only archive representation of the appended s3 definition;
- merge or retarget;
- formal migration credit before fresh independent R acceptance and A synchronization.

## Required gates

S must prove at minimum:

- Base `148/944` -> Candidate exactly `149/944`, exact +1 target, zero removals, zero duplicates;
- production runtime source diff empty; manifest diff empty; generated diff restricted to the deterministic existing Ciel rules-only archive/source-map representation, with playable master/ordinary-card/deck/character surfaces unchanged;
- focused Ciel s3 + FB2-52 + Atalanta accounting compatibility;
- typecheck;
- official `npm run test:ci -- --maxWorkers=2`;
- content validation;
- generated-content determinism;
- exact Locked Reference verification;
- client build;
- Phase 3 coverage + automation audit with generated audit artifacts restored if changed;
- `git diff --check`, exact identity/scope audit and final clean worktree after commit.

Formal migration remains `153/944`, with `791` remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**。


