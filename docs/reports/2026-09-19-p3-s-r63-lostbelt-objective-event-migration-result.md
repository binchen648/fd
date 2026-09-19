# P3-S R63 Lostbelt Objective Event Definitions Migration Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Exact lineage

- Exact A dispatch Base: `64457098542e0b3c3701c2dacce08826c70bf1c0`
- R63 FB2-29 acceptance sync behind dispatch: `0466e8013c8fb42645370e9e15777055ef039973`
- Accepted FB2-28 capability: `69f2fb09ca951957148f965df459bb3063323800` / R61
- Accepted FB2-29 Revision Candidate: `cd1b55e7143541605cc786745fafe053c5addf5a` / R63
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Prior blocked S evidence: `c735b235af3ab273a8daabffeae71db81809250a`

Formal recovery accepted remains `127/944` until fresh R accepts this Candidate and A performs acceptance synchronization.

## Migrated homogeneous family

Exactly four frozen identities were added in one standalone rules-only event archive:

- `master.kadoc.skill.s3` — 冻土
- `master.ophelia.skill.s5` — 苏尔特领域
- `master.ophelia.skill.s6` — 女武神领域
- `master.ophelia.skill.s7` — 斯卡蒂领域

No fifth frozen identity is present.

Authoring file:

`data/authoring/rules/lostbelt-objective-kadoc-ophelia.json`

It uses exact discriminator `event_rule_definition_archive`. It is intentionally not registered in `data/packs/fd-playtest-v1/pack.json`, so the existing production 7-master / 7-servant / 20-event product remains unchanged.

## Frozen evidence

The authored full printed text hashes reproduce F1 exactly:

- Kadoc s3: `7f4096a58df09a1825d0c53beb69855d7ab8a1ebb6107ea5829cb63f5d7259c8`
- Ophelia s5: `72132a0e0a1700a58297838ad872a5c4eeb6f62f21855d0432cc427be5fa2343`
- Ophelia s6: `321b2706f9b0fd3761bb1086ff16699d199901738418e0292cccfefdba8dbbb2`
- Ophelia s7: `f1356fe8da0d2d55f4d97b21781f488e96b91eb42f97203c9985e6838e56ea4b`

Clause hashes are preserved exactly:

- Kadoc s3: `79b43e85325b94864cb8006cc67f7635a9bb4313ef3d3d8ac740fd6ba897c3a5`, `d8cd9a53abcbde4a35dd65a15be52b21f172a8dbb1d85aa9c206c75a9bf56fde`
- Ophelia s5: `0f2245e361a2aa3a68160131f937db89ee46d70af9d4e4bbe44e80e38ec651f2`, `e7f59257ade03c3ed3f68c1496641747d3f09d8bb61adb9328332ec9f3d2e8d2`
- Ophelia s6: `0f2245e361a2aa3a68160131f937db89ee46d70af9d4e4bbe44e80e38ec651f2`, `4bf3d381fcba33b51a514e391d8181866821932309cb582e8de3b85f6aaf30d6`
- Ophelia s7: `0f2245e361a2aa3a68160131f937db89ee46d70af9d4e4bbe44e80e38ec651f2`, `5d7d47df8b72504df2b48c6e9de637165ab2272cf9f983957f3101a756759678`

Locked Reference is used only for corroborating static Lostbelt pool/tag/quantity/VP metadata; `core.lostbelt-objective` is not used as a runtime route.

## Executable representation

### Kadoc s3

- `cardType: event`
- printed reward `1`
- quantity `5` retained as provenance/static family metadata, not materialized as five frozen identities
- deployment trigger: `after_player_deployed_to_battlefield` + `eventController: event_player`
- entry trigger: `after_controller_enters_location` + `eventController: event_player`
- both use structural `event_location_is_source_event_battlefield`
- both use generic `adjust_mana` with `-2`

