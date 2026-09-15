# P3-A FB2-08 Synchronization — 2026-09-16

## Accepted lineage

- A handoff: `85cbc179a1ae4743b3ebb66756b066578edfc1b3`
- B2 candidate: `ea6a1522f6382ef617ae26fbca7d208e999f204f`
- Independent R25 acceptance: `33f0a0e1b3e9c4c62c8eb713ae45cd7117c7a0a7`
- F1 evidence baseline: `59f145434695d29bdd17e4cb3adc887e84182377`
- TO13 accepted Interaction baseline: `3964556699dafc116a67d7f43af9a740d17a0a04` with independent reviewer evidence `8c7349e8a36a198f0f83bf114fe94bc588bc8569`

## Accepted runtime scope

FB2-08 accepts exactly the identity-free contract:

`forced on_card_played + source active + played_with_basic_attack + fixed controller draw 1`

Trusted play-batch provenance must prove the source itself was played face up by its controller and that the same batch contains another face-up basic attack controlled by that player. The draw settles through the existing typed Resolution Data-flow draw primitive. Malformed recognized near-matches fail closed before legacy mutation.

This does not promote broad Trigger Gateway, generic `on_card_played`, optional triggers, Okita repeat-play semantics, or broad Card Action PLAY.

## Fresh A evidence

Fresh `phase3:coverage` from exact R25 SHA reports:

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

The regenerated coverage artifact changes only `generatedAt` and static source-line locations. Source fingerprint, counters, compiled identity, classifications, and evidence identities remain unchanged, so this non-semantic generated drift is intentionally not committed.

Independent R25 evidence is green: typecheck PASS; focused compatibility `78/78`; Drake Riding integration `5/5`; all rules regressions `280/280`; generated-content determinism unchanged. The first full-CI reviewer run had one unrelated 5-second parallel-load timeout; that exact test passed twice in isolation (65ms/59ms), and the second full CI passed `693/693`.

## Exact F4 dependency proof

A re-read the frozen F1 inventory and source overlay directly from commit `59f145434695d29bdd17e4cb3adc887e84182377`, rather than inheriting the handoff summary.

For all 14 identities below:

- `classificationRoute = READY_GENERIC_EXTENSION`;
- `blockedBy = []`;
- `requiredCapabilities = [CARD_ACTION_PLAY, GENERIC_CARD_ZONE]` exactly;
- semantic axes contain only `ACTION` timing with `DRAW_CARDS` and `PLAY_SELECTED_CARDS` effects; no target, binding, condition, cost, lifecycle, modifier, visibility, battle, or special axis is present;
- the frozen source overlay is structurally identical: draw 1 when the source is played in the same batch as one basic attack, plus action-phase optional play of up to 3 controller-hand cards with base power at most 3;
- the optional-play half matches the independently accepted TO13 private optional hand-play contract;
- the draw primitive is accepted by FB2-06;
- the formerly missing source-play trigger half is now independently accepted by FB2-08/R25.

Exact migration membership:

- `servant.boudica.skill.sc-boudica-3`
- `servant.constantine.skill.sc-constantine-1`
- `servant.drake.skill.sc-drake-1`
- `servant.hephaistion.skill.sc-hephaistion-3`
- `servant.iskandar.skill.sc-iskandar-1`
- `servant.ivan.skill.sc-ivan-3`
- `servant.mandricardo.skill.sc-mandricardo-3`
- `servant.martha.skill.sc-martha-3`
- `servant.medb.skill.sc-medb-1`
- `servant.medusa.skill.sc-medusa-1`
- `servant.odysseus.skill.sc-odysseus-3`
- `servant.roberts.skill.sc-roberts-3`
- `servant.teach.skill.sc-teach-3`
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-3`

Okita is excluded because its repeat-play / after-each-use draw semantics are materially different.

## F4 dispatch consequence

The first honest Phase-3 full-roster migration gate is now met at **14 exact IDs**, inside the implementation-plan requirement of 10–40 IDs under one accepted composite contract. `P3-FM01` is therefore `READY` for a separate Codex S authoring-only migration PR.

S must consume the accepted contracts without changing runtime or metric definitions. A must independently measure before/after burn-down after the S candidate. R must then review the migration from a fresh worktree; neither S nor A may self-promote F4 acceptance.
