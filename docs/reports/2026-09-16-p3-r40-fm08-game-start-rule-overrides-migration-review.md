# P3-R40 FM08 Game-Start Rule Overrides — Independent Migration Review

Date: 2026-09-16
Owner: Codex R
Verdict: `MIGRATION_ACCEPTED`
A-synchronized lineage: `74d1249679d8075a8d682bbc678af47a122070dd`
S candidate: `8d87dfc6fd9032e45b893425c74ede0de9920fff`
Pre-FM08 A synchronization: `d52941c86cb06e69fa76c14bb1936a733748753f`
Accepted runtime review: R39 `62d355513d7fff66c4f3752f891f8ec326cf70f3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Verdict

R40 independently accepts the exact ten-member FM08 migration. No blocking finding remains.

FM08 accepted canonical overlap may now advance from `101/944` to `111/944`; `833/944` frozen identities remain outside accepted canonical authoring.

## Independent scope audit

The reviewer worktree was created directly from exact A-synchronized SHA `74d1249679d8075a8d682bbc678af47a122070dd`.

The S migration diff from pre-FM08 base `d52941c8...` is exactly:

- eight new full-roster master archive slices;
- one FM08 authoring-focused test;
- one S migration report;
- production runtime diff under `packages/rules/src`: `0` files;
- existing `data/authoring/masters/master.irisviel.json`: unchanged;
- `git diff --check`: PASS.

No runtime, taxonomy/KPI implementation, unrelated authoring, Leonardo s1a, or Ophelia s1a is included.

## Independent frozen-family reconciliation

R40 independently inspected the frozen reviewed F1 inventory at `fefc34550cf2f71797e724d7170803f9c24e6221` and reconfirmed that locked Reference handler `core.game-start-rule-flags` has `17` handler-linked F1 identities. The accepted FB2-14/R39 executable boundary excludes the five special/blocked rows plus Leonardo s1a and Ophelia s1a for the already-reviewed missing/dependent-consumer reasons, leaving exactly the same ten self-contained FM08 identities:

- `master.bazett.skill.s1b`;
- `master.caules.skill.s1a`;
- `master.fiore.skill.s2`;
- `master.fiore.skill.s3`;
- `master.fiore.skill.s4`;
- `master.irisviel.skill.s1`;
- `master.peperoncino.skill.s1a`;
- `master.sieg.skill.s1`;
- `master.waver.skill.s1`;
- `master.zouken.skill.s5`.

Current authoring contains every target exactly once. Leonardo/Ophelia target identities remain absent from the FM08 migration material.

## Independent source / static metadata audit

R40 re-hashed current printed text instead of trusting S/A reports. Exact SHA-256 results:

- Bazett s1b `9847f0953309d542a783f1553153ccbf2bf08a3c008674caadd067ef2b9e7071`;
- Caules s1a `16dc09cc37b8a95665d4fb5301e6048b0be422af19b9836d3fff07d9ef7e3c32`;
- Fiore s2 `e9646624a773a5a21ca08c3d63e072da56126dad075d4842d44faac9a95ec6e9`;
- Fiore s3 `01a78c3d1650a32f187bf1b292e15807727370e11928021d7b91e7125ce3c2ac`;
- Fiore s4 whole text `b750f78e112432917ec6c612124040ca6f3c9f9a538943c2daeaea78e536364c`;
- Irisviel s1 `d880afd3807b56ddd0ae4c2ad35829fc7991428aee15438515ade2ade66bf9fd`;
- Peperoncino s1a `24da87d334a23689f9ef2d6607cd74ec0e9bfde162a49835f7e453afcd282cb2`;
- Sieg s1 `215e0d96a9ee5e00825eb43ceda139f008e0047c9b0195e733f96eaf89d0c089`;
- Waver s1 `c4004b02a61eb2cefa01526f174f4fb7815644f4267735020b2507177797058f`;
- Zouken s5 `1bfe9fda4911dd95b0e6ef1462140b1d7e20cdacdd03df524fae374509bc668f`.

All ten independently expose locked Reference static metadata at `b2f9fa15...`: `master_skill`, `被动`, cost `0`, base Power `0`, `legacyRequirement=null`, with the correct legacy skill id.

Fiore s4 is correctly the single dual-rule card: lower-VP battle total-Power `-2` plus Situation Noble Phantasm forbid -> controller master-skill Power final lock `0`.

## Irisviel isolation audit

R40 independently verifies that the existing playtest `master.irisviel.json` is unchanged between the pre-FM08 base and S candidate. The old playtest placeholder keeps its distinct non-F1 id, while frozen canonical `master.irisviel.skill.s1` appears exactly once in `master.irisviel.fm08.json` with owner/archive identity `master.irisviel`.

This preserves locked playtest generated-content identity without creating a duplicate frozen canonical ID.

## Exact structural/runtime conformance

The real migrated authoring suite loads all eight archive slices blocker-free and verifies every real ability against the accepted FB2-14 exact classifier.

Each migrated card installs typed authoritative state through trusted `game_start`; the ten mappings independently exercised are:

- Bazett first-logical-day total-Power adjustment;
- Caules non-climax Situation mana cap;
- Fiore movement lock;
- Fiore round mana budget;
- Fiore dual battle/master-Power overrides;
- Irisviel command-spell phase replacement;
- Peperoncino opponent-discard viewer permission;
- Sieg prospective extra attack allowance;
- Waver face-down-event viewer permission;
- Zouken Situation-only Noble Phantasm forbid exemption.

No ID/name/printed-text runtime routing is introduced by FM08.

## Independent dynamic validation

R40 used a fresh reviewer worktree and fresh offline install.

- `npm.cmd ci --offline --ignore-scripts`: PASS, `0 vulnerabilities`;
- `npm.cmd run typecheck`: PASS;
- FM08 + FB2-14 focused: `2 files / 14 tests PASS`;
- rules regression + core: `66 files / 394 tests PASS`;
- content validate: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- deterministic generated-content hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `120 files / 736 tests PASS`;
- fresh coverage: archives `98`, cards `133`, abilities `232`, raw `22/3/127/0/80/124`, compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, blocking issues `0`.

Fresh reviewer coverage regeneration only changes the local generated artifact metadata after the A-synchronized coverage artifact; it is excluded from this review commit.

## Acceptance accounting

The frozen denominator remains `944`. A independently counted `111` unique frozen identities with zero duplicates on the synchronized lineage, and R40 finds no scope/source/runtime defect in the exact ten-member addition.

Therefore:

- material canonical overlap: `111/944`;
- accepted canonical overlap after R40: `111/944`;
- remaining outside accepted canonical authoring: `833/944`.

FM08 is `MIGRATION_ACCEPTED`.
