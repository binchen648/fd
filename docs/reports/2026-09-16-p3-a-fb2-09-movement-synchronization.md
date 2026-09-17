# P3-A FB2-09 Movement Synchronization

Date: 2026-09-16
Role: A
Status: SYNCHRONIZED / FM02_READY
Base: R27 `698dba5a8476e3d86363f286c57c9f515746eb3f`
FB2-09 candidate: `8c3667fc725520f3aed024a15afdd39cfbda2a0a`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Accepted runtime boundary

R27 independently accepted only the exact action-phase controller Movement route whose target is one enabled location excluding the Magic Workshop. Broad Movement remains unaccepted.

## Fresh F1 reconciliation

A independently reloaded frozen F1 after R27 and reconciled the exact 12-member family. All 12 satisfy every check:

- top-level `blockedBy=[]`;
- Phase 3 `blockedBy=[]`;
- required capabilities exactly `[GENERIC_MOVEMENT]`;
- mechanic family exactly `[MOVEMENT]`;
- classification route `READY_GENERIC_EXTENSION`;
- axes exactly `ACTION + MOVE_PLAYER` with all other axes empty;
- one frozen source-overlay ability with activation phase `action`;
- exact effect `move_player`, controller scope, `destinationRule=any_location_except_workshop`;
- printed/source-text SHA-256 `5d3fd4e656083f54831c208f2e7b3c9a4ffd5977776e3a3b5214c868596ca1c0`;
- no member currently has canonical authoring.

Result: `EXACT_12_RECONCILIATION PASS 12/12`.

Exact IDs:

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

## Static-card evidence for migration

Locked Reference metadata (`b2f9fa15fba07c63530bbf4612b03b8b704755f9`) confirms all 12 selected cards have printed `cost=3`, `basePower=5`, and historical `requirement=3`. As with already migrated skill cards, the historical requirement field does not override final rule 9.4: canonical skill-zone use requires 8 mana. Attribute/type-label ordering must be preserved from the locked Reference per card; it is not inferred from owner class. Li Shuwen is an Assassin owner whose selected card still belongs to this Lancer-class skill family.

## Fresh coverage

Fresh A coverage after R27 remains:

- archives 27; cards 59; abilities 118;
- `newRuntimeSemanticRouted=12`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=75`;
- `dualRuntime=0`;
- `notClassifiable=28`;
- `taxonomyWarnings=92`;
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- 70 compiled cards / 14 characters / 0 blocking issues.

The regenerated coverage artifact differs only by `generatedAt` and static source line numbers moved by the accepted runtime patch (9 insertions / 9 deletions). It is intentionally not committed.

A recertification also passes typecheck and focused Movement + Resolution Data-flow `22/22`.

## Dispatch decision

All 12 identities are now dependency-complete under the independently accepted FB2-09 route. This satisfies the F4 10–40 batch rule, so P3-FM02 is READY at exact batch size 12.
