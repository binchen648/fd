# P3-R FM09 corrected current-main authoring review

Verdict: `MIGRATION_ACCEPTED` for the corrected rules-only authoring and pack wiring scope.

- Exact Base: `07db64fe50f0ab305dc526e07801bf7bcf9ce0b2`
- Reviewed Candidate: `be1a64091c00a41a2d8dd4185753146c889299ef`
- Candidate branch: `codex/s-p3-fm09-current-main-20261026`
- Superseded Candidate: `e59d2d5ba1b67d9bd164afbbc113c29e6591e173` is not accepted by this review.

## Independent findings

The six rules-only master archives contain exactly seven shared `core.game-start-add-skill` sources: Bazett s1, Ciel s1a, Fujino s1, Ryougi s1 and s1a, Tohno s1, and Shirou s2. Each source uses the FB2-15 identity-free automatic `game_start` provisioning shape and points to one owned, outside-game master-skill definition. The target set is exactly six frozen F1 IDs plus the derived `card.derived.master.shirou-emiya.ganjiang-moye`; the derived definition is outside the frozen 944 denominator. Caules s1, Nanaya s1, Zouken s2, Fujino s2, and Caules s3 are absent from this shared provisioning migration.

I compared all seven source texts, source SHA-256 values, F1 development-image and legacy references, F1 clause locators, and locked Reference static metadata against commits `59f145434695d29bdd17e4cb3adc887e84182377` and `b2f9fa15fba07c63530bbf4612b03b8b704755f9`. All matched. All six frozen target printed texts, including original line breaks and punctuation, matched F1 exactly; their type, cost, and base power matched the locked Reference. The Shirou derived target has the accepted ID, owner, cost 1, power 5, Strength/Noble Phantasm attributes, and eight-mana requirement.

The six archives use the supported `authoringMasterFiles` manifest field. `loadPlaytestContentPack` exposes them in `authoringArchives`; the `master_rule_definition_archive` filter keeps them out of the playable master roster and compiled generated library. The resulting loader has seven playable masters, and generated-content verification remains deterministic. This verdict covers rules-only authoring and pack visibility; it does not assert end-to-end playable runtime registration for these archives.

The Base-to-Candidate diff is limited to six FM09 authoring archives, pack wiring, the content-loader rule-archive boundary, one focused test, and FM09 reports. It contains no generated-content, coverage, task-index, governance, unrelated servant, or rules-runtime change.

## Verification

- Independent F1/Reference comparison: 7/7 sources, 6/6 frozen targets, and one derived target checked; no source or frozen-target mismatch.
- FM09 focused test: 1 file / 3 tests passed.
- Full CI: 123 files / 774 tests passed.
- `npm run typecheck`: passed.
- `npm run content:validate`: seven masters, seven servants, 20 events, zero blocking issues.
- `npm run verify:generated-content`: passed with unchanged generated hashes.
- `git diff --check` against the exact Base: passed.

This reviewer report makes no A-sync, migration credit, merge, or retarget decision.
