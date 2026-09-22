# P3-A R95 Medusa s2 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-21

## Formal baseline

- Exact R95 FB2-45 acceptance-sync Base: `02d7a696658b639cdd7bfecc3e377dc4abebdbf0`
- Accepted FB2-45 runtime Candidate: `17685e678e758cb38032732bf15d47b07592d81e`
- Canonical FB2-45 reviewer evidence: `https://github.com/binchen648/fd/pull/408#issuecomment-5752550000`
- Formal migration accepted: `148/944`
- Formal remaining: `796`
- Branch-local frozen authoring overlap: `143/944`
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence lineage: `59f145434695d29bdd17e4cb3adc887e84182377`

FB2-45 is synchronized identity-free infrastructure and earns zero migration credit. The R95 acceptance-sync differs from the exact independently accepted runtime Candidate only by Task Index / synchronization documentation, so the runtime whole-card re-overlay below uses the exact reviewed runtime semantics.

## Exact migration identity

Migrate exactly one frozen consumer:

- canonical id: `servant.medusa.skill.sc-medusa-2`
- owner: `servant.medusa`
- owner name: `美杜莎`
- class: `Rider`
- legacy id: `sc_medusa_2`
- name: `石化之魔眼`
- static metadata: cost `4`, basePower `1`, typeLabel `魔术`, attributes `魔术`, legacy/final skill-zone mana requirement `4`.

Frozen full printed text and sole clause SHA-256 are both `fe34566fb9dbea83e43f7f97dc56a97f5176e07e8a124ee1816aa5645bf770ff`:

`【真名解放】\n行动阶段：在战斗阶段开始前，若与你进行战斗的对手本回合没有打出/加入迅捷属性攻击，则其【败北】。`

Frozen F1 clause evidence is `src/content/authoring/cards.json / skillCards[35].abilities[0].printedClause`, source ability `mystic-eyes-petrification`, SHA-256 `fe34566fb9dbea83e43f7f97dc56a97f5176e07e8a124ee1816aa5645bf770ff`.

Locked Reference independently confirms exact id/name/text, owner `servant.medusa`, legacy id `sc_medusa_2`, class `Rider`, cost `4`, basePower `1`, requirement `4`, typeLabel `魔术`, and attributes `魔术`. Reference handler identity is evidence only and must not be used for production routing.

## Mechanical whole-card re-overlay

A reconstructed the complete card in memory against exact synchronized baseline `02d7a696658b639cdd7bfecc3e377dc4abebdbf0` using only frozen F1 semantics and accepted identity-free vocabulary:

1. standard servant-skill card-play envelope, `cardType: servant_skill`, action/controller-play-card window, exact `skill_zone_mana_at_least: 4` requirement, cost `4`, basePower `1`, `魔术` type/attribute;
2. one `phase_action` ability `mystic-eyes-petrification` with activation exactly action/controller-action-window and exactly one `source_active` condition;
3. structural true-name release on ability declaration through exact visibility `{ revealsTrueName: true, revealTiming: "on_use_declared", revealScope: "servant_package" }`;
4. exact accepted FB2-45 effect: one `defeat_player` targeting `engaged_opponents` whose sole predicate is `no_attack_played_this_round_with_attribute("迅捷")`;
5. empty targets/cost/creates/ruleModifiers/lifecycle/responseWindow/limit authoring payloads, automatic execution, no identity-specific runtime routing and no runtime Chinese parsing.

A temporary read-only five-test whole-card probe was run and removed afterward. It returned:

- loader `report=[]`;
- card `mode=automatic`, sole ability `execution.mode=automatic`;
- `isAcceptedPreBattleDefeatAbility(..., "compiled") === true`;
- structural true-name release classifier `true`;
- exact frozen printed-text SHA-256 matched `fe34566...`;
- real card play from skill zone at 20 mana succeeds, pays exactly `4`, lands active in attack area and records current `playedRound`;
- true name remains hidden immediately after card placement and is revealed exactly when the phase-action ability is declared/activated, matching `on_use_declared`;
- with an engaged opponent who has no qualifying current-round `迅捷` attack, activation stages exactly that opponent, authoritative battle settlement excludes the stronger targeted opponent from winning, and consumes the intent;
- a real ordinary current-round `迅捷` attack play writes authoritative `playedRound` and protects the opponent;
- a current-round non-`迅捷` attack plus a previous-round `迅捷` attack does not protect;
- the accepted real Maiya add-to-attack gateway moves `master.maiya.deck.support-shot` to the recipient attack area, changes controller provenance, writes current `playedRound`, and protects that engaged opponent because it is authoritatively classified as a `迅捷` attack;
- a face-down current-round `迅捷` attack still protects server-side without requiring public definition visibility;
- existing Basic Luck battle-loss immunity causes the pre-battle defeat to be ignored while consuming the matching intent;
- repeated exact activation is idempotent, and round advance clears an unmatched stale intent;
- player at another battlefield is not targeted by the exact same-battlefield/engagement derivation inherited from FB2-45.

