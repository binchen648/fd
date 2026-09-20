# P3-A R81 Darius Migration Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted migration input

- Formal verdict: `MIGRATION_ACCEPTED`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/388#issuecomment-5747146073`
- Exact A dispatch Base: `35f88ed1f5dca86b9629a3addc09c749ba56b1c1`
- Accepted S Candidate: `776ee46f5612481176a853dba099b489328b3236`
- Superseded reviewed Candidate: `e6ac0c832914ba20911bbc2b461d5786a1577cb7` (`MIGRATION_NEEDS_REVISION`; must not be re-reviewed)
- PR: `#388`
- Frozen identity: `servant.darius.skill.sc-darius-1`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `776ee46f5612481176a853dba099b489328b3236`;
- PR #388 remains OPEN, non-draft, MERGEABLE / CLEAN with exact Base `35f88ed1f5dca86b9629a3addc09c749ba56b1c1` and exact Head `776ee46f5612481176a853dba099b489328b3236`;
- canonical fresh independent R evidence `5747146073` binds that exact Base/Candidate pair and returns `MIGRATION_ACCEPTED` with no remaining blocking finding;
- Base-to-Candidate contains exactly `data/authoring/servants/servant.darius.json`, `packages/rules/tests/darius-consumer-migration.test.ts`, and the S result report;
- the revision from old reviewed Candidate `e6ac0c832914ba20911bbc2b461d5786a1577cb7` to accepted Candidate `776ee46f5612481176a853dba099b489328b3236` changes only the Darius focused test, capturing `settle()` return and asserting the source remains open on the returned post-scoring processed state;
- independent branch-local frozen-roster accounting is exactly Base `136/944` to Candidate `137/944`, with exactly one frozen addition `servant.darius.skill.sc-darius-1`, zero removals, and zero duplicates;
- reviewer validation at the exact Candidate passed typecheck; Darius + FB2-38 focused 2 files / 17 tests; rules src/__tests__ + core + regression + focused 84 files / 511 tests; official CI 157 files / 1104 tests; content validation; generated-content determinism; exact Locked Reference verification; client production build; and `git diff --check`;
- Darius semantics remain the frozen action play envelope with `{ type: skill_zone_mana_at_least, value: 0 }`, residual `after_battle_ended`, `source_active` plus `{ type: player_flag_number_not_current_round, key: combatLossRound }`, `close_source_card`, `while_active / immediate / remain_active`, and automatic execution;
- no new runtime production source, second consumer identity, merge, or retarget is introduced by this migration;
- Candidate and locked Reference tracked worktrees were clean at the exact reviewed SHAs.

## Formal accounting after synchronization

Project formal migration accepted advances exactly one identity from **`140/944`** to **`141/944`**.

Project formal remaining becomes **`803`**.

No other identity is credited. PR #381 / Ibaraki remains an independent pending backlog item and receives no Darius credit. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED` absent new formal evidence.

PR #388 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Continue the frozen migration-credit-first pipeline from formal `141/944`: do not open FB2-39 or unrelated runtime work while migration-ready work exists. First mechanically check pending Candidate PR #381 / Ibaraki for fresh independent R evidence; if it still has none, dispatch a fresh independent read-only R for its exact Candidate before opening new zero-credit runtime work. After any accepted migration, synchronize A immediately and then continue to the next `S_READY_NOW`. Histogram-first, batch-first, large-group-first, and pre-runtime scheduling remain `SUPERSEDED`.
