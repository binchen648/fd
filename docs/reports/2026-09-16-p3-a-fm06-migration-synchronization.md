# P3-A FM06 Migration Synchronization - 2026-09-16

Role: Codex A
Status: `MIGRATION_SYNC_CANDIDATE`
S candidate: `ebc1ca575fcef0e3894b13ec10613801e4227970`
S base / accepted FB2-12 synchronization: `35aa5ef063fe6d8c6c611f70f0696bf111a80657`
R35 runtime/family acceptance: `ee3367b1ea17e6db9d98b1ae42d769fae6122d5e`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Exact frozen-F1 burn-down

A independently recomputed the migration burn-down from the frozen F1 inventory rather than inheriting S's result.

Frozen F1 explicitly records:

- static identities: `943`;
- dynamic identities: `1` (`master.tiamat.card.life-sea`);
- authoritative total denominator: `944`.

FM06 material reconciliation:

- canonical static overlap before FM06: `79 / 943`;
- canonical static overlap after FM06: `91 / 943`;
- project-wide material overlap: `91 / 944`;
- project-wide absent identities: `853 / 944` (`852` absent static plus the one dynamic identity);
- net canonical increase: `+12`;
- exact newly added set: the twelve authorized Presence Concealment identities;
- unauthorized F1 additions: `0`;
- F1 removals: `0`;
- selected FM06 members skipped: `0`.

This is material state only. Independently accepted migration overlap remains `79/944` until R36 accepts FM06.

## Source, metadata, and archive integrity

A rechecked all twelve cards against frozen F1 and locked Reference:

- full-text SHA is `29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f` for all 12;
- four common F1 clause-source SHAs remain exact:
  - `ee2d737d979d2141319a55ff72d275847a90be89e5173c3f5030e2083d4dc4cb`;
  - `1e518f04fe63700d7a456ca83de546eb681dd9993f483be7598e5bdac7830b25`;
  - `0484d7c0b9f4cef66623fdfe67831240d883b04f3203f2acc7e2d6151c2a8217`;
  - `1f105508aace520b9a8b6703d50633c174f754856c10c4040b05570cfca0b871`;
- locked Reference handler remains `core.presence-concealment`;
- locked static metadata remains Swift / cost 3 / base Power 4 / historical requirement 3;
- Kiritsugu remains Reference class `Master`; the other selected owners remain `Assassin`;
- Sion EX is not included;
- final skill-zone gate is 8 mana while printed card cost remains 3.

Semiramis already contained the accepted FM05 Territory Creation card. A compared `servant.semiramis.skill.sc-semiramis-2` between the exact pre-FM06 base and S candidate and obtained exact JSON object equality. FM06 adds skill1 without altering the prior skill2 semantic object.

## Fresh A material coverage

Fresh A coverage reproduces the S material state:

- archives `69 -> 80`;
- cards `101 -> 113`;
- abilities `200 -> 212`;
- `newRuntimeSemanticRouted=22` unchanged;
- `legacyExecuteAbility=3` unchanged;
- `legacyResolveEffect=127` unchanged;
- `dualRuntime=0` unchanged;
- `notClassifiable=48 -> 60`;
- `taxonomyWarnings=124` unchanged;
- source fingerprint `8bbbca216337b427509dd0dd133ef4515ede49c443937115ff9372259cd23ec4`;
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

The twelve new optional-trigger authoring abilities are reported as `NOT_CLASSIFIABLE` by the legacy coverage taxonomy, causing only the expected `+12` there. This reporter label does not revoke R35's runtime semantic acceptance and A does not redefine taxonomy during migration synchronization.

Because the authoring corpus changed materially, `artifacts/phase3-skill-coverage.json` is committed by A.

## Independent A recertification

- fresh dependency install: PASS;
- typecheck: PASS;
- FM06 + FB2-12 + FM05 focused: `3 files / 20 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- deterministic generated-content hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- S rules regression/core + FM05/FM06 authoring evidence: `66 files / 388 tests PASS`;
- S standard full CI: `118 files / 720 tests PASS`;
- runtime production diff from the accepted pre-FM06 A-sync base: `0`;
- `git diff --check`: PASS.

## Gate state

A certifies `MIGRATION_SYNC_CANDIDATE`, not final migration acceptance. P3-R36 is READY on this exact A-synchronized lineage and must independently judge FM06 before accepted overlap may move from `79/944` to `91/944`.
