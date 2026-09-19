# P3-A R63 Lostbelt Objective Event Definitions Migration Re-Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact Base: `0466e8013c8fb42645370e9e15777055ef039973` (R63 FB2-29 acceptance synchronization)
- Formal accepted overlap: `127/944` (`13.45%`)
- Remaining frozen identities: `817`
- Accepted runtime dependency: FB2-28 `69f2fb09ca951957148f965df459bb3063323800` / R61 accepted
- Accepted static event metadata dependency: FB2-29 Revision Candidate `cd1b55e7143541605cc786745fafe053c5addf5a` / R63 `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Prior blocked dispatch: `5d6a9982c0fead6c28fa73446f68ccf31562048c`
- Prior S blocker evidence: `c735b235af3ab273a8daabffeae71db81809250a` / `MIGRATION_BLOCKED`

This re-dispatch authorizes exactly the same four-card homogeneous family. It does not itself earn frozen credit.

## Authorized migration family

1. `master.kadoc.skill.s3` — 冻土
2. `master.ophelia.skill.s5` — 苏尔特领域
3. `master.ophelia.skill.s6` — 女武神领域
4. `master.ophelia.skill.s7` — 斯卡蒂领域

Do not add any fifth identity.

## Why the prior blocker is now closed

Fresh S previously proved Kadoc s3 was expressible through accepted FB2-28 event-source triggers and generic mana adjustment, while Ophelia s5/s6/s7 were blocked because rules-only event authoring could not compile static battle modifiers into `eventCatalog.battleModifiers`.

R63 accepted FB2-29, which now provides the missing identity-free rules-only `cardFace.battleModifiers` compiler path with exact-type fail-closed validation. No other blocker was found by the prior S preflight.

## Frozen evidence

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

Locked Reference may corroborate static metadata only. Historical handler `core.lostbelt-objective` is evidence, never runtime routing.

## Required representation

Use the accepted FB2-28 + FB2-29 rules-only event representation:

- exact discriminator `event_rule_definition_archive`;
- `cardType: event`;
- standalone authoring archive(s) under `data/authoring/**`;
- do not register into production `data/packs/fd-playtest-v1/pack.json`;
- do not create ordinary player cards, characters, decks, fallback command spells, or random event-set membership.

One archive containing all four cards is acceptable and preferred for this homogeneous family.

### Kadoc s3

- printed reward `1`;
- quantity `5` is static provenance/family metadata only, not five product cards;
- deployment to the event battlefield applies `-2 mana` to the deployed player;
- entering that event battlefield applies `-2 mana` to the entering player;
- both effects derive the authoritative battlefield from the event placement and use accepted generic FB2-28 event source/controller semantics;
- wrong battlefield must not trigger; replay of the same event ID must be idempotent.

### Ophelia s5/s6/s7

Printed reward `4`, quantity `2`, with exact static battlefield modifiers:

- s5: Strength `+4`, Agility `-2`;
- s6: Agility `+4`, Magecraft `-2`;
- s7: Magecraft `+4`, Strength `-2`.

Use accepted FB2-29 `cardFace.battleModifiers` only. These are static modifiers; do not invent trigger semantics.

## Provenance / safety

Each card must preserve exact F1 evidence (commit, frozen printed text SHA-256, clause hashes) and accepted contract lineage (`P3-R61/FB2-28`, `P3-R63/FB2-29`).

No production/runtime/compiler routing may branch on these IDs, owner names, Chinese printed text, `core.lostbelt-objective`, F1 hash, Reference SHA, or Reference handler IDs.

## S scope

S may touch only:

- minimal standalone event-rule authoring archive file(s);
- one focused migration test using the real migrated definitions;
- one migration result report.

Do not modify `packages/rules/src/**`, `packages/content/src/**`, production pack files, generated product blobs, F1/taxonomy/KPI data, apps, scripts, or historical FM09/FM10 state.

## Required evidence

At minimum prove:

- exact four IDs and exact frozen full-text/clause hashes;
- exact `event_rule_definition_archive` representation and no fifth identity;
- Kadoc s3 deploy/enter behavior `-2 mana`, wrong battlefield isolation, replay idempotency;
- Ophelia s5/s6/s7 exact printed reward and exact compiled battle modifiers;
- all four definitions stay outside ordinary product/player surfaces;
- Base overlap `127/944`; Candidate material `131/944`; exact four additions; zero removals; zero duplicates;
- no runtime/content-compiler production source diff and no production pack/generated diff;
- typecheck, focused tests, rules suite, official CI, content validate/compile/determinism, client build, locked Reference, coverage/audit, `git diff --check`, final cleanliness.

## Accounting

This dispatch earns zero credit. Formal accepted remains **`127/944`**, `817` remaining.

If S produces exactly these four identities, Candidate material may reach **`131/944`**. Formal accepted may move only after fresh independent R returns `MIGRATION_ACCEPTED` and a later A synchronization records it.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is started.
