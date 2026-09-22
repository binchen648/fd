# P3-A R93 Darnic s1a Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Formal baseline

- Exact R93 Leonidas s1 migration acceptance sync Base: `0d27a0708019cb0b4d6854fefea6e273cc25b455`
- Exact accepted Leonidas S Candidate: `258df4fa845df6c0a8c0c2d135b0a3cda17020a3`
- Formal migration accepted: `147/944`
- Formal remaining: `797`
- Branch-local frozen authoring overlap: `142/944`
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

Leonidas s1 acceptance added no runtime capability and the accepted FB2-44 `face_up_cards_per_round=set(1)` seam has exactly one frozen semantic-matrix occurrence, Leonidas s1 itself. A therefore resumed migration-credit-first current-baseline probing rather than dispatching a new B2 seam.

## Exact migration identity

Migrate exactly one frozen consumer:

- `master.darnic.skill.s1a`
- owner: `master.darnic`
- owner name: `达尼克·普雷斯通`
- owner class: `Master`
- legacy id: `s1a`
- name: `噬魂者`
- static card metadata: typeLabel `被动`, attributes `[]`, cost `0`, basePower `0`, no play requirement.

Frozen F1 full printed text:

`当你赢得一场战斗后，你可以将你的魔力设为4点。\n回合结束时，若你的魔力小于等于2，失去2点战果。`

Exact frozen clause evidence:

- `skillCards[23].abilities[0].printedClause` SHA-256 `464fd9246076fc8c86029d2c63bbbbe81df7d31390196595f2e3b94c4a79a02b`;
- `skillCards[23].abilities[1].printedClause` SHA-256 `7a159e392ad4e1dcb5ad3edf73800151c33353a2bb39da2f01eebeb92bdf64b4`;
- complete printed-text SHA-256 `088a6c3e26174bb98ead15d585dc8cc408d6925acd3b0405dd4f62ab1c10653e`.

Locked Reference independently confirms exact id/name/text, owner `master.darnic`, typeLabel `被动`, cost `0`, basePower `0`, attributes `[]`, and no requirement. Reference handler identity is evidence only and must not be used for production routing.

## Mechanical current-baseline whole-card re-overlay

A reconstructed the complete card in memory on exact current baseline `0d27a0708019cb0b4d6854fefea6e273cc25b455` using only frozen F1 semantics and already accepted generic vocabulary:

1. optional win response: `optional_trigger` on authoritative `after_controller_wins_battle`, `source_owned`, normal turn-order response window with decline, fixed controller `set_mana(4)`;
2. round-end penalty: `forced_trigger` on `round_end`, `source_owned`, generic numeric condition `lte(controller.availableMana, 2)`, then controller `adjust_victory_points(-2)`;
3. no targets, costs, creates, ongoing modifiers, lifecycle, visibility, identity routing, or runtime Chinese parsing.

Exact-ID temporary whole-card probe returned:

- loader `report=[]`;
- card `mode=automatic` and both abilities `execution.mode=automatic`;
- authoritative `after_battle_result_determined` win producer generated the controller `after_controller_wins_battle` response window;
- accepting the response changed mana `1 -> 4`;
- declining the same response left mana unchanged;
- `round_end` at mana `2`, VP `5` changed VP `5 -> 3`;
- `round_end` at mana `3`, VP `5` left VP at `5`;
- probe used no production edits and the A worktree remained clean.

This is mechanically zero-gap on the current accepted runtime. No B2 capability is required, so `master.darnic.skill.s1a` is `S_READY_NOW`.

## Frozen accounting contract

A mechanically recounted the authoritative `943 static + 1 dynamic = 944` frozen inventory against current top-level `data/authoring/**/cards[]` ids:

- Base frozen overlap: exactly `142/944`;
- duplicate frozen authoring ids: `0`;
- target currently present: `false`;
- adding only `master.darnic.skill.s1a` must yield exactly `143/944`;
- zero frozen removals and no second frozen identity.

Branch-local material overlap is evidence only and does not itself change formal migration credit.

## Historical-test compatibility authorization

Current `packages/rules/tests/leonidas-s1-consumer-migration.test.ts` still contains the historical repository-wide snapshot `expect(overlap).toHaveLength(142)`. The authorized Darnic exact +1 necessarily makes the current repository overlap `143/944`, so leaving that stale absolute assertion unchanged makes the required full CI mathematically unsatisfiable.

S is therefore additionally authorized to modify **only** that old Leonidas test's accounting assertion so that it keeps stable Leonidas invariants:

- frozen denominator remains `944`;
- duplicate frozen ids remain `0`;
- `servant.leonidas.skill.sc-leonidas-1` remains authored exactly once;
- remove only the unstable absolute whole-repository `142` expectation and wording that claims the global repository total is permanently `142`.

This compatibility edit does not authorize any Leonidas production semantic change or any second frozen identity.

## S scope

Fresh S is authorized only to:

1. add one standalone authoring archive `data/authoring/masters/master.darnic.json` containing exactly `master.darnic.skill.s1a`;
2. encode the two F1 clauses only through the generic normalization above and preserve exact frozen F1 / Locked Reference evidence;
3. add focused `packages/rules/tests/darnic-s1a-consumer-migration.test.ts` coverage proving exact text/hashes/static metadata, loader `report=[]`, automatic execution, authoritative win-response accept/decline behavior, round-end threshold positive/negative behavior, product/generated non-registration, and exact frozen accounting;
4. apply only the A-authorized stable-invariant compatibility edit to `packages/rules/tests/leonidas-s1-consumer-migration.test.ts`;
5. add one S result report.

Forbidden:

- any production runtime source edit;
- any second Darnic or other frozen identity;
- any Darnic/name/skill-id runtime routing;
- any new trigger, condition, effect, selector, interaction, or resource engine;
- product pack/generated registration;
- merge or retarget;
- migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

## Required gates

S must prove, at minimum:

- Base `142/944` -> Candidate exactly `143/944`, exact +1 Darnic s1a, zero removals, zero duplicates;
- production runtime/product/generated diff empty;
- `npm run typecheck`;
- focused Darnic s1a + relevant trigger/resource/window compatibility coverage;
- rules src/core/regression/focused suite;
- official `npm run test:ci -- --maxWorkers=2`;
- `npm run content:validate`;
- `npm run verify:generated-content`;
- exact Locked Reference verification;
- client production build;
- `npm run phase3:coverage` with generated artifact restored afterward;
- `git diff --check`, identity/scope audit, and final clean worktree after commit.

Formal project migration remains **`147/944`**, with **`797`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.