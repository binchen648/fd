# P3-A FB2-05 Synchronization — 2026-09-16

## Accepted lineage

- A handoff: `40444c1c6354f302712d87cc4f774c825b1ae099`
- B2 candidate: `1a611635061f83f7b3aad5c5b2e3da2a33b201bf`
- Independent R22 acceptance: `af6503692e23fb118b8956e00baa2b0f84cb2181`
- F1 evidence baseline: `59f145434695d29bdd17e4cb3adc887e84182377`

## Accepted scope

FB2-05 accepts only the fixed-controller exact `set_mana` numeric primitive/component:

- authoring component requires implicit/explicit controller and fixed safe-integer literal target;
- runtime exact-set target must be within `0..manaCap(controller)`;
- assignment semantics are exact rather than additive;
- `manaGainBlocked` does not suppress an exact set;
- non-zero actual delta emits existing typed `mana_adjusted` evidence;
- same-value assignment is a no-op and emits no resource event;
- transaction rollback remains authoritative;
- no Trigger Gateway, condition, target, lifecycle, modifier, special-handler, or migration acceptance is implied.

Exact F1 component membership remains five identities:

- `master.iliya.skill.s1`
- `master.shinji.skill.s4`
- `master.shirou-emiya.skill.s3`
- `master.taiga.skill.s1`
- `master.zouken.skill.s1`

These five identities are component-aligned only. None is declared migrated or fully routable by FB2-05 alone.

## Fresh A evidence

Fresh `phase3:coverage` from exact R22 SHA reports:

- `newRuntimeSemanticRouted=12`
- `legacyExecuteAbility=3`
- `legacyResolveEffect=49`
- `dualRuntime=0`
- `notClassifiable=28`
- `taxonomyWarnings=79`
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`
- compiled cards `70`
- compiled characters `14`
- blocking issues `0`

The regenerated coverage artifact changes only `generatedAt` plus static source-line locations caused by accepted interpreter/data-flow insertions. Source fingerprint, counters, compiled identity, classifications, and evidence identities are unchanged, so the artifact drift is intentionally not committed.

Independent R22 evidence is green:

- typecheck PASS;
- focused compatibility `35/35 PASS`;
- all rules regressions `262/262 PASS`;
- deterministic generated-content hashes unchanged;
- full CI `675/675 PASS`;
- identity/text routing audit clean;
- forbidden-file audit clean;
- `git diff --check` PASS.

## Dispatch consequence

FB2-05 completes another narrow wave-1 Resource Numeric primitive, but does not itself satisfy the first F4 migration batch gate. The five exact `set_mana` identities still require later parent semantics, especially Trigger Gateway for Iliya S1 and Taiga S1. Variable/expression Mana payment rows remain deferred to Result Binding/Target-capable work rather than being promoted under the fixed-cost contract.

`P3-FM01` remains undispatched until one independently accepted complete runtime contract owns 10–40 exact F1 migration identities.
