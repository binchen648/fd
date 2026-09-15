# P3-FM03 Saber Magic Resistance Migration Handoff

Date: 2026-09-16
Role: A
Status: READY
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Runtime acceptance: B18/R12 + B19/R13 + FB2-10/R29 (`37fcdaf6d3367a4efb9dcfaf8a1a532fb4354ae9` lineage)

## Exact migration batch

FM03 contains exactly ten frozen F1 identities:

- `servant.altera.skill.sc-altera-3`
- `servant.arthur.skill.sc-arthur-3`
- `servant.bedivere.skill.sc-bedivere-1`
- `servant.charlemagne.skill.sc-charlemagne-3`
- `servant.gawain.skill.sc-gawain-3`
- `servant.lakshmibai.skill.sc-lakshmibai-3`
- `servant.mordred.skill.sc-mordred-3`
- `servant.musashi.skill.sc-musashi-3`
- `servant.saber.skill.sc-saber-1`
- `servant.saitou.skill.sc-saitou-1`

No substitution, same-owner expansion, or opportunistic migration is allowed.

## Canonical card metadata

For each selected card, preserve the locked Reference static values:

- servant skill card;
- `cost=3`;
- `basePower=3`;
- `typeLabel=特殊` and canonical special attribute representation;
- final skill-zone requirement 8 mana, not historical Reference `requirement=3`;
- preserve the per-card F1 name, printed text, source evidence, and source hash.

Each missing servant archive must remain minimal and contain only the selected skill card. Do not migrate other skills for the same servant.

## Canonical ability split

Represent the mixed F1 source meaning as three independent structured abilities matching the already accepted representative contracts.

### 1. Noble Bloom base

Match B18/R12 exactly:

- `optional_trigger`;
- combat phase;
- trigger `after_battle_result_determined`;
- response window `after_battle_result_determined`;
- exactly one condition `controller_played_highest_cost_noble_phantasm_in_battle_this_round`;
- exactly one controller `adjust_victory_points(+1)` effect;
- no target/cost/create/modifier/lifecycle/limit.

### 2. Noble Bloom threshold extra VP

Match B19/R13 exactly:

- same optional combat post-result window;
- conditions exactly highest-cost Noble Phantasm plus `highest_cost_noble_phantasm_cost_at_least(value=4)`;
- exactly one controller `adjust_victory_points(+1)` effect;
- independent response from the base +1, not one merged +2 effect.

### 3. Magic Resistance

Match FB2-10/R29 exactly:

- `phase_action`;
- combat phase;
- opens `controller_combat_action_window`;
- active source required;
- no conditions/targets/cost/effects/creates/top-level lifecycle/response opening/limit/visibility semantics;
- exactly one `combat_power_modifier` with operation `set`, rule `attack.currentPower`, value `0`;
- scope controller `engaged_opponents_same_battlefield`, object `attack_card`;
- exactly one `has_attribute(魔术)` structural constraint;
- modifier-local lifecycle `this_round`;
- automatic execution.

The structured semantic uses the accepted Magic attribute contract even when a source text variant prints `魔法` or `魔法/魔术`; preserve printed text separately and do not route by text.

## Source preservation

Exact F1 reference printed-text hashes are authoritative per identity:

- Altera / Arthur / Bedivere / Charlemagne / Gawain / Mordred / Musashi: `8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc`;
- Lakshmibai / Saitou: `b2b1bc7cdbc3adce79362de44635ed871f652c60e3b5abe691a07e26458a8d05`;
- Saber: `0cdfc3fafc790b59414b23e58a39fd0926dd776a7df6ccba352ce65dd3c74d22`.

S must prove exact text/hash preservation programmatically. Do not normalize punctuation, class capitalization, or `魔法/魔术` wording.

## Required S validation

- exact ten-ID migration membership;
- before/after selected overlap `0/10 -> 10/10` and global frozen-F1 overlap expected `49 -> 59`;
- unauthorized additions=0, removals=0, skipped=0;
- source/printed-text hash 10/10;
- B18 semantic classifier 10/10;
- B19 semantic classifier 10/10;
- FB2-10 Magic Resistance classifier 10/10;
- at least one newly migrated representative exercised through real runtime for both Magic Resistance Power=0 and Noble Bloom response behavior;
- typecheck;
- focused B18/B19/FB2-10 compatibility;
- content validation;
- all rules regressions;
- deterministic generated-content verification;
- full CI, with any pre-existing wall-clock timeout reported rather than hidden or weakened;
- diff check;
- runtime hot-file changes=0.

S may record temporary/raw coverage observations but must not repair A-owned coverage/taxonomy logic.

## Non-scope

No broad TO15 Power, other Saber skills, same-owner additional skills, unrelated Resource Numeric, runtime changes, taxonomy/KPI changes, or F1 artifact edits.
