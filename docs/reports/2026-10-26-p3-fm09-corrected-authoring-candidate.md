# P3-FM09 corrected shared game-start provisioning candidate

Status: `MIGRATION_CANDIDATE` only; no credit, Reviewer acceptance, A-sync, or merge.

- Base: `07db64fe50f0ab305dc526e07801bf7bcf9ce0b2`
- Correction contract: `7f573c36505d680fb5a64f62aa17cc14e05ff5a1`
- Corrected source set: 7 IDs.
- Frozen target set: 6 IDs (944 denominator); derived Shirou target is separately verified and excluded from 944.

## Corrected source/target contract

`master.bazett.skill.s1 -> master.bazett.skill.s2`, `master.ciel.skill.s1a -> master.ciel.skill.s2`, `master.fujino.skill.s1 -> master.fujino.skill.s3`, `master.shiki-ryougi.skill.s1 -> master.shiki-ryougi.skill.s2`, `master.shiki-ryougi.skill.s1a -> master.shiki-ryougi.skill.s3`, `master.shiki-tohno.skill.s1 -> master.shiki-tohno.skill.s2`, and `master.shirou-emiya.skill.s2 -> card.derived.master.shirou-emiya.ganjiang-moye`.

Caules s1, Nanaya s1, and Zouken s2 are excluded because their F1 clauses are not shared game-start provisioning. Fujino s2 and Caules s3 are later/owner-specific targets and are not game-start provisions.

Every retained source has the full F1 development-image + legacy references and exact inventory locator (`masters[16].skills[0]`, `masters[24].skills[1]`, `masters[65].skills[0]`, `masters[64].skills[0/1]`, `masters[27].skills[0]`, `masters[2].skills[1]`). Target printed text/cardFace/reference metadata were restored from locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`; no placeholder static metadata remains.

All six frozen target `printedText` values preserve the locked F1 line breaks and punctuation exactly (including Bazett s2, Ciel s2, Fujino s3, both Ryougi targets, and Tohno s2); the derived Shirou text is also asserted exactly.

## Loader/wiring boundary

The six rules-only archives use the existing `authoringMasterFiles` manifest field. The content loader keeps these archives visible through `authoringArchives` for rules authoring while `compileLoadedPlaytestPack` excludes `master_rule_definition_archive` entries from the playable master roster/generated library, preserving the frozen 7-master/70-card generated artifact. This candidate does not claim end-to-end playable runtime registration for rules-only archives. No generated, coverage, task-index, governance, or unrelated servant files changed.

## Verification

- Corrected FM09 + FB2-15/16/23 + FM08/07/06/05 + FB2-14/13/12/11/02 focused combined: 15 files / 102 tests passed.
- Full CI: 123 files / 774 tests passed.
- `npm run typecheck`: passed.
- `npm run content:validate`: 7 masters, 7 servants, 20 events, 0 blocking issues.
- `npm run verify:generated-content`: passed with unchanged generated hashes.
- `git diff --check`: passed.
