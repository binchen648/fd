# P3-A FB2-10 Saber Magic Resistance Synchronization

Date: 2026-09-16
Role: A
Status: SYNCHRONIZED / FM03_READY
Base: R29 `37fcdaf6d3367a4efb9dcfaf8a1a532fb4354ae9`
FB2-10 candidate: `9b0381a6961e7f07f5053caef3c46b7831c86f22`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Accepted runtime boundary

R29 independently accepts only the exact identity-free Magic Resistance modifier shape: combat phase action from an active source, one `combat_power_modifier`, `set attack.currentPower=0`, same-battlefield engaged opponents, attack-card object, one Magic-attribute constraint, and `this_round` duration. Broad TO15 Power/Modifier remains outside acceptance.

The two Resource siblings required by this ten-card family were already independently accepted by B18/R12 and B19/R13: base Noble Bloom +1 VP and the cost>=4 extra +1 VP response.

## Fresh frozen-F1 reconciliation

A independently reloaded the frozen F1 inventory and source overlays after R29. Exact result: `10/10 PASS`.

Every selected identity has:

- top-level and Phase-3 `blockedBy=[]`;
- `classification=CONTRACT_MAPPED`;
- `classificationRoute=READY_GENERIC_EXTENSION`;
- `mappingStatus=CONTRACT_MAPPED`;
- `currentRoute=none` before migration;
- required capabilities exactly `[GENERIC_POWER, GENERIC_RESOURCE_NUMERIC]`;
- semantic effect axes exactly `[GAIN_VICTORY_POINTS, SET_OPPONENT_ATTRIBUTE_POWER]`;
- Reference handler `core.saber-magic-resistance`;
- one mixed source-overlay ability with exactly the Noble Bloom combined VP operation and the engaged-opponent Magic Power=0 operation;
- source hash equal to the overlay reference printed-text hash.

Exact IDs:

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

Current canonical-authoring overlap remains `49/944`. Selected-batch overlap is `0/10`; therefore FM03 will not duplicate an existing canonical card.

## Per-card text preservation

The ten rows are mechanically identical in normalized behavior but not byte-identical in printed wording. F1 preserves three reference text hashes:

- `8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc` for Altera, Arthur, Bedivere, Charlemagne, Gawain, Mordred, Musashi;
- `b2b1bc7cdbc3adce79362de44635ed871f652c60e3b5abe691a07e26458a8d05` for Lakshmibai and Saitou;
- `0cdfc3fafc790b59414b23e58a39fd0926dd776a7df6ccba352ce65dd3c74d22` for Saber.

S must preserve the F1 source/printed text per identity. The wording differences (`魔术`, `魔法`, and Saber original condensed wording) are not authorization to rewrite text.

## Locked static metadata

Reference HEAD is exactly `b2f9fa15fba07c63530bbf4612b03b8b704755f9`. All ten selected cards have:

- `cost=3`;
- `basePower=3`;
- `typeLabel=特殊`;
- historical `requirement=3`.

Historical requirement does not override final rule 9.4. Canonical skill-zone play uses the established 8-mana requirement. Card names and source references must remain per-card; do not derive them from runtime identity logic.

## Fresh coverage and recertification

Fresh A coverage after R29:

- archives 39;
- cards 71;
- abilities 130;
- `newRuntimeSemanticRouted=12`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=87`;
- `dualRuntime=0`;
- `notClassifiable=28`;
- `taxonomyWarnings=104`;
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards 70 / characters 14 / blocking issues 0.

The regenerated coverage artifact differs from the accepted FM02 artifact only in `generatedAt` and static `interpreter.ts` source line numbers moved by FB2-10. It is intentionally left uncommitted.

A recertification:

- typecheck PASS;
- FB2-10 + B18 + B19 + complex compatibility: `53/53 PASS`;
- `git diff --check` on A-owned documentation will be required before commit.

## Dispatch decision

All ten identities are dependency-complete under independently accepted B18/R12, B19/R13, and FB2-10/R29 contracts. Exact batch size is 10, satisfying the F4 10–40 rule. P3-FM03 is READY.
