# P3-FM08 Game-Start Rule Overrides — Migration Result

Date: 2026-09-16
Owner: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Base / A synchronization: `d52941c86cb06e69fa76c14bb1936a733748753f`
Accepted runtime: FB2-14 candidate `86afe51311ff2b6cd05ea403044e8e226b0cde7d`, R39 `62d355513d7fff66c4f3752f891f8ec326cf70f3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Pre-FM08 accepted canonical overlap: `101/944`

## Exact migration set

FM08 materializes exactly the ten A-frozen and R39-independently-reproduced identities:

1. `master.bazett.skill.s1b`
2. `master.caules.skill.s1a`
3. `master.fiore.skill.s2`
4. `master.fiore.skill.s3`
5. `master.fiore.skill.s4`
6. `master.irisviel.skill.s1`
7. `master.peperoncino.skill.s1a`
8. `master.sieg.skill.s1`
9. `master.waver.skill.s1`
10. `master.zouken.skill.s5`

A direct canonical-ID scan after migration finds `10` rows, `10` unique IDs, and `0` missing members. Leonardo s1a and Ophelia s1a are absent from the migration diff.

## Canonical archives

Eight migration archives carry the ten cards:

- Bazett: one card;
- Caules: one card;
- Fiore: three cards;
- Irisviel FM08 slice: one card;
- Peperoncino: one card;
- Sieg: one card;
- Waver: one card;
- Zouken: one card.

The existing `data/authoring/masters/master.irisviel.json` is part of the locked `fd-playtest-v1` pack and already contains a non-F1 placeholder id (`master.irisviel.skill.proxy-master`) plus unrelated accepted content. Replacing that card changed the locked generated-content hash. FM08 therefore restores the playtest archive byte-for-byte to the A-sync base and materializes the canonical F1 identity in `master.irisviel.fm08.json`, retaining archive owner id `master.irisviel` and card owner `{ type: "master", id: "master.irisviel" }`. This isolates full-roster authoring migration from the playtest pack and keeps deterministic generated artifacts unchanged.

No existing user/agent authoring content is removed by FM08.

## Frozen evidence / static metadata

Every migrated card carries:

- exact frozen F1 printed text;
- frozen source-reference set;
- frozen clause locator/hash evidence;
- whole source-text SHA-256;
- locked Reference commit and legacy skill id;
- Reference card-face metadata: `typeLabel=被动`, `cost=0`, `basePower=0`, `legacyRequirement=null`;
- accepted contract marker `P3-R39/FB2-14`.

All ten whole-text SHA-256 values are asserted by the focused migration test, including the two-line Fiore s4 text with whole-text hash `b750f78e112432917ec6c612124040ca6f3c9f9a538943c2daeaea78e536364c`.

## Structural mapping

Each card contains exactly one automatic forced `game_start` ability and no conditions, targets, costs, creates, rule modifiers, lifecycle, limit, or visibility behavior. Loader normalization of an empty response window produces only the accepted defaults.

The ten cards map only to the accepted typed whitelist:

- Bazett s1b -> first logical day total Power `-2`;
- Caules s1a -> non-climax Situation mana grant cap `1`;
- Fiore s2 -> own Action/Combat movement lock;
- Fiore s3 -> regular/climax round positive-mana cap `2/4`;
- Fiore s4 -> lower-VP battle participant total Power `-2` plus Situation Noble Phantasm forbid -> master-skill Power lock `0`;
- Irisviel s1 -> command-spell phase replacement to Advance;
- Peperoncino s1a -> viewer-scoped opponent discard visibility;
- Sieg s1 -> extra regular attack-play allowance at authoritative mana `>=11`;
- Waver s1 -> viewer-scoped face-down-event visibility;
- Zouken s5 -> ignore only Situation-origin Noble Phantasm play forbids.

The migration changes no runtime file and adds no identity/name/printed-text routing.

## Focused validation

New focused suite:
`packages/rules/tests/fm08-game-start-rule-overrides-authoring.test.ts`

Result: `5/5 PASS`.

It proves:

1. exact ten canonical IDs and locked owner/static metadata;
2. exact frozen F1 whole-text hashes/evidence;
3. blocker-free loading and exact FB2-14 fail-closed classifier acceptance;
4. all ten real migrated cards install their expected typed state through the trusted `game_start` path;
5. the pre-existing playtest Irisviel archive is unchanged while canonical s1 is isolated in the FM08 slice.

Combined FM08 + FB2-14 focused set: `2 files / 14 tests PASS`.

## Full validation

- fresh offline dependency install: PASS, `0 vulnerabilities`;
- `npm.cmd run typecheck`: PASS;
- rules regression + core: `66 files / 394 tests PASS`;
- `npm.cmd run content:validate`: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `120 files / 736 tests PASS`;
- `git diff --check`: PASS;
- runtime diff under `packages/rules/src`: `0` files.

## Coverage / automation audit

Fresh post-materialization coverage is:

- archives `98` (`+8` from A-sync baseline);
- cards `133` (`+10`);
- abilities `232` (`+10`);
- compiled playtest definition hash unchanged: `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled playtest cards/characters `70 / 14`;
- blocking issues `0`;
- `newRuntimeSemanticRouted=22`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=127`;
- `dualRuntime=0`;
- `notClassifiable=80`;
- `taxonomyWarnings=124`.

Fresh automation audit reports `legacyResolveEffect=127`, `legacyExecuteAbility=3`, `notClassifiable=80`, `promotionFindings=20`.

The ten new authoring abilities intentionally remain taxonomy-unpromoted in Phase3 coverage; FM08 does not modify coverage/taxonomy classification merely to improve KPI presentation. Runtime executability is instead proved by the accepted FB2-14 classifier and the real-authoring `game_start` focused tests. Regenerated coverage/audit artifacts are intentionally excluded from the migration candidate commit.

## Scope / overlap accounting

- authoring cards added: exactly `10`;
- authoring archive slices added: `8`;
- runtime source diff: `0`;
- taxonomy/KPI implementation diff: `0`;
- Leonardo s1a: `0`;
- Ophelia s1a: `0`;
- unrelated canonical identities in migration archives: `0`;
- material canonical overlap after S candidate: `111/944`;
- accepted canonical overlap remains `101/944` until A synchronizes this exact candidate and an independent migration reviewer accepts FM08.

## Reviewer handoff

The next gate must independently review the exact S candidate without fixing it. It should verify the ten-member denominator from frozen F1/Reference rather than trusting this report, exact source-text/static metadata, the Irisviel playtest-isolation decision, structural classifier acceptance, trusted `game_start` installation for every member, zero runtime/taxonomy/unrelated-authoring diff, unchanged playtest determinism, material coverage `98/133/232`, and the distinction between material `111/944` and accepted `101/944`.
