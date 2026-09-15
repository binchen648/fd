# P3-A FB2-04 Synchronization

Date: 2026-09-16
Role: A
Status: REVIEW_ACCEPTED_SYNCHRONIZED

## Accepted lineage

- A handoff: `61162f0cfc25014a0a6f0bde73802ff5d00d662f`.
- B2 candidate: `5e6500a72f2d82c2cb12644a163ed6b9d96f0fc7`.
- Independent R21 acceptance: `92c55fc53164ce52ad9489ef5d5067cb516ea4e3`.
- F1 source evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.

## Accepted scope

FB2-04 accepts only a reusable fixed-controller command-seal adjustment component: `adjust_command_seals`, implicit/explicit controller, non-zero safe-integer literal signed amount, optional non-empty string `directive`. The existing Resolution Data-flow primitive remains the single mutation and typed-event owner. Parent timing/trigger routes remain independently gated.

Exact F1 component membership remains six identities / seven effects: Rin S2, Shinji S3, Shinji S4 (two effects), Sieg ascension, Sieg S1A, and Da Vinci SC8. This is component alignment, not a claim that all six cards are executable or migration-ready.

Explicit exclusions remain Amakusa ascension all-opponents loss, Bazett S4 restore-all, and Zouken ascension same-battlefield-opponent loss. Command-seal payment is also outside FB2-04.

## Fresh A evidence

Fresh `npm.cmd run phase3:coverage` from exact R21 SHA reports:

- `newRuntimeSemanticRouted=12`
- `legacyExecuteAbility=3`
- `legacyResolveEffect=49`
- `dualRuntime=0`
- `pilotAllowlist=0`
- `notClassifiable=28`
- `taxonomyWarnings=79`
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`
- compiled cards `70`, characters `14`, blocking issues `0`.

The regenerated coverage artifact changes only `generatedAt` and static source line numbers caused by accepted code insertions. Source fingerprint, counters, compiled identity, classifications, and evidence identities are unchanged, so the generated drift is intentionally not committed.

Independent R21 evidence: typecheck PASS; focused compatibility 6 files / 33 tests PASS; rules regression 43 files / 256 tests PASS; generated-content determinism PASS; full CI 110 files / 669 tests PASS; identity/forbidden-file/diff audits clean.

## Migration implication

No F1 authoring migration occurred. FB2-04 has only six exact identity members, so this capability slice cannot by itself satisfy the FM01 implementation-plan minimum of 10 exact IDs even if every member eventually has an accepted parent route. FM01 remains undispatched.

## Next gate

Continue fresh wave-1 Resource Numeric / Cost analysis. Do not promote later Card Zone, Interaction, Trigger, or Power runtime merely because a numeric component is accepted.
