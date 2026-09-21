# P3-A R92 Leonidas s1 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Formal baseline

- Exact R92 FB2-44 acceptance-sync Base: `978e2e70588bf6f002c42b3a6b3d47cc7919eb91`
- Accepted FB2-44 runtime Candidate: `fe0d89be242b46ee0834544573bede6f3c73be5d`
- Canonical FB2-44 reviewer evidence: `https://github.com/binchen648/fd/pull/401#issuecomment-5749622195`
- Formal migration accepted: `146/944`
- Formal remaining: `798`
- Branch-local frozen overlap: `141/944`
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence lineage: `59f145434695d29bdd17e4cb3adc887e84182377`

FB2-44 is synchronized identity-free infrastructure and earns zero migration credit. The R92 acceptance-sync differs from the exact accepted runtime Candidate only by task-index / synchronization documentation, so the runtime re-overlay below is against the exact reviewed runtime bytes.

## Exact migration identity

Migrate exactly one frozen consumer:

- canonical id: `servant.leonidas.skill.sc-leonidas-1`
- owner: `servant.leonidas`
- owner name: `列奥尼达一世`
- class: `Lancer`
- legacy id: `sc_leonidas_1`
- name: `炎门守护者`
- static metadata: cost `3`, basePower `1`, typeLabel `特殊/宝具`, attributes `特殊`,`宝具`, legacy/final skill-zone requirement `8`.

Frozen full printed text SHA-256 is `0d2672d5170981de388f5f5d9f44ed5bff196c8c84c588f0f52becb64276a2d4`:

`【真名解放】\n残留：当你移动时关闭此牌。你所在战场的所有玩家每回合只可打出1张正面牌。`

Frozen clause evidence:

1. `src/content/authoring/cards.json / skillCards[3].abilities[0].printedClause` — SHA-256 `6eb9eb37e4bd20374395ec9cb2023eb3e1df8177f7628feabd880044fde53c5d` — source ability `thermopylae-close-on-move` — `【真名解放】\n残留：当你移动时关闭此牌。`;
2. `src/content/authoring/cards.json / skillCards[3].abilities[1].printedClause` — SHA-256 `44a5359096c7cd6908fb65eda8cf4e229f054a29a00e52e31bdda619b8bdd61f` — source ability `thermopylae-face-up-limit` — `你所在战场的所有玩家每回合只可打出1张正面牌。`.

Locked Reference provides stable static metadata and legacy identity only; Reference handler identity is evidence and must not be used for production routing.

## Mechanical whole-card re-overlay

A reconstructed the complete card in memory against the exact accepted FB2-44 runtime. The normalized consumer uses only already accepted generic vocabulary:

1. standard servant-skill action card-play envelope with exact `skill_zone_mana_at_least: 8` requirement, cost `3`, basePower `1`, `特殊/宝具` metadata;
2. the established structural true-name declaration envelope: a `declaration_reveal` / `on_use_declared` ability with marker `真名解放` and `reveal_information(servant_package)`;
3. source-grounded residual move-close semantics normalized onto the authoritative `after_controller_enters_location` producer, gated by exact `source_active` and type-only `event_player_is_controller`, with existing `close_source_card` and `while_active` lifecycle;
4. exact accepted FB2-44 static residual envelope: one `card_play_rule_override / set / face_up_cards_per_round / players_at_source_battlefield / value=1`, modifier + parent lifecycle `while_active`, card-text/specific priority, `host_required`, automatic execution;
5. no identity-specific runtime routing, no runtime Chinese parsing, and no new selector/trigger/condition/effect/lifecycle vocabulary.

The read-only whole-card probe returned:

- loader `report=[]`;
- card `mode=automatic`;
- all three normalized abilities `execution.mode=automatic`;
- structural true-name release classifier `true`;
- exact static FB2-44 ability classifier `true`;
- playing Leonidas s1 from skill zone at 20 mana succeeds, pays exactly 3 mana, lands active in the authoritative attack area, reveals the controller servant package, and records itself as the controller's first completed face-up card of the round;
- controller and same-battlefield opponent each have independent one-face-up allowances; second face-up plays reject with `face_up_card_play_limit_reached`;
- face-down play does not increment the face-up counter;
- a player at another location is unaffected;
- a real opponent `move_player` producer does not close Leonidas;
- a real controller `move_player` producer emits the authoritative movement event, triggers the residual, closes Leonidas to skill zone, marks it inactive, and immediately removes the live face-up cap;
- inactive source supplies no cap.

No additional B2 capability is required. `servant.leonidas.skill.sc-leonidas-1` is mechanically `S_READY_NOW`.

## Frozen accounting contract

A mechanically enumerated top-level authoring `cards[]` ids against the frozen inventory:

- frozen denominator: `944` unique canonical identities;
- current authoring unique ids: `164`;
- Base frozen overlap: exactly `141/944`;
- duplicate authoring ids: `0`;
- target currently present: `false`;
- adding only `servant.leonidas.skill.sc-leonidas-1` yields exactly `142/944`;
- simulated removals: `0`.

The S Candidate must therefore be exactly **`142/944`**, exact +1 Leonidas s1, zero removals, zero duplicate frozen ids, and no second frozen identity. This branch-local material overlap is not formal migration credit.

## S scope

Fresh S is authorized only to:

1. add `data/authoring/servants/servant.leonidas.json` containing exactly one frozen card, `servant.leonidas.skill.sc-leonidas-1`;
2. encode the whole card only through the accepted normalization above, preserving frozen F1 and Locked Reference evidence;
3. add focused `packages/rules/tests/leonidas-s1-consumer-migration.test.ts` coverage proving exact printed text/hash/static metadata, loader `report=[]`, all-automatic execution, structural true-name release, real controller movement close and opponent negative, exact FB2-44 same-battlefield cap / face-down / outside-location behavior, product/generated non-registration, and exact frozen accounting;
4. add `docs/reports/2026-09-20-p3-s-r92-leonidas-s1-consumer-migration-result.md`.

Forbidden:

- any production runtime source edit;
- any second Leonidas or other frozen identity;
- any Leonidas/name/skill-id runtime routing;
- any new selector, trigger, condition, effect, lifecycle, or play-limit engine;
- product pack/generated registration;
- merge or retarget;
- formal migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

## Required gates

S must prove, at minimum:

- Base `141/944` -> Candidate exactly `142/944`, exact +1 target, zero removals, zero duplicates;
- production runtime source diff empty;
- `npm run typecheck`;
- focused Leonidas s1 consumer migration + FB2-44 coverage;
- strong rules src/core/regression/focused suite;
- official `npm run test:ci -- --maxWorkers=2`;
- `npm run content:validate`;
- `npm run verify:generated-content`;
- exact Locked Reference verification;
- client production build;
- `npm run phase3:coverage` with generated artifact restored if it is only validation output;
- `git diff --check`, identity/scope audit, and final clean worktree after commit.

Formal project migration remains **`146/944`**, with **`798`** remaining until fresh independent R migration acceptance plus A synchronization.

Task-local S requirement for this dispatched task only: **S 完成 recertification 并提交 Exact Base/Candidate**。This was not a standing S rule and must not be inherited by later S tasks unless their own current formal task explicitly requires it.