The focused runtime test proves exact source-battlefield scope, wrong-battlefield isolation, and same event-ID replay idempotency.

### Ophelia s5/s6/s7

All three are static rules-only events with printed reward `4` and provenance quantity `2`.

FB2-29 `cardFace.battleModifiers` compiles exactly to:

- s5: `力量 +4`, `敏捷 -2`
- s6: `敏捷 +4`, `魔术 -2`
- s7: `魔术 +4`, `力量 -2`

All use `has_attribute`. `sourceId` is compiler-owned from the event definition ID.

## Product and runtime isolation

Base-to-Candidate adds only:

- one standalone authoring JSON archive;
- one focused migration test;
- this S result report.

There are zero changes under:

- `packages/rules/src/**`
- `packages/content/src/**`
- `data/packs/**`
- `data/generated/**`
- `data/phase3/**`
- `apps/**`
- `scripts/**`
- `artifacts/**`

The four definitions remain outside ordinary executable player cards, characters, decks, fallback command spells, and production event-set membership. No identity/name/printed-text/F1/Reference SHA or Reference-handler runtime branch was added.

## Mechanical frozen accounting

Independent mechanical scan of every JSON archive under `data/authoring/**` against authoritative F1 gives:

### Base

- denominator: `944 = 943 static + 1 dynamic`
- authoring archives: `111`
- cards: `150`
- unique IDs: `150`
- frozen overlap: `127/944`
- duplicate IDs: `0`

### Candidate material

- authoring archives: `112`
- cards: `154`
- unique IDs: `154`
- frozen overlap: `131/944`
- candidate-material remaining: `813`
- duplicate IDs: `0`
- exact additions:
  - `master.kadoc.skill.s3`
  - `master.ophelia.skill.s5`
  - `master.ophelia.skill.s6`
  - `master.ophelia.skill.s7`
- removals: `[]`

This is Candidate material only. Formal accepted remains **`127/944`**, formal remaining **`817`**, until fresh R returns `MIGRATION_ACCEPTED` and A synchronization records the four additions.

Historical P3-FM09 remains `MIGRATION_BLOCKED`.

## Validation

Fresh S dependency materialization:

- `npm.cmd ci --offline`: PASS from this fresh worktree, `239` packages, `0` vulnerabilities.
- The first focused invocation before workspace TypeScript build could not resolve the package export for `@fd/content`; no repository/product code was changed for that environment state. The focused test was kept self-contained against the content source boundary, then the normal typecheck/build gates were run successfully.

Gates:

- Typecheck: PASS.
- Focused migration: **`1 file / 3 tests PASS`**.
- Rules `src + core + regression`: **`82 files / 489 tests PASS`**.
- Official CI: **`143 files / 1019 tests PASS`**.
- Eleven-round MatchSession in official CI: approximately **`4512 ms / 5000 ms`**, PASS.
- Production content validate: **`7 masters / 7 servants / 20 events / 0 blocking issues`**.
- Production content compile: PASS, same counts.
- Generated determinism: PASS, unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Locked Reference verifier: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Client production build: PASS; existing Vite `node:crypto` browser-externalization warning only.
- Production Phase 3 coverage remains intentionally unchanged because the new archive is standalone/unregistered: `111 archives / 150 cards / 255 abilities`; compiled `76 / 14 / 0`; routing `22/3/135/0/95/137`.
- Automation audit remains `135/3/95/20`.
- Coverage/audit artifact side effects restored after execution.
- `git diff --check`: PASS.

## Review handoff

Fresh R must independently verify exact Base/Candidate lineage, the four F1 hashes, real temporary-manifest content/compiler path, Kadoc runtime behavior, Ophelia static modifier compilation, zero production/runtime scope widening, mechanical `127 → 131` Candidate-material additions, all gates, and final worktree/Reference/PR cleanliness.

No acceptance synchronization is authorized in S. Formal credit remains `127/944` pending fresh R and A.
