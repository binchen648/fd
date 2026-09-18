# P3-A R61 Lostbelt Objective Event Definitions Migration Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact Base: `1c33320b468825dd7e37b5ede6645bb29e5ee333` (R61 FB2-28 acceptance synchronization)
- Formal accepted overlap: `127/944` (`13.45%`)
- Remaining frozen identities: `817`
- Accepted runtime dependency: FB2-28 Revision Candidate `69f2fb09ca951957148f965df459bb3063323800` / R61 `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

This dispatch authorizes one S migration family only. It does not itself earn frozen credit.

## Private readiness overlay result

After accepting FB2-28, A privately rechecked the twelve event-card-rule upper-bound consumers. Four are dependency-complete and form one honest homogeneous `core.lostbelt-objective` event-definition family:

1. `master.kadoc.skill.s3` — 冻土
2. `master.ophelia.skill.s5` — 苏尔特领域
3. `master.ophelia.skill.s6` — 女武神领域
4. `master.ophelia.skill.s7` — 斯卡蒂领域

The other eight remain outside this dispatch because they still require additional semantics beyond FB2-28 (location-scoped exit lock, round VP tracking, permanent expansion exclusion, delayed replacement/sum semantics, dynamic source scaling, God Heritage state, or separate game-start interaction feasibility). Do not include them to increase batch size.

## Authoritative frozen evidence

Exact F1 printed-text SHA-256:

- `master.kadoc.skill.s3`: `7f4096a58df09a1825d0c53beb69855d7ab8a1ebb6107ea5829cb63f5d7259c8`
- `master.ophelia.skill.s5`: `72132a0e0a1700a58297838ad872a5c4eeb6f62f21855d0432cc427be5fa2343`
- `master.ophelia.skill.s6`: `321b2706f9b0fd3761bb1086ff16699d199901738418e0292cccfefdba8dbbb2`
- `master.ophelia.skill.s7`: `f1356fe8da0d2d55f4d97b21781f488e96b91eb42f97203c9985e6838e56ea4b`

Clause hashes:

- Kadoc s3: `79b43e85325b94864cb8006cc67f7635a9bb4313ef3d3d8ac740fd6ba897c3a5`, `d8cd9a53abcbde4a35dd65a15be52b21f172a8dbb1d85aa9c206c75a9bf56fde`
- Ophelia s5: `0f2245e361a2aa3a68160131f937db89ee46d70af9d4e4bbe44e80e38ec651f2`, `e7f59257ade03c3ed3f68c1496641747d3f09d8bb61adb9328332ec9f3d2e8d2`
- Ophelia s6: `0f2245e361a2aa3a68160131f937db89ee46d70af9d4e4bbe44e80e38ec651f2`, `4bf3d381fcba33b51a514e391d8181866821932309cb582e8de3b85f6aaf30d6`
- Ophelia s7: `0f2245e361a2aa3a68160131f937db89ee46d70af9d4e4bbe44e80e38ec651f2`, `5d7d47df8b72504df2b48c6e9de637165ab2272cf9f983957f3101a756759678`

Locked Reference may corroborate static metadata only. Historical handler `core.lostbelt-objective` is family evidence, not runtime routing.

## Required representation

Use the accepted FB2-28 rules-only event representation:

- exact archive discriminator `event_rule_definition_archive`;
- `cardType: event`;
- standalone authoring archive(s) under `data/authoring/**`;
- do not register into production `data/packs/fd-playtest-v1/pack.json`;
- do not create ordinary player cards, masters/servants, characters, decks, fallback command spells, or random event-set product membership.

One archive may contain all four cards because they are one homogeneous Lostbelt objective event-definition family. If S finds owner/source provenance clearer with two archives (Kadoc/Ophelia), that is also acceptable; do not add unrelated identities.

## Exact semantic mapping

### Kadoc s3 — 冻土

Printed semantics:

- Russian event definition;
- printed reward `1`;
- quantity `5` is static family metadata/evidence, not a request to spawn five production product cards in this migration;
- players deployed to this event battlefield immediately lose `2` mana;
- players entering this event battlefield lose `2` mana.

Use only accepted FB2-28 event-source context and existing generic mana primitives. Both triggers must derive battlefield location from the authoritative event placement; no identity/handler route.

### Ophelia s5/s6/s7

These are static Nordic event definitions with printed reward `4`, quantity `2`, and exact battlefield attribute modifiers:

- s5: Strength `+4`, Agility `-2`
- s6: Agility `+4`, Magecraft `-2`
- s7: Magecraft `+4`, Strength `-2`

Represent the modifiers through accepted generic event metadata only. No executable handler is required unless the accepted event-rule representation mechanically requires one; do not invent trigger behavior for static modifiers.

## Provenance / safety requirements

Each migrated card must include Phase 3 evidence for:

- exact F1 commit;
- exact frozen printed text and SHA-256;
- exact F1 clause hashes;
- locked Reference commit/static metadata where available;
- accepted contract reference `P3-R61/FB2-28`.

No production/runtime routing may branch on these four canonical IDs, owner names, Chinese printed text, `core.lostbelt-objective`, F1 hashes, or Reference SHA.

## S scope

S may touch only:

- the minimal new standalone event-rule authoring archive file(s);
- one focused migration test proving the real migrated definitions compile and execute through accepted FB2-28 behavior;
- one migration result report.

Do not modify `packages/rules/src/**`, content compiler/runtime implementation, production pack files, generated product blobs, F1/taxonomy/KPI data, apps, or historical FM09/FM10 state.

## Required focused evidence

At minimum prove with the real migrated definitions:

- exact four IDs and frozen full-text/clause hashes;
- exact `event_rule_definition_archive` representation;
- no fifth identity;
- Kadoc s3 source-battlefield deploy/enter triggers each apply exactly `-2 mana`, wrong battlefield does not trigger, same event-id replay is idempotent;
- Ophelia s5/s6/s7 compile exact printed rewards and exact attribute modifiers;
- rules-only definitions remain outside ordinary player/product surfaces;
- no runtime/source diff and no production pack/generated diff;
- Base frozen overlap `127/944`, Candidate material `131/944`, exact four additions, zero removals, zero duplicate frozen IDs;
- official typecheck, focused test, full CI, rules suite, content validate/compile/determinism, client build, Reference verify, coverage/audit, `git diff --check`, final cleanliness.

## Accounting

This A dispatch earns zero credit. Formal accepted remains **`127/944`**, `817` remaining.

If S produces exactly the four authorized frozen identities, Candidate material may reach **`131/944`**. That number is not formal accepted until fresh independent R returns `MIGRATION_ACCEPTED` and a later A synchronization records it.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is started.
