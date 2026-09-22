# P3-A R104 Atalanta S2 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-22

## Formal baseline

- Exact R104 FB2-50 acceptance-sync Base: `3f07c2690d5c5bf89a7086fb9b681409675b9ff7`
- Accepted FB2-50 runtime Candidate: `532fc01f924555d97c4929db6774528648daf520`
- Canonical reviewer-result relay after malformed evidenceRef repair: `https://github.com/binchen648/fd/pull/425#issuecomment-5778319463`
- Original fresh-review marker: `https://github.com/binchen648/fd/pull/425#issuecomment-5778213440`
- Formal migration accepted: `152/944`
- Formal remaining: `792`
- Branch-local frozen overlap: `147/944`
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen source-evidence lineage: S `4c67f72828125bc112b23b738948f5533eaceb8c` -> A `6826dc5b085bf8efa0a53853c0e293e939b0c137` -> R `826e6f5b6a92b927800b2b50a6b15898d70befcc`.

FB2-50 is synchronized identity-free capability infrastructure and earns zero migration credit. PR #425 remains OPEN, unmerged and unretargeted.

## Exact migration identity

Migrate exactly one frozen consumer:

- canonical id: `servant.atalanta.skill.sc-atalanta-2`
- owner: `servant.atalanta` / 阿塔兰忒
- class: `Archer`
- legacy id: `sc_atalanta_2`
- name: `诉状箭书`
- static metadata: typeLabel `迅捷/宝具`, attributes `迅捷`,`宝具`, cost `2`, basePower `4`, skill-zone mana requirement `8`.

Frozen printed text / sole F1 clause:

`【真名解放】\n唯一/行动阶段：若你拥有地利，创造并激活一张你本回合打出的其他攻击的临时复制。`

- source ability id: `appeal-letter-copy`
- source locator: `src/content/authoring/cards.json / skillCards[28].abilities[0].printedClause`
- SHA-256: `93fd375fbcb6d5841a26ebf2c1512b48d94e6b6ed963fd0fcafe7d37c58f501b`.

Locked Reference independently confirms exact id/name/text, owner, legacy id, class Archer, type/attribute `迅捷/宝具`, cost `2`, basePower `4`, and requirement `8`. Reference implementation is corroboration only and is not routing authority.

## Mechanical whole-card re-overlay

A reconstructed the complete card against exact synchronized baseline `3f07c2690d5c5bf89a7086fb9b681409675b9ff7` using only accepted generic card-play/visibility vocabulary plus exact FB2-50:

1. standard servant-skill action card-play envelope with exact `skill_zone_mana_at_least: 8`, printed cost `2`, basePower `4`, `迅捷/宝具` metadata;
2. one automatic phase-action ability `appeal-letter-copy`, Action phase / `controller_action_window`;
3. exact ordered conditions `source_active` then `controller.deployment_bonus > 0`;
4. exactly one controller-owned/controller-controlled attack-area target, constrained by `is_attack`, `played_this_round`, and `not_source_card`;
5. sole effect is exact accepted FB2-50 `create_selected_played_attack_temporary_copy` bound to `selected_attack`;
6. visibility uses structural `revealsTrueName=true`, `on_use_declared`, `servant_package`; no identity routing or Chinese runtime parsing;
7. no generic clone API, no ordinary play event/counter for the generated copy, no extra mana, and exact current-round temporary cleanup.

A temporary two-test whole-card probe was run and deleted. It proved:

- loader `report=[]` and compiled exact FB2-50 classifier acceptance;
- 7 mana rejects skill-zone play; 8 mana accepts and charges exact printed cost 2 (`8 -> 6`);
- no true-name reveal merely from playing the card; activating the exact action ability reveals the servant package through existing visibility semantics;
- with controller terrain/deployment bonus and one current-round attack, activation offers exactly that attack and settlement creates one same-definition public active face-up attack copy without charging extra mana;
- the generated copy is not marked played this round (`playedRound=0` in the current round) and is removed at next-round preparation;
- removing terrain causes activation to reject mutation-free;
- a previous-round attack is not eligible.

