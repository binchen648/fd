# P3-A FB2-06 Synchronization — 2026-09-16

## Accepted lineage

- A handoff: `8e66df97a8dedee33370327b5425d9558e185e11`
- B2 candidate: `3f1080a7cb4f68e7c08af91b349680a6536cd362`
- Independent R23 acceptance: `0dc6619eba6f2ff67c96b6ec9c3ff736cae66740`
- F1 evidence baseline: `59f145434695d29bdd17e4cb3adc887e84182377`

## Accepted scope

FB2-06 accepts two compositional pieces and nothing broader:

1. fixed positive controller ordinary-deck `draw_cards` component, with 23 exact F1 component-aligned identities;
2. one narrow complete structural direct route: runtime `advance` / controller action window, fixed controller `pay_mana(1)`, fixed controller `draw_cards(2)`, no target/condition/create/modifier/lifecycle/response/limit.

The existing typed Resolution Data-flow `draw_cards` primitive remains the sole mutation/recycle/shuffle owner. The complete route composes the accepted FB2-01 fixed payment with this draw component atomically.

Component alignment does not grant parent timing/trigger/interaction acceptance. In particular, the 14 servant rows that share draw-1 plus optional low-power hand-play are not complete runtime routes: their `on_card_played` draw clause remains Trigger-owned.

## Fresh A evidence

Fresh `phase3:coverage` from exact R23 SHA reports:

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

Independent R23 evidence is green:

- typecheck PASS;
- focused compatibility `25/25 PASS`;
- all rules regressions `268/268 PASS`;
- deterministic generated-content hashes unchanged;
- full CI `681/681 PASS`;
- production identity/text routing audit clean;
- forbidden-file audit clean;
- `git diff --check` PASS.

## F4 consequence

The 23 exact identities are component-aligned, not 23 migration-ready identities. The accepted complete direct route currently contributes only the Waver-shaped representative, so the 10–40 exact-ID F4 gate is still not met.

The nearest visible 10+ batch remains the 14 servant draw/play family, but its Trigger-owned draw clause is not runtime-accepted and cannot be imported early. P3-FM01 therefore remains undispatched while wave 2 continues in dependency order.
