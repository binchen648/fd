# P3-A FM09 current-main acceptance synchronization

Role: Codex A accounting  
Status: `SYNCHRONIZED`  
Classification: owner-complete corrected shared authoring migration

## Exact evidence

- Exact Base: `07db64fe50f0ab305dc526e07801bf7bcf9ce0b2`
- Accepted Candidate: `be1a64091c00a41a2d8dd4185753146c889299ef`
- Independent Reviewer report: `d065c1b935fe47a9c81ec9dd9c0cb1599351c102`; verdict `MIGRATION_ACCEPTED`
- Candidate branch: `codex/s-p3-fm09-current-main-20261026`

The Candidate is frozen and is not modified by this A-sync. This synchronization records only the accepted corrected FM09 authoring/accounting boundary; it does not merge or retarget a PR.

## Corrected accepted set

The accepted shared source set is exactly:

`master.bazett.skill.s1`, `master.ciel.skill.s1a`, `master.fujino.skill.s1`, `master.shiki-ryougi.skill.s1`, `master.shiki-ryougi.skill.s1a`, `master.shiki-tohno.skill.s1`, and `master.shirou-emiya.skill.s2`.

The accepted frozen provisioning targets are exactly six: Bazett s2, Ciel s2, Fujino s3, Ryougi s2, Ryougi s3, and Tohno s2. The Shirou `card.derived.master.shirou-emiya.ganjiang-moye` target is separately accepted as a derived target and is excluded from the frozen 944 denominator. Caules s1, Nanaya s1, Zouken s2, Fujino s2, and Caules s3 are not included in shared FM09 credit.

## Loader and runtime boundary

The six rules-only archives are readable through the formal `authoringMasterFiles` path and remain available in `authoringArchives` for authoring/evidence inspection. `compileLoadedPlaytestPack` excludes `master_rule_definition_archive` entries from the playable roster and generated library. This A-sync therefore does not claim end-to-end playable runtime registration for FM09 rules-only archives; no runtime coverage, generated artifact, task-index, taxonomy, governance, or unrelated servant credit is added.

## Accounting ledger

- Before FM09 owner-complete A-sync: `143 / 944 FULL`; remaining `801`.
- Corrected FM09 owner-complete credit: `+6` (six frozen provisioning targets).
- Shirou derived target: `+0` frozen credit; tracked separately.
- After this A-sync: `149 / 944 FULL`; remaining `795`.

No Caules/Nanaya/Zouken/Fujino-later-target credit is added.

## Verification receipt

Verification evidence is inherited from the accepted Candidate/Reviewer receipt: corrected FM09 plus dependency focused `102/102 PASS`; full CI `123 files / 774 tests PASS`; typecheck PASS; content validation PASS with 0 blocking issues; generated determinism PASS; and `git diff --check` PASS.

Formal A-owned synchronization/accounting only. No PR merge, A-sync runtime modification, or further authoring is performed.
