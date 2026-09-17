# P3-FM05 Territory Creation Migration

Date: 2026-09-16
Role: S
Status: `MIGRATION_CANDIDATE`
Base A dispatch sync: `fd17ba227182e5e9a14d093390bbfb3a47af1c39`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted dependencies: R33/FB2-11 trusted `game.round_number` formula metric + R19/FB2-02 deployment resource reward

## Exact migration batch

FM05 adds exactly these ten previously absent Territory Creation skill cards:

- `servant.anastasia.skill.sc-anastasia-1`
- `servant.andersen.skill.sc-andersen-1`
- `servant.avicebron.skill.sc-avicebron-3`
- `servant.kinggil.skill.sc-kinggil-1`
- `servant.ladyavalon.skill.sc-ladyavalon-3`
- `servant.maxwell.skill.sc-maxwell-1`
- `servant.mephisto.skill.sc-mephisto-1`
- `servant.mozart.skill.sc-mozart-3`
- `servant.semiramis.skill.sc-semiramis-2`
- `servant.shakespeare.skill.sc-shakespeare-1`

Each archive contains exactly one selected skill card. Owner metadata is preserved from locked Reference, including Lady Avalon as `Pretender` and Semiramis as `Assassin`; the skill name's Caster-class wording does not overwrite the servant's actual class.

## Frozen source and static evidence

All ten cards preserve the same frozen F1 full-text SHA:

`295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58`

The two frozen clause hashes are identical for all ten:

- `a65ce56a69bba9214eba95ab30154209228bcd28f7fec21f6317c8a70f421847`
- `2137380f5f57233a98494f45a9d12a848f3d1cf710101c60462c523ea3f1624f`

Locked Reference static metadata is uniform for the selected skill cards: `typeLabel=魔术`, `cost=0`, historical `basePower=2`, historical `requirement=0`. The historical base Power is retained only as evidence metadata because frozen F1 explicitly defines dynamic `X = 16 - (current round x 2)`. Canonical skill-zone play uses final rule 9.4 at 8 mana.

Byte-level audit against frozen F1 and locked Reference is `10/10 PASS`, including owner name/class, legacy ID, printed text, full-text SHA, both clause hashes, source evidence, final 8-mana rule, and exact two-ability structure.

## Accepted two-part authoring

Each card contains exactly two abilities and no new runtime contract:

1. `*.round-power`: `continuous_formula`, source active, using existing numeric AST only. The card-face formula is exactly `add(16, multiply(-2, game.round_number))`. No `subtract` operator, string expression, client variable, or broad formula capability is added.
2. `*.deployment-reward`: forced `after_player_deployed_to_battlefield` at `magic_workshop`, typed controller `+1 mana` and `+2 VP`, exactly matching the independently accepted FB2-02 deployment reward semantic.

The FM05 focused suite loads all ten archives with zero loader blockers and confirms the deployment half classifies through `isDeploymentResourceRewardSemantic`.

## Real migrated behavior

A newly migrated Anastasia archive is exercised end-to-end:

- authoritative round state yields Power `14 / 8 / 2 / 0` on rounds `1 / 4 / 7 / 8` respectively;
- deployment by the controller at Magic Workshop changes resources from mana `4 -> 5` and VP `1 -> 3`, with typed adjustment events;
- wrong-location deployment and another player's deployment do not grant the controller resources.

## Frozen-F1 authoring burn-down observed by S

Programmatic comparison against exact A handoff and frozen 944-ID F1 inventory:

- denominator: `944`;
- canonical authoring overlap: `69 -> 79` (`+10`);
- exact added frozen IDs equal the authorized FM05 ten: PASS;
- unauthorized additions: `0`;
- removals: `0`;
- skipped selected members: `0`.

The frozen F1 inventory's prior `5 open + 5 SPECIAL_EFFECT` split is not treated as a semantic split. R33 independently confirmed all ten share one full-text SHA, the same two clause hashes, the same Reference `core.territory-creation` handler, and identical static card metadata; the split was evidence-classification drift only.

## Raw coverage observation

Temporary S coverage is not staged for commit. Relative to the FM04 material baseline it reports:

- archives `59 -> 69`;
- cards `91 -> 101`;
- abilities `180 -> 200`;
- `newRuntimeSemanticRouted=22` unchanged;
- `legacyExecuteAbility=3` unchanged;
- `legacyResolveEffect=117 -> 127` (`+10`, deployment reward abilities under the current reporter label);
- `dualRuntime=0` unchanged;
- `notClassifiable=38 -> 48` (`+10`, continuous-formula abilities under the current reporter classification);
- `taxonomyWarnings=124` unchanged;
- compiled product unchanged: 70 cards / 14 characters / 0 blocking issues;
- compiled definition hash unchanged: `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`.

S does not redefine A-owned coverage taxonomy. These reporter labels do not override the independently accepted FB2-11 and FB2-02 runtime contracts.

## Validation

- typecheck: PASS;
- FM05 + FB2-11 + FB2-02 focused: `3 files / 17 tests PASS`;
- all rules regression/core suites: `63 files / 368 tests PASS`;
- content validation: 7 masters / 7 servants / 20 events / 0 blocking issues;
- deterministic generated content: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `117 files / 710 tests PASS`;
- runtime hot-file changes relative to handoff: `0`;
- `git diff --check`: PASS.

## Changed scope

Candidate scope is exactly:

- ten new minimal `data/authoring/servants/*.json` archives for the authorized FM05 identities;
- `packages/rules/tests/fm05-territory-creation-authoring.test.ts`;
- this S migration report.

`artifacts/phase3-skill-coverage.json` remains locally modified only because S ran temporary material coverage; it is intentionally unstaged for A-owned material synchronization. No runtime implementation, coverage/taxonomy definition, frozen F1 artifact, generated playtest content, or unrelated authoring is changed.
