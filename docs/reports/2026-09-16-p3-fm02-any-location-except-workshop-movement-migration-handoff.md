# P3-FM02 Any-Location-Except-Workshop Movement Migration Handoff

Date: 2026-09-16
Role: A
Status: READY
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime acceptance: R27 `698dba5a8476e3d86363f286c57c9f515746eb3f`

## Exact migration batch

FM02 contains exactly 12 frozen F1 identities:

- `servant.benkei.skill.sc-benkei-1`
- `servant.bradamante.skill.sc-bradamante-1`
- `servant.brynhildr.skill.sc-brynhildr-1`
- `servant.cu.skill.sc-cu-2`
- `servant.diarmuid.skill.sc-diarmuid-3`
- `servant.donquixote.skill.sc-donquixote-3`
- `servant.enkidu.skill.sc-enkidu-3`
- `servant.jaguarman.skill.sc-jaguarman-1`
- `servant.kagetora.skill.sc-kagetora-3`
- `servant.lishuwen.skill.sc-lishuwen-3`
- `servant.romulus.skill.sc-romulus-3`
- `servant.vlad.skill.sc-vlad-3`

No substitution, expansion, or opportunistic same-owner migration is allowed.

## Canonical authoring contract

For each selected skill, S may add only the selected card/archive material required to represent this exact accepted shape:

- servant skill card;
- preserve F1 owner/name/printed text/source evidence;
- preserve locked Reference printed card metadata (`cost=3`, `basePower=5`, per-card attribute/type-label ordering);
- skill-zone play requirement follows final rule 9.4 at 8 mana, not historical Reference `requirement=3`;
- ability kind `phase_action`;
- activation phase `action`, opens `controller_action_window`, requires source `active`;
- exactly one location target, count `1..1`;
- target constraints exactly `any_enabled_location` and `not_location_kind: workshop`;
- exactly one effect `move_player`, player/controller, `to` the declared target;
- automatic execution; no cost/condition/create/modifier/lifecycle/response opening/limit.

Each missing servant archive must stay minimal: do not migrate other skills for that servant. Existing authoring outside the exact 12 list must remain untouched.

## Source preservation

All 12 frozen F1 source texts have SHA-256 `5d3fd4e656083f54831c208f2e7b3c9a4ffd5977776e3a3b5214c868596ca1c0`. S must prove exact source/printed-text preservation programmatically and must not reconstruct semantics from runtime code or translated prose.

## Validation required from S

- exact 12-ID membership;
- no extra F1 authoring additions;
- source hash 12/12;
- accepted runtime classifier 12/12;
- at least one newly migrated non-fixture representative exercised end-to-end through activation -> location choice -> typed move;
- current location and Magic Workshop excluded;
- typecheck;
- focused FB2-09 + Resolution Data-flow tests;
- content validation;
- all rules regressions;
- deterministic generated content;
- full CI;
- diff check;
- runtime hot-file changes = 0.

S must record temporary/raw coverage observations but must not repair A-owned taxonomy/coverage classifiers.

## Non-scope

No broad Movement, other movement skills, same-owner other skills, runtime changes, generic Target Selection, forced/third-party/arrow movement, deployment, or Power/Resource migration.