No additional B2 capability is required. `servant.medusa.skill.sc-medusa-2` is mechanically `S_READY_NOW` on this exact synchronized baseline.

## Frozen accounting contract

A mechanically enumerated all top-level `data/authoring/**/cards[]` ids against the authoritative frozen inventory:

- frozen denominator: `943 static + 1 dynamic = 944`, all unique;
- current authoring unique ids: `166`;
- Base frozen overlap: exactly `143/944`;
- duplicate frozen authoring ids: `0`;
- target currently present: `false`;
- adding only `servant.medusa.skill.sc-medusa-2` yields exactly `144/944`;
- simulated frozen removals: `0`;
- product pack and generated content currently contain no Medusa s2 registration.

The S Candidate must therefore be exactly **`144/944`**, exact +1 Medusa s2, zero removals, zero duplicate frozen ids, and no second frozen identity. This branch-local material overlap is evidence only and is not formal migration credit.

A also searched existing consumer-migration tests for a stale absolute `143` repository-overlap snapshot. None exists, so no historical compatibility edit is authorized or required for this dispatch.

## S scope

Fresh S is authorized only to:

1. modify the existing `data/authoring/servants/servant.medusa.json` archive, preserving its existing `servant.medusa.skill.sc-medusa-1` card unchanged and appending exactly one new frozen card, `servant.medusa.skill.sc-medusa-2`; the Candidate still adds exactly one frozen identity;
2. encode the complete card only through the accepted normalization above, preserving exact F1 and Locked Reference evidence, including `aliases/legacyId: sc_medusa_2`, Rider owner metadata, exact cost/power/type/attribute/requirement, exact printed text/hash, exact phase-action/source-active/true-name visibility envelope, and exact FB2-45 defeat predicate;
3. add focused `packages/rules/tests/medusa-s2-consumer-migration.test.ts` coverage proving exact printed text/hash/static metadata, loader `report=[]`, all-automatic execution, accepted FB2-45 classifier, structural/on-declaration true-name reveal, real play cost/activation, ordinary and face-down current-round `迅捷` protection, non-`迅捷` and stale-round negatives, accepted Maiya add-to-attack provenance, defeat settlement/consumption, Luck immunity, idempotence/round cleanup, product/generated non-registration, and exact frozen accounting;
4. add `docs/reports/2026-09-21-p3-s-r95-medusa-s2-consumer-migration-result.md`.

Forbidden:

- any production runtime source edit;
- any second Medusa or other frozen identity;
- any Medusa/name/skill-id runtime routing;
- any widening of arbitrary `defeat_player` scopes/predicates or Presence Concealment semantics;
- any new selector, trigger, condition, effect, lifecycle, visibility, attack-history or settlement engine;
- product pack/generated registration;
- merge or retarget;
- formal migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

## Required gates

S must prove, at minimum:

- Base `143/944` -> Candidate exactly `144/944`, exact +1 Medusa s2, zero removals, zero duplicates;
- production runtime/product/generated diff empty;
- `npm run typecheck`;
- focused Medusa s2 + FB2-45 + relevant Presence Concealment/Return Silence/battle-loss compatibility coverage;
- strong rules src/core/regression/focused suite;
- official `npm run test:ci -- --maxWorkers=2`;
- `npm run content:validate`;
- `npm run verify:generated-content`;
- exact Locked Reference verification;
- client production build;
- `npm run phase3:coverage` with generated artifact restored if it is validation output;
- `git diff --check`, identity/scope audit, and final clean worktree after commit.

Formal project migration remains **`148/944`**, with **`796`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**。
