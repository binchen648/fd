# P3-A FM04 Independent Action Dispatch Synchronization - 2026-09-16

Role: Codex A
Status: SYNCHRONIZED / FM04_READY
Base: R31 `9d5498027f05ace0aa3a018da87473a1b47b7a21`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Accepted family

R31 independently returns `SPECIAL_FAMILY_ACCEPTED` for the exact eleven-member Archer Independent Action family. No broad Reviewed Special Handler acceptance is implied.

Fresh A reconciliation after R31 confirms:

- family size `11/11`;
- common frozen source/printed SHA `792fe5ed9a320b58e58103d05aaf9ae27755c5940c159bf47733f04d36da7bc5`;
- common Reference handler `core.independent-action`;
- current canonical members `1/11`, exactly `servant.tomoe.skill.sc-tomoe-1`;
- missing members `10/11`, exactly the FM04 additions;
- Sion Independent Action EX excluded.

## Existing accepted semantics

The family is represented by unchanged canonical Tomoe and uses no new runtime:

1. TO08 accepted action-phase, first-half conditioned controller VP `+3` through typed Resource settlement.
2. B21/R15 accepted forced post-loss controller VP `-5` with the exact explicit unpreventable exception.

Fresh A typecheck and the two accepted regression files pass `10/10`.

## Static migration metadata

Locked Reference is uniform for all eleven:

- `typeLabel=特殊`;
- `cost=0`;
- `basePower=6`;
- historical `requirement=0`.

Canonical play from the skill zone follows the current final-rule threshold already represented by Tomoe: `skill_zone_mana_at_least = 8`. The historical Reference requirement remains evidence metadata only.

## Coverage

Fresh coverage is unchanged from the accepted FM03 baseline:

- archives `49`;
- cards `81`;
- abilities `160`;
- raw routing `12 / 3 / 107 / 0 / 38`;
- taxonomy warnings `114`;
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

The regenerated artifact equals the committed artifact after removing only `generatedAt`, so A intentionally does not commit it.

## Dispatch

P3-FM04 is READY at exact batch size 11. S must keep Tomoe unchanged and add only the ten missing siblings. No same-owner sibling skill, runtime file, frozen F1 artifact, coverage/taxonomy definition, or unrelated authoring may change.
