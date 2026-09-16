# P3-A FM08 Migration Synchronization — 2026-09-16

Role: Codex A
Status: `MIGRATION_SYNC_CANDIDATE`
S candidate: `8d87dfc6fd9032e45b893425c74ede0de9920fff`
S base / accepted FB2-14 synchronization: `d52941c86cb06e69fa76c14bb1936a733748753f`
R39 runtime/family acceptance: `62d355513d7fff66c4f3752f891f8ec326cf70f3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Independent frozen-F1 burn-down

A recomputed the canonical overlap against the frozen reviewed F1 inventory at `fefc34550cf2f71797e724d7170803f9c24e6221` rather than inheriting S counts.

- frozen static identities: `943`;
- frozen dynamic identities: `1`;
- denominator: `944`;
- current unique frozen identities found in canonical authoring: `111`;
- duplicate frozen canonical IDs: `0`;
- remaining outside canonical authoring: `833`;
- exact FM08 additions: `10`;
- subtracting the exact FM08 set reproduces the pre-FM08 baseline: `101/944`.

The exact ten current identities are present once each and there are no unauthorized additions in the S diff. Material overlap is therefore `111/944`; accepted overlap remains `101/944` until R40 independently accepts FM08.

## Independent source/static reconciliation

A re-read and SHA-256 hashed the current migrated printed text for all ten identities. The hashes independently reproduce:

- Bazett s1b: `9847f0953309d542a783f1553153ccbf2bf08a3c008674caadd067ef2b9e7071`;
- Caules s1a: `16dc09cc37b8a95665d4fb5301e6048b0be422af19b9836d3fff07d9ef7e3c32`;
- Fiore s2: `e9646624a773a5a21ca08c3d63e072da56126dad075d4842d44faac9a95ec6e9`;
- Fiore s3: `01a78c3d1650a32f187bf1b292e15807727370e11928021d7b91e7125ce3c2ac`;
- Fiore s4 whole text: `b750f78e112432917ec6c612124040ca6f3c9f9a538943c2daeaea78e536364c`;
- Irisviel s1: `d880afd3807b56ddd0ae4c2ad35829fc7991428aee15438515ade2ade66bf9fd`;
- Peperoncino s1a: `24da87d334a23689f9ef2d6607cd74ec0e9bfde162a49835f7e453afcd282cb2`;
- Sieg s1: `215e0d96a9ee5e00825eb43ceda139f008e0047c9b0195e733f96eaf89d0c089`;
- Waver s1: `c4004b02a61eb2cefa01526f174f4fb7815644f4267735020b2507177797058f`;
- Zouken s5: `1bfe9fda4911dd95b0e6ef1462140b1d7e20cdacdd03df524fae374509bc668f`.

Every card independently reports locked Reference metadata from `b2f9fa15...`: `Master`, `master_skill`, `被动`, printed cost `0`, base Power `0`, and `legacyRequirement=null`, with the correct legacy skill id. Fiore s4 remains the one two-clause/two-rule card and its whole text identity is preserved.

## Irisviel isolation audit

The S diff does not modify the existing playtest `data/authoring/masters/master.irisviel.json`. Canonical frozen `master.irisviel.skill.s1` is materialized in the separate full-roster slice `master.irisviel.fm08.json`, with archive owner id and card owner still `master.irisviel`.

A accepts this as migration isolation rather than duplicate canonical identity: frozen-ID scan finds canonical s1 exactly once, while the old playtest placeholder retains its distinct non-F1 id. Generated playtest content therefore remains byte-deterministic.

## Fresh A coverage / recertification

Fresh A material coverage:

- archives `98`;
- cards `133`;
- abilities `232`;
- `newRuntimeSemanticRouted=22`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=127`;
- `dualRuntime=0`;
- `notClassifiable=80`;
- `taxonomyWarnings=124`;
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

The +10 `notClassifiable` rows are a Phase3 coverage-taxonomy presentation gap, not an execution gap. A does not alter taxonomy during migration synchronization. Because authoring material changed, the freshly generated coverage artifact is part of the A-sync evidence.

Fresh A checks:

- `npm.cmd ci --offline --ignore-scripts`: PASS, 0 vulnerabilities;
- `npm.cmd run typecheck`: PASS;
- FM08 real-authoring + FB2-14 focused: `2 files / 14 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- S rules regression/core: `394/394 PASS`;
- S standard full CI: `736/736 PASS`;
- runtime diff from exact pre-FM08 A-sync `d52941c8...`: `0` files;
- migration diff is eight authoring slices, one focused test and one S report only;
- `git diff --check`: PASS at S candidate.

## Gate state

A certifies `MIGRATION_SYNC_CANDIDATE`, not final acceptance. P3-R40 is READY from this exact synchronized lineage. Accepted overlap must remain `101/944` until R40 independently accepts FM08; only then may it advance to `111/944`.
