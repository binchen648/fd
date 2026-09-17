# P3-A FM08 Recovery Migration Synchronization

Date: 2026-09-17
Role: Codex A
Status: `MIGRATION_SYNC_CANDIDATE`

## Pins

- Recovery FB2-14 A synchronization base: `ff2742e51d46ee862071abffe4e23a61652dbdc1`
- Exact FM08 S recovery candidate: `81ccb7e7e5d0f2cf5ad7da1eda3279c20a604c1a`
- Accepted FB2-14 recovery runtime: `0831d9fea7c0ffedde634333f27564ea3c1dc65a`
- Fresh R39 runtime acceptance report: `45e1cc6ff25fe6da838b8d7fca382d0504275aa7`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference provenance: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Accepted overlap before this gate: `101/944`

## Lineage and scope

A independently confirms that exact S candidate `81ccb7e` is a direct child of the fresh FB2-14 recovery A synchronization `ff2742e`.

The S diff contains exactly:

- eight new full-roster master authoring archives;
- one focused FM08 authoring/runtime-contract regression;
- one S recovery migration report.

There are no removals and no production runtime source changes under `packages/rules/src`.

The old #343-#345 migration/acceptance chain is not used as provenance for this synchronization.

## Exact frozen set

A independently reconciles the exact ten selected identities against frozen F1 and locked Reference:

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

For all ten, A verifies:

- the frozen F1 row exists, is block-free, and uses Reference handler `core.game-start-rule-flags`;
- owner/card identity is exact;
- frozen printed-text SHA-256 equals the authoring text;
- locked Reference legacy skill ID, passive type label, and normalized static values agree;
- locked Reference legacy `null` cost/basePower normalize to authoring `0/0` through the Reference import/adapter path;
- legacy requirement remains `null`;
- each selected target occurs exactly once in candidate authoring.

Leonardo s1a and Ophelia s1a remain absent from this batch.

## Material overlap accounting

Fresh A material scan reports:

- frozen denominator: `943 static + 1 dynamic = 944`;
- current authoring: `98 archives / 133 cards / 232 abilities`;
- frozen static identities actually present in canonical authoring: `111`;
- duplicate frozen IDs: `0`;
- unique dynamic identity: `master.tiamat.card.life-sea`;
- dynamic identity currently present in canonical authoring: `false`;
- candidate material overlap: `111/944`;
- remaining outside canonical authoring: `833/944`.

The denominator's single dynamic identity is not automatically added to the numerator. It remains absent and blocked, so the correct candidate material overlap is `111/944`, not `112/944`.

This is material state only. Strict accepted overlap remains `101/944` pending fresh independent migration review.

## Fresh A validation

- `npm.cmd run typecheck`: PASS.
- Focused FM08 + FB2-14: `2 files / 16 tests PASS`.
- Rules regression/core: `66 files / 396 tests PASS`.
- Standard full CI: `120 files / 738 tests PASS`.
- `npm.cmd run content:validate`: PASS, `7 masters / 7 servants / 20 events / 0 blocking issues`.
- Generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Fresh Phase 3 coverage: `98 archives / 133 cards / 232 abilities`; raw `22/3/127/0/80/124`.
- Compiled product remains `70 cards / 14 characters / 0 blocking issues`, definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`.
- Fresh automation audit: legacy resolve/execute/not-classifiable `127/3/80`, promotion findings `20`.
- `git diff --check`: PASS.
- Production runtime source diff: `0` files.

The ten newly visible FM08 abilities account for the expected `notClassifiable` increase from `70` to `80`. A does not alter coverage taxonomy or KPI logic to manufacture route credit.

## Next gate

P3-R40 recovery is READY on the exact A-synchronized lineage. The reviewer must independently judge the exact ten-member migration and may not fix S/A content.

Accepted overlap remains `101/944` until that fresh independent migration review returns `MIGRATION_ACCEPTED`. Only then may local recovery-line accepted overlap advance to `111/944`.

## Repository/governance boundary

At A synchronization time, `origin/main...81ccb7e` is `33` commits main-only and `217` commits recovery-line-only, with merge-base `fba31b5a725e6c0b8ba54793be8b6726bfc31040`.

Global integration therefore remains `BASELINE_REBASE_REQUIRED`. A local recovery-line migration verdict must not be described as current-main acceptance until an explicit integration/rebase/merge path is completed.

Fresh process-separated Codex review can establish local workflow separation, but it does not establish a distinct GitHub account or human reviewer identity. Missing GitHub review/status evidence remains a separate governance limitation.