No additional B2 capability is required. `servant.atalanta.skill.sc-atalanta-2` is mechanically `S_READY_NOW` on this exact baseline.

## Frozen accounting contract

Mechanical Base enumeration of top-level `data/authoring/**/cards[]` against the frozen inventory gives:

- frozen denominator: `943 static + 1 dynamic = 944`;
- current authoring unique ids: `170`;
- Base frozen overlap: exactly `147/944`;
- duplicate frozen ids: `0`;
- target current count: `0`;
- adding only Atalanta s2 yields exactly `148/944`;
- zero frozen removals and zero duplicate frozen ids.

The S Candidate must therefore be exactly `148/944`, exact +1 `servant.atalanta.skill.sc-atalanta-2`, zero frozen removals, zero duplicate frozen ids, and no second frozen identity. Material overlap is evidence only and is not formal migration credit until fresh R acceptance plus A synchronization.

## Historical-test compatibility authorization

A mechanically found one stale repository-wide snapshot in `packages/rules/tests/astolfo-s1-consumer-migration.test.ts`: `expect(overlap).toHaveLength(147)`.

That assertion was correct for the historical Astolfo Candidate but is not a stable invariant for later accepted migrations. The authorized Atalanta exact +1 necessarily makes repository overlap `148/944`; leaving the old absolute count unchanged would make required full CI incompatible with this authorized migration.

S is therefore additionally authorized to modify only that Astolfo test accounting block, only to remove the stale absolute repository-wide overlap count while preserving stable Astolfo invariants:

- frozen denominator remains `944`;
- duplicate frozen authoring ids remain `[]`;
- `servant.astolfo.skill.sc-astolfo-1` remains authored exactly once.

No Astolfo production data, runtime behavior, semantics, or other Astolfo test assertion may change.

## S scope

Fresh S is authorized only to:

1. create `data/authoring/servants/servant.atalanta.json` containing exactly one frozen card, `servant.atalanta.skill.sc-atalanta-2`; do not add Atalanta s1/s3 or any other frozen identity;
2. encode the complete card only through the exact normalization above, preserving frozen source evidence and Locked Reference static metadata;
3. add `packages/rules/tests/atalanta-s2-consumer-migration.test.ts` proving exact text/hash/static metadata, loader/classifier acceptance, real 7/8 mana play boundary and cost 2, deployment gating, target provenance, true-name visibility, exact free temporary copy behavior, non-play accounting, stale/forged rejection, round cleanup, product/generated non-registration, and exact frozen accounting `147/944 -> 148/944`;
4. apply only the compatibility edit above to `packages/rules/tests/astolfo-s1-consumer-migration.test.ts`;
5. add `docs/reports/2026-09-22-p3-s-r104-atalanta-s2-consumer-migration-result.md`.

Forbidden:

- any production runtime source edit;
- any second frozen identity;
- Atalanta/name/skill-id runtime routing or runtime Chinese parsing;
- generic arbitrary card cloning/copying or new selector/condition/lifecycle engines;
- product pack/generated registration;
- any Astolfo semantic/production change;
- merge or retarget;
- formal migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes it.

## Required gates

S must prove, at minimum:

- Base `147/944` -> Candidate exactly `148/944`, exact +1 target, zero removals, zero duplicates;
- production runtime/product/generated diff empty;
- typecheck;
- focused Atalanta s2 + FB2-50 + Astolfo accounting compatibility and relevant interaction/session suites;
- official `npm run test:ci -- --maxWorkers=2`;
- content validation;
- generated-content determinism;
- exact Locked Reference verification;
- client build;
- Phase 3 coverage with generated artifact restored if changed;
- `git diff --check`, exact identity/scope audit and final clean worktree after commit.

Formal project migration remains `152/944`, with `792` remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**.