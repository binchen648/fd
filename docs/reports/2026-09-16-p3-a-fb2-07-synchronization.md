# P3-A FB2-07 Synchronization — 2026-09-16

## Accepted lineage

- A handoff: `6fb7e2c529cc22599ba820d49de6cce8fea2e128`
- B2 candidate: `7cfa53b1dcea1f8b0769ff247924724d20d1d626`
- Independent R24 acceptance: `e9e6112ced21ffad738fa00025132f9c3fe9976d`
- F1 evidence baseline: `59f145434695d29bdd17e4cb3adc887e84182377`

## Accepted scope

FB2-07 accepts only the fixed controller executing-source removal component:

- typed `move_source_card` may move the executing controller-owned/controller-controlled source to `removed_from_game`;
- authoritative removed-zone state is public and inactive;
- the existing typed source-card movement result/event envelope remains the mutation/evidence owner;
- the identity-free component classifier does not grant any parent runtime route.

The existing B15 `move_source_card -> skill` contract is unchanged and still requires an active, face-up source on `field` or `attack_area`.

Not accepted by implication: broad Card Zone, `return_card_by_definition`, Card Create, arbitrary source movement, selected/matching-card movement, Trigger/Lifecycle/Target/Interaction/Movement/Visibility/Power/Battle/Special parents, or any F1 migration.

## F1 alignment

Exactly 12 F1 identities are component-aligned to the accepted source-removal primitive. Every one still has at least one independent parent capability or reviewed-special dependency. Complete migration readiness added by FB2-07 is therefore `0`.

The separate Return-by-definition cluster remains unpromoted: the source overlay proves only 8 unique same-shape skill IDs, while four non-overlay RETURN_CARD_BY_DEFINITION identities lack frozen effect-shape evidence sufficient to inflate that family to the F4 minimum.

## Fresh A evidence

Fresh `phase3:coverage` from exact R24 SHA reports:

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

The regenerated coverage artifact changes only `generatedAt` and static source-line locations. Source fingerprint, counters, compiled identity, classifications, and evidence identities are unchanged, so the artifact drift is intentionally not committed.

Independent R24 evidence is green:

- typecheck PASS;
- focused compatibility `34/34 PASS`;
- all rules regressions `274/274 PASS`;
- deterministic generated-content hashes unchanged;
- full CI `687/687 PASS`;
- production identity audit `IDENTITY_NONE`;
- forbidden-file audit `FORBIDDEN_NONE`;
- corrected quoted-range `git diff --check` PASS.

## F4 consequence

The 12 exact identities are component-aligned, not 12 migration-ready identities. No single newly accepted complete FB2-07 parent contract reaches the required `10–40` exact-ID migration batch, so `P3-FM01` remains undispatched.

Wave 2 continues in dependency order with the next high-yield Card Zone / Move / Return component. No wave skipping to Trigger or Power is authorized by this synchronization.
