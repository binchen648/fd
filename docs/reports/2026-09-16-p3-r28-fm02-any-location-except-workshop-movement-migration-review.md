# P3-R28 FM02 Any-Location-Except-Workshop Movement Migration Review — 2026-09-16

Role: Codex R
Verdict: MIGRATION_ACCEPTED
Reviewed A-synchronized SHA: `51636bfdb337839f6b57dda25d4bb86a5572e0fb`
S candidate: `e1d8456637648d31127d6d69daeb9d74a6d01a18`
S base / P3-A-FB2-09 sync: `1fb744fcfb85f152534f66aa676984e2c4a8ac96`
Accepted runtime dependency: R27 `698dba5a8476e3d86363f286c57c9f515746eb3f`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Verdict

R28 accepts FM02 for exactly the 12 authorized Movement identities. No blocking finding remains. Reviewer did not implement or repair runtime/authoring code.

## Exact membership and burn-down

Independent review confirms:

- frozen F1 denominator: `944`;
- canonical authoring overlap: `37 -> 49` (+12);
- exact selected batch: `0/12 -> 12/12`;
- unauthorized frozen-F1 additions: `0`;
- removed frozen-F1 identities: `0`;
- skipped selected identities: `0`;
- lineage runtime source diff: `0`.

Accepted exact membership:

- `servant.benkei.skill.sc-benkei-1`
- `servant.bradamante.skill.sc-bradamante-1`
- `servant.brynhildr.skill.sc-brynhildr-1`
- `servant.cu.skill.sc-cu-2`
- `servant.diarmuid.skill.sc-diarmuid-3`
- `servant.donquixote.skill.sc-donquixote-3`
- `servant.enkidu.skill.sc-enkidu-3`
- `servant.jaguarman.skill.sc-jaguarman-1`
- `servant.kagetora.skill.sc-kagetora-3`
- `servant.lishuwen.skill.sc-lishuwen-3`
- `servant.romulus.skill.sc-romulus-3`
- `servant.vlad.skill.sc-vlad-3`

## Independent source and static metadata review

R28 read frozen F1 overlays from the accepted F1 commit and locked Reference static metadata directly. All `12/12` members pass every check:

- source/printed text SHA-256 = `5d3fd4e656083f54831c208f2e7b3c9a4ffd5977776e3a3b5214c868596ca1c0`;
- ability `printedClause` equals card `printedText`;
- one-card minimal archive only;
- Reference `cost=3`;
- Reference `basePower=5`;
- legacy Reference `requirement=3` retained only as evidence metadata;
- exact Reference type-label ordering retained (`特殊/迅捷` or `迅捷/特殊` as applicable);
- canonical play requirement is final-rule `skill_zone_mana_at_least=8`.

Li Shuwen independently resolves to an Assassin owner in locked Reference while this selected skill card preserves the source-defined Lancer-class card family. The migration does not infer mechanics from owner class.

## Accepted-contract conformance

All 12 load without adapter blockers and match the independently accepted FB2-09 semantic:

- `phase_action`;
- action phase / controller action window / active source;
- exactly one location decision;
- any enabled location except workshop and current location, subject to authoritative occupancy legality;
- controller `move_player` to the selected destination through typed Resolution Data-flow;
- no extra cost, condition, create, modifier, lifecycle, response, or limit semantics.

The newly migrated Benkei representative executes end-to-end through the typed route and emits typed resolution provenance. No identity routing is required.

## Independent validation

R28 ran from a fresh reviewer worktree at exact A synchronization SHA.

- `npm.cmd run typecheck`: PASS.
- FM02 authoring + FB2-09 + Resolution Data-flow focused suite: `3 files / 27 tests PASS`.
- `npm.cmd run content:validate`: PASS, 0 blocking issues.
- generated-content determinism: PASS, unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- all rules regressions: `48 files / 287 tests PASS`.
- full root CI: `115 files / 700 tests PASS`.
- lineage `git diff --check`: PASS.
- runtime implementation files changed by FM02 lineage: `0`.

## Coverage reproduction

R28 regenerated fresh coverage after saving the committed A artifact for comparison. The reviewer artifact is structurally identical to the committed A material artifact after removing only `generatedAt`.

- archives `39`; cards `71`; abilities `130`;
- `newRuntimeSemanticRouted=12`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=87`;
- `dualRuntime=0`;
- `notClassifiable=28`;
- `taxonomyWarnings=104`;
- source fingerprint `3e8cc78e550b61c3924f91fcfeb1b6c304c586beed9e07ee18f60403d94eb315`;
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards 70 / characters 14 / blocking issues 0.

Reviewer regeneration leaves only local `generatedAt` drift in the coverage artifact; it is not part of this reviewer commit.

## Acceptance boundary

`MIGRATION_ACCEPTED` applies only to the exact 12 identities above under the accepted FB2-09 contract. It does not accept broad Movement, generic Target Selection, arrow/forced/third-party movement, movement costs, variable destinations, movement conditions/modifiers, taxonomy/KPI changes, or any other F1 migration.
