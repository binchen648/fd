# P3-FM04 Archer Independent Action Migration Handoff

Date: 2026-09-16
Role: A
Status: READY
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Special-family acceptance: R31 `9d5498027f05ace0aa3a018da87473a1b47b7a21`
Runtime dependencies: TO08 current-lineage Resource Numeric + B21/R15 unpreventable battle-loss VP

## Exact accepted family

FM04 contains exactly eleven identities:

- `servant.atalanta.skill.sc-atalanta-3`
- `servant.baobhan.skill.sc-baobhan-3`
- `servant.chiron.skill.sc-chiron-1`
- `servant.emiya-alt.skill.sc-emiya-alt-1`
- `servant.euryale.skill.sc-euryale-1`
- `servant.gil.skill.sc-gil-1`
- `servant.ishtar.skill.sc-ishtar-3`
- `servant.napoleon.skill.sc-napoleon-3`
- `servant.robin.skill.sc-robin-1`
- `servant.tomoe.skill.sc-tomoe-1`
- `servant.tristan.skill.sc-tristan-3`

Tomoe is the unchanged pre-existing canonical representative. S must introduce exactly the other ten and must not rewrite Tomoe.

## Source and static contract

All eleven frozen F1 full texts have SHA-256 `792fe5ed9a320b58e58103d05aaf9ae27755c5940c159bf47733f04d36da7bc5` and locked Reference static metadata `typeLabel=特殊`, `cost=0`, `basePower=6`, historical `requirement=0`.

Each new archive must be minimal and contain only the selected Independent Action card for that servant. Preserve the per-card owner/name/source references. Use the current canonical Tomoe card only as the accepted semantic decomposition template, not as a text source replacement.

Skill-zone play requirement is the current final rule represented by Tomoe: 8 mana.

## Canonical two-ability shape

Ability 1:
- `phase_action`;
- activation phase `action`, opens `controller_action_window`, requires active source;
- exactly one condition `controller_seat_in_first_half`;
- no target/cost/create/modifier/lifecycle/response/limit;
- exactly one effect `adjust_victory_points(controller,+3)`;
- automatic.

Ability 2:
- `forced_trigger` `after_controller_loses_battle`;
- no phase/window/source-state/condition/target/cost/create/lifecycle/response/limit;
- exactly one effect `adjust_victory_points(controller,-5)`;
- exactly one rule modifier `ignore / effect_prevention / scope.this_effect / priority.explicit_exception`;
- automatic.

Together their printed clauses must reproduce the frozen full text exactly.

## Required S proof

- exact 11-family membership and exactly ten new archive files;
- Tomoe byte/content unchanged relative to base;
- source/full-text SHA 11/11;
- static metadata 11/11;
- TO08 direct Resource predicate accepts ability 1 for all eleven;
- B21 unpreventable loss predicate accepts ability 2 for all eleven;
- at least one newly migrated representative exercised through legal activation +3 VP and post-loss unpreventable -5 VP;
- typecheck;
- focused TO08/B21 + FM04 authoring tests;
- content validation;
- all rules regressions;
- deterministic generated content;
- full CI;
- diff check;
- runtime hot-file changes = 0.

S may record raw coverage to a temporary/generated file but must not repair A-owned taxonomy or commit the coverage artifact.
